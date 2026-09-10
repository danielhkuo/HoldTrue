/**
 * The tests for the model layer.
 *
 * Every test uses a fake `fetch`. No test opens a network connection. No test needs Ollama.
 * The tests hold three groups. The first group checks case B5, and no model reaches a request.
 * The second group checks case B11, and every distinct failure gets a distinct reason.
 * The third group checks the request shape and the attribution.
 *
 * A test must not judge the words of a model. There is no oracle for that.
 */

import { afterEach, describe, expect, test, vi } from 'vitest'
import { open, ollama, openai, REASON, TIMEOUT_MS } from './model.js'

type Call = { readonly url: string; readonly init: RequestInit }

/** Put a fake `fetch` in place, and record every call. */
const stubFetch = (handler: (call: Call) => Promise<Response>): Call[] => {
  const calls: Call[] = []
  const fake = async (
    input: Parameters<typeof fetch>[0],
    init?: RequestInit,
  ): Promise<Response> => {
    const call: Call = { url: String(input), init: init ?? {} }
    calls.push(call)
    return handler(call)
  }
  vi.stubGlobal('fetch', fake)
  return calls
}

/** A fake that answers every call with one body and one status. */
const answers = (body: unknown, status = 200): Call[] =>
  stubFetch(async () => new Response(JSON.stringify(body), { status }))

/** A fake that fails every call with one status and no readable body. */
const fails = (status: number): Call[] => stubFetch(async () => new Response('', { status }))

const ollamaBody = (content: string, model = 'a-model') => ({ model, message: { content } })
const anthropicBody = (text: string, model = 'claude-opus-5') => ({
  model,
  content: [{ type: 'text', text }],
})
const openaiBody = (content: string, model = 'composer-2.5') => ({
  model,
  choices: [{ message: { content } }],
})

const bodyOf = (call: Call): Record<string, unknown> =>
  JSON.parse(String(call.init.body)) as Record<string, unknown>

const headersOf = (call: Call): Record<string, string> =>
  (call.init.headers ?? {}) as Record<string, string>

const key = { kind: 'apiKey', provider: 'anthropic', key: 'k-test' } as const
/** The same backend with a named model. No backend has a default, so most tests need this. */
const keyed = { ...key, model: 'claude-opus-5' } as const

/** A base url that ends in the version segment a real OpenAI-compatible endpoint uses. */
const oa = { kind: 'openai', baseUrl: 'http://localhost:8080/v1', key: 'k-test' } as const

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe('case B5: no model is chosen, and the code picks none', () => {
  test('ask returns null and makes no request when the caller names no ollama model', async () => {
    const calls = stubFetch(async () => {
      throw new Error('a request must not happen')
    })
    const handle = ollama()

    expect(await handle.ask('s', 'u')).toBeNull()
    expect(calls).toHaveLength(0)
  })

  test('the reason for a missing ollama model is that no model is chosen', async () => {
    stubFetch(async () => new Response('{}', { status: 200 }))
    const handle = ollama()
    await handle.ask('s', 'u')

    expect(handle.lastReason?.()).toBe(REASON.NO_MODEL)
  })

  test('identify reports that no model is chosen and never reads the tag list', async () => {
    const calls = stubFetch(async () => {
      throw new Error('a request must not happen')
    })
    const who = await ollama().identify()

    expect(who.model_id).toBe('none')
    expect(who.reason).toBe(REASON.NO_MODEL)
    expect(calls).toHaveLength(0)
  })

  test('one ask makes one request, and that request is the chat route', async () => {
    vi.stubEnv('OLLAMA_HOST', undefined)
    const calls = answers(ollamaBody('hi'))
    await ollama('llama3.2').ask('s', 'u')

    expect(calls.map(c => c.url)).toEqual(['http://127.0.0.1:11434/api/chat'])
  })
})

describe('case B11: a distinct failure gets a distinct reason', () => {
  test('a backend that does not answer gives the unreachable reason', async () => {
    stubFetch(async () => {
      throw new TypeError('fetch failed')
    })
    const handle = ollama('llama3.2')

    expect(await handle.ask('s', 'u')).toBeNull()
    expect(handle.lastReason?.()).toBe(REASON.UNREACHABLE)
  })

  test('a request that stops on time gives the timeout reason', async () => {
    stubFetch(async () => {
      throw new DOMException('The operation timed out.', 'TimeoutError')
    })
    const handle = ollama('llama3.2')

    expect(await handle.ask('s', 'u')).toBeNull()
    expect(handle.lastReason?.()).toBe(REASON.TIMEOUT)
  })

  test('an error status gives a reason that carries the status number', async () => {
    fails(500)
    const handle = ollama('llama3.2')

    expect(await handle.ask('s', 'u')).toBeNull()
    expect(handle.lastReason?.()).toBe('the local backend returned status 500')
  })

  test('status 404 from ollama gives the missing model name reason', async () => {
    fails(404)
    const handle = ollama('no-such-model')
    await handle.ask('s', 'u')

    expect(handle.lastReason?.()).toBe('the model name does not exist')
  })

  test('status 401 from the provider gives the rejected key reason', async () => {
    fails(401)
    const handle = open(keyed)
    await handle.ask('s', 'u')

    expect(handle.lastReason?.()).toBe('the provider rejected the key')
  })

  test('status 404 from the provider gives the missing model name reason', async () => {
    fails(404)
    const handle = open({ ...key, model: 'no-such-model' })
    await handle.ask('s', 'u')

    expect(handle.lastReason?.()).toBe('the model name does not exist')
  })

  test('an empty answer gives the empty text reason', async () => {
    answers(ollamaBody('   '))
    const handle = ollama('llama3.2')

    expect(await handle.ask('s', 'u')).toBeNull()
    expect(handle.lastReason?.()).toBe(REASON.EMPTY)
  })

  test('a body that is not JSON gives the unreadable body reason', async () => {
    stubFetch(async () => new Response('not json', { status: 200 }))
    const handle = ollama('llama3.2')

    expect(await handle.ask('s', 'u')).toBeNull()
    expect(handle.lastReason?.()).toBe(REASON.UNREADABLE)
  })

  test('an empty API key gives the missing key reason and makes no request', async () => {
    const calls = stubFetch(async () => {
      throw new Error('a request must not happen')
    })
    const handle = open({ ...keyed, key: '  ' })

    expect(await handle.ask('s', 'u')).toBeNull()
    expect(handle.lastReason?.()).toBe(REASON.NO_KEY)
    expect(calls).toHaveLength(0)
  })

  test('the eight failures give eight different reasons', async () => {
    const reasons: (string | null | undefined)[] = []

    const collect = async (handle: ReturnType<typeof open>): Promise<void> => {
      await handle.ask('s', 'u')
      reasons.push(handle.lastReason?.())
    }

    stubFetch(async () => {
      throw new Error('never')
    })
    await collect(ollama())
    await collect(open({ ...keyed, key: '' }))

    stubFetch(async () => {
      throw new TypeError('fetch failed')
    })
    await collect(ollama('m'))

    stubFetch(async () => {
      throw new DOMException('x', 'TimeoutError')
    })
    await collect(ollama('m'))

    fails(500)
    await collect(ollama('m'))

    fails(404)
    await collect(ollama('m'))

    answers(ollamaBody(''))
    await collect(ollama('m'))

    stubFetch(async () => new Response('<html>', { status: 200 }))
    await collect(ollama('m'))

    expect(reasons).toHaveLength(8)
    expect(new Set(reasons).size).toBe(8)
  })

  test('lastReason returns null after an answer arrives', async () => {
    answers(ollamaBody('a line'))
    const handle = ollama('llama3.2')
    await handle.ask('s', 'u')

    expect(handle.lastReason?.()).toBeNull()
  })

  test('lastReason returns null before the first ask', () => {
    expect(ollama('llama3.2').lastReason?.()).toBeNull()
  })
})

describe('ask never throws', () => {
  const throwers: readonly [string, () => never][] = [
    ['an Error', () => { throw new Error('boom') }],
    ['a string', () => { throw 'boom' }],
    ['null', () => { throw null }],
  ]

  for (const [name, thrower] of throwers) {
    test(`ask returns null when fetch throws ${name}`, async () => {
      stubFetch(async () => thrower())
      const handle = ollama('llama3.2')

      await expect(handle.ask('s', 'u')).resolves.toBeNull()
    })
  }

  test('ask returns null when the body reader throws', async () => {
    stubFetch(async () => new Response('{', { status: 200 }))

    await expect(ollama('llama3.2').ask('s', 'u')).resolves.toBeNull()
  })
})

describe('the ollama request', () => {
  test('a backend with a host sends the chat request to that host, and never to the fallback', async () => {
    const calls = answers(ollamaBody('hi'))
    await open({ kind: 'ollama', host: 'http://10.0.0.5:11434/', model: 'a-model' }).ask('s', 'u')
    expect(calls[0]?.url).toBe('http://10.0.0.5:11434/api/chat')
  })

  test('the attribution of a hosted backend names that host', async () => {
    const who = await open({ kind: 'ollama', host: 'http://10.0.0.5:11434', model: 'a-model' }).identify()
    expect(who.runtime).toBe('ollama @ http://10.0.0.5:11434')
  })

  test('the request goes to the chat route of the configured host', async () => {
    vi.stubEnv('OLLAMA_HOST', 'http://10.0.0.2:9999/')
    const calls = answers(ollamaBody('hi'))
    await ollama('llama3.2').ask('s', 'u')

    expect(calls[0]?.url).toBe('http://10.0.0.2:9999/api/chat')
  })

  test('the request goes to the loopback address when the variable is not set', async () => {
    vi.stubEnv('OLLAMA_HOST', undefined)
    const calls = answers(ollamaBody('hi'))
    await ollama('llama3.2').ask('s', 'u')

    expect(calls[0]?.url).toBe('http://127.0.0.1:11434/api/chat')
  })

  test('the request carries the model name the caller gave', async () => {
    const calls = answers(ollamaBody('hi'))
    await ollama('llama3.2').ask('s', 'u')

    expect(bodyOf(calls[0]!)['model']).toBe('llama3.2')
  })

  test('the request carries the system message and the user message unchanged', async () => {
    const calls = answers(ollamaBody('hi'))
    await ollama('llama3.2').ask('SYSTEM', 'so, um, the gas.')

    expect(bodyOf(calls[0]!)['messages']).toEqual([
      { role: 'system', content: 'SYSTEM' },
      { role: 'user', content: 'so, um, the gas.' },
    ])
  })

  test('the request sends no format field', async () => {
    const calls = answers(ollamaBody('hi'))
    await ollama('llama3.2').ask('s', 'u')

    expect(bodyOf(calls[0]!)).not.toHaveProperty('format')
  })

  test('ask returns the content of the message', async () => {
    answers(ollamaBody('Wait why does that make it hot?'))

    expect(await ollama('llama3.2').ask('s', 'u')).toBe('Wait why does that make it hot?')
  })

  test('the request sends temperature 0 by default', async () => {
    const calls = answers(ollamaBody('hi'))
    await ollama('llama3.2').ask('s', 'u')

    expect(bodyOf(calls[0]!)['options']).toEqual({ temperature: 0 })
  })

  test('the request sends the temperature the caller gave', async () => {
    const calls = answers(ollamaBody('hi'))
    await ollama('llama3.2', 0.8).ask('s', 'u')

    expect(bodyOf(calls[0]!)['options']).toEqual({ temperature: 0.8 })
  })
})

describe('the anthropic request', () => {
  test('empty text with a max_tokens stop gives the spent budget reason', async () => {
    answers({ model: 'claude-opus-5', content: [], stop_reason: 'max_tokens' })
    const handle = open(keyed)
    expect(await handle.ask('s', 'u')).toBeNull()
    expect(handle.lastReason?.()).toBe(REASON.BUDGET_SPENT)
  })


  test('the request goes to the messages route', async () => {
    const calls = answers(anthropicBody('hi'))
    await open(keyed).ask('s', 'u')

    expect(calls[0]?.url).toBe('https://api.anthropic.com/v1/messages')
  })

  test('the request carries the key header and the version header', async () => {
    const calls = answers(anthropicBody('hi'))
    await open({ ...keyed, key: 'sk-secret' }).ask('s', 'u')

    expect(headersOf(calls[0]!)['x-api-key']).toBe('sk-secret')
    expect(headersOf(calls[0]!)['anthropic-version']).toBe('2023-06-01')
  })

  test('the request carries the system message outside the message list', async () => {
    const calls = answers(anthropicBody('hi'))
    await open(keyed).ask('SYSTEM', 'USER')

    expect(bodyOf(calls[0]!)['system']).toBe('SYSTEM')
    expect(bodyOf(calls[0]!)['messages']).toEqual([{ role: 'user', content: 'USER' }])
  })

  test('ask fails and makes no request when the caller names no apiKey model', async () => {
    const calls = answers(anthropicBody('hi'))
    const handle = open(key)

    expect(await handle.ask('s', 'u')).toBeNull()
    expect(calls).toHaveLength(0)
    expect(handle.lastReason?.()).toBe(REASON.NO_MODEL)
  })

  test('the request uses the model name the caller gave', async () => {
    const calls = answers(anthropicBody('hi'))
    await open({ ...key, model: 'claude-opus-5' }).ask('s', 'u')

    expect(bodyOf(calls[0]!)['model']).toBe('claude-opus-5')
  })

  test('the request sends the temperature the caller gave', async () => {
    const calls = answers(anthropicBody('hi'))
    await open({ kind: 'apiKey', provider: 'anthropic', key: 'k', model: 'm' }, 0.8).ask('s', 'u')

    expect(bodyOf(calls[0]!)['temperature']).toBe(0.8)
  })

  test('ask joins every text block of the answer', async () => {
    answers({
      model: 'claude-opus-5',
      content: [
        { type: 'text', text: 'one ' },
        { type: 'thinking', thinking: 'hidden' },
        { type: 'text', text: 'two' },
      ],
    })

    expect(await open({ ...key, model: 'claude-opus-5' }).ask('s', 'u')).toBe('one two')
  })
})

describe('the openai request', () => {
  test('empty text with a length finish gives the spent budget reason, not the empty reason', async () => {
    answers({ model: 'kimi', choices: [{ message: { content: '' }, finish_reason: 'length' }] })
    const handle = openai('http://localhost:8080/v1', 'k-test', 'kimi')
    expect(await handle.ask('s', 'u')).toBeNull()
    expect(handle.lastReason?.()).toBe(REASON.BUDGET_SPENT)
  })

  test('empty text with a stop finish keeps the empty reason', async () => {
    answers({ model: 'kimi', choices: [{ message: { content: '' }, finish_reason: 'stop' }] })
    const handle = openai('http://localhost:8080/v1', 'k-test', 'kimi')
    expect(await handle.ask('s', 'u')).toBeNull()
    expect(handle.lastReason?.()).toBe(REASON.EMPTY)
  })

  test('the request goes to the chat completions route of the base url', async () => {
    const calls = answers(openaiBody('hi'))
    await openai('http://localhost:8080/v1', 'k-test', 'composer-2.5').ask('s', 'u')

    expect(calls[0]?.url).toBe('http://localhost:8080/v1/chat/completions')
  })

  test('a trailing slash on the base url does not double up in the route', async () => {
    const calls = answers(openaiBody('hi'))
    await openai('http://localhost:8080/v1/', 'k-test', 'composer-2.5').ask('s', 'u')

    expect(calls[0]?.url).toBe('http://localhost:8080/v1/chat/completions')
  })

  test('the request carries the model, the temperature, a budget with room for thinking, and the two messages', async () => {
    const calls = answers(openaiBody('hi'))
    await openai('http://localhost:8080/v1', 'k-test', 'composer-2.5', 0.8).ask('SYSTEM', 'USER')

    expect(bodyOf(calls[0]!)).toEqual({
      model: 'composer-2.5',
      temperature: 0.8,
      max_tokens: 16384,
      messages: [
        { role: 'system', content: 'SYSTEM' },
        { role: 'user', content: 'USER' },
      ],
    })
  })

  test('the request carries the bearer header', async () => {
    const calls = answers(openaiBody('hi'))
    await openai('http://localhost:8080/v1', 'sk-secret', 'composer-2.5').ask('s', 'u')

    expect(headersOf(calls[0]!)['authorization']).toBe('Bearer sk-secret')
  })

  test('ask returns the content of the first choice', async () => {
    answers(openaiBody('Wait why does that make it hot?'))

    expect(
      await openai('http://localhost:8080/v1', 'k-test', 'composer-2.5').ask('s', 'u'),
    ).toBe('Wait why does that make it hot?')
  })

  test('an empty key sends the request without an authorization header', async () => {
    const calls = answers(openaiBody('hi'))
    const handle = openai('http://localhost:8080/v1', '  ', 'composer-2.5')

    expect(await handle.ask('s', 'u')).toBe('hi')
    expect(headersOf(calls[0]!)).not.toHaveProperty('authorization')
  })

  test('status 401 gives the reason that the endpoint rejected the key', async () => {
    fails(401)
    const handle = openai('http://localhost:8080/v1', 'k-test', 'composer-2.5')
    await handle.ask('s', 'u')

    expect(handle.lastReason?.()).toBe('the endpoint rejected the key')
  })

  test('status 404 gives the missing model name reason', async () => {
    fails(404)
    const handle = openai('http://localhost:8080/v1', 'k-test', 'no-such-model')
    await handle.ask('s', 'u')

    expect(handle.lastReason?.()).toBe('the model name does not exist')
  })

  test('a backend that does not answer gives the unreachable reason', async () => {
    stubFetch(async () => {
      throw new TypeError('fetch failed')
    })
    const handle = openai('http://localhost:8080/v1', 'k-test', 'composer-2.5')

    expect(await handle.ask('s', 'u')).toBeNull()
    expect(handle.lastReason?.()).toBe(REASON.UNREACHABLE)
  })
})

describe('the request stops after two minutes', () => {
  test('the timeout is 120 seconds', () => {
    expect(TIMEOUT_MS).toBe(120_000)
  })

  test('every request carries an abort signal built from that timeout', async () => {
    const timeout = vi.spyOn(AbortSignal, 'timeout')
    const calls = answers(ollamaBody('hi'))
    await ollama('llama3.2').ask('s', 'u')

    expect(timeout).toHaveBeenCalledWith(TIMEOUT_MS)
    expect(calls[0]?.init.signal).toBeInstanceOf(AbortSignal)
  })
})

describe('the attribution names the thing that answered', () => {
  test('identify names the model in the answer, not the model in the setting', async () => {
    answers(ollamaBody('hi', 'llama3.2:3b-instruct-q4'))
    const handle = ollama('llama3.2')
    await handle.ask('s', 'u')
    const who = await handle.identify()

    expect(who.model_id).toBe('llama3.2:3b-instruct-q4')
    expect(who.reason).toBeUndefined()
  })

  test('identify states that nothing has answered before the first ask', async () => {
    const who = await ollama('llama3.2').identify()

    expect(who.model_id).toBe('llama3.2')
    expect(who.reason).toContain(REASON.NO_ANSWER_YET)
  })

  test('identify names the runtime and never the model as the runtime', async () => {
    vi.stubEnv('OLLAMA_HOST', 'http://10.0.0.2:9999')
    const who = await ollama('llama3.2').identify()

    expect(who.runtime).toBe('ollama @ http://10.0.0.2:9999')
  })

  test('identify names the provider runtime for the apiKey backend', async () => {
    const who = await open(key).identify()

    expect(who.runtime).toBe('anthropic @ https://api.anthropic.com/v1/messages')
  })

  test('identify names the base url as the runtime for the openai backend', async () => {
    const who = await open(oa).identify()

    expect(who.runtime).toBe('openai @ http://localhost:8080/v1')
  })

  test('identify names the openai model in the answer, not the model in the setting', async () => {
    answers(openaiBody('hi', 'answered-name'))
    const handle = openai('http://localhost:8080/v1', 'k-test', 'configured-name')
    await handle.ask('s', 'u')
    const who = await handle.identify()

    expect(who.model_id).toBe('answered-name')
    expect(who.reason).toBeUndefined()
  })

  test('identify never carries the API key', async () => {
    const who = await open({ ...key, key: 'sk-secret', model: 'claude-opus-5' }).identify()

    expect(JSON.stringify(who)).not.toContain('sk-secret')
  })

  test('identify reports no model chosen when the apiKey caller names none', async () => {
    const who = await open(key).identify()

    expect(who.model_id).toBe('none')
    expect(who.reason).toContain(REASON.NO_MODEL)
  })

  test('identify carries no reason when the named model answered', async () => {
    answers(anthropicBody('hi', 'claude-opus-5'))
    const handle = open({ ...key, model: 'claude-opus-5' })
    await handle.ask('s', 'u')
    const who = await handle.identify()

    expect(who.model_id).toBe('claude-opus-5')
    expect(who.reason).toBeUndefined()
  })

  test('calibration is uncalibrated for both backends', async () => {
    expect((await ollama('m').identify()).calibration).toBe('uncalibrated')
    expect((await open({ ...key, model: 'claude-opus-5' }).identify()).calibration).toBe('uncalibrated')
  })
})
