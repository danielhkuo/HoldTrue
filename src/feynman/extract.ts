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
 * The prompt. Every rule in it exists because of a measured failure.
 *
 * Rule 1 is the paraphrase problem: a model asked to find something writes an answer in its
 * own words, and a reworded phrase has no position to anchor to, so it is a total loss here
 * even when its meaning is right. Rule 3 is extract.md example 2's mitigation for a phrase that
 * appears twice. Rule 5 pushes recall because the measured failure mode at this model size is
 * silence — 35.70% missing relations against 0.31% false positives. (Those numbers were stale
 * for part of 2026-08-16, pointing at rules 6 and 8, which is the numbering of a variant that was
 * reverted. Corrected.)
 *
 * **Rules 6 and 7 landed 2026-08-16, from a real session rather than a sample.** A user explained a
 * toilet in ordinary speech and Extract returned ZERO links on two of four turns:
 *
 *     "The flapper is holding back water"
 *     "I think it goes down and up into the toilet bowl then kind of fills the bowl with more water"
 *
 * The raw payload was `{"links":[]}` with `dropped: 0` on every run, which settles a question
 * nobody had asked: **the gate was innocent.** Nothing failed to anchor because nothing was
 * offered. It is a recall defect, and the two turns fail for different reasons — one clause each.
 * Rule 6 buys the second sentence, where hedges and a bare pronoun subject mask a real pair. Rule 7
 * buys the first, where the model does not count a stative verb as causal.
 *
 * Replicated independently before shipping, because two earlier prompt changes that day looked
 * good once and failed on re-run: two passes over all four live turns and one over the three
 * samples. Both zero-link turns recovered on both passes, the two turns that already worked were
 * unchanged, and the samples went 12 links to 13 with `dropped: 0` throughout. Gains only.
 *
 * **A schema limit this exposed, which no prompt reaches.** *"The flapper is holding back water"*
 * asserts `prevents`, but the thing prevented — water flowing out of the tank — is never spoken,
 * so the only effect available to copy verbatim is the bare noun *water*. Rule 1 forbids supplying
 * the missing words. The best this pipeline can emit is a verb tail pointing at a bare noun. People
 * state mechanisms as **states** rather than events all the time, and for that whole class the four
 * relations can represent only half of what was said. That is architectural and belongs in a
 * decision row, not a prompt rule.
 *
 * **A noun-phrase rewrite was tried three times on 2026-08-16 and is NOT shipped. Read this
 * before trying it a fourth time, because it looks like a clear win on every first number.**
 *
 * The defect is real and is still here. The model writes an effect as a VERB PHRASE and a cause as
 * a NOUN PHRASE, so consecutive links never share a string and a chain that closes perfectly looks
 * broken at every seam:
 *
 *     causes  "push the handle down" -> "pulls the chain"
 *     causes  "the chain"            -> "lifts the flapper"
 *
 * The candidate added *name a thing, never an action*, a chain framing, and a worked example whose
 * sentence yields three links.
 *
 * **What happened, in order, because the order is the lesson.**
 *
 *   1. Scored on join rate over three explanations, it looked decisive: endpoint joins 2/12 to
 *      7/17, shapes-per-link 1.17 to 0.76.
 *   2. Scored on a PLANTED GAP — author a chain, excise one link, check the deleted step is
 *      flagged, which is the one ground truth `decisions.md` permits — a near-identical variant
 *      collapsed to two links and found nothing. The join win had come from extracting LESS.
 *   3. The exact candidate then scored 2/2 planted gaps against the shipped prompt's 1/2, which
 *      looked like a genuine win and was applied.
 *   4. **One replication later it returned the identical three links for three different input
 *      texts**, put a false `dangling` on a control that closes, and found neither gap.
 *
 * Step 4 also names the likely mechanism: **the worked example carries three links and the model
 * emits three links whatever the sentence says.** The example anchors output length, which is a
 * recall failure — and recall is already where Extract fails, 35.70% missing relations against
 * 0.31% false positives.
 *
 * So the honest state is: no variant has beaten this prompt under replication, and every variant
 * that looked better was measured once. Judge the next one on planted-gap recall across several
 * passes, never on how tidy the panel looks.
 *
 * **What no prompt can fix, established alongside the above.** Within a sentence the noun-phrase
 * framing does join. Across a sentence boundary nothing can, because the speaker renames the thing
 * — *the tank water* becomes *the rushing water*, *carbon dioxide* becomes *that gas* becomes *the
 * trapped bubbles*. Rule 1 needs a verbatim span and the joining string is not in the later
 * sentence to copy. That is coreference. `cohere.md` ruling 11 forbids the non-transitive tests
 * that would close it downstream, and the obvious alternative — a canonical label the model
 * asserts beside the span — closed 3 of 7 such seams against 0 today, then merged a concept
 * appearing on both sides of one link and manufactured a chain the speaker never stated.
 *
 * All engineering counts on generated prose. Not measurements, and no figure here belongs in a
 * tracked file as one.
 */
export const SYSTEM = `You find cause-and-effect links inside ONE sentence a person said out loud while explaining how something works.

RULES:
1. Copy the EXACT words from the sentence. Never reword, shorten, correct or tidy anything. Your words must appear character for character in the sentence.
2. Copy whole words. Never start or end in the middle of a word.
3. If a phrase appears more than once in the sentence, copy enough surrounding words to make it unique.
4. relation is one of: causes, enables, prevents, requires.
5. Find every link in the sentence. Missing one is worse than being unsure.
6. People speak informally. Ignore hedges ("I think", "kind of", "maybe") and copy the words around them. A pronoun ("it", "that", "they") is a fine cause or effect — copy the pronoun exactly as it appears.
7. A state one thing holds another in — holding, blocking, keeping, sealing, stopping — is a link. Use prevents or requires.
8. If the sentence states no cause and effect, return an empty list.

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
