# Inklume

[English](README-en.md)

一个由 Astro、Sveltia CMS 和 Cloudflare Pages 驱动的中英双语个人写作空间。

Inklume 把内容保存在 Git 仓库中：访客看到的是 Astro 构建的静态页面，编辑者通过 `/admin/index.html` 的 Sveltia CMS 修改 Markdown，提交后由 Cloudflare Pages 自动重新构建并发布。

## 特性

- Astro 原生 i18n：中文位于根路径，英文位于 `/en/`
- Sveltia CMS：Git-based 内容管理，不需要数据库
- Cloudflare Pages：通过 Git 集成自动构建静态站点，并提供分支和 Pull Request 预览
- Pagefind 静态全文搜索
- Markdown / MDX、代码高亮、数学公式与 callouts
- 按文章组织的照片相册和 PhotoSwipe 灯箱
- 明暗主题、RSS、Sitemap 与 OpenGraph

## 本地开发

环境要求：Node.js 22.12+。

```bash
npm install
npm run dev
```

- 中文首页：`http://localhost:4321/`
- 英文首页：`http://localhost:4321/en/`
- Sveltia CMS：`http://localhost:4321/admin/index.html`

搜索索引需要先完成一次构建：

```bash
npm run build
npm run preview
```

## 内容结构

```text
src/content/posts/zh/my-post.md   # 中文文章 -> /posts/my-post/
src/content/posts/en/my-post.md   # 英文文章 -> /en/posts/my-post/
src/content/pages/zh/about.md
src/content/pages/en/about.md
public/admin/index.html
public/admin/config.yml
```

中英文文章使用相同文件名时，Sveltia CMS 会将它们视为同一篇文章的不同语言版本。

## Sveltia CMS

`public/admin/config.yml` 已配置 GitHub backend 和双语 `multiple_folders` 内容模型。个人使用时可以在 Sveltia 登录页使用 GitHub Personal Access Token；多人或非技术编辑者可以额外部署 [Sveltia CMS Authenticator](https://github.com/sveltia/sveltia-cms-auth) 并配置 OAuth。

Sveltia CMS 的内容提交到 GitHub 后会触发构建。Sveltia 是 Git-based CMS，保存内容就是创建 Git 提交，不提供独立数据库草稿。

## Cloudflare Pages 部署

本项目是纯静态 Astro 输出，`wrangler.jsonc` 使用 `pages_build_output_dir` 指向 `dist/`。推荐在 Cloudflare Pages 中连接这个 GitHub 仓库，让 Pages 负责构建和发布。

在 Cloudflare Dashboard 的 **Workers & Pages → Create application → Pages → Import an existing Git repository** 中选择 `WeiFurryovo/Inklume`，然后设置：

- Production branch：`main`
- Project name：`inklume`
- Build command：`npm run build`
- Build output directory：`dist`
- 仓库 `.nvmrc` 已固定 Node.js `24`；如果构建镜像没有读取它，再在环境变量中添加 `NODE_VERSION=24`

在 Pages 项目的 **Settings → Environment variables** 中，为 Production 配置稳定的 `SITE_URL`，例如 `https://blog.example.com/`。它是构建变量，Astro 会在构建阶段将它写入 canonical URL、RSS、Sitemap 和 OpenGraph；修改后需要重新触发一次部署。Pages 自动注入的 `CF_PAGES_URL` 会作为没有自定义 `SITE_URL` 时的回退值，预览部署也能使用对应的预览地址，但生产环境建议始终设置 `SITE_URL`。

本地构建可以在命令前设置：

```bash
SITE_URL=https://blog.example.com/ npm run build
```

连接 GitHub 后，推送到 `main` 会自动发布，其他分支和 Pull Request 会生成预览。Sveltia CMS 提交内容到 `main` 后也会触发 Pages 构建；相册缩略图工作流回写的提交会触发后续构建。

```bash
npm run deploy
```

`npm run deploy` 用 Wrangler 直接发布到已存在的 `inklume` Pages 项目，适合本地手动发布；先在 Dashboard 创建 Git 集成项目并连接 GitHub 后，日常通常不需要运行它。不要在创建 Git 集成项目之前运行此命令，以免误创建无法切换回 Git 集成的 Direct Upload 项目。

纯静态博客不需要 `@astrojs/cloudflare` adapter。若以后加入 SSR、API 或 Cloudflare bindings，再单独启用 Pages Functions/adapter，并审查运行时依赖。

## 图片

小规模图片可以放在 `public/uploads/` 并由 Git 管理。照片数量或文件体积变大后，可以把 Sveltia CMS 的媒体存储迁移到 Cloudflare R2。

## 许可证与致谢

本仓库是 Inklume 对 [t0saki/AstroPages-Bilingual](https://github.com/t0saki/AstroPages-Bilingual) 的个人改版，沿用了它的双语路由和内容结构；不是上游项目本身。AstroPages-Bilingual 基于 [Sat Naing 的 AstroPaper](https://github.com/satnaing/astro-paper)，后台使用独立的第三方 [Sveltia CMS](https://github.com/sveltia/sveltia-cms)。原项目的许可证文件和来源说明均予以保留。
