# Inklume

[中文](README.md)

A bilingual personal writing space using [Astro Theme Pure](https://github.com/cworld1/astro-theme-pure) as its frontend foundation, powered by Astro, Sveltia CMS, and Cloudflare Pages.

Inklume keeps content in Git: visitors receive Astro-generated static pages, while editors use the Sveltia CMS at `/admin/index.html`. Every content commit can trigger a Cloudflare Pages build and deployment.

## Features

- Native Astro i18n: Chinese at the root and English under `/en/`
- Astro Theme Pure navigation, cards, theme switcher, and icon components
- Sveltia CMS with a GitHub backend and no database
- Cloudflare Pages Git integration with branch and pull request previews
- Pagefind full-text search
- Markdown / MDX, syntax highlighting, math, and callouts
- Article-based photo gallery with a PhotoSwipe lightbox
- Light/dark mode, RSS, sitemap, and OpenGraph metadata

## Local Development

Requirements: Node.js 22.12+.

```bash
npm install
npm run dev
```

- Chinese home: `http://localhost:4321/`
- English home: `http://localhost:4321/en/`
- Sveltia CMS: `http://localhost:4321/admin/index.html`

The search index is generated during the build:

```bash
npm run build
npm run preview
```

## Content Structure

```text
src/content/posts/zh/my-post.md   # Chinese -> /posts/my-post/
src/content/posts/en/my-post.md   # English -> /en/posts/my-post/
src/content/pages/zh/about.md
src/content/pages/en/about.md
public/admin/index.html
public/admin/config.yml
```

Matching filenames link the Chinese and English versions of a post in Sveltia CMS.

## Sveltia CMS

`public/admin/config.yml` configures the GitHub backend and the bilingual `multiple_folders` content model. For personal use, sign in with a GitHub Personal Access Token. For non-technical editors, deploy the [Sveltia CMS Authenticator](https://github.com/sveltia/sveltia-cms-auth) and configure OAuth.

Sveltia CMS is Git-based: saving content creates Git commits rather than rows in a separate draft database.

## Deploying to Cloudflare Pages

This project is a fully static Astro build. `wrangler.jsonc` uses `pages_build_output_dir` to point Pages at `dist/`. The recommended setup is to connect this GitHub repository to Cloudflare Pages and let Pages build and publish it.

In the Cloudflare Dashboard, open **Workers & Pages → Create application → Pages → Import an existing Git repository**, select `WeiFurryovo/Inklume`, and set:

- Production branch: `main`
- Project name: `inklume`
- Build command: `npm run build`
- Build output directory: `dist`
- The repository's `.nvmrc` pins Node.js `24`; if the build image does not read it, add `NODE_VERSION=24` as an environment variable

In the Pages project's **Settings → Environment variables**, set a stable Production `SITE_URL`, for example `https://blog.example.com/`. This build variable is written into canonical URLs, RSS, the sitemap, and OpenGraph metadata; trigger a new deployment after changing it. Pages automatically injects `CF_PAGES_URL`, which is used as the fallback when `SITE_URL` is not set and gives preview builds their deployment URL, but production should always set `SITE_URL`.

For a local build, set it on the command:

```bash
SITE_URL=https://blog.example.com/ npm run build
```

With Git integration enabled, pushes to `main` deploy automatically, while other branches and pull requests receive preview deployments. Sveltia CMS commits to `main` trigger the same Pages build; the gallery thumbnail workflow's generated commit triggers the follow-up build.

```bash
npm run deploy
```

`npm run deploy` uses Wrangler to upload directly to an existing `inklume` Pages project for local/manual deployments; create the Git-integrated project in the dashboard first. Do not run it before that setup, because a Direct Upload project cannot later be switched to Git integration. Git-integrated projects normally do not need it.

The static site does not need the `@astrojs/cloudflare` adapter. Add Pages Functions/the adapter later only if the project gains SSR, APIs, or Cloudflare bindings, and audit runtime dependencies at that point.

## Images

Small media files can live in `public/uploads/` and be committed to Git. Move Sveltia CMS media storage to Cloudflare R2 when the collection becomes large.

## License and Attribution

This repository is a personal Inklume adaptation of [t0saki/AstroPages-Bilingual](https://github.com/t0saki/AstroPages-Bilingual), not the upstream project itself. The frontend component layer uses the independent [Astro Theme Pure](https://github.com/cworld1/astro-theme-pure) package (Apache-2.0), and the admin interface is the independent third-party [Sveltia CMS](https://github.com/sveltia/sveltia-cms). The original MIT license and attribution are retained; see [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md) for the theme notice.
