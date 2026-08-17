import { test } from "node:test";
import assert from "node:assert/strict";
import { measure, SOFTENERS, HEDGES, MODALS, INTENSIFIERS } from "../plugin/skills/stet/scripts/lib/prose.mjs";

/*
 * The four word lists, and the reason they are four.
 *
 * One list called HEDGES used to do all of this, and it counted intensifiers as hedges. Measuring
 * Darwin's field notebooks found 52 percent of their "hedges" were the word "very", and an 1898
 * auction catalogue scored as heavily hedged on nothing but "very". Both readings set a target in a
 * voice preset before anybody checked.
 */

const hits = (re, text) => (text.match(re) ?? []).length;

test("very is an intensifier and never counts as a hedge", () => {
  const text = "The stone is very fine. It is really quite rare.";
  assert.equal(hits(HEDGES, text), 0, "no doubt is expressed here");
  assert.ok(hits(INTENSIFIERS, text) >= 2, "very and really are intensifiers");
});

test("a modal is qualification and is counted as one", () => {
  const text = "Some filesystems may not implement the flag. You must restart it.";
  assert.equal(hits(MODALS, text), 2);
});

test("the old list is unchanged, so every figure ever measured with it stays true", () => {
  /* SOFTENERS is the historical HEDGES list under an honest name. If this test fails, a figure in
     ten voice presets silently stopped meaning what it says. */
  const text = "Perhaps it is somewhat fairly quite rather arguably generally typically usually often";
  assert.equal(hits(SOFTENERS, text), 10);
});

test("doubt about what is true is a hedge, and nothing else is", () => {
  const text = "It probably works. It seems fine. This may be wrong. The result is undefined.";
  assert.equal(hits(HEDGES, text), 3, "probably, seems, may be");
});

test("measure reports all four separately", () => {
  const text = "This may perhaps be very wrong. The system can fail. You must restart it.";
  const m = measure(text, "md");
  for (const key of [
    "softenersPerSentence",
    "hedgesPerSentence",
    "modalsPerSentence",
    "intensifiersPerSentence",
  ]) {
    assert.ok(typeof m[key] === "number", `${key} is reported`);
  }
});

test("a register qualified by modals no longer reads as unqualified", () => {
  /* The failure that produced this change: real documentation runs 130 modals per 10,000 words and
     the old list scored it as almost unhedged, because not one modal was in it. */
  const doc = "The call may fail. The buffer must be large enough. Callers should check the result.";
  const m = measure(doc, "md");
  assert.equal(m.softenersPerSentence, 0, "the old list sees nothing here");
  assert.ok(m.modalsPerSentence > 0.9, "and the register is qualified in every sentence");
});
