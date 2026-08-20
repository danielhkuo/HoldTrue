/**
 * The end to end test. Nothing here is faked.
 *
 *     npm run e2e                        -- the model name comes from OLLAMA_MODEL
 *     npm run e2e -- qwen3-coder:30b     -- the model name comes from the first argument
 *     npm run e2e -- qwen3-coder:30b 6   -- the second argument sets the number of live turns
 *
 * This part starts the real server on a free port. It sets up the ollama backend. It starts one
 * session. A model then plays the user. The model explains a mechanism from memory, and it
 * explains it badly. The model never says one step of the chain. This part then calls the end
 * phase. It prints the whole transcript and the Review.
 *
 * This part serves rule 31. Rule 31 asks for a test against the real service. It also watches the
 * cases E5, E8 and E12, the case C4 and the rules 16 and 46. A unit test cannot see these
 * failures, because a unit test holds a fake model.
 *
 * THE CHECKS ARE HEURISTICS OVER TEXT. Each check reads the words and looks for a marker. A
 * marker is not a proof. A heuristic here costs a false warning, and it never costs a false
 * finding. This part therefore prints the line that raised each warning. A person then reads the
 * line and decides. A heuristic is allowed here for that reason. It is allowed nowhere else in
 * this repository.
 *
 * This part must not do these things:
 * - It must not fake the model, the server or the transcript.
 * - It must not judge whether a line of the child is good. Rule 33 forbids that judgement.
 * - It must not print a rate, a score or a percentage. It prints counts only.
 * - It must not write a figure into a tracked file. It writes to the screen only.
 * - It must not run under vitest. It needs Ollama, and rule 32 keeps Ollama out of the suite.
 *   The file name ends with `.ts` and not with `.test.ts`, so the suite never loads it.
 * - It must not throw for a model that does not answer. A silent model is a printed result.
 */

import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { open } from './model.js'
import type { ModelHandle } from './model.js'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..')
const RUNNER = join(ROOT, 'node_modules', '.bin', 'vite-node')
const SERVER = join(HERE, 'server.ts')
const ADDRESS = '127.0.0.1'

/* ── the session that this test runs ─────────────────────────────────────────────────────────── */

/**
 * The subject. It comes from the curated list in `src/topics.ts`. A fridge is a device, so rule 19
 * holds for this session.
 *
 * The true chain has four steps. The compressor squeezes the gas, and the gas gets hot. The coils
 * outside give that heat away, and the gas turns to a liquid. The expansion valve drops the
 * pressure. The liquid then boils inside the fridge, and boiling takes the heat from the food.
 *
 * The test plants the gap on the third step. Every model holds this chain, and the third step
 * carries words that no other step carries. The check can therefore look for those words.
 */
const TOPIC = 'How a fridge makes things cold'

/** The step that the user never says. The valve and the pressure drop are one step. */
const MISSING_STEP = 'the expansion valve drops the pressure of the liquid'

/**
 * The words that the user must never say. The list holds the missing step and nothing else.
 * The user explains every other step. The gap is therefore one step and not a whole silence.
 */
const FORBIDDEN = [
  'expand',
  'expands',
  'expanding',
  'expansion',
  'valve',
  'throttle',
  'nozzle',
  'capillary',
  'orifice',
]

/** A finding that names the missing step holds one of these marks. */
const MARKS = ['expand', 'expansion', 'valve', 'throttl', 'nozzle', 'capillary', 'orifice']

/* ── the arguments ───────────────────────────────────────────────────────────────────────────── */

/** The model name. Rule 50 forbids a default, so this part picks no model for the caller. */
const MODEL_NAME = (process.argv[2] ?? process.env.OLLAMA_MODEL ?? '').trim()

/**
 * The number of live turns.
 *
 * Eight turns give the user room to reach the end of the chain. The child presses one step again
 * and again, and a short session then stops on the first step. The gap check needs the session to
 * pass the planted step. A caller can set another number.
 */
const TURNS = Math.max(2, Number(process.argv[3] ?? 8) || 8)

/* ── the screen ──────────────────────────────────────────────────────────────────────────────── */

const dim = (s: string): string => `\x1b[2m${s}\x1b[0m`
const cyan = (s: string): string => `\x1b[36m${s}\x1b[0m`
const green = (s: string): string => `\x1b[32m${s}\x1b[0m`
const red = (s: string): string => `\x1b[31m${s}\x1b[0m`

const rule = (title: string): void =>
  console.log(`\n${dim(`── ${title} ${'─'.repeat(Math.max(0, 76 - title.length))}`)}\n`)

/** One paragraph, wrapped. The screen holds the whole transcript, so the width matters. */
const wrap = (text: string, indent: string): string => {
  const out: string[] = []
  let line = ''
  for (const word of text.split(/\s+/)) {
    if (line === '') line = word
    else if (line.length + 1 + word.length > 92) {
      out.push(line)
      line = word
    } else line = `${line} ${word}`
  }
  if (line !== '') out.push(line)
  return out.map(l => `${indent}${l}`).join('\n')
}

/* ── the real server ─────────────────────────────────────────────────────────────────────────── */

/** One port that nothing holds. The kernel picks it, and this part gives it straight back. */
const freePort = async (): Promise<number> =>
  new Promise(resolve => {
    const probe = createServer()
    probe.listen(0, ADDRESS, () => {
      const found = probe.address()
      const port = typeof found === 'object' && found !== null ? found.port : 0
      probe.close(() => resolve(port))
    })
  })

/** The running server, and the way to stop it. */
type Running = { readonly base: string; readonly stop: () => void }

/** The server prints its own lines. This part marks them, so a reader sees which part spoke. */
const forward = (stream: NodeJS.ReadableStream | null, tag: string): void => {
  stream?.on('data', (chunk: Buffer) => {
    for (const line of chunk.toString('utf8').split('\n')) {
      if (line.trim() !== '') console.log(dim(`  ${tag}  ${line.trim()}`))
    }
  })
}

/** Start the real server, and wait for the boot route to answer. */
const startServer = async (): Promise<Running | string> => {
  const port = await freePort()
  const base = `http://${ADDRESS}:${port}`
  const child = spawn(process.execPath, [RUNNER, SERVER], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(port) },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  forward(child.stdout, 'server')
  forward(child.stderr, 'server')

  const stop = (): void => {
    child.kill('SIGTERM')
  }

  for (let tries = 0; tries < 240; tries++) {
    await new Promise(resolve => setTimeout(resolve, 250))
    if (child.exitCode !== null) return `The server stopped with code ${child.exitCode}.`
    try {
      const answer = await fetch(`${base}/api/boot`)
      if (answer.ok) return { base, stop }
    } catch {
      continue
    }
  }
  stop()
  return 'The server did not answer /api/boot.'
}

/* ── the routes ──────────────────────────────────────────────────────────────────────────────── */

/** One reply, or one stated failure. A dead route is a result here, and never an exception. */
type Reply =
  | { readonly ok: true; readonly status: number; readonly body: Record<string, unknown> }
  | { readonly ok: false; readonly reason: string }

const call = async (
  base: string,
  method: 'GET' | 'POST',
  path: string,
  body?: Record<string, unknown>,
): Promise<Reply> => {
  try {
    const answer = await fetch(`${base}${path}`, {
      method,
      headers: { 'content-type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    })
    const parsed: unknown = await answer.json()
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return { ok: false, reason: `${path} returned a body this code cannot read` }
    }
    return { ok: true, status: answer.status, body: parsed as Record<string, unknown> }
  } catch (error) {
    return { ok: false, reason: `${path} failed: ${error instanceof Error ? error.message : String(error)}` }
  }
}

/** The `error` field of a shaped fault, as one sentence. Null means the reply held no fault. */
const faultOf = (body: Record<string, unknown>): string | null => {
  const error = body['error']
  if (typeof error !== 'object' || error === null) return null
  const shape = error as { kind?: unknown; message?: unknown }
  const kind = typeof shape.kind === 'string' ? shape.kind : 'fault'
  const message = typeof shape.message === 'string' ? shape.message : 'no message'
  return `${kind}: ${message}`
}

/* ── the agent that plays the user ───────────────────────────────────────────────────────────── */

/**
 * The system message for the agent that plays the user.
 *
 * The agent explains from memory, and it explains badly. It never says the missing step. The
 * prompt names the forbidden words, so the gap stays in one place for every run.
 */
const userSystem = (): string =>
  `You are a person. You are explaining ${TOPIC.toLowerCase()} out loud to a curious 10-year-old.
You are going from memory. You are not looking anything up. You are not an expert.

HOW YOU TALK:
1. Write one sentence or two sentences. Never write a third sentence. You are speaking out loud.
2. Plain spoken English. "so when you...", "and that stops...".
3. Never use a bullet point, a heading or a numbered list.
4. If the child asks you something, answer it in one sentence. Then say the next part of the machine.
5. Say one part of the machine each turn. Do not say the whole thing in one turn.
6. Do not stay on one part. Move forward through the machine to the end.

WHAT YOU DO NOT KNOW:
You have never learned this part of the mechanism: ${MISSING_STEP}.
You must never write any of these words: ${FORBIDDEN.join(', ')}.
If the child presses you near that part, say that you are not sure, and talk about another part.
Do not guess it. Do not work it out. You simply do not know it.

Say the parts you do know. Say them roughly, the way a person says them out loud.`

/** The running script, in the shape that the agent reads back. */
const scriptOf = (beats: readonly Beat[]): string =>
  beats
    .flatMap(beat => [`you: ${beat.said}`, ...(beat.line === null ? [] : [`child: ${beat.line}`])])
    .join('\n')

/** One line from the agent, cleaned of the wrapper only. Null means the model did not answer. */
const nextUserLine = async (model: ModelHandle, beats: readonly Beat[]): Promise<string | null> => {
  const raw = await model.ask(userSystem(), `${scriptOf(beats)}\nyou:`)
  if (raw === null) return null
  const said = raw
    .trim()
    .split('\n')
    .map(l => l.replace(/^\s*(you|adult|user)\s*:\s*/i, '').trim())
    .filter(l => l !== '')
    .join(' ')
    .trim()
  return said === '' ? null : said
}

/** The answer of the agent to the probe question. The agent still does not know the step. */
const answerProbe = async (
  model: ModelHandle,
  beats: readonly Beat[],
  question: string,
): Promise<string | null> => {
  const raw = await model.ask(
    userSystem(),
    `${scriptOf(beats)}\n\nSomebody now asks you one question about your explanation.\n` +
      `question: ${question}\nYou answer in one or two sentences.\nyou:`,
  )
  if (raw === null) return null
  const said = raw.trim().split('\n').filter(l => l.trim() !== '').join(' ').trim()
  return said === '' ? null : said
}

/* ── the run ─────────────────────────────────────────────────────────────────────────────────── */

/** One user line and the reply to it. The reason holds a stated silence of the child. */
type Beat = {
  readonly said: string
  readonly line: string | null
  readonly reason: string | null
  readonly seconds: number
}

/** Everything the run produced. The checks read this and nothing else. */
type Run = {
  readonly beats: readonly Beat[]
  readonly question: string | null
  readonly answer: string | null
  readonly review: unknown
  readonly source: unknown
  readonly stopped: string | null
}

const runTurns = async (base: string, model: ModelHandle): Promise<{ beats: Beat[]; stopped: string | null }> => {
  const beats: Beat[] = []
  for (let n = 0; n < TURNS; n++) {
    const said = await nextUserLine(model, beats)
    if (said === null) {
      return { beats, stopped: `The agent that plays the user gave no line on turn ${n + 1}.` }
    }

    const reply = await call(base, 'POST', '/api/turn', { said })
    if (!reply.ok) return { beats, stopped: reply.reason }
    const fault = faultOf(reply.body)
    if (fault !== null) return { beats, stopped: `POST /api/turn refused the turn. ${fault}` }

    const child = reply.body['child']
    const shape = (typeof child === 'object' && child !== null ? child : {}) as {
      kind?: unknown
      line?: unknown
      reason?: unknown
    }
    const line = shape.kind === 'said' && typeof shape.line === 'string' ? shape.line : null
    const reason = shape.kind === 'silent' && typeof shape.reason === 'string' ? shape.reason : null
    const seconds = typeof reply.body['seconds'] === 'number' ? reply.body['seconds'] : 0

    beats.push({ said, line, reason, seconds })
    console.log(`  ${dim('you')}    ${wrap(said, '').trim()}`)
    console.log(`  ${dim('child')}  ${cyan(line ?? `(silent: ${reason ?? 'no reason'})`)}\n`)
  }
  return { beats, stopped: null }
}

const run = async (base: string, model: ModelHandle): Promise<Run> => {
  const empty: Run = {
    beats: [],
    question: null,
    answer: null,
    review: null,
    source: null,
    stopped: null,
  }

  const setup = await call(base, 'POST', '/api/setup', { kind: 'ollama', model: MODEL_NAME })
  if (!setup.ok) return { ...empty, stopped: setup.reason }
  const setupFault = faultOf(setup.body)
  if (setupFault !== null) return { ...empty, stopped: `POST /api/setup refused the model. ${setupFault}` }
  console.log(dim(`  setup   ${JSON.stringify(setup.body['who'])}`))

  // The toggle stays off. A local model sends nothing off this machine, so no consent is due.
  const start = await call(base, 'POST', '/api/start', { topic: TOPIC, omniscient: false })
  if (!start.ok) return { ...empty, stopped: start.reason }
  const startFault = faultOf(start.body)
  if (startFault !== null) return { ...empty, stopped: `POST /api/start refused the topic. ${startFault}` }
  console.log(dim(`  session ${TOPIC} · ${String(start.body['label'])}\n`))

  const live = await runTurns(base, model)
  if (live.stopped !== null) return { ...empty, beats: live.beats, stopped: live.stopped }

  // The end phase starts here. The live phase must never run beside it. Rule 4 of this build.
  const first = await call(base, 'POST', '/api/end', {})
  if (!first.ok) return { ...empty, beats: live.beats, stopped: first.reason }
  const endFault = faultOf(first.body)
  if (endFault !== null) {
    return { ...empty, beats: live.beats, stopped: `POST /api/end refused the call. ${endFault}` }
  }

  if (first.body['kind'] !== 'probe') {
    return {
      beats: live.beats,
      question: null,
      answer: null,
      review: first.body['review'] ?? null,
      source: first.body['source'] ?? null,
      stopped: null,
    }
  }

  const question = typeof first.body['question'] === 'string' ? first.body['question'] : ''
  console.log(`  ${dim('probe')}  ${cyan(question)}`)
  const answer = await answerProbe(model, live.beats, question)
  console.log(`  ${dim('you')}    ${answer ?? '(the agent gave no answer)'}\n`)

  const second = await call(base, 'POST', '/api/end', answer === null ? {} : { answer })
  if (!second.ok) {
    return { beats: live.beats, question, answer, review: null, source: null, stopped: second.reason }
  }
  const secondFault = faultOf(second.body)
  if (secondFault !== null) {
    return {
      beats: live.beats,
      question,
      answer,
      review: null,
      source: null,
      stopped: `POST /api/end refused the answer. ${secondFault}`,
    }
  }

  return {
    beats: live.beats,
    question,
    answer,
    review: second.body['review'] ?? null,
    source: second.body['source'] ?? null,
    stopped: null,
  }
}

/* ── the words ───────────────────────────────────────────────────────────────────────────────── */

/** Every word of a text, in lower case. */
const wordsOf = (text: string): readonly string[] => text.toLowerCase().match(/[a-z']+/g) ?? []

/** The words that carry no subject. A shared run of these words says nothing about a restatement. */
const COMMON = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'so', 'it', 'its', 'is', 'are', 'was', 'were', 'that',
  'this', 'these', 'those', 'then', 'they', 'them', 'their', 'to', 'of', 'in', 'on', 'at', 'for',
  'from', 'with', 'you', 'your', 'i', 'my', 'me', 'we', 'he', 'she', 'there', 'not', 'no', 'do',
  'does', 'did', 'be', 'been', 'am', 'as', 'by', 'if', 'all', 'one', 'two', 'just', 'really',
  'very', 'more', 'can', 'will', 'would', 'like', 'kind', 'sort', 'thing', 'things', 'stuff',
])

const contentOf = (text: string): readonly string[] => wordsOf(text).filter(w => !COMMON.has(w))

/** The first run of `n` content words that both texts hold. Null means the texts share no run. */
const sharedRun = (
  one: readonly string[],
  two: readonly string[],
  n: number,
): string | null => {
  for (let i = 0; i + n <= one.length; i++) {
    for (let j = 0; j + n <= two.length; j++) {
      let same = true
      for (let k = 0; k < n; k++) {
        if (one[i + k] !== two[j + k]) {
          same = false
          break
        }
      }
      if (same) return one.slice(i, i + n).join(' ')
    }
  }
  return null
}

const sentencesOf = (line: string): readonly string[] =>
  line.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(s => s !== '')

/* ── the markers ─────────────────────────────────────────────────────────────────────────────── */

/** Case E5. A line that claims understanding holds one of these. */
const UNDERSTOOD: readonly RegExp[] = [
  /\bi understand\b/, /\bi understood\b/, /\bi get it\b/, /\bnow i get\b/, /\bgot it\b/,
  /\bthat makes sense\b/, /\bmakes sense now\b/, /\bnow it makes sense\b/, /\bi see now\b/,
  /\boh i see\b/, /\bthat's clear\b/, /\bthats clear\b/, /\bi follow\b/, /\bthat explains it\b/,
  /\bnow i know\b/,
]

/** Case E12. A line that offers an analogy holds one of these. */
const ANALOGY: readonly RegExp[] = [
  /\blike a\b/, /\blike an\b/, /\blike when\b/, /\blike how\b/, /\blike the way\b/,
  /\bkind of like\b/, /\bsort of like\b/, /\bjust like\b/, /\bsimilar to\b/, /\bas if\b/,
  /\bimagine\b/, /\bpretend\b/, /\bthink of it as\b/,
]

/** A verb before "like" makes a description and not an analogy. This removes that pair first. */
const NOT_ANALOGY = /\b(look|looks|looked|sound|sounds|sounded|feel|feels|felt|seem|seems|taste|tastes|smell|smells)\s+like\b/g

/** Case E8. A statement of a mechanism carries a cause, and one of these joins it. */
const CONNECTIVE: readonly RegExp[] = [
  /\bbecause\b/, /\bso it\b/, /\bso the\b/, /\bso they\b/, /\bso that\b/, /\bthat's why\b/,
  /\bthats why\b/, /\bwhich is why\b/, /\bwhich makes\b/, /\bthat makes\b/, /\bwhich stops\b/,
  /\bthat stops\b/, /\bwhich keeps\b/, /\bthat keeps\b/,
]

/** Rule 16. A finding must hold none of these. */
const FIGURE: readonly RegExp[] = [
  /\d/, /%/, /\bpercent\b/, /\bpercentage\b/, /\bscore\b/, /\bscored\b/, /\brating\b/, /\brated\b/,
  /\bgrade\b/, /\bgraded\b/, /\d\s+out of\b/,
]

const hits = (text: string, marks: readonly RegExp[]): string | null => {
  for (const mark of marks) {
    const found = mark.exec(text)
    if (found !== null) return found[0]
  }
  return null
}

/* ── the checks ──────────────────────────────────────────────────────────────────────────────── */

/** One check. The counts print as counts. This part never divides one count by another. */
type Check = {
  readonly tag: string
  readonly claim: string
  readonly pass: boolean
  readonly counts: readonly string[]
  readonly notes: readonly string[]
}

/** The findings of the Review, as text. An unavailable Review holds no finding. */
const findingsOf = (review: unknown): readonly string[] | null => {
  if (typeof review !== 'object' || review === null) return null
  const shape = review as { kind?: unknown; findings?: unknown }
  if (shape.kind !== 'reviewed' || !Array.isArray(shape.findings)) return null
  return shape.findings.map(entry => {
    const finding = (typeof entry === 'object' && entry !== null ? entry : {}) as { text?: unknown }
    return typeof finding.text === 'string' ? finding.text : ''
  })
}

const checkUnderstands = (lines: readonly string[]): Check => {
  const notes: string[] = []
  for (const line of lines) {
    const mark = hits(line.toLowerCase(), UNDERSTOOD)
    if (mark !== null) notes.push(`"${mark}" in: ${line}`)
  }
  return {
    tag: 'E5',
    claim: 'The child never said that it understands.',
    pass: notes.length === 0,
    counts: [`child lines: ${lines.length}`, `lines with a marker: ${notes.length}`],
    notes,
  }
}

const checkRestates = (lines: readonly string[], userText: string): Check => {
  const user = contentOf(userText)
  const notes: string[] = []
  for (const line of lines) {
    for (const sentence of sentencesOf(line)) {
      if (sentence.includes('?')) continue
      const lower = sentence.toLowerCase()
      const join = hits(lower, CONNECTIVE)
      if (join === null) continue
      const run = sharedRun(contentOf(sentence), user, 3)
      if (run === null) continue
      notes.push(`"${join}" joins the run "${run}" in: ${sentence}`)
    }
  }
  return {
    tag: 'E8',
    claim: 'The child never said the user mechanism back as a statement.',
    pass: notes.length === 0,
    counts: [`child lines: ${lines.length}`, `statements with a marker: ${notes.length}`],
    notes,
  }
}

/**
 * Case E12 and rule 7. The child must not offer an analogy.
 *
 * A marker alone is not enough. Rule 40 lets the child name the step where it stopped following,
 * and the child names that step in the words of the user. The user says "like a little swirl", and
 * the child then quotes "like a little swirl" back as a location. The child offered nothing there.
 * This check therefore reads the marker and the three words after it. The user words that already
 * hold that phrase make an echo, and an echo is not an offer. The echo prints as a note.
 */
const checkAnalogy = (lines: readonly string[], userText: string): Check => {
  const user = wordsOf(userText).join(' ')
  const notes: string[] = []
  let echoes = 0
  for (const line of lines) {
    const clean = line.toLowerCase().replace(NOT_ANALOGY, ' ')
    const mark = hits(clean, ANALOGY)
    if (mark === null) continue
    const at = clean.indexOf(mark)
    const window = wordsOf(clean.slice(at)).slice(0, 4).join(' ')
    if (user.includes(window)) {
      echoes++
      notes.push(`the user said "${window}" first, so this repeats the user: ${line}`)
      continue
    }
    notes.push(`"${mark}" in: ${line}`)
  }
  const offered = notes.length - echoes
  return {
    tag: 'E12',
    claim: 'The child never offered an analogy.',
    pass: offered === 0,
    counts: [
      `child lines: ${lines.length}`,
      `lines with a marker: ${notes.length}`,
      `lines that repeat the user: ${echoes}`,
    ],
    notes,
  }
}

/**
 * Case C4 and rule 46. The end phase must produce a Review.
 *
 * A Review that could not run must say unavailable, and it must carry a reason. It must never
 * arrive as an empty findings list. An empty list reads as "nothing was wrong". This run left one
 * step out on purpose, so an empty list here is that exact failure.
 */
const checkReview = (review: unknown): Check => {
  if (typeof review !== 'object' || review === null) {
    return {
      tag: 'C4',
      claim: 'The end phase produced a Review.',
      pass: false,
      counts: ['reviews: 0'],
      notes: ['The end phase returned no Review at all.'],
    }
  }
  const shape = review as { kind?: unknown; reason?: unknown; findings?: unknown }

  if (shape.kind === 'unavailable') {
    const reason = typeof shape.reason === 'string' ? shape.reason.trim() : ''
    return {
      tag: 'C4',
      claim: 'An unavailable Review says unavailable, and it carries a reason.',
      pass: reason !== '',
      counts: ['reviews: 1', 'findings: 0'],
      notes:
        reason === ''
          ? ['The Review is unavailable, and it carries no reason.']
          : [`The Review is unavailable. The reason: ${reason}`],
    }
  }

  const findings = findingsOf(review)
  if (findings === null) {
    return {
      tag: 'C4',
      claim: 'The end phase produced a Review.',
      pass: false,
      counts: ['reviews: 1'],
      notes: ['The Review holds neither a findings list nor an unavailable reason.'],
    }
  }
  return {
    tag: 'C4',
    claim: 'The Review reports the gaps, and it is not an empty list.',
    pass: findings.length > 0,
    counts: ['reviews: 1', `findings: ${findings.length}`],
    notes:
      findings.length > 0
        ? []
        : [
            'The Review holds an empty findings list. This run left one step out on purpose.',
            'An empty list reads as "nothing was wrong". Rule 46 asks for a stated failure.',
          ],
  }
}

const checkFigures = (review: unknown): Check => {
  const findings = findingsOf(review) ?? []
  const notes: string[] = []
  for (const text of findings) {
    const mark = hits(text.toLowerCase(), FIGURE)
    if (mark !== null) notes.push(`"${mark}" in: ${text}`)
  }
  return {
    tag: 'rule 16',
    claim: 'No finding holds a number, a score or a percentage.',
    pass: notes.length === 0,
    counts: [`findings: ${findings.length}`, `findings with a marker: ${notes.length}`],
    notes,
  }
}

const checkMissingStep = (review: unknown): Check => {
  const findings = findingsOf(review) ?? []
  const named = findings.filter(text => MARKS.some(mark => text.toLowerCase().includes(mark)))
  return {
    tag: 'gap',
    claim: `A finding names the step the user never said: ${MISSING_STEP}.`,
    pass: named.length > 0,
    counts: [`findings: ${findings.length}`, `findings that name the step: ${named.length}`],
    notes:
      named.length > 0
        ? named
        : [`No finding holds any of these marks: ${MARKS.join(', ')}.`],
  }
}

/* ── the print ───────────────────────────────────────────────────────────────────────────────── */

const printTranscript = (out: Run): void => {
  rule('the transcript')
  console.log(`  ${dim('topic')}  ${TOPIC}\n`)
  for (const beat of out.beats) {
    console.log(`  ${dim('you')}`)
    console.log(wrap(beat.said, '    '))
    console.log(`  ${dim('child')}`)
    console.log(cyan(wrap(beat.line ?? `(silent: ${beat.reason ?? 'no reason'})`, '    ')))
    console.log('')
  }
  if (out.question !== null) {
    console.log(`  ${dim('probe')}`)
    console.log(wrap(out.question, '    '))
    console.log(`  ${dim('you')}`)
    console.log(wrap(out.answer ?? '(the agent gave no answer)', '    '))
    console.log('')
  }
}

const printReview = (out: Run): void => {
  rule('the Review')
  const review = out.review
  if (typeof review !== 'object' || review === null) {
    console.log('  The end phase returned no Review.')
    return
  }
  const shape = review as { kind?: unknown; reason?: unknown; verified?: unknown }
  if (shape.kind === 'unavailable') {
    console.log('  No review ran. The questions stay open.')
    console.log(wrap(typeof shape.reason === 'string' ? shape.reason : 'no reason', '  '))
  } else {
    console.log(`  ${dim(shape.verified === true ? 'verified' : 'unverified')}\n`)
    const findings = findingsOf(review) ?? []
    const rows = (review as { findings?: unknown }).findings
    const kinds = Array.isArray(rows)
      ? rows.map(entry => {
          const row = (entry as { row?: { kind?: unknown } }).row
          return typeof row?.kind === 'string' ? row.kind : 'row'
        })
      : []
    findings.forEach((text, i) => {
      console.log(`  ${dim(kinds[i] ?? 'row')}`)
      console.log(wrap(text, '    '))
      console.log('')
    })
  }
  console.log(`  ${dim(`source: ${JSON.stringify(out.source)}`)}`)
}

const printChecks = (checks: readonly Check[]): boolean => {
  rule('the checks')
  console.log(
    dim('  Each check reads the words and looks for a marker. A marker is not a proof.\n') +
      dim('  A warning here can be false. A person reads the line below it and decides.\n'),
  )
  let good = true
  for (const check of checks) {
    const badge = check.pass ? green('PASS') : red('FAIL')
    if (!check.pass) good = false
    console.log(`  ${badge}  ${check.tag.padEnd(8)}${check.claim}`)
    console.log(dim(`             ${check.counts.join('   ')}`))
    for (const note of check.notes) console.log(dim(wrap(note, '             ')))
    console.log('')
  }
  return good
}

/* ── the whole thing ─────────────────────────────────────────────────────────────────────────── */

const main = async (): Promise<number> => {
  if (MODEL_NAME === '') {
    console.log('\n  No model name. This test picks no model for you. Rule 50 forbids a default.')
    console.log('  Set OLLAMA_MODEL, or pass the name: npm run e2e -- <model>\n')
    return 1
  }

  console.log(`\n  ${dim(`ollama · ${MODEL_NAME} · ${TURNS} live turns · a real server on a free port`)}\n`)

  const server = await startServer()
  if (typeof server === 'string') {
    console.log(`\n  The server did not start. ${server}\n`)
    return 1
  }

  const model = open({ kind: 'ollama', model: MODEL_NAME })
  const started = Date.now()
  const out = await run(server.base, model)
  const took = Math.round((Date.now() - started) / 1000)
  server.stop()

  printTranscript(out)
  printReview(out)

  if (out.stopped !== null) {
    rule('the checks')
    console.log(`  The run stopped before the end. ${out.stopped}\n`)
    return 1
  }

  const lines = out.beats.flatMap(beat => (beat.line === null ? [] : [beat.line]))
  const userText = out.beats.map(beat => beat.said).join(' ')
  const good = printChecks([
    checkUnderstands(lines),
    checkRestates(lines, userText),
    checkAnalogy(lines, userText),
    checkReview(out.review),
    checkFigures(out.review),
    checkMissingStep(out.review),
  ])

  const silent = out.beats.filter(beat => beat.line === null).length
  console.log(dim(`  turns: ${out.beats.length}   child said nothing: ${silent}   seconds: ${took}`))
  console.log(dim('  These are counts about one run. They are not a rate and not a measurement.\n'))
  return good ? 0 : 1
}

process.exit(await main())
