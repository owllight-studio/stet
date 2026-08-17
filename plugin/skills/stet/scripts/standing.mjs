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
import { references, observe, ask, UA } from "./lib/citations.mjs";
import { readRecord, writeRecord, compare, key, LOUD, QUIET, UNKNOWN } from "./lib/standing.mjs";

/* --- archiving -------------------------------------------------------------
 *
 * Reporting rot after the fact is reporting a loss. A snapshot taken while a page still exists is
 * the only remedy, which is what Perma.cc was built for (Zittrain, Albert and Lessig, Harvard Law
 * Review Forum 127, 2014, the same paper the 70 percent figure above comes from).
 */

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * A snapshot that already exists, found without writing anything.
 *
 * Deliberately not `archive.org/wayback/available`, which returned 502 on every attempt while
 * archive.org itself answered 200 and while CDX answered normally. CDX is the endpoint that stayed
 * up.
 *
 * archive.org returns 503 often and this is transient rather than meaningful: five consecutive
 * 503s over about 40 seconds for one URL, then 200 for that same URL on a later retry. So this
 * retries a few times before giving up, and giving up is reported as "could not ask", never folded
 * into "no snapshot exists". Those are different facts and confusing them is the bug that matters:
 * it would submit a duplicate save for a page that is already archived, and report "no snapshot"
 * for a page that has one.
 */
async function snapshotOf(url) {
  const q = new URLSearchParams({
    url,
    output: "json",
    limit: "-1",
    filter: "statuscode:200",
    fl: "timestamp,original",
  });
  let detail = "no answer";
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt) await sleep(attempt * 3000);
    try {
      const res = await fetch(`https://web.archive.org/cdx/search/cdx?${q}`, {
        headers: { "user-agent": UA },
        signal: AbortSignal.timeout(30000),
      });
      if (!res.ok) {
        detail = `CDX returned ${res.status}`;
        continue;
      }
      const rows = JSON.parse(await res.text());
      const last = rows?.[1];
      if (!last) return { status: "none" };
      const [stamp] = last;
      return {
        status: "found",
        snapshot: `https://web.archive.org/web/${stamp}/${url}`,
        snapshotAt: `${stamp.slice(0, 4)}-${stamp.slice(4, 6)}-${stamp.slice(6, 8)}`,
      };
    } catch (err) {
      detail = String(err.message ?? err).slice(0, 80);
    }
  }
  return { status: "unknown", detail };
}

/**
 * Ask for a snapshot to be taken. Explicit, and never a side effect.
 *
 * Submitting a URL publishes the fact that this project cites it. That is a reasonable thing for an
 * author to choose and not a thing a monitor should do quietly as part of a routine run.
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

/**
 * The `archive` subcommand. Works from the record alone, the same one `readRecord` and
 * `writeRecord` use for the main run, so it never re-fetches a page just to find its URL: run
 * `standing` on the content first to populate the record, then `archive` to snapshot it.
 *
 * CDX is read before anything is written, for every URL, so no save happens for a page that
 * already has a snapshot somewhere. Only a URL currently recorded `live` and lacking a `snapshot`
 * is ever submitted, and `--all` is the only thing that widens that: it re-checks and re-submits
 * every live URL, for the author who wants a copy as of today rather than whatever already exists.
 * A `dead` or `unreachable` URL is still looked up, because a snapshot taken while it still stood
 * is exactly the citation this exists to preserve, but it is never submitted: there is nothing live
 * to hand Save Page Now.
 */
async function runArchive(root, all) {
  const record = readRecord(root);
  if (record.unreadable) console.log(".stet/standing.json could not be read, so there is nothing to archive.\n");

  const entries = Object.entries(record.refs).filter(([k]) => k.startsWith("url:"));
  const doiCount = Object.keys(record.refs).length - entries.length;

  if (!entries.length) {
    console.log("No URLs in the record yet. Run `standing` on the content first, then `archive`.");
    if (doiCount) console.log(`${doiCount} DOI ${doiCount === 1 ? "reference" : "references"} recorded; Wayback stores pages, not papers, so DOIs are never archived.`);
    return;
  }

  let foundExisting = 0;
  let asked = 0;
  let skipped = 0;
  let deadNoSnapshot = 0;
  let couldNotAsk = 0;
  let saveFailed = 0;

  for (const [k, entry] of entries) {
    const url = k.slice("url:".length);

    if (entry.snapshot && !all) {
      skipped++;
      console.log(`ALREADY ARCHIVED  ${url}`);
      console.log(`                  ${entry.snapshotAt}: ${entry.snapshot}`);
      continue;
    }

    /* One at a time. CDX and Save Page Now are free public APIs and a burst is how a project gets
       rate limited for everybody, the same reason the main run never checks in parallel. */
    const check = await snapshotOf(url);

    if (check.status === "unknown") {
      couldNotAsk++;
      console.log(`COULD NOT ASK  ${url}`);
      console.log(`               ${check.detail}`);
      continue;
    }

    if (check.status === "found") {
      foundExisting++;
      record.refs[k] = { ...entry, snapshot: check.snapshot, snapshotAt: check.snapshotAt };
      console.log(`FOUND  ${url}`);
      console.log(`       already archived ${check.snapshotAt}: ${check.snapshot}`);
      /* Without --all, an existing snapshot is enough and nothing is submitted. --all is the one
         thing that overrides that for a page still live: it means a copy as of today rather than
         whatever already exists, so it still asks below even though snapshotOf found something.
         A dead or unreachable page never falls through here regardless of --all: there is nothing
         live to hand Save Page Now, and the snapshot just found is exactly what was worth having. */
      if (!all || entry.state !== "live") continue;
    }

    /* check.status === "none": CDX was asked and answered, and there is nothing there. That is a
       fact, and it is what licenses a save on its own, with no --all needed. */
    if (check.status === "none" && entry.state !== "live") {
      deadNoSnapshot++;
      console.log(`NO SNAPSHOT  ${url}`);
      console.log(`             recorded as ${entry.state}, and archive.org never had a copy while it stood`);
      continue;
    }

    const result = await save(url);
    if (result.asked) {
      asked++;
      console.log(`ASKED  ${url}`);
      console.log(`       Save Page Now accepted the request. The capture will not appear in CDX`);
      console.log(`       immediately; run \`archive\` again later to record it against this URL.`);
    } else {
      /* Verified against https://stet.style on 2026-08-16: the unauthenticated GET this sends
         returned 404 in 297ms, far too fast to have crawled a live page, and archive.org's own
         documentation confirms Save Page Now now wants a POST carrying S3-style credentials from
         an account. That is a key requirement, and this tool's whole pitch is that it needs none,
         so the request is still made, honestly, and its failure is reported rather than hidden or
         worked around with a credential this tool does not ask anybody to hold. */
      saveFailed++;
      console.log(`FAILED  ${url}`);
      console.log(`        ${result.error}`);
    }
  }

  writeRecord(root, record);

  console.log("");
  console.log(
    [
      `${foundExisting} already had a snapshot`,
      `${asked} asked for one`,
      `${skipped} already recorded and skipped`,
      `${deadNoSnapshot} dead or unreachable with nothing to save`,
      `${couldNotAsk} could not be asked`,
      `${saveFailed} asked but refused`,
    ].join(", "),
  );
  if (doiCount) console.log(`${doiCount} DOI ${doiCount === 1 ? "reference" : "references"} in the record; Wayback stores pages, not papers, so DOIs are never archived.`);
  if (saveFailed) {
    console.log("");
    console.log("Save Page Now refused at least one request. As of 2026-08-16 its unauthenticated GET");
    console.log("endpoint returns 404 for a request that used to be accepted; archive.org's own");
    console.log("documentation now describes an authenticated POST with S3-style account credentials.");
    console.log("stet asks for no key from anybody, so it will not add one to work around this: reading");
    console.log("an existing snapshot still works above, and a save can still be requested by hand at");
    console.log("https://web.archive.org/save/<url> or with an archive.org account of your own.");
  }
}

/* --- end archiving ----------------------------------------------------- */

const root = process.cwd();
const argv = process.argv.slice(2);

if (argv[0] === "archive") {
  await runArchive(root, argv.slice(1).includes("--all"));
  process.exit(0);
}

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
  /* A dead link with a snapshot is a citation somebody can fix. A dead link without one is a loss.
     That line is the whole reason archiving exists, so it prints here rather than only in
     `archive`'s own output. */
  if (r.verdict === "dead") {
    const entry = record.refs[key(r.ref)];
    if (entry?.snapshot) console.log(`               archived ${entry.snapshotAt}: ${entry.snapshot}`);
  }
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

/* A first sighting is not unchanged, moved, drifted or unchecked, and a summary that counts none
   of those four buckets for it is a summary that goes quiet on exactly what it examined. That
   breaks "report what you did not do": silence there reads as nothing new, which on a real
   bibliography is false for most of a freshly added page. Every reference found has to land in one
   of these five, on a first run and on every run after it. */
const newlyRecorded = results.filter((r) => r.verdict === "first sight").length;
const unchanged = results.filter((r) => r.verdict === "unchanged").length;

console.log(
  [
    `${newlyRecorded} newly recorded`,
    `${unchanged} unchanged`,
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
