# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Existing, and not a greenfield decision. `site/` is hand-written static HTML and CSS with no
framework, one 40-line script for the colour-scheme switch, and one Node build script,
`site/build-voices.mjs`, which generates `site/voices.html` from the voice preset files so the page
cannot describe the library from memory. Five pages: `index`, `ownership`, `map`, `checks` and the
generated `voices`. Deployed on Vercel from `vercel.json`, which sets the output directory to `site`
and runs that build. No external font, no CDN, no analytics, no request that leaves the origin.

## Users

People who point a coding agent at writing. Primarily Claude Code users with a content codebase: a
marketing site, a documentation tree, a manuscript, a paper, a collection of songs. They are usually
the author of the words as well as the operator of the agent, which is why the two roles collide.

The visitor to stet.style is that person before they have installed anything. They arrive to learn
what Stet is, want to go deep on whichever part concerns them, and should leave able to add it to
Claude and run it.

## Product Purpose

**The problem Stet exists to solve is that a reader can spot generated writing on sight.** It is
verbose and uniform and there is nobody in it. A cover letter, a property listing, marketing copy, a
novel, the second act of a script: it all arrives sounding the same. The writing pays for that
whether or not a machine actually wrote it.

**Stet's answer is seventeen voices that somebody actually read for.** Everywhere else a voice is an
adjective in a prompt, and nothing can check an adjective. These were built the other way round:
somebody read Darwin's fifteen Beagle notebooks, Chandler and Hammett and Cain, ninety-three pages
of Kubernetes documentation. What came back was measurements, and those sit in the file beside the
titles they came from, so drift is something a person can point at rather than argue about. Each
file also names how a fake of that register gives itself away. Describe a voice instead and the
agents go and do that reading, then hand back the author's own `VOICE.md`.

The reader-facing claim is the seventeen voices and what they were read off. The counting is the
evidence underneath it and never the pitch: nobody wants a voice because somebody counted it.

**On top of that sits the rest of the product.** The one that matters most: an author can lock a
sentence, and the agent then rewrites everything before and after it and not that. The use for it is
the line that has to land exactly as written, which is usually a slogan, a testimonial, a promise,
or the one paragraph somebody laboured over.

Around that sits a content management system built inside the AI tool rather than beside it, so the
editing surface is the conversation and the store is the project's own files: states, policies,
figures kept current against their sources, citations checked, and the drift between all of it
reported.

Success is that the copy does not read as generated, and that the lines the author wrote themselves
are still there after the next rebuild.

## Positioning

**A voice that was counted, not described.** Every competing approach to this is a prompt with
adjectives in it: "friendly but professional", "clear and concise". Those are unfalsifiable, so
nothing can check them and nothing does. A Stet voice carries numbers, so drift is detectable rather
than a matter of opinion, and `measure` reports it. Ten presets written from instinct during
development all had their central mechanic backwards, which is the evidence for why the research
half is not decoration.

**The tells are named, catalogued and checked.** Each voice file ends by naming how imitation of it
fails. Read together, the 104 of them are a catalogue of what generated prose does, and `tells` is
the checker that refuses to let those constructions ship.

**Locking is per sentence and survives a rebuild.** Ownership is stored content-addressed as the
author's exact words rather than as a position in a file, so a claim survives everything around it
moving and lapses on its own when the words change. A neighbouring product can offer a style guide
or a linter. What it cannot offer is a rewrite that leaves your slogan standing.

The refusal is the enforcement, not the point. A `PreToolUse` hook refuses an edit to owned content
rather than a rule in a prompt asking nicely, because this project exists after its author watched
an agent break its own documented conventions repeatedly inside one session while sincerely
believing it was following them.

Two further positions a neighbouring product could not truthfully copy:

**Two halves, and only one needs a model.** Whether a figure still matches the command that produced
it, whether a corpus spells a word two ways, whether a cited paper has been retracted, whether a
marked file is actually covered by a glob: none of that is a reading. Those ship as a zero-dependency
CLI that runs in CI. The readings stay in the plugin. The boundary is stated on the help screen
rather than blurred.

**No rendering code, on purpose.** Stet governs content files and never owns components, routing or
CSS, which is what lets it run on Next, Astro, Hugo, a docs folder or a pile of Markdown.

## Operating Context

Used from inside Claude Code, in the author's own repository, while doing something else. The
typical moment is an author asking for a redesign or a fix three files away and their prose coming
back "improved".

A project adopts Stet by adding `stet.config.json`, which declares which files are content and
optionally how to fetch a fact. Content carries its metadata inline where the format allows
frontmatter, in a `stet` key for JSON, and in a `<file>.stet.yaml` sidecar otherwise.

The CLI half is designed to sit in CI, where a stale figure or a retracted citation fails the build.

## Capabilities and Constraints

Thirty-six commands in seven groups: Establish, Compose, Authorship, Evaluate, Refine, Maintain,
Operate. Twenty-five of them ship in the CLI, which is the subset that needs no model, and seven
need one. Eight of the thirty-six shipped with no reference document and no row in the table until
`doctor` was taught to check per command rather than per file.
Ten agents for work too large for the conversation or too close to it to judge.

**Voice works two ways and both are the product.** There is a library of presets, currently 17, each
carrying measured figures and the named texts they were counted from, and it grows. **A preset is
finished work and stands on its own:** name one and write, and nothing further is asked. And there
is the other path: describe the voice you want in your own words, and the voice agents go and read
the actual texts, count them, and build it for you. A preset also serves as a place to start from
for an author who would rather adjust something measured than begin at nothing. Either path ends in
the author's own `VOICE.md`, which is the only file any command reads, and a voice built to
somebody's brief belongs to them and never enters the library.

Three states, because there are three behaviours: `draft`, `approved`, `authored`. Approval confers
ownership. Ownership is per sentence and content-addressed, stored as the author's exact words, so a
claim survives everything around it moving and lapses on its own when the words change.

Constraints that bind: zero runtime dependencies, Node 20 or newer, MIT, no network access in the
checks that do not need it, and no rendering code ever.

Undecided and not to be implied: the npm package name is unregistered and the CLI is not published,
which is an oversight rather than a position. The plugin, installed from the Claude Code
marketplace, is the primary distribution.

## Brand Commitments

The name is **Stet**, the proofreader's mark meaning let it stand: ignore the correction, the
original is right. Three senses are kept distinct in writing. `Stet` capitalised is the product,
`stet` lower case is the command, and *stet* in italics is the mark.

The site has its own voice, recorded at `site/VOICE.md`, chosen on a proof sheet from a custom brief
and belonging to this project alone. It is never a library preset. The project's own voice, for
everything that is not the site, is `VOICE.md` at the root.

The house style is British: -ise and -our spellings, no serial comma, percent written as a word,
figures in numerals, punctuation outside the closing quote. **No em dashes anywhere.** The absence
is the single cheapest way for writing not to read as generated, and it is enforced by the project's
own checker.

stet.style is a sibling of impeccable.style, and the author has named Impeccable's own positioning
as the reference for how this page should work: a claim, then the capability, then the vocabulary,
then a demonstration, then how to add it, with sub-pages for depth.

## Evidence on Hand

**No users, no testimonials, no adoption of any kind exists.** The page must never imply otherwise,
and no figure about usage, downloads, teams or results may appear.

What does exist, all verified against primary sources during development and all carrying named
citations in the repository:

- Reference rot above 70 percent of URLs in the *Harvard Law Review*, the *Harvard Journal of Law
  and Technology* and the *Harvard Human Rights Journal*, and 50 percent in Supreme Court opinions
  (Zittrain, Albert and Lessig, *Harvard Law Review Forum* 127, 2014).
- Content drift at 76.35 percent, 184,065 of 241,091 references (Jones et al., *PLOS ONE*, 2016).
- 5.4 percent of post-retraction citation contexts acknowledging the retraction, 722 of 13,252
  (Hsiao and Schneider, *Quantitative Science Studies* 2(4), 2021).
- 49.6 percent of psychology articles reporting a null-hypothesis test carrying at least one p-value
  inconsistent with its own test statistic (Nuijten et al., *Behavior Research Methods* 48(4), 2015).
- 1,922 court filings containing fabricated citations by August 2026, 347 carrying a monetary
  penalty.

Countable facts about the artefact, each one counted rather than remembered: 29 scripts, 13 library
modules, 28 reference documents, 10 agents, 17 measured voice presets, 130 tests, 25 CLI commands,
zero dependencies.

And the project governs its own content with its own hook, and its own checks run clean over it.

## Product Principles

1. **Enforcement is not advice.** Anything that matters is a check or a refusal, never a rule in a
   file. The project distrusts its own instructions on principle.
2. **Say what was not done.** Silence reads as "there was nothing to do", which is a different and
   false statement. Every command that skips content reports what it skipped.
3. **A figure with no source is a defect.** Never store a value that has not been verified. Null is
   honest; a guessed value looks like knowledge.
4. **The author's words are the author's.** Approval confers ownership, and nothing else transfers
   it: not time, not the writing being good, not the agent having written every word.
5. **A check that fires on correct work gets switched off.** Precision beats recall for anything that
   interrupts somebody.

## Accessibility & Inclusion

No product-specific requirement has been established beyond what the site holds itself to. The site
is five static pages with one interactive component, the light/dark/auto switch. Every route colour
clears 3:1 against its own ground and every bullet glyph clears 4.5:1 against its own disc, measured
rather than assumed, and colour never carries meaning on its own: a route is always also named and
lettered.
