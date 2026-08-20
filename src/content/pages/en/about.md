---
title: "About"
description: "The Inklume project demo and feature overview."
aboutModules:
  motto:
    text: "Keep the writing at the center."
    spoiler: "The interface only makes the content easier to reach."
  cta:
    label: "View Inklume source"
    href: "https://github.com/WeiFurryovo/Inklume"
  siteStack:
    title: "Demo Stack"
    description: "The framework, theme, and services behind the Inklume project demo:"
    groupLabel: "Stack"
    items:
      - name: "Astro"
        description: "Static site framework"
        icon: "astro"
        href: "https://astro.build/"
      - name: "Astro Theme Pure"
        description: "Blog theme"
        icon: "pure"
        href: "https://github.com/cworld1/astro-theme-pure"
      - name: "Sveltia CMS"
        description: "Content management"
        icon: "sveltia"
        href: "https://github.com/sveltia/sveltia-cms"
      - name: "Cloudflare Pages"
        description: "Build and hosting"
        icon: "cloudflare"
        href: "https://pages.cloudflare.com/"
      - name: "Pagefind"
        description: "Static site search"
        icon: "pagefind"
        href: "https://pagefind.app/"
      - name: "GitHub"
        description: "Source and version control"
        icon: "github"
        href: "https://github.com/WeiFurryovo/Inklume"
  social:
    title: "GitHub Stats Demo"
    description: "This card uses public GitHub data from the project maintainer to demonstrate the Substats integration."
    items:
      - platform: "GitHub"
        icon: "github"
        href: "https://github.com/WeiFurryovo"
        metric: "followers"
        api: "github/WeiFurryovo"
  notes:
    title: "Publishing"
    summary: "How content moves from the dashboard to the site"
    body: "Content is stored in Git and edited with Sveltia CMS. Astro generates static pages, then Cloudflare Pages rebuilds and publishes them after every commit."
  timeline:
    title: "Project History"
    description: "A short development history of Inklume:"
    items:
      - date: "2026-07-19"
        content: "Initialized Inklume as a bilingual blog."
      - date: "2026-07-21"
        content: "Integrated Sveltia CMS authentication into the same Cloudflare Pages project."
      - date: "2026-07-24"
        content: "Fully aligned the frontend with the official Astro Theme Pure demo."
      - date: "2026-08-21"
        content: "Added dashboard-managed site icons and footer settings."
---

Inklume is a bilingual Astro blog template with an integrated dashboard. This site is the project demo for its default theme, content structure, and publishing workflow.

Chinese demo content lives at the site root and English demo content under `/en/`. Use the language switch in the header to move between the two.

## Principles

- Keep content portable as plain Markdown
- Give Chinese and English a shared structure without forcing identical prose
- Treat the bundled posts and gallery as replaceable example content
- Keep the interface fast and quiet so the writing stays central
- Build with Astro and publish through Cloudflare Pages
