// Adapted from https://github.com/sveltia/sveltia-cms-auth (MIT), synced with
// upstream commit 5822c9f (GitHub App token refresh and scope validation).
// Inklume additionally binds the target origin to the CSRF cookie and fails
// closed when ALLOWED_DOMAINS is not configured.

const PROVIDER = "github";

/**
 * OAuth scopes only apply to an OAuth app. A GitHub App ignores `scope`; its
 * access is limited to the permissions and repositories it is installed on.
 * The `workflow` scope is wider than the default, so it is only allowed when
 * GITHUB_ALLOW_WORKFLOW_SCOPE is "true".
 */
const GITHUB_SCOPES = {
  default: "repo,user",
  allowed: ["repo", "public_repo", "user", "read:user", "user:email"],
};

export const getScope = (requested, env = {}) => {
  const { default: fallback, allowed } = GITHUB_SCOPES;
  const allowWorkflow = env.GITHUB_ALLOW_WORKFLOW_SCOPE === "true";
  let scopes = (requested ?? "").split(/[\s,]+/).filter(Boolean);

  if (!allowWorkflow && scopes.includes("workflow")) {
    // eslint-disable-next-line no-console
    console.warn(
      'Ignoring the "workflow" scope. With an OAuth app, set ' +
        'GITHUB_ALLOW_WORKFLOW_SCOPE to "true" to allow it. A GitHub App ' +
        "ignores scopes; grant the Workflows permission instead."
    );
    scopes = scopes.filter(scope => scope !== "workflow");
  }

  if (!scopes.length) {
    return fallback;
  }

  if (
    scopes.every(
      scope =>
        allowed.includes(scope) || (allowWorkflow && scope === "workflow")
    )
  ) {
    return scopes.join(",");
  }

  // eslint-disable-next-line no-console
  console.warn(
    `Ignoring the unsupported "${requested}" scope; requesting "${fallback}".`
  );

  return fallback;
};

const getAllowedOrigin = (domain, allowedDomains) => {
  const candidate = domain?.trim().toLowerCase().replace(/\.$/, "");

  if (!candidate || !allowedDomains || /[:/?#@]/.test(candidate)) {
    return undefined;
  }

  try {
    if (new URL(`https://${candidate}`).hostname !== candidate) {
      return undefined;
    }
  } catch {
    return undefined;
  }

  const allowed = allowedDomains.split(",").some(value => {
    const pattern = value.trim().toLowerCase().replace(/\.$/, "");

    if (pattern.startsWith("*.")) {
      const suffix = pattern.slice(1);
      return candidate.endsWith(suffix) && candidate !== suffix.slice(1);
    }

    return candidate === pattern;
  });

  return allowed ? `https://${candidate}` : undefined;
};

const responseHeaders = contentType => ({
  "Cache-Control": "no-store",
  "Content-Type": contentType,
  "Referrer-Policy": "no-referrer",
  "Set-Cookie":
    "csrf-token=deleted; HttpOnly; Max-Age=0; Path=/; SameSite=Lax; Secure",
  "X-Content-Type-Options": "nosniff",
});

const outputHTML = ({
  targetOrigin,
  token,
  refreshToken,
  error,
  errorCode,
}) => {
  if (!targetOrigin) {
    const message = errorCode
      ? `${errorCode}: ${error}`
      : error || "Authentication could not be completed.";

    return new Response(message, {
      status: 400,
      headers: responseHeaders("text/plain;charset=UTF-8"),
    });
  }

  const state = error ? "error" : "success";
  const content = error
    ? { provider: PROVIDER, error, errorCode }
    : { provider: PROVIDER, token, refreshToken };
  const authorizationMessage = JSON.stringify(
    `authorization:${PROVIDER}:${state}:${JSON.stringify(content)}`
  ).replaceAll("<", "\\u003c");

  return new Response(
    `
      <!doctype html><html><body><script>
        (() => {
          const targetOrigin = ${JSON.stringify(targetOrigin)};

          window.addEventListener('message', ({ data, origin, source }) => {
            if (
              data === 'authorizing:${PROVIDER}' &&
              origin === targetOrigin &&
              source === window.opener
            ) {
              window.opener?.postMessage(
                ${authorizationMessage},
                targetOrigin
              );
            }
          });
          window.opener?.postMessage('authorizing:${PROVIDER}', targetOrigin);
        })();
      </script></body></html>
    `,
    { headers: responseHeaders("text/html;charset=UTF-8") }
  );
};

const misconfiguredClient = targetOrigin =>
  outputHTML({
    targetOrigin,
    error: "GitHub App or OAuth app client ID or secret is not configured.",
    errorCode: "MISCONFIGURED_CLIENT",
  });

const requestToken = async (params, env) => {
  const {
    GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET,
    GITHUB_HOSTNAME = "github.com",
  } = env;

  try {
    return await fetch(`https://${GITHUB_HOSTNAME}/login/oauth/access_token`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...params,
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
      }),
    });
  } catch {
    return undefined;
  }
};

export const handleAuth = async (request, env) => {
  const { searchParams } = new URL(request.url);
  const {
    provider,
    site_id: domain,
    scope: requestedScope,
  } = Object.fromEntries(searchParams);
  const {
    ALLOWED_DOMAINS,
    GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET,
    GITHUB_HOSTNAME = "github.com",
  } = env;

  if (!ALLOWED_DOMAINS) {
    return outputHTML({
      error: "Allowed OAuth domains are not configured.",
      errorCode: "MISCONFIGURED_DOMAINS",
    });
  }

  const targetOrigin = getAllowedOrigin(domain, ALLOWED_DOMAINS);

  if (!targetOrigin) {
    return outputHTML({
      error: "Your domain is not allowed to use the authenticator.",
      errorCode: "UNSUPPORTED_DOMAIN",
    });
  }

  if (provider !== PROVIDER) {
    return outputHTML({
      targetOrigin,
      error: "Your Git backend is not supported by the authenticator.",
      errorCode: "UNSUPPORTED_BACKEND",
    });
  }

  if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
    return misconfiguredClient(targetOrigin);
  }

  const csrfToken = globalThis.crypto.randomUUID().replaceAll("-", "");
  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    scope: getScope(requestedScope, env),
    state: csrfToken,
  });

  return new Response("", {
    status: 302,
    headers: {
      "Cache-Control": "no-store",
      Location: `https://${GITHUB_HOSTNAME}/login/oauth/authorize?${params.toString()}`,
      "Referrer-Policy": "no-referrer",
      "Set-Cookie":
        `csrf-token=${PROVIDER}_${csrfToken}_${encodeURIComponent(targetOrigin)}; ` +
        "HttpOnly; Path=/; Max-Age=600; SameSite=Lax; Secure",
      "X-Content-Type-Options": "nosniff",
    },
  });
};

export const handleCallback = async (request, env) => {
  const { headers } = request;
  const { searchParams } = new URL(request.url);
  const { code, state } = Object.fromEntries(searchParams);
  const [, provider, csrfToken, encodedTargetOrigin] =
    headers
      .get("Cookie")
      ?.match(/\bcsrf-token=([a-z-]+?)_([0-9a-f]{32})_([^;\s]+)/) ?? [];
  const { ALLOWED_DOMAINS, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } = env;

  if (!ALLOWED_DOMAINS) {
    return outputHTML({
      error: "Allowed OAuth domains are not configured.",
      errorCode: "MISCONFIGURED_DOMAINS",
    });
  }

  let targetOrigin;

  try {
    const decodedTargetOrigin = decodeURIComponent(encodedTargetOrigin);
    const origin = new URL(decodedTargetOrigin);

    if (
      origin.protocol === "https:" &&
      origin.origin === decodedTargetOrigin &&
      getAllowedOrigin(origin.hostname, ALLOWED_DOMAINS) === origin.origin
    ) {
      targetOrigin = origin.origin;
    }
  } catch {
    // The missing or invalid origin is reported as a domain error below.
  }

  if (!targetOrigin) {
    return outputHTML({
      error: "Your domain is not allowed to use the authenticator.",
      errorCode: "UNSUPPORTED_DOMAIN",
    });
  }

  if (provider !== PROVIDER) {
    return outputHTML({
      targetOrigin,
      error: "Your Git backend is not supported by the authenticator.",
      errorCode: "UNSUPPORTED_BACKEND",
    });
  }

  if (!code || !state) {
    return outputHTML({
      targetOrigin,
      error: "Failed to receive an authorization code. Please try again later.",
      errorCode: "AUTH_CODE_REQUEST_FAILED",
    });
  }

  if (!csrfToken || state !== csrfToken) {
    return outputHTML({
      targetOrigin,
      error: "Potential CSRF attack detected. Authentication flow aborted.",
      errorCode: "CSRF_DETECTED",
    });
  }

  if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
    return misconfiguredClient(targetOrigin);
  }

  const response = await requestToken({ code }, env);

  if (!response) {
    return outputHTML({
      targetOrigin,
      error: "Failed to request an access token. Please try again later.",
      errorCode: "TOKEN_REQUEST_FAILED",
    });
  }

  let result;

  try {
    result = await response.json();
  } catch {
    return outputHTML({
      targetOrigin,
      error: "Server responded with malformed data. Please try again later.",
      errorCode: "MALFORMED_RESPONSE",
    });
  }

  if (!result || typeof result !== "object") {
    return outputHTML({
      targetOrigin,
      error: "Server responded with malformed data. Please try again later.",
      errorCode: "MALFORMED_RESPONSE",
    });
  }

  if (!result.access_token) {
    return outputHTML({
      targetOrigin,
      error:
        result.error_description ||
        result.error ||
        "GitHub did not return an access token.",
      errorCode: "TOKEN_REQUEST_FAILED",
    });
  }

  return outputHTML({
    targetOrigin,
    token: result.access_token,
    refreshToken:
      typeof result.refresh_token === "string"
        ? result.refresh_token
        : undefined,
  });
};

/**
 * CORS headers for the token refresh endpoint. Sveltia CMS calls it with
 * `fetch` from the site, so the request origin must be an allowed HTTPS
 * origin. The Origin header can be forged outside a browser; this only stops
 * other sites from using the endpoint. The refresh token itself authorizes the
 * refresh, so it must be kept as secret as the access token.
 */
const getCorsHeaders = (request, env) => {
  const origin = request.headers.get("Origin");

  if (!origin || !env.ALLOWED_DOMAINS) {
    return undefined;
  }

  try {
    const url = new URL(origin);

    if (
      url.protocol !== "https:" ||
      url.origin !== origin ||
      getAllowedOrigin(url.hostname, env.ALLOWED_DOMAINS) !== origin
    ) {
      return undefined;
    }
  } catch {
    return undefined;
  }

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "POST",
    "Access-Control-Allow-Headers": "Accept, Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
};

const outputJSON = (body, { status = 200, headers = {} } = {}) =>
  Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...headers,
    },
  });

/**
 * Refresh an expired GitHub App user access token. Refreshing requires the
 * client secret, so Sveltia CMS posts the refresh token to `/auth`.
 */
export const handleRefresh = async (request, env) => {
  const corsHeaders = getCorsHeaders(request, env);

  if (!corsHeaders) {
    return outputJSON({ error: "unsupported_domain" }, { status: 403 });
  }

  let params;

  try {
    params = await request.json();
  } catch {
    // Reported as an invalid request below.
  }

  const refreshToken = params?.refresh_token;

  if (
    params?.grant_type !== "refresh_token" ||
    typeof refreshToken !== "string" ||
    !refreshToken
  ) {
    return outputJSON(
      { error: "invalid_request" },
      { status: 400, headers: corsHeaders }
    );
  }

  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
    return outputJSON(
      { error: "misconfigured_client" },
      { status: 500, headers: corsHeaders }
    );
  }

  // The client_id sent by the CMS is ignored in favour of the configured one.
  const response = await requestToken(
    { grant_type: "refresh_token", refresh_token: refreshToken },
    env
  );

  let result;

  try {
    result = await response?.json();
  } catch {
    // Reported as a failed token request below.
  }

  if (!response || !result || typeof result !== "object") {
    return outputJSON(
      { error: "token_request_failed" },
      { status: 502, headers: corsHeaders }
    );
  }

  // GitHub reports an invalid or expired refresh token with 200 OK and an
  // `error` property, which the CMS handles, so pass the result through.
  return outputJSON(result, { status: response.status, headers: corsHeaders });
};

export const handlePreflight = (request, env) => {
  const corsHeaders = getCorsHeaders(request, env);

  return new Response(null, {
    status: corsHeaders ? 204 : 403,
    headers: corsHeaders ?? {},
  });
};
