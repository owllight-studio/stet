---
stet:
  state: draft
  author: agent
---

# Voices

A library of registers, not moods.

Each file here is a way of writing with its own rules, its own examples and its own refusals. None
of them is "professional" or "friendly": those are adjectives, and an adjective cannot be followed
or violated, so it cannot be a rule.

A preset is a starting point and never a finished voice. `voice` composes it with whatever else the
author brings, and the result is written to their own `VOICE.md`, which is the only file any command
reads. Nothing in here is loaded at write time.

## Groups

**Core** are general registers most projects want: Plainspoken, The Manual, The Argument, Field
Notes, The Broadsheet, The Teacher, The Catalogue.

**Marketing** are the registers that ask for something: The Pitch, The Launch, The Case, Direct
Response, The Founder Letter.

**Fun** are registers invoked on purpose, for delight or for a joke that has to hold for a whole
page: Patch Notes, Noir, Nature Documentary, The Sportscaster, The Chronicle, The Bureaucrat.

The fun ones are built to the same standard as the rest. A voice that falls apart after two
sentences is a party trick, and a party trick is not worth shipping.

## The shape of a preset

Frontmatter carries the name, the group, one line of description, and the measured targets. The body
carries the one rule, the rules with a yes and a no for each, and the never list.

Every rule needs a counter-example. A rule without one is agreed with and then ignored.

Every preset needs at least one rule that costs something. A register that only adds permissions is
a mood.
