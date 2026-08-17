#!/usr/bin/env node
/**
 * Drift between the config, the content and this plugin.
 *
 * Every other command assumes the installation is sound. This one checks that assumption, and it
 * exists because the failures it looks for are all silent: nothing breaks, no command errors, and
 * the project quietly stops being protected while continuing to look protected.
 *
 * The check that matters most is whether the hook is registered at all. **Without it every rule in
 * this plugin is advice, and advice loses.** A project can carry a full set of states and policies,
 * pass every other command, and have no enforcement whatsoever, and nothing else in the toolkit
 * would mention it.
 *
 * Writes nothing. Run: node doctor.mjs
 */

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, dirname, basename, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { findContent, config } from "./lib/find.mjs";
import { read as readMeta, STATES, POLICIES } from "./lib/meta.mjs";
import { declared } from "./lib/sources.mjs";
import { lock } from "./lib/sources.mjs";

const root = process.cwd();
const here = dirname(fileURLToPath(import.meta.url));
const skill = resolve(here, "..");
const plugin = resolve(skill, "..", "..");

const found = [];
const say = (rank, what, detail, fix) => found.push({ rank, what, detail, fix });

/* --- 1. Is any of this enforced? ------------------------------------------ */

const cfg = config(root);
if (!cfg) {
  console.log("No stet.config.json here, so this project is not using Stet.");
  console.log("Run ingest, then init.");
  process.exit(0);
}

const hooksPath = join(plugin, "hooks", "hooks.json");
if (!existsSync(hooksPath)) {
  say(1, "no hook shipped", `${relative(root, hooksPath)} is missing from the plugin`,
    "without it nothing is enforced and every rule here is advice");
} else {
  const hooks = JSON.parse(readFileSync(hooksPath, "utf8"));
  const pre = hooks?.hooks?.PreToolUse ?? [];
  const guards = pre.flatMap((p) => p.hooks ?? []).filter((h) => String(h.command).includes("hook-before-edit"));
  if (!guards.length) {
    say(1, "hook not wired", "hooks.json declares no PreToolUse entry running hook-before-edit",
      "the file exists and does nothing");
  } else {
    const matcher = pre.find((p) => (p.hooks ?? []).some((h) => String(h.command).includes("hook-before-edit")))?.matcher ?? "";
    for (const tool of ["Edit", "Write", "MultiEdit"]) {
      if (!matcher.includes(tool)) {
        say(1, `${tool} is not guarded`, `the hook matcher is "${matcher}"`,
          `an agent can change content with ${tool} and the hook will never see it`);
      }
    }
    if (!existsSync(join(skill, "scripts", "hook-before-edit.mjs"))) {
      say(1, "hook script missing", "hooks.json points at a file that is not there",
        "the guard is written to fail open, so edits pass silently");
    }
  }
}

/* Enforcement is per-installation, and this cannot see the user's settings from here. Say so rather
   than implying the check was complete. */
say(4, "not checkable from here", "whether the plugin is installed in this session",
  "hooks.json being right does not prove Claude Code loaded it. Try editing a closed file and see whether it refuses");

/* --- 2. Config against reality -------------------------------------------- */

const { files } = findContent(root);

for (const glob of cfg.content ?? []) {
  const prefix = glob.replace(/\*.*$/, "");
  const hit = files.some((f) => f === glob || f.startsWith(prefix));
  if (!hit) say(2, "content glob matches nothing", glob, "a typo here silently unprotects a whole directory");
}

for (const glob of cfg.prose ?? []) {
  const prefix = glob.replace(/\*.*$/, "");
  if (!files.some((f) => f === glob || f.startsWith(prefix))) {
    say(2, "prose glob matches nothing", glob, "voice checks and orphan detection will skip everything");
  } else if (!(cfg.content ?? []).some((c) => {
    const cp = c.replace(/\*.*$/, "");
    return glob === c || glob.startsWith(cp);
  })) {
    say(2, "prose outside content", glob, "prose must be a subset of content, or the hook never sees those files");
  }
}

const voicePath = cfg.voice ?? "VOICE.md";
if (!existsSync(join(root, voicePath))) {
  say(2, "no voice file", `config points at ${voicePath}, which is not there`, "run voice, or fix the path");
}

/* Code caught by a content glob. Marking a source file as prose is a mess to undo and the hook will
   start refusing edits to it. */
const CODE = /\.(m?[jt]sx?|py|rb|go|rs|java|c|cpp|sh|sql|css|scss)$/i;
const code = files.filter((f) => CODE.test(f));
if (code.length) {
  say(2, "code inside a content path", `${code.length}: ${code.slice(0, 3).join(", ")}${code.length > 3 ? ", and more" : ""}`,
    "the hook will refuse edits to these once they carry a state");
}

/* --- 3. Content against config -------------------------------------------- */

/** Files carrying stet metadata that no content glob covers: protected in name only. */
function walk(dir, out = []) {
  for (const e of readdirSync(join(root, dir), { withFileTypes: true })) {
    const rel = dir === "." ? e.name : `${dir}/${e.name}`;
    if (/^(node_modules|\.git|\.stet)$/.test(e.name)) continue;
    if (e.isDirectory()) walk(rel, out);
    else out.push(rel);
  }
  return out;
}
const everything = walk(".");

for (const f of everything) {
  if (!/\.(md|markdown|mdx|html?|json)$/i.test(f)) continue;
  if (files.includes(f)) continue;
  const m = readMeta(root, f);
  if (m?.state) {
    say(2, "marked but not governed", f, `carries state ${m.state} and no content glob covers it, so the hook will not protect it`);
  }
}

/* Sidecars whose file is gone. */
for (const f of everything) {
  if (!f.endsWith(".stet.yaml")) continue;
  const owner = f.replace(/\.stet\.yaml$/, "");
  if (!existsSync(join(root, owner))) say(3, "orphaned sidecar", f, `${owner} no longer exists`);
}

/* Values this version does not know. A file marked with a state we cannot interpret is a file whose
   protection is undefined, which is worse than unmarked. */
for (const f of files) {
  const m = readMeta(root, f);
  if (m?.state && !STATES.includes(m.state)) say(1, "unknown state", f, `"${m.state}" is not one of ${STATES.join(", ")}`);
  if (m?.policy && !POLICIES.includes(m.policy)) say(1, "unknown policy", f, `"${m.policy}" is not one of ${POLICIES.join(", ")}`);
}

/* The lock, against what is still declared. */
const specs = declared(root);
for (const name of Object.keys(lock(root))) {
  if (!specs[name]) say(3, "lock remembers a dead source", name, "declared once, recorded, and no longer in the config");
}

/* --- 4. The plugin against itself ----------------------------------------- */

const allRefsEarly = existsSync(join(skill, "reference"))
  ? readdirSync(join(skill, "reference"))
      .filter((f) => f.endsWith(".md"))
      .map((f) => readFileSync(join(skill, "reference", f), "utf8"))
      .join("\n")
  : "";
const skillText0 = existsSync(join(skill, "SKILL.md")) ? readFileSync(join(skill, "SKILL.md"), "utf8") : "";

const skillMd = join(skill, "SKILL.md");
if (existsSync(skillMd)) {
  const text = readFileSync(skillMd, "utf8");
  const refs = [...text.matchAll(/reference\/([a-z-]+\.md)/g)].map((m) => m[1]);
  const linked = new Set([...text.matchAll(/\[reference\/([a-z-]+\.md)\]/g)].map((m) => m[1]));

  for (const r of new Set(refs)) {
    const exists = existsSync(join(skill, "reference", r));
    if (linked.has(r) && !exists) {
      say(1, "command claims to be built", r, "SKILL.md links a reference file that is not there");
    }
    if (!linked.has(r) && exists) {
      say(3, "built but not linked", r, "the reference exists and the table still shows it as unbuilt");
    }
  }

  const onDisk = existsSync(join(skill, "reference"))
    ? readdirSync(join(skill, "reference")).filter((f) => f.endsWith(".md"))
    : [];
  for (const r of onDisk) {
    if (!refs.includes(r)) say(3, "reference with no command", r, "nothing in SKILL.md routes to it");
  }
}

/* Agents nothing routes to. Same failure as an undocumented script: it ships and nobody calls it. */
const agentDir = join(plugin, "agents");
if (existsSync(agentDir)) {
  const agents = readdirSync(agentDir).filter((f) => f.endsWith(".md"));
  const everything = [skillText0, allRefsEarly].join("\n");
  for (const a of agents) {
    const name = a.replace(/\.md$/, "");
    if (!everything.includes(name)) {
      say(3, "agent nothing calls", a, "no reference or SKILL.md mentions it, so it will never run");
    }
  }
}

/* Scripts nothing documents. A script with no reference is a thing only its author can find. */
const scripts = readdirSync(join(skill, "scripts")).filter((f) => f.endsWith(".mjs"));
const allRefs = existsSync(join(skill, "reference"))
  ? readdirSync(join(skill, "reference")).filter((f) => f.endsWith(".md")).map((f) => readFileSync(join(skill, "reference", f), "utf8")).join("\n")
  : "";
const skillText = existsSync(skillMd) ? readFileSync(skillMd, "utf8") : "";
for (const s of scripts) {
  if (s.startsWith("hook-") || s.startsWith("lib")) continue;
  if (!allRefs.includes(s) && !skillText.includes(s)) {
    say(3, "undocumented script", s, "no reference mentions it, so nobody will run it");
  }
}

/* --- report --------------------------------------------------------------- */

const BANDS = [
  [1, "Not enforced", "the model is not actually holding"],
  [2, "Misconfigured", "the config and the project disagree"],
  [3, "Untidy", "nothing is unprotected, but something is stale"],
  [4, "Check by hand", "this command cannot see it from here"],
];

console.log(`${files.length} content files, config at stet.config.json, plugin at ${relative(root, plugin) || plugin}\n`);

if (!found.length) {
  console.log("Nothing has drifted.");
  process.exit(0);
}

for (const [rank, title, gloss] of BANDS) {
  const rows = found.filter((f) => f.rank === rank);
  if (!rows.length) continue;
  console.log(`${title.toUpperCase()}  ${rows.length}`);
  console.log(`  ${gloss}\n`);
  for (const r of rows) {
    console.log(`  ${r.what}`);
    console.log(`    ${r.detail}`);
    console.log(`    ${r.fix}\n`);
  }
}

const unenforced = found.filter((f) => f.rank === 1).length;
console.log(BANDS.map(([rank, title]) => `${found.filter((f) => f.rank === rank).length} ${title.toLowerCase()}`).join(", "));
if (unenforced) console.log("\nFix the first band before anything else. Until it is clear, nothing here is enforced.");

process.exit(unenforced ? 1 : 0);
