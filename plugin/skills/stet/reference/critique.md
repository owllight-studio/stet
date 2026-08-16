---
stet:
  state: draft
  author: agent
---

# stet critique

A scored review of one piece, where every score is computed.

```
node ${CLAUDE_PLUGIN_ROOT}/skills/stet/scripts/critique.mjs <file>
```

## Why none of it is an opinion

The obvious version of this command is worthless: a number attached to a feeling, unreproducible and
unarguable, which the author can neither trust nor dispute. So nothing here is scored on taste. Each
dimension is counted, the count is printed beside the verdict, and the total is a tally of the
dimensions rather than a figure anybody chose.

Which means you can disagree with it precisely. "Altitude 80 percent" is a claim about the text, and
if it is wrong you can point at the sentences.

## The dimensions

**voice** and **variance**, from the voice targets. Variance is separated out because it is the
single most reliable signal that a machine wrote something: every measured register runs a standard
deviation between half and four fifths of its mean, and below about 0.35 the prose has a metronome.

**density**, the vocabulary and repeated-phrase measures from `expand`. Restatement looks the same
from outside whether it arrived by padding or by drafting.

**claims**, from `verify`. Current, or stale, or figures nobody is watching.

**actionable**, which is the state. A critique of closed content is a conversation with its author
rather than a task, and saying so at the top saves somebody planning work they may not do.

## The three that were craft rules until now

These are the reason the command was worth building rather than aliasing.

**The ending test.** "Delete your last paragraph. If the piece reads as finished, it was a summary."
That was a thing you had to do by hand. A summary introduces no new terms, because it is assembled
from words already on the page, so the test is a set difference. Under 30 percent of the last
block's distinct terms being new is a warning; under 15 is a summary.

**The opening test.** Throat-clearing is an opening that does not contain the subject, and a piece's
subject is what it is called. The measurement is how far in the title's own words first appear.

Frequency was the first attempt and it was wrong: the commonest content words in a reference page
are its working vocabulary rather than its subject, so it reported files as opening five sentences
late when they had named the subject in the title and got straight on with it.

**Altitude.** Sentences making a general claim with no number, name or quotation in them. The
research finding is that in measured essays this ratio is low and clusters at section ends, and
uniform across a text means intoning rather than arguing.

Calibrated against real files rather than guessed: research-dense pages run 40 to 49 percent, a
README 65, a landing page 80, and prose written to be bad 91.

## What it will not tell you

The four things it prints at the end, which are the ones that need a reader:

- is every claim one the piece supports, rather than one it asserts confidently
- does the structure match what this page is for
- would a reader who does not already agree be persuaded
- is there a paragraph here that exists because it was easy to write

**A clean score is not a good piece.** It is a piece with none of the countable faults, which is a
lower bar and a different one. The command exists so a reader can spend their attention on the four
questions above instead of on the eight below them.

## Never

- Never treat the tally as a verdict on the writing. It is a count of clean dimensions.
- Never fix a dimension by gaming its measure. Adding a name to a sentence to move the altitude
  number is worse than the altitude.
- Never critique closed content without saying up front that nothing can be done about it.

## Done when

Every FAIL is fixed or knowingly accepted, and somebody has answered the four unmeasured questions
out loud.
