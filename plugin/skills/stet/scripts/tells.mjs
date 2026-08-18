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
  // Both shapes: "it is not X, it is Y" and the bare "Not a guideline, a hook". The second form
  // slipped through and shipped in a voice preset's own example, in the file that bans it.
  { id: "not-x-but-y", re: /\b(?:is|are|was|were|it'?s)\s+not\s+[^.,;:]{3,40},?\s+it'?s\s+/gi, say: '"not X, it is Y". Just say Y.' },
  { id: "not-x-but-y", re: /(?:^|(?<=[.!?]\s))Not\s+(?:a|an|the)\s+[^.,;:]{3,45},\s+(?:a|an|the)\s/g, say: '"Not a X, a Y". Just say Y.' },
  { id: "delve", re: /\b(delve|dive in|deep dive|unpack this|let'?s explore)\b/gi, say: "the exploration preamble. Start with the answer." },
  /*
   * Corporate filler, split into two rules because three of these words are also ordinary English.
   *
   * "Unlock your potential" is filler. Unlocking a file is a verb doing a job. Same for elevating a
   * register and leveraging a rope. What makes them filler is the abstract object after them, so
   * that is what the second rule looks for rather than the word alone.
   */
  { id: "corporate", re: /\b(utilize|robust|seamless|streamline|empower|holistic|synergy)\b/gi, say: "corporate filler. Use the plain word." },
  {
    id: "corporate-abstract",
    re: /\b(unlock|leverage|elevate|drive|harness)\s+(?:your\s+|our\s+|their\s+|the\s+|new\s+)?(potential|value|growth|insight|insights|innovation|impact|synergy|efficiencies|outcomes|possibilities|opportunit\w+|excellence|success)\b/gi,
    say: "corporate filler: an abstract noun doing no work.",
  },
  { id: "landscape", re: /\b(landscape|realm|tapestry|testament to|in today'?s world|ever.evolving)\b/gi, say: "essay filler." },
  { id: "important-to-note", re: /\b(it'?s|it is) (important|worth) (to note|noting|mentioning)\b/gi, say: "if it were not worth noting you would not write it." },
  { id: "hedge-stack", re: /\b(quite|rather|somewhat|fairly|relatively)\s+\w+\s+(and|but)\s+(quite|rather|somewhat|fairly|relatively)\b/gi, say: "stacked hedges." },
  { id: "in-conclusion", re: /^\s*(in conclusion|to summarize|to sum up|in summary|overall,)/gim, say: "a summary of something the reader just read." },
  { id: "not-only", re: /\bnot only\b[^.]{0,60}\bbut also\b/gi, say: '"not only, but also". Two sentences.' },
  { id: "exclamation", re: /(?<!<)!(?!=)/g, say: "exclamation mark." },
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
  // Naming a construction is not committing it, and this checker has now been fooled by that three
  // times: a list of tells quoting "let's dive in", a voice preset banning "seamless", and a rule
  // file demonstrating "not X, it is Y". Each fix was narrower than the problem.
  //
  // So the rule is general. Code, quoted text, and any section headed Never or Do not are exempt,
  // because a section that exists to forbid something has to be able to say what it is. An explicit
  // <!-- stet-allow --> exempts anything else, per line or for a whole file.
  if (/<!--\s*stet-allow\s*-->/.test(text)) continue;

  const stripBanSections = (t) =>
    t.replace(/^#{1,6}\s*(never|do not|don't|avoid|banned)\b[\s\S]*?(?=^#{1,6}\s|$(?![\s\S]))/gim, "");

  // The fourth instance, and the first one in HTML. voices.html is generated out of the voice
  // files, so it carries their never lists onto a page, and both exemptions above missed it: the
  // markdown headings are gone by then, and &quot; hid a quoted bad example from the quoted-text
  // rule. Decode the entities, then drop any list item that opens by forbidding something.
  const decodeEntities = (t) =>
    t
      .replace(/&quot;|&#34;/g, '"')
      .replace(/&ldquo;|&#8220;/g, "“")
      .replace(/&rdquo;|&#8221;/g, "”")
      .replace(/&apos;|&#39;/g, "'")
      .replace(/&amp;/g, "&");

  const stripBanItems = (t) =>
    t.replace(/<li\b[^>]*>[\s\S]*?<\/li>/gi, (item) =>
      /^(never|do not|don't|avoid|banned)\b/i.test(item.replace(/<[^>]*>/g, "").trim()) ? "" : item,
    );

  const prose = stripBanSections(
    stripBanItems(decodeEntities(text))
      .replace(/```[\s\S]*?```/g, "")
      .replace(/`[^`]*`/g, "")
      .replace(/"[^"]{0,120}"/g, '""')
      // Curly quotes are unambiguous about which end is which, so the character class already
      // stops the match at the closing mark and no length cap is needed to keep it from running
      // away. The old cap of 120 was inherited from the straight-quote rule above, where a lone
      // stray quote really can pair with the wrong one. It cost the site its own exhibit: a
      // specimen of agent prose, correctly quoted, was reported as a tell for being long.
      .replace(/\u201c[^\u201d]{0,400}\u201d/g, ""),
  );
  const lines = prose.split("\n");

  const hits = [];
  lines.forEach((line, i) => {
    if (/<!--\s*stet-allow(:\s*[a-z-]+)?\s*-->/.test(line)) return;
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
