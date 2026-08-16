# Stet

**Content that knows who owns it.** A Claude Code plugin that stops agents rewriting your words and
keeps the rest true.

*stet* — the proofreader's mark meaning **let it stand**. Ignore the correction; the original is
right.

---

## The problem

You point Claude at a content codebase. Two things go wrong, and they pull in opposite directions.

**It rewrites what it should not touch.** The paragraph you agonised over comes back "improved". You
did not ask. You asked for a redesign, or a fix three files away, and your words were collateral.

**It leaves what it should refresh.** A sentence quotes a number that moved three weeks ago. Nothing
in the file says that number came from anywhere, so nothing knows it went stale, and the page keeps
stating it with a straight face.

Both are the same missing thing: **content carries no record of who owns it or what may be done to
it.** Every CMS ever built hands you a text box and hopes.

## What Stet does

Every block of content carries an owner and a policy:

```yaml
---
owner: human          # mine. let it stand.
---
The reason I started this project is not a thing an agent gets to paraphrase.
```

```yaml
---
owner: agent
voice: house
sources: [corpus.rampShare]
policy: refresh-on-change
---
Ramp casts are {{rampShare}} of what you press before a spike.
```

The first is a wall. When an agent reaches for it, a `PreToolUse` hook **refuses the edit**. Not a
guideline in a prompt it might forget on turn ninety. A hook that says no.

The second is a standing instruction. `/stet refresh` checks the claim against its source and
updates it, and only it.

## Why a hook and not a rule

Because rules in a prompt are advice, and advice loses. This project exists because its author
watched an agent break its own documented conventions repeatedly inside a single session, while
sincerely believing it was following them.

Ownership has to be enforced by something that is not the model.

## What it is

A Claude Code plugin. Skills, agents, hooks and scripts. **No rendering code**, on purpose: Stet
governs content files and never owns your components, which is what lets it run on Next, Astro,
Hugo, a docs folder, or a pile of Markdown.

Your project tells Stet where content lives and how to fetch a fact. Stet does the rest.

## Commands

Establish a project, then work in it.

    ingest    read what is there, claim it for you, report what it found
    init      what this is, who reads it, what it must never be
    voice     derive the house voice from what you have already written
    ia        what exists, how it relates, where the next page goes

    write · outline · expand          compose
    claim · release · policy          authorship
    audit · critique · verify         evaluate
    tighten · clarify · restructure   refine
    refresh · doctor                  maintain

The order for a project that already has content is `ingest`, `init`, `voice`, `ia`. Read it before
you describe it, and derive the voice rather than asking for it: nobody can describe their own
voice, but everybody can correct a wrong description of it.

## Status

Early. The Establish group is built. Everything else is designed and not yet written. Being built and proved against a real site before it is recommended to anyone.

## Licence

MIT
