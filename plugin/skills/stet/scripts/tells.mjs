/**
 * The tells: constructions that mark text as generated.
 *
 * A rule in an instruction file is advice, and advice loses. This is the check. `audit` runs it
 * over a project's content, and Stet runs it over its own, because a plugin that tells you not to
 * write like a machine while writing like one is worth nothing.
 *
 * Every pattern here earned its place by being a real habit rather than a stylistic preference. The
 * em dash is first because it is the most recognisable single marker in generated prose, and
 * because its absence costs nothing: a colon, a full stop or a bracket is better every time.
 *
 * Usage: node tells.mjs [path ...]
 *        with no path, every content file the project has.
 */

import { readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { findContent } from "./lib/find.mjs";

const TELLS = [
  { id: "em-dash", re: /—|(?<=\w)\s–\s(?=\w)/g, say: "em dash. Use a colon, a full stop or brackets." },
  { id: "not-x-but-y", re: /\b(?:is|are|was|were|it'?s)\s+not\s+[^.,;:]{3,40},?\s+it'?s\s+/gi, say: '"not X, it is Y". Just say Y.' },
  { id: "delve", re: /\b(delve|dive in|deep dive|unpack this|let'?s explore)\b/gi, say: "the exploration preamble. Start with the answer." },
  { id: "corporate", re: /\b(leverage|utilize|robust|seamless|streamline|elevate|unlock|empower|holistic|synergy)\b/gi, say: "corporate filler. Use the plain word." },
  { id: "landscape", re: /\b(landscape|realm|tapestry|testament to|in today'?s world|ever.evolving)\b/gi, say: "essay filler." },
  { id: "important-to-note", re: /\b(it'?s|it is) (important|worth) (to note|noting|mentioning)\b/gi, say: "if it were not worth noting you would not write it." },
  { id: "hedge-stack", re: /\b(quite|rather|somewhat|fairly|relatively)\s+\w+\s+(and|but)\s+(quite|rather|somewhat|fairly|relatively)\b/gi, say: "stacked hedges." },
  { id: "in-conclusion", re: /^\s*(in conclusion|to summarize|to sum up|in summary|overall,)/gim, say: "a summary of something the reader just read." },
  { id: "not-only", re: /\bnot only\b[^.]{0,60}\bbut also\b/gi, say: '"not only, but also". Two sentences.' },
  { id: "exclamation", re: /!(?!=)/g, say: "exclamation mark." },
];

const root = process.cwd();
const args = process.argv.slice(2);
const files = args.length ? args.map((a) => relative(root, a) || a) : findContent(root).files;

let total = 0;
const counts = new Map();

for (const file of files) {
  let text;
  try {
    text = readFileSync(join(root, file), "utf8");
  } catch {
    continue;
  }
  // Code is not prose and is allowed its own punctuation. Quoted text is skipped for a subtler
  // reason, found by running this over Stet's own writing: a file that lists the tells has to name
  // them, and naming one is not committing it. The first hit this checker ever produced was itself
  // quoting "let's dive in" in a list of things never to write.
  const prose = text
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`]*`/g, "")
    .replace(/"[^"]{0,80}"/g, '""')
    .replace(/\u201c[^\u201d]{0,80}\u201d/g, "");
  const lines = prose.split("\n");

  const hits = [];
  lines.forEach((line, i) => {
    for (const tell of TELLS) {
      tell.re.lastIndex = 0;
      const found = [...line.matchAll(tell.re)];
      if (found.length) {
        hits.push({ line: i + 1, id: tell.id, say: tell.say, text: line.trim().slice(0, 90) });
        counts.set(tell.id, (counts.get(tell.id) ?? 0) + found.length);
        total += found.length;
      }
    }
  });

  if (hits.length) {
    console.log(`\n${file}`);
    for (const h of hits) console.log(`  ${String(h.line).padStart(4)}  ${h.id.padEnd(18)} ${h.text}`);
  }
}

console.log();
if (!total) {
  console.log(`clean: no tells in ${files.length} files`);
  process.exit(0);
}
console.log(`${total} tells in ${files.length} files`);
for (const [id, n] of [...counts].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(n).padStart(4)}  ${id}  ${TELLS.find((t) => t.id === id).say}`);
}
process.exit(1)
