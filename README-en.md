# Inklume

[中文](README.md)

A bilingual personal writing space powered by Astro, Sveltia CMS, and Cloudflare Workers.

Inklume keeps content in Git: visitors receive Astro-generated static pages, while editors use the Sveltia CMS at `/admin/index.html`. Every content commit can trigger a Workers Builds deployment.

## Features

- Native Astro i18n: Chinese at the root and English under `/en/`
- Sveltia CMS with a GitHub backend and no database
- Cloudflare Workers Static Assets with a static-first architecture
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

## Deploying to Cloudflare Workers

This project is a fully static Astro build. `wrangler.jsonc` publishes `dist/` as Workers Static Assets:

Before deploying, replace the placeholder `site.url` in `astro-paper.config.ts` with the actual Workers or custom-domain URL. Astro uses it for canonical URLs, RSS, the sitemap, and OpenGraph metadata.

```bash
npm run deploy
```

For Workers Builds, use:

- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`

The static site does not need the `@astrojs/cloudflare` adapter. Add it later only if the project gains SSR, APIs, or Cloudflare bindings, and audit runtime dependencies at that point.

## Images

Small media files can live in `public/uploads/` and be committed to Git. Move Sveltia CMS media storage to Cloudflare R2 when the collection becomes large.

## License and Attribution

This repository is a personal Inklume adaptation of [t0saki/AstroPages-Bilingual](https://github.com/t0saki/AstroPages-Bilingual), not the upstream project itself. AstroPages-Bilingual is based on [Sat Naing's AstroPaper](https://github.com/satnaing/astro-paper), and the admin interface is the independent third-party [Sveltia CMS](https://github.com/sveltia/sveltia-cms). The original license and attribution are retained.
