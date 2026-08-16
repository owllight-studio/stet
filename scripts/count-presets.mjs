#!/usr/bin/env node
/* How many registers the library actually contains. One line, one figure, which is the contract a
   Stet source has to meet. */
import { readdirSync } from "node:fs";
process.stdout.write(
  String(readdirSync("plugin/skills/stet/voices").filter((f) => f.endsWith(".md") && f !== "README.md").length),
);
