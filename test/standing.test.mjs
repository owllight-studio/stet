import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { compare, titleCore, key, readRecord, writeRecord } from "../plugin/skills/stet/scripts/lib/standing.mjs";

const live = (over = {}) => ({ state: "live", host: "example.com", title: "A page", digest: "aaa", anchors: [], ...over });
const seen = (over = {}) => ({ state: "live", host: "example.com", title: "A page", digest: "aaa", anchors: [], since: "2026-03-03", ...over });

test("a reference nobody has seen before is not a finding", () => {
  const v = compare(undefined, live());
  assert.equal(v.tier, "none");
  assert.equal(v.verdict, "first sight");
});

test("a dead URL is loud on the first run, because it is already broken", () => {
  const v = compare(undefined, { state: "dead", status: 404 });
  assert.equal(v.tier, "loud");
  assert.equal(v.verdict, "dead");
});

test("a DOI Crossref has no record of is loud", () => {
  const v = compare(undefined, { state: "not found" });
  assert.equal(v.tier, "loud");
  assert.equal(v.verdict, "not found");
});

test("no answer is its own tier, never silence and never a failure", () => {
  const v = compare(seen(), { state: "unreachable", detail: "timed out" });
  assert.equal(v.tier, "unknown");
  assert.equal(v.verdict, "could not check");
});

test("unreachable outranks everything, because a timeout must never be reported as a source that moved", () => {
  const v = compare(seen({ host: "example.com" }), {
    state: "unreachable",
    detail: "timed out",
    status: 404,
    host: "casino.example.net",
  });
  assert.equal(v.tier, "unknown");
  assert.equal(v.verdict, "could not check");
});

test("a page that now redirects to another host is loud", () => {
  const v = compare(seen(), live({ host: "casino.example.net" }));
  assert.equal(v.tier, "loud");
  assert.equal(v.verdict, "moved host");
});

test("a dead URL outranks a moved host, because dead is checked before the host is compared", () => {
  const v = compare(seen({ host: "example.com" }), {
    state: "dead",
    status: 404,
    host: "casino.example.net",
  });
  assert.equal(v.tier, "loud");
  assert.equal(v.verdict, "dead");
});

test("a quoted anchor that is no longer on the page is loud", () => {
  const v = compare(seen({ anchors: ["more than 70% of the URLs"] }), live({
    anchors: [{ text: "more than 70% of the URLs", present: false }],
  }));
  assert.equal(v.tier, "loud");
  assert.equal(v.verdict, "anchor gone");
  assert.match(v.detail, /more than 70% of the URLs/);
});

test("a site name appended to every title is not a source that moved", () => {
  const v = compare(seen({ title: "Perma: Scoping and Addressing the Problem" }), live({
    title: "Perma: Scoping and Addressing the Problem | Harvard Law Review",
  }));
  assert.equal(v.tier, "none");
});

test("a title that really changed is loud", () => {
  const v = compare(seen({ title: "Perma: Scoping the Problem" }), live({ title: "Domain for sale" }));
  assert.equal(v.tier, "loud");
  assert.equal(v.verdict, "title changed");
});

test("an anchor gone outranks a title change, because the anchor is what the claim rests on", () => {
  const v = compare(seen({ title: "Old", anchors: ["a quoted sentence of some length"] }), live({
    title: "New",
    anchors: [{ text: "a quoted sentence of some length", present: false }],
  }));
  assert.equal(v.verdict, "anchor gone");
});

test("the text moving on its own is quiet", () => {
  const v = compare(seen(), live({ digest: "bbb" }));
  assert.equal(v.tier, "quiet");
  assert.equal(v.verdict, "drifted");
});

test("nothing moved, nothing is said", () => {
  assert.equal(compare(seen(), live()).tier, "none");
});

test("a DOI retracted since last time is loud and names the notice", () => {
  const v = compare({ state: "current", since: "2026-03-03" }, {
    state: "retracted",
    retraction: "10.1000/notice",
  });
  assert.equal(v.tier, "loud");
  assert.equal(v.verdict, "retracted");
  assert.match(v.detail, /10\.1000\/notice/);
});

test("a retracted DOI outranks a title change, because retraction is checked before any title is compared", () => {
  const v = compare({ state: "current", since: "2026-03-03", title: "Old Title" }, {
    state: "retracted",
    retraction: "10.1000/notice",
    title: "New Title",
  });
  assert.equal(v.tier, "loud");
  assert.equal(v.verdict, "retracted");
});

test("an expression of concern is loud and says what the concern is", () => {
  const v = compare(seen(), { state: "flagged", concern: "a data availability dispute" });
  assert.equal(v.tier, "loud");
  assert.equal(v.verdict, "flagged");
  assert.equal(v.detail, "a data availability dispute");
});

test("a preprint whose version of record appeared is loud", () => {
  const v = compare({ state: "current", since: "2026-03-03" }, { state: "superseded", published: "10.1000/vor" });
  assert.equal(v.tier, "loud");
  assert.equal(v.verdict, "superseded");
});

test("titleCore strips one trailing site name and nothing else", () => {
  assert.equal(titleCore("A page | Some Site"), "A page");
  assert.equal(titleCore("A page"), "A page");
  assert.equal(titleCore("  A   page  "), "A page");
});

test("a DOI and a URL cannot collide in the record", () => {
  assert.equal(key({ doi: "10.1162/qss_a_00155" }), "doi:10.1162/qss_a_00155");
  assert.equal(key({ url: "https://example.com/a" }), "url:https://example.com/a");
});

test("reading a record that was never written returns the empty shape", () => {
  const root = mkdtempSync(join(tmpdir(), "standing-"));
  try {
    assert.deepEqual(readRecord(root), { version: 1, refs: {} });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("a record written then read back keeps the same refs", () => {
  const root = mkdtempSync(join(tmpdir(), "standing-"));
  try {
    const refs = {
      "doi:10.1000/example": {
        state: "current",
        title: "A paper",
        digest: "aaa",
        host: "example.com",
        anchors: [],
        firstSeen: "2026-01-01",
        lastChecked: "2026-03-03",
        since: "2026-01-01",
        file: "content/a.md",
        line: 12,
      },
    };
    writeRecord(root, { refs });
    assert.deepEqual(readRecord(root).refs, refs);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("a record written to a fresh directory ends the file with a newline", () => {
  const root = mkdtempSync(join(tmpdir(), "standing-"));
  try {
    writeRecord(root, { refs: {} });
    const raw = readFileSync(join(root, ".stet", "standing.json"), "utf8");
    assert.equal(raw.endsWith("\n"), true);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("a record file that is not valid JSON reads back empty and marked unreadable, rather than throwing", () => {
  const root = mkdtempSync(join(tmpdir(), "standing-"));
  try {
    mkdirSync(join(root, ".stet"), { recursive: true });
    writeFileSync(join(root, ".stet", "standing.json"), "{not valid json");
    const record = readRecord(root);
    assert.deepEqual(record.refs, {});
    assert.equal(record.unreadable, true);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
