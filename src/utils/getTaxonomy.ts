import { getCollection, type CollectionEntry } from "astro:content";
import { getRelativeLocaleUrl } from "astro:i18n";
import type { GetStaticPathsOptions } from "astro";
import {
  countTerms,
  encodeTaxonomyRedirect,
  localizeTerms,
  postHasTerm,
  validateTaxonomy,
} from "./taxonomy.js";
import { getSortedPosts } from "./getSortedPosts";
import { postFilter } from "./postFilter";
import config from "@/config";

export type TaxonomyKind = "tags" | "categories";
export type TaxonomyTerm = ReturnType<typeof localizeTerms>[number];
export type TaxonomySummary = TaxonomyTerm & { count: number };

async function readTaxonomy() {
  const [tags, categories, posts] = await Promise.all([
    getCollection("tags"),
    getCollection("categories"),
    getCollection("posts"),
  ]);
  const data = { tags, categories, posts };
  validateTaxonomy(data);
  return data;
}

let buildTaxonomy: ReturnType<typeof readTaxonomy> | undefined;

export function getTaxonomy() {
  // Production collections are immutable; dev must see subsequent CMS/file edits.
  return import.meta.env.DEV
    ? readTaxonomy()
    : (buildTaxonomy ??= readTaxonomy());
}

export async function getTaxonomyTerms(kind: TaxonomyKind, locale: string) {
  return localizeTerms(
    (await getTaxonomy())[kind],
    locale === "en" ? "en" : "zh"
  );
}

export async function getTaxonomySummaries(
  kind: TaxonomyKind,
  posts: CollectionEntry<"posts">[],
  locale: string
) {
  return countTerms(
    await getTaxonomyTerms(kind, locale),
    posts.filter(postFilter),
    kind
  );
}

export async function getPostTaxonomy(
  post: CollectionEntry<"posts">,
  locale: string
) {
  const [tags, categories] = await Promise.all([
    getTaxonomyTerms("tags", locale),
    getTaxonomyTerms("categories", locale),
  ]);
  return {
    tags: tags.filter(term => postHasTerm(post, "tags", term.id)),
    category: categories.find(term =>
      postHasTerm(post, "categories", term.id)
    )!,
  };
}

export async function getTaxonomyStaticPaths(
  kind: TaxonomyKind,
  locale: "zh" | "en",
  paginate: GetStaticPathsOptions["paginate"]
) {
  const data = await getTaxonomy();
  const terms = localizeTerms(data[kind], locale);
  const posts = getSortedPosts(
    data.posts.filter(post => post.id.startsWith(`${locale}/`))
  );
  const parameter = kind === "tags" ? "tag" : "category";

  return terms.flatMap(term => {
    const termPosts = posts.filter(post => postHasTerm(post, kind, term.id));
    return [term.slug, ...term.aliases].flatMap(slug =>
      paginate(termPosts, {
        params: {
          ...(locale === "en" ? { lang: locale } : {}),
          [parameter]: slug,
        },
        props: { term },
        pageSize: config.posts.perPage,
      }).map(path => ({
        ...path,
        props: {
          ...path.props,
          redirectTo:
            slug === term.slug
              ? undefined
              : encodeTaxonomyRedirect(
                  getRelativeLocaleUrl(
                    locale,
                    `${kind}/${term.slug}${path.props.page.currentPage > 1 ? `/${path.props.page.currentPage}` : ""}`
                  )
                ),
        },
      }))
    );
  });
}
