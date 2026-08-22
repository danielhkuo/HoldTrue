/**
 * The tests for the explanation fixtures.
 *
 * These tests hold the fixtures to the one property the instrument cannot work without: a
 * `keyWord` of a step appears in no other step of the same explanation. The measurement counts a
 * child line that holds a content word of the removed step. If the word also sits in a step that
 * stays, the person says the word out loud in both runs, and the count then measures nothing.
 *
 * The uniqueness test compares lower case substrings and not whole words. A substring test is the
 * stronger test. It also rejects "rim" inside "rims" and "shift" inside "shifted".
 *
 * The second group holds `without` to its contract. It removes one step. It changes no other
 * text, no other id, no word list, the order and the topic.
 *
 * No model runs here. No network runs here. Rule 32 holds.
 */

import { describe, expect, test } from 'vitest'
import type { Explanation, Step } from './explanations.js'
import { EXPLANATIONS, without } from './explanations.js'

/** Every step paired with the explanation that holds it. */
const everyStep: readonly (readonly [Explanation, Step])[] = EXPLANATIONS.flatMap(e =>
  e.steps.map(s => [e, s] as const),
)

const holds = (text: string, word: string): boolean =>
  text.toLowerCase().includes(word.toLowerCase())

describe('the key words', () => {
  test('no key word of a step appears in any other step of the same explanation', () => {
    const collisions = everyStep.flatMap(([e, s]) =>
      s.keyWords.flatMap(word =>
        e.steps
          .filter(other => other.id !== s.id && holds(other.text, word))
          .map(other => `${e.topic}: "${word}" from ${s.id} also sits in ${other.id}`),
      ),
    )
    expect(collisions).toEqual([])
  })

  test('every key word appears in the text of its own step', () => {
    const absent = everyStep.flatMap(([e, s]) =>
      s.keyWords.filter(word => !holds(s.text, word)).map(word => `${e.topic}: ${s.id}: ${word}`),
    )
    expect(absent).toEqual([])
  })

  test('every step carries two to four key words', () => {
    const counts = everyStep.map(([, s]) => s.keyWords.length)
    expect(counts.every(n => n >= 2 && n <= 4)).toBe(true)
  })

  test('every step id is unique across all the explanations', () => {
    const ids = everyStep.map(([, s]) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  test('every explanation holds five to seven steps', () => {
    const counts = EXPLANATIONS.map(e => e.steps.length)
    expect(counts.every(n => n >= 5 && n <= 7)).toBe(true)
  })
})

describe('without', () => {
  test('it removes one step and keeps the count of the others', () => {
    for (const e of EXPLANATIONS) {
      for (const s of e.steps) {
        expect(without(e, s.id).steps.length).toBe(e.steps.length - 1)
      }
    }
  })

  test('it removes the step with the given id and no other id', () => {
    for (const e of EXPLANATIONS) {
      for (const s of e.steps) {
        const kept = without(e, s.id).steps.map(x => x.id)
        expect(kept).toEqual(e.steps.map(x => x.id).filter(id => id !== s.id))
      }
    }
  })

  test('it changes no text, no key word and no order in the steps it keeps', () => {
    for (const e of EXPLANATIONS) {
      for (const s of e.steps) {
        expect(without(e, s.id).steps).toEqual(e.steps.filter(x => x.id !== s.id))
      }
    }
  })

  test('it keeps the topic', () => {
    for (const e of EXPLANATIONS) {
      for (const s of e.steps) {
        expect(without(e, s.id).topic).toBe(e.topic)
      }
    }
  })

  test('it returns every step when no step holds the given id', () => {
    for (const e of EXPLANATIONS) {
      expect(without(e, 'no-such-step')).toEqual(e)
    }
  })

  test('it does not change the explanation it takes', () => {
    for (const e of EXPLANATIONS) {
      const before = structuredClone(e) as Explanation
      without(e, e.steps[0]!.id)
      expect(e).toEqual(before)
    }
  })
})
