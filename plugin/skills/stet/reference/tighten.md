---
stet:
  state: draft
  author: agent
---

# stet tighten

Cut. Keep the meaning, the facts and the voice.

## The instruction this command refuses to give

"Omit needless words" is the most quoted piece of writing advice in English and it is useless.
Geoffrey Pullum's demolition is exact: **the students who know which words are needless do not need
the instruction, and the ones who need it cannot apply it.** Orwell's "if it is possible to cut a
word out, always cut it out" fails identically.

So this file does not tell you to be concise. It tells you what to cut and, more importantly, what
looks cuttable and is not.

## Cut these

**The runway.** The first sentence of a paragraph that announces what the paragraph is about. Start
at the point.

**The restatement.** The claim, then the claim in different words, then an analogy for the claim.
This is where condescension actually comes from, measurably: not from simple vocabulary but from the
explanation-to-claim ratio. The reader has now been told four times that they understood.

**The adjective doing a number's job.** "Significantly faster" where the figure is known. "Prices
reduced" where it was 25 percent. A specific claim is either true or a lie; a superlative is neither,
so it is discounted.

**The summary at the end.** Delete the last paragraph and read the piece. If nothing was lost, it
was a summary and it should stay deleted.

**Adjectives standing in as instructions.** "Clear", "robust", "seamless". They cannot be followed
or violated, so they carry nothing.

**Explaining to readers what they obviously are, or why they are here.**

## Do not cut these, however cuttable they look

**A qualifier carrying a fact.** The standard advice says strip "I think". Paul Graham: *"'I think
x' is a weaker statement than simply 'x.' Which is exactly why you need 'I think.'"*

For writing backed by data this stops being a style question. **If the qualifier was carrying the
sample size, cutting it is a truth failure wearing a style improvement.** "In the two runs that
recorded it" is four words that cannot be spared.

**A caveat that reads as weakness.** Especially that one. The caveat is why the unhedged claims next
to it can be believed.

**A long sentence with a conjunction in it.** A 26-word sentence containing "because" carries a
causal relation. Split it to satisfy a word count and you have two assertions and the causality is
now the reader's problem.

This is the mechanism by which mechanical tightening **makes prose harder to read while improving
its readability score.** Flesch counts words per sentence and syllables per word. It knows nothing
about whether the relation between the clauses survived.

**Variance.** The most common way tightening ruins a page. Cutting the long sentences is the easiest
win available and it flattens the distribution, and a flat distribution is the single most reliable
signal that a machine wrote something. Cut *within* long sentences. Do not cut long sentences.

## Measure it, both ways

```
node ${CLAUDE_PLUGIN_ROOT}/skills/stet/scripts/measure.mjs <file>
```

Run it before and after. Word count going down is the point. **Standard deviation over mean going
down is a regression**, and it is the one this command causes most often.

Report both numbers. A tighten that cut 18 percent of the words and took the variance from 0.61 to
0.34 made the page worse and the word count better, and only one of those is visible without
measuring.

## Never

- Never change a fact while cutting. If a figure is wrong, that is `verify` and `refresh`.
- Never cut a source attribution to save words.
- Never cut into content that is not yours to edit. The hook will refuse, and it is right.
- Never rewrite a sentence you were only asked to shorten. Cutting is not rephrasing.
- Never report the word count without the variance.

## Done when

Fewer words, the same facts, the same voice, and a variance that did not fall. Anything the author
had written by hand is untouched.
