/**
 * Speak: the child's line.
 *
 * A model is handed the conversation so far and the shapes Cohere found, and says one thing back.
 * The shapes are context, never an instruction — child-speech.md ruling 12. It is told where your
 * chain does not close and left to decide whether that is what a child would ask about.
 *
 * This is the piece that makes the child worth talking to, and it is the piece that can ratify a
 * belief you never held. The guarantee is not that it cannot say such a thing; it is that it cannot
 * say it without `tallyIntroduced` writing it down.
 *
 * DEMO-GRADE, 2026-08-12. No eval, no labelled set, and the prompt below has been tuned by nobody.
 * child-speech.md is the contract; this is the first thing that satisfies it.
 */

import { normalise } from './normalise.js'
import type { ModelHandle } from './model.js'
import type { Shape } from './cohere.js'
import type { Spoken, Turn } from './tally.js'

/**
 * Leading glue a speaker would drop. Note what is NOT here: `that`, `it` and `which`. Those are
 * doing grammatical work — strip "that" from "that pulls the chain" and it reads with no subject.
 */
const LEAD = /^(?:and|so|then|but|because|cause|when)\s+/i

/**
 * Your words, cleaned for saying out loud. Filled pauses and stammers go; the anchors keep them.
 * child-speech.md ruling 6.
 *
 * Everything this module puts in the prompt goes through here first, which is the whole mechanism
 * of that ruling: your stammer never reaches the model, so it cannot come back out. Nothing cleans
 * the child's own line, and nothing should — the model wrote it, and it is not a rendering of you.
 */
export const say = (phrase: string): string => {
  let s = normalise(phrase).text.trim()
  for (let i = 0; i < 2 && LEAD.test(s); i++) s = s.replace(LEAD, '')
  return s.replace(/[.,;:!?]+$/, '').trim()
}

const SYSTEM = `You are a curious 10-year-old. An adult is explaining how something works, out loud, from memory. You are listening.

Say ONE short thing back. Not a paragraph. One line, the way a real child talks.

RULES:
1. Answer the sentence they just said. React to it before you reach back to anything earlier.
2. Sound like a child. Short words, short sentences. "wait", "ohhh", "how come".
3. Never explain anything back to them. You are the one who does not know.
4. Never say their explanation was unclear, confusing or bad. If you are lost, say YOU are lost.
5. Not every line is a question. Sometimes you just react — "whoa", "ohhh okay" — and a real child does that about a third of the time.
6. Never use a bullet point, a heading, or more than one sentence.`

/** What the model is told about your chain, as context and not as an instruction. Ruling 12. */
const context = (shapes: readonly Shape[]): string => {
  const lines: string[] = []
  for (const shape of shapes) {
    if (shape.kind === 'dangling') lines.push(`they mentioned "${say(shape.concept)}" but never said what it does`)
    if (shape.kind === 'rootless') lines.push(`they mentioned "${say(shape.concept)}" but never said what makes it happen`)
    if (shape.kind === 'unlinkedPair')
      lines.push(`"${say(shape.a)}" and "${say(shape.b)}" both lead to "${say(shape.via)}", but they never connected those two to each other`)
    if (shape.kind === 'conflict')
      lines.push(`they said "${say(shape.a.cause.quote)}" both causes and prevents "${say(shape.a.effect.quote)}"`)
  }
  if (lines.length === 0) return ''
  return `\n\nSome things you might have noticed, or might not. You do not have to use any of these:\n${lines.map(l => `- ${l}`).join('\n')}`
}

export async function speak(
  history: readonly Turn[],
  said: string,
  shapes: readonly Shape[],
  model: ModelHandle,
): Promise<Spoken> {
  const conversation = history
    .flatMap(turn => [`them: ${say(turn.you)}`, turn.child === '' ? [] : [`you: ${turn.child}`]].flat())
    .join('\n')

  const prompt = `${conversation === '' ? '' : `${conversation}\n`}them: ${say(said)}${context(shapes)}\n\nyou:`

  const line = await model.ask(SYSTEM, prompt)
  if (line === null) return { kind: 'silent', reason: 'no answer from the model' }

  // One line, always. A model that writes a paragraph is answering a different question, and the
  // fiction does not survive a child delivering three sentences with a preamble.
  const first = line.trim().split('\n').find(l => l.trim().length > 0)
  if (first === undefined) return { kind: 'silent', reason: 'the model returned nothing to say' }

  return { kind: 'said', line: first.trim() }
}
