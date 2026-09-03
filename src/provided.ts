/**
 * The provided models. This part reads the owner's variables and names one backend for each
 * model on the list.
 *
 * The owner sets the provided models one of two ways. `HOLDTRUE_PROVIDED_KEY` with
 * `HOLDTRUE_PROVIDED_MODEL` opens Anthropic with that key. `HOLDTRUE_PROVIDED_URL` with
 * `HOLDTRUE_PROVIDED_MODEL` opens that OpenAI-compatible endpoint instead, and the key stays
 * optional there, because a local proxy needs none. The url wins when both are set.
 *
 * `HOLDTRUE_PROVIDED_MODEL` holds one name, or several names with commas between them. Every
 * name opens on the same endpoint. The person picks one of them at the start of each session.
 * The app picks none. Rule 50. Decision 25.
 *
 * A missing model name gives no provided model, and the app then refuses to start a session.
 * Decision 20. The destination is the host of the endpoint and never the key. Rule 48.
 *
 * This part must not do these things:
 * - It must not hold a default model name.
 * - It must not put the key into the destination.
 * - It must not open a handle. It names the backends, and `src/server.ts` opens them.
 */

import type { Backend } from './model.js'

/** The provided models, ready to open. The destination names the host for the consent line. */
export type Provided = {
  readonly destination: string
  readonly backends: readonly Backend[]
}

/** The fix for a missing provided model. Decision 20 asks the refusal to name it. Two ways work. */
export const NO_PROVIDED_FIX =
  'Set HOLDTRUE_PROVIDED_KEY and HOLDTRUE_PROVIDED_MODEL. ' +
  'Or set HOLDTRUE_PROVIDED_URL and HOLDTRUE_PROVIDED_MODEL, for an OpenAI-compatible endpoint. ' +
  'Put commas between several model names.'

/** The host that answers, for the consent line. A string that is not a url comes back as it is. */
export const destinationOf = (url: string): string => {
  try {
    return new URL(url).host
  } catch {
    return url
  }
}

/** The names on the list, trimmed, with no empty entry and no repeat, in the order written. */
const namesOf = (raw: string): readonly string[] =>
  [...new Set(raw.split(',').map(name => name.trim()).filter(name => name !== ''))]

/** The provided models from the environment, or null when the owner named none. */
export const providedFrom = (env: Readonly<Record<string, string | undefined>>): Provided | null => {
  const url = (env['HOLDTRUE_PROVIDED_URL'] ?? '').trim().replace(/\/+$/, '')
  const key = env['HOLDTRUE_PROVIDED_KEY'] ?? ''
  const models = namesOf(env['HOLDTRUE_PROVIDED_MODEL'] ?? '')
  if (models.length === 0) return null
  if (url !== '') {
    return {
      destination: destinationOf(url),
      backends: models.map(model => ({ kind: 'openai', baseUrl: url, key, model })),
    }
  }
  if (key.trim() === '') return null
  return {
    destination: 'api.anthropic.com',
    backends: models.map(model => ({ kind: 'apiKey', provider: 'anthropic', key, model })),
  }
}
