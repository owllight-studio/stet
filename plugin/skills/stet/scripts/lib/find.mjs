/**
 * Where the content is, and what shape it is in.
 *
 * Shared by every script here. Reads `stet.config.json` when a project has one, and falls back to
 * looking the way a person would, because a project's first contact with Stet is `ingest` and that
 * runs before any config exists.
 */

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, extname, relative, basename } from "node:path";
import { matchesAny } from "./glob.mjs";

const CONTENT_DIRS = ["content", "docs", "posts", "pages", "src/content", "_posts", "data/content"];
/* Kept in step with two siblings that disagreed with it: lib/meta.mjs writes frontmatter into
   .markdown, and markupOf treats .htm as HTML, and neither extension was discoverable here. */
const CONTENT_EXT = new Set([".md", ".markdown", ".mdx", ".mdoc", ".json", ".yaml", ".yml", ".html", ".htm"]);
const SKIP = new Set([
  "node_modules", ".git", ".next", "dist", "build", "out", ".vercel", ".cache",
  "coverage", "__pycache__", ".venv", "vendor",
]);

/**
 * What kind of written thing this project is.
 *
 * Not decoration. Several checks are statements about one kind and nonsense about another: an
 * orphan is a real finding in a documentation tree and meaningless in a novel, where nothing links
 * to chapter nine and nothing should. Running every check on every project is how a tool teaches
 * people to stop reading it.
 */
export const KINDS = {
  site: {
    label: "a site",
    linked: true,
    hasIA: true,
    note: "pages a reader arrives at, in no fixed order, reached by links",
  },
  manuscript: {
    label: "a manuscript",
    linked: false,
    hasIA: false,
    note: "one long work in a fixed order. Nothing links to chapter nine and nothing should",
  },
  papers: {
    label: "papers",
    linked: false,
    hasIA: false,
    note: "argued work standing on its citations, where a claim without a source is the failure",
  },
  collection: {
    label: "a collection",
    linked: false,
    hasIA: false,
    note: "independent pieces. Poems, songs, essays. Order is an editor's decision rather than a structure",
  },
};

export const kindOf = (root = process.cwd()) => KINDS[config(root)?.kind] ?? KINDS.site;

/**
 * What a filename claims to be: `"content"`, `"copy"`, or null.
 *
 * A copy is a content name with something appended, like `VOICE.md.new` or `page.html.bak`. It
 * exists as a category because one of those sat tracked in this repository carrying Stet metadata
 * and was invisible to every check in the project for a day. The check written to catch exactly
 * that case filtered on the name *ending* in a content extension, so it could never fire on the
 * shape it was looking for.
 */
export function nameKind(name) {
  const parts = String(name).toLowerCase().split(".");
  if (parts.length < 2) return null;
  if (CONTENT_EXT.has(`.${parts.at(-1)}`)) return "content";
  if (parts.length > 2 && CONTENT_EXT.has(`.${parts.at(-2)}`)) return "copy";
  return null;
}

/* One glob written where a list was meant.
 *
 * `content: "docs/**"` instead of `content: ["docs/**"]` is the mistake people make, the JSON parses
 * fine, and every consumer then treats it as an array. It threw `globs.some is not a function` out
 * of the matcher and `roots.join is not a function` out of scan, with a stack trace and no report.
 * Fixing the matcher alone left the second one, so it is normalised here, once, where the config is
 * read. One glob is a list of one. Anything that is neither is no globs at all.
 */
const asGlobs = (v) => (typeof v === "string" ? [v] : Array.isArray(v) ? v.filter((g) => typeof g === "string") : []);

export function config(root = process.cwd()) {
  const path = join(root, "stet.config.json");
  if (!existsSync(path)) return null;
  try {
    const cfg = JSON.parse(readFileSync(path, "utf8"));
    if (cfg && typeof cfg === "object") {
      if ("content" in cfg) cfg.content = asGlobs(cfg.content);
      if ("prose" in cfg) cfg.prose = asGlobs(cfg.prose);
    }
    return cfg;
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
    // Walk the widest directory each glob could reach, then keep only what the glob really matches.
    // Truncating a glob at its first wildcard and matching on the prefix is how a script living in
    // a content directory came to be treated as content.
    const found = [];
    for (const glob of cfg.content) {
      const base = glob.replace(/^\.\//, "").split(/[*?]/)[0].replace(/\/[^/]*$/, "").replace(/\/$/, "");
      const start = base ? join(root, base) : root;
      if (!existsSync(start)) continue;
      if (statSync(start).isDirectory()) walk(start, root, found);
      else found.push(relative(root, start));
    }
    const files = [...new Set(found)].filter((f) => matchesAny(f, cfg.content));
    return { files: files.sort(), guessed: false, roots: cfg.content };
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
