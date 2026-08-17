/**
 * A sheet: work somebody does on a page, that comes back into the session.
 *
 * The chat is not the only surface, and for a whole class of work it is the wrong one. Reading
 * thirty blocks and deciding on each, comparing four versions of a paragraph, reacting to a claim
 * you disagree with, saying which of two registers is worse: none of those are things a person does
 * well in a scrolling transcript, and all of them are things a person does easily on a page.
 *
 * So an agent does not have to return text. It can build a page, block until the work is done, and
 * hand the decisions back. Which changes what an agent can usefully be asked to do, and is the
 * reason this file exists rather than a fourth hand-written server.
 *
 * Three sheets were written before this and each one reimplemented the same server, the same
 * block-until-done, and the same colour tokens copied a third time. Duplicated CSS has already cost
 * this project a real bug once, where an older copy later in a file won the cascade and every edit
 * looked applied and did nothing.
 *
 * A sheet supplies what is particular to it: a title, the data, the page, and what to do with a
 * decision. Everything else is here.
 *
 *   import { serve, CSS } from "./lib/sheet.mjs";
 *
 *   const { decisions, done } = await serve({
 *     title: "Claims",
 *     data: () => claims,
 *     page: (data) => html,
 *     on: { accept: (d, body) => ..., },
 *     say: (n) => `${n} decided`,
 *   });
 */

import { createServer } from "node:http";
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";

/**
 * The world every sheet is drawn in.
 *
 * A galley proof: paper, a copy editor's marks, and the non-photo blue pencil that printers could
 * not photograph. Blue is the accent, red is deletion, green is the author's own hand. None of them
 * is decoration; they are the colours the craft actually uses.
 *
 * Defined once. A sheet that wants its own look is a sheet that will not read as part of the same
 * product.
 */
export const CSS = `
:root {
  --paper:#fbfbf9; --edge:#f1f1ec; --ink:#16161a; --soft:#55555f; --faint:#8b8b95;
  --rule:#e2e2db; --pencil:#2c6d9e; --wash:#eaf2f8; --strike:#c0392b; --mine:#1e7a52;
  --serif:"Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif;
  --mono:ui-monospace,"SF Mono",SFMono-Regular,Menlo,Consolas,monospace;
}
@media (prefers-color-scheme:dark){:root{
  --paper:#14141a;--edge:#1b1b22;--ink:#eeeef0;--soft:#a9a9b4;--faint:#74747f;
  --rule:#2b2b34;--pencil:#7db8e0;--wash:#1b2733;--strike:#e07a6e;--mine:#5fbf90;}}
*{box-sizing:border-box}
body{margin:0;background:var(--paper);color:var(--ink);font-family:var(--serif);font-size:18px;line-height:1.65}
.wrap{max-width:54rem;margin:0 auto;padding:0 1.5rem 9rem}
header{padding:2.5rem 0 1.5rem;border-bottom:1px solid var(--rule)}
.mark{font-family:var(--mono);font-size:.9rem;letter-spacing:.22em;text-transform:uppercase}
.mark b{font-weight:400;border-bottom:2px solid var(--pencil);padding-bottom:2px}
h1{font-size:2.2rem;font-weight:400;letter-spacing:-.02em;margin:1.4rem 0 .7rem;text-wrap:balance}
.lede{color:var(--soft);margin:0 0 1rem;max-width:44rem}
h2{font-size:1.3rem;font-weight:400;margin:0 0 .9rem}
h3{font-size:1.02rem;font-weight:400;margin:0 0 .4rem}
section{border-top:1px solid var(--rule);padding:1.9rem 0 1.2rem}
p{margin:0 0 1rem}
code{font-family:var(--mono);font-size:.88em;color:var(--pencil)}
pre{background:var(--edge);border:1px solid var(--rule);padding:1rem;overflow-x:auto;
  font-family:var(--mono);font-size:.78rem;line-height:1.6;color:var(--soft)}

/* A tag. Provenance, verdict, state: anything one word says about the thing next to it. */
.k{font-family:var(--mono);font-size:.6rem;letter-spacing:.14em;text-transform:uppercase;
   padding:.18rem .45rem;border-radius:2px;white-space:nowrap;vertical-align:2px;flex:none}
.k-good,.k-measured,.k-ok{color:var(--pencil);background:var(--wash)}
.k-mine,.k-stated,.k-kept{color:var(--mine);background:color-mix(in srgb,var(--mine) 12%,transparent)}
.k-bad,.k-inferred,.k-false{color:var(--strike);background:color-mix(in srgb,var(--strike) 12%,transparent)}
.k-none{color:var(--faint);background:var(--edge)}

button{font-family:var(--mono);font-size:.68rem;letter-spacing:.12em;text-transform:uppercase;
  padding:.42rem .85rem;border:1px solid var(--rule);background:transparent;color:var(--soft);
  cursor:pointer;border-radius:2px;transition:color 160ms ease,border-color 160ms ease}
button:hover{color:var(--ink);border-color:var(--pencil)}
button.primary{color:var(--pencil);border-color:var(--pencil)}
button.primary:hover{background:var(--wash)}
button:disabled{opacity:.4;cursor:default}

textarea,input[type=text]{font-family:var(--serif);font-size:.92rem;padding:.5rem .7rem;
  border:1px solid var(--rule);background:transparent;color:var(--ink);border-radius:2px;
  width:100%;line-height:1.5;resize:vertical}
textarea:focus,input:focus{outline:none;border-color:var(--pencil);background:var(--wash)}
label{font-family:var(--mono);font-size:.62rem;letter-spacing:.14em;text-transform:uppercase;
  color:var(--faint);display:block;margin-bottom:.3rem}

.bar{position:fixed;left:0;right:0;bottom:0;background:var(--paper);
  border-top:1px solid var(--rule);padding:.85rem 1.5rem}
.barin{max-width:54rem;margin:0 auto;display:flex;gap:.75rem;align-items:center;flex-wrap:wrap}
.barin[hidden]{display:none}
.count{font-family:var(--mono);font-size:.72rem;color:var(--faint)}
.count b{color:var(--ink);font-weight:400}
.bar button{margin-left:auto}

/* Working. The mark this project is named after, drawn: a row of dots laid under the text left to
   right, which is how stet is written on paper. A spinner would say nothing about what it is doing. */
.working{display:none;align-items:center;gap:.75rem;flex:1}
.working.on{display:flex}
.dots{flex:1;height:7px;
  background-image:radial-gradient(circle at 3px 3.5px,var(--pencil) 1.6px,transparent 1.8px);
  background-size:10px 7px;background-repeat:repeat-x;
  -webkit-mask-image:linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent);
  mask-image:linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent);
  animation:lay 1.1s linear infinite}
@keyframes lay{from{background-position-x:0}to{background-position-x:10px}}
@media (prefers-reduced-motion:reduce){.dots{animation:none}}

.finished{text-align:center;padding:5rem 1.5rem}
.finished p{color:var(--soft);max-width:34rem;margin:0 auto 1rem}
`;

export const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** The small subset of Markdown every sheet needs inline. Nothing else is guessed at. */
export const inline = (md) =>
  esc(md)
    .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "<i>$1</i>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");

export const shell = ({ title, body, script = "" }) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title><style>${CSS}</style></head>
<body>${body}<script type="module">${script}</script></body></html>`;

/**
 * Serve a sheet and wait for the person to finish.
 *
 * Blocks until the page says it is done, which is what makes a sheet usable from a session: the
 * command does not return until the work has happened, so nothing downstream runs against a
 * half-made decision.
 *
 * `on` is a map of route name to handler. A handler gets the parsed body and returns whatever the
 * page should hear back. `/api/done` is built in and ends the wait.
 */
export async function serve({
  title,
  page,
  data = () => ({}),
  on = {},
  port = Number(process.env.STET_SHEET_PORT ?? 4744),
  say,
  writeTo,
}) {
  const state = { decisions: new Map(), done: false, published: false };

  const server = createServer(async (req, res) => {
    const send = (code, body, type = "application/json") => {
      res.writeHead(code, { "content-type": type, "cache-control": "no-store" });
      res.end(typeof body === "string" ? body : JSON.stringify(body));
    };
    const read = async () => {
      let raw = "";
      for await (const chunk of req) raw += chunk;
      return JSON.parse(raw || "{}");
    };

    const route = (req.url ?? "").split("?")[0];

    if (route === "/" || route === "") return send(200, page(data(), state), "text/html; charset=utf-8");
    if (route === "/api/data") return send(200, data());

    if (route === "/api/done" && req.method === "POST") {
      const body = await read();
      state.done = true;
      state.published = Boolean(body.publish);
      Object.assign(state, body);
      send(200, { ok: true });
      setTimeout(() => server.close(), 150);
      return;
    }

    const name = route.replace(/^\/api\//, "");
    if (on[name] && req.method === "POST") {
      try {
        return send(200, (await on[name](await read(), state)) ?? { ok: true });
      } catch (err) {
        return send(200, { ok: false, reason: String(err.message ?? err) });
      }
    }

    send(404, { error: "not found" });
  });

  await new Promise((resolve) => server.listen(port, resolve));
  console.log(`${title}: http://localhost:${port}`);
  if (say) console.log(say(state));
  console.log("");

  await new Promise((resolve) => server.on("close", resolve));

  if (writeTo) {
    const path = typeof writeTo === "string" ? writeTo : writeTo.path;
    const value = typeof writeTo === "string" ? Object.fromEntries(state.decisions) : writeTo.value(state);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
    console.log(`Written to ${path}`);
  }

  return state;
}

/** Where a sheet's answer goes, so an agent knows where to look for it. */
export const answerPath = (root, name) => join(root, ".stet", `${name}.json`);
