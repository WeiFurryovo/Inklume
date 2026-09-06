# Inklume

[English](README-en.md)

一个使用 [Astro Theme Pure](https://github.com/cworld1/astro-theme-pure) 作为前台基底、由 Astro、Sveltia CMS 和 Cloudflare Pages 驱动的中英双语 Astro 博客模板。

`https://inklume.pages.dev/` 是 Inklume 的项目功能演示站，默认文章、相册和介绍均为可替换的示例内容，并不代表维护者的个人博客。

Inklume 把内容保存在 Git 仓库中：访客看到的是 Astro 构建的静态页面，编辑者通过 `/admin/index.html` 的 Sveltia CMS 修改 Markdown 与 YAML 内容，提交后由 Cloudflare Pages 自动重新构建并发布。

## 特性

- Astro 原生 i18n：中文位于根路径，英文位于 `/en/`
- Astro Theme Pure 的轻量导航、卡片、主题切换与图标组件
- Sveltia CMS：Git-based 内容管理，不需要数据库
- Cloudflare Pages：通过 Git 集成自动构建静态站点，并提供分支和 Pull Request 预览
- Pagefind 静态全文搜索
- Markdown / MDX、Pure 代码高亮与数学公式
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
src/content/home/zh/home.yml      # 中文首页文案
src/content/home/en/home.yml      # 英文首页文案
src/content/categories/*.yml     # 分类：稳定 ID、中英文名称及网址
src/content/tags/*.yml           # 标签：稳定 ID、中英文名称及网址
src/data/settings/site.json      # 全站资料
src/data/settings/navigation.json # 双语导航
src/data/settings/footer.json    # 页脚、备案和联系链接
public/admin/index.html
public/admin/config.yml
```

中英文文章使用相同文件名时，Sveltia CMS 会将它们视为同一篇文章的不同语言版本。后台按内容、分类、外观和设置分组，菜单使用中文名称：

| 分组 | 入口                                               |
| ---- | -------------------------------------------------- |
| 内容 | 文章、独立页面、首页内容；图片与附件使用内置媒体库 |
| 分类 | 分类目录、标签                                     |
| 外观 | 导航菜单、页脚与联系                               |
| 设置 | 站点资料                                           |

文章表单优先显示标题、正文和摘要，提供分类关联、标签多选、草稿和相册筛选。分享图片、原文地址、显示时区等收在高级设置中。首页内容只管理首页资料、简介和按钮；关于页的技术栈、社交展示、说明和时间线保留在独立页面中。

站点名称、默认描述、作者、时区、图标和分享图片统一由 `site.json` 管理；导航文字和目标统一由 `navigation.json` 管理；版权、备案和全站联系链接统一由 `footer.json` 管理。共享设置只有一份数据，中英文站点、RSS 和分享信息读取相同来源。部署域名和功能开关仍由环境变量及 `astro-paper.config.ts` 管理。

分类采用单层、每篇一个分类，标签可多选。词条文件名是稳定 ID，文章保存 `category` 和 `tags` 引用；中英文名称和网址名称分别保存在词条中。新词条由后台生成 ID，已有词条改显示名称不会改变 ID 或网址。现有标签网址在迁移中保留，旧文章默认归入“未分类”。

修改词条网址时，把原网址名称加入对应语言的“旧网址”，构建会生成跳转。删除或合并词条前，通过后台的关联引用列表找到文章并修改引用；合并时可把旧词条的网址加入目标词条的“旧网址”。构建会校验未知引用、重复网址和重复别名，避免发布损坏的分类链接。保存内容后会触发 Pages 重新构建。

## Sveltia CMS

`public/admin/config.yml` 已配置 GitHub backend、双语 `multiple_folders` 内容模型和 GitHub OAuth。认证器基于官方 [Sveltia CMS Authenticator](https://github.com/sveltia/sveltia-cms-auth)，以 Pages Functions 的形式集成在当前项目的 `/auth` 与 `/callback`，不需要额外部署 Worker。`public/_routes.json` 确保只有这两个路径调用 Functions，其余博客页面继续作为纯静态资源提供。

首次部署时需要在 GitHub 的 [Developer settings → OAuth Apps](https://github.com/settings/developers) 注册一个 OAuth App：

以下域名值是 Inklume 官方演示实例的配置；自行部署时请替换为自己的 Pages 域名或自定义域名。

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

仓库默认的 `https://inklume.pages.dev/` 只用于 Inklume 官方演示实例。自行部署时必须在 Pages 项目的 **Settings → Environment variables** 中为 Production 配置 `SITE_URL`，例如 `https://blog.example.com/`；否则 canonical URL、RSS、Sitemap 和 OpenGraph 会错误指向官方演示站。修改后需要重新触发一次部署。预览构建仍会使用稳定的生产地址，而不是 Cloudflare 自动注入的带哈希临时域名。

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

Inklume 基于 [t0saki/AstroPages-Bilingual](https://github.com/t0saki/AstroPages-Bilingual) 的双语路由和内容结构继续开发；不是上游项目本身。前台组件层使用独立的 [Astro Theme Pure](https://github.com/cworld1/astro-theme-pure)（Apache-2.0），后台使用独立的第三方 [Sveltia CMS](https://github.com/sveltia/sveltia-cms)。原项目的 MIT 许可证和来源说明均予以保留，第三方主题说明见 [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md)。
