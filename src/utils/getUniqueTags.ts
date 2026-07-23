import type { CollectionEntry } from "astro:content";
import { postFilter } from "./postFilter";
import { slugifyStr } from "./slugify";

type Tag = {
  tag: string;
  tagName: string;
  count: number;
};

/**
 * Builds a de-duplicated, sorted tag list from posts.
 *
 * - Drafts and scheduled posts are excluded via `postFilter()`
 * - `tag` is the slug used in URLs; `tagName` is the original label for display
 * - `count` tracks how many posts use the tag for Pure's weighted tag list
 * - Uniqueness is based on the slug (so differently-cased labels collapse)
 */
export function getUniqueTags(posts: CollectionEntry<"posts">[]) {
  const tags = new Map<string, Tag>();

  for (const post of posts.filter(postFilter)) {
    for (const tagName of post.data.tags) {
      const tag = slugifyStr(tagName);
      const existing = tags.get(tag);

      if (existing) {
        existing.count += 1;
      } else {
        tags.set(tag, { tag, tagName, count: 1 });
      }
    }
  }

  return [...tags.values()].sort((tagA, tagB) =>
    tagA.tag.localeCompare(tagB.tag)
  );
}
