/**
 * Notice: what the child says back.
 *
 * It hears one sentence, and answers THAT first. Only when the new sentence gives it nothing
 * does it reach back into everything you have said. That order is the design — see
 * docs/specs/child-speech.md. The previous version searched the whole graph for the most
 * interesting gap and produced eight questions in a row.
 *
 * Deterministic. No model, no fact about the world.
 */

import type { Link } from './validate.js'
import { conceptOf, type Shape } from './cohere.js'
import { unfamiliarWord } from './words.js'

export type Move =
  /** No diagnostic content. You answered what it asked. */
  | { readonly kind: 'gotIt' }
  /** No diagnostic content. Something in what you just said is startling. */
  | { readonly kind: 'whoa'; readonly about: string }
  | { readonly kind: 'term'; readonly term: string }
  | { readonly kind: 'conflict'; readonly a: Link; readonly b: Link }
  | { readonly kind: 'guess'; readonly cause: string; readonly effect: string }
  | { readonly kind: 'needed'; readonly concept: string }
  | { readonly kind: 'why'; readonly link: Link }
  | { readonly kind: 'mirror'; readonly chain: readonly Link[] }
  | { readonly kind: 'on' }

/** What the child just heard. */
export type Heard = {
  /** The raw text of the sentence you just finished. */
  readonly sentence: string
  /** Links Extract found in that sentence. */
  readonly fresh: readonly Link[]
  /** Everything you have said so far. */
  readonly all: readonly Link[]
  readonly shapes: readonly Shape[]
}

export type NoticeState = {
  readonly asked: ReadonlySet<string>
  readonly turn: number
  readonly lastKind?: Move['kind']
  /** The concept it last asked about, so `gotIt` can fire when you answer. */
  readonly waitingOn?: string
}

/** Numbers and magnitude words. Straight out of the transcripts: "Twenty FEET?", "TRILLIONS". */
const BIG = /\b(\d{3,}|hundreds?|thousands?|millions?|billions?|trillions?|enormous|gigantic|massive|huge)\b/i

const longestChain = (links: readonly Link[]): readonly Link[] => {
  const byCause = new Map<string, Link>()
  for (const link of links) byCause.set(conceptOf(link.cause.quote), link)

  let best: Link[] = []
  for (const start of links) {
    const chain: Link[] = [start]
    const seen = new Set([conceptOf(start.cause.quote)])
    let next = byCause.get(conceptOf(start.effect.quote))
    while (next && !seen.has(conceptOf(next.cause.quote))) {
      chain.push(next)
      seen.add(conceptOf(next.cause.quote))
      next = byCause.get(conceptOf(next.effect.quote))
    }
    if (chain.length > best.length) best = chain
  }
  return best
}

export function notice(heard: Heard, state: NoticeState): Move {
  const fresh = (key: string): boolean => !state.asked.has(key)

  // ---- the sentence you just said -----------------------------------------

  // You answered the question it asked. This is the move the old design had no room for.
  if (state.waitingOn !== undefined) {
    const answered = heard.fresh.some(l => conceptOf(l.effect.quote) === state.waitingOn)
    if (answered) return { kind: 'gotIt' }
  }

  const big = BIG.exec(heard.sentence)
  if (big !== null && fresh(`whoa:${big[0].toLowerCase()}`)) {
    return { kind: 'whoa', about: big[0] }
  }

  for (const link of heard.fresh) {
    for (const phrase of [link.cause.quote, link.effect.quote]) {
      const word = unfamiliarWord(phrase)
      if (word !== null && fresh(`term:${word}`)) return { kind: 'term', term: word }
    }
  }

  // ---- everything you have said -------------------------------------------

  const candidates: Move[] = []

  const conflict = heard.shapes.find(s => s.kind === 'conflict')
  if (conflict?.kind === 'conflict') return { kind: 'conflict', a: conflict.a, b: conflict.b }

  for (const s of heard.shapes) {
    if (s.kind === 'unlinkedPair' && fresh(`guess:${conceptOf(s.a)}→${conceptOf(s.b)}`)) {
      candidates.push({ kind: 'guess', cause: s.a, effect: s.b })
    }
  }

  // Never the concept the whole chain starts from — every explanation has a first cause, and
  // asking what causes it is not finding a gap, it is missing where the story begins.
  const chain = longestChain(heard.all)
  const head = chain.length > 0 ? conceptOf(chain[0]!.cause.quote) : null
  for (const s of heard.shapes) {
    if (s.kind !== 'rootless' || conceptOf(s.concept) === head) continue
    if (fresh(`needed:${conceptOf(s.concept)}`)) candidates.push({ kind: 'needed', concept: s.concept })
  }

  for (const link of heard.all) {
    if (fresh(`why:${conceptOf(link.cause.quote)}`)) candidates.push({ kind: 'why', link })
  }

  // Late, as consolidation. In the transcripts the child summarises at the end.
  if (chain.length > 1 && state.turn >= 3 && fresh('mirror')) candidates.push({ kind: 'mirror', chain })

  return candidates.find(m => m.kind !== state.lastKind) ?? candidates[0] ?? { kind: 'on' }
}

/** What the child is now waiting to hear, or undefined. Lets `gotIt` fire next turn. */
export const waitingOn = (move: Move): string | undefined => {
  switch (move.kind) {
    case 'needed':
      return conceptOf(move.concept)
    case 'guess':
      return conceptOf(move.effect)
    case 'why':
      return conceptOf(move.link.effect.quote)
    default:
      return undefined
  }
}

/**
 * The key a move occupies, so it does not repeat. Empty means "may fire again" — `gotIt`
 * should land every time you answer something, and `on` is the fallback.
 */
export const keyOf = (move: Move): string => {
  switch (move.kind) {
    case 'gotIt':
      return ''
    case 'whoa':
      return `whoa:${move.about.toLowerCase()}`
    case 'term':
      return `term:${move.term}`
    case 'conflict':
      return `conflict:${conceptOf(move.a.cause.quote)}`
    case 'guess':
      return `guess:${conceptOf(move.cause)}→${conceptOf(move.effect)}`
    case 'needed':
      return `needed:${conceptOf(move.concept)}`
    case 'why':
      return `why:${conceptOf(move.link.cause.quote)}`
    case 'mirror':
      return 'mirror'
    case 'on':
      return 'on'
  }
}
