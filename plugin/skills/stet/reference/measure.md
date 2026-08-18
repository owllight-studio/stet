---
stet:
  state: draft
  author: agent
---

# stet measure

Does this piece of writing match the voice it claims to be in.

```
node ${CLAUDE_PLUGIN_ROOT}/skills/stet/scripts/measure.mjs [file ...] [--json]
stet measure [file ...] [--json]
```

```
cat draft.md | node ${CLAUDE_PLUGIN_ROOT}/skills/stet/scripts/measure.mjs
```

It needs no model, so it ships in the CLI as well as the plugin. Both run the same script.

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

What the stripping throws away changes every figure under it. From Markdown it removes front matter,
fenced code, any line indented four spaces or more, inline code spans, table rows, blockquote lines,
and the address half of a link, keeping the link text. From HTML it removes front matter, `script`,
`style`, `pre`, `code` and `textarea`, comments, and whole tables, and it turns a closing block tag
into a sentence break so that ten cells do not run together into one long sentence. A page that is
mostly table is therefore measured on the few paragraphs around the tables.

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
| `exclamations` | how many exclamation marks in the whole file, as a count and not a share. `!=` does not count |
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

Targets come from that file: a `measured:` block in its front matter if it has one, and rows of its
tables matched by their label. Front matter wins where both name the same metric. A metric no target
names is printed with a blank mark, because knowing the number is useful even where nobody has
decided what it should be.

Row matching is looser than it looks. Every two-column row anywhere in the voice file is tested
against a fixed list of labels, so a row in some unrelated table can set a target if its left cell
matches one of them. And there is no label in that list for `longSentences`, which can only be
targeted from front matter.

If the voice file is absent or sets no target at all, the command says
`no targets in <path>, so these are facts rather than a verdict`, prints the numbers and exits 0.

## How a target is read

| written | read as |
|---|---|
| `8 to 10 words`, `between 8 and 10`, `8-10` | between 8 and 10 |
| `35 words and up`, `at least 35`, `35 or more`, `minimum 35` | a floor |
| `at most 40`, `under 40`, `below 40`, `near 40`, `40 or fewer`, `maximum 40` | a ceiling |
| `never`, `none`, `zero` | a ceiling of 0 |
| `a lot`, `wide`, `deliberately` | a floor of 0.5, with no number written |
| `0.02`, `13 words` | about that number |
| `30 to 40 percent` | 0.3 to 0.4 |

An en dash or a plain hyphen between two figures makes a range, and the range is read before
anything else, so `8-10` and `8 to 10` are the same target.

A percent sign or the words "per cent" divide by 100. Nine metrics are then scaled a second way: the
four shares (`shortSentences`, `longSentences`, `secondPerson`, `questions`), `sentenceSdOverMean`,
and all four per-sentence rates. For any of those, a figure above 1 is read as percent and divided by
100. So `16` and `0.16` mean the same thing on a share, and `modalsPerSentence: 2` means 0.02 rather
than two modals a sentence. Write the per-sentence rates as decimals.

An `about` target passes within a quarter either side, with a floor of one unit. A share runs from 0
to 1, so that floor is wider than the whole range and an `about` target on a share can never report
drift. Write those as a range if you want them enforced. The per-sentence rates are not capped at 1,
so they can drift, but only once they sit a whole unit clear of the target.

An `about` target on `sentenceMax` becomes a ceiling a quarter above the figure instead, so
`longest: around 40` means at most 50. A maximum cannot be too small, and pages were being padded to
satisfy one. A target written as a floor stays a floor and can report `UNDR`, which is what this
project does to itself: `VOICE.md` asks for 35 words and up, and a README whose longest sentence runs
to 33 words is marked under.

## The marks

| | |
|---|---|
| `ok` | inside the target |
| `OVER` | above the ceiling, or too far above an `about` |
| `UNDR` | below the floor, or too far below an `about` |
| blank | the voice sets no target for this metric |

`OVER` and `UNDR` rows are counted across every file in the run. The last line is `N off target.` if
any row drifted, `On target.` if none did, and neither line at all when no voice in the run set a
single target, since there was nothing to be on or off. Exit 1 if the count is above zero, exit 0
otherwise. A voice with no targets never fails, because an absent standard is not a failed one.

The count is cumulative across the run, so one exit code covers every file handed in and the table
carries no per-file verdict.

## `--json`

Prints the report as a JSON array, one object per file, and prints no table. Each object carries
`file`, `sentences`, `words` and `rows`, and each row carries `metric`, `value`, `state` and, where
there is one, `want`. `state` is `ok`, `over`, `under` or `unset`.

A file with no prose in it is absent from the array rather than present as a null, so the array
cannot be indexed against the list of files you passed in. Its `<name>: no prose in it.` line also
prints above the JSON whatever the flag says, so the output is not always something a parser will
accept.

**The exit code is always 0 under `--json`.** The drift counter is only incremented while the table
is being printed, and `--json` does not print the table. Read `state` from the JSON rather than the
exit code. Any other `--flag` is accepted and ignored.

## Rough edges to know about

**File paths are joined to the current directory.** An absolute path is therefore looked for
underneath the working directory and will not be found.

**A file that is not there is an unhandled crash.** Node prints an ENOENT stack trace and exits 1,
which is the same exit code as drift.

**A `measured:` block written last in the front matter is skipped in silence.** The block is read up
to the next line that starts hard against the left margin, so with nothing below it the front matter
targets are all lost and only table rows are read. Keep another key, such as `name:`, below the
block.

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
