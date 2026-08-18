---
stet:
  state: draft
  author: agent
---

# stet check

Where the content still says the thing the style sheet decided against.

```
node ${CLAUDE_PLUGIN_ROOT}/skills/stet/scripts/style.mjs check [file ...]
```

Writes nothing. Exits non-zero when anything disagrees, so it can sit in CI.

## The sheet it checks against

The file named by `style` in `stet.config.json`, or `STYLE.md` when nothing names one.

Decisions are read back out of that file line by line. Two forms are recognised, both starting a list
item, both taking either a right arrow or an ASCII arrow. The backticked form is the one
`style decide` writes:

```
- `per cent` → `percent` the reason it went that way
```

The other marks the term with bold instead of backticks and leaves the replacement bare. There the
replacement runs to the end of the line, unless a spaced em dash separates a reason from it.

Two ways out before any file is opened. No sheet at all prints that nothing has been decided and
exits 0. A sheet with no decision lines in it prints that and exits 0 as well. Neither is a failure:
there is nothing to check against.

## Which files

Every file matched by the `content` globs in `stet.config.json`. Naming files on the command line
checks those instead.

The sheet itself is always removed from the list, including when it is named as an argument.
Recording a decision means writing down the form it rules against, so a sheet that checked itself
would report every entry it holds and could never be satisfied.

Arguments beginning with two hyphens are discarded. There are no flags: passing one is accepted and
does nothing.

Naming a file that does not exist fails with an unhandled read error and a stack trace rather than a
message.

## What counts as prose

Line numbers have to point at the line somebody will open, so the parts that are not prose are
blanked where they stand rather than removed. Each of these becomes blank and keeps its position:

- YAML frontmatter, from the opening fence to the closing one
- fenced code blocks, fences included
- any line indented four spaces or more
- inline code spans, Markdown link targets and HTML tags, replaced by spaces of the same length

So a decision naming the product cannot fire on a `stet:` key in a file's own frontmatter, and an
entry cannot fire on a command written in backticks.

## How a term matches

Whole word. A letter, a digit or a hyphen either side stops the match, so a decision on one word does
not fire inside a longer compound.

Case is followed when case is the thing that was decided: the match is case sensitive if the term
carries a capital, or if the term and its replacement differ only in case. Otherwise it is case
blind.

One line is reported once per decision that matches it. A line matching two decisions is reported
twice.

## What comes back

With no disagreements, the count of decisions and a line saying the content agrees with every one.
Exit 0.

Otherwise the number of places that disagree, then for each one:

```
  docs/sums.md, line 40
    says "behavior", decided as "behaviour" the corpus is British without exception in its own
voice, and the single -or spelling sits inside a quotation from the Turkey City Lexicon, which
keeps its own spelling and is the one place `check` will flag that must not be changed
    Wicherts, *Behavior Research Methods* 48(4): 1205-1226,
```

The reason is printed whole on one line, however long the sheet made it. It is wrapped here to fit
the page and is not wrapped in the terminal.

The last line is the line as blanked, trimmed and cut at 78 characters, so a code span or a link
target inside it shows up as a run of spaces. Exit 1.

The command closes by saying that a disagreement is not automatically an error, and it means it. A
decision can be wrong, and a quotation keeps its own spelling whatever the sheet says.

## Never

- Never change a word inside a quotation to agree with the sheet. Somebody else wrote it and it keeps
  their spelling. This repo has such a hit standing on purpose.
- Never fix a report by rewriting the corpus when one entry is firing in dozens of places. An entry
  that fires that widely is the wrong entry: narrow it to the positions where the word can only mean
  one thing.
- Never delete a decision to clear a hit. Changing a decision is a decision, made by hand on the
  sheet with the reason it moved written down.
- Never read exit 1 as a list of edits to apply. Every hit is read before a word moves.

## Done when

Every reported place is either corrected, or read and knowingly left because it is a quotation or
because the entry is wrong.
