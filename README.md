# Inklume

[English](README-en.md)

一个由 Astro、Sveltia CMS 和 Cloudflare Workers 驱动的中英双语个人写作空间。

Inklume 把内容保存在 Git 仓库中：访客看到的是 Astro 构建的静态页面，编辑者通过 `/admin/index.html` 的 Sveltia CMS 修改 Markdown，提交后由 Workers Builds 自动重新发布。

## 特性

- Astro 原生 i18n：中文位于根路径，英文位于 `/en/`
- Sveltia CMS：Git-based 内容管理，不需要数据库
- Cloudflare Workers Static Assets：静态优先，按需再扩展 Worker API
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
- CMS：`http://localhost:4321/admin/index.html`

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

中英文文章使用相同文件名时，Sveltia 会将它们视为同一篇文章的不同语言版本。

## Sveltia CMS

`public/admin/config.yml` 已配置 GitHub backend 和双语 `multiple_folders` 内容模型。个人使用时可以在 Sveltia 登录页使用 GitHub Personal Access Token；多人或非技术编辑者可以额外部署 [Sveltia CMS Authenticator](https://github.com/sveltia/sveltia-cms-auth) 并配置 OAuth。

CMS 的内容提交到 GitHub 后会触发构建。Sveltia 目前是 Git-based CMS，保存内容就是创建 Git 提交，不提供独立数据库草稿。

## Cloudflare Workers 部署

本项目是纯静态 Astro 输出，`wrangler.jsonc` 将 `dist/` 配置为 Workers Static Assets：

部署前，请把 `astro-paper.config.ts` 中的 `site.url` 从占位地址改为实际的 Workers 或自定义域名；该值用于 canonical URL、RSS、Sitemap 和 OpenGraph。

```bash
npm run deploy
```

也可以在 Cloudflare Workers Builds 中配置：

- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`

纯静态博客不需要 `@astrojs/cloudflare` adapter。若以后加入 SSR、API 或 Cloudflare bindings，再单独启用 adapter，并审查运行时依赖。

## 图片

小规模图片可以放在 `public/uploads/` 并由 Git 管理。照片数量或文件体积变大后，可以把 Sveltia 的媒体存储迁移到 Cloudflare R2。

## 许可证与致谢

Inklume 当前基于 [AstroPages-Bilingual](https://github.com/t0saki/AstroPages-Bilingual) 的双语路由和内容结构开发，并保留原项目的许可证文件。主题和内容代码按本仓库许可证发布。
