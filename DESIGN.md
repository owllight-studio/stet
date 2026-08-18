---
stet:
  state: draft
  author: agent
---

# Design

The design system of **stet.style**, derived from the shipped site rather than from intentions.
Everything below is in `site/stet.css` and can be checked against it.

## The world

**Transit signage.** The proofreader's *stet* mark is a row of dots laid under a line of text. A
transit line with stations is a row of dots on a rule. They are the same drawing, so the site is
built out of that one mark, top to bottom.

The reason it fits this product and not merely this name: a diagram is the layer that survives while
the city around it gets rebuilt, which is the claim Stet makes about a sentence. And a transit system
is a system rather than a costume, so it holds up across five pages instead of decorating one.

**What the world forbids.** No cards. No shadows, no gradients, no rounded panels, no glass, no
border-radius on anything that is not a station. Rank is carried by weight, rules and reversal,
because that is how a real sign does it. Colour appears only as a route.

## Type

One face, at every size, everywhere on the site.

```
--face: "Helvetica Neue", Helvetica, Arial, "Liberation Sans", sans-serif;
```

Self-hosted nothing and downloaded nothing: the face is whatever the machine already has, in that
order of preference. `font-synthesis-weight: none`, so a machine without a real bold shows a real
weight rather than a smeared one.

| Role | Setting |
|---|---|
| Page title | `clamp(40px, 7.4vw, 82px)` / .98 / `-.042em` |
| Section head | `clamp(27px, 3.4vw, 38px)` / 1.06 |
| Body | 17px / 1.55 / `-.006em` |
| Lede | `clamp(18px, 2.1vw, 22px)` / 1.42 |
| Sign label (`.sign`) | 700 11px, `letter-spacing .13em`, uppercase |
| Table cell | 15.5px |
| Station caption | 13px / 1.35 |

Headings are 700 and tighten as they grow, which is the one typographic move the whole site makes.
`.sign` is the signage label and it is set the same way in every context it appears: the route name
above a section, the column head in a table, the caption on a held sentence.

Measure is capped at `62ch` on every paragraph and list. Wide tables scroll inside `.scroll` rather
than stretching the page.

## Colour

Two grounds and seven routes. There is nothing else.

```
:root  --paper #f4f4f1  --ink #0e0f10  --soft #5c5f62  --rule #d3d3ce  --hair #e3e3df  --panel #e9e9e5
dark   --paper #0c0d0e  --ink #f2f2ef  --soft #9ea1a4  --rule #2b2d2f  --hair #1d1f21  --panel #17191a
```

| Route | Group | Light | Dark |
|---|---|---|---|
| `.r-establish` | Establish | `#0039a6` | `#4a8dff` |
| `.r-compose` | Compose | `#e54c00` | `#ff8a3d` |
| `.r-authorship` | Authorship | `#d6231c` | `#ff6259` |
| `.r-evaluate` | Evaluate | `#007c33` | `#35c46a` |
| `.r-refine` | Refine | `#9c2b96` | `#dd76d6` |
| `.r-maintain` | Maintain | `#b07f00` | `#fccc0a` |
| `.r-operate` | Operate | `#5b5e61` | `#a3a7ab` |

A route class sets two custom properties, `--route` and `--route-on`, and any element inside it
adopts them. That is the whole colour API: put `r-evaluate` on a section and its rail, bullets,
flags and left rules become green without another declaration.

**The light-mode orange and yellow are darkened off the transit originals, deliberately.** A track is
a graphic somebody has to trace with their eye, so every route clears 3:1 against its own ground.
Bright transit yellow measures 1.69 against this paper, which is a line you cannot follow. Every
bullet glyph clears 4.5:1 against its own disc. Body text measures 17.4:1, secondary text 5.8:1 on
light and 7.5:1 on dark.

**Colour never carries meaning alone.** A route is always also named and lettered.

## Light, dark and auto

Three states, from one set of tokens.

- Bare `:root` is the complete light palette.
- `@media (prefers-color-scheme: dark)` guarded by `:root:not([data-theme="light"])` redefines only
  what changes, so the default follows the machine.
- `:root[data-theme="dark"]` redefines the same set again, so the switch wins in both directions.

Auto stores nothing. Light and dark stamp `data-theme` on the root and remember it in
`localStorage`. The anti-flash half runs inline in each page head before first paint; the rest is
`site/mode.js`, which is 40 lines and the only script on the site.

## The line

The site's one structural device, in two orientations.

**Down a page (`.line` / `.stop`).** Each section is a station: a 30px disc centred on the small
route label that opens it, and an 8px track running down to the next station. The disc carries a 6px
`--paper` ring so it reads as sitting on the line rather than behind it. There is no grey base
track: the line begins at the first station and ends at the last, which is what a terminus looks
like. The colour changes at each station, the way a map draws an interchange.

Geometry, desktop: rail 46, disc 30 spanning 0 to 30, track 8 spanning 11 to 19. Mobile: rail 30,
disc 22, track 6. Both are written into the stylesheet as comments beside the numbers, because two
parallel misaligned tracks is exactly the bug this shape invites.

**Across a page (`.stations`).** The strip map on `map.html`. Seven columns on every route, not one
per station, so station three of one line sits directly above station three of the next and a short
route simply terminates early. Even gaps, aligned columns, and a terminus that means something. The
terminus is drawn as a ring rather than a solid.

Below 860px the strip map turns through 90 degrees: each station draws the segment down to the next
one, centre to centre, so wrapped labels of different heights still join up exactly.

## Components

| Class | What it is |
|---|---|
| `.masthead` | Sticky, 2px ink underline, wordmark left, route nav right, mode switch far right |
| `.pair` | The two-column grid. Claim left, evidence right |
| `.strip` | The install line, set like a platform indicator: reversed cap, command, note |
| `.specimen` | A labelled before and after. The one place prose may sound generated |
| `.panel` | A 2px ink box carrying real command output or a stated position |
| `pre.out` | Command output, quoted verbatim. Never a mocked-up terminal with a fake prompt |
| `.doc` / `.held` | A document with one sentence held behind a 6px route rule |
| `.verdict` | The hook refusing: a 30px route flag beside the reason |
| `.legend` | The seven groups as seven rows, bullet and commands |
| `.counts` | Countable facts, divided by hairlines |
| `table.plain` | 2px ink head rule, hairline row rules, no zebra, no vertical rules |
| `.note-block` | An aside behind a 6px route rule |
| `.voice` | One preset: the reading on the left, the figures it was counted off on the right |

`.bullet` is the station roundel and takes `.sm` and `.lg`. It is the only circle on the site apart
from the stations themselves.

## Rules and dividers

Three weights and they mean different things. 2px ink is a structural division: the masthead, the
foot of the hero, the head of a table. 1px `--rule` is a panel edge. 1px `--hair` is a row within a
list. A 6px route rule marks something held or quoted.

## Layout

`--page: 1200px`, 24px gutters, 16px on mobile. The breakpoints are 900px, where every two-column
grid collapses and the strip map turns vertical, and 780px, where the masthead wraps its nav and the
rail narrows.

**Every section is two columns: the claim on the left, the evidence on the right.** `.pair` is the
device, with `.wide-right` and `.wide-left` for a 4:5 split when one side carries a table. Each
column lands near 60 characters at the page width, so the column is the measure.

**Nothing sits in a narrow column with empty page beside it.** A measure cap is a reading
constraint and never a layout, and capping prose inside a wide container is how a page ends up with
a third of its width dead. The 68ch cap on `p` is a backstop for the rare full-width paragraph, not
the thing that sets column width. If a block has nothing to put beside it, the section is wrong.
Section headings are uncapped so they run across the page rather than wrapping early.

Every grid track that holds prose is `minmax(0, 1fr)` rather than `1fr`. A bare `1fr` is floored at
the content's min-content width, which on this site produced a column wider than its own container.

## Accessibility

- Skip link on every page.
- `:focus-visible` outlines in the route colour, 3px, offset 2px.
- `[id] { scroll-margin-top: 118px }`, because the masthead is sticky and an anchor jump has to clear
  it.
- `prefers-reduced-motion` kills smooth scrolling and every transition.
- Contrast measured rather than assumed. The figures are in the Colour section above.

## Voice

Site copy is written to `site/VOICE.md`, which is this website's voice and nothing else's. It is not
a library preset and must never become one.

**The copy is measured, not eyeballed.** A reader must not be able to point at a sentence here and
say a machine wrote it, because that is the product's own claim. Run
`node bin/stet.mjs measure site/<page>.html` and hold to the site voice: 8 to 10 words typical, 30
to 40 percent under six words, and never two long sentences running together. The current pages sit
at a median of 7 to 8 words, 29 to 37 percent short, and zero adjacent-long pairs.

**The one exception is a `.specimen`.** A before-and-after has to have a before, and that side is
supposed to sound generated. Both sides carry a label so nobody has to guess which is which, and the
generated side sits inside quotation marks, which is the exemption `tells` already understands.

No apologising in the copy. A box explaining what the project has not got to yet is an aside nobody
asked for; state what is true and stop. Nothing on the site may imply adoption either: no user
counts, no logos, no testimonials, no social proof.

Everything passes `stet tells` and `stet check`.

## What is generated

`site/voices.html` is built by `site/build-voices.mjs` from the voice preset files, so the page
cannot describe the library from memory. The masthead and footer live in that script as strings
alongside the hand-written pages, and the two must be changed together. `site/logo.svg` and
`site/icon.svg` are the mark, in `currentColor` so one file serves both schemes.
