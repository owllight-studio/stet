#!/usr/bin/env node
/**
 * The voice proof sheet.
 *
 * A persona is a one-line request with many honest readings. "Bourdain with a dash of James Earl
 * Jones" could be the profanity or the restraint, the speed or the weight, and the author knows
 * which one they meant the moment they see it and not one second before. Asking them to describe it
 * further just produces another sentence with the same problem.
 *
 * So this shows them. The same real passage from their own project, written several ways, with the
 * axes the research actually found exposed as dials they can move. They read, they tune, they
 * re-roll, they pick. Then it writes the decision out for the agent to turn into VOICE.md.
 *
 * The dials are not a fixed set. Every persona yields its own, out of the research, which is why
 * this script renders whatever axes it is handed rather than shipping a list of its own.
 *
 * Input:  .stet/voice-proof.json   (written by the agent, after the research step)
 * Output: .stet/voice-choice.json  (read by the agent, to write VOICE.md)
 *
 * Run: node voice-proof.mjs
 */

import { createServer } from "node:http";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";

const root = process.cwd();
const here = dirname(fileURLToPath(import.meta.url));
const SPEC = join(root, ".stet", "voice-proof.json");
const CHOICE = join(root, ".stet", "voice-choice.json");

if (!existsSync(SPEC)) {
  console.log(`No sheet to show. Expected ${SPEC}`);
  console.log("Research the persona first, then write the spec, then run this.");
  process.exit(1);
}

const spec = JSON.parse(readFileSync(SPEC, "utf8"));
const { persona = "", findings = [], sample = {}, axes = [], variants = [] } = spec;

if (!variants.length) {
  console.log("The spec has no variants. There is nothing to choose between.");
  process.exit(1);
}
if (!sample.text) {
  console.log("The spec has no sample passage. Every variant has to be the same real text.");
  process.exit(1);
}

const page = readFileSync(join(here, "voice-proof-page.html"), "utf8");

/** Live state. The author moves dials and re-rolls; the server keeps whatever came back last. */
const current = new Map(variants.map((v) => [v.id, v.text]));
const notes = new Map();
let dials = Object.fromEntries(axes.map((a) => [a.key, a.value ?? a.default ?? 50]));
let chosen = null;
let done = false;

/**
 * Write one variant, at the current dial settings.
 *
 * Same isolation as the content sheet's retry: a fresh `claude -p` with the brief and nothing else.
 * No conversation, no memory, no wandering into the rest of the repo.
 */
function write(variant, note) {
  const dialLines = axes
    .map((a) => {
      const v = dials[a.key];
      return `- ${a.label}: ${v} out of 100, where 0 is "${a.low}" and 100 is "${a.high}".`;
    })
    .join("\n");

  const prompt = [
    "You are writing one candidate version of a passage, so an author can decide what their site",
    "should sound like. Return ONLY the rewritten passage. No preamble, no explanation, no code",
    "fences, no commentary, no quotation marks around it.",
    "",
    "Keep the same Markdown shape and the same factual content. Every claim, number and name in the",
    "original must survive. You are changing how it sounds and nothing else. Inventing a fact, or",
    "dropping one, makes the comparison worthless.",
    "",
    "COMMIT TO THE REGISTER. This passage sits beside other versions of itself and the author is",
    "choosing between them, so a version that could be mistaken for the original, or for one of the",
    "others, is a failed answer. Go as far into this reading as you can go while every fact survives",
    "and the prose stays good. If the register wants a 40-word sentence, write one. If it wants a",
    "four-word one, write that. Hedging toward the middle is the one outcome that helps nobody.",
    "",
    `THE VOICE THE AUTHOR ASKED FOR:\n${persona}`,
    findings.length
      ? `\nWHAT THE RESEARCH ACTUALLY FOUND. These are counted off real texts, so they outrank your\nimpression of how this voice sounds:\n${findings.map((f) => `- ${f}`).join("\n")}`
      : "",
    `\nTHIS PARTICULAR READING OF IT:\n${variant.brief}`,
    axes.length ? `\nWHERE THE AUTHOR HAS SET THE DIALS:\n${dialLines}` : "",
    note ? `\nWHAT THE AUTHOR SAID ABOUT THE LAST ATTEMPT:\n${note}` : "",
    note
      ? "\nThey read the last version and rejected it. Returning something that differs only in\npunctuation is a failed answer."
      : "",
    `\nTHE PASSAGE:\n${sample.text}`,
  ]
    .filter(Boolean)
    .join("\n");

  return new Promise((resolve) => {
    execFile("claude", ["-p", prompt], { timeout: 180000, maxBuffer: 1 << 22, cwd: root }, (err, stdout, stderr) => {
      if (err) {
        const detail = stderr ? ` / ${String(stderr).slice(0, 160)}` : "";
        console.log(`  ${variant.id}: failed. ${err.message.split("\n")[0]}${detail}`);
        return resolve(null);
      }
      const clean = String(stdout).trim().replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/, "").trim();
      resolve(clean || null);
    });
  });
}

const server = createServer(async (req, res) => {
  const send = (code, body, type = "application/json") => {
    res.writeHead(code, { "content-type": type, "cache-control": "no-store" });
    res.end(typeof body === "string" ? body : JSON.stringify(body));
  };
  const read = async () => {
    let body = "";
    for await (const chunk of req) body += chunk;
    return JSON.parse(body || "{}");
  };

  if (req.url === "/" || req.url?.startsWith("/?")) return send(200, page, "text/html; charset=utf-8");

  if (req.url === "/api/sheet") {
    return send(200, {
      persona,
      findings,
      sample,
      axes,
      dials,
      variants: variants.map((v) => ({ ...v, text: current.get(v.id) })),
    });
  }

  if (req.url === "/api/dials" && req.method === "POST") {
    dials = { ...dials, ...(await read()).dials };
    return send(200, { ok: true, dials });
  }

  /** Re-roll one variant at the current dials, optionally with a note about what was wrong. */
  if (req.url === "/api/roll" && req.method === "POST") {
    const { id, note } = await read();
    const variant = variants.find((v) => v.id === id);
    if (!variant) return send(404, { error: "no such variant" });
    if (note) notes.set(id, note);

    const started = Date.now();
    const text = await write(variant, note);
    const took = Math.round((Date.now() - started) / 1000);

    if (!text) return send(200, { ok: false, took, reason: "Nothing came back. Try again." });
    if (text === current.get(id)?.trim()) {
      return send(200, { ok: false, took, unchanged: true, reason: `Came back unchanged after ${took}s. Move a dial, or say what is wrong with it.` });
    }
    current.set(id, text);
    console.log(`  ${id}: rewritten in ${took}s`);
    return send(200, { ok: true, id, text, took });
  }

  /** The author edited a variant by hand. Their words, kept exactly. */
  if (req.url === "/api/edit" && req.method === "POST") {
    const { id, text } = await read();
    current.set(id, text);
    return send(200, { ok: true });
  }

  if (req.url === "/api/choose" && req.method === "POST") {
    const { id, note } = await read();
    chosen = { id, note: note ?? "" };
    return send(200, { ok: true, chosen: id });
  }

  if (req.url === "/api/done" && req.method === "POST") {
    const { id, note, blend } = await read();
    if (id) chosen = { id, note: note ?? "" };
    done = true;

    const picked = variants.find((v) => v.id === chosen?.id);
    const out = {
      persona,
      dials,
      chosen: picked ? { id: picked.id, label: picked.label, brief: picked.brief, text: current.get(picked.id) } : null,
      blend: blend ?? "",
      note: chosen?.note ?? "",
      /* Every version they saw, not only the winner. What was rejected is evidence about the voice,
         and throwing it away means the next pass rediscovers it. */
      rejected: variants
        .filter((v) => v.id !== chosen?.id)
        .map((v) => ({ id: v.id, label: v.label, brief: v.brief, text: current.get(v.id), note: notes.get(v.id) ?? "" })),
      sample,
    };
    mkdirSync(dirname(CHOICE), { recursive: true });
    writeFileSync(CHOICE, `${JSON.stringify(out, null, 2)}\n`);
    send(200, { ok: true });
    setTimeout(() => server.close(), 150);
    return;
  }

  send(404, { error: "not found" });
});

const port = Number(process.env.STET_VOICE_PORT ?? 4742);
server.listen(port, () => {
  console.log(`Voice proof sheet: http://localhost:${port}`);
  console.log(`${variants.length} readings of: ${persona}`);
  console.log(`All on the same passage, from ${sample.file ?? "your project"}.`);
  console.log("Read them, move the dials, re-roll what is close, then pick one.\n");
});

await new Promise((resolve) => server.on("close", resolve));

if (!done) {
  console.log("\nSheet closed with nothing picked. Nothing was written.");
  process.exit(0);
}

const picked = variants.find((v) => v.id === chosen?.id);
console.log("");
if (picked) {
  console.log(`Picked: ${picked.label}`);
} else {
  console.log("Closed without picking one of the readings.");
}
for (const a of axes) console.log(`  ${a.label.padEnd(24)} ${dials[a.key]}`);
if (chosen?.note) console.log(`\nThey said: ${chosen.note}`);
console.log(`\nWritten to ${CHOICE}. Turn it into VOICE.md, with rules and counter-examples.`);
