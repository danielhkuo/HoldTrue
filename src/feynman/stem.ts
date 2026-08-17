/**
 * The shared inflection stripper.
 *
 * Two callers need the same answer to one question: are *lifts* and *lifting* the same concept?
 * `tally` needs it to decide whether the child introduced a word; `cohere` needs it to decide
 * whether your chain closes. Two copies would drift, and a stemmer that disagrees with itself
 * under-reports in silence — which is the Law 1 direction for both of them.
 *
 * A clitic or possessive, then plural *-s* and *-es*, then verb *-ing* and *-ed*, and nothing else.
 * Every step past inflection is a judgement about meaning, and neither caller is allowed to make
 * one.
 *
 * Two passes, plural then verb, so *things* and *thing* strip to the same root. One pass with an
 * early return gives them two.
 *
 * **The clitic pass was added 2026-08-16, and it fixes a defect in both callers at once.** `TOKEN`
 * keeps the apostrophe, so *it's* arrived here whole; the plural rule then took the trailing *s*
 * and returned `it'`, an apostrophe glued to a root that matches nothing. Two consequences, both
 * measured with a probe before the fix:
 *
 *   - **The tally.** Its stop list holds bare forms, so *i'm*, *it's*, *that's*, *what's* and
 *     *there's* never matched it and every one was written into the ledger as a word the child
 *     introduced. The screenshot that started this had `word i'm` and `word lost` in it, twice.
 *   - **Cohere, and this is the worse half.** `key` stems every word, so *the yeast's* and *the
 *     yeast* were two nodes. A possessive anywhere in your own explanation split a concept in
 *     half and produced a `dangling` and a `rootless` on a chain that closed — feeding the exact
 *     false-question rate that carries cohere.md's kill number.
 *
 * **`n't` is never stripped, and the guard is load-bearing.** `tally.ts` keeps negation out of its
 * stop list on purpose: a child that negates your chain is what the ledger must not lose in
 * silence. Strip *doesn't* to *does* and it lands in the stop list and disappears. So the guard
 * runs first and *doesn't*, *don't*, *isn't* and *can't* pass through whole.
 *
 * Stripping is a function of one word, so it stays an equivalence relation and is legal as a
 * component of a node-identity key under cohere.md ruling 11 — which forbids only non-transitive
 * tests there.
 *
 * OWNED BY NEITHER PIECE, AND UNTESTED ON ITS OWN. It was lifted out of `tally.ts` on 2026-08-12 so
 * Cohere could use it; `tally.test.ts` exercises it through the tally and is the only thing standing
 * behind it. cohere.md ruling 6 says it needs its own oracle and nobody has written one.
 */

/** A run of word characters, the same class normalise.ts segments on. */
export const TOKEN = /[\p{L}\p{M}\p{N}'’]+/gu

/**
 * A trailing contraction or possessive. The optional group covers a bare plural possessive, and
 * the `$` is load-bearing: unanchored, this eats the apostrophe out of the middle of a word and
 * turns *o'clock* into *oclock*.
 *
 * **`t` must never join that alternation, and this comment is the whole of what stops it.** A
 * negation ends `n't`, so the letter after its apostrophe is `t`; leaving `t` out is what makes
 * every negation fall straight through this rule untouched. An explicit `n't` guard stood here
 * from 2026-08-16 until mutation testing the same day showed it was dead — it could never fire,
 * because this pattern already declines to match. Deleted rather than tested, per the third
 * verdict in `/holdtrue-workflow`'s mutation step. What protects the invariant now is
 * `stem.test.ts`'s negation block, which fails the moment anyone adds `t` here.
 */
const CLITIC = /['’](?:s|m|re|ve|ll|d)?$/

export const stem = (word: string): string => {
  let root = word.replace(CLITIC, '')

  if (root.length > 4 && root.endsWith('ies')) root = `${root.slice(0, -3)}y`
  else if (root.length > 4 && /(?:s|x|z|ch|sh)es$/.test(root)) root = root.slice(0, -2)
  else if (root.length > 3 && root.endsWith('s') && !root.endsWith('ss')) root = root.slice(0, -1)

  if (root.length > 4 && root.endsWith('ing')) root = root.slice(0, -3)
  else if (root.length > 4 && root.endsWith('ed')) root = root.slice(0, -2)
  return root
}
