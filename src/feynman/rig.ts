/**
 * The rig: two models talk, and nothing is judged.
 *
 *     npm run rig                 -- the built-in subject
 *     npm run rig -- "a bicycle brake" 8
 *
 * One model plays somebody explaining a mechanism out loud from memory. `speak` plays the child.
 * They go back and forth, and the real loop runs underneath exactly as it does in `demo.ts` and in
 * the app — literally the same loop as of 2026-08-16, since all three now drive `session.ts`
 * rather than each keeping a copy.
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

import { ollama, type ModelHandle } from './model.js'
import { Session } from './session.js'

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

const session = new Session(model, subject)
const shapeKinds = new Map<string, number>()
const childLines: string[] = []
const spoken: { you: string; child: string }[] = []
let sentences = 0
let silent = 0
let unreadable = 0
let dropped = 0

const started = Date.now()

for (let n = 0; n < maxTurns; n++) {
  const conversation = spoken
    .flatMap(t => [`you: ${t.you}`, ...(t.child === '' ? [] : [`child: ${t.child}`])])
    .join('\n')
  const said = await model.ask(EXPLAINER(subject), `${conversation}\nyou:`)
  if (said === null) break
  const you = said.trim().split('\n').filter(l => l.trim().length > 0).join(' ').trim()
  if (you === '') break

  const report = await session.take(you)

  for (const shape of report.shapes) shapeKinds.set(shape.kind, (shapeKinds.get(shape.kind) ?? 0) + 1)
  unreadable += report.introduced.filter(i => i.kind === 'unread').length
  dropped += report.dropped
  sentences += you.split(/(?<=[.!?])\s+/).filter(s => s.trim() !== '').length
  spoken.push({ you: report.you, child: report.child })
  if (report.child === '') silent++
  else childLines.push(report.child.toLowerCase().trim())

  console.log(`  ${dim('them')}   ${report.you}`)
  console.log(`  ${dim('child')}  ${cyan(report.child === '' ? '(silent)' : report.child)}`)
  console.log(
    `         ${dim(`${report.links} links · ${report.shapes.length} shapes · ${report.introduced.length} introduced`)}\n`,
  )
}

const took = (Date.now() - started) / 1000
const repeats = childLines.length - new Set(childLines).size

// The distinction this rig exists to watch, split out because they are not the same thing: a debt
// is a causal claim the child asserted and the review owes a closure on, a note is a word it used
// that nothing settles. If debts stay at zero across long runs, the child is asking and never
// asserting, and the machinery guarding assertions is guarding something that is not happening.
const debts = session.ledger.filter(r => r.item.kind === 'link').length
const notes = session.ledger.filter(r => r.item.kind === 'word')
const distinctNotes = new Set(notes.map(r => (r.item as { word: string }).word)).size

console.log(dim('── counts, and they are counts ' + '─'.repeat(30)) + '\n')
console.log(`  turns                  ${spoken.length}`)
console.log(`  your sentences         ${sentences}`)
console.log(`  links extracted        ${session.graphSize}`)
console.log(`  links per sentence     ${sentences === 0 ? '—' : (session.graphSize / sentences).toFixed(2)}`)
console.log(`  links dropped          ${dropped}`)
console.log(`  shapes by kind         ${[...shapeKinds].map(([k, v]) => `${k} ${v}`).join(', ') || 'none'}`)
console.log(`  LEDGER DEBTS           ${debts}`)
console.log(`  ledger notes           ${notes.length} rows, ${distinctNotes} distinct words`)
console.log(`  turns the tally could not read  ${unreadable}`)
console.log(`  child repeated itself  ${repeats}`)
console.log(`  child said nothing     ${silent}`)
console.log(`  seconds per turn       ${spoken.length === 0 ? '—' : (took / spoken.length).toFixed(1)}`)

console.log(
  `\n${dim('These are engineering counts about a machine talking to itself. They are not a rate, not a')}` +
    `\n${dim('score, and not evidence about anybody. The explainer above has no misconceptions and no')}` +
    `\n${dim('disfluency, so nothing here stands in for the falsification week.')}\n`,
)
