---
stet:
  state: draft
  author: agent
---

# Sums: design

Written 2026-08-17. The second of the two checks the agent research ranked at the top, and the one
that is closest to this project's own thesis: most of what a document gets wrong about numbers is
arithmetic, and arithmetic needs no reader.

## The gap

`verify` checks a figure against the command that produced it. That is the right check when a
project declares sources, and it is silent when one does not, which is most projects and most
documents. It also cannot see the commonest numeric error of all, which is a document disagreeing
with itself.

A page states a count, a total and a percentage. Two of the three imply the third. Nothing in this
plugin has ever checked that they agree.

## What it is called, and why it is separate

`sums`. Plain English for arithmetic in general, which is what it does, and it covers a p-value
recomputed from its own test statistic as naturally as it covers a percentage.

It stays a separate command rather than a section of `verify` because the two need different things.
`verify` does nothing without declared sources and a resolver to run. `sums` needs nothing: no
config, no network, no sources, no model. It runs on any text in any project, offline, which makes
it the cheapest check in the set and the one most likely to be run.

## The evidence

**Half of the psychology articles that report a null-hypothesis test contain at least one p-value
inconsistent with its own test statistic.** 49.6 percent, 8,273 of 16,695 articles. 12.9 percent,
2,150 articles, contained an inconsistency large enough to change the statistical conclusion. Across
30,717 articles and 258,105 p-values published between 1985 and 2013, 9.7 percent of individual
p-values were inconsistent and 1.4 percent grossly so. Nuijten, Hartgerink, van Assen, Epskamp and
Wicherts, *Behavior Research Methods* 48(4): 1205-1226, `10.3758/s13428-015-0664-2`.

**The brief for this work said "half of published psychology papers", and that is not what the
paper found.** It is half of the papers that report a null-hypothesis test, which is 16,695 of the
30,717 examined. The distinction matters here more than usual, because a tool that overstates its
own justification is doing the thing it exists to catch.

Two properties of that study shaped this design. The errors were found by recomputation alone, with
no access to the data, which is the whole argument for a script rather than a reading. And the
difference between an inconsistency and one that changes the conclusion is roughly four to one,
which is why this reports two tiers rather than one.

## Two families

**The general family** reads relations a text states about itself, and it applies to every kind of
writing:

- a count of a total, with a percentage in the same sentence: `184,065 of 241,091` and
  `76.35 percent`
- a percentage of a stated total, with the resulting count in the same sentence
- a range written `between X and Y` or `X to Y` whose endpoints are the wrong way round

**The NHST family** reads a reported test statistic and recomputes the p-value: `t(df)`,
`F(df1, df2)`, `r(df)`, chi-squared with its degrees of freedom, and `z`. A correlation is converted
to its t equivalent rather than given its own path.

**Neither family is gated on `kind`.** An earlier draft of this design switched the statistical
family on only for `kind: papers`, and that was wrong on this project's own stated rule.
`reference/kinds.md` says a kind switches off a check that would be **wrong** for that kind, and
gives the orphan as the example: a real finding in a documentation tree and nonsense in a novel. A
recomputed p-value is never nonsense. It is merely usually absent, and a check that finds nothing
costs nothing. Gating it would mean a blog post reporting a t-test goes unchecked because the project
called itself a site.

## Three outcomes

Every relation resolves to exactly one:

| | means |
|---|---|
| **consistent** | the arithmetic agrees, at the precision the author wrote |
| **inconsistent** | it does not agree, and no ordinary convention explains it |
| **consistent only if** | it agrees under a stated assumption, and the assumption is named |

The third is the one that decides whether anybody keeps this switched on. A recomputed p-value
disagrees for innocent reasons all the time: the test was one-tailed, the degrees of freedom were
adjusted, a correction for multiple comparisons was applied. statcheck is criticised for exactly
this, and the criticism is fair.

So where a disagreement would vanish under one specific assumption, the finding says which
assumption rather than either asserting an error or hiding one. **"Consistent if the test was
one-tailed"** is a true statement, useful to the author, and not an accusation. It is the same shape
as `null` in the authority register and could-not-ask in `standing`: the tool says what it knows and
marks the edge of it.

Only one assumption is offered per finding, and only from a closed list: one-tailed, a stated
alternative alpha, or a different rounding precision. An open-ended search for an assumption that
would rescue a number is a machine talking itself out of a finding.

## Two tiers

**Loud** when the error crosses the threshold the sentence rests on.

- a p reported as significant that recomputes as non-significant, or the reverse
- a percentage wrong by more than the rounding its own precision allows

**Quiet** when the arithmetic is off and the claim it supports survives unchanged.

This is the study's own distinction, and its own figures are the argument: an inconsistency somewhere
is four times commoner than one that changes the conclusion, so reporting them identically buries the
second inside the first. `standing` made the same split for the same reason and the reasoning holds
here.

The significance threshold is 0.05 unless the text states an alpha, in which case the stated one is
used. A tool that assumes 0.05 against a paper that declared 0.01 is inventing an error.

## Rounding is the whole difficulty in the general family

A stated percentage is consistent when it equals the computed value rounded to the precision the
author actually used. `76.35` is checked to two decimal places, `76.3` to one, `76` to none. So
184,065 of 241,091, which is 76.3467 percent, is consistent with all three and inconsistent with
`77`.

Where the computed value sits exactly on a rounding boundary, the finding is quiet and names the
convention, because half-up and half-even are both defensible and neither is an error.

**Precision is read from what the author wrote, never assumed.** Comparing a figure the author gave
to one decimal place against a computation carried to four is how a checker generates a page of
findings against a document that is entirely correct.

## The part most likely to go wrong

Recomputing a p-value with no dependencies means implementing the incomplete beta function for t and
F, the incomplete gamma function for chi-squared, and the error function for z. These are standard
and they are also where a subtle numerical error produces confident, wrong findings, which is worse
than no check at all.

So the distribution functions live in their own file with no knowledge of Stet, and they are built
first and pinned against values published by somebody else before anything is built on top of them.
Not values this project computed and then asserted were right, which is circular, and not values
recalled from memory.

**If the accuracy is not demonstrable, the NHST family ships reporting only consistent-only-if and
never inconsistent.** A checker that cannot prove its own arithmetic has no business calling somebody
else's arithmetic wrong.

## What it deliberately does not do

- **No data.** It checks a document against itself. Whether the test was the right test, whether the
  sample supports it, whether the number was measured correctly: none of that is here, and some of it
  is not mechanical at all.
- **No parts-summing.** Checking that an enumerated list adds to its stated total needs the list
  structure to be identified, and the failure mode is a page of findings from a table that was never
  a total. It is in Open, not in this.
- **No rewriting.** Like `verify`, it reports and changes nothing. Fixing a number is a decision, and
  the number may be right while the sentence around it is wrong.
- **No network, no config, no model.** If it needs any of those it has stopped being this command.

## The build

| File | What |
|---|---|
| `plugin/skills/stet/scripts/lib/dist.mjs` | The distribution functions and nothing else. No Stet vocabulary, so it can be tested against published values in isolation. |
| `plugin/skills/stet/scripts/lib/sums.mjs` | Extraction of both families from text, and the verdict for each relation. Pure. |
| `plugin/skills/stet/scripts/sums.mjs` | The command: find content, report in two tiers, exit code. |
| `plugin/skills/stet/reference/sums.md` | The reference document. |
| `plugin/skills/stet/SKILL.md` | A row in the command table. |
| `bin/stet.mjs` | An entry in the `COMMANDS` map, in the Check group. |
| `README.md` | The command list. |
| `test/dist.test.mjs`, `test/sums.test.mjs` | Both, and they need no network. |

Unlike `standing`, every part of this is testable offline, so there is no excuse for an untested
path anywhere in it.

## Open

Whether parts-summing can be made precise enough to ship. The value is real, since a table whose
column does not add up is a common and embarrassing error, and the risk is a checker that fires on
every table that was never meant to total. The deciding question is whether a total can be
identified from the text rather than guessed at, and that is answerable only by running an extractor
over real documents.
