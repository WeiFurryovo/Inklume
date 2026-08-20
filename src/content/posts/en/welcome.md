---
title: Welcome to Inklume
pubDatetime: 2026-01-11T00:00:00Z
description: "The Inklume project demo welcome post: bilingual content, dashboard editing, and static deployment."
featured: true
draft: false
heroImage:
  src: /inklume-og.png
  alt: Inklume
  color: "#659EB9"
tags:
  - welcome
  - introduction
---

Inklume is a bilingual Astro blog template with a Sveltia CMS dashboard. This default post demonstrates regular prose, lists, code, and mathematical notation.

## Why Inklume

`Ink` stands for writing; `lume` suggests a quiet source of light. The name puts writing first, then lets a restrained interface bring it into view.

## How this demo works

Demo posts live as Markdown in Git. Sveltia CMS provides the editor, Astro rebuilds both language editions after each content change, and Cloudflare Pages publishes the resulting static site.

- Chinese content lives at the site root
- English content lives under `/en/`
- Git keeps the content and its history portable
- Search, equations, and pages are generated at build time

## Math Formulas

Posts support LaTeX math embedded in Markdown, rendered at build time by KaTeX. For example, the inline mass–energy equation $E = mc^2$, and a display equation:

$$
\int_0^1 x^2 \, dx = \frac{1}{3}
$$

This post only demonstrates the default content presentation. Replace or delete it from the dashboard when deploying your own site.
