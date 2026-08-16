/**
 * Sentence-level ownership, addressed by content rather than by position.
 *
 * A person who corrects one sentence owns that sentence. Not the paragraph around it, not the file
 * it sits in. Claiming otherwise would have an agent report that a human wrote pages they never
 * touched, which is the same dishonesty as the reverse and easier to miss.
 *
 * Spans are stored as their own exact words, never as offsets or line numbers. Three things follow
 * from that, and all three are the reason for it:
 *
 *   A sentence stays owned when everything around it moves. Offsets would not survive one insert.
 *   Ownership is checkable against any version of the file, with no index to keep in step.
 *   If the words change, the claim lapses on its own. You own what you wrote. Rewrite it and it is
 *   no longer what you wrote.
 *
 * The unit is the sentence because it is the smallest thing that can be found again unambiguously.
 * A single word cannot: claiming "the" is meaningless, and a word repeated four times in a
 * paragraph cannot be told apart from its copies.
 */

/** Split on sentence ends, keeping the terminator, and leaving list markers and code alone. */
export function sentences(text) {
  const out = [];
  for (const line of text.split("\n")) {
    // A heading or a list item is one unit whatever its punctuation.
    if (/^\s*(#{1,6}\s|[-*+]\s|\d+\.\s|>|```)/.test(line) || line.trim() === "") {
      if (line.trim()) out.push(line.trim());
      continue;
    }
    const parts = line.match(/[^.!?]+(?:[.!?]+["')\]]*|$)/g) ?? [line];
    for (const p of parts) if (p.trim()) out.push(p.trim());
  }
  return out;
}

/** Whitespace is not meaning. Two spans matching after collapsing it are the same span. */
export const normalise = (s) => s.replace(/\s+/g, " ").trim();

/**
 * Which sentences differ between two versions.
 *
 * Returns the sentences present in `after` and absent from `before`, which is exactly the set the
 * author is responsible for: they typed those words. A sentence that merely moved is unchanged and
 * stays whoever's it was.
 */
export function changed(before, after) {
  const was = new Set(sentences(before).map(normalise));
  return sentences(after).filter((s) => !was.has(normalise(s)));
}

/** Does this text still contain every span somebody owns? */
export function intact(text, owned = []) {
  const present = new Set(sentences(text).map(normalise));
  const whole = normalise(text);
  return owned.filter((span) => {
    const n = normalise(span);
    return !present.has(n) && !whole.includes(n);
  });
}

/** Does this text touch any owned span at all? Used on an edit's old_string. */
export function touches(text, owned = []) {
  const whole = normalise(text);
  return owned.filter((span) => {
    const n = normalise(span);
    return whole.includes(n) || n.includes(whole);
  });
}
