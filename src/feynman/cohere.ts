/**
 * Cohere: where your own chain does not close.
 *
 * Set arithmetic over the graph Extract pulled out of your words. No model, no source, no knowledge
 * of the world — it only knows what you said and how the pieces of it connect. That is the whole
 * value: it can find a hole in your explanation without holding a single belief about the subject,
 * so it can never be confidently wrong about the world. It can only be wrong about you, and only in
 * one direction — thinking you skipped something you actually said.
 *
 * That direction is the false-question rate, it carries this piece's kill number, and nearly every
 * decision below exists to keep it down. See docs/specs/cohere.md and
 * measurements/within-sentence/README.md.
 *
 * DEMO-GRADE, 2026-08-12. Built to the spec's rulings so the walking skeleton is worth running, but
 * NOT through the oracle, the red team or mutation. It has no test file. Do not read a green suite
 * as evidence about this module — there is nothing in the suite that touches it.
 */

import type { Link, Sentence } from './validate.js'
import { normalise } from './normalise.js'
import { stem, TOKEN } from './stem.js'

/**
 * A concept, cleaned. Unchanged since it was written, and deliberately NOT stemmed — `tally` shows
 * these strings back to a person, and *empti* is not what anyone said.
 */
export const conceptOf = (text: string): string => normalise(text).text.toLowerCase().trim()

/**
 * Words that name nothing. Stripped from the comparison key so that *the yeast* and *that yeast*
 * are one node, which is the case an eight-turn rig run actually produced.
 */
const DETERMINER: ReadonlySet<string> = new Set(
  // Stemmed, because the filter runs after `stem` — unstemmed, `this` survives as `thi` and still
  // splits *this yeast* from *the yeast*, which is the exact split the list exists to close. Found
  // by review, 2026-08-12, with a reproduction: it emitted an unlinkedPair of a concept with
  // itself, which is ruling 4's own named failure.
  // `it` joined the list on 2026-08-16. `its` stems to `its` and `it's` stems to `it`, so without
  // both entries the commonest apostrophe error in transcribed speech splits one node in two —
  // and decisions.md decides the transcript is never corrected, so that error arrives uncorrected.
  'a an the this that these those my your his her it its our their some any each every'
    .split(' ')
    .map(stem),
)

/**
 * A concept, as COMPARED. cohere.md ruling 6 stems every word; ruling 11 then drops determiners,
 * because *the yeast* against *that yeast* was leaving the graph in disconnected pairs.
 *
 * **This stays an equivalence relation, and that is the whole constraint.** Ruling 11: no
 * non-transitive test — subset, overlap, similarity — may key `causes`, `effects`, `byEffect`,
 * `linked` or `termini`. Those decide which nodes ARE the same node, and a non-transitive rule
 * used there merges A with B and B with C while leaving A and C apart, which manufactures a chain
 * the speaker never stated. A loose rule may suppress a shape. It may never form one.
 */
export const nodeKey = (text: string): string =>
  (conceptOf(text).match(TOKEN) ?? []).map(stem).filter(w => !DETERMINER.has(w)).join(' ')

export type Shape =
  /** You named it and never said what it does. Ruling 2 excludes the chain's own last effect. */
  | { readonly kind: 'dangling'; readonly concept: string; readonly from: readonly Link[] }
  /** You named it and never said what makes it happen. Ruling 2 excludes the chain's first cause. */
  | { readonly kind: 'rootless'; readonly concept: string; readonly from: readonly Link[] }
  /** Two things you linked to a third and never to each other. Where the child plants a guess. */
  | {
      readonly kind: 'unlinkedPair'
      readonly a: string
      readonly b: string
      readonly via: string
      readonly from: readonly Link[]
    }
  /** Two links of yours that disagree. */
  | { readonly kind: 'conflict'; readonly a: Link; readonly b: Link }

const causeOf = (l: Link): string => nodeKey(l.cause.quote)
const effectOf = (l: Link): string => nodeKey(l.effect.quote)

/**
 * The chain's own two ends, which are not gaps. Ruling 2.
 *
 * Every explanation has a first cause and a last effect. Flagging them is not finding a hole, it is
 * misreading where the story starts and stops — and on a perfectly closed explanation it is two
 * false questions before Extract has made a single mistake. This is the single largest input to the
 * false-question rate, which is why it is computed first and applied to both guards.
 *
 * **Position, not topology, and the first implementation got this catastrophically wrong.** It
 * defined the head as *any cause nothing leads into* — which is the definition of `rootless`
 * itself, so subtracting it made both guards mathematically impossible and Cohere returned nothing
 * on every input ever run. Found by review 2026-08-12, after three rig runs of zero shapes were
 * blamed on the matcher.
 *
 * The chain has **one** head and **one** tail: the cause of the first link you stated and the
 * effect of the last. A concept with nothing leading into it in the *middle* of your explanation is
 * a hole, not a beginning — that distinction is the whole of ruling 2, and it needs the order you
 * said things in, which topology alone cannot supply.
 */
const termini = (links: readonly Link[]): { readonly head: string | null; readonly tail: string | null } => {
  if (links.length === 0) return { head: null, tail: null }
  return { head: causeOf(links[0]!), tail: effectOf(links[links.length - 1]!) }
}

/**
 * One shape per concept, never one per link. Ruling 3.
 *
 * A concept that three links point at is one place your chain does not close, not three. A rate
 * that counted them separately would report your graph's fan-in rather than Cohere's error. The
 * links that produced it travel in `from`, which is also what lets a flag be traced back to a span,
 * a sentence, and a hand mark when the falsification week scores it.
 */
/**
 * THE SEAM MUTE — added 2026-08-16, and it is a suppressor, never a joiner.
 *
 * Extract writes an effect as a verb phrase and a cause as a noun phrase, so consecutive links
 * never share a node string and a chain that closes perfectly looks broken at every seam:
 *
 *     causes  "push the handle down" -> "pulls the chain"
 *     causes  "the chain"            -> "lifts the flapper"
 *
 * `pulls the chain` and `the chain` are one node. Unmuted, that yields a `dangling` and a
 * `rootless` per seam, all false. Three turns of the toilet explanation produced six flags and
 * every one was wrong — far past the 50% that ruling 9 says retires this piece.
 *
 * **Why this is legal where the 2026-08-12 matcher was not.** Ruling 11 forbids a non-transitive
 * test keying `causes`, `effects`, `byEffect`, `linked` or `termini`, because those decide which
 * nodes ARE the same node and a loose rule there manufactures a chain nobody stated. This runs
 * afterwards, over the two flag lists, and only ever deletes. It forms no edge, no pair and no
 * self-loop. Ruling 11's own last line: *a loose rule may suppress a shape, it may never form one.*
 *
 * **Two conditions, and the second was earned by a probe.** Subset in either direction, AND the two
 * flags came off consecutive links. Subset alone is the best of the three overlap tests tried;
 * *any shared content word* was refuted outright, because it muted a true `dangling` on
 * *wets the floor* against a true `rootless` on *the floor drain*, which are different things that
 * share a word. Adjacency rescues that case completely, on the reasoning that a split node shows up
 * at ONE seam rather than anywhere in the output.
 *
 * **What it still gets wrong, recorded rather than discovered later.** A short concept is a subset
 * of a longer one that elaborates it, so a true `dangling` on *the water* and a true `rootless` on
 * *the water pressure* are muted when their links are adjacent. That is a real false negative and
 * it is the price. It is the cheaper direction: an unasked question costs a question, where the
 * flag it replaces asks the user about a step they just explained. And pairwise suppression only
 * cancels a split that shows on both sides at once — where the other half was consumed as a cause
 * elsewhere, the survivor stays. Both limits are engineering counts on hand-built input, not a
 * measurement, and no figure here belongs in a spec as one.
 */
const wordsOf = (comparisonKey: string): ReadonlySet<string> =>
  new Set(comparisonKey.split(' ').filter(Boolean))

const subsetEither = (a: ReadonlySet<string>, b: ReadonlySet<string>): boolean => {
  // An empty set is a subset of everything, so without this guard a concept that normalises away
  // mutes every flag it is compared against. The tally paid for this exact hole once — its
  // red-team hole 4 is the same shape.
  if (a.size === 0 || b.size === 0) return false
  const [small, large] = a.size <= b.size ? [a, b] : [b, a]
  for (const word of small) if (!large.has(word)) return false
  return true
}

/**
 * Drop the `dangling`/`rootless` pairs that are one node seen from both sides of a seam.
 * Returns the surviving entries of each list, in order.
 */
const muteSeams = (
  dangling: readonly (readonly [string, string, Link])[],
  rootless: readonly (readonly [string, string, Link])[],
  order: ReadonlyMap<Link, number>,
): {
  readonly dangling: readonly (readonly [string, string, Link])[]
  readonly rootless: readonly (readonly [string, string, Link])[]
} => {
  const deadD = new Set<number>()
  const deadR = new Set<number>()

  for (const [di, d] of dangling.entries()) {
    for (const [ri, r] of rootless.entries()) {
      if (deadR.has(ri)) continue
      const a = order.get(d[2])
      const b = order.get(r[2])
      if (a === undefined || b === undefined || Math.abs(a - b) !== 1) continue
      if (!subsetEither(wordsOf(d[0]), wordsOf(r[0]))) continue
      deadD.add(di)
      deadR.add(ri)
      break
    }
  }

  return {
    dangling: dangling.filter((_, i) => !deadD.has(i)),
    rootless: rootless.filter((_, i) => !deadR.has(i)),
  }
}

const byConcept = (
  entries: readonly (readonly [string, string, Link])[],
): readonly (readonly [string, readonly Link[]])[] => {
  const seen = new Map<string, { quote: string; from: Link[] }>()
  for (const [key, quote, link] of entries) {
    const found = seen.get(key)
    if (found === undefined) seen.set(key, { quote, from: [link] })
    else found.from.push(link)
  }
  return [...seen.values()].map(v => [v.quote, v.from] as const)
}

/**
 * Takes the links and the sentences, never an `Extraction`.
 *
 * An `Extraction` carries one `doc`, and `decisions.md`'s *The `Doc` is the turn* makes each turn
 * its own document — so a graph spanning several turns cannot be expressed as one. Both callers
 * that tried invented a different wrong `doc`, and one of them produced anchors that resolved
 * against the wrong sentence rather than failing. Found by review, 2026-08-12; this corrects
 * cohere.md ruling 1, which asked for the whole `Extraction`.
 *
 * `sentences` is unread until the connective mute lands. It is in the signature because the mute
 * is a rule about sentences that yielded no link, and a link list cannot see one.
 */
export function cohere(links: readonly Link[], _sentences: readonly Sentence[]): readonly Shape[] {
  const shapes: Shape[] = []
  const { head, tail } = termini(links)

  // An effect nothing leads out of, and a cause nothing leads into — minus the chain's own ends.
  const dangling: (readonly [string, string, Link])[] = []
  const rootless: (readonly [string, string, Link])[] = []
  const causes = new Set(links.map(causeOf))
  const effects = new Set(links.map(effectOf))

  for (const link of links) {
    const effect = effectOf(link)
    const cause = causeOf(link)
    if (!causes.has(effect) && effect !== tail) dangling.push([effect, link.effect.quote, link])
    if (!effects.has(cause) && cause !== head) rootless.push([cause, link.cause.quote, link])
  }

  // Before dedup, so a concept muted at its seam does not survive on another link's copy of it.
  const order = new Map(links.map((l, i) => [l, i] as const))
  const kept = muteSeams(dangling, rootless, order)

  for (const [concept, from] of byConcept(kept.dangling)) shapes.push({ kind: 'dangling', concept, from })
  for (const [concept, from] of byConcept(kept.rootless)) shapes.push({ kind: 'rootless', concept, from })

  // Two causes of one effect that you never connected to each other. This is where the child
  // guesses — and where its guess is a plant, because you did not say it.
  const byEffect = new Map<string, Link[]>()
  for (const link of links) {
    const k = effectOf(link)
    byEffect.set(k, [...(byEffect.get(k) ?? []), link])
  }
  const linked = new Set(links.map(l => `${causeOf(l)}→${effectOf(l)}`))

  for (const group of byEffect.values()) {
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const one = group[i]!
        const two = group[j]!
        const a = causeOf(one)
        const b = causeOf(two)
        // The pair must be two different concepts. Ruling 4: the old guard asked whether one cause
        // linked to another cause and looked that up in a cause→effect index, so two links sharing
        // a cause — which every conflict does — produced a pair of one concept with itself, and the
        // child asked whether X causes X.
        if (a === b) continue
        if (linked.has(`${a}→${b}`) || linked.has(`${b}→${a}`)) continue
        shapes.push({
          kind: 'unlinkedPair',
          a: one.cause.quote,
          b: two.cause.quote,
          // Your words, never the comparison key. Ruling 5: `via` used to carry the normalised
          // form, which is the one string in this type you never said aloud, and `speak` puts these
          // phrases into a prompt as though you had.
          via: one.effect.quote,
          from: [one, two],
        })
      }
    }
  }

  // You said X causes Y somewhere and X prevents Y somewhere else.
  for (let i = 0; i < links.length; i++) {
    for (let j = i + 1; j < links.length; j++) {
      const a = links[i]!
      const b = links[j]!
      if (causeOf(a) !== causeOf(b) || effectOf(a) !== effectOf(b)) continue
      const opposed =
        (a.relation === 'causes' && b.relation === 'prevents') ||
        (a.relation === 'prevents' && b.relation === 'causes')
      if (opposed) shapes.push({ kind: 'conflict', a, b })
    }
  }

  return shapes
}
