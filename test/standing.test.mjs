import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { compare, entryFor, distinct, titleCore, key, readRecord, writeRecord } from "../plugin/skills/stet/scripts/lib/standing.mjs";

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

test("a site that turned on a www redirect has not moved host", () => {
  assert.equal(compare(seen({ host: "example.com" }), live({ host: "www.example.com" })).tier, "none");
  assert.equal(compare(seen({ host: "www.example.com" }), live({ host: "example.com" })).tier, "none");
});

test("a genuinely different host is still loud when one of the two carries www", () => {
  const v = compare(seen({ host: "www.example.com" }), live({ host: "casino.example.net" }));
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

/* --- entryFor: what gets written back -------------------------------------
 *
 * The record is committed, so every one of these dates is a stored value somebody will read months
 * later and cannot re-derive. Each case below was a real defect first: `since` reset on every run,
 * and a failed check overwriting the source's state with a fact about the check.
 */

const ref = { url: "https://example.com/a", file: "content/page.md", line: 12, anchors: [] };
const dead = { state: "dead", status: 404 };
const nothing = { state: "unreachable", detail: "timed out" };

test("a source dead for three runs still reports the day it died", () => {
  let entry = entryFor(undefined, ref, dead, "2026-01-03");
  assert.equal(entry.since, "2026-01-03");
  entry = entryFor(entry, ref, dead, "2026-01-04");
  entry = entryFor(entry, ref, dead, "2026-01-05");
  assert.equal(entry.since, "2026-01-03");
  assert.equal(entry.lastChecked, "2026-01-05");
});

test("the date moves on the run where the state genuinely does", () => {
  const before = entryFor(undefined, ref, live(), "2026-01-01");
  assert.equal(before.since, "2026-01-01");
  const after = entryFor(before, ref, dead, "2026-02-09");
  assert.equal(after.state, "dead");
  assert.equal(after.since, "2026-02-09");
});

test("a check that failed says nothing about the source, only that it was checked", () => {
  const before = entryFor(undefined, ref, live({ title: "A page" }), "2026-02-01");
  const after = entryFor(before, ref, nothing, "2026-02-03");
  assert.equal(after.state, "live");
  assert.equal(after.since, "2026-02-01");
  assert.equal(after.lastChecked, "2026-02-03");
  assert.equal(after.title, "A page");
  assert.equal(after.digest, "aaa");
  assert.equal(after.host, "example.com");
});

test("the run after a failed check does not read as a source that just changed", () => {
  const before = entryFor(undefined, ref, live(), "2026-02-01");
  const missed = entryFor(before, ref, nothing, "2026-02-03");
  const recovered = entryFor(missed, ref, live(), "2026-02-04");
  assert.equal(recovered.state, "live");
  assert.equal(recovered.since, "2026-02-01");
  assert.equal(recovered.lastChecked, "2026-02-04");
});

test("a first sighting that could not be reached records the check and claims no state it never saw", () => {
  const entry = entryFor(undefined, ref, nothing, "2026-02-01");
  assert.equal(entry.state, "unreachable");
  assert.equal(entry.firstSeen, "2026-02-01");
  assert.equal(entry.lastChecked, "2026-02-01");
});

test("text drifting under a live page is not the state beginning again", () => {
  const before = entryFor(undefined, ref, live(), "2026-01-01");
  const after = entryFor(before, ref, live({ digest: "bbb" }), "2026-03-03");
  assert.equal(after.digest, "bbb");
  assert.equal(after.since, "2026-01-01");
});

test("what was written back is what compare reads next time, so a finding fires once", () => {
  const before = entryFor(undefined, ref, live({ title: "Old" }), "2026-01-01");
  const after = entryFor(before, ref, live({ title: "Domain for sale" }), "2026-03-03");
  assert.equal(compare(before, live({ title: "Domain for sale" })).verdict, "title changed");
  assert.equal(compare(after, live({ title: "Domain for sale" })).tier, "none");
});

test("the anchors written back are the ones the citing paragraph quotes today", () => {
  const before = entryFor(undefined, ref, live(), "2026-01-01");
  const quoting = { ...ref, anchors: ["a quoted sentence of some length"] };
  const after = entryFor(before, quoting, live(), "2026-03-03");
  assert.deepEqual(after.anchors, ["a quoted sentence of some length"]);
  assert.equal(after.file, "content/page.md");
  assert.equal(after.line, 12);
});

test("titleCore strips one trailing site name and nothing else", () => {
  assert.equal(titleCore("A page | Some Site"), "A page");
  assert.equal(titleCore("A page"), "A page");
  assert.equal(titleCore("  A   page  "), "A page");
});

test("a source cited from three files is one source and one check", () => {
  const out = distinct([
    { doi: "10.1000/a", file: "one.md", line: 3 },
    { doi: "10.1000/a", file: "two.md", line: 9 },
    { doi: "10.1000/a", file: "one.md", line: 40 },
    { url: "https://example.com/a", file: "two.md", line: 1, anchors: [] },
  ]);
  assert.equal(out.length, 2);
  assert.equal(out[0].file, "one.md");
  assert.equal(out[0].line, 3);
  assert.equal(out[0].others, 1);
  assert.equal(out[1].others, 0);
});

test("every citing paragraph's anchors are checked, not only the first one's", () => {
  const [only] = distinct([
    { url: "https://example.com/a", file: "one.md", line: 1, anchors: ["a quoted sentence of some length"] },
    {
      url: "https://example.com/a",
      file: "two.md",
      line: 2,
      anchors: ["another quoted sentence entirely", "a quoted sentence of some length"],
    },
  ]);
  assert.deepEqual(only.anchors, ["a quoted sentence of some length", "another quoted sentence entirely"]);
});

test("what goes into the record from a deduplicated source is the entry, with no bookkeeping on it", () => {
  const [only] = distinct([
    { url: "https://example.com/a", file: "one.md", line: 1, anchors: [] },
    { url: "https://example.com/a", file: "two.md", line: 2, anchors: [] },
  ]);
  const entry = entryFor(undefined, only, live(), "2026-01-01");
  assert.equal(entry.file, "one.md");
  assert.equal(entry.others, undefined);
  assert.equal(entry.files, undefined);
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
