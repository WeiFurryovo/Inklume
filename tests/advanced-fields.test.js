import assert from "node:assert/strict";
import test from "node:test";
import { mergeAdvancedFields } from "../src/utils/mergeAdvancedFields.js";

test("empty or null advanced objects preserve legacy frontmatter", () => {
  for (const advanced of [undefined, null, {}]) {
    assert.deepEqual(
      mergeAdvancedFields({ title: "Post", timezone: "UTC", advanced }),
      {
        title: "Post",
        timezone: "UTC",
      }
    );
  }
});

test("advanced metadata overrides legacy fields without dropping other content", () => {
  assert.deepEqual(
    mergeAdvancedFields({
      title: "Post",
      tags: ["welcome"],
      timezone: "UTC",
      hideEditPost: true,
      advanced: { timezone: "Asia/Singapore", hideEditPost: false },
    }),
    {
      title: "Post",
      tags: ["welcome"],
      timezone: "Asia/Singapore",
      hideEditPost: false,
    }
  );
});

test("missing advanced values preserve legacy metadata and explicit null overrides it", () => {
  assert.deepEqual(
    mergeAdvancedFields({
      ogImage: "/existing.png",
      modDatetime: new Date("2026-01-01T00:00:00Z"),
      advanced: { ogImage: undefined, modDatetime: null },
    }),
    { ogImage: "/existing.png", modDatetime: null }
  );
  assert.deepEqual(
    mergeAdvancedFields({ canonicalURL: "https://example.com/post" }),
    { canonicalURL: "https://example.com/post" }
  );
});
