import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { relations, checkFraction, precisionOf, readable, hidden } from "../plugin/skills/stet/scripts/lib/sums.mjs";

const repo = fileURLToPath(new URL("..", import.meta.url));

test("a fraction and a percentage in the same sentence become one relation", () => {
  const [r] = relations("Content drift ran at 76.35 percent, 184,065 of 241,091 references.");
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
  const text = 'A wrong percentage looks like "8,273 of 16,695, or 12.9 percent" when somebody writes one.';
  assert.deepEqual(relations(readable(text)), []);
});

test("a line marked stet-allow is exempt, the way tells already allows", () => {
  const text = "An early version read 8,273 of 16,695 as 12.9 percent. <!-- stet-allow: illustration -->";
  assert.deepEqual(relations(readable(text)), []);
});

test("a marked line in HTML is exempt too, and the disclosure says what it hid", () => {
  /* The marker is an HTML comment, and `withoutCode` blanks every comment in HTML mode. Blanking
     code first therefore left nothing for the marker to be found in: the finding went out anyway
     and the disclosure reported nothing hidden, which is the worst of both. `site/index.html` is
     declared content in this repository, so this path is live rather than hypothetical. */
  const html = "<p>An early version read 8,273 of 16,695 as 12.9 percent.</p> <!-- stet-allow: illustration -->";
  assert.equal(relations(html, "html").length, 0);
  assert.deepEqual(hidden(html, "html"), { quoted: 0, marked: 1, wholeFile: false });
});

test("a bare stet-allow exempts the whole file, and a suffixed one exempts only its line", () => {
  const marked = "An early version read 8,273 of 16,695 as 12.9 percent. <!-- stet-allow: illustration -->\n\nSeparately, 1 of 2 is 50 percent.";
  assert.equal(relations(readable(marked)).length, 1);
  const whole = "<!-- stet-allow -->\n\nAn early version read 8,273 of 16,695 as 12.9 percent.\n\nSeparately, 1 of 2 is 50 percent.";
  assert.deepEqual(relations(readable(whole)), []);
});

test("hidden counts arithmetic quoting or marking concealed, not text removed", () => {
  const quoting = 'A wrong percentage looks like "8,273 of 16,695, or 12.9 percent" when somebody writes one.';
  assert.deepEqual(hidden(quoting), { quoted: 1, marked: 0, wholeFile: false });

  const marking = "An early version read 8,273 of 16,695 as 12.9 percent. <!-- stet-allow: illustration -->";
  assert.deepEqual(hidden(marking), { quoted: 0, marked: 1, wholeFile: false });

  const whole = "<!-- stet-allow -->\n\nAn early version read 8,273 of 16,695 as 12.9 percent.";
  assert.deepEqual(hidden(whole), { quoted: 0, marked: 0, wholeFile: true });
});

test("a marker on a fence line does not un-fence the block it sits on", () => {
  /* blankMarked used to run on the raw text before withoutCode and delete the whole line the marker
     sat on, backticks included, so the fence never toggled and the block inside it read as prose at
     the marks stage while the code stage still recognised it correctly. That let the marks stage
     find a relation the code stage did not, so marked went negative, an arithmetic impossibility. */
  const fence = '```js <!-- stet-allow: illustration -->\nA wrong percentage looks like "8,273 of 16,695, or 12.9 percent" here.\n```\n';
  assert.deepEqual(hidden(fence), { quoted: 0, marked: 0, wholeFile: false });
});

test("a marker on a script line's opening tag does not un-fence the block it sits on", () => {
  const script = '<script> <!-- stet-allow: illustration -->\nA wrong percentage looks like "8,273 of 16,695, or 12.9 percent" here.\n</script>\n';
  assert.deepEqual(hidden(script, "html"), { quoted: 0, marked: 0, wholeFile: false });
});

test("a marker on a fence line does not leak the block's arithmetic as a live finding", () => {
  /* The disclosure count going negative was the visible symptom, but the real fault sits one layer
     down: with the fence un-fenced, an unquoted relation inside the block was read as prose and
     handed to readable() and relations() exactly as this project's own claims are, which is a false
     finding waiting to happen rather than a miscount in a total. */
  const fence = "```js <!-- stet-allow: illustration -->\nAn early version read 8,273 of 16,695 as 12.9 percent.\n```\n";
  assert.deepEqual(relations(fence), []);
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

test("two rows of a table are two claims, not one sentence", () => {
  /* A row usually ends without sentence-ending punctuation, so the splitter hands the whole table
     over as one sentence and the rows pair across each other. This table is entirely correct and it
     was reported as 3 of 4 being 75 percent rather than 12, loudly, which exits 1 and fails CI. */
  const table = "| Converted | 3 of 4 |\n| Bounce rate | 12 percent |";
  assert.deepEqual(relations(table), []);
});

test("two bullets are two claims as well", () => {
  const list = "- Shipped 3 of 4 milestones\n- Churn ran at 12 percent";
  assert.deepEqual(relations(list), []);
});

test("a heading between two figures separates them", () => {
  const text = "Shipped 3 of 4 milestones\n## Churn\nChurn ran at 12 percent";
  assert.deepEqual(relations(text), []);
});

test("a blank line separates them, even where a marked line left one behind", () => {
  /* A marked line is blanked to nothing, so two bullets with a marked line between them arrive as
     one sentence with a blank line in it. That is a block boundary and not a pairing. */
  const marked = "- Shipped 3 of 4 milestones\n<!-- stet-allow: illustration -->\nChurn ran at 12 percent";
  assert.deepEqual(relations(readable(marked)), []);
});

test("a sentence that wraps onto the next line is still one sentence", () => {
  /* The boundary is a block, not a newline. Refusing every pair that crosses a line end reads well
     until it is measured: against this repository's 7 fractions it costs 1, and refusing every pair
     in a sentence containing a line break at all costs all 7, because prose here is hard-wrapped
     and a paragraph is not a table. The block rule costs none of them. */
  const wrapped = "Content drift ran at 76.35 percent,\n184,065 of 241,091 references.";
  assert.equal(relations(wrapped).length, 1);
});

test("a percentage point is not a percentage", () => {
  /* A percentage point is definitionally not a percentage, and the phrase is ordinary in exactly
     the analytical prose this command is pointed at. */
  assert.deepEqual(relations("It rose 12 percentage points while 3 of 4 teams shipped."), []);
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

test("a range is not read at all, in either direction", () => {
  /* The range family is gone. It never found a real error anywhere in this corpus and it produced
     three false positives in five minutes: a difference between two figures, a descending pair of
     years, and endpoints straddling a percentage. That is the argument this command already
     accepted when it refused `from X to Y`, applied to the sibling construction. */
  assert.deepEqual(relations("Sales fell steadily between 2013 and 1985 in the archive series."), []);
  assert.deepEqual(relations("The difference between 90 and 10 is what the chart is showing."), []);
  assert.deepEqual(relations("Conversion sat between 90 and 10 percent depending on the cohort."), []);
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

test("a correlation of one or more is impossible, and never recomputes as NaN", () => {
  /* Converting r to t divides by 1 - r squared, so a correlation at 1 divides by zero and one above
     it roots a negative. What came out was "recomputes as NaN", printed by the one file whose whole
     purpose is never to print a confident wrong number, and a typo'd correlation is exactly what the
     literature this points at contains. */
  for (const value of [1, -1, 1.02]) {
    const v = checkStat({ test: "r", df1: 28, value, comparator: "=", reported: 0.05, precision: 2 }, 0.05);
    assert.notEqual(v.state, "consistent", `r = ${value}`);
    assert.doesNotMatch(v.detail, /NaN/, `r = ${value}`);
    assert.match(v.detail, /cannot reach 1/, `r = ${value}`);
  }
});

test("a correlation just under one still recomputes to a number", () => {
  const v = checkStat({ test: "r", df1: 28, value: 0.99, comparator: "<", reported: 0.05, precision: 2 }, 0.05);
  assert.equal(v.state, "consistent");
});

test("a declared alpha changes which side of the line a p falls on", () => {
  /* p recomputes near .03: significant at .05, not at .01. The tier must follow the stated alpha
     rather than an assumed one, or the tool invents an error in a paper that was stricter. */
  const stat = { test: "t", df1: 28, value: 2.3, comparator: "=", reported: 0.6, precision: 2 };
  assert.equal(checkStat(stat, 0.05).tier, "loud");
  assert.equal(checkStat(stat, 0.01).tier, "quiet");
});

test("a file that could not be read is reported before anything else, and not counted", () => {
  /* The whole run, because this is the command's ordering rather than the library's. A file named
     and not opened is the most important thing in the report, and printing it after the findings
     hid it entirely whenever any other file yielded a relation. "Across 2 files" was also a claim
     about a file this never opened. */
  const out = execFileSync(
    process.execPath,
    ["plugin/skills/stet/scripts/sums.mjs", "nosuchfile.md", "docs/sums.md"],
    { cwd: repo, encoding: "utf8" },
  );
  assert.match(out, /COULD NOT READ  1/);
  assert.ok(out.indexOf("COULD NOT READ") < out.search(/relations across/), "the unread report comes first");
  assert.match(out, /across 1 file\./);
});
