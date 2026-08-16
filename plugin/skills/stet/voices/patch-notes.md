---
name: Patch Notes
group: fun
description: A changelog. One change per line, verb first, numbers exact, and the joke under five percent.
feeling: Respect, mostly. Occasionally delight, and never at somebody's expense.
measured:
  sentenceMedian: 9
  sentenceP95: 20
  secondPerson: 0.05
  hedgesPerSentence: 0.0
sources: Valve (Team Fortress 2, Counter-Strike 2), Blizzard (World of Warcraft, Overwatch), Supergiant (Hades), Slack, Apple, 37signals
stet:
  state: draft
  author: agent
---

# Patch Notes

Derived from the real corpus rather than from an impression of it: Team Fortress 2 and
Counter-Strike 2 for the deadpan utilitarian house voice, World of Warcraft and Overwatch for
hierarchy and numbers, Hades for disciplined humour, Slack for sentence-level wit, Apple for the
zero-voice extreme.

## The one rule

**The utility carries the voice, never the other way round.** A joke reads as funny only against a
wall of flat, useful lines. Raise the density and the reader stops trusting any line to be literal,
which is the failure this register dies of.

The working number, counted across the corpus: **under five percent of lines**, and never two
adjacent. Hades runs several hundred entries with fewer than five asides. Team Fortress 2 averages
under one funny line per patch across hundreds of patches.

## The feeling, and how it gets there

**Respect, mostly. Occasionally delight, and never at somebody's expense.**

The joke ratio sits under 5 percent and no two adjacent, and that constraint is what makes the
funny ones land. A page of jokes is a page nobody trusts with a security advisory.

The emotional rules here are about **who the feeling is aimed at**. Never joke on a nerf, because it
reads as gloating at the player it affects. Never joke about the team. The good ones joke about the
artifact or the absurdity of the defect, which is affection rather than mockery.

"Never announce enthusiasm" is not a ban on being pleased. It is that "we're excited to" is the
writer's feeling, and the reader wants their own.

## Rules

### One change per line

If a bullet contains an "and" joining two different changes, it is two bullets. Entries run six to
fifteen words. Nothing in the real corpus passes twenty-five except a deliberately marked developer
note.

**Yes:** "Fixed drowning exploit that allowed players to regenerate health." (Team Fortress 2, 2008)
**No:** "Fixed a drowning exploit and also adjusted the health regeneration curve for consistency."

### One grammatical shape per line type

Three shapes exist. Products pick one per kind of entry and never mix them within a kind.

- **Fixes and additions: verb first, past.** The developer is the subject and is left out.
  "Added Goldrush." (Team Fortress 2)
- **Balance and state: component first, present.** The entry states what is now true, not what was
  done. "Self healing penalty increased from 25% to 40%." (Overwatch)
- **Defects: the bug is the subject, past continuous.** Describes the broken behaviour, which
  implies the fix. "Copying an email address was including the 'mailto:' prefix." (Slack)

Never future. No "will now", no "we plan to".

### Numbers exactly, in one convention

Arrow, from-to, or trailing parenthetical. Pick one and hold it. Mixing them inside a document is
the tell of an amateur.

**Yes:** "Bone Shield increases Armor by 115% of Strength (was 100%)." (World of Warcraft)
**No:** "Bone Shield armor scaling has been slightly improved."

Always state units. The only products that use relative descriptors are single-player ones where an
exact figure would be noise, and that is a deliberate exception rather than permission.

### The direction verb carries the nerf

Never label a change as a nerf or a buff. Increased, reduced, decreased, plus the number, is the
whole signal. Justification does not belong in the entry: it goes in a separately labelled
developer note, which is how a contentious change gets defended without contaminating the fact.

### The order never changes

New content, then balance, then fixes and miscellaneous. Same sections in the same sequence every
release, because the reader is scanning for the same heading they found last time.

### Deadpan beats a joke

The funniest line in this corpus was written with no comic intent: Valve fixing custom interfaces
that assumed the player was Gordon Freeman. An absurd fact reported completely straight outperforms
anything constructed.

## Where the joke may sit

Four places, and in none of them does it displace a fact.

**A parenthetical on a complete entry.** Delete the parenthesis and nothing is lost.
"Zagreus has lost the will to senselessly somersault in the House (reminder: no fighting in the
House!)" (Hades)

**The framing word inside a real fix.** The bug and its scope are fully stated; the adjective is
the joke. Slack calling a stray prefix "vestigial baggage".

**The empty release.** The safest slot in the register, because the joke replaces zero information.
"We don't have anything particular to call out for this release." (Slack)

**A named terminal slot.** Hades ends every patch with a Quote of the Patch, a real line from Homer
or Aeschylus. A reserved last position tells the reader where the voice lives and lets them stop
before it. Note that Supergiant's is dignified rather than comic, which is why it never wears out.

## Never

- Never joke on a security, data-loss or breaking-change entry. The funny products are silent
  exactly where the stakes are highest.
- Never joke on a nerf. It reads as gloating at the player it affects.
- Never write a fake entry. It costs the reader a lookup, and when they find nothing they distrust
  every line beside it.
- Never explain the joke, and never signal it with an emoji or a wink.
- Never announce enthusiasm. No "we're excited to", no "thrilled", no exclamation marks outside a
  deliberate aside.
- Never use marketing adjectives on your own work: powerful, seamless, revamped, game-changing.
- Never hedge a number.
- Never put justification inside an entry.
- Never use first person for the fix. "Fixed X", not "we went in and fixed X".
- Never joke about the team. The real ones joke about the artifact or the absurdity of the defect,
  never about the developers' suffering or their coffee intake.

## How pastiche fails

**The ratio inverts.** Imitators write ten funny lines and two real ones. The corpus writes two
hundred real lines and three funny ones. Without the utility underneath, there is nothing for the
joke to be deadpan against.

**The joke replaces the fact.** "Fixed the thing that was doing the thing." If a reader cannot tell
what changed, the entry failed however well it reads.

**Length inflation.** Real entries are six to fifteen words. Pastiche runs thirty to fifty, because
a setup and a punchline need runway. The moment a bullet needs a setup it has left the register.

**In-jokes needing context the reader lacks.** An internal codename signals that the document is
written for its authors.

**Puns on the product name.** Absent from the entire real corpus. Present in nearly every imitation.

**Applied where nothing changed.** This is a form for reporting deltas against a known prior state.
Used on a guide or a landing page it produces the tone with none of the structure, which is the most
common failure of all.
