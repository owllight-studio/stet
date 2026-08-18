#!/usr/bin/env node
/* How many content files this project holds. One line, one figure.

   The context panel on map.html is a screenshot of real output and every number in it moves. The
   word count was declared as a source and the file count was not, so when eight reference documents
   were added the panel said 61 files and 98,771 words: half of it checked, half of it stale, and
   the stale half sitting on the page about keeping figures current. */
import { findContent } from "../plugin/skills/stet/scripts/lib/find.mjs";
process.stdout.write(String(findContent(process.cwd()).files.length));
