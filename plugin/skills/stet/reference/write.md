---
stet:
  state: draft
  author: agent
---

# stet write

Author a piece in the house voice, in the place the IA says it goes.

## Before writing a word

Load all three, and say so if any is missing rather than proceeding without it.

| | why |
|---|---|
| `VOICE.md` | the rules, the never list, and the targets you will be measured against |
| `IA.md` | where this goes, what job it does, and what it must not duplicate |
| the neighbours | the two or three existing pages nearest this one |

**Reading the neighbours is not optional.** A voice file describes the register and the neighbours
show it operating, and the gap between those two is where most drift lives.

## What you are allowed to produce

A new file is a **draft**, authored by the agent, and it says so in its own metadata. That is not a
formality. It is the difference between something the author can rewrite freely and something they
have to argue with.

Never mark your own work `approved`. Approval is what confers ownership, and an agent approving its
own draft is the exact failure the model exists to prevent.

## Write it

Then check it, in this order, because each check is cheaper than the one after it.

```
node ${CLAUDE_PLUGIN_ROOT}/skills/stet/scripts/tells.mjs <file>
node ${CLAUDE_PLUGIN_ROOT}/skills/stet/scripts/measure.mjs <file>
```

`tells` catches the constructions the voice bans outright. `measure` holds the draft to the voice's
own figures and exits non-zero on drift.

**Drift is a prompt to look, not an order to obey.** A piece can legitimately sit outside the
targets: a reference page is denser than an essay, and a landing page is shorter than both. What is
not legitimate is drifting without noticing. If you are outside the range, say which metric and why,
and let the author decide.

## The one failure mode worth naming

**Writing to the middle of every range at once.** A draft that lands exactly on the median sentence
length, the median paragraph, and the median hedge rate has hit every target and has no rhythm,
because the targets describe a distribution and the middle of a distribution is not a sample from
it.

The measured evidence is in the voice library: every register that was counted runs a standard
deviation between half and four fifths of its mean, and prose whose sd over mean falls below about
0.35 reads as machine-written regardless of what the other numbers say. **Vary hard, then check the
median.** Not the other way around.

## Hand it over

Do not present a draft as finished prose in the reply. Put it on the proof sheet, where it can be
read block by block, corrected in place, and sent back:

```
node ${CLAUDE_PLUGIN_ROOT}/skills/stet/scripts/proof.mjs <file>
```

Anything the author corrects there becomes theirs, per sentence, and nothing will rewrite it again.

## Never

- Never write into a project that has not been read. `ingest` first.
- Never invent a figure. If a number is not in a source or in the conversation, do not write one.
  A number with nothing behind it is the failure `verify` exists to catch, and writing one on
  purpose is worse than typing one by accident.
- Never write a claim you cannot attribute, in a project that has sources.
- Never mark your own work approved.
- Never skip the neighbours because the voice file was detailed.

## Done when

The file exists, is marked draft, passes `tells`, has been measured with any drift explained rather
than hidden, and is on a proof sheet rather than in a reply.
