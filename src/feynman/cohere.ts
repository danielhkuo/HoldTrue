/**
 * Cohere: where your own chain does not close.
 *
 * Set arithmetic over the graph Extract pulled out of your words. No model, no source, no
 * knowledge of the world — it only knows what you said and how the pieces of it connect.
 *
 * SKELETON. Enough to feel the product. The real piece gets a spec, an oracle and property
 * tests like every other; this is here so the child can speak before Extract can run.
 */

import type { Link } from './validate.js'
import { normalise } from './normalise.js'

/** A concept, as compared. Two mentions match when their cleaned text matches. */
export const conceptOf = (text: string): string => normalise(text).text.toLowerCase().trim()

export type Shape =
  /** You named it and never said what it does. */
  | { readonly kind: 'dangling'; readonly concept: string; readonly link: Link }
  /** You named it and never said what makes it happen. The chain has no beginning here. */
  | { readonly kind: 'rootless'; readonly concept: string; readonly link: Link }
  /** Two things you linked to a third, but never to each other. */
  | { readonly kind: 'unlinkedPair'; readonly a: string; readonly b: string; readonly via: string }
  /** Two links of yours that disagree. */
  | { readonly kind: 'conflict'; readonly a: Link; readonly b: Link }

const causeOf = (l: Link): string => conceptOf(l.cause.quote)
const effectOf = (l: Link): string => conceptOf(l.effect.quote)

export function cohere(links: readonly Link[]): readonly Shape[] {
  const shapes: Shape[] = []
  const causes = new Set(links.map(causeOf))
  const effects = new Set(links.map(effectOf))

  // An effect nothing leads out of, and a cause nothing leads into.
  for (const link of links) {
    if (!causes.has(effectOf(link))) {
      shapes.push({ kind: 'dangling', concept: link.effect.quote, link })
    }
    if (!effects.has(causeOf(link))) {
      shapes.push({ kind: 'rootless', concept: link.cause.quote, link })
    }
  }

  // Two causes of one effect that you never connected to each other. This is where the
  // child guesses — and where its guess is a plant, because you did not say it.
  const byEffect = new Map<string, Link[]>()
  for (const link of links) {
    const key = effectOf(link)
    byEffect.set(key, [...(byEffect.get(key) ?? []), link])
  }
  const linked = new Set(links.map(l => `${causeOf(l)}→${effectOf(l)}`))
  for (const [via, group] of byEffect) {
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const a = group[i]!.cause.quote
        const b = group[j]!.cause.quote
        if (linked.has(`${conceptOf(a)}→${conceptOf(b)}`)) continue
        if (linked.has(`${conceptOf(b)}→${conceptOf(a)}`)) continue
        shapes.push({ kind: 'unlinkedPair', a, b, via })
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
