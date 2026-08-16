---
stet:
  state: draft
  author: agent
---

# stet clarify

Make it comprehensible to somebody who is not the author, without patronising them.

## The one rule

**Describe the material, never the reader's mind.**

That is the whole diagnostic, and it separates clarity from condescension in one line.

"This is easy", "you'll love this", "obviously", "makes sense?" are all assertions about the reader,
and a reader who is stuck has just been told in passing that being stuck is anomalous. "The
algebraic form may seem opaque if you're not already familiar with it" is an assertion about the
algebra. Same warmth. No contempt.

## The evidence that simplifying can make things worse

There is a controlled literature on speech intended as care and received as contempt, and its
findings should govern this command.

Listeners given the simplified register **rated it demeaning, said it made instructions harder to
follow, and were no more accurate at the task.** The simplification bought nothing and cost respect.

Its markers translate directly into prose: collective pronouns, tag questions, lower grammatical
complexity, simplified vocabulary. Which means the obvious approach to this command is the
documented failure mode, and clarifying is not the same activity as simplifying.

## What actually works

**Name the confusion as a fact, not a question.** The highest-value move in the register, and the
strongest form is a statement.

**Yes:** "You may wonder why we need this complicated mechanism in the first place."
**No:** "So why do we need this complicated mechanism? Great question."

The grammar matters: "may" plus a **specific** object of confusion. The sentence is only worth
writing if the clause after "why" is precise enough to be wrong.

Measured: across two long technical articles the rhetorical question rate is zero. Every one was
converted into a statement about the reader's state.

**Predict the wrong inference, then cancel it.** Model the reader's next thought and intercept it.
Introduce the analogy, then say what they are about to over-extend it into, and refuse that.

The bound is the next sentence, never a footnote. **A warning delivered three paragraphs early is
not a warning.**

**The name arrives after the thing.**

**Yes:** "This turning effect of a force is called torque."
**No:** "Torque is the turning effect of a force."

**Attach reassurance to a fact.** "Don't worry, this is the easy part" is condescension. "Don't
panic if you are not comfortable with partial derivatives" is not, and the difference is entirely in
what comes next: the real one names the prerequisite and says what skipping it costs. Permission
without a stated cost is soothing.

**Say where every claim stands.** What has been shown, what has not, what will be, what will not.
And never skip a degenerate case, because a reader who spots an unhandled edge and is not told it is
an edge assumes they have misunderstood.

**Retract the scope at the end.** Close by naming what the reader still does not know. It is the
difference between an explanation and a false sense of closure.

## Three pronouns, three jobs

- **we** for a derivation both of you are performing.
- **you** for the reader's action, or the reader's confusion.
- **I** for the author's own choices and limits: what was left out, what will not be covered.

Using "we" for something only the reader will do takes their agency away while sounding friendly.

**Yes:** "Now open your config file."
**No:** "Now we're going to open our config file."

## Do not shorten the sentences

The mistake this command is most likely to make, and it is measurable. Technical explanation that
works runs a median sentence of 19 to 25 words with wide variance: a tenth under 13, a fifth over
30, outliers past 100. The short ones carry the claim and the long ones carry the qualification.

**Flattening to one length is a documented marker of condescension rather than of kindness**, and it
is also the machine-written signature. Clarifying should usually leave the median where it was and
change what the sentences contain.

Check with:

```
node ${CLAUDE_PLUGIN_ROOT}/skills/stet/scripts/measure.mjs <file>
```

## Never

- **"Just".** Filler that presumes a background, usually deletable with no loss.
- **"Simply", "easy", "trivially", "of course", "everyone knows", "as you'd expect".** All assert the
  reader's mental state.
- **Tag questions.** "Makes sense?", "See?", "Right?" Each demands assent and offers no way to
  withhold it.
- **A rhetorical question answered in the next clause.** It stages a dialogue the reader is not in.
- **An unbounded analogy**, or one quietly doing a second job it was not introduced for.
- **Simplifying vocabulary below the reader's level.** It buys nothing, measurably.
- **Bluffing.** Readers sense concealment and they blame the author, correctly.
- **Exclamation marks and "now for the fun part".** Enthusiasm reliably fills the slot where the
  anticipation of confusion should have been.

## Never, at the level of the file

- Never clarify by cutting a caveat. That is a fact leaving the page.
- Never clarify content that is not yours to edit.
- Never restructure while clarifying. That is `restructure`, and doing both at once makes the diff
  unreadable and the regression untraceable.

## Done when

Somebody outside the project could follow it, the median sentence did not fall, no sentence asserts
what the reader is thinking, and every analogy has its limit stated within one sentence of being
introduced.
