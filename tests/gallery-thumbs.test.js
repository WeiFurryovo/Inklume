import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import {
  access,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import test from "node:test";
import sharp from "sharp";

const execFileAsync = promisify(execFile);
const generator = fileURLToPath(
  new URL("../scripts/generate-gallery-thumbs.mjs", import.meta.url)
);

async function fixture(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), "gallery-thumbs-test-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, "src/content/posts"), { recursive: true });
  await mkdir(path.join(root, "public/uploads"), { recursive: true });
  await writeFile(
    path.join(root, "astro-paper.config.ts"),
    "export default { features: { gallery: { enabled: true, imageDomains: [] } } };\n"
  );
  return root;
}

const runGenerator = (root, ...args) =>
  execFileAsync(process.execPath, [generator, ...args], {
    cwd: root,
    env: { ...process.env, GALLERY_CONCURRENCY: "1" },
    timeout: 30_000,
  });

const readManifest = async root =>
  JSON.parse(
    await readFile(path.join(root, "src/data/gallery-manifest.json"), "utf8")
  );

const writePost = (root, name, gallery, body) =>
  writeFile(
    path.join(root, "src/content/posts", `${name}.md`),
    `---\ntitle: Example\ngallery: ${gallery}\n---\n${body}\n`
  );

async function writeImage(file, width = 60, height = 90) {
  await sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 32, g: 180, b: 100 },
    },
  })
    .withExif({ IFD0: { Make: "Test Camera", Model: "Portrait" } })
    .jpeg()
    .toFile(file);
}

test("local gallery images generate real dimensions and refresh when replaced", async t => {
  const root = await fixture(t);
  const source = path.join(root, "public/uploads/portrait photo.jpg");
  const url = "/uploads/portrait%20photo.jpg?version=1#full";
  await writeImage(source);
  await writePost(root, "portrait", "true", `![Portrait](${url})`);

  const first = await runGenerator(root);
  assert.match(first.stdout, /1 generated, 0 skipped, 0 failed/);
  const original = (await readManifest(root))[url];
  assert.equal(original.width, 60);
  assert.equal(original.height, 90);
  assert.equal(original.exif.make, "Test Camera");
  assert.match(original.sourceHash, /^[a-f0-9]{64}$/);
  const thumbnail = path.join(root, "public/gallery/thumbs", original.thumb);
  const thumbnailMeta = await sharp(thumbnail).metadata();
  assert.equal(thumbnailMeta.format, "heif");
  assert.equal(thumbnailMeta.width, 60);
  assert.equal(thumbnailMeta.height, 90);

  const second = await runGenerator(root, "--prune");
  assert.match(second.stdout, /0 generated, 1 skipped, 0 failed/);
  assert.deepEqual((await readManifest(root))[url], original);

  await writeImage(source, 90, 60);
  const replaced = await runGenerator(root);
  assert.match(replaced.stdout, /1 generated, 0 skipped, 0 failed/);
  const updated = (await readManifest(root))[url];
  assert.equal(updated.width, 90);
  assert.equal(updated.height, 60);
  assert.notEqual(updated.sourceHash, original.sourceHash);
  assert.equal(updated.thumb, original.thumb);
  assert.equal((await sharp(thumbnail).metadata()).width, 90);

  await rm(source);
  await assert.rejects(runGenerator(root, "--prune"), { code: 1 });
  assert.deepEqual((await readManifest(root))[url], updated);
  await access(thumbnail);

  await writePost(root, "portrait", "true", "No images remain.");
  await runGenerator(root, "--prune");
  assert.deepEqual(await readManifest(root), {});
  await assert.rejects(access(thumbnail), { code: "ENOENT" });
});

test("YAML comments preserve gallery images during generation and pruning", async t => {
  const root = await fixture(t);
  const url = "/uploads/comment.jpg";
  await writeImage(path.join(root, "public/uploads/comment.jpg"));
  await writePost(root, "comment", "true # include album", `![Photo](${url})`);
  await writePost(root, "disabled", "false", "![Missing](/uploads/false.jpg)");
  await writePost(root, "string", '"true"', "![Missing](/uploads/string.jpg)");

  const first = await runGenerator(root);
  assert.match(first.stdout, /1 generated, 0 skipped, 0 failed/);
  const original = await readManifest(root);
  assert.deepEqual(Object.keys(original), [url]);
  const second = await runGenerator(root, "--prune");
  assert.match(second.stdout, /0 generated, 1 skipped, 0 failed/);
  assert.deepEqual(await readManifest(root), original);
  await access(path.join(root, "public/gallery/thumbs", original[url].thumb));

  await writePost(root, "malformed", "[invalid YAML", "");
  await assert.rejects(runGenerator(root, "--prune"), { code: 1 });
  assert.deepEqual(await readManifest(root), original);
  await access(path.join(root, "public/gallery/thumbs", original[url].thumb));

  await rm(path.join(root, "src/content/posts"), { recursive: true });
  await assert.rejects(runGenerator(root, "--prune"), { code: 1 });
  assert.deepEqual(await readManifest(root), original);
  await access(path.join(root, "public/gallery/thumbs", original[url].thumb));
});

test("local gallery sources cannot escape public through traversal or symlinks", async t => {
  const root = await fixture(t);
  const outside = path.join(root, "public-backup");
  await mkdir(outside);
  await writeImage(path.join(outside, "outside.jpg"));
  await writeImage(path.join(root, "public/uploads/safe.jpg"));
  await symlink("safe.jpg", path.join(root, "public/uploads/alias.jpg"));
  await symlink(
    path.join(outside, "outside.jpg"),
    path.join(root, "public/uploads/linked.jpg")
  );
  await symlink(outside, path.join(root, "public/escaped-dir"), "dir");
  const invalid = [
    "/../public-backup/outside.jpg",
    "/%2e%2e/public-backup/outside.jpg",
    "/uploads/%2e%2e%2f%2e%2e%2fpublic-backup/outside.jpg",
    "/uploads/linked.jpg",
    "/escaped-dir/outside.jpg",
  ];
  const valid = ["/uploads/safe.jpg", "/uploads/alias.jpg"];
  await writePost(
    root,
    "paths",
    "true",
    [...valid, ...invalid].map(url => `![Photo](${url})`).join("\n")
  );

  await assert.rejects(runGenerator(root), error => {
    assert.equal(error.code, 1);
    assert.match(error.stdout, /2 generated, 0 skipped, 5 failed/);
    assert.match(error.stderr, /Local gallery image must stay inside public/);
    return true;
  });
  assert.deepEqual(Object.keys(await readManifest(root)), [...valid].sort());
  assert.equal(
    (await readdir(path.join(root, "public/gallery/thumbs"))).length,
    2
  );
  await access(path.join(outside, "outside.jpg"));
});
