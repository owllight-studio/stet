#!/usr/bin/env node
/**
 * Does this piece of writing actually match the voice it claims to be in.
 *
 * `voice-stats` measures a corpus to derive a voice. This measures one piece against a voice that
 * already exists, which is the check `write`, `tighten` and `clarify` all need and none of them had.
 * Without it the voice file is an opinion, and the whole argument of this project is that a voice
 * has figures attached.
 *
 * It judges, which voice-stats deliberately does not. That is the difference between describing a
 * corpus and holding a draft to a standard.
 *
 * Targets come from VOICE.md: a `measured:` block in its front matter if it has one, otherwise its
 * Measured table. Metrics with no target are reported without a verdict, because knowing the number
 * is useful even where nobody has decided what it should be.
 *
 * Run: node measure.mjs [file ...]        or pipe prose in on stdin
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { measure, targets, verdict, normalise, markupOf } from "./lib/prose.mjs";

const root = process.cwd();
const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const json = process.argv.includes("--json");

async function stdin() {
  if (process.stdin.isTTY) return null;
  let s = "";
  for await (const chunk of process.stdin) s += chunk;
  return s;
}

const { path: voicePath, targets: want } = targets(root);
const piped = args.length ? null : await stdin();

if (!args.length && !piped) {
  console.log("Nothing to measure. Give it a file, or pipe prose in.");
  process.exit(0);
}

const jobs = piped ? [["stdin", piped]] : args.map((f) => [f, readFileSync(join(root, f), "utf8")]);
const report = [];
let drifted = 0;

for (const [name, raw] of jobs) {
  const got = measure(raw, markupOf(name));
  if (!got) {
    console.log(`${name}: no prose in it.`);
    continue;
  }

  const rows = Object.entries(got)
    .filter(([k]) => k !== "sentences" && k !== "words")
    .map(([k, v]) => ({ metric: k, value: v, ...verdict(v, normalise(k, want[k])) }));

  report.push({ file: name, sentences: got.sentences, words: got.words, rows });
  if (!json) {
    console.log(`${name}  ${got.sentences} sentences, ${got.words} words`);
    if (!Object.keys(want).length) {
      console.log(`  no targets in ${voicePath}, so these are facts rather than a verdict`);
    }
    for (const r of rows) {
      const mark = r.state === "ok" ? "ok  " : r.state === "unset" ? "    " : r.state === "over" ? "OVER" : "UNDR";
      if (r.state === "over" || r.state === "under") drifted++;
      console.log(`  ${mark} ${r.metric.padEnd(20)} ${String(r.value).padStart(6)}${r.want ? `   want ${r.want}` : ""}`);
    }
    console.log("");
  }
}

if (json) console.log(JSON.stringify(report, null, 2));
else if (Object.keys(want).length) {
  console.log(drifted ? `${drifted} off target.` : "On target.");
}

/* Non-zero on drift so this can gate a commit. A voice with no targets never fails, because an
   absent standard is not a failed one. */
process.exit(drifted ? 1 : 0);
