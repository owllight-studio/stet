---
stet:
  state: draft
  author: agent
---

# stet mark

Set `state`, and optionally `author` and `policy`, on content files. The mechanism under `claim`,
`release` and `approve`.

```
node ${CLAUDE_PLUGIN_ROOT}/skills/stet/scripts/mark.mjs <draft|approved|authored> [--author human|agent] [--policy frozen|refresh|open] [path ...]
```

The state is the first argument and is required. With no paths it marks every content file the
project has.

## What it does, in order

1. Reads the first argument as the state. Anything outside `draft`, `approved` and `authored` prints
   the usage line and exits 2.
2. Pulls `--author` and `--policy` out of the remaining arguments, each taking the word after it. An
   unknown policy prints `policy must be one of: frozen, refresh, open` and exits 2. The author value
   is not checked against anything.
3. Takes the arguments that are left as file paths, made relative to the working directory. With
   none left, it asks `lib/find.mjs` for the project's content: the `content` globs in
   `stet.config.json`, or the conventional content directories when there is no config.
4. For each file, reads the existing Stet metadata, keeps every key already there, and sets `state`.
   Sets `author` and `policy` only when those flags were given.
5. Sets `approved` to today's date in UTC when the state is `approved`, and deletes `approved` for
   the other two states.
6. Writes the metadata back and prints a line per file.

Existing keys survive. `owned` sentences, `sources` and anything else in the block are carried
through untouched, and the rest of the file is not rewritten.

## Where the metadata goes

`lib/meta.mjs` decides, by extension. Markdown and the other frontmatter formats get a `stet:` block
in the frontmatter, added at the top of the file if there was none. JSON gets a `"stet"` key inserted
as text, so the rest of the document keeps its own formatting. Everything else, HTML included, gets a
`<file>.stet.yaml` sidecar beside it.

## What the output means

One indented line per file, the state then the path:

```
  approved  docs/a.md
  approved  docs/b.md  (frontmatter added)
  FAILED    docs/nope.md  ENOENT: no such file or directory, open '...'

2 of 3 files marked approved.
Closed to an agent. Approval is what made them the author's.
```

`(frontmatter added)` means the file had no frontmatter and a block was put at the top of it.
`FAILED` means the write threw, usually a path that does not exist or JSON that will not parse. The
count line says how many of the attempted files were written.

The closing line depends on the state: `authored` says the files are closed and may not be edited or
regenerated, `approved` says they are closed and approval is what made them the author's, `draft`
says they are open and should be approved once read.

## Exit codes

`2` for an unknown state or an unknown policy, before any file is touched. `0` otherwise, and that
includes a run where every file failed. Read the lines rather than the exit code.

## What it does not check

**It does not validate the combination.** `policy.mjs set` refuses a policy on a draft, `refresh`
with no sources and `frozen` with sources. `mark` accepts all three and writes them. Run
`policy.mjs check` afterwards if the policy came from here.

**It does not check who owns the file.** The state of the file being marked is read for its other
keys and never consulted as permission, so `mark draft` on somebody's authored page will write. The
PreToolUse hook does not see this either: it guards the edit tools, and this is a script.

**It does not check that a named path is content.** A path given on the command line is marked
whether or not any content glob covers it, and `doctor` will later report a file carrying metadata
that no glob covers.

**It does not remove anything.** There is no flag to clear `author` or `policy` once set. Only
`approved` is deleted, and only by marking a state other than `approved`.

## Never

- Never mark `approved` unless the author said to approve. Approval is theirs to give and yours to
  record.
- Never mark `draft` to get past a refusal. Releasing closed content is the author's decision, and
  the refusal is the model working.
- Never run it with no paths to fix one file. With no paths it marks the whole project.
- Never use it to set a policy on a draft. Approve the file first, then `policy.mjs set`, which will
  tell you when the combination is inert.

## Done when

Every file you meant to mark printed its state, nothing printed `FAILED`, and no file you did not
name changed.
