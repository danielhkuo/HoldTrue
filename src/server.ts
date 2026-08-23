/**
 * The server. This part holds the routes and the one session in memory.
 *
 * The part owns seven routes. It serves the page. It reports the boot state and the disclosure.
 * It takes the startup model choice. It starts a session. It runs one live turn. It runs the end
 * phase. It reports the state after a reload.
 *
 * The part binds to 127.0.0.1 only. Case B12 requires this. The transcript never reaches the
 * network. The part holds one session in memory, and it writes nothing to disk. Rule 47.
 *
 * The part ships no default model. Rule 50 requires this. The user calls POST /api/setup one
 * time. Before that call POST /api/turn returns a stated error. The part never picks a model.
 *
 * The part takes the consent of the user before the first send. Rule 48 requires this.
 * POST /api/start refuses an omniscient session without explicit consent in the request.
 * POST /api/start also refuses an omniscient session when the app holds no provided model.
 * The part never puts the startup model in place of the provided model. Rule 45.
 *
 * The end phase runs one time, and only after POST /api/end. The live phase then stops.
 * POST /api/turn returns a stated error after the end phase starts.
 *
 * The cases: B5, B7, B11, B12 and B13. The rules: 1, 11, 13, 20, 21, 22, 23, 41, 42, 45, 46,
 * 47, 48 and 50.
 *
 * The part must not do these things:
 * - It must not bind an address other than 127.0.0.1.
 * - It must not choose a model for the user.
 * - It must not send text before the user gives consent.
 * - It must not render a fault as a line of the child. Every fault returns a shaped error object.
 * - It must not read, judge or edit the words of the user. Rule 10.
 * - It must not show a score, a rating or a grade. Rule 16.
 * - It must not write to disk.
 *
 * ONE NOTE ON src/session.ts. That file owns the marked transcript and the end phase. This part
 * calls `startSession`, `addTurn`, `openEnd` and `closeEnd`. It holds no step of the end phase
 * itself. A test can then run the shipped end phase without this server.
 */

import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import { speak, type Exchange, type Said } from './child.js'
import { open, type Attribution, type Backend, type ModelHandle } from './model.js'
import {
  addTurn,
  closeEnd,
  openEnd,
  startSession,
  unavailable,
  type Pending,
  type Session,
} from './session.js'
import { TOPICS } from './topics.js'
import type { Review } from './types.js'

const HERE = dirname(fileURLToPath(import.meta.url))

/** Case B12. The server answers this address and no other address. */
const ADDRESS = '127.0.0.1'
const PORT = Number(process.env.PORT ?? 4517)

/**
 * The three child flags. Each defaults off. A value of "1" turns one on.
 * `docs/proposals/director-experiment.md` owns the design. The flags change the prompt and the
 * temperature only. `POST /api/turn` does not change. The sampling flag reaches the child only.
 * The end phase never sees it, and always runs at temperature 0.
 */
const flag = (name: string): boolean => (process.env[name] ?? '') === '1'
const CHILD_OPTIONS = {
  hideOwnLines: flag('CHILD_HIDE_OWN_LINES'),
  director: flag('CHILD_DIRECTOR'),
}
const TEMPERATURE = flag('CHILD_SAMPLING') ? 0.8 : 0

/** A request body larger than this is a fault. The cap stops one request from filling memory. */
const MAX_BODY_BYTES = 1_000_000

/* ── the disclosure ──────────────────────────────────────────────────────────────────────────── */

/**
 * What the app tells the user before the first send. Rules 20, 21, 22, 46, 47 and 48.
 *
 * The text names the destination. The text does not promise that the words stay on this machine.
 * The text does not state a retention term, a training term or a deletion term. The owner has not
 * decided those three terms.
 */
const DISCLOSURE = {
  consent: 'You must give your consent before the app sends your words.',
  destination: [
    'The app sends your words to the model that you choose at startup.',
    'A local Ollama model keeps your words on this machine.',
    'An API key sends your words to that provider.',
    'The omniscient toggle sends the transcript to a service that HoldTrue operates.',
    'The app does not promise that your words stay on this machine.',
  ],
  storage: [
    'The app holds one session in memory.',
    'The app writes nothing to disk.',
    'The findings appear one time.',
    'The app loses the findings when the process stops.',
  ],
  labels: [
    'The omniscient toggle on labels the findings verified.',
    'The omniscient toggle off labels the findings unverified.',
    'An unverified finding comes from the model that you chose at startup.',
  ],
  failure: [
    'The review can fail to run.',
    'The app then states that no review ran.',
    'The questions then stay open.',
  ],
  terms:
    'The owner has not decided the retention terms, the training terms and the deletion terms.',
} as const

/* ── the state ───────────────────────────────────────────────────────────────────────────────── */

/**
 * One user turn and the reply to it.
 * The reason holds the stated silence. The seconds hold the cost of the call.
 */
type Beat = {
  readonly userIndex: number
  readonly seconds: number
  readonly reason: string | null
}

/** The startup choice of the user. The app holds no model before this choice. Rule 50. */
let startup: ModelHandle | null = null
/** True when the startup backend sends the words off this machine. */
let startupSends = false
/**
 * The child's handle. It is `startup` unless the sampling flag is on. The end phase never uses
 * this handle. The end phase always uses `startup`, so the sampling flag never reaches it.
 */
let childModel: ModelHandle | null = null

/**
 * The provided model for the omniscient toggle. It is separate from the startup choice.
 *
 * The owner must set both variables. Rule 50 forbids a default model, and the verified end phase
 * must not run on a model that nobody named. One variable alone gives no provided model, and
 * POST /api/start then refuses the omniscient toggle.
 */
const providedKey = process.env.HOLDTRUE_PROVIDED_KEY ?? ''
const providedModel = process.env.HOLDTRUE_PROVIDED_MODEL ?? ''
const provided: ModelHandle | null =
  providedKey.trim() === '' || providedModel.trim() === ''
    ? null
    : open({ kind: 'apiKey', provider: 'anthropic', key: providedKey, model: providedModel })

let session: Session | null = null
let beats: Beat[] = []
let ended = false
let pending: Pending | null = null
let review: Review | null = null
let source: Attribution | null = null

/* ── the replies ─────────────────────────────────────────────────────────────────────────────── */

const json = (res: ServerResponse, code: number, body: unknown): void => {
  res.writeHead(code, { 'content-type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(body))
}

/**
 * One shaped fault. Every failure of this part uses this shape.
 *
 * The page tells a fault from a turn, because a fault carries the `error` field and a turn does
 * not. A fault must never reach the screen as a line of the child.
 */
const fault = (res: ServerResponse, code: number, kind: string, message: string): void =>
  json(res, code, { error: { kind, message } })

/** The body of one request, as text. A body over the cap is a fault. */
const readBody = async (req: IncomingMessage): Promise<string | null> => {
  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of req) {
    const part = chunk as Buffer
    size += part.length
    if (size > MAX_BODY_BYTES) return null
    chunks.push(part)
  }
  return Buffer.concat(chunks).toString('utf8')
}

/** The body of one request, as an object. Bad JSON is a fault and never an exception. */
const readJson = async (req: IncomingMessage): Promise<Record<string, unknown> | null> => {
  const text = await readBody(req)
  if (text === null) return null
  if (text.trim() === '') return {}
  try {
    const value: unknown = JSON.parse(text)
    return typeof value === 'object' && value !== null && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null
  } catch {
    return null
  }
}

/** One field as a trimmed string. An absent field and an empty field both give null. */
const str = (body: Record<string, unknown>, key: string): string | null => {
  const value = body[key]
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : null
}

/* ── the transcript view ─────────────────────────────────────────────────────────────────────── */

/**
 * The marked transcript, as the pairs that the child prompt reads.
 *
 * The marked transcript is the one source. This function derives the pairs from it. A user turn
 * with no child turn after it is a silence, and the beat holds the reason.
 */
const exchanges = (live: Session): readonly Exchange[] => {
  const out: Exchange[] = []
  for (const turn of live.turns) {
    if (turn.speaker !== 'user') continue
    const next = live.turns[turn.index + 1]
    const beat = beats.find(b => b.userIndex === turn.index)
    // A user turn with no beat is a turn that still runs. The beat arrives when the call ends.
    // The screen must not call that turn a silence. Case B13.
    const child: Said =
      next !== undefined && next.speaker === 'child'
        ? { kind: 'said', line: next.text }
        : beat === undefined
          ? { kind: 'silent', reason: 'the model is still working on this turn' }
          : { kind: 'silent', reason: beat.reason ?? 'no answer from the model' }
    out.push({ you: turn.text, child, seconds: beat?.seconds ?? 0 })
  }
  return out
}

/* ── the routes ──────────────────────────────────────────────────────────────────────────────── */

/** The startup choice, read from one request body. It returns null for a body this code refuses. */
const backendFrom = (body: Record<string, unknown>): Backend | null => {
  const kind = str(body, 'kind')
  if (kind === 'ollama') {
    // Rule 50. The user names the model. This part never reads /api/tags. Case B5.
    const model = str(body, 'model')
    return model === null ? null : { kind: 'ollama', model }
  }
  if (kind === 'apiKey') {
    // Rule 50. The user names the model here as well. The app holds no default for a provider.
    if (str(body, 'provider') !== 'anthropic') return null
    const key = str(body, 'key')
    const model = str(body, 'model')
    return key === null || model === null
      ? null
      : { kind: 'apiKey', provider: 'anthropic', key, model }
  }
  return null
}

const handleSetup = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
  if (session !== null && session.turns.length > 0) {
    return fault(
      res,
      409,
      'session_running',
      'A session holds turns. A model change now would name a model that did not answer. ' +
        'Start another session first.',
    )
  }
  const body = await readJson(req)
  if (body === null) return fault(res, 400, 'bad_request', 'The request body is not an object.')

  const backend = backendFrom(body)
  if (backend === null) {
    return fault(
      res,
      400,
      'bad_request',
      'Choose one backend, and name the model. Send kind "ollama" with a model name. ' +
        'Send kind "apiKey" with provider "anthropic", a key and a model name. ' +
        'The app ships no default model.',
    )
  }

  startup = open(backend)
  childModel = TEMPERATURE === 0 ? startup : open(backend, TEMPERATURE)
  startupSends = backend.kind === 'apiKey'
  json(res, 200, { who: await startup.identify(), sends: startupSends })
}

const handleStart = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
  if (startup === null) {
    return fault(
      res,
      409,
      'no_setup',
      'No model is chosen. The app ships no default model. Choose one model first.',
    )
  }
  const body = await readJson(req)
  if (body === null) return fault(res, 400, 'bad_request', 'The request body is not an object.')

  const topic = str(body, 'topic')
  if (topic === null) return fault(res, 400, 'bad_request', 'The request holds no topic.')

  const omniscient = body['omniscient']
  if (typeof omniscient !== 'boolean') {
    return fault(
      res,
      400,
      'bad_request',
      'The request must set the omniscient toggle to true or to false.',
    )
  }

  // Rule 45. The app states this refusal. The app never puts the startup model in place.
  if (omniscient && provided === null) {
    return fault(
      res,
      409,
      'no_provided_model',
      'The app holds no provided model. The app does not put the startup model in its place. ' +
        'Turn the omniscient toggle off, or set a provided model.',
    )
  }

  // Rule 48. The app takes the consent before the first send. A local model sends nothing.
  const sends = omniscient || startupSends
  if (sends && body['consent'] !== true) {
    return fault(
      res,
      403,
      'no_consent',
      'This session sends your words off this machine. Send consent true to start it.',
    )
  }

  session = startSession(topic, omniscient)
  beats = []
  ended = false
  pending = null
  review = null
  source = null
  json(res, 200, { topic, omniscient, label: omniscient ? 'verified' : 'unverified' })
}

const handleTurn = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
  // Rule 50. No setup means no model. The app states that, and it picks nothing.
  if (startup === null || childModel === null) {
    return fault(
      res,
      409,
      'no_setup',
      'No model is chosen. The app ships no default model. Choose one model first.',
    )
  }
  const live = session
  if (live === null) return fault(res, 409, 'no_session', 'No session is open. Start one first.')
  if (ended) {
    return fault(
      res,
      409,
      'session_ended',
      'The session ended. The end phase runs now. The live phase must not run after it.',
    )
  }

  const body = await readJson(req)
  if (body === null) return fault(res, 400, 'bad_request', 'The request body is not an object.')
  const said = str(body, 'said')
  if (said === null) return fault(res, 400, 'bad_request', 'The request holds no words.')

  // Rule 10. The words go in untouched. The trim above removes the wrapper of the request only.
  const history = exchanges(live)
  const withUser = addTurn(live, 'user', said)
  const userIndex = withUser.turns.length - 1

  // The typed line goes into the session before the model call. A reload during the call then
  // still shows the line. The old code assigned the session after the call, and a reload two
  // seconds into a five second call showed an empty transcript. Case B13.
  session = withUser
  const started = Date.now()
  // Rule 1. One model call for each turn. Case B7. The topic goes to the model.
  const child = await speak(history, said, childModel, live.topic, CHILD_OPTIONS)
  const seconds = (Date.now() - started) / 1000

  // A silent child turn carries no text, so the marked transcript holds spoken turns only. The
  // beat holds the reason, and the state route reports it. Case B13.
  session = child.kind === 'said' ? addTurn(withUser, 'child', child.line) : withUser
  beats = [...beats, { userIndex, seconds, reason: child.kind === 'silent' ? child.reason : null }]

  json(res, 200, { kind: 'turn', you: said, child, seconds, index: userIndex })
}

const handleEnd = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
  const live = session
  if (live === null) return fault(res, 409, 'no_session', 'No session is open. Start one first.')
  if (review !== null) return json(res, 200, { kind: 'review', review, source })

  const body = await readJson(req)
  if (body === null) return fault(res, 400, 'bad_request', 'The request body is not an object.')

  // The live phase stops here. The end phase must never run beside it.
  ended = true

  const model = live.omniscient ? provided : startup
  if (model === null) {
    review = unavailable(
      live.omniscient
        ? 'The omniscient toggle is on, and the app holds no provided model. ' +
          'The app did not put the startup model in its place.'
        : 'No model is chosen. The app ships no default model.',
    )
    return json(res, 200, { kind: 'review', review, source: null })
  }

  if (pending === null) {
    const step = await openEnd(live, model)
    if ('pending' in step) {
      pending = step.pending
      return json(res, 200, { kind: 'probe', question: step.pending.question })
    }
    review = step.review
  } else {
    // The question stays fixed between the two calls, so the answer matches the question that the
    // user read. Probe runs one time in a session. Rule 41.
    review = await closeEnd(live, model, pending, str(body, 'answer'))
  }

  source = await model.identify()
  json(res, 200, { kind: 'review', review, source })
}

const handleBoot = async (res: ServerResponse): Promise<void> =>
  json(res, 200, {
    // Rule 50. The app names no model before the user chooses one.
    who: startup === null ? null : await startup.identify(),
    setup: startup !== null,
    sends: startupSends,
    provided: provided !== null,
    topics: TOPICS,
    disclosure: DISCLOSURE,
  })

const handleState = (res: ServerResponse): void => {
  const live = session
  json(res, 200, {
    setup: startup !== null,
    topic: live?.topic ?? '',
    omniscient: live?.omniscient ?? false,
    history: live === null ? [] : exchanges(live),
    turns: live?.turns ?? [],
    ended,
    question: pending?.question ?? null,
    review,
    source,
  })
}

/* ── the server ──────────────────────────────────────────────────────────────────────────────── */

createServer(async (req, res) => {
  try {
    const url = req.url ?? ''
    const method = req.method ?? 'GET'

    if (method === 'GET' && (url === '/' || url === '/index.html')) {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
      res.end(readFileSync(join(HERE, 'page.html'), 'utf8'))
      return
    }
    if (method === 'GET' && url === '/api/boot') return await handleBoot(res)
    if (method === 'GET' && url === '/api/state') return handleState(res)
    if (method === 'POST' && url === '/api/setup') return await handleSetup(req, res)
    if (method === 'POST' && url === '/api/start') return await handleStart(req, res)
    if (method === 'POST' && url === '/api/turn') return await handleTurn(req, res)
    if (method === 'POST' && url === '/api/end') return await handleEnd(req, res)

    fault(res, 404, 'not_found', 'This address holds no route.')
  } catch (error) {
    // A fault of the server keeps the shape of every other fault. The page can tell a fault from a
    // turn, so a broken server never reaches the screen as a line of the child.
    fault(res, 500, 'server_fault', error instanceof Error ? error.message : String(error))
  }
}).listen(PORT, ADDRESS, () => {
  console.log(`\n  http://${ADDRESS}:${PORT}\n`)
  console.log('  This server answers 127.0.0.1 only. The transcript does not reach the network.')
  console.log('  There is no default model. Choose one model at startup.')
  console.log('  One session in memory. Nothing on disk. The findings appear one time.\n')
})
