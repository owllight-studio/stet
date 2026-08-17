#!/usr/bin/env node
/**
 * Read the derived voice as a document, before anybody is asked to decide anything about it.
 *
 * `voice` used to write VOICE.md and hand it straight to `proof`, which is a decision tool: thirty
 * blocks with Save and Retry under each. That is the wrong surface for a first read. You cannot see
 * whether the rules contradict each other, you cannot tell which of them rest on anything, and you
 * are being asked to ratify sentence by sentence a document you have not read whole.
 *
 * So this comes first. It renders the voice as a page, with every rule showing where it came from,
 * and the corpus measurement sitting next to the rules that claim one. Then the only question left
 * is which of the inferred ones are wrong, which is a question somebody can actually answer.
 *
 * Provenance is read out of the file itself: a rule tagged `measured`, `stated` or `inferred`.
 * Untagged rules are shown as untagged, because a rule that does not say what it rests on is the
 * thing this page exists to make visible.
 *
 * Comments are per section, not per line, because that is where a voice file is actually wrong.
 * Nobody reads a derived voice and thinks "the third sentence of the fourth rule". They think "the
 * feeling section is not it" or "there is nothing in here about tables". So the note goes on the
 * section and the whole file is written again with the notes applied.
 *
 * Rewriting is bounded by one hard rule: the measured figures come from the corpus and the model
 * may not invent one. It gets the real statistics and is told they are the only numbers that exist.
 *
 * Run: node voice-read.mjs
 */

import { createServer } from "node:http";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { config } from "./lib/find.mjs";
import { TOKENS } from "./lib/sheet.mjs";

const root = process.cwd();
const voicePath = join(root, config(root)?.voice ?? "VOICE.md");

if (!existsSync(voicePath)) {
  console.log(`No voice file at ${voicePath}. Run voice first.`);
  process.exit(1);
}

let raw = readFileSync(voicePath, "utf8");
const frontmatter = () => raw.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/)?.[0] ?? "";
const bodyOf = () => raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "");

/* --- parse it into what it is: sections, rules, and where each rule came from --- */

const KIND = /^`(measured|stated|inferred)`\s*/;

function parse(text) {
  const sections = [];
  let current = { title: null, level: 2, intro: [], rules: [], list: [], table: null };

  const flush = () => {
    if (current.title || current.intro.length || current.rules.length || current.list.length || current.table) {
      sections.push(current);
    }
  };

  const blocks = text.split(/\n\s*\n/);
  for (const b of blocks) {
    const block = b.trim();
    if (!block) continue;

    const h2 = block.match(/^##\s+(.+)$/);
    const h3 = block.match(/^###\s+([\s\S]+)$/);
    const h1 = block.match(/^#\s+(.+)$/);

    if (h1) continue;
    if (h2) {
      flush();
      current = { title: h2[1], level: 2, intro: [], rules: [], list: [], table: null };
      continue;
    }
    if (h3) {
      const lines = h3[1].split("\n");
      const kind = lines[1]?.match(KIND);
      current.rules.push({
        title: lines[0].trim(),
        kind: kind ? kind[1] : null,
        evidence: kind ? lines[1].replace(KIND, "").trim() : "",
        body: [],
      });
      continue;
    }

    if (block.split("\n").every((l) => l.trim().startsWith("|"))) {
      current.table = block
        .split("\n")
        .filter((l) => !/^\|[\s|:-]+\|$/.test(l.trim()))
        .map((r) => r.split("|").slice(1, -1).map((c) => c.trim()))
        .filter((cells) => cells.length >= 2 && cells[0]);
      continue;
    }

    if (/^[-*]\s/.test(block)) {
      for (const item of block.split(/\n(?=[-*]\s)/)) {
        const t = item.replace(/^[-*]\s+/, "").replace(/\s*\n\s+/g, " ").trim();
        const kind = t.match(KIND);
        current.list.push({ kind: kind ? kind[1] : null, text: t.replace(KIND, "") });
      }
      continue;
    }

    const target = current.rules.length ? current.rules[current.rules.length - 1].body : current.intro;
    target.push(block.replace(/\s*\n\s*/g, " "));
  }
  flush();

  for (const sec of sections) {
    const first = sec.intro[0];
    const kind = first?.match(KIND);
    if (!kind) continue;
    sec.kind = kind[1];
    const rest = first.replace(KIND, "").trim();
    if (rest) sec.intro[0] = rest.charAt(0).toUpperCase() + rest.slice(1);
    else sec.intro.shift();
  }

  return sections;
}



/* --- the corpus, for the measured claims to sit beside ---------------------- */

const stats = await new Promise((resolve) => {
  const script = join(import.meta.dirname, "voice-stats.mjs");
  execFile("node", [script], { cwd: root, timeout: 120000, maxBuffer: 1 << 22 }, (err, stdout) =>
    resolve(err ? "" : String(stdout)),
  );
});

/* --- rewriting, with the corpus as the only source of numbers --------------- */

const notes = new Map();

function rewrite() {
  const said = [...notes.entries()].filter(([, v]) => v.trim());
  const prompt = [
    "You are rewriting a house voice file for its author, who has read it and left notes on the",
    "sections they want changed.",
    "",
    "Return ONLY the new file, as Markdown, starting at the first heading. No preamble, no code",
    "fences, no commentary. Your entire output is written to VOICE.md.",
    "",
    "THE RULE THAT IS NOT NEGOTIABLE. Every figure in this file came from measuring the author's own",
    "writing. You may not invent one, adjust one, or add a rule that cites a number not in the",
    "measurements below. If a note asks for a rule you cannot support with those figures, write the",
    "rule and tag it `inferred`, which is the tag that means you guessed.",
    "",
    "PROVENANCE. Every rule carries one of three tags on the line under its heading, and list items",
    "carry theirs at the start of the item:",
    "  `measured`  it came out of the corpus. Cite the figure.",
    "  `stated`    the author wrote it somewhere. Name where.",
    "  `inferred`  you worked it out. The author reads these first, so be honest about which are these.",
    "Keep every existing tag correct. Do not promote an inferred rule to measured to make it look",
    "better founded.",
    "",
    "Keep the shape: a one rule section, a feeling section, rules with headings, a flat Never list,",
    "and a Measured table. Keep anything the notes did not ask you to change, including its wording.",
    "",
    `THE MEASUREMENTS, which are the only numbers that exist:\n${stats.trim()}`,
    "",
    `THE FILE AS IT STANDS:\n${bodyOf()}`,
    "",
    said.length
      ? `WHAT THE AUTHOR SAID, by section:\n${said.map(([k, v]) => `[${k}]\n${v}`).join("\n\n")}`
      : "The author left no notes, so change nothing and return the file as it is.",
  ].join("\n");

  return new Promise((resolve) => {
    execFile("claude", ["-p", prompt], { timeout: 300000, maxBuffer: 1 << 22, cwd: root }, (err, stdout, stderr) => {
      if (err) {
        const first = (t) => String(t).trim().split("\n").find((l) => l.trim()) ?? "";
        return resolve({ error: [first(err.message), first(stderr)].filter(Boolean).join(" / ") });
      }
      const clean = String(stdout).trim().replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/, "").trim();
      resolve(clean ? { text: clean } : { error: "nothing came back" });
    });
  });
}

/* --- render ---------------------------------------------------------------- */

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const inline = (md) =>
  esc(md)
    .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "<i>$1</i>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");

const tag = (kind) =>
  kind ? `<span class="k k-${kind}">${kind}</span>` : `<span class="k k-none">no source</span>`;

const CSS = TOKENS + `
*{box-sizing:border-box}
body{margin:0;background:var(--paper);color:var(--ink);font-family:var(--serif);font-size:18px;line-height:1.65}
.wrap{max-width:52rem;margin:0 auto;padding:0 1.5rem 9rem}
header{padding:2.5rem 0 1.5rem}
.mark{font-family:var(--mono);font-size:.9rem;letter-spacing:.22em;text-transform:uppercase}
.mark b{font-weight:400;border-bottom:2px solid var(--pencil);padding-bottom:2px}
h1{font-size:2.4rem;font-weight:400;letter-spacing:-.02em;margin:1.5rem 0 .75rem}
.lede{color:var(--soft);margin:0 0 1.5rem}
.tally{display:flex;gap:.6rem;align-items:baseline;margin:.4rem 0 0}
.tally span.t{color:var(--soft);font-size:.95rem}
.k{font-family:var(--mono);font-size:.6rem;letter-spacing:.14em;text-transform:uppercase;
   padding:.18rem .45rem;border-radius:2px;white-space:nowrap;vertical-align:2px;flex:none}
.k-measured{color:var(--pencil);background:var(--wash)}
.k-stated{color:var(--mine);background:color-mix(in srgb,var(--mine) 12%,transparent)}
.k-inferred{color:var(--strike);background:color-mix(in srgb,var(--strike) 12%,transparent)}
.k-none{color:var(--faint);background:var(--edge)}
section{border-top:1px solid var(--rule);padding:2rem 0 1.25rem}
h2{font-size:1.35rem;font-weight:400;margin:0 0 1rem}
.intro{color:var(--soft)}
.rule{margin:1.5rem 0 0;padding-left:1rem;border-left:2px solid var(--rule)}
.rule.inferred{border-left-color:var(--strike)}
.rule h3{font-size:1.05rem;font-weight:400;margin:0 0 .35rem;display:flex;gap:.6rem;align-items:baseline;flex-wrap:wrap}
.ev{font-family:var(--mono);font-size:.72rem;color:var(--faint);margin:0 0 .5rem}
.rule p{margin:.5rem 0;font-size:.97rem;color:var(--soft)}
.rule p b{color:var(--ink);font-weight:400}
ul.list{list-style:none;padding:0;margin:1rem 0 0}
ul.list li{padding:.4rem 0;border-bottom:1px solid var(--rule);font-size:.95rem;color:var(--soft);
  display:flex;gap:.7rem;align-items:baseline}
ul.list li b{color:var(--ink);font-weight:400}
dl.measured{display:grid;grid-template-columns:1fr auto;margin:1rem 0 0;border-top:1px solid var(--rule)}
dl.measured>div{display:contents}
dl.measured dt,dl.measured dd{padding:.45rem 0;border-bottom:1px solid var(--rule);margin:0}
dl.measured dt{color:var(--soft);font-size:.95rem}
dl.measured dd{font-family:var(--mono);font-size:.85rem;color:var(--pencil);text-align:right;font-variant-numeric:tabular-nums}
pre{background:var(--edge);border:1px solid var(--rule);padding:1rem;overflow-x:auto;
  font-family:var(--mono);font-size:.76rem;line-height:1.6;color:var(--soft)}
code{font-family:var(--mono);font-size:.88em;color:var(--pencil)}

/* The note. One per section, because that is the size a voice file is wrong at. */
.note{margin:1.25rem 0 0}
.note textarea{
  width:100%;min-height:2.6rem;resize:vertical;font-family:var(--serif);font-size:.93rem;
  padding:.5rem .7rem;border:1px solid var(--rule);background:transparent;color:var(--ink);
  border-radius:2px;line-height:1.5}
.note textarea:focus{outline:none;border-color:var(--pencil);background:var(--wash)}
.note textarea.filled{border-color:var(--pencil)}
.note label{font-family:var(--mono);font-size:.62rem;letter-spacing:.14em;text-transform:uppercase;
  color:var(--faint);display:block;margin-bottom:.3rem}
.noterow{display:flex;gap:.7rem;align-items:center;margin-top:.4rem}
.noterow button{margin-left:0;padding:.3rem .7rem;font-size:.64rem}
.kept{font-family:var(--mono);font-size:.62rem;letter-spacing:.12em;text-transform:uppercase;
  color:var(--mine);opacity:0;transition:opacity 200ms ease}
.kept.on{opacity:1}
.note.saved textarea{border-color:var(--mine)}

.bar{position:fixed;left:0;right:0;bottom:0;background:var(--paper);border-top:1px solid var(--rule);
  padding:.85rem 1.5rem}
.barin{max-width:52rem;margin:0 auto;display:flex;gap:.75rem;align-items:center;flex-wrap:wrap}
.count{font-family:var(--mono);font-size:.72rem;color:var(--faint)}
.count b{color:var(--ink);font-weight:400}
button{font-family:var(--mono);font-size:.7rem;letter-spacing:.12em;text-transform:uppercase;
  padding:.45rem .9rem;border:1px solid var(--rule);background:transparent;color:var(--soft);
  cursor:pointer;border-radius:2px;margin-left:auto}
button:hover{color:var(--ink);border-color:var(--pencil)}
button.primary{color:var(--pencil);border-color:var(--pencil)}
button:disabled{opacity:.4;cursor:default}
.working{display:none;align-items:center;gap:.75rem;flex:1}
.working.on{display:flex}
.dots{flex:1;height:7px;
  background-image:radial-gradient(circle at 3px 3.5px,var(--pencil) 1.6px,transparent 1.8px);
  background-size:10px 7px;background-repeat:repeat-x;
  -webkit-mask-image:linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent);
  mask-image:linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent);
  animation:lay 1.1s linear infinite}
@keyframes lay{from{background-position-x:0}to{background-position-x:10px}}
.said{color:var(--strike);font-size:.85rem;margin:.5rem 0 0}
@media (prefers-reduced-motion:reduce){.dots{animation:none}}
`;

function render() {
  const sections = parse(bodyOf());
  const counts = { measured: 0, stated: 0, inferred: 0, none: 0 };
  for (const s of sections) {
    if (s.kind) counts[s.kind]++;
    for (const r of s.rules) counts[r.kind ?? "none"]++;
    for (const l of s.list) counts[l.kind ?? "none"]++;
  }

  const noteBox = (key) => `
    <div class="note" data-for="${esc(key)}">
      <label>Anything wrong with this section? Type it here.</label>
      <textarea data-section="${esc(key)}" placeholder="Say it in your words. It gets applied to the whole file, not pasted in.">${esc(notes.get(key) ?? "")}</textarea>
      <div class="noterow">
        <button class="save" data-save="${esc(key)}">Save</button>
        <span class="kept"></span>
      </div>
    </div>`;

  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Your voice</title><style>${CSS}</style></head><body><div class="wrap">
<header>
  <div class="mark"><b>stet</b> &nbsp;voice</div>
  <h1>Here is what your writing already does.</h1>
  <p class="lede">
    Derived by measuring your own files rather than by describing them. Read it as a document.
    Where a section is wrong, say so underneath it, then have the whole file written again with what
    you said. Nothing here is a per-line decision and nothing is owned yet.
  </p>
  <div class="tally">${tag("measured")}<span class="t">${counts.measured} came out of the corpus</span></div>
  <div class="tally">${tag("stated")}<span class="t">${counts.stated} you wrote down somewhere, and it says where</span></div>
  <div class="tally">${tag("inferred")}<span class="t">${counts.inferred} are mine. These are the ones worth your attention</span></div>
  ${counts.none ? `<div class="tally">${tag(null)}<span class="t">${counts.none} do not say what they rest on</span></div>` : ""}
</header>

${sections
  .map(
    (s) => `<section>
  ${s.title ? `<h2>${inline(s.title)}${s.kind ? ` ${tag(s.kind)}` : ""}</h2>` : ""}
  ${s.intro.map((p) => `<p class="intro">${inline(p)}</p>`).join("")}
  ${s.rules
    .map(
      (r) => `<div class="rule${r.kind === "inferred" ? " inferred" : ""}">
      <h3>${inline(r.title)} ${tag(r.kind)}</h3>
      ${r.evidence ? `<p class="ev">${inline(r.evidence)}</p>` : ""}
      ${r.body.map((p) => `<p>${inline(p)}</p>`).join("")}
    </div>`,
    )
    .join("")}
  ${s.list.length ? `<ul class="list">${s.list.map((l) => `<li>${tag(l.kind)}<span>${inline(l.text)}</span></li>`).join("")}</ul>` : ""}
  ${s.table ? `<dl class="measured">${s.table.map((c) => `<div><dt>${inline(c[0])}</dt><dd>${inline(c[1])}</dd></div>`).join("")}</dl>` : ""}
  ${s.title ? noteBox(s.title) : ""}
</section>`,
  )
  .join("")}

${stats ? `<section><h2>The corpus these came from</h2><pre>${esc(stats.trim())}</pre></section>` : ""}
<p class="said" id="said"></p>
</div>

<div class="bar"><div class="barin">
  <span class="count" id="count">No notes yet</span>
  <div class="working" id="working"><div class="dots"></div><span class="count" id="elapsed"></span></div>
  <button class="primary" id="go" disabled>Write it again with my notes</button>
</div></div>

<script>
const $ = (id) => document.getElementById(id);
const notes = new Map();

function tally() {
  const n = [...notes.values()].filter((v) => v.trim()).length;
  $("count").innerHTML = n ? \`<b>\${n}</b> \${n === 1 ? "section" : "sections"} to change\` : "No notes yet";
  $("go").disabled = !n;
}

async function save(key, value) {
  await fetch("/api/note", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ section: key, text: value }),
  });
  const box = document.querySelector(\`.note[data-for="\${CSS.escape(key)}"]\`);
  box.classList.toggle("saved", Boolean(value.trim()));
  const kept = box.querySelector(".kept");
  kept.textContent = value.trim() ? "kept" : "cleared";
  kept.classList.add("on");
  setTimeout(() => kept.classList.remove("on"), 1600);
}

for (const t of document.querySelectorAll("textarea[data-section]")) {
  const key = t.dataset.section;
  if (t.value.trim()) {
    notes.set(key, t.value);
    t.closest(".note").classList.add("saved");
  }
  t.classList.toggle("filled", Boolean(t.value.trim()));
  t.addEventListener("input", () => {
    notes.set(key, t.value);
    t.classList.toggle("filled", Boolean(t.value.trim()));
    t.closest(".note").classList.remove("saved");
    tally();
  });
  // Leaving the field is a save. A note that only exists while the cursor is in the box is a note
  // somebody is going to lose.
  t.addEventListener("blur", () => save(key, t.value));
}

for (const b of document.querySelectorAll("button[data-save]")) {
  b.addEventListener("click", () => {
    const key = b.dataset.save;
    save(key, document.querySelector(\`textarea[data-section="\${CSS.escape(key)}"]\`).value);
  });
}
tally();

$("go").addEventListener("click", async () => {
  $("go").disabled = true;
  $("working").classList.add("on");
  $("said").textContent = "";
  const from = Date.now();
  const tick = setInterval(() => { $("elapsed").textContent = Math.round((Date.now() - from) / 1000) + "s"; }, 1000);

  const r = await fetch("/api/rewrite", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({}),
  }).then((x) => x.json());

  clearInterval(tick);
  $("working").classList.remove("on");
  if (r.ok) location.reload();
  else {
    $("said").textContent = r.reason ?? "Nothing came back.";
    $("go").disabled = false;
  }
});
</script>
</body></html>`;
}

/* --- serve ----------------------------------------------------------------- */

const port = Number(process.env.STET_VOICE_READ_PORT ?? 4743);

const server = createServer(async (req, res) => {
  if (req.url === "/api/note" && req.method === "POST") {
    let body = "";
    for await (const chunk of req) body += chunk;
    const { section, text } = JSON.parse(body || "{}");
    if (text?.trim()) notes.set(section, text);
    else notes.delete(section);
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify({ ok: true, notes: notes.size }));
  }

  if (req.url === "/api/rewrite" && req.method === "POST") {
    let body = "";
    for await (const chunk of req) body += chunk;
    const sent = Object.fromEntries(notes);
    const started = Date.now();
    const result = await rewrite();
    const took = Math.round((Date.now() - started) / 1000);

    res.writeHead(200, { "content-type": "application/json" });
    if (result.error) {
      console.log(`  rewrite failed after ${took}s: ${result.error}`);
      return res.end(JSON.stringify({ ok: false, reason: `${result.error}. Nothing was written.` }));
    }

    /* The front matter is the file's state and ownership. A rewrite of the prose must never move
       it, so it is put back rather than regenerated. */
    raw = frontmatter() + result.text.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "") + "\n";
    writeFileSync(voicePath, raw);
    notes.clear();
    console.log(`  written again in ${took}s, with ${Object.values(sent).filter((v) => v.trim()).length} notes applied`);
    return res.end(JSON.stringify({ ok: true }));
  }

  res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
  res.end(render());
});

server.listen(port, () => {
  const s = parse(bodyOf());
  const c = { measured: 0, stated: 0, inferred: 0, none: 0 };
  for (const x of s) {
    if (x.kind) c[x.kind]++;
    for (const r of x.rules) c[r.kind ?? "none"]++;
    for (const l of x.list) c[l.kind ?? "none"]++;
  }
  console.log(`Your voice: http://localhost:${port}`);
  console.log(`${c.measured} measured, ${c.stated} stated, ${c.inferred} inferred${c.none ? `, ${c.none} with no source` : ""}.`);
  console.log("Read it. Leave a note on any section that is wrong, then have it written again.");
  console.log("Ctrl-C when it says what you mean. Then run proof, which is where ownership happens.");
});
