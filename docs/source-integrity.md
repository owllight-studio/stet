---
stet:
  state: draft
  author: agent
---

# Source integrity: design

Written 2026-08-16, after the agent research ranked it joint first with the style sheet. It is
recorded here rather than only in the reference file because the reference file will say what the
command does, and this says why it is a different command from the one that already exists.

## The gap, which is not the obvious one

`cite` already resolves DOIs, reads Crossref's inline retraction data and spots a preprint whose
version of record exists. It is good at all three. It has two properties that leave the real failure
untouched.

**It is stateless.** Every run asks the same questions and prints the same answers. It cannot say
that something changed, because it does not remember what it saw last time. A bibliography that was
clean on the day it shipped reports clean forever, right up until the run where it does not, and
then it reports a problem with no date on it.

**It is DOIs only, on purpose.** The reasoning in `cite.md` is sound and stands: a prose reference
with a typo in the year is indistinguishable from a fabrication, so guessing is worse than saying
nothing. But that reasoning is about bibliographies, and a URL is not a bibliography. A URL is as
unambiguous as a DOI, resolves as cheaply, and nothing in this project currently looks at one.

So the failure neither command covers is **time**. A source that was fine when you cited it stops
being fine while nobody is looking, and the citing sentence goes on stating its claim with a
straight face. That is the same shape as a figure going stale, which this project already has a
command for, so it gets the same treatment: a record of what was true last time, and a report of
what moved.

## The evidence, and what did not survive checking

**Reference rot.** More than 70 percent of the URLs in the *Harvard Law Review*, the *Harvard
Journal of Law and Technology* and the *Harvard Human Rights Journal*, and 50 percent of the URLs in
United States Supreme Court opinions, do not produce the information originally cited. Zittrain,
Albert and Lessig, *Harvard Law Review Forum* 127, 2014, read off harvardlawreview.org rather than
from a summary of it. That paper is also where Perma.cc came from, which is the reason archiving is
in this design at all.

**Content drift.** 76.35 percent of URI references led to changed content: 184,065 of 241,091
references for which an archived snapshot existed, across arXiv, Elsevier and PubMed Central,
articles published between 1997 and 2012 compared against the live web in August 2015. Jones, Van de
Sompel, Shankar, Klein, Tobin and Grover, *PLOS ONE*, 2016, `10.1371/journal.pone.0167475`.

That figure is the argument for the quiet tier rather than against drift detection. Three quarters
of live links have changed since publication, so a check that reports every change reports three
quarters of the bibliography and gets ignored by the second run.

**Retraction goes unnoticed.** 722 of 13,252 post-retraction citation contexts acknowledged the
retraction, which is 5.4 percent. Hsiao and Schneider, *Quantitative Science Studies* 2(4):
1144-1169, `10.1162/qss_a_00155`.

**Retraction is slow, and that is what makes it a monitoring problem.** Median 562 days from
publication to retraction, range 1 to 29,622 days, over 16,041 retracted medical publications in the
Retraction Watch database. *Journal of Korean Medical Science*, 2025.

**One figure was dropped.** The brief for this work carried a 1.36-year median lag from publication
to retraction. Two searches and a reading of the paper behind them produce 562 days, which is 1.54
years, and nothing reporting 1.36. No source for it was found, so it is not in this design and it is
not going in the reference file. The verified figure makes the same argument.

**One correction to make while here.** `cite.mjs:27` dates Hsiao and Schneider to 2022. Crossref
gives 2021. One place carries it and it gets fixed in this branch.

## What it does

Two tiers, and the split between them is the whole design.

**Loud.** A finding, printed at the top, exit 1. Reserved for what cannot be innocent:

- the URL is dead: a 4xx, a 5xx, or a name that does not resolve
- the URL redirects to a different host, which is a domain that changed hands or a link farm
- the page title changed, compared after stripping a trailing site-name suffix, because a CMS
  migration that appends the publication's name to every title is not a source that moved
- a string the citing prose puts in quotation marks is no longer on the page. The anchors are the
  quoted runs of 20 characters or more in the paragraph holding the link, matched with whitespace
  and quotation marks normalised, because a page that swaps a straight quote for a curly one has
  not changed what it says
- a DOI has become retracted, flagged with an expression of concern, or unfindable since last time

**Quiet.** Recorded, listed at the foot of the report, exit 0. One case: the extracted text digest
moved and nothing above did. It says the page changed and nobody has read it. It is not a failure
and it never blocks CI.

The tiers exist because of the lesson the style sheet cost: an entry that fires dozens of times is
wrong. With 76 percent drift in the literature, a single-tier check is that entry.

## Only what changed

The first run records and reports nothing except what is already broken on the day. Every run after
it compares against the record and reports the delta, with the date the state changed. The report
reads "current on 3 March, retracted now" rather than reprinting the bibliography.

That is the same contract `verify` and `refresh` have with `.stet/sources.json`, and for the same
reason: without a record, a tool cannot tell a thing that broke from a thing that was always broken,
and the second is not news.

## The record

One file per project, holding for each reference: where it appears, when it was first seen, when it
was last checked, its last state, the title, the text digest, the quoted anchors, and the archive
snapshot with its date.

**It is committed**, on the reasoning `refresh.md` already gives for the sources lock: it is a
statement about your content, not a cache. A monitor with no memory across a fresh clone has no
value in CI, which is where a monitor belongs.

This exposes a contradiction that exists today. `refresh.md` says to commit the lock and this
repository's `.gitignore` ignores `.stet/` wholesale, so Stet's own lock is not committed and Stet
does not obey its own documented rule. The ignore rule gets narrowed to the genuinely disposable
working state, which is the sheet specs and the answers they write back, and the locks come out from
under it.

## Archiving

The remedy for rot is a snapshot taken while the page still exists, which is what Perma.cc was built
to provide. Reporting rot without one is reporting a loss.

So archiving is a subcommand, run deliberately rather than as a side effect. It reads the CDX API
first to find a snapshot that already exists, and only submits to Save Page Now for URLs with none.
Explicit because submitting a URL publishes the fact that this project cites it to a third party,
and that is not a thing to do silently on a private repository.

Two mechanical facts, established by asking rather than by remembering:

- `archive.org/wayback/available` returned 502 on every attempt while `archive.org` itself answered
  200, so the read path is the CDX API, which works.
- The Save Page Now write path is **unverified**. No save has been fired. It needs one deliberate
  test against a URL the author names before it ships, and until then the design says so rather than
  assuming it.

## The agent

`stet-source-integrity`, and it exists for the half the monitor cannot do.

It is triggered by findings only. It never sees a source the monitor cleared, which is what keeps it
cheap and what stops it re-litigating work already done mechanically. Its input is one finding plus
the sentence resting on it. It reads the live page, or the snapshot when the live page is gone, and
returns one of four remedies:

- **still stands**, the claim survives the change
- **cite the snapshot**, the original is gone and the archived copy carries the claim
- **replace with this**, named, when a better or superseding source exists
- **lost**, the claim no longer has support and the author has to decide what the sentence does

Ordered by consequence, because a claim doing real work in an argument matters more than one in a
list. And it says what it could not reach, because silence reads as approval and nothing unread has
been approved.

It does not overlap the two agents that already exist. `stet-citation-checker` asks whether a source
supports a sentence, which is a question about a source that is standing. `stet-fact-checker` is
adversarial about claims. This one asks what to do about a source that moved, and it only runs when
one has.

## What is deliberately not in this

- **No sheet.** `claims` already exists for deciding what a check could not clear. A fourth sheet
  before the volume justifies one is the wrong order.
- **No prose bibliography parsing.** `cite` refuses it for good reasons and those reasons do not
  change here.
- **No judgement in the mechanical half.** Whether the change matters is a reading. The command
  reports what moved and stops.
- **No automatic archiving.** Covered above.

## The build

| File | What |
|---|---|
| `plugin/skills/stet/scripts/lib/citations.mjs` | new. DOI and URL extraction, the Crossref call, and the state machine |
| `plugin/skills/stet/scripts/standing.mjs` | new. The monitor and its `archive` subcommand |
| `plugin/skills/stet/scripts/cite.mjs` | refactored onto the library, behaviour unchanged, year corrected |
| `plugin/skills/stet/reference/standing.md` | new |
| `plugin/agents/stet-source-integrity.md` | new |
| `plugin/skills/stet/SKILL.md` | a row in the command table and one in the agent table |
| `bin/stet.mjs` | an entry in `COMMANDS` |
| `README.md` | the command list |
| `.gitignore` | narrowed so the locks are committed |

The library exists so that `cite` and `standing` cannot disagree about what a citation is. Two
extractors would drift, and the first symptom would be a DOI one command sees and the other does
not.

**How it is tested, given there is no framework.** The comparison is a pure function of the previous
record and the new observation, returning a verdict. It takes no network and no filesystem, so it
can be exercised directly for every transition that matters: clean to dead, clean to retracted,
digest moved with the title intact, anchor gone, first sight. Everything that does touch the network
sits either side of it. `npm test` gains nothing, since it is `node --check`, `doctor` and `tells`,
and the honest addition is a check script that runs those transitions and exits non-zero.

## Open

Whether the monitor should refuse to run against content it cannot attribute a citation to. A URL in
a paragraph is usually the source for that paragraph, and sometimes it is a link in a list of links
with no claim resting on it at all. The second gets checked identically and reported identically,
which is right for rot and pointless for drift. Leaving it until the first run against a real corpus
says how often it happens.
