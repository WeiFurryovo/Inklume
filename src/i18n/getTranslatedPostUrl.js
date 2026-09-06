/** @param {string} url */
function normalizePath(url) {
  return (
    new URL(url, "https://locale.invalid").pathname
      .replace(/%[\da-f]{2}/gi, value => value.toUpperCase())
      .replace(/\/+$/, "") || "/"
  );
}

/**
 * Match browser-encoded paths against the URLs of published translations.
 * All URLs must include the deployment base, if one is configured.
 *
 * @param {string} alternateUrl
 * @param {string[]} postUrls
 * @param {string} fallbackUrl
 * @returns {string}
 */
export function getTranslatedPostUrl(alternateUrl, postUrls, fallbackUrl) {
  const alternatePath = normalizePath(alternateUrl);
  return (
    postUrls.find(url => normalizePath(url) === alternatePath) ?? fallbackUrl
  );
}
