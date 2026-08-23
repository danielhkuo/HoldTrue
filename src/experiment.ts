/**
 * The experiment: one run, one transcript.
 *
 *     npm run experiment -- A            -- the run letter picks the flags
 *     npm run experiment -- E 8          -- the second argument sets the number of turns
 *
 * A model plays the person. The person explains a bike brake from memory. The person reaches for
 * the word "friction". The person never says the planted gap. The child answers with the flags
 * of the run. The script writes the transcript to `measurements/director/<run>.md`.
 *
 * This script is a rig. It emits a transcript and nothing else. It judges no line. It counts
 * nothing. The counts come from a reader. Rule 29 holds: two models in conversation are not a
 * measurement. `docs/proposals/director-experiment.md` owns the design.
 */

import { writeFileSync, mkdirSync } from 'node:fs'
import { ollama } from './model.js'
import { speak, type Exchange, type Options } from './child.js'

type Run = { readonly options: Partial<Options>; readonly temperature: number }

const RUNS: Record<string, Run> = {
  A: { options: {}, temperature: 0 },
  B: { options: { hideOwnLines: true }, temperature: 0 },
  C: { options: { director: true }, temperature: 0 },
  D: { options: {}, temperature: 0.8 },
  E: { options: { hideOwnLines: true, director: true }, temperature: 0.8 },
}

const PERSON = `You are explaining how a bicycle brake works, out loud, to a curious 10-year-old. You go from memory. You are not a physicist.

RULES:
1. One or two spoken sentences per turn. Never more.
2. Plain spoken English. "so when you...", "and that makes...".
3. Answer the child's last line. Then carry on if you can.
4. You use the word "friction" as if the word itself explains the step. You do not unpack it.
5. You never say that friction turns the motion of the wheel into heat. You do not know that part. If the child pushes on it, say you are not sure.
6. Never use a bullet point, a heading or a numbered list.`

const TOPIC = 'How a bicycle brake stops the wheel'

const letter = (process.argv[2] ?? 'A').toUpperCase()
const run = RUNS[letter]
if (run === undefined) {
  console.error(`Unknown run "${letter}". Use A, B, C, D or E.`)
  process.exit(1)
}
const maxTurns = Number(process.argv[3] ?? 8)
const modelName = process.env.OLLAMA_MODEL
if (modelName === undefined || modelName.trim() === '') {
  console.error('Set OLLAMA_MODEL. Rule 50: no default model.')
  process.exit(1)
}

const person = ollama(modelName, 0.8)
const child = ollama(modelName, run.temperature)
const who = await child.identify()

const history: Exchange[] = []
for (let n = 0; n < maxTurns; n++) {
  const script = history
    .flatMap(e => [`you: ${e.you}`, ...(e.child.kind === 'said' ? [`child: ${e.child.line}`] : [])])
    .join('\n')
  const raw = await person.ask(PERSON, `${script}\nyou:`)
  if (raw === null) break
  const you = raw.trim().split('\n').filter(l => l.trim() !== '').join(' ').trim()
  if (you === '') break

  const started = Date.now()
  const said = await speak(history, you, child, TOPIC, run.options)
  history.push({ you, child: said, seconds: (Date.now() - started) / 1000 })
  console.log(`them:  ${you}`)
  console.log(`child: ${said.kind === 'said' ? said.line : `(silent: ${said.reason})`}\n`)
}

const flags = Object.entries({ ...run.options, temperature: run.temperature })
  .map(([k, v]) => `${k}=${String(v)}`)
  .join(', ')
const lines = [
  `# Run ${letter}`,
  '',
  `Two models talked to each other. No person spoke. This is not a measurement. Rule 29 holds.`,
  '',
  `- Model: ${who.model_id} (${who.runtime})`,
  `- Flags: ${flags}`,
  `- Turns: ${history.length}`,
  '',
  ...history.flatMap((e, i) => [
    `**${i + 1}. them:** ${e.you}`,
    '',
    `**${i + 1}. child:** ${e.child.kind === 'said' ? e.child.line : `(silent: ${e.child.reason})`}`,
    '',
  ]),
]
mkdirSync('measurements/director', { recursive: true })
writeFileSync(`measurements/director/${letter}.md`, lines.join('\n'))
console.log(`wrote measurements/director/${letter}.md`)
