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
import { join } from "node:path";

const FRONTMATTER = /^---\r?\n[\s\S]*?\r?\n---\r?\n?/;

/** Blocks in document order. Headings are included, since a heading is content and often wrong. */
export function split(root, file) {
  const text = readFileSync(join(root, file), "utf8");
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
