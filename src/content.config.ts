import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";
import config from "@/config";
import { mergeAdvancedFields } from "@/utils/mergeAdvancedFields.js";
import { termSchema } from "@/taxonomy.schema.js";

export const BLOG_PATH = "src/content/posts";

const posts = defineCollection({
  loader: glob({ pattern: "**/[^_]*.{md,mdx}", base: `./${BLOG_PATH}` }),
  schema: ({ image }) =>
    z
      .object({
        author: z.string().default(config.site.author),
        pubDatetime: z.date(),
        modDatetime: z.date().optional().nullable(),
        title: z.string(),
        featured: z.boolean().optional(),
        draft: z.boolean().optional(),
        gallery: z.boolean().optional(),
        tags: z.array(z.string()).default([]),
        category: z.string().default("unclassified"),
        heroImage: z
          .object({
            src: z.string(),
            alt: z.string().optional(),
            color: z.string().optional(),
          })
          .optional(),
        ogImage: image().or(z.string()).optional(),
        description: z.string(),
        canonicalURL: z.string().optional(),
        hideEditPost: z.boolean().optional(),
        timezone: z.string().optional(),
        advanced: z
          .object({
            modDatetime: z.date().optional().nullable(),
            ogImage: image().or(z.string()).optional(),
            canonicalURL: z.string().optional(),
            hideEditPost: z.boolean().optional(),
            timezone: z.string().optional(),
          })
          .nullish(),
      })
      .transform(mergeAdvancedFields),
});

const httpUrl = z.url({ protocol: /^https?$/ });
const socialUrl = z
  .string()
  .regex(
    /^(?:https?:\/\/[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?(?::\d{1,5})?(?:[/?#][^\s\\]*)?|mailto:[^\s@\\]+@[^\s@\\]+(?:\?[^\s\\]*)?|\/(?:$|[^/\\\s][^\s\\]*))$/
  );
const aboutModules = z.object({
  motto: z.object({
    text: z.string(),
    spoiler: z.string(),
  }),
  cta: z.object({
    label: z.string(),
    href: httpUrl,
  }),
  siteStack: z.object({
    title: z.string(),
    description: z.string(),
    groupLabel: z.string(),
    items: z.array(
      z.object({
        name: z.string(),
        description: z.string(),
        icon: z.enum([
          "astro",
          "cloudflare",
          "github",
          "pagefind",
          "pure",
          "sveltia",
        ]),
        href: httpUrl,
      })
    ),
  }),
  social: z.object({
    title: z.string(),
    description: z.string(),
    items: z.array(
      z.object({
        platform: z.string(),
        icon: z.enum([
          "email",
          "github",
          "link",
          "rss",
          "steam",
          "telegram",
          "x",
        ]),
        color: z
          .string()
          .regex(/^#[0-9a-f]{6}$/i)
          .optional(),
        href: socialUrl,
        metric: z.string().optional(),
        api: z
          .string()
          .regex(/^[a-z0-9_-]+\/[a-z0-9_.:@-]+$/i)
          .optional(),
      })
    ),
  }),
  notes: z.object({
    title: z.string(),
    summary: z.string(),
    body: z.string(),
  }),
  timeline: z.object({
    title: z.string(),
    description: z.string(),
    items: z.array(
      z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        content: z.string(),
      })
    ),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: "**/[^_]*.{md,mdx}", base: "./src/content/pages" }),
  schema: z
    .object({
      title: z.string(),
      description: z.string().optional(),
      ogImage: z.string().optional(),
      canonicalURL: z.string().optional(),
      aboutModules: aboutModules.optional(),
      advanced: z
        .object({
          ogImage: z.string().optional(),
          canonicalURL: z.string().optional(),
        })
        .nullish(),
    })
    .transform(mergeAdvancedFields),
});

const homepage = defineCollection({
  loader: glob({ pattern: "**/[^_]*.{yml,yaml}", base: "./src/content/home" }),
  schema: z.object({
    profile: z.object({
      displayName: z.string(),
      avatar: z.string(),
      location: z.string(),
    }),
    introduction: z.object({
      role: z.string(),
      about: z.string(),
    }),
    publishing: z.object({
      heading: z.string(),
      description: z.string(),
    }),
    links: z.object({
      source: z.string(),
      readPosts: z.string(),
      moreAbout: z.string(),
      morePosts: z.string(),
      gallery: z.string(),
    }),
  }),
});

const tags = defineCollection({
  loader: glob({
    pattern: "*.{yml,yaml}",
    base: "./src/content/tags",
    generateId: ({ entry }) => entry.replace(/\.(?:yml|yaml)$/, ""),
  }),
  schema: termSchema,
});
const categories = defineCollection({
  loader: glob({
    pattern: "*.{yml,yaml}",
    base: "./src/content/categories",
    generateId: ({ entry }) => entry.replace(/\.(?:yml|yaml)$/, ""),
  }),
  schema: termSchema,
});

export const collections = { posts, pages, homepage, tags, categories };
