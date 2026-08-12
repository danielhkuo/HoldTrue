/**
 * The walking skeleton. Run it:
 *
 *     npm run demo                     -- the built-in explanation
 *     npm run demo -- path/to/file.txt -- your own
 *
 * Explain something out loud in writing, and hear what the child asks. Extract calls your
 * local model; everything after it is arithmetic over your own words.
 *
 * What is missing, and it is the important half: nothing closes what the child opens. That
 * is the review phase — Supply and Contradict — and Law 1 says a session that ends on a
 * question is a worse failure than one that never asked. This ends on questions.
 */

import { readFileSync } from 'node:fs'
import { extract } from './extract.js'
import { ollama } from './model.js'
import { cohere } from './cohere.js'
import { notice, keyOf, type NoticeState } from './notice.js'
import { voice } from './voice.js'

const DEFAULT = [
  'when you push the handle down that pulls the chain and the chain lifts the flapper.',
  'the flapper lifting lets the tank water rush into the bowl.',
  'the rushing water pushes everything over the siphon.',
  'the siphon pulls the rest of the water along.',
  'then the fill valve refills the tank.',
].join(' ')

const dim = (s: string) => `\x1b[2m${s}\x1b[0m`
const cyan = (s: string) => `\x1b[36m${s}\x1b[0m`
const amber = (s: string) => `\x1b[33m${s}\x1b[0m`
const rule = (label: string) => console.log(`\n${dim(`── ${label} ${'─'.repeat(Math.max(0, 52 - label.length))}`)}\n`)

const path = process.argv[2]
const text = path === undefined ? DEFAULT : readFileSync(path, 'utf8').trim()

const model = ollama()
const who = await model.identify()

rule('you said')
console.log(`  ${text.replace(/\.\s+/g, '.\n  ')}`)

rule('reading it')
console.log(`  ${dim(`${who.model_id}  ·  ${who.runtime}  ·  ${who.calibration}`)}`)

const started = Date.now()
const result = await extract(text, model)
const took = ((Date.now() - started) / 1000).toFixed(1)

if (result.kind === 'unavailable') {
  console.log(`\n  ${amber(`the model did not answer: ${result.reason}`)}\n`)
  process.exit(1)
}

const { links, sentences } = result.extraction
const dropped = sentences.reduce((n, s) => n + s.dropped, 0)
console.log(
  `  ${dim(`${sentences.length} sentences · ${links.length} links kept · ${dropped} dropped · ${took}s`)}`,
)

rule('what it heard you say')
if (links.length === 0) console.log(`  ${amber('nothing. every link was dropped or never found.')}`)
for (const link of links) {
  console.log(`  ${link.cause.quote}  ${dim(`—${link.relation}→`)}  ${link.effect.quote}`)
}

const shapes = cohere(links)
rule('where your chain does not close')
if (shapes.length === 0) console.log(`  ${dim('nothing. the chain closes.')}`)
for (const shape of shapes) {
  const detail =
    shape.kind === 'unlinkedPair'
      ? `${shape.a}  /  ${shape.b}`
      : shape.kind === 'conflict'
        ? `${shape.a.cause.quote} → ${shape.a.effect.quote}`
        : shape.concept
  console.log(`  ${dim(shape.kind.padEnd(13))} ${detail}`)
}

rule('what the child says')
let state: NoticeState = {
  asked: new Set(),
  droppedOn: sentences.filter(s => s.dropped > 0).map(s => s.anchor.quote),
  turn: 0,
}
for (let turn = 0; turn < 8; turn++) {
  const move = notice(links, shapes, state)
  console.log(`  ${cyan(voice(move))}`)
  const tag = move.kind === 'guess' ? `${move.kind}  ${amber('← a plant. the review phase owes this one back')}` : move.kind
  console.log(`  ${dim(tag)}\n`)
  if (move.kind === 'on') break
  state = { ...state, asked: new Set([...state.asked, keyOf(move)]), lastKind: move.kind, turn: turn + 1 }
}

rule('what is missing')
console.log(`  ${dim('Supply    the review phase, where the model says what you actually skipped')}`)
console.log(`  ${dim('the close every question above is opened and never answered. Law 1 forbids that.')}`)
console.log()
