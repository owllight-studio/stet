/**
 * What Stet knows about this project, and what to do first.
 *
 * Run once per session, from the project root. It answers three questions the skill cannot answer
 * for itself: is Stet set up here, what has been established, and which command comes next.
 *
 * It prints directives rather than a status report. A session that reads this and still has to
 * decide where to start has been given a status report.
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { findContent, readMeta, config } from "./lib/find.mjs";

const root = process.cwd();
const cfg = config(root);
const artifacts = ["CONTENT.md", "VOICE.md", "IA.md"].map((name) => ({
  name,
  path: join(root, name),
  present: existsSync(join(root, name)),
}));

const { files, guessed } = findContent(root);
const claimed = files.filter((f) => readMeta(root, f).source !== "none").length;

console.log("STET");
console.log(`  project      ${root}`);
console.log(`  config       ${cfg ? (cfg.error ? `BROKEN: ${cfg.error}` : "stet.config.json") : "none"}`);
console.log(`  content      ${files.length} files${guessed ? " (guessed, no config)" : ""}`);
console.log(`  claimed      ${claimed} of ${files.length}`);
for (const a of artifacts) console.log(`  ${a.name.padEnd(12)} ${a.present ? "present" : "MISSING"}`);
console.log();

for (const a of artifacts.filter((x) => x.present)) {
  const text = readFileSync(a.path, "utf8");
  console.log(`--- ${a.name} ---`);
  console.log(text.trim());
  console.log();
}

const missing = artifacts.filter((a) => !a.present).map((a) => a.name);

console.log("DIRECTIVES");
if (!files.length) {
  console.log("  This project has no content Stet can see. Ask where it lives before doing anything.");
} else if (claimed === 0) {
  console.log("  Nothing here is claimed. Every word belongs to whoever wrote it.");
  console.log("  Run `ingest` FIRST. Do not write, edit or restructure any content before it.");
} else if (claimed < files.length) {
  console.log(`  ${files.length - claimed} files are unclaimed. Finish ingest before other work.`);
} else if (missing.length) {
  const next = missing[0] === "CONTENT.md" ? "init" : missing[0] === "VOICE.md" ? "voice" : "ia";
  console.log(`  Content is claimed. Missing: ${missing.join(", ")}.`);
  console.log(`  Next command is \`${next}\`. Offer it; do not run it unasked.`);
} else {
  console.log("  Established. Proceed with the requested command.");
}

console.log();
console.log("  Ownership is not advisory. Check before editing any content file:");
console.log("    node $CLAUDE_PLUGIN_ROOT/skills/stet/scripts/owner.mjs <path>");
console.log("  Content you may not edit, you may still propose changes to in your reply.");
