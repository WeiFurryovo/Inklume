---
title: 欢迎来到 Inklume
pubDatetime: 2026-01-11T00:00:00Z
description: "Inklume 的第一篇文章：一个属于自己的双语写作空间，从这里开始。"
featured: true
draft: false
tags:
  - 欢迎
  - 介绍
---

# 欢迎来到 Inklume

Inklume 是一个中英双语的个人写作空间。这里会留下正在构建的项目、值得拆解的问题，以及一些不该被时间冲走的生活片段。

## 为什么叫 Inklume

`Ink` 是写作，`lume` 是微光。名字不强调某个框架，而是提醒自己：先把想法写下来，再让它被看见。

## 这个空间如何运作

文章以 Markdown 保存在自己的 Git 仓库里。Sveltia CMS 提供编辑界面，Astro 在每次内容更新后重新生成中文与英文站点，最后由 Cloudflare Workers 分发静态文件。

- 中文内容位于站点根路径
- 英文内容位于 `/en/`
- 内容和历史记录由 Git 管理
- 搜索索引、数学公式和页面都在构建阶段生成

## 数学公式

文章支持 Markdown 内嵌 LaTeX 公式，由 KaTeX 在构建期渲染。例如行内的质能方程 $E = mc^2$，以及块级公式：

$$
\int_0^1 x^2 \, dx = \frac{1}{3}
$$

这只是第一版。接下来，内容会比功能更重要。
