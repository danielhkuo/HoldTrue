import { describe, expect, test } from 'vitest'
import { createHash } from 'node:crypto'
import fc from 'fast-check'
import { createAnchor, resolveAnchor, type Doc } from '../index/anchor.js'
import { normalise } from './normalise.js'
import { validate, type Link, type Sentence } from './validate.js'

// ---------------------------------------------------------------------------
// Fixtures. Agent-written per AGENTS.md "Who writes what": setup, teardown and fixtures
// are mine, assertions and the domain examples are not.
//
// doc_id is the content hash, exactly as in src/index/anchor.test.ts, because a doc_id
// names a *version* of a document rather than a file.
// ---------------------------------------------------------------------------

const makeDoc = (text: string): Doc => ({
  doc_id: createHash('sha256').update(text, 'utf8').digest('hex').slice(0, 16),
  unit_id: 'u0',
  text,
})

/**
 * A transcript with one sentence sitting inside it.
 *
 * `before` is what makes this fixture worth having. extract.md section 2 says a
 * `Sentence`'s anchor resolves against the *full transcript*, so a sentence that does not
 * start at offset 0 is the ordinary case and offset 0 is the special one. Every anchor
 * `validate` mints is therefore in transcript coordinates, and a fixture that always puts
 * the sentence at 0 cannot tell transcript coordinates from sentence-local ones.
 */
const transcript = (
  sentenceText: string,
  { before = '', after = '' }: { before?: string; after?: string } = {},
): { doc: Doc; sentence: Sentence } => {
  const doc = makeDoc(before + sentenceText + after)
  const anchor = createAnchor(doc, before.length, before.length + sentenceText.length)
  if (anchor === null) throw new Error(`fixture is unanchorable: ${JSON.stringify(sentenceText)}`)
  return { doc, sentence: { anchor, dropped: 0 } }
}

/** Ruling 2's closed set, written out so an out-of-set relation is a test failure. */
const RELATION_SET: readonly string[] = ['causes', 'enables', 'prevents', 'requires']

/**
 * The human's invariant, applied to whatever came back. Used by the property below and by
 * every regression case that is waiting on a ruling — where two answers are both
 * defensible, this is the part that is settled, and it is all such a case asserts.
 *
 * `offered` is every phrase the model actually named in this payload. Pairing a returned
 * link back to the entry it came from is not possible in general (duplicates, reordering,
 * a wrapper shape), so containment is checked against the set.
 *
 * One hole in it, and it is the human's hole rather than an encoding mistake: a phrase that
 * normalises to the empty string is contained in every span, so a call that offers one
 * satisfies the containment half vacuously. That is reviewer finding 6/22, recorded below.
 */
const holdsTheInvariant = (
  doc: Doc,
  sentence: Sentence,
  links: readonly Link[],
  offered: readonly string[],
): void => {
  const offeredNormalised = offered.map(phrase => normalise(phrase).text)

  for (const link of links) {
    expect(RELATION_SET).toContain(link.relation)

    for (const anchor of [link.cause, link.effect, link.sentence]) {
      const span = resolveAnchor(doc, anchor)
      expect(span).not.toBeNull()
      expect(span!.start).toBeGreaterThanOrEqual(sentence.anchor.char_start)
      expect(span!.end).toBeLessThanOrEqual(sentence.anchor.char_end)
    }

    for (const anchor of [link.cause, link.effect]) {
      const quote = normalise(anchor.quote).text
      const contained = offeredNormalised.some(phrase => quote.includes(phrase))
      // Not `expect(bool).toBe(true)`: a bare boolean assertion is banned (AGENTS.md,
      // Testing) and prints nothing useful. This says the same thing and prints the quote.
      expect(
        contained
          ? 'the quote contains a phrase the model named'
          : `quote ${JSON.stringify(quote)} contains none of ${JSON.stringify(offeredNormalised)}`,
      ).toBe('the quote contains a phrase the model named')
    }
  }
}

// ===========================================================================
// THE ORACLE — human-authored, written by the owner on 2026-08-10 and transcribed into
// docs/specs/extract.md section 6. Examples 1, 2 and 3 are his; example 4 is agent-proposed
// and was settled by him the same day.
//
// His statement of what correct means, verbatim:
//
//   "A link survives `validate` when the model's cause and effect both appear in the
//    sentence once filled pauses and stammers are ignored, and the anchor it gets points
//    at the raw words the speaker actually said."
//
// Do not edit these assertions. If one cannot be made to pass, say why. In particular, do
// not soften example 2: the first-occurrence rule is recorded as a known defect on purpose,
// and the mitigation is in the prompt rather than here.
//
// One fixture note, because it is a fixture decision and not an assertion. Examples 1 and 3
// state a sentence fragment with no effect side in it, and a `Link` needs both sides to
// anchor. The surrounding words are mine; the sentence each example names is untouched, and
// so is what it asserts.
// ===========================================================================

describe('the oracle', () => {
  // 1. "A filled pause inside a match." The speaker said "push the uh handle down". The
  //    model returns "push the handle down". This is a match — filler words and
  //    disfluencies are filtered before comparing. The anchor spans the raw text, so its
  //    quote is "push the uh handle down", including the uh. The comparison is normalised;
  //    the anchor never is.
  test('a filled pause inside a match', () => {
    const { doc, sentence } = transcript('when you push the uh handle down the water flows out')

    const { links } = validate(sentence, [
      { cause: 'push the handle down', effect: 'the water flows out', relation: 'causes' },
    ])

    expect(links).toHaveLength(1)
    expect(links[0]!.cause.quote).toBe('push the uh handle down')
    expect(resolveAnchor(doc, links[0]!.cause)).toEqual({
      start: doc.text.indexOf('push the uh handle down'),
      end: doc.text.indexOf('push the uh handle down') + 'push the uh handle down'.length,
    })
  })

  // 2. "A phrase that appears twice." The sentence is "the water flowing downstream moves
  //    the waterwheel and that moves the water inside the building". The model returns
  //    "the water". The anchor points at the FIRST occurrence.
  //
  //    "This is a known defect, recorded as one." In that sentence the two occurrences are
  //    different things, so the first is the wrong one. It is accepted because refusing
  //    every ambiguous match adds to Extract's dominant failure — 35.70% missed relations
  //    against 0.31% false positives — and a refused link is lost permanently where a
  //    mis-anchored one costs a slightly wrong quote.
  test('a phrase that appears twice anchors at the first occurrence', () => {
    const text =
      'the water flowing downstream moves the waterwheel and that moves the water inside the building'
    const { doc, sentence } = transcript(text)

    const { links } = validate(sentence, [
      { cause: 'the water', effect: 'the waterwheel', relation: 'causes' },
    ])

    expect(links).toHaveLength(1)
    expect(links[0]!.cause.quote).toBe('the water')
    expect(links[0]!.cause.char_start).toBe(doc.text.indexOf('the water'))
  })

  // 3. "A paraphrase." The sentence is "when you push the handle down". The model returns
  //    "pressing the lever". Same meaning, not the speaker's words, nowhere to anchor.
  //    Dropped.
  test('a paraphrase is dropped', () => {
    const { sentence } = transcript('when you push the handle down')

    const { links } = validate(sentence, [
      { cause: 'pressing the lever', effect: 'push the handle down', relation: 'causes' },
    ])

    expect(links).toEqual([])
  })

  // 4. "A mixed list." The model returns six links for one sentence; three anchor cleanly
  //    and three are paraphrases. "The three good ones are kept, the three unanchorable
  //    ones are dropped, and `sentence.dropped` is 3." The whole sentence is not discarded
  //    — that would add to the dominant failure — but the loss is recorded against that
  //    sentence so the child can ask about it.
  //
  //    The third of those three clauses cannot be asserted here. `validate` returns
  //    `readonly Link[]` and has no channel for a dropped count, so "sentence.dropped is 3"
  //    is a fact about `extract`, which must either re-parse `raw` itself or be told. That
  //    is a signature-level gap, not an implementation one; see the regression case for
  //    reviewer finding 18.
  test('a mixed list keeps the good links and drops the rest', () => {
    const text =
      'when you push the uh handle down the water flows out and the tank fills so the pump stops'
    const { doc, sentence } = transcript(text)

    const { links } = validate(sentence, [
      { cause: 'push the handle down', effect: 'the water flows out', relation: 'causes' },
      { cause: 'pressing the lever', effect: 'the water flows out', relation: 'causes' },
      { cause: 'the water flows out', effect: 'the tank fills', relation: 'causes' },
      { cause: 'the reservoir fills', effect: 'the pump stops', relation: 'causes' },
      { cause: 'the tank fills', effect: 'the pump stops', relation: 'causes' },
      { cause: 'squeezing the trigger', effect: 'the pump stops', relation: 'causes' },
    ])

    expect(links).toHaveLength(3)
    // Sorted, because the order links come back in is not something section 6 rules on.
    expect(links.map(link => link.cause.quote).sort()).toEqual(
      ['push the uh handle down', 'the tank fills', 'the water flows out'].sort(),
    )
    for (const link of links) {
      expect(resolveAnchor(doc, link.cause)).not.toBeNull()
      expect(resolveAnchor(doc, link.effect)).not.toBeNull()
    }
  })
})

// ===========================================================================
// THE GENERATOR — agent-written. docs/workflow.md step 5: "Read the generator, not the
// assertion." Every arbitrary is named so the self-check at the bottom can count it.
//
// What extract.md section 6 demands of it, verbatim: "Sentences carrying filled pauses
// inside a candidate span; stammer repeats inside a candidate span; a phrase repeated two
// and three times in one sentence; model output that is a paraphrase, that is valid JSON of
// the wrong shape, that is not JSON at all, that names a relation outside the closed set,
// that returns an empty string, and that returns a mixed list of good and bad links. Sample
// it and assert the category counts before trusting a green run — degrading one generator
// to plain ASCII once left every property green at a mutation score of 100%."
//
// Everything past that list comes from the three reviewers who attacked the oracle's
// coverage. The finding number is on each arbitrary.
// ===========================================================================

/** A clause of raw speech, and the phrase a model would name for it. */
type Clause = { readonly raw: string; readonly phrase: string }
const clause = (raw: string, phrase: string = raw): Clause => ({ raw, phrase })

const plainClause = fc.constantFrom(
  clause('the pressure drops'),
  clause('the valve opens'),
  clause('the water flows out'),
  clause('the tank fills'),
  clause('the shaft turns'),
)

/** Oracle example 1, plus the boundary positions it never puts a filler in (22, 35, 44). */
const filledPauseClause = fc.constantFrom(
  clause('push the uh handle down', 'push the handle down'),
  clause('the pressure uh drops', 'the pressure drops'),
  clause('uh the pressure drops', 'the pressure drops'),
  clause('the valve opens uh', 'the valve opens'),
  clause('um', 'um'),
  clause('uh like you know', 'you know'),
)

/** Finding 34/36: the modal filler shape in the corpus is bracketed by commas, not spaces. */
const commaFillerClause = fc.constantFrom(
  clause('it starts with, um, evaporation', 'it starts with evaporation'),
  clause('the valve opens, uh, and the water flows out', 'the valve opens'),
  clause('and, uh, that rising air is really important', 'that rising air is really important'),
  clause('the, um, the pressure builds', 'the pressure builds'),
)

/** Section 6 names "collapse it's it's"; findings 8, 39, 46 and 47 name the rest. */
const stammerClause = fc.constantFrom(
  clause("it's it's the pressure that opens the valve", 'opens the valve'),
  clause("it's it's the pressure", "it's the pressure"),
  clause("it's it's it's the pressure", "it's the pressure"),
  clause('and the uh the pressure drops', 'and the pressure drops'),
  clause('that, that the far side gets left behind', 'the far side gets left behind'),
  clause('not — not like that', 'not like that'),
)

/** Finding 40: doubling that carries meaning. A collapse rule cannot tell these from above. */
const literalRepetitionClause = fc.constantFrom(
  clause("it's not stuck stuck", 'not stuck stuck'),
  clause("it's not stuck stuck", 'not stuck'),
  clause('a really really long time', 'a really long time'),
  clause('these tiny tiny things', 'tiny tiny things'),
  clause('deep deep time'),
  clause('the cable cable', 'the cable'),
)

/** Finding 37: "pump" carries um, "water" carries er. A substring strip mangles both. */
const fillerCarrierClause = fc.constantFrom(
  clause('the pump pushes the water up'),
  clause('the summer humidity number climbs'),
  clause('the plumbing column thumps'),
)

/** Finding 45: "like" appears 248 times across the transcripts, in both positions. */
const analogyClause = fc.constantFrom(
  clause('the wing is shaped like a teardrop'),
  clause('it looks enough like the real one'),
  clause('kind of like a lock and key'),
  clause(
    'it has to speed up to, um, to get to the back of the wing',
    'it has to speed up to get to the back of the wing',
  ),
)

/** Findings 9 and 42: case is unspecified, and folding it is not length-preserving. */
const capitalisedClause = fc.constantFrom(
  clause('Pressure builds up', 'pressure builds up'),
  clause('İzmir pumps the water', 'the water'),
  clause('Straße drainage backs up', 'drainage backs up'),
)

/** Findings 2, 3, 4, 7, 10, 11, 12, 14, 25 and 48. No oracle example leaves ASCII. */
const unicodeClause = fc.constantFrom(
  clause('the cafe\u0301 boiler heats the water', 'boiler heats the water'),
  clause('the \u{1F30A} water flowing downstream moves the waterwheel', 'moves the waterwheel'),
  clause('\u{1F30A}\u{1F30A} the pressure drops', 'the pressure drops'),
  clause('\u{1F3B5} the valve opens', 'the valve opens'),
  clause(
    'so the family \u{1F468}\u200D\u{1F469}\u200D\u{1F467}\u200D\u{1F466} all draw from the same tank',
    'all draw from the same tank',
  ),
  clause('it’s the pressure that opens the valve', "it's the pressure"),
  clause('the pump—which runs at night—fills the tank', 'the pump - which runs at night'),
  clause('the coefficient is ½ so the flow halves', 'the flow halves'),
  clause('the gap is one \u212B', 'the gap is one \u212B'),
  clause('the ﬁlter blocks the flow', 'blocks the flow'),
  clause('the Ａ valve sticks', 'valve sticks'),
  clause('the pressure drops…so the valve opens', 'so the valve opens'),
  clause('the wa\u200Dter pushes the wheel', 'water'),
  clause('the wa\u200Bter pushes the wheel', 'water'),
  clause('the cafe\u0301uh machine heats it', 'machine heats it'),
  clause('Ωuh漢 drives the pump', 'drives the pump'),
)

/**
 * The same findings from the other side, and the gap a sampling run found.
 *
 * Every entry in `unicodeClause` names a phrase that begins *after* the awkward character,
 * so the span the model asks for never contains one. Sampled at 15,000 calls, fifteen of the
 * nineteen non-ASCII classes above came back at a flat zero inside a candidate span — the
 * generator was exercising "an odd character sits before the match" and nothing else. These
 * put the character inside the match, which is where an offset map that is wrong by one
 * lands on half a surrogate pair and `createAnchor` refuses a link that was correct
 * (finding 4), and where a quote rebuilt from normalised text differs from the raw one
 * (finding 10, the U+212B half).
 *
 * Two entries deliberately differ between raw and phrase, both mirroring a shape the
 * regression cases already use: NFC in the transcript against NFD from the model, and a CRLF
 * in the transcript against a single space from the model.
 */
const unicodeInSpanClause = fc.constantFrom(
  clause('the \u{1F30A} water flows out'),
  clause(
    'the family \u{1F468}\u200D\u{1F469}\u200D\u{1F467}\u200D\u{1F466} draws from the tank',
  ),
  clause('the cafe\u0301 boiler heats the water', 'cafe\u0301 boiler heats the water'),
  // NFC in the transcript against NFD from the model, the mirror of the entry above.
  clause('the caf\u00E9 boiler heats the water', 'the cafe\u0301 boiler heats the water'),
  clause('the wa\u200Cter pushes the wheel'),
  clause('the wa\u200Bter pushes the wheel'),
  clause('the tank\uFEFF fills to the top'),
  clause('the pressure\u00A0drops right down'),
  clause('it’s the pressure that opens the valve'),
  clause('the pump—which runs at night—fills the tank'),
  clause('the pressure drops…so the valve opens'),
  clause('the coefficient is ½ and the flow halves', 'the coefficient is ½'),
  clause('the ﬁlter blocks the flow'),
  clause('the gap is one \u212B across'),
  clause('the Ａ valve sticks shut'),
  clause('İzmir pumps the water'),
  clause('Straße drainage backs up'),
  clause('Ωuh漢 drives the pump'),
  // CRLF in the transcript, one space from the model: two raw code units becoming one
  // *inside* the span, which is finding 1 at the end boundary rather than before it.
  clause(
    'the water hits the wheel\r\nand the wheel turns the shaft',
    'the water hits the wheel and the wheel turns the shaft',
  ),
)

/** Findings 1 and 43: newlines fell mid-sentence in 131 of 145 lines of a real transcript. */
const lineBreakClause = fc.constantFrom(
  clause('the water hits the wheel\r\nand the wheel turns the shaft', 'the wheel turns the shaft'),
  clause('push the\nhandle down', 'push the handle down'),
  clause('the pressure\u00A0drops', 'the pressure drops'),
  clause('the  valve   opens', 'the valve opens'),
)

/** Oracle example 2, and section 6's "two and three times"; finding 38 for the collision. */
const repeatedPhraseClause = fc.constantFrom(
  clause(
    'the water flowing downstream moves the waterwheel and that moves the water inside the building',
    'the water',
  ),
  clause('the water moves the water and the water moves again', 'the water'),
  clause('the warm water rises and then, uh, the warm water cools and falls', 'the warm water'),
)

const anyClause = fc.oneof(
  plainClause,
  filledPauseClause,
  commaFillerClause,
  stammerClause,
  literalRepetitionClause,
  fillerCarrierClause,
  analogyClause,
  capitalisedClause,
  unicodeClause,
  unicodeInSpanClause,
  lineBreakClause,
  repeatedPhraseClause,
)

const connective = fc.constantFrom(' so ', ' and ', ' because ', ', so ', ' which means ')

type Phrases = { readonly cause: string; readonly effect: string }
type GeneratedSentence = Phrases & { readonly text: string }

const arbitrarySentence: fc.Arbitrary<GeneratedSentence> = fc
  .tuple(anyClause, connective, anyClause)
  .map(([left, joiner, right]) => ({
    text: left.raw + joiner + right.raw,
    cause: left.phrase,
    effect: right.phrase,
  }))

/**
 * Findings 5, 23 and 41. The third entry is the adversarial one: it puts a *different*
 * occurrence of "the wheel" at exactly the offset the sentence-local one would claim, so an
 * implementation that forgets `sentence.anchor.char_start` resolves successfully against
 * somebody else's words.
 */
const arbitraryPrefix = fc.constantFrom(
  '',
  'the lever sticks. ',
  'x'.repeat(16) + 'the wheel spins. ',
  'the water moves the wheel. ',
  'x'.repeat(1200) + '. ',
  '\u{1F30A} ',
)

/** Finding 24: the phrase the model names may run past the end of the sentence. */
const arbitrarySuffix = fc.constantFrom('', ' and the valve opens.', ' and the water flows out.')

type Payload = { readonly category: string; readonly raw: unknown; readonly offered: readonly string[] }

const wellFormedPayload = (p: Phrases): fc.Arbitrary<Payload> =>
  fc.constantFrom('causes', 'enables', 'prevents', 'requires').map(relation => ({
    category: 'well-formed',
    raw: [{ cause: p.cause, effect: p.effect, relation }],
    offered: [p.cause, p.effect],
  }))

/** The wrapper models volunteer without being asked. */
const wrappedPayload = (p: Phrases): fc.Arbitrary<Payload> =>
  fc.constantFrom<unknown[]>(
    { links: [{ cause: p.cause, effect: p.effect, relation: 'causes' }] },
    { cause: p.cause, effect: p.effect, relation: 'causes' },
    { links: [] },
  ).map(raw => ({ category: 'wrapped', raw, offered: [p.cause, p.effect] }))

/** Oracle example 3. None of these phrases occurs in any clause above. */
const paraphrasePayload = (p: Phrases): fc.Arbitrary<Payload> =>
  fc.constantFrom('pressing the lever', 'the reservoir fills', 'squeezing the trigger').map(
    phrase => ({
      category: 'paraphrase',
      raw: [{ cause: phrase, effect: p.effect, relation: 'causes' }],
      offered: [phrase, p.effect],
    }),
  )

/** Oracle example 4. */
const mixedPayload = (p: Phrases): fc.Arbitrary<Payload> =>
  fc.constant({
    category: 'mixed',
    raw: [
      { cause: p.cause, effect: p.effect, relation: 'causes' },
      { cause: 'pressing the lever', effect: p.effect, relation: 'causes' },
      { cause: p.effect, effect: p.cause, relation: 'enables' },
      { cause: 'the reservoir fills', effect: 'squeezing the trigger', relation: 'prevents' },
    ],
    offered: [p.cause, p.effect, 'pressing the lever', 'the reservoir fills', 'squeezing the trigger'],
  })

const emptyListPayload = (): fc.Arbitrary<Payload> =>
  fc.constant({ category: 'empty-list', raw: [], offered: [] })

/**
 * Findings 15 and 16. A preamble plus a markdown fence is what a local instruct model emits
 * without constrained decoding, and silence is the input `validate` meets most often: the
 * recorded failure mode is 35.70% missing relations against 0.31% false positives.
 */
const notJsonPayload = (): fc.Arbitrary<Payload> =>
  fc.constantFrom(
    '',
    // Whitespace-only. An HTTP body that is a newline, or a model that emitted its stop
    // token immediately. `''.trim()` and `'   '.trim()` are the same string and a parse
    // step that only guards the first leaves this one throwing.
    '   ',
    'No causal links found in this sentence.',
    "I'm sorry, I can't identify any causal relationships here.",
    'Sure! Here are the causal links:\n```json\n[{"cause":"push the handle down","effect":"the water flows out","relation":"causes"}]\n```',
    // The fence with no preamble, which is the shape a model emits when the prompt asks
    // for JSON and nothing strips the formatting.
    '```json\n[{"cause":"push the handle down","effect":"the water flows out","relation":"causes"}]\n```',
    '"[{\\"cause\\":\\"push the handle down\\",\\"effect\\":\\"the water flows out\\",\\"relation\\":\\"causes\\"}]"',
    // Trailing comma: valid to a human, a SyntaxError to JSON.parse.
    '[{"cause":"push the handle down",}]',
    'null',
    '{"links":',
  ).map(raw => ({
    category: 'not-json',
    raw,
    offered: ['push the handle down', 'the water flows out'],
  }))

/** Finding 17: literal null for "nothing here", and an empty HTTP body. */
const wrongTypePayload = (): fc.Arbitrary<Payload> =>
  fc.constantFrom<unknown[]>(
    null,
    undefined,
    42,
    true,
    {},
    { links: null },
    { links: {} },
    { links: 'push the handle down' },
    [null],
    [null, 'push the handle down', 7],
  ).map(raw => ({
    category: 'wrong-type',
    raw,
    offered: ['push the handle down', 'the water flows out'],
  }))

/** Finding 19. Section 6 never asserts on a relation at all. */
const outsideRelationPayload = (p: Phrases): fc.Arbitrary<Payload> =>
  fc.constantFrom('leads to', 'Causes', 'CAUSES', 'causes.', 'causes ', 'cause', 'is caused by', 'causal').map(
    relation => ({
      category: 'relation-outside-set',
      raw: [{ cause: p.cause, effect: p.effect, relation }],
      offered: [p.cause, p.effect],
    }),
  )

/** Finding 31: never arrives by accident, which is exactly why it is worth pinning. */
const prototypeRelationPayload = (p: Phrases): fc.Arbitrary<Payload> =>
  fc.constantFrom('constructor', 'toString', 'hasOwnProperty', '__proto__', 'valueOf').map(
    relation => ({
      category: 'relation-from-the-prototype',
      raw: [{ cause: p.cause, effect: p.effect, relation }],
      offered: [p.cause, p.effect],
    }),
  )

/** Finding 20: a small model dropping the least-emphasised field of three. */
const absentRelationPayload = (p: Phrases): fc.Arbitrary<Payload> =>
  fc.constantFrom<unknown[]>(
    { cause: p.cause, effect: p.effect },
    { cause: p.cause, effect: p.effect, relation: null },
    { cause: p.cause, effect: p.effect, relation: '' },
    { cause: p.cause, effect: p.effect, relation: 7 },
  ).map(entry => ({
    category: 'relation-absent',
    raw: [entry],
    offered: [p.cause, p.effect],
  }))

/** Findings 21 and 26: indices into a list the prompt enumerated, and volunteered spans. */
const nonStringPhrasePayload = (p: Phrases): fc.Arbitrary<Payload> =>
  fc.constantFrom<unknown[]>(
    { cause: 1, effect: 2, relation: 'causes' },
    { cause: 1, effect: p.effect, relation: 'causes' },
    { cause: true, effect: false, relation: 'causes' },
    { cause: NaN, effect: p.effect, relation: 'causes' },
    { cause: { text: p.cause, start: 9, end: 29 }, effect: { text: p.effect }, relation: 'causes' },
    { cause: [p.cause], effect: p.effect, relation: 'causes' },
    { cause: null, effect: p.effect, relation: 'causes' },
  ).map(entry => ({ category: 'non-string-phrase', raw: [entry], offered: [p.effect] }))

/**
 * Findings 6 and 22. Every one of these normalises to the empty string, and the empty string
 * is a substring of every sentence at every position, so what happens next is decided by
 * offset-map arithmetic rather than by any stated rule.
 */
const fillerPhrasePayload = (p: Phrases): fc.Arbitrary<Payload> =>
  fc.constantFrom('uh', 'um', '', '  ', '   ', 'um, uh', '\u200B', '\uFEFF', '\u00A0').map(phrase => ({
    category: 'phrase-normalises-away',
    raw: [{ cause: phrase, effect: p.effect, relation: 'causes' }],
    offered: [phrase, p.effect],
  }))

/** Finding 29: near-certain at any temperature above zero. */
const duplicatePayload = (p: Phrases): fc.Arbitrary<Payload> =>
  fc.constantFrom('causes', 'enables').map(second => ({
    category: 'duplicate',
    raw: [
      { cause: p.cause, effect: p.effect, relation: 'causes' },
      { cause: p.cause, effect: p.effect, relation: second },
    ],
    offered: [p.cause, p.effect],
  }))

/** Finding 28: the degenerate echo of a 4-bit quantised model, and the containment variant. */
const selfReferentialPayload = (p: Phrases): fc.Arbitrary<Payload> =>
  fc.constantFrom<unknown[]>(
    { cause: p.effect, effect: p.effect, relation: 'causes' },
    { cause: p.cause, effect: p.cause, relation: 'causes' },
    { cause: p.cause, effect: `${p.cause} ${p.effect}`, relation: 'causes' },
  ).map(entry => ({
    category: 'self-referential',
    raw: [entry],
    offered: [p.cause, p.effect, `${p.cause} ${p.effect}`],
  }))

/** Finding 24: an invariant 8 violation produced entirely by the shape of the model output. */
const crossingPayload = (p: Phrases): fc.Arbitrary<Payload> =>
  fc.constant({
    category: 'crosses-the-sentence',
    raw: [{ cause: p.cause, effect: `${p.effect} and the valve opens`, relation: 'causes' }],
    offered: [p.cause, `${p.effect} and the valve opens`],
  })

/** Findings 30 and 32. Bounded here; the reviewers' full sizes are in the regression block. */
const oversizedPayload = (p: Phrases): fc.Arbitrary<Payload> =>
  fc.constant({
    category: 'oversized',
    raw: [
      { cause: `${p.effect} `.repeat(200), effect: p.effect, relation: 'causes' },
      ...Array.from({ length: 60 }, () => ({
        cause: p.cause,
        effect: p.effect,
        relation: 'causes',
      })),
    ],
    offered: [p.cause, p.effect, `${p.effect} `.repeat(200)],
  })

const nest = (depth: number, shape: 'object' | 'array'): unknown => {
  let value: unknown = [
    { cause: 'push the handle down', effect: 'the water flows out', relation: 'causes' },
  ]
  for (let i = 0; i < depth; i += 1) value = shape === 'object' ? { links: value } : [value]
  return value
}

/** Finding 33: what a lenient "find the links wherever they are" walker turns into. */
const deeplyNestedPayload = (): fc.Arbitrary<Payload> =>
  fc.constantFrom('object' as const, 'array' as const).map(shape => ({
    category: 'deeply-nested',
    raw: nest(400, shape),
    offered: ['push the handle down', 'the water flows out'],
  }))

const PAYLOAD_CATEGORIES: readonly string[] = [
  'well-formed',
  'wrapped',
  'paraphrase',
  'mixed',
  'empty-list',
  'not-json',
  'wrong-type',
  'relation-outside-set',
  'relation-from-the-prototype',
  'relation-absent',
  'non-string-phrase',
  'phrase-normalises-away',
  'duplicate',
  'self-referential',
  'crosses-the-sentence',
  'oversized',
  'deeply-nested',
]

/**
 * Weighted, and only where sampling showed a variant starved.
 *
 * `notJsonPayload` carries ten variants where most arbitraries carry one shape, so at equal
 * weight each of its strings — the empty body, the whitespace-only body, the bare fence —
 * arrived under one sample in a hundred. It also holds the input `validate` will meet most
 * often: extract.md records 35.70% missing relations against 0.31% false positives, so
 * "the model produced nothing usable" is the common case, not the exotic one.
 * `fillerPhrasePayload` is doubled for the same arithmetic reason: nine variants, of which
 * the empty-string phrase is the one findings 6 and 22 are actually about.
 */
const payloadFor = (p: Phrases): fc.Arbitrary<Payload> =>
  fc.oneof(
    wellFormedPayload(p),
    wrappedPayload(p),
    paraphrasePayload(p),
    mixedPayload(p),
    emptyListPayload(),
    { arbitrary: notJsonPayload(), weight: 3 },
    wrongTypePayload(),
    outsideRelationPayload(p),
    prototypeRelationPayload(p),
    absentRelationPayload(p),
    nonStringPhrasePayload(p),
    { arbitrary: fillerPhrasePayload(p), weight: 2 },
    duplicatePayload(p),
    selfReferentialPayload(p),
    crossingPayload(p),
    oversizedPayload(p),
    deeplyNestedPayload(),
  )

type Call = {
  readonly doc: Doc
  readonly sentence: Sentence
  readonly raw: unknown
  readonly offered: readonly string[]
  readonly category: string
}

const arbitraryCall = (): fc.Arbitrary<Call> =>
  arbitrarySentence.chain(generated =>
    fc
      .tuple(arbitraryPrefix, arbitrarySuffix, payloadFor(generated))
      .map(([before, after, payload]) => {
        const { doc, sentence } = transcript(generated.text, { before, after })
        return {
          doc,
          sentence,
          raw: payload.raw,
          offered: payload.offered,
          category: payload.category,
        }
      }),
  )

// ===========================================================================
// THE PROPERTY — the human's invariant, stated in docs/specs/extract.md section 6:
//
//   "For any sentence and any model output, every anchor `validate` returns resolves to a
//    span inside that sentence, and that span's text — normalised — contains the model's
//    phrase, normalised. Anything that cannot satisfy both is dropped rather than repaired."
//
// Do not edit these assertions.
// ===========================================================================

describe('the invariant', () => {
  test('every anchor resolves inside the sentence and contains the phrase the model named', () => {
    fc.assert(
      fc.property(arbitraryCall(), ({ doc, sentence, raw, offered }) => {
        holdsTheInvariant(doc, sentence, validate(sentence, raw).links, offered)
      }),
      { numRuns: 600 },
    )
  })

  // Section 3: "No throwing. One sentence failing costs that sentence." Ruling 6 rejected
  // aborting outright, and a throw out of `validate` is that behaviour by another route.
  test('never throws, whatever came back from the model', () => {
    fc.assert(
      fc.property(arbitraryCall(), ({ sentence, raw }) => {
        expect(() => validate(sentence, raw)).not.toThrow()
      }),
      { numRuns: 600 },
    )
  })

  test('never throws on input no one anticipated', () => {
    fc.assert(
      fc.property(arbitraryCall(), fc.anything(), ({ sentence }, junk) => {
        expect(() => validate(sentence, junk)).not.toThrow()
      }),
      { numRuns: 300 },
    )
  })
})

// ===========================================================================
// THE GENERATOR ITSELF — not a test of `validate`. Section 6: "Sample it and assert the
// category counts before trusting a green run — degrading one generator to plain ASCII once
// left every property green at a mutation score of 100%."
// ===========================================================================

describe('the generator itself', () => {
  test('produces every payload category', () => {
    const seen = new Set(fc.sample(arbitraryCall(), 900).map(call => call.category))
    expect(PAYLOAD_CATEGORIES.filter(category => !seen.has(category))).toEqual([])
  })

  test('produces every sentence hazard, and does not drift into plain ASCII', () => {
    const calls = fc.sample(arbitraryCall(), 900)
    const sentences = calls.map(call => call.sentence.anchor.quote)

    expect({
      filledPause: sentences.some(text => /(^|\s)(uh|um)(\s|$|,)/.test(text)),
      commaBracketedFiller: sentences.some(text => /, (um|uh), /.test(text)),
      stammer: sentences.some(text => /it's it's/.test(text)),
      meaningfulRepetition: sentences.some(text => /stuck stuck|tiny tiny|deep deep/.test(text)),
      fillerCarrier: sentences.some(text => /pump|summer|number/.test(text)),
      astral: sentences.some(text => /[\u{10000}-\u{10FFFF}]/u.test(text)),
      combining: sentences.some(text => /[\u0300-\u036F]/u.test(text)),
      zeroWidth: sentences.some(text => /[\u200B-\u200D\uFEFF]/.test(text)),
      typographic: sentences.some(text => /[‘’—…]/.test(text)),
      dottedCapital: sentences.some(text => text.includes('İ')),
      nfkcGrowing: sentences.some(text => /[\u00BD\uFB01\uFF21]/.test(text)),
      crlf: sentences.some(text => text.includes('\r\n')),
      repeatedThrice: sentences.some(text => (text.match(/the water/g) ?? []).length >= 3),
      sentenceNotAtOffsetZero: calls.some(call => call.sentence.anchor.char_start > 0),
      sentenceNotAtEndOfTranscript: calls.some(
        call => call.sentence.anchor.char_end < call.doc.text.length,
      ),
    }).toEqual({
      filledPause: true,
      commaBracketedFiller: true,
      stammer: true,
      meaningfulRepetition: true,
      fillerCarrier: true,
      astral: true,
      combining: true,
      zeroWidth: true,
      typographic: true,
      dottedCapital: true,
      nfkcGrowing: true,
      crlf: true,
      repeatedThrice: true,
      sentenceNotAtOffsetZero: true,
      sentenceNotAtEndOfTranscript: true,
    })
  })
})

// ===========================================================================
// REGRESSION CASES — agent-written, from three reviewers who attacked the oracle's
// coverage. NOT the oracle: nothing below is domain knowledge the human stated, and nothing
// below may be read back as one. Each case asserts only what the human's own words already
// settle — section 6's invariant, section 3's prohibitions, rulings 2, 3, 6 and 7, and
// invariants 2 and 8 — and every case where two answers are both defensible says so and
// asserts the invariant alone. Those are marked OPEN and are listed in the summary as
// rulings the human owes.
// ===========================================================================

describe('regressions: the two coordinate systems', () => {
  // Finding 41/23. `validate` is handed a `Sentence`, not a `Doc`, so the only text it has
  // is `sentence.anchor.quote` — and the obvious implementation mints against that and
  // emits sentence-local offsets wearing the transcript's doc_id. Section 2 says the
  // sentence anchor resolves against the full transcript, and section 6 says every anchor
  // resolves; both are only true of transcript-absolute offsets.
  test('an anchor is transcript-absolute, not sentence-local', () => {
    const { doc, sentence } = transcript('push the uh handle down and the water goes', {
      before: 'the lever sticks. ',
    })

    const { links } = validate(sentence, [
      { cause: 'push the handle down', effect: 'the water goes', relation: 'causes' },
    ])

    expect(links).toHaveLength(1)
    expect(resolveAnchor(doc, links[0]!.cause)).toEqual({
      start: doc.text.indexOf('push the uh handle down'),
      end: doc.text.indexOf('push the uh handle down') + 'push the uh handle down'.length,
    })
  })

  // Finding 5. The prefix is exactly the length that puts a *different* occurrence of
  // "the wheel" at the sentence-local offset, so a missing `char_start` addition resolves
  // successfully and hands back words from a different sentence. anchor.md ruling C
  // documents this collision one layer down, where the content-hashed doc_id closes it;
  // here it is the same document, so the doc_id cannot help.
  test('a sentence-local offset that collides with earlier text does not resolve there', () => {
    const { doc, sentence } = transcript('The water moves the wheel.', {
      before: 'x'.repeat(16) + 'the wheel spins. ',
    })

    const { links } = validate(sentence, [
      { cause: 'water', effect: 'the wheel', relation: 'causes' },
    ])

    expect(links).toHaveLength(1)
    expect(resolveAnchor(doc, links[0]!.effect)).toEqual({
      start: doc.text.indexOf('the wheel', sentence.anchor.char_start),
      end: doc.text.indexOf('the wheel', sentence.anchor.char_start) + 'the wheel'.length,
    })
  })

  // Finding 24. Invariant 8, quoted: "Extraction is per-sentence, never one-shot over a
  // whole explanation." Section 3: no reading across a sentence boundary at emission. The
  // effect phrase exists in the transcript and not in this sentence, so it is a drop —
  // including for an implementation that searched the whole `Doc` to get the arithmetic
  // above right.
  test('a phrase that leaves the sentence is dropped, even though it is in the transcript', () => {
    const { sentence } = transcript('the pressure drops', { after: ' and the valve opens' })

    const { links } = validate(sentence, [
      {
        cause: 'the pressure drops',
        effect: 'the pressure drops and the valve opens',
        relation: 'causes',
      },
    ])

    expect(links).toEqual([])
  })
})

describe('regressions: the offset map', () => {
  // Finding 1. Ruling 3 records newlines falling mid-sentence in 131 of 145 lines of a real
  // transcript, so this is the ordinary case. Folding CRLF to one space is two raw code
  // units becoming one, and every offset after it is wrong by one unless the map records it.
  test('a CRLF inside the sentence does not shift the anchor', () => {
    const { doc, sentence } = transcript(
      'the water hits the wheel\r\nand the wheel turns the shaft',
    )

    const { links } = validate(sentence, [
      {
        cause: 'the water hits the wheel',
        effect: 'the wheel turns the shaft',
        relation: 'causes',
      },
    ])

    expect(links).toHaveLength(1)
    expect(links[0]!.effect.quote).toBe('the wheel turns the shaft')
    expect(resolveAnchor(doc, links[0]!.effect)).toEqual({
      start: doc.text.indexOf('the wheel turns the shaft'),
      end: doc.text.indexOf('the wheel turns the shaft') + 'the wheel turns the shaft'.length,
    })
  })

  // Finding 43. A bare newline mid-sentence is the same class, and oracle example 1's rule
  // decides the quote: "The anchor spans the raw text." So the newline is inside the quote.
  test('a newline inside a matched span stays in the quote', () => {
    const { doc, sentence } = transcript('push the\nhandle down and the water goes')

    const { links } = validate(sentence, [
      { cause: 'push the handle down', effect: 'the water goes', relation: 'causes' },
    ])

    expect(links).toHaveLength(1)
    expect(links[0]!.cause.quote).toBe('push the\nhandle down')
    expect(resolveAnchor(doc, links[0]!.cause)).not.toBeNull()
  })

  // Finding 2. Calling .normalize('NFC') on the sentence before searching makes it one code
  // unit shorter than the raw string, and the anchor then begins on a bare combining acute
  // and loses its last character. anchor.md ruling 3 allows splitting a letter from its
  // accent, so neither door catches it.
  test('an NFD sentence does not shift the anchor by the combining mark', () => {
    const { doc, sentence } = transcript(
      'the cafe\u0301 boiler heats the water so the tank fills',
    )

    const { links } = validate(sentence, [
      { cause: 'boiler heats the water', effect: 'the tank fills', relation: 'causes' },
    ])

    expect(links).toHaveLength(1)
    expect(links[0]!.cause.quote).toBe('boiler heats the water')
    expect(resolveAnchor(doc, links[0]!.cause)).not.toBeNull()
  })

  // Finding 3. An offset map built by iterating code points — [...text], or for-of — hands
  // code-point indices to `createAnchor`, which takes UTF-16 code units. AGENTS.md names
  // this hazard by name and calls it silent; anchor.test.ts exists to catch it one layer
  // down, and this is the same mistake recommitted where Anchor's guards cannot see it.
  test('a non-BMP character before the span does not shift the anchor', () => {
    const { doc, sentence } = transcript(
      'the \u{1F30A} water flowing downstream moves the waterwheel and the shaft turns',
    )

    const { links } = validate(sentence, [
      { cause: 'moves the waterwheel', effect: 'the shaft turns', relation: 'causes' },
    ])

    expect(links).toHaveLength(1)
    expect(links[0]!.cause.quote).toBe('moves the waterwheel')
    expect(resolveAnchor(doc, links[0]!.cause)).not.toBeNull()
  })

  // Finding 4. The same drift, now two, landing between the halves of the second emoji:
  // `createAnchor` refuses the malformed slice and a perfectly good link is thrown away.
  // That is the worst outcome available — `dropped` increments and Notice fires `resay`,
  // asking the speaker to repeat a sentence Extract read correctly.
  test('two non-BMP characters before the span do not cost the link', () => {
    const { doc, sentence } = transcript('\u{1F30A}\u{1F30A} the pressure drops so the valve opens')

    const { links } = validate(sentence, [
      { cause: 'the pressure drops', effect: 'the valve opens', relation: 'causes' },
    ])

    expect(links).toHaveLength(1)
    expect(links[0]!.cause.quote).toBe('the pressure drops')
    expect(resolveAnchor(doc, links[0]!.cause)).not.toBeNull()
  })

  // Finding 48. One astral character, from an engine emitting a music glyph or from a name.
  test('a single astral character before the span does not shift the anchor', () => {
    const { doc, sentence } = transcript('\u{1F3B5} the valve opens and the tank fills')

    const { links } = validate(sentence, [
      { cause: 'the valve opens', effect: 'the tank fills', relation: 'causes' },
    ])

    expect(links).toHaveLength(1)
    expect(links[0]!.cause.quote).toBe('the valve opens')
    expect(resolveAnchor(doc, links[0]!.cause)).not.toBeNull()
  })

  // Finding 12. A grapheme-indexed map — Intl.Segmenter, or an array of graphemes — counts
  // this family as one where the raw text spends eleven code units, so the drift is ten and
  // the quote is unrelated text rather than a near miss. A code-point map is wrong by four.
  test('a ZWJ emoji sequence before the span does not shift the anchor', () => {
    const { doc, sentence } = transcript(
      'so the family \u{1F468}\u200D\u{1F469}\u200D\u{1F467}\u200D\u{1F466} all draw from the same tank so the pressure drops',
    )

    const { links } = validate(sentence, [
      { cause: 'all draw from the same tank', effect: 'the pressure drops', relation: 'causes' },
    ])

    expect(links).toHaveLength(1)
    expect(links[0]!.cause.quote).toBe('all draw from the same tank')
    expect(resolveAnchor(doc, links[0]!.cause)).not.toBeNull()
  })

  // Finding 9. "İ".toLowerCase() is two code units, so folding case makes the compared
  // string longer than the raw one and every offset after it is wrong. The test is safe
  // whichever way the unruled case question goes: this phrase is lowercase in the raw text.
  test('a dotted capital before the span does not shift the anchor', () => {
    const { doc, sentence } = transcript('İzmir pumps the water so the tank fills')

    const { links } = validate(sentence, [
      { cause: 'pumps the water', effect: 'the tank fills', relation: 'causes' },
    ])

    expect(links).toHaveLength(1)
    expect(links[0]!.effect.quote).toBe('the tank fills')
    expect(resolveAnchor(doc, links[0]!.effect)).not.toBeNull()
  })

  // Finding 10. NFKC turns ½ into three code units, ﬁ into two, … into three; every offset
  // after the character is wrong by the growth and the map has no record of it.
  test('a character that NFKC would expand does not shift the anchor', () => {
    const { doc, sentence } = transcript(
      'the coefficient is ½ so the flow halves and the tank drains',
    )

    const { links } = validate(sentence, [
      { cause: 'the flow halves', effect: 'the tank drains', relation: 'causes' },
    ])

    expect(links).toHaveLength(1)
    expect(links[0]!.cause.quote).toBe('the flow halves')
    expect(resolveAnchor(doc, links[0]!.cause)).not.toBeNull()
  })

  // Finding 10, the length-preserving half. Plain NFC rewrites U+212B ANGSTROM SIGN to
  // U+00C5: offsets stay right while the *content* differs from the raw text, so an
  // implementation that builds the quote from the normalised string rather than slicing the
  // raw one puts a character on screen the speaker never typed. That is an invariant 2
  // breach, and `resolveAnchor` is what refuses it.
  test('a quote is sliced from raw text, not rebuilt from normalised text', () => {
    const { doc, sentence } = transcript(
      'the gap is one \u212B so the flow stops and the tank drains',
    )

    const { links } = validate(sentence, [
      { cause: 'the gap is one \u212B', effect: 'the flow stops', relation: 'causes' },
    ])

    expect(links).toHaveLength(1)
    expect(links[0]!.cause.quote).toBe('the gap is one \u212B')
    expect(resolveAnchor(doc, links[0]!.cause)).not.toBeNull()
  })

  // Finding 8. Collapsing "it's it's" removes five code units, so a match found at
  // normalised offset 23 sits at raw offset 28. Oracle example 1 cannot expose this: its
  // filler is strictly interior and its match runs to the end of the sentence, so a
  // start-mapping bug and an end-mapping bug can both hide behind a passing oracle 1.
  test('a collapsed stammer earlier in the sentence does not shift the anchor', () => {
    const { doc, sentence } = transcript(
      "it's it's the pressure that opens the valve and the water flows out",
    )

    const { links } = validate(sentence, [
      { cause: 'opens the valve', effect: 'the water flows out', relation: 'causes' },
    ])

    expect(links).toHaveLength(1)
    expect(links[0]!.cause.quote).toBe('opens the valve')
    expect(resolveAnchor(doc, links[0]!.cause)).not.toBeNull()
  })
})

describe('regressions: what the normaliser touches', () => {
  // Finding 34, verbatim from docs/transcripts/round-2.md line 94. This is the most common
  // filler shape in the corpus — ", um, " bracketed by commas, not spaces — and a strip
  // that ignores the adjacent punctuation leaves "starts with, , evaporation", where the
  // needle is no longer a substring. Every oracle example puts the filler between bare
  // spaces, so all four pass either way. Both endpoints here sit on plain words, so the
  // quote is settled: oracle example 1's rule is that the anchor spans the raw text.
  test('a filler bracketed by commas does not cost the link', () => {
    const { doc, sentence } = transcript(
      'it starts with, um, evaporation and the sun heats up the ocean',
    )

    const { links } = validate(sentence, [
      { cause: 'it starts with evaporation', effect: 'the sun heats up the ocean', relation: 'causes' },
    ])

    expect(links).toHaveLength(1)
    expect(links[0]!.cause.quote).toBe('it starts with, um, evaporation')
    expect(resolveAnchor(doc, links[0]!.cause)).not.toBeNull()
  })

  // Finding 39. "and the uh the pressure drops": strip-then-collapse matches, and
  // collapse-then-strip does not. Pass order is unspecified — but the outcome is not. The
  // human's sentence is that a link survives when the phrase appears "once filled pauses
  // AND stammers are ignored", and with both ignored it does. The needle has to start
  // *before* the repeat for the difference to show, which is why a test built from oracle 1
  // plus a plain "it's it's" case does not catch it.
  test('a stammer split by a filled pause still matches', () => {
    const { doc, sentence } = transcript('and the uh the pressure drops so the valve opens')

    const { links } = validate(sentence, [
      { cause: 'and the pressure drops', effect: 'the valve opens', relation: 'causes' },
    ])

    expect(links).toHaveLength(1)
    expect(links[0]!.cause.quote).toBe('and the uh the pressure drops')
    expect(resolveAnchor(doc, links[0]!.cause)).not.toBeNull()
  })

  // Finding 47. A single left-to-right pass that compares token i with i+1 and advances by
  // two leaves one duplicate behind, so normalisation is not idempotent — and matching
  // still succeeds, so `validate` looks correct. The damage lands on Voice, which speaks
  // `normalise(quote).text`: child-speech.md ruling 6 names "so it's it's a new set of
  // beliefs" in the child's mouth as the bug the ruling exists to prevent.
  test('a run of three repeats collapses as far as a pair does', () => {
    expect(normalise("it's it's the pressure that opens the valve").text).not.toContain("it's it's")
    expect(normalise("it's it's it's the pressure that opens the valve").text).not.toContain(
      "it's it's",
    )
  })

  // Finding 37. "pump" contains "um" and "water" contains "er", both standard filled-pause
  // spellings, so a filler list applied as substring replacement yields "the pp pushes the
  // wat". Matching still succeeds, because the model's phrase is normalised by the same
  // function and breaks identically, and `dropped` stays zero — the property above cannot
  // see a bug shared by both sides, which is exactly what child-speech.md section 6's
  // property also cannot see. So this one is asserted on the normaliser directly.
  //
  // Finding 14 is the same rule from the other side. Writing the strip as /\buh\b/ looks
  // like whole-token matching and is not: \b is defined over ASCII word characters, so
  // neither a combining mark nor a Greek or Han character counts as one, and the regex
  // fires inside a word. /\buh\b/.test('Ωuh漢') is true. Oracle example 1's "uh" sits
  // between ASCII spaces, which is the only position it pins.
  test('the filler list matches whole tokens, not substrings', () => {
    const cleaned = normalise('the pump pushes the water up until the summer number climbs').text
    const nonAscii = normalise('the cafe\u0301uh machine heats it and \u03A9uh\u6F22 drives it').text

    expect({
      pump: cleaned.includes('pump'),
      water: cleaned.includes('water'),
      summer: cleaned.includes('summer'),
      number: cleaned.includes('number'),
      // Either Unicode form: whether the normaliser folds NFD to NFC is itself unruled,
      // so pinning one form here would settle a question this test is not about.
      accented: nonAscii.includes('cafe\u0301uh') || nonAscii.includes('caf\u00E9uh'),
      greekAndHan: nonAscii.includes('\u03A9uh\u6F22'),
    }).toEqual({
      pump: true,
      water: true,
      summer: true,
      number: true,
      accented: true,
      greekAndHan: true,
    })
  })

  // Finding 38. Two raw spans that normalise to the same string, where the only material
  // distinguishing them is the disfluency — so the prompt-side mitigation section 6 names
  // (ask for the longest span that identifies the phrase uniquely) cannot separate them.
  // Oracle example 2 rules the outcome anyway: the first occurrence.
  test('occurrences that differ only in disfluency still anchor at the first', () => {
    const { doc, sentence } = transcript(
      'the warm water rises and then, uh, the warm water cools and falls',
    )

    const { links } = validate(sentence, [
      { cause: 'the warm water', effect: 'cools and falls', relation: 'causes' },
    ])

    expect(links).toHaveLength(1)
    expect(links[0]!.cause.char_start).toBe(doc.text.indexOf('the warm water'))
  })

  // Finding 44. Pause-based segmentation — ruling 3's fallback for engines that do not
  // punctuate — will cut a whole sentence of filler as its own unit. Its normalised text is
  // empty and its map has no entries, which is where an implementation computing
  // `map[start + length - 1] + 1` reads index -1 and produces NaN offsets. What is settled
  // here is only the paraphrase: nothing the model names appears, so nothing anchors.
  test('a sentence that is entirely filler yields no links', () => {
    for (const text of ['Um.', 'Uh, like, you know.']) {
      const { sentence } = transcript(text, { before: 'the valve opens. ' })

      expect(
        validate(sentence, [
          { cause: 'the pressure drops', effect: 'the valve opens', relation: 'causes' },
        ]).links,
      ).toEqual([])
    }
  })

  // OPEN — finding 13/35/36. A match that begins or ends immediately beside a stripped
  // region has two defensible raw offsets, and section 6 rules on neither: "the valve
  // opens" and "the valve opens, uh, " are both well-formed, both resolve, and both satisfy
  // invariant 2, but only one of them is words the model named. Oracle example 1 cannot
  // tell them apart, because its filler is strictly interior and its match runs to the end
  // of the sentence. Two implementations that pass all four examples will speak different
  // quotes here. This test asserts the invariant and nothing more; the choice needs a human
  // ruling, and it belongs in `toRawSpan`.
  test('OPEN: a span whose endpoint touches stripped material still holds the invariant', () => {
    const cases: readonly { text: string; cause: string; effect: string }[] = [
      {
        text: 'the pressure drops so the valve opens, uh, and the water flows out',
        cause: 'the pressure drops',
        effect: 'the valve opens',
      },
      {
        text: 'and, uh, that rising air is really important because it leaves a gap',
        cause: 'that rising air is really important',
        effect: 'it leaves a gap',
      },
      {
        text: 'the pressure drops uh and the valve opens',
        cause: 'the pressure drops',
        effect: 'the valve opens',
      },
    ]

    for (const { text, cause, effect } of cases) {
      const { doc, sentence } = transcript(text, { before: 'the pump runs. ' })
      const { links } = validate(sentence, [{ cause, effect, relation: 'causes' }])
      holdsTheInvariant(doc, sentence, links, [cause, effect])
    }
  })

  // OPEN — finding 40. "So it's not stuck stuck, it's just slow", round-1.md line 350, and
  // four more like it in round-2. The doubling is the meaning, not a stammer, and a rule
  // keyed on adjacent identical tokens cannot separate it from "it's it's". Collapsing
  // makes "not stuck" match and mints an anchor over "not stuck stuck", inverting the
  // sense; not collapsing drops a link. Both satisfy the invariant, so that is all this
  // asserts. Section 6 gives no example of the second kind.
  test('OPEN: a meaningful doubling holds the invariant whichever way it is treated', () => {
    const { doc, sentence } = transcript("so it's not stuck stuck, it's just slow")

    const { links } = validate(sentence, [
      { cause: 'not stuck', effect: "it's just slow", relation: 'causes' },
    ])

    holdsTheInvariant(doc, sentence, links, ['not stuck', "it's just slow"])
  })

  // OPEN — finding 45. "like" appears 248 times across the 18 transcripts, as a discourse
  // filler and as the hinge of an analogy, and a flat word list has to choose one behaviour
  // for both. Keeping it leaves the child saying "and that's, like, the whole reason",
  // which child-speech.md ruling 6 forbids; stripping it makes Voice say "the wing is
  // shaped a teardrop" and makes "like a lock and key" and "a lock and key" the same
  // concept for Notice's set arithmetic. Matching survives either way, so no test built
  // from the oracle's "uh" and "um" shows which choice was made.
  test('OPEN: "like" in both positions holds the invariant', () => {
    const { doc, sentence } = transcript(
      "the wing is shaped like a teardrop, and that's, like, the whole reason it lifts",
    )

    const { links } = validate(sentence, [
      { cause: 'shaped like a teardrop', effect: 'the whole reason it lifts', relation: 'causes' },
    ])

    holdsTheInvariant(doc, sentence, links, ['shaped like a teardrop', 'the whole reason it lifts'])
  })

  // OPEN — finding 46. "that, that" is a demonstrative followed by a complementiser, and
  // "not — not" is a repeat separated by an em dash; both are from round-2.md, lines 326 and
  // 430. Whether the collapse looks across punctuation is unspecified, and the answer has
  // to be the same for the comma and the dash or the rule is arbitrary. Section 6 names
  // only "it's it's", where the two tokens are adjacent and bare.
  test('OPEN: a repeat separated by punctuation holds the invariant', () => {
    const cases: readonly { text: string; cause: string; effect: string }[] = [
      {
        text: "there's an argument that, that the far side gets left behind so the water bulges",
        cause: 'the far side gets left behind',
        effect: 'the water bulges',
      },
      {
        text: 'not — not like that, so the pressure stays high',
        cause: 'not like that',
        effect: 'the pressure stays high',
      },
    ]

    for (const { text, cause, effect } of cases) {
      const { doc, sentence } = transcript(text)
      const { links } = validate(sentence, [{ cause, effect, relation: 'causes' }])
      holdsTheInvariant(doc, sentence, links, [cause, effect])
    }
  })

  // OPEN — finding 6/22. Every one of these normalises to the empty string, and
  // `indexOf("")` returns 0, so what happens next is decided by offset-map arithmetic
  // rather than by any stated rule: an implementation computing `rawEnd = map[nEnd - 1] + 1`
  // reads index -1 for a zero-length match and, with the usual clamp, mints a raw span over
  // a single space — non-empty and well-formed, so `createAnchor` accepts it and the child
  // quotes the speaker's own filled pause back at them as a cause.
  //
  // The human's invariant does not close this, and that is the finding: an empty normalised
  // phrase is contained in every span, so the containment half is satisfied vacuously —
  // the same vacuity anchor.md ruling 1 refuses one layer down, where the empty string
  // "would verify against any document at all". A guard here needs a ruling, so this
  // asserts only that nothing throws and that whatever comes back still resolves.
  test('OPEN: a phrase that normalises away does not throw and does not escape the sentence', () => {
    const { doc, sentence } = transcript('push the uh handle down and the water flows out', {
      before: 'the lever sticks. ',
    })

    for (const phrase of ['uh', 'um', '', '  ', '   ', '\u200B', '\uFEFF', 'um, uh']) {
      expect(() =>
        validate(sentence, [
          { cause: phrase, effect: 'the water flows out', relation: 'causes' },
        ]),
      ).not.toThrow()

      holdsTheInvariant(
        doc,
        sentence,
        validate(sentence, [
          { cause: phrase, effect: 'the water flows out', relation: 'causes' },
        ]).links,
        [phrase, 'the water flows out'],
      )
    }
  })
})

describe('regressions: matching the speaker against the model', () => {
  // OPEN — finding 7/25. Whisper-class transcription emits U+2019 and models emit U+0027,
  // so this collision is routine rather than exotic; the same goes for an em dash against a
  // hyphen and U+2026 against three dots. Nothing distinguishes it from oracle example 3,
  // where dropping is correct — but this is not a paraphrase, it is the same words with
  // different punctuation, and dropping it inflates `dropped` across most of the corpus so
  // `resay` fires constantly. Folding punctuation is not free either: it changes string
  // length and invalidates the offset map. What is settled is only that a returned quote is
  // the raw text, never the folded form, which is what `resolveAnchor` checks.
  test('OPEN: typographic punctuation against ASCII holds the invariant', () => {
    const cases: readonly { text: string; cause: string; effect: string }[] = [
      {
        text: 'it’s the pressure that opens the valve and the water flows out',
        cause: "it's the pressure",
        effect: 'the water flows out',
      },
      {
        text: 'the pump—which runs at night—fills the tank so the pressure holds',
        cause: 'the pump - which runs at night',
        effect: 'the pressure holds',
      },
      {
        text: 'the valve opens…so the tank fills',
        cause: 'the valve opens',
        effect: '...so the tank fills',
      },
      {
        text: 'the caf\u00E9 heats the water so the tank fills',
        cause: 'the cafe\u0301 heats',
        effect: 'the tank fills',
      },
    ]

    for (const { text, cause, effect } of cases) {
      const { doc, sentence } = transcript(text)
      const { links } = validate(sentence, [{ cause, effect, relation: 'causes' }])
      holdsTheInvariant(doc, sentence, links, [cause, effect])
    }
  })

  // OPEN — finding 11. A zero-width joiner or space inside a word makes `indexOf` return
  // -1, and the obvious "collapse whitespace" step does not save it: JavaScript's \s
  // matches U+00A0, U+FEFF, U+202F and U+3000 but not U+200B, U+200C, U+200D or U+0085, and
  // trim() strips U+FEFF while leaving U+200B. So the loss is recorded as if the model had
  // paraphrased.
  test('OPEN: an invisible character inside a word holds the invariant', () => {
    for (const separator of ['\u200D', '\u200B', '\u200C']) {
      const { doc, sentence } = transcript(`the wa${separator}ter pushes the wheel and the shaft turns`)
      const { links } = validate(sentence, [
        { cause: 'water', effect: 'the shaft turns', relation: 'causes' },
      ])
      holdsTheInvariant(doc, sentence, links, ['water', 'the shaft turns'])
    }
  })

  // OPEN — finding 42. Every oracle example happens to start with a lowercase word, so
  // whether matching folds case is unspecified — on the most common position there is.
  // Case-sensitive matching drops a real link and fires `resay` on a sentence that was
  // perfectly clear; case-insensitive matching has to survive a fold that is not always
  // length-preserving, which is the İ case above.
  test('OPEN: a sentence-initial capital holds the invariant', () => {
    const { doc, sentence } = transcript('Pressure builds up until the valve opens', {
      before: 'the pump runs. ',
    })

    const { links } = validate(sentence, [
      { cause: 'pressure builds up', effect: 'the valve opens', relation: 'causes' },
    ])

    holdsTheInvariant(doc, sentence, links, ['pressure builds up', 'the valve opens'])
  })
})

describe('regressions: the payload', () => {
  const payloadFixture = () =>
    transcript('when you push the uh handle down the water flows out', {
      before: 'x'.repeat(1200),
    })

  // Finding 15. A preamble plus a markdown fence is what a local instruct model emits
  // without constrained decoding, and it is probably the modal shape. `JSON.parse` throws
  // SyntaxError straight out of `validate`; the double-encoded variant parses to a string
  // and then `.map` is undefined. Section 3 bans throwing and ruling 6 rejected aborting,
  // and all four oracle examples hand `validate` an already-structured value, so none of
  // them reaches the parse step at all.
  test('a fenced or double-encoded payload does not throw', () => {
    const { doc, sentence } = payloadFixture()
    const payloads: readonly unknown[] = [
      'Sure! Here are the causal links:\n```json\n[{"cause":"push the handle down","effect":"the water flows out","relation":"causes"}]\n```',
      '```json\n[{"cause":"push the handle down","effect":"the water flows out","relation":"causes"}]\n```',
      '"[{\\"cause\\":\\"push the handle down\\",\\"effect\\":\\"the water flows out\\",\\"relation\\":\\"causes\\"}]"',
      '{"links":',
      '[{"cause":"push the handle down",}]',
    ]

    for (const raw of payloads) {
      expect(() => validate(sentence, raw)).not.toThrow()
      holdsTheInvariant(doc, sentence, validate(sentence, raw).links, [
        'push the handle down',
        'the water flows out',
      ])
    }
  })

  // Finding 16. This is the input `validate` will see most often: the recorded failure mode
  // is 35.70% missing relations against 0.31% false positives, so "the model produced
  // nothing usable" is the common case, and it is the one case section 6 never shows.
  // Ruling 6: junk contributes no links and the rest continues.
  test('an empty or refusing payload yields no links', () => {
    const { sentence } = payloadFixture()

    for (const raw of [
      '',
      'No causal links found in this sentence.',
      "I'm sorry, I can't identify any causal relationships here.",
      '   ',
    ]) {
      expect(validate(sentence, raw).links).toEqual([])
    }
  })

  // Finding 17. A model emitting literal null to mean "nothing here" and an HTTP client
  // handing back undefined for an empty body are both ordinary events, and both land on
  // the silence path that is already the dominant one.
  test('a null, undefined or wrongly shaped payload yields no links', () => {
    const { sentence } = payloadFixture()
    const payloads: readonly unknown[] = [
      null,
      undefined,
      'null',
      42,
      true,
      {},
      { links: null },
      { links: {} },
      { links: 'push the handle down' },
      [],
    ]

    for (const raw of payloads) {
      expect(validate(sentence, raw).links).toEqual([])
    }
  })

  // Finding 18, and the one gap here that is a signature rather than an implementation.
  // Ruling 6 says a sentence that returns junk increments `dropped`; oracle example 4 says
  // `dropped` counts links that could not be anchored. For (a) `dropped` must be 0 and for
  // (b) it must not be — and `validate` returns `readonly Link[]`, which has no channel to
  // say which happened. `extract` cannot tell them apart without re-parsing `raw` itself,
  // which is two parsers that can disagree about what counts as junk. Guessing junk fires
  // `resay` on the 35.70% of sentences where the model was merely silent; guessing the
  // other way loses `resay` entirely, the only move in the design that recovers a loss.
  //
  // OPEN, and the ruling belongs in extract.md section 2 rather than here. What is
  // assertable today is that the two are indistinguishable.
  test('OPEN: a well-formed empty list and unparseable junk are indistinguishable', () => {
    const { sentence } = transcript('and then it gets hot', { before: 'the pump runs. ' })

    expect(validate(sentence, []).links).toEqual([])
    expect(validate(sentence, 'I could not parse that.').links).toEqual([])
    expect(validate(sentence, [])).toEqual(validate(sentence, 'I could not parse that.'))
  })

  // Finding 27. Without a per-entry guard the leading null kills the whole call and the one
  // good link in the list is lost, which inverts oracle example 4's ruling that the good
  // links survive alongside the bad. (Whether `dropped` is 4 or 2 here is a second question
  // section 6 does not answer — it counts "links the model returned for this sentence that
  // could not be anchored", and a null is not a link the model returned. Not assertable
  // through this signature; see the case above.)
  test('a bad entry does not take the good links with it', () => {
    const { doc, sentence } = transcript(
      'when you push the uh handle down the water flows out and the tank fills',
      { before: 'the lever sticks. ' },
    )

    const { links } = validate(sentence, [
      null,
      'push the handle down',
      7,
      { cause: 'push the handle down', effect: 'the water flows out', relation: 'causes' },
      { cause: 'the water flows out', effect: 'the tank fills', relation: 'causes' },
    ])

    expect(links).toHaveLength(2)
    for (const link of links) {
      expect(resolveAnchor(doc, link.cause)).not.toBeNull()
      expect(resolveAnchor(doc, link.effect)).not.toBeNull()
    }
  })

  // Finding 26. `l.cause.toLowerCase()` on an object throws; coercing gives
  // "[object Object]" and loses a real link silently. The start/end fields are the trap
  // section 3 bans outright — "a model that returns a character position is returning a
  // number this piece throws away" — and an implementer reaching for `l.cause.start`
  // because it is right there has broken the rule that keeps invariant 2 mechanically true
  // without a second validation path.
  test('an object-valued phrase carrying its own offsets yields no links', () => {
    const { sentence } = payloadFixture()

    expect(
      validate(sentence, {
        links: [
          {
            cause: { text: 'push the handle down', start: 9, end: 29 },
            effect: { text: 'the water flows out' },
            relation: 'causes',
          },
        ],
      }).links,
    ).toEqual([])
  })

  // Finding 30. A repetition loop running to the output token cap is a real degenerate mode
  // of heavily quantised models, which is the class AGENTS.md's stack table now floors at.
  // No correctness break — the link drops — but Extract is the only model call in the live
  // phase, and normalising a 100 KB needle once per link against a 52-character sentence is
  // a live-session stall with no stated bound on it. The default test timeout is the only
  // instrument here.
  test('a degenerate 100 KB phrase drops without stalling', () => {
    const { sentence } = payloadFixture()
    const needle = 'the water flows out '.repeat(5_000)

    expect(validate(sentence, [{ cause: needle, effect: 'the water flows out', relation: 'causes' }]).links).toEqual(
      [],
    )
  })

  // OPEN — finding 32. Nothing in the signature, the spec or the oracle states a cap on
  // links per sentence, and there is no natural one, because `raw` is unknown by design.
  // The failure is a memory blow-up in the live phase rather than a wrong answer, so what
  // is assertable is only that it completes.
  test('OPEN: an enormous list of links has no stated cap', { timeout: 30_000 }, () => {
    const { sentence } = payloadFixture()
    const raw = Array.from({ length: 50_000 }, () => ({
      cause: 'push the handle down',
      effect: 'the water flows out',
      relation: 'causes',
    }))

    expect(() => validate(sentence, raw)).not.toThrow()
  })

  // Finding 33. A recursive shape walker throws RangeError on stack exhaustion, and
  // `validate` must not throw. The tempting implementation this punishes is the lenient one
  // — "find an array of link-shaped objects wherever it is" — which is what an implementer
  // reaches for after meeting the wrapper variance above.
  test('a deeply nested payload does not exhaust the stack', () => {
    const { sentence } = payloadFixture()

    expect(() => validate(sentence, nest(20_000, 'object'))).not.toThrow()
    expect(() => validate(sentence, nest(20_000, 'array'))).not.toThrow()
  })
})

describe('regressions: the relation', () => {
  const relationFixture = () =>
    transcript('when you push the uh handle down the water flows out', {
      before: 'the lever sticks. ',
    })

  const goodSides = { cause: 'push the handle down', effect: 'the water flows out' }

  // Finding 19. Not one of the four oracle examples carries a relation value, so an
  // implementation that copies `l.relation` straight onto the `Link` passes all four while
  // emitting a relation outside the closed set. Ruling 2 exists precisely because Voice's
  // template set must be finite and Notice's `conflict` must be decidable by set
  // arithmetic. Whether a returned link is dropped or its label repaired is not ruled —
  // "is caused by" is the sharpest, since accepting it after swapping the sides is a
  // repair, and section 6 says anything unsatisfiable is dropped rather than repaired — so
  // what is asserted is only what ruling 2 settles: nothing outside the set leaves here.
  test('no relation outside the closed set leaves validate', () => {
    const { sentence } = relationFixture()

    for (const relation of [
      'leads to',
      'Causes',
      'CAUSES',
      'causes.',
      'causes ',
      'cause',
      'is caused by',
      'causal',
      'CAUSE',
    ]) {
      const { links } = validate(sentence, [{ ...goodSides, relation }])
      expect(links.map(link => link.relation).filter(r => !RELATION_SET.includes(r))).toEqual([])
    }
  })

  // Finding 20. A small model dropping the least-emphasised field of three is common, and
  // more likely than emitting a wrong value. Both sides anchor, so the link survives
  // carrying `undefined` on a field the type says is one of four strings; Voice's
  // move-to-template lookup then renders the literal word "undefined" into the child's
  // mouth, and Notice's `conflict` compares against a relation that does not exist. The
  // oracle cannot catch it, because it never inspects `relation`.
  test('a missing, null or empty relation does not leave validate', () => {
    const { sentence } = relationFixture()
    const entries: readonly unknown[] = [
      { ...goodSides },
      { ...goodSides, relation: null },
      { ...goodSides, relation: '' },
      { ...goodSides, relation: undefined },
      { ...goodSides, relation: 7 },
    ]

    for (const entry of entries) {
      const { links } = validate(sentence, [entry])
      expect(links.map(link => link.relation).filter(r => !RELATION_SET.includes(r))).toEqual([])
    }
  })

  // Finding 31. Not realistic as model output — no model says "constructor" — but it is the
  // standard way this exact check gets written wrong: a closed set written as an object
  // literal and tested with `RELATIONS[r]` or `r in RELATIONS` resolves every one of these
  // up the prototype chain. The check is the only thing enforcing ruling 2, which is why an
  // input that can never arrive by accident is worth pinning.
  test('a relation borrowed from Object.prototype does not leave validate', () => {
    const { sentence } = relationFixture()

    for (const relation of ['constructor', 'toString', 'hasOwnProperty', '__proto__', 'valueOf']) {
      const { links } = validate(sentence, [{ ...goodSides, relation }])
      expect(links.map(link => link.relation).filter(r => !RELATION_SET.includes(r))).toEqual([])
    }
  })
})

describe('regressions: the link itself', () => {
  // Finding 21. Realistic when the prompt enumerates candidate spans and the model answers
  // with indices into that list. `String(l.cause)` — the natural way to be lenient about
  // types — turns 1 into "1", finds it as a literal substring, and mints an anchor whose
  // quote is "1". Invariant 2 is satisfied to the letter and the link is pure noise, and
  // the child then asks why the 1 makes the 2. Coercing is a repair, and section 6 says
  // anything that cannot satisfy the invariant is dropped rather than repaired; a number is
  // not a phrase that appears in a sentence.
  test('a non-string phrase yields no links', () => {
    const { sentence } = transcript(
      'the 1 way valve stops the water going back so the 2 chambers stay separate',
      { before: 'the pump runs. ' },
    )
    const entries: readonly unknown[] = [
      { cause: 1, effect: 2, relation: 'causes' },
      { cause: 1, effect: 'the 2 chambers stay separate', relation: 'causes' },
      { cause: true, effect: false, relation: 'causes' },
      { cause: NaN, effect: 'the 2 chambers stay separate', relation: 'causes' },
      { cause: null, effect: 'the 2 chambers stay separate', relation: 'causes' },
      { cause: ['the water going back'], effect: 'the 2 chambers stay separate', relation: 'causes' },
    ]

    for (const entry of entries) {
      expect(validate(sentence, [entry]).links).toEqual([])
    }
  })

  // OPEN — finding 28. Both sides are literal substrings and every check section 6 states
  // is satisfied, so a self-loop, or a link whose effect span properly contains its cause
  // span, enters the graph. Notice's `mirror` walks a chain to a concept with no outgoing
  // link and a self-loop always has one, so a chain walk without cycle detection does not
  // terminate; `why` renders as "why does the water flowing out make the water flow out?".
  // Whether `validate` drops these or it is Notice's problem is not ruled, and the silence
  // is the gap: an implementer will pick one and nobody will have ruled.
  test('OPEN: a self-loop and a containing span hold the invariant', () => {
    const text =
      'the water flowing downstream moves the waterwheel and that moves the water inside the building'
    const { doc, sentence } = transcript(text, { before: 'the river runs. ' })

    const cases: readonly { cause: string; effect: string }[] = [
      { cause: 'the water', effect: 'the water' },
      {
        cause: 'the water flowing downstream',
        effect: 'the water flowing downstream moves the waterwheel',
      },
    ]

    for (const { cause, effect } of cases) {
      const { links } = validate(sentence, [{ cause, effect, relation: 'causes' }])
      holdsTheInvariant(doc, sentence, links, [cause, effect])
    }
  })

  // OPEN — finding 29. Near-certain at any temperature above zero. Two identical links
  // leave `validate` anchored to the same offsets, and Notice's `which` fires on one effect
  // with two claimed causes where there is one claim. The near-duplicate is worse: same
  // cause, same effect, two relations from the closed set is precisely the input `conflict`
  // is meant to detect, and ruling 5 means the design deliberately cannot tell a model
  // hiccup from a speaker contradicting themselves — so the child says "But you just said
  // the curve does it" about a sentence with no contradiction in it. Whether `validate`
  // de-duplicates is not ruled. (It also breaks `dropped` computed as raw.length minus
  // links.length: a surviving duplicate masks a real loss elsewhere in the same list.)
  test('OPEN: an exact and a near duplicate hold the invariant', () => {
    const { doc, sentence } = transcript(
      'when you push the uh handle down the water flows out',
      { before: 'the lever sticks. ' },
    )
    const sides = { cause: 'push the handle down', effect: 'the water flows out' }

    for (const second of ['causes', 'enables']) {
      const { links } = validate(sentence, [
        { ...sides, relation: 'causes' },
        { ...sides, relation: second },
      ])
      holdsTheInvariant(doc, sentence, links, [sides.cause, sides.effect])
    }
  })
})

// ===========================================================================
// THE FOUR CHECKS THE RED TEAM SAID WERE MISSING
//
// Authored by the agent on 2026-08-10 under delegated authority: "Please make these
// decisions for me." Three of the four are transcriptions of the owner's own words rather
// than new judgements, and the fourth is his answer to the therapist/rapist case. Recorded
// here so the next reader knows who wrote them and why they are not in section 6.
//
// Four red-team implementations passed all 52 tests while being obviously wrong. These four
// checks kill all four attacks. Reverse any of them freely — the reasoning is above each.
// ===========================================================================

describe('the checks the oracle was missing', () => {
  // Owner, section 6 example 4, verbatim: "the three unanchorable ones are dropped, and
  // `sentence.dropped` is 3." No test read that number, so an implementation could report
  // anything and stay green — and `resay` is built on it.
  test('the dropped count is what was offered and could not be anchored', () => {
    const { sentence } = transcript(
      'the handle starts it and opens the flapper so water rushes in',
    )

    const result = validate(sentence, [
      { cause: 'the handle', effect: 'opens the flapper', relation: 'causes' },
      { cause: 'pressing the lever', effect: 'opens the flapper', relation: 'causes' },
      { cause: 'opens the flapper', effect: 'water rushes in', relation: 'causes' },
      { cause: 'the flush valve opens', effect: 'water enters the bowl', relation: 'causes' },
    ])

    expect(result.links).toHaveLength(2)
    expect(result.dropped).toBe(2)
  })

  // Ruling 8: "A payload that never parsed offers nothing, so it drops nothing." Without
  // this, an implementation can count things nobody offered and make the child ask about a
  // sentence it heard perfectly.
  test('a payload that offers nothing drops nothing', () => {
    const { sentence } = transcript('the handle starts it and opens the flapper')

    for (const raw of ['I could not parse that.', '', '   ', null, undefined, 42, [], {}]) {
      expect(validate(sentence, raw).dropped).toBe(0)
    }
  })

  // THE BIG ONE. The owner's invariant says "anything that cannot satisfy both is dropped",
  // and the other half of that sentence is that what CAN satisfy both is kept. Only the
  // first half was encoded, so returning nothing passed every test — a lookup table with no
  // algorithm in it scored 32 of 52. This is the lower bound.
  test('a phrase that is really in the sentence comes back as a link', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          'the handle starts it and opens the flapper',
          'the pressure drops so the valve opens',
          'water rushes in and the tank empties',
          'the compressor squeezes the gas and the gas gets hot',
        ),
        fc.constantFrom('', 'the pump runs. ', 'and then, um, '),
        (text, before) => {
          const words = text.split(' ')
          const cause = words.slice(0, 3).join(' ')
          const effect = words.slice(-3).join(' ')
          const { sentence } = transcript(text, { before })

          const { links } = validate(sentence, [{ cause, effect, relation: 'causes' }])

          expect(links).toHaveLength(1)
          expect(links[0]!.cause.quote).toContain(words[0]!)
          expect(links[0]!.effect.quote).toContain(words[words.length - 1]!)
        },
      ),
      { numRuns: 200 },
    )
  })

  // Owner, 2026-08-10, on "the therapist" matching the cause "the rapist": "NO. These are
  // completely different concepts. Obviously that shouldn't happen." So a match starts and
  // ends at a word boundary. Three of the four red-team implementations kept these.
  test('a match that starts or ends mid-word is dropped', () => {
    for (const [text, phrase] of [
      ['the pressure drops in the hose', 'sure drop'],
      ['the therapist calms the patient', 'the rapist'],
      ['the heater warms the air', 'heat'],
      ['the pump ushers the water along', 'push'],
    ] as const) {
      const { sentence } = transcript(text)
      const { links } = validate(sentence, [
        { cause: phrase, effect: text.split(' ').slice(-2).join(' '), relation: 'causes' },
      ])
      expect(links).toEqual([])
    }
  })
})
