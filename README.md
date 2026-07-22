# Inklume

[English](README-en.md)

一个使用 [Astro Theme Pure](https://github.com/cworld1/astro-theme-pure) 作为前台基底、由 Astro、Sveltia CMS 和 Cloudflare Pages 驱动的中英双语个人写作空间。

Inklume 把内容保存在 Git 仓库中：访客看到的是 Astro 构建的静态页面，编辑者通过 `/admin/index.html` 的 Sveltia CMS 修改 Markdown，提交后由 Cloudflare Pages 自动重新构建并发布。

## 特性

- Astro 原生 i18n：中文位于根路径，英文位于 `/en/`
- Astro Theme Pure 的轻量导航、卡片、主题切换与图标组件
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

`public/admin/config.yml` 已配置 GitHub backend、双语 `multiple_folders` 内容模型和 GitHub OAuth。认证器基于官方 [Sveltia CMS Authenticator](https://github.com/sveltia/sveltia-cms-auth)，以 Pages Functions 的形式集成在当前项目的 `/auth` 与 `/callback`，不需要额外部署 Worker。`public/_routes.json` 确保只有这两个路径调用 Functions，其余博客页面继续作为纯静态资源提供。

首次部署时需要在 GitHub 的 [Developer settings → OAuth Apps](https://github.com/settings/developers) 注册一个 OAuth App：

- Application name：`Inklume Sveltia CMS`
- Homepage URL：`https://inklume.pages.dev/admin/`
- Authorization callback URL：`https://inklume.pages.dev/callback`

然后在 Cloudflare Pages 项目的 **Settings → Variables and Secrets** 中，为 Production 添加：

- `ALLOWED_DOMAINS`：`inklume.pages.dev`，类型选择 Plain text
- `GITHUB_CLIENT_ID`：OAuth App 的 Client ID，类型选择 Plain text
- `GITHUB_CLIENT_SECRET`：OAuth App 的 Client Secret，类型选择 Secret

本仓库不使用 Wrangler 配置文件作为 Pages 配置源，变量和 Secret 均由 Cloudflare Dashboard 管理。不要把 Client Secret 写进仓库或普通环境变量。配置后重新部署一次，打开 `https://inklume.pages.dev/admin/` 即可使用 GitHub 登录。预览部署和本地开发不会使用生产 OAuth，请改用 GitHub Personal Access Token 登录。以后绑定自定义域名时，还要把新主机名追加到 `ALLOWED_DOMAINS`，多个域名使用逗号分隔。

Sveltia CMS 的内容提交到 GitHub 后会触发构建。Sveltia 是 Git-based CMS，保存内容就是创建 Git 提交，不提供独立数据库草稿。

## Cloudflare Pages 部署

本项目前台是静态 Astro 输出，只有 Sveltia OAuth 的 `/auth` 和 `/callback` 使用 Pages Functions。推荐在 Cloudflare Pages 中连接这个 GitHub 仓库，让 Pages 负责构建和发布。仓库刻意不包含 Wrangler 配置文件，因此 Pages 的变量、Secret 和运行时设置都可以直接在 Cloudflare Dashboard 中管理。

在 Cloudflare Dashboard 的 **Workers & Pages → Create application → Pages → Import an existing Git repository** 中选择 `WeiFurryovo/Inklume`，然后设置：

- Production branch：`main`
- Project name：`inklume`
- Build command：`npm run build`
- Build output directory：`dist`
- 仓库 `.nvmrc` 已固定 Node.js `24`；如果构建镜像没有读取它，再在环境变量中添加 `NODE_VERSION=24`

默认站点地址是稳定的 `https://inklume.pages.dev/`，无需额外变量即可正确生成 canonical URL、RSS、Sitemap 和 OpenGraph。绑定自定义域名后，在 Pages 项目的 **Settings → Environment variables** 中为 Production 配置 `SITE_URL`，例如 `https://blog.example.com/`；修改后需要重新触发一次部署。构建不会使用 Pages 自动注入的预览部署地址作为 canonical，避免搜索引擎收录带哈希的临时域名。

本地构建可以在命令前设置：

```bash
SITE_URL=https://blog.example.com/ npm run build
```

连接 GitHub 后，推送到 `main` 会自动发布，其他分支和 Pull Request 会生成预览。Sveltia CMS 提交内容到 `main` 后也会触发 Pages 构建；相册缩略图工作流回写的提交会触发后续构建。

```bash
npm run deploy
```

`npm run deploy` 用 Wrangler 直接发布到已存在的 `inklume` Pages 项目，适合本地手动发布；先在 Dashboard 创建 Git 集成项目并连接 GitHub 后，日常通常不需要运行它。不要在创建 Git 集成项目之前运行此命令，以免误创建无法切换回 Git 集成的 Direct Upload 项目。

博客页面不需要 `@astrojs/cloudflare` adapter；仓库根目录的 `functions/` 会由 Pages 独立构建。若以后加入 SSR 或其他 Cloudflare bindings，再评估是否启用 adapter，并审查运行时依赖。

## 图片

小规模图片可以放在 `public/uploads/` 并由 Git 管理。照片数量或文件体积变大后，可以把 Sveltia CMS 的媒体存储迁移到 Cloudflare R2。

## 许可证与致谢

本仓库是 Inklume 对 [t0saki/AstroPages-Bilingual](https://github.com/t0saki/AstroPages-Bilingual) 的个人改版，沿用了它的双语路由和内容结构；不是上游项目本身。前台组件层使用独立的 [Astro Theme Pure](https://github.com/cworld1/astro-theme-pure)（Apache-2.0），后台使用独立的第三方 [Sveltia CMS](https://github.com/sveltia/sveltia-cms)。原项目的 MIT 许可证和来源说明均予以保留，第三方主题说明见 [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md)。
