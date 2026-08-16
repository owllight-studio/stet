---
stet:
  state: draft
  author: agent
---

# stet voice

Derive the house voice from writing that already exists, or define it from nothing. Writes
`VOICE.md`.

This is the file that gets loaded before every `write`, `tighten` and `clarify`. It is the one
artifact that determines whether generated content is usable or has to be rewritten by hand, which
in practice means it is the most valuable file in the project.

## Four sources, and they compose

A voice is built from evidence. There are four kinds and an author may bring any combination: start
from a preset, bend it with a persona, feed it their own writing, and let it read the project. All
four feed one derivation, and the output is always the same file.

| Source | What it is | How to get it |
|---|---|---|
| **preset** | a register from Stet's library | `node ${CLAUDE_PLUGIN_ROOT}/skills/stet/scripts/voices.mjs` |
| **persona** | a description, turned into rules | the author's words, in the request |
| **samples** | their writing from elsewhere | files, URLs, Drive documents, pasted text |
| **project** | the corpus already here | `ingest` found it |

Ask which they have. Do not assume the project is the only source just because it is the one you can
read without asking.

### On presets

Offer the library rather than describing it. Show the list, grouped, and let them pick. A preset is
a starting point and never a finished voice: it goes into `VOICE.md` composed with everything else,
and nothing reads the preset file again afterwards.

### On personas

"Anthony Bourdain and James Earl Jones narrate my writing." "A child who only knows what a crayon
is." "A PhD mathematician." These are real and usable requests, and the way to honour them is not
imitation.

**Extract the qualities into rules.** What makes that voice recognisable? The concrete noun over the
abstract one. The aside that undercuts the reverence. The short sentence after the long one. Write
those as rules with examples, the same as any other source.

Pastiche is a party trick that falls apart by the third paragraph. Rules are usable, transferable,
and the author's own. When a persona names a real person, you are extracting technique, not
impersonating them, and the difference shows in whether the result still works on the fourth page.

**A persona always gets the two extra steps below: research it, then show it.** Never both at once
and never neither. Writing a persona straight from the request is the single most reliable way to
produce something the author rejects, and the reason is in the next section.

**And the voice that comes out belongs to the author.** Not to Stet, not to the preset library, not
to the next project. A persona is somebody's own answer to how their writing should sound, so
tidying it up into a shipped preset is taking their answer and handing it to everybody. The research
behind it goes the same way: it was commissioned for their brief.

The rule is short. **Research it for them, write it into their `VOICE.md`, and leave it there.** A
library that absorbs what its users invent is doing exactly what the hook exists to stop an agent
doing to a paragraph, only at the scale of a whole voice.

### On samples

The strongest evidence there is, because it already happened. Read whatever they can point at: files
in the repo, a URL, a Google Doc, text pasted into the conversation. Read enough for range: their
best piece and their most ordinary one say different things and the voice is both.

### On the project

What `ingest` already read. If the author is adopting Stet on an existing site, this is where you
start, and where the current corpus can correct a preset that does not quite fit.

## Derive it, do not ask for it

### 1. Research the persona before writing a word of it

**Mandatory whenever the persona names a real person, a real publication, or a named register.** Not
optional, not skippable because the voice seems obvious, and least skippable when it seems obvious.

Send subagents at the actual texts. Have them count: sentence length and variance, what the register
refuses, which of its famous features are actually rare in it. Then write the rules from the counts.

The evidence for making this a step rather than a suggestion is Stet's own library. Six presets were
first written from instinct by someone who knew the registers well, then measured. **All six had
their central mechanic wrong, and wrong in direction rather than magnitude.**

- Nature documentary was written as long-then-short rhythm. Measured autocorrelation is +0.16, so
  the lengths *cluster*. The opposite.
- Noir was built around the simile, which is the register's rarest move: one per 545 words in
  Chandler, one per 1,969 in Hammett. Pastiche runs it forty times too often.
- The Teacher was written short. Measured medians are 19 to 25 with wide variance, and uniform
  length is a documented marker of condescension rather than of kindness.
- Plainspoken cited Orwell, who fails modern plain-language guidance inside his own manifesto at a
  mean sentence of 25.9 words.
- Christie is believed to be adverb-free. She uses nearly twice as many as Doyle. Her prose is plain
  because the sentences are short.

Every one of those is a rule an author would have accepted, followed, and been misled by. **An
impression of a voice is reliably an inversion of it**, because what makes a register memorable is
usually its rarest move rather than its habitual one.

Say what you could not verify. A brief that admits three gaps is worth more than one that fills them
from memory, and the gaps become the next round of work.

### 2. Measure what can be measured

Run `node ${CLAUDE_PLUGIN_ROOT}/skills/stet/scripts/voice-stats.mjs` for the mechanical half:
sentence length distribution, paragraph length, question rate, second-person rate, hedge words,
passive constructions, list-to-prose ratio, heading density.

Numbers here beat impressions. "Median sentence 14 words, and the longest 5% carry the arguments"
is a usable instruction. "Concise" is not.

### 3. Find what it refuses to do

This is the part that makes a voice a voice, and it comes out of comparison rather than reading.
Take a paragraph from the corpus and write the generic version of it in your head. The difference is
the voice.

Look for:

- **Constructions it never uses.** No exclamation marks. No rhetorical questions. No "let's dive in".
- **Constructions it always uses.** Instruction first, then the number. Short sentence after a long
  one. The caveat kept rather than cut.
- **What it does with numbers.** Buried in prose, or given their own line.
- **How it opens.** Straight into the answer, or a paragraph of throat-clearing.
- **How it handles uncertainty.** Hedged, or stated flatly with the doubt named.

### 4. Show the author, in their own words

Present the derived voice as **rules with real examples pulled from their writing**, and a
counter-example you wrote for each. The counter-example is what makes a rule land: it is easy to
agree with "be concise" and impossible to argue with two versions of the same sentence side by side.

Ask them what is wrong with it. Expect two or three corrections and one thing they did not know they
did.

### 5. Put it on a proof sheet, and let them tune it

**Required for any persona.** A one-line persona has several honest readings, and the author knows
which one they meant the moment they see it and not one second before. Asking them to describe it
further only produces another sentence with the same problem.

```
node ${CLAUDE_PLUGIN_ROOT}/skills/stet/scripts/voice-proof.mjs
```

It reads `.stet/voice-proof.json`, which you write first:

```json
{
  "persona": "Anthony Bourdain, with a dash of James Earl Jones",
  "findings": ["what the research counted, one line each"],
  "sample": { "file": "index.html", "text": "a real passage from their project" },
  "axes": [
    { "key": "profanity", "label": "Profanity", "low": "none", "high": "unfiltered", "value": 30 }
  ],
  "variants": [
    { "id": "a", "label": "The kitchen", "brief": "why this is a defensible reading", "text": "" }
  ]
}
```

Four things it has to get right, and they are the difference between this and a generic variant
picker.

**One passage, several readings.** Every variant is the *same real paragraph from their own
project*. The question is which one sounds like their site, and that question is unanswerable if
each version is also about something different.

**The dials come from the research.** Every persona yields its own axes, and the script renders
whatever you hand it rather than shipping a fixed set. A dial the author cannot justify is a dial
they will not move, which is why the findings sit on the page beside them.

**Three to five variants.** They must be genuinely different readings and each `brief` must say why
that reading is defensible. Two is a false choice, and past five nobody reads the last one.

**Their edits are theirs.** The sheet is editable in place. A passage they corrected by hand is
their sentence and gets recorded as such, exactly as on the content proof sheet.

It writes `.stet/voice-choice.json` when they pick, including every version they rejected and what
they said about it. **Read the rejections.** What an author turned down says as much about the voice
as what they kept, and it is the material for the rules in the next step.

## VOICE.md

Rules, each with a real example and a counter-example. No adjectives standing alone.

```markdown
# Voice

## The one rule
If every other rule were lost, keep this one. State it in a sentence.

## Rules
### Lead with the instruction, then the number
**Yes:** "Start your ramp about 19 seconds out. That is the median across logged runs."
**No:** "Analysis of logged runs indicates a median ramp initiation of 19 seconds."
Why: the reader came for what to do. The evidence supports it; it does not precede it.

### [next rule, same shape]

## Never
A flat list. Constructions, words, and moves this voice does not make. No explanation needed for
most of them.

## Measured
Median sentence length, paragraph length, and anything else with a number, so drift is detectable
rather than a matter of opinion.
```

## The rules that keep coming back

Not universal, but common enough to check for. Do not paste them in; check whether the corpus does
them, and only write down the ones it does.

- Lead with the instruction, then the evidence.
- One idea per sentence. A comma plus a "which" is usually two sentences.
- Cut every qualifier that does not change the meaning.
- Do not explain to readers what they obviously are or why they are here.
- Never write implementation talk into reader-facing copy.
- Write the short version first. Trimming a long one leaves the qualifiers in.

## Do not

- **Do not write a voice the corpus does not have.** You are documenting, not directing. If the
  author wants a different voice that is a separate decision and they should say so out loud.
- **Do not use adjectives as rules.** "Friendly", "authoritative" and "conversational" are not
  instructions. They cannot be followed or violated.
- **Do not skip the counter-examples.** A rule without one is agreed with and then ignored.
- **Do not derive a voice from three files.** Range matters. The FAQ and the landing page are
  different registers and both are the voice.

## Done when

`VOICE.md` exists, every rule has an example from real writing and a counter-example, the author
corrected at least one thing, and the measured section has numbers in it.

For a persona, add two: the rules came out of counted texts rather than an impression, and the
author picked from a sheet rather than approving a description.
