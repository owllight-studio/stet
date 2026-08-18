/**
 * Measuring prose, and the targets a voice sets for it.
 *
 * Extracted so `measure` and `audit` share one implementation. They were about to disagree, which
 * for a tool whose entire claim is that a voice has figures attached would be the worst possible
 * bug: two numbers for the same page, both produced by the same project.
 */

import { readFileSync, existsSync } from "node:fs";
import { join, relative, isAbsolute, sep } from "node:path";
import { config } from "./find.mjs";
import { matches } from "./glob.mjs";

/* --- the prose, with the not-prose taken out ------------------------------ */

/**
 * Strip everything that is not somebody's prose.
 *
 * Format matters here and getting it wrong is silent. A four-space indent means a code block in
 * Markdown and means nothing at all in HTML, so applying the Markdown rule to a page threw away
 * every indented line and measured a 1,300 word page as 64 words.
 */
export function prose(text, markup) {
  let t = text.replace(/^---\r?\n[\s\S]*?\r?\n---/, "");

  if (markup === "html") {
    t = t
      .replace(/<(script|style|pre|code|textarea)[\s\S]*?<\/\1>/gi, " ")
      .replace(/<!--[\s\S]*?-->/g, " ")
      // A table is a table in both formats. The Markdown branch below already drops `|...|` rows,
      // and leaving them in here made the two halves of one function disagree about the same page,
      // which is the exact bug this file was extracted to prevent.
      .replace(/<table[\s\S]*?<\/table>/gi, " ")
      // A block element ends a sentence. Every tag used to become a space, so ten table cells with
      // no full stop between them concatenated into one 122-word "sentence" and `measure` reported
      // a voice violation nobody had written. Worse, the run-ons masked the real distribution: the
      // same page measured 0.23 short sentences against a floor of 0.30 and was actually at 0.11.
      .replace(/<\/(p|li|h[1-6]|dt|dd|div|section|article|blockquote|figcaption|td|th|tr|caption)\s*>/gi, ".\n\n")
      // A quotation is not the author's prose. This project's own rule is that quotations keep
      // their own spelling whatever the style sheet says, and cadence is the same argument: the
      // homepage carries a 43-word specimen of machine writing on purpose, and measure was holding
      // the site's voice ceiling against it. `tells` has exempted quoted text since it was written.
      .replace(/\u201c[^\u201d]{0,600}\u201d/g, " ")
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

/*
 * Four lists, because the first one was doing four jobs and getting one of them backwards.
 *
 * The original single list was called HEDGES and contained "very" and "really", which are
 * intensifiers and the opposite of a hedge. Measuring Darwin's field notebooks found that 52 percent
 * of their "hedges" were the word "very", and an 1898 auction catalogue scored as heavily hedged on
 * 130 instances of "very" per 10,000 words. Both readings were nonsense, and both were used to set a
 * target in a voice preset.
 *
 * It also contained no modals, which is the qualification system of technical writing: documentation
 * runs 130 modals per 10,000 words, one every 77 words, so the most systematically qualified prose
 * in the library was scoring as the least.
 *
 * The lists deliberately overlap. "might" is both a modal and a hedge and is counted in both, because
 * these are four lenses rather than a partition.
 */

/**
 * The original list, unchanged, under the name of what it actually counts.
 *
 * Kept exactly as it was so that every figure ever measured with it stays true. Renaming it was the
 * honest fix: the count was never wrong, only its name, and the name is what made people reason
 * from it incorrectly.
 */
export const SOFTENERS = /\b(perhaps|maybe|somewhat|fairly|quite|rather|arguably|generally|typically|usually|often|might|could be|tends to|relatively|essentially|basically|actually|really|very|just)\b/gi;

/** Doubt about whether the thing is true. */
export const HEDGES = /\b(perhaps|maybe|possibly|probably|arguably|presumably|apparently|seemingly|likely|might|may be|could be|seems?|seemed|appears?|appeared|suggests?|tends? to|roughly|approximately)\b/gi;

/** Qualification by grammar rather than by adverb, and the thing documentation actually uses. */
export const MODALS = /\b(may|might|can|cannot|can't|could|must|should|shall|will|would)\b/gi;

/** The opposite of a hedge, counted separately so it can never again be mistaken for one. */
export const INTENSIFIERS = /\b(very|really|extremely|incredibly|hugely|massively|utterly|totally|absolutely|highly)\b/gi;

export function measure(raw, markup) {
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
    softenersPerSentence: Number((count(SOFTENERS) / sentences.length).toFixed(2)),
    hedgesPerSentence: Number((count(HEDGES) / sentences.length).toFixed(2)),
    modalsPerSentence: Number((count(MODALS) / sentences.length).toFixed(2)),
    intensifiersPerSentence: Number((count(INTENSIFIERS) / sentences.length).toFixed(2)),
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
  [/long sentences|long tail/i, "longSentences"],
  [/two long|adjacent long|long sentences in a row/i, "adjacentLong"],
  [/paragraph length,? median|paragraph/i, "paragraphMedian"],
  [/second person/i, "secondPerson"],
  [/questions/i, "questions"],
  [/exclamation/i, "exclamations"],
  [/soften|filler/i, "softenersPerSentence"],
  [/modal/i, "modalsPerSentence"],
  [/intensif|booster/i, "intensifiersPerSentence"],
  [/hedge/i, "hedgesPerSentence"],
];

/** "8 to 10 words" -> {min:8,max:10}. "35 words and up" -> {min:35}. "0%" -> {max:0}. */
export function target(raw) {
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

/**
 * Which voice governs this file.
 *
 * `voice` in the config is either one path, meaning the whole project writes in one register, or a
 * map of glob to path for a project that does not. A site is the case that forced it: `site/` is
 * written to sell and the reference material is written to be checked against, and holding a
 * landing page to the register of a measurement table would wreck it. Before this, `site/VOICE.md`
 * was protected content that no command could read, so the one part of this project written to a
 * declared voice was the one part nothing could hold to it.
 *
 * First matching glob wins, so the config author sets precedence by ordering, and a `*` entry at
 * the end is the fallback. No map, or nothing matching, means VOICE.md at the root.
 */
export function voiceFor(root, file) {
  const declared = config(root)?.voice;
  if (!declared) return "VOICE.md";
  if (typeof declared === "string") return declared;

  if (file && file !== "stdin") {
    const abs = isAbsolute(file) ? file : join(root, file);
    const rel = relative(root, abs).split(sep).join("/");
    for (const [glob, path] of Object.entries(declared)) {
      if (glob !== "*" && matches(rel, glob)) return path;
    }
  }
  return declared["*"] ?? "VOICE.md";
}

export function targets(root, file) {
  const path = join(root, voiceFor(root, file));
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
  "softenersPerSentence", "modalsPerSentence", "intensifiersPerSentence",
]);

/**
 * Put a target in the same units as the measurement.
 *
 * "30 to 40 percent" and "0.3 to 0.4" mean the same thing about the same metric, and somebody
 * writing a voice file will use whichever reads better in their table. Comparing 0.25 against 30
 * produces a verdict that is not wrong so much as meaningless, which is worse.
 */
/**
 * Metrics that are a ceiling by their nature. A voice file writes "longest: around 40, spent
 * rarely" and means do not run past forty. Stored as `about`, that was judged as needing to land
 * within a quarter either side, so a page whose longest sentence was 29 words failed for not being
 * long enough, and the only way to pass was to staple a clause onto a sentence that was finished.
 * This site was padded for a whole session by a check that was ordering it.
 *
 * A maximum cannot be too small. `about` on one of these means "up to about", never "close to".
 */
const CEILINGS = new Set(["sentenceMax", "sentenceP95", "sentenceP90"]);

export function normalise(metric, t) {
  if (!t) return t;
  if (CEILINGS.has(metric)) {
    if (t.about !== undefined && t.max === undefined) {
      t = { ...t, max: Math.round(t.about * 1.25), about: undefined };
    }
    /* A maximum cannot carry a minimum. The project voice writes "Longest 5%: 35 words and up",
       meaning its tail reaches 35, and the label table sent that to `sentenceMax` as a floor, so a
       page whose longest sentence ran to 33 failed for not being long enough. A voice that wants a
       long tail should say so with `longSentences`, which is a share and can be a floor. */
    if (t.min !== undefined && t.max === undefined) t = { ...t, min: undefined };
  }
  if (!RATIOS.has(metric)) return t;
  const scale = (n) => (n === undefined ? undefined : n > 1 ? n / 100 : n);
  return { min: scale(t.min), max: scale(t.max), about: scale(t.about) };
}

/* --- the verdict ----------------------------------------------------------- */

export function verdict(value, t) {
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


/** The markup a filename implies, which decides how the not-prose gets stripped. */
export const markupOf = (name) => (/\.x?html?$/i.test(name) ? "html" : "md");

/** Every metric that is off its target, for one piece of text. */
export function drift(raw, name, want) {
  const got = measure(raw, markupOf(name));
  if (!got) return null;
  const rows = Object.entries(got)
    .filter(([k]) => k !== "sentences" && k !== "words")
    .map(([k, v]) => ({ metric: k, value: v, ...verdict(v, normalise(k, want[k])) }));
  return { ...got, rows, off: rows.filter((r) => r.state === "over" || r.state === "under") };
}
