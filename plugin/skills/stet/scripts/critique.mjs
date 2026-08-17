#!/usr/bin/env node
/**
 * A scored review of one piece, where every score is computed.
 *
 * The obvious version of this command is worthless: an opinion with a number attached, unreproducible
 * and unarguable. So nothing here is scored on taste. Each dimension is counted, the count is
 * printed next to the verdict, and the total is the tally of the dimensions rather than a figure
 * anybody chose.
 *
 * Three of the dimensions are craft rules from the voice research made mechanical, which is the part
 * worth having built:
 *
 *   The ending test. "Delete your last paragraph. If the piece reads as finished, it was a summary."
 *   A summary introduces no new terms, because it is made of words already on the page, so this is
 *   a set difference rather than a judgement.
 *
 *   The opening test. Throat-clearing is a first paragraph that does not contain the subject, and a
 *   piece's subject is what it is called. How far in the title's own words first appear is the
 *   measurement.
 *
 *   Altitude. Sentences making a general claim with no number, name or date in them. Low and
 *   clustered at section ends is argument. Uniform across the text is intoning.
 *
 * What it cannot compute, it says it cannot compute, and asks for a read.
 *
 * Run: node critique.mjs <file>
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { read as readMeta, mayEdit } from "./lib/meta.mjs";
import { prose, measure, targets, normalise, verdict, markupOf } from "./lib/prose.mjs";
import { split } from "./lib/blocks.mjs";
import { runAll, lock, check as checkClaim, declared } from "./lib/sources.mjs";

const root = process.cwd();
const [file] = process.argv.slice(2);
if (!file) {
  console.log("critique.mjs <file>");
  process.exit(1);
}

const raw = readFileSync(join(root, file), "utf8");
const body = prose(raw, markupOf(file));
const meta = readMeta(root, file);

const STOP = new Set(
  ("the a an and or but of to in for on at by with from as is are was were be been being it its this that these " +
   "those not no so if then than when where which who whom what how why can could may might will would shall " +
   "should must do does did done have has had having you your yours we our ours i my me they them their he she " +
   "his her one also there here about into out up down over under again more most other some such only own same " +
   "very just now new any each few too its it's").split(" "),
);
const tokens = (t) => (t.toLowerCase().match(/[a-z][a-z'-]{2,}/g) ?? []).filter((w) => !STOP.has(w));

const sentences = body
  .split(/\n\s*\n/)
  .flatMap((p) => p.replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+/))
  .map((s) => s.trim())
  .filter((s) => /\w/.test(s));

const dims = [];
const score = (name, state, said, note) => dims.push({ name, state, said, note });

/* --- voice ---------------------------------------------------------------- */

const { targets: want } = targets(root);
const got = measure(raw, markupOf(file));
if (got && Object.keys(want).length) {
  const off = Object.entries(got)
    .filter(([k]) => k !== "sentences" && k !== "words")
    .map(([k, v]) => ({ metric: k, value: v, ...verdict(v, normalise(k, want[k])) }))
    .filter((r) => r.state === "over" || r.state === "under");
  score("voice", off.length === 0 ? "ok" : off.length <= 2 ? "warn" : "fail",
    off.length ? off.map((r) => `${r.metric} ${r.value} (${r.want})`).join(", ") : "on target",
    off.length ? "measure" : null);
} else {
  score("voice", "unset", "no targets in the voice file", "voice");
}

/* --- variance, separately, because it is the machine-written signature ----- */

if (got) {
  const v = got.sentenceSdOverMean;
  score("variance", v >= 0.5 ? "ok" : v >= 0.35 ? "warn" : "fail",
    `sd over mean ${v}`,
    v < 0.5 ? "most measured registers run 0.5 to 0.8, though field notes reach 1.14 and catalogue entries 1.19. Below 0.35 reads as machine-written" : null);
}

/* --- density -------------------------------------------------------------- */

const cw = tokens(body);
const window = 100;
let vocab = cw.length ? new Set(cw).size / cw.length : 1;
if (cw.length > window) {
  let sum = 0;
  for (let i = 0; i + window <= cw.length; i++) sum += new Set(cw.slice(i, i + window)).size / window;
  vocab = sum / (cw.length - window + 1);
}
const ws = body.toLowerCase().match(/[a-z][a-z'-]*/g) ?? [];
const grams = new Map();
for (let i = 0; i + 4 <= ws.length; i++) {
  const g = ws.slice(i, i + 4).join(" ");
  grams.set(g, (grams.get(g) ?? 0) + 1);
}
const echoed = [...grams.values()].filter((n) => n > 1).reduce((a, b) => a + b, 0) / Math.max(1, ws.length - 3);
score("density", vocab >= 0.75 && echoed <= 0.02 ? "ok" : vocab >= 0.65 ? "warn" : "fail",
  `vocabulary ${vocab.toFixed(2)}, repeated phrases ${(echoed * 100).toFixed(1)}%`,
  vocab < 0.75 ? "the same words keep coming back, which is what restatement looks like from outside" : null);

/* --- the ending test ------------------------------------------------------ */

const blocks = split(root, file).blocks.filter((b) => b.kind !== "code");
if (blocks.length >= 3) {
  const last = blocks[blocks.length - 1];
  const before = new Set(tokens(blocks.slice(0, -1).map((b) => b.text).join(" ")));
  const lastTerms = tokens(last.text);
  const fresh = [...new Set(lastTerms)].filter((w) => !before.has(w));
  const distinct = new Set(lastTerms).size;
  const ratio = lastTerms.length ? fresh.length / distinct : 1;
  if (distinct < 8) {
    score("ending", "unset", `the last block is ${distinct} distinct ${distinct === 1 ? "term" : "terms"}, too short to judge`, null);
  } else score("ending", ratio >= 0.3 ? "ok" : ratio >= 0.15 ? "warn" : "fail",
    `${fresh.length} of ${new Set(lastTerms).size} distinct terms in the last block are new`,
    ratio < 0.3
      ? "delete the last block and read it. If nothing is lost it was a summary, and endings do one of five things: an image, a return to the opening escalated, what you learned writing it, the consequence, or the thesis compressed harder than its first statement"
      : null);
}

/* --- the opening test ----------------------------------------------------- */

/*
 * What a piece is about is what it is called, not what word it uses most.
 *
 * Frequency was the first attempt and it is wrong: the commonest content words in a reference page
 * are its working vocabulary rather than its subject, so it reported files as opening five sentences
 * late when they had named their subject in the title and got straight on with it.
 */
if (sentences.length >= 6) {
  const heading = raw.match(/^#\s+(.+)$/m)?.[1] ?? raw.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? "";
  const subject = tokens(heading.replace(/<[^>]+>/g, " "));
  if (subject.length) {
    const firstHit = sentences.findIndex((s) => subject.some((w) => s.toLowerCase().includes(w)));
    const at = firstHit < 0 ? sentences.length : firstHit;
    score("opening", at <= 1 ? "ok" : at <= 3 ? "warn" : "fail",
      at === 0 ? "the subject is in the first sentence" : `the subject first appears in sentence ${at + 1}`,
      at > 1 ? `the piece is called "${heading.replace(/<[^>]+>/g, " ").trim()}" and the first ${at} ${at === 1 ? "sentence is" : "sentences are"} a runway` : null);
  }
}

/* --- altitude ------------------------------------------------------------- */

if (sentences.length >= 8) {
  const specific = (s) => /\d/.test(s) || /(?<![.!?]\s)(?<!^)\b[A-Z][a-z]{2,}\b/.test(s) || /["“]/.test(s);
  const general = sentences.filter((s) => !specific(s));
  const share = general.length / sentences.length;
  score("altitude", share <= 0.55 ? "ok" : share <= 0.75 ? "warn" : "fail",
    `${Math.round(share * 100)}% of sentences carry no number, name or quotation`,
    share > 0.55
      ? "for each of those, ask what specific observation produced it. Where there is none, it is decoration"
      : null);
}

/* --- claims --------------------------------------------------------------- */

const specs = declared(root);
const cites = meta?.sources ?? [];
if (Object.keys(specs).length) {
  if (cites.length) {
    const results = await runAll(root, cites);
    const previous = lock(root);
    const states = cites.map((n) => checkClaim(raw, n, results[n], previous[n]?.value));
    const bad = states.filter((c) => c.state !== "current");
    score("claims", bad.length ? "fail" : "ok",
      bad.length ? bad.map((c) => `${c.name} ${c.state}`).join(", ") : `${cites.length} current`,
      bad.length ? "verify" : null);
  } else {
    const figures = (body.match(/(?<![\w.])\d[\d,]*(?:\.\d+)?\s*(%|percent)?/g) ?? []).length;
    score("claims", figures >= 3 ? "warn" : "ok",
      figures ? `${figures} figures, no sources named` : "no figures",
      figures >= 3 ? "nothing will notice when these go stale" : null);
  }
}

/* --- can this even be acted on? ------------------------------------------- */

score("actionable", mayEdit(meta) ? "ok" : "warn",
  mayEdit(meta) ? `state ${meta?.state ?? "unset"}` : `state ${meta?.state ?? "unset"}, so the words are closed`,
  mayEdit(meta) ? null : "everything below is a conversation with the author rather than a task");

/* --- report --------------------------------------------------------------- */

const MARK = { ok: "ok  ", warn: "warn", fail: "FAIL", unset: "    " };
console.log(`${file}`);
console.log(`  ${got?.sentences ?? 0} sentences, ${got?.words ?? 0} words\n`);

for (const d of dims) {
  console.log(`  ${MARK[d.state]}  ${d.name.padEnd(11)} ${d.said}`);
  if (d.note) {
    for (const line of d.note.match(/.{1,74}(\s|$)/g) ?? []) console.log(`              ${line.trim()}`);
  }
}

const counted = dims.filter((d) => d.state !== "unset");
const clean = counted.filter((d) => d.state === "ok").length;
console.log(`\n  ${clean} of ${counted.length} clean.`);

/* --- and what it cannot count --------------------------------------------- */

console.log(`
  Not measured, and worth a read:
    is every claim one the piece actually supports, rather than one it asserts confidently
    does the structure match what this page is for, per restructure
    would a reader who does not already agree be persuaded
    is there a paragraph here that exists because it was easy to write`);

process.exit(dims.some((d) => d.state === "fail") ? 1 : 0);
