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
