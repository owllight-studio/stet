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
import { tP, fP, chiP, zP } from "./dist.mjs";

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

/**
 * What is left when you take out everything that is not somebody's own claim.
 *
 * Code, because a figure in a fixture is not an assertion. Quoted text, because naming a
 * construction is not committing it: this project's tells checker was fooled by exactly that three
 * times before it started skipping quotations, and the reference document for this command was
 * caught by this command for quoting the very examples it exists to explain. And anything a line
 * marks with stet-allow, which is the escape hatch tells.mjs already defines and documents.
 *
 * Everything is replaced with spaces of the same length rather than removed, so line numbers stay
 * true. A finding that points at the wrong line is worse than no line number at all.
 */
const blank = (m) => " ".repeat(m.length);

/*
 * The one place that actually does the blanking. `readable` and `exemptions` both call this and
 * keep it private, rather than each doing its own pass: two passes over the same rules is how the
 * whole-file check and the per-line check drifted apart once already.
 *
 * Exempting a claim is not free. It is also how a real finding disappears, quoted into an example
 * or waved past with a marker, so what was taken out is counted here and reported by the command,
 * on the same principle as the file it could not read: silence reads as "there was nothing here".
 */
function strip(text, markup) {
  /* Bare marker, whole file. Colon-suffixed marker, that line only. Those are the two forms
     tells.mjs already defines, and the colon is what distinguishes them: the bare pattern does not
     match a suffixed marker, so a line exempting itself does not exempt everything around it.
     Getting that backwards silently exempted three correct relations elsewhere in one document.
     It is not directional either: the check runs against the raw text before anything is split
     into lines, so a bare marker exempts the whole file regardless of where in it the marker sits. */
  if (/<!--\s*stet-allow\s*-->/.test(text)) return { text: "", quoted: 0, marked: 0, wholeFile: true };

  let marked = 0;
  const lines = withoutCode(text, markup)
    .split("\n")
    .map((line) => {
      if (!/<!--\s*stet-allow(:\s*[a-z-]+)?\s*-->/.test(line)) return line;
      marked++;
      return "";
    })
    .join("\n");

  let quoted = 0;
  const blankQuoted = (m) => {
    quoted++;
    return blank(m);
  };
  const out = lines.replace(/"[^"\n]{0,200}"/g, blankQuoted).replace(/“[^”\n]{0,200}”/g, blankQuoted);
  return { text: out, quoted, marked, wholeFile: false };
}

export function readable(text, markup = "md") {
  return strip(text, markup).text;
}

/** What `readable` took out, for the command to disclose rather than bury. */
export function exemptions(text, markup = "md") {
  const { quoted, marked, wholeFile } = strip(text, markup);
  return { quoted, marked, wholeFile };
}

export function relations(text, markup = "md") {
  /*
   * Code and quotation are blanked first, by `readable`, so a figure inside a fenced block or a
   * quoted example cannot be married to a figure in the prose around it. Without this the extractor
   * reads straight through code and pairs numbers that have nothing to do with each other: on this
   * repository it produced four findings and every one of them was wrong.
   */
  const clean = readable(text, markup);
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

/*
 * A p belongs to the statistic it follows, and nothing else.
 *
 * The first draft searched the sentence for one statistic and one p separately and paired whatever
 * it found. On a results sentence reporting two tests, which is the normal case in a paper, that
 * did two wrong things at once: it dropped the second statistic silently, and it could marry a p
 * from one clause to a statistic from another, reporting a pairing that appears nowhere in the
 * text. Both were reproduced against real sentence shapes before this was rewritten.
 *
 * So each statistic is matched, and then the text immediately after it must begin with its own p,
 * with nothing but separators in between. A statistic with no p after it is not checkable and is
 * skipped, which is the same rule the general family follows: what cannot be located is not
 * touched.
 */
const FOLLOWING_P = /^[\s,;:)\]]*p\s*(=|<|>)\s*(\d*\.\d+|\d+)/i;

const TESTS = [
  { test: "t", re: /\bt\s*\(\s*(\d+(?:\.\d+)?)\s*\)\s*=\s*(-?\d*\.?\d+)/g },
  { test: "F", re: /\bF\s*\(\s*(\d+)\s*,\s*(\d+(?:\.\d+)?)\s*\)\s*=\s*(-?\d*\.?\d+)/g },
  { test: "r", re: /\br\s*\(\s*(\d+)\s*\)\s*=\s*(-?\d*\.?\d+)/g },
  { test: "chi", re: /(?:chi2|chi-squared|χ²|χ\s*2)\s*\(\s*(\d+)\s*(?:,[^)]*)?\)\s*=\s*(-?\d*\.?\d+)/gi },
  { test: "z", re: /\bz\s*=\s*(-?\d*\.?\d+)/g },
];

export function statistics(text, markup = "md") {
  /* Code and quotation are blanked here for the same reason `readable` blanks them for the general
     family, and leaving it out was an oversight rather than a decision: run against this
     repository, the unblanked version read ten statistics out of fenced test fixtures and treated
     every one as a live claim. */
  const clean = readable(text, markup);
  const out = [];
  for (const s of sentences(clean)) {
    for (const { test, re } of TESTS) {
      /* matchAll clones the regex it is given and never touches the caller's lastIndex, so this
         reset changes nothing here. It stays as a guard against these regexes later being driven
         through exec or test in a loop instead, which does carry lastIndex between calls: that
         exact bug shipped in style.mjs, where a /g/ regex reused across .test() calls on
         successive lines quietly skipped matches until it was given a fresh regex per line. */
      re.lastIndex = 0;
      for (const m of s.text.matchAll(re)) {
        const p = s.text.slice(m.index + m[0].length).match(FOLLOWING_P);
        if (!p) continue;
        const g = m.slice(1).map(Number);
        out.push({
          test,
          df1: test === "z" ? null : g[0],
          df2: test === "F" ? g[1] : null,
          value: test === "F" ? g[2] : test === "z" ? g[0] : g[1],
          comparator: p[1],
          reported: Number(p[2]),
          precision: precisionOf(p[2]),
          line: s.line,
          saw: s.text.trim().slice(0, 90),
        });
      }
    }
  }
  return out;
}

/** The alpha the text declares, or the convention. Assuming 0.05 against a stricter paper invents errors. */
export function alphaIn(text) {
  const m = text.match(/alpha\s+(?:of|=|was)\s*(\d*\.\d+)/i);
  return m ? Number(m[1]) : 0.05;
}

const compute = (s) => {
  if (s.test === "t") return tP(Math.abs(s.value), s.df1);
  if (s.test === "F") return fP(s.value, s.df1, s.df2);
  if (s.test === "chi") return chiP(s.value, s.df1);
  if (s.test === "z") return zP(Math.abs(s.value));
  /* A correlation is a t in disguise, so it goes through the same path rather than getting its own. */
  const t = Math.abs(s.value) * Math.sqrt(s.df1 / (1 - s.value * s.value));
  return tP(t, s.df1);
};

const agrees = (computed, s) => {
  if (s.comparator === "<") return computed < s.reported;
  if (s.comparator === ">") return computed > s.reported;
  return Number(computed.toFixed(s.precision)) === s.reported;
};

export function checkStat(s, alpha = 0.05) {
  const computed = compute(s);
  if (agrees(computed, s)) return consistent();

  /* One assumption, from a closed list. An open-ended search for a reading that rescues the number
     is a machine talking itself out of a finding, so only the halving a one-tailed test would
     produce is offered, and only for the tests where one-tailed is meaningful. */
  if (["t", "z", "r"].includes(s.test) && agrees(computed / 2, s)) {
    return {
      state: "only-if",
      tier: "quiet",
      detail: `p recomputes as ${computed.toFixed(4)} two-tailed, and ${(computed / 2).toFixed(4)} one-tailed`,
      assumption: "the test was one-tailed",
    };
  }

  /* Loud only when the sentence's claim changes. The difference between an inconsistency and one
     that crosses the threshold ran four to one in the study this check comes from, so reporting
     them identically would bury the ones that matter. */
  const claimed = s.comparator === "<" ? s.reported <= alpha : s.reported < alpha;
  const actual = computed < alpha;
  return {
    state: "inconsistent",
    tier: claimed === actual ? "quiet" : "loud",
    detail: `reported ${s.comparator} ${s.reported}, recomputes as ${computed.toFixed(4)}`,
  };
}
