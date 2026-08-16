#!/usr/bin/env node
/**
 * What may be done to this, and what it depends on.
 *
 * State says whose the words are. Policy says what may still happen to them once they are closed,
 * and the two only mean something together. A file is not "approved" in a way anybody can act on
 * until you also know whether its figures may move.
 *
 * The command has three jobs and the first one is the point: **say in plain English what an agent
 * may and may not do to a given file**, derived from the same predicates the hook enforces rather
 * than from a table somebody wrote once. If the explanation and the hook ever disagree, the
 * explanation is the bug.
 *
 *   node policy.mjs <file> [...]              what may be done to it
 *   node policy.mjs set <policy> <file> [...]  frozen | refresh | open
 *   node policy.mjs check                      combinations that mean nothing
 */

import { findContent } from "./lib/find.mjs";
import { read as readMeta, write as writeMeta, mayEdit, mayRefresh, ownedSpans, POLICIES } from "./lib/meta.mjs";
import { declared } from "./lib/sources.mjs";

const root = process.cwd();
const argv = process.argv.slice(2);

/* --- what it permits, in words -------------------------------------------- */

function explain(file) {
  const m = readMeta(root, file);
  const specs = declared(root);
  const sources = m?.sources ?? [];
  const owned = ownedSpans(m);

  const lines = [];
  if (!m) {
    lines.push("carries no state at all, so nothing is decided and nothing is protected");
    return { file, meta: m, lines };
  }

  lines.push(`state ${m.state ?? "unset"}${m.policy ? `, policy ${m.policy}` : ", no policy"}`);

  if (mayEdit(m)) {
    lines.push(m.state === "draft"
      ? "an agent may rewrite the words freely, because nobody has accepted them yet"
      : "an agent may rewrite the words, because the policy says open");
  } else {
    lines.push(m.state === "authored"
      ? "an agent may not touch the words. A person wrote them"
      : "an agent may not touch the words. A person read them and accepted them");
  }

  if (owned.length) {
    lines.push(`${owned.length} ${owned.length === 1 ? "sentence is" : "sentences are"} the author's inside otherwise open content, and no rewrite may take ${owned.length === 1 ? "it" : "them"}`);
  }

  /* The refresh permission only says anything about a file whose words are closed. On an editable
     one it is already implied, and printing it invites somebody to think the two are related. */
  if (mayEdit(m)) {
    if (sources.length) lines.push(`cites ${sources.join(", ")}, which verify will check`);
    return { file, meta: m, lines, sources, specs };
  }

  if (mayRefresh(m)) {
    if (!sources.length) {
      lines.push("figures may be brought current, but no source is named, so this permits nothing in practice");
    } else {
      const missing = sources.filter((s) => !specs[s]);
      lines.push(`figures from ${sources.join(", ")} may be brought current, and nothing else may change`);
      if (missing.length) lines.push(`${missing.join(", ")} ${missing.length === 1 ? "is" : "are"} cited here and not declared in stet.config.json`);
    }
  } else {
    lines.push(sources.length
      ? `cites ${sources.join(", ")}, and the policy forbids acting on ${sources.length === 1 ? "it" : "them"}`
      : "nothing may change, including figures that have moved");
  }

  return { file, meta: m, lines, sources, specs };
}

/* --- combinations that mean nothing --------------------------------------- */

function incoherent(file) {
  const m = readMeta(root, file);
  if (!m) return [];
  const specs = declared(root);
  const sources = m.sources ?? [];
  const out = [];

  if (m.state === "draft" && m.policy && m.policy !== "open") {
    out.push([`policy ${m.policy} on a draft`, "draft already permits everything, so the policy is inert and will surprise somebody the day it is approved"]);
  }
  if (m.state !== "draft" && m.policy === "refresh" && !sources.length) {
    out.push(["refresh with no sources", "the policy grants permission to update figures and no figure is named, so it grants nothing"]);
  }
  if (m.policy === "frozen" && sources.length) {
    out.push(["frozen with sources", `cites ${sources.join(", ")} and forbids acting on them, so the citation is decoration`]);
  }
  for (const s of sources) {
    if (!specs[s]) out.push([`cites ${s}`, "which is not declared in stet.config.json, so verify will report it broken forever"]);
  }
  return out;
}

/* --- set ------------------------------------------------------------------ */

if (argv[0] === "set") {
  const [, policy, ...files] = argv;
  if (!POLICIES.includes(policy) || !files.length) {
    console.log(`policy.mjs set <${POLICIES.join("|")}> <file> [...]`);
    process.exit(1);
  }

  let refused = 0;
  for (const file of files) {
    const m = readMeta(root, file) ?? {};
    if (m.state === "draft" && policy !== "open") {
      console.log(`${file}: refused. It is a draft, which already permits everything, so ${policy} would take effect only when somebody approves it and would surprise them then.`);
      refused++;
      continue;
    }
    if (policy === "refresh" && !(m.sources ?? []).length) {
      console.log(`${file}: refused. refresh permits figures to be updated and no source is named here, so it would permit nothing.`);
      console.log(`         Add sources: [...] first, then set the policy.`);
      refused++;
      continue;
    }
    writeMeta(root, file, { ...m, policy });
    console.log(`${file}: policy ${policy}`);
    for (const l of explain(file).lines.slice(1)) console.log(`         ${l}`);
  }
  process.exit(refused ? 1 : 0);
}

/* --- check ---------------------------------------------------------------- */

if (argv[0] === "check") {
  const { files } = findContent(root);
  let found = 0;
  for (const file of files) {
    const problems = incoherent(file);
    if (!problems.length) continue;
    found += problems.length;
    console.log(file);
    for (const [what, why] of problems) console.log(`  ${what}\n    ${why}`);
    console.log("");
  }
  console.log(found ? `${found} to settle.` : "Every state and policy pair means something.");
  process.exit(found ? 1 : 0);
}

/* --- explain -------------------------------------------------------------- */

if (!argv.length) {
  console.log("policy.mjs <file> [...]              what may be done to it");
  console.log(`policy.mjs set <${POLICIES.join("|")}> <file>  set it`);
  console.log("policy.mjs check                     combinations that mean nothing");
  process.exit(1);
}

for (const file of argv) {
  const { lines } = explain(file);
  console.log(file);
  for (const l of lines) console.log(`  ${l}`);
  const problems = incoherent(file);
  for (const [what, why] of problems) console.log(`  ! ${what}: ${why}`);
  console.log("");
}
