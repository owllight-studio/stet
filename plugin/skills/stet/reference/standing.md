---
stet:
  state: draft
  author: agent
---

# stet standing

What every cited source was last time, and what has moved since.

```
node ${CLAUDE_PLUGIN_ROOT}/skills/stet/scripts/standing.mjs [file ...]
```

No key, no account, no configuration. Set `STET_CROSSREF_MAILTO` to use Crossref's polite pool.

## Why it is not `cite`

`cite` asks three questions well and answers them once. It is stateless: a bibliography that was
clean on the day it ran reports clean until the run where it does not, and nothing on the page says
when that happened. `standing` keeps a record of what each source was last time, so a run reports
the delta rather than the whole bibliography, with the date the state began.

It also watches a source `cite` does not touch. `cite` checks DOIs only, because parsing a prose
bibliography for anything else is guessing. `standing` checks URLs too: it fetches the page and asks
whether the title, the host and, where the citing sentence quoted something alongside the link, the
exact words it relied on are still there.

## The evidence

Reference rot: more than 70 percent of the URLs in the *Harvard Law Review*, the *Harvard Journal of
Law and Technology* and the *Harvard Human Rights Journal* and 50 percent of those in Supreme Court
opinions no longer produce the information cited (Zittrain, Albert and Lessig, *Harvard Law Review
Forum* 127, 2014).

Content drift: 76.35 percent of references with a snapshot, 184,065 of 241,091, had content that had
changed since the snapshot was taken (Jones et al., *PLOS ONE*, 2016,
`10.1371/journal.pone.0167475`).

Retraction goes unread even where it is free to check: across 13,252 post-retraction citation
contexts, only 5.4 percent, 722, acknowledged the retraction (Hsiao and Schneider, *Quantitative
Science Studies* 2(4): 1144-1169, 2021).

And retraction is too slow for any diligence pass at the point of citing to catch it: a median of
562 days from publication to retraction, across 16,041 retracted medical publications (*Journal of
Korean Medical Science*, 2025). A source that was fine when you cited it stops being fine while
nobody is looking.

## The two tiers, and why the quiet one is quiet

**Loud** is what cannot be innocent: the page is dead, the DOI resolves to nothing, the paper is
retracted, flagged or superseded, the host changed, the anchor you quoted is gone, or the title
changed to something else. Loud exits 1.

**Quiet** is the page still standing with its text having moved underneath it anyway. That is the
ordinary condition of a source with a snapshot, by the 76.35 percent figure above, so putting it in
the loud tier would report three quarters of a bibliography as broken and get ignored by the second
run, the way a linter that is never right gets disabled rather than fixed. Quiet never blocks. It is
a note that nobody has read the current page.

## What an anchor is

A run of quoted text, twenty characters or more, that sits in the same paragraph as the link. It is
the citing sentence's own words rather than the page's: a CMS migration can rename the title while
the paragraph you actually relied on is still there, or the reverse. When the page no longer
contains an anchor's text, that is loud regardless of what the title says, because the anchor sits
closer to the claim than the title does.

## The record

`.stet/standing.json` is what every source was, keyed by DOI or by URL, never both for the same
paper. Commit it. It is a statement about your content, not a cache: the date a state began is read
off it, and a record that nobody committed cannot say when something changed, only what state it
currently reports.

The first run establishes the record and reports only what is already broken, because there is no
"last time" yet to compare against.

## The backtick exception

`discover`'s rule (see [reference/style.md](style.md)) is that a term appearing only inside
backticks is an identifier and is correctly invisible to it. `standing` breaks that rule for one
shape only: a backtick span whose interior begins with a DOI pattern is read as a citation rather
than an identifier, because this corpus writes its DOIs in backticks as plain typography, and a DOI
is not a word variant, it is a globally unique document identifier. A URL in backticks is still
skipped, because that usually means "read this as a command", the way `curl <url>` does.

## Never

- Never treat "could not check" as fine. A timeout is not evidence the source is fine, it is
  evidence that nothing was learned.
- Never delete a citation because this reported it. Loud is a reason to look, not a reason to
  remove.
- Never fire this at a whole bibliography in parallel. These are free public APIs and one request at
  a time is the price of them staying free.
- Never put a quiet finding in the loud tier to make it get attention. The split is the design: a
  quiet finding promoted to loud stops meaning anything, and the second run gets ignored along with
  it.

## Done when

Nothing is loud, or everything loud has been decided on deliberately: the claim still survives the
change, the snapshot carries it, or it has been given a different source.
