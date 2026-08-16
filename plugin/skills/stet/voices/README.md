---
stet:
  state: draft
  author: agent
---

# Voices

A library of registers, not moods.

The job these serve is one sentence: **writing that does not read as written by a machine.** That is
not a taste preference. Readers told a headline was AI-generated rated it less accurate and were
less willing to share it, whether or not it was true and whether or not a machine wrote it (Altay
and Gilardi, *PNAS Nexus*, 2024, preregistered, n=4,976). The penalty attaches to how prose reads,
so prose that merely sounds generated pays it with no label attached and no way to appeal.

Each file here is a way of writing with its own rules, its own examples and its own refusals. None
of them is "professional" or "friendly": those are adjectives, and an adjective cannot be followed
or violated, so it cannot be a rule.

A preset is a starting point and never a finished voice. `voice` composes it with whatever else the
author brings, and the result is written to their own `VOICE.md`, which is the only file any command
reads. Nothing in here is loaded at write time.

## Groups

**Core**, the general registers most projects want. Plainspoken, The Argument, The Broadsheet, The
Teacher, The Manual, Field Notes, The Catalogue.

**Marketing**, the registers that ask for something. Direct Response, The Pitch. Planned: The
Launch, The Case, The Founder Letter.

**Genre**, fiction registers, for anyone whose product has a world in it. Noir, The Locked Room,
The Bridge, Hard SF, The Kitchen. Planned: Epic Fantasy, and the drama register.

**Fun**, invoked on purpose, for delight or for a joke that has to hold a whole page. Patch Notes,
Nature Documentary, The Sportscaster. Planned: The Chronicle, The Bureaucrat.

The fun and genre ones are built to the same standard as the rest. A voice that falls apart after
two sentences is a party trick, and a party trick is not worth shipping.

Planned means not written. It is listed here so the shape of the library is visible, not so it can
be picked.

## The shape of a preset

Frontmatter carries the name, the group, one line of description, the measured targets, and the
sources the targets were counted off. The body carries the one rule, the rules with a yes and a no
for each, the never list, and a section on how imitation of the register fails.

Every rule needs a counter-example. A rule without one is agreed with and then ignored.

Every preset needs at least one rule that costs something. A register that only adds permissions is
a mood.

**A preset with no `sources` line was written from instinct**, which means its figures are estimates.
That is a real state and the library says so rather than hiding it. Four are currently in it.

## Two rules the research imposed on this library

**Count, do not characterise.** Six presets were rebuilt after being measured, and every one of them
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
