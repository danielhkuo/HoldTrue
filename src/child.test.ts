/**
 * The first tests this product has ever had.
 *
 * The old suite was 174 tests and not one of them touched the child. Everything below is either a
 * pure function or a fake model, so none of it needs Ollama.
 *
 * What is deliberately NOT tested: whether the child's line is any good. There is no oracle for
 * that, an LLM judge is banned, and a golden-transcript test would be a false oracle — this runner
 * is not byte-deterministic at temperature 0, so a snapshot would fail for reasons unrelated to
 * the prompt and would end up being updated on every failure until it asserted nothing.
 */

import { describe, expect, test } from 'vitest'
import { examplesFor, systemFor, promptFor, speak, type Exchange, type Said } from './child.js'
import type { ModelHandle } from './model.js'

const said = (line: string): Said => ({ kind: 'said', line })
const ex = (you: string, line: string): Exchange => ({ you, child: said(line), seconds: 0 })

/** A model that answers whatever it is told to, and records what it was asked. */
const fake = (answer: string | null) => {
  const seen: { system: string; user: string }[] = []
  const handle: ModelHandle = {
    identify: async () => ({ model_id: 'fake', runtime: 'none', calibration: 'uncalibrated' }),
    ask: async (system, user) => {
      seen.push({ system, user })
      return answer
    },
  }
  return { handle, seen }
}

describe('the example bank rotates', () => {
  test('no two consecutive turns get the same examples', () => {
    for (let t = 0; t < 10; t++) {
      expect(examplesFor(t)).not.toBe(examplesFor(t + 1))
    }
  })

  test('every turn is dealt four distinct examples', () => {
    for (let t = 0; t < 6; t++) {
      const pairs = examplesFor(t).split('\n\n')
      expect(pairs).toHaveLength(4)
      expect(new Set(pairs).size).toBe(4)
    }
  })

  test('the cycle length is the size of the bank, which is the known limit', () => {
    // Five examples give five rotations before repeating. Recorded as a test rather than a
    // comment so growing the bank visibly changes this number.
    expect(examplesFor(0)).toBe(examplesFor(5))
    expect(examplesFor(0)).not.toBe(examplesFor(4))
  })
})

describe('the prompt shows a voice rather than naming one', () => {
  /**
   * These assert the SHAPE that was measured, not the absence of a voice — you cannot grep for
   * "describes a voice", and an earlier version of this block pretended you could. It was two
   * string greps under a name claiming far more, which is the weak-oracle failure this repo
   * documents. Renamed and re-pointed at what actually failed.
   */
  test('it quotes none of the openers whose list caused the original collapse', () => {
    // The first prompt named the openers it wanted — wait, ohhh, how come, whoa — and six of six
    // lines came back opening "ohhh". Deleting them moved the collapse to "So"; forbidding "ohhh"
    // moved it to "whoa". A quoted opener list in the framing is the thing that must never return.
    const framing = systemFor(0).split('Here is how you sound')[0]!.toLowerCase()
    for (const opener of ['ohhh', 'whoa', 'how come', 'wait,']) {
      expect(framing).not.toContain(opener)
    }
  })

  test('the examples outweigh the framing, which is the whole technique', () => {
    // A prior can only be outweighed by a sample. If the framing ever grows past the examples,
    // the prompt has drifted back toward description without anyone deciding to.
    const [framing, rest] = systemFor(0).split('Here is how you sound') as [string, string]
    const examples = rest.split('Do not reuse the words')[0]!
    expect(examples.length).toBeGreaterThan(framing.length)
  })

  test('it forbids the yes/no question that made the child useless', () => {
    expect(systemFor(0)).toContain('Never ask something they can answer with just')
  })
})

describe('your words reach the model untouched', () => {
  test('a leading connective and the full stop both survive', () => {
    // The old build stripped these. "so what happens after that?" became "what happens after
    // that", which is an edit to the input nobody measured.
    const prompt = promptFor([], 'so then the pressure drops.')
    expect(prompt).toContain('them: so then the pressure drops.')
  })

  test('filler is not removed either, because typed text is not a transcript', () => {
    expect(promptFor([], 'um the flapper lifts')).toContain('um the flapper lifts')
  })

  test('the prompt ends on an empty turn for the model to complete', () => {
    expect(promptFor([], 'anything')).toMatch(/\n\nyou:$/)
  })

  test('history renders as a script and silence leaves no line', () => {
    const history: Exchange[] = [
      ex('the yeast eats sugar', 'What does it make?'),
      { you: 'carbon dioxide', child: { kind: 'silent', reason: 'x' }, seconds: 0 },
    ]
    const prompt = promptFor(history, 'the gas is trapped')
    expect(prompt).toContain('them: the yeast eats sugar')
    expect(prompt).toContain('you: What does it make?')
    expect(prompt).toContain('them: carbon dioxide')
    expect(prompt).toContain('them: the gas is trapped')
    // The silent turn contributed no `you:` line.
    expect(prompt.match(/^you: /gm) ?? []).toHaveLength(1)
  })
})

describe('a turn is total', () => {
  test('an unreachable model is a silence, not a throw', async () => {
    const { handle } = fake(null)
    await expect(speak([], 'anything', handle)).resolves.toEqual({
      kind: 'silent',
      reason: 'no answer from the model',
    })
  })

  test('an empty answer is a silence', async () => {
    const { handle } = fake('   \n  \n ')
    const out = await speak([], 'anything', handle)
    expect(out.kind).toBe('silent')
  })

  test('a rambling answer is cut to its first line', async () => {
    const { handle } = fake('Wait, where does it go?\n\nAlso I was wondering about the pipe.\nAnd more.')
    await expect(speak([], 'anything', handle)).resolves.toEqual({
      kind: 'said',
      line: 'Wait, where does it go?',
    })
  })

  test('exactly one model call per turn', async () => {
    const { handle, seen } = fake('ok')
    await speak([], 'anything', handle)
    expect(seen).toHaveLength(1)
  })

  test('the system prompt advances with the conversation', async () => {
    const { handle, seen } = fake('ok')
    await speak([], 'first', handle)
    await speak([ex('first', 'ok')], 'second', handle)
    expect(seen[0]!.system).not.toBe(seen[1]!.system)
  })
})
