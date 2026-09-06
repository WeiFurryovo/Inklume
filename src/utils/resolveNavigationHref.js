import { resolveAssetPath } from "./resolveAssetPath.js";

/**
 * @param {string} path
 * @param {(pathname: string) => string} localizePath
 * @param {string} baseUrl
 */
export function resolveNavigationHref(path, localizePath, baseUrl) {
  if (/^https?:\/\//i.test(path)) {
    return { href: path, external: true };
  }

  if (path.startsWith("/")) {
    return { href: resolveAssetPath(path, baseUrl), external: false };
  }

  // Locale helpers normalize page slashes, so only pass them the pathname.
  const url = new URL(path, "https://navigation.invalid/");
  let pathname = localizePath(url.pathname.slice(1));
  if (/\/[^/]+\.[^/]+$/.test(url.pathname)) {
    pathname = pathname.replace(/\/+$/, "");
  }

  return { href: pathname + url.search + url.hash, external: false };
}
