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
