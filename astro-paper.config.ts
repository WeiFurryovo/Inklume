import { defineAstroPaperConfig } from "./src/types/config";

const DEFAULT_SITE_URL = "https://inklume.pages.dev/";
const configuredSiteUrl =
  process.env.SITE_URL?.trim() || DEFAULT_SITE_URL;
const siteUrl = (() => {
  try {
    const parsedSiteUrl = new URL(configuredSiteUrl);
    if (!/^https?:$/.test(parsedSiteUrl.protocol)) {
      throw new Error("only http(s) URLs are supported");
    }
    return parsedSiteUrl.href;
  } catch {
    throw new Error(
      `SITE_URL must be an absolute http(s) URL, received "${configuredSiteUrl}".`
    );
  }
})();

export default defineAstroPaperConfig({
  site: {
    // SITE_URL can override the stable Pages URL when a custom domain is added.
    url: siteUrl,
    title: "Inklume",
    description:
      "Inklume 是一个记录技术、创作与生活的中英双语博客。A bilingual journal of technology, creativity, and life.",
    author: "WeiFurryovo",
    profile: "https://github.com/WeiFurryovo",
    // Default social card; individual posts still receive generated OG images.
    ogImage: "inklume-og.png",
    // Default locale of the Inklume bilingual site (Chinese at root, English at /en/).
    // Used as the html lang fallback when Astro.currentLocale is undefined.
    lang: "zh",
    timezone: "Asia/Singapore",
    dir: "ltr",
  },
  posts: {
    perPage: 8,
    perIndex: 10,
    scheduledPostMargin: 15 * 60 * 1000,
  },
  features: {
    lightAndDarkMode: true,
    // Dynamic per-post OG images (satori + sharp) are generated for English
    // posts. Chinese posts use the static branded card until a
    // Satori-compatible CJK font is bundled.
    dynamicOgImage: true,
    showArchives: true,
    showBackButton: true,
    editPost: {
      enabled: true,
      url: "https://github.com/WeiFurryovo/Inklume/edit/main/",
    },
    search: "pagefind",
    gallery: {
      enabled: true,
      imageDomains: ["upload.wikimedia.org"],
    },
  },
  socials: [
    {
      name: "github",
      url: "https://github.com/WeiFurryovo/Inklume",
      linkTitle: "Inklume on GitHub",
    },
  ],
  shareLinks: [
    { name: "x", url: "https://x.com/intent/post?url=" },
    { name: "telegram", url: "https://t.me/share/url?url=" },
    { name: "email", url: "mailto:?subject=See%20this%20post&body=" },
  ],
});
