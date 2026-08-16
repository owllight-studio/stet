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

**A query is not a rejection.** A block sent back with a comment stays `draft` and the comment
becomes your instruction. You rewrite and it goes back on the sheet.

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

The script writes the edits and the states itself. Your job afterwards is the queries: each one is
an instruction about a specific block, in the author's words, and the block is still `draft` so you
may act on it.

Rewrite, then offer the sheet again. Do not rewrite the blocks that were kept, and do not touch the
blocks the author edited, which are now `authored` and closed to you.

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
