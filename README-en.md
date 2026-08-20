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
- Markdown / MDX, Pure syntax highlighting, and math
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
src/content/home/zh/home.yml      # Chinese homepage copy
src/content/home/en/home.yml      # English homepage copy
public/admin/index.html
public/admin/config.yml
```

Matching filenames link the Chinese and English versions of a post in Sveltia CMS. The Homepage collection lets editors change the shared site name, browser tab title, favicon, and avatar, along with localized display names, locations, introductions, publishing copy, homepage link labels, and top navigation labels. Link destinations stay fixed, and saving these fields triggers a Pages rebuild.

## Sveltia CMS

`public/admin/config.yml` configures the GitHub backend, the bilingual `multiple_folders` content model, and GitHub OAuth. The official [Sveltia CMS Authenticator](https://github.com/sveltia/sveltia-cms-auth) flow is integrated into this Pages project at `/auth` and `/callback`, so no separate Worker is required. `public/_routes.json` ensures that only those two paths invoke Functions; all blog pages remain static assets.

For the first deployment, register an OAuth App under GitHub [Developer settings → OAuth Apps](https://github.com/settings/developers):

- Application name: `Inklume Sveltia CMS`
- Homepage URL: `https://inklume.pages.dev/admin/`
- Authorization callback URL: `https://inklume.pages.dev/callback`

Then add the following to Production under the Cloudflare Pages project's **Settings → Variables and Secrets**:

- `ALLOWED_DOMAINS`: `inklume.pages.dev`, stored as plain text
- `GITHUB_CLIENT_ID`: the OAuth App Client ID, stored as plain text
- `GITHUB_CLIENT_SECRET`: the OAuth App Client Secret, stored as a secret

This repository does not use a Wrangler file as the Pages configuration source; variables and secrets are managed in the Cloudflare Dashboard. Never commit the Client Secret or store it as a plain-text variable. Redeploy after setting the values, then use GitHub sign-in at `https://inklume.pages.dev/admin/`. Production OAuth is intentionally unavailable on preview deployments and local development; use GitHub Personal Access Token sign-in there. When adding a custom domain, append its hostname to `ALLOWED_DOMAINS`, using commas between multiple domains.

Sveltia CMS is Git-based: saving content creates Git commits rather than rows in a separate draft database.

## Deploying to Cloudflare Pages

The blog frontend is a static Astro build; only the Sveltia OAuth endpoints at `/auth` and `/callback` use Pages Functions. The recommended setup is to connect this GitHub repository to Cloudflare Pages and let Pages build and publish it. The repository intentionally has no Wrangler configuration file, so Pages variables, secrets, and runtime settings remain editable in the Cloudflare Dashboard.

In the Cloudflare Dashboard, open **Workers & Pages → Create application → Pages → Import an existing Git repository**, select `WeiFurryovo/Inklume`, and set:

- Production branch: `main`
- Project name: `inklume`
- Build command: `npm run build`
- Build output directory: `dist`
- The repository's `.nvmrc` pins Node.js `24`; if the build image does not read it, add `NODE_VERSION=24` as an environment variable

The default `https://inklume.pages.dev/` URL is used for canonical URLs, RSS, the sitemap, and OpenGraph metadata without extra configuration. After adding a custom domain, set a Production `SITE_URL` under the Pages project's **Settings → Environment variables**, for example `https://blog.example.com/`, then trigger a new deployment. Preview builds intentionally keep the stable production URL instead of using Cloudflare's temporary hash-based deployment URL.

For a local build, set it on the command:

```bash
SITE_URL=https://blog.example.com/ npm run build
```

With Git integration enabled, pushes to `main` deploy automatically, while other branches and pull requests receive preview deployments. Sveltia CMS commits to `main` trigger the same Pages build; the gallery thumbnail workflow's generated commit triggers the follow-up build.

```bash
npm run deploy
```

`npm run deploy` uses Wrangler to upload directly to an existing `inklume` Pages project for local/manual deployments; create the Git-integrated project in the dashboard first. Do not run it before that setup, because a Direct Upload project cannot later be switched to Git integration. Git-integrated projects normally do not need it.

The blog pages do not need the `@astrojs/cloudflare` adapter; Pages builds the root `functions/` directory separately. Reassess the adapter only if the project later gains SSR or additional Cloudflare bindings, and audit runtime dependencies at that point.

## Images

Small media files can live in `public/uploads/` and be committed to Git. Move Sveltia CMS media storage to Cloudflare R2 when the collection becomes large.

## License and Attribution

This repository is a personal Inklume adaptation of [t0saki/AstroPages-Bilingual](https://github.com/t0saki/AstroPages-Bilingual), not the upstream project itself. The frontend component layer uses the independent [Astro Theme Pure](https://github.com/cworld1/astro-theme-pure) package (Apache-2.0), and the admin interface is the independent third-party [Sveltia CMS](https://github.com/sveltia/sveltia-cms). The original MIT license and attribution are retained; see [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md) for the theme notice.
