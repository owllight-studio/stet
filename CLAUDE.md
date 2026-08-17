# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Stet is a Claude Code plugin plus a zero-dependency npm CLI: editorial tooling that stops agents
rewriting words they do not own and keeps the rest true. There is no rendering code and there never
will be, which is what lets it run on Next, Astro, Hugo or a folder of Markdown. Read `README.md` for
the pitch, `docs/spec.md` for why the model is shaped this way, and
`plugin/skills/stet/reference/<command>.md` for any command before touching it.

## The rules that do not bend

These were learned expensively. They apply to your code, your prose and your replies.

**No em dashes. Anywhere.** Not in content, not in a code comment, not in a commit message, not in
your reply to the author. A colon, a full stop or a bracket is better in every case.

**Verify against the primary source before shipping a factual claim.** Not memory, not an adjacent
file that says something similar. Fetch the publisher's own page, run the command, read the file. Six
voice presets shipped with their central mechanic backwards because they were written from
impression, and a cooldown figure shipped wrong for the same reason.

**Never store a value you have not verified.** `null` is honest and gets said out loud. A guessed
boolean looks like knowledge and is not. The authority register in
`plugin/skills/stet/scripts/lib/authorities.mjs` carries four `null` positions for exactly this
reason.

**Fix the pattern, not the instance.** When you correct one occurrence, grep for every sibling and
either fix them all or say in your reply what you left and why.

**Every merge updates the documentation in the same change.** `SKILL.md`, the reference file, the
CLI command table and `README.md` are part of the feature, not a follow-up.

**A custom voice belongs to its author.** A voice researched to somebody's brief goes into their
`VOICE.md` and never into `plugin/skills/stet/voices/`. Presets come from published registers with
named practitioners and public texts.

**Keep replies short.** Two or three sentences. No header walls, no restating the question.

## Commands

```
npm test                 syntax check, then doctor, then the tells sweep. The whole suite.
npm run check            where the content disagrees with STYLE.md
node bin/stet.mjs        the CLI help, which lists both halves including what it cannot do
node bin/stet.mjs <cmd>  any one check, run against the current directory
node bin/stet.mjs help <topic>   prints reference/<topic>.md with the plugin paths rewritten
node site/build-voices.mjs       rebuilds site/voices.html from the voice files
npm pack                 the tarball. Test from the pack, not from the working tree.
```

There is no linter, and the only test framework is Node's own runner. `npm test` is the suite:
`node --check`, then `node --test test/*.test.mjs`, then `doctor` (drift between config, content
and plugin), then `tells` (the constructions that read as machine-written). To run one check alone,
run its script directly:
`node plugin/skills/stet/scripts/<name>.mjs`. Every script runs standalone and takes file arguments,
so `node plugin/skills/stet/scripts/style.mjs check README.md` is how you narrow a run.

`stet check` reporting disagreements is not automatically a failure. A quotation keeps its own
spelling whatever the style sheet says, and there are legitimate standing disagreements in this
repo. Read each one before changing a word.

## Architecture

**Two halves, and only one needs a model.** Whether a figure matches the command that produced it,
whether the corpus spells a word two ways, whether a cited paper is retracted: none of that is a
reading. Those ship as `bin/stet.mjs`, which has no dependencies and runs in CI. `init`, `voice`,
`ia`, `ingest`, `write`, `tighten` and `clarify` are readings and stay in the plugin where there is a
model. The help screen states the gap rather than blurring it. Keep it stated.

**One command, four places.** A command is a script in `plugin/skills/stet/scripts/`, a reference
document in `plugin/skills/stet/reference/`, a row in `plugin/skills/stet/SKILL.md`, and an entry in
the `COMMANDS` map in `bin/stet.mjs` if it needs no model. `doctor` reports the drift between them. A
command with no reference file is not built: say so rather than improvising one.

**The hook is the spine.** `plugin/skills/stet/scripts/hook-before-edit.mjs` runs on `PreToolUse` for
`Edit|Write|MultiEdit|NotebookEdit` and returns a deny decision. It is the only part of Stet that
does not depend on an agent choosing to cooperate. Three boundaries keep it from being a nuisance: no
`stet.config.json` means the project has not adopted Stet and the hook does nothing, only paths
inside the declared content globs are considered, and a file that does not exist yet is new content
and allowed. `.stet/admin.json` is the recorded escape hatch and is honoured before state is read.

**Three states, because there are three behaviours.** `draft` (an agent wrote it, an agent may
rewrite it), `approved` (an agent wrote it and a person accepted it, closed) and `authored` (a person
wrote it, closed and never regenerated). Approval is what confers ownership: not time, not the
writing being good, not having written every word. `policy` is orthogonal and says what may still be
done to closed content: `frozen`, `refresh` or `open`. `authored` plus `refresh` is the combination
the whole product exists to make expressible.

**Ownership is per sentence and content-addressed.** `owned` in the metadata is a list of sentences a
person wrote, stored as their exact words rather than as offsets. So a claim survives everything
around it moving, is checkable against any version of the file, and lapses on its own when the words
change. `lib/spans.mjs` does the matching; `lib/meta.mjs` reads and writes the metadata across
frontmatter, JSON documents and `<file>.stet.yaml` sidecars for formats that cannot carry it inline.
`meta.write` changes nothing else in the file, deliberately: it inserts JSON as text rather than
re-serialising, because a diff that looks like work somebody did is the worst kind of breakage.

**Figures are found by value, never by marker.** `lib/sources.mjs` runs a project's declared source
commands and looks for the resulting figure in the prose. Content stays ordinary prose with no
templating in it. A claim resolves to `current`, `stale`, `missing` or `broken`, and `missing`
changes nothing, because guessing which number in a paragraph was meant is how a tool silently
corrupts somebody's writing. Replacement keeps the written form the author chose: `47 percent`
becomes `52 percent`, not `52%`. Sources are declared in config only, never in content, because a
source is a shell command.

**A sheet is a surface, not a transcript.** `lib/sheet.mjs` serves a local page, blocks until the
person is done and writes the answer to `.stet/<name>.json`. Use it whenever the work is thirty
judgements in a row: proofing blocks, deciding style candidates, clearing failed claims. The palette
lives in `TOKENS` and is defined once. Duplicated CSS has already cost this project a real bug, where
an older copy later in a file won the cascade and every edit looked applied and did nothing.

**Agents are for work too large for the conversation or too close to it to judge.** They live in
`plugin/agents/`. Do not delegate the writing: `write`, `tighten`, `clarify` and `restructure` are
the work, and an agent that hands its prose to another agent has lost the thread.

**Voices are registers, not moods.** Each file in `plugin/skills/stet/voices/` carries measured
targets in frontmatter, the sources they were counted off, rules with a yes and a no for each, a
never list and a section on how imitating the register fails. A preset with no `sources` line was
written from instinct and the library says so. All 17 now carry one.

**A style sheet is not a voice.** `VOICE.md` says how it should sound; `STYLE.md` records what was
decided when a word could have gone either way. `style.mjs decide` refuses to overwrite a decision
silently, refuses reversals and refuses chains. Naming an authority is what keeps the sheet short:
Chicago 18th is the default, the Guardian is the British default, and an unverified position is
stored as `null`.

## Working in this repo

**Stet governs Stet.** `stet.config.json` declares which files are content, and the hook enforces
ownership over them. `content` is everything protected; `prose` is the subset a voice may be applied
to, because rewriting a column of sentence-length figures in a house voice destroys the thing that
made it useful. Run `node plugin/skills/stet/scripts/context.mjs` once per session and
`node plugin/skills/stet/scripts/owner.mjs <path>` before editing any content file. Exit 1 means you
may not.

**A style sheet entry that fires dozens of times is wrong.** `stet` becoming `Stet` fired 29 times
and every one was the CLI verb or the proofreader's mark. `authorship` becoming `ownership` fired 10
and half were the command group's proper name. Both needed a stated rule in prose plus entries
narrowed to the positions where the word can only mean one thing. The honest entries fire once or
twice. If a new entry fires broadly, the entry is wrong, not the corpus.

**Three words, three senses.** `Stet` is the product, `stet` is the command, *stet* in italics is the
proofreader's mark. Ownership is the property a file has; Authorship is the name of the command group
holding `claim`, `release`, `approve`, `proof` and `policy`.

**The house style is British** without exception in its own voice: -ise and -our spellings,
day-month-year, punctuation outside the closing quote, no serial comma, `percent` as a word,
figures in numerals. Quotations keep their own spelling.

**`package.json` `files` is a whitelist.** A new directory that ships has to be added to it, and the
package must be tested from a packed tarball rather than from the working tree.

The npm name `stet` is unregistered and the package is not published. Publishing needs the author to
run `npm login`; do not attempt it.
