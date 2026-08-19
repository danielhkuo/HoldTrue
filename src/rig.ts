/**
 * The rig: two models talk, and nothing is judged.
 *
 *     npm run rig                        -- the built-in subject
 *     npm run rig -- "a bicycle brake" 8
 *
 * One model explains a mechanism from memory. The child answers. This is the ONLY instrument in
 * the repository, and the product has exactly one measurable defect it can see: at temperature 0
 * the child's own previous lines are the strongest exemplar in its prompt, so it drifts toward
 * repeating itself. The rotating example bank is a mitigation for that, and this is what says
 * whether the mitigation is working.
 *
 * WHAT IT IS NOT. It emits **engineering counts and nothing else**. No rate, no score, no
 * precision figure. The explainer below has no misconceptions, no disfluency, no self-repair and
 * no rambling — it is not a person, and these numbers are not about people. A figure from here
 * describes a machine talking to itself.
 *
 * That distinction has been broken before: a previous generated corpus was labelled "not a
 * measurement" and then a constitutional reversal was argued from it anyway, twice. Hence the
 * length of this comment.
 */

import { ollama, type ModelHandle } from './model.js'
import { speak, type Exchange } from './child.js'

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

const history: Exchange[] = []
const started = Date.now()

for (let n = 0; n < maxTurns; n++) {
  const script = history
    .flatMap(e => [`you: ${e.you}`, ...(e.child.kind === 'said' ? [`child: ${e.child.line}`] : [])])
    .join('\n')
  const raw = await model.ask(EXPLAINER(subject), `${script}\nyou:`)
  if (raw === null) break
  const you = raw.trim().split('\n').filter(l => l.trim() !== '').join(' ').trim()
  if (you === '') break

  const turnStart = Date.now()
  const child = await speak(history, you, model)
  history.push({ you, child, seconds: (Date.now() - turnStart) / 1000 })

  console.log(`  ${dim('them')}   ${you}`)
  console.log(`  ${dim('child')}  ${cyan(child.kind === 'said' ? child.line : '(silent)')}\n`)
}

const took = (Date.now() - started) / 1000
const lines = history.flatMap(e => (e.child.kind === 'said' ? [e.child.line.toLowerCase().trim()] : []))
const silent = history.filter(e => e.child.kind === 'silent').length

/**
 * Repetition, two ways, because the crude one misses what a person sees instantly.
 *
 * `identical` compares whole strings and only catches an exact repeat. `sameOpener` compares the
 * first three words, which is what catches "I'm lost, where does..." arriving four turns running
 * with a different tail each time — the failure that actually reads as broken.
 */
const opener = (l: string) => l.split(/\s+/).slice(0, 3).join(' ')
const identical = lines.length - new Set(lines).size
const openers = lines.map(opener)
const repeatedOpeners = openers.length - new Set(openers).size

console.log(dim('── counts, and they are counts ' + '─'.repeat(30)) + '\n')
console.log(`  turns                    ${history.length}`)
console.log(`  child said nothing       ${silent}`)
console.log(`  identical lines          ${identical}`)
console.log(`  repeated openers         ${repeatedOpeners}  ${dim('(first three words)')}`)
console.log(`  seconds per turn         ${history.length === 0 ? '—' : (took / history.length).toFixed(1)}`)

console.log(
  `\n${dim('Engineering counts about a machine talking to itself. Not a rate, not a score, and')}` +
    `\n${dim('not evidence about anybody. The explainer has no misconceptions and no disfluency.')}\n`,
)
