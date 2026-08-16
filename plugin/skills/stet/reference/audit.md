---
stet:
  state: draft
  author: agent
---

# stet audit

The sweep. Everything wrong with the content, ranked by what it costs.

```
node ${CLAUDE_PLUGIN_ROOT}/skills/stet/scripts/audit.mjs [--quiet]
```

Writes nothing. Exits non-zero only on the first band.

## Why this exists when the other commands already report

Most of what it says, another command could have told you. `verify` knows about stale claims,
`tells` knows about banned constructions, `measure` knows about voice drift. **Running four commands
and reading four reports is not the same as knowing the state of the content.**

And the findings that matter most need two things at once, so no single command can see them.

**Closed and off-voice** is the clearest case, and the reason this command exists. `measure` sees the
drift and does not know the file is closed. The hook knows the file is closed and cannot see the
drift. Together they say the useful thing: this page is off-voice and nobody may fix it without the
author releasing it first.

## The bands

Ranked by consequence, never by count. Sorting a stale figure and an untidy construction together by
how many there are produces a report that leads with the least important thing.

| | |
|---|---|
| **Wrong now** | a reader is being told something untrue |
| **At risk** | nothing is wrong yet and nobody is watching |
| **Structure** | the shape of the project rather than its words |
| **Hygiene** | worth doing, never urgent |

**Only the first band fails the exit code.** Everything else is work, and failing a build on work
nobody scheduled is how a checker gets switched off.

## What it looks for

**Wrong now.** A claim whose source has moved. A source that will not run. Content citing a source
that is not declared.

**At risk.** A closed file that has drifted from the voice. A claim whose figure cannot be found in
the prose any more. A project where every single file is still draft, which means nobody is reading,
and the ownership model is doing nothing.

**Structure.** Orphans. Files inside a content path carrying no state at all. Files marked approved
with no record of who accepted them. Sources declared and never cited.

**Hygiene.** Figures sitting in prose with nothing watching them.

## The scope rule that keeps it usable

**Voice drift, orphans and typed figures are reported for `prose` only**, which is the subset of
content written to be read by a person. Everything else in `content` is reference: rule lists,
measurement tables, instructions an agent reads.

This is not a nicety. Without it the first run of this command reported all seventeen voice presets
as off-voice, all seventeen as orphans, and one of them as carrying 48 unsourced figures. Every one
of those was technically true. A table of sentence-length measurements is not supposed to sound like
the landing page, is reached by a tool rather than a link, and quotes published research that is
not going to move. **Thirty findings of noise is a report nobody reads twice.**

Declare the split in `stet.config.json`:

```json
"content": ["README.md", "docs/**/*.md", "site/index.html"],
"prose":   ["README.md", "site/index.html"]
```

With no `prose` key, everything in `content` is treated as prose, which is right for a project that
is all pages.

## Order of work

1. Fix the first band. Those pages are lying to somebody now.
2. Decide about the second. A closed file that has drifted is a conversation with its author, not a
   task.
3. The rest is backlog.

## Done when

The first band is empty. Everything in the second was either fixed or knowingly accepted, and
"knowingly" means somebody said so rather than nobody having looked.
