import { test } from "node:test";
import assert from "node:assert/strict";
import { relations, checkFraction, checkRange, precisionOf } from "../plugin/skills/stet/scripts/lib/sums.mjs";

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

test("a sentence carrying two percentages is ambiguous, so nothing is paired", () => {
  /* This is the failure that produced the rule. Pairing the first fraction with the first
     percentage reported that 8,273 of 16,695 was 12.9 percent, having taken the two figures from
     different clauses of one sentence. Ambiguity is not a finding. */
  const text = "It was 49.6 percent, 8,273 of 16,695, and 12.9 percent carried a gross one.";
  assert.deepEqual(relations(text), []);
});

test("a percentage far from the fraction in a long sentence is not paired with it", () => {
  const text = "Rot ran above 70 percent across the journals sampled, and separately we read 184,065 of 241,091 references.";
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
