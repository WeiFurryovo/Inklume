import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { parseFrontmatter } from "@astrojs/markdown-remark";

import { resolveAssetPath } from "../src/utils/resolveAssetPath.js";

const readProjectFile = relativePath =>
  readFile(new URL(`../${relativePath}`, import.meta.url), "utf8");

test("favicon asset paths preserve remote URLs and apply Astro base to local files", async () => {
  const [zhSource, enSource, layoutSource] = await Promise.all([
    readProjectFile("src/content/home/zh/home.yml"),
    readProjectFile("src/content/home/en/home.yml"),
    readProjectFile("src/layouts/Layout.astro"),
  ]);
  const zh = parseFrontmatter(`---\n${zhSource}\n---`).frontmatter;
  const en = parseFrontmatter(`---\n${enSource}\n---`).frontmatter;

  assert.equal(resolveAssetPath(zh.favicon, "/project/"), zh.favicon);
  assert.equal(resolveAssetPath(en.favicon, "/project/"), en.favicon);
  assert.equal(
    resolveAssetPath("/uploads/favicon.png", "/project/"),
    "/project/uploads/favicon.png"
  );
  assert.equal(resolveAssetPath("favicon.svg", "/"), "/favicon.svg");
  assert.equal(
    resolveAssetPath("javascript:alert(1)", "/project/"),
    "/project/javascript:alert(1)",
    "non-HTTP protocols must not bypass local-path handling"
  );
  assert.match(
    layoutSource,
    /<link rel="icon" href=\{getAssetPath\(home\.favicon\)\} \/>/,
    "the document favicon must use the shared asset resolver"
  );
});
