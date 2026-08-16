---
stet:
  state: draft
  author: agent
---

# stet proof

A proof sheet in the browser. The author reads drafts in context, keeps them, corrects them, or
sends them back with a query, and every decision writes the right state without anyone thinking
about it.

This is the only surface in Stet that is not a terminal, and it exists because the two things only
an author can do are both awkward in a chat: reading a page as a page, and correcting one sentence
in the middle of it.

## The rules it encodes

**Approval confers ownership.** Keeping a draft makes it `approved`. It stops being yours to change.

**Editing confers authorship, sentence by sentence.** If the author corrects a line, that line
becomes theirs and closes to you permanently. Only that line. The paragraph around it, and the rest
of the file, stay exactly as owned as they were. Recording it any wider would have the tool claim
they wrote things they never touched.

**A retry is not a rejection.** The sheet rewrites the block itself: it shells out to a fresh
`claude -p` with the house voice, the block and the author's note, and swaps the result in place so
they can keep working without leaving the page. The block goes back to undecided, because a rewrite
is still the agent's work until somebody accepts it.

**Save and Publish are different acts.** Save applies only what the author decided and leaves
everything else a draft, because silence is not approval. Publish approves everything they did not
send back, because pressing a button that says Publish is exactly what approval looks like. A block
they queried is never published: they asked for it to change, so they cannot have meant to approve
it in the same breath.

**Every decision can be taken back.** Clicking an action again clears it, and Revert restores the
block exactly as it arrived and drops the decision with it. A choice you cannot undo is a choice
nobody makes freely, and a review surface people are wary of is one nobody finishes.

## Do this

### 1. Gather what needs reading

Every block whose state is `draft`, in document order, with enough of its surroundings to be read in
context. A paragraph reviewed alone is reviewed badly.

Where you produced alternatives, put them on the sheet together. The author picks one, and picking
is keeping.

### 2. Serve it

```
node ${CLAUDE_PLUGIN_ROOT}/skills/stet/scripts/proof.mjs
```

It prints a local URL, opens it, and waits. Do not poll it, do not do other work, and do not guess
at what the author will choose. It blocks until they are done and then prints the decisions.

### 3. Apply what came back

The script writes the edits and the sentence claims itself. Most retries were handled on the page
and need nothing from you. Any that were left queued are instructions about a specific block, in the
author's words, and the block is still `draft` so you may act on it.

Do not touch the blocks that were saved, and do not touch the sentences the author typed. Those are
theirs now, and the rest of the file around them is still yours.

### 4. Report

Say what happened in four numbers: kept, edited, queried, left. Then list the queries and what you
intend to do about each, before doing it.

## Do not

- **Do not approve anything yourself.** The sheet exists precisely so that you cannot. If it did not
  exist you would still not be allowed to.
- **Do not treat an edit as a suggestion.** The author's words are the content now, character for
  character. Not tidied, not made consistent with the voice, not fixed for a typo. If something is
  genuinely wrong, say so in your reply.
- **Do not re-serve a block that was kept.** It is approved and closed.
- **Do not batch a hundred blocks onto one sheet.** Reviewing is work. Twenty is a session; a
  hundred is a sheet nobody finishes and a set of decisions nobody made carefully.
- **Do not interpret silence.** A block the author did not act on stays `draft`. It was not approved
  by being ignored.

## Done when

The script has printed its decisions, every edit is in the file exactly as it was typed, states are
written, and you have told the author what you plan to do about each query before doing it.
