import { getEntry } from "astro:content";

export async function getHomepage(locale: string) {
  const homepage = await getEntry("homepage", `${locale}/home`);

  if (!homepage) {
    throw new Error(
      `Missing content entry: \`${locale}/home.yml\` in \`src/content/home/\``
    );
  }

  return homepage.data;
}
