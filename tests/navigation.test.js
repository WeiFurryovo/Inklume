import assert from "node:assert/strict";
import test from "node:test";

import { resolveNavigationHref } from "../src/utils/resolveNavigationHref.js";

test("relative navigation localizes only the pathname", () => {
  for (const prefix of ["/", "/en/", "/blog/en/"]) {
    const localizePath = pathname => {
      assert.doesNotMatch(pathname, /[?#]/);
      return `${prefix}${pathname.replace(/\/+$/, "")}/`;
    };

    for (const [input, expected] of [
      ["posts", "posts/"],
      ["about#site-stack", "about/#site-stack"],
      ["about/#site-stack", "about/#site-stack"],
      ["search?q=Astro", "search/?q=Astro"],
      [
        "search?q=Astro%20CMS&tag=a%2Fb#results",
        "search/?q=Astro%20CMS&tag=a%2Fb#results",
      ],
      ["rss.xml", "rss.xml"],
      ["rss.xml?format=full#feed", "rss.xml?format=full#feed"],
    ]) {
      assert.deepEqual(resolveNavigationHref(input, localizePath, "/blog/"), {
        href: prefix + expected,
        external: false,
      });
    }
  }
});

test("root-relative and external navigation retain their URL semantics", () => {
  const unexpectedLocalization = () => assert.fail("URL must not be localized");

  for (const [input, expected, external] of [
    ["/about#site-stack", "/blog/about#site-stack", false],
    ["/search?q=Astro", "/blog/search?q=Astro", false],
    ["/rss.xml", "/blog/rss.xml", false],
    [
      "https://example.com/docs?q=a%2Fb#part",
      "https://example.com/docs?q=a%2Fb#part",
      true,
    ],
  ]) {
    assert.deepEqual(
      resolveNavigationHref(input, unexpectedLocalization, "/blog/"),
      { href: expected, external }
    );
  }
});
