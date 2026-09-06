/**
 * Internal resolved configuration used throughout the codebase.
 *
 * Content settings live in src/data/settings; deployment and feature switches
 * live in astro-paper.config.ts. This module resolves both for site consumers.
 */
import userConfig from "@/astro-paper.config";
import type { ResolvedAstroPaperConfig } from "./types/config";
import { PUBLIC_GOOGLE_SITE_VERIFICATION } from "astro:env/client";
import { siteSettings, footerSettings } from "./settings";

const config: ResolvedAstroPaperConfig = {
  site: {
    ...userConfig.site,
    title: siteSettings.siteName,
    description: siteSettings.description,
    author: siteSettings.author,
    profile: siteSettings.profile,
    ogImage: siteSettings.ogImage,
    lang: userConfig.site.lang ?? "en",
    timezone: siteSettings.timezone,
    dir: userConfig.site.dir ?? "ltr",
    googleVerification:
      userConfig.site.googleVerification || PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
  posts: {
    perPage: userConfig.posts?.perPage ?? 4,
    perIndex: userConfig.posts?.perIndex ?? 4,
    scheduledPostMargin:
      userConfig.posts?.scheduledPostMargin ?? 15 * 60 * 1000,
  },
  features: {
    lightAndDarkMode: userConfig.features?.lightAndDarkMode ?? true,
    dynamicOgImage: userConfig.features?.dynamicOgImage ?? true,
    showArchives: userConfig.features?.showArchives ?? true,
    showBackButton: userConfig.features?.showBackButton ?? true,
    editPost: userConfig.features?.editPost ?? { enabled: false },
    search: userConfig.features?.search ?? "pagefind",
    gallery: userConfig.features?.gallery ?? { enabled: false },
  },
  socials: footerSettings.socials,
  shareLinks: userConfig.shareLinks ?? [],
};

export default config;
