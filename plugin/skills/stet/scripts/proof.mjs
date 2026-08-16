/**
 * The proof sheet. A local page where the author reads drafts, keeps them, corrects them, or sends
 * them back with a query.
 *
 * It blocks until the author is done, then prints the decisions and applies them. The agent that
 * started it waits. That is the point: approval is the one thing an agent cannot do for itself, and
 * a surface it can poll and give up on is a surface it will eventually approve around.
 *
 * Two rules are encoded here rather than left to the agent, because leaving them to the agent is
 * how they get broken:
 *
 *   Keeping a draft makes it approved. It stops being the agent's to change.
 *   Correcting a draft claims the sentences the author typed, and only those. The file's own state
 *   does not move, because one correction does not make somebody the author of the paragraph
 *   around it.
 *
 * The second one is why this file writes the record itself rather than asking an agent to. An agent
 * told to note that the author edited something would note it correctly on a good day.
 */

import { createServer } from "node:http";
import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { findContent } from "./lib/find.mjs";
import { read, write } from "./lib/meta.mjs";
import { split, replace } from "./lib/blocks.mjs";
import { changed } from "./lib/spans.mjs";

const root = process.cwd();
const here = dirname(fileURLToPath(import.meta.url));
const LIMIT = Number(process.env.STET_PROOF_LIMIT ?? 24);

// Named files, or everything in draft. Reviewing is work, and a sheet of a hundred blocks is a set
// of decisions nobody made carefully.
const only = process.argv.slice(2);
const candidates = only.length ? only : findContent(root).files;

const drafts = [];
for (const file of candidates) {
  const meta = read(root, file);
  if (meta?.state !== "draft") continue;
  for (const block of split(root, file).blocks) {
    if (block.kind === "code") continue;
    drafts.push({ file, ...block, id: `${file}#${block.index}` });
    if (drafts.length >= LIMIT) break;
  }
  if (drafts.length >= LIMIT) break;
}

if (!drafts.length) {
  console.log("Nothing is in draft. There is nothing to proof.");
  process.exit(0);
}

const page = readFileSync(join(here, "proof-page.html"), "utf8");
const decisions = new Map();
let done = false;

const server = createServer(async (req, res) => {
  const send = (code, body, type = "application/json") => {
    res.writeHead(code, { "content-type": type, "cache-control": "no-store" });
    res.end(typeof body === "string" ? body : JSON.stringify(body));
  };

  if (req.url === "/" || req.url?.startsWith("/?")) return send(200, page, "text/html; charset=utf-8");
  if (req.url === "/proof-md.js") {
    return send(200, readFileSync(join(here, "proof-md.js"), "utf8"), "text/javascript; charset=utf-8");
  }
  if (req.url === "/api/blocks") return send(200, { root, blocks: drafts });

  if (req.url === "/api/decide" && req.method === "POST") {
    let body = "";
    for await (const chunk of req) body += chunk;
    try {
      const { id, action, text, note } = JSON.parse(body);
      decisions.set(id, { action, text, note });
      return send(200, { ok: true, count: decisions.size });
    } catch (err) {
      return send(400, { error: err.message });
    }
  }

  /**
   * Rewrite one block, here, now.
   *
   * The author should be able to work through a page without leaving it, so a retry does the
   * rewrite rather than queueing one. It shells out to a fresh `claude -p` with the house voice and
   * nothing else: no conversation, no memory, no chance of it wandering into the rest of the repo.
   *
   * If the CLI is missing or fails, the retry falls back to a query the terminal picks up, which is
   * the behaviour this had before and is never worse than nothing.
   */
  if (req.url === "/api/retry" && req.method === "POST") {
    let body = "";
    for await (const chunk of req) body += chunk;
    const { id, text, note } = JSON.parse(body || "{}");
    const voicePath = join(root, "VOICE.md");
    const voice = existsSync(voicePath) ? readFileSync(voicePath, "utf8") : "";

    const prompt = [
      "You are rewriting one block of content because the author rejected the current version.",
      "",
      "Return ONLY the replacement text, as Markdown. No preamble, no explanation, no code fences,",
      "no commentary, no quotation marks around it. Your entire output is written into their file.",
      "",
      "Keep the same Markdown shape: a heading stays a heading, a list stays a list, a paragraph",
      "stays a paragraph.",
      "",
      "The author asked for a change, so returning the same text, or a version that differs only in",
      "punctuation, is a failed answer. If you think the original was already right, you are wrong:",
      "they read it and rejected it. Make the change they asked for.",
      voice ? `\nTHE HOUSE VOICE. Not optional, and it outranks your instincts:\n\n${voice}` : "",
      `\nWHAT THE AUTHOR WANTS CHANGED:\n${note || "Make it better. Shorter, plainer, and with nothing in it that does not earn its place."}`,
      `\nTHE BLOCK TO REWRITE:\n${text}`,
    ].join("\n");

    const started = Date.now();
    const rewritten = await new Promise((resolve) => {
      execFile(
        "claude",
        ["-p", prompt],
        { timeout: 180000, maxBuffer: 1 << 22, cwd: root },
        (err, stdout, stderr) => {
          if (err) console.log(`  retry failed: ${err.message.split("\n")[0]}${stderr ? ` / ${String(stderr).slice(0, 160)}` : ""}`);
          resolve(err ? null : String(stdout).trim());
        },
      );
    });
    const took = Math.round((Date.now() - started) / 1000);

    if (!rewritten) {
      console.log(`  retry ${id}: nothing came back after ${took}s`);
      return send(200, { ok: false, took, reason: "No rewrite came back. Try again, or say it in the terminal." });
    }

    // Fences sometimes survive the instruction not to use them.
    const clean = rewritten.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/, "").trim();

    // An identical answer is a failure worth naming. Silently swapping the same text back in looks
    // exactly like the feature being broken, which is how this was first reported.
    if (clean === text.trim()) {
      console.log(`  retry ${id}: came back unchanged after ${took}s`);
      return send(200, { ok: false, took, unchanged: true, reason: `Came back unchanged after ${took}s. Say more about what is wrong with it.` });
    }

    console.log(`  retry ${id}: rewritten in ${took}s`);
    return send(200, { ok: true, id, text: clean, took });
  }

  if (req.url === "/api/undecide" && req.method === "POST") {
    let body = "";
    for await (const chunk of req) body += chunk;
    const { id } = JSON.parse(body || "{}");
    decisions.delete(id);
    return send(200, { ok: true, count: decisions.size });
  }

  if (req.url === "/api/done" && req.method === "POST") {
    done = true;
    const tally = { kept: 0, edited: 0, rewritten: 0, queries: 0 };
    for (const d of decisions.values()) {
      if (d.action === "keep") tally.kept++;
      else if (d.action === "edit") tally.edited++;
      else if (d.action === "rewrite") tally.rewritten++;
      else if (d.action === "query") tally.queries++;
    }
    send(200, { ok: true, ...tally });
    setTimeout(() => server.close(), 150);
    return;
  }

  send(404, { error: "not found" });
});

const port = Number(process.env.STET_PROOF_PORT ?? 4741);
server.listen(port, () => {
  console.log(`Proof sheet: http://localhost:${port}`);
  console.log(`${drafts.length} draft blocks across ${new Set(drafts.map((d) => d.file)).size} files.`);
  console.log("Waiting. Save, correct or retry each block, then press Done.\n");
});

await new Promise((resolve) => server.on("close", resolve));

if (!done && !decisions.size) {
  console.log("Closed with no decisions. Nothing changed.");
  process.exit(0);
}

/* Apply. Edits go in first, then states, so a file is never left marked approved with the old
   words in it if something throws in between. */

const byFile = new Map();
for (const [id, decision] of decisions) {
  const [file] = id.split("#");
  (byFile.get(file) ?? byFile.set(file, []).get(file)).push({ id, ...decision });
}

let kept = 0;
let edited = 0;
let claimed = 0;
let rewritten = 0;
const queries = [];
const partial = [];

for (const [file, list] of byFile) {
  // Highest index first, so writing one block cannot shift the index of another not yet written.
  const writes = list
    .filter((d) => (d.action === "edit" || d.action === "rewrite") && typeof d.text === "string")
    .sort((a, b) => Number(b.id.split("#")[1]) - Number(a.id.split("#")[1]));

  const spans = [];
  for (const w of writes) {
    const index = Number(w.id.split("#")[1]);
    const before = split(root, file).blocks[index]?.text ?? "";
    // Only an author's edit claims sentences. A rewrite is still the agent's work: the words go in
    // the file, and nobody owns them until somebody accepts them. Losing that distinction would
    // have the tool record the agent's prose as the author's.
    if (w.action === "edit") spans.push(...changed(before, w.text));
    replace(root, file, index, w.text);
    if (w.action === "edit") edited++;
    else rewritten++;
  }

  const keeps = list.filter((d) => d.action === "keep").length;
  kept += keeps;
  for (const d of list) if (d.action === "query") queries.push({ id: d.id, note: d.note ?? "" });

  const meta = read(root, file) ?? {};
  const next = { ...meta };

  if (spans.length) {
    next.owned = [...new Set([...(meta.owned ?? []), ...spans])];
    claimed += spans.length;
  }

  // A file becomes approved only when every block on the sheet was saved. Approving a whole file
  // because one paragraph in it was kept would close blocks nobody read, which is the exact
  // over-claiming this tool exists to prevent. It did that once, here, to its own README.
  const onSheet = drafts.filter((d) => d.file === file).length;
  if (keeps === onSheet && !queries.length && !writes.length) {
    next.state = "approved";
    next.author = meta.author ?? "agent";
  } else if (keeps > 0) {
    partial.push({ file, keeps, onSheet });
  }

  write(root, file, next);
}

const left = drafts.length - decisions.size;
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

console.log("\nDECISIONS");
console.log(`  kept     ${kept}`);
console.log(`  edited   ${plural(edited, "block")}, ${plural(claimed, "sentence")} now yours`);
console.log(`  rewritten ${plural(rewritten, "block")} written back, still draft`);
console.log(`  queried  ${queries.length}`);
console.log(`  left     ${left}   (still draft. Silence is not approval.)`);

if (claimed) {
  console.log("\nThose sentences are the author's now and closed to you permanently.");
  console.log("Character for character. Do not tidy them, do not make them consistent with the");
  console.log("voice, do not fix a typo in them. Everything around them is still yours.");
}

if (partial.length) {
  console.log("\nSaved, but not enough to close a file. A file is approved only when every block on");
  console.log("the sheet was saved, so these stay draft and the rest of their blocks are still open:");
  for (const p of partial) console.log(`  ${p.file}  ${p.keeps} of ${p.onSheet} saved`);
}

if (queries.length) {
  console.log("\nQUERIES. Each is an instruction about one block. It is still draft, so act on it.");
  for (const q of queries) console.log(`\n  ${q.id}\n    ${q.note.replace(/\n/g, "\n    ")}`);
  console.log("\nSay what you intend to do about each before doing it.");
}
