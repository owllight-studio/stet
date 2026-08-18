---
stet:
  state: draft
  author: agent
  sources: [library.presets]
---

# Voices

A library of 17 registers, not moods.

The job these serve is one sentence: **writing that does not read as written by a machine.** That is
not a taste preference. Readers told a headline was AI-generated rated it less accurate and were
less willing to share it, whether or not it was true and whether or not a machine wrote it (Altay
and Gilardi, *PNAS Nexus*, 2024, preregistered, n=4,976). That study manipulated the label rather
than the prose. The penalty therefore attaches to perceived authorship, and writing that merely
reads as generated plausibly pays it with no label attached and no way to appeal: an inference from
the finding, not the finding itself.

Each file here is a way of writing with its own rules, its own examples and its own refusals. None
of them is "professional" or "friendly": those are adjectives, and an adjective cannot be followed
or violated, so it cannot be a rule.

**A preset is finished work and stands on its own.** Somebody who names one and starts writing has
a complete voice and is asked for nothing further. It is also a place to start from when an author
would rather adjust something measured than begin at nothing: `voice` composes it with whatever else
they bring. Either way the result is written to their own `VOICE.md`, which is the only file any
command reads. Nothing in here is loaded at write time.

## Groups

**Core**, the general registers most projects want. Plainspoken, The Argument, The Broadsheet, The
Teacher, The Manual, Field Notes, The Catalogue.

**Marketing**, the registers that ask for something. Direct Response, The Pitch. Planned: The
Launch, The Case, The Founder Letter.

**Genre**, fiction registers, for anyone whose product has a world in it. Noir, The Locked Room,
The Bridge, Hard SF. Planned: Epic Fantasy, and the drama register.

**Fun**, invoked on purpose, for delight or for a joke that has to hold a whole page. Patch Notes,
Nature Documentary, The Sportscaster. Planned: The Chronicle, The Bureaucrat.

The fun and genre ones are built to the same standard as the rest. A voice that falls apart after
two sentences is a party trick, and a party trick is not worth shipping.

Planned means not written. It is listed here so the shape of the library is visible, not so it can
be picked.

## What never becomes a preset

**A voice somebody defined for their own project is theirs.** If an author describes a persona and
Stet researches it, measures it and writes it into their `VOICE.md`, that voice belongs to them. It
does not get cleaned up and added to this library, and the research behind it does not either.

This is not a courtesy. It is the same rule the rest of the product enforces: the author's words are
the author's, and a voice built to their brief is their words at the level that matters most. A
preset library that quietly absorbs what its users invent is doing precisely what the hook exists to
stop an agent doing to a paragraph.

Presets here come from published registers with named practitioners and public texts. The line is
whether it was somebody's own answer to the question of how their writing should sound.

## The shape of a preset

Frontmatter carries the name, the group, one line of description, the measured targets, and the
sources the targets were counted off. The body carries the one rule, the rules with a yes and a no
for each, the never list, and a section on how imitation of the register fails.

Every rule needs a counter-example. A rule without one is agreed with and then ignored.

Every preset needs at least one rule that costs something. A register that only adds permissions is
a mood.

**A preset with no `sources` line was written from instinct**, which means its figures are estimates.
That is a real state and the library says so rather than hiding it. None are currently in it, and the
last four were rebuilt on 17 August 2026.

## Feeling is the target. The rules are how it lands.

A register is not a set of measurements with the emotion removed. **Every preset here is a machine
for producing a particular feeling**, and what it contributes is the part nobody can supply from
instinct: how that feeling actually gets onto the page.

The distinction is between naming an emotion and delivering one.

- **Noir** never lets the narrator say he is frightened. "I couldn't hear my own footsteps. It was
  the walk of a dead man." The rule is *never name an emotion at the moment it is felt*, and the
  register's whole atmosphere comes out of obeying it.
- **The Teacher** is a warm register, and its warmth reduces to one instruction: *describe the
  material, never the reader's mind.* "This is easy" and "you'll love this" are assertions about the
  reader. "The algebraic form may seem opaque if you're not already familiar with it" is an
  assertion about the algebra. Same warmth, no contempt.
- **Nature Documentary** is among the most affecting registers on television and contains zero
  instances of "I" across 13,500 measured words. The feeling is carried entirely by what is
  described and when.
- **The Broadsheet** withholds feeling on purpose, and that is itself an emotional choice with a
  mechanism: every sourcing verb is "said", because *noted* and *emphasised* smuggle approval in
  exactly as *alleged* smuggles doubt.

So a voice brief should carry the feeling. "It should sound like somebody who has done this and is
telling you what it was actually like" is a usable brief, and the research turns it into rules.

**The adjective on its own is what fails.** "Warm", "confident", "authoritative", "friendly". Those
cannot be followed and cannot be violated, so they generate nothing and forbid nothing. They fail
because they stop at naming the feeling, and naming a feeling has never once put it on a page.

Le Guin put the reason in one line: *"Speech expresses character. It does so whether the speaker or
the author knows it or not."* Feeling arrives through the sentences whether you planned it or not,
which is precisely why it is worth planning.

## Two rules the research imposed on this library

**Count, do not characterise.** Ten presets were rebuilt after being measured, and every one of them
had its central mechanic wrong. Nature Documentary was written as long-then-short rhythm; the
autocorrelation is +0.16, so the lengths cluster. Noir was written around the simile, which is the
register's rarest move at one per 545 words in Chandler. The Teacher was written short, and the
measured median is 19 to 25 with wide variance, because uniform sentence length is a documented
marker of condescension rather than of kindness. Instinct got the direction of the effect backwards,
not merely the magnitude.

**The tells section is not optional, and here is why.** Hopkins, Ogilvy, Caples and Halbert were each
writing *against* the dominant register of their moment. So imitating their output reproduces the
opposite of their method, because the method was to sound unlike the prevailing voice and their
output is now the prevailing voice. Every register in this library has that trap in it. A file that
gives the rules without naming how following them fails is a file that teaches the costume.
