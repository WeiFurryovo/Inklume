import assert from "node:assert/strict";
import test from "node:test";

import { getTranslatedPostUrl } from "../src/i18n/getTranslatedPostUrl.js";

test("Unicode post slugs match their translated URLs in both languages", () => {
  for (const prefix of ["/posts/", "/en/posts/"]) {
    const translationUrl = `${prefix}\u4f60\u597d/`;
    const alternateUrl = new URL(translationUrl, "https://blog.example")
      .pathname;

    assert.notEqual(alternateUrl, translationUrl);
    assert.equal(
      getTranslatedPostUrl(alternateUrl, [translationUrl], prefix),
      translationUrl
    );
  }
});

test("translation matching normalizes trailing slashes and escape casing", () => {
  assert.equal(
    getTranslatedPostUrl(
      "/en/posts/%e4%bd%a0%e5%a5%bd",
      ["/en/posts/\u4f60\u597d/"],
      "/en/posts/"
    ),
    "/en/posts/\u4f60\u597d/"
  );
  assert.equal(
    getTranslatedPostUrl(
      "/en/posts/welcome/",
      ["/en/posts/welcome"],
      "/en/posts/"
    ),
    "/en/posts/welcome"
  );
});

test("translation links retain the deployment base", () => {
  assert.equal(
    getTranslatedPostUrl(
      "/blog/en/posts/%E4%BD%A0%E5%A5%BD/",
      ["/blog/en/posts/\u4f60\u597d/"],
      "/blog/en/posts/"
    ),
    "/blog/en/posts/\u4f60\u597d/"
  );
});

test("missing translations fall back to the target language post list", () => {
  assert.equal(
    getTranslatedPostUrl(
      "/blog/en/posts/missing/",
      ["/blog/en/posts/welcome/", "/en/posts/missing/"],
      "/blog/en/posts/"
    ),
    "/blog/en/posts/"
  );
});
