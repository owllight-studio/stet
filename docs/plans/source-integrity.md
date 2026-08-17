---
stet:
  state: draft
  author: agent
---

# Source integrity implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `stet standing`, a monitor that remembers what every cited source was last time and reports only what moved, plus the agent that decides what to do about a source that moved.

**Architecture:** Three layers with a hard seam between them. `lib/standing.mjs` holds the record and one pure function from previous state plus current observation to a verdict, and it touches no network. `lib/citations.mjs` knows what a reference is and how to look at one, and it owns every network call. `standing.mjs` orchestrates, reports and exits. The agent runs only on what the monitor made loud.

**Tech Stack:** Node 20 or newer, zero dependencies, ES modules. Tests use the built-in `node:test` runner and `node:assert/strict`. Network calls use global `fetch` with `AbortSignal.timeout`. Crossref for DOIs, the Wayback CDX API for reading snapshots, Save Page Now for writing them.

**Spec:** `docs/source-integrity.md`

## Global Constraints

- **No em dashes anywhere**, including code comments and commit messages. Where a regex has to match one, write it as the escape `\u2014` rather than as the character, so the file itself stays clean.
- **Zero dependencies.** Nothing enters `package.json` except the test script change in Task 1.
- **British spelling in prose**, `-ise` and `-our`, no serial comma, `percent` written as a word, figures in numerals.
- **Every figure carries its source.** No claim ships without a primary source read directly. The 1.36-year retraction lag is not verifiable and must not appear anywhere.
- **One request at a time** against every third-party API. These are free public services and a burst from a whole bibliography is how a project gets rate limited for everybody.
- **Scripts ship to npm.** `package.json` `files` includes `plugin/skills/stet/scripts` wholesale, so no test file may live there. Tests go in `test/`, which is not in `files`.
- **Report what you did not do.** Every section of output that skipped something says what it skipped.

## File Structure

| File | Responsibility |
|---|---|
| `plugin/skills/stet/scripts/lib/standing.mjs` | The record on disk, and the pure state machine. No network, no content parsing. |
| `plugin/skills/stet/scripts/lib/citations.mjs` | What a reference is: extraction from text, and observation of one over the network. Shared by `cite` and `standing` so they cannot disagree. |
| `plugin/skills/stet/scripts/standing.mjs` | The command. Orchestration, the report, the exit code, the `archive` subcommand. |
| `plugin/skills/stet/scripts/cite.mjs` | Refactored onto `lib/citations.mjs`. Behaviour unchanged. |
| `plugin/skills/stet/reference/standing.md` | The reference document, which is what `stet help standing` prints. |
| `plugin/agents/stet-source-integrity.md` | The agent. |
| `test/standing.test.mjs` | The state machine, every transition. |
| `test/citations.test.mjs` | Extraction and the observation helpers. |

---

### Task 1: The record and the state machine

The pure core, built first because everything else is arranged around it and because it is the only part that can be tested without a network.

**Files:**
- Create: `plugin/skills/stet/scripts/lib/standing.mjs`
- Create: `test/standing.test.mjs`
- Modify: `package.json` (the `test` script)
- Modify: `.gitignore` (narrow the `.stet/` rule)
- Modify: `CLAUDE.md` (the line that says there is no test framework)

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `readRecord(root) -> { version: 1, refs: Record<string, Entry> }`
  - `writeRecord(root, record) -> void`
  - `key(ref) -> string`, `"doi:10.1162/qss_a_00155"` or `"url:https://example.com/a"`
  - `compare(previous: Entry | undefined, now: Observation) -> { tier, verdict, detail }`
  - `titleCore(title: string) -> string`
  - Tier constants `LOUD`, `QUIET`, `UNKNOWN`, `NONE` with values `"loud"`, `"quiet"`, `"unknown"`, `"none"`.
  - `Entry` is `{ state, title, digest, host, anchors: string[], firstSeen, lastChecked, since, file, line, snapshot?, snapshotAt? }`, all dates ISO `YYYY-MM-DD`.
  - `Observation` is `{ state, status?, detail?, host?, title?, digest?, anchors?: {text, present}[], retraction?, concern?, published? }` where `state` is one of `live`, `dead`, `unreachable`, `current`, `not found`, `retracted`, `flagged`, `superseded`.

- [ ] **Step 1: Write the failing tests**

Create `test/standing.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { compare, titleCore, key } from "../plugin/skills/stet/scripts/lib/standing.mjs";

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

test("no answer is its own tier, never silence and never a failure", () => {
  const v = compare(seen(), { state: "unreachable", detail: "timed out" });
  assert.equal(v.tier, "unknown");
  assert.equal(v.verdict, "could not check");
});

test("a page that now redirects to another host is loud", () => {
  const v = compare(seen(), live({ host: "casino.example.net" }));
  assert.equal(v.tier, "loud");
  assert.equal(v.verdict, "moved host");
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
```

- [ ] **Step 2: Run the tests and watch them fail**

Run: `node --test test/standing.test.mjs`
Expected: every test fails with `Cannot find module .../lib/standing.mjs`.

- [ ] **Step 3: Write the implementation**

Create `plugin/skills/stet/scripts/lib/standing.mjs`:

```js
/**
 * What every cited source was last time, and what changed since.
 *
 * This file holds the whole state machine and touches no network, which is the point of it. Whether
 * a page is reachable is a question for the world; whether what came back means anything is a
 * question with a fixed answer, and a fixed answer is a thing you can test in a millisecond.
 *
 * Two tiers, and the split is the design rather than a detail. Loud is what cannot be innocent.
 * Quiet is the page's text moving on its own, which happens to 76.35 percent of references with a
 * snapshot (Jones et al., PLOS ONE, 2016, 184,065 of 241,091), so reporting it as a failure would
 * report three quarters of a bibliography and be ignored by the second run.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";

const RECORD = join(".stet", "standing.json");

export const LOUD = "loud";
export const QUIET = "quiet";
export const UNKNOWN = "unknown";
export const NONE = "none";

/** A DOI and a URL pointing at the same paper are two references and must not share a slot. */
export const key = (ref) => (ref.doi ? `doi:${ref.doi}` : `url:${ref.url}`);

export function readRecord(root) {
  const path = join(root, RECORD);
  if (!existsSync(path)) return { version: 1, refs: {} };
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8"));
    return { version: 1, refs: parsed?.refs ?? {} };
  } catch {
    /* A corrupt record must not be treated as an empty one silently, but it must not stop the run
       either. The caller reports it; here the safe read is an empty one. */
    return { version: 1, refs: {}, unreadable: true };
  }
}

export function writeRecord(root, record) {
  const path = join(root, RECORD);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify({ version: 1, refs: record.refs }, null, 2)}\n`);
}

/**
 * A title with one trailing site name taken off.
 *
 * Compared only when the full titles already differ. A CMS migration that appends the publication's
 * name to every page changes every title in a corpus on one day, and reporting that as several
 * hundred sources moving is the check firing dozens of times, which is the failure this project has
 * already paid for once.
 */
export const titleCore = (title) =>
  String(title ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\s*[|\u2013\u2014-]\s*[^|\u2013\u2014-]{1,40}$/, "")
    .trim();

/**
 * Previous state plus current observation, in. One verdict, out.
 *
 * The order of the tests is the precedence and it is deliberate. Dead beats everything because
 * nothing else can be assessed. The anchor beats the title because the anchor is the sentence's own
 * words and the title is the page's.
 */
export function compare(previous, now) {
  if (now.state === "unreachable")
    return { tier: UNKNOWN, verdict: "could not check", detail: now.detail ?? "no answer" };

  if (now.state === "dead")
    return { tier: LOUD, verdict: "dead", detail: now.status ? `returned ${now.status}` : "no answer" };

  if (now.state === "not found")
    return { tier: LOUD, verdict: "not found", detail: "Crossref has no record of it" };

  if (now.state === "retracted")
    return {
      tier: LOUD,
      verdict: "retracted",
      detail: now.retraction ? `the notice is ${now.retraction}` : "withdrawn",
    };

  if (now.state === "flagged")
    return { tier: LOUD, verdict: "flagged", detail: now.concern ?? "an expression of concern" };

  if (now.state === "superseded")
    return { tier: LOUD, verdict: "superseded", detail: `the version of record is ${now.published}` };

  if (!previous) return { tier: NONE, verdict: "first sight", detail: "" };

  if (previous.host && now.host && previous.host !== now.host)
    return {
      tier: LOUD,
      verdict: "moved host",
      detail: `${previous.host} now answers from ${now.host}`,
    };

  const gone = (now.anchors ?? []).filter((a) => !a.present).map((a) => a.text);
  if (gone.length)
    return {
      tier: LOUD,
      verdict: "anchor gone",
      detail: `the page no longer contains "${gone[0]}"${gone.length > 1 ? ` and ${gone.length - 1} more` : ""}`,
    };

  if (previous.title && now.title && previous.title !== now.title && titleCore(previous.title) !== titleCore(now.title))
    return {
      tier: LOUD,
      verdict: "title changed",
      detail: `was "${previous.title}", now "${now.title}"`,
    };

  if (previous.digest && now.digest && previous.digest !== now.digest)
    return { tier: QUIET, verdict: "drifted", detail: "the text changed and nothing above it did" };

  return { tier: NONE, verdict: "unchanged", detail: "" };
}
```

- [ ] **Step 4: Run the tests and watch them pass**

Run: `node --test test/standing.test.mjs`
Expected: 14 passing, 0 failing.

- [ ] **Step 5: Wire the runner into `npm test`**

In `package.json`, change the `test` script from:

```json
"test": "node --check bin/stet.mjs && node bin/stet.mjs doctor && node bin/stet.mjs tells",
```

to:

```json
"test": "node --check bin/stet.mjs && node --test test/ && node bin/stet.mjs doctor && node bin/stet.mjs tells",
```

`node --test` is built in from Node 18 and the package already requires Node 20 or newer, so this adds no dependency. `test/` is absent from the `files` whitelist, so nothing new ships.

Run: `npm test`
Expected: the tests pass, then `doctor` reports its one check-by-hand, then `tells` reports clean.

- [ ] **Step 6: Narrow the ignore rule so the record can be committed**

In `.gitignore`, replace:

```
# Per-project working state: the proof sheet spec and the choice it wrote back.
.stet/
```

with:

```
# Per-project working state: the sheet specs and the choices they wrote back.
.stet/*
!.stet/sources.json
!.stet/standing.json
```

`refresh.md` says to commit the lock, and until now this repository ignored it, so Stet did not obey its own documented rule. A monitor with no memory across a fresh clone has no value in CI, which is the place a monitor belongs.

- [ ] **Step 7: Correct the line in CLAUDE.md that this task falsifies**

In `CLAUDE.md`, replace `There is no test framework and no linter.` with:

```
There is no linter, and the only test framework is Node's own runner. `npm test` is the suite:
`node --check`, then `node --test test/`, then `doctor` (drift between config, content and plugin),
then `tells` (the constructions that read as machine-written).
```

Leave the rest of that paragraph as it stands.

- [ ] **Step 8: Commit**

```bash
git add plugin/skills/stet/scripts/lib/standing.mjs test/standing.test.mjs package.json .gitignore CLAUDE.md
git commit -F - <<'EOF'
Put the whole state machine somewhere a test can reach it

Whether a page answers is a question for the world. Whether what came
back means anything has a fixed answer, and a fixed answer is a thing you
can test in a millisecond, so the comparison takes a previous record and
an observation and touches nothing else.

Two tiers. Loud is what cannot be innocent: dead, moved to another host,
a quoted anchor gone, a title that changed by more than a site name, or a
DOI newly retracted. Quiet is the text digest moving alone. Content drift
runs at 76.35 percent of references with a snapshot, so a single tier
would report three quarters of a bibliography.

Precedence is deliberate. Dead beats everything because nothing else can
be assessed. The anchor beats the title because the anchor is the
sentence's own words and the title is only the page's.

.gitignore stopped ignoring the locks. refresh.md has said to commit them
since it was written and this repository was ignoring its own rule, which
also meant a monitor with no memory across a fresh clone.

npm test gains node --test, which is built in and adds no dependency.
test/ is not in the files whitelist, so nothing new ships.
EOF
```

---

### Task 2: What a reference is

Extraction only. No network in this task.

**Files:**
- Create: `plugin/skills/stet/scripts/lib/citations.mjs`
- Create: `test/citations.test.mjs`

**Interfaces:**
- Consumes: nothing from Task 1.
- Produces:
  - `references(text, markup) -> { urls: {url, line, anchors: string[]}[], dois: {doi, line}[] }` where `markup` is `"md"` or `"html"`.
  - `withoutCode(text, markup) -> string`, same line count as the input.
  - `normaliseQuoted(s) -> string`

- [ ] **Step 1: Write the failing tests**

Create `test/citations.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { references, normaliseQuoted } from "../plugin/skills/stet/scripts/lib/citations.mjs";

test("a bare URL is found, with the line it is on", () => {
  const { urls } = references("one\ntwo https://example.com/a there\n", "md");
  assert.equal(urls.length, 1);
  assert.equal(urls[0].url, "https://example.com/a");
  assert.equal(urls[0].line, 2);
});

test("a URL inside a fenced code block is an identifier, not a citation", () => {
  const fence = "`".repeat(3);
  const { urls } = references(`${fence}\ncurl https://example.com/a\n${fence}\n`, "md");
  assert.equal(urls.length, 0);
});

test("a URL inside backticks is an identifier too", () => {
  const { urls } = references("see `https://example.com/a` for the shape\n", "md");
  assert.equal(urls.length, 0);
});

test("a markdown link target is a citation and survives blanking", () => {
  const { urls } = references("as [the study](https://example.com/a) found\n", "md");
  assert.equal(urls.length, 1);
  assert.equal(urls[0].url, "https://example.com/a");
});

test("trailing sentence punctuation is not part of the URL", () => {
  const { urls } = references("at https://example.com/a.\n", "md");
  assert.equal(urls[0].url, "https://example.com/a");
});

test("a doi.org link is a DOI, not a URL, so it cannot be checked twice", () => {
  const { urls, dois } = references("see https://doi.org/10.1162/qss_a_00155 for it\n", "md");
  assert.equal(urls.length, 0);
  assert.equal(dois.length, 1);
  assert.equal(dois[0].doi, "10.1162/qss_a_00155");
});

test("a bare DOI in running prose is found", () => {
  const { dois } = references("Jones et al., 10.1371/journal.pone.0167475, 2016\n", "md");
  assert.equal(dois[0].doi, "10.1371/journal.pone.0167475");
});

test("a quoted run in the same paragraph becomes an anchor", () => {
  const text = 'The paper says "more than 70% of the URLs" are rotten, see https://example.com/a\n';
  const { urls } = references(text, "md");
  assert.deepEqual(urls[0].anchors, ["more than 70% of the URLs"]);
});

test("a short quoted run is not an anchor, because it will match anything", () => {
  const text = 'It says "yes" at https://example.com/a\n';
  const { urls } = references(text, "md");
  assert.deepEqual(urls[0].anchors, []);
});

test("a quote from another paragraph does not attach to this link", () => {
  const text = 'The other page says "a quoted sentence of sufficient length".\n\nSee https://example.com/a\n';
  const { urls } = references(text, "md");
  assert.deepEqual(urls[0].anchors, []);
});

test("HTML is read as HTML, and its script tags are not prose", () => {
  const { urls } = references('<script>var u = "https://example.com/a";</script><p>See <a href="https://example.com/b">it</a></p>', "html");
  assert.deepEqual(urls.map((u) => u.url), ["https://example.com/b"]);
});

test("normaliseQuoted straightens curly quotes and folds whitespace", () => {
  assert.equal(normaliseQuoted("  the “best”   answer’s  "), 'the "best" answer\'s');
});
```

- [ ] **Step 2: Run the tests and watch them fail**

Run: `node --test test/citations.test.mjs`
Expected: every test fails with `Cannot find module .../lib/citations.mjs`.

- [ ] **Step 3: Write the implementation**

Create `plugin/skills/stet/scripts/lib/citations.mjs`. This task writes only the extraction half; Task 3 adds observation to the same file.

```js
/**
 * What a reference is, and how to look at one.
 *
 * Shared by `cite` and `standing` so that the two cannot disagree about what counts as a citation.
 * Two extractors would drift, and the first symptom would be a DOI one command sees and the other
 * does not, which is the worst kind of bug in a tool whose claim is that it checks everything.
 */

/**
 * Blank what is not prose, keeping every line where it was.
 *
 * Deliberately not `prose()` from lib/prose.mjs. That function strips markdown link targets, which
 * is right for measuring a voice and destroys exactly what this file is looking for. Line counts
 * are preserved because a finding without a line number is a finding somebody has to go and look
 * for.
 */
export function withoutCode(text, markup) {
  if (markup === "html") {
    return text
      .replace(/<(script|style|pre|code|textarea)[\s\S]*?<\/\1>/gi, (m) => m.replace(/[^\n]/g, " "))
      .replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, " "));
  }

  let fenced = false;
  let front = /^---\r?\n/.test(text);
  return text
    .split("\n")
    .map((line, i) => {
      if (front) {
        if (i > 0 && /^---\s*$/.test(line)) front = false;
        return "";
      }
      /* The fence, written as an escape so that a document quoting this code does not have
         its own fences thrown out of step by it. */
      if (/^\s*\u0060{3}/.test(line)) {
        fenced = !fenced;
        return "";
      }
      if (fenced) return "";
      if (/^\s{4,}\S/.test(line)) return "";
      return line.replace(/`[^`]*`/g, (m) => " ".repeat(m.length));
    })
    .join("\n");
}

/* Straight quotes, folded whitespace, no leading or trailing punctuation. A page that swapped a
   straight quote for a curly one has not changed what it says. */
export const normaliseQuoted = (s) =>
  String(s)
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, " ")
    .trim();

/** DOIs, and only DOIs. The reasoning is in cite.md and it has not changed. */
const DOI = /\b(10\.\d{4,9}\/[-._;()/:A-Z0-9]*[A-Z0-9])\b/gi;

const URL_RE = /https?:\/\/[^\s<>()"'`\][]+/g;

/**
 * A quoted run long enough to mean something.
 *
 * 20 characters, because below that a quotation is a word or a phrase that appears on any page
 * about the subject, and an anchor that matches anything is an anchor that proves nothing. Single
 * quotes are not delimiters here: an apostrophe in ordinary prose would open one on every line.
 */
const QUOTED = /[“"]([^”"]{20,300})[”"]/g;

const lineOf = (text, index) => text.slice(0, index).split("\n").length;

export function references(text, markup) {
  const clean = withoutCode(text, markup);

  const dois = new Map();
  for (const m of clean.matchAll(DOI)) {
    const doi = m[1].replace(/[.,;)\]]+$/, "").toLowerCase();
    if (!dois.has(doi)) dois.set(doi, { doi, line: lineOf(clean, m.index) });
  }

  /* Paragraphs, so an anchor attaches to the link it is arguing alongside rather than to every link
     in the file. Offsets are kept so the line number stays true. */
  const paragraphs = [];
  let at = 0;
  for (const block of clean.split(/\n\s*\n/)) {
    paragraphs.push({ text: block, at });
    at += block.length + 2;
  }

  const urls = new Map();
  for (const para of paragraphs) {
    const anchors = [...para.text.matchAll(QUOTED)].map((q) => normaliseQuoted(q[1]));
    for (const m of para.text.matchAll(URL_RE)) {
      const url = m[0].replace(/[.,;:)\]]+$/, "");

      /* A DOI wearing a URL. Checked as a DOI, because Crossref answers a question a fetch cannot:
         whether the paper still stands. Recording it twice would report one problem as two. */
      const asDoi = url.match(/doi\.org\/(10\.\d{4,9}\/\S+)/i);
      if (asDoi) {
        const doi = asDoi[1].replace(/[.,;)\]]+$/, "").toLowerCase();
        if (!dois.has(doi)) dois.set(doi, { doi, line: lineOf(clean, para.at + m.index) });
        continue;
      }

      if (!urls.has(url)) urls.set(url, { url, line: lineOf(clean, para.at + m.index), anchors });
    }
  }

  return { urls: [...urls.values()], dois: [...dois.values()] };
}
```

- [ ] **Step 4: Run the tests and watch them pass**

Run: `node --test test/citations.test.mjs`
Expected: 12 passing, 0 failing.

- [ ] **Step 5: Run it against this repository, which is the only honest check**

Run:

```bash
node -e '
import("./plugin/skills/stet/scripts/lib/citations.mjs").then(async (m) => {
  const { findContent } = await import("./plugin/skills/stet/scripts/lib/find.mjs");
  const { readFileSync } = await import("node:fs");
  let u = 0, d = 0;
  for (const f of findContent(process.cwd()).files) {
    const r = m.references(readFileSync(f, "utf8"), /\.x?html?$/.test(f) ? "html" : "md");
    if (r.urls.length || r.dois.length) console.log(f, r.urls.length, "urls", r.dois.length, "dois");
    u += r.urls.length; d += r.dois.length;
  }
  console.log("total", u, "urls", d, "dois");
});
'
```

Expected: a plausible count rather than an implausible one. Read the list. If a URL that is plainly an identifier appears, or a real citation is missing, fix the extractor and add the case to the test file before moving on. Record what you saw in the commit message.

- [ ] **Step 6: Commit**

```bash
git add plugin/skills/stet/scripts/lib/citations.mjs test/citations.test.mjs
git commit -F - <<'EOF'
Find the references, and do not reuse the blanker that eats them

One extractor, shared by cite and standing, because two would drift and
the first symptom would be a DOI one command sees and the other does not.

It cannot use prose() from lib/prose.mjs. That function strips markdown
link targets, which is right for measuring a voice and destroys the exact
thing this is looking for, so the blanking here is its own and keeps line
counts so a finding still points at a line.

A doi.org link is recorded as a DOI rather than a URL. Crossref answers a
question a fetch cannot, which is whether the paper still stands, and
recording it both ways would report one problem as two.

Anchors are quoted runs of 20 characters or more in the paragraph holding
the link. Below that a quotation is a phrase that appears on any page
about the subject, and an anchor that matches anything proves nothing.
Single quotes are not delimiters, because an apostrophe would open one on
every line of ordinary prose.
EOF
```

---

### Task 3: Looking at a source

The network half, and the refactor that puts `cite` on the same footing.

**Files:**
- Modify: `plugin/skills/stet/scripts/lib/citations.mjs` (add the observation half)
- Modify: `plugin/skills/stet/scripts/cite.mjs` (import `ask`, delete the local copy, correct the year)
- Modify: `test/citations.test.mjs` (add the helper tests)

**Interfaces:**
- Consumes: `references`, `normaliseQuoted` from Task 2.
- Produces:
  - `ask(doi, opts?) -> Promise<Observation>` with `state` one of `current`, `not found`, `retracted`, `flagged`, `superseded`, `unreachable`. Identical in behaviour to the function currently inside `cite.mjs`.
  - `observe(url, opts?) -> Promise<Observation>` with `state` one of `live`, `dead`, `unreachable`.
  - `titleOf(html) -> string`
  - `digestOf(text) -> string`, 16 hex characters
  - `classify(status) -> "live" | "dead" | "unreachable"`
  - `anchorsPresent(text, anchors) -> {text, present}[]`

- [ ] **Step 1: Write the failing tests**

Append to `test/citations.test.mjs`:

```js
import { titleOf, digestOf, classify, anchorsPresent } from "../plugin/skills/stet/scripts/lib/citations.mjs";

test("the title comes out of the head, whitespace folded", () => {
  assert.equal(titleOf("<html><head><title>  A\n  page </title></head>"), "A page");
});

test("a page with no title reports none rather than guessing", () => {
  assert.equal(titleOf("<html><body>hello</body></html>"), "");
});

test("the digest ignores whitespace, because reflowing is not drift", () => {
  assert.equal(digestOf("one two   three"), digestOf("one\ntwo three\n"));
});

test("the digest changes when a word does", () => {
  assert.notEqual(digestOf("one two three"), digestOf("one two four"));
});

test("a 404 is dead and a 503 is a server having a bad day", () => {
  assert.equal(classify(200), "live");
  assert.equal(classify(404), "dead");
  assert.equal(classify(410), "dead");
  assert.equal(classify(503), "unreachable");
});

test("an anchor matches through curly quotes and reflowed whitespace", () => {
  const page = "the paper found that “more than 70% of\nthe URLs” had rotted";
  const [a] = anchorsPresent(page, ['more than 70% of the URLs']);
  assert.equal(a.present, true);
});

test("an anchor that is genuinely gone reports gone", () => {
  const [a] = anchorsPresent("this page is for sale", ["more than 70% of the URLs"]);
  assert.equal(a.present, false);
});
```

- [ ] **Step 2: Run and watch the new tests fail**

Run: `node --test test/citations.test.mjs`
Expected: the seven new tests fail, the twelve from Task 2 still pass.

- [ ] **Step 3: Add the observation half**

Append to `plugin/skills/stet/scripts/lib/citations.mjs`:

```js
import { createHash } from "node:crypto";
import { prose } from "./prose.mjs";

const MAILTO = process.env.STET_CROSSREF_MAILTO ?? "";
const UA = `stet/0.1 (https://github.com/owllight-studio/stet${MAILTO ? `; mailto:${MAILTO}` : ""})`;

export const titleOf = (html) =>
  (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();

/** Short on purpose. This is a fingerprint for "did it change", never a checksum for integrity. */
export const digestOf = (text) =>
  createHash("sha256").update(String(text).replace(/\s+/g, " ").trim()).digest("hex").slice(0, 16);

/**
 * What a status code means about the source.
 *
 * A 5xx is not a source that moved, it is a server having a bad day, and calling it dead would put
 * a transient outage in the loud tier and teach somebody to stop reading the loud tier. It goes to
 * the unknown tier instead, which cite.md's rule requires: never treat "could not check" as "fine".
 */
export const classify = (status) => {
  if (status >= 200 && status < 400) return "live";
  if (status >= 400 && status < 500) return "dead";
  return "unreachable";
};

export const anchorsPresent = (text, anchors = []) => {
  const hay = normaliseQuoted(text).toLowerCase();
  return anchors.map((a) => ({ text: a, present: hay.includes(normaliseQuoted(a).toLowerCase()) }));
};

export async function observe(url, { anchors = [], timeout = 20000 } = {}) {
  try {
    const res = await fetch(url, {
      redirect: "follow",
      headers: { "user-agent": UA, accept: "text/html,*/*" },
      signal: AbortSignal.timeout(timeout),
    });
    const state = classify(res.status);
    if (state !== "live") {
      return state === "dead"
        ? { state, status: res.status }
        : { state, detail: `returned ${res.status}` };
    }
    const html = await res.text();
    const text = prose(html, "html").replace(/\s+/g, " ").trim();
    return {
      state: "live",
      status: res.status,
      host: new URL(res.url).host,
      title: titleOf(html),
      digest: digestOf(text),
      anchors: anchorsPresent(text, anchors),
    };
  } catch (err) {
    return { state: "unreachable", detail: String(err.message ?? err).slice(0, 80) };
  }
}

/**
 * Crossref, once per DOI. Moved here from cite.mjs unchanged, so that both commands ask the same
 * question and get the same answer.
 *
 * Retraction data has been free and inline in Crossref since it acquired the Retraction Watch
 * database in 2023. Across 13,252 post-retraction citation contexts, 722 acknowledged the
 * retraction, which is 5.4 percent (Hsiao and Schneider, Quantitative Science Studies 2(4):
 * 1144-1169, 2021, 10.1162/qss_a_00155).
 */
export async function ask(doi) {
  const url = `https://api.crossref.org/works/${encodeURIComponent(doi)}${MAILTO ? `?mailto=${MAILTO}` : ""}`;
  try {
    const res = await fetch(url, { headers: { "user-agent": UA }, signal: AbortSignal.timeout(20000) });
    if (res.status === 404) return { doi, state: "not found" };
    if (!res.ok) return { doi, state: "unreachable", detail: `Crossref returned ${res.status}` };
    const { message } = await res.json();

    const updates = message["update-to"] ?? [];
    const updatedBy = message["updated-by"] ?? [];
    const retraction = updatedBy.find((u) => /retract/i.test(u.type ?? ""));
    const concern = updatedBy.find((u) => /concern|withdraw/i.test(u.type ?? ""));
    const published = (message.relation?.["is-preprint-of"] ?? [])[0];

    return {
      doi,
      state: retraction ? "retracted" : concern ? "flagged" : published ? "superseded" : "current",
      title: ((message.title ?? [])[0] ?? "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim(),
      year: message.issued?.["date-parts"]?.[0]?.[0],
      container: (message["container-title"] ?? [])[0],
      type: message.type,
      retraction: retraction?.DOI,
      concern: concern?.type,
      published: published?.id,
      updates: updates.length,
    };
  } catch (err) {
    return { doi, state: "unreachable", detail: String(err.message ?? err).slice(0, 80) };
  }
}
```

- [ ] **Step 4: Run the tests and watch them pass**

Run: `node --test test/`
Expected: 19 passing in `citations.test.mjs`, 14 in `standing.test.mjs`, 0 failing.

- [ ] **Step 5: Put `cite` on the shared function**

In `plugin/skills/stet/scripts/cite.mjs`:

1. Delete the local `ask` function (lines 76 to 109) and the `MAILTO` and `UA` constants that only it used, keeping the `MAILTO` reference in the "polite pool" message by importing it or by re-reading `process.env.STET_CROSSREF_MAILTO` at the point of use.
2. Add `import { ask } from "./lib/citations.mjs";` beside the existing imports.
3. Correct the year in the header comment. The line currently reads `(Hsiao and Schneider, Quantitative Science Studies, 2022)`. Crossref gives `Quantitative Science Studies 2(4): 1144-1169, 2021`, DOI `10.1162/qss_a_00155`. Write it as `(Hsiao and Schneider, Quantitative Science Studies 2(4), 2021)`.
4. Leave `citations()` in `cite.mjs` alone for now. It answers a different question, which is what looks like a reference and carries nothing checkable, and folding that into the library is a change `cite` does not need.

- [ ] **Step 6: Prove `cite` behaves exactly as it did**

Run, before and after the edit, on a scratch copy:

```bash
node plugin/skills/stet/scripts/cite.mjs > /tmp/cite-after.txt; echo "exit $?"
```

Expected: byte-identical output to a run of the same command from `git stash`ed state, and the same exit code. The refactor is not allowed to change one line of what a user sees.

- [ ] **Step 7: Commit**

```bash
git add plugin/skills/stet/scripts/lib/citations.mjs plugin/skills/stet/scripts/cite.mjs test/citations.test.mjs
git commit -F - <<'EOF'
Look at a source, and give cite the same eyes

observe fetches a URL and returns the four things the state machine needs:
the host it actually answered from, the title, a digest of the readable
text, and whether each quoted anchor is still on the page.

A 5xx is not a source that moved, it is a server having a bad day, so it
lands in the tier that says nobody checked rather than the tier that says
this is broken. archive.org returned 503 three times during this work and
answered normally in between, which is the case in point. cite.md's rule
holds either way: never treat could not check as fine.

ask moved out of cite.mjs unchanged and cite now imports it, so the two
commands cannot come to different conclusions about the same DOI. The
output of cite is byte-identical before and after.

One correction while here. cite dated Hsiao and Schneider to 2022 and
Crossref gives Quantitative Science Studies 2(4): 1144-1169, 2021, DOI
10.1162/qss_a_00155. It was the only place in the repository carrying the
year.
EOF
```

---

### Task 4: The command

**Files:**
- Create: `plugin/skills/stet/scripts/standing.mjs`
- Create: `plugin/skills/stet/reference/standing.md`
- Modify: `plugin/skills/stet/SKILL.md` (one row in the command table)
- Modify: `bin/stet.mjs` (one entry in `COMMANDS`)
- Modify: `README.md` (the command list)

**Interfaces:**
- Consumes: `references`, `observe`, `ask` from Tasks 2 and 3; `readRecord`, `writeRecord`, `compare`, `key`, tier constants from Task 1.
- Produces: the `standing` command. Exit 1 when anything is loud, 0 otherwise.

- [ ] **Step 1: Write the command**

Create `plugin/skills/stet/scripts/standing.mjs`:

```js
#!/usr/bin/env node
/**
 * What every cited source was last time, and what has moved since.
 *
 * `cite` asks three questions well and cannot answer the one that matters over time, because it is
 * stateless: a bibliography that was clean on the day it shipped reports clean until the run where
 * it does not, with no date on the change. This remembers.
 *
 * The failure is worth monitoring rather than checking once. More than 70 percent of the URLs in
 * three Harvard law journals and 50 percent of those in Supreme Court opinions no longer produce the
 * information cited (Zittrain, Albert and Lessig, Harvard Law Review Forum 127, 2014). Retraction is
 * slow enough that no diligence pass can catch it: a median of 562 days from publication to
 * retraction across 16,041 retracted medical publications (Journal of Korean Medical Science, 2025).
 * A source that was fine when you cited it stops being fine while nobody is looking.
 *
 * Run: node standing.mjs [file ...]
 *      node standing.mjs archive [--all]
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { findContent } from "./lib/find.mjs";
import { references, observe, ask } from "./lib/citations.mjs";
import { readRecord, writeRecord, compare, key, LOUD, QUIET, UNKNOWN } from "./lib/standing.mjs";

const root = process.cwd();
const argv = process.argv.slice(2);
const today = new Date().toISOString().slice(0, 10);
const files = argv.filter((a) => !a.startsWith("--"));

const markupOf = (name) => (/\.x?html?$/i.test(name) ? "html" : "md");

/* Every reference in scope, with where it was found. */
const targets = files.length ? files : findContent(root).files;
const found = [];
for (const file of targets) {
  let text;
  try {
    text = readFileSync(join(root, file), "utf8");
  } catch {
    continue;
  }
  const { urls, dois } = references(text, markupOf(file));
  for (const u of urls) found.push({ ...u, file });
  for (const d of dois) found.push({ ...d, file });
}

if (!found.length) {
  console.log("No URLs and no DOIs in the content, so there is nothing whose standing could change.");
  process.exit(0);
}

const record = readRecord(root);
if (record.unreadable) console.log(".stet/standing.json could not be read, so this run starts fresh.\n");
const first = !Object.keys(record.refs).length;

console.log(`${found.length} ${found.length === 1 ? "reference" : "references"} across ${targets.length} ${targets.length === 1 ? "file" : "files"}.`);
if (first) console.log("Nothing recorded yet, so this run establishes the record and reports only what is already broken.");
console.log("");

const results = [];
for (const ref of found) {
  const k = key(ref);
  const previous = record.refs[k];

  /* One at a time. These are somebody else's free public APIs and a burst from a whole bibliography
     is how a project gets rate limited for everybody. */
  const now = ref.doi ? await ask(ref.doi) : await observe(ref.url, { anchors: ref.anchors });
  const verdict = compare(previous, now);
  results.push({ ref, previous, now, ...verdict });

  const changed = !previous || previous.state !== now.state || verdict.tier === LOUD || verdict.tier === QUIET;
  record.refs[k] = {
    ...previous,
    state: now.state,
    title: now.title ?? previous?.title,
    digest: now.digest ?? previous?.digest,
    host: now.host ?? previous?.host,
    anchors: ref.anchors ?? previous?.anchors ?? [],
    file: ref.file,
    line: ref.line,
    firstSeen: previous?.firstSeen ?? today,
    lastChecked: today,
    /* The date the current state began, which is what lets the report say when it moved rather than
       only that it did. Unreachable never advances it: a timeout is not a change of state. */
    since: now.state === "unreachable" ? (previous?.since ?? today) : changed ? today : (previous?.since ?? today),
  };
}

writeRecord(root, record);

/* --- the report ----------------------------------------------------------- */

const at = (r) => `${r.ref.file}, line ${r.ref.line}`;
const what = (r) => r.ref.doi ?? r.ref.url;
const held = (r) => (r.previous?.since ? `, held since ${r.previous.since}` : "");

const loud = results.filter((r) => r.tier === LOUD);
for (const r of loud) {
  console.log(`${r.verdict.toUpperCase().padEnd(14)} ${what(r)}`);
  console.log(`               ${at(r)}`);
  console.log(`               ${r.detail}${held(r)}`);
  console.log("");
}

const quiet = results.filter((r) => r.tier === QUIET);
if (quiet.length) {
  console.log(`CHANGED  ${quiet.length}`);
  console.log("  the page still stands and its text moved. Nobody has read it\n");
  for (const r of quiet) console.log(`  ${what(r)}\n    ${at(r)}`);
  console.log("");
}

const unknown = results.filter((r) => r.tier === UNKNOWN);
if (unknown.length) {
  console.log(`COULD NOT CHECK  ${unknown.length}`);
  console.log("  no answer, which is not the same as no problem\n");
  for (const r of unknown) console.log(`  ${what(r)}\n    ${at(r)}, ${r.detail}`);
  console.log("");
}

console.log(
  [
    `${results.filter((r) => r.verdict === "unchanged").length} unchanged`,
    `${loud.length} moved`,
    `${quiet.length} drifted`,
    `${unknown.length} unchecked`,
  ].join(", "),
);

if (loud.length) {
  console.log("");
  console.log("What to do about each of these is a reading rather than a check: whether the claim");
  console.log("survives the change, whether the snapshot carries it, or whether it needs a different");
  console.log("source. That is stet-source-integrity, and it takes these findings as its input.");
}

process.exit(loud.length ? 1 : 0);
```

- [ ] **Step 2: Run it against this repository twice**

Run:

```bash
node plugin/skills/stet/scripts/standing.mjs; echo "exit $?"
```

Expected on the first run: the record is established, and the only findings are references that are genuinely broken today. Then run it again immediately.

Expected on the second run: every reference reports unchanged, the summary says so, and the exit code is 0. If the second run reports drift on pages that nobody edited between the two runs, the digest is picking up something that changes on every request, which is a bug in `prose(html)` stripping for that page. Find it before continuing and record what it was.

- [ ] **Step 3: Write the reference document**

Create `plugin/skills/stet/reference/standing.md`. It must carry the stet frontmatter every reference file carries, the invocation block in the `node ${CLAUDE_PLUGIN_ROOT}/...` form that `stet help` rewrites, and these sections, following the shape of `reference/cite.md`:

- what it is, in one line: what every cited source was last time, and what has moved since
- why it is not `cite`: stateless against remembering, and DOIs against URLs
- the evidence, with every figure sourced: reference rot at more than 70 percent of URLs in the *Harvard Law Review*, the *Harvard Journal of Law and Technology* and the *Harvard Human Rights Journal* and 50 percent in Supreme Court opinions (Zittrain, Albert and Lessig, *Harvard Law Review Forum* 127, 2014); content drift at 76.35 percent, 184,065 of 241,091 references (Jones et al., *PLOS ONE*, 2016, `10.1371/journal.pone.0167475`); 5.4 percent of post-retraction citations acknowledging the retraction, 722 of 13,252 (Hsiao and Schneider, *Quantitative Science Studies* 2(4): 1144-1169, 2021); median 562 days to retraction over 16,041 papers (*Journal of Korean Medical Science*, 2025)
- the two tiers, and why the quiet one is quiet
- what an anchor is and how one is chosen
- the record, and that it is committed
- a "Never" section: never treat "could not check" as fine, never delete a citation because this reported it, never fire it at a bibliography in parallel, never put a quiet finding in the loud tier to make it get attention
- "Done when": nothing loud, or everything loud has been decided on deliberately

**Do not write the 1.36-year figure.** It could not be sourced. The verified figure is 562 days.

- [ ] **Step 4: Add the row to SKILL.md**

In `plugin/skills/stet/SKILL.md`, in the command table, directly after the `cite` row:

```markdown
| `standing` | Evaluate | What every cited source was last time, and what has moved since | [reference/standing.md](reference/standing.md) |
```

- [ ] **Step 5: Add the entry to the CLI**

In `bin/stet.mjs`, in the `COMMANDS` map, in the `Check` group directly after `cite`:

```js
  standing: { group: "Check", script: "standing.mjs", blurb: "what every cited source was last time, and what moved" },
```

- [ ] **Step 6: Add it to the README command list**

In `README.md`, the Evaluate line currently reads:

```
    audit · critique · verify         evaluate
```

Change it to:

```
    audit · critique · verify · standing   evaluate
```

- [ ] **Step 7: Prove the whole suite still passes and the docs agree**

Run:

```bash
npm test
node bin/stet.mjs standing --help >/dev/null; node bin/stet.mjs help standing | head -20
```

Expected: `npm test` passes including `doctor`, and `stet help standing` prints the reference document with the plugin paths rewritten to `stet standing`.

- [ ] **Step 8: Commit**

```bash
git add plugin/skills/stet/scripts/standing.mjs plugin/skills/stet/reference/standing.md plugin/skills/stet/SKILL.md bin/stet.mjs README.md
git commit -F - <<'EOF'
Remember what every source was, and report only what moved

The first run establishes the record and reports only what is already
broken. Every run after it reports the delta with the date the state
began, so the output reads current on 3 March, retracted now, rather than
reprinting the bibliography.

Loud exits 1 and is what cannot be innocent. Quiet is the text moving on
its own and never blocks. Could not check is its own section, because
cite.md's rule is that no answer is not the same as no problem.

Sources are asked one at a time. These are free public APIs and a burst
from a whole bibliography is how a project gets rate limited for
everybody.
EOF
```

---

### Task 5: The snapshot

**Files:**
- Modify: `plugin/skills/stet/scripts/standing.mjs` (the `archive` subcommand)
- Modify: `plugin/skills/stet/reference/standing.md` (an Archiving section)

**Interfaces:**
- Consumes: `readRecord`, `writeRecord` from Task 1.
- Produces: `node standing.mjs archive [--all]`, which sets `snapshot` and `snapshotAt` on record entries.

- [ ] **Step 1: Add the read path, which needs no permission from anybody**

In `standing.mjs`, before the main run, branch on `argv[0] === "archive"`. The read path uses the CDX API, whose parameters are confirmed working:

```js
/**
 * A snapshot that already exists, found without writing anything.
 *
 * Deliberately not `archive.org/wayback/available`, which returned 502 on every attempt during this
 * work while archive.org itself answered 200 and while CDX answered normally. CDX is the endpoint
 * that stayed up.
 */
async function snapshotOf(url) {
  const q = new URLSearchParams({
    url,
    output: "json",
    limit: "-1",
    filter: "statuscode:200",
    fl: "timestamp,original",
  });
  try {
    const res = await fetch(`https://web.archive.org/cdx/search/cdx?${q}`, {
      headers: { "user-agent": UA },
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) return null;
    const rows = JSON.parse(await res.text());
    const last = rows?.[1];
    if (!last) return null;
    const [stamp] = last;
    return {
      snapshot: `https://web.archive.org/web/${stamp}/${url}`,
      snapshotAt: `${stamp.slice(0, 4)}-${stamp.slice(4, 6)}-${stamp.slice(6, 8)}`,
    };
  } catch {
    return null;
  }
}
```

`UA` here is the same constant `lib/citations.mjs` uses; export it from there rather than writing a second one.

- [ ] **Step 2: Confirm the read path against a real URL**

Run:

```bash
node -e '
const q = new URLSearchParams({ url: "https://example.com", output: "json", limit: "-1", filter: "statuscode:200", fl: "timestamp,original" });
fetch(`https://web.archive.org/cdx/search/cdx?${q}`).then(r => r.text()).then(console.log);
'
```

Expected: a two-row JSON array, the header then one snapshot. If it returns 503, wait and try again: archive.org returned 503 intermittently while this plan was written and answered normally on the retry.

- [ ] **Step 3: Stop, and get the author's word before writing to archive.org**

The Save Page Now path has never been fired. It submits a URL to a third party, which publishes the fact that this project cites that page.

Ask the author for one URL to test with, and do not proceed on any other. Report exactly what came back: the status, the headers that matter, and whether an unauthenticated request is accepted at all. If Save Page Now requires an account, say so and stop rather than adding a key requirement to a tool whose whole pitch is that it needs no key.

- [ ] **Step 4: Write the save path, once the previous step has an answer**

Only after Step 3 returns a verified answer. The shape, assuming an unauthenticated `GET https://web.archive.org/save/<url>` is accepted:

```js
/**
 * Ask for a snapshot to be taken. Explicit, and never a side effect.
 *
 * Submitting a URL publishes the fact that this project cites it. That is a reasonable thing for an
 * author to choose and not a thing for a monitor to do quietly on a private repository.
 */
async function save(url) {
  try {
    const res = await fetch(`https://web.archive.org/save/${url}`, {
      headers: { "user-agent": UA },
      redirect: "follow",
      signal: AbortSignal.timeout(60000),
    });
    if (!res.ok) return { error: `Save Page Now returned ${res.status}` };
    return { asked: true };
  } catch (err) {
    return { error: String(err.message ?? err).slice(0, 80) };
  }
}
```

The subcommand: for each live URL in the record with no `snapshot`, call `snapshotOf` first, and only call `save` when that returns nothing. `--all` re-snapshots everything, for the case where the author wants a copy as of today rather than whatever exists. One request at a time, and print what it did for each.

- [ ] **Step 5: Report a snapshot in the main run**

Where a loud finding is `dead` and the record carries a `snapshot`, print it under the finding:

```
               archived 2024-11-02: https://web.archive.org/web/.../...
```

That line is the whole reason archiving is here. A dead link with a snapshot is a citation that can be fixed; a dead link without one is a loss.

- [ ] **Step 6: Document it**

Add an Archiving section to `reference/standing.md`: that it is a subcommand rather than a default, why (it publishes what you cite to a third party), that CDX is read first so no write happens where a snapshot already exists, and the Perma.cc origin of the idea, which is the same 2014 paper the rot figure comes from.

- [ ] **Step 7: Commit**

```bash
git add plugin/skills/stet/scripts/standing.mjs plugin/skills/stet/reference/standing.md
git commit -F - <<'EOF'
Take the snapshot before the page goes, and only when asked

Reporting rot after the fact is reporting a loss. The remedy is a copy
taken while the page still exists, which is what Perma.cc was built for
and what the 2014 paper behind the 70 percent figure proposed.

CDX is read first, so no write happens for a URL that already has a
snapshot. The availability endpoint is not used: it returned 502 on every
attempt while archive.org itself answered 200 and CDX answered normally.

Saving is a subcommand and never a side effect, because submitting a URL
publishes the fact that this project cites it, and that is the author's
call rather than a monitor's.
EOF
```

---

### Task 6: The agent

**Files:**
- Create: `plugin/agents/stet-source-integrity.md`
- Modify: `plugin/skills/stet/SKILL.md` (one row in the agent table, and the count in the sentence above it)

**Interfaces:**
- Consumes: the loud findings printed by Task 4.
- Produces: nothing programmatic. The agent returns prose.

- [ ] **Step 1: Write the agent**

Create `plugin/agents/stet-source-integrity.md`, with frontmatter matching the other agents in that directory:

```markdown
---
name: stet-source-integrity
description: Decides what to do about a source that moved. Reads the live page or its snapshot against the sentence resting on it, and returns a remedy. Use on the findings from standing.mjs, never on sources it cleared.
tools: Read, Bash, Glob, Grep, WebFetch, WebSearch
model: inherit
effort: high
---
```

The body must carry:

- **What it is for.** `standing` says a source moved. It cannot say whether the claim survives, and that is a reading.
- **What it never does.** It never looks at a source the monitor cleared. Re-checking clean sources is how a cheap monitor becomes an expensive one, and it is work already done mechanically.
- **Read the sentence first, then the source.** The same rule and the same reason as `stet-citation-checker`: reading the source first primes you to see support that is not there.
- **The four remedies**, one of which every finding gets: **still stands**, the change did not touch the claim. **Cite the snapshot**, the original is gone and the archived copy carries it. **Replace with this**, named, where a better or superseding source exists. **Lost**, the claim no longer has support and the author decides what the sentence does.
- **Order by consequence.** A claim doing real work in an argument outranks one in a list of links.
- **Say what you could not reach**, because silence reads as approval and nothing unread has been approved. 38 percent of pages that existed in 2013 were gone by 2023, so this will happen.
- **Never**: never call a claim safe because the topic still matches, which is exactly what a changed page will still do. Never accept a snapshot without reading it. Never propose an edit to a sentence the author owns; propose it in the reply and let them make it.
- **How it differs from the two agents that already exist**, stated plainly, because a reader deciding which to call needs it: `stet-citation-checker` asks whether a source supports a sentence, of a source that is standing. `stet-fact-checker` is adversarial about claims in general. This one runs only when something moved.

- [ ] **Step 2: Add the row to SKILL.md**

In the agent table, after the `stet-citation-checker` row:

```markdown
| `stet-source-integrity` | `standing` | Whether a source still exists is arithmetic; whether the claim survives the source changing is not |
```

The sentence above that table reads "Eight, and each exists because the work is either too large for this conversation or too close to it to judge honestly." The table already lists nine rows, so the count is wrong before this change and wronger after it. Count the rows and write the correct number.

- [ ] **Step 3: Check the plugin agrees with itself**

Run:

```bash
npm test
node bin/stet.mjs doctor
```

Expected: `doctor` reports no new drift between the config, the content and the plugin.

- [ ] **Step 4: Commit**

```bash
git add plugin/agents/stet-source-integrity.md plugin/skills/stet/SKILL.md
git commit -F - <<'EOF'
Add the reader for the half the monitor cannot do

standing says a source moved. Whether the claim survives the move is a
reading, and it gets one of four answers: it still stands, cite the
snapshot, replace it with this, or it is lost and the author decides.

It sees only the findings. A source the monitor cleared is work already
done mechanically, and re-reading it is how a cheap monitor becomes an
expensive one.

The agent count in SKILL.md said eight over a table of nine rows. Counted.
EOF
```

---

## Self-review

**Spec coverage.** Two tiers, Task 1. Anchors and the 20-character floor, Task 2. Title-suffix tolerance, Task 1. Dead, moved host, anchor gone, title changed, DOI states, Task 1. Deltas with dates and the first-run rule, Task 4. The committed record and the `.gitignore` narrowing, Task 1. Archiving through CDX with an explicit save, Task 5. The agent and its four remedies, Task 6. The shared library so `cite` and `standing` cannot disagree, Tasks 2 and 3. The pure comparison as the testable seam, Task 1. The `cite.mjs` year correction, Task 3.

**Two deliberate departures from the spec**, both flagged for the author rather than slipped in:

1. The spec lists a 5xx as dead. This plan sends it to the tier that says nobody checked. archive.org returned 503 three times while this plan was being written and answered normally in between, which is the case for the change: a transient outage in the loud tier teaches somebody to stop reading the loud tier.
2. The spec lists the loud signals in the order dead, moved host, title changed, anchor gone. This plan makes the precedence dead, moved host, **anchor gone, title changed**, because when both fire the anchor is the more useful thing to be told: it is the sentence's own words rather than the page's.

**One open item carried forward.** The Save Page Now write path is unverified and Task 5 Step 3 stops for the author before firing it. If it turns out to need an account, the design decision is the author's: a keyless tool that reads snapshots only, or a key for the save path.

**Not covered by any task, and deliberately.** The open question at the end of the spec, whether the monitor should distinguish a URL that a claim rests on from a URL in a list of links, is left until the first run against a real corpus says how often it matters.
