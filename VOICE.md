---
stet:
  state: draft
  author: agent
---

# Voice

Derived from Stet's own writing on 2026-08-16, across 8 files and 6,700 words, then corrected by
the author. Every example below is a real sentence from this project. Every counter-example was
written for the contrast and appears nowhere.

This file governs Stet's own content. A project adopting Stet derives its own; do not inherit this
one.

## The one rule

**Write the short version first.** Not a long draft trimmed afterwards, because trimming leaves the
qualifiers in. That is why every trimmed draft still reads long.

## Rules

### Claim first, evidence second

The reader came for the claim. Evidence supports it; it does not introduce it.

**Yes:** "Nobody can describe their own voice. Ask an author how they write and you get aspiration:
clear, friendly, authoritative. Every author says this."

**No:** "Research into authorial self-description suggests that writers frequently struggle to
characterise their own style, often defaulting to generalities, which means that asking directly may
not be the most effective approach."

Why: the second one makes the reader wait four clauses for a point the first one opens with.

### A short sentence is the verdict

Long sentence to carry the reasoning, short one to land it. The short one is the part that gets
remembered.

**Yes:** "Rules in a prompt are advice. Advice loses."

**No:** "It is therefore worth considering that rules expressed within a prompt context tend to
function more as advisory guidance than as binding constraints."

Why: the second says the same thing and nobody would quote it.

### Give the reason as something that happened

Not a principle. A thing that occurred, with the damage named.

**Yes:** "This project was designed in a session where the agent broke its own written conventions
repeatedly while sincerely believing it was following them."

**No:** "Agents can be unreliable at following their own documented conventions."

Why: the first is checkable and the second is an opinion. A reason that names a real failure is
harder to argue with and easier to remember.

### Say what it costs to get wrong

A rule with no consequence attached is a preference.

**Yes:** "Claiming a source file as prose is a mess to undo."

**No:** "Care should be taken when determining the content boundary."

Why: "care should be taken" tells nobody what happens if it is not.

### Address the reader, and tell them what to do

16% of sentences here say "you". Instructions are imperative, not descriptive.

**Yes:** "Read the corpus and tell them what they actually do."

**No:** "The corpus can then be analysed and the findings presented to the author."

### Name what you will not do

Every reference file has a **Do not** section, and it carries as much weight as the instructions. A
document with only goals cannot refuse anything, and refusing is most of what taste is.

### Keep the caveat

Where something is uncertain, thin or unproven, say so in the sentence rather than cutting it.

**Yes:** "Nothing is built yet. The command set for the first release is still open."

**No:** silence, or "the initial release will include a comprehensive command set".

Why: a hedge that survives is why the unhedged claims can be believed.

## Never

- **Em dashes.** Any. A colon, a full stop or brackets is better every time, and their absence is
  the cheapest way for writing not to read as generated. Checked by `tells.mjs`.
- **"Not X, it is Y."** Say Y.
- **Exclamation marks.** Zero in 343 sentences. Keep it that way.
- **A summary of what the reader just read.** No "in conclusion", no "to sum up".
- **Adjectives as instructions.** "Clear", "friendly", "robust", "seamless". They cannot be followed
  or violated.
- **Explaining to readers what they obviously are or why they are here.**
- **Restating the question before answering it.**
- **The aphorism that summarises a paragraph nobody needed summarised.**
- **"It is worth noting."** If it were not, you would not write it.

## Measured

Drift here is detectable rather than a matter of opinion. Re-run
`scripts/voice-stats.mjs` and compare.

| | |
|---|---|
| Sentence length, median | 13 words |
| Sentence length, quartiles | 8 to 20 |
| Longest 5% | 35 words and up |
| Paragraph length, median | 27 words |
| Second person | 16% of sentences |
| Questions | 0% |
| Exclamations | 0% |
| Hedges | 0.08 per sentence |
| Lists to prose | 0.37 list items per paragraph |

The long tail is deliberate. The longest five percent carry the arguments; everything else states
things.

## How this was produced

`voice-stats.mjs` for the measurements, `tells.mjs` for the constructions, and a close read of the
four reference files for what the writing refuses to do. The rules came out of the corpus rather
than out of a template, which is the method `reference/voice.md` requires of any project adopting
Stet, including this one.
