#!/usr/bin/env node
/**
 * When the hook is in your way.
 *
 * Every enforcement tool needs an escape hatch, and the shape of the hatch is a design decision
 * rather than a convenience. A design linter that warns can offer on, off and ignore-this-rule,
 * because the worst case of switching it off is uglier CSS. This hook protects who owns which
 * words, so "turn it off" means "stop protecting my content", and a global switch would make the
 * whole model advisory the moment it was inconvenient.
 *
 * So the primitive is not off. It is **release, scoped and recorded**.
 *
 *   unlock  one file, with a stated reason, for this piece of work
 *   relock  put it back
 *   status  what is open right now, why, and since when
 *
 * The reason is required. That is the entire point: the record of who opened something and why
 * survives the session, so an unlock is a decision somebody made rather than a rule that quietly
 * stopped applying. `verify` and `audit` can then see that a file was open while it was edited.
 *
 * There is an `off`, because refusing to build one means somebody edits the hook file instead. It
 * is loud, it records itself the same way, and `status` puts it first.
 *
 *   node admin.mjs status
 *   node admin.mjs unlock <file> --for "<reason>"
 *   node admin.mjs relock <file> | --all
 *   node admin.mjs off --for "<reason>"   |  on
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { config } from "./lib/find.mjs";
import { read as readMeta } from "./lib/meta.mjs";

const root = process.cwd();
const STATE = join(root, ".stet", "admin.json");
const argv = process.argv.slice(2);
const cmd = argv[0];

const load = () => (existsSync(STATE) ? JSON.parse(readFileSync(STATE, "utf8")) : { unlocked: {}, hook: null });
const save = (s) => {
  mkdirSync(dirname(STATE), { recursive: true });
  writeFileSync(STATE, `${JSON.stringify(s, null, 2)}\n`);
};

const now = () => new Date().toISOString().slice(0, 16).replace("T", " ");
const reasonFrom = (args) => {
  const i = args.indexOf("--for");
  return i >= 0 ? args.slice(i + 1).join(" ").trim() : "";
};
const files = (args) => args.slice(1).filter((a) => !a.startsWith("--") && args.indexOf(a) < (args.indexOf("--for") + 1 || Infinity));

if (!config(root)) {
  console.log("No stet.config.json here, so nothing is being enforced and there is nothing to unlock.");
  process.exit(0);
}

/* --- status --------------------------------------------------------------- */

if (!cmd || cmd === "status") {
  const s = load();
  const open = Object.entries(s.unlocked ?? {});

  if (s.hook?.off) {
    console.log("THE HOOK IS OFF");
    console.log(`  since ${s.hook.since}`);
    console.log(`  because: ${s.hook.reason}`);
    console.log("  Nothing is being protected. Turn it back on with: admin.mjs on\n");
  } else {
    console.log("The hook is on.\n");
  }

  if (!open.length) {
    console.log("Nothing is unlocked. Every closed file is closed.");
  } else {
    console.log(`${open.length} ${open.length === 1 ? "file is" : "files are"} unlocked:\n`);
    for (const [file, u] of open) {
      console.log(`  ${file}`);
      console.log(`    since ${u.since}, was ${u.was ?? "unknown"}`);
      console.log(`    because: ${u.reason}\n`);
    }
    console.log("Relock them when the work is done: admin.mjs relock --all");
  }
  process.exit(0);
}

/* --- unlock --------------------------------------------------------------- */

if (cmd === "unlock") {
  const reason = reasonFrom(argv);
  const targets = files(argv);

  if (!targets.length) {
    console.log("admin.mjs unlock <file> [...] --for \"<reason>\"");
    process.exit(1);
  }
  if (!reason) {
    console.log("A reason is required, and that is the point of this command rather than a formality.");
    console.log("");
    console.log("An unlock with no reason is a rule that quietly stopped applying. An unlock with one is");
    console.log("a decision somebody made, and the record outlives the session.");
    console.log("");
    console.log(`  admin.mjs unlock ${targets[0]} --for "rewriting the ramp section with the author"`);
    process.exit(1);
  }

  const s = load();
  for (const file of targets) {
    const meta = readMeta(root, file);
    if (!meta) {
      console.log(`${file}: carries no state, so nothing is stopping you. Nothing to unlock.`);
      continue;
    }
    if (meta.state === "draft") {
      console.log(`${file}: is a draft, which an agent may already rewrite. Nothing to unlock.`);
      continue;
    }
    s.unlocked[file] = { since: now(), reason, was: meta.state };
    console.log(`${file}: unlocked, and it was ${meta.state}.`);
  }
  save(s);
  console.log("");
  console.log("The words are open to an agent until you relock. Whose they are has not changed, and");
  console.log("relocking restores exactly what was there before.");
  process.exit(0);
}

/* --- relock --------------------------------------------------------------- */

if (cmd === "relock") {
  const s = load();
  const open = Object.keys(s.unlocked ?? {});
  const targets = argv.includes("--all") ? open : files(argv);

  if (!open.length) {
    console.log("Nothing is unlocked.");
    process.exit(0);
  }
  if (!targets.length) {
    console.log("admin.mjs relock <file> [...]   or   admin.mjs relock --all");
    console.log(`\nOpen right now: ${open.join(", ")}`);
    process.exit(1);
  }

  for (const file of targets) {
    if (!s.unlocked[file]) {
      console.log(`${file}: was not unlocked.`);
      continue;
    }
    console.log(`${file}: relocked, back to ${s.unlocked[file].was}.`);
    delete s.unlocked[file];
  }
  save(s);
  process.exit(0);
}

/* --- off and on ----------------------------------------------------------- */

if (cmd === "off") {
  const reason = reasonFrom(argv);
  if (!reason) {
    console.log("Turning the whole hook off needs a reason, and you should probably not be doing it.");
    console.log("");
    console.log("Unlocking one file is almost always the right move, because it keeps every other file");
    console.log("protected and leaves a record of the one you opened:");
    console.log("");
    console.log("  admin.mjs unlock <file> --for \"<reason>\"");
    console.log("");
    console.log("If you genuinely mean all of it:");
    console.log("");
    console.log("  admin.mjs off --for \"<reason>\"");
    process.exit(1);
  }
  const s = load();
  s.hook = { off: true, since: now(), reason };
  save(s);
  console.log("The hook is off. Nothing is being protected.");
  console.log(`Recorded: ${reason}`);
  console.log("\nTurn it back on with: admin.mjs on");
  process.exit(0);
}

if (cmd === "on") {
  const s = load();
  if (!s.hook?.off) {
    console.log("The hook is already on.");
    process.exit(0);
  }
  console.log(`The hook is on again. It was off since ${s.hook.since}, because: ${s.hook.reason}`);
  s.hook = null;
  save(s);
  process.exit(0);
}

console.log("admin.mjs status | unlock <file> --for \"<reason>\" | relock <file>|--all | off --for \"<reason>\" | on");
process.exit(1);
