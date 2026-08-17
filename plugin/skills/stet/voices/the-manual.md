---
name: The Manual
group: core
description: Reference writing. It describes behaviour, and only the steps give orders.
feeling: None, on purpose, and for a reader who is already frustrated.
measured:
  sentenceMedian: 12
  sentenceMean: 13.4
  sentenceP95: 30
  sentenceMax: 321
  sentenceSdOverMean: 0.73
  shortSentences: 0.2
  longSentences: 0.06
  secondPerson: 0.13
  secondPersonReference: 0.035
  secondPersonProcedure: 0.257
  modalsPer10kWords: 130
  parensPer10kWords: 132
  crossRefsPer10kWords: 38.5
  emDashesPer10kWords: 3.5
  questions: 0.003
  exclamations: 0
  hedgesPerSentence: 0.03
sources: Linux man-pages (18 pages); GNU coreutils manual 9.11; Python 3 library reference (10 modules); MDN (15 pages); Kubernetes task documentation (93 files); Raspberry Pi documentation (78 files); GitHub Docs (72 files); Google developer documentation style guide, CC BY 4.0 (15 pages)
stet:
  state: draft
  author: agent
---

# The Manual

Counted from the texts: 320 files, 28,812 sentences and 385,405 words of real reference and task
documentation, split into a reference half and a procedure half because they behave differently.
The Microsoft Writing Style Guide is cited by rule only, since it is not freely reproducible.

## The one rule

**Complete beats readable.** A reference page is not read, it is consulted, by somebody who already
has a problem. Leaving out an edge case to keep a paragraph tidy fails the one person who came
looking for that edge case.

This is the only rule in the old version of this preset that survived measurement, and it survived
in a specific place: the register names its own limits. "undefined", "unspecified" and
"implementation-defined" run at 2.4 per 10,000 words in reference. That is the register's real moral
content, and it is the thing generated documentation cannot do, because a model has no way to know
that a result is not defined and so asserts one for every input.

**Yes:** "If the destination buffer is not large enough, the behavior is undefined." (`strcpy(3)`)

## The correction that matters most

**It describes behaviour. Only the steps give orders.**

The previous version of this preset said "tell them what to do: imperative, second person, present
tense", and that is backwards on both counts. It was describing a numbered step and calling it the
whole register.

Second person appears in 3.5 percent of reference sentences and 13 percent of the corpus. Nothing in
385,405 words reaches the 0.45 that preset asserted; the most reader-addressed corpus in the set,
GitHub Docs, reaches 0.325. The bare imperative opens 5.9 percent of reference sentences, where the
commonest opening word is "The" at 10.4 percent.

Inside a numbered list the picture inverts exactly as you would expect, at 45 to 53 percent
imperative openings and a median of 9 to 12 words. And numbered steps are 5 to 12 percent of the
sentences around them. The imperative step is real, it is short, and it is a structural minority of
the register that contains it.

**Yes:** "The file descriptor fd is not closed upon failure." (Python, `os`)
**Yes, in a numbered step:** "Click Add SSH key." (GitHub Docs)
**No, in running prose:** "Close the file descriptor when you are finished with it."

## Rules

### Condition before instruction

The conditional opener is the signature. "if" runs at 110.5 per 10,000 words in reference, and
conditional openers are 7.3 percent of all sentences.

**Yes:** "If p is NULL, no operation is performed." (`malloc(3)`)
**No:** "Click Save." with no statement of when Save is available.

### Qualify with a modal, never with an adverb

Modals run at 130 per 10,000 words, which is one every 77 words: "can" and "cannot" at 71, "may" at
20, "must" at 16, "should" at 15. The register does not say "typically" or "generally".

**Yes:** "Some filesystems may not implement the flag." (`open(2)`)
**No:** "This generally does not work on all filesystems."

A warning about this project's own tooling: `measure` reads this register as almost unhedged, at
0.03 per sentence, because none of "may", "can", "must", "should" or "will" is in the `HEDGES` list
in `lib/prose.mjs`. The most systematically qualified prose in this library scores as the least.

### Put the edge case in brackets

181.6 opening parentheses per 10,000 words in reference, and 381.1 in man page prose, which is one
every 26 words. The caveat is bracketed inside the sentence that needs it rather than promoted to a
sentence of its own.

### State the default with its alternatives

**Yes:** "The WHEN argument defaults to 'always' and can also be 'auto' or 'never'." (`ls(1)`)

### Document the precedence

**Yes:** "If contradictory --include and --exclude options are given, the last matching one wins."
(`grep(1)`)

### Send the reader somewhere

"see" or "refer to" runs at 38.5 per 10,000 words across the corpus and 91.0 in GitHub Docs, whose
single commonest sentence shape is "For more information, see ...". The previous preset banned this.
Google's guide instructs the opposite: do not repeat a procedure, link to it.

### Open a task page by saying what it does

**Yes:** "This page shows how to create an external load balancer." (Kubernetes)

The previous preset banned preambles. Google requires one by rule and the task corpora carry them as
a template convention.

### Contractions are fine

47.3 per 10,000 words, present in every corpus measured. This is not a formal register.

## Never

- **Never a question.** 0.003 of sentences, and zero across the Python and MDN samples.
- **Never an exclamation mark.** 39 in 385,405 words.
- **Never an em dash.** 136 in the corpus, and zero in both the GNU coreutils manual and the man
  page option glosses. Procedure documentation runs one em dash in 161,019 words.
- **Never first person singular.** 0.9 per 10,000, and nearly all of that is "I/O".
- **Never the marketing verbs.** "leverage", "robust" and "seamless" are at 0.0 per 10,000 in
  reference.
- **Never past tense for current behaviour.** Where reference uses it, it is version history.
- **Never a uniform sentence length.** The standard deviation over mean is 0.73 with a tail to 321
  words, the longest being in the GNU coreutils manual.

One rule here is a correction rather than a description, and it is worth keeping while being honest
about that. **Never "simply", "just" or "easy".** Google bans them, and the practice does not obey:
they run at 4.9 per 10,000 across the corpus, 11.1 in the GNU coreutils manual, and `open(2)` uses
"simply". They tell a reader who is stuck that their problem is beneath notice, which is the one
thing this register exists not to do.

## How pastiche fails

**Second person inflation, by three to thirteen times.** In a 1,000-word sample, real reference
carries about 3 instances of "you" and real task documentation about 27. Generated manual prose
typically runs 60 or more.

**Imperative inflation, about five times, outside a numbered list.** Both major style guides push
verb-initial sentences and both are prescribing against the practice. Count verb-initial sentences
that are not list items: above 15 percent is pastiche.

**Tail flattening.** Imitation writes the median and drops the tail, landing near 0.45 to 0.55. Real
is 0.73, and a 1,000-word sample holds about 4 sentences of 30 words or more. Generated prose holds
zero, because it breaks every long sentence in two.

**Em dashes.** The cheapest test in the register and close to binary: a 1,000-word sample of real
documentation contains none about 70 percent of the time.

**Hedge substitution.** If a passage contains more instances of "generally" than of "may", it is not
a manual whatever it looks like. This failure is invisible to `measure` as currently written.

**Cross-reference suppression.** Prose that never sends the reader anywhere reads as a self-contained
essay, which is exactly what a reference page is not.

**The missing conditional.** A page of instructions with no conditions in it was written by somebody
who has not run the software.

**Parenthesis avoidance.** Machine-written documentation promotes every caveat to its own sentence,
which reads tidier and scans worse. A parenthesis rate below about 60 per 10,000 words is the tell.

### The one-pass test

Take 1,000 words and count five things: instances of "you", em dashes, sentences of 30 words or
more, opening parentheses, and instances of "may" plus "must" plus "should".

| | you | em dashes | long sentences | parens | modals |
|---|---|---|---|---|---|
| real reference | 3 | 0 | 6 | 18 | 6 |
| real task documentation | 27 | 0 | 4 | 7 | 5 |
| machine pastiche | 60+ | 3 to 5 | 0 | 4 | 1 |
