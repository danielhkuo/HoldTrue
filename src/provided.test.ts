/**
 * The tests for the provided model list.
 *
 * The owner names the provided models in the environment. This part turns those variables into
 * one backend for each model, and it names the destination host. No test opens a network
 * connection. Rule 32.
 *
 * The tests check four things:
 *
 * - no variable gives no provided model, and the app then refuses to start a session (decision 20);
 * - a list of names gives one backend for each name, with no default (rule 50);
 * - the destination is a host and never a key (rule 48);
 * - the Anthropic path and the OpenAI-compatible path give distinct backends.
 */

import { describe, expect, test } from 'vitest'

import { destinationOf, providedFrom } from './provided.js'

describe('no provided model', () => {
  test('an empty environment gives null', () => {
    expect(providedFrom({})).toBeNull()
  })

  test('a key with no model name gives null, because the app ships no default model', () => {
    expect(providedFrom({ HOLDTRUE_PROVIDED_KEY: 'k' })).toBeNull()
  })

  test('a url with no model name gives null', () => {
    expect(providedFrom({ HOLDTRUE_PROVIDED_URL: 'http://127.0.0.1:11434/v1' })).toBeNull()
  })

  test('a model name with no key and no url gives null', () => {
    expect(providedFrom({ HOLDTRUE_PROVIDED_MODEL: 'a' })).toBeNull()
  })

  test('a list that holds only commas and spaces gives null', () => {
    expect(providedFrom({ HOLDTRUE_PROVIDED_KEY: 'k', HOLDTRUE_PROVIDED_MODEL: ' , ,' })).toBeNull()
  })
})

describe('the list of models', () => {
  test('a key and one name give one Anthropic backend and the Anthropic host', () => {
    expect(providedFrom({ HOLDTRUE_PROVIDED_KEY: 'k', HOLDTRUE_PROVIDED_MODEL: 'claude-opus-5' })).toEqual({
      destination: 'api.anthropic.com',
      backends: [{ kind: 'apiKey', provider: 'anthropic', key: 'k', model: 'claude-opus-5' }],
    })
  })

  test('a url and two names give two openai backends on the same url, in the order written', () => {
    const provided = providedFrom({
      HOLDTRUE_PROVIDED_URL: 'https://integrate.api.nvidia.com/v1',
      HOLDTRUE_PROVIDED_KEY: 'nvapi-x',
      HOLDTRUE_PROVIDED_MODEL: 'deepseek-ai/deepseek-v4-flash-0731, moonshotai/kimi-k3',
    })
    expect(provided).toEqual({
      destination: 'integrate.api.nvidia.com',
      backends: [
        { kind: 'openai', baseUrl: 'https://integrate.api.nvidia.com/v1', key: 'nvapi-x', model: 'deepseek-ai/deepseek-v4-flash-0731' },
        { kind: 'openai', baseUrl: 'https://integrate.api.nvidia.com/v1', key: 'nvapi-x', model: 'moonshotai/kimi-k3' },
      ],
    })
  })

  test('a url with no key gives openai backends with an empty key, for a local proxy', () => {
    const provided = providedFrom({ HOLDTRUE_PROVIDED_URL: 'http://127.0.0.1:11434/v1', HOLDTRUE_PROVIDED_MODEL: 'a' })
    expect(provided?.backends).toEqual([{ kind: 'openai', baseUrl: 'http://127.0.0.1:11434/v1', key: '', model: 'a' }])
  })

  test('the url wins over the key when both are set, and the key travels with it', () => {
    const provided = providedFrom({
      HOLDTRUE_PROVIDED_URL: 'http://127.0.0.1:8080/v1',
      HOLDTRUE_PROVIDED_KEY: 'k',
      HOLDTRUE_PROVIDED_MODEL: 'a',
    })
    expect(provided?.backends[0]).toMatchObject({ kind: 'openai', key: 'k' })
  })

  test('a repeated name appears one time, and an empty entry is dropped', () => {
    const provided = providedFrom({ HOLDTRUE_PROVIDED_KEY: 'k', HOLDTRUE_PROVIDED_MODEL: 'a,,a, b ,' })
    expect(provided?.backends.map(b => b.model)).toEqual(['a', 'b'])
  })

  test('a trailing slash on the url is dropped, so a join never doubles it', () => {
    const provided = providedFrom({ HOLDTRUE_PROVIDED_URL: 'http://127.0.0.1:8080/v1/', HOLDTRUE_PROVIDED_MODEL: 'a' })
    expect(provided?.backends[0]).toMatchObject({ baseUrl: 'http://127.0.0.1:8080/v1' })
  })
})

describe('the destination', () => {
  test('the destination of a url is its host and port, never its path and never a key', () => {
    expect(destinationOf('https://integrate.api.nvidia.com/v1')).toBe('integrate.api.nvidia.com')
    expect(destinationOf('http://127.0.0.1:11434/v1')).toBe('127.0.0.1:11434')
  })

  test('a string that is not a url comes back as written, so the consent line still names it', () => {
    expect(destinationOf('not a url')).toBe('not a url')
  })
})
