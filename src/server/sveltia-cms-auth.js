// Adapted from https://github.com/sveltia/sveltia-cms-auth (MIT).

const PROVIDER = "github";

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

const outputHTML = ({ targetOrigin, token, error, errorCode }) => {
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
    : { provider: PROVIDER, token };
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
    error: "OAuth app client ID or secret is not configured.",
    errorCode: "MISCONFIGURED_CLIENT",
  });

export const handleAuth = async (request, env) => {
  const { searchParams } = new URL(request.url);
  const { provider, site_id: domain } = Object.fromEntries(searchParams);
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
    scope: "repo,user",
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

  let response;

  try {
    response = await fetch(
      `https://${GITHUB_HOSTNAME}/login/oauth/access_token`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          client_id: GITHUB_CLIENT_ID,
          client_secret: GITHUB_CLIENT_SECRET,
        }),
      }
    );
  } catch {
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

  return outputHTML({ targetOrigin, token: result.access_token });
};
