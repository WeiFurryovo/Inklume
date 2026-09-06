import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { parseFrontmatter } from "@astrojs/markdown-remark";

const readProjectFile = relativePath =>
  readFile(new URL(`../${relativePath}`, import.meta.url), "utf8");
const parseYaml = source => parseFrontmatter(`---\n${source}\n---`).frontmatter;
const readConfig = async () =>
  parseYaml(await readProjectFile("public/admin/config.yml"));

test("CMS collections group content, taxonomy, appearance, and site settings", async () => {
  const config = await readConfig();
  assert.deepEqual(
    config.collections.map(item => (item.divider ? "divider" : item.name)),
    [
      "posts",
      "pages",
      "homepage",
      "divider",
      "categories",
      "tags",
      "divider",
      "navigation",
      "footer",
      "divider",
      "site",
    ]
  );
  for (const name of ["posts", "pages"]) {
    const collection = config.collections.find(item => item.name === name);
    assert.deepEqual(
      collection.fields.slice(0, 3).map(item => item.name),
      ["title", "body", "description"]
    );
    const advanced = collection.fields.find(item => item.name === "advanced");
    assert.equal(advanced.widget, "object");
    assert.equal(advanced.collapsed, true);
    assert.equal(advanced.required, false);
    assert.ok(advanced.fields.some(item => item.name === "canonicalURL"));
  }
});

test("each settings file has one complete CMS editor and no locale copies", async () => {
  const config = await readConfig();
  const owners = new Set();
  for (const collection of config.collections) {
    for (const file of collection.files ?? []) {
      assert.equal(
        owners.has(file.file),
        false,
        `duplicate editor: ${file.file}`
      );
      owners.add(file.file);
      if (!file.file.startsWith("src/data/settings/")) continue;
      assert.notEqual(collection.i18n, true);
      assert.notEqual(file.i18n, true);
      const data = JSON.parse(await readProjectFile(file.file));
      assert.deepEqual(
        file.fields.map(field => field.name).sort(),
        Object.keys(data).sort()
      );
    }
  }
  for (const name of ["site", "navigation", "footer"]) {
    assert.ok(owners.has(`src/data/settings/${name}.json`));
  }
});

test("homepage editors contain only localized page content", async () => {
  const config = await readConfig();
  const fields = config.collections.find(item => item.name === "homepage")
    .files[0].fields;
  const expected = ["profile", "introduction", "publishing", "links"];
  assert.deepEqual(
    fields.map(field => field.name),
    expected
  );
  const homes = await Promise.all(
    ["zh", "en"].map(async locale =>
      parseYaml(await readProjectFile(`src/content/home/${locale}/home.yml`))
    )
  );
  for (const home of homes)
    assert.deepEqual(Object.keys(home).sort(), [...expected].sort());
  assert.equal(homes[0].profile.avatar, homes[1].profile.avatar);
  assert.equal(
    fields[0].fields.find(field => field.name === "avatar").i18n,
    "duplicate"
  );
});

test("taxonomy relations store stable IDs and share article membership across locales", async () => {
  const config = await readConfig();
  const posts = config.collections.find(item => item.name === "posts");
  for (const [fieldName, target] of [
    ["category", "categories"],
    ["tags", "tags"],
  ]) {
    const field = posts.fields.find(item => item.name === fieldName);
    assert.equal(field.widget, "relation");
    assert.equal(field.collection, target);
    assert.equal(field.value_field, "{{slug}}");
    assert.equal(field.i18n, "duplicate");
    assert.deepEqual(field.display_fields, ["name.zh", "name.en"]);
    const terms = config.collections.find(item => item.name === target);
    assert.equal(terms.slug, "{{uuid}}");
    assert.equal(terms.identifier_field, "name.zh");
    assert.notEqual(terms.i18n, true);
  }
  assert.equal(posts.fields.find(item => item.name === "tags").multiple, true);
  assert.equal(
    posts.fields.find(item => item.name === "category").default,
    "unclassified"
  );
});

test("all navigation editors validate destinations and expose both languages", async () => {
  const config = await readConfig();
  const navigation = config.collections.find(item => item.name === "navigation")
    .files[0];
  for (const item of navigation.fields) {
    const label = item.fields.find(field => field.name === "label");
    assert.deepEqual(
      label.fields.map(field => field.name),
      ["zh", "en"]
    );
    const href = item.fields.find(field => field.name === "href");
    const pattern = new RegExp(href.pattern[0]);
    for (const value of [
      "posts",
      "posts/archive",
      "/custom-page",
      "/",
      "https://example.com/docs",
      "about#site-stack",
      "search?q=Astro",
    ])
      assert.match(value, pattern);
    for (const value of [
      "javascript:alert(1)",
      "data:text/html,hello",
      "mailto:user@example.com",
      "//evil.example",
      "../outside",
      "/\\evil.example",
      "posts with spaces",
    ])
      assert.doesNotMatch(value, pattern);
  }
});
