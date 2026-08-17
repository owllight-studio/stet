---
stet:
  state: draft
  author: agent
---

# stet ia

What exists, how it relates, and what each page is for. Writes `IA.md`.

Run after `ingest` and `init`. Structure is easier to judge once you know what the project is for.

## What this is not

It is not a sitemap. A sitemap is a list of URLs and can be generated. This is the document that
says **what job each page does and how a reader gets to it**, which is the part that cannot be
generated and the part that decides whether a site works.

The test: if two pages would give the same answer to "why does this exist", one of them should not.

## Do this

### 1. Map what is there

Every page, its route, and one sentence on what it is for. Written in the author's terms, not from
the heading.

Run `node ${CLAUDE_PLUGIN_ROOT}/skills/stet/scripts/links.mjs` for the graph: what links to what,
what nothing links to, what links nowhere.

### 2. Find the reader's paths

For each reader from `CONTENT.md`, trace what they actually do. Where do they land, what do they
need next, does the page they need get linked from where they are.

Most structural problems are a page that answers a question nobody has yet, sitting where nobody
looks.

### 3. Name the problems

The ones worth naming, roughly in order of how much damage they do:

**Orphans.** Nothing links here. It may be the best page on the site.

**Overlap.** Two pages doing one job. Decide which one wins and what happens to the other.

**A missing landing.** A section with depth but no front door, so the only way in is a search result
that lands three levels down.

**Depth without a spine.** Deep pages with nothing tying them to the top. A reader who arrives from
outside has no idea where they are.

**A page that is really three.** One page carrying three unrelated jobs because each was added when
it came up.

**Content with no home.** Something the project clearly needs to say and no page says.

**Named for the system, not the reader.** A section called what it is built from rather than what a
person came for.

### 4. Propose the shape

Not just the problems, the destination. What the structure should be, what moves, what merges, what
gets written, what gets deleted. Order it by how much a reader gains, not by how easy it is.

Deleting is a legitimate proposal and usually the one nobody makes.

## IA.md

```markdown
# Information architecture

## The shape
A short description of how this is organised and why that suits the reader. One paragraph.

## Pages
| Route | Job | Reader | Reached from |
|---|---|---|---|
Every page. Job is one sentence, in the reader's terms.

## Paths
For each reader from CONTENT.md: where they arrive, what they need next, and whether the structure
gives it to them.

## Rules
Structural decisions that hold for new pages. Where a new dungeon page goes. What earns a top-level
nav entry. When a section gets a landing page.

## Known problems
What is wrong now, and what would fix it. Kept until fixed rather than deleted when noticed.
```

The **Rules** section is what makes this worth writing. Without it, every new page is a fresh
argument, and the structure drifts one reasonable decision at a time.

## Do not

- **Do not restructure while mapping.** This command produces a document. Moving pages is
  `restructure`, and it is a separate decision the author makes with the map in front of them.
- **Do not propose a structure the content cannot fill.** A beautiful eight-section IA over four
  pages of content is a plan to write twenty pages, which is a different conversation.
- **Do not treat the nav as the IA.** The nav is one view of it. Pages reachable only by link, or
  only by search, are still in the structure.
- **Do not skip the paths.** A page list is inventory. Paths are the part that finds the problems.

## Read it with an agent

`stet-corpus-reader` returns what exists and, more usefully, what job each page does. A page's job is
not what it says, it is what somebody can do afterwards, and a page whose job nobody can name is
usually the problem this command exists to find.

## Done when

`IA.md` exists, every page has a one-sentence job, every reader from `CONTENT.md` has a traced path,
the problems are listed with fixes, and the Rules section can settle where the next page goes
without another conversation.
