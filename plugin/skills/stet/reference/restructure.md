---
stet:
  state: draft
  author: agent
---

# stet restructure

Reorder and regroup within a page. Change no words.

```
node ${CLAUDE_PLUGIN_ROOT}/skills/stet/scripts/restructure.mjs outline  <file>
node ${CLAUDE_PLUGIN_ROOT}/skills/stet/scripts/restructure.mjs snapshot <file>
                                                       ... restructure it ...
node ${CLAUDE_PLUGIN_ROOT}/skills/stet/scripts/restructure.mjs check    <file>
```

Snapshot before, not after. There is no way to reconstruct the old order from the new file.

## The contract, and it is exact

This is the one refine command that can be proved correct. `tighten` removes words and `clarify`
changes them, so both have to be judged. **This moves blocks and nothing else**, which means a
correct restructure leaves every block byte for byte identical and only their order different.

Anything added, removed or edited is not a restructure, and `check` fails on it.

A block that was edited shows as one gone and one new, because a block is identified by its own
words rather than by its position. That is not a limitation to work around. It is the check.

## Why it never loses ownership

Owned sentences are stored as their own text, never as offsets. So an author's sentence keeps its
owner through any amount of reordering, and `check` confirms it did.

**This command is the proof that the ownership design was right.** If spans had been stored by
position, restructuring a page would silently reassign every one of them, and the author would find
their sentences had become the agent's because a heading moved.

If `check` reports an owned sentence lost, the words were touched. Moving a page never loses one.

## What a good order actually is

The measured registers disagree with each other about this, and the disagreement is the useful part.
There is no universal order, only an order that suits what the page is doing.

**Conclusion first, if the page informs.** The inverted pyramid exists for two production facts,
neither about readers: an editor could cut paragraphs from the bottom without reading them, and a
reader who stopped early still had the news.

**Conclusion last, if the page persuades.** The same shape fights an argument, because a conclusion
stated before its evidence is an assertion. The Economist states the opposing goal exactly: an
article should be "a series of paragraphs that follow logically in order and, ideally, will suffer
if even one sentence is cut out." Those two designs are incompatible, and a page trying for both
gets neither.

**Proof before the claim, if the page sells.** Ogilvy attributed his own headline to a motoring
magazine's technical editor rather than asserting it. Sugarman spent the first third of a sunglasses
ad unconvinced by sunglasses. Pastiche opens at the claim and never supplies proof, which is why it
reads as a stranger shouting.

**The name after the thing, if the page explains.** "This turning effect of a force is called
torque", never the reverse. And anticipation of confusion lands immediately before or after the
difficult passage. A warning delivered three sections early is not a warning.

**Concession before the strongest claim, never after.** Placement is the whole technique. Before, it
is armour. After, it is retreat.

## How to end

Five moves, and summarising is not one of them: drop to an image and stop, return to the opening and
escalate it, disclose what you learned writing it, state the consequence, or compress the thesis
into something shorter and stronger than its first statement.

**The test: delete the last block.** If the page reads as finished, it was a summary and it should
stay deleted. Deleting is not a restructure, so do that as a separate act and say so.

## Never

- Never edit while reordering. The diff becomes unreadable and the regression untraceable, which is
  the whole reason these are separate commands.
- Never move content between pages. That is `ia`, and it changes what each page is for.
- Never restructure content that is not yours to edit.
- Never restructure without a snapshot. The check is the only thing that distinguishes this from an
  unreviewed rewrite.
- Never reorder to fix a paragraph that is simply wrong. Moving a bad explanation puts it somewhere
  else.

## Done when

`check` reports moves and nothing else, every owned sentence is still intact, and the new order
matches what the page is for rather than what was easiest to cut and paste.
