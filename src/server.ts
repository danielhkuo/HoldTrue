/**
 * The server. This part holds the routes and the one session in memory.
 *
 * The part owns nine routes. It serves the page. It reports the boot state and the disclosure.
 * It takes the startup model choice. It starts a session. It runs one live turn. It runs the end
 * phase. It reports the state after a reload. It turns one recording into words. It turns one
 * line of the child into audio.
 *
 * The part binds to 127.0.0.1 only. Case B12 requires this. The transcript never reaches the
 * network. The part holds one session in memory, and it writes nothing to disk. Rule 47.
 *
 * The part ships no default model. Rule 50 requires this. The user calls POST /api/setup one
 * time. Before that call POST /api/turn returns a stated error. The part never picks a model.
 *
 * The part takes the consent of the user before the first send. Rule 48 requires this.
 * Every session sends the transcript to the provided model at the end, so POST /api/start
 * refuses every session without explicit consent in the request.
 * POST /api/start refuses to start a session when the app holds no provided model. Decision 20.
 * The owner may name several provided models on one endpoint. The person picks one for each
 * session, and the app picks none. Decision 25 and rule 50.
 * The end phase runs on the provided model only. Rule 53. The part never puts the startup model
 * in place of the provided model. Rule 45.
 *
 * The end phase runs one time, and only after POST /api/end. The live phase then stops.
 * POST /api/turn returns a stated error after the end phase starts.
 *
 * The speech routes keep the audio on this machine. `POST /api/hear` takes PCM, and the ear in
 * `src/speech.ts` turns it into words inside this process. The words go back to the page, and
 * the page sends them to `POST /api/turn` the way it sends typed words. Rule 10 holds: this part
 * never edits them. `POST /api/say` takes one line and returns a WAV. Neither route makes a model
 * call, so rule 1 holds for the turn. Neither route writes to disk. Rule 47.
 *
 * The cases: B5, B7, B11, B12, B13, V1, V2 and V3. The rules: 1, 10, 11, 13, 22, 23, 41, 42, 45,
 * 46, 47, 48, 50 and 53.
 *
 * The part must not do these things:
 * - It must not bind an address other than 127.0.0.1.
 * - It must not choose a model for the user.
 * - It must not send text before the user gives consent.
 * - It must not render a fault as a line of the child. Every fault returns a shaped error object.
 * - It must not read, judge or edit the words of the user. Rule 10.
 * - It must not show a score, a rating or a grade. Rule 16.
 * - It must not write to disk. Audio stays in memory for one request.
 * - It must not send audio off this machine. The ear and the voice run inside this process.
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
import { NO_PROVIDED_FIX, providedFrom } from './provided.js'
import {
  addTurn,
  closeEnd,
  openEnd,
  startSession,
  unavailable,
  type Pending,
  type Session,
} from './session.js'
import { REASON as SPEECH, openSpeech, pcmFromBytes, wavFromWave } from './speech.js'
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
/** A recording larger than this is a fault. At 16 kHz and 16 bits this is about twenty minutes. */
const MAX_AUDIO_BYTES = 40_000_000

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
    'A local Ollama model keeps your words on this machine during the conversation.',
    'An API key sends your words to that provider during the conversation.',
    'At the end, the review sends the whole transcript to the provider of the provided model.',
    'The app does not promise that your words stay on this machine.',
  ],
  storage: [
    'The app holds one session in memory.',
    'The app writes nothing to disk.',
    'The findings appear one time.',
    'The app loses the findings when the process stops.',
  ],
  failure: [
    'The review can fail to run.',
    'The app then states that no review ran.',
    'The questions then stay open.',
  ],
  // Cases V1, V2 and V3. The audio never leaves this process. The words go where typed words go.
  voice: [
    'The app turns your voice into words on this machine, with the speech model that the owner names.',
    'The app sends the words to the model that you chose. The app does not send the audio.',
    'The app reads the lines of the child aloud on this machine.',
    'The app holds the audio in memory for one turn. The app writes no audio to disk.',
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
 * this handle. The end phase always uses `provided`. Rule 53. The sampling flag never reaches it.
 */
let childModel: ModelHandle | null = null

/**
 * The provided models. They are separate from the startup choice, and rule 53 gives one of them
 * the whole end phase. `src/provided.ts` reads the variables. The owner names one model, or
 * several with commas between them, on one endpoint. The person picks one at the start of each
 * session. The app picks none. Rule 50. Decision 25.
 *
 * Rule 50 forbids a default model, and the end phase must not run on a model that nobody named.
 * No name gives no provided model, and POST /api/start then refuses to start a session.
 * Decision 20.
 */
const provided = providedFrom(process.env)
/** One handle for each named model, by name. Every handle answers from the one destination. */
const reviewers: ReadonlyMap<string, ModelHandle> = new Map(
  (provided?.backends ?? []).map(backend => [backend.model ?? '', open(backend)]),
)
/**
 * The host that the provided models answer from, and never the key. Decision 21 and rule 48 ask
 * the app to name the destination in the consent sentence. `null` means the app holds no
 * provided model, so it has no destination to name.
 */
const providedDestination: string | null = provided?.destination ?? null

/**
 * The ear and the voice. Both run inside this process on the machine of the user. The owner names
 * the model directories with HOLDTRUE_STT_DIR and HOLDTRUE_TTS_DIR. There is no default. Rule 50.
 * An absent member carries its reason, and the boot route reports the reason to the page.
 */
const speech = await openSpeech(process.env)

let session: Session | null = null
/** The provided model that this session picked for the review. Rule 53. */
let reviewer: ModelHandle | null = null
let reviewerName: string | null = null
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

/** The body of one request, as bytes. A body over the cap is a fault. */
const readBytes = async (req: IncomingMessage, cap: number): Promise<Buffer | null> => {
  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of req) {
    const part = chunk as Buffer
    size += part.length
    if (size > cap) return null
    chunks.push(part)
  }
  return Buffer.concat(chunks)
}

/** The body of one request, as text. A body over the cap is a fault. */
const readBody = async (req: IncomingMessage): Promise<string | null> => {
  const bytes = await readBytes(req, MAX_BODY_BYTES)
  return bytes === null ? null : bytes.toString('utf8')
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

  // Decision 20. A session that cannot end with a review must not begin. Law 1.
  if (provided === null) {
    return fault(
      res,
      409,
      'no_provided_model',
      `The app holds no provided model. The review cannot run, so the session cannot start. ${NO_PROVIDED_FIX}`,
    )
  }

  // Rule 48. Every session sends the transcript to the provided model at the end. The app takes
  // the consent before the first send, so the app takes it before every session starts.
  if (body['consent'] !== true) {
    return fault(
      res,
      403,
      'no_consent',
      'This session sends your words to the provider at the end. Send consent true to start it.',
    )
  }

  // Rule 50 and decision 25. One name on the list needs no choice, because the owner made it.
  // Several names need a choice from the person, and the app never picks for them.
  const names = [...reviewers.keys()]
  const wanted = str(body, 'providedModel')
  const chosen = wanted === null && names.length === 1 ? (names[0] ?? null) : wanted
  const handle = chosen === null ? undefined : reviewers.get(chosen)
  if (chosen === null || handle === undefined) {
    return fault(
      res,
      400,
      'no_review_model',
      `Choose the model that runs the review. Send providedModel as one of: ${names.join(', ')}.`,
    )
  }
  reviewer = handle
  reviewerName = chosen

  session = startSession(topic)
  beats = []
  ended = false
  pending = null
  review = null
  source = null
  json(res, 200, { topic })
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

  // Rule 53. The end phase runs on the provided model only, never on the startup model.
  const model = reviewer
  if (model === null) {
    // POST /api/start already refuses a session when the app holds no provided model. Decision
    // 20. This check stays, because a session must never end with a silent gap. Rule 46.
    review = unavailable(`The app holds no provided model. ${NO_PROVIDED_FIX}`)
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

/**
 * One recording to words. Case V1.
 *
 * The body is 16-bit PCM, one channel, little-endian. The `x-sample-rate` header carries the
 * rate. The ear resamples when the rate differs from the rate of the model. The reply carries
 * the words as the engine wrote them. Rule 10. It carries no confidence and no pause. The
 * seconds field is the cost of the call, as in POST /api/turn. Rule 18.
 * The page then sends the words to POST /api/turn, or into the probe answer, as the user
 * chooses. This route makes no model call and it touches no session state.
 */
const handleHear = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
  if (session === null) return fault(res, 409, 'no_session', 'No session is open. Start one first.')
  const ear = speech.ear
  if (ear === null) {
    return fault(res, 409, 'no_ear', `The app holds no speech-to-text model: ${speech.reasons.ear}.`)
  }
  const rate = Number(req.headers['x-sample-rate'] ?? '')
  if (!Number.isInteger(rate) || rate <= 0) {
    return fault(res, 400, 'bad_request', 'The request names no sample rate. Send x-sample-rate.')
  }
  const bytes = await readBytes(req, MAX_AUDIO_BYTES)
  if (bytes === null) return fault(res, 413, 'too_long', 'The recording is longer than the app takes.')
  const samples = pcmFromBytes(new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength))
  if (samples === null) return fault(res, 400, 'bad_request', 'The request holds no audio.')

  const started = Date.now()
  const heard = await ear.hear({ samples, sampleRate: rate })
  const seconds = (Date.now() - started) / 1000
  if (!heard.ok) {
    // Rule 25. The ear that heard nothing and the ear that failed are two different results.
    const nothing = heard.reason === SPEECH.NOTHING_HEARD
    return fault(res, nothing ? 422 : 502, nothing ? 'nothing_heard' : 'ear_failed', heard.reason)
  }
  json(res, 200, { kind: 'heard', said: heard.text, seconds, who: ear.identify() })
}

/**
 * One line to audio. Case V2. The reply is a WAV in the body, and nothing reaches a disk. The
 * `x-model` header names the model directory that answered. Rule 24.
 */
const handleSay = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
  const voice = speech.voice
  if (voice === null) {
    return fault(res, 409, 'no_voice', `The app holds no text-to-speech model: ${speech.reasons.voice}.`)
  }
  const body = await readJson(req)
  if (body === null) return fault(res, 400, 'bad_request', 'The request body is not an object.')
  const text = str(body, 'text')
  if (text === null) return fault(res, 400, 'bad_request', 'The request holds no text.')

  const said = await voice.say(text)
  if (!said.ok) return fault(res, 502, 'voice_failed', said.reason)
  const wav = wavFromWave(said.wave)
  res.writeHead(200, {
    'content-type': 'audio/wav',
    'content-length': wav.length,
    'x-model': voice.identify().model_id,
  })
  res.end(wav)
}

const handleBoot = async (res: ServerResponse): Promise<void> =>
  json(res, 200, {
    // Rule 50. The app names no model before the user chooses one.
    who: startup === null ? null : await startup.identify(),
    setup: startup !== null,
    sends: startupSends,
    provided: reviewers.size > 0,
    // Decision 25. The names on the list. The page asks for one when the list holds several.
    providedModels: [...reviewers.keys()],
    // Decision 21 and rule 48. The consent sentence names this host. It never carries the key.
    destination: providedDestination,
    topics: TOPICS,
    disclosure: DISCLOSURE,
    // Cases V1 and V2. The page shows the Talk button and plays the child only when these exist.
    speech: {
      ear: speech.ear?.identify() ?? null,
      voice: speech.voice?.identify() ?? null,
      reasons: speech.reasons,
    },
  })

const handleState = (res: ServerResponse): void => {
  const live = session
  json(res, 200, {
    setup: startup !== null,
    topic: live?.topic ?? '',
    history: live === null ? [] : exchanges(live),
    turns: live?.turns ?? [],
    ended,
    providedModel: reviewerName,
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
    if (method === 'POST' && url === '/api/hear') return await handleHear(req, res)
    if (method === 'POST' && url === '/api/say') return await handleSay(req, res)

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
  console.log('  One session in memory. Nothing on disk. The findings appear one time.')
  console.log(
    speech.ear === null
      ? `  No ear: ${speech.reasons.ear}. Set HOLDTRUE_STT_DIR to a sherpa-onnx model directory.`
      : `  The ear is ${speech.ear.identify().model_id}. Audio stays in this process.`,
  )
  console.log(
    speech.voice === null
      ? `  No voice: ${speech.reasons.voice}. Set HOLDTRUE_TTS_DIR to a sherpa-onnx model directory.\n`
      : `  The voice is ${speech.voice.identify().model_id}.\n`,
  )
})
