import { test } from "node:test";
import assert from "node:assert/strict";
import { nameKind } from "../plugin/skills/stet/scripts/lib/find.mjs";

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
