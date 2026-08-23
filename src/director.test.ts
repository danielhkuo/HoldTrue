/**
 * The tests for the director. Every test runs a pure function. No test needs a model. Rule 32.
 * No test judges a line. The tests check which word and which move the block names. Rule 33.
 */

import { describe, expect, test } from 'vitest'
import { debts, direct } from './director.js'
import { VOCABULARY, type Exchange, type Said } from './child.js'

const said = (line: string): Said => ({ kind: 'said', line })
const ex = (you: string, line: string): Exchange => ({ you, child: said(line), seconds: 0 })

describe('debts: the words the person said, and how often the child pressed each', () => {
  test('a content word the person said is a debt', () => {
    const d = debts([], 'the lever pulls the cable')
    expect(d.map(x => x.word)).toEqual(expect.arrayContaining(['lever', 'pulls', 'cable']))
  })

  test('a stop word is not a debt', () => {
    const d = debts([], 'the lever pulls the cable')
    expect(d.map(x => x.word)).not.toContain('the')
  })

  test('a debt records the turn where the person first said the word', () => {
    const history = [ex('the lever moves', 'What moves it?'), ex('the cable', 'What is it?')]
    const d = debts(history, 'the lever again')
    expect(d.find(x => x.word === 'lever')?.openedTurn).toBe(0)
    expect(d.find(x => x.word === 'cable')?.openedTurn).toBe(1)
  })

  test('a debt counts the child lines that hold the word', () => {
    const history = [
      ex('the pads squeeze', 'What do the pads do?'),
      ex('they grip', 'The pads grip what?'),
    ]
    const d = debts(history, 'the pads')
    expect(d.find(x => x.word === 'pads')?.pressed).toBe(2)
  })
})

describe('direct: the words pick the move', () => {
  test('the block carries the vocabulary rule', () => {
    expect(direct([], 'the lever pulls the cable')).toContain(VOCABULARY)
  })

  test('the block names a word the person said and the child never used', () => {
    const block = direct([], 'the lever pulls the cable')
    expect(block).toMatch(/"(lever|pulls|cable)"/)
  })

  test('a new word gets the cause move', () => {
    expect(direct([], 'the lever pulls the cable')).toContain('Ask what makes that happen')
  })

  test('a word pressed twice gets the word ban move', () => {
    const history = [
      ex('it is friction', 'What is friction doing?'),
      ex('friction just does it', 'What does friction do to the wheel?'),
    ]
    const block = direct(history, 'friction, like I said')
    expect(block).toContain('"friction"')
    expect(block).toContain('Say you do not know that word')
  })

  test('a word pressed three times is never named again', () => {
    const history = [
      ex('it is friction', 'What is friction doing?'),
      ex('friction just does it', 'What does friction do?'),
      ex('friction, like I said', 'Friction does what though?'),
    ]
    expect(direct(history, 'friction')).not.toContain('"friction"')
  })

  test('the oldest unpressed word outranks a newer one', () => {
    const history = [ex('the spring pushes', 'What pushes what?')]
    const block = direct(history, 'the cable goes tight')
    expect(block).toContain('"spring"')
  })

  test('a contradiction on one noun gets the contradiction move', () => {
    const history = [ex("the water can't get past the hump", 'What is the hump?')]
    const block = direct(history, 'then the water goes over the hump')
    expect(block).toContain('"water"')
    expect(block).toContain('do not agree')
  })

  test('a contradiction fires only on the turn that affirms it', () => {
    const history = [
      ex("the water can't get past the hump", 'What is the hump?'),
      ex('then the water goes over the hump', 'What makes it go over?'),
    ]
    const block = direct(history, 'the pads squeeze')
    expect(block).not.toContain('do not agree')
  })

  test('with no open debt the block carries the destination move', () => {
    const history = [ex('it is friction', 'What is friction?'), ex('friction', 'Friction how?'), ex('friction', 'What does friction do?')]
    const block = direct(history, 'friction')
    expect(block).toContain('Ask where a thing they mentioned goes')
  })

  test('the block text changes when the target word changes', () => {
    const a = direct([], 'the lever pulls')
    const b = direct([], 'the spring pushes')
    expect(a).not.toBe(b)
  })
})
