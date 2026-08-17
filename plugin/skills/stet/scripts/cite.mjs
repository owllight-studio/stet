#!/usr/bin/env node
/**
 * Does this source exist, is it still standing, and is it the version you should be citing.
 *
 * Three checks, all mechanical, all answerable by one keyless request each. They are separated from
 * the judgement half deliberately, the same way `verify` is separated from `stet-fact-checker`:
 * whether a paper exists is arithmetic, and whether it supports your sentence is not.
 *
 * The case for this being built at all is not that models invent citations. It is that **verifying
 * them is the step everyone skips, and it stays skipped**. The AI Hallucination Cases database
 * recorded 1,922 court filings containing fabricated citations by August 2026, growing 16 in 2023,
 * 59 in 2024, 845 in 2025 and 1,002 in the first eight months of 2026. 347 carried a monetary
 * penalty and 148 a professional sanction. Every one of those filings passed through somebody whose
 * job includes checking sources.
 *
 * And the tools sold to prevent it do not. Purpose-built legal research products marketed on
 * "hallucination-free" retrieval were measured at 65 percent, 41 percent and 19 percent accuracy
 * (Magesh et al., Journal of Empirical Legal Studies, 2025).
 *
 * Nor is this only a machine problem. Human-written biomedical papers carry citation accuracy
 * errors in 39 percent of instances (Sarol et al., Bioinformatics, 2024), and 35 percent of surgical
 * citations contained an error uncorrelated with journal impact factor (Awrey et al., 2011).
 *
 * The retraction check is the one nobody runs and the cheapest of the three. Retraction data has
 * been free and keyless since Crossref acquired the Retraction Watch database in 2023, and across
 * 13,252 post-retraction citation contexts only 5.4 percent acknowledged the retraction
 * (Hsiao and Schneider, Quantitative Science Studies, 2022).
 *
 * Run: node cite.mjs [file ...]
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { findContent } from "./lib/find.mjs";

const root = process.cwd();
const args = process.argv.slice(2);
const files = args.filter((a) => !a.startsWith("--"));
const quiet = args.includes("--quiet");

const MAILTO = process.env.STET_CROSSREF_MAILTO ?? "";
const UA = `stet/0.1 (https://github.com/owllight-studio/stet${MAILTO ? `; mailto:${MAILTO}` : ""})`;

/* --- finding citations ---------------------------------------------------- */

/**
 * DOIs, and only DOIs.
 *
 * A DOI is unambiguous, resolvable and free to check. Parsing prose bibliographies is a different
 * and much worse problem: a reference with a typo in the year is indistinguishable from a
 * fabrication until somebody reads it, and guessing wrong in either direction is worse than saying
 * nothing. If a citation has no DOI this reports it as unchecked rather than pretending.
 */
const DOI = /\b(10\.\d{4,9}\/[-._;()/:A-Z0-9]*[A-Z0-9])\b/gi;

/** A line that looks like a reference but carries no DOI. Reported, never guessed at. */
const LOOKS_LIKE_REF =
  /^\s*(?:\[\d+\]|\d+\.)\s+.*\(\s*(?:19|20)\d\d\s*\)|^\s*[A-Z][a-z]+(?:,| and | et al\.).*\b(?:19|20)\d\d\b.*[.,]\s*[A-Z]/;

function citations(text) {
  const found = new Map();
  for (const m of text.matchAll(DOI)) {
    const doi = m[1].replace(/[.,;)\]]+$/, "").toLowerCase();
    if (!found.has(doi)) found.set(doi, { doi, line: text.slice(0, m.index).split("\n").length });
  }
  const bare = [];
  text.split("\n").forEach((line, i) => {
    if (DOI.test(line)) return;
    if (LOOKS_LIKE_REF.test(line)) bare.push({ line: i + 1, text: line.trim().slice(0, 90) });
  });
  return { dois: [...found.values()], bare };
}

/* --- asking, once per citation -------------------------------------------- */

async function ask(doi) {
  const url = `https://api.crossref.org/works/${encodeURIComponent(doi)}${MAILTO ? `?mailto=${MAILTO}` : ""}`;
  try {
    const res = await fetch(url, { headers: { "user-agent": UA }, signal: AbortSignal.timeout(20000) });
    if (res.status === 404) return { doi, state: "not found" };
    if (!res.ok) return { doi, state: "unreachable", detail: `Crossref returned ${res.status}` };
    const { message } = await res.json();

    /* Retraction Watch has been inline in Crossref since 2023, so this costs nothing extra. */
    const updates = message["update-to"] ?? [];
    const updatedBy = message["updated-by"] ?? [];
    const retraction = updatedBy.find((u) => /retract/i.test(u.type ?? ""));
    const concern = updatedBy.find((u) => /concern|withdraw/i.test(u.type ?? ""));

    /* A preprint with a version of record. ICMJE requires citing the published one. */
    const published = (message.relation?.["is-preprint-of"] ?? [])[0];

    return {
      doi,
      state: retraction ? "retracted" : concern ? "flagged" : published ? "superseded" : "current",
      // Crossref titles carry markup and hard-wrapped whitespace from the publisher's own record.
      title: ((message.title ?? [])[0] ?? "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim(),
      year: message.issued?.["date-parts"]?.[0]?.[0],
      container: (message["container-title"] ?? [])[0],
      type: message.type,
      retraction: retraction?.DOI,
      concern: concern?.type,
      published: published?.id,
      updates: updates.length,
    };
  } catch (err) {
    return { doi, state: "unreachable", detail: String(err.message ?? err).slice(0, 80) };
  }
}

/* --- run ------------------------------------------------------------------ */

const targets = files.length ? files : findContent(root).files;
const work = [];
for (const file of targets) {
  const text = readFileSync(join(root, file), "utf8");
  const { dois, bare } = citations(text);
  if (dois.length || bare.length) work.push({ file, dois, bare });
}

if (!work.length) {
  console.log("No DOIs and nothing that looks like a reference list.");
  console.log("");
  console.log("This checks DOIs, because a DOI is unambiguous and free to resolve. A reference with");
  console.log("a typo in the year is indistinguishable from a fabrication until somebody reads it,");
  console.log("and guessing either way is worse than saying nothing.");
  process.exit(0);
}

const total = work.reduce((n, w) => n + w.dois.length, 0);
console.log(`Checking ${total} ${total === 1 ? "DOI" : "DOIs"} across ${work.length} ${work.length === 1 ? "file" : "files"}.`);
if (!MAILTO) console.log("Set STET_CROSSREF_MAILTO to use Crossref's polite pool and get better service.\n");
else console.log("");

const results = [];
for (const w of work) {
  for (const c of w.dois) {
    /* One at a time. These are somebody else's free public APIs and a burst from every citation in
       a bibliography at once is how a project gets rate limited for everyone. */
    results.push({ file: w.file, line: c.line, ...(await ask(c.doi)) });
  }
}

const by = (s) => results.filter((r) => r.state === s);
const say = (rows, head, gloss) => {
  if (!rows.length) return;
  console.log(`${head}  ${rows.length}`);
  console.log(`  ${gloss}\n`);
  for (const r of rows) {
    console.log(`  ${r.doi}`);
    console.log(`    ${r.file}${r.line ? `, line ${r.line}` : ""}`);
    if (r.title) console.log(`    ${r.title}${r.year ? `, ${r.year}` : ""}`);
    if (r.state === "retracted") console.log(`    RETRACTED. The retraction notice is ${r.retraction}`);
    if (r.state === "flagged") console.log(`    Carries an ${r.concern}`);
    if (r.state === "superseded") console.log(`    This is the preprint. The version of record is ${r.published}`);
    if (r.detail) console.log(`    ${r.detail}`);
    console.log("");
  }
};

say(by("not found"), "DOES NOT EXIST", "Crossref has no record of this. Either it is wrong or it was invented");
say(by("retracted"), "RETRACTED", "the paper was withdrawn and the page is still citing it");
say(by("flagged"), "FLAGGED", "an expression of concern or a withdrawal notice");
say(by("superseded"), "PREPRINT WITH A PUBLISHED VERSION", "cite the version of record");
say(by("unreachable"), "COULD NOT CHECK", "no answer, which is not the same as no problem");

const bare = work.flatMap((w) => w.bare.map((b) => ({ file: w.file, ...b })));
if (bare.length && !quiet) {
  console.log(`NO DOI  ${bare.length}`);
  console.log("  reads like a reference and carries nothing checkable\n");
  for (const b of bare.slice(0, 12)) console.log(`  ${b.file}, line ${b.line}\n    ${b.text}\n`);
  if (bare.length > 12) console.log(`  and ${bare.length - 12} more\n`);
}

console.log(
  [
    `${by("current").length} current`,
    `${by("not found").length} not found`,
    `${by("retracted").length} retracted`,
    `${by("flagged").length} flagged`,
    `${by("superseded").length} superseded`,
    `${by("unreachable").length} unchecked`,
  ].join(", "),
);

console.log("");
console.log("What this cannot tell you is whether a source supports the sentence citing it, which is");
console.log("the failure that shows up in 39 percent of citation instances in published, human");
console.log("written papers. That needs somebody to read both. See stet-citation-checker.");

process.exit(by("not found").length + by("retracted").length ? 1 : 0);
