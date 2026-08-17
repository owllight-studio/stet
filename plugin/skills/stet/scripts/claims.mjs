#!/usr/bin/env node
/**
 * The fact checker's sheet: every claim, its verdict, and what the author decides about it.
 *
 * Twenty claims with a verdict each is twenty judgements, and a transcript is the wrong place to
 * make twenty of anything. On a page each claim sits with its sentence, its verdict and its
 * evidence, and the author accepts, disputes or rewrites it in one motion.
 *
 * This is also the first sheet built on lib/sheet.mjs rather than hand-rolled, which makes it the
 * reference for the next one. An agent told to build a sheet should read this file, not just the
 * library.
 *
 * Input:  .stet/claims.json          written by stet-fact-checker
 * Output: .stet/claims-decided.json  read back by whoever fixes the page
 *
 * Run: node claims.mjs
 */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { serve, shell, inline, esc, answerPath } from "./lib/sheet.mjs";

const root = process.cwd();
const IN = join(root, ".stet", "claims.json");

if (!existsSync(IN)) {
  console.log(`No claims to review. Expected ${IN}`);
  console.log("");
  console.log("stet-fact-checker writes that file. Its shape:");
  console.log(JSON.stringify(
    {
      file: "the page these came from",
      claims: [
        {
          id: "1",
          sentence: "the claim, quoted exactly",
          line: 42,
          verdict: "false | unsupported | misleading | fine",
          why: "one line",
          instead: "what it should say, for false and misleading",
          settle: "what would settle it, for unsupported",
        },
      ],
    },
    null,
    2,
  ));
  process.exit(1);
}

const brief = JSON.parse(readFileSync(IN, "utf8"));
const claims = (brief.claims ?? []).filter((c) => c.verdict !== "fine");
const fine = (brief.claims ?? []).length - claims.length;

if (!claims.length) {
  console.log(`Nothing to decide. All ${fine} claims came back fine.`);
  process.exit(0);
}

/* Order by consequence. A reader acting on something false is the top of the list, and a page that
   sorts by line number buries the worst finding halfway down. */
const RANK = { false: 0, misleading: 1, unsupported: 2 };
claims.sort((a, b) => (RANK[a.verdict] ?? 9) - (RANK[b.verdict] ?? 9));

const TAG = { false: "bad", misleading: "bad", unsupported: "none", fine: "good" };
const SAYS = {
  false: "found the thing it contradicts",
  misleading: "every word defensible, the impression wrong",
  unsupported: "looked, and could not establish it either way",
};

const CSS_EXTRA = `
.claim{border-top:2px solid var(--rule);padding-top:1.1rem;margin-top:2rem}
.claim.is-false,.claim.is-misleading{border-top-color:var(--strike)}
.claim.decided{opacity:.55}
.claim.decided:hover{opacity:1}
.head{display:flex;gap:.7rem;align-items:baseline;flex-wrap:wrap;margin-bottom:.6rem}
.where{font-family:var(--mono);font-size:.66rem;letter-spacing:.1em;color:var(--faint)}
.sentence{font-size:1.05rem;margin:0 0 .7rem;padding-left:1rem;border-left:2px solid var(--rule)}
.why{color:var(--soft);font-size:.94rem;margin:0 0 .5rem}
.instead{font-size:.94rem;margin:.5rem 0 0;padding:.6rem .8rem;background:var(--edge);border-radius:2px}
.instead span{font-family:var(--mono);font-size:.6rem;letter-spacing:.14em;text-transform:uppercase;
  color:var(--faint);display:block;margin-bottom:.25rem}
.acts{display:flex;gap:.5rem;flex-wrap:wrap;margin-top:.9rem;align-items:center}
.stamp{font-family:var(--mono);font-size:.62rem;letter-spacing:.14em;text-transform:uppercase;color:var(--mine)}
.claim .note{flex:1;min-width:14rem}
`;

const page = (data) =>
  shell({
    title: "Claims",
    body: `<div class="wrap">
<header>
  <div class="mark"><b>stet</b> &nbsp;claims</div>
  <h1>${claims.length} ${claims.length === 1 ? "claim" : "claims"} that did not survive checking.</h1>
  <p class="lede">
    From ${esc(brief.file ?? "the content")}. Each one was read by somebody trying to refute it
    rather than confirm it${fine ? `, and ${fine} ${fine === 1 ? "other came" : "others came"} back fine and ${fine === 1 ? "is" : "are"} not here` : ""}.
  </p>
  <p class="lede">
    Accept the finding, dispute it, or say what it should say instead. Anything you leave alone
    stays open, because silence is not a decision.
  </p>
</header>

${data.claims
  .map(
    (c) => `<article class="claim is-${esc(c.verdict)}" data-id="${esc(c.id)}">
  <div class="head">
    <span class="k k-${TAG[c.verdict] ?? "none"}">${esc(c.verdict)}</span>
    <span class="where">${esc(brief.file ?? "")}${c.line ? `  line ${c.line}` : ""}</span>
    <span class="stamp" data-stamp></span>
  </div>
  <p class="sentence">${inline(c.sentence ?? "")}</p>
  <p class="why">${SAYS[c.verdict] ?? ""}${c.why ? `. ${inline(c.why)}` : ""}</p>
  ${c.instead ? `<p class="instead"><span>it should say</span>${inline(c.instead)}</p>` : ""}
  ${c.settle ? `<p class="instead"><span>what would settle it</span>${inline(c.settle)}</p>` : ""}
  <div class="acts">
    <button class="primary" data-act="accept">Accept</button>
    <button data-act="dispute">It is right as written</button>
    <input class="note" data-note placeholder="Or say what it should say">
    <button data-act="rewrite">Use mine</button>
  </div>
</article>`,
  )
  .join("")}
</div>

<div class="bar"><div class="barin">
  <span class="count" id="count"></span>
  <button class="primary" id="done" disabled>Done</button>
</div></div>`,
    script: `
const decided = new Map();
const post = (u, b) => fetch(u, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(b) }).then(r => r.json());

function tally() {
  const n = decided.size, total = ${claims.length};
  document.getElementById("count").innerHTML =
    n ? \`<b>\${n}</b> of \${total} decided\` : \`\${total} to decide\`;
  document.getElementById("done").disabled = n === 0;
}
tally();

document.querySelector(".wrap").addEventListener("click", async (e) => {
  const b = e.target.closest("button[data-act]");
  if (!b) return;
  const card = b.closest(".claim");
  const id = card.dataset.id;
  const act = b.dataset.act;
  const note = card.querySelector("[data-note]").value.trim();

  if (act === "rewrite" && !note) {
    card.querySelector("[data-note]").focus();
    return;
  }

  decided.set(id, { action: act, note });
  card.classList.add("decided");
  card.querySelector("[data-stamp]").textContent =
    act === "accept" ? "accepted" : act === "dispute" ? "disputed" : "yours";
  await post("/api/decide", { id, action: act, note });
  tally();
});

document.getElementById("done").addEventListener("click", async () => {
  document.getElementById("done").disabled = true;
  await post("/api/done", {});
  document.body.innerHTML = \`<div class="wrap"><div class="finished">
    <div class="mark"><b>stet</b></div>
    <p style="margin-top:1.5rem">\${decided.size} decided. Anything you left alone is still open.</p>
    <p>Go back to the terminal.</p>
  </div></div>\`;
});
`,
  }).replace("</style>", `${CSS_EXTRA}</style>`);

const state = await serve({
  title: "Claims",
  data: () => ({ claims }),
  page,
  on: {
    decide: (body, s) => {
      s.decisions.set(body.id, body);
      return { ok: true, count: s.decisions.size };
    },
  },
  say: () => `${claims.length} to decide${fine ? `, ${fine} came back fine and ${fine === 1 ? "is" : "are"} not on the sheet` : ""}.`,
  writeTo: {
    path: answerPath(root, "claims-decided"),
    value: (s) => ({
      file: brief.file,
      decided: [...s.decisions.entries()].map(([id, d]) => ({
        ...claims.find((c) => c.id === id),
        ...d,
      })),
      left: claims.filter((c) => !s.decisions.has(c.id)).map((c) => c.id),
    }),
  },
});

const by = (a) => [...state.decisions.values()].filter((d) => d.action === a).length;
console.log("");
console.log(`${by("accept")} accepted, ${by("dispute")} disputed, ${by("rewrite")} rewritten by hand.`);
const left = claims.length - state.decisions.size;
if (left) console.log(`${left} left alone, which is not the same as approved.`);
