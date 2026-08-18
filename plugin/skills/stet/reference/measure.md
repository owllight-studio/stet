---
stet:
  state: draft
  author: agent
---

# stet measure

Does this piece of writing match the voice it claims to be in.

```
node ${CLAUDE_PLUGIN_ROOT}/skills/stet/scripts/measure.mjs [file ...] [--json]
```

```
cat draft.md | node ${CLAUDE_PLUGIN_ROOT}/skills/stet/scripts/measure.mjs
```

Writes nothing. Exits 1 when any metric is off target, so it can gate a commit.

## What it does, in order

1. Takes the files named on the command line. With no files it reads stdin instead. With neither it
   prints `Nothing to measure. Give it a file, or pipe prose in.` and exits 0.
2. Strips everything that is not prose. A name ending `.html`, `.htm` or `.xhtml` is stripped as
   HTML, anything else as Markdown. Piped text is always treated as Markdown.
3. Counts fifteen things about what is left.
4. Finds the voice file that governs that one file, and reads its targets.
5. Prints a row per metric with a verdict, or no verdict where the voice sets no target.

A file with nothing left after stripping prints `<name>: no prose in it.` and is skipped.

## What it counts

| metric | what it is |
|---|---|
| `sentenceMedian` | median sentence, in words |
| `sentenceMean` | mean sentence, in words |
| `sentenceMax` | the longest sentence, in words |
| `sentenceSdOverMean` | standard deviation over the mean, so how much the lengths vary |
| `shortSentences` | share of sentences under six words |
| `longSentences` | share of sentences of 30 words or more |
| `adjacentLong` | how many times two sentences of 30 words or more sit next to each other |
| `paragraphMedian` | median paragraph, in words |
| `secondPerson` | share of sentences containing you, your or yours |
| `questions` | share of sentences ending in a question mark |
| `exclamations` | how many exclamation marks, as a count and not a share |
| `softenersPerSentence` | the original softener list, per sentence |
| `hedgesPerSentence` | doubt about whether the thing is true, per sentence |
| `modalsPerSentence` | may, might, can, must, should and the rest, per sentence |
| `intensifiersPerSentence` | very, really, extremely and the rest, per sentence |

The four word lists overlap on purpose. "might" is counted as a modal and as a hedge, because these
are four lenses over the same text rather than four buckets.

The header line above the rows carries the sentence count, the word count and the voice file used.
Those two counts are reported and never judged.

## Which voice it measures against

`voice` in `stet.config.json` is either one path, or a map of glob to path for a project that writes
in more than one register. First matching glob wins, a `*` entry is the fallback, and no config or
no match means `VOICE.md` at the root. Piped text always gets the fallback, since there is no path
to match. The lookup happens per file, so one run can hold two files to two different voices.

Targets come from that file: a `measured:` block in its front matter if it has one, otherwise rows
of its Measured table matched by their label. Front matter wins where both name the same metric. A
metric no target names is printed with a blank mark, because knowing the number is useful even where
nobody has decided what it should be.

If the voice file is absent or sets no target at all, the command says
`no targets in <path>, so these are facts rather than a verdict`, prints the numbers and exits 0.

## How a target is read

| written | read as |
|---|---|
| `8 to 10 words` | between 8 and 10 |
| `35 words and up`, `at least 35` | a floor |
| `at most 40`, `under 40`, `40 or fewer` | a ceiling |
| `never`, `none`, `zero` | a ceiling of 0 |
| `0.02`, `13 words` | about that number |
| `30 to 40 percent` | 0.3 to 0.4 |

A percent sign or the words "per cent" divide by 100. For the metrics measured as a share, a target
written as a whole number is read as percent anyway, so `16%` and `0.16` mean the same thing.

`sentenceMax` is a ceiling by nature. A voice writing `longest: around 40` is read as at most 50,
never as "should be about 40", because a maximum cannot be too small and pages were being padded to
satisfy it.

An `about` target passes within a quarter either side, with a floor of one unit. For a metric
measured as a share, that floor is larger than the whole range, so an `about` target on a share can
never report drift. Write those as a range if you want them enforced.

## The marks

| | |
|---|---|
| `ok` | inside the target |
| `OVER` | above the ceiling, or too far above an `about` |
| `UNDR` | below the floor, or too far below an `about` |
| blank | the voice sets no target for this metric |

`OVER` and `UNDR` rows are counted across every file in the run, and the last line is either
`N off target.` or `On target.`. Exit 1 if the count is above zero, exit 0 otherwise. A voice with no
targets never fails, because an absent standard is not a failed one.

## `--json`

Prints the whole report as JSON and prints nothing else: file, sentences, words and a row per
metric carrying `metric`, `value`, `state` and, where there is one, `want`. `state` is `ok`, `over`,
`under` or `unset`.

**The exit code is always 0 under `--json`.** The drift counter is only incremented while the table
is being printed, and `--json` does not print the table. Read `state` from the JSON rather than the
exit code. Any other `--flag` is accepted and ignored.

## Rough edges to know about

**File paths are joined to the current directory.** An absolute path is therefore looked for
underneath the working directory and will not be found.

**A file that is not there is an unhandled crash.** Node prints an ENOENT stack trace and exits 1,
which is the same exit code as drift.

## Never

- Never add a clause to a finished sentence to satisfy a target. The plain sentence wins and the
  drift gets said out loud instead. A page that hits every figure and has to be decoded has failed
  at the only thing that mattered.
- Never treat a blank mark as a pass. It means nobody has decided.
- Never take a verdict on a file the config does not list under `prose`. The command measures
  whatever it is handed, and a column of sentence-length figures is not writing a voice applies to.
- Never trust the exit code with `--json`.

## Done when

Every `OVER` and `UNDR` row is either rewritten or recorded as a deliberate departure, and a plain
run of the command over the changed files exits 0.
