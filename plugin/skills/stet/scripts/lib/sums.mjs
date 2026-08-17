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

/*
 * The word has to end there.
 *
 * A percentage point is definitionally not a percentage, so "it rose 12 percentage points while 3
 * of 4 teams shipped" was pairing a number of points with a fraction and calling the result wrong.
 * The phrase is standard in exactly the analytical prose this command is pointed at.
 */
const PERCENT = /(\d[\d,]*(?:\.\d+)?)\s*(?:%|percent|per cent)(?![A-Za-z])/g;

/*
 * There is no range family, and there was.
 *
 * `between X and Y` with its endpoints the wrong way round was read as a broken range until the end
 * of this branch's development, during which it found no real error anywhere in this corpus and
 * produced three false positives in five minutes: "the difference between 90 and 10", a descending
 * pair of years, and endpoints straddling a percentage. That is the same argument this file already
 * accepted when it refused `from X to Y`, which is ordinary English for a decrease rather than a
 * malformed range. A rule that fires on correct prose and has never fired on incorrect prose is not
 * worth its own maintenance. docs/sums.md records the decision, since the design specified it.
 */

/*
 * A block boundary between two figures, which is a refusal to pair them.
 *
 * `sentences` splits on sentence-ending punctuation, and a table row or a bullet usually carries
 * none, so a whole table arrives as one sentence and its rows pair across each other: a row reading
 * 3 of 4 beside a row reading 12 percent became a loud finding, and loud exits 1, so a table of
 * entirely correct metrics failed the build.
 *
 * A blank line, a heading, a list item or a table row. Deliberately not any newline, because prose
 * wraps. Measured over this repository's 7 fractions: refusing a pair whose two figures fall on
 * different lines declines 1 of them, refusing every pair inside a sentence that contains a line
 * break at all declines all 7, since these paragraphs are hard-wrapped, and this rule declines none.
 */
const BLOCK_BOUNDARY = /\n[^\S\n]*(?:\n|#|[-*+][^\S\n]|\d{1,9}[.)][^\S\n]|\|)/;

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

/* Colon-suffixed marker, that line only. Bare marker, tested separately below, the whole file. */
const MARKED_LINE = /<!--\s*stet-allow(:\s*[a-z-]+)?\s*-->/;

/**
 * Which lines the raw text itself marks, read off text nothing has touched yet.
 *
 * Reading the raw text, rather than something `withoutCode` has already been over, is what makes an
 * HTML marker visible at all: `withoutCode` blanks every comment, this one included, so a marker
 * looked for downstream of it would never be found. A fence's backticks or a `<script>` tag are
 * read here too, on the same unmodified text, which is what keeps this line-finding step from ever
 * being able to blank one away.
 */
const markedLines = (text) => {
  const marked = new Set();
  text.split("\n").forEach((line, i) => {
    if (MARKED_LINE.test(line)) marked.add(i);
  });
  return marked;
};

/* Blanks whole lines by index, on whatever text it is given. Applied to `withoutCode`'s own output
   below, never fed back into it, so a line this blanks can never be a delimiter `withoutCode` still
   needed to see. */
const blankLines = (text, marked) => text
  .split("\n")
  .map((line, i) => (marked.has(i) ? "" : line))
  .join("\n");

const blankQuoted = (text) => text.replace(/"[^"\n]{0,200}"/g, blank).replace(/“[^”\n]{0,200}”/g, blank);

/**
 * The blanking sequence, in its stages, written once.
 *
 * `readable` wants the end of it and `hidden` wants the differences between the stages, and they
 * were two copies of the same three lines in one file. Two copies of one sequence is how the next
 * change to `readable` becomes a silently wrong disclosure, which is a worse failure than either
 * copy having a bug, because the disclosure exists to be trusted without being checked.
 *
 * Which lines are marked is decided on the raw text, before `withoutCode` runs, which is what makes
 * a marker written as an HTML comment visible at all: `withoutCode` blanks every comment, this one
 * included, so deciding it from `withoutCode`'s own output would find nothing to mark. But the
 * blanking itself runs the other way round, against `withoutCode`'s output rather than the raw text,
 * so a marker sharing a line with a fence's backticks or a `<script>` tag blanks only what
 * `withoutCode` had already reduced that line to, and can never delete the delimiter itself. A
 * marker used to run its blanking on the raw text and feed the result back into `withoutCode`, so a
 * marked fence line lost its backticks before `withoutCode` ever saw them, the fence never closed,
 * and the block inside it read as prose: found by the marks stage where the code stage correctly
 * found nothing, which is a difference `hidden` cannot even state without going negative.
 */
const stages = (text, markup) => {
  const code = withoutCode(text, markup);
  const marks = blankLines(code, markedLines(text));
  return { code, marks, quotes: blankQuoted(marks) };
};

export function readable(text, markup = "md") {
  /* Bare marker, whole file. Colon-suffixed marker, that line only. Those are the two forms
     tells.mjs already defines, and the colon is what distinguishes them: the bare pattern does not
     match a suffixed marker, so a line exempting itself does not exempt everything around it.
     Getting that backwards silently exempted three correct relations elsewhere in one document.
     It is not directional either: the check runs against the raw text before anything is split
     into lines, so a bare marker exempts the whole file regardless of where in it the marker sits. */
  if (/<!--\s*stet-allow\s*-->/.test(text)) return "";
  return stages(text, markup).quotes;
}

function extractRelations(clean) {
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
    if (fracs.length !== 1 || pcts.length !== 1) continue;

    const f = fracs[0];
    const p = pcts[0];
    const [first, second] = f.index < p.index ? [f, p] : [p, f];
    if (second.index - (first.index + first[0].length) > GAP) continue;

    /* The span from the start of the first figure to the end of the second, so a boundary inside
       either figure counts as well as one between them. */
    if (BLOCK_BOUNDARY.test(s.text.slice(first.index, second.index + second[0].length))) continue;

    out.push({
      line: s.line,
      part: num(f[1]),
      whole: num(f[2]),
      stated: num(p[1]),
      precision: precisionOf(p[1]),
      saw: s.text.trim().slice(0, 90),
    });
  }
  return out;
}

export function relations(text, markup = "md") {
  /*
   * Code and quotation are blanked first, by `readable`, so a figure inside a fenced block or a
   * quoted example cannot be married to a figure in the prose around it. Without this the extractor
   * reads straight through code and pairs numbers that have nothing to do with each other: on this
   * repository it produced four findings and every one of them was wrong.
   */
  return extractRelations(readable(text, markup));
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

function extractStatistics(clean) {
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

export function statistics(text, markup = "md") {
  /* Code and quotation are blanked here for the same reason `readable` blanks them for the general
     family, and leaving it out was an oversight rather than a decision: run against this
     repository, the unblanked version read ten statistics out of fenced test fixtures and treated
     every one as a live claim. */
  return extractStatistics(readable(text, markup));
}

/**
 * How much arithmetic quoting and marking hid, not how much text they took out.
 *
 * A span or a line count fires on almost every file in a real corpus, since prose quotes things
 * constantly and hardly any of it is a number. A count that is always in the hundreds is exactly
 * the failure this project already has a name for: a check that fires dozens of times teaches a
 * reader to stop reading it. What is worth disclosing is not how much was hidden but whether any of
 * it was arithmetic, which is almost always zero and interesting precisely when it is not.
 *
 * Counted by re-running both families at each stage of the same pipeline `readable` uses and taking
 * the difference: what a marked line removed, then what quoting removed on top of that. Order
 * matters, since a relation on a marked line is not double-counted as one quoting also hid.
 */
export function hidden(text, markup = "md") {
  if (/<!--\s*stet-allow\s*-->/.test(text)) return { quoted: 0, marked: 0, wholeFile: true };

  const count = (clean) => extractRelations(clean).length + extractStatistics(clean).length;

  const { code, marks, quotes } = stages(text, markup);

  return {
    marked: count(code) - count(marks),
    quoted: count(marks) - count(quotes),
    wholeFile: false,
  };
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
  /*
   * A statistic that cannot exist gets said out loud, and never gets a number.
   *
   * A correlation of 1 makes the conversion to t divide by zero and anything above 1 makes it root
   * a negative, so a typo'd correlation printed "recomputes as NaN" out of the one file in this
   * project whose entire purpose is never to print a confident wrong number. The literature this
   * points at is full of typo'd correlations. Quiet rather than loud because this is not a
   * disagreement with the author's arithmetic, it is a figure there is no arithmetic to do on, and
   * a check that fails a build over a value it could not even attempt is a check people switch off.
   */
  const correlationTooLarge = s.test === "r" && Math.abs(s.value) >= 1;
  const computed = correlationTooLarge ? NaN : compute(s);
  if (!Number.isFinite(computed)) {
    return {
      state: "inconsistent",
      tier: "quiet",
      detail: correlationTooLarge
        ? `r = ${s.value} is not a correlation, since a correlation cannot reach 1, so no p follows from it`
        : `${s.test} = ${s.value} yields no p at all, so the statistic as written is impossible`,
    };
  }

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
