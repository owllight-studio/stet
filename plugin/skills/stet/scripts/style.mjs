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
import { AUTHORITIES, DECISIONS, DEFAULT, BRITISH_DEFAULT } from "./lib/authorities.mjs";

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

  /*
   * The reversal, which the guard above cannot see.
   *
   * Deciding "fact-checker becomes fact checker" when "fact checker becomes fact-checker" is already
   * recorded is a different *term*, so it walks straight past the same-term check and lands as a
   * second entry. The sheet then contradicts itself and `check` can never be satisfied: both forms
   * disagree with something, whichever one the content uses.
   *
   * Same for a chain. Deciding "a becomes b" when "b becomes c" is recorded leaves the corpus told
   * to write a word that is itself banned.
   */
  const reversal = decisions(text).find((d) => d.as.toLowerCase() === term.toLowerCase());
  if (reversal) {
    console.log(`This reverses a decision. "${reversal.term}" already becomes "${reversal.as}"${reversal.why ? `, because ${reversal.why}` : ""}.`);
    console.log(`Recording this would leave both forms disagreeing with the sheet, whichever one the`);
    console.log(`content uses. Edit ${PATH.replace(root + "/", "")} by hand and say why it moved.`);
    process.exit(1);
  }

  const chain = decisions(text).find((d) => d.term.toLowerCase() === as.toLowerCase());
  if (chain) {
    console.log(`"${as}" is itself decided against: it already becomes "${chain.as}"${chain.why ? `, because ${chain.why}` : ""}.`);
    console.log(`Decide "${term}" as "${chain.as}" instead, or change that entry first.`);
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

/* --- authority ------------------------------------------------------------- */

/*
 * Name the guide this project defers to, and the sheet gets shorter.
 *
 * A style sheet written from nothing has to decide the serial comma, the numeral threshold and the
 * quotation-mark placement from first principles, and every one of those is arbitrary. Naming an
 * authority answers all of them in one line, and the sheet then carries only what is unusual about
 * this project. That is why a professional sheet is two pages rather than four hundred.
 *
 * The edition is part of the name. "Chicago" means at least four books and two of them disagree.
 */

const SAYS = (a, k) => AUTHORITIES[a]?.says?.[k] ?? null;

/* Some editions are a year. Printing "2026 (2026)" reads as a bug because it is one. */
const named = (a) => `${a.name}, ${a.edition}${a.year && String(a.year) !== a.edition ? ` (${a.year})` : ""}`;

function describe(key) {
  const a = AUTHORITIES[key];
  const known = Object.keys(DECISIONS).filter((k) => SAYS(key, k));
  console.log(named(a));
  console.log(`  ${a.domain}`);
  console.log(`  ${a.free ? "free to read" : "paywalled"}, ${a.quotable ? "and its wording may be reproduced with attribution" : "so a rule can be cited by section but never quoted"}`);
  if (a.note) console.log(`  ${a.note}`);
  console.log("");
  for (const [k, label] of Object.entries(DECISIONS)) {
    const v = SAYS(key, k);
    if (!v) continue;
    console.log(`  ${label.padEnd(30)} ${v.position}`);
    if (v.cite) console.log(`  ${"".padEnd(30)} ${v.cite}`);
  }
  const missing = Object.keys(DECISIONS).length - known.length;
  if (missing) {
    console.log("");
    console.log(`  ${missing} of ${Object.keys(DECISIONS).length} not established from a primary source:`);
    console.log(`  ${Object.entries(DECISIONS).filter(([k]) => !SAYS(key, k)).map(([, l]) => l.toLowerCase()).join(", ")}.`);
    console.log("  That means nobody checked, not that the guide is silent. Decide those here instead.");
  }
}

if (cmd === "authority") {
  const pick = argv[1];
  const current = (load() ?? "").match(/^\*\*(.+?)\*\*/m);

  if (!pick) {
    console.log("A style sheet names its authority first, then records only the departures from it.\n");
    for (const [k, a] of Object.entries(AUTHORITIES)) {
      const mark = k === DEFAULT ? "  default" : k === BRITISH_DEFAULT ? "  British default" : "";
      console.log(`  ${k.padEnd(11)} ${named(a)}${mark}`);
      console.log(`  ${"".padEnd(11)} ${a.domain}`);
    }
    console.log("");
    console.log(`Set one:  style.mjs authority ${DEFAULT}`);
    console.log("");
    console.log("Chicago is the default because it is the only one of these that claims the whole");
    console.log("territory. AP is scoped to news, APA and MLA to scholarship, Microsoft and Google to");
    console.log("software, the Guardian and BBC to their own newsrooms. Novels and scripts live in book");
    console.log("publishing, which is Chicago's ground and which none of the others addresses at all.");
    console.log("");
    console.log("There is no honest 'most used overall'. Nobody publishes an auditable count and the");
    console.log("per-domain answers genuinely differ. If the writing is British, use the Guardian: it is");
    console.log("free, current and quotable, where New Hart's is paywalled and eleven years old.");
    if (current) console.log(`\nCurrently set: ${current[1]}`);
    process.exit(0);
  }

  if (!AUTHORITIES[pick]) {
    console.log(`No such authority: ${pick}`);
    console.log(`Try one of: ${Object.keys(AUTHORITIES).join(", ")}`);
    process.exit(1);
  }

  const a = AUTHORITIES[pick];
  const title = `**${named(a)}.**`;
  let body = load() ?? HEAD;

  if (/^\*\*.+?\*\*/m.test(body.split("## Authorities")[1] ?? "")) {
    console.log("An authority is already named. Changing it changes the answer to every decision it");
    console.log(`covers, so edit ${PATH.replace(root + "/", "")} by hand and say why it moved.`);
    process.exit(1);
  }

  const line = `${title} ${a.domain}. Everything under Decisions is a departure from it.\n\n${a.url}\n`;
  body = body.includes("\n## Authorities\n")
    ? body.replace(/(\n## Authorities\n\n?)(Name them with their edition[^\n]*\n)?/, `$1${line}`)
    : `${body.replace(/\n*$/, "")}\n\n## Authorities\n\n${line}`;
  writeFileSync(PATH, body);

  console.log(`Set. ${PATH.replace(root + "/", "")} now defers to:\n`);
  describe(pick);
  console.log("");
  console.log("Those are answered now and do not belong on the sheet. Record only where this project");
  console.log("departs from them, and say why it departs.");
  process.exit(0);
}

const text = load();

/* --- discover -------------------------------------------------------------- */

/*
 * Find the variation nobody has decided yet.
 *
 * `check` enforces decisions somebody made. This finds where the corpus is already saying one thing
 * two ways, which is the state a style sheet exists to end and the thing nobody notices from inside
 * a single file.
 *
 * The primitive is borrowed from Vale's `consistency` check and it is the right one: not "this word
 * is wrong", which needs an authority, but **"both of these appear here, pick one"**, which needs
 * only the corpus. The organisations that took this seriously ended up with word lists of 598
 * entries (Google), 876 (Microsoft) and 924 (Red Hat), and reading them shows what they are: an
 * inventory of how many wrong names existed in production. One Red Hat product had four.
 */
/*
 * An apostrophe is part of the word, not punctuation between forms.
 *
 * Stripping it collapsed "we're" into "were", so a run reported a contraction against an unrelated
 * verb 42 times against 7 and ranked it near the top. Hyphens and spaces still go, because
 * "e-mail" against "email" is the whole point.
 */
const NORMAL = (w) => w.toLowerCase().replace(/[-\s.]/g, "");

/**
 * Ordinary English, where a difference in case is grammar rather than terminology.
 *
 * The two kinds of variation are not equally interesting, and the split is what makes the report
 * readable. A hyphenation or spacing difference is always worth knowing about: "e-mail" against
 * "email" is a decision somebody has to make, and it is the single most common drift type measured
 * anywhere. A case difference is only worth knowing about on a word that is usually capitalised,
 * which is to say a name.
 *
 * Without this, a run reports "none" against "None" and "just" against "Just", which is a word
 * being quoted as a word rather than a product being spelled two ways.
 */
const COMMON = new Set(
  ("about after all also and any are because been before both but can could did does down each even " +
   "every first from had has have here how into its just like made make many more most much must " +
   "never none not now once only other over said same should since some such than that the their " +
   "them then there these they this those through time under until very was way well were what when " +
   "where which while who why will with without would your ever else always able back best come far " +
   "find give good great keep know last least less long look mean might need next often place put " +
   "right same say see seem several small still take tell thing think two use used want well work " +
   "measured stated rules never done doing being").split(" "),
);

/**
 * The same word wearing different clothes, and nothing else.
 *
 * Two exclusions do all the work, and both were learned by running it. A first pass reported "The
 * one" against "the one" across 37 files, which is not a terminology variant, it is a sentence
 * starting.
 *
 * So a match at the start of a sentence is never recorded. A capital there says nothing about how
 * anybody spells the word, and thresholding on frequency does not help because a common phrase
 * clears any threshold.
 *
 * And a multi-word candidate has to carry a capital or a hyphen. Product names and compounds are
 * worth checking; "and the" is not.
 *
 * Headings go too. Title Case in a heading is a formatting convention, so scanning them reports
 * every section title against its own ordinary use in a sentence, which is what a first run did:
 * "Rules" nineteen times against "rules" four times, across twenty-one files, all of it noise.
 */
function variants(text) {
  const seen = new Map();
  const body = text
    .split("\n")
    .filter((l) => !/^\s*#{1,6}\s/.test(l) && !/^\s*[|>]/.test(l))
    .join("\n");
  /* Newlines survive the flatten, because a line start is as uninformative as a sentence start and
     there is no way to see one in a single collapsed string. */
  const flat = body.replace(/[^\S\n]+/g, " ");

  const record = (surface, index) => {
    /*
     * Is this word in a position where a capital means nothing about how anybody spells it.
     *
     * There turned out to be four such positions, not one, and each was found by reading a run:
     * the start of the text, the start of a sentence, the start of a line, and the start of a
     * quotation. A first run on this repo returned 293 terms and almost all of the top of the list
     * was one of the last three.
     *
     * The opening furniture is stripped first so the four tests do not each have to know about it.
     * Quote marks, brackets and emphasis markers can all sit between the boundary and the word:
     * `**"Don't worry` is a sentence start wearing three hats. Horizontal whitespace goes with
     * them, but not the newline, which is the boundary being looked for.
     */
    const before = flat.slice(Math.max(0, index - 12), index)
      .replace(/(?:[^\S\n]|["'\u201c\u2018\u2019(\[{*_`])+$/, "");
    if (!before) return;
    if (/[.!?:;]$/.test(before)) return;
    if (/\n *(?:[-*+>]|\d+[.)])?$/.test(before)) return;
    /* Inside a name. "Code" in "Claude Code" is not a variant of "code", it is the second half of a
       proper noun, and the capitalised-pair pass below already looks at the whole thing. */
    if (/^[A-Z]/.test(surface) && /[A-Z][A-Za-z'.-]*$/.test(before)) return;

    /* A pair that spans a sentence boundary is not a compound. NORMAL drops the full stop, so
       "it. The" and "it the" collapse to one key and get reported as a variant of each other. */
    if (/[.!?]\s/.test(surface)) return;

    const key = NORMAL(surface);
    if (key.length < 4) return;
    if (!seen.has(key)) seen.set(key, new Map());
    const forms = seen.get(key);
    forms.set(surface, (forms.get(surface) ?? 0) + 1);
  };

  /*
   * Single words first, and separately from pairs.
   *
   * One regex doing both was the bug: an optional trailing-word group is greedy, so "e-mail arrived"
   * matched as a single token and never lined up against "email came". A corpus written to contain
   * four obvious drifts reported none of them.
   */
  for (const m of flat.matchAll(/\b[A-Za-z][A-Za-z'.-]{2,}\b/g)) record(m[0], m.index);

  /*
   * Then adjacent pairs, which is where "fact checker" against "fact-checker" lives.
   *
   * These were once restricted to capitalised pairs on the grounds that an uncapitalised pair is
   * "and the". That reasoning was wrong, and it cost the single most cited example of the whole
   * category. A pair is only ever *reported* if some other surface normalises to the same key, and
   * nothing else in a corpus normalises to "andthe". So the noise the restriction was guarding
   * against cannot reach the output, while the hyphenated compound it was excluding is the thing
   * everybody means by a style sheet entry.
   */
  for (const m of flat.matchAll(/\b[A-Za-z][A-Za-z'.-]+[ -][A-Za-z][A-Za-z'.-]+\b/g)) record(m[0], m.index);

  return seen;
}

if (cmd === "discover") {
  const files = argv.slice(1).filter((a) => !a.startsWith("--")).length
    ? argv.slice(1).filter((a) => !a.startsWith("--"))
    : findContent(root).files;

  const all = new Map();
  const where = new Map();
  for (const file of files) {
    const body = prose(readFileSync(join(root, file), "utf8"), markupOf(file));
    for (const [key, forms] of variants(body)) {
      if (!all.has(key)) all.set(key, new Map());
      const into = all.get(key);
      for (const [surface, n] of forms) {
        into.set(surface, (into.get(surface) ?? 0) + n);
        const k = `${key}::${surface}`;
        if (!where.has(k)) where.set(k, new Set());
        where.get(k).add(file);
      }
    }
  }

  const decided = new Set(decisions(text).flatMap((d) => [NORMAL(d.term), NORMAL(d.as)]));

  const split = [...all.entries()]
    .filter(([key, forms]) => forms.size > 1 && !decided.has(key))
    /* Hyphenation and spacing always count. A case-only difference counts only on a word that is not
       ordinary English, because there it is a name being spelled two ways. */
    .filter(([key, forms]) => {
      const surfaces = [...forms.keys()];
      const caseOnly = surfaces.every((x) => x.toLowerCase() === surfaces[0].toLowerCase());
      if (caseOnly && COMMON.has(key)) return false;
      // "agent's" against "agents" is grammar. Strip the possessive and see if anything is left.
      const bare = new Set(surfaces.map((x) => x.toLowerCase().replace(/'s$/, "").replace(/s$/, "")));
      return bare.size > 1 || !surfaces.every((x) => /s$/i.test(x));
    })
    .map(([key, forms]) => {
      const sorted = [...forms.entries()].sort((a, b) => b[1] - a[1]);
      const total = sorted.reduce((n, [, c]) => n + c, 0);
      /* How split it is. A term used 40 times one way and once the other is a typo; 20 and 18 is a
         decision nobody made. */
      const evenness = sorted[1][1] / sorted[0][1];
      return { key, forms: sorted, total, evenness };
    })
    .sort((a, b) => b.evenness * b.total - a.evenness * a.total);

  if (!split.length) {
    console.log("Nothing is being said two ways that has not already been decided.");
    process.exit(0);
  }

  console.log(`${split.length} ${split.length === 1 ? "term appears" : "terms appear"} in more than one form.\n`);
  for (const v of split.slice(0, 25)) {
    console.log(`  ${v.forms.map(([f, n]) => `${f} (${n})`).join("   ")}`);
    const files = new Set(v.forms.flatMap(([f]) => [...(where.get(`${v.key}::${f}`) ?? [])]));
    console.log(`    across ${files.size} ${files.size === 1 ? "file" : "files"}: ${[...files].slice(0, 3).join(", ")}${files.size > 3 ? ", and more" : ""}`);
    console.log(`    decide it:  style.mjs decide "${v.forms[1][0]}" "${v.forms[0][0]}" --why "..."`);
    console.log("");
  }
  if (split.length > 25) console.log(`and ${split.length - 25} more.\n`);

  console.log("Neither form is wrong. That is the point: this is variation nobody decided, and the");
  console.log("value of deciding is that nobody has to decide it again.");
  process.exit(1);
}

/* --- check ----------------------------------------------------------------- */

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
  /*
   * The sheet never checks itself.
   *
   * Recording a decision means naming the form it rules against, so "per cent becomes percent"
   * necessarily contains "per cent". Once STYLE.md came under a content glob it started reporting
   * its own entries as disagreements, which is the file arguing with itself and can never be
   * resolved: removing the losing form would delete the decision.
   */
  const sheet = PATH.replace(root + "/", "");
  const files = (targets.length ? targets : findContent(root).files).filter((f) => f !== sheet);

  const found = [];
  for (const file of files) {
    /*
     * Checked against the real file, line for line.
     *
     * Stripping the not-prose first and then counting lines reports a number that points at a
     * different line in the file somebody has to open, which is worse than not reporting one. So
     * the lines stay where they are and the parts that are not prose are blanked in place: fenced
     * code keeps its line count, inline code and link targets become spaces.
     */
    const raw = readFileSync(join(root, file), "utf8");
    let fenced = false;
    /* YAML frontmatter is metadata, not prose. Without this, deciding that the product is written
       "Stet" reports every `stet:` key in every file's own frontmatter as a disagreement, which was
       49 of one run's 78 hits for that entry. */
    let front = /^---\r?\n/.test(raw);
    const lines = raw.split("\n").map((line, i) => {
      if (front) {
        if (i > 0 && /^---\s*$/.test(line)) front = false;
        return "";
      }
      if (/^\s*```/.test(line)) { fenced = !fenced; return ""; }
      if (fenced) return "";
      if (/^\s{4,}\S/.test(line)) return "";
      return line
        .replace(/`[^`]*`/g, (m) => " ".repeat(m.length))
        .replace(/\]\([^)]*\)/g, (m) => " ".repeat(m.length))
        .replace(/<[^>]+>/g, (m) => " ".repeat(m.length));
    });
    for (const d of decided) {
      /*
       * Whole word, and case sensitive whenever case is what was decided.
       *
       * "guide-sourced becomes Guide-sourced" carries no capital in the term, and matching it
       * case-blind reports every already-correct Guide-sourced as a disagreement, which is the
       * checker arguing with its own decision. So the test is not whether the term has a capital.
       * It is whether the term and the replacement differ only in case.
       */
      const caseOnly = d.term.toLowerCase() === (d.as ?? "").toLowerCase();
      const flags = caseOnly || /[A-Z]/.test(d.term) ? "g" : "gi";
      const src = `(?<![\\w-])${d.term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\w-])`;
      lines.forEach((line, i) => {
        // A fresh regex per line. A /g/ regex reused across .test() calls carries lastIndex
        // forward and starts the next line partway in, so it quietly misses real matches.
        if (new RegExp(src, flags).test(line))
          found.push({ file, line: i + 1, ...d, saw: line.trim().slice(0, 78) });
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
