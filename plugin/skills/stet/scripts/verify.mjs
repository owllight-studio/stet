#!/usr/bin/env node
/**
 * Check every claim against the thing it came from. Change nothing.
 *
 * verify is the half that reads. It runs each declared source, finds where its figure lives in the
 * prose, and reports one of four states per claim. It never writes to content, which is what makes
 * it safe to run on anything, including files nobody may touch.
 *
 * The state worth understanding is `missing`: the source ran, and neither its current figure nor
 * the last one we recorded appears in the file. That means the sentence was reworded around the
 * number, or the number was typed by hand and never matched. Either way the honest move is to say
 * so and stop, because a claim we cannot locate is a claim we must not rewrite.
 *
 * Run: node verify.mjs [file ...]
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { findContent } from "./lib/find.mjs";
import { read as readMeta } from "./lib/meta.mjs";
import { runAll, lock, check, typedFigures, declared } from "./lib/sources.mjs";

const root = process.cwd();
const only = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const quiet = process.argv.includes("--quiet");

const specs = declared(root);
if (!Object.keys(specs).length) {
  console.log("No sources are declared, so there is nothing to verify against.");
  console.log("");
  console.log("A source is a command that prints one figure. Declare them in stet.config.json:");
  console.log('  "sources": { "corpus.rampShare": { "run": "node scripts/ramp-share.mjs", "as": "percent" } }');
  console.log("");
  console.log("Then name them on the content that quotes them:");
  console.log("  stet:\n    sources: [corpus.rampShare]");
  process.exit(0);
}

const files = only.length ? only : findContent(root).files;

/* Which sources are actually cited by the files in scope. Running the rest would be work nobody
   asked for, and on a slow query that is somebody's afternoon. */
const cited = new Map();
for (const file of files) {
  for (const name of readMeta(root, file)?.sources ?? []) {
    if (!cited.has(name)) cited.set(name, []);
    cited.get(name).push(file);
  }
}

if (!cited.size) {
  console.log(`${Object.keys(specs).length} sources are declared and no content cites any of them.`);
  console.log("Add `sources:` to the files that quote a figure, so a change to the figure can find them.");
  process.exit(0);
}

console.log(`Running ${cited.size} ${cited.size === 1 ? "source" : "sources"}.`);
const results = await runAll(root, [...cited.keys()]);
const previous = lock(root);

const claims = [];
for (const file of files) {
  const meta = readMeta(root, file);
  const names = meta?.sources ?? [];
  if (!names.length) continue;
  const text = readFileSync(join(root, file), "utf8");
  for (const name of names) {
    claims.push({ file, meta, ...check(text, name, results[name], previous[name]?.value) });
  }
}

const by = (state) => claims.filter((c) => c.state === state);
const say = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

console.log("");
for (const c of by("broken")) {
  console.log(`BROKEN   ${c.name}`);
  console.log(`         ${c.detail}`);
  console.log(`         cited by ${cited.get(c.name).join(", ")}`);
}
for (const c of by("stale")) {
  console.log(`STALE    ${c.file}`);
  console.log(`         ${c.name}: the page says ${c.form}, the source now says ${c.becomes}`);
  const may = c.meta?.state === "draft" || c.meta?.policy === "refresh" || c.meta?.policy === "open";
  console.log(`         ${may ? "refresh may fix this" : `policy does not allow a refresh here (state ${c.meta?.state ?? "unset"}, policy ${c.meta?.policy ?? "unset"})`}`);
}
for (const c of by("missing")) {
  console.log(`MISSING  ${c.file}`);
  console.log(`         ${c.name} says ${c.value}, and neither that nor the last recorded figure is in the file`);
  console.log(`         the sentence was reworded around the number, or the number was typed by hand`);
}

if (!quiet) {
  for (const file of files) {
    const meta = readMeta(root, file);
    const text = readFileSync(join(root, file), "utf8");
    const sourced = claims.filter((c) => c.file === file).map((c) => results[c.name]).filter(Boolean);
    const typed = typedFigures(text, sourced);
    if (!typed.length) continue;
    const line = (i) => text.slice(0, i).split("\n").length;
    console.log(`TYPED    ${file}`);
    console.log(`         ${say(typed.length, "figure")} with no source behind ${typed.length === 1 ? "it" : "them"}: ${typed.slice(0, 8).map((t) => `${t.text} (L${line(t.index)})`).join(", ")}${typed.length > 8 ? ", and more" : ""}`);
    void meta;
  }
}

console.log("");
console.log(
  [
    `${by("current").length} current`,
    `${by("stale").length} stale`,
    `${by("missing").length} missing`,
    `${by("broken").length} broken`,
  ].join(", "),
);

if (by("stale").length) {
  console.log("");
  console.log("Run refresh to bring the stale ones current. It changes the figure and nothing else,");
  console.log("and only where policy allows it.");
}

/* An exit code so this can sit in CI, where the thing worth failing on is a claim that has moved
   underneath the prose. A missing claim is a warning: it may just be good editing. */
process.exit(by("stale").length || by("broken").length ? 1 : 0);
