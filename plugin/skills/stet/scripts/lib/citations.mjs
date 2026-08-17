/**
 * What a reference is, and how to look at one.
 *
 * Shared by `cite` and `standing` so that the two cannot disagree about what counts as a citation.
 * Two extractors would drift, and the first symptom would be a DOI one command sees and the other
 * does not, which is the worst kind of bug in a tool whose claim is that it checks everything.
 */

import { createHash } from "node:crypto";
import { prose } from "./prose.mjs";

const MAILTO = process.env.STET_CROSSREF_MAILTO ?? "";
export const UA = `stet/0.1 (https://github.com/owllight-studio/stet${MAILTO ? `; mailto:${MAILTO}` : ""})`;

/**
 * Blank what is not prose, keeping every line where it was.
 *
 * Deliberately not `prose()` from lib/prose.mjs. That function strips markdown link targets, which
 * is right for measuring a voice and destroys exactly what this file is looking for. Line counts
 * are preserved because a finding without a line number is a finding somebody has to go and look
 * for.
 */
export function withoutCode(text, markup) {
  if (markup === "html") {
    return text
      .replace(/<(script|style|pre|code|textarea)[\s\S]*?<\/\1>/gi, (m) => m.replace(/[^\n]/g, " "))
      .replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, " "))
      /* xmlns declares a namespace, not a citation. Stet's own site carries one in the favicon's
         inline SVG (xmlns="http://www.w3.org/2000/svg"), and left alone it would be reported as a
         broken link forever, because nobody is ever going to fix the W3C's namespace URI. */
      .replace(/\bxmlns(:[\w-]+)?=("[^"]*"|'[^']*')/gi, (m) => m.replace(/[^\n]/g, " "));
  }

  let fenced = false;
  let front = /^---\r?\n/.test(text);
  return text
    .split("\n")
    .map((line, i) => {
      if (front) {
        if (i > 0 && /^---\s*$/.test(line)) front = false;
        return "";
      }
      /* The fence, written as an escape so that a document quoting this code does not have
         its own fences thrown out of step by it. */
      if (/^\s*\u0060{3}/.test(line)) {
        fenced = !fenced;
        return "";
      }
      if (fenced) return "";
      if (/^\s{4,}\S/.test(line)) return "";
      /* A backtick around a URL usually means "read this as a command", the way `curl <url>` does,
         which is why backticked URLs are blanked below. A DOI carries no such second reading: it is
         already nothing but an identifier, and this repository's own design doc backtick-styles its
         DOIs as plain typography, `10.1371/journal.pone.0167475`, over real citations that would
         otherwise vanish from the one document explaining why they must not.

         Drawn narrow on purpose: this only asks whether the span starts with a DOI's shape, not
         whether the whole span is one. A backtick span that opens with something DOI-shaped and
         then runs on into prose, or into another identifier that happens to start the same way,
         is read as a citation regardless of what follows. */
      return line.replace(/`([^`]*)`/g, (m, inner) => (/^10\.\d{4,9}\//.test(inner) ? m : " ".repeat(m.length)));
    })
    .join("\n");
}

/* Straight quotes, folded whitespace, no leading or trailing punctuation. A page that swapped a
   straight quote for a curly one has not changed what it says. */
export const normaliseQuoted = (s) =>
  String(s)
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, " ")
    .trim();

/** DOIs, and only DOIs. The reasoning is in cite.md and it has not changed. */
const DOI = /\b(10\.\d{4,9}\/[-._;()/:A-Z0-9]*[A-Z0-9])\b/gi;

const URL_RE = /https?:\/\/[^\s<>()"'`\][]+/g;

/**
 * A quoted run long enough to mean something.
 *
 * 20 characters, because below that a quotation is a word or a phrase that appears on any page
 * about the subject, and an anchor that matches anything is an anchor that proves nothing. Single
 * quotes are not delimiters here: an apostrophe in ordinary prose would open one on every line.
 */
const QUOTED = /[“"]([^”"]{20,300})[”"]/g;

const lineOf = (text, index) => text.slice(0, index).split("\n").length;

export function references(text, markup) {
  const clean = withoutCode(text, markup);

  const dois = new Map();
  for (const m of clean.matchAll(DOI)) {
    const doi = m[1].replace(/[.,;)\]]+$/, "").toLowerCase();
    if (!dois.has(doi)) dois.set(doi, { doi, line: lineOf(clean, m.index) });
  }

  /* Paragraphs, so an anchor attaches to the link it is arguing alongside rather than to every link
     in the file. Offsets are read off the separators themselves rather than assumed to be two
     characters wide: `\s` inside the separator also matches a stray space or tab left on a blank
     line, which plenty of editors and corpora do leave, and a guessed width is short from that
     paragraph onwards for every line number after it. */
  const paragraphs = [];
  let at = 0;
  for (const m of clean.matchAll(/\n\s*\n/g)) {
    paragraphs.push({ text: clean.slice(at, m.index), at });
    at = m.index + m[0].length;
  }
  paragraphs.push({ text: clean.slice(at), at });

  const urls = new Map();
  for (const para of paragraphs) {
    /* In HTML, quotes also delimit attribute values: class="mark", content="...". Left in, those
       pair up with each other across tag boundaries and hand back attribute soup as an "anchor".
       Tags are stripped before hunting for quotes, here only, because the URL search below still
       needs them intact to know what an href points at. */
    const prose = markup === "html" ? para.text.replace(/<[^>]*>/g, " ") : para.text;
    const anchors = [...prose.matchAll(QUOTED)].map((q) => normaliseQuoted(q[1]));
    for (const m of para.text.matchAll(URL_RE)) {
      const url = m[0].replace(/[.,;:)\]]+$/, "");

      /* A DOI wearing a URL. Checked as a DOI, because Crossref answers a question a fetch cannot:
         whether the paper still stands. Recording it twice would report one problem as two. */
      const asDoi = url.match(/doi\.org\/(10\.\d{4,9}\/\S+)/i);
      if (asDoi) {
        const doi = asDoi[1].replace(/[.,;)\]]+$/, "").toLowerCase();
        if (!dois.has(doi)) dois.set(doi, { doi, line: lineOf(clean, para.at + m.index) });
        continue;
      }

      if (!urls.has(url)) urls.set(url, { url, line: lineOf(clean, para.at + m.index), anchors });
    }
  }

  return { urls: [...urls.values()], dois: [...dois.values()] };
}

export const titleOf = (html) =>
  (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();

/** Short on purpose. This is a fingerprint for "did it change", never a checksum for integrity. */
export const digestOf = (text) =>
  createHash("sha256").update(String(text).replace(/\s+/g, " ").trim()).digest("hex").slice(0, 16);

/**
 * What a status code means about the source.
 *
 * A 5xx is not a source that moved, it is a server having a bad day, and calling it dead would put
 * a transient outage in the loud tier and teach somebody to stop reading the loud tier. It goes to
 * the unknown tier instead, which cite.md's rule requires: never treat "could not check" as "fine".
 */
export const classify = (status) => {
  if (status >= 200 && status < 400) return "live";
  if (status >= 400 && status < 500) return "dead";
  return "unreachable";
};

export const anchorsPresent = (text, anchors = []) => {
  const hay = normaliseQuoted(text).toLowerCase();
  return anchors.map((a) => ({ text: a, present: hay.includes(normaliseQuoted(a).toLowerCase()) }));
};

export async function observe(url, { anchors = [], timeout = 20000 } = {}) {
  try {
    const res = await fetch(url, {
      redirect: "follow",
      headers: { "user-agent": UA, accept: "text/html,*/*" },
      signal: AbortSignal.timeout(timeout),
    });
    const state = classify(res.status);
    if (state !== "live") {
      return state === "dead"
        ? { state, status: res.status }
        : { state, detail: `returned ${res.status}` };
    }
    const html = await res.text();
    const text = prose(html, "html").replace(/\s+/g, " ").trim();
    return {
      state: "live",
      status: res.status,
      host: new URL(res.url).host,
      title: titleOf(html),
      digest: digestOf(text),
      anchors: anchorsPresent(text, anchors),
    };
  } catch (err) {
    return { state: "unreachable", detail: String(err.message ?? err).slice(0, 80) };
  }
}

/**
 * Crossref, once per DOI. Moved here from cite.mjs unchanged, so that both commands ask the same
 * question and get the same answer.
 *
 * Retraction data has been free and inline in Crossref since it acquired the Retraction Watch
 * database in 2023. Across 13,252 post-retraction citation contexts, 722 acknowledged the
 * retraction, which is 5.4 percent (Hsiao and Schneider, Quantitative Science Studies 2(4):
 * 1144-1169, 2021, 10.1162/qss_a_00155).
 */
export async function ask(doi) {
  const url = `https://api.crossref.org/works/${encodeURIComponent(doi)}${MAILTO ? `?mailto=${MAILTO}` : ""}`;
  try {
    const res = await fetch(url, { headers: { "user-agent": UA }, signal: AbortSignal.timeout(20000) });
    if (res.status === 404) return { doi, state: "not found" };
    if (!res.ok) return { doi, state: "unreachable", detail: `Crossref returned ${res.status}` };
    const { message } = await res.json();

    const updates = message["update-to"] ?? [];
    const updatedBy = message["updated-by"] ?? [];
    const retraction = updatedBy.find((u) => /retract/i.test(u.type ?? ""));
    const concern = updatedBy.find((u) => /concern|withdraw/i.test(u.type ?? ""));
    const published = (message.relation?.["is-preprint-of"] ?? [])[0];

    return {
      doi,
      state: retraction ? "retracted" : concern ? "flagged" : published ? "superseded" : "current",
      title: ((message.title ?? [])[0] ?? "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim(),
      year: message.issued?.["date-parts"]?.[0]?.[0],
      container: (message["container-title"] ?? [])[0],
      type: message.type,
      retraction: retraction?.DOI,
      concern: concern?.type,
      published: published?.id,
      updates: updates.length,
    };
  } catch (err) {
    return { doi, state: "unreachable", detail: String(err.message ?? err).slice(0, 80) };
  }
}
