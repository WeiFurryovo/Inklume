/**
 * @typedef {"zh" | "en"} Locale
 * @typedef {"tags" | "categories"} TaxonomyKind
 * @typedef {{ zh: string, en: string }} LocalizedText
 * @typedef {{ id: string, data: {
 *   name: LocalizedText, slug: LocalizedText,
 *   description?: LocalizedText,
 *   aliases?: { zh: string[], en: string[] }
 * } }} TermEntry
 * @typedef {{ id: string, data: { tags?: string[], category?: string } }} PostEntry
 */

/**
 * Validate references from every post, including drafts and scheduled posts.
 * @param {{ tags: TermEntry[], categories: TermEntry[], posts: PostEntry[] }} data
 */
export function validateTaxonomy(data) {
  for (const kind of /** @type {const} */ (["tags", "categories"])) {
    const ids = new Set();
    const paths = { zh: new Map(), en: new Map() };

    for (const term of data[kind]) {
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(term.id) || ids.has(term.id)) {
        throw new Error(`Invalid or duplicate ${kind} ID: "${term.id}"`);
      }
      ids.add(term.id);

      for (const locale of /** @type {const} */ (["zh", "en"])) {
        for (const slug of [
          term.data.slug[locale],
          ...(term.data.aliases?.[locale] ?? []),
        ]) {
          const key = slug.normalize("NFC");
          if (paths[locale].has(key)) {
            throw new Error(
              `Duplicate ${kind} slug or alias "${slug}" (${locale}): "${paths[locale].get(key)}" and "${term.id}"`
            );
          }
          paths[locale].set(key, term.id);
        }
      }
    }

    for (const post of data.posts) {
      const references =
        kind === "tags"
          ? (post.data.tags ?? [])
          : [post.data.category ?? "unclassified"];
      for (const id of references) {
        if (!ids.has(id)) {
          throw new Error(
            `Post "${post.id}" references unknown ${kind} ID "${id}"`
          );
        }
      }
    }
  }
}

/**
 * @param {TermEntry[]} entries
 * @param {Locale} locale
 */
export function localizeTerms(entries, locale) {
  return entries
    .map(({ id, data }) => ({
      id,
      name: data.name[locale],
      slug: data.slug[locale],
      description: data.description?.[locale] ?? "",
      aliases: data.aliases?.[locale] ?? [],
    }))
    .sort((a, b) => a.name.localeCompare(b.name, locale));
}

/**
 * @param {PostEntry} post
 * @param {TaxonomyKind} kind
 * @param {string} id
 */
export function postHasTerm(post, kind, id) {
  return kind === "tags"
    ? (post.data.tags ?? []).includes(id)
    : (post.data.category ?? "unclassified") === id;
}

/**
 * Count posts, not occurrences of the same ID in their tag arrays.
 * @param {ReturnType<typeof localizeTerms>} terms
 * @param {PostEntry[]} posts
 * @param {TaxonomyKind} kind
 */
export function countTerms(terms, posts, kind) {
  return terms.map(term => ({
    ...term,
    count: new Set(
      posts
        .filter(post => postHasTerm(post, kind, term.id))
        .map(post => post.id)
    ).size,
  }));
}

/**
 * @param {TermEntry[]} entries
 * @param {string} slug
 * @param {Locale} locale
 * @param {Locale} target
 */
export function getTranslatedTermSlug(entries, slug, locale, target) {
  let decoded;
  try {
    decoded = decodeURIComponent(slug).normalize("NFC");
  } catch {
    return undefined;
  }
  return entries.find(({ data }) =>
    [data.slug[locale], ...(data.aliases?.[locale] ?? [])].some(
      value => value.normalize("NFC") === decoded
    )
  )?.data.slug[target];
}

/**
 * Redirect headers require ASCII even when normal links use Unicode slugs.
 * @param {string} pathname
 */
export function encodeTaxonomyRedirect(pathname) {
  return new URL(pathname, "https://taxonomy.invalid").pathname;
}
