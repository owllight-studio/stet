---
stet:
  state: draft
  author: agent
---

# stet style

The decisions, as opposed to the voice.

```
node ${CLAUDE_PLUGIN_ROOT}/skills/stet/scripts/style.mjs
node ${CLAUDE_PLUGIN_ROOT}/skills/stet/scripts/style.mjs decide <term> <as> --why "<why>"
node ${CLAUDE_PLUGIN_ROOT}/skills/stet/scripts/style.mjs check [file ...]
node ${CLAUDE_PLUGIN_ROOT}/skills/stet/scripts/style.mjs discover [file ...]
node ${CLAUDE_PLUGIN_ROOT}/skills/stet/scripts/style-sheet.mjs
```

## A style sheet is not a voice, and Stet was missing one

`VOICE.md` says how the writing should sound: register, rhythm, what it never does. A style sheet
says **what was decided** when a word could have gone either way.

Most of it is arbitrary, and that is the point rather than a weakness. "Apples, pears, and bananas"
against "apples, pears and bananas" is a preference rather than a correctness. The value of writing
it down is that nobody makes the decision twice, and nobody makes it differently the second time.

This is the artifact every professional copyeditor actually produces, and it has two properties a
voice file does not.

**It accumulates during the edit.** Built while working rather than before. The first time a word
could go two ways it gets decided and recorded; the second time nobody has to remember.

**It gets handed on.** The proofreader applies it and extends it, the typesetter implements its
formatting decisions, and the author receives it to understand what happened to their manuscript.
Its purpose is to stop the next person second-guessing a decision somebody already made.

## What goes on one

Authorities, **named with their edition**, because "Chicago" means four different books. Then the
word list, which is the spine. Then punctuation, numbers and dates, abbreviations, capitalisation,
italics, and the formatting treatment.

And **silent changes**: what the editor altered without marking, so nobody discovers it later and
wonders.

## For a manuscript, four sheets rather than one

Professional fiction practice splits it, and the split is the method: general style, characters,
places, and a timeline. `stet-continuity` builds the last three, and the reason to keep them
separate is that the errors happen between people who share scenes rather than between people whose
names begin with the same letter.

## Finding what nobody has decided yet

```
node ${CLAUDE_PLUGIN_ROOT}/skills/stet/scripts/style.mjs discover
```

`check` enforces decisions somebody made. `discover` finds where the corpus is already saying one
thing two ways, which is the state a style sheet exists to end and the thing nobody notices from
inside a single file.

The primitive is the right one: not "this word is wrong", which needs an authority, but **"both of
these appear here, pick one"**, which needs only the corpus.

It is worth knowing what the large word lists actually are. Google maintains 598 term entries,
Microsoft 876, Red Hat 924, and reading them shows they are inventories of how many wrong names
existed in production. One Red Hat product had four. GitLab's list bans three wrong forms of "sign
in" and five of "later".

And the drift types are measured. Across 2,400 documents over 1,000 words, **80 percent had
inconsistent capitalisation and 60 percent inconsistent hyphenation**, with "long-term" against
"long term" the single commonest at 10 percent of documents. Those are the two things `discover`
looks for.

**The exclusions are most of the work**, and every one was learned by running it against a real
corpus rather than reasoning about it. The first run on this repo returned **293 terms**, which is
the "list nobody reads" failure arriving immediately. It now returns 63, and the difference is all
exclusions:

- **A capital that means nothing.** Four positions, not one: the start of the text, of a sentence, of
  a line, and of a quotation. Opening quote marks, brackets and emphasis markers are stripped first,
  because `**"Don't worry` is a sentence start wearing three hats. Without the line rule, a corpus
  written mostly in bullets reports every `- Never ...` item against its own ordinary use.
- **A capital inside a name.** "Code" in "Claude Code" is not a variant of "code".
- **An apostrophe is part of the word.** Stripping it collapsed "we're" into "were" and ranked the
  pair near the top on 42 against 7.
- **A pair that spans a sentence boundary.** The full stop is stripped when normalising, so "it. The"
  and "it the" would otherwise collapse to one key.
- **A case-only difference on ordinary English**, because there a capital is a word being quoted
  rather than a name being spelled two ways.

Adjacent word pairs are recorded whatever their case. They were once restricted to capitalised pairs
on the grounds that an uncapitalised pair is "and the", and that reasoning was wrong: a pair is only
ever reported when some other surface normalises to the same key, and nothing normalises to "andthe".
The restriction was excluding "per cent" against "percent", which is the archetypal entry.

**`discover` reads prose, not code.** A term that only ever appears inside backticks is an
identifier and is invisible to it. That is correct and occasionally surprising: this repo looks like
it writes `fact-checker` and `fact checker` about equally, and in prose it never writes the
hyphenated form at all.

## Building the first sheet

`discover` finds the variation mechanically. Deciding thirty of them is thirty judgements, and a
transcript is the wrong place to make thirty of anything.

```
node <plugin>/skills/stet/scripts/style-sheet.mjs
```

`stet-style-sheet` reads the corpus, runs `discover`, adds the categories a word-frequency pass
cannot see (numbers, dates, acronyms, punctuation habits), and writes `.stet/style-candidates.json`.
The sheet opens that as a page: each word with both forms, how often each appears and where, and the
agent's suggestion. You pick and say why.

**The reason is required.** The sheet will not record a card without one, because a decision without
a reason is one the next person reverses on the grounds that it looks arbitrary.

Nothing but `decide` writes STYLE.md. The sheet shells out to it, so the guards below apply to
everything the sheet does too.

## Changing a decision

`decide` refuses to overwrite one silently. **Changing a decision is a decision**, so it has to be
edited by hand with the reason it moved, and the next person sees that it changed rather than
finding two answers to the same question.

It refuses two more shapes, and both were found by driving the sheet rather than by reading the
code. A **reversal** is a different term, so the same-term guard cannot see it: recording
`fact-checker` becomes `fact checker` while `fact checker` becomes `fact-checker` is already there
leaves both forms disagreeing with the sheet whichever one the content uses, and `check` can never
come back clean. A **chain** does the same more quietly: deciding `a` becomes `b` when `b` is itself
decided against tells the corpus to write a word the sheet bans.

## A disagreement is not automatically an error

`check` reports where the content differs from the record. That is a question rather than a verdict.
A decision can be wrong, and **a quotation keeps its own spelling whatever the sheet says**.

## What `check` matches

Whole words, against the file itself. Fenced code, indented code, inline code and link targets are
blanked before matching, so a decision about prose does not fire on an identifier that happens to
share the word, and the line number still points at the line in the file.

Case is matched exactly whenever case is what was decided. `guide-sourced` becoming `Guide-sourced`
carries no capital in the term, and matching that case-blind reports every already-correct
`Guide-sourced` as a disagreement, which is the checker arguing with its own decision. Otherwise a
term written in lower case matches either way, because that is usually drift rather than intent.

## Never

- Never put a voice rule in here. "Warm but authoritative" is not a decision, it is an adjective, and
  it belongs in neither file.
- Never record a decision without the reason, where there was one. The reason is what stops it being
  reversed by the next person who finds it arbitrary.
- Never fix a quotation to match the sheet.
- Never build a style sheet before the edit. One written in advance is a guess about what will come
  up.

## Done when

Every word that came up twice and could have gone two ways is in it, with the reason, and `check` is
either clean or disagreeing on purpose.
