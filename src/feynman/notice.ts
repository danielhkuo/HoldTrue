/**
 * Notice: what a child who heard only your words would trip on.
 *
 * Reads the graph and the shapes Cohere found, returns one typed move. No model, no fact
 * about the world — every trigger is a property of what you said.
 *
 * Two things here are about sounding like a child rather than about finding gaps, and both
 * came out of reading docs/transcripts/. Real children **do not exhaust one kind of
 * question** — they ask about a word, then a step, then say something back, then go quiet
 * and let you keep talking. And they mirror **late**, as consolidation, not up front. So
 * this refuses to play the same move twice running while another is available, and it holds
 * the mirror back.
 *
 * SKELETON: a subset of the twelve moves in docs/specs/child-speech.md. Move priority
 * follows ruling 3 there — `conflict` outranks the gap probes.
 */

import type { Link } from './validate.js'
import { conceptOf, type Shape } from './cohere.js'
import { unfamiliarWord } from './words.js'

export type Move =
  | { readonly kind: 'conflict'; readonly a: Link; readonly b: Link }
  | { readonly kind: 'term'; readonly term: string }
  | { readonly kind: 'resay'; readonly sentence: string }
  | { readonly kind: 'guess'; readonly cause: string; readonly effect: string }
  | { readonly kind: 'why'; readonly link: Link }
  | { readonly kind: 'needed'; readonly concept: string }
  | { readonly kind: 'mirror'; readonly chain: readonly Link[] }
  | { readonly kind: 'on' }

export type NoticeState = {
  readonly asked: ReadonlySet<string>
  readonly droppedOn: readonly string[]
  readonly lastKind?: Move['kind']
  readonly turn: number
}

/** The longest run of links that connect end to end. */
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

export function notice(
  links: readonly Link[],
  shapes: readonly Shape[],
  state: NoticeState,
): Move {
  const fresh = (key: string): boolean => !state.asked.has(key)
  const candidates: Move[] = []

  // You contradicted yourself. Jumps the queue — asking about a skipped step is strange
  // when you just said two things that disagree.
  const conflict = shapes.find(s => s.kind === 'conflict')
  if (conflict?.kind === 'conflict') return { kind: 'conflict', a: conflict.a, b: conflict.b }

  // A word it does not know. Children ask these the moment they hear them.
  for (const link of links) {
    for (const phrase of [link.cause.quote, link.effect.quote]) {
      const word = unfamiliarWord(phrase)
      if (word !== null && fresh(`term:${word}`)) candidates.push({ kind: 'term', term: word })
    }
  }

  // We half-heard a sentence. The only move that recovers a loss.
  for (const sentence of state.droppedOn) {
    if (fresh(`resay:${sentence}`)) candidates.push({ kind: 'resay', sentence })
  }

  // Two of your own causes we could join and you never did. This is the plant.
  for (const s of shapes) {
    if (s.kind !== 'unlinkedPair') continue
    if (fresh(`guess:${conceptOf(s.a)}→${conceptOf(s.b)}`)) {
      candidates.push({ kind: 'guess', cause: s.a, effect: s.b })
    }
  }

  // A step with nothing under it — but never the one the whole chain starts from.
  //
  // Every explanation has a first cause, and that cause is rootless by definition. Asking
  // "what makes you push the handle down?" is not finding a gap, it is failing to notice
  // where the story begins. What is worth asking about is an orphan in the MIDDLE: something
  // you introduced halfway through and never connected to what came before.
  const chain = longestChain(links)
  const head = chain.length > 0 ? conceptOf(chain[0]!.cause.quote) : null
  for (const s of shapes) {
    if (s.kind !== 'rootless') continue
    if (conceptOf(s.concept) === head) continue
    if (fresh(`needed:${conceptOf(s.concept)}`)) candidates.push({ kind: 'needed', concept: s.concept })
  }

  // Why does that link hold at all? The question the adults in the transcripts could not
  // answer — six of eighteen said "I don't remember the why of that part."
  for (const link of links) {
    if (fresh(`why:${conceptOf(link.cause.quote)}`)) candidates.push({ kind: 'why', link })
  }

  // Held back on purpose. In the transcripts the child summarises at the END.
  if (chain.length > 1 && state.turn >= 3 && fresh('mirror')) {
    candidates.push({ kind: 'mirror', chain })
  }

  // Prefer a different kind from the one just played, so it does not read as a form letter.
  const varied = candidates.find(m => m.kind !== state.lastKind)
  return varied ?? candidates[0] ?? { kind: 'on' }
}

export const keyOf = (move: Move): string => {
  switch (move.kind) {
    case 'conflict':
      return `conflict:${conceptOf(move.a.cause.quote)}`
    case 'term':
      return `term:${move.term}`
    case 'resay':
      return `resay:${move.sentence}`
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
