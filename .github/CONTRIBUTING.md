# Contributing to Inklume

Inklume is a personal adaptation of AstroPages-Bilingual. The project keeps
the upstream license and attribution; see the repository README before making
changes to shared theme code.

## Issues and Discussions

Use the repository issue templates for bugs, documentation changes, and
feature requests. Include a minimal reproduction, the affected route, and the
expected behavior whenever possible.

## Pull Requests

Keep pull requests focused and explain why the change is needed. Before
opening a pull request, run the checks documented in the README:

```text
npm run check
npm run type-check
npm run lint
npm run format:check
npm run build
```

Content changes should preserve the matching `zh/` and `en/` structure when a
translation exists. Do not remove upstream license or attribution notices.
