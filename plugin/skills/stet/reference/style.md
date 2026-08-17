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

## Changing a decision

`decide` refuses to overwrite one silently. **Changing a decision is a decision**, so it has to be
edited by hand with the reason it moved, and the next person sees that it changed rather than
finding two answers to the same question.

## A disagreement is not automatically an error

`check` reports where the content differs from the record. That is a question rather than a verdict.
A decision can be wrong, and **a quotation keeps its own spelling whatever the sheet says**.

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
