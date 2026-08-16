#!/usr/bin/env node
/**
 * Builds site/voices.html from the voice files themselves.
 *
 * The site is not allowed to describe the library from memory. Every figure, rule and tell on the
 * page is lifted out of plugin/skills/stet/voices/*.md at build time, so a preset that changes
 * changes the page, and a claim that is not in a voice file cannot appear on the site at all.
 *
 * Run: node site/build-voices.mjs
 */

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const VOICES = join(here, "..", "plugin", "skills", "stet", "voices");
const REPO = "https://github.com/owllight-studio/stet/blob/main/plugin/skills/stet/voices";

const GROUPS = [
  { key: "core", title: "Core", blurb: "The registers most writing actually needs. Start here." },
  { key: "marketing", title: "Marketing", blurb: "Written to move someone, and measured on whether they trust it." },
  { key: "genre", title: "Genre", blurb: "Fiction registers, for people whose product has a world in it." },
  { key: "fun", title: "Fun", blurb: "For when the constraint is the point." },
];

/* --- reading the files --------------------------------------------------- */

/** Front matter here is flat scalars, one nested map and one string. Nothing more is permitted. */
function frontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return {};
  const out = {};
  let nest = null;
  for (const raw of m[1].split("\n")) {
    const line = raw.replace(/\s+$/, "");
    if (!line) continue;
    const top = line.match(/^([a-zA-Z_]+)\s*:\s*(.*)$/);
    if (top) {
      nest = top[2] === "" ? (out[top[1]] = {}) : null;
      if (top[2] !== "") out[top[1]] = top[2].replace(/^["']|["']$/g, "");
      continue;
    }
    const pair = line.match(/^\s+([a-zA-Z_]+)\s*:\s*(.*)$/);
    if (pair && nest) nest[pair[1]] = pair[2].replace(/^["']|["']$/g, "");
  }
  return out;
}

/** The body of one `## Heading`, up to the next heading of the same level. */
function section(text, heading) {
  const re = new RegExp(`^## ${heading}\\s*$([\\s\\S]*?)(?=^## |$(?![\\s\\S]))`, "mi");
  const m = text.match(re);
  return m ? m[1].trim() : "";
}

/** The first `### Heading` titles inside a section, which are the rule names. */
function ruleNames(body) {
  return [...body.matchAll(/^### (.+)$/gm)].map((m) => m[1].trim());
}

/** Bullet lines from a section, flattened to one line each. */
function bullets(body) {
  return [...body.matchAll(/^- ([\s\S]*?)(?=^- |^#|$(?![\s\S]))/gm)]
    .map((m) => m[1].replace(/\s*\n\s+/g, " ").trim())
    .filter(Boolean);
}

/**
 * Bolded lead-ins from the pastiche section: the named ways a register gives itself away.
 *
 * A failure mode is a name, not a claim. The files also bold whole sentences mid-paragraph for
 * emphasis, and those read as noise once they are lifted out of their context into the index, so
 * anything long enough to be an argument is left where it was written.
 */
function tells(body) {
  return [...body.matchAll(/\*\*(.+?)\*\*/g)]
    .map((m) => m[1].replace(/\s*\n\s*/g, " ").trim())
    .filter((t) => t.length > 12 && t.length <= 62)
    .filter((t) => !/^(Yes|No|Detection|Never):?$/i.test(t));
}

/** The detection line, where a voice states how to catch itself being faked. */
function detection(body) {
  const m = body.match(/\*\*Detection:?\*\*:?\s*([\s\S]*?)(?=\n\n|$(?![\s\S]))/i);
  return m ? m[1].replace(/\s*\n\s*/g, " ").trim() : "";
}

/* --- rendering ----------------------------------------------------------- */

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Markdown emphasis and quotes only. The voice files use nothing else inline. */
function inline(md) {
  return esc(md)
    .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "<i>$1</i>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}

/** The first paragraph of a section, which in every file is the statement of the thing. */
function lead(body) {
  const para = body.split(/\n\s*\n/).find((p) => p.trim() && !p.startsWith("#"));
  return para ? inline(para.replace(/\s*\n\s*/g, " ").trim()) : "";
}

const LABELS = {
  sentenceMedian: "median sentence",
  sentenceMean: "mean sentence",
  sentenceMax: "longest",
  sentenceP10: "10th pct",
  sentenceP90: "90th pct",
  sentenceP95: "95th pct",
  sentenceSdOverMean: "sd / mean",
  sentenceVariance: "variance",
  shortSentences: "under 6 words",
  paragraphSentences: "sentences / para",
  hedgesPerSentence: "hedges",
  secondPerson: "you",
  firstPersonPlural: "we",
  similesPerThousandWords: "similes / 1k words",
  subordinateOpeners: "subordinate openers",
  numbersPerHundredWords: "numbers / 100 words",
  adjectivesBeforeNoun: "adjectives / noun",
  ledeMaxWords: "lede ceiling",
  exclamations: "exclamations",
  jokeRatio: "jokes",
};

const RATIO = new Set([
  "shortSentences", "hedgesPerSentence", "secondPerson", "firstPersonPlural",
  "subordinateOpeners", "jokeRatio",
]);

function figure(key, value) {
  if (RATIO.has(key)) {
    const n = Number(value);
    return Number.isFinite(n) ? `${Math.round(n * 100)}%` : esc(value);
  }
  return esc(value);
}

function card(v) {
  const measured = Object.entries(v.measured ?? {});
  const strip = measured.length
    ? `<dl class="measured">${measured
        .map(
          ([k, val]) =>
            `<div><dt>${esc(LABELS[k] ?? k)}</dt><dd>${figure(k, val)}</dd></div>`
        )
        .join("")}</dl>`
    : "";

  const rules = v.rules.length
    ? `<div class="fold"><h4>Rules</h4><ul class="rules">${v.rules
        .map((r) => `<li>${inline(r)}</li>`)
        .join("")}</ul></div>`
    : "";

  const never = v.never.length
    ? `<div class="fold"><h4>Never</h4><ul class="never">${v.never
        .map((n) => `<li>${inline(n)}</li>`)
        .join("")}</ul></div>`
    : "";

  const fails = v.tells.length
    ? `<div class="fold"><h4>How pastiche fails</h4><ul class="tells">${v.tells
        .map((t) => `<li>${inline(t)}</li>`)
        .join("")}</ul>${
        v.detection ? `<p class="detect"><span>Detection</span> ${inline(v.detection)}</p>` : ""
      }</div>`
    : "";

  return `
    <article class="voice" id="${esc(v.slug)}">
      <header>
        <h3>${esc(v.name)}</h3>
        <p class="desc">${inline(v.description ?? "")}</p>
        ${v.feeling ? `<p class="feeling"><span>The feeling</span> ${inline(v.feeling)}</p>` : ""}
      </header>
      ${strip}
      ${v.oneRule ? `<p class="onerule">${v.oneRule}</p>` : ""}
      ${
        !v.sources
          ? `<p class="unresearched">Written from instinct. Nobody has counted this one against real
             texts, so its figures are estimates and it names no failure modes. Treat it as a
             sketch.</p>`
          : v.tells.length
            ? ""
            : `<p class="unresearched partial">Measured, but nobody has catalogued how imitation of
               it fails yet. The rules are sourced; the tells are missing.</p>`
      }
      <details>
        <summary>Open the rules</summary>
        <div class="detail">
          ${rules}${never}${fails}
          ${v.sources ? `<p class="sources"><span>Measured from</span> ${inline(v.sources)}</p>` : ""}
          <p class="filelink"><a href="${REPO}/${esc(v.file)}">Read the whole file</a></p>
        </div>
      </details>
    </article>`;
}

/* --- build --------------------------------------------------------------- */

const voices = readdirSync(VOICES)
  .filter((f) => f.endsWith(".md") && f !== "README.md")
  .map((file) => {
    const text = readFileSync(join(VOICES, file), "utf8");
    const fm = frontmatter(text);
    const rulesBody = section(text, "Rules");
    const pastiche = section(text, "How pastiche fails");
    return {
      file,
      slug: basename(file, ".md"),
      name: fm.name ?? basename(file, ".md"),
      group: fm.group ?? "core",
      description: fm.description ?? "",
      sources: fm.sources ?? "",
      measured: fm.measured ?? {},
      feeling: fm.feeling ?? "",
      oneRule: lead(section(text, "The one rule")),
      rules: ruleNames(rulesBody),
      never: bullets(section(text, "Never")),
      tells: tells(pastiche).slice(0, 8),
      detection: detection(pastiche),
    };
  })
  .sort((a, b) => a.name.localeCompare(b.name));

const byGroup = GROUPS.map((g) => ({ ...g, list: voices.filter((v) => v.group === g.key) })).filter(
  (g) => g.list.length
);

const stray = voices.filter((v) => !GROUPS.some((g) => g.key === v.group));
if (stray.length) {
  console.error(`unknown group on: ${stray.map((v) => v.file).join(", ")}`);
  process.exit(1);
}

/* The cross-cutting index. Every named failure mode in the library, in one list, because read
   together they are a catalogue of how generated prose gives itself away. */
const allTells = voices
  .flatMap((v) => v.tells.map((t) => ({ voice: v.name, slug: v.slug, tell: t })))
  .sort((a, b) => a.tell.toLowerCase().localeCompare(b.tell.toLowerCase()));

const nav = byGroup.map((g) => `<a href="#${g.key}">${g.title}</a>`).join("\n      ");

const library = byGroup
  .map(
    (g) => `
  <section id="${g.key}">
    <p class="eyebrow">${esc(g.title)} &middot; ${g.list.length} ${g.list.length === 1 ? "voice" : "voices"}</p>
    <h2 class="measure">${esc(g.blurb)}</h2>
    <div class="voices">${g.list.map(card).join("")}</div>
  </section>`
  )
  .join("\n");

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Stet voices</title>
<meta name="description" content="${voices.length} measured writing registers, each counted off real texts, each carrying the specific ways imitation of it gives itself away.">
<meta property="og:title" content="Stet voices">
<meta property="og:description" content="${voices.length} writing registers, measured off real texts rather than described from memory.">
<meta property="og:type" content="website">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><text y='25' x='2' font-size='22' font-family='monospace' fill='%232c6d9e'>s</text></svg>">
<link rel="stylesheet" href="stet.css">
</head>
<body>

<div class="wrap">
  <header class="top">
    <span class="mark"><a href="./"><b>stet</b></a></span>
    <nav>
      ${nav}
      <a href="#tells">The tells</a>
      <a href="./">Back</a>
    </nav>
  </header>

  <div class="hero hero-voices">
    <h1 class="measure">Writing that does not read as written by a machine.</h1>
    <p class="lede measure">
      That is the whole job. ${voices.length} registers, each one counted off the actual texts rather
      than described from memory, and each carrying the specific ways an imitation of it gives itself
      away.
    </p>

    <div class="finding">
      <p>
        Readers told a headline was AI-generated rated it less accurate and were less willing to
        share it. That held whether or not the headline was true, and whether or not a machine
        actually wrote it.
      </p>
      <p class="cite">Altay and Gilardi, <i>PNAS Nexus</i>, 2024. Preregistered, n=4,976.</p>
    </div>
    <p class="proof-note">
      The penalty attaches to how the writing reads, not to who wrote it. Which means prose that
      merely sounds generated pays it, with no label attached and no way to appeal.
    </p>
  </div>
</div>

<div class="wrap">
${library}

  <section id="tells">
    <p class="eyebrow">Cross-cutting &middot; ${allTells.length} named failures</p>
    <h2 class="measure">Read together, the failure modes are one catalogue.</h2>
    <p class="measure">
      Every voice file ends by naming how imitation of it fails. Collected out of their contexts,
      they stop being notes on ${voices.length} registers and start being a list of the things
      generated prose does. Each links back to the voice that measured it.
    </p>
    <ul class="telldex">
      ${allTells
        .map(
          (t) =>
            `<li><span>${inline(t.tell)}</span> <a href="#${esc(t.slug)}">${esc(t.voice)}</a></li>`
        )
        .join("\n      ")}
    </ul>
  </section>

  <section id="define">
    <p class="eyebrow">Your own</p>
    <h2 class="measure">Four ways to have a voice, and a preset is only the first.</h2>
    <div class="cmds">
      <div class="cmd">
        <h3>pick one</h3>
        <p>Any file above, by name. It arrives whole: rules, counts, and the tells.</p>
      </div>
      <div class="cmd">
        <h3>describe one</h3>
        <p>In your words, fresh or derived from a preset. "A PhD mathematician who has stopped trying to impress anyone." Stet turns the description into countable rules and tells you which it could not measure.</p>
      </div>
      <div class="cmd">
        <h3>point at writing</h3>
        <p>Documents, a Drive folder, a site, anything you already wrote. It gets measured the same way these were, and the numbers come back with it.</p>
      </div>
      <div class="cmd">
        <h3>let it read the project</h3>
        <p>Run it where you work and it derives the house voice from what is already there, because nobody can describe their own.</p>
      </div>
    </div>
  </section>

  <footer class="foot">
    <span>Stet</span>
    <span>An <a href="https://github.com/owllight-studio">Owllight Studio</a> project</span>
    <span class="right"><a href="https://github.com/owllight-studio/stet">Source</a></span>
  </footer>
</div>

</body>
</html>
`;

writeFileSync(join(here, "voices.html"), html);
console.log(
  `voices.html: ${voices.length} voices, ${byGroup.length} groups, ${allTells.length} tells`
);

/* A register with no stated feeling is a register nobody can use. The rules describe how something
   lands, and without saying what is supposed to land they read as a list of prohibitions. */
const feelingless = voices.filter((v) => !v.feeling);
if (feelingless.length) {
  console.error(`no feeling stated: ${feelingless.map((v) => v.slug).join(", ")}`);
  process.exit(1);
}

/* Two different gaps, and conflating them libels a researched file. No `sources` means nobody
   counted it. Sources but no tells means it was counted and never adversarially read. Both are real
   states, both are said on the page, and both should be visible from the terminal. */
const instinct = voices.filter((v) => !v.sources);
const untold = voices.filter((v) => v.sources && !v.tells.length);
if (instinct.length) console.log(`  from instinct: ${instinct.map((v) => v.slug).join(", ")}`);
if (untold.length) console.log(`  no tells yet:  ${untold.map((v) => v.slug).join(", ")}`);
