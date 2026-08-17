---
stet:
  state: draft
  author: agent
---

# stet sums

The arithmetic a document does on itself. Change nothing.

```
node ${CLAUDE_PLUGIN_ROOT}/skills/stet/scripts/sums.mjs [file ...]
```

Exits non-zero when a finding is loud, so it can sit in CI. No config, no network, no sources and
no model: it needs nothing but the text.

## Why it is not `verify`

`verify` checks a figure against the command that produced it. That needs a declared source and a
resolver to run, and without them it says nothing at all, which is the state most projects are in.

`sums` checks the numbers in a document against each other instead: a count against the percentage
beside it, a test statistic against the p-value it produced. Nothing to declare and nothing to run,
so it works on any text in any project, offline, and it is the cheapest check in the set.

## Two families

**The general family** reads a relation a sentence states about itself: a count of a total beside a
percentage, or a range. "184,065 of 241,091 references, 76.35 percent" is one relation: does the
count divided by the total round to the stated figure. "between 0.61 and 0.34" is another: does the
first endpoint sit below the second.

**The statistical family** reads a reported test statistic and recomputes the p-value that should
follow it: `t(df)`, `F(df1, df2)`, `r(df)`, chi-squared, `z`. A correlation goes through the same
path as `t`, converted to its `t` equivalent, rather than getting a distribution of its own.
"t(28) = 5.0, p = .0001" is checked by recomputing the p from 5.0 and 28 degrees of freedom and
comparing it to .0001 at the precision the author wrote.

## Three outcomes

| | means |
|---|---|
| **consistent** | the arithmetic agrees, at the precision the author wrote |
| **inconsistent** | it does not, and no ordinary convention explains it |
| **consistent only if** | it agrees under one stated assumption |

**The third exists because a recomputed p disagrees for innocent reasons all the time.** The test
was one-tailed, the degrees of freedom were adjusted, a correction for multiple comparisons was
applied. statcheck, the tool this project's evidence comes from, is fairly criticised for reporting
every one of those as an error. So where a disagreement would vanish under one specific reading, the
finding says which reading rather than asserting an error or hiding one. "Consistent if the test was
one-tailed" is true, useful, and not an accusation.

Only one assumption is offered, and only from a closed list of three: the test was one-tailed, the
figure was truncated rather than rounded, or the figure was rounded half to even. Searching for
whichever reading rescues the number is a machine talking itself out of a finding.

## Two tiers

**Loud** is an error that crosses the threshold the sentence rests on: a p reported as significant
that recomputes as non-significant, or the reverse; a percentage wrong by more than its own
precision allows. Loud exits 1.

**Worth a look** is arithmetic that is off while the claim it supports still stands. It never fails
the build.

The split is the study's own finding, not a guess: an inconsistency somewhere in a paper is roughly
four times commoner than one large enough to change the conclusion. Reporting both the same way
would bury the one in four that matters inside the three in four that do not.

## Precision, read from what the author wrote

184,065 of 241,091 is 76.3467 percent. Stated as `76.35`, it is checked to two decimal places and
consistent. Stated as `76.3`, one place, consistent. Stated as `76`, none, consistent. Stated as
`77`, still zero decimal places, and inconsistent: rounding to no decimal places gives 76, not 77.

Comparing a figure the author gave to one decimal place against a computation carried to four is how
a checker invents findings against a document that is entirely correct. The precision this checks
against is always the one on the page.

## Alternative conventions are named, never a band

Truncating instead of rounding, and rounding half to even instead of half away from zero, are both
real conventions. Neither is an error, so each is reported worth a look, with the finding saying
which convention it assumed.

A tolerance band was the first draft of this, and it was wrong. One unit in the last place sounds
narrow and is not: at zero decimal places it is a whole percentage point, wide enough to accept `77`
as a rendering of `76.3467`, which is not a convention. It is the error this command exists to catch.
Naming the exact convention that would make a figure consistent says something true. A band just
widens what counts as agreement until the check stops meaning anything.

## What it will not pair, which is most of the work

Code is blanked before anything is read, using the same routine `standing` uses, so a figure sitting
in a fenced block or an attribute cannot be married to a figure in the prose around it. Without that,
the extractor reads straight through a code sample and pairs numbers that were never about each
other.

Quoted text is blanked too, for the same reason `tells` blanks it: naming a construction is not
committing it. A sentence that shows a reader what a backwards range or a wrong p-value looks like
has to write one down, and a checker that cannot tell the difference between an example and a claim
reports the example as an error. This document was caught by its own command for exactly that,
quoting the worked examples above, before quoting was exempted.

Where an example cannot be put in quotes without weakening the sentence, an explicit marker exempts
it, the same marker `tells` already defines. It has two forms and they mean different things. The
line form is `<!-- stet-allow: reason -->`, with a colon and a word naming why, and it exempts only
the line it sits on. Drop the colon and the reason and the same comment exempts the whole file
instead, and not just from that point down: the check runs against the raw text before anything is
split into lines, so a bare marker blanks the entire file regardless of where in it the marker sits,
before the marker as well as after. That is why this document never writes the bare form on a line
of its own: doing so silently stopped checking three other, correct, relations in this file, on both
sides of the sentence it was meant to mark, before the colon existed to tell the two forms apart.
That distinction lives in `tells.mjs` too, but was not written down anywhere until here.

This document uses the line form once, below, on the sentence recounting the 8,273 of 16,695 bug,
because that sentence is prose rather than a quotation and rewording it to dodge the checker would
have made it worse.

**Neither form is a way to silence a finding you would rather not deal with.** Quoting a claim
removes it from checking, and a marker on one line or one bare marker anywhere in a file does the
same, more widely. Both are legitimate uses, and both are also how a real inconsistency disappears:
the command cannot tell an illustrative quotation from a live claim somebody happened to put in
quotation marks, so it trusts the quote marks either way. So hiding a real finding is not a decision
that passes unnoticed: whenever a quotation or a marked line concealed a fraction, a range or a
statistic this command would otherwise have checked, it says so, printed as `NOT CHECKED` at the
foot of the report, next to the summary. A quoted example with no arithmetic in it, which is most of
them, is not mentioned at all, because counting how much text was skipped rather than how much
arithmetic was skipped fires on nearly every file in a real corpus and teaches a reader to stop
reading it. A file exempted whole is named by its path every time, whether or not it happened to
contain any arithmetic, because that exemption was a decision somebody made and none of that file was
even attempted. None of this changes the exit code: an exemption is a disclosure, not a finding.

A relation needs exactly one fraction and exactly one percentage in the sentence, no more than 80
characters apart. A sentence carrying two of either is ambiguous, and nothing is paired: pairing the
first fraction to the first percentage is how an early version of this reported that 8,273 of 16,695
was 12.9 percent, having taken the two figures from different clauses of one sentence. <!-- stet-allow: illustration -->
That is the same rule the sources half of this project already follows: a claim we cannot locate is
a claim we must not touch.

Every one of these rules exists because the first draft, run against this project's own writing,
produced four findings, and every one of them was wrong. What a checker like this refuses to pair is
most of what makes it trustworthy, not a limitation apologised for.

## A range means `between X and Y`, and nothing else

`from X to Y` is ordinary English for a change, not a malformed range. "Took the variance from 0.61
to 0.34" in `reference/tighten.md` describes a decrease, and an earlier draft of this command read it
as a range running backwards and reported it as an error. A rule that fires on correct prose is worse
than no rule, so only `between X and Y` is read as a range at all.

## A file it cannot read

Reported first, with the reason, before anything else in the run. If nothing could be read at all,
the command says so and stops there. It does not go on to say what it found in the content, because
it never opened any, and that would be a claim about text this never saw.

## Neither family is gated on `kind`

A `kind` switches off a check that would be wrong for that kind, the way an orphan finding is
nonsense in a manuscript with no links. A recomputed p-value is never wrong for a kind. It is merely
usually absent from one, and a check that finds nothing costs nothing to run. Gating the statistical
family on `kind: papers` would mean a blog post reporting a t-test goes unchecked because the project
called itself a site.

## The evidence

Half of the psychology articles that report a null-hypothesis test contain at least one p-value
inconsistent with its own test statistic: 49.6 percent, 8,273 of 16,695 articles. 12.9 percent, 2,150
articles, contained an inconsistency large enough to change the statistical conclusion. Across 30,717
articles and 258,105 p-values published between 1985 and 2013, 9.7 percent of individual p-values
were inconsistent and 1.4 percent grossly so (Nuijten, Hartgerink, van Assen, Epskamp and Wicherts,
*Behavior Research Methods* 48(4): 1205-1226, `10.3758/s13428-015-0664-2`).

**Never write "half of published psychology papers".** It is half of the papers reporting a
null-hypothesis test, 16,695 of the 30,717 examined. A tool that overstates its own justification is
committing the error it exists to catch.

Every one of those figures was found by recomputation alone, with no access to anybody's data, which
is the entire argument for a script over a reading.

## Never

- Never assume a precision the author did not write.
- Never assume an alpha the text does not state; use 0.05 unless the text gives one.
- Never offer more than one assumption for a single finding.
- Never correct a figure because this reported it. A figure can be right while the sentence around it
  is wrong, and choosing between the two is a reading.

## Done when

Every loud finding is either a number corrected or a sentence reworded by hand. Every worth-a-look
finding is read, and where the named assumption does not hold, corrected the same way. Running this
command again is how you check the fix, never how you make it.
