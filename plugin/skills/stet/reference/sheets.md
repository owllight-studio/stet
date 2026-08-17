---
stet:
  state: draft
  author: agent
---

# Sheets

Work somebody does on a page, that comes back into the session.

```js
import { serve, shell, CSS, inline, esc } from "./lib/sheet.mjs";
```

## The chat is not the only surface

For a whole class of work it is the wrong one. Reading thirty blocks and deciding on each. Comparing
four versions of a paragraph. Reacting to a claim you disagree with. Saying which of two registers is
worse. **None of those are things a person does well in a scrolling transcript, and all of them are
things a person does easily on a page.**

So a command does not have to answer in prose, and neither does an agent. It can build a page, wait
while somebody works through it, and hand the decisions back.

That changes what is worth asking an agent to do. An agent that must return text is limited to work
whose output is text. An agent that can return a surface can do work whose output is a series of
judgements, which is most of the interesting work in writing.

## What a sheet is for, and what it is not

**Use one when the work is a series of judgements over many items**, or a comparison the eye makes
faster than the ear, or anything where the person needs to see the thing in context before deciding
about it.

**Do not use one for a question.** A single question belongs in the conversation, and a page that
asks one thing is a worse conversation with an extra step. `proof` earns its page because there are
fifty blocks. A sheet asking whether to proceed does not.

## The shape

`serve()` handles the server, the routes, the wait, and writing the answer out. A sheet supplies
what is particular to it:

```js
const state = await serve({
  title: "Claims",
  data: () => claims,
  page: (data) => shell({ title: "Claims", body: render(data), script: PAGE_JS }),
  on: {
    decide: (body, state) => { state.decisions.set(body.id, body); return { ok: true }; },
  },
  say: () => `${claims.length} claims to judge.`,
  writeTo: answerPath(root, "claims"),
});
```

It **blocks until the page says it is done**, which is what makes a sheet usable from a session:
nothing downstream runs against a half-made decision.

## The rules that keep sheets feeling like one product

**Use the shared CSS.** It is exported for that reason. A galley proof: paper, the copy editor's
non-photo blue, red for deletion, green for the author's own hand. A sheet with its own look is a
sheet that reads as a different tool.

**Never decide anything for the person.** Silence is not approval, and a sheet that treats an
untouched item as accepted has taken a decision nobody made. `proof` learned this the expensive way,
by approving twenty-three blocks somebody had never opened.

**Say what a control will do before it does it.** "Publish all 31" beats "Done".

**Write back what was rejected, not just what was chosen.** What somebody turned down says as much
about what they want as what they kept, and throwing it away means the next round rediscovers it.

**An untouched thing keeps its own bytes.** If a sheet displays content differently from how it is
stored, and the person changed nothing, write the original back. Reformatting a file somebody only
read is the tool doing what this project exists to stop an agent doing.

## For an agent

You may build a sheet. Say what it is for in one line, run it, and wait. Do not summarise the page in
chat before they have opened it, and do not act on a decision the sheet did not return.

## Done when

The person shut the page and the session has their decisions, including the ones they made by
leaving something alone.
