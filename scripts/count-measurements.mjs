#!/usr/bin/env node
/* How many measured values the voice library actually holds. One line, one figure.

   It exists because the homepage said 114 and the library holds 132. The generator's front-matter
   parser matched keys as [a-zA-Z_]+, so every key carrying a digit was dropped: sentenceP95 in
   eight voices, Noir's P10 and P90, and four of The Manual's per-10k counts. Eighteen real
   measurements never reached the page, and the figure was checked by hand with a regex written the
   same way, so the check agreed with the bug. A source runs the count instead. */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const dir = "plugin/skills/stet/voices";
let total = 0;
for (const f of readdirSync(dir)) {
  if (!f.endsWith(".md") || f === "README.md") continue;
  const fm = readFileSync(join(dir, f), "utf8").match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fm) continue;
  const block = fm[1].match(/^measured:\s*$([\s\S]*?)(?=^\S|\Z)/m);
  if (!block) continue;
  total += (block[1].match(/^\s+[A-Za-z_][A-Za-z0-9_]*\s*:/gm) ?? []).length;
}
process.stdout.write(String(total));
