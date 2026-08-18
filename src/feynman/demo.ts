/**
 * The walking skeleton, in a terminal. Run it:
 *
 *     npm run demo                     -- the built-in explanation
 *     npm run demo -- path/to/file.txt -- your own
 *
 * A sentence at a time, the way the session actually works. You say something; Extract reads it;
 * Cohere finds where your chain does not close; a model says one line as the child; then Extract
 * runs again over the child's line and the tally writes down anything the child said that you did
 * not.
 *
 * **This file is a PRINTER and nothing else, as of 2026-08-16.** The loop lives in `session.ts` and
 * is shared with `rig.ts` and the app. It used to hold its own copy — three copies existed, each
 * with its own `read` helper — and they drifted: the app learned to separate debts from notes and
 * to deduplicate, and this file did not, so the terminal kept showing a ledger of function words
 * long after the app had stopped. One loop, three printers.
 *
 * The review phase is not printed here. It exists — `npm run app` runs steps 4 through 8 — and a
 * terminal is the wrong shape for a probe you are meant to answer before the correction appears.
 */

import { readFileSync } from 'node:fs'
import { asDoc, cutSentences } from './extract.js'
import { ollama } from './model.js'
import { Session } from './session.js'

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

const session = new Session(model, 'how something works')
const sentences = cutSentences(asDoc(text))
const started = Date.now()

for (const sentence of sentences) {
  const report = await session.take(sentence.anchor.quote)

  console.log(`  ${dim('you')}    ${report.you}`)
  console.log(`  ${dim('child')}  ${cyan(report.child === '' ? '(silent)' : report.child)}`)

  const debts = report.introduced.filter(i => i.kind === 'link').length
  const note = [
    `${report.links} link${report.links === 1 ? '' : 's'}`,
    `${report.shapes.length} shape${report.shapes.length === 1 ? '' : 's'}`,
    report.dropped > 0 ? `${report.dropped} dropped` : null,
    debts > 0 ? amber(`${debts} asserted`) : null,
    `${report.seconds.toFixed(1)}s`,
  ]
    .filter(Boolean)
    .join('  ·  ')
  console.log(`         ${dim(note)}\n`)
}

const took = ((Date.now() - started) / 1000).toFixed(1)
console.log(dim(`${sentences.length} sentences · ${session.graphSize} links · ${took}s`))

/**
 * Debts and notes are printed apart, because they are not the same kind of thing and printing them
 * together is what made this look like nonsense.
 *
 * A **debt** is a causal claim the child asserted that you never said. Supply can settle it and the
 * review owes a closure on it. A **note** is a content word the child used that you did not: a
 * cheaper second check that catches a concept arriving without a link Extract could read. Nothing
 * settles a note and nothing ever will, so it is not owed and must not be listed as though it were.
 */
console.log(`\n${dim('── the ledger ' + '─'.repeat(46))}\n`)

const debts = session.ledger.filter(r => r.item.kind === 'link')
const notes = session.ledger.filter(r => r.item.kind === 'word')
const unread = session.ledger.filter(r => r.item.kind === 'unread')

if (debts.length === 0) {
  console.log(`  ${dim('the child asserted nothing you had not said. no debts.')}`)
}
for (const { turn: n, item } of debts) {
  if (item.kind !== 'link') continue
  console.log(`  ${amber('debt')}  turn ${n}  ${item.cause} ${dim(`—${item.relation}→`)} ${item.effect}`)
}

// Deduplicated. The tally reads one line at a time against your transcript, and your transcript
// never gains the child's words, so a word it likes recurs every turn it uses it. Fifteen rows of
// "lost" is the tally working correctly and the printer working badly.
const seen = new Set<string>()
const distinct: string[] = []
for (const { item } of notes) {
  if (item.kind !== 'word' || seen.has(item.word)) continue
  seen.add(item.word)
  distinct.push(item.word)
}
if (distinct.length > 0) {
  console.log(`\n  ${dim(`words it used that you did not (${distinct.length}, nothing is owed on these):`)}`)
  console.log(`  ${dim(distinct.join(', '))}`)
}

for (const { turn: n, item } of unread) {
  if (item.kind !== 'unread') continue
  console.log(`  ${amber('unread')} turn ${n}  ${item.reason}`)
}

console.log(
  `\n${dim(`${debts.length} debt${debts.length === 1 ? '' : 's'} open. \`npm run app\` runs the review that closes them.`)}\n`,
)
