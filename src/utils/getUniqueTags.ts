import type { CollectionEntry } from "astro:content";
import { getTaxonomySummaries } from "./getTaxonomy";

/** Published tags are grouped by stable ID, independent of display names. */
export async function getUniqueTags(
  posts: CollectionEntry<"posts">[],
  locale: string
) {
  return (await getTaxonomySummaries("tags", posts, locale)).filter(
    term => term.count > 0
  );
}
