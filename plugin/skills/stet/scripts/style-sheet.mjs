#!/usr/bin/env node
/**
 * The style sheet's sheet: every word the corpus says two ways, and which way it goes.
 *
 * `discover` finds the variation. It cannot decide it, because deciding needs somebody who knows
 * which one is the product's actual name and which one is a typo that got copied. That is thirty
 * or forty small judgements, and a transcript is the wrong place to make thirty of anything.
 *
 * Two rules from the reference are enforced here rather than hoped for.
 *
 * **A decision without a reason gets reversed.** The next person to find it arbitrary will change
 * it back, so the reason is what makes it stick. A card cannot be recorded without one.
 *
 * **A quotation keeps its own spelling.** If a variant only appears inside somebody else's words,
 * it is not drift and deciding it would mean editing a quotation. Those cards are marked and the
 * honest answer is to leave them.
 *
 * Input:  .stet/style-candidates.json   written by stet-style-sheet
 * Output: STYLE.md, through `style.mjs decide`, which stays the only thing that writes it
 *
 * Run: node style-sheet.mjs
 */

import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { serve, shell, inline, esc, answerPath } from "./lib/sheet.mjs";

const root = process.cwd();
const here = dirname(fileURLToPath(import.meta.url));
const STYLE = join(here, "style.mjs");
const IN = join(root, ".stet", "style-candidates.json");

if (!existsSync(IN)) {
  console.log(`Nothing to decide. Expected ${IN}`);
  console.log("");
  console.log("stet-style-sheet writes that file, after running `style.mjs discover` and reading");
  console.log("the corpus for the drift a word-frequency pass cannot see. Its shape:");
  console.log(JSON.stringify(
    {
      candidates: [
        {
          id: "1",
          category: "hyphenation | capitalisation | spelling | numbers | abbreviation | terminology",
          forms: [
            { text: "fact-checker", n: 5, files: ["docs/spec.md", "SKILL.md"] },
            { text: "fact checker", n: 5, files: ["reference/verify.md"] },
          ],
          recommend: "fact-checker",
          why: "one line, and it becomes the reason recorded in STYLE.md",
          quoted: false,
          note: "anything the author needs to know before choosing",
        },
      ],
    },
    null,
    2,
  ));
  process.exit(1);
}

const brief = JSON.parse(readFileSync(IN, "utf8"));
const candidates = brief.candidates ?? [];

if (!candidates.length) {
  console.log("Nothing came back. The corpus is not saying anything two ways that has not been decided.");
  process.exit(0);
}

/* Quotations last. They are the ones whose honest answer is to leave them alone, so they should not
   be the first thing somebody sees and starts deciding out of momentum. */
candidates.sort((a, b) => Number(Boolean(a.quoted)) - Number(Boolean(b.quoted)));

const CSS_EXTRA = `
.card{border-top:2px solid var(--rule);padding-top:1.1rem;margin-top:2.2rem}
.card.quoted{border-top-color:var(--mine)}
.card.decided{opacity:.5}
.card.decided:hover{opacity:1}
.head{display:flex;gap:.7rem;align-items:baseline;flex-wrap:wrap;margin-bottom:.8rem}
.stamp{font-family:var(--mono);font-size:.62rem;letter-spacing:.14em;text-transform:uppercase;color:var(--mine)}
.forms{display:flex;flex-direction:column;gap:.4rem;margin:0 0 .9rem}
.form{display:flex;gap:.7rem;align-items:baseline;padding:.5rem .7rem;border:1px solid var(--rule);
  border-radius:2px;cursor:pointer;text-align:left;font-family:var(--serif);font-size:1rem;
  text-transform:none;letter-spacing:normal;color:var(--ink);width:100%}
.form:hover{border-color:var(--pencil);background:var(--wash)}
.form.picked{border-color:var(--pencil);background:var(--wash)}
.form b{font-weight:400;flex:1}
.form .n{font-family:var(--mono);font-size:.7rem;color:var(--faint);flex:none}
.form .rec{font-family:var(--mono);font-size:.58rem;letter-spacing:.14em;text-transform:uppercase;
  color:var(--pencil);flex:none}
.where{font-family:var(--mono);font-size:.66rem;color:var(--faint);margin:-.5rem 0 .9rem}
.note{color:var(--soft);font-size:.94rem;margin:0 0 .9rem}
.note.warn{color:var(--mine)}
.why{margin:.7rem 0 0}
.acts{display:flex;gap:.5rem;flex-wrap:wrap;margin-top:.8rem;align-items:center}
.acts .msg{font-family:var(--mono);font-size:.66rem;color:var(--faint)}
.own{display:flex;gap:.5rem;align-items:center;margin-top:.5rem}
.own input{flex:1}
`;

const label = (c) => (c.quoted ? "quoted" : c.category ?? "varies");
const tag = (c) => (c.quoted ? "mine" : "none");

const page = (data) =>
  shell({
    title: "Style sheet",
    body: `<div class="wrap">
<header>
  <div class="mark"><b>stet</b> &nbsp;style sheet</div>
  <h1>${candidates.length} ${candidates.length === 1 ? "word is" : "words are"} being written more than one way.</h1>
  <p class="lede">
    None of these is wrong. That is what makes them worth deciding: both forms are defensible, so
    without a record the next person decides again, differently.
  </p>
  <p class="lede">
    Pick the form this project uses and say why in a line. The reason is the part that lasts, because
    it is what stops somebody changing it back next year on the grounds that it looks arbitrary.
    Anything you leave alone stays undecided, which is a fine answer.
  </p>
</header>

${data.candidates
  .map(
    (c) => `<article class="card${c.quoted ? " quoted" : ""}" data-id="${esc(c.id)}">
  <div class="head">
    <span class="k k-${tag(c)}">${esc(label(c))}</span>
    <span class="stamp" data-stamp></span>
  </div>
  ${
    c.quoted
      ? `<p class="note warn">This one only differs inside quotations. Somebody else wrote those words, so
         the spelling is theirs and the honest answer is usually to leave it.</p>`
      : ""
  }
  ${c.note ? `<p class="note">${inline(c.note)}</p>` : ""}
  <div class="forms">
    ${c.forms
      .map(
        (f) => `<button class="form" data-form="${esc(f.text)}">
      <b>${esc(f.text)}</b>
      ${f.text === c.recommend ? `<span class="rec">suggested</span>` : ""}
      <span class="n">${f.n} ${f.n === 1 ? "time" : "times"}</span>
    </button>`,
      )
      .join("")}
  </div>
  <p class="where">${c.forms
    .map((f) => `${esc(f.text)}: ${(f.files ?? []).slice(0, 3).map(esc).join(", ") || "unrecorded"}${(f.files ?? []).length > 3 ? ` and ${f.files.length - 3} more` : ""}`)
    .join("  |  ")}</p>
  <div class="own">
    <input type="text" data-own placeholder="Or write it a way that is not listed">
  </div>
  <div class="why">
    <label>Why it goes that way</label>
    <textarea data-why rows="2">${esc(c.why ?? "")}</textarea>
  </div>
  <div class="acts">
    <button class="primary" data-act="record">Record it</button>
    <button data-act="skip">Leave it undecided</button>
    <span class="msg" data-msg></span>
  </div>
</article>`,
  )
  .join("")}
</div>

<div class="bar"><div class="barin">
  <span class="count" id="count"></span>
  <div class="working" id="working"><div class="dots"></div></div>
  <button class="primary" id="done" disabled>Done</button>
</div></div>`,
    script: `
const decided = new Map();
const post = (u, b) => fetch(u, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(b) }).then(r => r.json());

function tally() {
  const n = decided.size, total = ${candidates.length};
  document.getElementById("count").innerHTML =
    n ? \`<b>\${n}</b> of \${total} settled\` : \`\${total} to look at\`;
  document.getElementById("done").disabled = n === 0;
}
tally();

document.querySelector(".wrap").addEventListener("click", (e) => {
  const f = e.target.closest("button.form");
  if (!f) return;
  const card = f.closest(".card");
  card.querySelectorAll("button.form").forEach(b => b.classList.remove("picked"));
  f.classList.add("picked");
  card.querySelector("[data-own]").value = "";
});

document.querySelector(".wrap").addEventListener("click", async (e) => {
  const b = e.target.closest("button[data-act]");
  if (!b) return;
  const card = b.closest(".card");
  const id = card.dataset.id;
  const msg = card.querySelector("[data-msg]");

  if (b.dataset.act === "skip") {
    decided.set(id, { action: "skip" });
    card.classList.add("decided");
    card.querySelector("[data-stamp]").textContent = "left undecided";
    msg.textContent = "";
    await post("/api/decide", { id, action: "skip" });
    tally();
    return;
  }

  const own = card.querySelector("[data-own]").value.trim();
  const picked = card.querySelector("button.form.picked");
  const as = own || (picked ? picked.dataset.form : "");
  const why = card.querySelector("[data-why]").value.trim();

  if (!as) { msg.textContent = "Pick a form first, or write one."; return; }
  // The reference's own rule, enforced rather than hoped for: a decision without a reason is one
  // the next person reverses.
  if (!why) { msg.textContent = "Say why. Without a reason this gets undone later."; card.querySelector("[data-why]").focus(); return; }

  msg.textContent = "";
  decided.set(id, { action: "record", as, why });
  card.classList.add("decided");
  card.querySelector("[data-stamp]").textContent = as;
  await post("/api/decide", { id, action: "record", as, why });
  tally();
});

document.getElementById("done").addEventListener("click", async () => {
  document.getElementById("done").disabled = true;
  document.getElementById("working").classList.add("on");
  const res = await post("/api/apply", {});
  await post("/api/done", {});
  document.body.innerHTML = \`<div class="wrap"><div class="finished">
    <div class="mark"><b>stet</b></div>
    <p style="margin-top:1.5rem">\${Number(res.wrote) || 0} written into STYLE.md.</p>
    <p>Go back to the terminal.</p>
  </div></div>\`;
});
`,
  }).replace("</style>", `${CSS_EXTRA}</style>`);

const state = await serve({
  title: "Style sheet",
  data: () => ({ candidates }),
  page,
  on: {
    decide: (body, s) => {
      s.decisions.set(body.id, body);
      return { ok: true, count: s.decisions.size };
    },
    /*
     * Written through `style.mjs decide`, never by this file.
     *
     * One thing writes STYLE.md. A second writer is how the two copies drift, and `decide` already
     * refuses to overwrite an existing decision silently, which is a rule this sheet would
     * otherwise have to reimplement and eventually get wrong.
     */
    apply: (body, s) => {
      /* Not named `done`. `serve()` owns /api/done and answers it before it consults this map, so a
         handler called `done` is silently never reached. Writing happens here, then the page ends
         the wait separately. */
      let wrote = 0;
      for (const [id, d] of s.decisions) {
        if (d.action !== "record") continue;
        const c = candidates.find((x) => x.id === id);
        for (const f of c.forms) {
          if (f.text === d.as) continue;
          try {
            execFileSync("node", [STYLE, "decide", f.text, d.as, "--why", d.why], {
              cwd: root,
              encoding: "utf8",
            });
            wrote += 1;
          } catch (err) {
            /* `decide` refusing is a real answer, usually "that is already decided". Keep it. */
            s.refused = [...(s.refused ?? []), { term: f.text, as: d.as, said: String(err.stdout ?? err.message).trim() }];
          }
        }
      }
      s.wrote = wrote;
      return { ok: true, wrote };
    },
  },
  say: () => `${candidates.length} to look at.`,
  writeTo: {
    path: answerPath(root, "style-decided"),
    value: (s) => ({
      decided: [...s.decisions.entries()]
        .filter(([, d]) => d.action === "record")
        .map(([id, d]) => ({ ...candidates.find((c) => c.id === id), ...d })),
      left: candidates.filter((c) => !s.decisions.has(c.id)).map((c) => c.id),
    }),
  },
});

const recorded = [...state.decisions.values()].filter((d) => d.action === "record").length;
const skipped = [...state.decisions.values()].filter((d) => d.action === "skip").length;
console.log("");
console.log(`${recorded} decided, ${skipped} deliberately left, ${state.wrote ?? 0} entries written to STYLE.md.`);
for (const r of state.refused ?? []) console.log(`  not written: ${r.term} -> ${r.as}. ${r.said.split("\n")[0]}`);
const untouched = candidates.length - state.decisions.size;
if (untouched) console.log(`${untouched} never looked at, which is not the same as agreed.`);
console.log("");
console.log("`style.mjs check` will now find anywhere the content still disagrees.");
