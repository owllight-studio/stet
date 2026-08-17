/**
 * What a reference is, and how to look at one.
 *
 * Shared by `cite` and `standing` so that the two cannot disagree about what counts as a citation.
 * Two extractors would drift, and the first symptom would be a DOI one command sees and the other
 * does not, which is the worst kind of bug in a tool whose claim is that it checks everything.
 */

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
         otherwise vanish from the one document explaining why they must not. */
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
     in the file. Offsets are kept so the line number stays true. */
  const paragraphs = [];
  let at = 0;
  for (const block of clean.split(/\n\s*\n/)) {
    paragraphs.push({ text: block, at });
    at += block.length + 2;
  }

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
