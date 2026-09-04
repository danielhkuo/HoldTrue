/**
 * The tests for the log.
 *
 * The log writes one line for each event, in the glog form: a severity letter, the date and the
 * time, the trace id, the component, a message and key=value fields. A person reads the lines in
 * a terminal as they happen, and a page can read them as a stream. No test writes to stderr.
 *
 * The tests check four things:
 *
 * - the line form, so a reader can parse every line the same way;
 * - the trace id follows the async chain, so one request reads as one trace;
 * - a key, a token or the words of the user never reach a line (rule 54);
 * - the ring holds the recent lines, and a subscriber gets each new line one time.
 */

import { describe, expect, test } from 'vitest'

import { Log, chars, format } from './log.js'

const at = new Date(Date.UTC(2026, 8, 3, 14, 22, 1, 123))

describe('the line form', () => {
  test('a line holds the severity letter, the date, the time, the trace, the component and the message', () => {
    expect(format('I', at, 'ab12cd34', 'server', 'POST /api/turn 200')).toBe(
      'I0903 14:22:01.123 ab12cd34 server] POST /api/turn 200',
    )
  })

  test('a line with no trace shows a dash in the trace column, so the columns stay aligned', () => {
    expect(format('W', at, null, 'boot', 'no ear')).toBe('W0903 14:22:01.123 -------- boot] no ear')
  })

  test('fields follow the message as key=value, and a value with a space is quoted', () => {
    expect(format('I', at, null, 'model', 'ask', { backend: 'ollama', model: 'qwen3.5:9b', ms: 4118 })).toBe(
      'I0903 14:22:01.123 -------- model] ask backend=ollama model=qwen3.5:9b ms=4118',
    )
    expect(format('E', at, null, 'model', 'failed', { reason: 'the endpoint rejected the key' })).toBe(
      'E0903 14:22:01.123 -------- model] failed reason="the endpoint rejected the key"',
    )
  })

  test('an undefined field is left out, and a null field prints as null', () => {
    expect(format('I', at, null, 'x', 'm', { a: undefined, b: null })).toBe('I0903 14:22:01.123 -------- x] m b=null')
  })

  test('a field named key, token or authorization prints redacted, whatever its value', () => {
    const line = format('I', at, null, 'x', 'm', { key: 'nvapi-secret', token: 't', authorization: 'Bearer z' })
    expect(line).not.toContain('nvapi-secret')
    expect(line).not.toContain('Bearer')
    expect(line).toBe('I0903 14:22:01.123 -------- x] m key=[redacted] token=[redacted] authorization=[redacted]')
  })

  test('chars gives the length of a text and never the text', () => {
    expect(chars('um, so the gas gets hot.')).toBe('24ch')
    expect(chars(null)).toBe('0ch')
  })
})

describe('the log', () => {
  const make = (level: 'D' | 'I' | 'W' | 'E' = 'I') => {
    const lines: string[] = []
    const log = new Log({ level, write: line => lines.push(line), now: () => at })
    return { log, lines }
  }

  test('a line below the level is dropped, and a line at the level is written', () => {
    const { log, lines } = make('I')
    log.debug('x', 'hidden')
    log.info('x', 'shown')
    log.warn('x', 'shown too')
    expect(lines).toEqual(['I0903 14:22:01.123 -------- x] shown', 'W0903 14:22:01.123 -------- x] shown too'])
  })

  test('the trace id follows the async chain, and a line outside the chain has none', async () => {
    const { log, lines } = make()
    await log.trace('ab12cd34', async () => {
      log.info('server', 'in')
      await Promise.resolve()
      log.info('model', 'still in')
    })
    log.info('server', 'out')
    expect(lines).toEqual([
      'I0903 14:22:01.123 ab12cd34 server] in',
      'I0903 14:22:01.123 ab12cd34 model] still in',
      'I0903 14:22:01.123 -------- server] out',
    ])
  })

  test('the ring keeps the last lines in order, and drops the oldest past the cap', () => {
    const { log } = make()
    for (let i = 0; i < 5; i++) log.info('x', `m${i}`)
    expect(log.recent(3).map(l => l.slice(-2))).toEqual(['m2', 'm3', 'm4'])
  })

  test('a subscriber gets each new line one time, and none after it unsubscribes', () => {
    const { log } = make()
    const got: string[] = []
    const stop = log.subscribe(line => got.push(line))
    log.info('x', 'one')
    log.info('x', 'two')
    stop()
    log.info('x', 'three')
    expect(got.map(l => l.slice(-3))).toEqual(['one', 'two'])
  })

  test('a fresh trace id is eight hex characters', () => {
    const { log } = make()
    expect(log.newTrace()).toMatch(/^[0-9a-f]{8}$/)
  })
})
