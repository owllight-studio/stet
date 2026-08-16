/**
 * The mechanical half of a voice.
 *
 * `voice` derives the house style by reading. This measures the part that can be measured, because
 * "median sentence 14 words, and the longest five percent carry the arguments" is an instruction a
 * writer can follow and "concise" is not.
 *
 * Nothing here judges. A high hedge rate is a fact about the corpus, and whether it is a problem is
 * the author's call.
 */

import { readFileSync } from "node:fs";
import { join, extname } from "node:path";
import { findContent } from "./lib/find.mjs";

const root = process.cwd();
const { files } = findContent(root);

const HEDGES = /\b(perhaps|maybe|somewhat|fairly|quite|rather|arguably|generally|typically|usually|often|might|could be|tends to|relatively|essentially|basically|actually|really|very|just)\b/gi;
const AI_TICS = /\b(delve|dive in|leverage|utilize|robust|seamless|unlock|elevate|game.chang|cutting.edge|it'?s important to note|in today'?s|landscape|realm|tapestry|testament)\b/gi;

/** Strip the parts of a file that are not prose, so code and frontmatter do not skew the numbers. */
function prose(text, ext) {
  let t = text;
  t = t.replace(/^---\r?\n[\s\S]*?\r?\n---/, "");        // frontmatter
  t = t.replace(/```[\s\S]*?```/g, "");                   // fenced code
  t = t.replace(/^\s{4,}\S.*$/gm, "");                    // indented code
  t = t.replace(/`[^`]*`/g, "");                          // inline code
  t = t.replace(/^\|.*\|$/gm, "");                        // tables
  t = t.replace(/<[^>]+>/g, " ");                         // html
  // A quoted example of a habit is not the habit. Found by measuring Stet's own writing, where the
  // file that lists the tics was counted as committing them.
  t = t.replace(/"[^"]{0,80}"/g, '""');
  if (ext === ".json") t = t.replace(/"[a-zA-Z_]+"\s*:/g, " ");
  return t;
}

const sentences = [];
const paragraphs = [];
let headings = 0;
let listItems = 0;
let questions = 0;
let exclamations = 0;
let secondPerson = 0;
let hedges = 0;
let tics = 0;
let passive = 0;
let read = 0;

for (const file of files) {
  let text;
  try {
    text = readFileSync(join(root, file), "utf8");
  } catch {
    continue;
  }
  read++;
  const ext = extname(file);
  headings += (text.match(/^#{1,6}\s/gm) ?? []).length;
  listItems += (text.match(/^\s*([-*+]|\d+\.)\s/gm) ?? []).length;

  const body = prose(text, ext);
  for (const para of body.split(/\n\s*\n/)) {
    const clean = para.replace(/\s+/g, " ").trim();
    if (clean.length < 40) continue;
    paragraphs.push(clean.split(" ").length);
    for (const s of clean.split(/(?<=[.!?])\s+(?=[A-Z"'(\[])/)) {
      const words = s.trim().split(/\s+/).filter(Boolean);
      if (words.length < 2) continue;
      sentences.push(words.length);
      if (s.includes("?")) questions++;
      if (s.includes("!")) exclamations++;
      if (/\b(you|your|yours)\b/i.test(s)) secondPerson++;
      hedges += (s.match(HEDGES) ?? []).length;
      tics += (s.match(AI_TICS) ?? []).length;
      if (/\b(is|are|was|were|be|been|being)\s+\w+(ed|en)\b/i.test(s)) passive++;
    }
  }
}

if (!sentences.length) {
  console.log("No prose found to measure.");
  process.exit(0);
}

const sorted = [...sentences].sort((a, b) => a - b);
const at = (q) => sorted[Math.floor(sorted.length * q)] ?? 0;
const mean = (xs) => Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10;
const pct = (n) => `${Math.round((n / sentences.length) * 100)}%`;

console.log(`measured across ${read} files, ${sentences.length} sentences, ${paragraphs.length} paragraphs\n`);

console.log("sentence length (words)");
console.log(`  median      ${at(0.5)}`);
console.log(`  quartiles   ${at(0.25)} to ${at(0.75)}`);
console.log(`  longest 5%  ${at(0.95)}+  (max ${sorted[sorted.length - 1]})`);
console.log(`  shortest 5% ${at(0.05)}-`);
console.log(`  mean        ${mean(sentences)}\n`);

console.log("paragraph length (words)");
console.log(`  median      ${[...paragraphs].sort((a, b) => a - b)[Math.floor(paragraphs.length / 2)]}`);
console.log(`  mean        ${mean(paragraphs)}\n`);

console.log("habits");
console.log(`  second person   ${pct(secondPerson)} of sentences say "you"`);
console.log(`  questions       ${pct(questions)}`);
console.log(`  exclamations    ${pct(exclamations)}${exclamations === 0 ? "  (never)" : ""}`);
console.log(`  passive-ish     ${pct(passive)}`);
console.log(`  hedges          ${(hedges / sentences.length).toFixed(2)} per sentence`);
console.log(`  common AI tics  ${tics} total${tics === 0 ? "  (none)" : "  <- worth looking at"}`);
console.log();

console.log("shape");
console.log(`  headings        ${headings} across ${read} files`);
console.log(`  list items      ${listItems}`);
console.log(`  list to prose   ${(listItems / paragraphs.length).toFixed(2)} list items per paragraph`);
console.log();
console.log("Numbers, not judgements. Whether any of this is a problem is the author's call.");
