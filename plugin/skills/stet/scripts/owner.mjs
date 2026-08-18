/**
 * May I edit this? The question to ask before touching any content file.
 *
 * Exit codes are the point: 0 means yes, 1 means no. That makes it usable from a hook as well as
 * from a session, and a hook is what this eventually becomes. Reading the answer is optional;
 * obeying it is not.
 *
 * Usage: node owner.mjs <path> [...]
 */

import { existsSync, readFileSync } from "node:fs";
import { relative, join } from "node:path";
import { read, mayEdit, mayRefresh } from "./lib/meta.mjs";

const root = process.cwd();
const files = process.argv.slice(2).map((a) => relative(root, a) || a);

if (!files.length) {
  console.error("owner.mjs <path> [...]");
  process.exit(2);
}

/*
 * The unlock record, read the way the hook reads it.
 *
 * `owner` is the check an agent is told to run before touching content, and the ownership page
 * promises that what it says and what the hook does cannot drift apart. They drifted: the hook has
 * honoured `.stet/admin.json` since it was written and this command had never heard of it, so a
 * file opened with `admin unlock` still answered NO here while the hook let the edit through. An
 * agent that believes this command stops when it did not have to, and an agent that believes the
 * hook edits a file this command said was closed. Either way one of them is lying.
 */
let adminRecord = {};
try {
  const p = join(root, ".stet", "admin.json");
  if (existsSync(p)) adminRecord = JSON.parse(readFileSync(p, "utf8"));
} catch {
  /* A corrupt admin file must not open the gate, which is what the hook does with it too. */
}

let blocked = 0;

for (const file of files) {
  const meta = read(root, file);

  if (adminRecord?.hook?.off) {
    console.log(`YES   ${file}  (the hook is off)`);
    console.log(`        Nothing is being protected. Recorded: ${adminRecord.hook.reason ?? "no reason given"}`);
    continue;
  }
  if (adminRecord?.unlocked?.[file]) {
    const u = adminRecord.unlocked[file];
    console.log(`YES   ${file}  (unlocked${meta?.state ? `, was ${meta.state}` : ""})`);
    console.log(`        Opened deliberately. Recorded: ${u?.reason ?? "no reason given"}`);
    console.log(`        Relock it when you are done: admin relock ${file}`);
    continue;
  }

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
