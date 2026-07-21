import { handleAuth } from "../src/server/sveltia-cms-auth.js";

export const onRequestGet = ({ request, env }) => handleAuth(request, env);
