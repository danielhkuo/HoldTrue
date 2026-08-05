import { describe, expect, test } from 'vitest'
import fc from 'fast-check'
import { createAnchor, resolveAnchor, type Doc } from './anchor.js'

// Fixture. Agent-written per AGENTS.md "Who writes what": setup, teardown and fixtures
// are mine, assertions are not. unit_id is opaque here on purpose — see docs/specs/anchor.md,
// section 5A, and issue #21.
const makeDoc = (text: string): Doc => ({
  doc_id: 'doc-under-test',
  unit_id: 'unit-0',
  text,
})

// ---------------------------------------------------------------------------
// THE ORACLE — human-authored. Lifted verbatim from docs/workflow.md step 5.
//
//   "An anchor created from a span resolves back to exactly that span, in the
//    same document, every time."
//
// Do not edit these assertions. If one cannot be made to pass, say why; changing
// it is the step-7 failure the pre-commit hook exists to catch.
// ---------------------------------------------------------------------------

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
})

// ---------------------------------------------------------------------------
// GENERATOR — agent-written, per workflow.md step 5: "Read the generator, not
// the assertion." The hard cases below are the list from docs/specs/anchor.md §6.
// Verify it actually produces them before trusting the property (see the sample
// dump at the bottom of this file).
// ---------------------------------------------------------------------------

/** Text fragments chosen so the generator cannot drift into plain ASCII. */
const hardFragments = fc.oneof(
  fc.string({ minLength: 0, maxLength: 8 }),
  fc.constantFrom(
    '👋', '🧬', '👨‍👩‍👧‍👦', // astral plane, and a ZWJ sequence that is 11 code units
    'é', 'à́', // combining marks
    'water', 'water', // repeated substrings, so occurrence identity is exercised
    '\r\n', '\n', // CRLF vs LF
    '  ', '\t',
    'β', 'Ω', '漢字',
  ),
)

const arbitraryDocAndSpan = () =>
  fc
    .array(hardFragments, { minLength: 0, maxLength: 12 })
    .map(parts => parts.join(''))
    .chain(text =>
      fc
        .tuple(fc.nat(text.length), fc.nat(text.length))
        .map(([a, b]) => ({
          doc: makeDoc(text),
          span: { start: Math.min(a, b), end: Math.max(a, b) },
        })),
    )

describe('the invariant', () => {
  test('any anchor round-trips to the span it came from', () => {
    fc.assert(
      fc.property(arbitraryDocAndSpan(), ({ doc, span }) => {
        const anchor = createAnchor(doc, span.start, span.end)
        expect(resolveAnchor(doc, anchor!)).toEqual(span)
      }),
      { numRuns: 1000 },
    )
  })
})

// ---------------------------------------------------------------------------
// Generator self-check. Not a test of Anchor — a test that the generator above
// is not quietly producing plain ASCII. workflow.md step 5: "Look at them. If
// they are all plain ASCII, the generator is not doing its job."
// ---------------------------------------------------------------------------

describe('the generator itself', () => {
  test('produces astral-plane, combining and CRLF cases', () => {
    const samples = fc.sample(arbitraryDocAndSpan(), 200).map(s => s.doc.text)
    const hasAstral = samples.some(t => /[\u{10000}-\u{10FFFF}]/u.test(t))
    const hasCombining = samples.some(t => /[̀-ͯ]/u.test(t))
    const hasCRLF = samples.some(t => t.includes('\r\n'))
    const hasRepeat = samples.some(t => (t.match(/water/g) ?? []).length > 1)
    expect({ hasAstral, hasCombining, hasCRLF, hasRepeat }).toEqual({
      hasAstral: true,
      hasCombining: true,
      hasCRLF: true,
      hasRepeat: true,
    })
  })
})
