import { defineAstroPaperConfig } from "./src/types/config";

export default defineAstroPaperConfig({
  site: {
    // Replace this with the Workers or custom-domain URL before deployment.
    url: "https://inklume.example.com/",
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
    perPage: 4,
    perIndex: 4,
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
    { name: "whatsapp", url: "https://wa.me/?text=" },
    { name: "facebook", url: "https://www.facebook.com/sharer.php?u=" },
    { name: "x", url: "https://x.com/intent/post?url=" },
    { name: "telegram", url: "https://t.me/share/url?url=" },
    { name: "pinterest", url: "https://pinterest.com/pin/create/button/?url=" },
    { name: "mail", url: "mailto:?subject=See%20this%20post&body=" },
  ],
});
