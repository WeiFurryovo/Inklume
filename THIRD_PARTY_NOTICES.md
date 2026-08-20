# Third-party notices

## Astro Theme Pure

Inklume uses the `astro-pure` package from [cworld1/astro-theme-pure](https://github.com/cworld1/astro-theme-pure), pinned to version `1.4.6`.

The package is distributed under the Apache License 2.0. Its source and license are available at:

- <https://github.com/cworld1/astro-theme-pure>
- <https://github.com/cworld1/astro-theme-pure/blob/main/LICENSE>

Inklume keeps its own MIT license for the project code derived from AstroPages-Bilingual. The Pure package is consumed as an npm dependency; local Inklume components adapt its visual system to the site's bilingual routes and content model.

The About page's local `ToolSection` is adapted from the upstream demo component and modified to accept Sveltia CMS icon keys:

- <https://github.com/cworld1/astro-theme-pure/blob/main/src/components/about/ToolSection.astro>

## About page brand assets

The About page uses the following upstream SVG assets solely to identify software used by this project. Both source repositories distribute these files under the MIT License.

- Astro favicon: <https://github.com/withastro/astro/blob/main/examples/basics/public/favicon.svg>
- Astro license: <https://github.com/withastro/astro/blob/main/LICENSE>
- Sveltia CMS logo: <https://github.com/sveltia/sveltia-cms/blob/main/src/lib/assets/sveltia-logo.svg>
- Sveltia CMS license: <https://github.com/sveltia/sveltia-cms/blob/main/LICENSE.txt>

## Sveltia CMS Authenticator

The Pages Functions OAuth flow is adapted from [sveltia/sveltia-cms-auth](https://github.com/sveltia/sveltia-cms-auth), distributed under the MIT License.

- <https://github.com/sveltia/sveltia-cms-auth>
- <https://github.com/sveltia/sveltia-cms-auth/blob/main/LICENSE.txt>

```text
MIT License

Copyright (c) 2026 Kohei Yoshino.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
