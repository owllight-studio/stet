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
