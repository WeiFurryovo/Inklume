import type { Config } from "astro-pure/types";

/**
 * Pure's integration configuration. Inklume keeps its own bilingual routing
 * and content schema, so navigation and locale-aware UI are implemented in
 * local components instead of Pure's single-language template components.
 */
const pureConfig: Config = {
  title: "Inklume",
  author: "WeiFurryovo",
  description:
    "Inklume 是一个记录技术、创作与生活的中英双语博客。A bilingual journal of technology, creativity, and life.",
  favicon: "/favicon.svg",
  socialCard: "/inklume-og.png",
  logo: {
    src: "/favicon.svg",
    alt: "Inklume",
  },
  locale: {
    lang: "zh-CN",
    attrs: "zh_CN",
    dateLocale: "zh-CN",
    dateOptions: {
      year: "numeric",
      month: "short",
      day: "numeric",
    },
  },
  titleDelimiter: "|",
  prerender: true,
  npmCDN: "https://cdn.jsdelivr.net/npm",
  head: [],
  customCss: [],
  header: {
    menu: [
      { title: "文章", link: "/posts" },
      { title: "归档", link: "/archives" },
      { title: "相册", link: "/gallery" },
      { title: "关于", link: "/about" },
    ],
  },
  footer: {
    year: `© ${new Date().getFullYear()} `,
    credits: true,
    links: [],
    social: [
      {
        icon: "github",
        label: "GitHub",
        href: "https://github.com/WeiFurryovo/Inklume",
      },
      { icon: "rss", label: "RSS", href: "/rss.xml" },
    ],
  },
  content: {
    externalLinks: {
      content: " ↗",
      properties: { "aria-label": "External link" },
    },
    blogPageSize: 4,
    share: ["weibo", "x"],
    imageCaption: false,
  },
  integ: {
    links: {
      logbook: [],
      applyTip: [],
      cacheAvatar: false,
    },
    // Inklume builds Pagefind explicitly after Astro so the existing
    // bilingual search routes and output contract remain unchanged.
    pagefind: false,
    quote: {
      server: "https://dummyjson.com/quotes/random",
      target: "(data) => data.quote || ''",
    },
    typography: {
      class: "prose text-base",
      blockquoteStyle: "italic",
      inlineCodeBlockStyle: "modern",
    },
    // PhotoSwipe already provides a shared gallery/article viewer.
    mediumZoom: {
      enable: false,
      selector: ".app-prose img",
      options: {},
    },
    waline: {
      enable: false,
      showMeta: false,
      additionalConfigs: {},
    },
  },
};

export default pureConfig;
