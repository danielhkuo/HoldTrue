import { describe, expect, test } from 'vitest'
import { createHash } from 'node:crypto'
import fc from 'fast-check'
import { createAnchor, resolveAnchor, type Doc } from './anchor.js'

// Fixture. Agent-written per AGENTS.md "Who writes what": setup, teardown and fixtures
// are mine, assertions are not. unit_id is opaque here on purpose — see
// docs/specs/anchor.md section 5A, and issue #21.
//
// doc_id is the content hash, so it identifies a *version* of a document rather than a
// file. Edit the text and you get a different doc_id, which is what invalidates every
// anchor made from the old version. Decided 2026-08-05, docs/decisions.md.
const makeDoc = (text: string): Doc => ({
  doc_id: createHash('sha256').update(text, 'utf8').digest('hex').slice(0, 16),
  unit_id: 'unit-0',
  text,
})

// ===========================================================================
// THE ORACLE — human-authored, but not all from one sitting. The first three are lifted
// verbatim from docs/workflow.md step 5, where they appear as that document's own worked
// example. The fourth was stated by the human on 2026-08-05 to settle exact-offset
// resolution; it is recorded in docs/specs/anchor.md section 5B rather than in workflow.md.
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

  // This fixture is deliberately the adversarial one. The inserted prefix is exactly
  // 19 characters, so in the edited document a *different* occurrence of "water" lands
  // on precisely the bookmarked offsets 19-24. Comparing stored text at stored offsets
  // therefore SUCCEEDS here and hands back the wrong occurrence, silently — which is
  // how this hole was found. The content-hashed doc_id rejects the anchor on identity
  // before any text is compared, so the collision is unreachable. Keep the coincidence:
  // it is the case that text comparison alone gets wrong.
  test('returns null when the document has changed under the anchor', () => {
    const doc = makeDoc('water splits. then water recombines.')
    const anchor = createAnchor(doc, 19, 24)!
    const edited = makeDoc('NOTE: added later. water splits. then water recombines.')
    expect(resolveAnchor(edited, anchor)).toBeNull()
  })
})

// ===========================================================================
// THE RULINGS — stated by the human, encoded by agent. The first three were decided
// 2026-08-05; the last two on 2026-08-06, after a mutation run showed the original
// half-a-character rule was backwards in both directions. All five are recorded in
// docs/specs/anchor.md section 5.
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

  // Half a character is half a character whether or not the other half is still in
  // the document. This document ends mid-character, so the earlier boundary rule —
  // which only inspected the code unit *before* an offset — accepted it.
  test('refuses a span whose quote is not valid text on its own', () => {
    const truncated = makeDoc('wave \uD83D')
    expect(createAnchor(truncated, 5, 6)).toBeNull()
  })

  // The mirror of the above: a lone surrogate elsewhere in the document must not
  // make readable text beside it unanchorable.
  test('allows readable text that happens to follow a lone surrogate', () => {
    const doc = makeDoc('a\uD83Db')
    expect(resolveAnchor(doc, createAnchor(doc, 2, 3)!)).toEqual({ start: 2, end: 3 })
  })

  // Ruled 2026-08-06: the rule applies everywhere, not only where anchors are made.
  // A hand-built anchor arriving from storage, from IPC, or from a model that emits
  // spans reaches resolveAnchor without ever passing through createAnchor. On this
  // ordinary, well-formed document createAnchor(5, 6) is refused above; resolving the
  // same offsets must be refused too, or the two doors disagree and the broken half of
  // a character reaches the screen as a verbatim quote.
  test('refuses to resolve an anchor whose quote is not valid text on its own', () => {
    const doc = makeDoc('wave 👋 here')
    const handBuilt = {
      doc_id: doc.doc_id,
      unit_id: doc.unit_id,
      char_start: 5,
      char_end: 6,
      quote: '\uD83D',
    }
    expect(resolveAnchor(doc, handBuilt)).toBeNull()
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

  // Defensive. With content-hashed doc_ids this state cannot arise naturally — the same
  // doc_id implies the same text — so it is hand-built to exercise the guard directly.
  // A stored anchor could still be corrupt, or predate a format change.
  //
  // The quote must be exactly what the coerced slice returns, or this test pins nothing.
  // With a quote of 'quick' it still passed — but for a reason that did not depend on the
  // guard: the guard rejected it, and so would the quote comparison if the guard were
  // deleted, so the test could not tell the two apart. 'short'.slice(4, 9) is 't', which
  // makes the guard the only thing standing between this anchor and a resolution.
  test('offsets past the end of the document, on a hand-built anchor', () => {
    const short = makeDoc('short')
    const corrupt = {
      doc_id: short.doc_id,
      unit_id: short.unit_id,
      char_start: 4,
      char_end: 9,
      quote: 't',
    }
    expect(resolveAnchor(short, corrupt)).toBeNull()
  })

  // String.prototype.slice is total and coerces a negative index to count from the end,
  // so an anchor whose start is shifted down by exactly the document length slices back
  // to its own quote and verifies. Without the offset guard this resolves and returns a
  // negative start.
  test('a negative start does not resolve, even when the slice reproduces the quote', () => {
    const doc = makeDoc('the quick brown fox')
    const corrupt = {
      doc_id: doc.doc_id,
      unit_id: doc.unit_id,
      char_start: 4 - doc.text.length,
      char_end: 9,
      quote: 'quick',
    }
    expect(resolveAnchor(doc, corrupt)).toBeNull()
  })

  // The empty string is inside every document, so an empty quote verifies vacuously
  // rather than actually — the same reason createAnchor refuses a zero-length span.
  test('an empty quote does not resolve, wherever it claims to sit', () => {
    const doc = makeDoc('the quick brown fox')
    const corrupt = {
      doc_id: doc.doc_id,
      unit_id: doc.unit_id,
      char_start: 7,
      char_end: 7,
      quote: '',
    }
    expect(resolveAnchor(doc, corrupt)).toBeNull()
  })

  // A hand-built anchor whose quote is longer than the range it claims.
  test('quote disagreeing with its own offsets', () => {
    expect(resolveAnchor(doc, { ...anchor, quote: 'quick brown' })).toBeNull()
  })

  // Ruled 2026-08-06. resolveAnchor is the gate for anchors arriving from storage, from
  // IPC, or from a model — none of which are bound by the type system. A malformed one is
  // a null, not an error. This is the case that had no coverage at all, and a regression
  // slipped through it: asking a showability check of anchor.quote threw on every shape
  // below until it was asked of the slice instead.
  test('returns null for any malformed anchor, and never throws', () => {
    const shapes: unknown[] = [null, undefined, 42, ['a'], { length: 1 }, Symbol('q')]
    for (const quote of shapes) {
      const malformed = { ...anchor, quote } as unknown as Parameters<typeof resolveAnchor>[1]
      expect(resolveAnchor(doc, malformed)).toBeNull()
    }
    const { quote: _dropped, ...quoteless } = anchor
    expect(resolveAnchor(doc, quoteless as unknown as Parameters<typeof resolveAnchor>[1])).toBeNull()
  })

  // With the offset comparisons gone, the emptiness half of the showability rule is the
  // only thing stopping an inverted hand-built anchor resolving to a backwards Span. The
  // quote must be '' to pin that: any other quote is rejected by the comparison instead,
  // whatever the emptiness rule does, and the test would pass without testing it.
  test('an inverted hand-built anchor does not resolve', () => {
    expect(resolveAnchor(doc, { ...anchor, char_start: 9, char_end: 4, quote: '' })).toBeNull()
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
    'e\u0301', // decomposed — NFC-unstable, so a stray .normalize() becomes detectable
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
