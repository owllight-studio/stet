---
stet:
  state: draft
  author: agent
---

# stet expand

A stub into a finished piece, without it becoming longer instead of fuller.

```
node ${CLAUDE_PLUGIN_ROOT}/skills/stet/scripts/expand.mjs from  <stub>
                                        ... expand it ...
node ${CLAUDE_PLUGIN_ROOT}/skills/stet/scripts/expand.mjs check <file>
```

Record the stub first. There is no way to recover the points from the finished page.

## The most dangerous command here

Every other command removes words or leaves the count alone. This one is licensed to add them, and
"it writes too much" is the first failure this project was built against. So the job description
read slightly wrong is exactly what this command produces.

Two checks, both countable.

## Did the length become information

Real expansion introduces examples, figures, names and caveats. Padding says the same thing three
ways, which means it reuses the same content words and repeats whole phrases.

On a real pair built from one four-bullet stub:

| | padded | written properly |
|---|---|---|
| vocabulary | **0.57** | **0.93** |
| repeated four-word runs | **7.1%** | **0%** |
| new figures or names | 0 | 2 |

Vocabulary is the share of distinct content words, averaged across a fixed window so the number does
not simply fall as the page gets longer. Below 0.7, or more than 3 percent of four-word runs
repeating, the added length is restatement.

**The obvious measure does not work**, and it is worth knowing why before reaching for it. Counting
new distinct words per hundred words added scored the padded version at 23.6 and passed it, because
restating a point in different words is still new words. Repetition has to be measured as
repetition.

## Did every point survive

Six bullets become four paragraphs and one bullet quietly disappears. Nobody catches it on a
read-through, because **finished prose looks finished**. Each recorded point is checked against the
draft by its own terms, and anything that lost more than half of them is reported.

This is the failure that survives review, and it is the reason to record the stub rather than trust
the expansion.

## What good expansion adds

Not adjectives, and not transitions. The stub already contains the claims, so everything added
should be one of:

- **the example** that shows the claim happening
- **the figure**, with where it came from
- **the caveat**, especially the one that reads as weakness
- **the mechanism**, which is the answer to why the claim is true rather than that it is
- **the counter-case**, where the claim stops holding

If a sentence you are about to add is none of those, it is restatement.

## Never

- Never expand a stub you did not check with `outline`. Expanding a claim with no evidence behind it
  produces a paragraph with no evidence behind it and three times the confidence.
- Never add a transition sentence whose only content is that a new section is starting.
- Never restate the claim at the end of the section that made it.
- Never invent a figure to make a paragraph feel substantiated. That is the worst version of this
  command's failure, because it looks like the fix.
- Never expand content that is not yours to edit.

## Done when

The check passes, every point survived, and everything added is an example, a figure, a caveat, a
mechanism or a counter-case.
