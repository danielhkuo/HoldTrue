/**
 * The tests for Session. They run the shipped end phase against a fake model handle.
 *
 * The fake answers from a script, so no test needs Ollama and no test needs a network. Rule 32
 * holds. No test judges a child line and no test judges a finding. Rule 33 holds.
 *
 * The tests run `openEnd` and `closeEnd`. The server calls these two functions, so a test here
 * covers the path that a user runs.
 *
 * Four tests carry the weight. The first says that a failed Check returns unavailable, and never
 * an empty reviewed. The second says that a Check with no chain returns unavailable. The third
 * says that a Close with no statement on any row returns unavailable. The fourth says that the
 * toggle sets the verified flag.
 */

import { describe, expect, test } from 'vitest'
import type { ModelHandle } from './model.js'
import { addTurn, closeEnd, openEnd, startSession } from './session.js'
import type { Pending, Session } from './session.js'
import type { Review } from './types.js'

// ── the fake model ───────────────────────────────────────────────────────────────────────────

/** A handle that answers from a script. It returns null when the script runs out. Rule 23. */
const fakeModel = (
  script: readonly (string | null)[],
  reason = 'the backend does not answer',
): { readonly handle: ModelHandle; readonly asked: readonly unknown[] } => {
  const asked: unknown[] = []
  const handle: ModelHandle = {
    identify: async () => ({ model_id: 'fake', runtime: 'test', calibration: 'uncalibrated' }),
    ask: async (system: string, user: string) => {
      const at = asked.length
      asked.push({ system, user })
      return at < script.length ? (script[at] ?? null) : null
    },
    lastReason: () => reason,
  }
  return { handle, asked }
}

// ── the transcript and the model answers ─────────────────────────────────────────────────────

/** Two user turns and one child turn. The quotes below come from the two user turns. */
const transcript = (): Session => {
  const one = startSession('How a fridge makes things cold', false)
  const two = addTurn(one, 'user', 'um, the compressor squishes the gas.')
  const three = addTurn(two, 'child', 'why does that make it hot?')
  return addTurn(three, 'user', 'the coils make the cold.')
}

const on = (session: Session): Session => ({ ...session, omniscient: true })

/** One false claim, one intrusion and one link that the user did not say. Diff gives three rows. */
const THREE_ROWS = JSON.stringify({
  mechanism: [
    {
      cause: 'the compressor',
      relation: 'compresses',
      effect: 'the gas',
      covered: true,
      quote: 'um, the compressor squishes the gas.',
    },
    {
      cause: 'compression',
      relation: 'raises',
      effect: 'the temperature',
      covered: false,
      quote: null,
    },
  ],
  claims: [{ text: 'the coils make the cold', correct: false, quote: 'the coils make the cold.' }],
  intrusions: [{ turnIndex: 1 }],
})

/** The same report, and the verdict for the probed row. */
const THREE_ROWS_SUPPLIED = JSON.stringify({
  ...(JSON.parse(THREE_ROWS) as Record<string, unknown>),
  supplied: true,
})

/** Every link covered, every claim correct, no intrusion. Diff gives no row. */
const NO_ROWS = JSON.stringify({
  mechanism: [
    {
      cause: 'the compressor',
      relation: 'compresses',
      effect: 'the gas',
      covered: true,
      quote: 'um, the compressor squishes the gas.',
    },
  ],
  claims: [{ text: 'the coils carry the heat', correct: true, quote: 'the coils make the cold.' }],
  intrusions: [],
})

/** Three empty lists. Check ran, and Check produced no chain at all. */
const NO_CHAIN = JSON.stringify({ mechanism: [], claims: [], intrusions: [] })

/** A question for the probed row. The row is a contradiction, so the leak guard does not apply. */
const QUESTION = 'What makes the coils cold?'

/** Three statements, one for each row of THREE_ROWS. */
const STATEMENTS = ['a statement', 'a second statement', 'a third statement']

const reason = (review: Review): string => {
  if (review.kind !== 'unavailable') throw new Error('the review must be unavailable')
  return review.reason
}

type Step = { readonly review: Review } | { readonly pending: Pending }

const pendingOf = (step: Step): Pending => {
  if (!('pending' in step)) throw new Error('the step must hold a pending probe')
  return step.pending
}

// ── the transcript ───────────────────────────────────────────────────────────────────────────

describe('addTurn', () => {
  test('addTurn marks the turn with the given speaker and numbers it by position', () => {
    const session = transcript()
    expect(session.turns.map(t => [t.speaker, t.index])).toEqual([
      ['user', 0],
      ['child', 1],
      ['user', 2],
    ])
  })

  test('addTurn keeps the text untouched and leaves the old session unchanged', () => {
    const before = startSession('Explaining', false)
    const after = addTurn(before, 'user', '  um, so the, uh, gas.  ')
    expect(after.turns[0]?.text).toBe('  um, so the, uh, gas.  ')
    expect(before.turns).toHaveLength(0)
  })

  test('startSession holds the topic, the toggle and no review', () => {
    expect(startSession('Explaining', true)).toEqual({
      turns: [],
      omniscient: true,
      topic: 'Explaining',
      review: null,
    })
  })
})

// ── the first half of the end phase ──────────────────────────────────────────────────────────

describe('openEnd', () => {
  test('a failed Check returns unavailable and never an empty reviewed', async () => {
    const model = fakeModel([null], 'the local backend does not run')
    const step = await openEnd(transcript(), model.handle)

    expect(step).not.toMatchObject({ review: { kind: 'reviewed', findings: [] } })
    expect('review' in step && reason(step.review)).toContain('the local backend does not run')
  })

  test('a Check that returns no chain returns unavailable and never an empty reviewed', async () => {
    const model = fakeModel([NO_CHAIN])
    const step = await openEnd(transcript(), model.handle)

    expect(step).not.toMatchObject({ review: { kind: 'reviewed', findings: [] } })
    expect('review' in step && reason(step.review)).toContain('returned no chain')
  })

  test('a chain with no gap returns reviewed with no findings', async () => {
    const model = fakeModel([NO_ROWS])
    const step = await openEnd(transcript(), model.handle)

    expect(step).toEqual({ review: { kind: 'reviewed', findings: [], verified: false } })
  })

  test('the probe takes the first row, and the pending probe holds that row id', async () => {
    const model = fakeModel([THREE_ROWS, QUESTION])
    const step = await openEnd(transcript(), model.handle)
    const wait = pendingOf(step)

    expect(wait.rowId).toBe('contradiction:C1')
    expect(wait.question).toBe(QUESTION)
    expect(wait.rows.map(row => row.id)).toEqual([
      'contradiction:C1',
      'intrusion:I1',
      'omission:L2',
    ])
  })

  test('a failed Probe still runs Close on every row', async () => {
    const model = fakeModel([THREE_ROWS, null, ...STATEMENTS])
    const step = await openEnd(transcript(), model.handle)

    expect(step).toMatchObject({ review: { kind: 'reviewed', verified: false } })
    if (!('review' in step) || step.review.kind !== 'reviewed') throw new Error('reviewed')
    expect(step.review.findings.map(f => f.row.id)).toEqual([
      'contradiction:C1',
      'intrusion:I1',
      'omission:L2',
    ])
  })

  test('a failed Probe and a failed Close return unavailable, not a list of marks', async () => {
    const model = fakeModel([THREE_ROWS, null], 'the provider refused the request for rate')
    const step = await openEnd(transcript(), model.handle)

    expect(step).not.toMatchObject({ review: { kind: 'reviewed' } })
    expect('review' in step && reason(step.review)).toContain(
      'the provider refused the request for rate',
    )
  })

  test('an empty transcript returns unavailable and makes no model call', async () => {
    const model = fakeModel([THREE_ROWS])
    const step = await openEnd(startSession('Explaining', false), model.handle)

    expect('review' in step && step.review.kind).toBe('unavailable')
    expect(model.asked).toHaveLength(0)
  })
})

// ── the second half of the end phase ─────────────────────────────────────────────────────────

describe('closeEnd', () => {
  const wait = async (
    model: ModelHandle,
    session: Session,
  ): Promise<{ readonly session: Session; readonly pending: Pending }> => ({
    session,
    pending: pendingOf(await openEnd(session, model)),
  })

  test('Close writes one finding for each row, in the order of the rows', async () => {
    const model = fakeModel([THREE_ROWS, QUESTION, THREE_ROWS_SUPPLIED, ...STATEMENTS])
    const held = await wait(model.handle, transcript())
    const review = await closeEnd(held.session, model.handle, held.pending, 'the gas gets hotter')

    if (review.kind !== 'reviewed') throw new Error('the review must be reviewed')
    expect(review.findings.map(f => f.row.id)).toEqual([
      'contradiction:C1',
      'intrusion:I1',
      'omission:L2',
    ])
    expect(review.findings.map(f => f.text)).toEqual(STATEMENTS)
  })

  test('no answer from the user skips the second Check and still closes every row', async () => {
    const model = fakeModel([THREE_ROWS, QUESTION, ...STATEMENTS])
    const held = await wait(model.handle, transcript())
    const review = await closeEnd(held.session, model.handle, held.pending, null)

    expect(review).toMatchObject({ kind: 'reviewed' })
    expect(model.asked).toHaveLength(5)
  })

  test('a Close with no statement on any row returns unavailable and names the reason', async () => {
    const model = fakeModel([THREE_ROWS, QUESTION, THREE_ROWS_SUPPLIED], 'the request timed out')
    const held = await wait(model.handle, transcript())
    const review = await closeEnd(held.session, model.handle, held.pending, 'the gas gets hotter')

    expect(review).not.toMatchObject({ kind: 'reviewed' })
    expect(reason(review)).toContain('the request timed out')
    expect(reason(review)).toContain('The startup model')
  })

  test('one row with a statement still returns reviewed', async () => {
    const model = fakeModel([THREE_ROWS, QUESTION, THREE_ROWS_SUPPLIED, 'a statement'])
    const held = await wait(model.handle, transcript())
    const review = await closeEnd(held.session, model.handle, held.pending, 'the gas gets hotter')

    expect(review).toMatchObject({ kind: 'reviewed' })
  })
})

// ── the omniscient toggle ────────────────────────────────────────────────────────────────────

describe('the omniscient toggle', () => {
  test('the toggle on sets the verified flag true on the review', async () => {
    const model = fakeModel([THREE_ROWS, null, ...STATEMENTS])
    const step = await openEnd(on(transcript()), model.handle)

    expect(step).toMatchObject({ review: { kind: 'reviewed', verified: true } })
  })

  test('the toggle off sets the verified flag false on the review', async () => {
    const model = fakeModel([THREE_ROWS, null, ...STATEMENTS])
    const step = await openEnd(transcript(), model.handle)

    expect(step).toMatchObject({ review: { kind: 'reviewed', verified: false } })
  })

  test('the toggle on names the provided model in a failure reason', async () => {
    const model = fakeModel([null], 'the provider rejected the key')
    const step = await openEnd(on(transcript()), model.handle)

    expect('review' in step && reason(step.review)).toContain('The provided model')
    expect('review' in step && reason(step.review)).toContain('the provider rejected the key')
  })

  test('the toggle off names the startup model in a failure reason', async () => {
    const model = fakeModel([null], 'the backend does not answer')
    const step = await openEnd(transcript(), model.handle)

    expect('review' in step && reason(step.review)).toContain('The startup model')
  })
})
