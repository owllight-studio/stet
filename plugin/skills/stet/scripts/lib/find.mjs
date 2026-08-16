/**
 * Where the content is, and what shape it is in.
 *
 * Shared by every script here. Reads `stet.config.json` when a project has one, and falls back to
 * looking the way a person would, because a project's first contact with Stet is `ingest` and that
 * runs before any config exists.
 */

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, extname, relative, basename } from "node:path";

const CONTENT_DIRS = ["content", "docs", "posts", "pages", "src/content", "_posts", "data/content"];
const CONTENT_EXT = new Set([".md", ".mdx", ".mdoc", ".json", ".yaml", ".yml", ".html"]);
const SKIP = new Set([
  "node_modules", ".git", ".next", "dist", "build", "out", ".vercel", ".cache",
  "coverage", "__pycache__", ".venv", "vendor",
]);

export function config(root = process.cwd()) {
  const path = join(root, "stet.config.json");
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (err) {
    return { error: `stet.config.json is not valid JSON: ${err.message}` };
  }
}

function walk(dir, root, out) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (entry.name.startsWith(".") && entry.name !== ".well-known") continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP.has(entry.name)) continue;
      walk(full, root, out);
    } else if (CONTENT_EXT.has(extname(entry.name))) {
      out.push(relative(root, full));
    }
  }
  return out;
}

/**
 * Every candidate content file.
 *
 * With no config this guesses, and it says so in `guessed`. A guess is reported rather than acted
 * on: claiming a source file as prose is a mess to undo, so `ingest` confirms the boundary with the
 * author before writing anything.
 */
export function findContent(root = process.cwd()) {
  const cfg = config(root);
  if (cfg?.content?.length) {
    const files = [];
    for (const dir of cfg.content.map((p) => p.replace(/\/?\*\*.*$/, ""))) {
      const full = join(root, dir);
      if (existsSync(full) && statSync(full).isDirectory()) walk(full, root, files);
      else if (existsSync(full)) files.push(relative(root, full));
    }
    return { files: [...new Set(files)].sort(), guessed: false, roots: cfg.content };
  }

  const roots = CONTENT_DIRS.filter((d) => existsSync(join(root, d)));
  const files = [];
  for (const dir of roots) walk(join(root, dir), root, files);
  return { files: files.sort(), guessed: true, roots };
}

/** Frontmatter, a JSON `stet` key, or a sidecar. Enough to answer "is this claimed". */
export function readMeta(root, file) {
  const full = join(root, file);
  const sidecar = join(root, `${file}.stet.yaml`);
  if (existsSync(sidecar)) {
    return { source: "sidecar", raw: readFileSync(sidecar, "utf8") };
  }

  let text;
  try {
    text = readFileSync(full, "utf8");
  } catch {
    return { source: "none", raw: null };
  }

  if (extname(file) === ".json") {
    try {
      const doc = JSON.parse(text);
      return doc && typeof doc === "object" && "stet" in doc
        ? { source: "json", raw: JSON.stringify(doc.stet) }
        : { source: "none", raw: null };
    } catch {
      return { source: "none", raw: null };
    }
  }

  const fm = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (fm && /(^|\n)\s*stet\s*:/.test(fm[1])) return { source: "frontmatter", raw: fm[1] };
  return { source: "none", raw: null };
}

export function words(root, file) {
  try {
    const text = readFileSync(join(root, file), "utf8");
    return text.split(/\s+/).filter(Boolean).length;
  } catch {
    return 0;
  }
}

export const label = (file) => basename(file);
