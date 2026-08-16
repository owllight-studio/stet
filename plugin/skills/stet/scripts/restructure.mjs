#!/usr/bin/env node
/**
 * Reorder and regroup a page, and prove the words survived.
 *
 * Restructure is the one refine command with an exact contract. `tighten` removes words and
 * `clarify` changes them, so both have to be judged. This moves blocks and nothing else, which
 * means a correct restructure leaves every block byte for byte identical and only their order
 * different. **Anything added, removed or edited is not a restructure**, and that is checkable
 * rather than arguable.
 *
 * Blocks are matched by their own text rather than by position, which is the same content-addressed
 * idea ownership spans use, and for the same reason: it is the only identity that survives
 * everything around it moving. Which makes this command the proof that the ownership design was
 * right. An author's sentence keeps its owner through a restructure because nothing about the owner
 * was ever tied to where the sentence sat.
 *
 *   node restructure.mjs outline  <file>   the skeleton, to reason about
 *   node restructure.mjs snapshot <file>   record the order, before changing anything
 *   node restructure.mjs check    <file>   what moved, and what should not have
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { createHash } from "node:crypto";
import { split } from "./lib/blocks.mjs";
import { read as readMeta, ownedSpans } from "./lib/meta.mjs";
import { intact } from "./lib/spans.mjs";

const root = process.cwd();
const [mode, ...paths] = process.argv.slice(2);
const SNAP = join(root, ".stet", "restructure.json");

if (!mode || !paths.length || !["outline", "snapshot", "check"].includes(mode)) {
  console.log("restructure.mjs <outline|snapshot|check> <file> [...]");
  process.exit(1);
}

/** A block's identity is its words, with whitespace normalised so a reflow is not a rewrite. */
const idOf = (text) => createHash("sha1").update(text.replace(/\s+/g, " ").trim()).digest("hex").slice(0, 12);

const gist = (text, n = 64) => {
  const flat = text.replace(/\s+/g, " ").replace(/<[^>]+>/g, "").trim();
  return flat.length > n ? `${flat.slice(0, n - 1)}…` : flat;
};

function blocksOf(file) {
  return split(root, file).blocks.map((b, i) => ({
    at: i,
    id: idOf(b.text),
    kind: b.kind,
    line: b.line,
    gist: gist(b.text),
    text: b.text,
  }));
}

/* --- outline -------------------------------------------------------------- */

if (mode === "outline") {
  for (const file of paths) {
    const blocks = blocksOf(file);
    console.log(`${file}  ${blocks.length} blocks\n`);
    for (const b of blocks) {
      const indent = b.kind === "heading" ? "" : "    ";
      const words = b.text.split(/\s+/).filter(Boolean).length;
      console.log(`${String(b.at).padStart(3)}  ${indent}${b.kind === "heading" ? "" : "· "}${b.gist}${b.kind === "heading" ? "" : `  (${words}w)`}`);
    }
    console.log("");
  }
  process.exit(0);
}

/* --- snapshot ------------------------------------------------------------- */

const load = () => (existsSync(SNAP) ? JSON.parse(readFileSync(SNAP, "utf8")) : {});

if (mode === "snapshot") {
  const all = load();
  for (const file of paths) {
    const blocks = blocksOf(file);
    all[file] = {
      taken: new Date().toISOString().slice(0, 19).replace("T", " "),
      blocks: blocks.map(({ id, kind, gist }) => ({ id, kind, gist })),
      owned: ownedSpans(readMeta(root, file)),
    };
    console.log(`${file}: ${blocks.length} blocks recorded.`);
  }
  mkdirSync(dirname(SNAP), { recursive: true });
  writeFileSync(SNAP, `${JSON.stringify(all, null, 2)}\n`);
  console.log("\nRestructure it now. Then run check.");
  process.exit(0);
}

/* --- check ---------------------------------------------------------------- */

const all = load();
let broken = 0;

for (const file of paths) {
  const snap = all[file];
  if (!snap) {
    console.log(`${file}: no snapshot. Run snapshot before restructuring, not after.`);
    broken++;
    continue;
  }

  const now = blocksOf(file);
  const wasIds = snap.blocks.map((b) => b.id);
  const nowIds = now.map((b) => b.id);

  const gone = snap.blocks.filter((b) => !nowIds.includes(b.id));
  const fresh = now.filter((b) => !wasIds.includes(b.id));

  /* Order, over the blocks that survived. A block whose neighbours all moved with it did not move. */
  const survived = now.filter((b) => wasIds.includes(b.id));
  const before = wasIds.filter((id) => nowIds.includes(id));
  const moved = survived.filter((b, i) => before[i] !== b.id);

  console.log(`${file}`);
  console.log(`  ${snap.blocks.length} blocks before, ${now.length} after, snapshot taken ${snap.taken}`);

  if (moved.length) {
    console.log(`\n  MOVED  ${moved.length}`);
    for (const b of moved) console.log(`    ${String(b.at).padStart(3)}  ${b.gist}`);
  }

  if (gone.length || fresh.length) {
    broken++;
    console.log(`\n  THE WORDS CHANGED. This is not a restructure.`);
    for (const b of gone) console.log(`    gone   ${b.gist}`);
    for (const b of fresh) console.log(`    new    ${b.gist}`);
    console.log(`\n    A block that was edited shows as one gone and one new, because a block is`);
    console.log(`    identified by its own words. If you meant to edit, that is tighten or clarify,`);
    console.log(`    and doing both at once makes the diff unreadable and the regression untraceable.`);
  }

  /* The property this command exists to demonstrate: ownership is content-addressed, so an author's
     sentences survive being moved. If one did not, the words were touched. */
  const owned = snap.owned ?? [];
  if (owned.length) {
    const lost = intact(readFileSync(join(root, file), "utf8"), owned);
    if (lost.length) {
      broken++;
      console.log(`\n  OWNED SENTENCES LOST  ${lost.length}`);
      for (const s of lost) console.log(`    ${gist(s)}`);
      console.log(`\n    These were the author's. Moving a page never loses one, so something was rewritten.`);
    } else {
      console.log(`\n  ${owned.length} owned ${owned.length === 1 ? "sentence" : "sentences"} still intact.`);
    }
  }

  if (!moved.length && !gone.length && !fresh.length) console.log("\n  Nothing moved.");
  console.log("");
}

if (broken) {
  console.log("Restructure moves blocks. It does not change them.");
  process.exit(1);
}
console.log("Every word survived. Only the order changed.");
