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

  if (req.url === "/api/done" && req.method === "POST") {
    done = true;
    send(200, { ok: true });
    setTimeout(() => server.close(), 150);
    return;
  }

  send(404, { error: "not found" });
});

const port = Number(process.env.STET_PROOF_PORT ?? 4741);
server.listen(port, () => {
  console.log(`Proof sheet: http://localhost:${port}`);
  console.log(`${drafts.length} draft blocks across ${new Set(drafts.map((d) => d.file)).size} files.`);
  console.log("Waiting. Keep, correct or query each block, then press Done.\n");
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
const queries = [];

for (const [file, list] of byFile) {
  // Highest index first, so replacing one block cannot shift the index of another not yet applied.
  const edits = list
    .filter((d) => d.action === "edit" && typeof d.text === "string")
    .sort((a, b) => Number(b.id.split("#")[1]) - Number(a.id.split("#")[1]));

  const spans = [];
  for (const edit of edits) {
    const index = Number(edit.id.split("#")[1]);
    const before = split(root, file).blocks[index]?.text ?? "";
    // Only the sentences the author actually typed. A correction to one line does not make them
    // the author of the paragraph around it, and recording it that way would be a lie the tool
    // told on their behalf.
    spans.push(...changed(before, edit.text));
    replace(root, file, index, edit.text);
    edited++;
  }

  for (const d of list) {
    if (d.action === "keep") kept++;
    if (d.action === "query") queries.push({ id: d.id, note: d.note ?? "" });
  }

  const meta = read(root, file) ?? {};
  if (spans.length) {
    const owned = [...new Set([...(meta.owned ?? []), ...spans])];
    claimed += spans.length;
    // The file's own state does not change. Ownership is per sentence, and the rest of the file is
    // still whatever it was.
    write(root, file, { ...meta, owned });
  } else if (list.some((d) => d.action === "keep") && !list.some((d) => d.action === "query")) {
    write(root, file, { ...meta, state: "approved", author: meta.author ?? "agent" });
  }
}

const left = drafts.length - decisions.size;

console.log("\nDECISIONS");
console.log(`  kept     ${kept}`);
console.log(`  edited   ${edited} blocks, ${claimed} sentences now yours`);
console.log(`  queried  ${queries.length}`);
console.log(`  left     ${left}   (still draft. Silence is not approval.)`);

if (claimed) {
  console.log("\nThose sentences are the author's now and closed to you permanently.");
  console.log("Character for character. Do not tidy them, do not make them consistent with the");
  console.log("voice, do not fix a typo in them. Everything around them is still yours.");
}

if (queries.length) {
  console.log("\nQUERIES. Each is an instruction about one block. It is still draft, so act on it.");
  for (const q of queries) console.log(`\n  ${q.id}\n    ${q.note.replace(/\n/g, "\n    ")}`);
  console.log("\nSay what you intend to do about each before doing it.");
}
