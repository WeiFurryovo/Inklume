import {
  defineConfig,
  envField,
  fontProviders,
  svgoOptimizer,
} from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import AstroPureIntegration from "astro-pure";
import { rehypeHeadingIds, unified } from "@astrojs/markdown-remark";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import {
  transformerNotationDiff,
  transformerNotationHighlight,
  transformerRemoveNotationEscape,
} from "@shikijs/transformers";
import {
  addCollapse,
  addCopyButton,
  addLanguage,
  addTitle,
  updateStyle,
} from "./src/utils/transformers/pureCodeBlocks";
import rehypeAutolinkHeadings from "./src/plugins/rehype-auto-link-headings";
import config from "./astro-paper.config";
import pureConfig from "./src/pure.config";

// Inklume is intentionally pure-static. The generated dist/ directory is
// uploaded to Cloudflare Pages; no runtime adapter is needed for the blog.
export default defineConfig({
  site: config.site.url,

  // Bilingual: Chinese is the default locale served at root (`/`),
  // English is served under the `/en/` prefix.
  i18n: {
    defaultLocale: "zh",
    locales: ["zh", "en"],
    routing: {
      prefixDefaultLocale: false,
      redirectToDefaultLocale: false,
    },
  },

  integrations: [
    mdx({ optimize: true }),
    sitemap({
      filter: page => {
        // Exclude the legacy /zh/* paths from the sitemap.
        if (page.includes("/zh/")) return false;
        // Exclude archives when the feature is disabled.
        if (
          config.features?.showArchives === false &&
          page.endsWith("/archives/")
        ) {
          return false;
        }
        // Exclude gallery when the feature is disabled.
        if (
          config.features?.gallery?.enabled !== true &&
          page.endsWith("/gallery/")
        ) {
          return false;
        }
        return true;
      },
    }),
    // Pure provides the visual system and reusable components. Inklume keeps
    // its own locale-aware routes, content collections and Pagefind command.
    AstroPureIntegration(pureConfig),
  ],

  markdown: {
    processor: unified({
      remarkPlugins: [remarkMath],
      rehypePlugins: [
        rehypeKatex,
        rehypeHeadingIds,
        [
          rehypeAutolinkHeadings,
          {
            behavior: "append",
            properties: { className: ["anchor"] },
            content: { type: "text", value: "#" },
          },
        ],
      ],
    }),
    shikiConfig: {
      // For more themes, visit https://shiki.style/themes
      themes: { light: "github-light", dark: "github-dark" },
      wrap: false,
      transformers: [
        transformerNotationDiff({ matchAlgorithm: "v3" }),
        transformerNotationHighlight(),
        transformerRemoveNotationEscape(),
        updateStyle(),
        addTitle(),
        addLanguage(),
        addCopyButton(2000),
        addCollapse(15),
      ],
    },
  },

  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      exclude: ["astro-pure"],
    },
  },

  fonts: [
    {
      name: "Satoshi",
      cssVariable: "--font-satoshi",
      provider: fontProviders.fontshare(),
      fallbacks: ["system-ui", "sans-serif"],
      weights: [400, 500],
      styles: ["normal", "italic"],
      subsets: ["latin"],
      formats: ["woff2"],
    },
    {
      name: "Google Sans Code",
      cssVariable: "--font-google-sans-code",
      provider: fontProviders.google(),
      fallbacks: ["monospace"],
      weights: [300, 400, 500, 600, 700],
      styles: ["normal", "italic"],
      formats: ["woff", "ttf"],
    },
  ],

  env: {
    schema: {
      PUBLIC_GOOGLE_SITE_VERIFICATION: envField.string({
        access: "public",
        context: "client",
        optional: true,
      }),
    },
  },

  experimental: {
    svgOptimizer: svgoOptimizer(),
  },
});
