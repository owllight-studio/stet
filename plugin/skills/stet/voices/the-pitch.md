---
name: The Pitch
group: marketing
description: A landing page. Each block makes one claim, and the blocks do not connect.
feeling: Landing in the middle of it and knowing at once what this is.
measured:
  sentenceMedian: 9
  sentenceMean: 9.8
  sentenceP95: 22
  sentenceMax: 36
  sentenceSdOverMean: 0.62
  shortSentences: 0.28
  longSentences: 0.0013
  blocksOneSentence: 0.71
  blockMedianWords: 10
  secondPerson: 0.33
  imperativeOpeners: 0.27
  addressedSentences: 0.48
  connectiveOpeners: 0.042
  questions: 0.067
  pastTenseMarkers: 0.009
  semicolons: 0
  softenersPerSentence: 0.04
sources: 16 software home pages fetched 17 August 2026 (stripe, basecamp, hey, fly.io, buttondown, plausible, posthog, linear, intercom, ghost, honeycomb, tailwind, obsidian, supabase, mailchimp, wistia), 759 sentences and 528 copy blocks; compared against Hopkins, Scientific Advertising 1923, 1,853 sentences
stet:
  state: draft
  author: agent
---

# The Pitch

Counted from the pages: 759 sentences, 7,457 words and 528 copy blocks across 16 software home
pages, fetched on 17 August 2026, with the navigation, headings, button labels and footers separated
out first because counting the furniture would have described the chrome rather than the writing.
Measured against *Scientific Advertising* run through the same code, which returned 1,853 sentences
against the 1,854 the Direct Response preset records.

## The one rule

**Each block makes one claim, and the blocks do not connect.**

The previous version of this preset said the *page* makes one claim, and that a page making three
claims makes none. That is false of all 16 pages measured. The median page runs 15 subheadings and
33 copy blocks; Stripe runs 30 and 85.

The rule is right one level down. The median block is 10 words, 71 percent of blocks are a single
sentence and 91 percent are one or two. And the blocks are deliberately not glued together:
sentence-initial connectives run at 4.2 percent and anaphors at 1.1 percent, so the modules are
order-independent.

That is the register's whole architecture, and it follows from how the page is read. The reader
arrived from a search and landed at the fourth section. There is no order to rely on, so the copy
removes the glue and puts a bare verb at the front of every claim instead.

**Yes:** "Nothing to Manage" over "The agent does the setup, and you get your afternoon back."
(fly.io)

## Against Direct Response, which is the other marketing preset

The two are **metrically indistinguishable at sentence level**. Median 9 against 10, mean 9.8 against
11.3, standard deviation over mean 0.62 against 0.75, quantity density 1.65 against 1.83 per 100
words, unfalsifiable superlatives 27 against 24 per 10,000 words. Anything trying to separate them on
sentence length or on how many numbers they carry will fail.

They separate completely on cohesion and address.

| | The Pitch | Direct Response |
|---|---|---|
| sentence-initial connective | 4.2 percent | 15.5 percent |
| imperative opener | 27 percent | 5.1 percent |
| you or your | 33 percent | 12.3 percent |
| sentences of 40 words or more | 0 in 759 | 7 in 1,853 |

**Direct Response is a chain the reader is walked along. The Pitch is a grid the reader lands in the
middle of.** Hopkins glues one sentence to the next nearly four times as often because every element
exists to get the next element read, and that requires an order.

The test, in one pass: under 5 percent sentence-initial connectives is The Pitch, over 12 percent is
Direct Response. Confirming: over 20 percent imperative openers is The Pitch, under 10 percent is
Direct Response.

## Rules

### Address by verb, not by pronoun

27 percent of sentences open on a bare imperative, rising to 40 percent on pages that lead with the
capability. Counting pronouns understates the address by nearly half: 33 percent of sentences carry
"you", and 48 percent are addressed once the elided imperatives are included.

**Yes:** "Turn any page into a goal." (plausible.io)

### The claim as a subtraction

"No" is the fourth commonest sentence-opening word in the corpus, and 10.5 percent of sentences
carry a negation. A negative claim is self-proving in a way a positive one is not: the reader
verifies it by not finding the thing. It needs no number, no testimonial and no mechanism, which is
why a register that proves almost nothing numerically leans on it this hard.

**Yes:** "No cookies, just insights." (plausible.io)
**Yes:** "No investors. No bullshit." (ghost.org)
**Yes:** "Nobody pastes a token." (fly.io)

### The objection asked as a question, answered in the next block

The question is this register's objection-handling device, and it is a form rather than a mood. 6.7
percent of sentences overall, and 12 percent on pages that lead with the reader's situation.

**Yes:** "Tired of tool overload?" (wistia.com)
**Yes:** "Don't code?" (stripe.com)

### The consequence, not the feature

**Yes:** "The bill goes to zero when nobody's home." (fly.io) A billing model restated as an event.

### Name the incumbent

7 of 16 pages name a rival or the status quo. plausible.io names Google Analytics nine times.

### Present tense, to the point of an absolute

Under 1 percent of sentences carry a past-tense marker, and where they do it is an origin story.

### The signed letter as its own movement

Three of the sixteen close with a first-person letter over a name, and that is where the corpus's
first person concentrates: 17 percent of sentences on problem-first pages against 3 percent
elsewhere.

**Yes:** "Tell me if this sounds about right." (basecamp.com)

## Two branches, and the thing that does not vary

Splitting the corpus by whether a page opens on the reader's situation or on the product's category
separates almost everything.

| | problem-first, 7 pages | capability-first, 9 pages |
|---|---|---|
| questions | 12 percent | 1 percent |
| imperative opener | 14 percent | 40 percent |
| we, our, I | 17 percent | 3 percent |
| hedges per sentence | 0.07 | 0.01 |
| **second person** | **0.32** | **0.34** |

Second person is identical across two branches that read nothing alike. So the answer to whether
landing pages address the reader as much as this preset assumed is yes, the figure was right, and it
is the wrong thing to measure.

Note that nine of sixteen pages lead with the category, including Stripe's "Financial infrastructure
to grow your revenue". The old rule "lead with what it does, not what it is" is violated by the most
admired page in the corpus. It survives as advice for a reader who does not yet know the category
exists, and it does not survive as a description.

## Never

- **Never a semicolon.** 0 in 7,457 words.
- **Never a sentence of 40 words.** 0 in 759, and only one reaches 30.
- **Never manufactured urgency.** It appears three times in sixteen pages, all on one page, all of
  it explicit parody of the direct-response cadence.
- **Never past tense except in an origin story.**
- **Never glue the blocks together.** The reader did not start at the top.

One rule here is advice rather than observation, and it should be labelled as such. **Superlatives
without a measurement** run at 27 per 10,000 words in this corpus, and Hopkins runs 24, so the man
whose preset carries the prohibition breaks it at the same rate. The distribution is the useful part:
five pages run zero, and Mailchimp runs 149. The pages people cite for their copy cluster at the
bottom. Keep it as craft advice and do not pretend it describes the register.

## How pastiche fails

**It writes a page-length argument.** The single commonest failure, and it follows from the old rule.
Generated pages build to something. Real ones are 33 independent modules and the reader is expected
to enter at any of them.

**It glues.** Connectives above 12 percent means Direct Response has been written instead, and the
two are otherwise so close metrically that this is the only reliable separator.

**It grows a tail.** One sentence in 759 reaches 30 words here and nothing reaches 40. Compare Noir,
which runs 4 to 97 words inside one book. The Pitch has almost no long tail at all, and that hard
right wall is the most distinctive thing about its metrics.

**It proves things.** Roughly 4 percent of claims in the corpus carry a checkable performance number.
Imitation reaches for statistics because the preset asked for proof; the register reaches for a
subtraction, which is checkable without being numeric.

**It reaches for the pronoun and misses the verb.** Address by imperative is 5.3 times commoner here
than in Hopkins, and it is invisible to anybody counting "you".

**It runs one branch's habits on the other.** Questions and first person belong to the problem-first
page. Imperatives belong to the capability-first page. A page carrying all four at once reads as a
composite of two things nobody wrote.
