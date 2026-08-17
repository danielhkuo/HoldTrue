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
  // Each of these bare forms is in the tally's STOP list. The contracted form has to reach it.
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
  ])('%s -> %s', (given, want) => {
    expect(stem(given)).toBe(want)
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
    expect(stem('exchange')).toBe('exchange')
  })
})

/**
 * RECORDING A DEFECT, NOT ENDORSING ONE. Found 2026-08-16 by the first assertion ever written
 * against this module.
 *
 * The `-ing` rule fires on any word of five or more characters ending in those letters, whether or
 * not they are a verb inflection. So `thing` becomes `th`, `during` becomes `dur` and `everything`
 * becomes `everyth`. It is applied consistently, so the two callers agree with each other and
 * nothing is silently under-reported — which is why this is pinned rather than fixed here.
 *
 * Fixing it changes node identity in Cohere, so it is `cohere.md`'s to rule on and not a defect to
 * quietly correct inside a test file. These assertions exist so that when somebody does rule on it,
 * the change is visible instead of arriving as a mystery diff in the false-question rate.
 */
describe('known over-stripping, pinned so a change to it is deliberate', () => {
  test.each([
    ['thing', 'th'],
    ['during', 'dur'],
    ['everything', 'everyth'],
  ])('%s currently reduces to %s', (given, now) => {
    expect(stem(given)).toBe(now)
  })

  test('a four-letter word escapes it, so the rule is length-dependent as well as wrong', () => {
    expect(stem('sing')).toBe('sing')
    expect(stem('ring')).toBe('ring')
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
