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

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { config } from "./lib/find.mjs";

const root = process.cwd();
const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const json = process.argv.includes("--json");

/* --- the prose, with the not-prose taken out ------------------------------ */

/**
 * Strip everything that is not somebody's prose.
 *
 * Format matters here and getting it wrong is silent. A four-space indent means a code block in
 * Markdown and means nothing at all in HTML, so applying the Markdown rule to a page threw away
 * every indented line and measured a 1,300 word page as 64 words.
 */
function prose(text, markup) {
  let t = text.replace(/^---\r?\n[\s\S]*?\r?\n---/, "");

  if (markup === "html") {
    t = t
      .replace(/<(script|style|pre|code|textarea)[\s\S]*?<\/\1>/gi, " ")
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;|&#160;/gi, " ")
      .replace(/&[a-z]+;|&#\d+;/gi, "");
    return t;
  }

  return t
    .replace(/```[\s\S]*?```/g, "")
    .replace(/^\s{4,}\S.*$/gm, "")
    .replace(/`[^`]*`/g, "")
    .replace(/^\|.*\|$/gm, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/^>.*$/gm, "")
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1");
}

const HEDGES = /\b(perhaps|maybe|somewhat|fairly|quite|rather|arguably|generally|typically|usually|often|might|could be|tends to|relatively|essentially|basically|actually|really|very|just)\b/gi;

function measure(raw, markup) {
  const text = prose(raw, markup);
  const paras = text.split(/\n\s*\n/).map((p) => p.replace(/\s+/g, " ").trim()).filter(Boolean);
  const sentences = paras
    .flatMap((p) => p.split(/(?<=[.!?])\s+/))
    .map((s) => s.trim())
    .filter((s) => /\w/.test(s));
  if (!sentences.length) return null;

  const lens = sentences.map((s) => s.split(/\s+/).filter(Boolean).length).sort((a, b) => a - b);
  const at = (q) => lens[Math.min(lens.length - 1, Math.floor(q * lens.length))];
  const mean = lens.reduce((a, b) => a + b, 0) / lens.length;
  const sd = Math.sqrt(lens.reduce((a, b) => a + (b - mean) ** 2, 0) / lens.length);
  const share = (n) => n / sentences.length;
  const count = (re) => (text.match(re) ?? []).length;

  let adjacentLong = 0;
  const inOrder = sentences.map((s) => s.split(/\s+/).filter(Boolean).length);
  for (let i = 0; i < inOrder.length - 1; i++) if (inOrder[i] >= 30 && inOrder[i + 1] >= 30) adjacentLong++;

  return {
    sentences: sentences.length,
    words: lens.reduce((a, b) => a + b, 0),
    sentenceMedian: at(0.5),
    sentenceMean: Number(mean.toFixed(1)),
    sentenceMax: lens[lens.length - 1],
    sentenceSdOverMean: Number((sd / mean).toFixed(2)),
    shortSentences: Number(share(lens.filter((l) => l < 6).length).toFixed(2)),
    longSentences: Number(share(lens.filter((l) => l >= 30).length).toFixed(2)),
    adjacentLong,
    paragraphMedian: paras.length
      ? paras.map((p) => p.split(/\s+/).length).sort((a, b) => a - b)[Math.floor(paras.length / 2)]
      : 0,
    secondPerson: Number(share(sentences.filter((s) => /\b(you|your|yours)\b/i.test(s)).length).toFixed(2)),
    questions: Number(share(sentences.filter((s) => s.endsWith("?")).length).toFixed(2)),
    exclamations: count(/!(?!=)/g),
    hedgesPerSentence: Number((count(HEDGES) / sentences.length).toFixed(2)),
  };
}

/* --- what the voice asks for ---------------------------------------------- */

/** Table labels people actually write, mapped to the keys the presets already use. */
const LABELS = [
  [/sentence length,? median|median sentence|typical sentence/i, "sentenceMedian"],
  [/sentence length,? mean|mean sentence/i, "sentenceMean"],
  [/longest/i, "sentenceMax"],
  [/varies|variance|sd ?\/ ?mean|standard deviation/i, "sentenceSdOverMean"],
  [/very short|under (six|6)|short sentences/i, "shortSentences"],
  [/two long|adjacent long|long sentences in a row/i, "adjacentLong"],
  [/paragraph length,? median|paragraph/i, "paragraphMedian"],
  [/second person/i, "secondPerson"],
  [/questions/i, "questions"],
  [/exclamation/i, "exclamations"],
  [/hedge/i, "hedgesPerSentence"],
];

/** "8 to 10 words" -> {min:8,max:10}. "35 words and up" -> {min:35}. "0%" -> {max:0}. */
function target(raw) {
  const v = String(raw).trim().toLowerCase();
  if (/^never$|^none$|^zero$/.test(v)) return { max: 0 };
  if (/a lot|wide|deliberately/.test(v)) return { min: 0.5 };
  const pct = /%|per ?cent/.test(v);
  const nums = [...v.matchAll(/\d+(?:\.\d+)?/g)].map((m) => Number(m[0]) / (pct ? 100 : 1));
  if (!nums.length) return null;
  if (/ to |–|-|between/.test(v) && nums.length >= 2) return { min: nums[0], max: nums[1] };
  if (/and up|or more|at least|minimum/.test(v)) return { min: nums[0] };
  if (/or fewer|at most|maximum|under|below|near/.test(v)) return { max: nums[0] };
  return { about: nums[0] };
}

function targets(root) {
  const path = join(root, config(root)?.voice ?? "VOICE.md");
  if (!existsSync(path)) return { path, targets: {} };
  const text = readFileSync(path, "utf8");

  const out = {};
  // Front matter wins, and matches the shape the presets already use.
  const fm = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const block = fm?.[1].match(/^measured:\s*$([\s\S]*?)(?=^\S|\Z)/m);
  if (block) {
    for (const line of block[1].split("\n")) {
      const m = line.match(/^\s+([a-zA-Z]+)\s*:\s*(.+)$/);
      if (m) out[m[1]] = target(m[2]);
    }
  }

  for (const row of text.matchAll(/^\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*$/gm)) {
    const [, label, value] = row;
    if (/^-+$/.test(label) || !label.trim()) continue;
    const hit = LABELS.find(([re]) => re.test(label));
    if (hit && !(hit[1] in out)) {
      const t = target(value);
      if (t) out[hit[1]] = t;
    }
  }
  return { path, targets: out };
}

/** Metrics measured as a share of sentences. A target written as a whole number means percent. */
const RATIOS = new Set([
  "sentenceSdOverMean", "shortSentences", "longSentences",
  "secondPerson", "questions", "hedgesPerSentence",
]);

/**
 * Put a target in the same units as the measurement.
 *
 * "30 to 40 percent" and "0.3 to 0.4" mean the same thing about the same metric, and somebody
 * writing a voice file will use whichever reads better in their table. Comparing 0.25 against 30
 * produces a verdict that is not wrong so much as meaningless, which is worse.
 */
function normalise(metric, t) {
  if (!t || !RATIOS.has(metric)) return t;
  const scale = (n) => (n === undefined ? undefined : n > 1 ? n / 100 : n);
  return { min: scale(t.min), max: scale(t.max), about: scale(t.about) };
}

/* --- the verdict ----------------------------------------------------------- */

function verdict(value, t) {
  if (!t) return { state: "unset" };
  if (t.max !== undefined && value > t.max) return { state: "over", want: `at most ${t.max}` };
  if (t.min !== undefined && value < t.min) return { state: "under", want: `at least ${t.min}` };
  if (t.about !== undefined) {
    const slack = Math.max(1, t.about * 0.25);
    if (value > t.about + slack) return { state: "over", want: `about ${t.about}` };
    if (value < t.about - slack) return { state: "under", want: `about ${t.about}` };
  }
  return { state: "ok" };
}

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

const markupOf = (name) => (/\.x?html?$/i.test(name) ? "html" : "md");
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
