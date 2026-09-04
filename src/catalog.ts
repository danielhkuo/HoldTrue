/**
 * The catalog. This part lists the chat models that one endpoint offers.
 *
 * The person picks a model from a list, and the app types no name for them. The list comes from
 * the endpoint itself, so the app holds no catalog of its own and no default. Rule 50. Case B5
 * is a silent pick from such a list. This part lists. It never picks.
 *
 * Each endpoint kind has its own list shape. Ollama and Anthropic state what each model can do,
 * and this part reads those fields. NVIDIA and a custom endpoint give ids only, and this part
 * reads the id. An id filter has known misses, and `docs/architecture.md` states them.
 *
 * A listed model carries one flag, `thinks`. The page labels such a model, because a model that
 * thinks spends tokens before its answer. Rule 25 gives that case its own reason in `model.ts`.
 *
 * This part serves rules 23, 25, 32 and 50.
 *
 * This part must not do these things:
 * - It must not throw. A dead endpoint, a rejected key and an unreadable body are results.
 * - It must not sort a list to put one model first, and it must not pick one.
 * - It must not send a key to any host but the one the kind names.
 */

import { REASON } from './model.js'
import { ANTHROPIC_HOST, NVIDIA_URL, stripSlash, type EndpointKind } from './settings.js'

/** One model on the list. */
export type Listed = { readonly id: string; readonly thinks: boolean }

/** What a list gives. */
export type ListResult =
  | { readonly ok: true; readonly models: readonly Listed[] }
  | { readonly ok: false; readonly reason: string }

/** The anthropic version header. `model.ts` sends the same one. */
const ANTHROPIC_VERSION = '2023-06-01'

/** The list request stops after this many milliseconds. */
const TIMEOUT_MS = 20_000

/* ── the shapes ──────────────────────────────────────────────────────────────────────────────── */

const strings = (value: unknown): readonly string[] =>
  Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []

/** The Ollama tag list. A tag with a capability list must hold `completion` and not `embedding`. */
export const fromOllamaTags = (json: unknown): readonly Listed[] => {
  const models = (json as { models?: unknown } | null)?.models
  if (!Array.isArray(models)) return []
  const out: Listed[] = []
  for (const tag of models) {
    const { name, capabilities } = (tag ?? {}) as { name?: unknown; capabilities?: unknown }
    if (typeof name !== 'string' || name === '') continue
    if (capabilities === undefined) {
      out.push({ id: name, thinks: false })
      continue
    }
    const can = strings(capabilities)
    if (!can.includes('completion') || can.includes('embedding')) continue
    out.push({ id: name, thinks: can.includes('thinking') })
  }
  return out
}

/**
 * The ids that are not chat models on an endpoint that gives ids only. Embeddings, rerankers,
 * reward models, guard and safety models, parsers, vision-only and code-only models.
 */
const NOT_CHAT =
  /embed|nvclip|rerank|reward|guard|safety|topic-control|parse|deplot|kosmos|fuyu|neva|vila|detector|riva|calibration|diffusion|starcoder|codegemma|codellama|codestral|-base$|recurrentgemma/i

/** The ids of models that think, on an endpoint that gives no capability field. */
const THINKS =
  /reasoning|deepseek-v4|deepseek-r|kimi-k3|minimax-m3|nemotron-3|nemotron-ultra|gpt-oss|qwq|qwen3|magistral|think/i

/** An OpenAI-compatible model list. The id is all this shape gives. */
export const fromOpenaiList = (json: unknown): readonly Listed[] => {
  const data = (json as { data?: unknown } | null)?.data
  if (!Array.isArray(data)) return []
  const out: Listed[] = []
  for (const item of data) {
    const id = (item as { id?: unknown } | null)?.id
    if (typeof id !== 'string' || id === '' || NOT_CHAT.test(id)) continue
    out.push({ id, thinks: THINKS.test(id) })
  }
  return out
}

/** The Anthropic model list. Every entry is a chat model, and the capabilities name thinking. */
export const fromAnthropicList = (json: unknown): readonly Listed[] => {
  const data = (json as { data?: unknown } | null)?.data
  if (!Array.isArray(data)) return []
  const out: Listed[] = []
  for (const item of data) {
    const { id, capabilities } = (item ?? {}) as { id?: unknown; capabilities?: unknown }
    if (typeof id !== 'string' || id === '') continue
    const thinking = (capabilities as { thinking?: { supported?: unknown } } | undefined)?.thinking
    out.push({ id, thinks: thinking?.supported === true })
  }
  return out
}

/* ── the request ─────────────────────────────────────────────────────────────────────────────── */

const timedOut = (error: unknown): boolean => {
  const name = (error as { name?: unknown } | null)?.name
  return name === 'TimeoutError' || name === 'AbortError'
}

const status = (code: number): string =>
  code === 401 || code === 403 ? 'the endpoint rejected the key' : `the endpoint returned status ${code}`

/** One GET. It never throws. */
const get = async (url: string, headers: Record<string, string>): Promise<ListResult | { readonly json: unknown }> => {
  let response: Response
  try {
    response = await fetch(url, { method: 'GET', headers, signal: AbortSignal.timeout(TIMEOUT_MS) })
  } catch (error) {
    return { ok: false, reason: timedOut(error) ? REASON.TIMEOUT : REASON.UNREACHABLE }
  }
  if (!response.ok) return { ok: false, reason: status(response.status) }
  try {
    return { json: await response.json() }
  } catch {
    return { ok: false, reason: REASON.UNREADABLE }
  }
}

/**
 * The models that one endpoint offers.
 *
 * `url` is the Ollama host or the custom endpoint url. NVIDIA and Anthropic have fixed addresses
 * and ignore it. `key` goes to the endpoint that the kind names, and to no other host. NVIDIA
 * lists without a key. Anthropic needs one.
 */
export const listModels = async (
  kind: EndpointKind,
  url: string | null,
  key: string | null,
): Promise<ListResult> => {
  const bearer = key !== null && key !== '' ? { authorization: `Bearer ${key}` } : {}
  if (kind === 'ollama') {
    const got = await get(`${stripSlash(url ?? '')}/api/tags`, {})
    return 'json' in got ? { ok: true, models: fromOllamaTags(got.json) } : got
  }
  if (kind === 'nvidia') {
    const got = await get(`${NVIDIA_URL}/models`, bearer)
    return 'json' in got ? { ok: true, models: fromOpenaiList(got.json) } : got
  }
  if (kind === 'anthropic') {
    if (key === null || key === '') return { ok: false, reason: REASON.NO_KEY }
    const got = await get(`https://${ANTHROPIC_HOST}/v1/models?limit=1000`, {
      'x-api-key': key,
      'anthropic-version': ANTHROPIC_VERSION,
    })
    return 'json' in got ? { ok: true, models: fromAnthropicList(got.json) } : got
  }
  const base = stripSlash(url ?? '')
  if (base === '') return { ok: false, reason: 'no endpoint url is given' }
  const got = await get(`${base}/models`, bearer)
  return 'json' in got ? { ok: true, models: fromOpenaiList(got.json) } : got
}
