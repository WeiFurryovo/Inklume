import { z } from "astro/zod";

const text = z.string().trim().min(1);
const httpUrl = z
  .url({ protocol: /^https?$/ })
  .refine(value => /^https?:\/\//i.test(value) && !/[\s\\]/.test(value));

/** @param {string} value */
function isLocalPath(value) {
  if (!value || /[\s\\]/.test(value) || /^[a-z][a-z\d+.-]*:/i.test(value)) {
    return false;
  }
  try {
    const pathname = decodeURIComponent(value.split(/[?#]/, 1)[0]);
    return (
      pathname.length > 0 &&
      !pathname.startsWith("//") &&
      !pathname.includes("\\") &&
      !pathname.split("/").some(part => part === "." || part === "..")
    );
  } catch {
    return false;
  }
}

export const assetUrlSchema = z
  .string()
  .refine(
    value => httpUrl.safeParse(value).success || isLocalPath(value),
    "Use an HTTP(S) URL or a path inside public/"
  );

export const navigationUrlSchema = z
  .string()
  .refine(
    value => httpUrl.safeParse(value).success || isLocalPath(value),
    "Use an HTTP(S) URL or a local page path"
  );

const socialUrl = navigationUrlSchema.or(
  z.string().regex(/^mailto:[^\s@\\]+@[^\s@\\]+(?:\?[^\s\\]*)?$/)
);

const socialIcon = z.enum([
  "github",
  "gitlab",
  "discord",
  "youtube",
  "instagram",
  "x",
  "telegram",
  "rss",
  "email",
  "reddit",
  "bluesky",
  "tiktok",
  "weibo",
  "steam",
  "bilibili",
  "zhihu",
  "coolapk",
  "netease",
  "link",
]);
export const socialIconNames = socialIcon.options;

export const siteSettingsSchema = z.strictObject({
  siteName: text,
  browserTitle: text,
  description: text,
  author: text,
  profile: httpUrl,
  timezone: text.refine(value => {
    try {
      new Intl.DateTimeFormat("en", { timeZone: value });
      return true;
    } catch {
      return false;
    }
  }, "Use a valid IANA timezone"),
  ogImage: assetUrlSchema,
  favicon: assetUrlSchema,
});

export const footerSettingsSchema = z.strictObject({
  copyrightName: text,
  filings: z
    .array(z.strictObject({ label: text, url: httpUrl.optional() }))
    .default([]),
  socials: z
    .array(
      z.strictObject({
        name: socialIcon,
        url: socialUrl,
        linkTitle: text.optional(),
      })
    )
    .default([]),
});

const navigationItem = z.strictObject({
  label: z.strictObject({ zh: text, en: text }),
  href: navigationUrlSchema,
});

export const navigationSettingsSchema = z.strictObject({
  posts: navigationItem,
  gallery: navigationItem,
  archives: navigationItem,
  tags: navigationItem,
  categories: navigationItem,
  about: navigationItem,
});
