/**
 * The settings. This part holds the endpoints, the two model choices, the settings file and the
 * keychain.
 *
 * The person sets up the app one time. The setup names an endpoint for the child and an endpoint
 * for the review, and one model on each. The app saves the choices in a settings file, so the
 * next start lands on the pick screen. The app saves an API key in the keychain of the operating
 * system when the person asks it to. The key never enters the settings file. Decision 26.
 *
 * There is no default model. Rule 50. The empty settings hold no model choice, and the app makes
 * none. The Ollama host has a default, because a host is an address and not a model.
 *
 * The file store and the keychain sit behind two seams. A test passes a memory store and memory
 * secrets, so no test touches the disk or the keychain. Rule 32.
 *
 * This part serves rules 24, 32, 48, 50 and 54, and decision 26.
 *
 * This part must not do these things:
 * - It must not write a key into the settings file.
 * - It must not hold a default model name.
 * - It must not throw from a read. A broken file gives the empty settings.
 * - It must not load the keychain addon in a test. The real keychain loads on first use only.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { homedir } from 'node:os'
import { join, posix, win32 } from 'node:path'

import type { Backend } from './model.js'

/* ── the contract ────────────────────────────────────────────────────────────────────────────── */

/** The four kinds of endpoint. NVIDIA and a custom endpoint both speak the OpenAI shape. */
export type EndpointKind = 'ollama' | 'nvidia' | 'anthropic' | 'openai'
export const KINDS: readonly EndpointKind[] = ['ollama', 'nvidia', 'anthropic', 'openai']

/** One model on one endpoint. The person made this choice. */
export type Choice = { readonly endpoint: EndpointKind; readonly model: string }

/** What the settings file holds. It holds no key. */
export type Settings = {
  readonly ollamaHost: string
  readonly openaiUrl: string
  readonly child: Choice | null
  readonly review: Choice | null
}

/** The fixed addresses. The person cannot change them, so they are not in the file. */
export const NVIDIA_URL = 'https://integrate.api.nvidia.com/v1'
export const ANTHROPIC_HOST = 'api.anthropic.com'

/** The settings before any setup. No model is chosen. Rule 50. */
export const EMPTY: Settings = {
  ollamaHost: 'http://127.0.0.1:11434',
  openaiUrl: '',
  child: null,
  review: null,
}

/** Where the settings file lives. The path names the place for the disclosure. */
export type Store = {
  readonly path: string
  readonly read: () => string | null
  readonly write: (text: string) => void
}

/**
 * Where a key lives. `get` never throws. `failure` names why the last `get` for a kind gave
 * null when the store itself failed, so a refused keychain and an absent key get distinct
 * reasons. Rule 25.
 */
export type Secrets = {
  readonly get: (kind: EndpointKind) => string | null
  readonly set: (kind: EndpointKind, key: string) => void
  readonly forget: (kind: EndpointKind) => void
  readonly failure: (kind: EndpointKind) => string | null
}

/* ── the file ────────────────────────────────────────────────────────────────────────────────── */

const FILE_VERSION = 1

/** True when a value names one of the four kinds. */
export const isKind = (value: unknown): value is EndpointKind =>
  typeof value === 'string' && (KINDS as readonly string[]).includes(value)

/** Drop a trailing slash so a url join never doubles one up. */
export const stripSlash = (url: string): string => url.replace(/\/+$/, '')

/** One choice from a file value or a request field. A broken value gives null, never a default. */
export const choiceOf = (value: unknown): Choice | null => {
  if (typeof value !== 'object' || value === null) return null
  const { endpoint, model } = value as { endpoint?: unknown; model?: unknown }
  if (!isKind(endpoint) || typeof model !== 'string' || model.trim() === '') return null
  return { endpoint, model: model.trim() }
}

/** The settings from the file text. A missing or broken file gives the empty settings. */
export const parseSettings = (text: string | null): Settings => {
  if (text === null) return EMPTY
  let value: unknown
  try {
    value = JSON.parse(text)
  } catch {
    return EMPTY
  }
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return EMPTY
  const raw = value as Record<string, unknown>
  const url = (field: string, fallback: string): string =>
    typeof raw[field] === 'string' && (raw[field] as string).trim() !== ''
      ? stripSlash((raw[field] as string).trim())
      : fallback
  return {
    ollamaHost: url('ollamaHost', EMPTY.ollamaHost),
    openaiUrl: url('openaiUrl', EMPTY.openaiUrl),
    child: choiceOf(raw['child']),
    review: choiceOf(raw['review']),
  }
}

export const loadSettings = (store: Store): Settings => parseSettings(store.read())

/** Write the settings. The text holds the four known fields and nothing else, so no key. */
export const saveSettings = (store: Store, settings: Settings): void => {
  const text = JSON.stringify(
    {
      version: FILE_VERSION,
      ollamaHost: settings.ollamaHost,
      openaiUrl: settings.openaiUrl,
      child: settings.child,
      review: settings.review,
    },
    null,
    2,
  )
  store.write(`${text}\n`)
}

/** The settings directory for a platform. Pure, so a test can check each platform. */
export const settingsDir = (
  platform: string,
  home: string,
  env: Readonly<Record<string, string | undefined>>,
): string => {
  if (platform === 'win32') {
    return win32.join(env['APPDATA'] ?? win32.join(home, 'AppData', 'Roaming'), 'holdtrue')
  }
  if (platform === 'darwin') return posix.join(home, 'Library', 'Application Support', 'holdtrue')
  return posix.join(env['XDG_CONFIG_HOME'] ?? posix.join(home, '.config'), 'holdtrue')
}

/** The real store, on disk. A missing file reads as null. */
export const fileStore = (dir = settingsDir(process.platform, homedir(), process.env)): Store => {
  const path = join(dir, 'settings.json')
  return {
    path,
    read: () => {
      try {
        return existsSync(path) ? readFileSync(path, 'utf8') : null
      } catch {
        return null
      }
    },
    write: text => {
      mkdirSync(dir, { recursive: true })
      writeFileSync(path, text, { encoding: 'utf8', mode: 0o600 })
    },
  }
}

/** A store in memory, for a test. */
export const memoryStore = (): Store => {
  let text: string | null = null
  return { path: 'memory', read: () => text, write: next => void (text = next) }
}

/* ── the keychain ────────────────────────────────────────────────────────────────────────────── */

/** The service name of every item in the keychain. The account is the endpoint kind. */
const SERVICE = 'holdtrue'

type Entry = {
  getPassword: () => string | null
  setPassword: (key: string) => void
  deletePassword: () => boolean
}
type Keyring = { Entry: new (service: string, account: string) => Entry }

/**
 * The real keychain, on `@napi-rs/keyring`. The addon loads on the first call, and only then.
 * A read that fails gives null. A write that fails throws, and the caller states the failure.
 */
export const keychain = (): Secrets => {
  let ring: Keyring | null = null
  const failures = new Map<EndpointKind, string>()
  const entry = (kind: EndpointKind): Entry => {
    ring ??= createRequire(import.meta.url)('@napi-rs/keyring') as Keyring
    return new ring.Entry(SERVICE, `${kind}-api-key`)
  }
  return {
    get: kind => {
      try {
        const key = entry(kind).getPassword() ?? null
        failures.delete(kind)
        return key
      } catch (error) {
        failures.set(kind, error instanceof Error ? error.message : String(error))
        return null
      }
    },
    set: (kind, key) => entry(kind).setPassword(key),
    forget: kind => {
      try {
        entry(kind).deletePassword()
      } catch {
        // A key that is not there is already forgotten.
      }
    },
    failure: kind => failures.get(kind) ?? null,
  }
}

/** Secrets in memory, for a test and for a key that the person did not ask the app to keep. */
export const memorySecrets = (): Secrets => {
  const held = new Map<EndpointKind, string>()
  return {
    get: kind => held.get(kind) ?? null,
    set: (kind, key) => void held.set(kind, key),
    forget: kind => void held.delete(kind),
    failure: () => null,
  }
}

/* ── the backend ─────────────────────────────────────────────────────────────────────────────── */

/** True when an Ollama host is this machine. A remote host sends the words off the machine. */
export const isLocalHost = (host: string): boolean => {
  try {
    const name = new URL(host).hostname
    return name === '127.0.0.1' || name === 'localhost' || name === '::1' || name === '[::1]'
  } catch {
    return false
  }
}

/** True when this kind needs a key before a request. */
export const needsKey = (kind: EndpointKind): boolean => kind === 'nvidia' || kind === 'anthropic'

/**
 * The backend for one choice. It gives null when the choice cannot open: a keyed endpoint with
 * no key, or the custom endpoint with no url. The caller then names what is missing.
 */
export const backendFor = (choice: Choice, settings: Settings, key: string | null): Backend | null => {
  const { endpoint, model } = choice
  if (endpoint === 'ollama') return { kind: 'ollama', host: stripSlash(settings.ollamaHost), model }
  if (endpoint === 'anthropic') {
    return key === null || key === '' ? null : { kind: 'apiKey', provider: 'anthropic', key, model }
  }
  if (endpoint === 'nvidia') {
    return key === null || key === '' ? null : { kind: 'openai', baseUrl: NVIDIA_URL, key, model }
  }
  const baseUrl = stripSlash(settings.openaiUrl)
  return baseUrl === '' ? null : { kind: 'openai', baseUrl, key: key ?? '', model }
}

/** The host that one choice sends the words to. The consent line names it. Rule 48. */
export const destinationOf = (choice: Choice, settings: Settings): string => {
  const url =
    choice.endpoint === 'ollama'
      ? settings.ollamaHost
      : choice.endpoint === 'nvidia'
        ? NVIDIA_URL
        : choice.endpoint === 'anthropic'
          ? `https://${ANTHROPIC_HOST}`
          : settings.openaiUrl
  try {
    return new URL(url).host
  } catch {
    return url
  }
}
