/**
 * The oracle for `tallyIntroduced`, from docs/specs/child-speech.md section 6.
 *
 * WHAT CORRECT MEANS. An item comes back for every link in the child's line that your graph
 * does not already hold, for every content word in that line you never said, and for a turn
 * the model could not read at all — matching two mentions when one's stemmed words are a
 * subset of the other's — and for nothing else.
 *
 * THE INVARIANT. The tally never returns an item for something you said, and never stays
 * silent about something you did not. Both halves generate: build the child's line out of
 * your own graph and nothing comes back; put one unsaid thing in it and that thing is named.
 * The input is the ground truth, so no gold labels exist and none are needed.
 *
 * PROVENANCE, because it changes how much this file is worth. Example 1 is the owner's.
 * Everything else was written by an agent on 2026-08-12 after he delegated it. The workflow
 * puts the oracle on the human because an agent writing both the standard and the code
 * produces code that passes by construction — Anchor shipped 23 green tests around a real
 * defect that way. The red team at step 6 and mutation at step 9 are the cover for it.
 */

import { describe, expect, test } from 'vitest'
import { createAnchor, type Doc } from '../index/anchor.js'
import { asDoc, type ExtractResult } from './extract.js'
import type { Link, Relation } from './validate.js'
import { tallyIntroduced, turn, type Introduced } from './tally.js'

// ---- fixtures ------------------------------------------------------------------------

/** A link anchored into `text`. Throws rather than returning null: a fixture that cannot
 *  anchor is a broken fixture, and a silent null would test the wrong thing. */
const linkIn = (text: string, cause: string, effect: string, relation: Relation = 'causes'): Link => {
  const doc: Doc = asDoc(text)
  const c = doc.text.indexOf(cause)
  const e = doc.text.indexOf(effect)
  if (c < 0 || e < 0) throw new Error(`fixture: "${cause}" or "${effect}" is not in "${text}"`)
  const cause_a = createAnchor(doc, c, c + cause.length)
  const effect_a = createAnchor(doc, e, e + effect.length)
  const whole = createAnchor(doc, 0, doc.text.length)
  if (cause_a === null || effect_a === null || whole === null) throw new Error('fixture: no anchor')
  return { cause: cause_a, effect: effect_a, relation, sentence: whole }
}

/** What Extract made of the child's line. */
const read = (line: string, links: readonly Link[] = []): ExtractResult => {
  const doc = asDoc(line)
  const whole = createAnchor(doc, 0, doc.text.length)
  if (whole === null) throw new Error('fixture: no anchor')
  return { kind: 'extraction', extraction: { doc, links, sentences: [{ anchor: whole, dropped: 0 }] } }
}

const unreadable = (reason: string): ExtractResult => ({ kind: 'unavailable', reason })

const words = (items: readonly Introduced[]): readonly string[] =>
  items.flatMap(i => (i.kind === 'word' ? [i.word] : []))

const links = (items: readonly Introduced[]): readonly Introduced[] => items.filter(i => i.kind === 'link')

/** The toilet explanation from demo.ts, as a graph. Two sentences in. */
const YOURS = 'when you push the handle down that pulls the chain and the chain lifts the flapper. the flapper lifting lets the tank water rush into the bowl.'
const GRAPH: readonly Link[] = [
  linkIn(YOURS, 'when you push the handle down', 'pulls the chain'),
  linkIn(YOURS, 'the chain', 'lifts the flapper'),
  linkIn(YOURS, 'the flapper lifting', 'the tank water rush into the bowl', 'enables'),
]

// ---- the four oracle examples --------------------------------------------------------

describe('the oracle', () => {
  // Example 1. The owner's, answered 2026-08-12. The child says your link back in its own
  // words. "pushing the handle" sits inside "when you push the handle down", so nothing here
  // came from anywhere but you.
  test('example 1: the child says back something you did say', () => {
    const line = 'so pushing the handle pulls the chain?'
    const items = tallyIntroduced(line, read(line, [linkIn(line, 'pushing the handle', 'pulls the chain')]), GRAPH)
    expect(items).toEqual([])
  })

  // Example 2. The reversed chain. One link, and the three words inside it, each marked as
  // contained so that anything counting introductions counts one.
  test('example 2: the reversed chain is one link and three contained words', () => {
    const line = 'so the toilet fills up after it empties?'
    const items = tallyIntroduced(line, read(line, [linkIn(line, 'it empties', 'the toilet fills up')]), GRAPH)

    expect(links(items)).toHaveLength(1)
    expect(items).toContainEqual({
      kind: 'link',
      cause: 'it empties',
      effect: 'the toilet fills up',
      relation: 'causes',
    })

    expect([...words(items)].sort()).toEqual(['empties', 'fills', 'toilet'])
    for (const item of items) {
      if (item.kind === 'word') expect(item.within).toBe('it empties')
    }
  })

  // Example 3. A new word and no link at all. Extract returns nothing because the line
  // asserts nothing, and ruling 9 says an empty link list is not an `unread`.
  test('example 3: a new word with no link', () => {
    const line = 'wait, is that like a pump?'
    const items = tallyIntroduced(line, read(line, []), GRAPH)

    expect(items).toEqual([{ kind: 'word', word: 'pump' }])
  })

  // Example 4a. The child spoke and the model could not read the line. The word check never
  // needed a model, so it still runs.
  test('example 4a: unreadable turn keeps the word check', () => {
    const line = 'so the toilet fills up after it empties?'
    const items = tallyIntroduced(line, unreadable('no answer from the model'), GRAPH)

    expect(items).toContainEqual({ kind: 'unread', reason: 'no answer from the model' })
    expect(items.filter(i => i.kind === 'unread')).toHaveLength(1)
    expect([...words(items)].sort()).toEqual(['empties', 'fills', 'toilet'])
    for (const item of items) {
      if (item.kind === 'word') expect(item.within).toBeUndefined()
    }
  })

  // Example 4b. One model serves both calls, so the child never spoke. `turn` maps that onto
  // a defined result and the empty `child` is the record of the silence.
  test('example 4b: a silent child records the silence and owes nothing', () => {
    const built = turn('the flapper lifting lets the water rush in.', { kind: 'silent', reason: 'model unreachable' }, [])

    expect(built.child).toBe('')
    expect(built.introduced).toEqual([])
    expect(built.you).toBe('the flapper lifting lets the water rush in.')
  })
})

// ---- the invariant, both halves ------------------------------------------------------

describe('the invariant', () => {
  // Half one: never an item for something you said. Every phrase in the line comes out of
  // your own graph, so nothing may come back — whatever shape the line takes.
  test('a line built only from your graph returns nothing', () => {
    const cases: readonly (readonly [string, Link])[] = [
      ['the chain lifts the flapper', GRAPH[1]!],
      ['pushing the handle pulls the chain', GRAPH[0]!],
      ['the flapper lifting lets the tank water rush into the bowl', GRAPH[2]!],
      ['so the chain lifts the flapper then?', GRAPH[1]!],
      ['the flapper, lifting, and the tank water rush into the bowl', GRAPH[2]!],
    ]

    for (const [line, source] of cases) {
      const echoed = linkIn(line, findable(line, source.cause.quote), findable(line, source.effect.quote), source.relation)
      const items = tallyIntroduced(line, read(line, [echoed]), GRAPH)
      expect(items, `"${line}" is made of your own words`).toEqual([])
    }
  })

  // Half two: never silent about something you did not say. One unsaid word is planted in an
  // otherwise-echoed line, and it must be named.
  test('one planted word is always named', () => {
    const planted = ['siphon', 'gasket', 'ballcock', 'overflow', 'sewer']

    for (const word of planted) {
      const line = `the chain lifts the flapper and the ${word} too`
      const items = tallyIntroduced(line, read(line, []), GRAPH)
      expect(words(items), `"${word}" is not in your transcript`).toContain(word)
    }
  })

  // Half two again, at the link level. Two concepts you did say, joined in a way you never did.
  // Red-team hole 5: the row must be the child's words. An implementation that renames a row
  // into your graph's phrasing — for a stable key across turns — hands Supply your own sentence
  // to check while the child's claim goes unrecorded.
  test('a link between your own concepts that you never stated is named', () => {
    const line = 'so the handle lifts the flapper?'
    const items = tallyIntroduced(line, read(line, [linkIn(line, 'the handle', 'lifts the flapper')]), GRAPH)

    expect(links(items)).toEqual([
      { kind: 'link', cause: 'the handle', effect: 'lifts the flapper', relation: 'causes' },
    ])
  })

  // Ruling 7's other half: the same two concepts with a relation you never used.
  test('a relation you never used between your own concepts is named', () => {
    const line = 'so the flapper lifting stops the tank water rush into the bowl?'
    const stated = linkIn(line, 'the flapper lifting', 'the tank water rush into the bowl', 'prevents')
    const items = tallyIntroduced(line, read(line, [stated]), GRAPH)

    expect(links(items)).toEqual([
      {
        kind: 'link',
        cause: 'the flapper lifting',
        effect: 'the tank water rush into the bowl',
        relation: 'prevents',
      },
    ])
  })

  // Red-team hole 9, and it was a defect in this file rather than a gap in it. `lets` is in your
  // transcript and in no cause or effect quote — it rides on the sentence anchor. The old test
  // could pass either by reading that anchor, which is right, or by a stop list happening to
  // hold `lets`, which is luck. Section 3 now says the sentence anchor is fair game.
  test('a word you said only in the sentence, never inside a link, is still yours', () => {
    const line = 'so the flapper lifting lets the sewer fill?'
    const items = tallyIntroduced(line, read(line, []), GRAPH)

    expect(words(items)).not.toContain('lets')
    expect(words(items)).toContain('sewer')
  })
})

// ---- what mutation found, 2026-08-12 -------------------------------------------------

// Twenty-six of forty-three surviving mutants sat in the stemmer, which is ruling 14's whole
// mechanism and which nothing exercised directly: the oracle's own words happen to miss every
// suffix rule but one. These are behavioural — they go through the tally, not around it — and
// each one names an inflection that changes whether a row is written.
describe('inflection, which is ruling 14 doing its job', () => {
  const noNoteFor = (line: string, word: string): void => {
    const items = tallyIntroduced(line, read(line, []), GRAPH)
    expect(words(items), `"${word}" is your own word in another form`).not.toContain(word)
  }

  test('a plural of your word is your word', () => {
    noNoteFor('so the chains lift the flapper?', 'chains')
  })

  test('an -es after a sibilant is stripped, not just the -s', () => {
    // You said "rush". Strip only the -s and you get "rushe", which matches nothing, and the
    // child gets charged with a word you said two sentences ago.
    noNoteFor('so the water rushes into the bowl?', 'rushes')
  })

  test('a past tense of your word is your word', () => {
    noNoteFor('so the chain lifted the flapper?', 'lifted')
  })

  test('a gerund of your word is your word', () => {
    noNoteFor('so the chain is lifting the flapper?', 'lifting')
  })

  test('-ies becomes -y rather than losing three letters', () => {
    const yours = 'the body of the tank fills up when the valve opens.'
    const graph = [linkIn(yours, 'the valve opens', 'the body of the tank fills up')]
    const line = 'so the bodies fill up?'
    const items = tallyIntroduced(line, read(line, []), graph)

    expect(words(items)).not.toContain('bodies')
  })

  test('a word ending in ss keeps both of them', () => {
    // "glass" must not stem to "glas". Nothing you said contains it, so it is a note either
    // way — what this pins is that the note names the word the child actually said.
    const line = 'is the flapper made of glass?'
    const items = tallyIntroduced(line, read(line, []), GRAPH)

    expect(words(items)).toContain('glass')
  })

  test('two inflections of one new word are one note', () => {
    const line = 'so the pump pumps the water?'
    const items = tallyIntroduced(line, read(line, []), GRAPH)

    expect(words(items).filter(w => w.startsWith('pump'))).toHaveLength(1)
  })

  // The length guards on the suffix rules. Each of these is a short word where the rule that
  // looks right strips too much: "dies" is not "dy" and "axes" is not "ax". Mutation found
  // every one of these guards unpinned, because the toilet's vocabulary is all long words.
  const inYourWords = (yours: string, cause: string, effect: string, line: string, word: string): void => {
    const items = tallyIntroduced(line, read(line, []), [linkIn(yours, cause, effect)])
    expect(words(items), `"${word}" is your own word`).not.toContain(word)
  }

  test('a four-letter -ies word keeps its stem', () => {
    inYourWords('the fish die when the tank drains.', 'the tank drains', 'the fish die', 'so the fish dies?', 'dies')
  })

  test('a four-letter sibilant -es word keeps its stem', () => {
    inYourWords('the axe cuts the pipe.', 'the axe', 'cuts the pipe', 'so the axes cut it?', 'axes')
  })

  test('a double-s word is not cut short', () => {
    // Strip the -s from "glass" and you get "glas", which no longer matches the "glasses" the
    // child said. You are charged for a word you used yourself.
    inYourWords('the glass covers the tank.', 'the glass', 'covers the tank', 'so the glasses cover it?', 'glasses')
  })

  test('a long -ies word keeps its front, not its first three letters', () => {
    inYourWords(
      'the battery runs the pump.',
      'the battery',
      'runs the pump',
      'so the batteries run it?',
      'batteries',
    )
  })

  test('a three-letter word ending in s is left alone', () => {
    // "gas" is three letters. Strip its -s and you get "ga", while the child's "gases" strips
    // correctly to "gas" — so your own word stops matching itself.
    inYourWords('the gas escapes the trap.', 'the gas', 'escapes the trap', 'so the gases escape?', 'gases')
  })

  test('stemming never merges two different words', () => {
    // The other direction, and the dangerous one. A rule that trims two characters off
    // everything collapses "chain" and "chair" onto one stem, and a word you never said stops
    // being written down at all.
    const line = 'so the chair holds the tank?'
    const items = tallyIntroduced(line, read(line, []), GRAPH)

    expect(words(items)).toContain('chair')
  })
})

// The guard red-team hole 4 exists for, and nothing pinned it. A phrase with no words at all
// stems to the empty set, the empty set is a subset of everything, and every link would be
// judged already held — the ledger goes silent, which is the Law 1 direction.
describe('the empty set is a subset of everything', () => {
  test('a link whose concept has no words is never already yours', () => {
    const line = 'so — ?'
    const items = tallyIntroduced(line, read(line, [linkIn(line, '—', '?')]), GRAPH)

    expect(links(items)).toHaveLength(1)
  })
})

// ---- the holes the red team found, four angles, 2026-08-12 ---------------------------

describe('what the red team found', () => {
  // Hole 1. The oracle never crossed its two axes: the degenerate line was paired with a
  // successful extraction, and every `unread` case rode on a line full of content words. So a
  // short-circuit above the `unavailable` branch swallowed the flag on exactly the turn it
  // exists for — nobody knows what the child said, and the ledger reads clean.
  test('a line of nothing but function words still logs unread', () => {
    const items = tallyIntroduced('so it does that?', unreadable('ollama: connection refused'), GRAPH)

    expect(items).toEqual([{ kind: 'unread', reason: 'ollama: connection refused' }])
  })

  test('an empty line still logs unread', () => {
    const items = tallyIntroduced('   ', unreadable('ollama: connection refused'), GRAPH)

    expect(items).toEqual([{ kind: 'unread', reason: 'ollama: connection refused' }])
  })

  // Hole 2. The empty-graph case handed the tally no extracted links, so skipping the link
  // check on an empty graph went green. Turn one is when everything the child says is new.
  test('on turn one, with nothing said yet, every link the child asserts is introduced', () => {
    const line = 'so the toilet fills up after it empties?'
    const items = tallyIntroduced(line, read(line, [linkIn(line, 'it empties', 'the toilet fills up')]), [])

    expect(links(items)).toEqual([
      { kind: 'link', cause: 'it empties', effect: 'the toilet fills up', relation: 'causes' },
    ])
  })

  // Holes 3 and 4. `pump`, at four characters, was the shortest word the oracle required, so a
  // length floor of four passed. The same floor fed the subset match, shrinking a short phrase
  // to the empty set — and the empty set is a subset of everything, so the link was judged
  // already held and nothing was written down at all.
  test('a three-letter part you never named is flagged, and its link is not swallowed', () => {
    const line = 'so the lid lifts the flapper?'
    const items = tallyIntroduced(line, read(line, [linkIn(line, 'the lid', 'lifts the flapper')]), GRAPH)

    expect(links(items)).toEqual([
      { kind: 'link', cause: 'the lid', effect: 'lifts the flapper', relation: 'causes' },
    ])
    expect(words(items)).toContain('lid')
  })

  // Hole 6. No test handed the tally more than one extracted link, so `find` passed where the
  // spec means `filter`, and the second proposition was dropped in silence.
  test('two novel links both come back', () => {
    const line = 'so the toilet fills up after it empties and the sewer takes the water?'
    const items = tallyIntroduced(
      line,
      read(line, [
        linkIn(line, 'it empties', 'the toilet fills up'),
        linkIn(line, 'the sewer', 'takes the water'),
      ]),
      GRAPH,
    )

    expect(links(items)).toHaveLength(2)
  })

  // Hole 7. Example 2's three words all genuinely sit inside its one link, so an implementation
  // that stamps the first flagged link onto every word passed. Ruling 16 never counts a
  // contained word, so a word wrongly marked contained disappears from the instrument.
  test('a word outside every flagged link carries no within', () => {
    const line = 'so the toilet fills up after it empties and the sewer takes the water?'
    const items = tallyIntroduced(line, read(line, [linkIn(line, 'it empties', 'the toilet fills up')]), GRAPH)

    expect(items).toContainEqual({ kind: 'word', word: 'sewer' })
  })

  // Found by mutation rather than by the red team. When one word sits inside two flagged
  // links, the row it is charged to must be stable — the first, not the last. Otherwise the
  // same word moves between rows depending on the order Extract happened to return links in.
  test('a word inside two flagged links is charged to the first', () => {
    const line = 'so the sewer takes the water and the sewer floods the street?'
    const items = tallyIntroduced(
      line,
      read(line, [
        linkIn(line, 'the sewer', 'takes the water'),
        linkIn(line, 'the sewer', 'floods the street'),
      ]),
      GRAPH,
    )

    expect(items).toContainEqual({ kind: 'word', word: 'sewer', within: 'the sewer' })
  })

  // Hole 8. `turn`'s `said` branch was asserted by nothing. An implementation could drop the
  // items, or run `say` over the child's line and turn its question into a statement — which
  // would make any span shown back non-literal, against invariant 2.
  test('turn keeps the child line verbatim and keeps its items', () => {
    const line = 'wait, is that like a pump?'
    const items: readonly Introduced[] = [{ kind: 'word', word: 'pump' }]
    const built = turn('the chain lifts the flapper.', { kind: 'said', line }, items)

    expect(built.child).toBe(line)
    expect(built.introduced).toEqual(items)
    expect(built.you).toBe('the chain lifts the flapper.')
  })

  // Hole 10, and it was a defect in ruling 7's wording rather than in this file. "or relation
  // not already in your graph" reads as graph-wide. Here `prevents` is in the graph and is new
  // to this pair, which is the only case that tells the two readings apart.
  test('a relation you used elsewhere is still new to this pair', () => {
    const more = `${YOURS} the flapper dropping stops the water leaving the tank.`
    const graph: readonly Link[] = [
      ...GRAPH,
      linkIn(more, 'the flapper dropping', 'the water leaving the tank', 'prevents'),
    ]
    const line = 'so the flapper lifting stops the tank water rush into the bowl?'
    const stated = linkIn(line, 'the flapper lifting', 'the tank water rush into the bowl', 'prevents')
    const items = tallyIntroduced(line, read(line, [stated]), graph)

    expect(links(items)).toHaveLength(1)
  })
})

// ---- what it must not do -------------------------------------------------------------

describe('section 3', () => {
  // It reads the child's line and your already-extracted graph. Nothing it returns may name
  // anything absent from that line.
  test('every item names something present in the child\'s line', () => {
    const line = 'so the toilet fills up after it empties?'
    const items = tallyIntroduced(line, read(line, [linkIn(line, 'it empties', 'the toilet fills up')]), GRAPH)

    for (const item of items) {
      if (item.kind === 'word') expect(line.toLowerCase()).toContain(item.word)
      if (item.kind === 'link') {
        expect(line).toContain(item.cause)
        expect(line).toContain(item.effect)
      }
    }
  })

  // Total. An empty graph is a real state on turn one, before Extract has read anything.
  test('an empty graph is a state, not a crash', () => {
    const line = 'so the toilet fills up after it empties?'
    const items = tallyIntroduced(line, read(line, []), [])

    expect(words(items).length).toBeGreaterThan(0)
    expect(items.filter(i => i.kind === 'unread')).toEqual([])
  })

  // Total. An empty line cannot introduce anything.
  test('an empty line returns nothing', () => {
    expect(tallyIntroduced('', read(' '), GRAPH)).toEqual([])
  })

  // Ruling 9. An empty link list is the correct reading of a question and is never `unread`.
  test('an empty link list is never an unread item', () => {
    const line = 'what does lifting the flapper do?'
    const items = tallyIntroduced(line, read(line, []), GRAPH)

    expect(items.filter(i => i.kind === 'unread')).toEqual([])
  })

  // Ruling 15's boundary in the type: a word carries no relation and a link carries no word.
  test('no item mixes a word with a link', () => {
    const line = 'so the toilet fills up after it empties?'
    const items = tallyIntroduced(line, read(line, [linkIn(line, 'it empties', 'the toilet fills up')]), GRAPH)

    for (const item of items) {
      expect(['link', 'word', 'unread']).toContain(item.kind)
    }
  })
})

/** The same concept as it appears in this line, so a fixture can echo your graph in new words. */
function findable(line: string, quote: string): string {
  const lower = line.toLowerCase()
  if (lower.includes(quote.toLowerCase())) return line.slice(lower.indexOf(quote.toLowerCase()), lower.indexOf(quote.toLowerCase()) + quote.length)
  const head = quote.split(/\s+/).filter(w => lower.includes(w.toLowerCase()))
  if (head.length === 0) throw new Error(`fixture: nothing of "${quote}" is in "${line}"`)
  const first = lower.indexOf(head[0]!.toLowerCase())
  const last = lower.indexOf(head[head.length - 1]!.toLowerCase()) + head[head.length - 1]!.length
  return line.slice(first, last)
}
