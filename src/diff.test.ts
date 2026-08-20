/**
 * The tests for Diff. This part has a real oracle, so these are the strongest tests in the repo.
 *
 * Diff is plain code, so a test can state the whole answer. No model runs here, and no test needs
 * Ollama or a network. Rule 32 holds.
 *
 * These tests hold Diff to four contracts.
 *
 * 1. Diff reads ids and flags only. Rule 43 sets this. The scramblers replace every other field.
 *    `textsOf` and `mapTexts` walk the shape, so a new text field joins the guard on its own.
 * 2. Diff does not change the Check result it takes. `readonly` is a compile time mark only. The
 *    purity tests freeze the input, so a write throws. Check puts the user's real words in
 *    `Claim.text`, and Close prints them back as "You said ...". A write puts words in the user's
 *    mouth.
 * 3. Diff emits every contradiction, then every intrusion, then every omission. Rule 13 sets this.
 * 4. Diff keeps the source order inside one kind. Probe takes row 0, so this order decides the
 *    question the user gets. Rule 41 sets that.
 *
 * The generators cover the real ranges. A span offset reaches several thousand. A turn index
 * reaches several hundred. A failed reason reaches 200 characters, because a real reason from
 * `src/check.ts` reaches 57. A text holds a newline and a non ASCII character, because Check
 * slices a claim out of a newline joined transcript.
 */

import fc from 'fast-check'
import { describe, expect, test } from 'vitest'
import { diff } from './diff.js'
import type { CheckResult, Claim, DiffRow, Intrusion, Link, Span, Verdict } from './types.js'

// ── builders for the example tests ───────────────────────────────────────────────────────────

const span = (start: number, end: number): Span => ({ start, end })

const link = (id: string, covered: boolean): Link => ({
  id,
  cause: `cause of ${id}`,
  relation: 'makes',
  effect: `effect of ${id}`,
  covered,
  span: covered ? span(0, 4) : null,
})

const claim = (id: string, correct: boolean): Claim => ({
  id,
  text: `the claim ${id}`,
  correct,
  span: span(0, 4),
})

const intrusion = (id: string): Intrusion => ({ id, turnIndex: 1, text: `the child line ${id}` })

const checked = (parts: {
  mechanism?: readonly Link[]
  claims?: readonly Claim[]
  intrusions?: readonly Intrusion[]
  verdict?: Verdict | null
}): CheckResult => ({
  kind: 'checked',
  mechanism: parts.mechanism ?? [],
  claims: parts.claims ?? [],
  intrusions: parts.intrusions ?? [],
  verdict: parts.verdict ?? null,
})

// ── the arbitraries ──────────────────────────────────────────────────────────────────────────

// A small pool. The same id then appears as a claim id and as a link id, so the tests see the
// collision that a row id must survive. The pool holds 'x', 'x:y' and 'x:z' together, so an
// implementation that cuts the id at the first colon makes two rows with one id.
const idArb = fc.constantFrom('a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', '1', '2', 'x', 'x:y', 'x:z', '')

/**
 * A text. Check slices a claim out of a newline joined transcript, so a text can hold a newline.
 * The unit also holds a non ASCII character, because a user can say one.
 */
const textArb = fc.string({
  unit: fc.constantFrom('\n', ' ', 'a', 'b', 'Z', '.', "'", 'é', 'ß', '中', '—', '\t'),
  maxLength: 40,
  // Without this the default size caps the length near 10, and a real text is longer.
  size: 'max',
})

/** A span offset. Check counts characters of the whole joined transcript, so it gets large. */
const offsetArb = fc.integer({ min: 0, max: 5000 })

const spanArb: fc.Arbitrary<Span> = fc.record({ start: offsetArb, end: offsetArb })

/** Three of four rows are a finding. One kind then holds six or more rows in most cases. */
const mostlyFalse = fc.constantFrom(false, false, false, true)

const linkArb: fc.Arbitrary<Link> = fc.record({
  id: idArb,
  cause: textArb,
  relation: textArb,
  effect: textArb,
  covered: mostlyFalse,
  span: fc.option(spanArb, { nil: null }),
})

const claimArb: fc.Arbitrary<Claim> = fc.record({
  id: idArb,
  text: textArb,
  correct: mostlyFalse,
  span: spanArb,
})

const intrusionArb: fc.Arbitrary<Intrusion> = fc.record({
  id: idArb,
  turnIndex: fc.integer({ min: 0, max: 800 }),
  text: textArb,
})

/** A real row id. Probe writes the id of a Diff row here, so the generator writes one too. */
const rowIdArb: fc.Arbitrary<string> = fc.oneof(
  fc
    .tuple(fc.constantFrom('contradiction', 'intrusion', 'omission'), idArb)
    .map(([kind, id]) => `${kind}:${id}`),
  textArb,
)

const verdictArb: fc.Arbitrary<Verdict> = fc.record({ rowId: rowIdArb, supplied: fc.boolean() })

/** An id is unique inside one kind, which is what Check promises. */
const unique = <T extends { id: string }>(item: fc.Arbitrary<T>): fc.Arbitrary<T[]> =>
  fc.uniqueArray(item, { selector: (t) => t.id, maxLength: 12 })

const checkedArb: fc.Arbitrary<CheckResult> = fc
  .record({
    mechanism: unique(linkArb),
    claims: unique(claimArb),
    intrusions: unique(intrusionArb),
    verdict: fc.option(verdictArb, { nil: null }),
  })
  .map((r): CheckResult => ({ kind: 'checked', ...r }))

/** A real reason from `src/check.ts` reaches 57 characters. The generator reaches 200. */
const failedArb: fc.Arbitrary<CheckResult> = fc
  .string({ minLength: 0, maxLength: 200, size: 'max' })
  .map((reason): CheckResult => ({ kind: 'failed', reason }))

const resultArb: fc.Arbitrary<CheckResult> = fc.oneof(checkedArb, failedArb)

// ── the text walker ──────────────────────────────────────────────────────────────────────────

/**
 * The two keys that Diff may read as a string. Every other string in the shape is a text field,
 * and Diff must not read it. The walker below derives the guard from this set, so a new text
 * field in `types.ts` joins the guard with no edit here.
 */
const READABLE_KEYS = new Set(['id', 'kind'])

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/** Every text field of one Check result, in shape order. `Verdict.rowId` is one of them. */
const textsOf = (value: unknown): readonly string[] => {
  if (Array.isArray(value)) return value.flatMap(textsOf)
  if (!isRecord(value)) return []
  return Object.entries(value).flatMap(([key, inner]) => {
    if (READABLE_KEYS.has(key)) return []
    return typeof inner === 'string' ? [inner] : textsOf(inner)
  })
}

/** Replace every text field. Keep every id, every kind, every flag, every span, every index. */
const mapTexts = (value: unknown, replace: (text: string) => string): unknown => {
  if (Array.isArray(value)) return value.map((inner) => mapTexts(inner, replace))
  if (!isRecord(value)) return value
  return Object.fromEntries(
    Object.entries(value).map(([key, inner]) => {
      if (READABLE_KEYS.has(key)) return [key, inner]
      return [key, typeof inner === 'string' ? replace(inner) : mapTexts(inner, replace)]
    }),
  )
}

// ── the scramblers ───────────────────────────────────────────────────────────────────────────

/** Return a string that is not the original one. */
const differentFrom = (original: string, candidate: string): string =>
  candidate === original ? `${candidate}!` : candidate

const scrambleText = (c: CheckResult, noise: string): CheckResult =>
  mapTexts(c, (text) => differentFrom(text, noise)) as CheckResult

/** Replace every field that Diff must not read. Keep the ids and the two flags only. */
const scrambleEverythingButIdsAndFlags = (c: CheckResult, noise: string): CheckResult => {
  const t = scrambleText(c, noise)
  if (t.kind === 'failed') return t
  return {
    kind: 'checked',
    mechanism: t.mechanism.map((l) => ({ ...l, span: l.span === null ? span(7, 9) : null })),
    claims: t.claims.map((cl) => ({ ...cl, span: span(cl.span.start + 1, cl.span.end + 2) })),
    intrusions: t.intrusions.map((i) => ({ ...i, turnIndex: i.turnIndex + 1 })),
    // The verdict appears and disappears, and its row id names a real row on the way.
    verdict: t.verdict === null ? { rowId: `omission:${noise}`, supplied: true } : null,
  }
}

// ── the freezer ──────────────────────────────────────────────────────────────────────────────

/**
 * Freeze one value and everything under it. A write to a frozen object throws in strict mode, and
 * a module is always strict. A Diff that changes its argument then fails the test.
 */
const deepFreeze = <T>(value: T): T => {
  if (value !== null && typeof value === 'object') {
    for (const inner of Object.values(value as object)) deepFreeze(inner)
    Object.freeze(value)
  }
  return value
}

// ── the oracle helpers ───────────────────────────────────────────────────────────────────────

const expected = (c: CheckResult) =>
  c.kind === 'failed'
    ? { contradictions: 0, intrusions: 0, omissions: 0 }
    : {
        contradictions: c.claims.filter((cl) => !cl.correct).length,
        intrusions: c.intrusions.length,
        omissions: c.mechanism.filter((l) => !l.covered).length,
      }

/** The source ids of one kind, in the order the Check result gave. */
const sourceIdsOf = (c: CheckResult, kind: DiffRow['kind']): readonly string[] => {
  if (c.kind === 'failed') return []
  if (kind === 'contradiction') return c.claims.filter((cl) => !cl.correct).map((cl) => cl.id)
  if (kind === 'intrusion') return c.intrusions.map((i) => i.id)
  return c.mechanism.filter((l) => !l.covered).map((l) => l.id)
}

/** The source id that one row points at. */
const sourceIdOfRow = (row: DiffRow): string =>
  row.kind === 'contradiction'
    ? row.claimId
    : row.kind === 'intrusion'
      ? row.intrusionId
      : row.linkId

const indicesOf = (rows: readonly DiffRow[], kind: DiffRow['kind']): number[] =>
  rows.flatMap((r, i) => (r.kind === kind ? [i] : []))

const KINDS = ['contradiction', 'intrusion', 'omission'] as const

// ── the example tests ────────────────────────────────────────────────────────────────────────

describe('a failed Check result', () => {
  test('gives no rows', () => {
    expect(diff({ kind: 'failed', reason: 'the backend does not run' })).toEqual([])
  })

  test('gives no rows for a long reason', () => {
    const reason = 'the model answered with text that is not the JSON the prompt asked for'
    expect(diff({ kind: 'failed', reason })).toEqual([])
  })
})

describe('an empty Check result', () => {
  test('gives no rows', () => {
    expect(diff(checked({}))).toEqual([])
  })

  test('gives no rows when every claim is true and every link is covered', () => {
    const c = checked({
      mechanism: [link('L1', true), link('L2', true)],
      claims: [claim('C1', true)],
    })
    expect(diff(c)).toEqual([])
  })
})

describe('the arithmetic', () => {
  test('one false claim gives one contradiction row that names the claim', () => {
    const c = checked({ claims: [claim('C1', true), claim('C2', false)] })
    expect(diff(c)).toEqual([{ kind: 'contradiction', id: 'contradiction:C2', claimId: 'C2' }])
  })

  test('one intrusion gives one intrusion row that names the intrusion', () => {
    const c = checked({ intrusions: [intrusion('I1')] })
    expect(diff(c)).toEqual([{ kind: 'intrusion', id: 'intrusion:I1', intrusionId: 'I1' }])
  })

  test('one uncovered link gives one omission row that names the link', () => {
    const c = checked({ mechanism: [link('L1', true), link('L2', false)] })
    expect(diff(c)).toEqual([{ kind: 'omission', id: 'omission:L2', linkId: 'L2' }])
  })

  test('a claim with a large span still gives one row for a false claim only', () => {
    const c = checked({
      claims: [
        { id: 'C1', text: 'the first claim', correct: true, span: span(3100, 3140) },
        { id: 'C2', text: 'the second claim', correct: false, span: span(4000, 4020) },
      ],
    })
    expect(diff(c)).toEqual([{ kind: 'contradiction', id: 'contradiction:C2', claimId: 'C2' }])
  })

  test('an intrusion at a late turn still gives one row', () => {
    const c = checked({ intrusions: [{ id: 'I1', turnIndex: 640, text: 'the child line' }] })
    expect(diff(c)).toEqual([{ kind: 'intrusion', id: 'intrusion:I1', intrusionId: 'I1' }])
  })

  test('a covered link with a large span and a newline cause gives no row', () => {
    const c = checked({
      mechanism: [
        { ...link('L1', true), cause: 'the pump\nlifts the water', span: span(2400, 2460) },
        { ...link('L2', false), cause: 'the valve\ncloses' },
      ],
    })
    expect(diff(c)).toEqual([{ kind: 'omission', id: 'omission:L2', linkId: 'L2' }])
  })
})

describe('the order of the rows', () => {
  test('every contradiction comes first, then every intrusion, then every omission', () => {
    const c = checked({
      mechanism: [link('L1', false), link('L2', false)],
      claims: [claim('C1', false), claim('C2', false)],
      intrusions: [intrusion('I1'), intrusion('I2')],
    })
    expect(diff(c).map((r) => r.kind)).toEqual([
      'contradiction',
      'contradiction',
      'intrusion',
      'intrusion',
      'omission',
      'omission',
    ])
  })

  test('the rows of one kind keep the order the Check result gave', () => {
    const c = checked({
      mechanism: [link('L3', false), link('L1', false), link('L2', false)],
      claims: [claim('C2', false), claim('C1', false)],
      intrusions: [intrusion('I2'), intrusion('I1')],
    })
    expect(diff(c).map((r) => r.id)).toEqual([
      'contradiction:C2',
      'contradiction:C1',
      'intrusion:I2',
      'intrusion:I1',
      'omission:L3',
      'omission:L1',
      'omission:L2',
    ])
  })

  test('six rows of one kind keep the order the Check result gave', () => {
    const ids = ['L6', 'L5', 'L4', 'L3', 'L2', 'L1']
    const c = checked({ mechanism: ids.map((id) => link(id, false)) })
    expect(diff(c).map((r) => r.id)).toEqual(ids.map((id) => `omission:${id}`))
  })

  test('seven rows of each kind keep the order the Check result gave', () => {
    const ids = ['7', '6', '5', '4', '3', '2', '1']
    const c = checked({
      mechanism: ids.map((id) => link(`L${id}`, false)),
      claims: ids.map((id) => claim(`C${id}`, false)),
      intrusions: ids.map((id) => intrusion(`I${id}`)),
    })
    expect(diff(c).map((r) => r.id)).toEqual([
      ...ids.map((id) => `contradiction:C${id}`),
      ...ids.map((id) => `intrusion:I${id}`),
      ...ids.map((id) => `omission:L${id}`),
    ])
  })
})

describe('the row id', () => {
  test('the same source id in two kinds gives two different row ids', () => {
    const c = checked({ mechanism: [link('X', false)], claims: [claim('X', false)] })
    expect(diff(c).map((r) => r.id)).toEqual(['contradiction:X', 'omission:X'])
  })

  test('two source ids that share the part before a colon give two different row ids', () => {
    const c = checked({ claims: [claim('x', false), claim('x:y', false)] })
    expect(diff(c).map((r) => r.id)).toEqual(['contradiction:x', 'contradiction:x:y'])
  })

  test('the id stays the same when the words change', () => {
    const one = checked({ claims: [claim('C1', false)] })
    const two = checked({
      claims: [{ id: 'C1', text: 'other words', correct: false, span: span(9, 20) }],
    })
    expect(diff(one)).toEqual(diff(two))
  })
})

describe('the verdict', () => {
  test('a verdict that names an omission row does not change the rows', () => {
    const parts = { mechanism: [link('L2', false)], claims: [claim('C1', false)] }
    const none = checked(parts)
    const named = checked({ ...parts, verdict: { rowId: 'omission:L2', supplied: true } })
    expect(diff(named)).toEqual(diff(none))
    expect(diff(named)).toEqual([
      { kind: 'contradiction', id: 'contradiction:C1', claimId: 'C1' },
      { kind: 'omission', id: 'omission:L2', linkId: 'L2' },
    ])
  })

  test('a verdict that names a contradiction row does not change the rows', () => {
    const parts = { mechanism: [link('L2', false)], claims: [claim('C1', false)] }
    const one = checked({ ...parts, verdict: { rowId: 'contradiction:C1', supplied: false } })
    const two = checked({ ...parts, verdict: { rowId: 'omission:L2', supplied: true } })
    expect(diff(one)).toEqual(diff(two))
  })
})

describe('the input', () => {
  test('Diff does not write to the Check result it takes', () => {
    const c = checked({
      mechanism: [link('L1', false), link('L2', true)],
      claims: [claim('C1', false), claim('C2', true)],
      intrusions: [intrusion('I1')],
      verdict: { rowId: 'omission:L1', supplied: true },
    })
    const before = structuredClone(c)
    expect(() => diff(deepFreeze(c))).not.toThrow()
    expect(c).toEqual(before)
  })

  test('Diff leaves the claim text the user said', () => {
    const c = checked({ claims: [claim('C1', false)] })
    const frozen = deepFreeze(c)
    diff(frozen)
    expect(frozen.kind === 'checked' && frozen.claims[0]?.text).toBe('the claim C1')
  })
})

// ── the property tests ───────────────────────────────────────────────────────────────────────

describe('the properties', () => {
  test('CHANGING ANY TEXT NEVER CHANGES THE ROWS', () => {
    fc.assert(
      fc.property(resultArb, textArb, (c, noise) => {
        const scrambled = scrambleText(c, noise)
        // The guard. The test must not pass because the scrambler changed nothing.
        const before = textsOf(c)
        const after = textsOf(scrambled)
        expect(after).toHaveLength(before.length)
        before.forEach((s, i) => expect(after[i]).not.toBe(s))

        expect(diff(scrambled)).toEqual(diff(c))
      }),
    )
  })

  test('changing every field except the ids and the two flags never changes the rows', () => {
    fc.assert(
      fc.property(resultArb, textArb, (c, noise) => {
        expect(diff(scrambleEverythingButIdsAndFlags(c, noise))).toEqual(diff(c))
      }),
    )
  })

  test('DIFF NEVER WRITES TO THE CHECK RESULT IT TAKES', () => {
    fc.assert(
      fc.property(resultArb, (c) => {
        const before = structuredClone(c)
        const frozen = deepFreeze(structuredClone(c))
        expect(() => diff(frozen)).not.toThrow()
        expect(frozen).toEqual(before)
      }),
    )
  })

  test('the row count equals the false claims plus the intrusions plus the uncovered links', () => {
    fc.assert(
      fc.property(resultArb, (c) => {
        const e = expected(c)
        expect(diff(c)).toHaveLength(e.contradictions + e.intrusions + e.omissions)
      }),
    )
  })

  test('the count of each kind of row equals the count of its source', () => {
    fc.assert(
      fc.property(resultArb, (c) => {
        const rows = diff(c)
        const e = expected(c)
        expect(indicesOf(rows, 'contradiction')).toHaveLength(e.contradictions)
        expect(indicesOf(rows, 'intrusion')).toHaveLength(e.intrusions)
        expect(indicesOf(rows, 'omission')).toHaveLength(e.omissions)
      }),
    )
  })

  test('every contradiction index is below every intrusion index and every omission index', () => {
    fc.assert(
      fc.property(resultArb, (c) => {
        const rows = diff(c)
        const cs = indicesOf(rows, 'contradiction')
        const is = indicesOf(rows, 'intrusion')
        const os = indicesOf(rows, 'omission')
        expect(Math.max(-1, ...cs)).toBeLessThan(Math.min(Infinity, ...is, ...os))
        expect(Math.max(-1, ...is)).toBeLessThan(Math.min(Infinity, ...os))
      }),
    )
  })

  test('INSIDE ONE KIND THE ROWS KEEP THE ORDER OF THEIR SOURCES', () => {
    fc.assert(
      fc.property(resultArb, (c) => {
        const rows = diff(c)
        for (const kind of KINDS) {
          const got = rows.filter((r) => r.kind === kind).map(sourceIdOfRow)
          expect(got).toEqual(sourceIdsOf(c, kind))
        }
      }),
    )
  })

  test('Diff is deterministic, so the same input gives the same output', () => {
    fc.assert(
      fc.property(resultArb, (c) => {
        expect(diff(c)).toEqual(diff(c))
      }),
    )
  })

  test('every row id is unique', () => {
    fc.assert(
      fc.property(checkedArb, (c) => {
        const ids = diff(c).map((r) => r.id)
        expect(new Set(ids).size).toBe(ids.length)
      }),
    )
  })

  test('every row points at a source that the Check result holds', () => {
    fc.assert(
      fc.property(checkedArb, (c) => {
        if (c.kind === 'failed') return
        const falseClaims = c.claims.filter((cl) => !cl.correct).map((cl) => cl.id)
        const intrusionIds = c.intrusions.map((i) => i.id)
        const uncovered = c.mechanism.filter((l) => !l.covered).map((l) => l.id)
        for (const row of diff(c)) {
          if (row.kind === 'contradiction') expect(falseClaims).toContain(row.claimId)
          if (row.kind === 'intrusion') expect(intrusionIds).toContain(row.intrusionId)
          if (row.kind === 'omission') expect(uncovered).toContain(row.linkId)
        }
      }),
    )
  })

  test('a true claim and a covered link never give a row', () => {
    fc.assert(
      fc.property(checkedArb, (c) => {
        if (c.kind === 'failed') return
        const rows = diff(c)
        const trueClaims = c.claims.filter((cl) => cl.correct).map((cl) => cl.id)
        const covered = c.mechanism.filter((l) => l.covered).map((l) => l.id)
        for (const row of rows) {
          if (row.kind === 'contradiction') expect(trueClaims).not.toContain(row.claimId)
          if (row.kind === 'omission') expect(covered).not.toContain(row.linkId)
        }
      }),
    )
  })

  test('a failed Check result always gives no rows', () => {
    fc.assert(
      fc.property(failedArb, (c) => {
        expect(diff(c)).toEqual([])
      }),
    )
  })

  /**
   * THE ROW ID NAMES ITS OWN SOURCE.
   *
   * An offence agent wrote a diff that kept every row, kept the order, and kept the back pointer,
   * and handed the ids out in sorted order instead. The id set stayed correct and every id stayed
   * unique, so nothing caught it. It passed 33 of 33 and the whole 125 test suite. The desync fired
   * 598 times in one clean run.
   *
   * Uniqueness does not pin identity. A permutation is unique. Only this test ties the id of a row
   * to the source that row points at.
   */
  test('EVERY ROW ID NAMES THE SOURCE THAT ROW POINTS AT', () => {
    fc.assert(
      fc.property(resultArb, (c) => {
        for (const row of diff(c)) {
          expect(row.id).toBe(`${row.kind}:${sourceIdOfRow(row)}`)
        }
      }),
    )
  })
})
