---
stet:
  state: draft
  author: agent
---

# stet policy

What may be done to this, and what it depends on.

```
node ${CLAUDE_PLUGIN_ROOT}/skills/stet/scripts/policy.mjs <file> [...]
node ${CLAUDE_PLUGIN_ROOT}/skills/stet/scripts/policy.mjs set <frozen|refresh|open> <file> [...]
node ${CLAUDE_PLUGIN_ROOT}/skills/stet/scripts/policy.mjs check
```

## State and policy only mean something together

State says whose the words are. Policy says what may still happen to them once they are closed. A
file is not `approved` in a way anybody can act on until you also know whether its figures may move.

| state | policy | what an agent may do |
|---|---|---|
| `draft` | any | rewrite the words freely. Nobody has accepted them |
| `approved` or `authored` | none or `frozen` | nothing at all, including figures that have moved |
| `approved` or `authored` | `refresh` | update the named figures, and change no other word |
| `approved` or `authored` | `open` | rewrite the words, without changing whose they are |

The default command prints that in plain English for a given file, **derived from the same
predicates the hook enforces** rather than from a table somebody wrote once. If the explanation and
the hook ever disagree, the explanation is the bug.

## What `open` means, and what it used to

`open` was in the vocabulary and behaved exactly like `refresh`, which made one of three policies
dead and the vocabulary a lie. It now means what its name says: the words may be edited despite the
state.

The case it exists for is the page you approved once and want kept current wholesale, where
`refresh` is too narrow because the prose itself goes out of date and not only its figures. It does
not change ownership. Sentences you wrote by hand are still yours.

## Combinations that mean nothing

`check` finds these, and `set` refuses to create them.

**A policy on a draft.** Draft already permits everything, so the policy is inert. It takes effect
only when somebody approves the file, and it will surprise them then.

**`refresh` with no sources.** The policy grants permission to update figures and no figure is
named, so it grants nothing. Add `sources:` first, then set the policy.

**`frozen` with sources.** The file cites something and forbids acting on it, so the citation is
decoration.

**A source that is not declared.** `verify` will report it broken for the life of the page.

Running `check` on this repository found two of these immediately, one of them created by me the
same afternoon. That is the argument for the command.

## The order that works

1. `sources:` on the content, naming what it quotes.
2. Read it, and approve it through `proof`.
3. `policy set refresh` at that point, not before.

Setting the policy first is the mistake, and it is the one `set` refuses, because a policy on a
draft looks like a decision and is not one yet.

## Never

- Never set a policy to work around a refusal. The refusal is the model working. If a file should be
  editable, the question is whether it should still be closed.
- Never set `open` on somebody else's authored content. Ask them.
- Never add a source to satisfy the `refresh` check. A citation exists because the page quotes it.

## Done when

`check` is clean, every closed file that quotes a figure can have that figure updated, and every
closed file that must not change says so with `frozen` rather than by having no policy at all.
