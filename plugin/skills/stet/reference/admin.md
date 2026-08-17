---
stet:
  state: draft
  author: agent
---

# stet admin

When the hook is in your way.

```
node ${CLAUDE_PLUGIN_ROOT}/skills/stet/scripts/admin.mjs status
node ${CLAUDE_PLUGIN_ROOT}/skills/stet/scripts/admin.mjs unlock <file> --for "<reason>"
node ${CLAUDE_PLUGIN_ROOT}/skills/stet/scripts/admin.mjs relock <file> | --all
node ${CLAUDE_PLUGIN_ROOT}/skills/stet/scripts/admin.mjs off --for "<reason>"  |  on
```

## Why the primitive is not off

Every enforcement tool needs an escape hatch, and its shape is a design decision rather than a
convenience. A design linter that warns can offer on, off and ignore-this-rule, because the worst
case of switching it off is uglier CSS.

This hook protects who owns which words. **"Turn it off" means "stop protecting my content"**, and a
global switch would make the whole model advisory the moment it was inconvenient, which is exactly
when a model has to hold.

So the primitive is **release, scoped and recorded**. One file, one stated reason, put back when the
work is done.

## The reason is the command

`unlock` refuses without `--for`, and that is the point rather than a formality.

**An unlock with no reason is a rule that quietly stopped applying. An unlock with a reason is a
decision somebody made**, and the record outlives the session. `status` shows what is open, since
when, what it was before, and why.

Nothing about ownership changes while a file is unlocked. The record keeps its previous state and
`relock` restores exactly that.

## There is an off, and you should not use it

It exists because refusing to build one means somebody edits `hooks.json` instead, which is the same
outcome with no record. It requires a reason, it announces itself, and `status` and `context` both
put it first, so a project running unprotected says so before anybody writes a word.

Unlocking one file is almost always the right move. It keeps everything else protected and leaves a
record of the one thing you opened.

## For an agent

If the hook refuses you, **say so and ask.** Do not unlock it yourself. The refusal message says
this and it means it: an agent that unlocks its own way past an ownership check has defeated the
only thing standing between it and somebody's paragraph.

Propose the change in your reply. The author unlocks if they want it.

## Done when

`status` shows nothing unlocked, or shows exactly what somebody meant to leave open and why.
