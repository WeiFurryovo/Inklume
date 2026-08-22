import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { parseFrontmatter } from "@astrojs/markdown-remark";

const readProjectFile = relativePath =>
  readFile(new URL(`../${relativePath}`, import.meta.url), "utf8");

test("Homepage CMS fields are organized into clear collapsible groups", async () => {
  const source = await readProjectFile("public/admin/config.yml");
  const config = parseFrontmatter(`---\n${source}\n---`).frontmatter;
  const homepage = config.collections.find(({ name }) => name === "homepage");
  const fields = homepage.files.find(({ name }) => name === "home").fields;
  const expectedGroups = [
    "identity",
    "profile",
    "introduction",
    "publishing",
    "links",
    "navigation",
    "footer",
  ];

  assert.deepEqual(
    fields.map(({ name }) => name),
    expectedGroups,
    "Homepage should expose only grouped top-level settings"
  );

  for (const group of fields) {
    assert.equal(
      group.widget,
      "object",
      `${group.name} must be an object group`
    );
    assert.equal(group.collapsed, true, `${group.name} must start collapsed`);
    assert.ok(group.hint, `${group.name} must explain where its values appear`);
  }

  assert.equal(
    fields.find(({ name }) => name === "identity").i18n,
    "duplicate",
    "site identity must stay shared across locales"
  );
  assert.equal(
    fields
      .find(({ name }) => name === "profile")
      .fields.find(({ name }) => name === "avatar").i18n,
    "duplicate",
    "the avatar must stay shared across locales"
  );

  const navigation = fields.find(({ name }) => name === "navigation");
  for (const itemName of ["posts", "gallery", "archives", "tags", "about"]) {
    const item = navigation.fields.find(({ name }) => name === itemName);
    assert.equal(item.widget, "object", `${itemName} must be an object`);
    assert.equal(item.i18n, "duplicate", `${itemName} must stay shared`);
    assert.equal(item.collapsed, true, `${itemName} must start collapsed`);

    const label = item.fields.find(({ name }) => name === "label");
    const href = item.fields.find(({ name }) => name === "href");
    assert.equal(label.i18n, true, `${itemName} text must be localizable`);
    assert.equal(href.i18n, "duplicate", `${itemName} URL must be shared`);
    assert.equal(href.widget, "string", `${itemName} URL must be editable`);
    assert.ok(href.pattern?.[0], `${itemName} URL must be validated`);
  }
});

test("shared Homepage settings stay identical across locales", async () => {
  const [zhSource, enSource] = await Promise.all([
    readProjectFile("src/content/home/zh/home.yml"),
    readProjectFile("src/content/home/en/home.yml"),
  ]);
  const zh = parseFrontmatter(`---\n${zhSource}\n---`).frontmatter;
  const en = parseFrontmatter(`---\n${enSource}\n---`).frontmatter;

  assert.deepEqual(en.identity, zh.identity, "site identity must be shared");
  assert.equal(en.profile.avatar, zh.profile.avatar, "avatar must be shared");
  assert.equal(
    en.footer.copyrightName,
    zh.footer.copyrightName,
    "footer copyright name must be shared"
  );
  assert.deepEqual(
    Object.fromEntries(
      Object.entries(en.navigation).map(([key, item]) => [key, item.href])
    ),
    Object.fromEntries(
      Object.entries(zh.navigation).map(([key, item]) => [key, item.href])
    ),
    "navigation destinations must be shared across locales"
  );
});

test("navigation URL validation accepts safe destinations only", async () => {
  const source = await readProjectFile("public/admin/config.yml");
  const config = parseFrontmatter(`---\n${source}\n---`).frontmatter;
  const homepage = config.collections.find(({ name }) => name === "homepage");
  const fields = homepage.files.find(({ name }) => name === "home").fields;
  const navigation = fields.find(({ name }) => name === "navigation");
  const href = navigation.fields
    .find(({ name }) => name === "posts")
    .fields.find(({ name }) => name === "href");
  const pattern = new RegExp(href.pattern[0]);

  for (const value of [
    "posts",
    "posts/archive",
    "/custom-page",
    "/",
    "https://example.com/docs",
  ]) {
    assert.match(value, pattern, `${value} should be accepted`);
  }

  for (const value of [
    "javascript:alert(1)",
    "data:text/html,hello",
    "mailto:user@example.com",
    "//evil.example",
    "../outside",
    "/\\evil.example",
    "posts with spaces",
  ]) {
    assert.doesNotMatch(value, pattern, `${value} should be rejected`);
  }
});
