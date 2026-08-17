/**
 * What every cited source was last time, and what changed since.
 *
 * This file holds the whole state machine and touches no network, which is the point of it. Whether
 * a page is reachable is a question for the world; whether what came back means anything is a
 * question with a fixed answer, and a fixed answer is a thing you can test in a millisecond.
 *
 * Two tiers, and the split is the design rather than a detail. Loud is what cannot be innocent.
 * Quiet is the page's text moving on its own, which happens to 76.35 percent of references with a
 * snapshot (Jones et al., PLOS ONE, 2016, 184,065 of 241,091), so reporting it as a failure would
 * report three quarters of a bibliography and be ignored by the second run.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";

const RECORD = join(".stet", "standing.json");

export const LOUD = "loud";
export const QUIET = "quiet";
export const UNKNOWN = "unknown";
export const NONE = "none";

/** A DOI and a URL pointing at the same paper are two references and must not share a slot. */
export const key = (ref) => (ref.doi ? `doi:${ref.doi}` : `url:${ref.url}`);

export function readRecord(root) {
  const path = join(root, RECORD);
  if (!existsSync(path)) return { version: 1, refs: {} };
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8"));
    return { version: 1, refs: parsed?.refs ?? {} };
  } catch {
    /* A corrupt record must not be treated as an empty one silently, but it must not stop the run
       either. The caller reports it; here the safe read is an empty one. */
    return { version: 1, refs: {}, unreadable: true };
  }
}

export function writeRecord(root, record) {
  const path = join(root, RECORD);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify({ version: 1, refs: record.refs }, null, 2)}\n`);
}

/**
 * A title with one trailing site name taken off.
 *
 * Compared only when the full titles already differ. A CMS migration that appends the publication's
 * name to every page changes every title in a corpus on one day, and reporting that as several
 * hundred sources moving is the check firing dozens of times, which is the failure this project has
 * already paid for once.
 */
export const titleCore = (title) =>
  String(title ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\s*[|\u2013\u2014-]\s*[^|\u2013\u2014-]{1,40}$/, "")
    .trim();

/**
 * Previous state plus current observation, in. One verdict, out.
 *
 * The order of the tests is the precedence and it is deliberate. Dead beats everything because
 * nothing else can be assessed. The anchor beats the title because the anchor is the sentence's own
 * words and the title is the page's.
 */
export function compare(previous, now) {
  if (now.state === "unreachable")
    return { tier: UNKNOWN, verdict: "could not check", detail: now.detail ?? "no answer" };

  if (now.state === "dead")
    return { tier: LOUD, verdict: "dead", detail: now.status ? `returned ${now.status}` : "no answer" };

  if (now.state === "not found")
    return { tier: LOUD, verdict: "not found", detail: "Crossref has no record of it" };

  if (now.state === "retracted")
    return {
      tier: LOUD,
      verdict: "retracted",
      detail: now.retraction ? `the notice is ${now.retraction}` : "withdrawn",
    };

  if (now.state === "flagged")
    return { tier: LOUD, verdict: "flagged", detail: now.concern ?? "an expression of concern" };

  if (now.state === "superseded")
    return { tier: LOUD, verdict: "superseded", detail: `the version of record is ${now.published}` };

  if (!previous) return { tier: NONE, verdict: "first sight", detail: "" };

  if (previous.host && now.host && previous.host !== now.host)
    return {
      tier: LOUD,
      verdict: "moved host",
      detail: `${previous.host} now answers from ${now.host}`,
    };

  const gone = (now.anchors ?? []).filter((a) => !a.present).map((a) => a.text);
  if (gone.length)
    return {
      tier: LOUD,
      verdict: "anchor gone",
      detail: `the page no longer contains "${gone[0]}"${gone.length > 1 ? ` and ${gone.length - 1} more` : ""}`,
    };

  if (previous.title && now.title && previous.title !== now.title && titleCore(previous.title) !== titleCore(now.title))
    return {
      tier: LOUD,
      verdict: "title changed",
      detail: `was "${previous.title}", now "${now.title}"`,
    };

  if (previous.digest && now.digest && previous.digest !== now.digest)
    return { tier: QUIET, verdict: "drifted", detail: "the text changed and nothing above it did" };

  return { tier: NONE, verdict: "unchanged", detail: "" };
}
