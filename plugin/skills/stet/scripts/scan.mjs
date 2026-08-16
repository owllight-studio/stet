/**
 * The inventory `ingest` starts from.
 *
 * Reports what content exists, what format it is in, and how much of it is already claimed. It
 * writes nothing: `ingest` confirms the boundary with the author before a single file is touched,
 * because claiming a source file as prose is a mess to undo.
 */

import { findContent, readMeta, words, config } from "./lib/find.mjs";
import { extname, dirname } from "node:path";

const root = process.cwd();
const cfg = config(root);
const { files, guessed, roots } = findContent(root);

if (cfg?.error) console.log(`  !!   ${cfg.error}\n`);

if (!files.length) {
  console.log("No content found.");
  console.log(
    guessed
      ? "  Looked in the usual places and found nothing. If content lives somewhere else, say where."
      : "  stet.config.json points at nothing that exists.",
  );
  process.exit(0);
}

const byExt = new Map();
const byDir = new Map();
let claimed = 0;
let totalWords = 0;

for (const file of files) {
  const ext = extname(file) || "(none)";
  byExt.set(ext, (byExt.get(ext) ?? 0) + 1);
  const dir = dirname(file);
  const w = words(root, file);
  totalWords += w;
  const hit = byDir.get(dir) ?? { files: 0, words: 0, claimed: 0 };
  hit.files++;
  hit.words += w;
  if (readMeta(root, file).source !== "none") {
    hit.claimed++;
    claimed++;
  }
  byDir.set(dir, hit);
}

console.log(`${files.length} content files, ${totalWords.toLocaleString()} words`);
console.log(
  guessed
    ? `  found by guessing, in: ${roots.join(", ") || "nowhere"}\n  CONFIRM THIS BOUNDARY WITH THE AUTHOR BEFORE CLAIMING ANYTHING`
    : `  from stet.config.json: ${roots.join(", ")}`,
);
console.log();

console.log("formats");
for (const [ext, n] of [...byExt].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(n).padStart(4)}  ${ext}`);
}
console.log();

console.log("directories");
for (const [dir, s] of [...byDir].sort((a, b) => b[1].words - a[1].words)) {
  const flag = s.claimed === s.files ? "claimed" : s.claimed ? `${s.claimed}/${s.files} claimed` : "";
  console.log(
    `  ${String(s.files).padStart(4)} files  ${String(s.words).padStart(7).replace(/\B(?=(\d{3})+(?!\d))/g, ",")} words  ${dir}${flag ? `  [${flag}]` : ""}`,
  );
}
console.log();

if (claimed === files.length) {
  console.log("Every file is claimed. This project has been ingested before.");
} else if (claimed) {
  console.log(`${claimed} of ${files.length} files are claimed. ${files.length - claimed} are not.`);
  console.log("  An ingest that has been interrupted, or content added since. Claim the rest.");
} else {
  console.log("Nothing is claimed. Every one of these files belongs to whoever wrote it.");
  console.log("  Claim them all as owner: human, then let the author hand pieces over.");
}
