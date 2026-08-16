---
stet:
  state: draft
  author: agent
---

# stet claim, release, approve

Who these words belong to, and what that means you may do.

## Three states

They exist because they produce three different behaviours, not three different labels.

| State | Who wrote it | May an agent edit the words? | May an agent regenerate it? |
|---|---|---|---|
| `draft` | an agent | yes | yes |
| `approved` | an agent, accepted by a person | no | only if asked, explicitly, each time |
| `authored` | a person | no | never |

**Approval is what confers ownership.** An agent's draft belongs to the agent until a person reads
it and accepts it. At that moment the words become theirs, and the agent's licence to change them
ends. Nothing else transfers ownership: not time, not the content being good, not the agent having
written every word of it.

The distinction between `approved` and `authored` is provenance. Both are closed. Only one of them
was written by a person, and a project that wants to say honestly who wrote what has to keep the
difference. It also changes what a regeneration means: an approved page can be rebuilt if the author
asks for that, and an authored one cannot be rebuilt at all, only replaced by its author.

## Ownership is per sentence

State is the coarse default for a file. `owned` is the fine grain: sentences a person wrote, stored
as their exact words rather than a position, so they survive everything around them moving and lapse
on their own if the words themselves change.

A `draft` file with owned sentences in it is the normal case after a proof sheet. Most of it is
yours. Those lines are not. Edit around them.

## Policy is separate

State says who owns the words. `policy` says what may still be done to closed content.

| Policy | What an agent may do to closed content |
|---|---|
| `frozen` | nothing |
| `refresh` | bring the facts named in `sources` current. Change no other word. |
| `open` | anything, which is what `draft` already means |

`authored` plus `refresh` is the combination this whole system exists to make expressible: *these
are my words, and I want the numbers in them kept true*. Honour it exactly. Change the figure, leave
the sentence.

## Commands

### claim

Mark content as the author's. `--as authored` when a person wrote it, `--as approved` when an agent
wrote it and the person is accepting it now.

```
node ${CLAUDE_PLUGIN_ROOT}/skills/stet/scripts/mark.mjs authored --author human <path>
node ${CLAUDE_PLUGIN_ROOT}/skills/stet/scripts/mark.mjs approved --author agent <path>
```

With no path it marks everything, which is what `ingest` does on first contact.

### release

Hand content back. This is the only way something closed becomes editable again, and only the author
may ask for it.

```
node ${CLAUDE_PLUGIN_ROOT}/skills/stet/scripts/mark.mjs draft --author agent <path>
```

**Never release on your own initiative.** Not because a page needs work, not because the author
asked for something that would be easier with it released. If closed content is blocking the
request, say so and ask.

### approve

The transition that matters. A person has read a draft and accepted it.

Approving on the author's behalf is the one failure that would make this whole system worthless, so:
**only approve when the author says to approve.** "This looks good" about one paragraph is not
approval of the file. If in doubt, it is not approval.

## Before you edit anything

```
node ${CLAUDE_PLUGIN_ROOT}/skills/stet/scripts/owner.mjs <path>
```

Exit 0 means yes, exit 1 means no. Unclaimed content answers no, because content with no record
belongs to whoever wrote it, and that was not you.

## Do not

- **Do not treat a broad instruction as permission.** "Improve this page" does not open the closed
  sections inside it. Improve what you may, then say what you left and why.
- **Do not approve anything.** Approval is an act of the author. You record it; you do not perform
  it.
- **Do not release to get your work done.** If closed content stands in the way, that is a question
  for the author, not an obstacle to route around.
- **Do not edit and then ask.** The order matters more here than anywhere else in this skill.
- **Do not stay silent about what you skipped.** Every command that leaves content alone because of
  its state has to say which content and which state. Silence reads as "there was nothing to do".

## You may always propose

Ownership closes the file, not the conversation. Show the author a rewrite of their own paragraph in
your reply, as often as you think it helps. Put it in the file only when they say to.
