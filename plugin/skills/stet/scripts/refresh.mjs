#!/usr/bin/env node
/**
 * Change the figure. Leave the sentence.
 *
 * This is the command the authorship model exists to make sayable. `authored` plus `refresh` means
 * these are my words and I want the numbers in them kept true, and until now that was a promise the
 * config could express and nothing could keep.
 *
 * What it does is deliberately small. For a claim whose recorded figure appears in the prose and
 * whose source has moved, it replaces that one substring with the new figure in the written form
 * the author chose. It does not reword. It does not reflow. It does not touch a claim it cannot
 * locate, and it does not touch a file whose policy forbids it, including when the author is the
 * one running it, because the point of a policy is that it holds when it is inconvenient.
 *
 * Run: node refresh.mjs [file ...] [--dry]
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { findContent } from "./lib/find.mjs";
import { read as readMeta, mayRefresh } from "./lib/meta.mjs";
import { runAll, lock, writeLock, check, declared, findForm } from "./lib/sources.mjs";


const root = process.cwd();
const dry = process.argv.includes("--dry");
const only = process.argv.slice(2).filter((a) => !a.startsWith("--"));

if (!Object.keys(declared(root)).length) {
  console.log("No sources are declared, so there is nothing to refresh from. See verify.");
  process.exit(0);
}

const files = only.length ? only : findContent(root).files;

const cited = new Map();
for (const file of files) {
  for (const name of readMeta(root, file)?.sources ?? []) {
    if (!cited.has(name)) cited.set(name, []);
    cited.get(name).push(file);
  }
}
if (!cited.size) {
  console.log("No content in scope cites a source.");
  process.exit(0);
}

console.log(`Running ${cited.size} ${cited.size === 1 ? "source" : "sources"}.`);
const results = await runAll(root, [...cited.keys()]);
const previous = lock(root);

const changed = [];
const refused = [];
const untouched = [];

for (const file of files) {
  const meta = readMeta(root, file);
  const names = meta?.sources ?? [];
  if (!names.length) continue;

  let text = readFileSync(join(root, file), "utf8");
  const before = text;

  for (const name of names) {
    const claim = check(text, name, results[name], previous[name]?.value);
    if (claim.state !== "stale") {
      if (claim.state === "missing" || claim.state === "broken") untouched.push({ file, ...claim });
      continue;
    }

    if (!mayRefresh(meta)) {
      refused.push({ file, ...claim, meta });
      continue;
    }

    /* Located again against the current text rather than reusing the earlier offset, because an
       earlier replacement in the same file has already moved everything after it. */
    const at = findForm(text, claim.was, results[name].as);
    if (!at) {
      untouched.push({ file, name, state: "missing", value: claim.value });
      continue;
    }

    text = text.slice(0, at.index) + claim.becomes + text.slice(at.index + at.form.length);
    changed.push({ file, name, from: at.form, to: claim.becomes });
  }

  if (text !== before && !dry) writeFileSync(join(root, file), text);
}

/**
 * Advance the lock only where the prose actually caught up.
 *
 * The lock records what the content is believed to be claiming, which is the only thing that lets a
 * later run tell a stale figure from a reworded sentence. So a source is held back if any file
 * still says the old number: one that policy refused, or one whose figure could not be found.
 *
 * Advancing it regardless is a bug I shipped and then caught in a test. The refused file stopped
 * reporting as stale and started reporting as missing, because the recorded value had moved on
 * without it. The operator lost the true state of the one file the policy existed to protect.
 */
if (!dry) {
  const heldBack = new Set([...refused, ...untouched].map((c) => c.name));
  const next = { ...previous };
  const stamp = new Date().toISOString().slice(0, 10);
  for (const [name, r] of Object.entries(results)) {
    if (r.error || heldBack.has(name)) continue;
    next[name] = { value: r.value, as: r.as, seen: stamp };
  }
  writeLock(root, next);

  const held = [...heldBack].filter((n) => !results[n]?.error);
  if (held.length) {
    console.log("");
    console.log(`Held the recorded figure for ${held.join(", ")}, because content still claims the old one.`);
    console.log("It will keep reporting as stale until that content is refreshed or rewritten.");
  }
}

console.log("");
for (const c of changed) console.log(`${dry ? "WOULD  " : "CHANGED"}  ${c.file}\n         ${c.name}: ${c.from} became ${c.to}`);
for (const r of refused) {
  console.log(`REFUSED  ${r.file}`);
  console.log(`         ${r.name} has moved from ${r.form} to ${r.becomes}, and policy does not allow a refresh here.`);
  console.log(`         state ${r.meta?.state ?? "unset"}, policy ${r.meta?.policy ?? "unset"}. Set policy: refresh to permit it.`);
}
for (const u of untouched) {
  console.log(`LEFT     ${u.file}`);
  console.log(`         ${u.name}: ${u.state === "broken" ? u.detail : "could not find the figure in the prose, so nothing was changed"}`);
}

console.log("");
if (!changed.length && !refused.length && !untouched.length) {
  console.log("Every claim in scope is already current.");
} else {
  console.log(`${changed.length} ${dry ? "would change" : "changed"}, ${refused.length} refused, ${untouched.length} left alone.`);
}
if (dry) console.log("\nDry run. Nothing was written and the lock did not advance.");
else if (changed.length) console.log("\nThe figures moved and no other word did. Read the diff.");
