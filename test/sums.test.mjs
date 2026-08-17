import { test } from "node:test";
import assert from "node:assert/strict";
import { relations, checkFraction, checkRange, precisionOf, readable, hidden } from "../plugin/skills/stet/scripts/lib/sums.mjs";

test("a fraction and a percentage in the same sentence become one relation", () => {
  const [r] = relations("Content drift ran at 76.35 percent, 184,065 of 241,091 references.");
  assert.equal(r.kind, "fraction");
  assert.equal(r.part, 184065);
  assert.equal(r.whole, 241091);
  assert.equal(r.stated, 76.35);
  assert.equal(r.line, 1);
});

test("a figure inside a fenced code block is not prose and is not checked", () => {
  const fence = "`".repeat(3);
  const text = `${fence}\nWe read 1 of 2 at 99 percent.\n${fence}\n`;
  assert.deepEqual(relations(text), []);
});

test("a construction shown inside quotation marks is named, not committed", () => {
  const text = 'A backwards range looks like "between 0.61 and 0.34" when somebody writes one.';
  assert.deepEqual(relations(readable(text)), []);
});

test("a line marked stet-allow is exempt, the way tells already allows", () => {
  const text = "An early version read 8,273 of 16,695 as 12.9 percent. <!-- stet-allow: illustration -->";
  assert.deepEqual(relations(readable(text)), []);
});

test("a bare stet-allow exempts the whole file, and a suffixed one exempts only its line", () => {
  const marked = "An early version read 8,273 of 16,695 as 12.9 percent. <!-- stet-allow: illustration -->\n\nSeparately, 1 of 2 is 50 percent.";
  assert.equal(relations(readable(marked)).length, 1);
  const whole = "<!-- stet-allow -->\n\nAn early version read 8,273 of 16,695 as 12.9 percent.\n\nSeparately, 1 of 2 is 50 percent.";
  assert.deepEqual(relations(readable(whole)), []);
});

test("hidden counts arithmetic quoting or marking concealed, not text removed", () => {
  const quoting = 'A backwards range looks like "between 0.61 and 0.34" when somebody writes one.';
  assert.deepEqual(hidden(quoting), { quoted: 1, marked: 0, wholeFile: false });

  const marking = "An early version read 8,273 of 16,695 as 12.9 percent. <!-- stet-allow: illustration -->";
  assert.deepEqual(hidden(marking), { quoted: 0, marked: 1, wholeFile: false });

  const whole = "<!-- stet-allow -->\n\nAn early version read 8,273 of 16,695 as 12.9 percent.";
  assert.deepEqual(hidden(whole), { quoted: 0, marked: 0, wholeFile: true });
});

test("a quotation with no arithmetic in it hides nothing, and is not counted", () => {
  const text = 'Somebody once called this feature "the cheapest check in the set" in a meeting.';
  assert.deepEqual(hidden(text), { quoted: 0, marked: 0, wholeFile: false });
});

test("a sentence carrying two percentages is ambiguous, so nothing is paired", () => {
  /* This is the failure that produced the rule. Pairing the first fraction with the first
     percentage reported that 8,273 of 16,695 was 12.9 percent, having taken the two figures from
     different clauses of one sentence. Ambiguity is not a finding. */
  const text = "It was 49.6 percent, 8,273 of 16,695, and 12.9 percent carried a gross one.";
  assert.deepEqual(relations(text), []);
});

test("a percentage far from the fraction in a long sentence is not paired with it", () => {
  /* Far means far. The widest real gap measured in this repository is 43 characters, between a
     percentage and the fraction it describes, so the threshold sits at 80 and this sentence puts
     well over that between the two figures. */
  const text =
    "Rot ran above 70 percent across every one of the journals that were sampled for the study, " +
    "and quite separately from that we also read 184,065 of 241,091 references.";
  assert.deepEqual(relations(text), []);
});

test("a decrease written from one figure to another is not a range", () => {
  /* reference/tighten.md says a tighten took the variance from 0.61 to 0.34. That is a decrease
     described in ordinary English, and an earlier draft of this reported it as a broken range. */
  assert.deepEqual(relations("It took the variance from 0.61 to 0.34."), []);
});

test("a fraction with no percentage beside it is not a relation", () => {
  assert.deepEqual(relations("We read 184,065 of 241,091 references."), []);
});

test("a percentage in a different sentence does not pair with the fraction", () => {
  assert.deepEqual(relations("We read 184,065 of 241,091. Elsewhere, 12 percent failed."), []);
});

test("the precision is read off what the author wrote", () => {
  assert.equal(precisionOf("76.35"), 2);
  assert.equal(precisionOf("76.3"), 1);
  assert.equal(precisionOf("76"), 0);
});

test("a percentage correct at its own precision is consistent", () => {
  for (const [stated, precision] of [[76.35, 2], [76.3, 1], [76, 0]]) {
    const v = checkFraction({ part: 184065, whole: 241091, stated, precision });
    assert.equal(v.state, "consistent", `${stated} at ${precision}`);
  }
});

test("a percentage wrong beyond its own rounding is loud", () => {
  const v = checkFraction({ part: 184065, whole: 241091, stated: 77, precision: 0 });
  assert.equal(v.state, "inconsistent");
  assert.equal(v.tier, "loud");
  assert.match(v.detail, /76/);
});

test("a percentage out by one in the last place is quiet, not loud", () => {
  /* 76.3467 rounds to 76.35, and an author who wrote 76.34 truncated rather than rounded. That is
     a convention, not an error, and reporting it as loud is how a checker gets switched off. */
  const v = checkFraction({ part: 184065, whole: 241091, stated: 76.34, precision: 2 });
  assert.equal(v.tier, "quiet");
});

test("a figure on an exact rounding boundary is quiet, and names the convention", () => {
  /* 1 of 8 is 12.5 percent exactly. Half away from zero gives 13 and half to even gives 12, and
     neither is wrong, so a document written under the second convention must not be accused. */
  const v = checkFraction({ part: 1, whole: 8, stated: 12, precision: 0 });
  assert.equal(v.tier, "quiet");
  assert.match(v.assumption, /half to even/);
});

test("a range with its endpoints the wrong way round is loud", () => {
  const v = checkRange({ from: 90, to: 10 });
  assert.equal(v.state, "inconsistent");
  assert.equal(v.tier, "loud");
});

test("a range in the right order says nothing", () => {
  assert.equal(checkRange({ from: 10, to: 90 }).state, "consistent");
});

test("a whole of zero is not a division, it is a sentence to leave alone", () => {
  const v = checkFraction({ part: 3, whole: 0, stated: 50, precision: 0 });
  assert.equal(v.state, "only-if");
  assert.match(v.detail, /zero/);
});

test("the line number points at the sentence, not at the file's first line", () => {
  const [r] = relations("One.\n\nTwo.\n\nAt 50 percent, 1 of 2 passed.");
  assert.equal(r.line, 5);
});

import { statistics, checkStat, alphaIn } from "../plugin/skills/stet/scripts/lib/sums.mjs";

test("a t test with its degrees of freedom and p is extracted whole", () => {
  const [s] = statistics("The effect held, t(28) = 2.048, p = .05.");
  assert.equal(s.test, "t");
  assert.equal(s.df1, 28);
  assert.equal(s.value, 2.048);
  assert.equal(s.comparator, "=");
  assert.equal(s.reported, 0.05);
});

test("an F test carries both degrees of freedom", () => {
  const [s] = statistics("F(2, 10) = 4.103, p = .05");
  assert.equal(s.test, "F");
  assert.equal(s.df1, 2);
  assert.equal(s.df2, 10);
});

test("chi-squared is recognised written as a word and as a symbol", () => {
  assert.equal(statistics("chi2(1) = 3.841, p = .05")[0].test, "chi");
  assert.equal(statistics("χ²(1) = 3.841, p = .05")[0].test, "chi");
});

test("a correlation and a z are extracted", () => {
  assert.equal(statistics("r(28) = .36, p = .05")[0].test, "r");
  assert.equal(statistics("z = 1.96, p = .05")[0].test, "z");
});

test("two tests reported in one sentence are both checked, each against its own p", () => {
  /* The normal shape of a results sentence in a paper. The first draft returned one statistic here
     and married it to the other clause's p, which is a pairing that appears nowhere in the text. */
  const found = statistics("The correlation held, r(15) = .36, p = .05, and the difference held, t(28) = 5.0, p = .0001.");
  assert.equal(found.length, 2);
  const t28 = found.find((s) => s.test === "t");
  assert.equal(t28.value, 5);
  assert.equal(t28.reported, 0.0001);
  const r15 = found.find((s) => s.test === "r");
  assert.equal(r15.reported, 0.05);
});

test("a second statistic in the same sentence is not silently dropped", () => {
  /* The one that matters: the second F here is the one whose p is wrong, so dropping it means
     missing exactly the error this check exists to find. */
  const found = statistics("An effect of condition, F(2, 44) = 5.67, p = .006, and of time, F(1, 22) = 3.98, p = .99.");
  assert.equal(found.length, 2);
  assert.equal(found[1].df2, 22);
  assert.equal(found[1].reported, 0.99);
});

test("a statistic is skipped when the p in its sentence belongs to something else", () => {
  const found = statistics("The statistic was t(28) = 2.048 in that condition, and the model as a whole gave p = .04.");
  assert.deepEqual(found, []);
});

test("a statistic with no p reported is not a relation to check", () => {
  assert.deepEqual(statistics("The statistic was t(28) = 2.048 in that condition."), []);
});

test("a statistic inside a fenced code block is a fixture, not a claim", () => {
  const fence = "`".repeat(3);
  const text = `${fence}js\nassert.equal(check({ test: "t", df1: 28, value: 2.048 }), 0.05); // p = .99\n${fence}\n`;
  assert.deepEqual(statistics(text), []);
});

test("a p that matches its own test statistic is consistent", () => {
  const v = checkStat({ test: "t", df1: 28, value: 2.048, comparator: "=", reported: 0.05, precision: 2 }, 0.05);
  assert.equal(v.state, "consistent");
});

test("a p that disagrees and crosses the threshold is loud", () => {
  /* t(28) = 1.0 is nowhere near significant, so reporting p = .01 is not a rounding matter: the
     sentence claims significance the statistic does not support. */
  const v = checkStat({ test: "t", df1: 28, value: 1.0, comparator: "=", reported: 0.01, precision: 2 }, 0.05);
  assert.equal(v.state, "inconsistent");
  assert.equal(v.tier, "loud");
});

test("a p that disagrees without crossing the threshold is quiet", () => {
  const v = checkStat({ test: "t", df1: 28, value: 1.0, comparator: "=", reported: 0.4, precision: 2 }, 0.05);
  assert.equal(v.state, "inconsistent");
  assert.equal(v.tier, "quiet");
});

test("a disagreement a one-tailed test would explain says so, and does not accuse", () => {
  /* Halving the two-tailed p is exactly what a one-tailed test reports. */
  const v = checkStat({ test: "t", df1: 28, value: 2.048, comparator: "=", reported: 0.025, precision: 3 }, 0.05);
  assert.equal(v.state, "only-if");
  assert.match(v.assumption, /one-tailed/);
});

test("a p reported as less than a bound is consistent when it really is", () => {
  const v = checkStat({ test: "t", df1: 28, value: 5, comparator: "<", reported: 0.05, precision: 2 }, 0.05);
  assert.equal(v.state, "consistent");
});

test("a p reported as less than a bound it does not meet is loud", () => {
  const v = checkStat({ test: "t", df1: 28, value: 0.5, comparator: "<", reported: 0.05, precision: 2 }, 0.05);
  assert.equal(v.tier, "loud");
});

test("the alpha the text declares is the one used", () => {
  assert.equal(alphaIn("All tests used an alpha of .01 throughout."), 0.01);
  assert.equal(alphaIn("No alpha is stated here."), 0.05);
});

test("a declared alpha changes which side of the line a p falls on", () => {
  /* p recomputes near .03: significant at .05, not at .01. The tier must follow the stated alpha
     rather than an assumed one, or the tool invents an error in a paper that was stricter. */
  const stat = { test: "t", df1: 28, value: 2.3, comparator: "=", reported: 0.6, precision: 2 };
  assert.equal(checkStat(stat, 0.05).tier, "loud");
  assert.equal(checkStat(stat, 0.01).tier, "quiet");
});
