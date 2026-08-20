---
title: 欢迎来到 Inklume
pubDatetime: 2026-01-11T00:00:00Z
description: "Inklume 项目演示站的欢迎文章：了解双语内容、后台编辑与静态部署流程。"
featured: true
draft: false
heroImage:
  src: /inklume-og.png
  alt: Inklume
  color: "#659EB9"
tags:
  - 欢迎
  - 介绍
---

Inklume 是一个带 Sveltia CMS 后台的中英双语 Astro 博客模板。当前页面是一篇默认示例文章，用来展示普通正文、列表、代码与数学公式的呈现方式。

## 为什么叫 Inklume

`Ink` 代表写作，`lume` 取自微光。这个名字强调先把内容写下来，再通过简洁的界面让它被看见。

## 这个演示站如何运作

示例文章以 Markdown 保存在 Git 仓库里。Sveltia CMS 提供编辑界面，Astro 在每次内容更新后重新生成中文与英文站点，最后由 Cloudflare Pages 发布静态文件。

- 中文内容位于站点根路径
- 英文内容位于 `/en/`
- 内容和历史记录由 Git 管理
- 搜索索引、数学公式和页面都在构建阶段生成

## 数学公式

文章支持 Markdown 内嵌 LaTeX 公式，由 KaTeX 在构建期渲染。例如行内的质能方程 $E = mc^2$，以及块级公式：

$$
\int_0^1 x^2 \, dx = \frac{1}{3}
$$

这篇文章仅用于展示默认内容效果；部署自己的站点时，可以直接在后台替换或删除它。
