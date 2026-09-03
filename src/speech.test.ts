/**
 * The tests for the speech layer.
 *
 * No test loads sherpa-onnx-node. No test reads a model from disk. No test opens a network
 * connection. Rule 32. Every test that needs an engine builds a fake engine in memory.
 *
 * The tests hold four groups. The first group checks that the layer holds no default model, and
 * that it loads no engine when the owner names no directory. Rule 50. The second group checks the
 * plan that the layer builds from a directory listing. The third group checks the two codecs, the
 * PCM reader and the WAV writer. They are the contract between the page and the server. The
 * fourth group checks the two handles: they never throw, they name what answered, and the ear
 * returns the words untouched. Rules 10, 23, 24 and 25.
 *
 * A test must not judge what a model transcribes or how a voice sounds. There is no oracle for
 * that. Rule 33.
 */

import { describe, expect, test } from 'vitest'

import {
  REASON,
  earConfig,
  openSpeech,
  pcmFromBytes,
  planEar,
  planVoice,
  voiceConfig,
  wavFromWave,
  type Engine,
  type Wave,
} from './speech.js'

/* ── the fake engine ─────────────────────────────────────────────────────────────────────────── */

type Made = { readonly recognizers: unknown[]; readonly voices: unknown[] }

/**
 * A fake engine. It records every config. Its recognizer returns one fixed text, or it throws.
 * Its voice returns one short wave, or it throws.
 */
const fakeEngine = (
  options: {
    readonly text?: string
    readonly decodeThrows?: string
    readonly generateThrows?: string
    readonly createThrows?: string
  } = {},
): { readonly engine: Engine; readonly made: Made } => {
  const made: Made = { recognizers: [], voices: [] }
  const engine: Engine = {
    version: '9.9.9',
    OfflineRecognizer: {
      createAsync: async (config: unknown) => {
        if (options.createThrows !== undefined) throw new Error(options.createThrows)
        made.recognizers.push(config)
        return {
          createStream: () => ({ acceptWaveform: () => undefined }),
          decodeAsync: async () => {
            if (options.decodeThrows !== undefined) throw new Error(options.decodeThrows)
            return { text: options.text ?? 'the fake heard this' }
          },
        }
      },
    },
    OfflineTts: {
      createAsync: async (config: unknown) => {
        if (options.createThrows !== undefined) throw new Error(options.createThrows)
        made.voices.push(config)
        return {
          numSpeakers: 3,
          sampleRate: 24_000,
          generateAsync: async () => {
            if (options.generateThrows !== undefined) throw new Error(options.generateThrows)
            return { samples: new Float32Array([0, 0.5, -0.5]), sampleRate: 24_000 }
          },
        }
      },
    },
  }
  return { engine, made }
}

const PARAKEET = ['decoder.int8.onnx', 'encoder.int8.onnx', 'joiner.int8.onnx', 'tokens.txt', 'test_wavs']
const QWEN = ['README.md', 'conv_frontend.onnx', 'decoder.int8.onnx', 'encoder.int8.onnx', 'tokenizer']
const KOKORO = [
  'LICENSE',
  'espeak-ng-data',
  'lexicon-gb-en.txt',
  'lexicon-us-en.txt',
  'lexicon-zh.txt',
  'model.onnx',
  'tokens.txt',
  'voices.bin',
]
const SUPERTONIC = [
  'duration_predictor.int8.onnx',
  'text_encoder.int8.onnx',
  'tts.json',
  'unicode_indexer.bin',
  'vector_estimator.int8.onnx',
  'vocoder.int8.onnx',
  'voice.bin',
]

/** A listing for the fake file system. A directory that the map does not hold does not exist. */
const listing =
  (dirs: Record<string, readonly string[]>) =>
  (dir: string): readonly string[] | null =>
    dirs[dir] ?? null

const wave: Wave = { samples: new Float32Array([0, 0.25]), sampleRate: 16_000 }

/* ── 1. no default ───────────────────────────────────────────────────────────────────────────── */

describe('the layer holds no default model', () => {
  test('no directory in the environment gives no ear, no voice and no loaded engine', async () => {
    let loads = 0
    const { engine } = fakeEngine()
    const speech = await openSpeech({}, async () => (loads++, engine), listing({}))
    expect(speech.ear).toBeNull()
    expect(speech.voice).toBeNull()
    expect(speech.reasons).toEqual({ ear: REASON.NO_DIR, voice: REASON.NO_DIR })
    expect(loads).toBe(0)
  })

  test('a directory that does not exist gives a stated reason and no engine', async () => {
    let loads = 0
    const { engine } = fakeEngine()
    const speech = await openSpeech(
      { HOLDTRUE_STT_DIR: '/nowhere/stt' },
      async () => (loads++, engine),
      listing({}),
    )
    expect(speech.ear).toBeNull()
    expect(speech.reasons.ear).toContain('/nowhere/stt')
    expect(speech.reasons.ear).toContain(REASON.NO_SUCH_DIR)
    expect(loads).toBe(0)
  })

  test('an engine that does not load gives a stated reason and never throws', async () => {
    const speech = await openSpeech(
      { HOLDTRUE_STT_DIR: '/m/parakeet', HOLDTRUE_TTS_DIR: '/m/kokoro' },
      async () => {
        throw new Error('no addon for this platform')
      },
      listing({ '/m/parakeet': PARAKEET, '/m/kokoro': KOKORO }),
    )
    expect(speech.ear).toBeNull()
    expect(speech.voice).toBeNull()
    expect(speech.reasons.ear).toContain('no addon for this platform')
    expect(speech.reasons.voice).toContain('no addon for this platform')
  })

  test('a model that does not open gives a stated reason and never throws', async () => {
    const { engine } = fakeEngine({ createThrows: 'bad onnx file' })
    const speech = await openSpeech(
      { HOLDTRUE_STT_DIR: '/m/parakeet' },
      async () => engine,
      listing({ '/m/parakeet': PARAKEET }),
    )
    expect(speech.ear).toBeNull()
    expect(speech.reasons.ear).toContain('bad onnx file')
  })
})

/* ── 2. the plan ─────────────────────────────────────────────────────────────────────────────── */

describe('the plan reads the directory listing', () => {
  test('encoder, decoder, joiner and tokens make a transducer plan with full paths', () => {
    expect(planEar('/m/parakeet', PARAKEET)).toEqual({
      kind: 'transducer',
      encoder: '/m/parakeet/encoder.int8.onnx',
      decoder: '/m/parakeet/decoder.int8.onnx',
      joiner: '/m/parakeet/joiner.int8.onnx',
      tokens: '/m/parakeet/tokens.txt',
    })
  })

  test('a conv frontend, encoder, decoder and tokenizer make a qwen3 plan', () => {
    expect(planEar('/m/qwen', QWEN)).toEqual({
      kind: 'qwen3',
      convFrontend: '/m/qwen/conv_frontend.onnx',
      encoder: '/m/qwen/encoder.int8.onnx',
      decoder: '/m/qwen/decoder.int8.onnx',
      tokenizer: '/m/qwen/tokenizer',
    })
  })

  test('a float export wins over nothing, and the int8 export wins over the float export', () => {
    const both = ['encoder.onnx', 'encoder.int8.onnx', 'decoder.onnx', 'joiner.onnx', 'tokens.txt']
    const plan = planEar('/m/x', both)
    expect(plan).toMatchObject({ kind: 'transducer', encoder: '/m/x/encoder.int8.onnx', decoder: '/m/x/decoder.onnx' })
  })

  test('a directory with no known ear layout gives a reason that names the directory', () => {
    const plan = planEar('/m/empty', ['README.md'])
    expect(plan).toEqual({ reason: `${REASON.NO_EAR_LAYOUT}: /m/empty` })
  })

  test('a kokoro directory makes a kokoro plan, and the US lexicon joins it before the others', () => {
    expect(planVoice('/m/kokoro', KOKORO)).toEqual({
      kind: 'kokoro',
      model: '/m/kokoro/model.onnx',
      voices: '/m/kokoro/voices.bin',
      tokens: '/m/kokoro/tokens.txt',
      dataDir: '/m/kokoro/espeak-ng-data',
      lexicon: '/m/kokoro/lexicon-us-en.txt,/m/kokoro/lexicon-zh.txt',
    })
  })

  test('a kokoro directory with the GB lexicon only puts that file first', () => {
    const plan = planVoice('/m/k', ['model.onnx', 'voices.bin', 'tokens.txt', 'espeak-ng-data', 'lexicon-zh.txt', 'lexicon-gb-en.txt'])
    expect(plan).toMatchObject({ kind: 'kokoro', lexicon: '/m/k/lexicon-gb-en.txt,/m/k/lexicon-zh.txt' })
  })

  test('a kokoro directory with no lexicon file makes a plan with an empty lexicon', () => {
    const plan = planVoice('/m/k', ['model.onnx', 'voices.bin', 'tokens.txt', 'espeak-ng-data'])
    expect(plan).toMatchObject({ kind: 'kokoro', lexicon: '' })
  })

  test('a supertonic directory makes a supertonic plan', () => {
    expect(planVoice('/m/super', SUPERTONIC)).toEqual({
      kind: 'supertonic',
      durationPredictor: '/m/super/duration_predictor.int8.onnx',
      textEncoder: '/m/super/text_encoder.int8.onnx',
      vectorEstimator: '/m/super/vector_estimator.int8.onnx',
      vocoder: '/m/super/vocoder.int8.onnx',
      ttsJson: '/m/super/tts.json',
      unicodeIndexer: '/m/super/unicode_indexer.bin',
      voiceStyle: '/m/super/voice.bin',
    })
  })

  test('a directory with no known voice layout gives a reason that names the directory', () => {
    expect(planVoice('/m/none', PARAKEET)).toEqual({ reason: `${REASON.NO_VOICE_LAYOUT}: /m/none` })
  })

  test('the ear config puts the plan under the key that sherpa reads, and sets the thread count', () => {
    const plan = planEar('/m/parakeet', PARAKEET)
    if ('reason' in plan) throw new Error(plan.reason)
    expect(earConfig(plan, 3)).toEqual({
      featConfig: { sampleRate: 16_000, featureDim: 80 },
      modelConfig: {
        transducer: {
          encoder: '/m/parakeet/encoder.int8.onnx',
          decoder: '/m/parakeet/decoder.int8.onnx',
          joiner: '/m/parakeet/joiner.int8.onnx',
        },
        tokens: '/m/parakeet/tokens.txt',
        numThreads: 3,
        provider: 'cpu',
        debug: 0,
      },
    })
    const qwen = planEar('/m/qwen', QWEN)
    if ('reason' in qwen) throw new Error(qwen.reason)
    expect(earConfig(qwen, 2).modelConfig).toMatchObject({ qwen3Asr: { tokenizer: '/m/qwen/tokenizer', hotwords: '' }, tokens: '' })
  })

  test('the voice config puts the plan under the key that sherpa reads', () => {
    const plan = planVoice('/m/kokoro', KOKORO)
    if ('reason' in plan) throw new Error(plan.reason)
    expect(voiceConfig(plan, 2)).toEqual({
      model: {
        kokoro: {
          model: '/m/kokoro/model.onnx',
          voices: '/m/kokoro/voices.bin',
          tokens: '/m/kokoro/tokens.txt',
          dataDir: '/m/kokoro/espeak-ng-data',
          lexicon: '/m/kokoro/lexicon-us-en.txt,/m/kokoro/lexicon-zh.txt',
        },
        numThreads: 2,
        provider: 'cpu',
        debug: false,
      },
      maxNumSentences: 1,
    })
  })
})

/* ── 3. the codecs ───────────────────────────────────────────────────────────────────────────── */

describe('the PCM reader', () => {
  test('two little-endian 16-bit samples become two floats between minus one and one', () => {
    const bytes = new Uint8Array([0xff, 0x7f, 0x00, 0x80])
    const samples = pcmFromBytes(bytes)
    expect(samples).not.toBeNull()
    expect(Array.from(samples ?? [])).toEqual([32_767 / 32_768, -1])
  })

  test('an odd byte count is not PCM, so the reader returns null', () => {
    expect(pcmFromBytes(new Uint8Array([1, 2, 3]))).toBeNull()
  })

  test('an empty body holds no sample, so the reader returns null', () => {
    expect(pcmFromBytes(new Uint8Array([]))).toBeNull()
  })

  test('the reader honours the byte offset of a view into a larger buffer', () => {
    const backing = new Uint8Array([9, 9, 0x00, 0x40])
    const view = new Uint8Array(backing.buffer, 2, 2)
    expect(Array.from(pcmFromBytes(view) ?? [])).toEqual([0.5])
  })
})

describe('the WAV writer', () => {
  test('the header names RIFF, WAVE, one channel, the rate and the data length', () => {
    const out = wavFromWave({ samples: new Float32Array([0, 1, -1]), sampleRate: 24_000 })
    expect(out.length).toBe(44 + 6)
    expect(out.toString('ascii', 0, 4)).toBe('RIFF')
    expect(out.readUInt32LE(4)).toBe(36 + 6)
    expect(out.toString('ascii', 8, 12)).toBe('WAVE')
    expect(out.toString('ascii', 12, 16)).toBe('fmt ')
    expect(out.readUInt16LE(20)).toBe(1)
    expect(out.readUInt16LE(22)).toBe(1)
    expect(out.readUInt32LE(24)).toBe(24_000)
    expect(out.readUInt32LE(28)).toBe(48_000)
    expect(out.readUInt16LE(32)).toBe(2)
    expect(out.readUInt16LE(34)).toBe(16)
    expect(out.toString('ascii', 36, 40)).toBe('data')
    expect(out.readUInt32LE(40)).toBe(6)
  })

  test('a sample beyond one clips to the 16-bit range instead of wrapping', () => {
    const out = wavFromWave({ samples: new Float32Array([2, -2, 0.5]), sampleRate: 16_000 })
    expect(out.readInt16LE(44)).toBe(32_767)
    expect(out.readInt16LE(46)).toBe(-32_768)
    expect(out.readInt16LE(48)).toBe(16_384)
  })

  test('the writer and the reader round trip a wave', () => {
    const samples = new Float32Array([0, 0.5, -0.5, 0.25])
    const out = wavFromWave({ samples, sampleRate: 16_000 })
    const back = pcmFromBytes(new Uint8Array(out.buffer, out.byteOffset + 44, out.length - 44))
    expect(Array.from(back ?? []).map(v => Math.round(v * 1000) / 1000)).toEqual([0, 0.5, -0.5, 0.25])
  })
})

/* ── 4. the two handles ──────────────────────────────────────────────────────────────────────── */

const opened = async (options: Parameters<typeof fakeEngine>[0] = {}, env: Record<string, string> = {}) => {
  const { engine, made } = fakeEngine(options)
  const speech = await openSpeech(
    { HOLDTRUE_STT_DIR: '/m/parakeet-v3', HOLDTRUE_TTS_DIR: '/m/kokoro-v1', ...env },
    async () => engine,
    listing({ '/m/parakeet-v3': PARAKEET, '/m/kokoro-v1': KOKORO }),
  )
  return { speech, made }
}

describe('the ear', () => {
  test('the ear returns the words of the engine untouched, with the filled pause and the full stop', async () => {
    const text = 'um, so the gas gets, uh, squeezed and that makes it hot. '
    const { speech } = await opened({ text })
    const result = await speech.ear?.hear(wave)
    expect(result).toEqual({ ok: true, text })
  })

  test('the ear names the directory that answered and the runtime, and calls it uncalibrated', async () => {
    const { speech } = await opened()
    expect(speech.ear?.identify()).toEqual({
      model_id: 'parakeet-v3',
      runtime: 'sherpa-onnx-node 9.9.9',
      calibration: 'uncalibrated',
    })
  })

  test('an engine that throws on decode gives a reason and never an exception', async () => {
    const { speech } = await opened({ decodeThrows: 'the stream died' })
    const result = await speech.ear?.hear(wave)
    expect(result).toEqual({ ok: false, reason: `${REASON.EAR_FAILED}: the stream died` })
  })

  test('an engine that hears nothing gives the empty reason, not an empty line', async () => {
    const { speech } = await opened({ text: '   ' })
    expect(await speech.ear?.hear(wave)).toEqual({ ok: false, reason: REASON.NOTHING_HEARD })
  })

  test('a wave with no sample gives the empty reason before any engine call', async () => {
    const { speech } = await opened({ decodeThrows: 'must not be called' })
    const result = await speech.ear?.hear({ samples: new Float32Array(0), sampleRate: 16_000 })
    expect(result).toEqual({ ok: false, reason: REASON.NO_AUDIO })
  })
})

describe('the voice', () => {
  test('the voice returns the samples and the rate of the engine', async () => {
    const { speech } = await opened()
    const result = await speech.voice?.say('What squeezes the gas?')
    expect(result).toEqual({ ok: true, wave: { samples: new Float32Array([0, 0.5, -0.5]), sampleRate: 24_000 } })
  })

  test('the voice names the directory that answered and the runtime', async () => {
    const { speech } = await opened()
    expect(speech.voice?.identify()).toEqual({
      model_id: 'kokoro-v1',
      runtime: 'sherpa-onnx-node 9.9.9',
      calibration: 'uncalibrated',
    })
  })

  test('the voice passes the speaker id from the environment to the engine', async () => {
    const { engine } = fakeEngine()
    let seen: unknown = null
    const spied: Engine = {
      ...engine,
      OfflineTts: {
        createAsync: async config => {
          const voice = await engine.OfflineTts.createAsync(config)
          return {
            ...voice,
            generateAsync: async request => ((seen = request), voice.generateAsync(request)),
          }
        },
      },
    }
    const speech = await openSpeech(
      { HOLDTRUE_TTS_DIR: '/m/kokoro', HOLDTRUE_TTS_VOICE: '2' },
      async () => spied,
      listing({ '/m/kokoro': KOKORO }),
    )
    await speech.voice?.say('hello')
    expect(seen).toMatchObject({ text: 'hello', sid: 2, generationConfig: { sid: 2 } })
  })

  test('a speaker id past the count of the model is a stated reason at open, not a crash later', async () => {
    const { speech } = await opened({}, { HOLDTRUE_TTS_VOICE: '7' })
    expect(speech.voice).toBeNull()
    expect(speech.reasons.voice).toContain(REASON.NO_SUCH_VOICE)
  })

  test('an engine that throws on generate gives a reason and never an exception', async () => {
    const { speech } = await opened({ generateThrows: 'the vocoder died' })
    expect(await speech.voice?.say('hello')).toEqual({ ok: false, reason: `${REASON.VOICE_FAILED}: the vocoder died` })
  })

  test('empty text gives the empty reason before any engine call', async () => {
    const { speech } = await opened({ generateThrows: 'must not be called' })
    expect(await speech.voice?.say('  ')).toEqual({ ok: false, reason: REASON.NO_TEXT })
  })
})
