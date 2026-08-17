/**
 * The arithmetic a document does on itself.
 *
 * Two families share this file because they answer one question: do the numbers in this text agree
 * with each other. The general family reads relations any writing can state, and the statistical
 * family recomputes a p-value from its own test statistic. Neither knows anything about sources,
 * networks or config, which is what makes this the cheapest check in the set.
 *
 * Nothing here reads a file. Text in, verdicts out, so every rule below can be exercised directly.
 */

import { withoutCode } from "./citations.mjs";

const num = (s) => Number(String(s).replace(/,/g, ""));

/** The decimal places the author actually wrote. Comparing to more than this invents findings. */
export const precisionOf = (s) => (String(s).split(".")[1] ?? "").length;

/**
 * Sentences, with the line each one starts on.
 *
 * A relation only holds within a sentence. Two figures in neighbouring sentences are usually about
 * different things, and pairing them is how a checker starts arguing with prose that is correct.
 */
export function sentences(text) {
  /*
   * The offsets come off the text rather than off an assumption about the separator's width.
   *
   * The obvious version advances by the sentence's length plus one, which is right only when
   * exactly one character separates two sentences. A blank line between them is two, and from
   * there every later line number is short and the error accumulates. That exact bug shipped in
   * this project's paragraph splitting once already and produced line numbers that pointed at the
   * wrong line, which is worse than no line number at all.
   */
  const out = [];
  const between = /(?<=[.!?])\s+/g;
  let at = 0;
  let m;
  while ((m = between.exec(text)) !== null) {
    out.push({ text: text.slice(at, m.index), line: text.slice(0, at).split("\n").length });
    at = m.index + m[0].length;
  }
  out.push({ text: text.slice(at), line: text.slice(0, at).split("\n").length });
  return out;
}

const FRACTION = /(\d[\d,]*(?:\.\d+)?)\s+(?:of|out of)\s+(\d[\d,]*(?:\.\d+)?)/g;
const PERCENT = /(\d[\d,]*(?:\.\d+)?)\s*(?:%|percent|per cent)/g;

/*
 * Only `between X and Y`, never `from X to Y`.
 *
 * The second was in the first draft of this and it is wrong. "Took the variance from 0.61 to 0.34"
 * is ordinary English for a decrease, not a malformed range, and this repository says exactly that
 * in reference/tighten.md. A rule that fires on correct prose is worse than no rule.
 */
const RANGE = /between\s+(\d[\d,]*(?:\.\d+)?)\s+and\s+(\d[\d,]*(?:\.\d+)?)/g;

/**
 * How far apart a fraction and a percentage may sit and still be about each other.
 *
 * Measured against a real corpus rather than guessed. The first draft said 40 and that was tuned
 * on invented examples: the archetypal relation in this very repository, "76.35 percent of URI
 * references led to changed content: 184,065 of 241,091", has a gap of 43 and was being declined.
 * Sweeping the threshold over the corpus pairs 3 relations at 40, 4 at 60 and 5 at 80, with
 * nothing further appearing above 80 and no inconsistency introduced at any value. So 80 is
 * roughly double the widest real gap seen, and still short enough to mean something.
 */
const GAP = 80;

export function relations(text, markup = "md") {
  /*
   * Code is blanked first, by the same function `standing` uses, so a figure inside a fenced block
   * cannot be married to a figure in the prose around it. Without this the extractor reads straight
   * through code and pairs numbers that have nothing to do with each other: on this repository it
   * produced four findings and every one of them was wrong.
   */
  const clean = withoutCode(text, markup);
  const out = [];
  for (const s of sentences(clean)) {
    const fracs = [...s.text.matchAll(FRACTION)];
    const pcts = [...s.text.matchAll(PERCENT)];

    /*
     * Exactly one of each, and close together.
     *
     * A sentence carrying two fractions or two percentages cannot be paired safely, and pairing
     * the first of each is how this reported that 8,273 of 16,695 was 12.9 percent, having taken
     * the fraction from one clause and the percentage from another. Ambiguity is not a finding.
     * It is the same rule the sources half already follows: a claim we cannot locate is a claim we
     * must not touch.
     */
    if (fracs.length === 1 && pcts.length === 1) {
      const f = fracs[0];
      const p = pcts[0];
      const gap = f.index < p.index
        ? p.index - (f.index + f[0].length)
        : f.index - (p.index + p[0].length);
      if (gap <= GAP) {
        out.push({
          kind: "fraction",
          line: s.line,
          part: num(f[1]),
          whole: num(f[2]),
          stated: num(p[1]),
          precision: precisionOf(p[1]),
          saw: s.text.trim().slice(0, 90),
        });
      }
    }

    for (const r of s.text.matchAll(RANGE)) {
      out.push({ kind: "range", line: s.line, from: num(r[1]), to: num(r[2]), saw: s.text.trim().slice(0, 90) });
    }
  }
  return out;
}

const consistent = () => ({ state: "consistent", tier: "none", detail: "" });

export function checkFraction({ part, whole, stated, precision }) {
  /* A total of zero is not a division. Reporting it as an error would be arguing with a sentence
     that may be perfectly sensible, so it is named as an assumption and left alone. */
  if (!whole) return { state: "only-if", tier: "quiet", detail: "the total is zero, so no percentage follows from it", assumption: "the total was meant to be something else" };

  const computed = (part / whole) * 100;
  if (Number(computed.toFixed(precision)) === stated) return consistent();

  /*
   * The other renderings a careful person might legitimately have written.
   *
   * Not a tolerance band. A band of one unit in the last place sounds reasonable and is far too
   * wide: at zero decimal places it is a whole percentage point, so it would accept 77 as a
   * rendering of 76.3467, which is not a convention but an error. So the alternatives are named
   * exactly rather than approximated: truncating instead of rounding, and rounding half to even
   * instead of half away from zero. Both are real conventions, neither is wrong, and a checker
   * that calls them errors is one somebody switches off after a single run.
   */
  const f = 10 ** precision;
  const truncated = Math.trunc(computed * f) / f;
  const scaled = computed * f;
  const floor = Math.floor(scaled);
  const onBoundary = Math.abs(scaled - floor - 0.5) < 1e-9;
  const halfEven = onBoundary ? (floor % 2 === 0 ? floor : floor + 1) / f : null;

  /* The boundary case is checked first because it is the more specific explanation. On an exact
     half, truncating and rounding half to even give the same answer, and the second says more. */
  if (halfEven !== null && stated === halfEven) {
    return {
      state: "only-if",
      tier: "quiet",
      detail: `${stated} against ${computed.toFixed(Math.max(precision, 2))}, which falls exactly on a rounding boundary`,
      assumption: "the figure was rounded half to even",
    };
  }
  if (stated === truncated) {
    return {
      state: "only-if",
      tier: "quiet",
      detail: `${stated} against ${computed.toFixed(Math.max(precision, 2))}`,
      assumption: "the figure was truncated rather than rounded",
    };
  }

  return {
    state: "inconsistent",
    tier: "loud",
    detail: `${part} of ${whole} is ${computed.toFixed(Math.max(precision, 2))} percent, not ${stated}`,
  };
}

export function checkRange({ from, to }) {
  return from > to
    ? { state: "inconsistent", tier: "loud", detail: `the range runs from ${from} down to ${to}` }
    : consistent();
}
