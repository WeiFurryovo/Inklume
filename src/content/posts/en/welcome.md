---
title: Welcome to Inklume
pubDatetime: 2026-01-11T00:00:00Z
description: "The first Inklume entry: a bilingual writing space that is owned, portable, and built to last."
featured: true
draft: false
tags:
  - welcome
  - introduction
---

# Welcome to Inklume

Inklume is a bilingual personal publishing space for projects in progress, problems worth unpacking, and fragments of life worth keeping.

## Why Inklume

`Ink` is for writing; `lume` is for a quiet source of light. The name does not belong to a framework. It is a reminder to write the thought down first, then let it be seen.

## How this space works

Posts live as Markdown in an owned Git repository. Sveltia CMS provides the editor, Astro rebuilds both language editions after each content change, and Cloudflare Workers distributes the resulting static site.

- Chinese content lives at the site root
- English content lives under `/en/`
- Git keeps the content and its history portable
- Search, equations, and pages are generated at build time

## Math Formulas

Posts support LaTeX math embedded in Markdown, rendered at build time by KaTeX. For example, the inline mass–energy equation $E = mc^2$, and a display equation:

$$
\int_0^1 x^2 \, dx = \frac{1}{3}
$$

This is only the first edition. From here, the writing matters more than the feature list.
