/**
 * The tests for the director. Every test runs a pure function. No test needs a model. Rule 32.
 * No test judges a line. The tests check which word and which move the block names. Rule 33.
 */

import { describe, expect, test } from 'vitest'
import { debts, direct, WORDINGS } from './director.js'
import { VOCABULARY, type Exchange, type Said } from './child.js'

const said = (line: string): Said => ({ kind: 'said', line })
const ex = (you: string, line: string): Exchange => ({ you, child: said(line), seconds: 0 })

/** A `them:` line built only from stop words. */
const filler = ex('it is the', 'okay')

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
    const block = direct([], 'the lever pulls the cable')
    expect(block).toContain(WORDINGS.cause[0]!.replace('{W}', 'lever'))
    expect(block).toMatch(/missing piece|step behind it|no cause behind it/)
  })

  test('a word pressed twice gets the word ban move', () => {
    const history = [
      ex('it is friction', 'What is friction doing?'),
      ex('friction just does it', 'What does friction do to the wheel?'),
    ]
    const block = direct(history, 'friction, like I said')
    expect(block).toContain('"friction"')
    expect(block).toContain(WORDINGS.ban[history.length % 3]!.replace('{W}', 'friction'))
    expect(block).toMatch(/leaning on the word|doing all the work|standing in for the explanation/)
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
    expect(block).toContain(WORDINGS.destination[history.length % 3])
    expect(block).toMatch(/goes somewhere|what happens to it next|one step further/)
  })

  test('the block text changes when the target word changes', () => {
    const a = direct([], 'the lever pulls')
    const b = direct([], 'the spring pushes')
    expect(a).not.toBe(b)
  })
})

describe('direct: the confession move', () => {
  test('the confession rule outranks a debt that would otherwise fire the ban move', () => {
    const history = [
      ex('it is friction', 'What is friction doing?'),
      ex('friction just does it', 'What does friction do to the wheel?'),
    ]
    const block = direct(history, "I don't know")
    expect(block).toContain('They said they are not sure of that part')
    expect(block).not.toMatch(/"[a-z]+"/)
  })

  test.each([
    ["I'm not sure", true],
    ['I have no idea', true],
    ["I can't remember", true],
    ['the pressure pushes it', false],
  ])('%s: confession is %s', (line, expected) => {
    const fires = direct([], line).includes('They said they are not sure of that part')
    expect(fires).toBe(expected)
  })
})

describe('direct: the opener guard', () => {
  test('two child lines with the same first three words put the ban line in the block', () => {
    const history = [
      ex('the lever moves', 'What moves the lever next?'),
      ex('the cable pulls', 'What moves the cable next?'),
    ]
    const block = direct(history, 'the spring pushes')
    expect(block).toContain('Do not start with:')
  })

  test('the ban line quotes those three words', () => {
    const history = [
      ex('the lever moves', 'What moves the lever next?'),
      ex('the cable pulls', 'What moves the cable next?'),
    ]
    const block = direct(history, 'the spring pushes')
    expect(block).toContain('Do not start with: "what moves the".')
  })

  test('two child lines with different openers add no ban line', () => {
    const history = [
      ex('the lever moves', 'What moves the lever?'),
      ex('the cable pulls', 'Where does the cable go?'),
    ]
    const block = direct(history, 'the spring pushes')
    expect(block).not.toContain('Do not start with:')
  })

  test('a history with one child line adds no ban line', () => {
    const history = [ex('the lever moves', 'What moves the lever next?')]
    const block = direct(history, 'the spring pushes')
    expect(block).not.toContain('Do not start with:')
  })

  test('the guard reads the last two child lines only, an older repeat adds no ban line', () => {
    const history = [
      ex('the lever moves', 'What moves the lever next?'),
      ex('the lever moves', 'What moves the lever again?'),
      ex('the cable pulls', 'Where does the cable go?'),
    ]
    const block = direct(history, 'the spring pushes')
    expect(block).not.toContain('Do not start with:')
  })

  test('the ban line still appears when the last exchange is silent and the two most recent said lines share an opener', () => {
    const history: Exchange[] = [
      ex('the lever moves', 'What moves the lever next?'),
      ex('the cable pulls', 'What moves the cable next?'),
      { you: 'the spring pushes', child: { kind: 'silent', reason: 'the model said nothing' }, seconds: 0 },
    ]
    const block = direct(history, 'the spring pushes again')
    expect(block).toContain('Do not start with: "what moves the".')
  })
})

describe('direct: the subject line', () => {
  const topic = 'How a bicycle brake stops the wheel'

  test('with a topic, the block holds the subject sentence immediately before the vocabulary sentence', () => {
    const block = direct([], 'the lever pulls the cable', topic)
    expect(block).toContain(
      `The subject is ${topic}. Ask about the machine, not about them. ${VOCABULARY}`,
    )
  })

  test('with an empty topic the block is unchanged from the two-argument call, and names no subject', () => {
    const block = direct([], 'the lever pulls the cable', '')
    expect(block).toBe(direct([], 'the lever pulls the cable'))
    expect(block).not.toContain('The subject is')
  })

  test('the subject sentence appears on the cause move', () => {
    const block = direct([], 'the lever pulls the cable', topic)
    expect(block).toContain(`The subject is ${topic}.`)
    expect(block).toContain(WORDINGS.cause[0]!.replace('{W}', 'lever'))
  })

  test('the subject sentence appears on the confession move', () => {
    const block = direct([], "I don't know", topic)
    expect(block).toContain(`The subject is ${topic}.`)
    expect(block).toContain('They said they are not sure of that part')
  })

  test('the subject sentence and the opener ban fire together, in order: subject, then vocabulary, then the ban line last', () => {
    const history = [
      ex('the lever moves', 'What moves the lever next?'),
      ex('the cable pulls', 'What moves the cable next?'),
    ]
    const block = direct(history, 'the spring pushes', topic)
    const subjectIndex = block.indexOf(`The subject is ${topic}.`)
    const vocabIndex = block.indexOf(VOCABULARY)
    const banIndex = block.indexOf('Do not start with:')
    expect(subjectIndex).toBeGreaterThan(-1)
    expect(vocabIndex).toBeGreaterThan(subjectIndex)
    expect(banIndex).toBeGreaterThan(vocabIndex)
    expect(block.slice(banIndex)).toBe('Do not start with: "what moves the".]')
  })
})

describe('direct: the wordings rotate by history.length % 3', () => {
  test('the cause block at three consecutive turn indexes carries three different wordings', () => {
    const b0 = direct([], 'the lever pulls')
    const b1 = direct([filler], 'the lever pulls')
    const b2 = direct([filler, filler], 'the lever pulls')
    expect(new Set([b0, b1, b2]).size).toBe(3)
  })

  test('the dealt wording matches the exported constant at index history.length % 3', () => {
    const histories = [[], [filler], [filler, filler]]
    histories.forEach((history, index) => {
      const block = direct(history, 'the lever pulls')
      expect(block).toContain(WORDINGS.cause[index]!.replace('{W}', 'lever'))
    })
  })

  test('no wording contains a question mark', () => {
    const all = [...WORDINGS.cause, ...WORDINGS.ban, ...WORDINGS.destination]
    for (const wording of all) expect(wording).not.toContain('?')
  })
})
