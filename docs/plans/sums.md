---
stet:
  state: draft
  author: agent
---

# Sums implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `stet sums`, a check that recomputes the arithmetic a document does on itself, in two families and three outcomes, with no network, no config and no model.

**Architecture:** Four layers, each testable alone. `lib/dist.mjs` holds the distribution functions and knows nothing about Stet. `lib/sums.mjs` holds the extraction of both families and the verdict for each relation, and is pure. `sums.mjs` is the command. The reference document and the two table rows are part of the same change.

**Tech Stack:** Node 20 or newer, zero dependencies, ES modules. Tests use `node:test` and `node:assert/strict`. No network anywhere in this feature, at build time or at run time.

**Spec:** `docs/sums.md`

## Global Constraints

- **No em dashes anywhere**, including code comments and commit messages.
- **Zero dependencies.** Node built-ins only. This feature makes no network request at all.
- **British spelling in prose**, `-ise` and `-our`, no serial comma, `percent` written as a word, figures in numerals.
- **Every figure carries its source.** The verified statcheck figures are: 49.6 percent of articles reporting NHST results carried at least one inconsistency, 8,273 of 16,695; 12.9 percent, 2,150 articles, carried one large enough to change the conclusion; 9.7 percent of 258,105 individual p-values were inconsistent and 1.4 percent grossly so; across 30,717 articles from 1985 to 2013. Nuijten, Hartgerink, van Assen, Epskamp and Wicherts, *Behavior Research Methods* 48(4): 1205-1226, `10.3758/s13428-015-0664-2`. **Never write "half of published psychology papers".** It is half of the papers reporting a null-hypothesis test, and the spec explains why that distinction is load-bearing here.
- **Tests live in `test/`**, never under `plugin/skills/stet/scripts/`, which ships to npm wholesale.
- **Report what you did not do.** Every section of output that skipped something says what it skipped.
- House test style: one behaviour per test, named for the behaviour in plain words. House comment style: say why, and name the failure that produced the rule.

## File Structure

| File | Responsibility |
|---|---|
| `plugin/skills/stet/scripts/lib/dist.mjs` | The distributions. No Stet vocabulary, no text handling, no opinions. Pure numerics. |
| `plugin/skills/stet/scripts/lib/sums.mjs` | Extraction of both families from text, and the verdict for each relation. Pure. |
| `plugin/skills/stet/scripts/sums.mjs` | The command: find content, report in two tiers, exit code. |
| `plugin/skills/stet/reference/sums.md` | The reference document. |
| `test/dist.test.mjs` | The distributions against externally published values. |
| `test/sums.test.mjs` | Extraction, rounding, verdicts, tiers. |

---

### Task 1: The distributions, pinned to somebody else's numbers

Built first because everything else is worthless if this is wrong, and because a subtle error here produces confident false accusations rather than visible failures.

**Files:**
- Create: `plugin/skills/stet/scripts/lib/dist.mjs`
- Create: `test/dist.test.mjs`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `logGamma(z) -> number`
  - `betaInc(x, a, b) -> number`, the regularised incomplete beta `I_x(a, b)`
  - `gammaQ(a, x) -> number`, the regularised upper incomplete gamma `Q(a, x)`
  - `tP(t, df) -> number`, two-tailed
  - `fP(f, df1, df2) -> number`, upper tail
  - `chiP(x, df) -> number`, upper tail
  - `zP(z) -> number`, two-tailed

**The reference values, and where they come from.** All from the NIST/SEMATECH e-Handbook of Statistical Methods, which publishes them as printed tables. They were read off the handbook for this plan, not recalled:

- Student t, upper-tail 0.025, so two-tailed 0.05: df 1 gives 12.706, df 10 gives 2.228, df 28 gives 2.048, df 100 gives 1.984.
- Chi-squared, upper-tail 0.05: df 1 gives 3.841, df 2 gives 5.991, df 10 gives 18.307, df 30 gives 43.773.
- F, upper-tail 0.05: (1, 10) gives 4.965, (2, 10) gives 4.103, (3, 20) gives 3.098, (1, 100) gives 3.936.

**The tolerance, and why it is what it is.** Those critical values are printed to three decimal places, so feeding one back in cannot return exactly 0.05. The test asserts the recomputed p is within 0.001 of 0.05. That is loose enough to survive the table's own rounding and tight enough that a wrong distribution fails it: a continued fraction that has not converged, or a beta with its arguments transposed, is wrong in the second decimal place, not the fourth.

**The code below was run against all twelve values before this plan was written**, so the tolerance is a measurement rather than a guess. The observed deviations were at most 4.3e-5, at `t(28) = 2.048` which returned 0.050043, giving the 0.001 tolerance about twenty times the headroom it needs. Every identity in the tests passed to within 1e-12. If your run does not reproduce that, something has been transcribed wrongly and the answer is to find it rather than to widen the tolerance.

- [ ] **Step 1: Write the failing tests**

Create `test/dist.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { tP, fP, chiP, zP, betaInc, gammaQ, logGamma } from "../plugin/skills/stet/scripts/lib/dist.mjs";

/*
 * Every critical value below is read off the NIST/SEMATECH e-Handbook of Statistical Methods,
 * which is somebody else's published table. Feeding a critical value back into the distribution
 * must return the significance level it was tabulated at. The tables print three decimal places,
 * so the tolerance is 0.001: tight enough to fail a wrong implementation, loose enough to survive
 * the table's own rounding.
 */
const near = (got, want, tol, what) =>
  assert.ok(Math.abs(got - want) < tol, `${what}: got ${got}, wanted ${want} within ${tol}`);

test("the t critical values for two-tailed 0.05 return 0.05", () => {
  near(tP(12.706, 1), 0.05, 0.001, "t(1)");
  near(tP(2.228, 10), 0.05, 0.001, "t(10)");
  near(tP(2.048, 28), 0.05, 0.001, "t(28)");
  near(tP(1.984, 100), 0.05, 0.001, "t(100)");
});

test("the chi-squared critical values for upper-tail 0.05 return 0.05", () => {
  near(chiP(3.841, 1), 0.05, 0.001, "chi(1)");
  near(chiP(5.991, 2), 0.05, 0.001, "chi(2)");
  near(chiP(18.307, 10), 0.05, 0.001, "chi(10)");
  near(chiP(43.773, 30), 0.05, 0.001, "chi(30)");
});

test("the F critical values for upper-tail 0.05 return 0.05", () => {
  near(fP(4.965, 1, 10), 0.05, 0.001, "F(1,10)");
  near(fP(4.103, 2, 10), 0.05, 0.001, "F(2,10)");
  near(fP(3.098, 3, 20), 0.05, 0.001, "F(3,20)");
  near(fP(3.936, 1, 100), 0.05, 0.001, "F(1,100)");
});

test("a squared z is a chi-squared on one degree of freedom", () => {
  /* An identity rather than a table: the two must agree or one of them is wrong. */
  for (const z of [0.5, 1, 1.96, 2.5, 3]) near(zP(z), chiP(z * z, 1), 1e-12, `z=${z}`);
});

test("an F on one numerator degree of freedom is a squared t", () => {
  for (const t of [0.5, 1, 2.048, 3]) near(fP(t * t, 1, 28), tP(t, 28), 1e-12, `t=${t}`);
});

test("the tails behave at the extremes", () => {
  near(tP(0, 10), 1, 1e-12, "t at zero is certain");
  near(chiP(0, 4), 1, 1e-12, "chi at zero is certain");
  assert.ok(tP(50, 5) < 1e-6, "a huge t is a tiny p");
  assert.ok(chiP(200, 3) < 1e-12, "a huge chi-squared is a tiny p");
});

test("the regularised beta is bounded and symmetric", () => {
  near(betaInc(0, 2, 3), 0, 1e-15, "at zero");
  near(betaInc(1, 2, 3), 1, 1e-15, "at one");
  /* I_x(a,b) = 1 - I_(1-x)(b,a). If the continued fraction's symmetry branch is wrong, this fails
     and the tables above may still pass, because they only exercise one side of it. */
  for (const x of [0.1, 0.3, 0.5, 0.7, 0.9]) near(betaInc(x, 2, 5), 1 - betaInc(1 - x, 5, 2), 1e-12, `x=${x}`);
});

test("the regularised upper gamma runs from one to zero", () => {
  near(gammaQ(1, 0), 1, 1e-15, "at zero");
  /* Q(1, x) is exp(-x) exactly, which is a closed form to check a series against. */
  for (const x of [0.5, 1, 3, 10]) near(gammaQ(1, x), Math.exp(-x), 1e-12, `x=${x}`);
});

test("logGamma matches the factorials it generalises", () => {
  /* logGamma(n) = log((n-1)!). Small integers are exact and easy to state. */
  near(Math.exp(logGamma(1)), 1, 1e-9, "0!");
  near(Math.exp(logGamma(5)), 24, 1e-7, "4!");
  near(Math.exp(logGamma(9)), 40320, 1e-3, "8!");
});
```

- [ ] **Step 2: Run and watch them fail**

Run: `node --test test/dist.test.mjs`
Expected: every test fails with `Cannot find module .../lib/dist.mjs`.

- [ ] **Step 3: Write the implementation**

Create `plugin/skills/stet/scripts/lib/dist.mjs`:

```js
/**
 * The distributions, and nothing else.
 *
 * This file knows nothing about Stet, about content, or about what a p-value is for. That is
 * deliberate: it is the one part of this feature where a subtle mistake produces confident wrong
 * answers rather than a visible failure, so it is kept small enough to check against published
 * tables and isolated enough that checking it means nothing else has to be running.
 *
 * The algorithms are the standard ones: a Lanczos approximation for the log gamma, a modified
 * Lentz continued fraction for the incomplete beta, and a series with a continued fraction
 * companion for the incomplete gamma. Nothing here is novel and nothing here should be.
 */

/* Lanczos, g=7, n=9. The published coefficients. */
const LANCZOS = [
  676.5203681218851, -1259.1392167224028, 771.32342877765313,
  -176.61502916214059, 12.507343278686905, -0.13857109526572012,
  9.9843695780195716e-6, 1.5056327351493116e-7,
];

export function logGamma(z) {
  if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z);
  const x = z - 1;
  let a = 0.99999999999980993;
  for (let i = 0; i < LANCZOS.length; i++) a += LANCZOS[i] / (x + i + 1);
  const t = x + LANCZOS.length - 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}

const TINY = 1e-300;

/* Modified Lentz. The guards against a zero denominator are not decoration: without them the
   recurrence divides by zero for arguments that occur in ordinary use. */
function betaCF(x, a, b) {
  const qab = a + b, qap = a + 1, qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < TINY) d = TINY;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= 500; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d; if (Math.abs(d) < TINY) d = TINY;
    c = 1 + aa / c; if (Math.abs(c) < TINY) c = TINY;
    d = 1 / d;
    h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d; if (Math.abs(d) < TINY) d = TINY;
    c = 1 + aa / c; if (Math.abs(c) < TINY) c = TINY;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < 3e-16) break;
  }
  return h;
}

/** The regularised incomplete beta, I_x(a, b). */
export function betaInc(x, a, b) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const front = Math.exp(
    logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x),
  );
  /* The continued fraction converges quickly on one side of this point and slowly on the other,
     so the far side is computed through the symmetry instead. Getting this branch wrong is the
     classic way to produce a function that is right in the middle and wrong in the tails, which
     is precisely where a p-value lives. */
  return x < (a + 1) / (a + b + 2)
    ? (front * betaCF(x, a, b)) / a
    : 1 - (front * betaCF(1 - x, b, a)) / b;
}

function gammaSeries(a, x) {
  let ap = a, sum = 1 / a, del = sum;
  for (let n = 0; n < 500; n++) {
    ap += 1;
    del *= x / ap;
    sum += del;
    if (Math.abs(del) < Math.abs(sum) * 3e-16) break;
  }
  return sum * Math.exp(-x + a * Math.log(x) - logGamma(a));
}

function gammaCF(a, x) {
  let b = x + 1 - a, c = 1 / TINY, d = 1 / b, h = d;
  for (let i = 1; i <= 500; i++) {
    const an = -i * (i - a);
    b += 2;
    d = an * d + b; if (Math.abs(d) < TINY) d = TINY;
    c = b + an / c; if (Math.abs(c) < TINY) c = TINY;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < 3e-16) break;
  }
  return h * Math.exp(-x + a * Math.log(x) - logGamma(a));
}

/** The regularised upper incomplete gamma, Q(a, x). */
export function gammaQ(a, x) {
  if (x <= 0) return 1;
  return x < a + 1 ? 1 - gammaSeries(a, x) : gammaCF(a, x);
}

/*
 * The four the rest of this feature actually calls.
 *
 * Two-tailed for t and z because that is what a reported p-value means unless the text says
 * otherwise, and the one-tailed reading is offered separately as an assumption rather than
 * assumed here.
 */
export const tP = (t, df) => betaInc(df / (df + t * t), df / 2, 0.5);
export const fP = (f, df1, df2) => betaInc(df2 / (df2 + df1 * f), df2 / 2, df1 / 2);
export const chiP = (x, df) => gammaQ(df / 2, x / 2);
export const zP = (z) => gammaQ(0.5, (z * z) / 2);
```

- [ ] **Step 4: Run and watch them pass**

Run: `node --test test/dist.test.mjs`
Expected: 8 passing, 0 failing.

If any table test fails, do not adjust the tolerance. The tolerance is derived from the tables' own printed precision and moving it to make a test pass is how a wrong implementation ships. Find the error.

- [ ] **Step 5: Commit**

```bash
git add plugin/skills/stet/scripts/lib/dist.mjs test/dist.test.mjs
git commit -F - <<'EOF'
Put the arithmetic somewhere it can be checked against somebody else's tables

This is the one part of sums where a subtle mistake produces confident
wrong answers rather than a visible failure, so it is built first, kept
free of any knowledge of Stet, and pinned against critical values read
off the NIST/SEMATECH e-Handbook rather than recalled or computed here
and then declared correct.

Twelve tabulated values across t, chi-squared and F, each fed back in and
required to return the significance level it was tabulated at. The
tolerance is 0.001 because the tables print three decimal places, which
is loose enough to survive their rounding and tight enough that a
transposed beta argument or an unconverged continued fraction fails.

Two identities are tested as well as the tables, because the tables only
exercise one branch of the beta's symmetry: a squared z is a chi-squared
on one degree of freedom, and an F on one numerator degree of freedom is
a squared t.
EOF
```

---

### Task 2: The general family

Arithmetic a document does on itself, in any kind of writing.

**Files:**
- Create: `plugin/skills/stet/scripts/lib/sums.mjs`
- Create: `test/sums.test.mjs`

**Interfaces:**
- Consumes: nothing from Task 1.
- Produces:
  - `sentences(text) -> {text, line}[]`
  - `relations(text) -> Relation[]` where a `Relation` is `{kind: "fraction" | "range", line, ...}`
  - `checkFraction(rel) -> Verdict`
  - `checkRange(rel) -> Verdict`
  - `precisionOf(s) -> number`, the decimal places in a written figure
  - A `Verdict` is `{state: "consistent" | "inconsistent" | "only-if", tier: "loud" | "quiet" | "none", detail, assumption?}`

- [ ] **Step 1: Write the failing tests**

Create `test/sums.test.mjs`:

```js
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
```

- [ ] **Step 2: Run and watch them fail**

Run: `node --test test/sums.test.mjs`
Expected: all fail with `Cannot find module .../lib/sums.mjs`.

- [ ] **Step 3: Write the implementation**

Create `plugin/skills/stet/scripts/lib/sums.mjs`:

```js
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

const FRACTION = /(\d[\d,]*(?:\.\d+)?)\s+(?:of|out of)\s+(\d[\d,]*(?:\.\d+)?)/;
const PERCENT = /(\d[\d,]*(?:\.\d+)?)\s*(?:%|percent|per cent)/;
const RANGE = /(?:between|from)\s+(\d[\d,]*(?:\.\d+)?)\s+(?:and|to)\s+(\d[\d,]*(?:\.\d+)?)/;

export function relations(text) {
  const out = [];
  for (const s of sentences(text)) {
    const f = s.text.match(FRACTION);
    const p = s.text.match(PERCENT);
    if (f && p) {
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
    const r = s.text.match(RANGE);
    if (r) out.push({ kind: "range", line: s.line, from: num(r[1]), to: num(r[2]), saw: s.text.trim().slice(0, 90) });
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
```

- [ ] **Step 4: Run and watch them pass**

Run: `node --test test/sums.test.mjs`
Expected: 11 passing.

- [ ] **Step 5: Run it over this repository and read the output**

Run:

```bash
node -e '
import("./plugin/skills/stet/scripts/lib/sums.mjs").then(async (m) => {
  const { findContent } = await import("./plugin/skills/stet/scripts/lib/find.mjs");
  const { readFileSync } = await import("node:fs");
  let n = 0;
  for (const f of findContent(process.cwd()).files) {
    for (const r of m.relations(readFileSync(f, "utf8"))) {
      const v = r.kind === "fraction" ? m.checkFraction(r) : m.checkRange(r);
      n++;
      if (v.state !== "consistent") console.log(`${f}:${r.line} ${v.state} ${v.tier}\n  ${r.saw}\n  ${v.detail}`);
    }
  }
  console.log(`${n} relations found`);
});
'
```

Read every line of the output. This repository states real fractions and percentages, so the extractor should find some and they should be consistent. A finding here is either a real error in this repository's prose, which you should report and not fix, or a bug in the extractor, which you should fix and add a test for. Say in the commit message which it was and how many relations were found.

- [ ] **Step 6: Commit**

```bash
git add plugin/skills/stet/scripts/lib/sums.mjs test/sums.test.mjs
git commit -F - <<'EOF'
Check the arithmetic a document does on itself

A page states a count, a total and a percentage. Two of the three imply
the third, and nothing here has ever checked that they agree.

A relation holds only within a sentence, because two figures in
neighbouring sentences are usually about different things and pairing
them is how a checker starts arguing with prose that is correct.

Precision is read off what the author wrote, never assumed. 76.35 is
checked to two places, 76.3 to one, 76 to none, so 184,065 of 241,091 is
consistent with all three and inconsistent with 77. A figure out by one
unit in its own last place is quiet rather than loud: truncating instead
of rounding is a convention, not an error, and calling it an error is how
a check gets switched off after one run.

A total of zero is not a division and is named as such rather than
reported, because the sentence may be perfectly sensible.
EOF
```

---

### Task 3: The statistical family

**Files:**
- Modify: `plugin/skills/stet/scripts/lib/sums.mjs` (add the family)
- Modify: `test/sums.test.mjs` (add its tests)

**Interfaces:**
- Consumes: `tP`, `fP`, `chiP`, `zP` from Task 1.
- Produces:
  - `statistics(text) -> Stat[]` where a `Stat` is `{test, df1, df2, value, comparator, reported, precision, line, saw}`
  - `checkStat(stat, alpha) -> Verdict`
  - `alphaIn(text) -> number`, the alpha the text declares, defaulting to 0.05

- [ ] **Step 1: Write the failing tests**

Append to `test/sums.test.mjs`:

```js
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

test("a statistic with no p reported is not a relation to check", () => {
  assert.deepEqual(statistics("The statistic was t(28) = 2.048 in that condition."), []);
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
```

- [ ] **Step 2: Run and watch the new tests fail**

Run: `node --test test/sums.test.mjs`
Expected: the 13 new tests fail, the 11 from Task 2 still pass.

- [ ] **Step 3: Write the implementation**

Append to `plugin/skills/stet/scripts/lib/sums.mjs`:

```js
import { tP, fP, chiP, zP } from "./dist.mjs";

/*
 * The reported statistic, with its degrees of freedom and its p.
 *
 * A statistic with no p beside it is not checkable, because there is nothing to disagree with, and
 * a p with no statistic is somebody quoting a result rather than reporting one. Both are skipped
 * rather than guessed at.
 */
const P_PART = /,?\s*p\s*(=|<|>)\s*(\d*\.\d+|\d+)/;
const TESTS = [
  { test: "t", re: /\bt\s*\(\s*(\d+(?:\.\d+)?)\s*\)\s*=\s*(-?\d*\.?\d+)/ },
  { test: "F", re: /\bF\s*\(\s*(\d+)\s*,\s*(\d+(?:\.\d+)?)\s*\)\s*=\s*(-?\d*\.?\d+)/ },
  { test: "r", re: /\br\s*\(\s*(\d+)\s*\)\s*=\s*(-?\d*\.?\d+)/ },
  { test: "chi", re: /(?:chi2|chi-squared|χ²|χ\s*2)\s*\(\s*(\d+)\s*(?:,[^)]*)?\)\s*=\s*(-?\d*\.?\d+)/i },
  { test: "z", re: /\bz\s*=\s*(-?\d*\.?\d+)/ },
];

export function statistics(text) {
  const out = [];
  for (const s of sentences(text)) {
    const p = s.text.match(P_PART);
    if (!p) continue;
    for (const { test, re } of TESTS) {
      const m = s.text.match(re);
      if (!m) continue;
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
      break;
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
```

- [ ] **Step 4: Run and watch them pass**

Run: `node --test test/sums.test.mjs`
Expected: 24 passing.

- [ ] **Step 5: Commit**

```bash
git add plugin/skills/stet/scripts/lib/sums.mjs test/sums.test.mjs
git commit -F - <<'EOF'
Recompute the p-value from the statistic that produced it

Half of the psychology articles reporting a null-hypothesis test carry at
least one p-value inconsistent with its own test statistic, 8,273 of
16,695, and 12.9 percent carry one large enough to change the conclusion
(Nuijten et al., Behavior Research Methods 48(4), 2015). Every one of
those was found by recomputation alone, with no access to the data, which
is the whole argument for a script rather than a reading.

Three outcomes rather than two. A recomputed p disagrees for innocent
reasons constantly, so where halving it would agree, the finding says the
test may have been one-tailed instead of asserting an error. One
assumption, from a closed list, because an open-ended search for a
reading that rescues the number is a machine talking itself out of a
finding.

Loud only when the significance decision changes, and against the alpha
the text declares rather than an assumed 0.05, because assuming the
convention against a stricter paper invents an error that is not there.
EOF
```

---

### Task 4: The command and its documentation

**Files:**
- Create: `plugin/skills/stet/scripts/sums.mjs`
- Create: `plugin/skills/stet/reference/sums.md`
- Modify: `plugin/skills/stet/SKILL.md`
- Modify: `bin/stet.mjs`
- Modify: `README.md` (see the note below: this needs the author's word)

**Interfaces:**
- Consumes: everything from Tasks 2 and 3.
- Produces: the `sums` command. Exit 1 when anything is loud, 0 otherwise.

- [ ] **Step 1: Write the command**

Create `plugin/skills/stet/scripts/sums.mjs`:

```js
#!/usr/bin/env node
/**
 * The arithmetic a document does on itself.
 *
 * verify checks a figure against the command that produced it, and says nothing at all for a
 * project that declares no sources, which is most projects. This checks the numbers against each
 * other instead, so it needs no config, no network, no sources and no model. It is the cheapest
 * check in the set and the one most likely to be run.
 *
 * Half of the psychology articles reporting a null-hypothesis test contain a p-value inconsistent
 * with its own test statistic, 8,273 of 16,695, and 12.9 percent contain one large enough to change
 * the conclusion (Nuijten, Hartgerink, van Assen, Epskamp and Wicherts, Behavior Research Methods
 * 48(4): 1205-1226, 2015). All of it found by recomputation, with no access to anybody's data.
 *
 * Run: node sums.mjs [file ...]
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { findContent } from "./lib/find.mjs";
import { relations, statistics, checkFraction, checkRange, checkStat, alphaIn } from "./lib/sums.mjs";

const root = process.cwd();
const only = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const files = only.length ? only : findContent(root).files;

const found = [];
let checked = 0;
for (const file of files) {
  let text;
  try {
    text = readFileSync(join(root, file), "utf8");
  } catch {
    continue;
  }
  const alpha = alphaIn(text);
  for (const r of relations(text)) {
    checked++;
    const v = r.kind === "fraction" ? checkFraction(r) : checkRange(r);
    if (v.state !== "consistent") found.push({ file, ...r, ...v });
  }
  for (const s of statistics(text)) {
    checked++;
    const v = checkStat(s, alpha);
    if (v.state !== "consistent") found.push({ file, ...s, ...v });
  }
}

if (!checked) {
  console.log("No arithmetic to check: no fraction, range or reported test statistic in the content.");
  console.log("");
  console.log("This looks for numbers a document states about itself: a count of a total beside a");
  console.log("percentage, a range, or a test statistic reported with its p-value. A document that");
  console.log("states none of those has nothing here to disagree with.");
  process.exit(0);
}

console.log(`${checked} ${checked === 1 ? "relation" : "relations"} across ${files.length} ${files.length === 1 ? "file" : "files"}.\n`);

const loud = found.filter((f) => f.tier === "loud");
for (const f of loud) {
  console.log(`WRONG    ${f.file}, line ${f.line}`);
  console.log(`         ${f.saw}`);
  console.log(`         ${f.detail}\n`);
}

const quiet = found.filter((f) => f.tier === "quiet");
if (quiet.length) {
  console.log(`WORTH A LOOK  ${quiet.length}`);
  console.log("  the arithmetic is off and the claim it supports still stands\n");
  for (const f of quiet) {
    console.log(`  ${f.file}, line ${f.line}`);
    console.log(`    ${f.detail}`);
    if (f.assumption) console.log(`    consistent if ${f.assumption}`);
    console.log("");
  }
}

console.log(`${checked - found.length} consistent, ${loud.length} wrong, ${quiet.length} worth a look`);

if (loud.length) {
  console.log("");
  console.log("Every one of these is arithmetic, so it is either a number to correct or a sentence");
  console.log("to reword. Neither is a thing this command will do for you: a figure can be right");
  console.log("while the sentence around it is wrong, and that is a reading.");
}

process.exit(loud.length ? 1 : 0);
```

- [ ] **Step 2: Run it over this repository**

Run:

```bash
node plugin/skills/stet/scripts/sums.mjs; echo "exit $?"
```

Read the output in full. Record what it found in the commit message. A finding in this repository's own prose is to be reported to the author, not silently corrected: the numbers in it were verified when they were written, so a finding is more likely to be a bug in the extractor.

- [ ] **Step 3: Write the reference document**

Create `plugin/skills/stet/reference/sums.md`, carrying the `stet:` frontmatter every reference file carries (`state: draft`, `author: agent`) and the invocation block in the `node ${CLAUDE_PLUGIN_ROOT}/...` form. Follow the shape of `reference/verify.md` and cover:

- what it is: the arithmetic a document does on itself
- why it is not `verify`: one checks figures against their sources and needs config to do anything, the other checks the figures against each other and needs nothing
- the two families, with an example of each
- the three outcomes, and why consistent-only-if exists: a recomputed p disagrees for innocent reasons and statcheck is fairly criticised for reporting those as errors
- the two tiers, and the study's four-to-one ratio as the argument for splitting them
- how precision works, with 184,065 of 241,091 as the worked example: consistent with 76.35, 76.3 and 76, inconsistent with 77
- that neither family is gated on `kind`, and why
- the evidence, with the figures exactly as given in the Global Constraints above
- a Never section: never assume a precision the author did not write, never assume an alpha the text does not state, never offer more than one assumption, never correct a figure because this reported it
- a Done when section

- [ ] **Step 4: Add the row to SKILL.md**

In the command table, directly after the `verify` row:

```markdown
| `sums` | Evaluate | The arithmetic a document does on itself, recomputed | [reference/sums.md](reference/sums.md) |
```

- [ ] **Step 5: Add the entry to the CLI**

In `bin/stet.mjs`, in the `COMMANDS` map, in the `Check` group directly after `verify`:

```js
  sums: { group: "Check", script: "sums.mjs", blurb: "the arithmetic a document does on itself" },
```

- [ ] **Step 6: The README line, which needs the author's authorisation**

`README.md` is `state: approved` and the ownership hook will refuse the edit, correctly. The author authorised one previous one-line change to this list, for `standing`. **That authorisation does not extend to this one.**

Ask the author before touching the file. If they authorise it:

```bash
node plugin/skills/stet/scripts/admin.mjs unlock README.md --for "<the author's stated authorisation>"
# change the Evaluate line to include sums, and nothing else in the file
node plugin/skills/stet/scripts/admin.mjs relock README.md
node plugin/skills/stet/scripts/admin.mjs status
```

`admin status` must show nothing unlocked afterwards. If they do not authorise it, propose the line in your report and leave the file alone, then say so in the commit message so the gap is recorded rather than forgotten.

- [ ] **Step 7: Check the plugin agrees with itself**

Run:

```bash
npm test
node bin/stet.mjs help sums | head -20
```

Expected: `doctor` reports no new drift, and `stet help sums` prints the reference document with the plugin paths rewritten.

- [ ] **Step 8: Commit**

```bash
git add plugin/skills/stet/scripts/sums.mjs plugin/skills/stet/reference/sums.md plugin/skills/stet/SKILL.md bin/stet.mjs
git commit -F - <<'EOF'
Give the checks a command that needs nothing to run

verify needs declared sources and a resolver, and says nothing at all
without them, which is the state most projects are in. This needs no
config, no network, no sources and no model, so it runs on any text
anywhere and is the cheapest check in the set.

Loud is arithmetic that changes what the sentence claims. Worth a look is
arithmetic that is off while the claim still stands, and it never fails
the build. Both are reported with the sentence they came from, because a
line number without the words is a finding somebody has to go and find.

It reports and changes nothing, like verify and for the same reason: a
figure can be right while the sentence around it is wrong, and choosing
between correcting the number and rewording the sentence is a reading.
EOF
```

---

## Self-review

**Spec coverage.** The two families, Tasks 2 and 3. Three outcomes, Tasks 2 and 3. Two tiers by whether the claim survives, Tasks 2 and 3. Precision read from the author's own figure, Task 2. The alpha read from the text, Task 3. One assumption from a closed list, Task 3. No gating on `kind`, which is satisfied by there being no `kind` check anywhere in the plan. The distributions in their own file, pinned to published values, Task 1. The command, the reference document and both table rows, Task 4.

**The spec's fallback is not implemented, deliberately.** The spec says that if the distributions cannot be shown accurate, the statistical family ships reporting only consistent-only-if. Task 1 pins them against twelve published critical values and two identities, so the fallback is only reached if those tests cannot be made to pass. If that happens, stop and report it rather than proceeding: it means the arithmetic is wrong, and everything after it would be built on a false floor.

**One thing deferred to the author.** The README line needs an authorisation that has not been given. Task 4 Step 6 stops for it rather than assuming the previous one carries over.

**Not covered, and named in the spec's Open.** Parts-summing, where an enumerated list should add to a stated total. It needs the list structure to be identified and the failure mode is a page of findings from tables that were never totals.
