/**
 * The shared inflection stripper.
 *
 * Two callers need the same answer to one question: are *lifts* and *lifting* the same concept?
 * `tally` needs it to decide whether the child introduced a word; `cohere` needs it to decide
 * whether your chain closes. Two copies would drift, and a stemmer that disagrees with itself
 * under-reports in silence — which is the Law 1 direction for both of them.
 *
 * Plural *-s* and *-es*, verb *-ing* and *-ed*, and nothing else. Every step past inflection is a
 * judgement about meaning, and neither caller is allowed to make one.
 *
 * Two passes, plural then verb, so *things* and *thing* strip to the same root. One pass with an
 * early return gives them two.
 *
 * OWNED BY NEITHER PIECE, AND UNTESTED ON ITS OWN. It was lifted out of `tally.ts` on 2026-08-12 so
 * Cohere could use it; `tally.test.ts` exercises it through the tally and is the only thing standing
 * behind it. cohere.md ruling 6 says it needs its own oracle and nobody has written one.
 */

/** A run of word characters, the same class normalise.ts segments on. */
export const TOKEN = /[\p{L}\p{M}\p{N}'’]+/gu

export const stem = (word: string): string => {
  let root = word
  if (root.length > 4 && root.endsWith('ies')) root = `${root.slice(0, -3)}y`
  else if (root.length > 4 && /(?:s|x|z|ch|sh)es$/.test(root)) root = root.slice(0, -2)
  else if (root.length > 3 && root.endsWith('s') && !root.endsWith('ss')) root = root.slice(0, -1)

  if (root.length > 4 && root.endsWith('ing')) root = root.slice(0, -3)
  else if (root.length > 4 && root.endsWith('ed')) root = root.slice(0, -2)
  return root
}
