/**
 * Session: the live loop, held as state instead of printed to a terminal.
 *
 * SKELETON, and the build order says so — Session is entry 6, "last, always", because it composes
 * pieces that are not finished. This exists so there is something to look at, and it is honest
 * about what it is standing on:
 *
 *   - `cohere` is demo-grade. No test file, no oracle, no mutation run. Its own header says so.
 *   - `speak` is demo-grade on the same terms.
 *   - Nothing closes what the child opens. The ledger is a work list for a review phase that does
 *     not exist, and Law 1 calls a session ending on a question a worse failure than one that never
 *     asked. This ends on questions.
 *   - Supersession is unimplemented, so a turn you retract keeps resolving. `decisions.md`'s
 *     *The `Doc` is the turn* lists that as the silent, Law 1-direction cost.
 *
 * The turn logic is lifted from `demo.ts` unchanged, deliberately: two copies that drift is how
 * this repo has been bitten before, and the next move is `demo.ts` calling this rather than a
 * third copy appearing.
 */

import { asDoc, cutSentences, SYSTEM, LINK_SCHEMA } from '../feynman/extract.js'
import { validate, type Link, type Sentence } from '../feynman/validate.js'
import type { ModelHandle } from '../feynman/model.js'
import { cohere, type Shape } from '../feynman/cohere.js'
import { speak } from '../feynman/speak.js'
import { tallyIntroduced, turn, type Introduced, type Turn } from '../feynman/tally.js'

export type TurnReport = {
  readonly you: string
  readonly child: string
  readonly links: number
  readonly dropped: number
  readonly shapes: readonly Shape[]
  readonly introduced: readonly Introduced[]
  readonly seconds: number
}

/** Extract over one line, minted as its own `Doc`. Same shape `demo.ts` uses. */
const read = async (line: string, model: ModelHandle) => {
  const doc = asDoc(line)
  const cut = cutSentences(doc)
  if (cut.length === 0) {
    return { result: { kind: 'unavailable' as const, reason: 'nothing to read' }, links: [], dropped: 0, sentences: [] }
  }
  const answered = await Promise.all(cut.map(s => model.ask(SYSTEM, s.anchor.quote, LINK_SCHEMA)))
  if (answered.every(a => a === null)) {
    return {
      result: { kind: 'unavailable' as const, reason: 'no answer from the model' },
      links: [],
      dropped: 0,
      sentences: [],
    }
  }
  const links: Link[] = []
  let dropped = 0
  for (const [i, sentence] of cut.entries()) {
    const raw = answered[i]
    const outcome = raw === null ? { links: [], dropped: 0 } : validate(sentence, raw)
    links.push(...outcome.links)
    dropped += outcome.dropped
  }
  return {
    result: { kind: 'extraction' as const, extraction: { doc, links, sentences: cut } },
    links,
    dropped,
    sentences: cut,
  }
}

export class Session {
  readonly #model: ModelHandle
  readonly #graph: Link[] = []
  readonly #sentences: Sentence[] = []
  readonly #history: Turn[] = []
  readonly #ledger: { readonly turn: number; readonly item: Introduced }[] = []
  #said: string[] = []

  constructor(model: ModelHandle) {
    this.#model = model
  }

  get ledger(): readonly { readonly turn: number; readonly item: Introduced }[] {
    return this.#ledger
  }

  get graphSize(): number {
    return this.#graph.length
  }

  /**
   * One turn. Three model calls: your sentence, the child's line, then your reading of the
   * child's line for the audit.
   *
   * An empty submission is refused here rather than passed down, because `extract` maps it to
   * `unavailable: 'nothing to read'` and the tally logs that as `unread` — a note saying the model
   * could not read a turn it was never asked to read. That overload is recorded in `decisions.md`
   * and is not fixed here; this only avoids provoking it.
   */
  async take(line: string): Promise<TurnReport> {
    const you = line.trim()
    if (you === '') throw new Error('nothing said')

    const started = Date.now()
    const mine = await read(you, this.#model)
    this.#graph.push(...mine.links)
    this.#sentences.push(...mine.sentences)

    const shapes = cohere(this.#graph, this.#sentences)
    const said = await speak(this.#history, you, shapes, this.#model)

    this.#said.push(you)
    const transcript = this.#said.join(' ')

    const introduced =
      said.kind === 'said'
        ? tallyIntroduced(said.line, (await read(said.line, this.#model)).result, this.#graph, transcript)
        : []

    const built = turn(you, said, introduced)
    this.#history.push(built)
    const n = this.#history.length
    for (const item of introduced) this.#ledger.push({ turn: n, item })

    return {
      you,
      child: built.child,
      links: mine.links.length,
      dropped: mine.dropped,
      shapes,
      introduced,
      seconds: (Date.now() - started) / 1000,
    }
  }
}
