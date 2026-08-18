---
stet:
  state: draft
  author: agent
---

# stet style-sheet

The words the corpus writes two ways, on a page, one card each.

```
node ${CLAUDE_PLUGIN_ROOT}/skills/stet/scripts/style-sheet.mjs
stet style-sheet
```

A person does the deciding, so the command needs no model and ships in the CLI too. Both lines run
the same script. Takes no arguments and reads none. Blocks until the page says it is done.

## What it opens

`.stet/style-candidates.json`, relative to the current directory. `stet-style-sheet` writes that
file, after running `style.mjs discover` and reading the corpus for the drift a word-frequency pass
cannot see.

If the file is not there the command prints the path it wanted, names the agent that writes it,
prints the JSON shape it expects and exits 1. If the file is there and holds no candidates it says
the corpus is not saying anything two ways that has not been decided, and exits 0.

## What the page shows

One card per candidate, quoted ones sorted to the bottom so nobody starts deciding them out of
momentum. Nothing else moves: within each group the cards stay in the order the brief listed them,
which is worth knowing when you are writing the brief. Each card carries:

- the category as a tag, or `quoted` when the card is marked that way, or `varies` when the brief
  gave no category
- a warning on a quoted card saying the spelling belongs to whoever was being quoted
- the card's `note`, when it has one
- every form as a button, with how many times it appears, and `suggested` on the recommended one
- where each form was found: the first three files, then "and N more", or `unrecorded` when the
  brief listed no files for that form
- a text box for a form that is not listed
- the reason, prefilled with the agent's `why`, editable
- **Record it** and **Leave it undecided**

Picking a form clears the free-text box. Typing in the free-text box wins over a picked button.

**Record it refuses two ways.** With no form chosen it says so. With no reason it says "Say why.
Without a reason this gets undone later" and puts the cursor in the reason box. That is the
reference's own rule about reasons, enforced on the page rather than hoped for.

**Done** is disabled until at least one card has been recorded or skipped.

Each answer goes back to the server as the card is acted on, keyed by the card's id, so a card can be
answered again and the last answer is the one kept. Recording something you skipped, or skipping
something you recorded, both work.

## What Done writes

For every recorded card, the command runs `style.mjs decide <form> <as> --why "<reason>"` once for
each form that is **not** the one chosen. A card with three forms therefore writes two entries. A
card left undecided writes nothing.

A form typed into the free-text box is never one of the listed forms, so every listed form gets an
entry: a three-form card decided that way writes three, not two.

`decide` is the only thing that writes `STYLE.md`, here as everywhere. It refuses an existing
decision, a reversal and a chain, and the sheet keeps each refusal rather than swallowing it.

The page then replaces itself with a short finish screen giving the number written and telling you
to go back to the terminal.

Then `.stet/style-decided.json` is written:

| | |
|---|---|
| `decided` | the candidate as the brief gave it, plus `as` for the form chosen and `action: "record"`. The brief's own `why` is overwritten by the reason typed on the page, so the agent's suggested reason is gone |
| `left` | the ids of cards nobody touched |

**A card explicitly left undecided is in neither list.** `left` holds only the cards that were never
acted on, so "leave it" and "never opened it" come back as different states, and the second one is
the one in the file.

## What the terminal says

Two lines on startup, the rest after the page is done:

```
Style sheet: http://localhost:4744
7 to look at.

Written to /path/to/project/.stet/style-decided.json

2 decided, 1 deliberately left, 3 entries written to STYLE.md.
  not written: fact-checker -> fact checker. This reverses a decision. ...
4 never looked at, which is not the same as agreed.

`style.mjs check` will now find anywhere the content still disagrees.
```

The first count is cards recorded on the page. The last is entries `decide` accepted, which is
higher when a card had more than two forms and lower when `decide` refused. A card can be counted as
decided and write nothing, and the `not written` line under it is why. `decide` answering "already
decided" counts towards that number even though it added nothing, because it is not a refusal.

Exits 0 once the page says it is done. A missing input file prints the shape it wanted and exits 1.
Unreadable JSON in that file, or a port already taken, crashes with a stack trace instead of
reporting, and exits 1 that way.

## The port

4744, or `STET_SHEET_PORT`. The command prints the URL and waits. It does not open a browser.

## Never

- Never write `STYLE.md` alongside this. One writer, or the two copies drift and `decide`'s guards
  stop applying to half the entries.
- Never record a card whose only difference is inside a quotation. The quoted marking is there
  because the honest answer is to leave those alone.
- Never treat an untouched card as agreed. It is in `left` for a reason.
- Never fill the reason box with a description of the difference. It becomes the line in `STYLE.md`,
  and "these are spelled differently" stops nobody changing it back.

## Done when

Every card is recorded or deliberately left, every `not written` line has been read and either
fixed by hand in `STYLE.md` or accepted, and `style.mjs check` has been run to find where the
content still disagrees.
