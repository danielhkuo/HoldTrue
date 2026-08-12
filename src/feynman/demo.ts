/**
 * The walking skeleton. Run it:
 *
 *     npm run demo                     -- the built-in explanation
 *     npm run demo -- path/to/file.txt -- your own
 *
 * A sentence at a time, the way the session actually works: you say something, the child
 * hears it, the child says one thing back. Extract calls your local model; everything after
 * it is arithmetic over your own words.
 *
 * What is still missing, and it is the half that matters: nothing closes what the child
 * opens. That is the review phase, and Law 1 says a session that ends on a question is a
 * worse failure than one that never asked. This ends on questions.
 */

import { readFileSync } from 'node:fs'
import { asDoc, cutSentences } from './extract.js'
import { validate, type Link } from './validate.js'
import { ollama } from './model.js'
import { cohere } from './cohere.js'
import { notice, keyOf, waitingOn, type NoticeState } from './notice.js'
import { voice } from './voice.js'

const SYSTEM = `You find cause-and-effect links inside ONE sentence a person said out loud while explaining how something works.

RULES:
1. Copy the EXACT words from the sentence. Never reword, shorten, correct or tidy anything. Your words must appear character for character in the sentence.
2. Copy whole words. Never start or end in the middle of a word.
3. If a phrase appears more than once in the sentence, copy enough surrounding words to make it unique.
4. relation is one of: causes, enables, prevents, requires.
5. Find every link in the sentence. Missing one is worse than being unsure.
6. If the sentence states no cause and effect, return an empty list.

Answer with JSON: {"links":[{"cause":"...","effect":"...","relation":"..."}]}`

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

const doc = asDoc(text)
const sentences = cutSentences(doc)

const all: Link[] = []
let state: NoticeState = { asked: new Set(), turn: 0 }
const started = Date.now()

for (const sentence of sentences) {
  const raw = await model.ask(SYSTEM, sentence.anchor.quote)
  const { links: fresh, dropped } = raw === null ? { links: [], dropped: 0 } : validate(sentence, raw)
  all.push(...fresh)

  const move = notice(
    { sentence: sentence.anchor.quote, fresh, all, shapes: cohere(all) },
    state,
  )

  console.log(`  ${dim('you')}    ${sentence.anchor.quote}`)
  console.log(`  ${dim('child')}  ${cyan(voice(move))}`)
  const note = [
    move.kind,
    `${fresh.length} link${fresh.length === 1 ? '' : 's'}`,
    dropped > 0 ? `${dropped} dropped` : null,
    move.kind === 'guess' ? amber('a plant — the review phase owes this one back') : null,
  ]
    .filter(Boolean)
    .join('  ·  ')
  console.log(`         ${dim(note)}\n`)

  const key = keyOf(move)
  const waiting = waitingOn(move)
  state = {
    asked: key === '' ? state.asked : new Set([...state.asked, key]),
    turn: state.turn + 1,
    lastKind: move.kind,
    ...(waiting === undefined ? {} : { waitingOn: waiting }),
  }
}

const took = ((Date.now() - started) / 1000).toFixed(1)
console.log(`${dim(`${sentences.length} sentences · ${all.length} links · ${took}s`)}`)
console.log(`${dim('nothing above was ever answered. that is the review phase, and it does not exist yet.')}\n`)
