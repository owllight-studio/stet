---
stet:
  state: draft
  author: agent
---

# stet pin

Make one command its own slash command.

```
node ${CLAUDE_PLUGIN_ROOT}/skills/stet/scripts/pin.mjs pin <command>
node ${CLAUDE_PLUGIN_ROOT}/skills/stet/scripts/pin.mjs unpin <command>
node ${CLAUDE_PLUGIN_ROOT}/skills/stet/scripts/pin.mjs list
```

`stet proof` works. `/stet-proof` is what somebody types at four in the afternoon, and the
difference between those two is the difference between a tool people use and a tool people remember
installing.

## A pin is a redirect, never a copy

The shortcut holds one line of description and an instruction to load the real reference. **There is
exactly one description of what a command does**, so a pin cannot drift from it, and updating the
reference updates every pin by construction.

The description is read out of the reference at pin time rather than typed, for the same reason.

## Where they go

Every harness directory the project already has: `.claude`, `.cursor`, `.codex`, `.agents`,
`.gemini`. Creating one is not this command's business, so a project with none gets told rather than
given a directory it did not ask for.

## Done when

The commands somebody uses weekly are pinned, and the ones they use once are not. A directory of
eighteen shortcuts is a menu nobody reads.
