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

Takes no arguments. Anything you pass is ignored, including file paths, so there is no way to narrow
a run: it always reports the whole of the current directory.

Writes nothing, and always exits 0. A project with no content and a project fully claimed both come
back as success, so the output is the finding and the exit code is not.

## Why it exists

`ingest` claims files, and claiming a source file as prose is a mess to undo. So the reading comes
first and comes on its own: scan says what it can see and stops, and the author confirms the
boundary before anything is written.

## What it does, in order

**1. Reads `stet.config.json` in the current directory.** If the file is there but is not valid
JSON, scan prints the parse error on a `!!` line and carries on as though there were no config.

**2. Decides the boundary.** With a `content` list in the config, that list of globs is the
boundary. With no config, or a config carrying no `content`, it guesses: it looks in `content`,
`docs`, `posts`, `pages`, `src/content`, `_posts` and `data/content`, and says in the output that it
guessed.

Either way it only counts files with these extensions: `.md`, `.markdown`, `.mdx`, `.mdoc`, `.json`,
`.yaml`, `.yml`, `.html`, `.htm`. It skips dot-directories other than `.well-known`, and skips
`node_modules`, `.git`, `.next`, `dist`, `build`, `out`, `.vercel`, `.cache`, `coverage`,
`__pycache__`, `.venv` and `vendor`.

**3. Counts.** For each file: its extension, its directory, its words, and whether it carries stet
metadata.

**4. Prints four blocks.** The totals, the formats, the directories, and one closing line.

## What the output means

The first line is the file count and the total word count. The line under it is the boundary: the
config globs it used, or the directories it guessed at, and a guess comes with
`CONFIRM THIS BOUNDARY WITH THE AUTHOR BEFORE CLAIMING ANYTHING` in capitals.

**formats** is a count per extension, commonest first. A file with no extension is counted as
`(none)`.

**directories** is one row per directory, largest by word count first: files, words, the path, and a
flag in square brackets. `[claimed]` means every file in that directory carries metadata,
`[2/4 claimed]` means some do, and no flag means none do.

The closing line is one of three. Every file claimed, some claimed, or none, each with a sentence on
what to do next.

**With no files at all**, scan prints `No content found.` and then says which kind of nothing it is:
either it guessed and found nowhere to look, or the config points at nothing that exists. Those are
different problems, so the line is worth reading rather than skimming.

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
themselves are counted as content files and inflate the total.

## Never

- Never claim anything off a guessed boundary without the author confirming it. That is the whole
  reason this command reads and does not write.
- Never quote the word count as a count of prose.
- Never read `[claimed]` as approved, or as owned by an agent. It says a file has metadata.
- Never treat exit 0 as a pass. Scan has no failure state.

## Done when

The boundary is confirmed as the content the author means, and you know how many files are unclaimed
and which directories they are in, before `ingest` writes a single file.
