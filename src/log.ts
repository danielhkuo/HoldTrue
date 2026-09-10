/**
 * The log. One line for each event, in the glog form, as the event happens.
 *
 *     I0903 14:22:01.123 ab12cd34 model] answered backend=ollama model=qwen3.5:9b ms=4118
 *     │    │             │        │      │
 *     │    │             │        │      └ the message, then key=value fields
 *     │    │             │        └ the component that wrote the line
 *     │    │             └ the trace id of the request, or dashes outside a request
 *     │    └ the date and the time, UTC, to the millisecond
 *     └ the severity: D debug, I info, W warning, E error
 *
 * A trace id follows the async chain of one request, so the lines of one turn read as one trace:
 * the request, the model call, the reply. `AsyncLocalStorage` carries the id. The server sets it
 * for each request, and every part below reads it for free.
 *
 * The lines go to stderr, so a terminal shows them as they happen. The log also keeps the recent
 * lines in a ring and hands each new line to a subscriber, so `GET /api/logs` streams them to
 * the page.
 *
 * A line never holds the words of the user, a key or a token. Rule 54. A caller passes a length
 * with `chars` and never the text. A field named key, token, authorization, password or secret
 * prints redacted, whatever the caller passed.
 *
 * `HOLDTRUE_LOG` sets the level: debug, info, warn or error. The default is info.
 */

import { AsyncLocalStorage } from 'node:async_hooks'
import { randomBytes } from 'node:crypto'

export type Severity = 'D' | 'I' | 'W' | 'E'
export type Fields = Record<string, string | number | boolean | null | undefined>

const RANK: Record<Severity, number> = { D: 0, I: 1, W: 2, E: 3 }
const SECRET = /^(key|token|authorization|password|secret)$/i
const NO_TRACE = '--------'

const two = (n: number): string => String(n).padStart(2, '0')

/** One value as a field. A value with a space or a quote is quoted, so a reader can split. */
const shown = (name: string, value: string | number | boolean | null): string => {
  if (SECRET.test(name)) return '[redacted]'
  if (value === null) return 'null'
  const text = String(value)
  return /[\s"=]/.test(text) || text === '' ? JSON.stringify(text) : text
}

/** One line. Pure, so a test can pin the form. */
export const format = (
  severity: Severity,
  at: Date,
  trace: string | null,
  component: string,
  message: string,
  fields?: Fields,
): string => {
  const stamp =
    `${two(at.getUTCMonth() + 1)}${two(at.getUTCDate())} ` +
    `${two(at.getUTCHours())}:${two(at.getUTCMinutes())}:${two(at.getUTCSeconds())}.` +
    `${String(at.getUTCMilliseconds()).padStart(3, '0')}`
  const tail = Object.entries(fields ?? {})
    .filter((entry): entry is [string, string | number | boolean | null] => entry[1] !== undefined)
    .map(([name, value]) => `${name}=${shown(name, value)}`)
    .join(' ')
  return `${severity}${stamp} ${trace ?? NO_TRACE} ${component}] ${message}${tail === '' ? '' : ` ${tail}`}`
}

/** The length of a text, for a line. The text itself never goes to a line. */
export const chars = (text: string | null | undefined): string => `${text?.length ?? 0}ch`

type Options = {
  readonly level?: Severity
  readonly write?: (line: string) => void
  readonly now?: () => Date
}

/** The ring holds this many recent lines for a late reader. */
const RING = 500

export class Log {
  private readonly level: Severity
  private readonly write: (line: string) => void
  private readonly now: () => Date
  private readonly store = new AsyncLocalStorage<string>()
  private readonly ring: string[] = []
  private readonly listeners = new Set<(line: string) => void>()

  constructor(options: Options = {}) {
    this.level = options.level ?? 'I'
    this.write = options.write ?? (line => void process.stderr.write(`${line}\n`))
    this.now = options.now ?? (() => new Date())
  }

  private emit(severity: Severity, component: string, message: string, fields?: Fields): void {
    if (RANK[severity] < RANK[this.level]) return
    const line = format(severity, this.now(), this.store.getStore() ?? null, component, message, fields)
    this.write(line)
    this.ring.push(line)
    if (this.ring.length > RING) this.ring.shift()
    for (const listener of this.listeners) listener(line)
  }

  debug(component: string, message: string, fields?: Fields): void {
    this.emit('D', component, message, fields)
  }
  info(component: string, message: string, fields?: Fields): void {
    this.emit('I', component, message, fields)
  }
  warn(component: string, message: string, fields?: Fields): void {
    this.emit('W', component, message, fields)
  }
  error(component: string, message: string, fields?: Fields): void {
    this.emit('E', component, message, fields)
  }

  /** Run one unit of work under a trace id. Every line inside carries the id. */
  trace<T>(id: string, work: () => T): T {
    return this.store.run(id, work)
  }

  /** The trace id of the current async chain, or null outside one. */
  id(): string | null {
    return this.store.getStore() ?? null
  }

  /** A fresh trace id: eight hex characters. */
  newTrace(): string {
    return randomBytes(4).toString('hex')
  }

  /** The most recent lines, oldest first. */
  recent(count = 200): readonly string[] {
    return this.ring.slice(-count)
  }

  /** Get each new line. The returned function stops it. */
  subscribe(listener: (line: string) => void): () => void {
    this.listeners.add(listener)
    return () => void this.listeners.delete(listener)
  }
}

/** The level from the environment. An unknown word gives info. */
export const levelFrom = (env: Readonly<Record<string, string | undefined>>): Severity => {
  const word = (env['HOLDTRUE_LOG'] ?? '').trim().toLowerCase()
  return word === 'debug' ? 'D' : word === 'warn' ? 'W' : word === 'error' ? 'E' : 'I'
}

/** The one log of the process. Every part imports this. */
export const log = new Log({ level: levelFrom(process.env) })
