/**
 * The walking skeleton. Run it:
 *
 *     npm run demo                     -- the built-in explanation
 *     npm run demo -- path/to/file.txt -- your own
 *
 * A sentence at a time, the way the session actually works. You say something; Extract reads it;
 * Cohere finds where your chain does not close; a model says one line as the child; then Extract
 * runs again over that line and the tally writes down anything the child said that you did not.
 *
 * Three model calls per turn. Everything between them is arithmetic.
 *
 * What is still missing, and it is the half that matters: **nothing closes what the child opens.**
 * The ledger it prints at the end is a work list for a review phase that does not exist, and Law 1
 * says a session that ends on a question is a worse failure than one that never asked. This ends on
 * questions, and now it also ends on a list of them.
 */

import { readFileSync } from 'node:fs'
import { asDoc, cutSentences, SYSTEM, LINK_SCHEMA, type ExtractResult } from './extract.js'
import { validate, type Link } from './validate.js'
import { ollama } from './model.js'
import { cohere } from './cohere.js'
import { speak } from './speak.js'
import { tallyIntroduced, turn, type Introduced, type Turn } from './tally.js'

const DEFAULT = [
  'when you push the handle down that pulls the chain and the chain lifts the flapper.',
  'the flapper lifting lets the tank water rush into the bowl.',
  'the rushing water pushes everything over the siphon and once it goes over the top it pulls the rest along.',
  'a toilet uses about thousands of gallons a year which is kind of a lot.',
  'then the fill valve refills the tank.',
].join(' ')

const dim = (s: string) => `\x1b[2m${s}\x1b[0m`
const cyan = (s: string) => `\x1b[36m${s}\x1b[0m`
const amber = (s: string) => `\x1b[33m${s}\x1b[0m`

const path = process.argv[2]
const text = path === undefined ? DEFAULT : readFileSync(path, 'utf8').trim()

const model = ollama()
const who = await model.identify()
console.log(`\n${dim(`${who.model_id} · ${who.runtime} · ${who.calibration}`)}\n`)

/** Extract over one line, minted as its own document. Returns exactly what the tally consumes. */
const read = async (line: string): Promise<{ result: ExtractResult; links: readonly Link[]; dropped: number }> => {
  const doc = asDoc(line)
  const cut = cutSentences(doc)
  if (cut.length === 0) {
    return { result: { kind: 'unavailable', reason: 'nothing to read' }, links: [], dropped: 0 }
  }
  const answered = await Promise.all(cut.map(s => model.ask(SYSTEM, s.anchor.quote, LINK_SCHEMA)))
  if (answered.every(a => a === null)) {
    return { result: { kind: 'unavailable', reason: 'no answer from the model' }, links: [], dropped: 0 }
  }
  const links: Link[] = []
  let dropped = 0
  for (const [i, sentence] of cut.entries()) {
    const raw = answered[i]
    const outcome = raw === null ? { links: [], dropped: 0 } : validate(sentence, raw)
    links.push(...outcome.links)
    dropped += outcome.dropped
  }
  return { result: { kind: 'extraction', extraction: { doc, links, sentences: cut } }, links, dropped }
}

const graph: Link[] = []
const history: Turn[] = []
const ledger: { readonly turn: number; readonly item: Introduced }[] = []
const spoken = asDoc(text)
const yourSentences = cutSentences(spoken)
const started = Date.now()

for (const [i, sentence] of yourSentences.entries()) {
  const you = sentence.anchor.quote
  const mine = await read(you)
  graph.push(...mine.links)

  // Links from every turn so far, and only the sentences actually spoken so far. It used to
  // hand Cohere a `doc` of the whole explanation beside links minted per sentence, so an anchor
  // from sentence 2 resolved against sentence 1 rather than failing — an aliased resolve, which
  // is worse than a null. Found by review, 2026-08-12.
  const shapes = cohere(graph, yourSentences.slice(0, i + 1))
  const said = await speak(history, you, shapes, model)

  const transcript = yourSentences
    .slice(0, i + 1)
    .map(s => s.anchor.quote)
    .join(' ')

  const introduced =
    said.kind === 'said' ? tallyIntroduced(said.line, (await read(said.line)).result, graph, transcript) : []

  const built = turn(you, said, introduced)
  history.push(built)
  for (const item of introduced) ledger.push({ turn: i + 1, item })

  console.log(`  ${dim('you')}    ${you}`)
  console.log(`  ${dim('child')}  ${cyan(built.child === '' ? '(silent)' : built.child)}`)

  const note = [
    `${mine.links.length} link${mine.links.length === 1 ? '' : 's'}`,
    `${shapes.length} shape${shapes.length === 1 ? '' : 's'}`,
    mine.dropped > 0 ? `${mine.dropped} dropped` : null,
    introduced.length > 0 ? amber(`${introduced.length} introduced`) : null,
  ]
    .filter(Boolean)
    .join('  ·  ')
  console.log(`         ${dim(note)}\n`)
}

const took = ((Date.now() - started) / 1000).toFixed(1)
console.log(dim(`${yourSentences.length} sentences · ${graph.length} links · ${took}s`))

console.log(`\n${dim('── the ledger ' + '─'.repeat(46))}\n`)
if (ledger.length === 0) {
  console.log(`  ${dim('the child introduced nothing. everything it said, you said first.')}`)
}
for (const { turn: n, item } of ledger) {
  if (item.kind === 'link') {
    console.log(`  ${amber('debt')}  turn ${n}  ${item.cause} ${dim(`—${item.relation}→`)} ${item.effect}`)
  }
  if (item.kind === 'word') {
    console.log(`  ${dim('note')}  turn ${n}  "${item.word}"${item.within === undefined ? '' : dim(` (inside "${item.within}")`)}`)
  }
  if (item.kind === 'unread') {
    console.log(`  ${amber('unread')} turn ${n}  ${item.reason}`)
  }
}

const debts = ledger.filter(r => r.item.kind === 'link').length
console.log(
  `\n${dim(`${debts} debt${debts === 1 ? '' : 's'} open. nothing closes them — that is the review phase, and it does not exist yet.`)}\n`,
)
