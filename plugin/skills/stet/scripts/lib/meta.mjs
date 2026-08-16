/**
 * Reading and writing a file's Stet metadata, across the formats content lives in.
 *
 * Three states, because they produce three different behaviours rather than three different labels:
 *
 *   draft     an agent wrote it and nobody has approved it. An agent may rewrite it freely.
 *   approved  an agent wrote it and a person accepted it. An agent may not touch the words.
 *   authored  a person wrote it. An agent may not touch it, and may not regenerate it either.
 *
 * Approval is the transition from draft to approved, and it is what confers ownership. The
 * distinction between approved and authored is provenance: both are closed to an agent, but only
 * one of them was written by a person, and a project that wants to say who wrote what needs to
 * keep that.
 *
 * `policy` is separate and orthogonal. It says what may still be done to closed content:
 *
 *   frozen    nothing, not even a figure
 *   refresh   facts named in `sources` may be brought current. The prose around them may not.
 *   open      anything, which is what draft already means and is here for completeness
 *
 * So "these are my words, keep the numbers in them true" is authored plus refresh, and that
 * combination is the one this whole system exists to make expressible.
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, extname } from "node:path";

export const STATES = ["draft", "approved", "authored"];
export const POLICIES = ["frozen", "refresh", "open"];

/**
 * May an agent rewrite the words?
 *
 * In draft, because nobody has accepted them. Or under policy `open`, which is the only way a
 * closed file reopens without changing its state, and exists for the page somebody approved once
 * and wants kept current wholesale.
 *
 * `open` used to be declared in the policy vocabulary and behave exactly like `refresh`, which made
 * one of the three policies dead and the vocabulary a lie. Either it means this or it should not be
 * offered.
 */
export const mayEdit = (meta) => meta?.state === "draft" || meta?.policy === "open";

/**
 * Sentences a person wrote inside otherwise open content. Ownership is per sentence: correcting one
 * line does not hand an agent's paragraph to the author, and does not hand the author's line back.
 */
export const ownedSpans = (meta) => (Array.isArray(meta?.owned) ? meta.owned : []);

/** May an agent bring a named fact current, despite the words being closed? */
export const mayRefresh = (meta) =>
  meta?.state === "draft" || meta?.policy === "refresh" || meta?.policy === "open";

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---/;

/** A deliberately small YAML reader. Stet's block is flat scalars and one list; nothing more. */
function parseBlock(text) {
  const out = {};
  let inStet = false;
  let listKey = null;
  for (const raw of text.split("\n")) {
    const line = raw.replace(/\s+$/, "");
    if (/^stet\s*:\s*$/.test(line)) { inStet = true; continue; }
    if (inStet && /^\S/.test(line)) break;
    if (!inStet) continue;

    const item = line.match(/^\s+-\s+(.*)$/);
    if (item && listKey) { (out[listKey] ??= []).push(item[1].trim().replace(/^["']|["']$/g, "")); continue; }

    const pair = line.match(/^\s+([a-zA-Z_]+)\s*:\s*(.*)$/);
    if (!pair) continue;
    const [, key, value] = pair;
    if (value === "") { listKey = key; out[key] = []; continue; }
    listKey = null;
    const inline = value.match(/^\[(.*)\]$/);
    out[key] = inline
      ? inline[1].split(",").map((v) => v.trim().replace(/^["']|["']$/g, "")).filter(Boolean)
      : value.replace(/^["']|["']$/g, "");
  }
  return Object.keys(out).length ? out : null;
}

function render(meta) {
  const lines = ["stet:"];
  for (const key of ["state", "author", "approved", "policy"]) {
    if (meta[key] !== undefined && meta[key] !== null) lines.push(`  ${key}: ${meta[key]}`);
  }
  for (const key of ["sources", "owned"]) {
    if (!meta[key]?.length) continue;
    lines.push(`  ${key}:`);
    // Quoted, because a sentence contains colons, dashes and quotes that would otherwise be YAML.
    for (const v of meta[key]) lines.push(`    - ${JSON.stringify(String(v))}`);
  }
  return lines.join("\n");
}

export function read(root, file) {
  const sidecar = join(root, `${file}.stet.yaml`);
  if (existsSync(sidecar)) return parseBlock(readFileSync(sidecar, "utf8"));

  const full = join(root, file);
  if (!existsSync(full)) return null;
  const text = readFileSync(full, "utf8");

  if (extname(file) === ".json") {
    try {
      const doc = JSON.parse(text);
      return doc?.stet ?? null;
    } catch {
      return null;
    }
  }

  const fm = text.match(FRONTMATTER);
  return fm ? parseBlock(fm[1]) : null;
}

/**
 * Write metadata, changing nothing else in the file.
 *
 * That constraint is the whole contract of this function. An ingest that reformats content is an
 * ingest nobody runs twice, so this appends to an existing frontmatter block, creates one only when
 * there is none, and never touches a byte of the body.
 */
/** Formats that genuinely carry front matter. Everything else gets a sidecar. */
const FRONTMATTER_OK = new Set([".md", ".markdown", ".mdx"]);

export function write(root, file, meta) {
  const full = join(root, file);
  const text = readFileSync(full, "utf8");
  const block = render(meta);

  if (extname(file) === ".json") {
    const doc = JSON.parse(text);
    const indent = text.match(/\n(\s+)"/)?.[1]?.length ?? 2;
    writeFileSync(full, JSON.stringify({ ...doc, stet: meta }, null, indent) + "\n");
    return "json";
  }

  /* A format that does not carry front matter gets a sidecar rather than a YAML block bolted to the
     top of it. Writing `---` above a doctype produces a file the browser will not render, and the
     contract of this function is that it changes nothing else in the file. */
  if (!FRONTMATTER_OK.has(extname(file))) {
    writeFileSync(join(root, `${file}.stet.yaml`), `${block}\n`);
    return "sidecar";
  }

  const fm = text.match(FRONTMATTER);
  if (!fm) {
    writeFileSync(full, `---\n${block}\n---\n\n${text.replace(/^\n+/, "")}`);
    return "created";
  }

  const existing = fm[1];
  const stripped = existing
    .split("\n")
    .reduce((acc, line) => {
      if (/^stet\s*:/.test(line)) { acc.skip = true; return acc; }
      if (acc.skip && /^\s/.test(line)) return acc;
      acc.skip = false;
      acc.lines.push(line);
      return acc;
    }, { lines: [], skip: false })
    .lines.join("\n")
    .replace(/\n+$/, "");

  const merged = stripped ? `${stripped}\n${block}` : block;
  writeFileSync(full, text.replace(FRONTMATTER, `---\n${merged}\n---`));
  return "merged";
}
