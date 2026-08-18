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

## What this is for

Anything written, and that is not a slogan: the model is about words and who owns them. A landing
page, a novel, a research paper, a script, a collection of songs. The states, the voice, the proof
sheet and every measurement apply the same way to all of them, because a line of a lyric and a line
of marketing copy are both somebody's words and the question of whether an agent may rewrite them
has the same answer.

A handful of checks are about structure rather than words and only make sense for some kinds, so a
project declares its kind and those switch off. See [reference/kinds.md](reference/kinds.md).

## Setup

**Run `context` first, every session.** One call, and it answers what is enforced, what you may
edit, what it sounds like and what to do next. Without it you discover all four by being refused.


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
| `style` | Establish | The decisions, as opposed to the voice. Built while editing, handed on | [reference/style.md](reference/style.md) |
| `style-sheet` | Establish | Decide the variants `style` found, on one page | [reference/style-sheet.md](reference/style-sheet.md) |
| `voice` | Establish | Derive or define the house voice | [reference/voice.md](reference/voice.md) |
| `voice-stats` | Establish | What a body of writing measurably does, in figures | [reference/voice-stats.md](reference/voice-stats.md) |
| `ia` | Establish | What exists, how it relates, what each page is for | [reference/ia.md](reference/ia.md) |
| `ingest` | Establish | Read existing content, claim it, report what is there | [reference/ingest.md](reference/ingest.md) |
| `outline` | Compose | Plan a piece before writing it | [reference/outline.md](reference/outline.md) |
| `write` | Compose | Author in the voice, to the IA | [reference/write.md](reference/write.md) |
| `expand` | Compose | A stub into a finished piece | [reference/expand.md](reference/expand.md) |
| `claim` / `release` / `approve` | Authorship | Whose words these are | [reference/claim.md](reference/claim.md) |
| `mark` | Authorship | Set state, author and policy directly | [reference/mark.md](reference/mark.md) |
| `proof` | Authorship | Read what an agent wrote, block by block, and decide | [reference/proof.md](reference/proof.md) |
| `policy` | Authorship | What may be done to them, and what they depend on | [reference/policy.md](reference/policy.md) |
| `mark` | Authorship | Set the state, the author and the policy on a file | [reference/mark.md](reference/mark.md) |
| `audit` | Evaluate | The sweep: stale claims, typed figures, orphans, voice breaks | [reference/audit.md](reference/audit.md) |
| `critique` | Evaluate | A scored review of one piece | [reference/critique.md](reference/critique.md) |
| `cite` | Evaluate | Does the source exist, is it retracted, is it the version to cite | [reference/cite.md](reference/cite.md) |
| `standing` | Evaluate | What every cited source was last time, and what has moved since | [reference/standing.md](reference/standing.md) |
| `verify` | Evaluate | Every claim checked against its real source | [reference/verify.md](reference/verify.md) |
| `sums` | Evaluate | The arithmetic a document does on itself, recomputed | [reference/sums.md](reference/sums.md) |
| `check` | Evaluate | Where the writing disagrees with the style sheet | [reference/check.md](reference/check.md) |
| `tells` | Evaluate | The constructions that read as machine-written | [reference/tells.md](reference/tells.md) |
| `measure` | Evaluate | Whether this matches the voice it claims to be in | [reference/measure.md](reference/measure.md) |
| `tighten` | Refine | Cut | [reference/tighten.md](reference/tighten.md) |
| `clarify` | Refine | Make it comprehensible to someone who is not the author | [reference/clarify.md](reference/clarify.md) |
| `restructure` | Refine | Reorder and regroup within a page | [reference/restructure.md](reference/restructure.md) |
| `refresh` | Maintain | Change the figure, leave the sentence | [reference/refresh.md](reference/refresh.md) |
| `claims` | Evaluate | The fact checker's sheet: every claim that failed, and what to do about it | [reference/claims.md](reference/claims.md) |
| `sheets` | Operate | Build a page somebody works through, and take the answer back | [reference/sheets.md](reference/sheets.md) |
| `kinds` | Operate | What kind of written thing this is, and which checks that switches off | [reference/kinds.md](reference/kinds.md) |
| `doctor` | Maintain | Drift between config, content and this plugin | [reference/doctor.md](reference/doctor.md) |
| `context` | Operate | What an agent needs to know before touching a word | [reference/context.md](reference/context.md) |
| `scan` | Operate | What content exists, and how much of it | [reference/scan.md](reference/scan.md) |
| `owner` | Operate | Who a file belongs to, and what may be done to it | [reference/owner.md](reference/owner.md) |
| `owner` | Operate | Who a file belongs to and what may be done to it | [reference/owner.md](reference/owner.md) |
| `admin` | Operate | When the hook is in your way: unlock, relock, and the record of why | [reference/admin.md](reference/admin.md) |
| `pin` | Operate | Make one command its own slash command | [reference/pin.md](reference/pin.md) |

Commands without a reference file yet are not built. Say so rather than improvising one.

## Agents

Ten, and each exists because the work is either too large for this conversation or too close to it
to judge honestly.

| Agent | Called by | Why not do it here |
|---|---|---|
| `stet-voice-builder` | `voice`, when there is nothing to go on | Most people cannot name the voice they want, and asking them to describe it returns adjectives |
| `stet-voice-researcher` | `voice`, with a persona | Ten presets written from instinct all had their central mechanic backwards. An impression of a voice is reliably an inversion of it |
| `stet-sample-reader` | `voice`, with samples | Reading somebody's whole back catalogue does not belong in the conversation that then writes their voice file |
| `stet-corpus-reader` | `ingest`, `ia` | Forty thousand words of somebody else's site, read once, reported in a page |
| `stet-style-sheet` | `style` | The error hides in the string a reader skips. A machine comparing repeated strings does not skip it |
| `stet-citation-checker` | `cite` | Whether a source exists is arithmetic; whether it supports the sentence is not |
| `stet-source-integrity` | `standing` | Whether a source still exists is arithmetic; whether the claim survives the source changing is not |
| `stet-continuity` | long works, and across them | No single reading holds four hundred pages, and the contradiction is never in one place |
| `stet-fact-checker` | `verify`, `audit` | Adversarial by design. A checker that also wrote the claim finds it convincing |
| `stet-critic` | `critique` | Fresh eyes on a finished piece, outside the attention gravity of having written it |

**The builder is the one that runs when the other four have nothing to work with.** A persona needs
naming, samples need existing, a corpus needs writing. Somebody starting from nothing has none of
those, and that is the normal condition rather than an edge case.

**Two of them are separations of concern rather than of size.** The researcher must resist writing
from memory; the sample reader must resist generalising from too little. The fact checker and the
critic ask different questions of the same page: is this true, and does this work.

**An agent can return a surface rather than prose.** A page somebody works through, with the
decisions coming back into the session. See [reference/sheets.md](reference/sheets.md). That is what
makes the builder and the fact checker worth having: their output is a series of judgements, and a
transcript is the wrong place to make fifty of those.

Do not delegate the writing. `write`, `tighten`, `clarify` and `restructure` are the work, and an
agent that hands its prose to another agent has added a layer and lost the thread.

**Plain English is the floor, and only a voice may raise it.** With no voice file, this is how you
write. With one, this is what you write underneath it, and the voice overrides any line of it that
it actually addresses.

- Simple words. No jargon. Where a technical term is genuinely needed, explain it briefly right
  where it appears.
- Prefer shorter sentences.
- When something happens, say what happened.
- Do not lean on a word or a phrase. Repetition of a shape is as loud as repetition of a word.
- Nothing abstract where something concrete will do.
- Clear and practical, always.

**A measured target is never a reason to break this.** If hitting `sentenceMax` or `secondPerson`
means adding a clause, the target is being gamed and the plain sentence wins. Say the drift out loud
instead. A page that satisfies every figure and has to be decoded has failed at the only thing that
mattered.

**And check the target before you obey it.** `sentenceMax` is a ceiling. A voice file writing
"longest: around 40" means do not run past forty, and for a while `measure` read that as "should be
about forty" and failed a page whose longest sentence was 29 words. Every long sentence written to
satisfy it was a finished sentence with a clause stapled on. `tells` now enforces the floor above on
everything in the config's `prose` list, so this is checked rather than remembered.

**Delegate the criticism, always.** Every command that produces prose finishes the same way: `tells`,
then `measure`, then `critique`, revising and re-running after each, and then `stet-critic` on the
four questions `critique` prints and cannot compute. That applies to `write`, `tighten`, `clarify`,
`restructure` and `expand` alike, and it is the difference between an author approving a draft and
an author repairing one. **Approval confers ownership. Repair does not.** If the first thing the
author changes on the proof sheet is something a check would have caught, the draft reached them too
early and the loop was cut short.

A piece that passes `tells` and `measure` has none of the countable faults, which is a lower bar than
good and a different one. Writing to the middle of every range at once hits every target and has no
rhythm, because the targets describe a distribution and the middle of a distribution is not a sample
from it.

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
