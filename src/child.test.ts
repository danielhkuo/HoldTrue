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
 * The tests for the four move list are gone. The prompt no longer holds that list. Measured result
 * 7 in `src/child.ts` gives the reason: a labelled move becomes a template.
 *
 * One test pins the bank at six examples. An earlier version of this file refused to count the
 * bank, because a count is a change detector. The count is now a requirement. The six examples are
 * a designed set, and each one shows a different shape. A seventh example changes the design, so
 * the count must fail until somebody reads the design again.
 *
 * The check for case B3 still reads `TOPICS` and never a list in this file. A new topic in
 * `src/topics.ts` therefore enters the check with no edit here.
 */

import { describe, expect, test } from 'vitest'
import {
  EXAMPLES,
  dealt,
  examplesFor,
  lateBlock,
  systemFor,
  promptFor,
  speak,
  type Example,
  type Exchange,
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

/** The vocabulary rule, as the late block must carry it. */
const VOCABULARY =
  'Do not use a technical or subject-specific word they have not used. Ordinary everyday words are fine.'

const repliesOf = (e: Example): string[] =>
  e.lines.filter(l => l.who === 'you').map(l => l.text)

const REPLIES = EXAMPLES.flatMap(repliesOf)

const lastSentence = (text: string): string =>
  (text.match(/[^.!?]+[.!?]*/g) ?? [text]).at(-1)!.trim()

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
      const shown = examplesFor(t).split('\n\n')
      expect(shown).toHaveLength(4)
      expect(new Set(shown).size).toBe(4)
    }
  })

  test('the deal repeats after one pass through the bank, and not before', () => {
    // The deal is a window that moves by one place for each turn, so the cycle is the size of the
    // bank. The size comes from the bank itself.
    expect(examplesFor(0)).toBe(examplesFor(EXAMPLES.length))
    for (let t = 1; t < EXAMPLES.length; t++) {
      expect(examplesFor(t)).not.toBe(examplesFor(0))
    }
  })
})

describe('the bank holds six shapes and no forbidden move', () => {
  test('the bank holds six examples', () => {
    // The count is a requirement here, and not a change detector. The six examples are a designed
    // set. Read the bank comment in `src/child.ts` before you add a seventh.
    expect(EXAMPLES).toHaveLength(6)
  })

  test('one example holds four lines, and every other example holds two', () => {
    // The four line example asks a second time about the same step. It is the only example that
    // refuses to move on. An earlier bank showed one ask and one advance, and the child copied
    // that habit. See rule 6 and case E10.
    const long = EXAMPLES.filter(e => e.lines.length === 4)
    expect(long).toHaveLength(1)
    for (const e of EXAMPLES) expect([2, 4]).toContain(e.lines.length)
    expect(repliesOf(long[0]!)).toHaveLength(2)
  })

  test('every example starts with the adult and then takes turns', () => {
    for (const [i, e] of EXAMPLES.entries()) {
      expect(e.lines.map(l => l.who), `example ${i}`).toEqual(
        e.lines.map((_, n) => (n % 2 === 0 ? 'them' : 'you')),
      )
    }
  })

  test('at least four replies end with a question mark', () => {
    // The line goes to a speech engine later. Most engines raise the pitch for a question mark. A
    // question written with a full stop sounds flat. This test stops a later edit from flattening
    // the whole bank back to full stops. It does not forbid the flat line: the bank keeps exactly
    // one, because real speakers ask without the rise. See the punctuation paragraph in the header.
    expect(REPLIES.filter(r => r.endsWith('?')).length).toBeGreaterThanOrEqual(4)
  })

  test('the bank keeps a reply that ends with a full stop', () => {
    // A bank of one punctuation mark teaches one intonation.
    expect(REPLIES.filter(r => r.endsWith('.')).length).toBeGreaterThan(0)
  })

  test('every topic in the list gives at least one subject word', () => {
    // The B3 check below reads these words. A title that gave none would pass that check for free.
    for (const topic of TOPICS) {
      expect(subjectOf(topic.title).length, `the title "${topic.title}" gives no subject word`)
        .toBeGreaterThan(0)
    }
  })

  test('no example shares two subject words with a topic the product offers', () => {
    // Case B3. A copied surface must be visibly off topic. Two old examples used a fridge
    // compressor and a toilet waste pipe, and both subjects matched a topic in the list.
    //
    // The words come from `TOPICS`, so a new topic enters the check with no edit here.
    //
    // THE THRESHOLD CHANGED WITH THIS BANK, and the reason must stay visible. The old test failed
    // an example that shared half of a title. Every title here holds two subject words, so the old
    // rule failed one shared word. The new bank says "You put the bread in and push the lever
    // down", which is a toaster, and the list offers "How bread rises", which is yeast. One noun
    // is not a shared subject. The rule is now two words, and one word for a title that holds one.
    // A shared "toilet flush", "sky blue" or "fridge cold" still fails.
    for (const [i, e] of EXAMPLES.entries()) {
      const bag = new Set(wordsOf(e.lines.map(l => l.text).join(' ')))
      for (const topic of TOPICS) {
        const subject = subjectOf(topic.title)
        const shared = subject.filter(word => bag.has(word))
        expect(
          shared.length,
          `example ${i} shares ${shared.join(', ')} with the topic "${topic.title}"`,
        ).toBeLessThan(Math.min(2, subject.length))
      }
    }
  })

  test('no reply in the bank claims that the child followed', () => {
    // A grep over a list of known tokens, and not a proof. Rule 3 forbids the move. An example of
    // the move would teach it, and an example outweighs a prohibition.
    const tokens = ['i get it', 'i understand', 'makes sense', 'got it', 'ohhh', 'oh okay']
    for (const reply of REPLIES) {
      for (const token of tokens) expect(reply.toLowerCase()).not.toContain(token)
    }
  })

  test('no reply in the bank builds a comparison with the word like', () => {
    // The same kind of grep. Rule 7 forbids an analogy. "like" is the surface form the transcripts
    // show for one, so the bank must not carry it in a reply.
    for (const reply of REPLIES) expect(reply.toLowerCase()).not.toMatch(/\blike\b/)
  })

  test('every reply ends on a question or a request, by a grep over the last sentence', () => {
    // Rule 4 forbids a reply that says the user's mechanism back as a statement. You answer such a
    // line with "yeah exactly", and your production stops. A grep cannot prove the absence of a
    // restatement. It can hold the shape that a restatement breaks: the reply ends by asking.
    //
    // Two replies in the bank quote the user first. "You said it holds the lever" and "Before you
    // said it can't get past" are both a location and a challenge, and each one ends on a
    // question. This test reads the LAST sentence, so a reply that asks and then explains fails.
    for (const reply of REPLIES) {
      const last = lastSentence(reply).toLowerCase()
      expect(
        /^(say|tell)\b/.test(last) || /\b(what|where|which|how|why|who)\b/.test(last),
        `the reply "${reply}" does not end by asking`,
      ).toBe(true)
    }
  })
})

describe('the late block gives one required move for each turn', () => {
  test('the block cycles with a period of three', () => {
    for (let t = 0; t < 12; t++) expect(lateBlock(t)).toBe(lateBlock(t % 3))
    expect(lateBlock(3)).toBe(lateBlock(0))
  })

  test('all three moves appear, and no two are the same', () => {
    // Measured result 8. Every design the owner tested locked into one sentence frame by turn
    // three. A scheduler that gave the same move every turn would be no remedy.
    const blocks = [lateBlock(0), lateBlock(1), lateBlock(2)]
    expect(new Set(blocks).size).toBe(3)
    expect(blocks[0]).toContain('what makes the last thing they said happen')
    expect(blocks[1]).toContain('where a thing they mentioned goes')
    expect(blocks[2]).toContain('ask for that part again without it')
  })

  test('every block is one bracketed instruction', () => {
    for (let t = 0; t < 3; t++) {
      const block = lateBlock(t)
      expect(block.startsWith('[')).toBe(true)
      expect(block.endsWith(']')).toBe(true)
      expect(block.slice(1, -1)).not.toContain('[')
      expect(block).not.toContain('\n')
    }
  })

  test('every block carries the vocabulary sentence', () => {
    for (let t = 0; t < 6; t++) expect(lateBlock(t)).toContain(VOCABULARY)
  })

  test('the vocabulary sentence names technical words and never forbids ordinary ones', () => {
    // The rule holds SUBJECT TERMINOLOGY ONLY. "Use only words they have used" forbids ordinary
    // English, and the child then cannot make a sentence. That version must never return.
    for (let t = 0; t < 3; t++) {
      const block = lateBlock(t).toLowerCase()
      expect(block).toContain('technical or subject-specific word they have not used')
      expect(block).toContain('ordinary everyday words are fine')
      for (const wrong of ['only words they', 'only the words they', 'only use words']) {
        expect(block).not.toContain(wrong)
      }
      expect(block).not.toMatch(/only[^.]*words they have used/)
    }
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

  test('the system message holds no bullet list', () => {
    // Measured result 7. The framing listed four permitted moves as bullets. The bullet "say where
    // you stopped following them" came back as "I stopped following at the <X> part" for six turns
    // together. A labelled move hands the model a sentence to copy.
    for (const line of systemFor(0, 'How a hurricane forms').split('\n')) {
      expect(line.trimStart(), `this line is a bullet: ${line}`).not.toMatch(/^[-*•]\s/)
    }
  })

  test('the system message names no move', () => {
    // The same result, by a grep over the four moves the old framing named. The move for the turn
    // arrives from `lateBlock`, at the end of the user message.
    const system = systemFor(0, 'How a hurricane forms').toLowerCase()
    for (const named of [
      'four moves',
      'moves and no others',
      'ask them for the cause',
      'say where you stopped following',
      'ask again about the same step',
      'when you have no question',
      'keep explaining',
    ]) {
      expect(system).not.toContain(named)
    }
  })

  test('the system message shows every line of the four dealt examples', () => {
    // REPLACED, not deleted. The old test compared the character count of the example block with
    // the character count of the framing, under the name "the examples outweigh the framing".
    // A character count is not weight.
    //
    // The real property is that the sample reaches the model whole. The prompt shows examples
    // rather than a description, so a dropped or a cut example removes the thing that does the
    // work. This test reads the deal for the turn and finds each line in the system message.
    for (let t = 0; t < EXAMPLES.length; t++) {
      const system = systemFor(t, 'How a hurricane forms')
      const shown = system.split('Here is how you sound')[1]!.split('Do not reuse the words')[0]!
      for (const e of dealt(t)) {
        for (const line of e.lines) expect(shown).toContain(`${line.who}: ${line.text}`)
      }
    }
  })

  test('it forbids the yes/no question that made the child useless', () => {
    expect(systemFor(0)).toContain('Never ask something they can answer with just')
  })

  test('it says the child has read nothing and cannot look anything up', () => {
    // Rule 2 and M3. The child must not repair the explanation with its own knowledge.
    const framing = framingOf(0, 'How a hurricane forms')
    expect(framing).toContain('You have read nothing about this.')
    expect(framing).toContain('You cannot look anything up.')
    expect(framing).toContain('what this person has said here')
  })

  test('it gives one fallback line for the turn with nothing to ask', () => {
    // The framing names no stop move now, so this line carries the case. It is one fixed sentence,
    // and result 7 says a fixed sentence gets copied. Count how often the child says it.
    expect(systemFor(0)).toContain(
      `When you have nothing to ask about what they just said, say exactly:\n"I'm not sure I follow that. Can you say it a different way."`,
    )
  })

  test('the framing still asks for two sentences at most', () => {
    expect(systemFor(0)).toContain('never more than two sentences')
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

describe('the required move arrives late in the context', () => {
  test('the late block comes after the last thing the user said', () => {
    // Result 9. A model drifts to the frame of the other party inside about eight rounds, and
    // attention over a long context has a U shape. The system message is then in the dead middle.
    // The block must sit after the script. The position is the change.
    const history = [ex('first', 'What holds it down?'), ex('second', 'Where does it go?')]
    const prompt = promptFor(history, 'the last thing I said')
    const block = lateBlock(history.length)
    expect(prompt).toContain(block)
    expect(prompt.indexOf(block)).toBeGreaterThan(prompt.indexOf('them: the last thing I said'))
    expect(prompt.indexOf(block)).toBeGreaterThan(prompt.indexOf('you: Where does it go?'))
  })

  test('the late block is the last thing before the empty completion line', () => {
    const prompt = promptFor([], 'anything')
    const block = lateBlock(0)
    expect(prompt.slice(prompt.indexOf(block) + block.length)).toBe('\n\nyou:')
  })

  test('the block changes with the turn, so no two turns in a row require the same move', () => {
    const history: Exchange[] = []
    for (let t = 0; t < 4; t++) {
      const here = promptFor(history, 'x')
      history.push(ex('x', 'What holds it down?'))
      const next = promptFor(history, 'x')
      expect(here).not.toBe(next)
    }
  })

  test('speak sends the block for the turn the history counts', async () => {
    const { handle, seen } = fake('ok')
    await speak([], 'first', handle)
    await speak([ex('first', 'ok')], 'second', handle)
    await speak([ex('first', 'ok'), ex('second', 'ok')], 'third', handle)
    expect(seen[0]!.user).toContain(lateBlock(0))
    expect(seen[1]!.user).toContain(lateBlock(1))
    expect(seen[2]!.user).toContain(lateBlock(2))
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
