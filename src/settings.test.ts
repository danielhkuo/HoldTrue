/**
 * The tests for the settings.
 *
 * The settings hold the endpoints and the two model choices. The file store and the keychain sit
 * behind two seams, so no test touches the disk or the keychain. Rule 32.
 *
 * The tests check four things:
 *
 * - the settings file parses, and a broken file gives the empty settings and never an exception;
 * - the settings hold no model choice until the person makes one (rule 50);
 * - the key never enters the settings text, and it lives in the keychain seam only;
 * - each endpoint kind maps to one backend, with the key where that backend expects it.
 */

import { describe, expect, test } from 'vitest'

import {
  EMPTY,
  NVIDIA_URL,
  backendFor,
  memoryStore,
  memorySecrets,
  parseSettings,
  saveSettings,
  settingsDir,
  type Settings,
} from './settings.js'

describe('the settings file', () => {
  test('no file gives the empty settings, with the local Ollama host and no model choice', () => {
    expect(parseSettings(null)).toEqual(EMPTY)
    expect(EMPTY.child).toBeNull()
    expect(EMPTY.review).toBeNull()
    expect(EMPTY.ollamaHost).toBe('http://127.0.0.1:11434')
  })

  test('a broken file gives the empty settings and never an exception', () => {
    expect(parseSettings('{not json')).toEqual(EMPTY)
    expect(parseSettings('[]')).toEqual(EMPTY)
    expect(parseSettings('null')).toEqual(EMPTY)
  })

  test('a saved file comes back with both choices and both urls', () => {
    const settings: Settings = {
      ollamaHost: 'http://127.0.0.1:11434',
      openaiUrl: 'http://127.0.0.1:8080/v1',
      child: { endpoint: 'ollama', model: 'qwen3.5:9b' },
      review: { endpoint: 'nvidia', model: 'moonshotai/kimi-k3' },
    }
    const store = memoryStore()
    saveSettings(store, settings)
    expect(parseSettings(store.read())).toEqual(settings)
  })

  test('a choice with an unknown endpoint kind is dropped, so a stale file cannot name a backend this code lacks', () => {
    const text = JSON.stringify({ version: 1, child: { endpoint: 'bedrock', model: 'x' }, review: { endpoint: 'ollama', model: 'a' } })
    expect(parseSettings(text)).toMatchObject({ child: null, review: { endpoint: 'ollama', model: 'a' } })
  })

  test('a choice with an empty model name is dropped, because the app ships no default model', () => {
    const text = JSON.stringify({ version: 1, child: { endpoint: 'ollama', model: '  ' } })
    expect(parseSettings(text).child).toBeNull()
  })

  test('the saved text never holds a key, whatever the caller passes in', () => {
    const store = memoryStore()
    saveSettings(store, { ...EMPTY, child: { endpoint: 'nvidia', model: 'a' } } as Settings & { key?: string })
    saveSettings(store, { ...EMPTY, key: 'nvapi-secret' } as Settings)
    expect(store.read()).not.toContain('nvapi-secret')
    expect(store.read()).not.toContain('key')
  })

  test('the settings directory follows the platform, and the file is settings.json', () => {
    expect(settingsDir('darwin', '/Users/d', {})).toBe('/Users/d/Library/Application Support/holdtrue')
    expect(settingsDir('linux', '/home/d', {})).toBe('/home/d/.config/holdtrue')
    expect(settingsDir('linux', '/home/d', { XDG_CONFIG_HOME: '/x' })).toBe('/x/holdtrue')
    expect(settingsDir('win32', 'C:\\Users\\d', { APPDATA: 'C:\\Users\\d\\AppData\\Roaming' })).toBe('C:\\Users\\d\\AppData\\Roaming\\holdtrue')
    expect(memoryStore().path).toBe('memory')
  })
})

describe('the keychain seam', () => {
  test('a key that was set comes back, and a key that was forgotten gives null', () => {
    const secrets = memorySecrets()
    expect(secrets.get('nvidia')).toBeNull()
    secrets.set('nvidia', 'nvapi-x')
    expect(secrets.get('nvidia')).toBe('nvapi-x')
    secrets.forget('nvidia')
    expect(secrets.get('nvidia')).toBeNull()
  })
})

describe('the backend for a choice', () => {
  const settings: Settings = { ...EMPTY, openaiUrl: 'http://127.0.0.1:8080/v1/' }

  test('an ollama choice gives the ollama backend on the saved host, with no key', () => {
    expect(backendFor({ endpoint: 'ollama', model: 'a' }, settings, null)).toEqual({
      kind: 'ollama',
      host: 'http://127.0.0.1:11434',
      model: 'a',
    })
  })

  test('an nvidia choice gives the openai backend on the fixed NVIDIA url with the key', () => {
    expect(backendFor({ endpoint: 'nvidia', model: 'moonshotai/kimi-k3' }, settings, 'nvapi-x')).toEqual({
      kind: 'openai',
      baseUrl: NVIDIA_URL,
      key: 'nvapi-x',
      model: 'moonshotai/kimi-k3',
    })
  })

  test('an anthropic choice gives the apiKey backend with the key', () => {
    expect(backendFor({ endpoint: 'anthropic', model: 'claude-opus-5' }, settings, 'sk-ant')).toEqual({
      kind: 'apiKey',
      provider: 'anthropic',
      key: 'sk-ant',
      model: 'claude-opus-5',
    })
  })

  test('an openai choice gives the openai backend on the saved url, and a missing key is empty', () => {
    expect(backendFor({ endpoint: 'openai', model: 'a' }, settings, null)).toEqual({
      kind: 'openai',
      baseUrl: 'http://127.0.0.1:8080/v1',
      key: '',
      model: 'a',
    })
  })

  test('an openai choice with no saved url gives null, so the app names the missing url', () => {
    expect(backendFor({ endpoint: 'openai', model: 'a' }, EMPTY, null)).toBeNull()
  })

  test('a keyed endpoint with no key gives null, so the app asks for the key', () => {
    expect(backendFor({ endpoint: 'nvidia', model: 'a' }, settings, null)).toBeNull()
    expect(backendFor({ endpoint: 'anthropic', model: 'a' }, settings, '')).toBeNull()
  })
})
