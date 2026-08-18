#!/usr/bin/env node
/* How many arithmetic relations `sums` finds in this project's content. One line, one figure.

   The checks page shows a real `sums` run in a panel, and the figure in it went stale the moment
   the corpus grew: it said 7 relations across 61 files while the run reported 8 across 69. A
   screenshot of a command is still a claim, and the page it sits on is the one selling figures
   held to the command that produced them. */
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const out = execFileSync(process.execPath, [join(here, "..", "plugin", "skills", "stet", "scripts", "sums.mjs")], {
  cwd: process.cwd(),
  encoding: "utf8",
});
process.stdout.write(String((out.match(/^(\d+) relations across/m) ?? [])[1] ?? ""));
