/**
 * The tests for the catalog.
 *
 * The catalog lists the chat models that an endpoint offers, so the person picks from a list and
 * types no name. Every test uses a fake fetch. Rule 32.
 *
 * The tests check four things:
 *
 * - each endpoint kind reads its own list shape;
 * - the list keeps chat models and drops the rest, by the capability fields where the endpoint
 *   gives them and by the id where it does not;
 * - the list marks a model that thinks, so the page can label it;
 * - a dead endpoint, a rejected key and an unreadable body give distinct reasons (rule 25).
 *
 * The list is a list. No test asserts a first entry, because the app never picks one. Rule 50.
 */

import { afterEach, describe, expect, test, vi } from 'vitest'

import { REASON } from './model.js'
import { fromAnthropicList, fromOllamaTags, fromOpenaiList, listModels } from './catalog.js'

type Call = { readonly url: string; readonly init: RequestInit }

const stubFetch = (handler: (call: Call) => Promise<Response>): Call[] => {
  const calls: Call[] = []
  vi.stubGlobal('fetch', async (input: Parameters<typeof fetch>[0], init?: RequestInit) => {
    const call: Call = { url: String(input), init: init ?? {} }
    calls.push(call)
    return handler(call)
  })
  return calls
}
const answers = (body: unknown, status = 200): Call[] =>
  stubFetch(async () => new Response(JSON.stringify(body), { status }))

afterEach(() => vi.unstubAllGlobals())

const ids = (list: readonly { id: string }[]): string[] => list.map(m => m.id)

describe('the ollama list', () => {
  test('a completion model stays, an embedding model goes, and a thinking model is marked', () => {
    const tags = {
      models: [
        { name: 'qwen3.5:9b', capabilities: ['vision', 'completion', 'tools', 'thinking'] },
        { name: 'nomic-embed-text:latest', capabilities: ['embedding'] },
        { name: 'qwen2.5-coder:7b-base', capabilities: ['completion', 'insert'] },
      ],
    }
    expect(fromOllamaTags(tags)).toEqual([
      { id: 'qwen3.5:9b', thinks: true },
      { id: 'qwen2.5-coder:7b-base', thinks: false },
    ])
  })

  test('a tag with no capabilities field stays, because an older Ollama omits it', () => {
    expect(fromOllamaTags({ models: [{ name: 'llama3.1:8b' }] })).toEqual([{ id: 'llama3.1:8b', thinks: false }])
  })

  test('a body that is not a tag list gives an empty list and never an exception', () => {
    expect(fromOllamaTags(null)).toEqual([])
    expect(fromOllamaTags({ models: 'x' })).toEqual([])
  })
})

describe('the openai-compatible list', () => {
  test('embedding, rerank, reward, guard, safety, parse and vision-only ids go, and chat ids stay', () => {
    const data = [
      'deepseek-ai/deepseek-v4-flash-0731',
      'nvidia/nemotron-3-embed-1b',
      'nvidia/llama-3.2-nv-rerankqa-1b-v2',
      'nvidia/nemotron-4-340b-reward',
      'nvidia/llama-3.1-nemotron-safety-guard-8b-v3',
      'nvidia/nemotron-3.5-content-safety',
      'nvidia/nemotron-parse',
      'adept/fuyu-8b',
      'moonshotai/kimi-k3',
      'bigcode/starcoder2-15b',
      'mistralai/mistral-large-2-instruct',
    ].map(id => ({ id, object: 'model' }))
    expect(ids(fromOpenaiList({ object: 'list', data }))).toEqual([
      'deepseek-ai/deepseek-v4-flash-0731',
      'moonshotai/kimi-k3',
      'mistralai/mistral-large-2-instruct',
    ])
  })

  test('a known thinker is marked by its id, and the rest are not', () => {
    const data = ['moonshotai/kimi-k3', 'deepseek-ai/deepseek-v4-pro-0813', 'nvidia/nemotron-3-super-120b-a12b', 'openai/gpt-oss-20b', 'mistralai/mistral-large-2-instruct'].map(id => ({ id }))
    expect(fromOpenaiList({ data })).toEqual([
      { id: 'moonshotai/kimi-k3', thinks: true },
      { id: 'deepseek-ai/deepseek-v4-pro-0813', thinks: true },
      { id: 'nvidia/nemotron-3-super-120b-a12b', thinks: true },
      { id: 'openai/gpt-oss-20b', thinks: true },
      { id: 'mistralai/mistral-large-2-instruct', thinks: false },
    ])
  })

  test('a body with no data array gives an empty list', () => {
    expect(fromOpenaiList({})).toEqual([])
    expect(fromOpenaiList('nope')).toEqual([])
  })
})

describe('the anthropic list', () => {
  test('every model stays, and the thinking flag comes from the capabilities', () => {
    const body = {
      data: [
        { id: 'claude-opus-5', type: 'model', capabilities: { thinking: { supported: true } } },
        { id: 'claude-haiku-4-5-20251001', type: 'model', capabilities: { thinking: { supported: false } } },
        { id: 'claude-old', type: 'model' },
      ],
      has_more: false,
    }
    expect(fromAnthropicList(body)).toEqual([
      { id: 'claude-opus-5', thinks: true },
      { id: 'claude-haiku-4-5-20251001', thinks: false },
      { id: 'claude-old', thinks: false },
    ])
  })
})

describe('listModels', () => {
  test('ollama asks the tags route on the given host and needs no key', async () => {
    const calls = answers({ models: [{ name: 'a', capabilities: ['completion'] }] })
    const result = await listModels('ollama', 'http://127.0.0.1:11434/', null)
    expect(calls[0]?.url).toBe('http://127.0.0.1:11434/api/tags')
    expect(result).toEqual({ ok: true, models: [{ id: 'a', thinks: false }] })
  })

  test('nvidia asks the models route on the fixed url, with the key as a bearer when given', async () => {
    const calls = answers({ data: [{ id: 'moonshotai/kimi-k3' }] })
    await listModels('nvidia', null, 'nvapi-x')
    expect(calls[0]?.url).toBe('https://integrate.api.nvidia.com/v1/models')
    expect((calls[0]?.init.headers as Record<string, string>).authorization).toBe('Bearer nvapi-x')
  })

  test('nvidia with no key sends no authorization header, because the list is public', async () => {
    const calls = answers({ data: [] })
    await listModels('nvidia', null, null)
    expect((calls[0]?.init.headers as Record<string, string> | undefined)?.authorization).toBeUndefined()
  })

  test('anthropic asks the models route with the key and the version header, and asks for a long page', async () => {
    const calls = answers({ data: [{ id: 'claude-opus-5' }] })
    await listModels('anthropic', null, 'sk-ant')
    expect(calls[0]?.url).toBe('https://api.anthropic.com/v1/models?limit=1000')
    const headers = calls[0]?.init.headers as Record<string, string>
    expect(headers['x-api-key']).toBe('sk-ant')
    expect(headers['anthropic-version']).toBe('2023-06-01')
  })

  test('anthropic with no key gives the no key reason before any request', async () => {
    const calls = answers({ data: [] })
    expect(await listModels('anthropic', null, null)).toEqual({ ok: false, reason: REASON.NO_KEY })
    expect(calls).toHaveLength(0)
  })

  test('openai asks the models route on the given url', async () => {
    const calls = answers({ data: [{ id: 'composer-2.5' }] })
    const result = await listModels('openai', 'http://127.0.0.1:8080/v1', '')
    expect(calls[0]?.url).toBe('http://127.0.0.1:8080/v1/models')
    expect(result).toEqual({ ok: true, models: [{ id: 'composer-2.5', thinks: false }] })
  })

  test('openai with no url gives a reason that names the url', async () => {
    const result = await listModels('openai', '', '')
    expect(result).toEqual({ ok: false, reason: 'no endpoint url is given' })
  })

  test('a dead endpoint gives the unreachable reason', async () => {
    stubFetch(async () => {
      throw new TypeError('fetch failed')
    })
    expect(await listModels('ollama', 'http://127.0.0.1:1', null)).toEqual({ ok: false, reason: REASON.UNREACHABLE })
  })

  test('a rejected key gives the rejected key reason, and another status carries its number', async () => {
    answers({}, 401)
    expect(await listModels('nvidia', null, 'bad')).toEqual({ ok: false, reason: 'the endpoint rejected the key' })
    answers({}, 503)
    expect(await listModels('nvidia', null, 'k')).toEqual({ ok: false, reason: 'the endpoint returned status 503' })
  })

  test('an unreadable body gives the unreadable reason', async () => {
    stubFetch(async () => new Response('<html>', { status: 200 }))
    expect(await listModels('ollama', 'http://127.0.0.1:11434', null)).toEqual({ ok: false, reason: REASON.UNREADABLE })
  })
})
