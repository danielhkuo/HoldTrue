/**
 * The tests for the discrimination count.
 *
 * Every test here runs against a fake `ModelHandle`. No test opens a socket, and no test needs
 * Ollama. Rule 32 holds. The file also imports `src/discriminate.ts`, so the guard at the end of
 * that file must hold the command line back. A run of this suite that prints a report is a defect.
 *
 * The fake answers from the prompt it receives. It reads the last `them:` line, which is what the
 * person just said, and it reads the whole prompt, which shows whether the removed step is in the
 * history. A test can therefore give one line to the gutted run and a different line to the
 * complete run at the same point of the same explanation. That difference is the whole
 * instrument.
 *
 * The explanations below are foreign. They are not the shipped fixtures. A test that reads a
 * fixture measures the fixture, and `src/fixtures/explanations.test.ts` already does that.
 */

import { describe, expect, test } from 'vitest'

import type { ModelHandle, Attribution } from './model.js'
import type { Explanation, Step } from './fixtures/explanations.js'
import {
  chosen,
  contentWords,
  falseHitCount,
  hitCount,
  holds,
  matches,
  measure,
  modelNameFrom,
  render,
  wordsIn,
  STOP_WORDS,
} from './discriminate.js'

/* ── the fake ────────────────────────────────────────────────────────────────────────────────── */

const lastThem = (prompt: string): string => {
  const said = prompt.split('\n').filter(line => line.startsWith('them: '))
  return said[said.length - 1]?.slice('them: '.length) ?? ''
}

/** A model that answers from the prompt. It never opens a socket and it never throws. */
const fake = (reply: (them: string, prompt: string) => string | null): ModelHandle => ({
  identify: async () => ({ model_id: 'fake', runtime: 'test', calibration: 'uncalibrated' }),
  ask: async (_system, user) => reply(lastThem(user), user),
  lastReason: () => 'the fake model gave no line',
})

const WHO: Attribution = { model_id: 'fake', runtime: 'test', calibration: 'uncalibrated' }

/* ── one foreign explanation with three steps ────────────────────────────────────────────────── */

const S1 = 'You flick the switch and the coil at the bottom heats up.'
const S2 = 'The metal passes its warmth into the liquid around it.'
const S3 = 'Once it is hot enough a strip bends and the switch pops back out.'

const KETTLE: Explanation = {
  topic: 'How a kettle boils',
  steps: [
    { id: 'k1', text: S1, keyWords: ['coil'] },
    { id: 'k2', text: S2, keyWords: ['warmth'] },
    { id: 'k3', text: S3, keyWords: ['pops'] },
  ],
}

const DULL = 'Okay and then what.'

/* ── the word check ──────────────────────────────────────────────────────────────────────────── */

describe('the word check', () => {
  test('a word matches in a different case', () => {
    expect(holds('Where does the Drag go', 'drag')).toBe(true)
    expect(holds('COIL', 'coil')).toBe(true)
  })

  test('a word matches with a trailing full stop or question mark', () => {
    expect(holds('It comes out as heat.', 'heat')).toBe(true)
    expect(holds('What heats the coil?', 'coil')).toBe(true)
    expect(holds('coil?', 'coil')).toBe(true)
  })

  test('a word does not match inside a longer word', () => {
    expect(holds('it gets hotter', 'hot')).toBe(false)
    expect(holds('the rims are metal', 'rim')).toBe(false)
  })

  test('a mark that is not a letter splits a line into whole words', () => {
    expect(wordsIn("Don't stop, say it again?")).toEqual(['don', 't', 'stop', 'say', 'it', 'again'])
  })

  test('matches returns every listed word the line holds, in the order of the list', () => {
    expect(matches('the rubber block hits the rim.', ['rubber', 'block', 'rim'])).toEqual([
      'rubber',
      'block',
      'rim',
    ])
    expect(matches('the rubber bit.', ['rubber', 'block', 'rim'])).toEqual(['rubber'])
  })
})

/* ── the content words ───────────────────────────────────────────────────────────────────────── */

describe('the content words', () => {
  const ordinary: Step = {
    id: 'p1',
    text: 'You press the button and a thing moves down.',
    keyWords: ['thing'],
  }
  const drum: Step = { id: 'p2', text: 'The drum spins after that.', keyWords: ['drum'] }

  test('the stop list drops an ordinary English word', () => {
    expect(STOP_WORDS.has('thing')).toBe(true)
    expect(contentWords({ topic: 'How a press works', steps: [drum] }, ordinary)).toEqual([])
  })

  test('a word that sits in a step that stays is not a content word', () => {
    const shared: Step = { id: 'p3', text: 'The drum takes the load.', keyWords: ['drum'] }
    expect(contentWords({ topic: 'How a press works', steps: [drum] }, shared)).toEqual([])
  })

  test('a word that sits in the topic is not a content word', () => {
    const step: Step = { id: 'p4', text: 'The press comes down hard.', keyWords: ['press'] }
    expect(contentWords({ topic: 'How a press works', steps: [drum] }, step)).toEqual([])
  })

  test('a word that sits nowhere else survives both filters', () => {
    expect(contentWords({ topic: 'How a press works', steps: [drum] }, {
      id: 'p5',
      text: 'A spring throws it back up.',
      keyWords: ['spring'],
    })).toEqual(['spring'])
  })
})

/* ── the two counts ──────────────────────────────────────────────────────────────────────────── */

describe('the two counts', () => {
  test('a hit is counted when the gutted line holds a key word of the removed step', async () => {
    const model = fake((them, prompt) =>
      them === S2 && !prompt.includes(S1) ? 'What heats the coil?' : DULL,
    )
    const report = await measure(KETTLE, model)

    expect(hitCount(report)).toBe(1)
    expect(falseHitCount(report)).toBe(0)
    expect(report.pairs.find(pair => pair.removed.id === 'k1')?.hits).toEqual(['coil'])
  })

  test('a hit is counted when the gutted line holds the word in upper case with a mark', async () => {
    const model = fake((them, prompt) =>
      them === S2 && !prompt.includes(S1) ? 'COIL? What is that.' : DULL,
    )
    expect(hitCount(await measure(KETTLE, model))).toBe(1)
  })

  test('a false hit is counted when the complete line holds a key word of the removed step', async () => {
    const model = fake((them, prompt) =>
      them === S2 && prompt.includes(S1) ? 'Say the coil bit again.' : DULL,
    )
    const report = await measure(KETTLE, model)

    expect(falseHitCount(report)).toBe(1)
    expect(hitCount(report)).toBe(0)
    expect(report.pairs.find(pair => pair.removed.id === 'k1')?.falseHits).toEqual(['coil'])
  })

  test('a child that says the word in both runs gives one hit and one false hit', async () => {
    const model = fake(them => (them === S2 ? 'What about the coil.' : DULL))
    const report = await measure(KETTLE, model)

    expect(hitCount(report)).toBe(1)
    expect(falseHitCount(report)).toBe(1)
  })

  test('a stop word in the child line is never counted as a hit', async () => {
    const ordinary: Explanation = {
      topic: 'How a press works',
      steps: [
        { id: 'p1', text: 'You press the button and a thing moves down.', keyWords: ['thing'] },
        { id: 'p2', text: 'The drum spins after that.', keyWords: ['drum'] },
      ],
    }
    const report = await measure(ordinary, fake(() => 'What thing moves down?'))

    expect(report.pairs).toHaveLength(1)
    expect(report.pairs[0]?.words).toEqual([])
    expect(hitCount(report)).toBe(0)
    expect(report.noContentWord).toBe(1)
  })
})

/* ── the shape of a report ───────────────────────────────────────────────────────────────────── */

describe('the report', () => {
  test('the last step of an explanation gives no pair and is counted', async () => {
    const report = await measure(KETTLE, fake(() => DULL))

    expect(report.pairs).toHaveLength(2)
    expect(report.pairs.map(pair => pair.removed.id)).toEqual(['k1', 'k2'])
    expect(report.noTurnAfter).toBe(1)
  })

  test('the call count holds the complete run and every gutted run', async () => {
    const report = await measure(KETTLE, fake(() => DULL))

    // three steps complete, then two gutted runs of two steps each.
    expect(report.calls).toBe(7)
  })
})

/* ── the silent model ────────────────────────────────────────────────────────────────────────── */

describe('the silent model', () => {
  test('a model that answers nothing is counted and never throws', async () => {
    const report = await measure(KETTLE, fake(() => null))

    expect(report.silent).toBe(7)
    expect(report.reasons).toEqual(['the fake model gave no line'])
    expect(hitCount(report)).toBe(0)
    expect(falseHitCount(report)).toBe(0)
  })

  test('a model that answers nothing still gives a pair for every testable step', async () => {
    const report = await measure(KETTLE, fake(() => null))

    expect(report.pairs).toHaveLength(2)
    expect(report.pairs.every(pair => pair.gutted.kind === 'silent')).toBe(true)
  })

  test('a model that goes silent for one turn only leaves the other turns intact', async () => {
    const model = fake((them, prompt) =>
      them === S2 && !prompt.includes(S1) ? null : 'What about the coil.',
    )
    const report = await measure(KETTLE, model)

    expect(report.silent).toBe(1)
    expect(hitCount(report)).toBe(0)
    expect(falseHitCount(report)).toBe(1)
  })
})

/* ── the screen ──────────────────────────────────────────────────────────────────────────────── */

describe('the screen', () => {
  test('the report holds no percent sign, no rate and no score', async () => {
    const model = fake((them, prompt) =>
      them === S2 && !prompt.includes(S1) ? 'What heats the coil?' : DULL,
    )
    const text = render([await measure(KETTLE, model)], WHO)

    expect(text).not.toContain('%')
    expect(text.toLowerCase()).not.toContain('rate')
    expect(text.toLowerCase()).not.toContain('score')
  })

  test('the report prints the hit count and the false hit count as separate lines', async () => {
    const model = fake((them, prompt) =>
      them === S2 && !prompt.includes(S1) ? 'What heats the coil?' : DULL,
    )
    const text = render([await measure(KETTLE, model)], WHO)

    expect(text).toMatch(/hits {2,}1/)
    expect(text).toMatch(/false hits {2,}0/)
  })

  test('the report prints the removed step and the child line for every hit', async () => {
    const model = fake((them, prompt) =>
      them === S2 && !prompt.includes(S1) ? 'What heats the coil?' : DULL,
    )
    const text = render([await measure(KETTLE, model)], WHO)

    expect(text).toContain(S1)
    expect(text).toContain('What heats the coil?')
  })

  test('the report states that the counts are not a measurement', async () => {
    const text = render([await measure(KETTLE, fake(() => DULL))], WHO)

    expect(text).toContain('not a measurement')
    expect(text).toContain('No figure on this')
  })
})

/* ── the command line ────────────────────────────────────────────────────────────────────────── */

describe('the command line', () => {
  test('the model flag beats the environment', () => {
    expect(modelNameFrom(['--model=one'], 'two')).toBe('one')
  })

  test('the environment gives the model name when no flag does', () => {
    expect(modelNameFrom(['Why the sky is blue'], 'two')).toBe('two')
  })

  test('no flag and no environment gives an empty model name', () => {
    expect(modelNameFrom([], undefined)).toBe('')
    expect(modelNameFrom([], '  ')).toBe('')
  })

  test('an empty topic argument selects every explanation', () => {
    expect(chosen([KETTLE], '')).toHaveLength(1)
  })

  test('a topic argument selects the explanations whose topic holds it', () => {
    expect(chosen([KETTLE], 'kettle').map(e => e.topic)).toEqual(['How a kettle boils'])
    expect(chosen([KETTLE], 'fridge')).toEqual([])
  })
})
