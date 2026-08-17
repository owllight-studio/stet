import { test } from "node:test";
import assert from "node:assert/strict";
import { tP, fP, chiP, zP, betaInc, gammaQ, logGamma } from "../plugin/skills/stet/scripts/lib/dist.mjs";

/*
 * The critical values for t, chi-squared and F are read off the NIST/SEMATECH e-Handbook of
 * Statistical Methods, which is somebody else's published table. Feeding a critical value back into
 * the distribution must return the significance level it was tabulated at. Those tables print three
 * decimal places, so their tolerance is 0.001: tight enough to fail a wrong implementation, loose
 * enough to survive the table's own rounding.
 *
 * The two normal quantiles are the standard percentage points of the standard normal, published to
 * six places, and they were checked here against Simpson quadrature of the normal density, which
 * shares no code with `dist.mjs`: 1.959964 gives 0.049999998 and 2.575829 gives 0.010000009. So
 * those two carry a tolerance of 1e-6.
 *
 * Every pin is somebody else's number. A value this project computed and then asserted was correct
 * would test nothing at all, which is exactly what the two identities that used to sit here did.
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

test("the standard normal two-tailed quantiles return their significance levels", () => {
  /*
   * The published quantiles of the standard normal, to six decimal places, which is why the
   * tolerance here is 1e-6 rather than the tables' 0.001 above.
   *
   * Two tests stood here before and both were tautologies. One compared zP(z) with chiP(z*z, 1) and
   * the other fP(t*t, 1, df) with tP(t, df); each pair reduces to the identical expression, so both
   * sides were the same call and the test would have passed with the function completely wrong. A
   * comment claimed the two had to agree or one of them was wrong. They agree by construction.
   */
  near(zP(1.959964), 0.05, 1e-6, "z at 0.05");
  near(zP(2.575829), 0.01, 1e-6, "z at 0.01");
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
  /*
   * I_x(a,b) = 1 - I_(1-x)(b,a), and this is the only test that reaches the second branch.
   *
   * `betaInc` picks its branch on x < (a+1)/(a+b+2). Every tabulated t and F value above sits below
   * that point and takes the first branch, all eight of them, checked by evaluating the condition
   * for each. Here, with a=2 and b=5, the point is 0.333, so x = 0.5, 0.7 and 0.9 cross into the
   * second. If the symmetry is wrong, every table above still passes and this is what fails. It is
   * load-bearing rather than decorative.
   */
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
