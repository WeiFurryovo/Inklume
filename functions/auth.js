import {
  handleAuth,
  handlePreflight,
  handleRefresh,
} from "../src/server/sveltia-cms-auth.js";

export const onRequestGet = ({ request, env }) => handleAuth(request, env);

// Sveltia CMS refreshes expired GitHub App user access tokens via POST /auth.
export const onRequestPost = ({ request, env }) => handleRefresh(request, env);

export const onRequestOptions = ({ request, env }) =>
  handlePreflight(request, env);
