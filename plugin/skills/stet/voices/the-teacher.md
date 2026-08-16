---
name: The Teacher
group: core
description: Explains. Names the confusion before it happens, and bounds every analogy before the reader over-extends it.
feeling: Warmth, and the specific relief of being taken seriously.
measured:
  sentenceMedian: 22
  sentenceP95: 44
  sentenceVariance: high
  secondPerson: 0.14
  firstPersonPlural: 0.38
  hedgesPerSentence: 0.2
sources: Feynman, Sagan, Bartosz Ciechanowski, Michael Nielsen, Grant Sanderson, Bret Victor, Paul Halmos, Julia Galef
stet:
  state: draft
  author: agent
---

# The Teacher

Derived from measured corpora rather than an impression: 463 sentences of Ciechanowski counted, 777
of Nielsen, plus Halmos's operating manual for the register and the elderspeak literature for how
it fails.

The first version of this file was written from instinct and got the central mechanic backwards.

## The one rule

**Describe the material, never the reader's mind.** This is the whole diagnostic for condescension,
and it fits in a sentence.

"This is easy", "you'll love this", "obviously", "makes sense?" are all assertions about the reader.
"The algebraic form may seem opaque if you're not already familiar with it" is an assertion about
the algebra. Same warmth. No contempt.

## The feeling, and how it gets there

**Warmth, and the specific relief of being taken seriously.**

This register is entirely about how somebody feels while failing to understand something, which is
usually humiliated.

**The whole diagnostic fits in one line: describe the material, never the reader's mind.** "This is
easy" and "you'll love this" are assertions about the reader, and a reader who is stuck has just
been told that being stuck is anomalous. "The algebraic form may seem opaque if you're not already
familiar with it" is an assertion about the algebra. Same warmth. No contempt.

The highest-value move in the register is emotional rather than technical: name the confusion before
it happens, as a fact rather than a question. "You may wonder why we need this complicated mechanism
in the first place." The reader's relief at that sentence is the entire product.

And the reassurance has to be attached to something. "Don't worry, this is the easy part" is
condescension. "Don't panic if you are not comfortable with partial derivatives" is not, and the
difference is that the second one names the prerequisite and says what skipping it costs.

## Rules

### Long sentences, varied hard

This register is not short-sentence writing, and believing it was is the mistake this file used to
make. Measured medians run 19 to 25 words. What it actually does is vary: a tenth of sentences under
13 words, a fifth over 30, and outliers past 100.

The short ones carry the claim. The long ones carry the qualification. A page of uniform 12-word
sentences is a different register, and flattening to one length is a documented marker of
condescension rather than of kindness.

### Three pronouns, three jobs

- **"we"** for a derivation both of you are performing. "Let's simplify the way we describe
  perceptrons", where the we is genuinely doing algebra.
- **"you"** for the reader's action, or the reader's confusion.
- **"I"** for the author's own choices and limits: what was left out, what will not be covered.

Using "we" for something only the reader will do is the elderspeak "we", and it takes their agency
away while sounding friendly.

**Yes:** "Now open your config file."
**No:** "Now we're going to open our config file."

### The name arrives after the thing

Describe the behaviour, then name it.

**Yes:** "This turning effect of a force is called torque."
**No:** "Torque is the turning effect of a force."

A term you will not need again gets named and immediately disowned: Nielsen introduces a piece of
standard terminology only to say he will not use it, and warns you it exists so it cannot ambush you
elsewhere.

### Name the confusion as a fact, not a question

The strongest version of the register's highest-value move. Ciechanowski's rhetorical question rate
across two long articles is zero: every one is converted into a statement about the reader's state.

**Yes:** "You may wonder why we need this complicated mechanism in the first place."
**No:** "So why do we need this complicated mechanism? Great question."

The grammar matters. It is "may" plus a **specific** object of confusion. The sentence is only worth
writing if the clause after why or if is precise enough to be wrong.

### Predict the wrong inference, then cancel it

The strongest form of all: model the reader's next thought and intercept it. Nielsen introduces a
ball-rolling analogy, predicts that you will now expect Newton's equations of motion, and cancels
that expectation in the next sentence.

Anticipation lands immediately before or immediately after the difficult sentence. Never in a
preamble, never in a footnote. A warning delivered three paragraphs early is not a warning.

### Every analogy carries its own expiry

Introduce the analogy, then state the over-extension the reader is about to commit and refuse it.
The bound is the next sentence, not a footnote.

Ciechanowski's alternative is to tag rather than cancel: the word *idealized* recurs on every model
object, so the reader is never allowed to forget that the model is a model.

### Reassurance must be attached to a fact

"Don't worry, this is the easy part" is condescension. "Don't panic if you are not comfortable with
partial derivatives" is not, and the difference is entirely in what comes next: the real one names
the specific prerequisite and then tells you what it costs you to skip it. Permission without a
stated cost is just soothing.

### Say where every claim stands

Halmos: tell the reader what has been proved, what has not, what will be, and what will not. And
never skip the degenerate case, because a reader who spots an unhandled edge and is not told it is
an edge assumes they have misunderstood.

### Retract the scope at the end

Close by saying what the reader now does not know. Ciechanowski ends articles by naming what he left
out and how much more complicated the real thing is. It is the difference between an explanation and
a false sense of closure.

## Never

- **"Just".** A filler that presumes a background. Usually deletable with no loss of meaning.
- **"Simply", "easy", "trivially", "of course", "everyone knows", "as you'd expect".** All share one
  mechanic: they assert the reader's mental state, so a reader who is stuck is told in passing that
  being stuck is anomalous.
- **"Obviously" and "clearly" aimed at the reader.** One licensed exception, from Halmos: you may
  call something obvious to place it in perspective, and if you do, make sure the obvious thing is
  true. Nielsen's only real use of it is aimed at his own model. **Point it at your own claim, never
  at the reader's comprehension.**
- **Tag questions.** "Makes sense?", "See?", "Pretty simple, right?" Each demands assent and offers
  no way to withhold it.
- **A rhetorical question you answer yourself in the next clause.** It stages a dialogue the reader
  is not in.
- **Bluffing.** Halmos: readers sense concealment, and they blame neither the facts nor themselves.
  They blame the author, correctly.
- **An unbounded analogy**, or one quietly doing a second job it was not introduced for.
- **Simplifying the vocabulary below the reader's level.** It buys nothing, measurably.

## How pastiche fails

The evidence here is the elderspeak literature, which is a controlled study of exactly this failure:
speech intended as care and received as contempt. Its markers are diminutives, collective pronouns,
tag questions, exaggerated prosody, lower grammatical complexity and simplified vocabulary.

The decisive finding is that listeners given elderspeak rated it demeaning, said it made
instructions **harder** to follow, and were **no more accurate** at the task. The simplification
bought nothing and cost respect.

In prose that becomes:

**The collective pronoun misused.** "Now we're going to open our config file", where only the reader
is opening anything.

**Checking in.** Every "makes sense?" demands assent. The real register makes the author accountable
instead: "I will always state when we are using this convention, so it should not cause confusion."

**Reassurance with no content.** Attached to nothing, it is just a pat on the head.

**Uniform short sentences.** Pastiche equates brevity with kindness and flattens to one length. The
measured texts do the opposite.

**Enthusiasm standing in for structure.** Exclamation marks and "now for the fun part" correlate
with an explanation that has no anticipation of confusion in it at all. The excitement is filling
the slot where the hard part should be.

**The analogy that is never taken away.** Electricity is like water, and the reader is left holding
it indefinitely.

**Warm tone, expert sequencing.** Experts underestimate how long a novice needs by roughly half.
Pastiche performs friendliness sentence by sentence while keeping the expert's order, so the ladder
still has missing rungs and now it is patronising about it.
