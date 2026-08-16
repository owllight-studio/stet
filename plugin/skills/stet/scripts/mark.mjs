/**
 * Set the state on content files. The mechanism behind claim, release and approve.
 *
 * Writes metadata and nothing else: not a typo, not a heading level, not a trailing space.
 *
 * Usage: node mark.mjs <state> [--author human|agent] [--policy frozen|refresh|open] [path ...]
 *        with no paths, every content file the project has.
 */

import { relative } from "node:path";
import { findContent } from "./lib/find.mjs";
import { read, write, STATES, POLICIES } from "./lib/meta.mjs";

const root = process.cwd();
const argv = process.argv.slice(2);
const state = argv.shift();

if (!STATES.includes(state)) {
  console.error(`mark.mjs <${STATES.join("|")}> [--author human|agent] [--policy ${POLICIES.join("|")}] [path ...]`);
  process.exit(2);
}

const flag = (name) => {
  const i = argv.indexOf(`--${name}`);
  if (i < 0) return null;
  const value = argv[i + 1];
  argv.splice(i, 2);
  return value;
};

const author = flag("author");
const policy = flag("policy");
if (policy && !POLICIES.includes(policy)) {
  console.error(`policy must be one of: ${POLICIES.join(", ")}`);
  process.exit(2);
}

const files = argv.length ? argv.map((a) => relative(root, a) || a) : findContent(root).files;
const today = new Date().toISOString().slice(0, 10);

let changed = 0;
for (const file of files) {
  const existing = read(root, file) ?? {};
  const meta = { ...existing, state };
  if (author) meta.author = author;
  if (policy) meta.policy = policy;
  // Approval is an event and worth dating. Nothing else here is.
  if (state === "approved") meta.approved = today;
  else delete meta.approved;

  try {
    const how = write(root, file, meta);
    console.log(`  ${state.padEnd(9)} ${file}${how === "created" ? "  (frontmatter added)" : ""}`);
    changed++;
  } catch (err) {
    console.log(`  FAILED    ${file}  ${err.message}`);
  }
}

console.log(`\n${changed} of ${files.length} files marked ${state}.`);
if (state === "authored") console.log("These are closed to an agent. Nothing may edit or regenerate them.");
if (state === "approved") console.log("Closed to an agent. Approval is what made them the author's.");
if (state === "draft") console.log("Open to an agent. Approve them when you have read them.");
