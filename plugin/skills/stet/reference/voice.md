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

## Derive it, do not ask for it

**Nobody can describe their own voice.** Ask an author how they write and you get aspiration:
"clear, friendly, authoritative". Every author says this. It is worthless as an instruction because
it excludes nothing.

So read the corpus and tell them what they actually do. They will correct you, and correction is
accurate where description is not.

## Do this

### 1. Read widely, then read the best of it closely

`ingest` gave you an inventory. Read across all of it for range, then pick the three or four pieces
the author is proudest of, or the ones that read strongest, and read those line by line.

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
