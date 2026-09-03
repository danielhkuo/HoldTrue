/**
 * The speech layer. It holds the ear and the voice behind one seam.
 *
 * The ear turns audio into words. The voice turns the lines of the child into audio. Both run on
 * the machine of the user, inside this process, on the sherpa-onnx runtime. No audio leaves the
 * machine. No audio reaches a disk. The words that the ear returns go to the model the way typed
 * words go to the model, and they go untouched. Rule 10.
 *
 * The owner names the two model directories. `HOLDTRUE_STT_DIR` holds a speech-to-text export
 * for sherpa-onnx. `HOLDTRUE_TTS_DIR` holds a text-to-speech export for sherpa-onnx. This part
 * reads the directory listing and picks the layout that it knows. It knows four layouts:
 *
 * - a NeMo transducer, for NVIDIA Parakeet TDT: encoder, decoder, joiner and tokens.txt;
 * - Qwen3-ASR: conv_frontend.onnx, encoder, decoder and a tokenizer directory;
 * - Kokoro: model.onnx, voices.bin, tokens.txt, espeak-ng-data and the lexicon files;
 * - Supertonic: the four onnx parts, tts.json, unicode_indexer.bin and voice.bin.
 *
 * There is no default model. Rule 50. A missing variable gives no ear or no voice, and the app
 * then takes typed words only. A directory that this code does not know gives a stated reason.
 * `HOLDTRUE_TTS_VOICE` picks the speaker id of the voice model. It defaults to zero, because a
 * speaker id is a setting of one named model and not a model choice.
 *
 * This part serves rules 10, 18, 22, 23, 24, 25, 32, 47 and 50, and the cases V1, V2 and V3.
 *
 * The part must not do these things:
 * - It must not throw from `hear` or from `say`. A failure is a result with a reason.
 * - It must not edit the words that the ear returns. No trim, no filler strip, no punctuation.
 * - It must not read a confidence, a timestamp or a pause from the engine. Rule 18.
 * - It must not write audio to a disk. The WAV writer returns a buffer, never a file.
 * - It must not load the engine when the owner names no directory. A test then needs no addon.
 * - It must not name a model in the attribution that did not answer. The directory that answered
 *   is the name.
 *
 * ONE NOTE ON THE ENGINE. `sherpa-onnx-node` is a native addon. This part loads it through
 * `createRequire`, one time, and only when a directory is named. The `Engine` type below is the
 * small part of the addon that this code touches. A test passes a fake engine of that shape.
 */

import { readdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { basename, join } from 'node:path'

import type { Attribution } from './model.js'

/* ── the contract ────────────────────────────────────────────────────────────────────────────── */

/** Audio in memory. The samples are floats between minus one and one, one channel. */
export type Wave = { readonly samples: Float32Array; readonly sampleRate: number }

/** What the ear returns. The text is the words of the engine, untouched. */
export type HearResult =
  | { readonly ok: true; readonly text: string }
  | { readonly ok: false; readonly reason: string }

/** What the voice returns. */
export type SayResult =
  | { readonly ok: true; readonly wave: Wave }
  | { readonly ok: false; readonly reason: string }

/** The ear. `identify` names the model directory that answers. `hear` never throws. */
export type Ear = {
  readonly identify: () => Attribution
  readonly hear: (wave: Wave) => Promise<HearResult>
}

/** The voice. `identify` names the model directory that answers. `say` never throws. */
export type Voice = {
  readonly identify: () => Attribution
  readonly say: (text: string) => Promise<SayResult>
}

/** What the app holds. A null member carries its reason in `reasons`. */
export type Speech = {
  readonly ear: Ear | null
  readonly voice: Voice | null
  readonly reasons: { readonly ear: string | null; readonly voice: string | null }
}

/** Every reason that this part can give. A test imports these strings. A caller prints them. */
export const REASON = {
  NO_DIR: 'no model directory is named',
  NO_SUCH_DIR: 'the directory does not exist or cannot be read',
  NO_EAR_LAYOUT: 'the directory holds no speech-to-text layout this code knows',
  NO_VOICE_LAYOUT: 'the directory holds no text-to-speech layout this code knows',
  ENGINE_FAILED: 'the speech engine did not load',
  OPEN_FAILED: 'the model did not open',
  BAD_VOICE_ID: 'the speaker id is not a whole number',
  NO_SUCH_VOICE: 'the model holds no speaker with this id',
  EAR_FAILED: 'the ear failed',
  VOICE_FAILED: 'the voice failed',
  NOTHING_HEARD: 'the ear heard no words',
  NO_AUDIO: 'the request holds no audio',
  NO_TEXT: 'the request holds no text',
} as const

/* ── the engine ──────────────────────────────────────────────────────────────────────────────── */

/** One recognizer of the addon. This is the part of it that the ear touches. */
export type Recognizer = {
  readonly createStream: () => { readonly acceptWaveform: (wave: Wave) => void }
  readonly decodeAsync: (stream: { readonly acceptWaveform: (wave: Wave) => void }) => Promise<{
    readonly text?: unknown
  }>
}

/** One synthesizer of the addon. This is the part of it that the voice touches. */
export type Synthesizer = {
  readonly numSpeakers: number
  readonly sampleRate: number
  readonly generateAsync: (request: {
    readonly text: string
    readonly sid: number
    readonly speed: number
    readonly generationConfig: Record<string, unknown>
  }) => Promise<{ readonly samples: Float32Array; readonly sampleRate: number }>
}

/** The addon, as this code sees it. A test builds one of these in memory. */
export type Engine = {
  readonly version: string
  readonly OfflineRecognizer: { readonly createAsync: (config: unknown) => Promise<Recognizer> }
  readonly OfflineTts: { readonly createAsync: (config: unknown) => Promise<Synthesizer> }
}

/** The real engine. This runs one time, and only after the owner names a directory. */
const loadEngine = async (): Promise<Engine> => {
  const require = createRequire(import.meta.url)
  return require('sherpa-onnx-node') as Engine
}

/** The real listing. A directory that does not exist gives null, never an exception. */
const listDir = (dir: string): readonly string[] | null => {
  try {
    return readdirSync(dir)
  } catch {
    return null
  }
}

const message = (error: unknown): string =>
  error instanceof Error ? error.message : String(error)

/* ── the plan ────────────────────────────────────────────────────────────────────────────────── */

/** What the ear runs. Each member names the files of one layout, with full paths. */
export type EarPlan =
  | {
      readonly kind: 'transducer'
      readonly encoder: string
      readonly decoder: string
      readonly joiner: string
      readonly tokens: string
    }
  | {
      readonly kind: 'qwen3'
      readonly convFrontend: string
      readonly encoder: string
      readonly decoder: string
      readonly tokenizer: string
    }

/** What the voice runs. Each member names the files of one layout, with full paths. */
export type VoicePlan =
  | {
      readonly kind: 'kokoro'
      readonly model: string
      readonly voices: string
      readonly tokens: string
      readonly dataDir: string
      readonly lexicon: string
    }
  | {
      readonly kind: 'supertonic'
      readonly durationPredictor: string
      readonly textEncoder: string
      readonly vectorEstimator: string
      readonly vocoder: string
      readonly ttsJson: string
      readonly unicodeIndexer: string
      readonly voiceStyle: string
    }

/** A plan that failed. It carries the reason. Most reasons name the directory inside the text. */
export type NoPlan = { readonly reason: string }

/**
 * One onnx part by its stem. The int8 export wins over the float export. The sherpa-onnx
 * releases ship the int8 export first, and the int8 export fits a laptop.
 */
const onnx = (dir: string, files: readonly string[], stem: string): string | null => {
  if (files.includes(`${stem}.int8.onnx`)) return join(dir, `${stem}.int8.onnx`)
  if (files.includes(`${stem}.onnx`)) return join(dir, `${stem}.onnx`)
  return null
}

/** One file by its exact name. */
const file = (dir: string, files: readonly string[], name: string): string | null =>
  files.includes(name) ? join(dir, name) : null

/** The plan for the ear, from a listing. It reads names only. It opens no file. */
export const planEar = (dir: string, files: readonly string[]): EarPlan | NoPlan => {
  const encoder = onnx(dir, files, 'encoder')
  const decoder = onnx(dir, files, 'decoder')
  const joiner = onnx(dir, files, 'joiner')
  const tokens = file(dir, files, 'tokens.txt')
  if (encoder !== null && decoder !== null && joiner !== null && tokens !== null) {
    return { kind: 'transducer', encoder, decoder, joiner, tokens }
  }
  const convFrontend = onnx(dir, files, 'conv_frontend')
  const tokenizer = file(dir, files, 'tokenizer')
  if (convFrontend !== null && encoder !== null && decoder !== null && tokenizer !== null) {
    return { kind: 'qwen3', convFrontend, encoder, decoder, tokenizer }
  }
  return { reason: `${REASON.NO_EAR_LAYOUT}: ${dir}` }
}

/**
 * One English lexicon file goes first. The US file wins over the GB file. The two files hold the
 * same words, and the engine warns on every duplicate. The other lexicon files follow in the
 * order of the listing.
 */
const lexiconOf = (dir: string, files: readonly string[]): string => {
  const english = ['lexicon-us-en.txt', 'lexicon-gb-en.txt'].filter(name => files.includes(name))
  const first = english.slice(0, 1)
  const rest = files.filter(name => /^lexicon-.*\.txt$/.test(name) && !english.includes(name))
  return [...first, ...rest].map(name => join(dir, name)).join(',')
}

/** The plan for the voice, from a listing. It reads names only. It opens no file. */
export const planVoice = (dir: string, files: readonly string[]): VoicePlan | NoPlan => {
  const model = file(dir, files, 'model.onnx')
  const voices = file(dir, files, 'voices.bin')
  const tokens = file(dir, files, 'tokens.txt')
  const dataDir = file(dir, files, 'espeak-ng-data')
  if (model !== null && voices !== null && tokens !== null && dataDir !== null) {
    return { kind: 'kokoro', model, voices, tokens, dataDir, lexicon: lexiconOf(dir, files) }
  }
  const durationPredictor = onnx(dir, files, 'duration_predictor')
  const textEncoder = onnx(dir, files, 'text_encoder')
  const vectorEstimator = onnx(dir, files, 'vector_estimator')
  const vocoder = onnx(dir, files, 'vocoder')
  const ttsJson = file(dir, files, 'tts.json')
  const unicodeIndexer = file(dir, files, 'unicode_indexer.bin')
  const voiceStyle = file(dir, files, 'voice.bin')
  if (
    durationPredictor !== null &&
    textEncoder !== null &&
    vectorEstimator !== null &&
    vocoder !== null &&
    ttsJson !== null &&
    unicodeIndexer !== null &&
    voiceStyle !== null
  ) {
    return {
      kind: 'supertonic',
      durationPredictor,
      textEncoder,
      vectorEstimator,
      vocoder,
      ttsJson,
      unicodeIndexer,
      voiceStyle,
    }
  }
  return { reason: `${REASON.NO_VOICE_LAYOUT}: ${dir}` }
}

/** The recognizer config, in the shape that sherpa-onnx-node reads. */
export const earConfig = (plan: EarPlan, threads: number): Record<string, unknown> => {
  const featConfig = { sampleRate: 16_000, featureDim: 80 }
  const common = { numThreads: threads, provider: 'cpu', debug: 0 }
  if (plan.kind === 'transducer') {
    const { encoder, decoder, joiner, tokens } = plan
    return { featConfig, modelConfig: { transducer: { encoder, decoder, joiner }, tokens, ...common } }
  }
  const { convFrontend, encoder, decoder, tokenizer } = plan
  return {
    featConfig,
    modelConfig: {
      qwen3Asr: { convFrontend, encoder, decoder, tokenizer, hotwords: '' },
      tokens: '',
      ...common,
    },
  }
}

/** The synthesizer config, in the shape that sherpa-onnx-node reads. */
export const voiceConfig = (plan: VoicePlan, threads: number): Record<string, unknown> => {
  const common = { numThreads: threads, provider: 'cpu', debug: false }
  const { kind, ...parts } = plan
  return { model: { [kind]: parts, ...common }, maxNumSentences: 1 }
}

/* ── the codecs ──────────────────────────────────────────────────────────────────────────────── */

/**
 * Little-endian 16-bit PCM, one channel, to floats. The page sends this shape.
 * An empty body and an odd byte count are not PCM, so the reader returns null.
 */
export const pcmFromBytes = (bytes: Uint8Array): Float32Array | null => {
  if (bytes.byteLength === 0 || bytes.byteLength % 2 !== 0) return null
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const samples = new Float32Array(bytes.byteLength / 2)
  for (let i = 0; i < samples.length; i++) samples[i] = view.getInt16(i * 2, true) / 32_768
  return samples
}

/** One sample to 16 bits. A value past the range clips. It never wraps. */
const int16 = (value: number): number => {
  const clipped = Math.max(-1, Math.min(1, value))
  return Math.round(clipped < 0 ? clipped * 32_768 : clipped * 32_767)
}

/** A WAV file in memory: 16-bit PCM, one channel. It returns a buffer and it writes no file. */
export const wavFromWave = (wave: Wave): Buffer => {
  const dataBytes = wave.samples.length * 2
  const out = Buffer.alloc(44 + dataBytes)
  out.write('RIFF', 0, 'ascii')
  out.writeUInt32LE(36 + dataBytes, 4)
  out.write('WAVE', 8, 'ascii')
  out.write('fmt ', 12, 'ascii')
  out.writeUInt32LE(16, 16)
  out.writeUInt16LE(1, 20)
  out.writeUInt16LE(1, 22)
  out.writeUInt32LE(wave.sampleRate, 24)
  out.writeUInt32LE(wave.sampleRate * 2, 28)
  out.writeUInt16LE(2, 32)
  out.writeUInt16LE(16, 34)
  out.write('data', 36, 'ascii')
  out.writeUInt32LE(dataBytes, 40)
  for (let i = 0; i < wave.samples.length; i++) {
    out.writeInt16LE(int16(wave.samples[i] ?? 0), 44 + i * 2)
  }
  return out
}

/* ── the two handles ─────────────────────────────────────────────────────────────────────────── */

type Env = Readonly<Record<string, string | undefined>>
type Load = () => Promise<Engine>
type List = (dir: string) => readonly string[] | null

/**
 * The default thread count. HOLDTRUE_SPEECH_THREADS changes it. It is a runtime setting and not a
 * model choice, so rule 50 does not bind it. HOLDTRUE_TTS_LANG is the same kind of setting.
 */
const DEFAULT_THREADS = 4

/**
 * One queue for each engine handle. The addon runs one decode at a time on one recognizer, so
 * two requests that land together take turns.
 */
const queue = () => {
  let tail: Promise<unknown> = Promise.resolve()
  return <T>(run: () => Promise<T>): Promise<T> => {
    const next = tail.then(run, run)
    tail = next.catch(() => undefined)
    return next
  }
}

const attribution = (dir: string, engine: Engine): Attribution => ({
  model_id: basename(dir),
  runtime: `sherpa-onnx-node ${engine.version}`,
  calibration: 'uncalibrated',
})

const openEar = async (
  dir: string,
  threads: number,
  engineOf: () => Promise<Engine | NoPlan>,
  list: List,
): Promise<{ readonly ear: Ear } | NoPlan> => {
  if (dir === '') return { reason: REASON.NO_DIR }
  const files = list(dir)
  if (files === null) return { reason: `${REASON.NO_SUCH_DIR}: ${dir}` }
  const plan = planEar(dir, files)
  if ('reason' in plan) return plan
  const engine = await engineOf()
  if ('reason' in engine) return engine

  let recognizer: Recognizer
  try {
    recognizer = await engine.OfflineRecognizer.createAsync(earConfig(plan, threads))
  } catch (error) {
    return { reason: `${REASON.OPEN_FAILED}: ${message(error)}` }
  }

  const who = attribution(dir, engine)
  const inOrder = queue()
  const hear = async (wave: Wave): Promise<HearResult> => {
    if (wave.samples.length === 0) return { ok: false, reason: REASON.NO_AUDIO }
    try {
      return await inOrder(async () => {
        const stream = recognizer.createStream()
        stream.acceptWaveform(wave)
        const result = await recognizer.decodeAsync(stream)
        // Rule 10. The text goes out as the engine wrote it. The trim below decides emptiness only.
        const text = typeof result.text === 'string' ? result.text : ''
        if (text.trim() === '') return { ok: false, reason: REASON.NOTHING_HEARD }
        return { ok: true, text }
      })
    } catch (error) {
      return { ok: false, reason: `${REASON.EAR_FAILED}: ${message(error)}` }
    }
  }
  return { ear: { identify: () => who, hear } }
}

/** The speaker id from the environment. An absent value is zero. A broken value is a reason. */
const speakerOf = (env: Env): number | NoPlan => {
  const raw = (env['HOLDTRUE_TTS_VOICE'] ?? '').trim()
  if (raw === '') return 0
  const id = Number(raw)
  return Number.isInteger(id) && id >= 0 ? id : { reason: `${REASON.BAD_VOICE_ID}: ${raw}` }
}

/** What the voice asks the engine for, by layout. Supertonic needs a language and a step count. */
const generation = (plan: VoicePlan, sid: number, lang: string): Record<string, unknown> =>
  plan.kind === 'supertonic'
    ? { sid, speed: 1.0, numSteps: 8, extra: { lang } }
    : { sid, speed: 1.0 }

const openVoice = async (
  dir: string,
  threads: number,
  env: Env,
  engineOf: () => Promise<Engine | NoPlan>,
  list: List,
): Promise<{ readonly voice: Voice } | NoPlan> => {
  if (dir === '') return { reason: REASON.NO_DIR }
  const files = list(dir)
  if (files === null) return { reason: `${REASON.NO_SUCH_DIR}: ${dir}` }
  const plan = planVoice(dir, files)
  if ('reason' in plan) return plan
  const sid = speakerOf(env)
  if (typeof sid !== 'number') return sid
  const lang = (env['HOLDTRUE_TTS_LANG'] ?? '').trim() || 'en'
  const engine = await engineOf()
  if ('reason' in engine) return engine

  let synthesizer: Synthesizer
  try {
    synthesizer = await engine.OfflineTts.createAsync(voiceConfig(plan, threads))
  } catch (error) {
    return { reason: `${REASON.OPEN_FAILED}: ${message(error)}` }
  }
  if (sid >= synthesizer.numSpeakers) {
    return { reason: `${REASON.NO_SUCH_VOICE}: ${sid} of ${synthesizer.numSpeakers}` }
  }

  const who = attribution(dir, engine)
  const inOrder = queue()
  const say = async (text: string): Promise<SayResult> => {
    if (text.trim() === '') return { ok: false, reason: REASON.NO_TEXT }
    try {
      return await inOrder(async () => {
        const audio = await synthesizer.generateAsync({
          text,
          sid,
          speed: 1.0,
          generationConfig: generation(plan, sid, lang),
        })
        return { ok: true, wave: { samples: audio.samples, sampleRate: audio.sampleRate } }
      })
    } catch (error) {
      return { ok: false, reason: `${REASON.VOICE_FAILED}: ${message(error)}` }
    }
  }
  return { voice: { identify: () => who, say } }
}

/**
 * Open the ear and the voice from the environment.
 *
 * It loads the engine one time, and only when a directory is named. It never throws. A member
 * that did not open is null, and `reasons` names why. A test passes a fake engine and a fake
 * listing, so no test needs the addon or a model on disk. Rule 32.
 */
export const openSpeech = async (
  env: Env,
  load: Load = loadEngine,
  list: List = listDir,
): Promise<Speech> => {
  const threads = Number((env['HOLDTRUE_SPEECH_THREADS'] ?? '').trim()) || DEFAULT_THREADS
  let loading: Promise<Engine | NoPlan> | null = null
  const engineOf = (): Promise<Engine | NoPlan> => {
    loading ??= load().catch((error: unknown) => ({
      reason: `${REASON.ENGINE_FAILED}: ${message(error)}`,
    }))
    return loading
  }

  const sttDir = (env['HOLDTRUE_STT_DIR'] ?? '').trim()
  const ttsDir = (env['HOLDTRUE_TTS_DIR'] ?? '').trim()
  const [ear, voice] = await Promise.all([
    openEar(sttDir, threads, engineOf, list),
    openVoice(ttsDir, threads, env, engineOf, list),
  ])
  return {
    ear: 'ear' in ear ? ear.ear : null,
    voice: 'voice' in voice ? voice.voice : null,
    reasons: {
      ear: 'reason' in ear ? ear.reason : null,
      voice: 'reason' in voice ? voice.reason : null,
    },
  }
}
