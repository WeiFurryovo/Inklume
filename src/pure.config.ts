import type { Config } from "astro-pure/types";
import { siteSettings, footerSettings, navigationSettings } from "./settings";
import { resolveAssetPath } from "./utils/resolveAssetPath.js";
import { resolveNavigationHref } from "./utils/resolveNavigationHref.js";

/**
 * Pure's integration configuration. Inklume keeps its own bilingual routing
 * and content schema, so navigation and locale-aware UI are implemented in
 * local components instead of Pure's single-language template components.
 */
const pureConfig: Config = {
  title: siteSettings.siteName,
  author: siteSettings.author,
  description: siteSettings.description,
  favicon: resolveAssetPath(siteSettings.favicon, "/"),
  socialCard: resolveAssetPath(siteSettings.ogImage, "/"),
  logo: {
    src: resolveAssetPath(siteSettings.favicon, "/"),
    alt: siteSettings.siteName,
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
    menu: Object.values(navigationSettings).map(item => ({
      title: item.label.zh,
      link: resolveNavigationHref(item.href, pathname => `/${pathname}`, "/")
        .href,
    })),
  },
  footer: {
    year: `© ${new Date().getFullYear()} ${footerSettings.copyrightName}`,
    credits: true,
    links: [],
    social: [
      ...footerSettings.socials.map(social => ({
        icon: social.name,
        label: social.linkTitle ?? social.name,
        href: social.url,
      })),
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
