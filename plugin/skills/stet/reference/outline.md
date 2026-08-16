---
stet:
  state: draft
  author: agent
---

# stet outline

Plan a piece, and check the plan before anybody writes prose.

```
node ${CLAUDE_PLUGIN_ROOT}/skills/stet/scripts/outline.mjs draft <slug>
node ${CLAUDE_PLUGIN_ROOT}/skills/stet/scripts/outline.mjs check <plan.md>
```

## Why an outline here is not a list of headings

A list of headings is a shape with no claims in it, so there is nothing in it that can yet be wrong.
This asks each section for two more things, and both are checkable.

**Says** is the single thing the section asserts. One sentence. If it needs two, it is two sections,
and the check says so.

**Because** is what supports it: a source from `stet.config.json`, or the word `observed` with how,
or `argued` when it rests on reasoning rather than evidence. All three are legitimate. **Unstated is
the one that ships wrong**, because `verify` can only ever check a claim that named a source, so a
figure that was never attributed is a figure nothing will watch for the life of the page.

## The two failures this catches and nothing else does

**A claim with no evidence.** Cheap to notice now, expensive once a paragraph is built on it,
permanent once it ships.

**A piece that already exists.** The most wasteful failure in any documentation project, and the one
nobody catches by reading the file tree, because the duplicate is never filed where you would look
for it. The check compares each section against every content file by distinctive-word overlap and
names anything close, with a percentage and a word count so you can tell a genuine duplicate from
two pages that share a vocabulary.

Treat overlap as a question rather than a verdict. Two sections that share 25 percent of their
distinctive words might be a duplicate, a necessary restatement, or the same subject at two depths.
The check cannot tell which, and says so by reporting rather than failing.

## Also checked

**Where it will live.** A plan with no home is a draft looking for a folder, and `ia` decides that,
not the writer.

**What the reader can do afterwards.** Without it there is no standard to cut against later, and
every paragraph looks necessary.

## The plans themselves

They live in `.stet/outlines/`, which is working state rather than content. A plan worth keeping is
worth moving into the project as a document and marking, at which point it is content like anything
else. Most are not worth keeping, and a directory of stale plans is worse than none.

## Order

1. `ia` first if you do not know where this goes.
2. `outline draft`, then fill in every Says and Because.
3. `outline check`. Settle everything it raises.
4. `write`.

Do not start writing while the check is failing. Every problem it names is cheaper before a draft
exists than after, and the two it catches best are precisely the ones that survive review because
they are invisible in finished prose.

## Never

- Never write Because as a restatement of Says. "Because it is true" is not evidence.
- Never plan a section whose Says you would not put in the finished piece as a sentence.
- Never dismiss an overlap without opening the file it named.
- Never skip the plan on the grounds that the piece is short. Short pieces duplicate existing pages
  more often than long ones, not less.

## Done when

Every section asserts one thing and names what supports it, every named source runs, every overlap
was opened and judged, and the piece has a home and a job.
