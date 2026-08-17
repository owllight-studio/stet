#!/usr/bin/env node
/**
 * The style sheet: the decisions, as opposed to the voice.
 *
 * Stet had a voice and nothing that records decisions, which is the artifact every professional
 * copyeditor actually produces. They are different things and conflating them loses the useful one.
 *
 *   A voice says how the writing should sound. Register, rhythm, what it never does.
 *   A style sheet says what was decided. Serial comma yes. Percent as a word. Nine spellings that
 *   could go either way and went this way. It is a record of preferences rather than of rules, and
 *   most entries are arbitrary: "apples, pears, and bananas" against "apples, pears and bananas" is
 *   a choice rather than a correctness.
 *
 * Two properties matter and neither belongs to a voice file.
 *
 * **It accumulates during the edit.** A copyeditor builds it while working rather than before, so
 * the first time a word could go two ways it gets decided and written down, and the second time
 * nobody has to remember.
 *
 * **It is handed on.** The proofreader applies it and extends it, the typesetter implements the
 * formatting decisions, and the author receives it to understand what happened to their manuscript.
 * Its whole purpose is to stop the next person second-guessing a decision somebody already made.
 *
 * So this is a durable, appendable, checkable record, which is exactly what a voice file is not.
 *
 *   node style.mjs                     what has been decided
 *   node style.mjs decide <term> <as> [--why "..."]
 *   node style.mjs check [file ...]    where the content disagrees with the record
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { findContent, config, kindOf } from "./lib/find.mjs";
import { prose, markupOf } from "./lib/prose.mjs";

const root = process.cwd();
const argv = process.argv.slice(2);
const cmd = argv[0];
const PATH = join(root, config(root)?.style ?? "STYLE.md");

/* --- the file -------------------------------------------------------------- */

const HEAD = `---
stet:
  state: draft
  author: agent
---

# Style sheet

The decisions, as opposed to the voice. VOICE.md says how this should sound; this says what was
decided when a word could have gone either way.

Most of what is here is arbitrary and that is the point. "Apples, pears, and bananas" against
"apples, pears and bananas" is a preference rather than a correctness, and the value of writing it
down is that nobody has to make it twice.

Built while editing rather than before, and handed to whoever works on this next.

## Authorities

Name them with their edition, because "Chicago" means four different books.

## Decisions

`;

const load = () => (existsSync(PATH) ? readFileSync(PATH, "utf8") : null);

/** Every decided term, read back out of the file. One line each, so the file stays a document. */
function decisions(text) {
  const out = [];
  for (const m of (text ?? "").matchAll(/^-\s+\*\*(.+?)\*\*\s*(?:→|->)\s*(.+?)(?:\s+—\s+(.*))?$/gm)) {
    out.push({ term: m[1], as: m[2].trim(), why: m[3]?.trim() ?? "" });
  }
  for (const m of (text ?? "").matchAll(/^-\s+`([^`]+)`\s*(?:→|->)\s*`([^`]+)`(?:\s+(.*))?$/gm)) {
    out.push({ term: m[1], as: m[2], why: m[3]?.trim() ?? "" });
  }
  return out;
}

/* --- decide ---------------------------------------------------------------- */

if (cmd === "decide") {
  const term = argv[1];
  const as = argv[2];
  const i = argv.indexOf("--why");
  const why = i >= 0 ? argv.slice(i + 1).join(" ") : "";

  if (!term || !as) {
    console.log('style.mjs decide <term> <as> [--why "..."]');
    console.log('  style.mjs decide "e-mail" "email" --why "house preference, and it is what the corpus already does"');
    process.exit(1);
  }

  let text = load();
  if (!text) {
    text = HEAD;
    console.log(`Started ${PATH.replace(root + "/", "")}.`);
  }

  const already = decisions(text).find((d) => d.term.toLowerCase() === term.toLowerCase());
  if (already) {
    if (already.as === as) {
      console.log(`Already decided: ${term} → ${as}`);
      process.exit(0);
    }
    console.log(`${term} was already decided as "${already.as}"${already.why ? `, because ${already.why}` : ""}.`);
    console.log(`Changing a decision is a decision. Edit ${PATH.replace(root + "/", "")} by hand and say why it changed,`);
    console.log("so the next person sees that it moved rather than finding two answers.");
    process.exit(1);
  }

  const line = `- \`${term}\` → \`${as}\`${why ? ` ${why}` : ""}\n`;
  text = text.includes("\n## Decisions\n")
    ? text.replace(/(\n## Decisions\n\n?)/, `$1${line}`)
    : `${text.replace(/\n*$/, "")}\n\n## Decisions\n\n${line}`;

  writeFileSync(PATH, text);
  console.log(`${term} → ${as}${why ? `, because ${why}` : ""}`);
  console.log(`Recorded. \`style check\` will find anywhere the content still says "${term}".`);
  process.exit(0);
}

/* --- check ----------------------------------------------------------------- */

const text = load();

if (cmd === "check") {
  if (!text) {
    console.log(`No ${PATH.replace(root + "/", "")}. Nothing has been decided, so there is nothing to check against.`);
    process.exit(0);
  }
  const decided = decisions(text);
  if (!decided.length) {
    console.log("The style sheet has no decisions in it yet.");
    process.exit(0);
  }

  const targets = argv.slice(1).filter((a) => !a.startsWith("--"));
  const files = targets.length ? targets : findContent(root).files;

  const found = [];
  for (const file of files) {
    const body = prose(readFileSync(join(root, file), "utf8"), markupOf(file));
    const lines = body.split("\n");
    for (const d of decided) {
      // Whole word, case sensitive only when the decision itself carries a capital.
      const flags = /[A-Z]/.test(d.term) ? "g" : "gi";
      const re = new RegExp(`(?<![\\w-])${d.term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\w-])`, flags);
      lines.forEach((line, i) => {
        if (re.test(line)) found.push({ file, line: i + 1, ...d, saw: line.trim().slice(0, 78) });
      });
    }
  }

  if (!found.length) {
    console.log(`${decided.length} ${decided.length === 1 ? "decision" : "decisions"}, and the content agrees with every one.`);
    process.exit(0);
  }

  console.log(`${found.length} ${found.length === 1 ? "place disagrees" : "places disagree"} with the style sheet.\n`);
  for (const f of found) {
    console.log(`  ${f.file}, line ${f.line}`);
    console.log(`    says "${f.term}", decided as "${f.as}"${f.why ? ` ${f.why}` : ""}`);
    console.log(`    ${f.saw}`);
    console.log("");
  }
  console.log("A disagreement is not automatically an error. A decision can be wrong, and a quotation");
  console.log("keeps its own spelling whatever the sheet says.");
  process.exit(1);
}

/* --- show ------------------------------------------------------------------ */

if (!text) {
  console.log(`No style sheet yet at ${PATH.replace(root + "/", "")}.`);
  console.log("");
  console.log("A style sheet is not a voice. VOICE.md says how the writing should sound. A style sheet");
  console.log("records what was decided when a word could have gone either way, and it is built while");
  console.log("editing rather than before.");
  console.log("");
  console.log('  style.mjs decide "e-mail" "email" --why "what the corpus already does"');
  console.log("");
  console.log(`This is ${kindOf(root).label}, so it will also want:`);
  const kind = config(root)?.kind ?? "site";
  const wants = {
    manuscript: ["characters, grouped by relationship rather than alphabetically",
                 "places, with the spellings that could go two ways",
                 "a timeline, laid out as a calendar so a school day falling on a weekend is visible"],
    collection: ["a word list, since independent pieces drift apart faster than chapters do"],
    papers: ["the citation style, named with its edition", "how numbers and units are set"],
    site: ["product and feature names, which is where a site drifts first",
           "how numbers, dates and units are set"],
  }[kind];
  for (const w of wants) console.log(`  ${w}`);
  process.exit(0);
}

const decided = decisions(text);
console.log(`${PATH.replace(root + "/", "")}  ${decided.length} ${decided.length === 1 ? "decision" : "decisions"}\n`);
for (const d of decided) console.log(`  ${d.term}  →  ${d.as}${d.why ? `   ${d.why}` : ""}`);
console.log("");
console.log("`style check` finds anywhere the content still disagrees.");
