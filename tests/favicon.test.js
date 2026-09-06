import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { resolveAssetPath } from "../src/utils/resolveAssetPath.js";

const readProjectFile = relativePath =>
  readFile(new URL(`../${relativePath}`, import.meta.url), "utf8");

test("favicon asset paths preserve remote URLs and apply Astro base to local files", async () => {
  const [siteSource, layoutSource] = await Promise.all([
    readProjectFile("src/data/settings/site.json"),
    readProjectFile("src/layouts/Layout.astro"),
  ]);
  const site = JSON.parse(siteSource);

  assert.equal(resolveAssetPath(site.favicon, "/project/"), site.favicon);
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
    /<link rel="icon" href=\{getAssetPath\(siteSettings\.favicon\)\} \/>/,
    "the document favicon must use the shared asset resolver"
  );
});
