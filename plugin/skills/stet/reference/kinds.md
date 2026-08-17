---
stet:
  state: draft
  author: agent
---

# What kind of written thing this is

```json
{ "kind": "site" | "manuscript" | "papers" | "collection" }
```

Declared in `stet.config.json`. Defaults to `site`.

## Why a project has a kind

Most of this plugin is about writing, and writing is writing. Ownership, voice, the proof sheet, the
measurements, `tighten`, `clarify`, `expand`, `critique`: none of those care whether the words are a
landing page, a chapter, a paper or a song.

A few checks do care, and running them everywhere is how a tool teaches people to stop reading it.
**An orphan is a real finding in a documentation tree and nonsense in a novel**, where nothing links
to chapter nine and nothing should. An information architecture is a real thing for a site and not a
thing a poem has.

So the kind switches those off rather than making somebody dismiss the same wrong finding weekly.

## The four

**`site`** Pages a reader arrives at, in no fixed order, reached by links. Orphans matter. `ia`
matters. The default, because it is the case that needs the most structure.

**`manuscript`** One long work in a fixed order. A novel, a book, a report. Orphans are meaningless.
Order is the author's and `restructure` is the command that matters most, because it can prove the
words survived being moved.

**`papers`** Argued work standing on its citations. `verify` and `sources` are the centre of it, and
a claim without a source is the failure the whole thing is judged on. Structure is largely
conventional, so `restructure` is less use here than anywhere else.

**`collection`** Independent pieces. Poems, songs, essays, scripts. Order is an editor's decision
rather than a structure, so nothing about linking or architecture applies. Voice matters most, and
so does the thing nothing else in this plugin does: **the ownership model was built for exactly
this.** A songwriter with a lyric an agent must never touch and a verse it may draft against is the
clearest case the three states have.

## What does not change

Everything else. The states, the policies, the hook, the voice library, the sheets, and every
measurement. A line of a song and a line of a landing page are both somebody's words, and the
question of whether an agent may rewrite them has the same answer.

## If none of them fits

Use the closest and say so in the config note. The kinds exist to switch off checks that would be
wrong, so picking one that switches off too much is worse than picking one that switches off too
little. `site` is the safe choice, since it runs everything.

## Done when

The kind is declared, and no check is reporting a finding that could not be true for this kind of
work.
