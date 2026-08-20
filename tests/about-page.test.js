import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { parseFrontmatter } from "@astrojs/markdown-remark";

const readProjectFile = relativePath =>
  readFile(new URL(`../${relativePath}`, import.meta.url), "utf8");

function readFrontmatter(source, relativePath) {
  const parsed = parseFrontmatter(source);

  assert.ok(
    parsed.rawFrontmatter,
    `${relativePath} must have YAML frontmatter`
  );
  return parsed.frontmatter;
}

test("bilingual About modules keep shared structure in sync", async () => {
  const [zhSource, enSource] = await Promise.all([
    readProjectFile("src/content/pages/zh/about.md"),
    readProjectFile("src/content/pages/en/about.md"),
  ]);
  const zh = readFrontmatter(
    zhSource,
    "src/content/pages/zh/about.md"
  ).aboutModules;
  const en = readFrontmatter(
    enSource,
    "src/content/pages/en/about.md"
  ).aboutModules;

  assert.ok(zh, "Chinese About content must define aboutModules");
  assert.ok(en, "English About content must define aboutModules");
  assert.equal(en.cta.href, zh.cta.href, "CTA URLs must match");

  assert.equal(
    en.siteStack.items.length,
    zh.siteStack.items.length,
    "site stack item counts must match"
  );
  assert.deepEqual(
    en.siteStack.items.map(({ icon, href }) => ({ icon, href })),
    zh.siteStack.items.map(({ icon, href }) => ({ icon, href })),
    "site stack icons and URLs must match"
  );

  assert.equal(
    en.social.items.length,
    zh.social.items.length,
    "social item counts must match"
  );
  assert.deepEqual(
    en.social.items.map(({ icon, href, api }) => ({
      icon,
      href,
      api: api ?? null,
    })),
    zh.social.items.map(({ icon, href, api }) => ({
      icon,
      href,
      api: api ?? null,
    })),
    "social icons, URLs, and API paths must match"
  );

  assert.equal(
    en.timeline.items.length,
    zh.timeline.items.length,
    "timeline event counts must match"
  );
  assert.deepEqual(
    en.timeline.items.map(({ date }) => date),
    zh.timeline.items.map(({ date }) => date),
    "timeline dates must match"
  );
});

test("About timeline escapes CMS text before passing it to Pure Timeline", async () => {
  const source = await readProjectFile("src/components/AboutPage.astro");
  const replacements = [
    ['.replaceAll("&", "&amp;")', "ampersands"],
    ['.replaceAll("<", "&lt;")', "opening angle brackets"],
    ['.replaceAll(">", "&gt;")', "closing angle brackets"],
    [`.replaceAll('"', "&quot;")`, "double quotes"],
    [`.replaceAll("'", "&#039;")`, "single quotes"],
  ];
  const positions = replacements.map(([expression, label]) => {
    const position = source.indexOf(expression);
    assert.notEqual(position, -1, `escapeHtml must escape ${label}`);
    return position;
  });

  assert.deepEqual(
    positions,
    [...positions].sort((a, b) => a - b),
    "ampersands must be escaped before the replacement entities are added"
  );
  assert.match(
    source,
    /content:\s*escapeHtml\(item\.content\)/,
    "timeline CMS content must pass through escapeHtml"
  );
});

test("Substats resolves statistics at build time without client fetch code", async () => {
  const source = await readProjectFile("src/components/about/Substats.astro");
  const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);

  assert.ok(frontmatter, "Substats must have Astro server-side frontmatter");
  assert.match(
    frontmatter[1],
    /await\s+fetch\s*\(\s*`https:\/\/api\.swo\.moe\/stats\/\$\{/,
    "Substats must fetch its API in server-side frontmatter"
  );
  assert.match(
    frontmatter[1],
    /await\s+Promise\.all\s*\(/,
    "Substats must resolve configured statistics before rendering"
  );
  assert.match(
    frontmatter[1],
    /AbortSignal\.timeout\s*\(/,
    "Substats must time out instead of blocking a static build indefinitely"
  );

  const renderedTemplate = source.slice(frontmatter[0].length);
  assert.doesNotMatch(
    renderedTemplate,
    /<script(?:\s|>)/,
    "Substats must not ship a client script"
  );
  assert.doesNotMatch(
    renderedTemplate,
    /\bfetch\s*\(/,
    "Substats must not fetch from the browser"
  );
  assert.doesNotMatch(
    renderedTemplate,
    /data-substats-(?:api|value|ready)/,
    "Substats must not leave client-fetch hooks in its HTML"
  );
});

test("CMS social links accept supported URLs and reject ambiguous paths", async () => {
  const source = await readProjectFile("public/admin/config.yml");
  const config = parseFrontmatter(`---\n${source}\n---`).frontmatter;
  const pages = config.collections.find(({ name }) => name === "pages");
  const about = pages.fields.find(({ name }) => name === "aboutModules");
  const social = about.fields.find(({ name }) => name === "social");
  const items = social.fields.find(({ name }) => name === "items");
  const href = items.fields.find(({ name }) => name === "href");
  const pattern = new RegExp(href.pattern[0]);

  for (const value of [
    "https://github.com/WeiFurryovo",
    "http://localhost:4321/path?q=1",
    "mailto:user+tag@example.com?subject=Hello",
    "/rss.xml",
    "/",
  ]) {
    assert.match(value, pattern, `${value} should be accepted`);
  }

  for (const value of [
    "https://",
    "https://-bad.example",
    "//evil.example",
    "/\\evil.example",
    "https://example.com/\\evil",
    "mailto:missing-at",
    "javascript:alert(1)",
  ]) {
    assert.doesNotMatch(value, pattern, `${value} should be rejected`);
  }
});
