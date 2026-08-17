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

A leading `www.` is not a host that changed. The day a cited site turns on a www redirect, every
reference to it would otherwise be reported as moved on the same run, and a check that fires wrongly
gets ignored rather than fixed.

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

**The date is the date the state began**, and it moves only when the state genuinely changes. A link
that died on 2 November 2024 still reports 2 November 2024 six months later rather than yesterday,
which is the difference between "current on 3 March, retracted now" and a report that says the
retraction happened yesterday every day forever. It also keeps the committed record still: once
nothing is moving, a run writes nothing but the date of the check.

**A run that could not reach a source records the check and nothing else.** The state and the date
it began are left alone, because no answer is a fact about the check rather than about the source.
Writing it in would assert that a live page is unreachable, throw the date away on the run after
while reporting "unchanged", and stop `archive` saving a URL it would then describe as never having
had a copy while it stood.

**A source cited from several files is one entry and one check.** The count at the top of a run is
therefore two numbers, the references found and the distinct sources they come down to, and every
finding names the first place the source is cited and how many other files rest on it.

## The backtick exception

`discover`'s rule (see [reference/style.md](style.md)) is that a term appearing only inside
backticks is an identifier and is correctly invisible to it. `standing` breaks that rule for one
shape only: a backtick span whose interior begins with a DOI pattern is read as a citation rather
than an identifier, because this corpus writes its DOIs in backticks as plain typography, and a DOI
is not a word variant, it is a globally unique document identifier. A URL in backticks is still
skipped, because that usually means "read this as a command", the way `curl <url>` does.

## Archiving

```
node ${CLAUDE_PLUGIN_ROOT}/skills/stet/scripts/standing.mjs archive [--all]
```

Reporting rot after the fact is reporting a loss. A snapshot taken while a page still exists is
the only remedy, and it is what Perma.cc was built for: the same 2014 paper behind the 70 percent
figure above proposed it (Zittrain, Albert and Lessig, *Harvard Law Review Forum* 127, 2014).

`archive` is a subcommand, never a default. Submitting a URL to the Wayback Machine publishes the
fact that this project cites it, to a third party, and that is the author's decision rather than a
side effect of a routine run. It works from the record alone: run `standing` on the content first
so the record exists, then `archive` to snapshot what it found.

For every URL in the record, `archive` asks the CDX API whether a snapshot already exists before
it writes anything, so no save happens for a page that already has one somewhere. That read needs
no permission from anybody and costs the page nothing. Only when CDX answers that nothing exists,
and only for a URL currently recorded `live`, does `archive` ask for a new one. `--all` re-checks
and re-submits every live URL regardless of what is already recorded, for the case where the
author wants a copy as of today rather than whatever already exists. A `dead` or `unreachable`
URL is still looked up, because a snapshot taken while it stood is exactly the citation this is
for, but it is never submitted: there is nothing live to hand Save Page Now.

CDX answers 503 often, and that is a transient failure of the endpoint rather than a fact about
the URL: five consecutive 503s over about 40 seconds for one page were followed by a plain 200 for
that same page on a later retry, during the testing that built this. `archive` retries a few times
before giving up, and giving up is reported as "could not ask", never as "no snapshot exists".
Those are different facts. Treating a 503 as "no snapshot" would submit a duplicate save for a
page that already has one, and treating it as "found nothing" for a page that has a snapshot would
be worse than not checking. A 200 carrying something that is not a list of rows is the same kind of
failure and is reported the same way: CDX did not answer, which is not the same fact as CDX
answering that there is nothing there.

**As of 2026-08-16, the unauthenticated `GET` save request is confirmed gone.** It returned 404
twice, in under 300 milliseconds, against a page confirmed live and confirmed by CDX to have no
existing snapshot: too fast to be archive.org having a bad day, and not the shape of a target that
could not be reached. archive.org's own documentation confirms the path it has replaced this
with: an authenticated `POST` to `https://web.archive.org/save`, carrying S3-style credentials
from an archive.org account, generated at `archive.org/account/s3.php` and sent as an
`authorization: LOW accesskey:secret` header.

Whether an **unauthenticated `POST`** would also be refused is not established. It was tried once
and answered 503, and this document has just spent a paragraph arguing that a 503 is a transient
failure of the endpoint rather than a fact about anything, so it cannot turn around and read this
one 503 as proof either. What is verified is narrower than "an account is required": the `GET`
path is gone, and the documented path wants an account. Nothing here has ruled out an
unauthenticated `POST` succeeding.

None of that changes what `stet` does. It asks nobody for a key, and that is a design decision
rather than an oversight, so it will not add one to route around this. `archive` still finds and
records any snapshot that already exists, which is most of the value, and it still reports every
save attempt honestly rather than claiming success it cannot verify. Saving a page yourself, by
hand or with your own account, still works; `archive` will pick up the result on its next run.

A dead finding that carries a snapshot is printed under the finding in the main run, not only in
`archive`'s own output:

```
DEAD           https://example.com/a-page-that-is-gone
               content/page.md, line 12, and 2 other files cite it
               returned 404, held since 2024-11-02
               archived 2024-03-18: https://web.archive.org/web/20240318.../https://example.com/a-page-that-is-gone
```

That line is the whole reason archiving is here. A dead link with a snapshot is a citation
somebody can fix. A dead link without one is a loss.

`held since` is read off the record as this run found it, so it is the date the state before this
one began: on the run where the page dies, the day it was last recorded as changing, and on every
run after, the day it died. It does not move while nothing moves. A month later this same finding
still says 2024-11-02.

## Never

- Never treat "could not check" as fine. A timeout is not evidence the source is fine, it is
  evidence that nothing was learned.
- Never delete a citation because this reported it. Loud is a reason to look, not a reason to
  remove.
- Never fire this at a whole bibliography in parallel. These are free public APIs and one request at
  a time is the price of them staying free. One request per source, too, however many files cite it.
- Never put a quiet finding in the loud tier to make it get attention. The split is the design: a
  quiet finding promoted to loud stops meaning anything, and the second run gets ignored along with
  it.

## Done when

Nothing is loud, or everything loud has been decided on deliberately: the claim still survives the
change, the snapshot carries it, or it has been given a different source.
