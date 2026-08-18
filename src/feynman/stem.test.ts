/**
 * The oracle for `stem`, and for the clitic defect it was missing until 2026-08-16.
 *
 * WHAT CORRECT MEANS. Two mentions of one word reduce to one root when they differ only by
 * inflection, by a contraction, or by a possessive — and never when they differ by negation.
 *
 * THE INVARIANT, in plain words. Stripping may only remove grammar, never meaning. A possessive
 * and its bare noun are the same thing, so they share a root. An affirmative and its negation are
 * opposite things, so they must not.
 *
 * PROVENANCE, because it changes how much this file is worth. **Written by an agent, on
 * 2026-08-16, after the owner said he would no longer write assertions and would hand back test
 * results instead.** That is a deliberate change to the rule in `AGENTS.md` and `docs/workflow.md`,
 * made by the person the rule protects, and it is recorded here rather than left silent — the same
 * way `tally.test.ts` records that only its example 1 is the owner's. What the rule was buying is
 * in `docs/decisions.md` under Workflow: agents writing their own tests produce tests that pass by
 * construction, at a measured 24-point gap on SWE-Bench Verified. The cover for this file is
 * therefore mutation and the red team, not the assertions below.
 *
 * WHY IT EXISTS. `TOKEN` keeps the apostrophe, so `it's` reached `stem` whole, the plural rule took
 * the trailing `s`, and it returned `it'` — a root matching nothing. Two callers broke on it: the
 * tally wrote `i'm` and `that's` into the ledger as words the child introduced, and Cohere read
 * `the yeast's` and `the yeast` as two nodes and raised a false `dangling` and `rootless` pair on a
 * chain that closed. 41 tally tests and a 96.67% mutation score were green throughout.
 */

import { describe, expect, test } from 'vitest'
import { stem } from './stem.js'
import { asDoc, type ExtractResult } from './extract.js'
import { tallyIntroduced } from './tally.js'

const wordsFrom = (line: string, transcript: string): readonly string[] => {
  const said: ExtractResult = {
    kind: 'extraction',
    extraction: { doc: asDoc(transcript), links: [], sentences: [] },
  }
  return tallyIntroduced(line, said, [], transcript)
    .filter(i => i.kind === 'word')
    .map(i => (i as { readonly word: string }).word)
}

describe('a contraction reduces to the word it contracts', () => {
  // The property that matters is AGREEMENT with the bare form, not a particular literal. Asserting
  // literals here is what broke on 2026-08-16 when a stem-final `e` rule took `there's` to `ther`:
  // the contraction and its bare form still agreed, so nothing was actually wrong with the pairing.
  test.each([
    ["i'm", 'i'],
    ["it's", 'it'],
    ["that's", 'that'],
    ["what's", 'what'],
    ["there's", 'there'],
    ["they're", 'they'],
    ["we've", 'we'],
    ["he'd", 'he'],
    ["i'll", 'i'],
  ])('%s agrees with %s', (contracted, bare) => {
    expect(stem(contracted)).toBe(stem(bare))
  })

  test('and every one of them is filtered out of the ledger', () => {
    // The consequence that is actually load-bearing, asserted at the seam it matters at.
    const line = "i'm on about that, and it's what there's — they're all of it, we've had it."
    expect(wordsFrom(line, 'the flapper lifts.')).toEqual([])
  })

  test('a curly apostrophe is the same character for this purpose', () => {
    expect(stem('i’m')).toBe('i')
    expect(stem('it’s')).toBe('it')
  })
})

describe('a possessive is the same concept as its bare noun', () => {
  test("yeast's and yeast share a root", () => {
    expect(stem("yeast's")).toBe('yeast')
    expect(stem("yeast's")).toBe(stem('yeast'))
  })

  test('a plural possessive reduces through both rules', () => {
    expect(stem("yeasts'")).toBe('yeast')
  })

  test('the concept survives in both directions', () => {
    // You said the possessive; the child says the bare noun.
    expect(wordsFrom('so the yeast makes gas?', "the yeast's job is to eat sugar.")).not.toContain('yeast')
    // You said the bare noun; the child says the possessive.
    expect(wordsFrom("so the yeast's gas is trapped?", 'the yeast eats the sugar.')).not.toContain("yeast's")
  })
})

describe('negation is never stripped', () => {
  // tally.ts keeps negation out of STOP on purpose: a child that negates your chain is what the
  // ledger must not lose in silence. Reducing doesn't to does would put it in STOP and delete it.
  test.each(["doesn't", "don't", "isn't", "can't", "won't", "ain't", 'doesn’t'])('%s survives whole', given => {
    expect(stem(given)).toBe(given)
  })

  test('a negation never collapses into its affirmative', () => {
    expect(stem("doesn't")).not.toBe(stem('does'))
    expect(stem("isn't")).not.toBe(stem('is'))
  })

  test('the ledger still records a negating child', () => {
    expect(wordsFrom("but the yeast doesn't eat sugar?", 'the yeast eats the sugar.')).toContain("doesn't")
  })
})

describe('inflection stripping is unchanged', () => {
  test.each([
    ['boxes', 'box'],
    ['flies', 'fly'],
    ['lifting', 'lift'],
    ['lifted', 'lift'],
  ])('%s -> %s', (given, want) => {
    expect(stem(given)).toBe(want)
  })

  test('a plural and its singular share a root', () => {
    // The header's claim, and the thing that actually matters. What that shared root IS, is the
    // subject of the block below.
    expect(stem('things')).toBe(stem('thing'))
    expect(stem('flappers')).toBe(stem('flapper'))
  })

  test.each(['glass', 'its', 'flapper'])('%s is left alone', given => {
    expect(stem(given)).toBe(given)
  })

  test('the -es rule reads the end of the word, not the middle of it', () => {
    // `assessment` carries `sses` in the middle. Unanchored, the rule fires and returns
    // `assessme`. Found by a surviving mutant, 2026-08-16.
    expect(stem('assessment')).toBe('assessment')
    expect(stem('chessboard')).toBe('chessboard')
  })
})

/**
 * THE E-FINAL VERB CLASS. Added 2026-08-16 after an audit found the first version of this file
 * blind to it: every example in the block above has a consonant-final stem, so `lifting -> lift`
 * passed and the whole class went untested.
 *
 * English drops a stem-final `e` before `-ing` and `-ed`. Untreated, `move` and `moves` land on
 * `move` while `moving` and `moved` land on `mov`, so one verb is two nodes — and Cohere raises a
 * `dangling` and a `rootless` across the split. This repo's entire subject matter is things that
 * close, move, press and space out, so it is the worst possible class to be wrong about.
 */
describe('a verb and its inflections are one node, e-final included', () => {
  test.each([
    ['move', 'moves', 'moving', 'moved'],
    ['close', 'closes', 'closing', 'closed'],
    ['file', 'files', 'filing', 'filed'],
    ['space', 'spaces', 'spacing', 'spaced'],
  ])('%s / %s / %s / %s agree', (base, plural, ing, ed) => {
    const root = stem(base)
    expect(stem(plural)).toBe(root)
    expect(stem(ing)).toBe(root)
    expect(stem(ed)).toBe(root)
  })

  test('the consonant-final family still agrees, unchanged', () => {
    expect(stem('lifts')).toBe(stem('lift'))
    expect(stem('lifting')).toBe(stem('lift'))
    expect(stem('lifted')).toBe(stem('lift'))
  })

  test('a chain that closes on one verb raises nothing', () => {
    // The concrete case the audit named: "the flapper closes the valve. the valve closing stops
    // the flow." `closes` against `closing` used to be two concepts.
    expect(stem('closes')).toBe(stem('closing'))
  })
})

/**
 * The verb rules now require a remainder that still has a vowel in it, so `thing` keeps its
 * letters. It used to reduce to `th`, which collided with nothing today but sat one determiner
 * away from `the`. Pinned so a change is deliberate rather than a mystery.
 */
describe('a verb ending is only stripped when something real is left', () => {
  test.each([
    ['thing', 'thing'],
    ['sing', 'sing'],
    ['ring', 'ring'],
    ['the', 'the'],
  ])('%s stays %s', (given, want) => {
    expect(stem(given)).toBe(want)
  })

  test('a remainder with no vowel in it is not a word, so nothing is stripped', () => {
    // `string` -> `str` is long enough to pass the length floor and is not a stem. The vowel
    // check is the only thing standing between it and `str`.
    expect(stem('string')).toBe('string')
    expect(stem('strings')).toBe(stem('string'))
  })

  test('still over-strips where a vowel survives, and this is not fixed', () => {
    // `during -> dur` and `everything -> everyth`. Consistent across both callers, and the tally
    // catches `during` through its bare-word stop-list fallback. Recorded, not endorsed.
    expect(stem('during')).toBe('dur')
    expect(stem('everything')).toBe('everyth')
  })
})

describe('the line that started this', () => {
  const TRANSCRIPT = 'when you push the handle down that pulls the chain and the chain lifts the flapper.'

  test('a child saying it is lost introduces no pronoun', () => {
    const words = wordsFrom("I'm lost, what is the flapper for?", TRANSCRIPT)
    expect(words).not.toContain("i'm")
    expect(words).not.toContain('i')
  })

  test('a line of nothing but function words introduces only its negation', () => {
    // Every token here is in STOP once the clitic is stripped, except the negation, which is kept
    // out of STOP deliberately and must therefore survive.
    expect(wordsFrom("so it's that, isn't it? that's what I'm on about.", TRANSCRIPT)).toEqual(["isn't"])
  })

  test('a real content word still comes through', () => {
    expect(wordsFrom('wait, is that like a pump?', TRANSCRIPT)).toContain('pump')
  })
})
