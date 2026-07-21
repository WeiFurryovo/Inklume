import { handleCallback } from "../src/server/sveltia-cms-auth.js";

export const onRequestGet = ({ request, env }) => handleCallback(request, env);
