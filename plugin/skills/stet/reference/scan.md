---
stet:
  state: draft
  author: agent
---

# stet scan

What content exists, and how much of it. The inventory `ingest` starts from.

```
node ${CLAUDE_PLUGIN_ROOT}/skills/stet/scripts/scan.mjs
```

It needs no model, so it ships in the CLI as well: `stet scan`, or `node bin/stet.mjs scan` from a
checkout, runs the same script.

Takes no arguments. Anything you pass is ignored, including file paths, so there is no way to narrow
a run: it always reports the whole of the current directory. That directory decides the entire
result, because `stet.config.json` is read from there as well.

Writes nothing, and always exits 0. A project with no content and a project fully claimed both come
back as success, so the output is the finding and the exit code is not.

## Why it exists

`ingest` claims files, and claiming a source file as prose is a mess to undo. So the reading comes
first and comes on its own: scan says what it can see and stops, and the author confirms the
boundary before anything is written.

## What it does, in order

**1. Reads `stet.config.json` in the current directory.** If the file is there but is not valid
JSON, scan prints the parse error on a `!!` line and carries on as though there were no config. So
the report under that line is a guess, complete with the CONFIRM banner below, next to a
`stet.config.json` that is sitting right there.

**2. Decides the boundary.** With a `content` list in the config, that list of globs is the
boundary. With no config, or a config carrying no `content`, it guesses: it looks in `content`,
`docs`, `posts`, `pages`, `src/content`, `_posts` and `data/content`, and says in the output that it
guessed.

Files found by walking a directory are kept only if they carry one of these extensions: `.md`,
`.markdown`, `.mdx`, `.mdoc`, `.json`, `.yaml`, `.yml`, `.html`, `.htm`. A config glob that names a
single existing file is taken as content whatever the file is called, which is the only way a file
with no extension enters the count.

The walk skips anything whose name starts with a dot, files as well as directories, with
`.well-known` the one exception, and skips `node_modules`, `.git`, `.next`, `dist`, `build`, `out`,
`.vercel`, `.cache`, `coverage`, `__pycache__`, `.venv` and `vendor`. Both rules apply below the
point a glob starts from, so `docs/**/*.md` quietly misses everything in `docs/dist`, while a glob
written to start inside `dist` is walked as normal.

**3. Counts.** For each file: its extension, its directory, its words, and whether it carries stet
metadata.

**4. Prints four blocks.** The totals, the formats, the directories, and the closing lines.

## What the output means

The first line is the file count and the total word count. The line under it is the boundary: the
config globs it used, or the directories it guessed at, and a guess comes with
`CONFIRM THIS BOUNDARY WITH THE AUTHOR BEFORE CLAIMING ANYTHING` in capitals.

**formats** is a count per extension, commonest first. A file with no extension is counted as
`(none)`.

**directories** is one row per directory, largest by word count first: files, words, the path, and a
flag in square brackets. Files at the top of the boundary have a path of `.`. `[claimed]` means
every file in that directory carries metadata, `[2/4 claimed]` means some do, and no flag means none
do.

The closing block is one of three. Every file claimed is a single line saying the project has been
ingested before, and stops there. Some claimed gives the ratio and then a second line: an ingest was
interrupted or content has been added since, so claim the rest. None claimed says every file belongs
to whoever wrote it, then to claim them all as `owner: human` and let the author hand pieces over.

**With no files at all**, scan prints `No content found.` and then says which kind of nothing it is:
either it guessed and came back with nothing, whether or not any of the usual directories exist, or
the config points at nothing that exists. Those are different problems, so the line is worth reading
rather than skimming.

## Two counts that are not what they look like

**Words are whitespace-separated tokens in the whole file.** Frontmatter, HTML tags, code blocks and
YAML keys all count. It is a size, useful for ordering directories and for knowing what you are
taking on. It is not a prose word count and should not be quoted as one.

**Claimed means metadata is present, and nothing more.** A file counts as claimed when a
`<file>.stet.yaml` sidecar sits beside it, or a `.json` document has a `stet` key, or the file opens
with a frontmatter block containing `stet:`. Scan does not read the state, the policy or the owner,
so a claimed file might be `draft`, `approved` or `authored` and this command cannot tell you which.
`context`, `owner` and `audit` are where that lives.

One consequence of guessing: `.yaml` is a content extension, so when there is no config the sidecars
themselves are counted as content files. They inflate the total, and each one counts as unclaimed
in its own right, so they drag the claimed ratio down as well.

## Never

- Never claim anything off a guessed boundary without the author confirming it. That is the whole
  reason this command reads and does not write.
- Never quote the word count as a count of prose.
- Never read `[claimed]` as approved, or as owned by an agent. It says a file has metadata.
- Never treat exit 0 as a pass. Scan has no failure state, and a file it cannot read counts as
  nought words and unclaimed rather than saying so.

## Done when

The boundary is confirmed as the content the author means, and you know how many files are unclaimed
and which directories they are in, before `ingest` writes a single file.
