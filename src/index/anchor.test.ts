import { describe, expect, test } from 'vitest'
import fc from 'fast-check'
import { createAnchor, resolveAnchor, type Doc } from './anchor.js'

// Fixture. Agent-written per AGENTS.md "Who writes what": setup, teardown and fixtures
// are mine, assertions are not. unit_id is opaque here on purpose — see
// docs/specs/anchor.md section 5A, and issue #21.
const makeDoc = (text: string): Doc => ({
  doc_id: 'doc-under-test',
  unit_id: 'unit-0',
  text,
})

// ===========================================================================
// THE ORACLE — human-authored. The first three are lifted verbatim from
// docs/workflow.md step 5; the fourth was written to settle exact-offset
// resolution (docs/specs/anchor.md section 5B).
//
//   "An anchor created from a span resolves back to exactly that span, in the
//    same document, every time."
//
// Do not edit these assertions. If one cannot be made to pass, say why.
// ===========================================================================

describe('the oracle', () => {
  // The ordinary case.
  test('resolves a plain span', () => {
    const doc = makeDoc('the quick brown fox')
    expect(resolveAnchor(doc, createAnchor(doc, 4, 9)!)).toEqual({ start: 4, end: 9 })
  })

  // JavaScript strings are UTF-16, so "👋".length is 2, not 1. Mixing code points
  // and code units returns the wrong span and nothing throws.
  test('resolves a span containing an emoji', () => {
    const doc = makeDoc('wave 👋 here')
    expect(resolveAnchor(doc, createAnchor(doc, 5, 7)!)).toEqual({ start: 5, end: 7 })
  })

  // The same quote appears twice. It must resolve to the occurrence it came from,
  // not the first match found.
  test('resolves the correct occurrence of a repeated quote', () => {
    const doc = makeDoc('water splits. then water recombines.')
    expect(resolveAnchor(doc, createAnchor(doc, 19, 24)!)).toEqual({ start: 19, end: 24 })
  })

  // The quote below still exists in the edited document, 18 characters further
  // right, so an implementation that searches would find it and return a span.
  // Returning null is what makes this exact-offsets rather than nearest-occurrence.
  test('returns null when the document has changed under the anchor', () => {
    const doc = makeDoc('water splits. then water recombines.')
    const anchor = createAnchor(doc, 19, 24)!
    const edited = makeDoc('NOTE: added later. water splits. then water recombines.')
    expect(resolveAnchor(edited, anchor)).toBeNull()
  })
})

// ===========================================================================
// THE THREE RULINGS — decided 2026-08-05, encoded by agent from the decisions
// as stated. Recorded in docs/specs/anchor.md.
// ===========================================================================

describe('what may not be anchored', () => {
  // An anchor exists to carry a quote. An empty quote carries nothing, and every
  // string contains the empty string — so it would "verify" against any document
  // at all, defeating invariant 2 rather than satisfying it.
  test('refuses a zero-length span', () => {
    const doc = makeDoc('the quick brown fox')
    expect(createAnchor(doc, 7, 7)).toBeNull()
  })

  // The emoji occupies slots 5 and 6. Taking one slot yields half a character,
  // which renders as a replacement glyph. A quote is user-facing under Law 2, so
  // a span that can only ever put nonsense on screen is refused at creation.
  test('refuses a span that cuts a character in half', () => {
    const doc = makeDoc('wave 👋 here')
    expect(createAnchor(doc, 5, 6)).toBeNull()
    expect(createAnchor(doc, 6, 7)).toBeNull()
  })

  // Unlike half an emoji, 'cafe' split from its combining accent is real readable
  // text on both sides. The line is "is this valid text", not "is this a whole
  // visual character" — which would need full grapheme segmentation.
  test('allows a span that splits a letter from its combining accent', () => {
    const doc = makeDoc('café society')
    expect(resolveAnchor(doc, createAnchor(doc, 0, 4)!)).toEqual({ start: 0, end: 4 })
  })
})

// ===========================================================================
// MECHANICAL CASES — nonsense in, null out. Never throw.
// ===========================================================================

describe('malformed spans return null rather than throwing', () => {
  const doc = makeDoc('the quick brown fox')

  test('inverted span', () => expect(createAnchor(doc, 9, 4)).toBeNull())
  test('negative start', () => expect(createAnchor(doc, -1, 4)).toBeNull())
  test('end past the document', () => expect(createAnchor(doc, 4, 999)).toBeNull())
  test('non-integer offsets', () => expect(createAnchor(doc, 4.5, 9)).toBeNull())
  test('NaN offsets', () => expect(createAnchor(doc, NaN, 9)).toBeNull())
  test('Infinity offsets', () => expect(createAnchor(doc, 0, Infinity)).toBeNull())
  test('empty document', () => expect(createAnchor(makeDoc(''), 0, 1)).toBeNull())
})

describe('resolveAnchor rejects anchors that do not belong to the document', () => {
  const doc = makeDoc('the quick brown fox')
  const anchor = createAnchor(doc, 4, 9)!

  test('doc_id mismatch', () => {
    expect(resolveAnchor({ ...doc, doc_id: 'a-different-doc' }, anchor)).toBeNull()
  })

  test('unit_id mismatch', () => {
    expect(resolveAnchor({ ...doc, unit_id: 'unit-9' }, anchor)).toBeNull()
  })

  test('offsets past the end of a shorter document', () => {
    expect(resolveAnchor(makeDoc('short'), anchor)).toBeNull()
  })

  // A hand-built anchor whose quote is longer than the range it claims.
  test('quote disagreeing with its own offsets', () => {
    expect(resolveAnchor(doc, { ...anchor, quote: 'quick brown' })).toBeNull()
  })
})

// ===========================================================================
// GENERATORS — agent-written. workflow.md step 5: "Read the generator, not the
// assertion." Hard cases are the list in docs/specs/anchor.md section 6.
// ===========================================================================

/** Fragments chosen so the generator cannot drift into plain ASCII. */
const hardFragments = fc.oneof(
  fc.string({ minLength: 0, maxLength: 8 }),
  fc.constantFrom(
    '👋', '🧬', '👨‍👩‍👧‍👦', // astral plane, and a ZWJ sequence 11 code units long
    'é', 'à́', // precomposed, and a letter plus combining marks
    'water', 'water', // repeated substrings, so occurrence identity is exercised
    '\r\n', '\n', '  ', '\t',
    'β', 'Ω', '漢字',
  ),
)

const arbitraryText = () =>
  fc.array(hardFragments, { minLength: 0, maxLength: 12 }).map(parts => parts.join(''))

/**
 * Spans aligned to whole code points and never empty — precisely the spans that
 * must round-trip. Generating arbitrary offsets instead would let the round-trip
 * property pass vacuously, since refused spans have no anchor to resolve.
 */
const arbitraryValidDocAndSpan = () =>
  arbitraryText()
    .filter(text => [...text].length >= 2)
    .chain(text => {
      const boundaries = [0]
      for (const codePoint of text) {
        boundaries.push(boundaries[boundaries.length - 1]! + codePoint.length)
      }
      return fc
        .tuple(fc.nat(boundaries.length - 1), fc.nat(boundaries.length - 1))
        .map(([i, j]) => ({
          doc: makeDoc(text),
          span: {
            start: boundaries[Math.min(i, j)]!,
            end: boundaries[Math.max(i, j)]!,
          },
        }))
        .filter(({ span }) => span.end > span.start)
    })

describe('the invariant', () => {
  test('any anchor round-trips to the span it came from', () => {
    fc.assert(
      fc.property(arbitraryValidDocAndSpan(), ({ doc, span }) => {
        const anchor = createAnchor(doc, span.start, span.end)
        expect(anchor).not.toBeNull()
        expect(resolveAnchor(doc, anchor!)).toEqual(span)
      }),
      { numRuns: 1000 },
    )
  })

  // Everything downstream leans on this: the stored quote is the text at the
  // stored offsets, by construction rather than by hope.
  test('a created anchor quotes exactly the text at its own offsets', () => {
    fc.assert(
      fc.property(arbitraryValidDocAndSpan(), ({ doc, span }) => {
        const anchor = createAnchor(doc, span.start, span.end)!
        expect(anchor.quote).toBe(doc.text.slice(anchor.char_start, anchor.char_end))
      }),
      { numRuns: 500 },
    )
  })

  test('createAnchor is deterministic', () => {
    const doc = makeDoc('the quick brown fox')
    expect(createAnchor(doc, 4, 9)).toEqual(createAnchor(doc, 4, 9))
  })

  // Arbitrary offsets, not just aligned ones: nonsense must produce null, never
  // an exception and never a malformed anchor.
  test('never throws and never returns a malformed anchor, for any offsets', () => {
    fc.assert(
      fc.property(
        arbitraryText(),
        fc.integer({ min: -50, max: 200 }),
        fc.integer({ min: -50, max: 200 }),
        (text, a, b) => {
          const doc = makeDoc(text)
          const anchor = createAnchor(doc, a, b)
          if (anchor === null) return
          expect(anchor.quote).toBe(doc.text.slice(anchor.char_start, anchor.char_end))
          expect(anchor.char_end).toBeGreaterThan(anchor.char_start)
        },
      ),
      { numRuns: 1000 },
    )
  })
})

// ===========================================================================
// Generator self-check. Not a test of Anchor — a test that the generator above
// is not quietly producing plain ASCII. workflow.md step 5: "Look at them."
// ===========================================================================

describe('the generator itself', () => {
  test('produces astral-plane, combining and CRLF cases', () => {
    const samples = fc.sample(arbitraryText(), 300)
    expect({
      astral: samples.some(t => /[\u{10000}-\u{10FFFF}]/u.test(t)),
      combining: samples.some(t => /[̀-ͯ]/u.test(t)),
      crlf: samples.some(t => t.includes('\r\n')),
      repeated: samples.some(t => (t.match(/water/g) ?? []).length > 1),
    }).toEqual({ astral: true, combining: true, crlf: true, repeated: true })
  })
})
