import { test } from "node:test";
import assert from "node:assert/strict";
import { nameKind, config, findContent } from "../plugin/skills/stet/scripts/lib/find.mjs";

/*
 * The case this exists for.
 *
 * A file called VOICE.md.new sat tracked in this repository carrying Stet metadata, holding a voice
 * somebody had chosen on a proof sheet, and no check in the project could see it. doctor has a
 * check written for exactly that shape, and it filtered on the name ending in a content extension,
 * so it could never fire on a name with something appended.
 */

test("an ordinary content name is content", () => {
  for (const n of ["VOICE.md", "index.html", "data.json", "page.mdx", "notes.markdown"]) {
    assert.equal(nameKind(n), "content", n);
  }
});

test("a content name with something appended is a copy", () => {
  for (const n of ["VOICE.md.new", "index.html.bak", "spec.md.orig", "data.json.tmp"]) {
    assert.equal(nameKind(n), "copy", n);
  }
});

test("a file that is neither is neither", () => {
  for (const n of ["script.mjs", "stet.css", "Makefile", "photo.png", "archive.tar.gz"]) {
    assert.equal(nameKind(n), null, n);
  }
});

test("the extension is matched case insensitively", () => {
  assert.equal(nameKind("README.MD"), "content");
  assert.equal(nameKind("VOICE.MD.NEW"), "copy");
});

test("a sidecar is not mistaken for a copy of the file it describes", () => {
  /* index.html.stet.yaml is a real sidecar this project writes, and yaml is itself a content
     extension, so it must read as content rather than as an abandoned copy. */
  assert.equal(nameKind("index.html.stet.yaml"), "content");
});

/* Malformed config and malformed records. Both of these threw a stack trace where a report was
   asked for, and both were found by an agent fuzzing the commands rather than by a test. */

import { mkdtempSync as mkT, writeFileSync as wF, mkdirSync as mkD } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir as tmp } from "node:os";
import { join as j } from "node:path";
import { matchesAny } from "../plugin/skills/stet/scripts/lib/glob.mjs";
import { read as readRecord } from "../plugin/skills/stet/scripts/lib/meta.mjs";

test("content written as one glob string, not a list, still matches", () => {
  assert.equal(matchesAny("docs/a.md", "docs/**/*.md"), true);
  assert.equal(matchesAny("src/a.js", "docs/**/*.md"), false);
});

test("content written as neither a string nor a list matches nothing, and does not throw", () => {
  assert.equal(matchesAny("docs/a.md", null), false);
  assert.equal(matchesAny("docs/a.md", 7), false);
  assert.equal(matchesAny("docs/a.md", { docs: true }), false);
});

test("sources written as a scalar is read as a list of one", () => {
  const root = mkT(j(tmp(), "stet-meta-"));
  wF(j(root, "a.md"), "---\nstet:\n  state: approved\n  policy: refresh\n  sources: corpus.runs\n---\n\nx\n");
  assert.deepEqual(readRecord(root, "a.md").sources, ["corpus.runs"]);
});

test("a directory where a file was expected returns no record rather than throwing", () => {
  const root = mkT(j(tmp(), "stet-dir-"));
  mkD(j(root, "site"));
  assert.equal(readRecord(root, "site"), null);
});

test("a content glob written as a string reaches every consumer as a list", () => {
  const root = mkT(j(tmp(), "stet-cfg-"));
  wF(j(root, "stet.config.json"), JSON.stringify({ content: "*.md", prose: "*.md" }));
  wF(j(root, "a.md"), "# a\n\nSome words here.\n");
  const cfg = config(root);
  assert.deepEqual(cfg.content, ["*.md"]);
  assert.deepEqual(cfg.prose, ["*.md"]);
  assert.deepEqual(findContent(root).files, ["a.md"]);
});

test("a content glob that is neither a string nor a list becomes no globs, and nothing throws", () => {
  const root = mkT(j(tmp(), "stet-cfg2-"));
  wF(j(root, "stet.config.json"), JSON.stringify({ content: 7 }));
  wF(j(root, "a.md"), "# a\n");
  assert.deepEqual(config(root).content, []);
  assert.deepEqual(findContent(root).files, []);
});

test("owner honours the unlock record, the same file the hook reads", () => {
  const root = mkT(j(tmp(), "stet-unlock-"));
  wF(j(root, "stet.config.json"), JSON.stringify({ content: ["*.md"] }));
  wF(j(root, "a.md"), "---\nstet:\n  state: approved\n---\n\nClosed words.\n");
  const script = j(import.meta.dirname, "..", "plugin", "skills", "stet", "scripts", "owner.mjs");

  let closed = 0;
  try { execFileSync(process.execPath, [script, "a.md"], { cwd: root, encoding: "utf8" }); }
  catch (e) { closed = e.status; }
  assert.equal(closed, 1, "approved content answers no");

  mkD(j(root, ".stet"), { recursive: true });
  wF(j(root, ".stet", "admin.json"), JSON.stringify({ unlocked: { "a.md": { reason: "fixing a false figure" } } }));
  const out = execFileSync(process.execPath, [script, "a.md"], { cwd: root, encoding: "utf8" });
  assert.match(out, /^YES/m, "an unlocked file answers yes, because the hook would let it through");
  assert.match(out, /fixing a false figure/, "and it says why it was opened");
});

test("the hook still guards content declared as one glob string", async () => {
  const root = mkT(j(tmp(), "stet-hook-"));
  wF(j(root, "stet.config.json"), JSON.stringify({ content: "*.md" }));
  wF(j(root, "a.md"), "---\nstet:\n  state: approved\n---\n\nClosed.\n");
  const hook = j(import.meta.dirname, "..", "plugin", "skills", "stet", "scripts", "hook-before-edit.mjs");
  const input = JSON.stringify({ cwd: root, tool_name: "Edit", tool_input: { file_path: j(root, "a.md") } });
  const out = execFileSync(process.execPath, [hook], { cwd: root, input, encoding: "utf8" });
  assert.match(out, /deny/, "a string content must still protect, not silently guard nothing");
});

test("policy honours the unlock record too, so it cannot disagree with the hook", () => {
  const root = mkT(j(tmp(), "stet-pol-"));
  wF(j(root, "stet.config.json"), JSON.stringify({ content: ["*.md"] }));
  wF(j(root, "a.md"), "---\nstet:\n  state: approved\n---\n\nClosed.\n");
  const script = j(import.meta.dirname, "..", "plugin", "skills", "stet", "scripts", "policy.mjs");

  const closed = execFileSync(process.execPath, [script, "a.md"], { cwd: root, encoding: "utf8" });
  assert.match(closed, /may not touch/);

  mkD(j(root, ".stet"), { recursive: true });
  wF(j(root, ".stet", "admin.json"), JSON.stringify({ unlocked: { "a.md": { reason: "a false figure" } } }));
  const open = execFileSync(process.execPath, [script, "a.md"], { cwd: root, encoding: "utf8" });
  assert.match(open, /unlocked/);
  assert.match(open, /a false figure/);
});
