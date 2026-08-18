---
stet:
  state: draft
  author: agent
---

# stet style-sheet

The words the corpus writes two ways, on a page, one card each.

```
node ${CLAUDE_PLUGIN_ROOT}/skills/stet/scripts/style-sheet.mjs
```

Takes no arguments and reads none. Blocks until the page says it is done.

## What it opens

`.stet/style-candidates.json`, relative to the current directory. `stet-style-sheet` writes that
file, after running `style.mjs discover` and reading the corpus for the drift a word-frequency pass
cannot see.

If the file is not there the command prints the path it wanted, names the agent that writes it,
prints the JSON shape it expects and exits 1. If the file is there and holds no candidates it says
the corpus is not saying anything two ways that has not been decided, and exits 0.

## What the page shows

One card per candidate, quoted ones sorted to the bottom so nobody starts deciding them out of
momentum. Each card carries:

- the category as a tag, or `quoted` when the card is marked that way
- a warning on a quoted card saying the spelling belongs to whoever was being quoted
- the card's `note`, when it has one
- every form as a button, with how many times it appears, and `suggested` on the recommended one
- where each form was found: the first three files, then "and N more"
- a text box for a form that is not listed
- the reason, prefilled with the agent's `why`, editable
- **Record it** and **Leave it undecided**

Picking a form clears the free-text box. Typing in the free-text box wins over a picked button.

**Record it refuses two ways.** With no form chosen it says so. With no reason it says "Say why.
Without a reason this gets undone later" and puts the cursor in the reason box. That is the
reference's own rule about reasons, enforced on the page rather than hoped for.

**Done** is disabled until at least one card has been recorded or skipped.

## What Done writes

For every recorded card, the command runs `style.mjs decide <form> <as> --why "<reason>"` once for
each form that is **not** the one chosen. A card with three forms therefore writes two entries. A
card left undecided writes nothing.

`decide` is the only thing that writes `STYLE.md`, here as everywhere. It refuses an existing
decision, a reversal and a chain, and the sheet keeps each refusal rather than swallowing it.

Then `.stet/style-decided.json` is written:

| | |
|---|---|
| `decided` | every recorded card in full, plus the form chosen and the reason given |
| `left` | the ids of cards nobody touched |

**A card explicitly left undecided is in neither list.** `left` holds only the cards that were never
acted on, so "leave it" and "never opened it" come back as different states, and the second one is
the one in the file.

## What the terminal says

```
2 decided, 1 deliberately left, 3 entries written to STYLE.md.
  not written: fact-checker -> fact checker. This reverses a decision. ...
4 never looked at, which is not the same as agreed.
```

The first count is cards recorded on the page. The last is entries `decide` accepted, which is
higher when a card had more than two forms and lower when `decide` refused. A card can be counted as
decided and write nothing, and the `not written` line under it is why.

Exits 0. The only non-zero exit is the missing input file.

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
