---
name: Field Notes
group: core
description: The notebook, not the write-up. Subjectless, present tense, and mostly not in sentences.
feeling: Being in the middle of it, before you know what it means.
measured:
  sentenceMedian: 8
  sentenceMean: 13.5
  sentenceP95: 45
  sentenceSdOverMean: 1.14
  shortSentences: 0.38
  longSentences: 0.12
  unterminatedShare: 0.84
  firstPersonPer10kWords: 87
  questionMarksPer10kWords: 41
  numeralsPer10kWords: 418
  secondPerson: 0.0
  hedgesPerSentence: 0.07
  softenersPerSentence: 0.15
sources: Darwin's 15 Beagle field notebooks, Darwin Online; Darwin, Beagle Diary F1925; Darwin, Voyage of the Beagle; Lewis and Clark journals; Scott, Last Expedition vol I; Thoreau, Journal I
stet:
  state: draft
  author: agent
---

# Field Notes

Counted from the texts: 8,177 sentences over 110,671 words of Darwin's fifteen *Beagle* field
notebooks, measured against his own diary of the same voyage, his published book, and 950,000 further
words of expedition journals. Darwin gives all three rungs for the same days, which is what makes the
comparison a measurement rather than an impression.

## The one rule

**Delete the subject.** The notebook runs first-person pronouns at 87 per 10,000 words. Darwin's
own write-up of the same days runs 242, and his published book 177. The "I" is what retrospection
adds, because you only narrate yourself once you have stepped back far enough to watch yourself
doing it.

An earlier version of this preset said first person and say what you did. That is the write-up's
manners, and asking for them produces a document that has already stopped being a notebook.

**Yes:** "Started not before 1 oclock" (St. Fe notebook, 27 September 1833)
**Yes:** "Crossed in a canoe" (St. Fe notebook, 2 October 1833)
**No:** "I set off at about one, having crossed the river by canoe."

## The matched pair

The same man, the same road, the same day, in two documents.

**Notebook, 28 September 1833.** 100 words in four units. It opens "passed Luxan on river by bridge
nice church & Cabilda", with no subject anywhere. The verdict on the terrain is three words:
"country generally flat".

**Diary, 28 September 1833.** 152 words in one paragraph. "We passed it." "We passed Areco, another
small town." The three-word verdict has become "The country appears level, but it is not so in fact;
for in various places the horizon is extensive."

A 52 percent expansion, the pronoun restored, the fragments joined into periods, and a flat
observation turned into a qualified proposition. Every one of those four changes is what a writer
does when they are no longer in the field.

## Most of it is not in sentences

84 percent of the notebook's manuscript units do not end in terminal punctuation, allowing a
trailing dash. The diary is at 19 percent and the published book at 4. On a stricter test that looks
for a finite verb, 64 percent of notebook units have none against 6 percent of diary units, and the
ten to one gap is the real result whatever the exact figure.

So the sentence median of 8 is the second statistic here, not the first. It is a median of
fragments, and any tool measuring this register is mostly slicing runs of fragments at the
occasional full stop.

## Rules

### Present tense for the thing in front of you, bare past for what you did

"is" or "are" against "was" or "were" runs 3.9 to 1 in the notebooks. In the diary it is 1.32 to 1
and in the book 1.29 to 1. The specimen is present because it is still there; the walk is past
because it is over.

### The doubt is a question mark, not a hedge

This is the correction that matters most after the subject. The notebooks carry 41 question marks
per 10,000 words against the diary's 3, and 42 double question marks against zero anywhere else.
Measured on genuine epistemic doubt words, the notebook hedges *less* than the published book, 0.072
per sentence against 0.126.

**Yes:** "Corals branches are yet on Bald Head: Where is it?" (Rio notebook, undated)
**No:** "It seems possible that the coral may perhaps have originated elsewhere."

Measuring this register is part of what split this project's word lists in four. The old single
list scored these notebooks at 0.15 per sentence and 52 percent of those hits were the word "very",
which is an intensifier and the opposite of a hedge. That figure is now `softenersPerSentence`, and
`hedgesPerSentence` counts doubt alone.

### Numbers, at eight to eleven times the write-up's rate

418 numerals per 10,000 words, against 50 in the diary and 37 in the book. And the notebook does not
round: it records "60 70 or 70 80 feet at least" rather than choosing one.

### The colon abuts, it does not argue

Colons and dashes against commas run 2.6 to 1 in the notebooks, 0.79 to 1 in the diary and 0.07 to 1
in the book. Two observations are set beside each other and the relation between them is left for
later. There is no "because", no "which suggests", no "this means".

### The admin stays in the book

The address, the debt and the errand sit among the geology. "Owe Mr Rowlett one paper dollar" is in
the Buenos Ayres notebook, and "Mem" or "NB" appears at 9.9 per 10,000 words against 0.3 in the
diary. These are the strongest single evidence that a document was written in the field, because
nobody copying it up later would keep them.

### The date is a header, not a sentence

A dated unit every 113 words in the notebooks, every 189 in the diary, every 1,095 in the book.

### One adjective, then stop

**Yes:** "very curious finding this formation here." (Banda Oriental notebook, 17 November 1833)
**Yes:** "splendid weather & utterly useless weather" (Copiapò notebook, 10 June 1835)

## The log is a different document

The preset used to describe a log while calling it a notebook, and the two have opposite mechanics.

| | notebook | log |
|---|---|---|
| sentence median | 8 | 23 |
| 30 words or more | 12 percent | 38 percent |
| question marks per 10,000 words | 41 | 0.1 |
| subject | absent | present |

Lewis and Clark write complete past-tense sentences with a subject and ask no questions across
662,000 words. Scott is the same shape. Both are logs: dated, narrated, addressed to a record.
"First person, hedge honestly, leave it rough" asks for a log with a notebook's manners, which is
neither of them.

## Never

- **Never second person.** 9 tokens in 110,671 words, most of them reported speech.
- **Never state a relation between two observations.** The colon abuts. The argument comes later or
  not at all.
- **Never close the line.** 84 percent of units do not end in terminal punctuation.
- **Never frame retrospectively.** No "as it turned out", no "in the event", no summary of the day.
  Summary is the diary's job and the diary does it 1,661 times.
- **Never write a paragraph.** The notebook's unit median is 10 words. It has lines, not paragraphs.
- **Never tidy out the admin.**
- **Never round a number.**

## How pastiche fails

**Pronoun inflation, about three times.** Written to the old preset, imitation lands at or above the
write-up's 242 per 10,000 words. The target is 87.

**Hedge inflation, about 2.5 times, on the wrong instrument.** Imitation reaches for "perhaps" and
"it seems". The real thing reaches for a question mark, and sometimes two.

**Second person, 40 to 50 times over.**

**Variance collapse.** Imitation writes an even line of 10 to 16 word fragments. The real thing is
bimodal: 38 percent under six words and 12 percent at thirty or more, often on the same page, because
the short ones are the log and the long ones are the geology. A generated notebook keeps the short
ones and loses the long ones, so its standard deviation over mean lands at 0.5 to 0.7 and gives
itself away.

**Terminal punctuation.** Imitation closes its lines.

**Numeral starvation.** Imitation writes "a large deposit" where the notebook writes "50 fathoms".

**Tidiness.** Imitation deletes the shopping list and the debt as off topic.

### The one-pass test

Four numbers, and any two failing is conclusive.

1. **Standard deviation over mean.** Under 0.9 is a write-up whatever it claims. Notebooks run 1.0
   to 1.15, which puts this register outside the 0.5 to 0.8 band the rest of this library sits in.
2. **First-person pronouns per 100 words.** Above 2.0 is a write-up. Notebooks run 0.87.
3. **Share of lines ending in a full stop.** Above 0.4 is a write-up. Notebooks run 0.16.
4. **Numerals per 100 words.** Below 2.0 is impressionistic. Notebooks run 4.2.
