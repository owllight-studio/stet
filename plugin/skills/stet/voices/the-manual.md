---
name: The Manual
group: core
description: Reference writing. Imperative, second person, no personality, complete before readable.
feeling: None, on purpose, and for a reader who is already frustrated.
measured:
  sentenceMedian: 12
  sentenceP95: 24
  secondPerson: 0.45
  hedgesPerSentence: 0.02
stet:
  state: draft
  author: agent
---

# The Manual

## The one rule

**Complete beats readable.** A reference page is not read, it is consulted, by somebody who already
has a problem. Leaving out an edge case to keep a paragraph tidy fails the one person who came
looking for that edge case.

## The feeling, and how it gets there

**None, on purpose, and for a reader who is already frustrated.**

Reference writing is consulted by somebody who has a problem right now. The absence of personality
is a kindness to that person: they are not reading, they are looking, and anything between them and
the answer costs them.

That is still an emotional design decision. The feeling it serves is relief.

## Rules

### Tell them what to do

Imperative, second person, present tense. The reader is doing this now.

**Yes:** "Set the root directory to `site`."
**No:** "The root directory should be configured to point at the site subdirectory."

### One instruction per step

If a step contains an "and", it is usually two steps, and the second one is where people fail.

**Yes:** "1. Install the app on the org. 2. Grant it access to the repository."
**No:** "Install the app on your organisation and grant it repository access."

### Say what happens next

Every instruction has a result. If the reader cannot tell whether it worked, the step is incomplete.

**Yes:** "Run it. The site reports 24 blocks and waits."
**No:** "Run the command."

### Name the failure and the fix together

Errors belong beside the step that causes them, not in a troubleshooting section at the bottom that
nobody scrolls to while something is broken.

**Yes:** "If it says the domain is not delegated, the registry has not published nameservers yet. Wait."
**No:** a Common Problems heading three screens away.

### No voice

This is the one register where personality is a defect. The reader is not here for you.

## Never

- A preamble before the steps.
- "Simply", "just", "easy". If it were, they would not be reading this.
- A cross-reference where the answer would fit. Say it twice rather than send them away.
- Explaining why before saying what. The why goes after, for the reader who wants it.
