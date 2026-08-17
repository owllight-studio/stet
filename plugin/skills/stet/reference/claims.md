---
stet:
  state: draft
  author: agent
---

# stet claims

The fact checker's sheet. Every claim that did not survive checking, and what the author decides
about it.

```
node ${CLAUDE_PLUGIN_ROOT}/skills/stet/scripts/claims.mjs
```

Reads `.stet/claims.json`, written by `stet-fact-checker`. Writes `.stet/claims-decided.json`.

## Why this is a page

Twenty claims with a verdict each is twenty judgements, and a transcript is the wrong place to make
twenty of anything. On a page each claim sits with its sentence, its verdict and its evidence, and
the decision is one motion.

It is also **the reference implementation for `lib/sheet.mjs`**. An agent told to build a sheet
should read this file rather than only the library, because a library nobody has run is a library
whose bugs the first caller discovers.

## What it shows

Only claims that failed. Anything the checker marked `fine` is counted in the standfirst and kept
off the sheet, because a page of things that are already correct buries the three that are not.

**Ordered by consequence, not by line number.** A reader acting on something false is the top of the
list, and a sheet sorted by position buries the worst finding halfway down.

## What the author can say

**Accept** the finding. **It is right as written**, which is a real answer and the checker is not
always right. Or type what it should say and **use mine**, which makes those words theirs.

Anything left alone stays open and is reported as left alone. **Silence is not a decision**, and a
sheet that treats an untouched claim as accepted has taken one nobody made.

## Never

- Never put `fine` claims on the sheet.
- Never sort by position when you could sort by consequence.
- Never treat an undecided claim as accepted, in the file or in the summary.
- Never rewrite the content from here. This records decisions; fixing the page is separate work, and
  the ownership rules still apply to it.

## Done when

Every false and misleading claim is accepted, disputed or rewritten, and the ones left alone were
left alone on purpose.
