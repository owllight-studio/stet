/**
 * May I edit this? The question to ask before touching any content file.
 *
 * Exit codes are the point: 0 means yes, 1 means no. That makes it usable from a hook as well as
 * from a session, and a hook is what this eventually becomes. Reading the answer is optional;
 * obeying it is not.
 *
 * Usage: node owner.mjs <path> [...]
 */

import { relative } from "node:path";
import { read, mayEdit, mayRefresh } from "./lib/meta.mjs";

const root = process.cwd();
const files = process.argv.slice(2).map((a) => relative(root, a) || a);

if (!files.length) {
  console.error("owner.mjs <path> [...]");
  process.exit(2);
}

let blocked = 0;

for (const file of files) {
  const meta = read(root, file);

  if (!meta) {
    console.log(`NO    ${file}`);
    console.log(`        unclaimed. Content with no record belongs to whoever wrote it, which was`);
    console.log(`        not you. Run ingest before editing anything here.`);
    blocked++;
    continue;
  }

  const state = meta.state ?? "authored";
  if (mayEdit(meta)) {
    console.log(`YES   ${file}  (${state})`);
    continue;
  }

  blocked++;
  console.log(`NO    ${file}  (${state}${meta.policy ? `, policy: ${meta.policy}` : ""})`);
  console.log(
    state === "authored"
      ? "        A person wrote this. Do not edit it and do not regenerate it."
      : "        An agent wrote this and a person approved it. Approval is what made it theirs.",
  );
  if (mayRefresh(meta)) {
    console.log(
      `        You may bring these facts current and change nothing else: ${(meta.sources ?? []).join(", ") || "none named"}`,
    );
  }
  console.log("        You may always propose a rewrite in your reply. Do not put it in the file.");
}

process.exit(blocked ? 1 : 0);
