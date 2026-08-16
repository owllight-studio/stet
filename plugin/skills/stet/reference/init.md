# stet init

What this project is, who reads it, and what it has to do for them. Writes `CONTENT.md`.

Run after `ingest` on a project with content. Run first on an empty one.

## Why this exists

Every later command needs it. `write` needs to know who the reader is. `critique` needs to know what
the content is for before it can say whether it works. `audit` needs to know what a claim being
wrong would cost. Without `CONTENT.md` every one of those degrades into generic writing advice.

## Do this

Ask, one question at a time. Do not present a form. Each answer should change what you ask next, and
if it does not, you asked the wrong question.

Start from what `ingest` told you, so the author is correcting a draft rather than filling in blanks.
"This reads like it is for people who already play the class and want to get better, not for people
choosing one. Is that right?" beats "who is the audience?" by a distance, because people describe
their own audience badly and correct a wrong description well.

### The questions that matter

**What is it.** In one sentence, the way the author would say it to a friend. Not the tagline.

**Who reads it.** Specific enough to exclude someone. "Developers" excludes nobody. "People who
already chose this framework and are stuck on the third day" is a reader you can write for.

**What they should be able to do afterwards.** The test every page can be measured against.

**What it must never be.** The anti-goal. This is the highest-value answer in the whole interview
and the one nobody volunteers. Ask for it directly. "What would make you close the tab on a site
like this?"

**What makes it different.** If the honest answer is "nothing", that is worth knowing, and the
content has to work harder.

**What is true here that is not true elsewhere.** Constraints, house facts, things that must stay
consistent across every page. A version number, a supported platform, a claim the project stands on.

## CONTENT.md

Write it as prose with headings, not a filled-in template. It is read by an agent that reasons over
it, and templates produce reasoning about the template.

```markdown
# Content

## What this is
One paragraph. What it is, in the author's own words.

## Who reads it
Specific enough to exclude someone. What they already know. What they came for.

## What they should be able to do
The test. A page that does not move a reader toward this is not earning its place.

## What this must never be
The anti-goals, stated flatly. These are enforced, not aspirational.

## House facts
Things every page must agree on. Each with a source if it has one.

## Sources
Where facts come from, and which are live rather than typed.
```

## Do not

- **Do not write it alone.** A `CONTENT.md` you invented is a fiction every later command will
  reason from confidently.
- **Do not accept the marketing answer.** "For everyone who wants to learn" is not a reader.
  Ask again.
- **Do not skip the anti-goals.** A document with only goals cannot refuse anything, and refusing is
  most of what taste is.
- **Do not stop at four questions because the answers were good.** The sixth question is where the
  house facts come from, and house facts are what `audit` checks against.

## Done when

`CONTENT.md` exists, the author read it and did not wince, and it contains at least one sentence
about what this must never be.
