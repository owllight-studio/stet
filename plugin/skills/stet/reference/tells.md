---
stet:
  state: draft
  author: agent
---

# stet tells

The constructions that read as machine-written, found in the content and counted.

```
node ${CLAUDE_PLUGIN_ROOT}/skills/stet/scripts/tells.mjs [path ...]
stet tells [path ...]
```

It needs no model, so it ships in the CLI as well as the plugin. Both run the same script.

Writes nothing. Exits 1 when it finds anything, so it can sit in CI, and in this repo it is the last
step of `npm test`.

There are no flags. Everything after the command name is treated as a path, so `--quiet` is looked
up as a filename, fails to open and is skipped without a word.

## Why it exists

A rule in an instruction file is advice, and advice loses. This is the check that makes the rule
hold. `audit` does not run it: `audit` reports on claims, voice drift, structure and typed figures
and leaves the constructions to this command, which is why `npm test` runs both.

Every pattern earned its place by being a real habit rather than a preference. An em dash is first
because it is the most recognisable single marker in generated prose, and because its absence costs
nothing.

## What it does, in order

1. Decides which files to read. Paths on the command line are read and nothing else, resolved
   against the working directory. With no paths it reads every file the `content` globs in
   `stet.config.json` match, or, with no config at all, guesses at the usual content directories.
   Finding nothing is a pass, so a project pointed at the wrong directories reads the same as a
   clean one.
2. Reads each file. One it cannot read is skipped in silence.
3. Skips the whole file if the raw text carries a bare `stet-allow` comment, described below.
   This document cannot write that comment out, because writing it would exempt this document.
4. Blanks the parts of the text that are not the project's own writing, listed below.
5. Runs the regular expressions over what is left, line by line: all 15 on a file inside the `prose`
   globs, the other 12 on anything else. The gate is explained under the table.
6. Prints the hits under each file, then a total and a count per pattern.

## What gets blanked first

Naming a construction is not committing it, and this checker has been fooled by that four times: a
list of tells quoting the exploration preamble, a voice preset banning `seamless`, a rule file
demonstrating the `not-x-but-y` shape, and a generated HTML page carrying the voice files' never
lists. So the text is stripped before any pattern runs, in this order.

| | |
|---|---|
| HTML entities | decoded first, so `&quot;` and the curly-quote entities cannot hide a quotation from the rules below |
| `<li>` items | dropped when the item's text starts with `never`, `do not`, `don't`, `avoid` or `banned` |
| fenced code | ```` ``` ```` blocks removed entirely |
| inline code | anything in backticks removed |
| straight quotes | a `"` run of up to 120 characters replaced with an empty pair |
| curly quotes | a run of up to 400 characters between a left and a right curly quote removed |
| tags | anything from `<` to the next `>` on the same line replaced with a space |
| ban sections | a heading starting `never`, `do not`, `don't`, `avoid` or `banned`, and everything under it up to the next heading |

The tag rule substitutes a space rather than deleting, which the script gives as its reason for
keeping reported line numbers lined up. The rules that remove text whole take its newlines with
them, and those do move the numbering: see below.

## The patterns

Fourteen names over fifteen expressions, since `not-x-but-y` has two.

| name | fires on |
|---|---|
| `em-dash` | an em dash, or a spaced en dash between two words |
| `not-x-but-y` | `is not X, it's Y`, and the bare `Not a X, a Y` at the start of a sentence |
| `delve` | `delve`, `dive in`, `deep dive`, `unpack this`, `let's explore` |
| `corporate` | `utilize`, `robust`, `seamless`, `streamline`, `empower`, `holistic`, `synergy` |
| `corporate-abstract` | `unlock`, `leverage`, `elevate`, `drive` or `harness` followed by an abstract noun such as `potential` or `value` |
| `landscape` | `landscape`, `realm`, `tapestry`, `testament to`, `in today's world`, `ever-evolving` |
| `important-to-note` | `it is important to note` and its variants |
| `hedge-stack` | one of `quite`, `rather`, `somewhat`, `fairly`, `relatively`, then a word, then `and` or `but`, then a second one of them: `quite good and rather bad` fires, `quite and rather` does not |
| `in-conclusion` | a line opening `in conclusion`, `to summarize`, `to sum up`, `in summary` or `overall,` |
| `not-only` | `not only` with a matching `but also` within 60 characters and no full stop between them |
| `exclamation` | an exclamation mark, unless preceded by `<` or followed by `=` |
| `abstract-noun` | `capability`, `functionality`, `offering`, `methodology`, `paradigm`, `ecosystem`, `touchpoint`, `learnings`, `vertical`, `granularity`, `synergy` |
| `grand-abstraction` | `the essence of`, `at its core`, `fundamentally about`, `a testament to` and their siblings |
| `unglossed-jargon` | `idempotent`, `orthogonal`, `canonical`, `deterministic`, `composable`, `primitive`, `surface area` |

**The last three run on `prose` only.** `content` is everything the hook protects, and most of it is
reference: `orthogonal` and `canonical` are exactly the right words in a measurement table. `prose`
is the subset a person reads to decide whether to use this, and the plain-English floor applies
there. An earlier version banned the words everywhere and fired 28 times on correct writing.

A project with no `prose` list in its config, or no config at all, never runs those three.

## What the output means

A file with hits prints a blank line, then its path, then one line per hit: the line number, the
pattern name, and the line trimmed to 90 characters. The line shown is the stripped line, so quoted
text and code have already gone from it. Paths are printed relative to the working directory, so a
file outside the project prints as a chain of `../`.

Then a blank line and one of two endings. `clean: no tells in <n> files` and exit 0, or the total,
then a count per pattern with the advice attached, worst first, and exit 1. The file count is every
path it was given or found, including the ones it could not open, and not the number with hits in
them.

A pattern that matches twice on one line prints once and counts twice. The tally at the end is for
the whole run rather than per file.

One thing the tally gets wrong. `not-x-but-y` is two expressions under one name, and the summary
looks the advice up by name, so it always prints `"not X, it is Y". Just say Y.` even when what
fired was the bare `Not a guideline, a hook` shape. The line numbers above it are still right.

## Two things to know before trusting a line number

Both are verified against the script rather than inferred.

**Line numbers drift downwards after anything removed whole.** A fenced code block, a ban section or
a curly-quoted run is replaced with nothing, taking its newlines with it. A tell on real line 7,
after a five-line code fence, is reported as line 3. Search for the text printed beside the number
rather than jumping to the line.

**The line form of the escape hatch does nothing here.** `<!-- stet-allow: reason -->` is tested for
per line, but the tag rule above has already replaced the comment with a space by the time that test
runs, so the line is checked anyway. `sums` implements both forms correctly and `reference/sums.md`
describes both; only the whole-file form works in `tells`.

Which leaves one working exemption in this command, and it is blunt. Take the comment above, drop
the colon and the reason, and it exempts the entire file: before the marker as well as after, since
that test runs on the raw text before anything is split into lines. Putting one at the end of a line
to excuse that line stops the whole file being checked.

Raw text means raw. The bare marker exempts the file from inside a code fence, from inside backticks
and from inside a quotation, so a document showing a reader what the marker looks like has to write
it the way this one does, with a colon and a reason.

## Never

- Never add a pattern for a stylistic preference. Each one costs every writer in the project an
  argument, so it has to be a habit that marks text as generated.
- Never park a bare `stet-allow` comment on a line to quiet one finding. It silently unchecks
  everything else in that file.
- Never widen a `prose` glob to make a floor rule stop firing. The three floor rules are gated to
  `prose` because reference material is allowed its exact words, and moving the glob moves every
  other check with it.
- Never delete a pattern rather than exempt the quotation that tripped it. Quotes, backticks and a
  never section are all already exempt.

## Done when

The command prints `clean` over the whole project, and every `stet-allow` marker in the corpus is
one somebody can explain.
