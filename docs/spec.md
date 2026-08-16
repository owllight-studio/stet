# Stet: design

Written 2026-08-16, from a conversation that changed shape three times before it settled. The
detours are recorded because each one narrowed the thing usefully.

## How it arrived here

**First idea: a CMS for one site.** Jeff wanted to edit his own content without asking an agent
every time. The obvious build was auth, an admin route, an editor, a publish path.

**First correction: prose on that site is a function, not a string.** Every figure in it comes from
a live query, so a sentence re-cuts itself when the data moves. A textarea cannot be a function, so
a naive CMS would have reintroduced the exact bug the site was built to avoid. That produced the
token idea: figures in prose are named queries, and typing a number by hand is a validation error.

**Second correction: edit on the page, not in a backend.** If you edit in place, the page is the
preview, and the whole preview problem disappears.

**Third correction, and the one that mattered: the interface is Claude.** Jeff does not want a form
in a browser. He wants to keep using Claude Code, and to say things like *this section is mine,
never touch it* and *this one quotes data that moves, keep it current on your own*.

That is the product. Not a CMS with live data. **Content that carries who owns it and what may be
done to it**, with an agent as the interface and a hook as the enforcement.

**Fourth: it is not one site's problem.** Anyone pointing an agent at a content codebase has both
halves of it. So it is a distributable plugin, and one site is the guinea pig.

## The two failures it fixes

They pull in opposite directions, which is why no single instruction fixes both.

1. **The agent rewrites what it should not touch.** You asked for a redesign. Your best paragraph
   came back paraphrased.
2. **The agent leaves what it should refresh.** A claim quotes a number that moved weeks ago and
   nothing in the file records where the number came from.

Both are one missing thing: content with no record of ownership or policy.

## The model

Every unit of content carries metadata:

| Field | Meaning |
|---|---|
| `owner` | `human`, `agent`, or `shared`. Who the words belong to. |
| `policy` | What may be done: `frozen`, `refresh-on-change`, `open`. |
| `sources` | Named facts the content depends on. Empty means it depends on none. |
| `voice` | Which house style applies, when an agent may write. |

A unit is a file or a block inside one, depending on the format adapter.

### Ownership is enforced by a hook, not a rule

A `PreToolUse` hook reads the ownership index and refuses an `Edit` or `Write` that would touch
human-owned content. This is the spine of the product and the reason it is worth building at all.

The justification is empirical rather than theoretical. This project was designed in a session where
the agent broke its own written conventions repeatedly while sincerely believing it was following
them: it duplicated CSS blocks three times over so that its own edits silently did nothing, and it
shipped three deploys that failed for one cause it had already fixed once. Rules in a prompt are
advice. Advice loses.

So: an agent may propose a change to owned content. It may not make one.

### Freshness is a standing instruction

`sources` names the facts a claim rests on. A project supplies a resolver: given a source name,
return today's value. Stet compares what the content says against what the source says and flags or
updates, according to policy.

That is where the live-figure idea from the original design ends up: one policy among several
rather than the whole pitch.

## What ships

The Impeccable shape, verified by reading it rather than remembering it. Impeccable ships one
`SKILL.md`, 35 reference files, about 45 scripts, four agents, one `hooks.json`, and **zero lines of
rendering code**. It governs a process and a few files it maintains. That is exactly why it runs on
any codebase.

Stet is the same:

| Impeccable | Stet |
|---|---|
| `SKILL.md` command table | the `/stet` commands |
| `reference/*.md` per command | same |
| `detect.mjs`, the design detector | the content detector: ownership, staleness, typed figures, voice |
| a hook that reports after a UI edit | **a hook that refuses before a content edit** |
| `impeccable-finish-reviewer` | `stet-auditor`, `stet-voice`, `stet-fact-checker` |
| `PRODUCT.md` / `DESIGN.md` | `CONTENT.md`: the voice, the rules, the sources |

**No rendering code.** A host project keeps its own components, its own routing, its own block
registry. Stet never learns what any individual block or metric is called.

## The project boundary

A project adopts Stet by adding `stet.config.json`:

```json
{
  "content": ["content/**/*.json", "content/**/*.md"],
  "format": "auto",
  "voice": "CONTENT.md",
  "sources": { "command": "npm run stet:facts" }
}
```

`sources.command` prints a JSON map of fact name to current value. Anything can implement it: a
query, an API call, a file read. Stet does not care where a fact comes from, only that the project
can produce it on demand.

Format adapters read and write the metadata: Markdown and MDX frontmatter, JSON block documents,
and a sidecar for formats that cannot carry it inline.

## Deliberately not in this

- **No web editor.** The interface is Claude. If one is ever wanted, it sits on this model rather
  than replacing it.
- **No rendering, no components, no CSS.** The moment Stet ships React it becomes a React product.
- **No hosted service.** Content is files in the project's own repository.
- **No arbitrary styling.** Stet has no opinion on how content looks, which is a different problem
  and a solved one.

## First reference implementation

dreambreath.gg, a Preservation Evoker resource whose entire claim is that every number on it is a
query. It already has the document schema, a metric registry, a validator and a block registry built
by hand. Those become the first project to adopt Stet, and the test of whether the boundary holds.

## Commands

Six groups. Each command is a different mode of working, not a synonym for the one beside it.

| Group | Command | What it does |
|---|---|---|
| **Establish** | `init` | What the project is, who reads it, what it must do. Writes `CONTENT.md`. |
| | `voice` | Derive the house voice from writing that exists, or define it. Writes `VOICE.md`. |
| | `ia` | What exists, how it relates, what each page is for. Writes `IA.md`. |
| | `ingest` | Read everything there, claim it for the author, report what is there. |
| **Compose** | `outline` | Plan a piece before writing it. |
| | `write` | Author in the voice, to the IA, respecting ownership. |
| | `expand` | A stub into a finished piece. |
| **Authorship** | `claim` / `release` | Whose words these are. |
| | `policy` | What may be done to them, and what they depend on. |
| **Evaluate** | `audit` | The sweep: stale claims, typed figures, unowned content, orphans, voice breaks. |
| | `critique` | A scored review of one piece against a rubric. |
| | `verify` | Every claim checked against its real source. |
| **Refine** | `tighten` | Cut. |
| | `clarify` | Make it comprehensible to someone who is not the author. |
| | `restructure` | Reorder and regroup within a page. |
| **Maintain** | `refresh` | Update what policy allows, leave the rest. |
| | `doctor` | Drift between config, content and the plugin. |

The group holding `claim` was called Custody while the design was being worked out. Authorship is
warmer, it is native to the publishing vocabulary the rest of the product borrows from, and "claim
your words" is the emotional centre of the pitch. The writing group became Compose so the two do
not collide.

Three commands were not in the original sketch and earned their place:

- **`verify`** is separate from `audit` because a sweep and a deep check of one claim against its
  real source are different jobs. One says "this looks stale", the other says "I asked, and it is
  wrong."
- **`tighten`** because on the reference project it is, by a distance, the most repeated correction
  ever given. Four times, escalating, ending in capitals. If there is one refine command it is this.
- **`critique`** as the Impeccable analogue: a rubric and specific findings rather than a general
  improve-this pass.

## The zero to one path

Impeccable's real value is not its polish commands, it is that it walks a project from nothing to a
described design system. Stet does the same for content, and the order matters:

**`ingest` → `init` → `voice` → `ia`**

`ingest` first, always, and before `init`. You cannot usefully describe what a project is until you
have read what it already says, and the author is far better at correcting a description than
producing one.

`voice` derives rather than asks. Nobody can describe their own voice; ask and you get "clear,
friendly, authoritative", which excludes nothing and instructs nothing. Read the corpus, measure
what can be measured, present rules with the author's own sentences as examples and a
counter-example for each, and let them correct it.

Three artifacts, on the model of Impeccable's `PRODUCT.md` and `DESIGN.md` split, kept separate
because they change on different clocks:

- `CONTENT.md` — what the project is, who reads it, what it must never be
- `VOICE.md` — how it sounds, as rules with examples and counter-examples
- `IA.md` — what exists, how it relates, and the rules for where the next page goes

## Open

Whether Stet holds a point of view on what good content is, or stays neutral and enforces whatever
voice a project declares. Impeccable has taste and asserts it. Neutral makes better plumbing; a
position makes the better product, and it is not a decision to take early.
