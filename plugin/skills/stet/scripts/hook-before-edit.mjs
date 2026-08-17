/**
 * The refusal. A PreToolUse hook that stops an edit to content the agent does not own.
 *
 * This is the only part of Stet that does not depend on an agent choosing to cooperate, and it is
 * why the rest is worth writing. Everything else in this plugin is an instruction, and instructions
 * are advice. Advice loses.
 *
 * Three boundaries keep it from being a nuisance:
 *
 *   1. A project with no `stet.config.json` is not using Stet, and the hook does nothing at all.
 *      Adoption is opt in, and installing a plugin is not adoption.
 *   2. Only paths inside the configured content globs are considered. Code passes through.
 *   3. A file that does not exist yet is new content, which is a draft, which is allowed.
 *
 * The metadata scripts write files directly rather than through the Edit tool, so `ingest` and
 * `mark` are not blocked by this. That is deliberate: the way to change a file's state is the
 * command for it, not an agent hand editing frontmatter.
 */

import { readFileSync, existsSync } from "node:fs";
import { join, relative, resolve, isAbsolute } from "node:path";

const allow = () => process.exit(0);

const deny = (lines) => {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: lines.join("\n"),
      },
    }),
  );
  process.exit(0);
};

let payload = "";
try {
  payload = readFileSync(0, "utf8");
} catch {
  allow();
}

let input;
try {
  input = JSON.parse(payload);
} catch {
  allow();
}

const tool = input?.tool_name ?? "";
if (!/^(Edit|Write|MultiEdit|NotebookEdit)$/.test(tool)) allow();

const root = input?.cwd || process.cwd();
const input_ = input?.tool_input;
const raw = input_?.file_path ?? input_?.notebook_path;
if (!raw) allow();

const abs = isAbsolute(raw) ? raw : resolve(root, raw);
const file = relative(root, abs);
if (file.startsWith("..")) allow();

// 1. No config, no adoption, no opinion.
const configPath = join(root, "stet.config.json");
if (!existsSync(configPath)) allow();

let config;
try {
  config = JSON.parse(readFileSync(configPath, "utf8"));
} catch {
  allow();
}

// 2. Only what the project declared as content.
const { matchesAny } = await import("./lib/glob.mjs");
const globs = Array.isArray(config?.content) ? config.content : [];
if (!matchesAny(file, globs)) allow();

// 3. New content is a draft.
if (!existsSync(abs)) allow();

/*
 * A deliberate release, recorded elsewhere.
 *
 * The escape hatch has to be honoured here or it is not an escape hatch, and it is checked before
 * state rather than after, because an unlock is somebody overriding the state on purpose. Nothing
 * about ownership changes: the record says what the file was, and relocking puts it back.
 */
const adminPath = join(root, ".stet", "admin.json");
if (existsSync(adminPath)) {
  try {
    const admin = JSON.parse(readFileSync(adminPath, "utf8"));
    if (admin?.hook?.off) allow();
    if (admin?.unlocked?.[file]) allow();
  } catch {
    // A corrupt admin file must not open the gate. Fall through and enforce.
  }
}

const { read, mayEdit, ownedSpans } = await import("./lib/meta.mjs");
const meta = read(root, file);

// Sentences a person wrote inside otherwise open content. Checked before the file's own state,
// because a draft file can still contain the author's lines and those are the ones that matter.
const owned = ownedSpans(meta);
if (owned.length) {
  const { touches, intact } = await import("./lib/spans.mjs");
  const input = input_ ?? {};
  const hits =
    typeof input.old_string === "string"
      ? touches(input.old_string, owned)
      : typeof input.content === "string"
        ? intact(input.content, owned)
        : [];

  if (hits.length) {
    deny([
      `${file} contains ${hits.length === 1 ? "a sentence" : `${hits.length} sentences`} the author wrote.`,
      "",
      ...hits.map((h) => `  "${h}"`),
      "",
      "Those words are theirs, character for character. Everything else in this file is still",
      "open to you: edit around them.",
      "",
      "If the sentence itself is wrong, say so in your reply and let the author change it.",
    ]);
  }
}

if (meta && mayEdit(meta)) allow();

const state = meta?.state ?? null;
deny(
  !state
  ? [
      `${file} is content and it is unclaimed.`,
      "",
      "Content with no record belongs to whoever wrote it, and that was not you.",
      "Run stet ingest to read and claim this project before editing anything in it.",
    ]
  : [
      `${file} is ${state}. You may not edit it.`,
      "",
      state === "authored"
        ? "A person wrote this. Do not edit it and do not regenerate it."
        : "An agent wrote this and a person approved it. Approval is what made it theirs.",
      ...(meta?.policy === "refresh"
        ? [
            "",
            `Policy allows one thing: bring these facts current and change no other word: ${(meta.sources ?? []).join(", ") || "none named"}.`,
          ]
        : []),
      "",
      "You may propose a rewrite in your reply. Show it to the author. Do not put it in the file.",
      "If this is blocking the request, say so and ask. Do not release it yourself.",
    ],
);
