#!/usr/bin/env node
/* How many tests the suite actually holds. One line, one figure.

   Counting `test(` rather than running the suite, because a source runs on every `verify` and a
   figure that costs a full test run to check is a figure nobody will check. It agrees with
   `node --test` exactly while every test is a top-level `test()` call, which is the only shape
   this suite uses. If that ever stops being true, this number stops being right, and the honest
   fix then is to run the suite rather than to loosen the count. */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const dir = "test";
const total = readdirSync(dir)
  .filter((f) => f.endsWith(".test.mjs"))
  .reduce((n, f) => n + (readFileSync(join(dir, f), "utf8").match(/^test\(/gm) ?? []).length, 0);
process.stdout.write(String(total));
