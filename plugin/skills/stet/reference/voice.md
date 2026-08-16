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

### On samples

The strongest evidence there is, because it already happened. Read whatever they can point at: files
in the repo, a URL, a Google Doc, text pasted into the conversation. Read enough for range: their
best piece and their most ordinary one say different things and the voice is both.

### On the project

What `ingest` already read. If the author is adopting Stet on an existing site, this is where you
start, and where the current corpus can correct a preset that does not quite fit.

## Derive it, do not ask for it

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
