import { z } from "astro/zod";

const termSlug = z
  .string()
  .min(1)
  .regex(/^[^\s/#?%\\]+$/u, "Use a single URL segment without spaces")
  .refine(value => value !== "." && value !== "..", "Invalid URL segment");
const optionalDescription = z
  .string()
  .nullish()
  .transform(value => value ?? "");
const optionalAliases = z
  .array(termSlug)
  .nullish()
  .transform(value => value ?? []);

export const termSchema = z.object({
  name: z.object({ zh: z.string().min(1), en: z.string().min(1) }),
  slug: z.object({ zh: termSlug, en: termSlug }),
  description: z
    .object({ zh: optionalDescription, en: optionalDescription })
    .nullish()
    .transform(value => value ?? undefined),
  aliases: z
    .object({ zh: optionalAliases, en: optionalAliases })
    .nullish()
    .transform(value => value ?? undefined),
});
