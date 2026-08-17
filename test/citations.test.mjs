import { test } from "node:test";
import assert from "node:assert/strict";
import { references, normaliseQuoted } from "../plugin/skills/stet/scripts/lib/citations.mjs";
import { titleOf, digestOf, classify, anchorsPresent } from "../plugin/skills/stet/scripts/lib/citations.mjs";

test("a bare URL is found, with the line it is on", () => {
  const { urls } = references("one\ntwo https://example.com/a there\n", "md");
  assert.equal(urls.length, 1);
  assert.equal(urls[0].url, "https://example.com/a");
  assert.equal(urls[0].line, 2);
});

test("a URL inside a fenced code block is an identifier, not a citation", () => {
  const fence = "`".repeat(3);
  const { urls } = references(`${fence}\ncurl https://example.com/a\n${fence}\n`, "md");
  assert.equal(urls.length, 0);
});

test("a URL inside backticks is an identifier too", () => {
  const { urls } = references("see `https://example.com/a` for the shape\n", "md");
  assert.equal(urls.length, 0);
});

test("a markdown link target is a citation and survives blanking", () => {
  const { urls } = references("as [the study](https://example.com/a) found\n", "md");
  assert.equal(urls.length, 1);
  assert.equal(urls[0].url, "https://example.com/a");
});

test("trailing sentence punctuation is not part of the URL", () => {
  const { urls } = references("at https://example.com/a.\n", "md");
  assert.equal(urls[0].url, "https://example.com/a");
});

test("a doi.org link is a DOI, not a URL, so it cannot be checked twice", () => {
  const { urls, dois } = references("see https://doi.org/10.1162/qss_a_00155 for it\n", "md");
  assert.equal(urls.length, 0);
  assert.equal(dois.length, 1);
  assert.equal(dois[0].doi, "10.1162/qss_a_00155");
});

test("a bare DOI in running prose is found", () => {
  const { dois } = references("Jones et al., 10.1371/journal.pone.0167475, 2016\n", "md");
  assert.equal(dois[0].doi, "10.1371/journal.pone.0167475");
});

test("a quoted run in the same paragraph becomes an anchor", () => {
  const text = 'The paper says "more than 70% of the URLs" are rotten, see https://example.com/a\n';
  const { urls } = references(text, "md");
  assert.deepEqual(urls[0].anchors, ["more than 70% of the URLs"]);
});

test("a short quoted run is not an anchor, because it will match anything", () => {
  const text = 'It says "yes" at https://example.com/a\n';
  const { urls } = references(text, "md");
  assert.deepEqual(urls[0].anchors, []);
});

test("a quote from another paragraph does not attach to this link", () => {
  const text = 'The other page says "a quoted sentence of sufficient length".\n\nSee https://example.com/a\n';
  const { urls } = references(text, "md");
  assert.deepEqual(urls[0].anchors, []);
});

test("HTML is read as HTML, and its script tags are not prose", () => {
  const { urls } = references('<script>var u = "https://example.com/a";</script><p>See <a href="https://example.com/b">it</a></p>', "html");
  assert.deepEqual(urls.map((u) => u.url), ["https://example.com/b"]);
});

test("normaliseQuoted straightens curly quotes and folds whitespace", () => {
  assert.equal(normaliseQuoted("  the “best”   answer’s  "), 'the "best" answer\'s');
});

// The next three cases came from running references() over this repository's own content
// (docs/source-integrity.md and site/index.html), not from imagining edge cases in advance.

test("a DOI in backticks is still a citation, because unlike a URL it has no reading as a command", () => {
  const { dois } = references("as `10.1371/journal.pone.0167475` shows\n", "md");
  assert.equal(dois.length, 1);
  assert.equal(dois[0].doi, "10.1371/journal.pone.0167475");
});

test("an xmlns namespace URI is not a citation", () => {
  const text = '<svg xmlns="http://www.w3.org/2000/svg"></svg><p>See <a href="https://example.com/a">it</a></p>';
  const { urls } = references(text, "html");
  assert.deepEqual(urls.map((u) => u.url), ["https://example.com/a"]);
});

test("a quoted HTML attribute value is not an anchor", () => {
  const text = '<p class="long enough to pass the anchor length test">See <a href="https://example.com/a">it</a></p>';
  const { urls } = references(text, "html");
  assert.deepEqual(urls[0].anchors, []);
});

test("a blank line carrying a stray space does not throw off the line number after it", () => {
  const text = "Para one text end.\n \nhttps://example.com/b starts here.\n";
  const { urls } = references(text, "md");
  assert.equal(urls[0].line, 3);
});

test("the title comes out of the head, whitespace folded", () => {
  assert.equal(titleOf("<html><head><title>  A\n  page </title></head>"), "A page");
});

test("a page with no title reports none rather than guessing", () => {
  assert.equal(titleOf("<html><body>hello</body></html>"), "");
});

test("the digest ignores whitespace, because reflowing is not drift", () => {
  assert.equal(digestOf("one two   three"), digestOf("one\ntwo three\n"));
});

test("the digest changes when a word does", () => {
  assert.notEqual(digestOf("one two three"), digestOf("one two four"));
});

test("a 404 is dead and a 503 is a server having a bad day", () => {
  assert.equal(classify(200), "live");
  assert.equal(classify(404), "dead");
  assert.equal(classify(410), "dead");
  assert.equal(classify(503), "unreachable");
});

test("an anchor matches through curly quotes and reflowed whitespace", () => {
  const page = "the paper found that “more than 70% of\nthe URLs” had rotted";
  const [a] = anchorsPresent(page, ['more than 70% of the URLs']);
  assert.equal(a.present, true);
});

test("an anchor that is genuinely gone reports gone", () => {
  const [a] = anchorsPresent("this page is for sale", ["more than 70% of the URLs"]);
  assert.equal(a.present, false);
});
