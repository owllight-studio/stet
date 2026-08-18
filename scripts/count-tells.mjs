#!/usr/bin/env node
/* How many named failure modes the voice library holds. One line, one figure.

   The page said 102 and the presets name 104. The generator took the first eight from each voice,
   which dropped two of Field Notes' ten, under a heading calling itself the catalogue. Same shape
   as the measurement count: a display limit reported as the library's contents. Counted here so a
   person never types it again. */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const dir = "plugin/skills/stet/voices";
const section = (t, h) => (t.match(new RegExp(`^## ${h}\\s*$([\\s\\S]*?)(?=^## |$(?![\\s\\S]))`, "mi")) ?? [])[1] ?? "";

let total = 0;
for (const f of readdirSync(dir)) {
  if (!f.endsWith(".md") || f === "README.md") continue;
  const body = section(readFileSync(join(dir, f), "utf8"), "How pastiche fails");
  total += [...body.matchAll(/\*\*(.+?)\*\*/g)]
    .map((m) => m[1].replace(/\s*\n\s*/g, " ").trim())
    .filter((t) => t.length > 12 && t.length <= 62)
    .filter((t) => !/^(Yes|No|Detection|Never):?$/i.test(t)).length;
}
process.stdout.write(String(total));
