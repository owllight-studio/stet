---
name: The Catalogue
group: core
description: The object record. Fields rather than sentences, and the same words on purpose.
feeling: Authority, manufactured by the format rather than earned by the words.
measured:
  sentenceMedian: 4
  sentenceMean: 6.9
  sentenceP95: 25
  sentenceSdOverMean: 1.19
  shortSentences: 0.62
  fieldsPer100Words: 26
  finiteVerbShare: 0.02
  exactRepeatShare: 0.32
  secondPerson: 0.0
  questions: 0
  exclamations: 1
  hedgesPerSentence: 0.01
sources: American Antiquities auction catalogue 1898; Rock, Textile Fabrics, South Kensington Museum 1870; Catalogue of the Gallery of Art, New York Historical Society 1915; Cleveland Museum of Art open access records; V&A physicalDescription; Sears Roebuck Consumers Guide 1897; Burpee's Farm Annual 1885; Whole Earth Catalog 1968
stet:
  state: draft
  author: agent
---

# The Catalogue

Counted from the texts: 3,093 entries of the object-record layer, 14,218 sentences and 97,624 words,
across an 1898 auction catalogue, a South Kensington Museum catalogue of 1870, a New York art
catalogue of 1915 and the Cleveland Museum of Art's open records. Measured separately against 46,615
words of mail order entries and 178,449 words of interpretive notes, because those are different
registers wearing the same cover.

## The one rule

**The same words, on purpose.** Between 23 and 50 percent of the sentences in these documents are
verbatim repeats of another sentence in the same document. The commonest way to begin a lot in the
1898 catalogue is the single word "Another.", which opens 69 of its 301 lots.

An earlier version of this preset said the opposite: every sentence a fact, nothing said twice. That
is exactly backwards, and it is the fastest way to spot generated catalogue writing. Elision is what
tells a reader that these entries are the same kind of thing. Spelling the head noun out every time
silently asserts that they are not.

**Yes:** "8 Another. Granite, polished edge. Very fine. Mercer Co., Ky. 5¾ in."
(*American Antiquities*, lot 8)

## The feeling, and how it gets there

**Authority, manufactured by the format rather than earned by the words.**

This register is not a style anybody chose. It is what running text looks like after field collapse.
The proof is in the corpus: the V&A holds its dimensions in a separate database field and writes its
physical descriptions as running prose, and those records measure like ordinary writing, a standard
deviation over mean of 0.66 with 56 percent of sentences carrying a finite verb. The register only
appears where the fields have been flattened into one line. The purest example in the whole corpus
is a Cleveland Museum tombstone, which is a template render rather than a piece of writing.

That is where the authority comes from, and it is worth knowing what you are borrowing. A uniform
field weighting is not the absence of a position. It is a machine for making anything look like
inventory, and it works on whatever is dropped into the slots.

## The three layers, and which one this is

They measure nothing like each other, and averaging them describes no real text.

| | median | sd over mean | fields per 100 words | finite verb |
|---|---|---|---|---|
| **object record**, this preset | 4 | 1.19 | 26 | 0.02 |
| commercial entry | 3 | 1.26 | 21 | 0.10 |
| interpretive note | 19 | 0.75 | 6 | 0.53 |

**This preset is the object record.** The mail order catalogue is a different register and the rules
below would ruin it: Sears runs second person at 64.8 per 10,000 words and first person plural at
123.9, carries 74 letters addressed to it, and prints an exclamation every 1,000 words. Burpee sets
213 signed customer testimonials between its entries. A catalogue that sells is a named seller
talking to a named buyer in both directions, and none of the nevers below apply to it.

## Rules

### Fields, not sentences

The lead measurement is fields per 100 words, counting a field as a run ended by a full stop or a
semicolon. The object record carries 13 to 65. Prose about objects carries 5. That is a thirteenfold
separation and it does not depend on anybody's opinion about what counts as a sentence, which
matters here because only 2 percent of these sentences contain a finite verb.

**Yes:** "Chair. Moulded plywood. 78 cm."
**No:** "This chair, made of moulded plywood, measures 78 centimetres in height."

### The adjective and the measurement both, in separate slots

The judgement does not replace the number and the number does not excuse the judgement.

**Yes:** "134 Celt. Edge perfect and sharp, very rare. Pike Co., Ill." (lot 134)

### Use the worn-out evaluative

*Very* appears 130 times per 10,000 words in the 1898 lot list, and what follows it is fine, rare,
desirable, curious, large. The flatness is the point: it is a grade rather than a description, and a
livelier adjective in that slot reads as a sales pitch rather than a record.

### Field order fixed, field contents free

Rock runs material, then ornament, then origin, then date, then size, 663 times without variation.

**Yes:** "Linen Diaper. Flemish, 15th century. 2¾ inches square." (Rock, 1870)

### Uncertainty occupies the slot rather than emptying it

A qualifier inside the field, never a clause about the writer's confidence. Cleveland uses `c.` on
55.7 percent of its records, "attributed" on 2.6 percent and "probably" on 2.2. Rock brackets a
question mark on 2.3 percent of headwords.

**Yes:** "Silk Net; green. Turkish, 16th century (?). 11½ inches by 4½ inches." (Rock, 1870)
**No:** "The date of this piece is not known with certainty."

### Close on the measurement

87 percent of Rock's headwords and 44 percent of the 1898 lots end on a dimension. The entry finishes
on the least arguable thing in it.

### Leave the gaps

Real entries omit what was never recorded and mark only what was guessed. A 1915 art catalogue
carries entries with no artist, no date and no dimensions, and says nothing at all about the absence.

### Discussion goes somewhere else, physically

Where a thing needs explaining, the explanation is separately typeset: indented in Rock, indented in
the New York catalogue, a different API field at Cleveland. The boundary is physical rather than
stylistic, and that is why the two layers can measure so differently inside one book.

## Never

Every count is over the object-record layer, 14,218 sentences and 97,624 words.

- **Never a question.** 0 in 14,218. Also 0 across 3,433 interpretive notes.
- **Never an exclamation.** 1 in 14,218. The commercial layer breaks this 21 times, and the Whole
  Earth Catalog runs 20.1 per 10,000 words, so it is a rule about object records alone.
- **Never second person.** 0.00 here, and untrue of anything commercial.
- **Never open on an article.** Between 0 and 9 percent of entries begin with "The", "A" or "An".
- **Never a connective.** Between 0.0 and 0.4 per 10,000 words in the tightest corpora. The auction
  catalogue at 16.0 and Burpee at 26.9 are not obeying this, and both are looser registers.
- **Never a hedge about your own confidence.** 0.01 per sentence.
- **Never a paragraph inside an entry.**

Two rules that were on this list and are measured off it: never repeat, and never evaluate. Both are
inversions, and both are in the rules above because they are what the register actually does.

## How pastiche fails

Every test is a count somebody can run in one pass.

**It writes sentences, so the field count collapses.** Count full stops and semicolons, divide by
words, multiply by 100. Under 10 and it is not a catalogue, it is prose about objects.

**It is too smooth.** The entry layer runs a standard deviation over mean of 0.9 to 1.3, which is
the only register in this library outside the usual 0.5 to 0.8 band. Under 0.85 and it has been
written as prose. The mechanism is real rather than noise: inside an entry the lengths alternate, a
long naming clause against a run of one and two word fields, and the measured lag-1 autocorrelation
is negative at about minus 0.22.

**It never repeats itself.** Take twenty consecutive entries and count the distinct opening words.
Generated output gives twenty different openings with every head noun spelled out, because it has
been trained to vary. The real thing gives you "Another" twenty-three times in a hundred.

**It avoids "very".** Every writing guide tells a model that *very* is weak, so pastiche reaches for
an interesting adjective. Under 40 per 10,000 words in a lot list is too few.

**It picks one layer and runs it all page.** The originals switch, and mark the switch typographically.
Pastiche writes a single texture that is usually a compromise between the entry and the note, which
is exactly where no real catalogue sits.

**It sorts.** Only 1 of 11 runs of three or more "Another" lots is ordered by size. Real catalogues
group by kind and then leave the group alone, because the order reflects an acquisition history.
Generated ones arrive alphabetised, which is what a machine does when it has no history to reflect.

**It fills every field.** A plausible value in every slot is why generated entries read as invented.

## What this register was used for

The 1898 auction catalogue is not a neutral corpus. Eleven of its 301 lots are objects taken from
Native American graves, with the provenance stated as a selling point, and one lot offers human hair
taken from Assiniboin and Sioux people, described with the same field grammar and the same rarity
grade as a stone tool. That is grave robbery and the trafficking of human remains, listed as
merchandise. The 1897 Sears catalogue carries product names using racial slurs.

The craft residue is real and it is the opposite of comforting. The uniform field weighting that
makes this register feel authoritative is a machine for making any content look like inventory, and
it worked on human remains exactly as well as it works on a chisel. The lesson is not to avoid the
register. It is that flattening a thing into fields is an editorial act with a cost, and the cost
falls on whatever is being flattened.
