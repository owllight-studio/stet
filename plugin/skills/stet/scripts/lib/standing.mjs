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

/**
 * One entry per source, however many places cite it.
 *
 * A paper cited from three files is one source and one request. Checking it three times breaks the
 * one-request-per-source rule the commands otherwise keep, and it does something worse: the second
 * occurrence compares against the entry the first one wrote seconds earlier and reports "unchanged"
 * about a comparison that never happened.
 *
 * The anchors are the union, because each citing paragraph quotes its own words and every one of
 * them is a claim resting on this page. The site kept is the first, and `others` is how many other
 * files cite the same source, so a finding can say where else to go and look. `others` and `files`
 * are for the report only: `entryFor` never writes them, because a list of sites in the record is a
 * schema change and it can wait.
 */
export function distinct(refs) {
  const sources = [];
  const byKey = new Map();
  for (const ref of refs) {
    const k = key(ref);
    const already = byKey.get(k);
    if (!already) {
      const source = { ...ref, anchors: ref.anchors ? [...ref.anchors] : ref.anchors, files: new Set([ref.file]) };
      byKey.set(k, source);
      sources.push(source);
      continue;
    }
    already.files.add(ref.file);
    if (ref.anchors?.length) already.anchors = [...new Set([...(already.anchors ?? []), ...ref.anchors])];
  }
  for (const source of sources) source.others = source.files.size - 1;
  return sources;
}

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
 * What goes back into the record for one reference. Pure, and the date is an argument rather than
 * the clock, so every rule below can be exercised across three runs in a millisecond.
 *
 * It lives here beside `compare` rather than in the command because it is the other half of the
 * same state machine, and while it lived in the command it was the one piece with no test. Both of
 * the rules it now states were wrong there.
 *
 * **`since` is the date the state began**, so it moves only when the state genuinely differs from
 * what was recorded. A finding that fires on the record's own contents, a title that changed or
 * text that drifted, is answered by writing the new title or digest back: it fires once, and the
 * date the source has been dead or retracted stays put. Advancing the date on every loud or quiet
 * run would leave the day a link died surviving exactly one run, after which the report says
 * "yesterday" forever, and the record is committed, so it would churn the repository too.
 *
 * **An unreachable observation is a fact about the check, not about the source.** It keeps the
 * recorded state and its date, and advances only `lastChecked`. Writing `unreachable` into the
 * record would destroy the date on the run after, assert that a live page is unreachable, and stop
 * `archive` saving a URL it would then describe as never having had a copy. With no previous
 * observation there is nothing to keep, so the check's own outcome is recorded and the first
 * successful look replaces it.
 */
export function entryFor(previous, ref, now, today) {
  const base = {
    ...previous,
    anchors: ref.anchors ?? previous?.anchors ?? [],
    file: ref.file,
    line: ref.line,
    firstSeen: previous?.firstSeen ?? today,
    lastChecked: today,
  };

  if (now.state === "unreachable")
    return { ...base, state: previous?.state ?? now.state, since: previous?.since ?? today };

  const changed = !previous || previous.state !== now.state;
  return {
    ...base,
    state: now.state,
    title: now.title ?? previous?.title,
    digest: now.digest ?? previous?.digest,
    host: now.host ?? previous?.host,
    since: changed ? today : (previous?.since ?? today),
  };
}

/**
 * A host with a leading `www.` taken off.
 *
 * The first time a cited site turns on a www redirect, every reference to it would answer from a
 * "different" host and the loud tier would fire on a corpus of sources that are all fine. A check
 * that fires wrongly gets ignored rather than fixed, which is this project's most expensive lesson.
 */
const bareHost = (host) => String(host ?? "").replace(/^www\./i, "");

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

  if (previous.host && now.host && bareHost(previous.host) !== bareHost(now.host))
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
