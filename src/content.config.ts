import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";
import config from "@/config";

export const BLOG_PATH = "src/content/posts";

const posts = defineCollection({
  loader: glob({ pattern: "**/[^_]*.{md,mdx}", base: `./${BLOG_PATH}` }),
  schema: ({ image }) =>
    z.object({
      author: z.string().default(config.site.author),
      pubDatetime: z.date(),
      modDatetime: z.date().optional().nullable(),
      title: z.string(),
      featured: z.boolean().optional(),
      draft: z.boolean().optional(),
      gallery: z.boolean().optional(),
      tags: z.array(z.string()).default(["others"]),
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
    }),
});

const pages = defineCollection({
  loader: glob({ pattern: "**/[^_]*.{md,mdx}", base: "./src/content/pages" }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    ogImage: z.string().optional(),
    canonicalURL: z.string().optional(),
  }),
});

const homepage = defineCollection({
  loader: glob({ pattern: "**/[^_]*.{yml,yaml}", base: "./src/content/home" }),
  schema: z.object({
    displayName: z.string(),
    avatar: z.string(),
    location: z.string(),
    role: z.string(),
    about: z.string(),
    publishingHeading: z.string(),
    publishingDescription: z.string(),
    links: z.object({
      source: z.string(),
      readPosts: z.string(),
      moreAbout: z.string(),
      morePosts: z.string(),
      gallery: z.string(),
    }),
    navigation: z.object({
      posts: z.string(),
      gallery: z.string(),
      archives: z.string(),
      tags: z.string(),
      about: z.string(),
    }),
  }),
});

export const collections = { posts, pages, homepage };
