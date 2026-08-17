#!/usr/bin/env node
/**
 * Make one command its own slash command.
 *
 * `stet proof` works, and `/proof` is what somebody types at four in the afternoon. The difference
 * is small and it is the difference between a tool people use and a tool people remember they
 * installed.
 *
 * A pin is a tiny skill that redirects into the real reference, so there is exactly one description
 * of what a command does and the shortcut cannot drift from it. Pins are written into whichever
 * harness directories the project actually has.
 *
 *   node pin.mjs pin <command>
 *   node pin.mjs unpin <command>
 *   node pin.mjs list
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync, readdirSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = process.cwd();
const here = dirname(fileURLToPath(import.meta.url));
const skill = resolve(here, "..");

/* Harnesses that read skills out of a project directory. A pin goes in every one that exists, and
   creating them is not this script's business. */
const HARNESSES = [".claude", ".cursor", ".codex", ".agents", ".gemini"];

const commands = existsSync(join(skill, "reference"))
  ? readdirSync(join(skill, "reference"))
      .filter((f) => f.endsWith(".md"))
      .map((f) => f.replace(/\.md$/, ""))
      .sort()
  : [];

const [mode, name] = process.argv.slice(2);

const dirs = () => HARNESSES.map((h) => join(root, h)).filter((d) => existsSync(d));

if (mode === "list" || !mode) {
  const found = [];
  for (const d of dirs()) {
    const skills = join(d, "skills");
    if (!existsSync(skills)) continue;
    for (const s of readdirSync(skills)) {
      if (existsSync(join(skills, s, "SKILL.md")) && readFileSync(join(skills, s, "SKILL.md"), "utf8").includes("stet-pin")) {
        found.push(`${s}  in ${d.replace(root, ".")}`);
      }
    }
  }
  console.log(found.length ? `Pinned:\n  ${found.join("\n  ")}` : "Nothing is pinned.");
  console.log(`\nPinnable: ${commands.join(", ")}`);
  console.log("\n  pin.mjs pin <command>");
  process.exit(0);
}

if (!["pin", "unpin"].includes(mode) || !name) {
  console.log("pin.mjs pin <command> | unpin <command> | list");
  process.exit(1);
}

if (!commands.includes(name)) {
  console.log(`No such command: ${name}`);
  console.log(`\nPinnable: ${commands.join(", ")}`);
  process.exit(1);
}

const targets = dirs();
if (!targets.length) {
  console.log("No harness directory here, so there is nowhere to put a shortcut.");
  console.log(`Expected one of: ${HARNESSES.join(", ")}`);
  process.exit(1);
}

const summary = (() => {
  const text = readFileSync(join(skill, "reference", `${name}.md`), "utf8");
  const body = text.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "").trim();
  return body.split(/\n\s*\n/).find((p) => p.trim() && !p.startsWith("#"))?.replace(/\s+/g, " ").trim() ?? name;
})();

for (const dir of targets) {
  const path = join(dir, "skills", `stet-${name}`, "SKILL.md");
  if (mode === "unpin") {
    if (existsSync(path)) {
      rmSync(dirname(path), { recursive: true, force: true });
      console.log(`unpinned  ${path.replace(root, ".")}`);
    }
    continue;
  }

  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(
    path,
    `---
name: stet-${name}
description: ${summary}
---

<!-- stet-pin. A shortcut, not a second copy of the instructions. -->

# ${name}

${summary}

**Load \`stet\`'s \`reference/${name}.md\` and follow it.** That file is the only description of what
this command does, so this shortcut cannot drift from it.
`,
  );
  console.log(`pinned    ${path.replace(root, ".")}`);
}

console.log(
  mode === "pin"
    ? `\n/stet-${name} now exists. It redirects into the reference rather than repeating it.`
    : "\nGone.",
);
