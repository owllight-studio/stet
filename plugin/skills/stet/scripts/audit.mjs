#!/usr/bin/env node
/**
 * The sweep. Everything wrong with the content, ranked by what it costs.
 *
 * Most of what this reports, some other command could have told you. `verify` knows about stale
 * claims, `tells` knows about banned constructions, `measure` knows about voice drift. Running four
 * commands and reading four reports is not the same as knowing the state of the content, and the
 * findings that matter most are the ones no single command can see because they need two things at
 * once.
 *
 * A file that is approved and has drifted from the voice is the clearest case. `measure` can see the
 * drift and does not know the file is closed. The hook knows the file is closed and cannot see the
 * drift. Only together do they say the useful thing, which is that this page is off-voice and
 * nobody is allowed to fix it without asking.
 *
 * Ranking is by consequence rather than by count. A page stating a figure that moved is lying to a
 * reader right now. A banned construction is untidy. Sorting those together by how many there are
 * produces a report that leads with the least important thing.
 *
 * Writes nothing. Run: node audit.mjs [--quiet]
 */

import { readFileSync } from "node:fs";
import { join, dirname, resolve, relative } from "node:path";
import { findContent, words, config, kindOf } from "./lib/find.mjs";
import { read as readMeta, mayEdit, mayRefresh } from "./lib/meta.mjs";
import { runAll, lock, check, typedFigures, declared } from "./lib/sources.mjs";
import { targets, drift } from "./lib/prose.mjs";

const root = process.cwd();
const quiet = process.argv.includes("--quiet");
const cfg = config(root);

if (!cfg) {
  console.log("No stet.config.json, so this project is not using Stet and there is nothing to audit.");
  process.exit(0);
}

const { files } = findContent(root);

/*
 * Which files a voice is supposed to govern.
 *
 * `content` is everything the hook protects and most of it is reference: measurement tables and
 * rule lists an agent reads to decide what to do. Holding those to the house voice reports every
 * one of them as off-voice, which is true and useless: a table of sentence-length figures is not
 * supposed to sound like the landing page.
 */
const declaredProse = cfg.prose ?? null;
const isProse = (f) =>
  !declaredProse || declaredProse.some((g) => f === g || f.startsWith(g.replace(/\*.*$/, "")));
const text = new Map(files.map((f) => [f, readFileSync(join(root, f), "utf8")]));
const meta = new Map(files.map((f) => [f, readMeta(root, f)]));

/** severity, kind, file, one line, and what to do about it */
const found = [];
const add = (rank, kind, file, said, fix) => found.push({ rank, kind, file, said, fix });

/* --- 1. Content that is currently wrong ----------------------------------- */

const specs = declared(root);
if (Object.keys(specs).length) {
  const cited = new Map();
  for (const f of files) for (const n of meta.get(f)?.sources ?? []) {
    if (!cited.has(n)) cited.set(n, []);
    cited.get(n).push(f);
  }

  if (cited.size) {
    const results = await runAll(root, [...cited.keys()]);
    const previous = lock(root);

    for (const [name, users] of cited) {
      if (!specs[name]) {
        for (const f of users) add(1, "no such source", f, `cites ${name}, which is not declared`, "declare it or stop citing it");
      }
    }

    for (const f of files) {
      for (const name of meta.get(f)?.sources ?? []) {
        const c = check(text.get(f), name, results[name] ?? { error: "not run" }, previous[name]?.value);
        if (c.state === "stale") {
          add(1, "stale claim", f, `${name}: says ${c.form}, source says ${c.becomes}`,
            mayRefresh(meta.get(f)) ? "refresh" : "policy forbids a refresh here, so somebody has to decide");
        } else if (c.state === "broken") {
          add(1, "broken source", f, `${name}: ${c.detail}`, "fix the command or remove the citation");
        } else if (c.state === "missing") {
          add(2, "unlocatable claim", f, `${name} says ${c.value}, and neither that nor the last recorded figure is in the file`,
            "the sentence was reworded, or the figure was typed by hand");
        }
      }
    }

    for (const name of Object.keys(specs)) {
      if (!cited.has(name)) add(3, "unused source", "stet.config.json", `${name} is declared and nothing cites it`, "cite it or remove it");
    }
  } else {
    add(3, "unused sources", "stet.config.json", `${Object.keys(specs).length} declared and no content cites any of them`,
      "add `sources:` to the files that quote a figure");
  }
}

/* --- 2. Risk nobody can act on -------------------------------------------- */

/*
 * Closed content that has drifted from the voice. The finding that needs two commands to see, and
 * the reason this one exists.
 *
 * measure can see the drift and does not know the file is closed. The hook knows the file is closed
 * and cannot see the drift. Together they say the useful thing: this page is off-voice and nobody
 * may fix it without asking first.
 */
const { targets: want } = targets(root);
if (Object.keys(want).length) {
  for (const f of files.filter(isProse)) {
    const d = drift(text.get(f), f, want);
    if (!d || !d.off.length) continue;
    const said = d.off.map((r) => `${r.metric} ${r.value} (${r.want})`).join(", ");
    if (!mayEdit(meta.get(f))) {
      add(2, "closed and off-voice", f, said, "it cannot be fixed without the author releasing it");
    } else if (d.off.length >= 3) {
      add(3, "off-voice", f, said, "tighten, clarify, or accept that this page is a different register");
    }
  }
}

/* Drafts nobody has read. The model says a draft belongs to the agent until a person accepts it, so
   a repository of drafts means nobody is reading, and the ownership model is failing quietly. */
const drafts = files.filter((f) => meta.get(f)?.state === "draft");
if (drafts.length && drafts.length === files.length) {
  add(2, "nothing approved", "the project", `all ${files.length} content files are draft`,
    "run proof and approve what you have read, or the ownership model is doing nothing");
} else if (drafts.length > files.length * 0.75) {
  add(3, "mostly draft", "the project", `${drafts.length} of ${files.length} files are draft`,
    "proof the ones that are finished");
}

/* Content nobody may edit and nobody has claimed. authored means a person wrote it; approved means
   a person accepted an agent's. A closed file with author: agent and no approval date is neither. */
for (const f of files) {
  const m = meta.get(f);
  if (!m) add(3, "unmanaged", f, "is inside a content path and carries no state at all", "mark it, or narrow the content globs");
  else if (m.state === "approved" && !m.approved) {
    add(3, "approved by nobody", f, "is approved with no record of who accepted it or when", "re-approve it through proof");
  }
}

/* --- 3. Structure --------------------------------------------------------- */

const ENTRY = new Set(["README.md", "index.md", "site/index.html", "docs/index.md"]);
const linked = new Set();
for (const [f, body] of text) {
  const here = dirname(f);
  for (const m of body.matchAll(/\[[^\]]*\]\(([^)#?\s]+)[^)]*\)|href="([^"#?]+)/g)) {
    const href = m[1] ?? m[2];
    if (!href || /^(https?:|mailto:|#)/.test(href)) continue;
    const target = relative(root, resolve(root, here, href));
    if (files.includes(target)) linked.add(target);
  }
}
/* Orphans mean nothing outside a linked structure. In a manuscript nothing links to chapter nine,
   in a collection the order is an editor's decision, and reporting either as a fault is how a
   checker teaches people to ignore it. */
const kind = kindOf(root);
if (kind.linked) {
/* Orphans are reported for reader-facing pages only. Reference material is reached by a tool rather
   than by a link, and calling seventeen preset files orphans because no page links to each one is a
   finding that is technically true and entirely noise. */
for (const f of files.filter(isProse)) {
  if (ENTRY.has(f) || linked.has(f)) continue;
  add(3, "orphan", f, `${words(root, f) ?? 0} words that nothing links to`, "link it, or decide it is not a page");
}
}

/* --- 4. Hygiene ----------------------------------------------------------- */

/* Reader-facing prose only, again. A figure worth reporting is one that will go stale silently, and
   a preset quoting a published measurement is neither going to move nor anybody's to refresh. */
if (Object.keys(specs).length) {
  for (const f of files.filter(isProse)) {
    const typed = typedFigures(text.get(f), []);
    if (typed.length >= 3) {
      add(4, "typed figures", f, `${typed.length} numbers with no source behind them`, "give the load-bearing ones a source");
    }
  }
}

/* --- the report ----------------------------------------------------------- */

const BANDS = [
  [1, "Wrong now", "a reader is being told something untrue"],
  [2, "At risk", "nothing is wrong yet and nobody is watching"],
  [3, "Structure", "the shape of the project rather than its words"],
  [4, "Hygiene", "worth doing, never urgent"],
];

console.log(`${files.length} content files, ${files.reduce((n, f) => n + (words(root, f) ?? 0), 0).toLocaleString()} words.`);

if (!found.length) {
  console.log("\nNothing to report.");
  process.exit(0);
}

for (const [rank, title, gloss] of BANDS) {
  const rows = found.filter((f) => f.rank === rank);
  if (!rows.length) continue;
  console.log(`\n${title.toUpperCase()}  ${rows.length}`);
  console.log(`  ${gloss}\n`);
  for (const r of rows) {
    console.log(`  ${r.kind}`);
    console.log(`    ${r.file}`);
    console.log(`    ${r.said}`);
    if (!quiet) console.log(`    -> ${r.fix}`);
    console.log("");
  }
}

const urgent = found.filter((f) => f.rank === 1).length;
console.log(
  BANDS.map(([rank, title]) => `${found.filter((f) => f.rank === rank).length} ${title.toLowerCase()}`).join(", "),
);
if (urgent) console.log("\nStart at the top. Everything in the first band is a page saying something untrue.");

/* Only the first band fails. Everything else is work, and failing a build on work nobody scheduled
   is how a checker gets switched off. */
process.exit(urgent ? 1 : 0);
