---
stet:
  state: draft
  author: agent
---

# stet cite

Does this source exist, is it still standing, and is it the version you should be citing.

```
node ${CLAUDE_PLUGIN_ROOT}/skills/stet/scripts/cite.mjs [file ...]
```

No key, no account, no configuration. Set `STET_CROSSREF_MAILTO` to use Crossref's polite pool.

## The case for it, which is not the obvious one

It is not that models invent citations. It is that **verifying them is the step everyone skips, and
it stays skipped.**

The AI Hallucination Cases database recorded **1,922 court filings containing fabricated citations**
by August 2026: 16 in 2023, 59 in 2024, 845 in 2025, and 1,002 in the first eight months of 2026.
**347 carried a monetary penalty and 148 a professional sanction.** Every one passed through
somebody whose job includes checking sources, through three years of national coverage and judicial
standing orders.

The tools sold to prevent it do not. Legal research products marketed on hallucination-free
retrieval measured at **65, 41 and 19 percent accuracy**.

And it predates all of it. Human-written biomedical papers carry citation accuracy errors in **39
percent** of instances, and 35 percent of surgical citations contained an error, uncorrelated with
impact factor.

## What it checks

**Does it exist.** A DOI that resolves at Crossref, or does not.

**Has it been retracted.** The cheapest check and the one nobody runs. Retraction data has been free
and inline in Crossref since 2023, and across 13,252 post-retraction citation contexts **only 5.4
percent acknowledged the retraction**. In one 2024 review paper, 60 percent of the cited works had
already been retracted.

**Is it superseded.** A preprint whose version of record now exists. Guidance requires citing the
published one, and they differ, sometimes in the finding.

## Why DOIs only

A DOI is unambiguous and free to resolve. Parsing a prose bibliography is a different and much worse
problem: **a reference with a typo in the year is indistinguishable from a fabrication** until
somebody reads it, and guessing wrong in either direction is worse than saying nothing.

So a reference with no DOI is reported as unchecked rather than judged.

A DOI inside a fenced or indented code block is a fixture rather than a citation, and is skipped.
`cite` and `standing` read the same extractor for that decision, because two of them would drift and
the first symptom would be a DOI one command sees and the other does not. That is not a hypothetical:
they did drift, and `cite` reported this repository's own invented test fixtures as fabricated
citations.

## What it cannot do

Whether the source supports the sentence citing it. That is `stet-citation-checker`, and it is the
failure that shows up in 39 percent of citations in published human work. Every one of those
resolved. The paper just did not say what the sentence claimed.

## Never

- Never treat "could not check" as "fine".
- Never remove a citation because this reported it. A DOI can be mistyped, and the fix is usually
  the right DOI rather than no citation.
- Never fire this at a whole bibliography in parallel. These are free public APIs and one request at
  a time is the price of them staying free.

## Done when

Nothing fabricated, nothing retracted still cited as though it stands, and every preprint that has a
version of record cites the version of record.
