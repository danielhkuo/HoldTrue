/**
 * The discrimination count: does the child read the explanation at all?
 *
 *     npm run discriminate                            -- every explanation, every step
 *     npm run discriminate -- "Why the sky is blue"   -- one explanation
 *     npm run discriminate -- --model=qwen3:8b        -- name the model here
 *
 * The model name comes from `--model=<name>` or from OLLAMA_MODEL. This part ships no default
 * model. Rule 50 forbids a default. Without a name this part prints the fault and stops.
 *
 * THE QUESTION. No test in this repository answers it. All the tests pass with a child that
 * ignores the person. Case E6b reports that the shipped child declares confusion for a good
 * explanation and for a bad one alike.
 *
 * THE TEST. Take one complete explanation of one mechanism. Remove exactly one step. Give the
 * child the complete version. Then give the child the gutted version. Ask one question: did the
 * child ask about the step that is gone?
 *
 * THE INPUT IS THE GROUND TRUTH. A person wrote both versions in `src/fixtures/explanations.ts`,
 * so the missing step is known before the run starts. Nobody labels a transcript afterwards.
 *
 * THE COUNT IS MECHANICAL. Rule 33 forbids a model judge, and no model judges anything here. Two
 * counts for each pair, and both are word checks.
 *
 *   - A HIT is a child line in the GUTTED run that holds a content word of the removed step.
 *   - A FALSE HIT is a child line in the COMPLETE run that holds a content word of that step.
 *
 * A child that reads the person gives many hits and few false hits. A blind child gives about the
 * same count of each. This part prints both counts. This part never divides them.
 *
 * A CONTENT WORD is a `keyWord` of the removed step that two filters keep. The stop list drops an
 * ordinary English word. The second filter drops a word that sits anywhere in the gutted
 * explanation, because the person still says that word out loud, and the count then proves
 * nothing. The second filter reads the topic as well as the steps, because the child sees the
 * topic.
 *
 * A WORD MATCH IS A WHOLE WORD. The line goes to lower case. Every mark that is not a letter or a
 * digit splits the line. So "Drag?" holds "drag", and "hotter" does not hold "hot". A plural does
 * not match a singular. The same rule runs over both runs, so it costs both counts the same.
 *
 * WHICH TURN THIS PART COMPARES. Remove step i. The gutted run reaches step i+1 one turn earlier
 * than the complete run does. This part takes the turn after the position of the removed step in
 * each run. The child has then heard step i+1 in both runs. One thing differs: the gutted run
 * never held step i.
 *
 *   - The gutted line is turn i of the gutted run.
 *   - The complete line is turn i+1 of the complete run.
 *
 * THE LAST STEP OF AN EXPLANATION HAS NO TURN AFTER IT. Remove the last step and the two runs hold
 * the same turns up to the end. The pair then carries no information. This part counts that step
 * and tests nothing. The print names the count.
 *
 * THE COMPLETE RUN RUNS ONCE FOR EACH EXPLANATION. The complete run does not depend on the removed
 * step, so one run serves every pair. This costs fewer calls, and it holds the baseline still.
 *
 * This part must not do these things:
 * - It must not print a rate, a score or a percentage. It prints counts only.
 * - It must not write a figure into a tracked file. It writes to the screen only.
 * - It must not ask a model to judge a line. Rule 33.
 * - It must not throw for a model that does not answer. A silent model is a printed result.
 *   Rule 23.
 * - It must not ship a default model name. Rule 50.
 * - It must not run its own command line under vitest. The guard at the end of the file holds
 *   the run to the real entry point, so rule 32 holds for the test file.
 */

import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { speak, type Exchange, type Said } from './child.js'
import { open, type Attribution, type ModelHandle } from './model.js'
import { EXPLANATIONS, without, type Explanation, type Step } from './fixtures/explanations.js'

/* ── the word check ──────────────────────────────────────────────────────────────────────────── */

/**
 * `STOP_WORDS` and `wordsIn` moved to `src/words.ts`. This file imports the fixtures and
 * `src/child.ts`. An import from `src/director.ts` into this file would make a second cycle. It
 * would also pull the fixtures into the server's module graph. `src/director.ts` reads
 * `src/words.ts` instead. This file re-exports both names, so an existing import from
 * `discriminate.js` still works.
 */
import { STOP_WORDS, wordsIn } from './words.js'
export { STOP_WORDS, wordsIn } from './words.js'

/** True when the line holds the word as a whole word. The case and the final mark do not matter. */
export const holds = (line: string, word: string): boolean =>
  wordsIn(line).includes(word.toLowerCase())

/** Every word of the words list that the line holds. The order follows the words list. */
export const matches = (line: string, words: readonly string[]): readonly string[] =>
  words.filter(word => holds(line, word))

/**
 * The content words of the removed step, against the explanation that stays.
 *
 * A word drops out for one of two reasons. The stop list holds it, or the gutted explanation
 * holds it somewhere. The second test reads a substring and not a whole word, so "rim" drops out
 * of "rims" too. `explanations.test.ts` uses the same substring test.
 */
export const contentWords = (gutted: Explanation, removed: Step): readonly string[] => {
  const elsewhere = [gutted.topic, ...gutted.steps.map(step => step.text)].join(' ').toLowerCase()
  return removed.keyWords.filter(word => {
    const lower = word.toLowerCase()
    return !STOP_WORDS.has(lower) && !elsewhere.includes(lower)
  })
}

/* ── the runs ────────────────────────────────────────────────────────────────────────────────── */

/** The line of the child, or the empty string for a silence. */
const lineOf = (said: Said): string => (said.kind === 'said' ? said.line : '')

/** One turn of one run. The child never throws, so a run always reaches its last step. */
const runThrough = async (
  steps: readonly Step[],
  model: ModelHandle,
  topic: string,
): Promise<readonly Exchange[]> => {
  const history: Exchange[] = []
  for (const step of steps) {
    const started = Date.now()
    const child = await speak(history, step.text, model, topic)
    history.push({ you: step.text, child, seconds: (Date.now() - started) / 1000 })
  }
  return history
}

/* ── the result ──────────────────────────────────────────────────────────────────────────────── */

/** One removed step, the two lines it produced, and the words that each line holds. */
export type Pair = {
  readonly topic: string
  readonly removed: Step
  readonly words: readonly string[]
  readonly gutted: Said
  readonly complete: Said
  readonly hits: readonly string[]
  readonly falseHits: readonly string[]
}

/** Everything one explanation produced. Every field is a count or a list. No field is a rate. */
export type Report = {
  readonly topic: string
  readonly pairs: readonly Pair[]
  readonly noTurnAfter: number
  readonly noContentWord: number
  readonly silent: number
  readonly reasons: readonly string[]
  readonly calls: number
  readonly seconds: number
}

/** The count of pairs where the gutted line holds a content word. One pair gives one hit. */
export const hitCount = (report: Report): number =>
  report.pairs.filter(pair => pair.hits.length > 0).length

/** The count of pairs where the complete line holds a content word. */
export const falseHitCount = (report: Report): number =>
  report.pairs.filter(pair => pair.falseHits.length > 0).length

/**
 * One explanation, every step, both runs.
 *
 * The complete run runs one time. A gutted run then runs for every step except the last step.
 * A model that does not answer gives a silent turn, and the run carries on. Rule 23.
 */
export const measure = async (
  explanation: Explanation,
  model: ModelHandle,
): Promise<Report> => {
  const complete = await runThrough(explanation.steps, model, explanation.topic)
  const every: Exchange[] = [...complete]
  const pairs: Pair[] = []
  let noContentWord = 0

  for (let i = 0; i < explanation.steps.length - 1; i++) {
    const removed = explanation.steps[i]!
    const gutted = without(explanation, removed.id)
    const run = await runThrough(gutted.steps, model, explanation.topic)
    every.push(...run)

    const words = contentWords(gutted, removed)
    if (words.length === 0) noContentWord++

    const guttedSaid = run[i]?.child ?? { kind: 'silent', reason: 'the run holds no such turn' }
    const completeSaid = complete[i + 1]?.child ?? {
      kind: 'silent',
      reason: 'the run holds no such turn',
    }

    pairs.push({
      topic: explanation.topic,
      removed,
      words,
      gutted: guttedSaid,
      complete: completeSaid,
      hits: matches(lineOf(guttedSaid), words),
      falseHits: matches(lineOf(completeSaid), words),
    })
  }

  const quiet = every.flatMap(turn => (turn.child.kind === 'silent' ? [turn.child.reason] : []))
  return {
    topic: explanation.topic,
    pairs,
    noTurnAfter: explanation.steps.length === 0 ? 0 : 1,
    noContentWord,
    silent: quiet.length,
    reasons: [...new Set(quiet)],
    calls: every.length,
    seconds: every.reduce((total, turn) => total + turn.seconds, 0),
  }
}

/* ── the screen ──────────────────────────────────────────────────────────────────────────────── */

const dim = (s: string): string => `\x1b[2m${s}\x1b[0m`
const cyan = (s: string): string => `\x1b[36m${s}\x1b[0m`

const LABEL = 28

const count = (label: string, value: number | string): string =>
  `  ${label.padEnd(LABEL)}${value}`

/** Seconds for each call. A run with no call prints a dash and never a division by zero. */
const perCall = (seconds: number, calls: number): string =>
  calls === 0 ? '—' : (seconds / calls).toFixed(1)

const block = (title: string, reports: readonly Report[]): readonly string[] => {
  const pairs = reports.flatMap(report => report.pairs)
  const calls = reports.reduce((total, report) => total + report.calls, 0)
  const seconds = reports.reduce((total, report) => total + report.seconds, 0)
  return [
    dim(`── ${title} ${'─'.repeat(Math.max(3, 60 - title.length))}`),
    count('steps tested', pairs.length),
    count('steps with no turn after', reports.reduce((t, r) => t + r.noTurnAfter, 0)),
    count('steps with no content word', reports.reduce((t, r) => t + r.noContentWord, 0)),
    count('hits', reports.reduce((t, r) => t + hitCount(r), 0)),
    count('false hits', reports.reduce((t, r) => t + falseHitCount(r), 0)),
    count('child said nothing', reports.reduce((t, r) => t + r.silent, 0)),
    count('seconds per call', perCall(seconds, calls)),
    '',
  ]
}

/** The two lines a person reads to judge one hit. The removed step, and the line of the child. */
const evidence = (kind: string, pair: Pair, words: readonly string[], said: Said): readonly string[] => [
  `  ${kind} ${dim('·')} ${pair.removed.id} ${dim('·')} ${words.join(', ')}`,
  `    ${dim('removed')}  ${pair.removed.text}`,
  `    ${dim('child')}    ${cyan(lineOf(said) === '' ? '(silent)' : lineOf(said))}`,
  '',
]

/**
 * The whole screen, as one string.
 *
 * This function is pure, so a test can read every printed line. The test holds this part to the
 * one rule that matters most: no line holds a rate, a score or a percentage.
 */
export const render = (reports: readonly Report[], who: Attribution): string => {
  const head = [
    '',
    dim(`${who.model_id} · ${who.runtime} · discriminate, an instrument, not a measurement`),
    '',
  ]

  const perExplanation = reports.flatMap(report => block(report.topic, [report]))
  const total = reports.length === 0 ? [] : block('total', reports)

  const shown = reports.flatMap(report => {
    const rows = report.pairs.flatMap(pair => [
      ...(pair.hits.length > 0 ? evidence('HIT      ', pair, pair.hits, pair.gutted) : []),
      ...(pair.falseHits.length > 0
        ? evidence('FALSE HIT', pair, pair.falseHits, pair.complete)
        : []),
    ])
    return rows.length === 0 ? [] : [dim(`── ${report.topic}`), '', ...rows]
  })

  const lines = shown.length === 0 ? [dim('  No hit and no false hit.'), ''] : shown

  const reasons = [...new Set(reports.flatMap(report => report.reasons))]
  const silence =
    reasons.length === 0 ? [] : [dim('  The child said nothing for these reasons:'),
      ...reasons.map(reason => dim(`    ${reason}`)), '']

  const caution = [
    dim('One run of one model. These are counts and not a measurement. A count of hits and a'),
    dim('count of false hits stand side by side, and nothing divides them. No figure on this'),
    dim('screen may enter a tracked file.'),
    '',
  ]

  return [...head, ...perExplanation, ...total, ...lines, ...silence, ...caution].join('\n')
}

/* ── the command line ────────────────────────────────────────────────────────────────────────── */

const MODEL_FLAG = '--model='

/** The model name, from the flag or from the environment. Rule 50 gives no default. */
export const modelNameFrom = (args: readonly string[], env: string | undefined): string =>
  (args.find(arg => arg.startsWith(MODEL_FLAG))?.slice(MODEL_FLAG.length) ?? env ?? '').trim()

/** The explanations a topic argument selects. An empty argument selects every explanation. */
export const chosen = (
  all: readonly Explanation[],
  filter: string,
): readonly Explanation[] =>
  filter.trim() === ''
    ? all
    : all.filter(e => e.topic.toLowerCase().includes(filter.trim().toLowerCase()))

const main = async (): Promise<number> => {
  const args = process.argv.slice(2)
  const model = modelNameFrom(args, process.env.OLLAMA_MODEL)
  const filter = args.find(arg => !arg.startsWith('--')) ?? ''

  if (model === '') {
    console.log('\n  No model is chosen. This instrument ships no default model. Rule 50.')
    console.log('  Set OLLAMA_MODEL, or name it: npm run discriminate -- --model=<model>\n')
    return 1
  }

  const work = chosen(EXPLANATIONS, filter)
  if (work.length === 0) {
    console.log(`\n  No explanation matches "${filter}". The file holds these topics:`)
    for (const e of EXPLANATIONS) console.log(`    ${e.topic}`)
    console.log('')
    return 1
  }

  const handle = open({ kind: 'ollama', model })
  const who = await handle.identify()
  console.log(`\n${dim(`${who.model_id} · ${who.runtime} · running ${work.length} explanation(s)`)}`)

  const reports: Report[] = []
  for (const explanation of work) {
    console.log(dim(`  ${explanation.topic} ...`))
    reports.push(await measure(explanation, handle))
  }

  console.log(render(reports, await handle.identify()))
  return 0
}

/* The run happens for the real entry point only. Vitest imports this file and runs nothing. */
const entry = process.argv[1]
if (entry !== undefined && resolve(entry) === fileURLToPath(import.meta.url)) {
  process.exitCode = await main()
}
