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

/* `route` is which of the site's seven line colours a group is drawn in. The site is a transit
   diagram and colour on it only ever means a route, so a group without one would be decoration. */
/* Grouped by the job a reader arrives holding, not by where the register was found. The blurbs
   used to describe the voices ("Fiction registers", "For when the constraint is the point"), which
   tells somebody browsing nothing about which one is theirs. */
const GROUPS = [
  { key: "core", route: "r-establish", title: "Core", blurb: "Documentation, a README, release notes, a post, an explanation somebody has to follow. Start here." },
  { key: "marketing", route: "r-compose", title: "Marketing", blurb: "A landing page, an email, anything asking a reader to do something." },
  { key: "genre", route: "r-refine", title: "Genre", blurb: "A novel, a script, a game. Anything with a world in it." },
  { key: "fun", route: "r-maintain", title: "Fun", blurb: "A live commentary, a wildlife film. Registers a reader recognises on sight, for when that is the point." },
];

/* The masthead and the footer are the same on every page of this site. They live here as strings
   because voices.html is generated and index.html is not, and the two must not drift apart. */
const MARK = `<svg viewBox="0 0 133 98" role="img" aria-hidden="true" focusable="false"><g fill="currentColor"><text x="0" y="70" textLength="133" lengthAdjust="spacing" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="80" font-weight="700" letter-spacing="-3">stet</text><rect x="0" y="84" width="133" height="7" rx="3.5"/><circle cx="10" cy="87.5" r="10"/><circle cx="47.67" cy="87.5" r="10"/><circle cx="85.33" cy="87.5" r="10"/><circle cx="123" cy="87.5" r="10"/></g></svg>`;

const MASTHEAD = `<header class="masthead">
  <div class="inner">
    <a class="wordmark" href="/" aria-label="Stet, home">${MARK}</a>
    <nav class="routes" aria-label="Sections">
      <a class="r-authorship" href="/ownership.html">Ownership</a>
      <a class="r-operate" href="/map.html">The map</a>
      <a class="r-evaluate" href="/checks.html">Checks</a>
      <a class="r-establish" href="/voices.html" aria-current="page">Voices</a>
      <a href="https://github.com/owllight-studio/stet">GitHub</a>
    </nav>
    <div class="modes" role="group" aria-label="Colour scheme">
      <button type="button" data-mode="light" aria-pressed="false">Light</button>
      <button type="button" data-mode="dark" aria-pressed="false">Dark</button>
      <button type="button" data-mode="auto" aria-pressed="true">Auto</button>
    </div>
  </div>
</header>`;

const FOOTER = `<footer>
  <div class="inner">
    <div class="col">
      <h4>Lines</h4>
      <a href="/ownership.html">Ownership</a>
      <a href="/map.html">The map</a>
      <a href="/checks.html">Checks</a>
      <a href="/voices.html">Voices</a>
    </div>
    <div class="col">
      <h4>Source</h4>
      <a href="https://github.com/owllight-studio/stet">GitHub</a>
      <a href="https://github.com/owllight-studio/stet/blob/main/README.md">README</a>
      <a href="https://github.com/owllight-studio/stet/blob/main/LICENSE">MIT licence</a>
    </div>
    <p class="last"><i>stet</i>, the proofreader's mark meaning let it stand. Ignore the
      correction; the original is right.</p>
  </div>
</footer>`;

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
    const top = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(.*)$/);
    if (top) {
      nest = top[2] === "" ? (out[top[1]] = {}) : null;
      if (top[2] !== "") out[top[1]] = top[2].replace(/^["']|["']$/g, "");
      continue;
    }
    // A key may carry a digit: sentenceP95, modalsPer10kWords, fieldsPer100Words. Excluding them
    // silently dropped 18 real measurements, and the page then reported 114 as the library's count
    // when it holds 132. Nobody noticed, because a hand check written the same way agreed with it.
    const pair = line.match(/^\s+([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(.*)$/);
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

/* Voice files carry more measured keys than LABELS names, and new ones arrive whenever a
   researcher counts something nobody had counted before. An unlabelled key used to render as
   its own identifier set in caps, so `unterminatedShare` reached the page as UNTERMINATEDSHARE.
   Split the camel case instead: the label is always readable, and a new key needs no edit here. */
function label(key) {
  if (LABELS[key]) return LABELS[key];
  return key.replace(/([a-z0-9])([A-Z])/g, "$1 $2").toLowerCase();
}

function figure(key, value) {
  if (RATIO.has(key)) {
    const n = Number(value);
    return Number.isFinite(n) ? `${Math.round(n * 100)}%` : esc(value);
  }
  return esc(value);
}

function card(v) {
  const measured = Object.entries(v.measured ?? {});
  /* The figures go in the right-hand column of the card, so the reading and the counts it
     came from sit side by side and neither column ends in empty page. */
  const strip = measured.length
    ? `<div class="figures"><dl class="measured">${measured
        .map(
          ([k, val]) =>
            `<div><dt>${esc(label(k))}</dt><dd>${figure(k, val)}</dd></div>`
        )
        .join("")}</dl></div>`
    : `<div class="figures"></div>`;

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
          ? `<p class="unresearched">Written from instinct. Nobody counted this one against real
             texts, so the figures are estimates and it names no failure modes. A sketch.</p>`
          : v.tells.length
            ? ""
            : `<p class="unresearched partial">Counted, but nobody has catalogued how imitation of
               it fails. The rules are sourced. The tells are missing.</p>`
      }
      <p class="useit"><code>/stet voice ${esc(v.slug)}</code></p>
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

const library = byGroup
  .map(
    (g) => `
  <section class="voice-group ${g.route}" id="${esc(g.key)}">
    <span class="sign">${esc(g.title)} &middot; ${g.list.length} ${g.list.length === 1 ? "voice" : "voices"}</span>
    <h2>${esc(g.blurb)}</h2>
    <div class="voices">${g.list.map(card).join("")}</div>
  </section>`
  )
  .join("\n");

const html = `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Voices &middot; Stet</title>
<meta name="description" content="${voices.length} measured writing registers, each counted off real texts, each carrying the specific ways imitation of it gives itself away.">
<link rel="icon" href="/icon.svg" type="image/svg+xml">
<link rel="canonical" href="https://stet.style/voices.html">
<meta property="og:title" content="Voices &middot; Stet">
<meta property="og:description" content="${voices.length} writing registers, measured off real texts rather than described from memory.">
<meta property="og:url" content="https://stet.style/voices.html">
<meta property="og:type" content="website">
<link rel="stylesheet" href="/stet.css">
<script>(function(){try{var t=localStorage.getItem("stet-theme");if(t==="dark"||t==="light")document.documentElement.setAttribute("data-theme",t);}catch(e){}})();</script>
</head>
<body>

<a class="skip" href="#main">Skip to content</a>

${MASTHEAD}

<main id="main">

  <section class="hero r-establish">
    <span class="sign" style="display:block;margin-bottom:14px">Line E &middot; Establish</span>
    <h1>Writing that does not sound like a machine.</h1>
    <div class="pair">
      <div>
        <p class="lede">That is the whole job. ${voices.length} voices, each built by reading the
          real thing rather than describing it from memory. Name one and start writing:
          <code>/stet voice noir</code> is the whole of it.</p>
        <p class="lede">Each one also names how a fake of it gives itself away.</p>
      </div>
      <div>
        <div class="finding r-establish">
          <p>Readers told a headline was AI-generated rated it less accurate and were less willing
            to share it. That held whether or not the headline was true, and whether or not a
            machine wrote it.</p>
          <p class="cite">Altay and Gilardi, <i>PNAS Nexus</i>, 2024. Preregistered, n=4,976.</p>
        </div>
        <p style="margin-top:14px">That study labelled the headlines. It did not test prose that
          merely reads as generated, so whether that pays the same penalty with no label on it is an
          inference rather than a finding. It is the inference this library is built on, and it is
          the one worth knowing you are trusting.</p>
      </div>
    </div>
  </section>
${library}

  <section class="voice-group r-authorship" id="tells">
    <span class="sign">Cross-cutting &middot; ${allTells.length} named failures</span>
    <h2>Put them together and you have the catalogue.</h2>
    <p>Each one links back to the voice it was counted off.</p>
    <ul class="telldex">
      ${allTells
        .map(
          (t) =>
            `<li><span>${inline(t.tell)}</span> <a href="#${esc(t.slug)}">${esc(t.voice)}</a></li>`
        )
        .join("\n      ")}
    </ul>
  </section>

  <section class="voice-group r-operate" id="define">
    <span class="sign">Four ways in</span>
    <h2>Take one as it is, or build your own.</h2>
    <div class="pair">
      <div>
        <p>These are finished. Name one and start writing. Nothing else is asked of you.</p>
        <p>They are also a good place to start if you would rather change something real than begin
          at nothing. Either way the voice ends up in your own <code>VOICE.md</code>. A voice built
          to your brief is yours, and it never goes in the library.</p>
      </div>
      <div>
        <div class="strip">
          <span class="cap">Use one</span>
          <code>/stet voice the-manual</code>
        </div>
        <div class="strip" style="margin-top:12px">
          <span class="cap">Build one</span>
          <code>/stet voice "a mathematician who stopped trying to impress anyone"</code>
        </div>
      </div>
    </div>

    <div class="cmds" style="margin-top:26px">
      <div class="cmd">
        <h3>Take one</h3>
        <p>Any voice above, by name. It arrives whole: the rules, the numbers and the tells.</p>
      </div>
      <div class="cmd">
        <h3>Describe one</h3>
        <p>In your own words. The agents go and read the real thing, then say which rules they
          could measure and which they could not.</p>
      </div>
      <div class="cmd">
        <h3>Point at your writing</h3>
        <p>A folder, a site, anything you already wrote. It gets read the way these were, and the
          numbers come back with it.</p>
      </div>
      <div class="cmd">
        <h3>Let it read the project</h3>
        <p>It works the house voice out from what is already there. Nobody can describe their
          own.</p>
      </div>
    </div>
  </section>

</main>

${FOOTER}

<script src="/mode.js" defer></script>
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
