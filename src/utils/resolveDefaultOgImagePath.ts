import type { ResolvedAstroPaperConfig } from "@/types/config";
import { getAssetPath } from "./withBase";
import { assetUrlSchema } from "../settings.schema.js";

const publicFiles = import.meta.glob("/public/**/*", {
  eager: false,
  query: "?url",
  import: "default",
});

function existsInPublic(filename: string): boolean {
  return `/public/${filename}` in publicFiles;
}

/**
 * Resolves the absolute OG image path used for pages/posts.
 *
 * Remote HTTP(S) images are preserved. Local images must stay under public/.
 *
 * Behavior:
 * - When `features.dynamicOgImage` is enabled, prefers `public/{site.ogImage}` when present,
 *   otherwise falls back to the generated `/og.png`.
 * - When disabled, requires `public/{site.ogImage}` to exist.
 */
export function resolveDefaultOgImagePath(
  config: ResolvedAstroPaperConfig
): string {
  const image = assetUrlSchema.parse(config.site.ogImage);
  if (/^https?:\/\//i.test(image)) return image;
  const filename = decodeURIComponent(image.split(/[?#]/, 1)[0]).replace(
    /^\/+/,
    ""
  );

  if (config.features.dynamicOgImage) {
    return existsInPublic(filename)
      ? getAssetPath(image)
      : getAssetPath("og.png");
  }

  if (!existsInPublic(filename)) {
    throw new Error(
      `Inklume: missing public/${filename}. Add that file, or set site.ogImage to an existing file under public/, or enable features.dynamicOgImage to fall back to /og.png.`
    );
  }

  return getAssetPath(image);
}
