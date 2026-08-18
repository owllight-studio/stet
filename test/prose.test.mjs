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

/* --- which voice governs which file --------------------------------------- */

import { mkdtempSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { voiceFor } from "../plugin/skills/stet/scripts/lib/prose.mjs";

function project(voice) {
  const root = mkdtempSync(join(tmpdir(), "stet-voice-"));
  mkdirSync(join(root, "site"));
  writeFileSync(join(root, "stet.config.json"), JSON.stringify({ voice }));
  return root;
}

test("one voice as a string still governs the whole project", () => {
  const root = project("VOICE.md");
  assert.equal(voiceFor(root, "site/index.html"), "VOICE.md");
  assert.equal(voiceFor(root, "README.md"), "VOICE.md");
});

test("a glob sends its own subtree to its own voice", () => {
  const root = project({ "site/**": "site/VOICE.md", "*": "VOICE.md" });
  assert.equal(voiceFor(root, "site/index.html"), "site/VOICE.md");
  assert.equal(voiceFor(root, "site/deep/nested/page.html"), "site/VOICE.md");
  assert.equal(voiceFor(root, "README.md"), "VOICE.md");
});

test("an absolute path resolves the same as a relative one", () => {
  const root = project({ "site/**": "site/VOICE.md", "*": "VOICE.md" });
  assert.equal(voiceFor(root, join(root, "site/index.html")), "site/VOICE.md");
});

test("the star entry is the fallback and never wins over a real glob", () => {
  const root = project({ "*": "VOICE.md", "site/**": "site/VOICE.md" });
  assert.equal(voiceFor(root, "site/index.html"), "site/VOICE.md");
});

test("no config and no map both fall back to the root voice", () => {
  const root = project({ "docs/**": "docs/VOICE.md" });
  assert.equal(voiceFor(root, "README.md"), "VOICE.md");
  assert.equal(voiceFor(root, "stdin"), "VOICE.md");
});

/* The scripts that read `voice` straight out of the config, rather than through targets(). Making
   `voice` accept a map broke context.mjs, which is the command every session is told to run first,
   and no unit test could see it because the failure was a crash in a script. So this runs them. */

import { execFileSync } from "node:child_process";
import { cpSync } from "node:fs";

test("a voice map does not crash the scripts that read the config directly", () => {
  const root = mkdtempSync(join(tmpdir(), "stet-ctx-"));
  mkdirSync(join(root, "site"));
  writeFileSync(join(root, "stet.config.json"), JSON.stringify({
    kind: "site",
    content: ["VOICE.md", "site/**"],
    voice: { "site/**": "site/VOICE.md", "*": "VOICE.md" },
  }));
  writeFileSync(join(root, "VOICE.md"), "# Root\n\n## The one rule\n\nSay it once.\n");
  writeFileSync(join(root, "site", "VOICE.md"), "# Site\n\n## The one rule\n\nSell it once.\n");
  writeFileSync(join(root, "site", "page.md"), "A short page. It has two sentences.\n");

  const script = join(import.meta.dirname, "..", "plugin", "skills", "stet", "scripts", "context.mjs");
  const out = execFileSync(process.execPath, [script], { cwd: root, encoding: "utf8" });

  assert.match(out, /WHAT IT SOUNDS LIKE/);
  assert.match(out, /site\/VOICE\.md/, "the scoped voice is reported");
  assert.match(out, /VOICE\.md/, "the fallback voice is reported");
});

/* A maximum cannot be too small. "longest: around 40" is a ceiling, and storing it as `about`
   made measure fail a page whose longest sentence was 29 words for not being long enough. The
   only way to pass was to staple a clause onto a finished sentence, so the check was ordering
   the padding it exists to catch. */

import { normalise, verdict, target } from "../plugin/skills/stet/scripts/lib/prose.mjs";

test("a ceiling written as 'around 40' never fails for being under", () => {
  const t = normalise("sentenceMax", target("around 40, spent rarely"));
  assert.equal(verdict(29, t).state, "ok");
  assert.equal(verdict(12, t).state, "ok");
  assert.equal(verdict(40, t).state, "ok");
});

test("a ceiling still fails when it is genuinely exceeded", () => {
  const t = normalise("sentenceMax", target("around 40, spent rarely"));
  assert.equal(verdict(63, t).state, "over");
  assert.equal(verdict(122, t).state, "over");
});

test("an explicit range on a ceiling metric is left alone", () => {
  const t = normalise("sentenceMax", target("30 to 40"));
  assert.equal(verdict(25, t).state, "under");
  assert.equal(verdict(35, t).state, "ok");
});

test("about-targets on ordinary metrics still fail both ways", () => {
  const t = normalise("sentenceMedian", target("about 9"));
  assert.equal(verdict(2, t).state, "under");
  assert.equal(verdict(30, t).state, "over");
  assert.equal(verdict(9, t).state, "ok");
});

/* The plain-English floor has to fire on the sentence that caused it and stay silent on the
   reference material that is allowed to say "orthogonal". */

test("the floor is a real check, not a note in a file", () => {
  const root = mkdtempSync(join(tmpdir(), "stet-floor-"));
  mkdirSync(join(root, "site"));
  writeFileSync(join(root, "stet.config.json"), JSON.stringify({
    content: ["site/**", "docs/**"], prose: ["site/**"],
  }));
  mkdirSync(join(root, "docs"));

  writeFileSync(join(root, "site", "page.md"),
    "Our solution delivers a comprehensive set of capabilities. It is idempotent at its core.\n");
  writeFileSync(join(root, "docs", "ref.md"),
    "The write is idempotent. Policy is orthogonal to state, and the primitive is release.\n");

  const script = join(import.meta.dirname, "..", "plugin", "skills", "stet", "scripts", "tells.mjs");
  let out = "";
  try {
    execFileSync(process.execPath, [script], { cwd: root, encoding: "utf8" });
  } catch (err) {
    out = err.stdout ?? "";
  }

  assert.match(out, /site\/page\.md/, "the landing page is judged");
  assert.match(out, /abstract-noun|unglossed-jargon|grand-abstraction/);
  assert.doesNotMatch(out, /docs\/ref\.md/, "reference material keeps its own register");
});
