/**
 * The rig: two models talk, and nothing is judged.
 *
 *     npm run rig                 -- the built-in subject
 *     npm run rig -- "a bicycle brake" 8
 *
 * One model plays somebody explaining a mechanism out loud from memory. `speak` plays the child.
 * They go back and forth, and the real loop runs underneath exactly as it does in `demo.ts`.
 *
 * WHAT THIS IS FOR. Every test until now cost the owner writing an explanation by hand, which is why
 * `measurements/within-sentence/explanations/` still holds nothing but a `.gitkeep`. This runs fifty
 * sessions overnight and finds the things volume finds: crashes, repetition loops, a child that
 * drifts, a ledger that fills with noise, latency, and a prompt that regressed.
 *
 * WHAT IT IS NOT, AND THIS IS THE WHOLE OF WHY IT IS ALLOWED TO EXIST.
 *
 * It emits **engineering counts and nothing else**. No rate. No precision figure. No score. In
 * particular it must never be used to run the false-question rate or the four kill numbers in
 * `measurements/within-sentence/README.md`: those numbers were guessed blind and are **spent the
 * first time they are used**, and a model writing clean prose engineers out the very condition that
 * produces a false question. A rate off this rig would fall for reasons that say nothing about
 * Cohere.
 *
 * The explainer here has no misconceptions, no disfluency, no self-repair and no rambling. It is not
 * a person and the numbers below are not about people. `docs/transcripts/README.md` says the same
 * thing about its own generated material — and `docs/decisions.md` then argued a constitutional
 * reversal from it anyway, twice. That is why this comment is long.
 *
 * Decided 2026-08-12 by a council; the row is in `docs/decisions.md`.
 */

import { asDoc, cutSentences, type ExtractResult } from './extract.js'
import { validate, type Link } from './validate.js'
import { ollama, type ModelHandle } from './model.js'
import { cohere, type Shape } from './cohere.js'
import { speak } from './speak.js'
import { tallyIntroduced, turn, type Introduced, type Turn } from './tally.js'

const EXTRACT_SYSTEM = `You find cause-and-effect links inside ONE sentence a person said out loud while explaining how something works.

RULES:
1. Copy the EXACT words from the sentence. Never reword, shorten, correct or tidy anything. Your words must appear character for character in the sentence.
2. Copy whole words. Never start or end in the middle of a word.
3. If a phrase appears more than once in the sentence, copy enough surrounding words to make it unique.
4. relation is one of: causes, enables, prevents, requires.
5. Find every link in the sentence. Missing one is worse than being unsure.
6. If the sentence states no cause and effect, return an empty list.

Answer with JSON: {"links":[{"cause":"...","effect":"...","relation":"..."}]}`

/**
 * The explainer. Deliberately NOT told to hesitate, ramble or make mistakes.
 *
 * Faking disfluency would produce written disfluency, which is a different thing from the real kind
 * and would make the rig look more like a person than it is. Better that it reads as obviously
 * synthetic, so nobody mistakes a run for a session.
 */
const EXPLAINER = (subject: string) => `You are explaining how ${subject} works, out loud, to a curious 10-year-old. You are going from memory and you are not looking anything up.

RULES:
1. One or two sentences per turn. Never more.
2. Plain spoken English. "so when you...", "and that makes...".
3. If the child asks something, answer it and carry on.
4. Never use a bullet point, a heading, or a numbered list.
5. Stop when you have explained the whole mechanism.`

const dim = (s: string) => `\x1b[2m${s}\x1b[0m`
const cyan = (s: string) => `\x1b[36m${s}\x1b[0m`

const subject = process.argv[2] ?? 'a bicycle brake'
const maxTurns = Number(process.argv[3] ?? 6)

const model: ModelHandle = ollama()
const who = await model.identify()
console.log(`\n${dim(`${who.model_id} · ${who.runtime} · rig, not an instrument`)}\n`)

const read = async (line: string): Promise<{ result: ExtractResult; links: readonly Link[] }> => {
  const doc = asDoc(line)
  const cut = cutSentences(doc)
  if (cut.length === 0) return { result: { kind: 'unavailable', reason: 'nothing to read' }, links: [] }
  const answered = await Promise.all(cut.map(s => model.ask(EXTRACT_SYSTEM, s.anchor.quote)))
  if (answered.every(a => a === null)) {
    return { result: { kind: 'unavailable', reason: 'no answer from the model' }, links: [] }
  }
  const links: Link[] = []
  for (const [i, sentence] of cut.entries()) {
    const raw = answered[i]
    if (raw !== null) links.push(...validate(sentence, raw).links)
  }
  return { result: { kind: 'extraction', extraction: { doc, links, sentences: cut } }, links }
}

const graph: Link[] = []
const history: Turn[] = []
const items: Introduced[] = []
const shapeKinds = new Map<Shape['kind'], number>()
const childLines: string[] = []
let sentencesSeen = 0
let silent = 0
let unreadable = 0

const started = Date.now()

for (let n = 0; n < maxTurns; n++) {
  const conversation = history
    .flatMap(t => [`you: ${t.you}`, t.child === '' ? [] : [`child: ${t.child}`]].flat())
    .join('\n')
  const said = await model.ask(EXPLAINER(subject), `${conversation}\nyou:`)
  if (said === null) break
  const you = said.trim().split('\n').filter(l => l.trim().length > 0).join(' ').trim()
  if (you === '') break

  const mine = await read(you)
  graph.push(...mine.links)
  sentencesSeen += cutSentences(asDoc(you)).length

  const shapes = cohere({ doc: asDoc(you), links: graph, sentences: cutSentences(asDoc(you)) })
  for (const shape of shapes) shapeKinds.set(shape.kind, (shapeKinds.get(shape.kind) ?? 0) + 1)

  const spoken = await speak(history, you, shapes, model)
  const transcript = [...history.map(t => t.you), you].join(' ')
  const introduced = spoken.kind === 'said' ? tallyIntroduced(spoken.line, (await read(spoken.line)).result, graph, transcript) : []

  const built = turn(you, spoken, introduced)
  history.push(built)
  items.push(...introduced)
  if (built.child === '') silent++
  else childLines.push(built.child.toLowerCase().trim())
  unreadable += introduced.filter(i => i.kind === 'unread').length

  console.log(`  ${dim('them')}   ${you}`)
  console.log(`  ${dim('child')}  ${cyan(built.child === '' ? '(silent)' : built.child)}`)
  console.log(`         ${dim(`${mine.links.length} links · ${shapes.length} shapes · ${introduced.length} introduced`)}\n`)
}

const took = (Date.now() - started) / 1000
const repeats = childLines.length - new Set(childLines).size

console.log(dim('── counts, and they are counts ' + '─'.repeat(30)) + '\n')
console.log(`  turns                  ${history.length}`)
console.log(`  your sentences         ${sentencesSeen}`)
console.log(`  links extracted        ${graph.length}`)
console.log(`  links per sentence     ${sentencesSeen === 0 ? '—' : (graph.length / sentencesSeen).toFixed(2)}`)
console.log(`  shapes by kind         ${[...shapeKinds].map(([k, v]) => `${k} ${v}`).join(', ') || 'none'}`)
console.log(`  ledger debts           ${items.filter(i => i.kind === 'link').length}`)
console.log(`  ledger notes           ${items.filter(i => i.kind === 'word').length}`)
console.log(`  turns the tally could not read  ${unreadable}`)
console.log(`  child repeated itself  ${repeats}`)
console.log(`  child said nothing     ${silent}`)
console.log(`  seconds per turn       ${history.length === 0 ? '—' : (took / history.length).toFixed(1)}`)

console.log(
  `\n${dim('These are engineering counts about a machine talking to itself. They are not a rate, not a')}` +
    `\n${dim('score, and not evidence about anybody. The explainer above has no misconceptions and no')}` +
    `\n${dim('disfluency, so nothing here stands in for the falsification week.')}\n`,
)
