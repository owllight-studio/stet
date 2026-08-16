/**
 * Where a number in the prose actually came from, and whether it is still true.
 *
 * The design decision that shapes everything else here: **no markers in the content.** Stet does not
 * put `{{corpus.rampShare}}` in a sentence, because a sentence carrying templating is a sentence
 * nobody wants to read in a diff, and because the whole product rests on content being ordinary
 * prose that happens to know things about itself.
 *
 * So claims are found by value rather than by marker. A source runs and prints a figure. If that
 * figure appears in the prose, the claim is current. If the previously recorded figure appears
 * instead, the claim is stale and we know exactly which characters to replace. If neither appears,
 * we say so and change nothing, because a claim we cannot locate is a claim we must not rewrite.
 *
 * That last case is the important one. Guessing which number in a paragraph was meant to be the
 * ramp share is how a tool silently corrupts somebody's writing.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { execFile } from "node:child_process";
import { config } from "./find.mjs";

const LOCK = ".stet/sources.json";

/* --- rendering a value into the shapes prose actually uses ---------------- */

/**
 * The written forms a value might legitimately take.
 *
 * A writer who typed "47 percent" should not have it replaced with "47%". Preserving their form is
 * the same rule as everywhere else in this project: the tool changes the fact and never the voice.
 */
export function forms(value, as = "raw") {
  const v = String(value).trim();
  if (as === "percent") {
    const n = v.replace(/%$/, "").trim();
    return [`${n}%`, `${n} percent`, `${n} per cent`];
  }
  if (as === "number") {
    const n = Number(v.replace(/,/g, ""));
    if (!Number.isFinite(n)) return [v];
    const grouped = n.toLocaleString("en-US");
    return grouped === v ? [v] : [grouped, String(n)];
  }
  return [v];
}

/** Which written form of `value` appears in `text`, if any. Longest first, so "47%" beats "47". */
export function findForm(text, value, as) {
  for (const form of forms(value, as).sort((a, b) => b.length - a.length)) {
    // Word boundaries on both sides, so 47 does not match inside 470 or 1947.
    const re = new RegExp(`(?<![\\w.])${form.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\w%])`);
    const m = text.match(re);
    if (m) return { form, index: m.index };
  }
  return null;
}

/* --- running the sources -------------------------------------------------- */

/**
 * Declared in the project's own config, never in content.
 *
 * This matters: a source is a shell command, and a command that could be declared inside a page
 * would mean anything able to write a page could run code. Config is the boundary.
 */
export function declared(root = process.cwd()) {
  return config(root)?.sources ?? {};
}

export function run(root, name, spec) {
  return new Promise((resolve) => {
    const cmd = typeof spec === "string" ? spec : spec?.run;
    if (!cmd) return resolve({ name, error: "no command declared" });

    execFile(
      process.env.SHELL || "/bin/sh",
      ["-c", cmd],
      { cwd: root, timeout: 60000, maxBuffer: 1 << 20 },
      (err, stdout, stderr) => {
        if (err) {
          // Stack traces are multi-line and this report is not. First line of each, nothing more.
          const first = (t) => String(t).trim().split("\n").find((l) => l.trim()) ?? "";
          const detail = [first(err.message), first(stderr)].filter(Boolean).join(" / ").slice(0, 200);
          return resolve({ name, error: detail || "failed" });
        }
        const value = String(stdout).trim();
        if (!value) return resolve({ name, error: "returned nothing" });
        if (value.includes("\n")) return resolve({ name, error: "returned more than one line" });
        resolve({ name, value, as: typeof spec === "string" ? "raw" : (spec.as ?? "raw") });
      },
    );
  });
}

/**
 * Run every declared source, one at a time.
 *
 * Serialized deliberately. These are somebody's own build commands and database queries, and a
 * verify pass firing twenty of them at once is how a tool gets blamed for an outage.
 */
export async function runAll(root, names) {
  const specs = declared(root);
  const wanted = names?.length ? names : Object.keys(specs);
  const out = {};
  for (const name of wanted) {
    out[name] = specs[name]
      ? await run(root, name, specs[name])
      : { name, error: "not declared in stet.config.json" };
  }
  return out;
}

/* --- what we knew last time ---------------------------------------------- */

export function lock(root) {
  const path = join(root, LOCK);
  if (!existsSync(path)) return {};
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return {};
  }
}

export function writeLock(root, data) {
  const path = join(root, LOCK);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
}

/* --- the claim, and its three possible states ----------------------------- */

/**
 * Compare one source against one file's text.
 *
 * Returns exactly one of:
 *   current  the live value is in the prose
 *   stale    the previously recorded value is in the prose and the source has moved
 *   missing  neither is there, so the sentence was reworded or the figure was typed by hand
 *   broken   the source did not run
 */
export function check(text, name, result, previous) {
  if (result.error) return { name, state: "broken", detail: result.error };

  const live = findForm(text, result.value, result.as);
  if (live) return { name, state: "current", value: result.value, form: live.form };

  if (previous !== undefined && String(previous) !== String(result.value)) {
    const old = findForm(text, previous, result.as);
    if (old) {
      return {
        name,
        state: "stale",
        was: previous,
        value: result.value,
        form: old.form,
        // The replacement keeps the shape the writer chose: "47 percent" becomes "52 percent".
        becomes: forms(result.value, result.as)[forms(previous, result.as).indexOf(old.form)] ?? forms(result.value, result.as)[0],
      };
    }
  }

  return { name, state: "missing", value: result.value };
}

/** Figures sitting in prose with no source behind them. The dreambreath lesson, generalised. */
export function typedFigures(text, sourced = []) {
  const known = new Set(sourced.flatMap((s) => forms(s.value ?? "", s.as ?? "raw")));
  const out = [];
  for (const m of text.matchAll(/(?<![\w.$])(\d[\d,]*(?:\.\d+)?)\s*(%|percent|per cent)?(?![\w])/g)) {
    const whole = m[0].trim();
    if (known.has(whole)) continue;
    // Years, small counts and version numbers are prose, not claims.
    const n = Number(m[1].replace(/,/g, ""));
    if (!m[2] && (n < 10 || (n > 1900 && n < 2100))) continue;
    out.push({ text: whole, index: m.index });
  }
  return out;
}
