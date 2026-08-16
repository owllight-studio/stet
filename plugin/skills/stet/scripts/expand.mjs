#!/usr/bin/env node
/**
 * A stub into a finished piece, and the two ways that goes wrong.
 *
 * This is the most dangerous command in the toolkit, because inflation is the first failure this
 * whole project was built against. Every other command either removes words or leaves the count
 * alone. This one is licensed to add them, which makes it the only place where "it writes too much"
 * is not a bug but the job description slightly misread.
 *
 * So it ships with the two checks that catch the misreading, and both are countable.
 *
 *   Did the length become information? Real expansion introduces examples, names, figures and
 *   caveats. Padding says the same thing three ways, so it keeps reusing the same content words and
 *   repeating whole phrases. Both are countable, and on a real pair built from one stub they
 *   separate cleanly: vocabulary 0.57 against 0.93, repeated four-word runs 7.1% against zero.
 *
 *   The obvious measure does not work, which is worth recording. Counting how many new distinct
 *   words arrive per hundred words added scored the padded version at 23.6 and passed it, because
 *   restating a point in different words is still new words.
 *
 *   Did every point survive? Six bullets become four paragraphs and one bullet quietly disappears.
 *   Nobody notices, because finished prose looks finished. The stub is checked point by point.
 *
 *   node expand.mjs from <stub>            record the stub before expanding it
 *   node expand.mjs check <file>           what the expansion actually added, and what it lost
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { prose, measure, targets, normalise, verdict, markupOf } from "./lib/prose.mjs";

const root = process.cwd();
const [mode, target] = process.argv.slice(2);
const SNAP = join(root, ".stet", "expand.json");

if (!mode || !target || !["from", "check"].includes(mode)) {
  console.log("expand.mjs from  <stub>     record the stub first");
  console.log("expand.mjs check <file>     after expanding it");
  process.exit(1);
}

const STOP = new Set(
  ("the a an and or but of to in for on at by with from as is are was were be been being it its this that these " +
   "those not no so if then than when where which who whom what how why can could may might will would shall " +
   "should must do does did done have has had having you your yours we our ours i my me they them their theirs " +
   "he she his her hers one also there here about into out up down over under again more most other some such " +
   "only own same very just now new any each few own too s t don now").split(" "),
);

const contentTokens = (text) =>
  (text.toLowerCase().match(/[a-z][a-z'-]{2,}/g) ?? []).filter((w) => !STOP.has(w));

const content = (text) => new Set(contentTokens(text));

/**
 * How much of the vocabulary repeats, measured so length does not decide the answer.
 *
 * A plain type-token ratio falls as a text gets longer whatever its quality, so a long good page
 * and a short padded one score the same. Averaging the ratio across a fixed window removes that,
 * and what is left is the thing worth knowing: does this text keep saying the same words.
 *
 * Measured on a real pair: padded prose 0.57, the same points written properly 0.91.
 */
function vocabulary(tokens, window = 100) {
  if (tokens.length <= window) {
    return tokens.length ? new Set(tokens).size / tokens.length : 1;
  }
  let sum = 0;
  for (let i = 0; i + window <= tokens.length; i++) {
    sum += new Set(tokens.slice(i, i + window)).size / window;
  }
  return sum / (tokens.length - window + 1);
}

/** Share of four-word sequences that occur more than once. Restatement repeats phrases; prose does not. */
function echoes(text) {
  const ws = text.toLowerCase().match(/[a-z][a-z'-]*/g) ?? [];
  if (ws.length < 8) return 0;
  const counts = new Map();
  for (let i = 0; i + 4 <= ws.length; i++) {
    const g = ws.slice(i, i + 4).join(" ");
    counts.set(g, (counts.get(g) ?? 0) + 1);
  }
  let repeated = 0;
  for (const n of counts.values()) if (n > 1) repeated += n;
  return repeated / Math.max(1, ws.length - 3);
}

/** The specifics that carry information: figures, and capitalised names that are not sentence-initial. */
const specifics = (text) => {
  const out = new Set();
  for (const m of text.matchAll(/(?<![\w.])\d[\d,]*(?:\.\d+)?%?/g)) out.add(m[0]);
  for (const m of text.matchAll(/(?<![.!?]\s)(?<!^)\b([A-Z][a-z]{2,})\b/gm)) out.add(m[1]);
  return out;
};

/** The points a stub makes: bullets if it has them, otherwise sentences. */
const points = (text) => {
  const bullets = [...text.matchAll(/^\s*(?:[-*+]|\d+\.)\s+(.+)$/gm)].map((m) => m[1].trim());
  if (bullets.length) return bullets;
  return text
    .split(/\n\s*\n|(?<=[.!?])\s+/)
    .map((s) => s.replace(/^#+\s*/, "").trim())
    .filter((s) => s.split(/\s+/).length >= 3);
};

const load = () => (existsSync(SNAP) ? JSON.parse(readFileSync(SNAP, "utf8")) : {});

/* --- from ----------------------------------------------------------------- */

if (mode === "from") {
  const raw = readFileSync(join(root, target), "utf8");
  const body = prose(raw, markupOf(target));
  const all = load();
  all[target] = {
    taken: new Date().toISOString().slice(0, 19).replace("T", " "),
    words: body.split(/\s+/).filter(Boolean).length,
    content: [...content(body)],
    specifics: [...specifics(body)],
    points: points(body),
  };
  mkdirSync(dirname(SNAP), { recursive: true });
  writeFileSync(SNAP, `${JSON.stringify(all, null, 2)}\n`);
  console.log(`${target}: ${all[target].words} words, ${all[target].points.length} points recorded.`);
  console.log("\nExpand it now. Then check it.");
  process.exit(0);
}

/* --- check ---------------------------------------------------------------- */

const all = load();
const snap = all[target];
if (!snap) {
  console.log(`No stub recorded for ${target}. Run \`from\` before expanding, not after.`);
  process.exit(1);
}

const raw = readFileSync(join(root, target), "utf8");
const body = prose(raw, markupOf(target));
const now = body.split(/\s+/).filter(Boolean).length;

const wasContent = new Set(snap.content);
const nowContent = content(body);
const addedTerms = [...nowContent].filter((w) => !wasContent.has(w));

const wasSpecifics = new Set(snap.specifics);
const addedSpecifics = [...specifics(body)].filter((s) => !wasSpecifics.has(s));

const addedWords = now - snap.words;

console.log(`${target}`);
console.log(`  ${snap.words} words became ${now}, recorded ${snap.taken}`);
console.log("");

let problems = 0;

/* --- did the length become information? ----------------------------------- */

if (addedWords > 20) {
  const vocab = vocabulary(contentTokens(body));
  const echoed = echoes(body);
  const spec100 = (addedSpecifics.length / addedWords) * 100;

  console.log(`  ADDED       ${addedWords} words`);
  console.log(`              vocabulary ${vocab.toFixed(2)}, where 1.0 never repeats a word and 0.5 repeats half of them`);
  console.log(`              repeated phrases ${(echoed * 100).toFixed(1)}% of four-word runs`);
  console.log(`              ${addedSpecifics.length} new figures or names, ${spec100.toFixed(1)} per 100 words added`);

  if (vocab < 0.7 || echoed > 0.03) {
    problems++;
    console.log(`\n  PADDING     most of the added length is restatement rather than information.`);
    console.log(`              The claim, then the claim again in different words, then an analogy`);
    console.log(`              for the claim. The reader has now been told three times.`);
    console.log(`              Cut back to the stub and expand with examples, figures and caveats.`);
  } else if (spec100 < 1 && addedWords > 150) {
    console.log(`\n  THIN        the vocabulary is varied and almost no figures or names arrived.`);
    console.log(`              Expansion that adds only abstractions reads as longer without being`);
    console.log(`              fuller, and it is the harder version of the same failure to see.`);
  }
  console.log("");
}

/* --- did every point survive? --------------------------------------------- */

const lowerBody = body.toLowerCase();
const dropped = [];
for (const p of snap.points ?? []) {
  const keys = [...content(p)];
  if (!keys.length) continue;
  const kept = keys.filter((k) => lowerBody.includes(k));
  if (kept.length / keys.length < 0.5) dropped.push({ point: p, kept: kept.length, of: keys.length });
}

if (dropped.length) {
  problems++;
  console.log(`  POINTS LOST ${dropped.length}`);
  for (const d of dropped) {
    console.log(`              ${d.point.length > 70 ? `${d.point.slice(0, 69)}…` : d.point}`);
    console.log(`                only ${d.kept} of ${d.of} of its terms survived`);
  }
  console.log(`\n              Finished prose looks finished, which is why a dropped point is`);
  console.log(`              invisible on a read-through and obvious here.`);
  console.log("");
}

/* --- did it flatten? ------------------------------------------------------ */

const { targets: want } = targets(root);
const got = measure(raw, markupOf(target));
if (got && Object.keys(want).length) {
  const off = Object.entries(got)
    .filter(([k]) => k !== "sentences" && k !== "words")
    .map(([k, v]) => ({ metric: k, value: v, ...verdict(v, normalise(k, want[k])) }))
    .filter((r) => r.state === "over" || r.state === "under");
  if (off.length) {
    console.log(`  OFF VOICE   ${off.map((r) => `${r.metric} ${r.value} (${r.want})`).join(", ")}`);
    console.log(`              expansion drifts toward uniform medium-length sentences, because a`);
    console.log(`              paragraph written to fill a bullet tends to be the same size every`);
    console.log(`              time. Check the variance before the median.`);
    console.log("");
  }
}

if (problems) {
  console.log(`${problems} to fix. A stub that became longer without becoming fuller is the failure this`);
  console.log("project was named after.");
  process.exit(1);
}
console.log("Longer, and fuller. Every point survived.");
