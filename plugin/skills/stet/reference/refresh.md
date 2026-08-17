---
stet:
  state: draft
  author: agent
---

# stet refresh

Change the figure. Leave the sentence.

```
node ${CLAUDE_PLUGIN_ROOT}/skills/stet/scripts/refresh.mjs [file ...] [--dry]
```

Run `verify` first. Run this with `--dry` before running it for real.

## The thing this exists for

`authored` plus `policy: refresh` is the combination the ownership model was built to make
sayable. **These are my words, and I want the numbers in them kept true.**

Nothing else in the product can express that. `approved` and `authored` close a file; a policy of
`frozen` keeps it closed against everything. `refresh` is the one opening, and it is deliberately
the narrowest possible one: a figure may change, and nothing else may.

## What it changes

For a claim whose recorded figure appears in the prose and whose source has moved, it replaces that
one substring. Nothing else in the file is touched, and the surrounding sentence is not reflowed.

**The written form the author chose is preserved.** A page that says "47 percent" becomes "52
percent", not "52%". Changing the fact is the job. Changing the voice is not, and that rule does not
soften just because the tool is the one doing it.

## What it refuses

- **A file whose policy forbids it.** Including when the author is the one running the command. The
  point of a policy is that it holds when it is inconvenient.
- **A claim it cannot locate.** If neither the current figure nor the recorded one is in the text,
  it changes nothing and says so. See `verify` on why.
- **A source that did not run.** A broken query is not evidence that a number changed.

Each refusal is printed with the reason and, where relevant, what would permit it.

## The lock

`.stet/sources.json` records what the content is believed to be claiming. That record is the only
thing that lets a later run tell a stale figure from a reworded sentence.

**It advances only where the prose caught up.** If any file still says the old number, because
policy refused it or because the figure could not be found, the source is held back at its old
recorded value and keeps reporting as stale.

That rule exists because the obvious implementation is wrong and I shipped it before a test caught
it. Advancing the record regardless made a refused file stop reporting as stale and start reporting
as missing, so the operator lost the true state of the one file the policy existed to protect.

Commit the lock. It is a statement about your content, not a cache.

## Order

1. `verify` to see what has moved.
2. `refresh --dry` to see exactly which substrings would change.
3. `refresh`.
4. Read the diff. It should be figures and nothing else.
5. If a refusal was wrong, change the policy deliberately rather than working around it.

## Done when

The diff contains only numbers. Every refusal was either accepted or resolved by a change to policy
that somebody decided to make.
