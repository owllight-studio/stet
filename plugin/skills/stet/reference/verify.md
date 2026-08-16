---
stet:
  state: draft
  author: agent
---

# stet verify

Check every claim against the thing it came from. Change nothing.

```
node ${CLAUDE_PLUGIN_ROOT}/skills/stet/scripts/verify.mjs [file ...] [--quiet]
```

Exits non-zero when a claim has gone stale or a source is broken, so it can sit in CI.

## What a source is

A command that prints one figure. Declared in `stet.config.json`, never in content.

```json
"sources": {
  "corpus.rampShare": { "run": "node scripts/ramp-share.mjs", "as": "percent" },
  "corpus.runs": { "run": "node scripts/count-runs.mjs", "as": "number" }
}
```

`as` says which written forms count as the same figure. `percent` matches "47%", "47 percent" and
"47 per cent". `number` matches "1,519" and "1519". `raw`, the default, matches the string exactly.

Content then names the sources it quotes:

```markdown
---
stet:
  state: authored
  policy: refresh
  sources: [corpus.rampShare]
---
```

**The config is the boundary and it is a security boundary.** A source runs a shell command, so
allowing one to be declared inside a page would mean anything able to write a page could run code.
Sources live in config. Content may only name them.

## No markers in the prose

Stet does not put `{{corpus.rampShare}}` in a sentence. A sentence carrying templating is a sentence
nobody wants to read in a diff, and the whole product rests on content being ordinary prose that
happens to know things about itself.

**So claims are found by value.** The source prints a figure, and we look for that figure in the
text. Which gives four states rather than two, and the extra two are the useful ones.

| | means |
|---|---|
| **current** | the live figure is in the prose |
| **stale** | the previously recorded figure is there and the source has moved |
| **missing** | neither is there |
| **broken** | the source did not run |

**`missing` is the state to understand.** The sentence was reworded around the number, or the number
was typed by hand and never matched. Either way we say so and stop, because **a claim we cannot
locate is a claim we must not rewrite.** Guessing which number in a paragraph was meant to be the
ramp share is how a tool silently corrupts somebody's writing.

## Typed figures

Alongside the claims, verify reports numbers sitting in prose with no source behind them at all.
These are not errors. They are the ones that will go stale silently, because nothing knows they are
supposed to track anything.

Years, small counts and version numbers are skipped, since those are prose rather than claims.

## What it does not do

It does not write to content. Ever, including files it could legally change. The reading half and
the writing half are separate commands so that running the reading half is never a decision.

## Done when

Every stale claim is either refreshed, rewritten by hand, or knowingly left. Every broken source is
fixed or removed. Every typed figure is either given a source or accepted as prose.
