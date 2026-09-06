import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";
import { parseFrontmatter } from "@astrojs/markdown-remark";
import { termSchema } from "../src/taxonomy.schema.js";
import {
  countTerms,
  encodeTaxonomyRedirect,
  getTranslatedTermSlug,
  localizeTerms,
  postHasTerm,
  validateTaxonomy,
} from "../src/utils/taxonomy.js";

const term = (id, zh = id, en = id, aliases) => ({
  id,
  data: { name: { zh, en }, slug: { zh, en }, aliases },
});
const categories = [term("unclassified")];
const post = (id, tags, category) => ({ id, data: { tags, category } });

test("Unicode taxonomy redirects can be used as HTTP Location headers", () => {
  for (const prefix of ["/tags/", "/blog/en/categories/"]) {
    const target = encodeTaxonomyRedirect(`${prefix}\u6b22\u8fce/2/`);
    const response = new Response(null, {
      status: 301,
      headers: { Location: target },
    });
    assert.equal(
      response.headers.get("Location"),
      `${prefix}%E6%AC%A2%E8%BF%8E/2/`
    );
    assert.equal(encodeTaxonomyRedirect(target), target);
  }
});

test("taxonomy descriptions and aliases allow either language to be omitted", () => {
  for (const locale of ["zh", "en"]) {
    const otherLocale = locale === "zh" ? "en" : "zh";
    const parsed = termSchema.parse({
      ...term("welcome").data,
      description: { [locale]: "Description" },
      aliases: { [locale]: ["old-welcome"] },
    });
    assert.equal(parsed.description[locale], "Description");
    assert.equal(parsed.description[otherLocale], "");
    assert.deepEqual(parsed.aliases[otherLocale], []);
    const [localized] = localizeTerms(
      [{ id: "welcome", data: parsed }],
      otherLocale
    );
    assert.equal(localized.description, "");
    assert.deepEqual(localized.aliases, []);
  }
});

test("empty optional taxonomy objects and null language fields are safe", () => {
  for (const empty of [undefined, null, {}]) {
    const parsed = termSchema.parse({
      ...term("welcome").data,
      description: empty,
      aliases: empty,
    });
    for (const locale of ["zh", "en"]) {
      const [localized] = localizeTerms(
        [{ id: "welcome", data: parsed }],
        locale
      );
      assert.equal(localized.description, "");
      assert.deepEqual(localized.aliases, []);
    }
  }
  const parsed = termSchema.parse({
    ...term("welcome").data,
    description: { zh: null },
    aliases: { en: null },
  });
  assert.deepEqual(parsed.description, { zh: "", en: "" });
  assert.deepEqual(parsed.aliases, { zh: [], en: [] });
  assert.equal(
    termSchema.safeParse({ ...term("welcome").data, description: { zh: 42 } })
      .success,
    false
  );
  assert.equal(
    termSchema.safeParse({ ...term("welcome").data, aliases: { en: "old" } })
      .success,
    false
  );
});

test("taxonomy references use IDs and reject missing terms even in drafts", () => {
  const tags = [term("welcome", "\u6b22\u8fce", "welcome")];
  assert.doesNotThrow(() =>
    validateTaxonomy({ tags, categories, posts: [post("zh/a", ["welcome"])] })
  );
  assert.throws(
    () =>
      validateTaxonomy({
        tags,
        categories,
        posts: [
          {
            ...post("zh/draft", ["removed"]),
            data: { tags: ["removed"], draft: true },
          },
        ],
      }),
    /zh\/draft.*unknown tags ID "removed"/
  );
  assert.throws(
    () =>
      validateTaxonomy({
        tags,
        categories,
        posts: [post("zh/a", ["welcome"], "missing")],
      }),
    /unknown categories ID "missing"/
  );
});

test("taxonomy slugs and aliases must be unique within each language", () => {
  assert.throws(
    () =>
      validateTaxonomy({
        tags: [term("one", "same"), term("two", "same")],
        categories,
        posts: [],
      }),
    /Duplicate tags slug or alias "same" \(zh\)/
  );
  assert.throws(
    () =>
      validateTaxonomy({
        tags: [
          term("one", "first", "first", { zh: ["old"], en: [] }),
          term("two", "old", "second"),
        ],
        categories,
        posts: [],
      }),
    /Duplicate tags slug or alias "old"/
  );
  assert.doesNotThrow(() =>
    validateTaxonomy({
      tags: [
        term("one", "same", "different"),
        term("two", "different", "same"),
      ],
      categories,
      posts: [],
    })
  );
});

test("tag counts deduplicate term and content IDs", () => {
  const terms = localizeTerms([term("welcome")], "en");
  const posts = [
    post("en/a", ["welcome", "welcome"]),
    post("en/a", ["welcome"]),
    post("en/b", ["welcome"]),
  ];
  assert.equal(countTerms(terms, posts, "tags")[0].count, 2);
  assert.equal(
    countTerms(localizeTerms(categories, "en"), posts, "categories")[0].count,
    2
  );
  assert.equal(postHasTerm(posts[0], "categories", "unclassified"), true);
});

test("omitted tags stay empty instead of restoring a default tag", () => {
  const posts = [post("en/empty", undefined), post("en/cleared", [])];
  assert.doesNotThrow(() => validateTaxonomy({ tags: [], categories, posts }));
  assert.equal(postHasTerm(posts[0], "tags", "others"), false);
  assert.equal(
    countTerms(localizeTerms([term("others")], "en"), posts, "tags")[0].count,
    0
  );
});

test("renaming a display name preserves IDs, slugs and article membership", () => {
  const entry = term("welcome", "\u6b22\u8fce", "welcome");
  entry.data.name.en = "Getting started";
  const [localized] = localizeTerms([entry], "en");
  assert.equal(localized.name, "Getting started");
  assert.equal(localized.slug, "welcome");
  assert.equal(localized.id, "welcome");
  assert.equal(
    postHasTerm(post("en/a", ["welcome"]), "tags", localized.id),
    true
  );
});

test("language switching resolves encoded slugs and aliases through term IDs", () => {
  const terms = [
    term("welcome", "\u6b22\u8fce", "welcome", {
      zh: ["\u4f60\u597d"],
      en: ["hello"],
    }),
  ];
  assert.equal(
    getTranslatedTermSlug(terms, "%E6%AC%A2%E8%BF%8E", "zh", "en"),
    "welcome"
  );
  assert.equal(
    getTranslatedTermSlug(terms, "hello", "en", "zh"),
    "\u6b22\u8fce"
  );
  assert.equal(
    getTranslatedTermSlug(terms, "%E4%BD%A0%E5%A5%BD", "zh", "en"),
    "welcome"
  );
  assert.equal(getTranslatedTermSlug(terms, "missing", "zh", "en"), undefined);
  assert.equal(getTranslatedTermSlug(terms, "%broken", "zh", "en"), undefined);
});

test("migrated repository taxonomy preserves all existing tag URLs", async () => {
  const loadTerms = async kind => {
    const directory = new URL(`../src/content/${kind}/`, import.meta.url);
    const files = await readdir(directory);
    return Promise.all(
      files
        .filter(file => file.endsWith(".yml"))
        .map(async file => ({
          id: file.slice(0, -4),
          data: parseFrontmatter(
            `---\n${await readFile(new URL(file, directory), "utf8")}\n---`
          ).frontmatter,
        }))
    );
  };
  const [tags, categories] = await Promise.all([
    loadTerms("tags"),
    loadTerms("categories"),
  ]);
  const posts = [];
  for (const locale of ["zh", "en"]) {
    const directory = new URL(
      `../src/content/posts/${locale}/`,
      import.meta.url
    );
    for (const file of await readdir(directory)) {
      if (!file.endsWith(".md")) continue;
      posts.push({
        id: `${locale}/${file.slice(0, -3)}`,
        data: parseFrontmatter(await readFile(new URL(file, directory), "utf8"))
          .frontmatter,
      });
    }
  }
  validateTaxonomy({ tags, categories, posts });
  const slugs = Object.fromEntries(
    tags.map(entry => [entry.id, entry.data.slug])
  );
  assert.deepEqual(slugs.welcome, { zh: "\u6b22\u8fce", en: "welcome" });
  assert.deepEqual(slugs.introduction, {
    zh: "\u4ecb\u7ecd",
    en: "introduction",
  });
  assert.deepEqual(slugs.photography, {
    zh: "\u6444\u5f71",
    en: "photography",
  });
  assert.deepEqual(slugs.travel, { zh: "\u65c5\u884c", en: "travel" });
});
