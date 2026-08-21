/**
 * Resolve either a CMS-managed remote asset URL or a path under Astro's base.
 * Only HTTP(S) URLs bypass the local asset path handling.
 *
 * @param {string} path
 * @param {string} baseUrl
 * @returns {string}
 */
export function resolveAssetPath(path, baseUrl) {
  try {
    const url = new URL(path);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return path;
    }
  } catch {
    // Root-relative and filename-only values are local assets.
  }

  const base = baseUrl.replace(/\/+$/, "");
  const baseRoot = base === "" ? "/" : `${base}/`;
  const normalizedPath = path.replace(/^\/+/, "");

  if (!normalizedPath) {
    return base === "" ? "/" : base;
  }
  return baseRoot + normalizedPath;
}
