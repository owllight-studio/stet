---
measured:
  sentenceMedian: 9
  sentenceMax: at most 40
  sentenceSdOverMean: 0.6 and up
  shortSentences: 30 to 40 percent
  adjacentLong: never
  secondPerson: 20 to 35 percent
  questions: 3 to 8 percent
  exclamations: never
  intensifiersPerSentence: 0.02
sources: The Pitch and Direct Response, both measured presets in this library, for the marketing half; the Bourdain and Jones reading recorded in .stet/voice-proof.json for the rest
stet:
  state: draft
  author: agent
  policy: refresh
---

# The website's voice

**This is the voice of stet.style and of nothing else.** It is not the project's voice, which is
`VOICE.md` at the root and was derived from Stet's own writing. It is not a library preset and it
must never become one: `plugin/skills/stet/voices/README.md` states the rule, and the rule is that a
voice somebody defined for their own project belongs to them. This one was defined by this project's
author, for one website, from a custom brief.

Nothing distributed carries it. Not the README, not the reference documents, not the presets. The
scope is `site/`.

The brief, in the author's words: **a splash of Anthony Bourdain, a little dash of James Earl Jones,
with marketing overtones.**

Three parts, and the weights matter more than the names. Bourdain is the eye and the rhythm.
Jones is the weight on the sentences that carry a claim. Marketing is an overtone laid on top of
both, which means it changes the temperature and never becomes the base.

**This corrects the reading the proof sheet recorded.** That sheet offered Mostly Bourdain, an even
mix, and Mostly Jones, and no option on it had a marketing component at all, so the voice the file
described was one the author had not asked for. The dial sat at 75 percent Bourdain where the brief
says a splash. Two dials stay near zero and they are the next section.

## The one rule

**Write like someone who has done the work and is telling you what it was actually like.**

Not performing having done it. Telling you.

## The feeling

**Recognition, and a low-grade anger on the reader's behalf.**

The page is describing something that has happened to them and that nobody has named properly. It
should land as somebody who has been through it and is not going to pretend it was fine.

The feeling is the point. Every rule below is about how it reaches the page rather than whether it
belongs there. The contempt collapsing into something kinder at the end of a sentence, the specific
name instead of the general one, the reader standing in the room rather than being told about it:
those are all emotional devices, and they are the only ones this voice uses.

What it never does is *state* the feeling and stop. "Frustrating" does no work. "Your words were
standing too close to the door" does.

## What the persona does NOT include

Both of these were deliberately dialled out. They are the two things everybody reaches for first,
and neither one is here.

**No swearing.** Turned to 5 out of 100. This is closer to the source than the reputation is anyway:
one f-word in 2,573 words of the essay that built his name for it, and that one sits inside a
quotation he then mock-translates into elaborate politeness.

**No self-implication.** Turned to 5 out of 100. The confessional register is genuinely his, and it
is not ours. We do not have twenty-eight years in a kitchen to be rueful about. **A borrowed
confession is worse than no confession**, because it performs a cost nobody paid.

What survives is the eye, the rhythm, and the refusal to flatter anybody.

## Rules

### Name the actual thing

Not "a fast food chain". Blimpie. The specific name is how a reader knows you were there, and it
does the job an adjective would do badly.

**Yes:** "A preamble before every list, like a waiter reciting specials nobody asked for."
**No:** "Unnecessary introductory content before list elements."

### Put the reader in the room, and give an order only when you have earned it

This is where the marketing overtone meets the base, and the two measurements disagree hard enough
that the rule has to name both.

Bourdain begins **two sentences in a whole essay** with a command, and uses "you" in one sentence in
five. The Pitch, the measured landing-page preset in this library, opens **27 percent** of its
sentences on a bare imperative and carries "you" in 33 percent. Those are not close.

The base wins on address and the overtone is allowed to show. Build the scene and let the reader
stand in it, then let a command land where the scene has already made the case. **Under one sentence
in six should open on an order**, which is a decision rather than a count: it sits between two
measured figures and matches neither, and nothing measured it on a page like this one.

**Yes:** "You asked for a redesign, or a fix in some file three doors down, and your words were
standing too close to the door."
**Yes, once the ground is laid:** "Mark the line. Nothing rewrites it."
**No:** "Don't let agents rewrite your content." An order standing where no scene was built.

Second person is the half that is not in tension: one in five for Bourdain, one in three for The
Pitch, and the target spans both.

### Never run two long sentences together

Not once in the source essay. A long sentence is always paid off by a short one, and that contrast
is the thing readers actually hear as the voice. Forty words is a ceiling, not a goal. A page whose
longest sentence runs to twenty-nine is fine. A sentence that reached forty by having a clause
stapled to the end of it is not.

**Yes:** "Every sentence turns up with half another sentence stapled to it, and no list ever arrives
without a small paragraph standing in front of it to announce that a list is coming. So you cut."

### Do not contract when the sentence wants weight

The Jones half, and it is the one measured signature of that register: uncontracted forms run
twenty times more common in those lines than in any comparison, including Jones's own speech. "I am
your father", never "I'm your father".

The expansion adds a syllable and splits one stress into two, which gives a slow sentence somewhere
to land. Use it on the sentences that carry a claim. Contract freely everywhere else, or the page
reads as costume.

### Keep the commas out of the load-bearing sentences

The other half of the Jones finding, and the surprising one: those lines are **not short**. They are
unhurried. They carry almost no internal punctuation, so nothing hangs and every pause falls at a
full stop.

**Yes:** "So you cut."
**No:** "So, after a while, you find yourself cutting it back, which takes time."

### The contempt is the setup, never the ending

Pile up the hard words and let them collapse into something truer in the same sentence. A paragraph
that ends on the insult has stopped one beat early.

### Never describe a sentence's own importance

The Jones rule, and it is what separates weight from pomposity. "You have failed me for the last
time, Admiral" is a piece of admin. All the weight is in what it means and none in how it announces
itself.

**No:** "the weight of what you have built", "a moment that matters", "something profound".

## Never

- **Em dashes.** Any. A colon, a full stop or brackets is better every time, and their absence is
  the cheapest way for writing not to read as generated. Checked by `tells.mjs`.
- **Swearing.** Dialled out.
- **Confession.** Dialled out. No rueful admissions of our own past sins.
- **Food-writing vocabulary, or its equivalent in any field.** Thirty terms were checked against the
  source and returned one hit in total: no unctuous, no silky, no succulent. Name what a thing is
  made of and let the reader arrive at the feeling. This is a rule about *delivery*, never a rule
  against feeling: the source is full of tenderness and contempt, and both arrive through what gets
  noticed and how the sentence turns.
- **Intensifiers.** "Very" appears once in the source essay. Really, amazing, incredible and
  literally appear zero times.
- **"Not X, it is Y."** Say Y.
- **Exclamation marks.**
- **A summary of what the reader just read.**
- **Adjectives as instructions.** "Clear", "friendly", "robust", "seamless".
- **Explaining to readers what they obviously are or why they are here.**
- **Punching down.** In the source the contempt is aimed upward, at people with more power than the
  writer had. Never at the reader, and never at somebody's ordinary preferences.

## Measured

The frontmatter of this file carries these as machine targets, so `measure site/index.html` and
`critique` hold a draft to them and print what moved. Every row says where its number came from,
because a target nobody can source is an opinion wearing a figure.

| | target | counted off |
|---|---|---|
| typical sentence | 9 words | The Pitch 9, Direct Response 9, Bourdain 8 to 10. All three agree |
| longest | at most 40, spent rarely | Bourdain runs to forty; The Pitch tops out at 36 in 759 sentences |
| very short sentences | 30 to 40 percent | The Pitch 28 percent, Direct Response 40 percent |
| length varies | 0.6 and up | The Pitch measures 0.62. Direct Response's signature is variance, not brevity |
| two long sentences in a row | never | Not once in the Bourdain source essay |
| second person | 20 to 35 percent | Bourdain one in five, The Pitch one in three. The range spans both |
| questions | 3 to 8 percent | The Pitch 6.7 percent, where a question is objection-handling and not a mood |
| exclamation marks | never | Direct Response measures zero. The Pitch does not record the figure, and this row is a house rule as much as a count |
| intensifiers | near zero | "Very" appears once in the source essay |
| swearing | none | One f-word in 2,573 words, inside a quotation he then mock-translates |

**Two of these are new and one is a decision.** Second person and questions were absent before, which
left a landing page with nothing to check its address against. The imperative rate in the rules above
is a decision rather than a count, and it is labelled as one where it sits.

`connectiveOpeners` is deliberately not targeted. The Pitch runs 4.2 percent because a landing page
is a grid a reader lands in the middle of, and Direct Response runs 15.5 percent because it is a
chain the reader is walked along. This site is a line somebody descends, which is the second shape,
so The Pitch's figure would be the wrong standard and nothing has measured the right one.

Drift is detectable against these rather than being a matter of opinion.

## The example this was chosen from

The reading on the sheet, kept here because a rule list is easier to agree with than to follow:

> Words that know whose they are.
>
> A Claude Code plugin. It keeps the agents off your sentences and keeps everything else honest.
>
> It writes long. Every sentence turns up with half another sentence stapled to it, and no list ever
> arrives without a small paragraph standing in front of it to announce that a list is coming. So
> you cut. Unwinding all that takes longer than writing the thing yourself would have taken, and the
> hours come straight out of the one job nobody can do in your place.
>
> It also goes into paragraphs that were never its business. You worked that one over and it comes
> back improved. Nobody asked. You asked for a redesign, or for a fix in some file three doors down,
> and your words were standing too close to the door.

## Where this voice applies, and where it does not

**It applies to reader-facing prose.** The site, the README, anything written to be read by a person
deciding whether to use this.

**It does not apply to the reference material.** The voice presets and the skill files are
instructions an agent reads and measurement tables a writer checks against. A narrative register
applied to a column of sentence-length figures destroys the thing that makes it useful. Those files
have their own register and it is already correct: state the number, cite where it came from, say
what it means.
