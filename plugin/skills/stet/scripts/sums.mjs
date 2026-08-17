#!/usr/bin/env node
/**
 * The arithmetic a document does on itself.
 *
 * verify checks a figure against the command that produced it, and says nothing at all for a
 * project that declares no sources, which is most projects. This checks the numbers against each
 * other instead, so it needs no config, no network, no sources and no model. It is the cheapest
 * check in the set and the one most likely to be run.
 *
 * Half of the psychology articles reporting a null-hypothesis test contain a p-value inconsistent
 * with its own test statistic, 8,273 of 16,695, and 12.9 percent contain one large enough to change
 * the conclusion (Nuijten, Hartgerink, van Assen, Epskamp and Wicherts, Behavior Research Methods
 * 48(4): 1205-1226, 2015). All of it found by recomputation, with no access to anybody's data.
 *
 * Run: node sums.mjs [file ...]
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { findContent } from "./lib/find.mjs";
import { relations, statistics, checkFraction, checkRange, checkStat, alphaIn } from "./lib/sums.mjs";

const root = process.cwd();
const only = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const files = only.length ? only : findContent(root).files;

const found = [];
const unread = [];
let checked = 0;
for (const file of files) {
  let text;
  try {
    /* resolve rather than join, so a path the caller gave as absolute is read where they meant.
       join glues an absolute path onto the working directory and produces one that does not
       exist, which then vanished into the catch below and the command said it had found nothing. */
    text = readFileSync(resolve(root, file), "utf8");
  } catch (err) {
    /* Never silent. A file somebody named and this could not open is the single most important
       thing to say, and saying nothing turns it into "there was no arithmetic here", which is a
       different and false statement. */
    unread.push({ file, why: String(err.code ?? err.message ?? err) });
    continue;
  }
  /* HTML has to be blanked as HTML. Treating a page as Markdown leaves its script blocks and its
     attribute values sitting in the text as though somebody had written them as prose. */
  const markup = /\.x?html?$/i.test(file) ? "html" : "md";
  const alpha = alphaIn(text);
  for (const r of relations(text, markup)) {
    checked++;
    const v = r.kind === "fraction" ? checkFraction(r) : checkRange(r);
    if (v.state !== "consistent") found.push({ file, ...r, ...v });
  }
  for (const s of statistics(text)) {
    checked++;
    const v = checkStat(s, alpha);
    if (v.state !== "consistent") found.push({ file, ...s, ...v });
  }
}

const sayUnread = () => {
  if (!unread.length) return;
  console.log(`COULD NOT READ  ${unread.length}`);
  for (const u of unread) console.log(`  ${u.file}: ${u.why}`);
  console.log("");
};

if (!checked) {
  sayUnread();
  /* Nothing was checked because nothing was read. Explaining what was not found in the content
     would be a claim about content this never opened, which is the same class of false statement
     the unread list exists to prevent. */
  if (unread.length && unread.length === files.length) process.exit(1);
  console.log("No arithmetic to check: no fraction, range or reported test statistic in the content.");
  console.log("");
  console.log("This looks for numbers a document states about itself: a count of a total beside a");
  console.log("percentage, a range, or a test statistic reported with its p-value. A document that");
  console.log("states none of those has nothing here to disagree with.");
  process.exit(0);
}

console.log(`${checked} ${checked === 1 ? "relation" : "relations"} across ${files.length} ${files.length === 1 ? "file" : "files"}.\n`);

const loud = found.filter((f) => f.tier === "loud");
for (const f of loud) {
  console.log(`WRONG    ${f.file}, line ${f.line}`);
  console.log(`         ${f.saw}`);
  console.log(`         ${f.detail}\n`);
}

const quiet = found.filter((f) => f.tier === "quiet");
if (quiet.length) {
  console.log(`WORTH A LOOK  ${quiet.length}`);
  console.log("  the arithmetic is off and the claim it supports still stands\n");
  for (const f of quiet) {
    console.log(`  ${f.file}, line ${f.line}`);
    console.log(`    ${f.detail}`);
    if (f.assumption) console.log(`    consistent if ${f.assumption}`);
    console.log("");
  }
}

console.log(`${checked - found.length} consistent, ${loud.length} wrong, ${quiet.length} worth a look`);

if (loud.length) {
  console.log("");
  console.log("Every one of these is arithmetic, so it is either a number to correct or a sentence");
  console.log("to reword. Neither is a thing this command will do for you: a figure can be right");
  console.log("while the sentence around it is wrong, and that is a reading.");
}

process.exit(loud.length ? 1 : 0);
