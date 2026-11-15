import assert from "node:assert/strict";
import test from "node:test";

import {
  getScope,
  handleAuth,
  handleCallback,
  handlePreflight,
  handleRefresh,
} from "../src/server/sveltia-cms-auth.js";

const env = {
  ALLOWED_DOMAINS: "inklume.pages.dev",
  GITHUB_CLIENT_ID: "client-id",
  GITHUB_CLIENT_SECRET: "client-secret",
};
const targetOrigin = "https://inklume.pages.dev";
const csrfCookie = token =>
  `csrf-token=github_${token}_${encodeURIComponent(targetOrigin)}`;

test("auth rejects unsupported providers", async () => {
  const request = new Request(
    "https://inklume.pages.dev/auth?provider=gitlab&site_id=inklume.pages.dev"
  );
  const response = await handleAuth(request, env);

  assert.equal(response.status, 200);
  assert.match(await response.text(), /UNSUPPORTED_BACKEND/);
});

test("auth rejects unlisted domains", async () => {
  const request = new Request(
    "https://inklume.pages.dev/auth?provider=github&site_id=example.com"
  );
  const response = await handleAuth(request, env);

  assert.equal(response.status, 400);
  assert.match(await response.text(), /UNSUPPORTED_DOMAIN/);
});

test("auth fails closed without a domain allowlist", async () => {
  const request = new Request(
    "https://inklume.pages.dev/auth?provider=github&site_id=inklume.pages.dev"
  );
  const response = await handleAuth(request, {
    GITHUB_CLIENT_ID: "client-id",
    GITHUB_CLIENT_SECRET: "client-secret",
  });

  assert.equal(response.status, 400);
  assert.match(await response.text(), /MISCONFIGURED_DOMAINS/);
});

test("auth starts GitHub OAuth with an origin-bound CSRF cookie", async () => {
  const request = new Request(
    "https://inklume.pages.dev/auth?provider=github&site_id=inklume.pages.dev"
  );
  const response = await handleAuth(request, env);
  const location = new URL(response.headers.get("Location"));
  const state = location.searchParams.get("state");

  assert.equal(response.status, 302);
  assert.equal(location.origin, "https://github.com");
  assert.equal(location.pathname, "/login/oauth/authorize");
  assert.equal(location.searchParams.get("client_id"), "client-id");
  assert.match(
    response.headers.get("Set-Cookie"),
    new RegExp(`github_${state}_${encodeURIComponent(targetOrigin)}`)
  );
});

test("callback rejects a mismatched CSRF token", async () => {
  const request = new Request(
    "https://inklume.pages.dev/callback?code=code&state=bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    {
      headers: {
        Cookie: csrfCookie("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"),
      },
    }
  );
  const response = await handleCallback(request, env);

  assert.match(await response.text(), /CSRF_DETECTED/);
});

test("callback exchanges the code and returns the token to Sveltia", async t => {
  const originalFetch = globalThis.fetch;
  const csrfToken = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  globalThis.fetch = async (url, options) => {
    assert.equal(url, "https://github.com/login/oauth/access_token");
    assert.deepEqual(JSON.parse(options.body), {
      code: "oauth-code",
      client_id: "client-id",
      client_secret: "client-secret",
    });

    return Response.json({ access_token: "github-token" });
  };

  const request = new Request(
    `https://inklume.pages.dev/callback?code=oauth-code&state=${csrfToken}`,
    { headers: { Cookie: csrfCookie(csrfToken) } }
  );
  const response = await handleCallback(request, env);
  const body = await response.text();

  assert.match(body, /authorization:github:success/);
  assert.match(body, /github-token/);
  assert.match(body, /origin === targetOrigin/);
  assert.match(body, /source === window\.opener/);
  assert.match(body, /postMessage\('authorizing:github', targetOrigin\)/);
  assert.doesNotMatch(body, /postMessage\('authorizing:github', '\*'\)/);
  assert.match(response.headers.get("Set-Cookie"), /Max-Age=0/);
});

test("callback reports a failed GitHub token exchange", async t => {
  const originalFetch = globalThis.fetch;
  const csrfToken = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  globalThis.fetch = async () =>
    Response.json({
      error: "bad_verification_code",
      error_description: "The code has expired.",
    });

  const request = new Request(
    `https://inklume.pages.dev/callback?code=expired&state=${csrfToken}`,
    { headers: { Cookie: csrfCookie(csrfToken) } }
  );
  const response = await handleCallback(request, env);
  const body = await response.text();

  assert.match(body, /authorization:github:error/);
  assert.match(body, /TOKEN_REQUEST_FAILED/);
});

test("callback rejects an empty GitHub response", async t => {
  const originalFetch = globalThis.fetch;
  const csrfToken = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  globalThis.fetch = async () => Response.json(null);

  const request = new Request(
    `https://inklume.pages.dev/callback?code=oauth-code&state=${csrfToken}`,
    { headers: { Cookie: csrfCookie(csrfToken) } }
  );
  const response = await handleCallback(request, env);

  assert.match(await response.text(), /MALFORMED_RESPONSE/);
});

test("callback rejects an origin outside the allowlist", async () => {
  const csrfToken = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
  const encodedOrigin = encodeURIComponent("https://malicious.example");
  const request = new Request(
    `https://inklume.pages.dev/callback?code=oauth-code&state=${csrfToken}`,
    {
      headers: {
        Cookie: `csrf-token=github_${csrfToken}_${encodedOrigin}`,
      },
    }
  );
  const response = await handleCallback(request, env);

  assert.equal(response.status, 400);
  assert.match(await response.text(), /UNSUPPORTED_DOMAIN/);
});

test("auth requests the default scope and honours narrower scopes", () => {
  assert.equal(getScope(undefined), "repo,user");
  assert.equal(getScope("public_repo, read:user"), "public_repo,read:user");
  assert.equal(getScope("admin:org"), "repo,user");
});

test("auth only allows the workflow scope when explicitly enabled", t => {
  t.mock.method(console, "warn", () => {});

  assert.equal(getScope("repo,workflow"), "repo");
  assert.equal(
    getScope("repo,workflow", { GITHUB_ALLOW_WORKFLOW_SCOPE: "true" }),
    "repo,workflow"
  );
});

test("auth forwards a requested scope to GitHub", async () => {
  const request = new Request(
    "https://inklume.pages.dev/auth?provider=github&site_id=inklume.pages.dev&scope=public_repo"
  );
  const response = await handleAuth(request, env);
  const location = new URL(response.headers.get("Location"));

  assert.equal(location.searchParams.get("scope"), "public_repo");
});

test("callback passes a GitHub App refresh token to Sveltia", async t => {
  const originalFetch = globalThis.fetch;
  const csrfToken = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  globalThis.fetch = async () =>
    Response.json({
      access_token: "github-token",
      refresh_token: "github-refresh-token",
    });

  const request = new Request(
    `https://inklume.pages.dev/callback?code=oauth-code&state=${csrfToken}`,
    { headers: { Cookie: csrfCookie(csrfToken) } }
  );
  const body = await (await handleCallback(request, env)).text();

  assert.match(body, /github-refresh-token/);
  assert.match(body, /refreshToken/);
});

const refreshRequest = (body, origin = targetOrigin) =>
  new Request("https://inklume.pages.dev/auth", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(origin ? { Origin: origin } : {}),
    },
    body: JSON.stringify(body),
  });

test("refresh rejects origins outside the allowlist", async () => {
  for (const origin of [
    "https://malicious.example",
    "http://inklume.pages.dev",
    null,
  ]) {
    const response = await handleRefresh(
      refreshRequest(
        { grant_type: "refresh_token", refresh_token: "r" },
        origin
      ),
      env
    );

    assert.equal(response.status, 403);
    assert.equal(response.headers.get("Access-Control-Allow-Origin"), null);
  }
});

test("refresh rejects malformed grants", async () => {
  const response = await handleRefresh(
    refreshRequest({ grant_type: "authorization_code", code: "c" }),
    env
  );

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "invalid_request" });
  assert.equal(
    response.headers.get("Access-Control-Allow-Origin"),
    targetOrigin
  );
});

test("refresh adds the client secret and forwards to GitHub", async t => {
  const originalFetch = globalThis.fetch;

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  globalThis.fetch = async (url, options) => {
    assert.equal(url, "https://github.com/login/oauth/access_token");
    assert.deepEqual(JSON.parse(options.body), {
      grant_type: "refresh_token",
      refresh_token: "old-refresh-token",
      client_id: "client-id",
      client_secret: "client-secret",
    });

    return Response.json({
      access_token: "new-token",
      refresh_token: "new-refresh-token",
    });
  };

  const response = await handleRefresh(
    refreshRequest({
      grant_type: "refresh_token",
      client_id: "ignored",
      refresh_token: "old-refresh-token",
    }),
    env
  );

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.equal(
    response.headers.get("Access-Control-Allow-Origin"),
    targetOrigin
  );
  assert.deepEqual(await response.json(), {
    access_token: "new-token",
    refresh_token: "new-refresh-token",
  });
});

test("refresh preflight only allows listed origins", () => {
  const allowed = handlePreflight(
    new Request("https://inklume.pages.dev/auth", {
      method: "OPTIONS",
      headers: { Origin: targetOrigin },
    }),
    env
  );
  const denied = handlePreflight(
    new Request("https://inklume.pages.dev/auth", {
      method: "OPTIONS",
      headers: { Origin: "https://malicious.example" },
    }),
    env
  );

  assert.equal(allowed.status, 204);
  assert.equal(allowed.headers.get("Access-Control-Allow-Methods"), "POST");
  assert.equal(denied.status, 403);
  assert.equal(denied.headers.get("Access-Control-Allow-Origin"), null);
});
