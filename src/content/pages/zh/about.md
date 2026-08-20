---
title: "关于"
description: "关于 Inklume。"
aboutModules:
  motto:
    text: "让文章始终处于中心。"
    spoiler: "界面只负责让内容更容易抵达。"
  cta:
    label: "查看 Inklume 源码"
    href: "https://github.com/WeiFurryovo/Inklume"
  siteStack:
    title: "本站技术栈"
    description: "支撑这个双语写作空间的框架、主题与服务："
    groupLabel: "构成"
    items:
      - name: "Astro"
        description: "静态网站框架"
        icon: "astro"
        href: "https://astro.build/"
      - name: "Astro Theme Pure"
        description: "博客主题"
        icon: "pure"
        href: "https://github.com/cworld1/astro-theme-pure"
      - name: "Sveltia CMS"
        description: "内容管理后台"
        icon: "sveltia"
        href: "https://github.com/sveltia/sveltia-cms"
      - name: "Cloudflare Pages"
        description: "构建与托管"
        icon: "cloudflare"
        href: "https://pages.cloudflare.com/"
      - name: "Pagefind"
        description: "静态站内搜索"
        icon: "pagefind"
        href: "https://pagefind.app/"
      - name: "GitHub"
        description: "源码与版本管理"
        icon: "github"
        href: "https://github.com/WeiFurryovo/Inklume"
  social:
    title: "社交网络"
    description: "可以在这里找到这个项目和它的维护者。"
    items:
      - platform: "GitHub"
        icon: "github"
        href: "https://github.com/WeiFurryovo"
        metric: "关注者"
        api: "github/WeiFurryovo"
  notes:
    title: "构建方式"
    summary: "内容如何从后台发布到网站"
    body: "内容保存在 Git 中并由 Sveltia CMS 编辑；Astro 生成静态页面，Cloudflare Pages 在每次提交后重新构建并发布。"
  timeline:
    title: "关于本站"
    description: "Inklume 的建站记录："
    items:
      - date: "2026-07-19"
        content: "初始化 Inklume 的中英双语博客结构。"
      - date: "2026-07-21"
        content: "在同一个 Cloudflare Pages 项目中接入 Sveltia CMS 登录。"
      - date: "2026-07-24"
        content: "前台界面与 Astro Theme Pure 官方 Demo 完整对齐。"
      - date: "2026-08-21"
        content: "增加可在后台管理的站点图标与页脚信息。"
---

Inklume 是一个由自己拥有的中英双语写作空间，用来记录技术、创作与生活。

中文文章位于站点根路径，英文文章位于 `/en/` 下。点击页眉的语言切换即可在两种语言间跳转。

## 原则

- 内容以 Markdown 保存，随时可以迁移
- 中文与英文共享结构，但可以独立表达
- 页面尽量快速、安静，并让文章始终处于中心
- 站点由 Astro 构建，通过 Cloudflare Pages 发布
