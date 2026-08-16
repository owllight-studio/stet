---
stet:
  state: draft
  author: agent
---

# stet doctor

Drift between the config, the content and this plugin.

```
node ${CLAUDE_PLUGIN_ROOT}/skills/stet/scripts/doctor.mjs
```

Writes nothing. Exits non-zero only when something is unenforced.

## Why it exists

Every other command assumes the installation is sound. The failures this one looks for are all
silent: nothing breaks, no command errors, and a project quietly stops being protected while
continuing to look protected.

**The check that matters most is whether the hook is guarding anything.** Without it every rule in
this plugin is advice, and advice loses. A project can carry a complete set of states and policies,
pass every other command, and have no enforcement whatsoever, and nothing else in the toolkit would
mention it.

Three ways that happens, all caught here: the hook script missing while `hooks.json` still points at
it, `hooks.json` declaring a PreToolUse entry that runs something else, and a matcher that covers
`Edit` but not `Write` or `MultiEdit`, which leaves a hole an agent walks through without either
side noticing.

## The bands

| | |
|---|---|
| **Not enforced** | the model is not actually holding |
| **Misconfigured** | the config and the project disagree |
| **Untidy** | nothing is unprotected, but something is stale |
| **Check by hand** | this command cannot see it from here |

Only the first band fails the exit code.

## What it checks

**Enforcement.** The hook, as above. Plus states and policies this version does not know: a file
marked with an unrecognised state has undefined protection, which is worse than being unmarked,
because it looks decided.

**Config against reality.** A content glob matching nothing, which is how a typo silently unprotects
a directory. A prose glob outside content, which means voice checks run on files the hook never
sees. A voice path pointing at a file that is not there. Code caught by a content glob, which the
hook will start refusing edits to.

**Content against config.** Files carrying stet metadata that no glob covers, which are protected in
name only. Orphaned sidecars. A lock remembering a source nobody declares any more.

**The plugin against itself.** A command whose table row links a reference file that does not exist,
which is the table claiming something is built when it is not. A reference that exists while the
table still shows it unbuilt. A reference nothing routes to. A script no document mentions, which is
a thing only its author can find.

## The one it cannot do

**Whether Claude Code actually loaded the plugin in this session.** `hooks.json` being correct does
not prove the hook is running. The command says so in its own band rather than implying the check
was complete.

The way to know is to try: edit a closed file and see whether it refuses. If it does not, nothing
above matters.

## Never

- Never fix a first-band finding by loosening the thing that reported it. A matcher that does not
  cover `Write` is fixed by covering `Write`.
- Never mark a file with a state this version does not know in order to get a behaviour it does not
  have.
- Never leave a content glob that matches nothing on the grounds that it will match later. It reads
  as protection and is not.

## Done when

The first band is empty, and somebody has tried editing a closed file and watched it refuse.
