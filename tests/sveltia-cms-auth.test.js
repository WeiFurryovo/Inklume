import assert from "node:assert/strict";
import test from "node:test";

import { handleAuth, handleCallback } from "../src/server/sveltia-cms-auth.js";

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
