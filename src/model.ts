/**
 * The model layer. It holds three backends behind one interface.
 *
 * The part opens a handle for a backend. The caller then asks the handle for one answer.
 * Ollama runs on the machine of the user. The apiKey backend sends the text to Anthropic. The
 * openai backend sends the text to an OpenAI-compatible endpoint: a local proxy or a provider.
 * `identify` names the model that answered. `ask` returns a string or null, and `ask` never
 * throws. `lastReason` gives the reason for the last failed ask. Each distinct failure gets a
 * distinct reason.
 *
 * This part serves case B5, case B11 and case B13. It also serves rules 23, 24, 25, 45 and 50.
 *
 * The part must not do these things:
 * - It must not throw from `ask`. A model that the app cannot reach is a result.
 * - It must not pick a model from `/api/tags`. That silent pick is the defect of case B5.
 * - It must not hold a default model name. Rule 50 forbids a default. The caller names the model.
 * - It must not hold an API key as a literal. The caller passes the key.
 * - It must not give one reason for two different failures. That merge is the defect of case B11.
 * - It must not name a model in the attribution that did not answer.
 * - It must not read, judge or edit the words of the user.
 *
 * Two notes on the Ollama request. A caller can pass a temperature. The default stays 0. No
 * evidence shows a higher temperature buys fluency the prompt cannot. Temperature 0 also does
 * not buy byte-determinism on this runner. `docs/proposals/director-experiment.md` owns the
 * sampling flag. Only `temperature` goes to a backend. `min_p`, `top_p` and a penalty stay out,
 * because not every backend holds them.
 * The request sends no `format` field. Five probes on 2026-08-12 showed that this backend
 * ignores `format`. A bogus format value returned HTTP 200.
 *
 * One note on the model name. No backend has a default. Rule 50 forbids a default model. The
 * caller must name the model for every backend. Without a name `identify` reports that no model
 * is chosen, and `ask` returns null with that reason.
 *
 * One note on the openai key. The key is optional for this backend. A local proxy can take no
 * key. An empty key sends the request with no `authorization` header. A non-empty key sends
 * `Bearer <key>`. The apiKey backend keeps its key as required; only the openai backend bends.
 */

/** The address of the local backend. The code reads the variable when the caller opens a handle. */
const OLLAMA_FALLBACK_HOST = 'http://127.0.0.1:11434'

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'
const ANTHROPIC_VERSION = '2023-06-01'

/** The request stops after this many milliseconds. A stopped request is a stated failure. */
export const TIMEOUT_MS = 120_000

/** Anthropic requires a token budget. The end phase returns a list, so the budget is not small. */
const MAX_TOKENS = 4096
/**
 * The budget on an OpenAI-compatible endpoint. A model that thinks spends tokens before its
 * answer. A budget of 4096 gave such a model empty text on 2026-09-01. A model that does not
 * think never uses the room.
 */
const OPENAI_MAX_TOKENS = 16_384

/**
 * Every reason that this part can give, except the reasons that carry a status code.
 * A test imports these strings. A caller prints them.
 */
export const REASON = {
  NO_MODEL: 'no model is chosen',
  NO_KEY: 'no API key is given',
  UNREACHABLE: 'the backend does not answer',
  TIMEOUT: 'the request timed out',
  EMPTY: 'the model returned empty text',
  BUDGET_SPENT: 'the model spent its token budget before the answer',
  UNREADABLE: 'the backend returned a body this code cannot read',
  NO_ANSWER_YET: 'no model has answered yet',
} as const

/** What answered, and how the app reached it. The reason field explains a name that is not final. */
export type Attribution = {
  readonly model_id: string
  readonly runtime: string
  /** No calibration procedure exists. The honest word is the only inhabited value. */
  readonly calibration: 'uncalibrated'
  readonly reason?: string
}

/**
 * The one interface. The child, Check, Probe and Close call this and never a provider API.
 * `ask` returns null for every failure. `lastReason` then names the failure.
 * `lastReason` is optional so that a test can build a handle with two methods.
 */
export type ModelHandle = {
  readonly identify: () => Promise<Attribution>
  readonly ask: (system: string, user: string) => Promise<string | null>
  readonly lastReason?: () => string | null
}

/** The startup choice of the user. The user picks one backend and one model name. */
export type Backend =
  | { readonly kind: 'ollama'; readonly model?: string }
  | {
      readonly kind: 'apiKey'
      readonly provider: 'anthropic'
      readonly key: string
      readonly model?: string
    }
  | {
      readonly kind: 'openai'
      readonly baseUrl: string
      readonly key: string
      readonly model?: string
    }

/** The result of one attempt. The failed member carries one reason. */
export type AskResult =
  | { readonly ok: true; readonly text: string; readonly modelId: string | null }
  | { readonly ok: false; readonly reason: string }

/** A body that this code could not read is a failure, not an empty answer. */
type Body = { readonly ok: true; readonly json: unknown } | { readonly ok: false; readonly reason: string }

const host = (): string => (process.env.OLLAMA_HOST ?? OLLAMA_FALLBACK_HOST).replace(/\/+$/, '')

/** Drop a trailing slash so a url join never doubles one up. */
const stripSlash = (url: string): string => url.replace(/\/+$/, '')

/** A timeout and a dead backend are two failures. This test separates them. */
const timedOut = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) return false
  const name = (error as { name?: unknown }).name
  return name === 'TimeoutError' || name === 'AbortError'
}

/** The local backend gives a status. This function turns the status into one reason. */
const ollamaStatus = (status: number): string =>
  status === 404 ? 'the model name does not exist' : `the local backend returned status ${status}`

/** The provider gives a status. This function turns the status into one reason. */
const anthropicStatus = (status: number): string => {
  if (status === 401 || status === 403) return 'the provider rejected the key'
  if (status === 404) return 'the model name does not exist'
  if (status === 429) return 'the provider refused the request for rate'
  if (status === 400) return 'the provider rejected the request'
  return `the provider returned status ${status}`
}

/** The OpenAI-compatible endpoint gives a status. This function turns the status into one reason. */
const openaiStatus = (status: number): string => {
  if (status === 401 || status === 403) return 'the endpoint rejected the key'
  if (status === 404) return 'the model name does not exist'
  return `the endpoint returned status ${status}`
}

/** One POST. It never throws. It gives a reason for a dead backend, a timeout and a bad status. */
const post = async (
  url: string,
  headers: Record<string, string>,
  payload: unknown,
  status: (code: number) => string,
): Promise<Body> => {
  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch (error) {
    return { ok: false, reason: timedOut(error) ? REASON.TIMEOUT : REASON.UNREACHABLE }
  }
  if (!response.ok) return { ok: false, reason: status(response.status) }
  try {
    return { ok: true, json: await response.json() }
  } catch {
    return { ok: false, reason: REASON.UNREADABLE }
  }
}

/** Read the one line from an Ollama chat body. */
const readOllama = (json: unknown): AskResult => {
  const body = json as { message?: { content?: unknown }; model?: unknown }
  const text = typeof body.message?.content === 'string' ? body.message.content : ''
  if (text.trim() === '') return { ok: false, reason: REASON.EMPTY }
  return { ok: true, text, modelId: typeof body.model === 'string' ? body.model : null }
}

/**
 * Read the text blocks from an Anthropic messages body.
 * A model that thinks can spend the whole budget before its answer. The body then holds no text
 * and the stop reason names the budget. That is a distinct failure. Rule 25.
 */
const readAnthropic = (json: unknown): AskResult => {
  const body = json as { content?: unknown; model?: unknown; stop_reason?: unknown }
  const blocks = Array.isArray(body.content) ? body.content : []
  const text = blocks
    .map(block => {
      const part = block as { type?: unknown; text?: unknown }
      return part.type === 'text' && typeof part.text === 'string' ? part.text : ''
    })
    .join('')
  if (text.trim() === '') {
    return { ok: false, reason: body.stop_reason === 'max_tokens' ? REASON.BUDGET_SPENT : REASON.EMPTY }
  }
  return { ok: true, text, modelId: typeof body.model === 'string' ? body.model : null }
}

/**
 * Read the first choice from an OpenAI-compatible chat completions body.
 * A model that thinks puts its thought in a separate field, and it can spend the whole budget
 * there. The content is then empty and the finish reason is `length`. That is a distinct
 * failure. Rule 25.
 */
const readOpenai = (json: unknown): AskResult => {
  const body = json as { choices?: unknown; model?: unknown }
  const choices = Array.isArray(body.choices) ? body.choices : []
  const first = choices[0] as { message?: { content?: unknown }; finish_reason?: unknown } | undefined
  const text = typeof first?.message?.content === 'string' ? first.message.content : ''
  if (text.trim() === '') {
    return { ok: false, reason: first?.finish_reason === 'length' ? REASON.BUDGET_SPENT : REASON.EMPTY }
  }
  return { ok: true, text, modelId: typeof body.model === 'string' ? body.model : null }
}

/**
 * Open one handle for one backend.
 *
 * The handle holds no state except the name of the model that answered, and the last reason.
 * The handle makes no call until the caller asks. `identify` therefore makes no network call.
 */
export const open = (backend: Backend, temperature = 0): ModelHandle => {
  const runtime =
    backend.kind === 'ollama'
      ? `ollama @ ${host()}`
      : backend.kind === 'openai'
        ? `openai @ ${stripSlash(backend.baseUrl)}`
        : `anthropic @ ${ANTHROPIC_URL}`

  /** No backend has a default. Rule 50. The caller names the model, or no model is chosen. */
  const configured: string | null = backend.model ?? null

  let answered: string | null = null
  let last: string | null = null

  const attempt = async (system: string, user: string): Promise<AskResult> => {
    if (configured === null) return { ok: false, reason: REASON.NO_MODEL }

    if (backend.kind === 'ollama') {
      const body = await post(
        `${host()}/api/chat`,
        { 'content-type': 'application/json' },
        {
          model: configured,
          stream: false,
          think: false,
          options: { temperature },
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
        },
        ollamaStatus,
      )
      return body.ok ? readOllama(body.json) : { ok: false, reason: body.reason }
    }

    if (backend.kind === 'openai') {
      const headers: Record<string, string> = { 'content-type': 'application/json' }
      if (backend.key.trim() !== '') headers.authorization = `Bearer ${backend.key}`
      const body = await post(
        `${stripSlash(backend.baseUrl)}/chat/completions`,
        headers,
        {
          model: configured,
          temperature,
          max_tokens: OPENAI_MAX_TOKENS,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
        },
        openaiStatus,
      )
      return body.ok ? readOpenai(body.json) : { ok: false, reason: body.reason }
    }

    if (backend.key.trim() === '') return { ok: false, reason: REASON.NO_KEY }
    const body = await post(
      ANTHROPIC_URL,
      {
        'content-type': 'application/json',
        'x-api-key': backend.key,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      {
        model: configured,
        max_tokens: MAX_TOKENS,
        temperature,
        system,
        messages: [{ role: 'user', content: user }],
      },
      anthropicStatus,
    )
    return body.ok ? readAnthropic(body.json) : { ok: false, reason: body.reason }
  }

  return {
    identify: async () => {
      const notes: string[] = []
      if (configured === null) {
        return {
          model_id: 'none',
          runtime,
          calibration: 'uncalibrated',
          reason: REASON.NO_MODEL,
        }
      }
      if (answered === null) notes.push(REASON.NO_ANSWER_YET)
      const base = {
        model_id: answered ?? configured,
        runtime,
        calibration: 'uncalibrated',
      } as const
      return notes.length === 0 ? base : { ...base, reason: notes.join('; ') }
    },

    ask: async (system, user) => {
      const result = await attempt(system, user)
      last = result.ok ? null : result.reason
      if (!result.ok) return null
      if (result.modelId !== null) answered = result.modelId
      return result.text
    },

    lastReason: () => last,
  }
}

/**
 * The local backend, by name.
 *
 * The caller must give the model name. Without a name `identify` reports that no model is chosen,
 * and `ask` returns null with that reason. This function never reads `/api/tags`.
 */
export const ollama = (model?: string, temperature = 0): ModelHandle =>
  open(model === undefined ? { kind: 'ollama' } : { kind: 'ollama', model }, temperature)

/**
 * The OpenAI-compatible backend, by base url and key.
 *
 * The caller must give the model name. Without a name `identify` reports that no model is
 * chosen, and `ask` returns null with that reason.
 */
export const openai = (baseUrl: string, key: string, model?: string, temperature = 0): ModelHandle =>
  open(
    model === undefined ? { kind: 'openai', baseUrl, key } : { kind: 'openai', baseUrl, key, model },
    temperature,
  )
