/**
 * The tests for the child.
 *
 * Every test below runs a pure function or a fake model. No test needs Ollama, a network or
 * Electron. See rule 32.
 *
 * These tests do not judge the child's line. No oracle exists for that. See rule 33. A model must
 * not judge the line either. A golden transcript is also not an oracle, because this runner is not
 * byte deterministic at temperature 0. See rule 34. Such a test fails for an unrelated reason.
 * Somebody then updates it until it asserts nothing.
 *
 * Two tests changed when the code changed. One asserted that the code keeps the first line only.
 * That behaviour is the defect of case B6. One asserted a cycle length of five. Both tests now
 * assert the corrected behaviour, and both carry a new name.
 *
 * No test below pins the size of the example bank. A count is a change detector and not a
 * requirement. No document asks for a bank of a fixed size. The tests read `EXAMPLES.length` and
 * `TOPICS` instead, so a new example and a new topic enter the checks with no edit here.
 */

import { describe, expect, test } from 'vitest'
import {
  EXAMPLES,
  dealt,
  examplesFor,
  systemFor,
  promptFor,
  speak,
  type Exchange,
  type Move,
  type Said,
} from './child.js'
import { TOPICS } from './topics.js'
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

const MOVES: readonly Move[] = ['cause', 'again', 'lost', 'stop']

/**
 * The subject words of one topic title. This serves case B3.
 *
 * The words come from `TOPICS` and never from a list in this file. A new topic in
 * `src/topics.ts` therefore enters the check with no edit here.
 *
 * The stop list holds function words and generic verbs only. It holds no subject. The stem
 * function removes a plural ending, so "flushes" and "wheels" match "flush" and "wheel".
 */
const STOP = new Set([
  'a', 'an', 'the', 'how', 'why', 'what', 'is', 'are', 'does', 'do', 'you', 'your', 'it', 'its',
  'and', 'or', 'of', 'on', 'in', 'to', 'make', 'thing', 'hard', 'change', 'work',
])

const stem = (word: string): string =>
  /(?:ss|sh|ch|x|z)es$/.test(word)
    ? word.slice(0, -2)
    : word.length > 3 && word.endsWith('s')
      ? word.slice(0, -1)
      : word

const wordsOf = (text: string): string[] =>
  (text.toLowerCase().match(/[a-z]+/g) ?? []).map(stem)

const subjectOf = (title: string): string[] =>
  [...new Set(wordsOf(title).filter(word => !STOP.has(word)))]

describe('the example bank rotates', () => {
  test('no two consecutive turns get the same examples', () => {
    for (let t = 0; t < EXAMPLES.length + 2; t++) {
      expect(examplesFor(t)).not.toBe(examplesFor(t + 1))
    }
  })

  test('every turn is dealt four distinct examples', () => {
    for (let t = 0; t < EXAMPLES.length; t++) {
      const pairs = examplesFor(t).split('\n\n')
      expect(pairs).toHaveLength(4)
      expect(new Set(pairs).size).toBe(4)
    }
  })

  test('the deal repeats after one pass through the bank, and not before', () => {
    // The deal is a window that moves by one place for each turn, so the cycle is the size of the
    // bank. The size comes from the bank itself. A test that named a number would only detect a
    // change to the bank, and no document requires a bank of a fixed size.
    expect(examplesFor(0)).toBe(examplesFor(EXAMPLES.length))
    for (let t = 1; t < EXAMPLES.length; t++) {
      expect(examplesFor(t)).not.toBe(examplesFor(0))
    }
  })
})

describe('the bank holds the four moves and nothing else', () => {
  test('every permitted move has at least one example', () => {
    // The count of the bank is not a requirement, so no assertion names one. What matters is that
    // the child sees each of its four moves shown. A move with no example is a move the prompt
    // names and never demonstrates, and rule 9 asks for the worked example.
    for (const move of MOVES) {
      expect(EXAMPLES.filter(e => e.move === move).length).toBeGreaterThan(0)
    }
  })

  test('every deal of four shows all four moves', () => {
    // The child sees every permitted move on every turn. A deal that dropped `stop` would leave
    // the child with no way to end, which is case E13a.
    for (let t = 0; t < EXAMPLES.length; t++) {
      expect(new Set(dealt(t).map(e => e.move))).toEqual(new Set(MOVES))
    }
  })

  test('a re-ask example shows the earlier question, and no other example does', () => {
    // "Ask again about the same step" has no meaning without the first ask.
    for (const e of EXAMPLES) {
      expect(e.before === undefined).toBe(e.move !== 'again')
    }
  })

  test('every topic in the list gives at least one subject word', () => {
    // The B3 check below reads these words. A title that gave none would pass that check for free.
    for (const topic of TOPICS) {
      expect(subjectOf(topic.title).length, `the title "${topic.title}" gives no subject word`)
        .toBeGreaterThan(0)
    }
  })

  test('no example holds half of the subject words of a topic the product offers', () => {
    // Case B3. A copied surface must be visibly off topic. Two old examples used a fridge
    // compressor and a toilet waste pipe, and both subjects matched a topic in the list.
    //
    // The old version of this test held its own list of ten words. That list missed two of the six
    // topics, so "Why the sky is blue" was unchecked, and a new topic was never noticed. This
    // version reads `TOPICS`, so the check follows the real list.
    //
    // The rule is a share of the title and not one word. One common noun is not a shared subject.
    // The bank holds one such word today: an example about a piston engine says "wheels", and the
    // topic "How a bike brake stops the wheel" gives four subject words. One word of four passes.
    // A title of two words fails on one match, so "sky", "toilet" or "fridge" fails at once.
    for (const [i, e] of EXAMPLES.entries()) {
      const bag = new Set(wordsOf(`${e.before ?? ''} ${e.them} ${e.you}`))
      for (const topic of TOPICS) {
        const subject = subjectOf(topic.title)
        const shared = subject.filter(word => bag.has(word))
        expect(
          shared.length * 2,
          `example ${i} shares ${shared.join(', ')} with the topic "${topic.title}"`,
        ).toBeLessThan(subject.length)
      }
    }
  })

  test('no reply in the bank claims that the child followed', () => {
    // A grep over a list of known tokens, and not a proof. Rule 3 forbids the move. An example of
    // the move would teach it, and an example outweighs a prohibition.
    const tokens = ['i get it', 'i understand', 'makes sense', 'got it', 'ohhh', 'oh okay']
    for (const e of EXAMPLES) {
      for (const token of tokens) expect(e.you.toLowerCase()).not.toContain(token)
    }
  })

  test('no reply in the bank builds a comparison with the word like', () => {
    // The same kind of grep. Rule 7 forbids an analogy. "like" is the surface form the transcripts
    // show for one, so the bank must not carry it in a reply.
    for (const e of EXAMPLES) expect(e.you.toLowerCase()).not.toMatch(/\blike\b/)
  })
})

describe('the prompt shows a voice rather than naming one', () => {
  /**
   * These assert the SHAPE that was measured, not the absence of a voice — you cannot grep for
   * "describes a voice", and an earlier version of this block pretended you could. It was two
   * string greps under a name claiming far more, which is the weak-oracle failure this repo
   * documents. Renamed and re-pointed at what actually failed.
   */
  const framingOf = (turn: number, topic = ''): string =>
    systemFor(turn, topic).split('Here is how you sound')[0]!

  test('it quotes none of the openers whose list caused the original collapse', () => {
    // The first prompt named the openers it wanted — wait, ohhh, how come, whoa — and six of six
    // lines came back opening "ohhh". Deleting them moved the collapse to "So"; forbidding "ohhh"
    // moved it to "whoa". A quoted opener list in the framing is the thing that must never return.
    const framing = framingOf(0).toLowerCase()
    for (const opener of ['ohhh', 'whoa', 'how come', 'wait,']) {
      expect(framing).not.toContain(opener)
    }
  })

  test('the framing prescribes no manner of speaking, by a grep over six known phrasings', () => {
    // The measured cause was a described voice, not a named opener. A grep cannot prove the
    // absence of a description. It can hold the line against the six phrasings that a rewrite
    // reaches for first.
    const framing = framingOf(0, 'How a hurricane forms').toLowerCase()
    for (const phrase of [
      'sound like',
      'like a kid',
      'like a child',
      'childlike',
      'simple words',
      'your voice',
    ]) {
      expect(framing).not.toContain(phrase)
    }
  })

  test('the system message shows every line of the four dealt examples', () => {
    // REPLACED, not deleted. The old test compared the character count of the example block with
    // the character count of the framing, under the name "the examples outweigh the framing".
    // A character count is not weight. A long framing that only lists the four moves passes
    // nothing worse than a short framing that describes a voice, and the count says the same for
    // both. The count also falls with the length of the topic title, which has no meaning here.
    //
    // The real property is that the sample reaches the model whole. The prompt shows examples
    // rather than a description, so a dropped or a cut example removes the thing that does the
    // work. This test reads the deal for the turn and finds each line in the system message.
    for (let t = 0; t < EXAMPLES.length; t++) {
      const system = systemFor(t, 'How a hurricane forms')
      const shown = system.split('Here is how you sound')[1]!.split('Do not reuse the words')[0]!
      for (const e of dealt(t)) {
        if (e.before !== undefined) expect(shown).toContain(`you: ${e.before}`)
        expect(shown).toContain(`them: ${e.them}`)
        expect(shown).toContain(`you: ${e.you}`)
      }
    }
  })

  test('it forbids the yes/no question that made the child useless', () => {
    expect(systemFor(0)).toContain('Never ask something they can answer with just')
  })

  test('the framing gives four moves and does not name the advance alone', () => {
    // "Make them keep explaining" named one move, so the child advanced every turn and never
    // stopped. These are cases E7b and E13a.
    const framing = framingOf(0)
    expect(framing).toContain('four moves and no others')
    expect(framing).toContain('ask them for the cause in the step you did not get')
    expect(framing).toContain('ask again about the same step you already asked about')
    expect(framing).toContain('say where you stopped following them')
    expect(framing).toContain('stop, when you have no question')
    expect(framing).not.toContain('keep explaining')
  })
})

describe('the topic reaches the model', () => {
  test('the system message names the topic', () => {
    // Case B7. The server held the topic and sent nothing, so turn one had no subject.
    expect(systemFor(0, 'How a hurricane forms')).toContain('How a hurricane forms')
  })

  test('the topic still reaches the model on a later turn', () => {
    expect(systemFor(7, 'How a hurricane forms')).toContain('How a hurricane forms')
  })

  test('speak sends the topic in the system message', async () => {
    const { handle, seen } = fake('ok')
    await speak([], 'the warm water goes up', handle, 'How a hurricane forms')
    expect(seen[0]!.system).toContain('How a hurricane forms')
  })

  test('a missing topic falls back to a phrase and never prints an empty subject', () => {
    expect(systemFor(0)).toContain('The subject is: how something works.')
    expect(systemFor(0, '   ')).toContain('The subject is: how something works.')
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
  test('a handle without lastReason still gives a silence and a stated reason', async () => {
    // KEPT ON PURPOSE, and the name now says what it covers. `lastReason` is optional in
    // `ModelHandle`, and `open` in `src/model.ts` always supplies it. So no shipped handle reaches
    // the string below. This test guards the optional field: it holds the fall back for a handle
    // that carries two methods only, which is the shape `model.ts` documents for a test. The
    // reason a real handle gives has its own test underneath this one.
    const { handle } = fake(null)
    expect(handle.lastReason).toBeUndefined()
    await expect(speak([], 'anything', handle)).resolves.toEqual({
      kind: 'silent',
      reason: 'no answer from the model',
    })
  })

  test('the silence carries the reason that the model layer gave', async () => {
    // Rule 25. A dead backend, a rejected key, a timeout and a wrong model name each reach the
    // screen with their own words. The old code printed one sentence for all four.
    const { handle } = fake(null)
    const withReason: ModelHandle = { ...handle, lastReason: () => 'the model name does not exist' }

    await expect(speak([], 'anything', withReason)).resolves.toEqual({
      kind: 'silent',
      reason: 'the model name does not exist',
    })
  })

  test('an empty answer is a silence', async () => {
    const { handle } = fake('   \n  \n ')
    const out = await speak([], 'anything', handle)
    expect(out.kind).toBe('silent')
  })

  test('a rambling answer is cut to two sentences', async () => {
    const { handle } = fake('Wait, where does it go?\n\nAlso I was wondering about the pipe.\nAnd more.')
    await expect(speak([], 'anything', handle)).resolves.toEqual({
      kind: 'said',
      line: 'Wait, where does it go? Also I was wondering about the pipe.',
    })
  })

  test('a two line answer keeps the question in the second line', async () => {
    // Case B6. The old code kept the first line only, so this answer arrived as "I don't get it."
    // and the question went missing.
    const { handle } = fake("I don't get it.\nWhat makes the gas get hot?")
    await expect(speak([], 'anything', handle)).resolves.toEqual({
      kind: 'said',
      line: "I don't get it. What makes the gas get hot?",
    })
  })

  test('a one sentence answer arrives whole, with no full stop added', async () => {
    const { handle } = fake('What makes it go faster up there')
    await expect(speak([], 'anything', handle)).resolves.toEqual({
      kind: 'said',
      line: 'What makes it go faster up there',
    })
  })

  test('a third sentence in the second line is cut', async () => {
    const { handle } = fake('Wait.\nWhy does it do that? Where does the heat go? And then what?')
    await expect(speak([], 'anything', handle)).resolves.toEqual({
      kind: 'said',
      line: 'Wait. Why does it do that?',
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
