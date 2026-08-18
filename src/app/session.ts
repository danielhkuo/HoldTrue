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
import { tallyIntroduced, turn, type Debt, type Introduced, type Turn } from '../feynman/tally.js'
import { settle, type Settled } from '../feynman/supply.js'
import { contradict, type Checked } from '../feynman/contradict.js'

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

  readonly #topic: string

  constructor(model: ModelHandle, topic: string) {
    this.#model = model
    this.#topic = topic
  }

  /**
   * Step 5 of the review, for real: every debt the child opened, checked against model knowledge.
   *
   * One model call per debt, in parallel — `settle` is stateless by design, so there is no order
   * to preserve. Nothing is dropped: a debt that could not be settled comes back `unsettled` and
   * stays open, because dropping it would be silence about something the child introduced.
   *
   * This does NOT close the ledger. `child-speech.md` ruling 10 gives the row and its `closed`
   * predicate to Session-the-piece, which is unbuilt; what this returns is the answer a closure
   * would need, presented to the user so they can close it themselves.
   */
  /**
   * Step 4 of the review: every link YOU stated, checked against model knowledge.
   *
   * **Runs before `settleDebts` at every call site, and that ordering is a decided row rather than
   * a preference.** `decisions.md`'s *Contradiction is a distinct finding from omission* says
   * contradiction is checked first, "because being told about a skipped step is strange if the
   * surrounding explanation is mistaken."
   *
   * One model call per link, in parallel — `contradict` is stateless. No latency budget here; the
   * review runs after the talking stops.
   */
  async checkClaims(): Promise<readonly Checked[]> {
    return Promise.all(this.#graph.map(l => contradict(l, this.#topic, this.#model)))
  }

  async settleDebts(): Promise<readonly Settled[]> {
    const debts = this.#ledger.filter(r => r.item.kind === 'link').map(r => r.item as Debt)
    return Promise.all(debts.map(d => settle(d, this.#topic, this.#model)))
  }

  get ledger(): readonly { readonly turn: number; readonly item: Introduced }[] {
    return this.#ledger
  }

  get graphSize(): number {
    return this.#graph.length
  }

  get turns(): number {
    return this.#history.length
  }

  /**
   * What the review phase is handed. **Not the review phase.**
   *
   * `features/feynman.md` numbers the review 4 to 8. **Corrected 2026-08-16 — this comment
   * contradicted the file it sits in.** It said steps 4 and 5 were both unbuilt and frozen while
   * `settle` was imported at the top of this same file. What is true now:
   *
   *   - **Step 5's debt half is built.** `settleDebts` below checks every proposition the child
   *     introduced. Ruling 7 was ruled spent on 2026-08-16.
   *   - **Step 5's omission half is not, and the ruling did not reassign it.** *Where the mechanism
   *     connects something you did not* — a gap the user never mentioned at all — is still named as
   *     Supply's job in `features/feynman.md` and in `decisions.md`'s build order. Nothing produces
   *     it. Calling ruling 7 spent renamed past that rather than answering it.
   *   - **Step 4 is genuinely unbuilt.** Contradict, *where the subject says otherwise about what
   *     YOU said*, has no spec and no code. Nothing here checks the user's own claims.
   *
   * So this returns the bookkeeping, and `settleDebts` returns the one finding that exists.
   *
   * What is genuinely here is bookkeeping that already exists: the links you stated, the shapes
   * still standing at the end, and every debt the child opened. Law 1 wants those closed. Nothing
   * closes them.
   */
  review() {
    return {
      transcript: this.#said.join(' '),
      turns: this.#history.length,
      links: this.#graph.map(l => ({
        cause: l.cause.quote,
        relation: l.relation,
        effect: l.effect.quote,
      })),
      standing: cohere(this.#graph, this.#sentences),
      ledger: this.#ledger,
    }
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
