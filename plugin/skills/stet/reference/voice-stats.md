---
stet:
  state: draft
  author: agent
---

# stet voice-stats

What this corpus measurably does, in figures.

```
node ${CLAUDE_PLUGIN_ROOT}/skills/stet/scripts/voice-stats.mjs
```

Writes nothing. Always exits 0. Takes no arguments: anything typed after the script name is ignored,
and the run covers the whole corpus either way.

## Why it exists

`voice` derives a house style by reading. This measures the half that can be counted, because
"median sentence 15 words, and the longest five percent carry the arguments" is an instruction a
writer can follow and "concise" is not.

Nothing here judges. A high hedge rate is a fact about the corpus. Whether it is a problem is the
author's call, and the last line of the output says so. `measure` is the command that judges: it
scores one piece against a voice file. This one only describes.

## What it reads

The content files, found the way every script here finds them. With a `stet.config.json` that is the
`content` globs. Without one it guesses from the usual directories, the same guess `ingest` makes.
There is no way to point it at a subset from the command line.

Before counting, each file is cut down to prose. Frontmatter, fenced code, indented code, inline
code, table rows and HTML tags all come out. Quoted runs of up to 80 characters are emptied too,
because a quoted example of a habit is not the habit: the file listing the AI tics was scoring as
committing them. In `.json` files the keys are dropped as well.

Then a paragraph is a run between blank lines, and it is only counted if it is at least 40
characters. A sentence is a split on `.`, `!` or `?` followed by a space and a capital, quote or
bracket, and it is only counted if it has at least two words.

Headings and list items are the exception: those are counted on the raw file, before any stripping,
so a `#` line inside a fenced block still counts as a heading.

## What the output means

**sentence length.** Median, the quartile range, the 95th percentile with the single longest
sentence beside it, the 5th percentile, and the mean. The percentiles come off the sorted list of
every sentence in the corpus, not per file.

**paragraph length.** Median and mean, in words.

**habits.** The first four are the share of sentences that contain the thing, rounded to whole
percent: sentences saying "you", "your" or "yours"; sentences with a question mark; sentences with an
exclamation mark; and "passive-ish", which is a be-verb followed by a word ending in *ed* or *en*.
That last one is an approximation and will catch "is bitten" alongside "was tired".

The next four are counts per sentence to two decimal places, and they come from the four word lists
in `lib/prose.mjs`. They overlap on purpose, so "might" is counted as both a modal and a hedge.

| | counts |
|---|---|
| **softeners** | the original list, kept unchanged so old figures stay true |
| **hedges** | doubt about whether the thing is true |
| **modals** | may, can, must, should: qualification by grammar |
| **intensifiers** | very, really, extremely: the opposite of a hedge |

**common AI tics** is a raw total rather than a rate. The list lives in this script and nowhere
else:

```
delve            dive in          leverage         utilize
robust           seamless         unlock           elevate
game-chang       cutting-edge     in today's       landscape
realm            tapestry         testament        it's important to note
```

Zero prints `(none)`. Anything above zero prints `<- worth looking at`.

**shape.** Headings and list items across the files read, plus list items divided by paragraphs, as
one number for how much of the corpus is bullets rather than sentences.

When no sentence survives the stripping, the command prints `No prose found to measure.` and stops,
still at exit 0.

## Never

- Never quote a figure from here as a target without saying which corpus it was counted off. These
  are measurements of one project, and a median of 15 is a fact about this repository rather than
  advice.
- Never read a habit rate as a verdict. The command does not have one.
- Never treat "passive-ish" as a passive count. It is a regular expression with known false
  positives.

## Done when

The figures have been read, and the ones that are going into a voice file have been written down
with the corpus they came from.
