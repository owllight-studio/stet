---
name: Plainspoken
group: core
description: Concrete nouns, working verbs, no throat-clearing. Varied hard, because uniform length is the tell.
feeling: Conviction, and the calm of somebody who does not need to convince you.
measured:
  sentenceMedian: 15
  sentenceSdOverMean: 0.55
  sentenceMax: 45
  shortSentences: 0.3
  softenersPerSentence: 0.1
sources: Orwell, Hemingway, GOV.UK content guidance, digital.gov, Butterick, Paul Graham, and Pullum's criticism of Strunk and White
stet:
  state: draft
  author: agent
---

# Plainspoken

Measured rather than assumed, and the measurement embarrassed the canon.

**Orwell fails modern plain-language guidance inside his own manifesto.** "Politics and the English
Language" runs a mean sentence of 25.9 words, 36 percent of its sentences are 30 words or longer,
and the longest is 96. GOV.UK's 25-word rule would split more than a third of the essay that gave us
the rules.

That is not a gotcha. It is the finding this file is built on.

## The one rule

**Vary hard.** Variance is the register, not shortness.

Every measured text sits at a standard deviation between half and four-fifths of its mean. Nothing
good sits near its own average. The short sentences carry the claims; the long ones carry the
working-out, and a cap flattens the distinction between them.

The detection is arithmetic: **standard deviation over mean below about 0.35 is pastiche.**

## The feeling, and how it gets there

**Conviction, and the calm of somebody who does not need to convince you.**

Plain is not flat. The short sentence carries the verdict and the long one carries the working out,
and the feeling lives in that switch.

The rule that matters most emotionally is the one about hedges. Graham: *"'I think x' is a weaker
statement than simply 'x.' Which is exactly why you need 'I think.'"* A qualifier is not timidity, it
is honesty about your own certainty, and stripping it makes the writing sound confident and be
untrue.

And the register's condescension failure is emotional rather than lexical. Simple words are not
patronising. Restating a claim four different ways is, because it tells the reader you did not think
they got it.

## Rules

### Concrete over abstract

Name the thing. A sentence that could describe six situations describes none of them.

**Yes:** "Three deploys failed in forty minutes, all for one cause."
**No:** "There were several deployment issues stemming from a configuration oversight."

### Let the meaning choose the word

Orwell's actual procedure, which is more use than his six rules: what am I trying to say, what words
express it, what image makes it clearer, is that image fresh, could I put it more shortly, have I
said anything avoidably ugly.

And the principle underneath: "let the meaning choose the word, and not the other way about."

### Keep the hedge that carries a fact

Plain-style guidance says cut "I think". Graham says you need it, and he is right: *"'I think x' is
a weaker statement than simply 'x.' Which is exactly why you need 'I think.'"*

For writing backed by data this is not a style question at all. If the qualifier was carrying the
sample size, cutting it is a **truth failure** wearing a style improvement.

**Yes:** "In the two runs that recorded it."
**No:** the same claim with the caveat deleted for flow.

### Do not chop at the conjunction

A 26-word sentence with a "because" in it carries a causal relation. Split it to satisfy a word cap
and you have two assertions and the causality is now the reader's problem.

This is the mechanism by which mechanical plain-language editing **makes prose harder to read while
improving its readability score.** Flesch counts words per sentence and syllables per word. It knows
nothing about whether the relation between the clauses survived.

### No throat-clearing

Start at the point. The first sentence is not a runway.

### The short sentence is the verdict

**Yes:** "Useful writing is bold, but true." (Graham)

State it once, at full strength, and move. Do not gloss it.

## Never

- Em dashes.
- "Not X, it is Y." Say Y.
- A summary of what the reader just read.
- Adjectives standing in as instructions.
- Explaining to readers what they obviously are, or why they are here.
- Restating a claim in different words to be sure it landed. See below: that is where condescension
  actually comes from.

## Orwell's sixth rule

The five everybody quotes, and the sixth everybody drops:

> i. Never use a metaphor, simile or other figure of speech which you are used to seeing in print.
> ii. Never use a long word where a short one will do.
> iii. If it is possible to cut a word out, always cut it out.
> iv. Never use the passive where you can use the active.
> v. Never use a foreign phrase, a scientific word or a jargon word if you can think of an everyday
>    English equivalent.
> vi. **Break any of these rules sooner than say anything outright barbarous.**

Dropping the sixth inverts the essay. Orwell's own line immediately after: "One could keep all of
them and still write bad English." They are a check against habit, not a grammar.

Modern guidance disagrees with him in three places worth knowing. **Passive voice** is an
information-ordering decision rather than a moral one: "You'll be told what you need to do" beats
naming the department, because the reader is the subject. **Grammar** he explicitly deprioritises,
saying correctness matters not at all so long as the meaning is clear, which is the opposite of what
most teaching in his name does. And his case is political where the modern case is empirical: 80
percent of people prefer clear English, and the preference gets stronger as the subject gets harder.

## The criticism this file has to survive

Geoffrey Pullum's attack on *The Elements of Style* is the strongest argument against every document
of this kind, including this one.

His concession first: the style advice is "mostly harmless", and empty. **"Omit needless words" is
useless because the students who know which words are needless do not need the instruction.**
Orwell's third rule fails identically.

His real charge is that the grammar advice is factually wrong. Of the four example pairs under "Use
the active voice", three contain no passive at all. And the authors break their own rules on the
same page without noticing: "Write with nouns and verbs, not with adjectives and adverbs" is
followed immediately by a negative passive containing three adjectives.

**The lesson for any style guide, and the standard this library is held to: a rule stated as a
prohibition, with no mechanism attached, cannot be followed by the people who need it and produces
confident wrong corrections in the people who do not.** Every rule here should be countable, or come
with the reason it works. Pullum's method is to download the texts and count, which is why this file
now says 25.9 instead of "Orwell wrote short sentences".

## How pastiche fails

The failure is not short sentences. It is short sentences of **uniform length and identical
grammatical shape**.

**The variance collapse.** Every sentence lands between 6 and 12 words. Real plain prose swings 7 to
45. When every sentence is the same length the prose acquires a metronome, and the reader stops
hearing content and starts hearing the beat.

**One subject, one shape, three times.** "You do X. You then do Y. You will see Z." Each rule that
produced this is individually correct, and no plain-language guide anywhere tells you to vary. That
omission is the bug.

**Patronising comes from the explanation-to-claim ratio, not from word choice.** Simple words are
not condescending. What condescends is restating: make the claim, paraphrase it, give an analogy for
it, restate it. The reader has now been told four times that they understood.

**Mechanical de-Latinising**, including the words that are the precise term. Orwell's fifth rule
contains a conditional, and the conditional is the rule.

**Hedge-stripping**, covered above, which turns measured claims into unqualified assertions.

**Detection:** standard deviation over mean, below 0.35. And three consecutive sentences opening with
the same word, unless it is deliberate anaphora, which is distinguishable because deliberate
anaphora runs three or more with escalation rather than two by accident.
