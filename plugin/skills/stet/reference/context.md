---
stet:
  state: draft
  author: agent
---

# stet context

What an agent needs to know before touching a word, in one call.

```
node ${CLAUDE_PLUGIN_ROOT}/skills/stet/scripts/context.mjs
```

Run it once at the start of a session, before writing anything.

## Why it exists

Without it an agent works out the state of a project by accident: it tries an edit, gets refused,
reads the refusal, adapts. That works, it costs a turn every time, and it means **the first thing an
agent learns about a project is that something stopped it** rather than what the project is.

## What it answers, and nothing else

Four questions. It is not a dashboard, and adding a fifth thing to it is how it stops being read.

**Is anything actually enforced.** If the hook is off, that is the first line, because every rule
below it is advice until somebody turns it back on. Deliberately unlocked files are listed with the
reasons somebody gave.

**What may I edit.** Open, closed, and the closed ones that still allow their figures to be brought
current. Sentences the author owns inside otherwise open files, which is the case an agent is most
likely to walk into without noticing.

**What does it sound like.** The one rule and how many things the voice never does, plus whether
the voice file is still a draft, because a draft voice is one an agent wrote and nobody accepted.

**What to do next.** At most three, ordered by what breaks if it is skipped.

## Done when

It has been run. That is the whole of it.
