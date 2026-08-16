/**
 * The voice library: what is on the shelf, and what any one of them says.
 *
 * A preset is a starting point, never a finished voice. `voice` composes it with whatever else the
 * author brings, and writes the result to their own VOICE.md, which is the only file any other
 * command reads. Nothing here is loaded at write time.
 *
 * Usage: node voices.mjs            list them
 *        node voices.mjs <slug>     print one
 */

import { readFileSync, readdirSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "voices");
const GROUPS = ["core", "marketing", "fun"];

function parse(file) {
  const text = readFileSync(join(DIR, file), "utf8");
  const fm = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const meta = {};
  if (fm) {
    for (const line of fm[1].split("\n")) {
      const pair = line.match(/^([a-zA-Z]+):\s*(.*)$/);
      if (pair && pair[2]) meta[pair[1]] = pair[2].trim();
    }
  }
  return { slug: basename(file, ".md"), body: text.slice(fm ? fm[0].length : 0).trim(), ...meta };
}

export function voices() {
  return readdirSync(DIR)
    .filter((f) => f.endsWith(".md") && f !== "README.md")
    .map(parse)
    .sort((a, b) => GROUPS.indexOf(a.group) - GROUPS.indexOf(b.group) || a.slug.localeCompare(b.slug));
}

export function voice(slug) {
  return voices().find((v) => v.slug === slug) ?? null;
}

if (process.argv[1] && process.argv[1].endsWith("voices.mjs")) {
  const want = process.argv[2];
  if (want) {
    const v = voice(want);
    if (!v) {
      console.error(`No voice called "${want}". Run without an argument to see the library.`);
      process.exit(1);
    }
    console.log(v.body);
  } else {
    let group = null;
    for (const v of voices()) {
      if (v.group !== group) {
        group = v.group;
        console.log(`\n${group.toUpperCase()}`);
      }
      console.log(`  ${v.slug.padEnd(22)} ${v.name.padEnd(20)} ${v.description ?? ""}`);
    }
    console.log("\nA preset is a starting point. voice composes it with whatever else you bring.");
  }
}
