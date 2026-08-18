---
stet:
  state: approved
  author: agent
---

# Stet

**Nobody wrote this.** You can spot it in a paragraph, sometimes in a line. A cover letter. A
property listing. Marketing copy, a novel, the second act of a script. It all sounds the same.

Stet is a Claude Code plugin, and a CLI with no dependencies, for writing that does not sound like
that.

*stet*, the proofreader's mark meaning **let it stand**. Ignore the correction; the original is
right.

---

## What you get

**Seventeen voices, and each one was built by reading the real thing.** Chandler for noir. Darwin's
fifteen Beagle notebooks for field notes. The Reuters handbook for news. Use one as it is, edit it,
or describe the voice you want and have one built for you.

**A lock for the lines you wrote yourself.** A slogan, a testimonial, the sentence you spent an hour
on. Mark it and the agent rewrites everything around it and leaves that line alone.

**Checks that keep the rest true.** A price that moved. A citation to a retracted paper. Two
percentages that do not add up to the total underneath them.

    /plugin marketplace add owllight-studio/stet

Then `/stet` in any project. Node 20 or newer. MIT.

## Why a voice needs numbers

Everywhere else a voice is an adjective in a prompt. Friendly but professional. Clear and concise.
Nobody can check an adjective, so nobody does.

These were built the other way round. Somebody read the work and wrote down what it does: how long
the sentences run, where the pauses land, how often a hedge shows up. There are 132 of those
measurements across the library, and every one of the seventeen names the work it came from.

So drift shows up as a number rather than an opinion, and `measure` reports it.

Each voice file also names how a fake of it gives itself away. All 102 of those together are a list
of what generated writing does, and `tells` is the checker for the worst of them.

Ten voices written from instinct early on all had their central mechanic backwards. That is why the
reading half is not decoration.

## How the lock works

Content carries a record. In the frontmatter where the format has one, in a `stet` key for JSON, in
a small file alongside for everything else.

```yaml
---
stet:
  state: authored
  policy: refresh
  owned:
    - "The reason I started this project is not a thing an agent gets to paraphrase."
---
```

`state` says whose the words are. `policy` says what may still happen to them. `owned` lists the
sentences a person wrote, kept as their exact words rather than as line numbers, which is why a lock
holds while the section moves and the page is rebuilt around it. Rewrite the line yourself and the
lock comes off, because they are different words.

`authored` plus `refresh` is the combination worth knowing. *These are my words. Keep the numbers in
them true.* Change the figure, leave the sentence.

### Why a hook and not a rule

Put the rule in a prompt and it holds until it does not, and nothing tells you which turn that
was. This project exists because its author watched an agent break its own written rules inside a
single session, while telling him it was following them.

So a `PreToolUse` hook reads the record before the edit lands and answers before the file moves. It
does not advise. It refuses:

```
site/index.html contains a sentence the author wrote.

  "The reason I started this project is not a thing an agent gets to paraphrase."

Those words are theirs, character for character. Everything else in this file is still
open to you: edit around them.
```

## Half of it does not need a model

Is this word spelled two ways across the project. Does this figure still match the command that
produced it. Was this paper retracted. Nobody has to read anything to answer those.

So 25 of the commands ship as a CLI with no dependencies. They run in your build and they stop it.

    stet                     both halves, including what it cannot do
    stet check               where the content disagrees with the style sheet
    stet audit               the sweep, ranked by what it costs you
    stet sums                the arithmetic a document does on itself
    stet standing            what each cited source was last time, and what moved
    stet help <command>      the full reference for any of them

The readings stay in the plugin, where there is a model to do them. Whether a source supports the
sentence citing it. Whether somebody who is not the author can follow a paragraph. What voice a
person is reaching for when they cannot name one. `stet` with no arguments prints both lists.

## The commands

Thirty of them, in seven groups.

    init · style · voice · ia · ingest              establish
    outline · write · expand                        compose
    claim · release · approve · proof · policy      authorship
    audit · critique · cite · standing · verify ·
      sums · claims                                 evaluate
    tighten · clarify · restructure                 refine
    refresh · doctor                                maintain
    context · sheets · kinds · admin · pin          operate

Run `context` first, every session. In a project that already has writing in it, the order is
`ingest`, `init`, `voice`, `ia`. Read it before describing it, and derive the voice rather than
asking for one: nobody can describe their own voice, and everybody can correct a wrong description
of it.

Ten agents sit behind those, for work too big to fit in the conversation or too close to it to be
judged straight. Reading a whole back catalogue is the first kind. Deciding whether a finished page
works is the second.

## It is not only for websites

A novel. A research paper. A screenplay, a documentation tree, an album's worth of lyrics.

The states, the voice and every measurement work the same on all of them. A line of a lyric and a
line of marketing copy are both somebody's words, and whether an agent may rewrite them has one
answer. A few checks only make sense for a website; tell Stet what you are writing with `kinds` and
those switch themselves off.

Stet touches your words and nothing else. No components, no routing, no CSS. That is what lets it
sit on Next, Astro, Hugo, a folder of Markdown or a manuscript and behave the same.

## Stet governs Stet

This repository is its own first user. `stet.config.json` declares its content, `VOICE.md` was
derived from its own writing rather than written for it, and the hook enforces ownership over all of
it. The checks run clean: no em dashes, no exclamations, none of the usual tells across 61 files.

Two bugs came out of pointing it at itself. The tell checker flagged the file that lists the tells,
because naming a construction is not committing it, so quoted text is skipped now. And claiming
everything as the author's on ingest does not fit a repository an agent wrote under direction, which
was a gap in the model rather than a bug in the code.

## Status

Early, and honest about it.

Built and tested: 36 commands, 10 agents, 17 voices, the ownership model and the hook that enforces
it. 130 tests, zero runtime dependencies.

The npm package is not published yet, so the CLI ships inside the plugin and `node bin/stet.mjs`
from a clone does the same thing.

Most of Stet's own content is marked `draft` rather than `approved`, because the author has directed
it and not read every line. Marking it approved would be the exact failure the model exists to
prevent.

## Licence

MIT
