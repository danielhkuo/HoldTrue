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

import type { Extraction } from './extract.js'
import type { Link } from './validate.js'
import { normalise } from './normalise.js'
import { stem, TOKEN } from './stem.js'

/**
 * A concept, cleaned. Unchanged since it was written, and deliberately NOT stemmed — `tally` shows
 * these strings back to a person, and *empti* is not what anyone said.
 */
export const conceptOf = (text: string): string => normalise(text).text.toLowerCase().trim()

/**
 * A concept, as COMPARED. cohere.md ruling 6: stem every word, so *lifts* and *lifting* are one
 * node in your own graph rather than two. Composed over `conceptOf` rather than folded into it,
 * which is the same arrangement `tally` already uses — the key is stemmed, the value never is.
 */
const key = (text: string): string => (conceptOf(text).match(TOKEN) ?? []).map(stem).join(' ')

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

const causeOf = (l: Link): string => key(l.cause.quote)
const effectOf = (l: Link): string => key(l.effect.quote)

/**
 * The chain's own two ends, which are not gaps. Ruling 2.
 *
 * Every explanation has a first cause and a last effect. Flagging them is not finding a hole, it is
 * misreading where the story starts and stops — and on a perfectly closed explanation it is two
 * false questions before Extract has made a single mistake. This is the single largest input to the
 * false-question rate, which is why it is computed first and applied to both guards.
 *
 * The head is a cause nothing leads into; the tail is an effect nothing leads out of. On a chain
 * that forks or joins there may be several of each, and all of them are termini.
 */
const termini = (links: readonly Link[]): { readonly heads: ReadonlySet<string>; readonly tails: ReadonlySet<string> } => {
  const causes = new Set(links.map(causeOf))
  const effects = new Set(links.map(effectOf))
  const heads = new Set<string>()
  const tails = new Set<string>()
  for (const link of links) {
    if (!effects.has(causeOf(link))) heads.add(causeOf(link))
    if (!causes.has(effectOf(link))) tails.add(effectOf(link))
  }
  return { heads, tails }
}

/**
 * One shape per concept, never one per link. Ruling 3.
 *
 * A concept that three links point at is one place your chain does not close, not three. A rate
 * that counted them separately would report your graph's fan-in rather than Cohere's error. The
 * links that produced it travel in `from`, which is also what lets a flag be traced back to a span,
 * a sentence, and a hand mark when the falsification week scores it.
 */
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

export function cohere(extraction: Extraction): readonly Shape[] {
  const { links } = extraction
  const shapes: Shape[] = []
  const { heads, tails } = termini(links)

  // An effect nothing leads out of, and a cause nothing leads into — minus the chain's own ends.
  const dangling: (readonly [string, string, Link])[] = []
  const rootless: (readonly [string, string, Link])[] = []
  const causes = new Set(links.map(causeOf))
  const effects = new Set(links.map(effectOf))

  for (const link of links) {
    const effect = effectOf(link)
    const cause = causeOf(link)
    if (!causes.has(effect) && !tails.has(effect)) dangling.push([effect, link.effect.quote, link])
    if (!effects.has(cause) && !heads.has(cause)) rootless.push([cause, link.cause.quote, link])
  }

  for (const [concept, from] of byConcept(dangling)) shapes.push({ kind: 'dangling', concept, from })
  for (const [concept, from] of byConcept(rootless)) shapes.push({ kind: 'rootless', concept, from })

  // Two causes of one effect that you never connected to each other. This is where the child
  // guesses — and where its guess is a plant, because you did not say it.
  const byEffect = new Map<string, Link[]>()
  for (const link of links) {
    const key = effectOf(link)
    byEffect.set(key, [...(byEffect.get(key) ?? []), link])
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
