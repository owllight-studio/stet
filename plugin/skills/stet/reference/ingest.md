# stet ingest

Read everything that is already there. Claim it for the author. Report what you found.

This is the first command for any project that has content, and it runs before `init`. You cannot
usefully describe what a project is until you have read what it already says.

## Why claiming comes first

A project adopting Stet has content written by a person who did not ask you for help with it. The
default is not "unknown ownership" and it is certainly not "yours". It is **theirs**.

So `ingest` writes `owner: human` onto everything it finds, and the author hands pieces over
afterwards with `release`. Opt-in to agent authorship, never opt-out.

This is also what makes Stet useful in the first minute rather than the first week. Point it at two
hundred files with no metadata and it becomes protective immediately.

## Do this

### 1. Find the content

Read `stet.config.json` if it exists. If it does not, look for content the way a person would:

- Common directories: `content/`, `docs/`, `posts/`, `pages/`, `src/content/`, `_posts/`
- Common formats: `.md`, `.mdx`, `.json`, `.yaml`, `.html`
- Ignore: `node_modules`, build output, anything gitignored

Run `node ${CLAUDE_PLUGIN_ROOT}/skills/stet/scripts/scan.mjs` to get the inventory: files, formats,
sizes, word counts, and whether any of them already carry metadata.

**Do not guess at the boundary.** If it is ambiguous whether a directory is content or code, ask.
Claiming a source file as prose is a mess to undo.

### 2. Read it, actually read it

Not a sample. Every file, or as many as the context allows, and say plainly which ones you skipped.

You are reading for four things:

- **What this project is.** You will need this for `init` and it is cheaper to notice now.
- **How it sounds.** Sentence length, whether it addresses the reader, whether it hedges, what it
  refuses to do. `voice` will do this properly; note what jumps out.
- **What it claims.** Every figure, date, version and comparative. These are the staleness surface.
- **What is broken.** Contradictions between pages, dead links, sections that stop mid-thought,
  claims that disagree with each other.

### 3. Claim it

Write ownership metadata to every file, in the format the file already uses:

```yaml
---
stet:
  owner: human
  claimed: 2026-08-16
---
```

For formats that cannot carry frontmatter, write a sidecar `<file>.stet.yaml`. For JSON block
documents, add a `stet` key per block if blocks are addressable, and per document if they are not.

**Change nothing else.** Not a typo, not a heading level, not a trailing space. An ingest that
edits content is an ingest nobody will run twice.

### 4. Report

The report is the deliverable. Structure it as:

**What this is** — one paragraph, what the project appears to be for and who it is written for.

**How it sounds** — three or four observations with an example line for each. Quote real sentences.

**The inventory** — files, words, formats, and the shape of it: how many pages, how deep, how
uneven.

**Claims that will go stale** — every figure with no recorded source, grouped by how load-bearing it
is. This is usually the most useful part of the whole report and the one that sells the tool.

**What is already wrong** — contradictions, dead ends, duplicated content, pages that no other page
links to.

**What I would do next** — usually `voice`, then `ia`. Say why.

## Do not

- **Do not fix anything.** You are reading, not editing. Every problem goes in the report.
- **Do not claim code.** A `.tsx` file that happens to contain a sentence is code.
- **Do not invent the voice.** `voice` derives it properly, from the whole corpus, with the author
  confirming. Your notes here are observations, not a definition.
- **Do not skip the boring files.** The one nobody thinks about is where the contradictions live.

## Done when

Every content file carries `owner: human`, nothing else in any file changed, and the author has a
report they would have paid for on its own.
