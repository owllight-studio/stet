/**
 * The style guides a project can name as its authority, and where they actually disagree.
 *
 * A style sheet is not written from nothing. Every real one names an authority first and then
 * records only the **departures** from it, which is why a professional sheet is two pages rather
 * than four hundred: "Chicago 18th, except..." answers the serial comma, the numeral threshold and
 * the quotation-mark placement in one line, and the sheet only has to carry what is unusual about
 * this project.
 *
 * Naming the edition is not pedantry. "Chicago" means at least four different books, and two of
 * them disagree with each other. The single most common way a style sheet goes stale is that it
 * names a guide and not a year.
 *
 * Verified against publishers' own pages on 2026-08-16. Re-verify before trusting: AP shipped a new
 * edition three months before that date, and it moved.
 *
 * **A position nobody could verify is `null`.** Not a guess, not a plausible default. Several of
 * these guides are paywalled, so their rulings genuinely cannot be read, and a table that looks
 * complete because the gaps were filled in with what everybody knows is worse than a gapped one.
 * `null` here means "not established from a primary source", never "the guide is silent".
 */

/** The decisions a style sheet has to record, in the order a sheet usually works through them. */
export const DECISIONS = {
  serialComma: "Serial comma",
  numbers: "Numbers spelled out below",
  percent: "Percent",
  dates: "Dates",
  quotePunctuation: "Punctuation at a closing quote",
  dashes: "Dashes",
  headings: "Headings",
  internet: "internet and web",
  abbreviations: "Full stops in abbreviations",
  singularThey: "Singular they",
};

const s = (position, source, cite) => ({ position, source, cite });

export const AUTHORITIES = {
  chicago: {
    name: "The Chicago Manual of Style",
    edition: "18th",
    year: 2024,
    publisher: "University of Chicago Press",
    domain: "US book publishing, general nonfiction, scholarly work",
    free: false,
    /* Quotable means: may this tool reproduce the guide's own prose to a user. Citing a section
       number is always fine. Reproducing the text of a paywalled rule is not. */
    quotable: false,
    url: "https://www.chicagomanualofstyle.org/home.html",
    note: "The Q&A, the Citation Quick Guide and the Shop Talk blog are free; the manual body is not.",
    says: {
      serialComma: s("always", "https://cmosshoptalk.com/2020/02/11/oxford-chicago-and-the-serial-comma/", "CMOS 6.19"),
      numbers: s("one hundred", "https://www.chicagomanualofstyle.org/qanda/data/faq/topics/Numbers.html", "CMOS 9.2, and an alternative rule at 9.3 stops at nine"),
      percent: null,
      dates: null,
      quotePunctuation: s("inside", "https://cmosshoptalk.com/2020/10/20/commas-and-periods-with-quotation-marks/", "CMOS 6.9, 6.10"),
      dashes: s("em, unspaced", "https://cmosshoptalk.com/2024/01/23/hyphens-and-dashes-a-refresher/", "CMOS 6.79"),
      headings: s("title case", "https://www.chicagomanualofstyle.org/qanda/data/faq/topics/CapitalizationTitles.html", "CMOS 8.160 permits sentence case if applied consistently"),
      internet: null,
      abbreviations: null,
      singularThey: s("specific yes, generic not in formal writing", "https://www.chicagomanualofstyle.org/qanda/data/faq/topics/Pronouns/faq0031.html", "CMOS 5.48, 5.255"),
    },
  },

  ap: {
    name: "AP Stylebook",
    edition: "58th",
    year: 2026,
    publisher: "The Associated Press",
    domain: "Journalism, public relations, corporate communications",
    free: false,
    quotable: false,
    url: "https://www.apstylebook.com/",
    note: "Released 27 May 2026, now biennial. Ask the Editor and the AP Style Blog are free and quote whole entries, but they are a rotating sampler: cite the rule, not the page.",
    says: {
      serialComma: s("ambiguity only", "https://www.apstylebook.com/blog_posts/24", "AP states it does not ban the serial comma and requires it where meaning would be unclear"),
      numbers: s("ten", "https://www.apstylebook.com/ask_the_editors/style_guidance", "figures for 10 and above"),
      percent: s("%", "https://bsky.app/profile/apstylebook.com", "changed in 2019 from the spelled-out word"),
      dates: s("month day, year", "https://www.apstylebook.com/ask_the_editors/style_guidance", "only Jan., Feb., Aug., Sept., Oct., Nov., Dec. abbreviate, and only with a specific date"),
      quotePunctuation: s("inside", "https://bsky.app/profile/apstylebook.com", null),
      dashes: s("em, spaced", "https://www.apstylebook.com/blog_posts/24", "AP uses no en dashes at all"),
      headings: null,
      internet: s("lowercase", "https://www.apstylebook.com/blog_posts/5", "changed in 2016"),
      abbreviations: s("U.S. in body, US in headlines", "https://bsky.app/profile/apstylebook.com", "periods in most two-letter abbreviations, none in longer acronyms"),
      singularThey: s("limited, rewording preferred", "https://www.apstylebook.com/blog_posts/7", null),
    },
  },

  guardian: {
    name: "Guardian and Observer style guide",
    edition: "web, continuously updated",
    year: null,
    publisher: "Guardian News & Media",
    domain: "UK journalism and UK web copy",
    free: true,
    quotable: true,
    url: "https://www.theguardian.com/guardian-style-guide-a",
    note: "The best British default: free, current, and rules the same way as New Hart's on most British-specific decisions without being paywalled or eleven years old.",
    says: {
      serialComma: s("ambiguity only", "https://www.theguardian.com/guardian-observer-style-guide-o", null),
      numbers: s("ten", "https://www.theguardian.com/guardian-observer-style-guide-n", "one to nine spelled out"),
      percent: s("%", "https://www.theguardian.com/guardian-observer-style-guide-p", "in headlines and copy"),
      dates: s("21 July 2016", "https://www.theguardian.com/guardian-observer-style-guide-d", "no commas"),
      quotePunctuation: s("logical", "https://www.theguardian.com/guardian-observer-style-guide-q", "double outer, single inner; single in headlines"),
      dashes: s("en, spaced", "https://www.theguardian.com/guardian-observer-style-guide-d", "em dashes forbidden"),
      headings: null,
      internet: s("lowercase", "https://www.theguardian.com/guardian-observer-style-guide-i", null),
      abbreviations: s("none anywhere", "https://www.theguardian.com/guardian-observer-style-guide-a", "including personal initials; acronyms take an initial cap only, so Nasa and Nato"),
      singularThey: s("accepted", "https://www.theguardian.com/guardian-observer-style-guide-p", null),
    },
  },

  bbc: {
    name: "BBC News style guide",
    edition: "web",
    year: null,
    publisher: "BBC",
    domain: "UK broadcast and online news",
    free: true,
    quotable: true,
    url: "https://www.bbc.co.uk/newsstyleguide",
    note: "Public, contrary to the common belief that it went internal, and rebuilt 11 August 2026. The whole guide is one HTML page at /newsstyleguide/all.",
    says: {
      serialComma: null,
      numbers: s("ten", "https://www.bbc.co.uk/newsstyleguide/numbers", "one to nine spelled out"),
      percent: s("%, per cent at a sentence start", "https://www.bbc.co.uk/newsstyleguide/all", null),
      dates: s("12 April 2001", "https://www.bbc.co.uk/newsstyleguide/numbers", "no ordinal suffixes; 12/04/2012 banned because it reads as 4 December in the US"),
      quotePunctuation: s("logical", "https://www.bbc.co.uk/newsstyleguide/grammar-spelling-punctuation", "single in headlines, double in body, the inverse of the Guardian"),
      dashes: null,
      headings: null,
      internet: s("website lowercase, one word", "https://www.bbc.co.uk/newsstyleguide/all", "no internet entry at all"),
      abbreviations: s("none", "https://www.bbc.co.uk/newsstyleguide/grammar-spelling-punctuation", "honorifics abolished at all mentions, January 2026"),
      singularThey: s("accepted", "https://www.bbc.co.uk/newsstyleguide/all", "with a preference for explaining it in line"),
    },
  },

  oxford: {
    name: "University of Oxford Style Guide",
    edition: "2026",
    year: 2026,
    publisher: "University of Oxford",
    domain: "UK institutional and web writing",
    free: true,
    quotable: true,
    url: "https://www.ox.ac.uk/about/the-university/brand/style-guide",
    note: "Not New Hart's Rules. This is the university's own guide, and it rules the OPPOSITE way on the serial comma and on numbers. Anyone who picks 'Oxford' has to be told which one they mean.",
    says: {
      serialComma: s("ambiguity only", "https://www.ox.ac.uk/about/the-university/brand/style-guide/punctuation", "explicitly marked as a DON'T"),
      numbers: s("none, numerals throughout", "https://www.ox.ac.uk/about/the-university/brand/style-guide", "numerals including for numbers below 10"),
      percent: s("%", "https://www.ox.ac.uk/about/the-university/brand/style-guide", "'20 per cent' marked DON'T"),
      dates: s("13 April", "https://www.ox.ac.uk/about/the-university/brand/style-guide", "'April 13' marked DON'T, and no 'th'"),
      quotePunctuation: s("logical", "https://www.ox.ac.uk/about/the-university/brand/style-guide/punctuation", "single outer, double inner"),
      dashes: s("en, spaced", "https://www.ox.ac.uk/about/the-university/brand/style-guide/punctuation", "em dash explicitly banned"),
      headings: s("sentence case", "https://www.ox.ac.uk/about/the-university/brand/style-guide", "title case for books, films and songs"),
      internet: s("lowercase", "https://www.ox.ac.uk/about/the-university/brand/style-guide/words", "website and webpage, no hyphen"),
      abbreviations: s("none", "https://www.ox.ac.uk/about/the-university/brand/style-guide/abbreviations", "all acronyms upper case, unlike the Guardian and BBC"),
      singularThey: s("accepted", "https://www.ox.ac.uk/about/the-university/brand/style-guide/words", "no explanation required"),
    },
  },

  harts: {
    name: "New Hart's Rules: The Oxford Style Guide",
    edition: "2nd",
    year: 2014,
    publisher: "Oxford University Press",
    domain: "UK book publishing",
    free: false,
    quotable: false,
    url: "https://global.oup.com/academic/product/new-harts-rules-9780199570027",
    note: "OUP house style, and the clear UK counterpart to Chicago. Print only, eleven years old, and almost none of it is verifiable from a primary source, which is why nearly every position here is null.",
    says: {
      serialComma: s("always", "https://www.oxfordreference.com/search?q=serial+comma", "confirmed from a different OUP reference work, not from Hart's itself"),
      numbers: null, percent: null, dates: null, quotePunctuation: null, dashes: null,
      headings: null, internet: null, abbreviations: null, singularThey: null,
    },
  },

  microsoft: {
    name: "Microsoft Writing Style Guide",
    edition: "continuous",
    year: null,
    publisher: "Microsoft",
    domain: "Software UI, product and technical content",
    free: true,
    quotable: true,
    url: "https://learn.microsoft.com/en-us/style-guide/welcome/",
    note: "The GitHub source is archived and last pushed 2024-11-13 while the live site moved in 2026, so treat the repo as a stale snapshot. Its own pages contradict each other on percent.",
    says: {
      serialComma: s("always", "https://learn.microsoft.com/en-us/style-guide/punctuation/commas", null),
      numbers: s("ten", "https://learn.microsoft.com/en-us/style-guide/numbers", "zero through nine spelled out"),
      percent: s("%", "https://learn.microsoft.com/en-us/style-guide/a-z-word-list-term-collections/p/percent-percentage", "the word list says the sign, the numbers page still says the word"),
      dates: s("July 31, 2016", "https://learn.microsoft.com/en-us/style-guide/a-z-word-list-term-collections/term-collections/date-time-terms", "day-month-year explicitly forbidden, no ordinals"),
      quotePunctuation: s("inside", "https://learn.microsoft.com/en-us/style-guide/punctuation/quotation-marks", "straight marks only"),
      dashes: s("em, unspaced", "https://learn.microsoft.com/en-us/style-guide/punctuation/dashes-hyphens/index", null),
      headings: s("sentence case", "https://learn.microsoft.com/en-us/style-guide/scannable-content/headings", "no terminal period, no ampersands"),
      internet: s("lowercase", "https://learn.microsoft.com/en-us/style-guide/a-z-word-list-term-collections/i/internet-intranet-extranet", "webpage, website and webcast are one word"),
      abbreviations: s("US, never U.S.", "https://learn.microsoft.com/en-us/style-guide/a-z-word-list-term-collections/u/us", "e.g. and i.e. banned outright"),
      singularThey: s("accepted", "https://learn.microsoft.com/en-us/style-guide/grammar/nouns-pronouns", "including as a nonbinary pronoun"),
    },
  },

  google: {
    name: "Google developer documentation style guide",
    edition: "continuous",
    year: null,
    publisher: "Google",
    domain: "Developer documentation",
    free: true,
    quotable: true,
    url: "https://developers.google.com/style",
    note: "CC BY 4.0, so this is the one guide whose actual prose may be reproduced with attribution. Not to be confused with google/styleguide on GitHub, which is the code style guide.",
    says: {
      serialComma: s("always", "https://developers.google.com/style/commas", null),
      numbers: s("ten", "https://developers.google.com/style/numbers", "zero through nine spelled out"),
      percent: s("%", "https://developers.google.com/style/units-of-measure", "no space; spell both out at a sentence start"),
      dates: s("January 19, 2017", "https://developers.google.com/style/dates-times", "numeric fallback is ISO 8601"),
      quotePunctuation: s("inside, except literal strings", "https://developers.google.com/style/quotation-marks", "punctuation goes outside when the quotes delimit an exact string"),
      dashes: s("em, unspaced", "https://developers.google.com/style/dashes", "en dash banned outright"),
      headings: s("sentence case", "https://developers.google.com/style/headings", null),
      internet: s("lowercase", "https://developers.google.com/style/word-list", "no website entry exists"),
      abbreviations: s("US, never U.S.", "https://developers.google.com/style/abbreviations", "i.e. and e.g. banned"),
      singularThey: s("preferred", "https://developers.google.com/style/pronouns", "stated as the preferred gender-neutral pronoun"),
    },
  },

  apa: {
    name: "APA Publication Manual",
    edition: "7th",
    year: 2020,
    publisher: "American Psychological Association",
    domain: "Social and behavioural sciences, nursing, education",
    free: false,
    quotable: false,
    url: "https://apastyle.apa.org/products/publication-manual-7th-edition",
    note: "The Style and Grammar Guidelines are free but a genuine subset: they do not cover dashes, quotation placement, dates or internet capitalisation.",
    says: {
      serialComma: s("always", "https://apastyle.apa.org/style-grammar-guidelines/punctuation/serial-comma", "Pub. Manual 6.3"),
      numbers: s("ten", "https://apastyle.apa.org/style-grammar-guidelines/numbers/numerals", "Pub. Manual 6.32, 6.33"),
      percent: s("%", "https://apastyle.apa.org/style-grammar-guidelines/numbers/numerals", null),
      dates: null,
      quotePunctuation: null,
      dashes: null,
      headings: s("both, with rules for each", "https://apastyle.apa.org/style-grammar-guidelines/capitalization/title-case", "Pub. Manual 6.17"),
      internet: null,
      abbreviations: s("none", "https://apastyle.apa.org/style-grammar-guidelines/abbreviations", "FBI and PhD, not F.B.I. and Ph.D."),
      singularThey: s("endorsed", "https://apastyle.apa.org/style-grammar-guidelines/grammar/singular-they", "for both the specific and the generic use"),
    },
  },

  mla: {
    name: "MLA Handbook",
    edition: "9th",
    year: 2021,
    publisher: "Modern Language Association",
    domain: "Humanities and literature",
    free: false,
    quotable: false,
    url: "https://style.mla.org/handbook-editions-comparison-chart/",
    note: "The MLA Style Center is free, but many of its pages carry a banner saying they describe the 8th edition. The lone holdout capitalising Internet.",
    says: {
      serialComma: s("always", "https://style.mla.org/serial-commas-and-semicolons/", "MLA rejects the use-it-when-you-need-it approach by name"),
      numbers: s("anything writable in one or two words", "https://style.mla.org/numerals-or-words-for-ages/", "9th ed. 2.127, 2.128; the threshold is words, not digits"),
      percent: s("%", "https://style.mla.org/styling-percentages/", "the word with spelled-out numbers"),
      dates: s("either order", "https://style.mla.org/mla-dates-versus-iso-dates/", "month spelled out"),
      quotePunctuation: s("inside", "https://style.mla.org/punctuation-and-quotation-marks/", "Handbook p. 267"),
      dashes: s("em, unspaced", "https://style.mla.org/is-it-wrong-to-type-spaces-before-and-after-a-dash/", null),
      headings: s("title case", "https://style.mla.org/capitalization-of-titles/", "sentence case for other languages"),
      internet: s("Internet capitalised", "https://style.mla.org/capitalization-of-internet/", "following Webster's"),
      abbreviations: s("none, but periods acceptable if consistent", "https://style.mla.org/periods-with-abbreviations/", "MLA's own publications use US"),
      singularThey: s("accepted and encouraged", "https://style.mla.org/using-singular-they/", null),
    },
  },
};

/**
 * Chicago, and the argument is about scope rather than popularity.
 *
 * It is the only guide in the set that claims the whole territory: AP is scoped to news, APA and MLA
 * to scholarship, Microsoft and Google to software, the Guardian and BBC to their own newsrooms.
 * Novels and scripts live in book publishing, which is Chicago's home ground and which no other
 * guide here addresses at all. It carries both citation systems, so it covers papers without a
 * switch. And at 2024 it is the most recently revised of the general guides.
 *
 * There is no honest "most used overall". Nobody publishes an auditable count, and the per-domain
 * answers genuinely differ. Chicago is the best default for a tool whose users write more than one
 * kind of thing, which is not the same claim.
 */
export const DEFAULT = "chicago";

/** If the writing is British, this rather than New Hart's: free, current, and quotable. */
export const BRITISH_DEFAULT = "guardian";

/** Domains where picking an authority would be inventing a category rather than choosing from one. */
export const NO_AUTHORITY = new Set(["songs", "lyrics", "screenplays", "scripts"]);
