---
name: stet
description: Use when writing, editing, auditing or refreshing content in a project - establishes who owns each piece of content and what may be done to it, derives and enforces a house voice, maps information architecture, and keeps claims true to their sources. Invoke for any content work, and always before editing prose you did not write.
stet:
  state: draft
  author: agent
---

# Stet

*stet*, the proofreader's mark meaning **let it stand**.

Content in this project carries an owner and a policy. Some of it is the author's and you may not
touch it. Some of it is yours to maintain, and leaving it stale is as much a failure as rewriting
what was not yours.

This skill is how you tell the difference.

## The three failures

You will commit all three, and the first one you will commit today.

**Writing too much.** This is the default failure and the one that costs the author most, because
unwinding it takes longer than writing would have. A sentence and a half doing the work of a
sentence. A preamble before a list. A qualifier nobody asked for. The fix is not to write long and
trim: trimming leaves the qualifiers in. Write the short version first and ship that.

The tells, in order of how often they show up: the em dash, the "not X, it is Y" construction, the
aphorism that summarises a paragraph nobody needed summarised, restating the question before
answering it, and explaining to readers what they obviously are.

**Never use an em dash.** Not in content, not in a commit message, not in your reply. A colon, a
full stop or a bracket is better in every case, and its absence is the single cheapest way for
writing not to read as generated.

**Rewriting what is not yours.** The author laboured over a paragraph. You were asked for something
else entirely and improved it on the way past. Nobody asked. This is the one that destroys trust,
because it is invisible until the author reads their own site and finds a stranger's voice in it.

**Leaving what you should refresh.** A sentence quotes a figure that moved. Nothing in the file
records where the figure came from, so nothing noticed, and the page states it with confidence.

## Setup

1. Run `node ${CLAUDE_PLUGIN_ROOT}/skills/stet/scripts/context.mjs` once per session, from the
   project root. It loads `stet.config.json`, `CONTENT.md`, `VOICE.md` and `IA.md` if they exist,
   reports what is missing, and tells you which command to run first. Follow its directives and do
   not rerun it.
2. Load the reference file for the command you are running. One file, the one that owns the request.
3. **Before editing any content file, check its state.** Run
   `node ${CLAUDE_PLUGIN_ROOT}/skills/stet/scripts/owner.mjs <path>`. Exit 0 means you may, exit 1
   means you may not. Unclaimed content answers no, because content with no record belongs to
   whoever wrote it, and that was not you.

## Commands

| Command | Group | What it does | Reference |
|---|---|---|---|
| `init` | Establish | What this project is, who reads it, what it must do | [reference/init.md](reference/init.md) |
| `voice` | Establish | Derive or define the house voice | [reference/voice.md](reference/voice.md) |
| `ia` | Establish | What exists, how it relates, what each page is for | [reference/ia.md](reference/ia.md) |
| `ingest` | Establish | Read existing content, claim it, report what is there | [reference/ingest.md](reference/ingest.md) |
| `outline` | Compose | Plan a piece before writing it | reference/outline.md |
| `write` | Compose | Author in the voice, to the IA | reference/write.md |
| `expand` | Compose | A stub into a finished piece | reference/expand.md |
| `claim` / `release` / `approve` | Authorship | Whose words these are | [reference/claim.md](reference/claim.md) |
| `policy` | Authorship | What may be done to them, and what they depend on | reference/policy.md |
| `audit` | Evaluate | The sweep: stale claims, typed figures, orphans, voice breaks | reference/audit.md |
| `critique` | Evaluate | A scored review of one piece | reference/critique.md |
| `verify` | Evaluate | Every claim checked against its real source | reference/verify.md |
| `tighten` | Refine | Cut | reference/tighten.md |
| `clarify` | Refine | Make it comprehensible to someone who is not the author | reference/clarify.md |
| `restructure` | Refine | Reorder and regroup within a page | reference/restructure.md |
| `refresh` | Maintain | Update what policy allows, leave the rest | reference/refresh.md |
| `doctor` | Maintain | Drift between config, content and this plugin | reference/doctor.md |

Commands without a reference file yet are not built. Say so rather than improvising one.

## Routing

- **A named command:** load its reference and follow it.
- **No argument:** report which of `CONTENT.md`, `VOICE.md` and `IA.md` exist, and offer the first
  missing step. Never auto-run.
- **A project with no `stet.config.json`:** the only correct first move is `ingest`, then `init`.
  Do not write content into a project that has not been read.
- **Any other content request:** treat it as ordinary work, but the ownership rule still applies and
  is not negotiable.

## The rules that do not bend

**Everything existing is the author's until they say otherwise.** `ingest` claims every file it
finds as `authored`. That is the safe default and the honest one: those words were written by a
person who did not ask you. Content becomes yours by being handed over, never by being found.

**Ownership is per sentence.** A file's state is the coarse default. `owned` lists sentences a
person wrote, by their exact words, and those are closed to you inside a file that is otherwise
yours to edit. Work around them. Correcting one line of somebody's paragraph does not hand you the
rest, and correcting one line of yours does not hand them the rest either.

**Approval confers ownership.** Your own draft is yours until a person reads it and accepts it, and
then it is theirs and you may not change it. Not time, not the writing being good, not you having
written every word of it: only approval. And only the author performs it. You record it.

**Ownership beats instruction.** "Improve this page" is not permission to rewrite an owned section
inside it. Improve what you may, and tell the author what you left and why. If the whole page is
owned, say so and stop.

**A figure in prose is a query or it is a bug.** Where a project declares sources, a number written
by hand is a defect, not a style choice. It looks correct until the data moves, and then it lies
without changing.

**Proposing is not editing.** You may always show the author a rewrite of their own words. Show it
in your reply. Do not put it in the file.

**The short version first.** Not a long draft trimmed afterwards. Trimming leaves the qualifiers
in, which is why every trimmed draft still reads long.

**Report what you did not do.** Every command that skips content because of ownership must list what
it skipped. Silence reads as "there was nothing to do", which is a different and false statement.
