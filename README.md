---
stet:
  state: approved
  author: agent
---

# Stet

**Content that knows who owns it.** A Claude Code plugin that stops agents rewriting your words and
keeps the rest true.

*stet*, the proofreader's mark meaning **let it stand**. Ignore the correction; the original is
right.

---

## The problem

You point Claude at a content codebase. Three things go wrong.

**It writes too much.** Every paragraph is a sentence and a half doing the work of a sentence. Every
list has a preamble. Nothing is ever just said. You end up spending more time unwinding the slop
than you would have spent writing it, which is the opposite of the deal, and the time it takes comes
out of the work only you can do.

**It rewrites what it should not touch.** The paragraph you agonised over comes back "improved". You
did not ask. You asked for a redesign, or a fix three files away, and your words were collateral.

**It leaves what it should refresh.** A sentence quotes a number that moved three weeks ago. Nothing
in the file says that number came from anywhere, so nothing knows it went stale, and the page keeps
stating it with a straight face.

The last two are one missing thing: **content carries no record of who owns it or what may be done
to it.** Every CMS ever built hands you a text box and hopes.

The first is a missing standard. A voice defined once, derived from writing you already did, applied
every time, and checked. Not a note in a prompt that survives eleven turns.

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

## Stet governs Stet

This repository is its own first user. `stet.config.json` declares its content, `VOICE.md` was
derived from its writing rather than written for it, and both checks run clean over all of it: zero
em dashes, zero exclamations, zero of the usual tells, median sentence 13 words.

Two bugs came out of pointing it at itself on the first day. The tell checker flagged the file that
lists the tells, because naming a construction is not committing it; quoted text is skipped now. And
the default of claiming everything as `owner: human` does not fit a repository an agent wrote under
direction, which is a gap in the ownership model rather than a bug in the code.

## Status

Early, and honest about it.

Built: the Establish group (`ingest`, `init`, `voice`, `ia`), the Authorship model, and the hook
that enforces it. Designed and not written: everything else.

Stet's own content is marked `draft`, not `approved`, because the author has directed it and not
read it line by line. Marking it approved would be the exact failure the model exists to prevent.

## Licence

MIT
