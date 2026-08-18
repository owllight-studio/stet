#!/usr/bin/env node
/* How many words of content this project actually holds. One line, one figure, which is the
   contract a Stet source has to meet.

   It exists because the context panel on map.html is a screenshot of real output, and the word
   count in it moves on every commit. A figure a person has to remember to retype is the exact
   thing `refresh` was built for, and putting a stale one on the page about keeping figures
   current is the worst place on the site to leave one. */
import { findContent, words } from "../plugin/skills/stet/scripts/lib/find.mjs";

const root = process.cwd();
const total = findContent(root).files.reduce((n, f) => n + words(root, f), 0);
process.stdout.write(String(total));
