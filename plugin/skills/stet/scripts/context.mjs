#!/usr/bin/env node
/**
 * What an agent needs to know before touching a word, in one call.
 *
 * Run once at the start of a session. Without it the agent works out the state of the project by
 * accident: it tries an edit, gets refused, reads the refusal, and adapts. That works and it wastes
 * a turn each time, and worse, it means the first thing an agent learns about a project is that
 * something stopped it rather than what the project is.
 *
 * This is deliberately not a dashboard. It answers four questions and stops.
 *
 *   is this project using Stet, and is anything actually enforced
 *   what may I edit
 *   what does it sound like
 *   what should I do next
 *
 * Run: node context.mjs
 */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { findContent, words, config, kindOf } from "./lib/find.mjs";
import { read as readMeta, mayEdit, mayRefresh, ownedSpans } from "./lib/meta.mjs";
import { declared } from "./lib/sources.mjs";

const root = process.cwd();
const cfg = config(root);

if (!cfg) {
  console.log("This project is not using Stet.");
  console.log("");
  console.log("Nothing is protected and no voice is enforced, so ordinary care applies: do not");
  console.log("rewrite prose you were not asked to rewrite.");
  console.log("");
  console.log("To set it up, the order is ingest then init. Do not write content into a project");
  console.log("that has not been read.");
  process.exit(0);
}

const { files } = findContent(root);
const meta = new Map(files.map((f) => [f, readMeta(root, f)]));
const total = files.reduce((n, f) => n + (words(root, f) ?? 0), 0);

/* --- is anything actually enforced -------------------------------------- */

const admin = (() => {
  const p = join(root, ".stet", "admin.json");
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(readFileSync(p, "utf8"));
  } catch {
    return null;
  }
})();

const kind = kindOf(root);
console.log(`STET  ${kind.label}, ${files.length} files, ${total.toLocaleString()} words`);
console.log(`      ${kind.note}`);
console.log("");

if (admin?.hook?.off) {
  console.log("THE HOOK IS OFF, so nothing here is enforced.");
  console.log(`  since ${admin.hook.since}, because: ${admin.hook.reason}`);
  console.log("  Turn it back on with admin.mjs on. Until then every rule below is advice.");
  console.log("");
}

const unlocked = Object.entries(admin?.unlocked ?? {});
if (unlocked.length) {
  console.log(`${unlocked.length} ${unlocked.length === 1 ? "file has" : "files have"} been deliberately opened:`);
  for (const [f, u] of unlocked) console.log(`  ${f}  because: ${u.reason}`);
  console.log("");
}

/* --- what may I edit ------------------------------------------------------ */

const open = files.filter((f) => mayEdit(meta.get(f)) || unlocked.some(([u]) => u === f));
const closed = files.filter((f) => !open.includes(f));
const refreshable = closed.filter((f) => mayRefresh(meta.get(f)) && (meta.get(f)?.sources ?? []).length);
const owned = files.filter((f) => ownedSpans(meta.get(f)).length);

console.log("WHAT YOU MAY EDIT");
console.log(`  ${open.length} open, ${closed.length} closed.`);
if (open.length && open.length <= 8) console.log(`  open: ${open.join(", ")}`);
if (refreshable.length) {
  console.log(`  ${refreshable.length} closed ${refreshable.length === 1 ? "file allows" : "files allow"} its figures to be brought current, and nothing else.`);
}
if (owned.length) {
  const n = owned.reduce((a, f) => a + ownedSpans(meta.get(f)).length, 0);
  console.log(`  ${n} ${n === 1 ? "sentence is" : "sentences are"} the author's inside otherwise open files. Edit around them.`);
}
console.log("  Ask before editing anything closed. Do not release it yourself.");
console.log("");

/* --- what does it sound like ---------------------------------------------- */

const voicePath = join(root, cfg.voice ?? "VOICE.md");
console.log("WHAT IT SOUNDS LIKE");
if (!existsSync(voicePath)) {
  console.log(`  No ${cfg.voice ?? "VOICE.md"}. Nothing is enforcing a register, so run voice before writing much.`);
} else {
  const text = readFileSync(voicePath, "utf8");
  const one = text.match(/^##\s+The one rule\s*$([\s\S]*?)(?=^##\s)/m)?.[1];
  const rule = one?.split(/\n\s*\n/).find((p) => p.trim())?.replace(/\s*\n\s*/g, " ").replace(/\*\*/g, "").trim();
  const never = (text.match(/^##\s+Never\s*$([\s\S]*?)(?=^##\s|$(?![\s\S]))/m)?.[1].match(/^-\s/gm) ?? []).length;
  const state = readMeta(root, cfg.voice ?? "VOICE.md")?.state;

  console.log(`  ${voicePath.replace(root + "/", "")}${state ? `, ${state}` : ""}`);
  if (rule) console.log(`  ${rule}`);
  if (never) console.log(`  ${never} things it never does. Read the file before writing, not after.`);
  if (state === "draft") {
    console.log("  It is a draft, which means an agent wrote it and nobody has accepted it yet.");
  }
}
console.log("");

/* --- what next ------------------------------------------------------------ */

const specs = Object.keys(declared(root)).length;
const drafts = files.filter((f) => meta.get(f)?.state === "draft").length;

console.log("WHAT TO DO NEXT");
const next = [];
if (!existsSync(voicePath)) next.push("run voice, because everything written before it exists will have to be redone");
if (drafts === files.length && files.length) next.push("run proof: every file is still a draft, so nobody has accepted anything");
if (specs) next.push("run verify before quoting a figure, because a stale one is worse than none");
else next.push("no sources are declared, so nothing is watching the figures in this content");
if (admin?.hook?.off) next.unshift("turn the hook back on");
for (const n of next.slice(0, 3)) console.log(`  ${n}`);

console.log("");
console.log("The rules that do not bend: never mark your own work approved, never release closed");
console.log("content yourself, and never write a figure you cannot attribute.");
