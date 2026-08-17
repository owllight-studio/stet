#!/usr/bin/env node
/**
 * stet, as a command you can run without Claude Code.
 *
 * Most of what this project does is mechanical. Whether a figure matches the command that produced
 * it, whether a corpus spells a word two ways, whether a link still resolves, whether a file that
 * carries ownership metadata is actually covered by a glob: none of that needs a model, and a thing
 * that needs no model should not need a model installed to run it.
 *
 * So the checks ship as a CLI and run in CI, and the judgement stays in the plugin. That split is
 * the honest one and it is stated on the help screen rather than blurred: `stet audit` will tell
 * you a figure is stale, and it will never tell you whether the sentence around it still argues
 * what you meant. The second is a reading, and a reading needs a reader.
 *
 * Every command here is a script that already existed and already ran standalone. This file adds a
 * name and a way to find them, and deliberately nothing else.
 */

import { spawnSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const SCRIPTS = join(here, "..", "plugin", "skills", "stet", "scripts");
const REFERENCE = join(here, "..", "plugin", "skills", "stet", "reference");

const version = (() => {
  try {
    return JSON.parse(readFileSync(join(here, "..", "package.json"), "utf8")).version;
  } catch {
    return "unknown";
  }
})();

/**
 * What runs without a model.
 *
 * `script` is the file. `blurb` is what it does, in the terms somebody deciding whether to run it
 * would use. The groups are the ones the plugin already uses, because two vocabularies for the same
 * twenty commands is how a project ends up explaining itself twice.
 */
const COMMANDS = {
  scan: { group: "Look", script: "scan.mjs", blurb: "what content exists, and how much of it" },
  context: { group: "Look", script: "context.mjs", blurb: "everything about this project in one call" },
  owner: { group: "Look", script: "owner.mjs", blurb: "who a file belongs to and what may be done to it" },

  style: { group: "Decide", script: "style.mjs", blurb: "the style sheet: authority, decisions, check, discover" },
  "style-sheet": { group: "Decide", script: "style-sheet.mjs", blurb: "decide the discovered variants on a page" },
  policy: { group: "Decide", script: "policy.mjs", blurb: "what may be done to a file, and what it depends on" },
  mark: { group: "Decide", script: "mark.mjs", blurb: "set state, author and policy on a file" },

  check: { group: "Check", script: "style.mjs", args: ["check"], blurb: "where the content disagrees with the style sheet" },
  audit: { group: "Check", script: "audit.mjs", blurb: "the sweep, ranked by what it costs" },
  verify: { group: "Check", script: "verify.mjs", blurb: "every figure against the command that produced it" },
  cite: { group: "Check", script: "cite.mjs", blurb: "does the source exist, is it retracted, is it the right version" },
  standing: { group: "Check", script: "standing.mjs", blurb: "what every cited source was last time, and what moved" },
  tells: { group: "Check", script: "tells.mjs", blurb: "the constructions that read as machine-written" },
  measure: { group: "Check", script: "measure.mjs", blurb: "does this match the voice it claims to be in" },
  critique: { group: "Check", script: "critique.mjs", blurb: "a scored review where every score is computed" },
  doctor: { group: "Check", script: "doctor.mjs", blurb: "drift between the config and the project" },

  refresh: { group: "Maintain", script: "refresh.mjs", blurb: "change the figure, leave the sentence" },
  restructure: { group: "Maintain", script: "restructure.mjs", blurb: "reorder a page and prove the words survived" },
  outline: { group: "Maintain", script: "outline.mjs", blurb: "plan a piece, and check the plan" },
  expand: { group: "Maintain", script: "expand.mjs", blurb: "a stub into a finished piece" },
  admin: { group: "Maintain", script: "admin.mjs", blurb: "unlock, relock, and the record of why" },

  "voice-stats": { group: "Voice", script: "voice-stats.mjs", blurb: "what this corpus measurably does, in figures" },
  proof: { group: "Voice", script: "proof.mjs", blurb: "read what was written, block by block, and decide" },
  claims: { group: "Voice", script: "claims.mjs", blurb: "decide the claims a fact check did not clear" },
};

/* Judgement, and it needs a reader. Named here so the gap is stated rather than discovered. */
const PLUGIN_ONLY = {
  init: "what this project is, who reads it, what it must do",
  voice: "derive or define the house voice, from samples or from nothing (voice-stats measures, this decides)",
  ia: "what exists, how it relates, what each page is for",
  ingest: "read existing content, claim it, report what is there",
  write: "author in the voice, to the IA",
  tighten: "cut",
  clarify: "make it comprehensible to somebody who is not the author",
};

const argv = process.argv.slice(2);
const cmd = argv[0];

if (!cmd || cmd === "help" || cmd === "--help" || cmd === "-h") {
  const topic = argv[1];
  if (topic) {
    /* `stet help style` is the reference document, which is the real explanation. */
    const doc = join(REFERENCE, `${topic}.md`);
    if (existsSync(doc)) {
      /* Frontmatter is for the hook. Printing it to somebody who asked what a command does is
         showing them the plumbing. */
      const text = readFileSync(doc, "utf8").replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n+/, "");
      process.stdout.write(
        text.replace(/\bnode +\$\{CLAUDE_PLUGIN_ROOT\}\/skills\/stet\/scripts\/(\S+?)\.mjs/g, "stet $1"),
      );
      process.exit(0);
    }
    console.log(`No reference for "${topic}".`);
    process.exit(1);
  }

  console.log(`stet ${version}   the checks, without the model\n`);
  let group = "";
  for (const [name, c] of Object.entries(COMMANDS)) {
    if (c.group !== group) {
      group = c.group;
      console.log(`  ${group}`);
    }
    console.log(`    ${name.padEnd(14)} ${c.blurb}`);
  }
  console.log("\n  stet help <command>   the reference document for it\n");
  console.log("These run against the current directory and read stet.config.json, which says which");
  console.log("files are content. Without one, most commands will tell you so and stop.\n");
  console.log("What is deliberately not here:");
  for (const [name, blurb] of Object.entries(PLUGIN_ONLY)) {
    console.log(`    ${name.padEnd(14)} ${blurb}`);
  }
  console.log("");
  console.log("Those are readings rather than checks, and a reading needs a reader. They live in the");
  console.log("Claude Code plugin, where there is a model to do them. This CLI is the half that runs");
  console.log("in CI and never needs one.\n");
  console.log("  https://github.com/owllight-studio/stet");
  process.exit(0);
}

if (cmd === "--version" || cmd === "-v" || cmd === "version") {
  console.log(version);
  process.exit(0);
}

const c = COMMANDS[cmd];
if (!c) {
  console.log(`stet: no command "${cmd}"`);
  /* One edit away is nearly always a typo, and printing the whole list to somebody who has already
     typed a command is answering a question they did not ask. */
  const near = Object.keys(COMMANDS).filter(
    (k) => k.startsWith(cmd.slice(0, 3)) || cmd.startsWith(k.slice(0, 3)),
  );
  if (near.length) console.log(`Did you mean: ${near.join(", ")}`);
  else console.log("Run `stet` for the list.");
  process.exit(1);
}

const script = join(SCRIPTS, c.script);
if (!existsSync(script)) {
  console.log(`stet: ${c.script} is missing from this install.`);
  process.exit(1);
}

/* stdio inherited, so the sheets can hold a terminal open and a pipe stays a pipe. */
const run = spawnSync(process.execPath, [script, ...(c.args ?? []), ...argv.slice(1)], {
  stdio: "inherit",
});
process.exit(run.status ?? 1);
