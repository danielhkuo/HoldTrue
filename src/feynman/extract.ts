/**
 * Extract: your words, one sentence at a time, as a graph of what you said causes what.
 *
 * The first model call in the live phase, and since 2026-08-12 not the only one: the child's
 * line is a second, and this module runs again over that line for the audit. What stays true
 * is that your transcript is read once per sentence and never re-extracted to check itself.
 *
 * Contract, rulings and the failure mode: docs/specs/extract.md.
 *
 * SKELETON in two places, both marked below: the sentence splitter belongs in Transcribe's
 * adapter (ruling 3), and there is no eval harness yet.
 */

import { createHash } from 'node:crypto'
import { createAnchor, type Doc } from '../index/anchor.js'
import { validate, type Link, type Sentence } from './validate.js'
import type { ModelHandle } from './model.js'

/**
 * The prompt. Three of its six rules exist because of a measured failure.
 *
 * Rule 1 is the paraphrase problem: a model asked to find something writes an answer in its
 * own words, and a reworded phrase has no position to anchor to, so it is a total loss here
 * even when its meaning is right. Rule 3 is ruling 2's mitigation for a phrase that appears
 * twice. Rule 5 pushes recall because the measured failure mode at this model size is
 * silence — 35.70% missing relations against 0.31% false positives.
 */
export const SYSTEM = `You find cause-and-effect links inside ONE sentence a person said out loud while explaining how something works.

RULES:
1. Copy the EXACT words from the sentence. Never reword, shorten, correct or tidy anything. Your words must appear character for character in the sentence.
2. Copy whole words. Never start or end in the middle of a word.
3. If a phrase appears more than once in the sentence, copy enough surrounding words to make it unique.
4. relation is one of: causes, enables, prevents, requires.
5. Find every link in the sentence. Missing one is worse than being unsure.
6. If the sentence states no cause and effect, return an empty list.

Answer with JSON: {"links":[{"cause":"...","effect":"...","relation":"..."}]}`

/**
 * The shape the extraction prompt above promises. Exported beside the prompt it restates, because
 * the two are one fact: change the JSON line in the prompt and this must change with it. It lived
 * in `model.ts` until 2026-08-12, where it was applied to every call including the child's.
 */
export const LINK_SCHEMA = {
  type: 'object',
  properties: {
    links: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          cause: { type: 'string' },
          effect: { type: 'string' },
          relation: { type: 'string', enum: ['causes', 'enables', 'prevents', 'requires'] },
        },
        required: ['cause', 'effect', 'relation'],
      },
    },
  },
  required: ['links'],
} as const

export type Extraction = {
  readonly doc: Doc
  readonly links: readonly Link[]
  readonly sentences: readonly Sentence[]
}

export type ExtractResult =
  | { readonly kind: 'extraction'; readonly extraction: Extraction }
  | { readonly kind: 'unavailable'; readonly reason: string }

export const asDoc = (text: string): Doc => ({
  doc_id: createHash('sha256').update(text, 'utf8').digest('hex').slice(0, 16),
  unit_id: 'transcript',
  text,
})

/**
 * SKELETON. Ruling 3 moved sentence-finding into Transcribe, behind an adapter that knows
 * which speech engine ran, because every signal a general splitter could use is that
 * engine's artifact. This one assumes typed text with ordinary punctuation, which is true of
 * the demo and of nothing else. Do not carry it into the product.
 */
export const cutSentences = (doc: Doc): readonly Sentence[] => {
  const out: Sentence[] = []
  const pattern = /[^.!?]+[.!?]*/g
  for (const match of doc.text.matchAll(pattern)) {
    const raw = match[0]
    const lead = raw.length - raw.trimStart().length
    const start = match.index + lead
    const end = start + raw.trim().length
    if (end <= start) continue
    const anchor = createAnchor(doc, start, end)
    if (anchor !== null) out.push({ anchor, dropped: 0 })
  }
  return out
}

/** Total. A model that is unreachable is a result, never a throw. Ruling 6. */
export async function extract(text: string, model: ModelHandle): Promise<ExtractResult> {
  const doc = asDoc(text)
  const cut = cutSentences(doc)
  if (cut.length === 0) return { kind: 'unavailable', reason: 'nothing to read' }

  const answered = await Promise.all(cut.map(s => model.ask(SYSTEM, s.anchor.quote, LINK_SCHEMA)))
  if (answered.every(a => a === null)) {
    return { kind: 'unavailable', reason: `no answer from the model at ${(await model.identify()).runtime}` }
  }

  const links: Link[] = []
  const sentences: Sentence[] = []
  for (const [i, sentence] of cut.entries()) {
    const raw = answered[i]
    const result = raw === null ? { links: [], dropped: 0 } : validate(sentence, raw)
    links.push(...result.links)
    sentences.push({ anchor: sentence.anchor, dropped: result.dropped })
  }

  return { kind: 'extraction', extraction: { doc, links, sentences } }
}
