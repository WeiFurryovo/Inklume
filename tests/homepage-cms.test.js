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
  assert.deepEqual(en.footer, zh.footer, "footer settings must be shared");
});
