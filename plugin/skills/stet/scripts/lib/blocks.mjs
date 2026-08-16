/**
 * Splitting a content file into reviewable blocks, and putting one back.
 *
 * A block is a paragraph, a list, a heading or a fenced code run, addressed by its index in the
 * file. Index rather than a generated id, because an id would have to be written into the content,
 * and content that carries editing scaffolding is content nobody wants to read in a diff.
 *
 * The cost of indices is that they move when a block is inserted. That is acceptable here because a
 * proof sheet is a single sitting: gather, review, apply, done. Nothing edits the file in between.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join, extname } from "node:path";

const FRONTMATTER = /^---\r?\n[\s\S]*?\r?\n---\r?\n?/;

/* --- HTML ---------------------------------------------------------------- */

/** Elements that carry prose somebody wrote, as opposed to structure somebody generated. */
const PROSE_TAGS = ["title", "h1", "h2", "h3", "h4", "p", "li", "dd", "summary", "figcaption"];
/** Regions whose contents are code or styling and are nobody's prose. */
const OPAQUE = /<(script|style|pre|code)\b[\s\S]*?<\/\1>/gi;

/**
 * Prose blocks in an HTML file, addressed by their exact byte range in the source.
 *
 * Offsets rather than an index into a rebuilt document, which makes writing back strictly safer
 * than the markdown path: everything outside the one range is untouched by construction, including
 * markup, indentation and blank lines.
 */
function splitHtml(text) {
  const opaque = [];
  for (const m of text.matchAll(OPAQUE)) opaque.push([m.index, m.index + m[0].length]);
  const hidden = (i) => opaque.some(([a, b]) => i >= a && i < b);

  const blocks = [];
  const re = new RegExp(`<(${PROSE_TAGS.join("|")})(\\s[^>]*)?>([\\s\\S]*?)</\\1>`, "gi");

  for (const m of text.matchAll(re)) {
    if (hidden(m.index)) continue;
    const inner = m[3];

    // An element wrapping other prose elements is a container, not a block. Its children get their
    // own turn, and presenting both would ask the author to review the same words twice.
    if (new RegExp(`<(${PROSE_TAGS.join("|")})\\b`, "i").test(inner)) continue;
    if (!inner.replace(/<[^>]+>/g, "").trim()) continue;

    const lead = inner.match(/^\s*/)[0].length;
    const tail = inner.match(/\s*$/)[0].length;
    const start = m.index + m[0].indexOf(inner) + lead;
    const end = m.index + m[0].indexOf(inner) + inner.length - tail;

    blocks.push({
      index: blocks.length,
      line: text.slice(0, start).split("\n").length,
      kind: /^h[1-4]$/i.test(m[1]) ? "heading" : m[1].toLowerCase() === "li" ? "list" : "prose",
      text: text.slice(start, end),
      start,
      end,
    });
  }
  return { head: "", blocks };
}

/** Blocks in document order. Headings are included, since a heading is content and often wrong. */
export function split(root, file) {
  const text = readFileSync(join(root, file), "utf8");
  if (/^\.x?html?$/i.test(extname(file))) return splitHtml(text);
  const fm = text.match(FRONTMATTER);
  const head = fm ? fm[0] : "";
  const body = text.slice(head.length);

  const blocks = [];
  let cursor = 0;
  let inFence = false;
  let start = 0;
  const lines = body.split("\n");

  const push = (from, to) => {
    const raw = lines.slice(from, to).join("\n");
    if (raw.trim()) {
      blocks.push({
        index: blocks.length,
        line: from + 1,
        kind: /^#{1,6}\s/.test(raw) ? "heading" : /^\s*([-*+]|\d+\.)\s/m.test(raw) ? "list" : /^```/.test(raw) ? "code" : "prose",
        text: raw.replace(/\s+$/, ""),
      });
    }
  };

  lines.forEach((line, i) => {
    if (/^```/.test(line)) inFence = !inFence;
    if (!inFence && line.trim() === "") {
      push(start, i);
      start = i + 1;
    }
    cursor = i;
  });
  push(start, cursor + 1);

  return { head, blocks };
}

/**
 * Replace one block's text, changing nothing else in the file.
 *
 * Byte for byte what the author typed. Not trimmed, not normalised, not made consistent with
 * anything. An author who corrects a sentence has authored it, and tidying their words afterwards
 * is the same failure this whole project exists to prevent, committed by the tool instead of the
 * agent.
 */
export function replace(root, file, index, text) {
  const full = join(root, file);
  const original = readFileSync(full, "utf8");
  const { head, blocks } = split(root, file);
  const target = blocks[index];
  if (!target) throw new Error(`no block ${index} in ${file}`);

  // A block that knows its own byte range is spliced in place. Everything outside it is untouched
  // by construction rather than by careful rebuilding, which is the stronger version of this
  // function's promise.
  if (target.start !== undefined) {
    writeFileSync(full, original.slice(0, target.start) + text + original.slice(target.end));
    return;
  }

  const body = original.slice(head.length);
  const before = blocks.slice(0, index).map((b) => b.text);
  const after = blocks.slice(index + 1).map((b) => b.text);

  // The gap between the frontmatter and the first block is preserved rather than rebuilt. It was
  // being swallowed, which is a change to a file this function promises not to change other than
  // in the one block it was given.
  const lead = body.match(/^\s*\n/)?.[0] ?? "";
  const trailing = body.endsWith("\n") ? "\n" : "";

  // Between blocks the spacing is uniform. That is a real change to files with irregular blank
  // lines, and it is why this runs only on files being proofed.
  const rebuilt = [...before, text, ...after].join("\n\n");
  writeFileSync(full, head + lead + rebuilt + trailing);
}
