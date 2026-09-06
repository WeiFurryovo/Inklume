import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { parseFrontmatter } from "@astrojs/markdown-remark";
import {
  assetUrlSchema,
  siteSettingsSchema,
  footerSettingsSchema,
  navigationSettingsSchema,
  navigationUrlSchema,
} from "../src/settings.schema.js";

const readProjectFile = relativePath =>
  readFile(new URL(`../${relativePath}`, import.meta.url), "utf8");

const readSettings = async name =>
  JSON.parse(await readProjectFile(`src/data/settings/${name}.json`));

test("site settings have one shared source across homepage locales", async () => {
  const [site, footer, navigation] = await Promise.all([
    readSettings("site"),
    readSettings("footer"),
    readSettings("navigation"),
  ]);
  assert.deepEqual(siteSettingsSchema.parse(site), site);
  assert.deepEqual(footerSettingsSchema.parse(footer), {
    filings: [],
    socials: [],
    ...footer,
  });
  assert.deepEqual(navigationSettingsSchema.parse(navigation), navigation);
  assert.deepEqual(Object.keys(navigation), [
    "posts",
    "gallery",
    "archives",
    "tags",
    "categories",
    "about",
  ]);

  for (const locale of ["zh", "en"]) {
    const content = await readProjectFile(
      `src/content/home/${locale}/home.yml`
    );
    const home = parseFrontmatter(`---\n${content}\n---`).frontmatter;
    for (const key of ["identity", "navigation", "footer"]) {
      assert.equal(
        key in home,
        false,
        `${locale} homepage must not duplicate ${key}`
      );
    }
    assert.ok(home.profile.avatar);
    assert.ok(home.introduction.about);
  }
});

test("clearing optional footer lists in the CMS resolves to empty arrays", () => {
  const empty = { copyrightName: "Example", filings: [], socials: [] };
  assert.deepEqual(
    footerSettingsSchema.parse({ copyrightName: "Example" }),
    empty
  );
  assert.deepEqual(footerSettingsSchema.parse(empty), empty);
  const filings = [{ label: "A retained filing" }];
  assert.deepEqual(
    footerSettingsSchema.parse({ copyrightName: "Example", filings }),
    { ...empty, filings }
  );
  const socials = [{ name: "github", url: "https://github.com/example" }];
  assert.deepEqual(
    footerSettingsSchema.parse({ copyrightName: "Example", socials }),
    { ...empty, socials }
  );
});

test("global components consume shared settings instead of homepage translations", async () => {
  const sources = await Promise.all(
    [
      "src/layouts/Layout.astro",
      "src/components/Header.astro",
      "src/components/Footer.astro",
      "src/components/HomePage.astro",
      "src/config.ts",
      "src/pure.config.ts",
    ].map(readProjectFile)
  );
  for (const source of sources) {
    assert.doesNotMatch(source, /home\.(?:identity|navigation|footer)/);
    assert.match(source, /Settings/);
  }
  const [layout, header, footer, homepage, config, pureConfig] = sources;
  assert.match(layout, /siteSettings\.browserTitle/);
  assert.match(header, /navigationSettings\.categories/);
  assert.match(footer, /footerSettings\.filings/);
  assert.match(homepage, /navigationHref\(navigationSettings\.posts\)/);
  for (const field of [
    "description",
    "author",
    "profile",
    "ogImage",
    "timezone",
  ]) {
    assert.match(config, new RegExp(`${field}: siteSettings\\.${field}`));
  }
  assert.match(config, /title: siteSettings\.siteName/);
  assert.match(config, /socials: footerSettings\.socials/);
  assert.match(pureConfig, /title: siteSettings\.siteName/);
});

test("settings schemas retain valid remote and local URLs and reject unsafe input", async () => {
  for (const url of [
    "https://example.com/image.png?q=a%2Fb#preview",
    "http://localhost:8788/image.png",
    "/uploads/image%20name.png",
    "favicon.svg",
    "uploads/og.png",
  ]) {
    assert.equal(assetUrlSchema.parse(url), url);
  }
  for (const url of [
    "posts",
    "/about#site-stack",
    "search?q=Astro",
    "https://example.com/docs?q=1#section",
  ]) {
    assert.equal(navigationUrlSchema.parse(url), url);
  }
  for (const url of [
    "",
    "javascript:alert(1)",
    "data:image/svg+xml,test",
    "//example.com/file",
    "/\\example.com/file",
    "../private.png",
    "/uploads/%2e%2e/private.png",
    "/%2fexample.com/file",
    "/bad%encoding.png",
    "https://example.com\\@evil.example/image.png",
  ]) {
    assert.equal(assetUrlSchema.safeParse(url).success, false, url);
    assert.equal(navigationUrlSchema.safeParse(url).success, false, url);
  }
  const site = await readSettings("site");
  assert.equal(
    siteSettingsSchema.safeParse({ ...site, timezone: "Invalid/Zone" }).success,
    false
  );
  assert.equal(
    siteSettingsSchema.safeParse({ ...site, profile: "javascript:alert(1)" })
      .success,
    false
  );
  assert.equal(
    siteSettingsSchema.safeParse({ ...site, extra: true }).success,
    false
  );
  assert.equal(
    siteSettingsSchema.safeParse({ ...site, ogImage: "/uploads/og.png" })
      .success,
    true
  );

  const footer = await readSettings("footer");
  for (const url of [
    "https://github.com/example",
    "mailto:me@example.com",
    "/rss.xml",
  ]) {
    assert.equal(
      footerSettingsSchema.safeParse({
        ...footer,
        socials: [{ name: "email", url }],
      }).success,
      true
    );
  }
  assert.equal(
    footerSettingsSchema.safeParse({
      ...footer,
      socials: [{ name: "unsupported", url: "https://example.com" }],
    }).success,
    false
  );
  assert.equal(
    footerSettingsSchema.safeParse({
      ...footer,
      filings: [{ label: "No link" }],
    }).success,
    true
  );
  const navigation = await readSettings("navigation");
  assert.equal(
    navigationSettingsSchema.safeParse({ ...navigation, categories: undefined })
      .success,
    false
  );
  assert.equal(
    navigationSettingsSchema.safeParse({
      ...navigation,
      tags: { label: { zh: "标签" }, href: "tags" },
    }).success,
    false
  );
});
