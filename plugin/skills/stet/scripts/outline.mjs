#!/usr/bin/env node
/**
 * Plan a piece, and check the plan before anybody writes prose.
 *
 * An outline is usually a list of headings, which is a shape with no claims in it and therefore
 * nothing that can be wrong yet. This asks each section for two more things: what it asserts, and
 * what supports the assertion. Those are checkable, and checking them costs minutes where finding
 * out after the draft costs the draft.
 *
 * Two failures it catches that nothing else in the toolkit can:
 *
 *   A claim with no evidence behind it. Cheap to notice now, expensive once a paragraph is built on
 *   it, and permanent once it ships, because `verify` can only check claims that named a source.
 *
 *   A piece that already exists. The most wasteful failure in any documentation project, and the
 *   one nobody catches by reading the file tree, because the duplicate is never filed where you
 *   would look for it.
 *
 *   node outline.mjs draft <slug>        a plan skeleton with the fields that get checked
 *   node outline.mjs check <plan.md>     evidence, overlap, and shape
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { findContent, words } from "./lib/find.mjs";
import { declared, runAll } from "./lib/sources.mjs";
import { prose } from "./lib/prose.mjs";

const root = process.cwd();
const [mode, target] = process.argv.slice(2);
const DIR = ".stet/outlines";

if (!mode || !target || !["draft", "check"].includes(mode)) {
  console.log("outline.mjs draft <slug>");
  console.log("outline.mjs check <plan.md>");
  process.exit(1);
}

/* --- draft ---------------------------------------------------------------- */

if (mode === "draft") {
  const path = join(root, DIR, `${target.replace(/\.md$/, "")}.md`);
  if (existsSync(path)) {
    console.log(`${path} already exists. Edit it, or check it.`);
    process.exit(1);
  }
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(
    path,
    `---
outline: true
for: path/where/this/will/live.md
job: the one thing a reader should be able to do afterwards
---

# ${target.replace(/[-_]/g, " ")}

## First section

Says: the single thing this section asserts. One sentence. If it needs two, it is two sections.
Because: name a source from stet.config.json, or write "observed" and say how, or "argued" if it
rests on reasoning rather than evidence.

## Second section

Says:
Because:
`,
  );
  console.log(`${DIR}/${basename(path)}`);
  console.log("");
  console.log("Fill in Says and Because for every section, then check it.");
  console.log("A section with no Says is a heading, and a heading is not a plan.");
  process.exit(0);
}

/* --- parse ---------------------------------------------------------------- */

const planPath = existsSync(join(root, target)) ? target : join(DIR, target);
if (!existsSync(join(root, planPath))) {
  console.log(`No such plan: ${target}`);
  process.exit(1);
}

const raw = readFileSync(join(root, planPath), "utf8");
const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? "";
const field = (k) => fm.match(new RegExp(`^${k}:\\s*(.+)$`, "m"))?.[1]?.trim() ?? "";

const sections = [];
for (const m of raw.matchAll(/^##\s+(.+?)\s*$([\s\S]*?)(?=^##\s|$(?![\s\S]))/gm)) {
  const body = m[2];
  sections.push({
    title: m[1],
    says: body.match(/^Says:\s*([\s\S]*?)(?=^\w+:|$(?![\s\S]))/m)?.[1].replace(/\s+/g, " ").trim() ?? "",
    because: body.match(/^Because:\s*([\s\S]*?)(?=^\w+:|$(?![\s\S]))/m)?.[1].replace(/\s+/g, " ").trim() ?? "",
  });
}

if (!sections.length) {
  console.log("No sections in that plan. A plan is `## headings` with Says and Because under each.");
  process.exit(1);
}

/* --- overlap with what already exists ------------------------------------- */

const STOP = new Set(
  ("the a an and or but of to in for on at by with from as is are was were be been it its this that these those " +
   "not no so if then than when where which who whom what how why can could may might will would should must " +
   "do does did done have has had you your yours we our i my me they them their he she his her one two also " +
   "there here about into out up down over under again more most other some such only own same very just").split(" "),
);

const terms = (text) => {
  const counts = new Map();
  for (const w of text.toLowerCase().match(/[a-z][a-z'-]{2,}/g) ?? []) {
    if (STOP.has(w)) continue;
    counts.set(w, (counts.get(w) ?? 0) + 1);
  }
  return counts;
};

const cosine = (a, b) => {
  let dot = 0;
  for (const [w, n] of a) if (b.has(w)) dot += n * b.get(w);
  if (!dot) return 0;
  const mag = (m) => Math.sqrt([...m.values()].reduce((s, n) => s + n * n, 0));
  return dot / (mag(a) * mag(b));
};

const corpus = findContent(root)
  .files.filter((f) => f !== planPath)
  .map((f) => ({ file: f, terms: terms(prose(readFileSync(join(root, f), "utf8"), /\.x?html?$/i.test(f) ? "html" : "md")) }));

/* --- sources -------------------------------------------------------------- */

const specs = declared(root);
const named = [...new Set(sections.map((s) => s.because).filter((b) => b && specs[b]))];
const results = named.length ? await runAll(root, named) : {};

/* --- report --------------------------------------------------------------- */

console.log(`${planPath}`);
console.log(`  ${sections.length} sections, for ${field("for") || "nowhere named"}`);
console.log(`  job: ${field("job") || "not stated"}`);
console.log("");

let problems = 0;

if (!field("for")) { problems++; console.log("NO HOME     the plan does not say where this will live. `ia` decides that, not the draft.\n"); }
if (!field("job")) { problems++; console.log("NO JOB      the plan does not say what a reader can do afterwards, so nothing can be cut against it.\n"); }

for (const s of sections) {
  const notes = [];

  if (!s.says) {
    problems++;
    notes.push(["NO CLAIM", "a heading with nothing under it. Say the one thing it asserts, or drop it."]);
  } else if (/\.\s+\S/.test(s.says)) {
    notes.push(["TWO CLAIMS", "Says is more than one sentence, which usually means this is two sections."]);
  }

  const b = s.because;
  if (!b) {
    problems++;
    notes.push(["NO EVIDENCE", "name a source, or say observed, or say argued. Unstated is the one that ships wrong."]);
  } else if (specs[b]) {
    const r = results[b];
    if (r?.error) { problems++; notes.push(["SOURCE BROKEN", `${b}: ${r.error}`]); }
    else notes.push(["ok", `${b} currently returns ${r.value}`]);
  } else if (/^(observed|argued)\b/i.test(b)) {
    notes.push(["ok", b.length > 12 ? b : `${b}, and the plan does not say how`]);
  } else {
    problems++;
    notes.push(["NO SUCH SOURCE", `${b} is not declared in stet.config.json`]);
  }

  const near = corpus
    .map((c) => ({ file: c.file, score: cosine(terms(`${s.title} ${s.says}`), c.terms) }))
    .filter((c) => c.score > 0.22)
    .sort((a, b2) => b2.score - a.score)
    .slice(0, 2);
  for (const n of near) {
    notes.push(["ALREADY EXISTS", `${n.file} covers similar ground (${Math.round(n.score * 100)}% of the distinctive words), ${words(root, n.file) ?? 0} words`]);
  }

  console.log(`  ${s.title}`);
  for (const [tag, said] of notes) console.log(`    ${tag.padEnd(15)} ${said}`);
  console.log("");
}

if (problems) {
  console.log(`${problems} to settle before writing.`);
  console.log("Every one of these is cheaper now than after a draft is built on it.");
  process.exit(1);
}
console.log("Every section asserts something and names what supports it. Write it.");
