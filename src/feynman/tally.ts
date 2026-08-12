/**
 * Tally: what the child brought in that you never said.
 *
 * No model. It is handed the child's line, what Extract made of that line, and the graph of
 * your own words, and it returns everything in the line you never said: a link your graph
 * does not hold, a content word your transcript does not contain, and a turn the model could
 * not read at all. It answers one question — *is this in what you said?* — and never whether
 * any of it is true. Checking an introduced item against knowledge is the review phase's,
 * and it is not this piece's. child-speech.md ruling 13.
 *
 * `line` is separate from `said` because the word check needs no model: it still runs when the
 * model is unreachable and `said` carries no text at all. A dead model loses the link check
 * and keeps the cheap one.
 *
 * Watch which way the error runs. An extra item costs the review phase one closure it did not
 * need; a missing item is a link the child introduced and nobody wrote down, which is the
 * failure Law 1 names. Every loosening below is bounded for that reason, and the loosest of
 * them — child-speech.md ruling 14's subset match — is the first place to look when the ledger is wrong.
 *
 * Contract, rulings and the failure mode: docs/specs/child-speech.md.
 */

import { conceptOf } from './cohere.js'
import type { ExtractResult } from './extract.js'
import type { Link, Relation } from './validate.js'

export type Introduced =
  /** A link the child asserted that your graph does not hold. child-speech.md ruling 7. */
  | { readonly kind: 'link'; readonly cause: string; readonly effect: string; readonly relation: Relation }
  /**
   * A content word in the child's line that your transcript does not contain. child-speech.md ruling 8.
   * `within` names the link this word sits inside, when one was also flagged, so anything
   * counting introductions counts the link and not its parts. Oracle example 2.
   */
  | { readonly kind: 'word'; readonly word: string; readonly within?: string }
  /** The model could not read the turn. child-speech.md ruling 9, and a note rather than a debt. */
  | { readonly kind: 'unread'; readonly reason: string }

/** What the child said, and what the session now has to look at. */
export type Turn = {
  readonly you: string
  readonly child: string
  readonly introduced: readonly Introduced[]
}

/** The result of asking the model to speak as the child. Defined here so `turn` is total. */
export type Spoken =
  | { readonly kind: 'said'; readonly line: string }
  | { readonly kind: 'silent'; readonly reason: string }

/** A run of word characters, the same class normalise.ts segments on. */
const TOKEN = /[\p{L}\p{M}\p{N}'’]+/gu

/**
 * Words that carry no content, so a line built out of them introduces nothing.
 *
 * Function words, and the noises a child's question is made of — the oracle's *"wait, is that
 * like a pump?"* introduces `pump` and nothing else, and *"so it does that?"* introduces
 * nothing at all. Kept tight on purpose: a word on this list can never be written down, and a
 * thing nobody wrote down is the Law 1 direction of the error (child-speech.md ruling 14).
 *
 * **Negation is deliberately absent** — *not*, *no*, *never*, *n't* — because a child that
 * negates your chain is exactly what the ledger must not lose in silence, and child-speech.md ruling 7 already
 * concedes that Extract may return no link on the line that does it.
 *
 * `like` sits here as a comparison word, and this is not the open question normalise.ts holds
 * under finding 45: nothing is stripped from anyone's speech, the word is only not counted as
 * content.
 */
const STOP: ReadonlySet<string> = new Set(
  `a about above across after again against all along also am an and another any anything are
   around as at be because been before behind being below beside besides between both but by
   can could did do does doing done down during each either else even ever every everyone
   everything for from had has have having he her here hers him his how i if in inside into is
   it its itself just like many may maybe me might mine more most much must my myself now of
   off oh ok okay on once one only onto or other others our ours out outside over own perhaps
   please really right same shall she should since so some someone something still such than
   that the their theirs them then there these they thing things this those though through
   thus to too toward under until up upon us very wait was we well were what when where whether
   which while who whom whose why will with within without would yeah yes yet you your yours
   ah hm hmm huh hey oops ooh ow uh um wow whoa`
    .split(/\s+/)
    .filter(Boolean),
)

/**
 * child-speech.md ruling 14's suffix stripper, private to this file until Cohere adopts it — a shared module
 * owned by neither piece needs its own oracle and nobody has written it. Plural *-s* and
 * *-es*, verb *-ing* and *-ed*, and nothing else: every step past inflection is a judgement
 * about meaning, and a judgement about meaning is what this piece may not make.
 *
 * Two passes, plural then verb, so *things* and *thing* strip to the same root. One pass with
 * an early return gives them two, and a stemmer that disagrees with itself under-reports in
 * silence.
 */
const stem = (word: string): string => {
  let root = word
  if (root.length > 4 && root.endsWith('ies')) root = `${root.slice(0, -3)}y`
  else if (root.length > 4 && /(?:s|x|z|ch|sh)es$/.test(root)) root = root.slice(0, -2)
  else if (root.length > 3 && root.endsWith('s') && !root.endsWith('ss')) root = root.slice(0, -1)

  if (root.length > 4 && root.endsWith('ing')) root = root.slice(0, -3)
  else if (root.length > 4 && root.endsWith('ed')) root = root.slice(0, -2)
  return root
}

/**
 * A phrase as its stemmed words. `conceptOf` is the comparison key the rest of the codebase
 * uses — normalise plus lowercase — and this is the stripping child-speech.md says it lacks.
 *
 * Total: a quote that arrives as something other than a string normalises to nothing rather
 * than throwing, the same way `resolveAnchor` never calls a method on one.
 */
const stemsOf = (text: string): readonly string[] => (conceptOf(text).match(TOKEN) ?? []).map(stem)

const isSubset = (small: ReadonlySet<string>, large: ReadonlySet<string>): boolean => {
  for (const word of small) if (!large.has(word)) return false
  return true
}

/**
 * child-speech.md ruling 14: stem every word, then match when one phrase's words are a subset of the other's.
 * *pushing the handle* sits inside *when you push the handle down*, and *the flapper lifting*
 * and *lifting the flapper* are one concept, because word order is not read.
 *
 * A phrase with no words matches nothing. The empty set is a subset of everything, so a rule
 * that drops short words on either side judges every link already held and writes nothing down
 * at all — red-team hole 4, and the reason there is no length floor anywhere in this file.
 */
const sameConcept = (mine: string, theirs: string): boolean => {
  const ours = new Set(stemsOf(mine))
  const yours = new Set(stemsOf(theirs))
  if (ours.size === 0 || yours.size === 0) return false
  return isSubset(ours, yours) || isSubset(yours, ours)
}

/**
 * child-speech.md ruling 7, as tightened on 2026-08-12: your graph holds this link only when one of yours
 * joins these two concepts **with this relation**. Read graph-wide instead — any relation you
 * have used anywhere — and a reversed chain in a relation you happen to have used once
 * introduces nothing. Red-team hole 10.
 */
const alreadyYours = (graph: readonly Link[], said: Link): boolean =>
  graph.some(
    mine =>
      mine.relation === said.relation &&
      sameConcept(mine.cause.quote, said.cause.quote) &&
      sameConcept(mine.effect.quote, said.effect.quote),
  )

/**
 * The content words of the line your transcript does not hold, each marked with the flagged
 * link it sits inside, if any.
 *
 * Deliberately independent of whether Extract succeeded. Suppressing a word because a link
 * covered it would keep the words exactly when the link check fails and lose them exactly when
 * it works, so the shape of the ledger would report the extractor's mood rather than the
 * child's line. Oracle example 2.
 */
const wordsIntroduced = (
  line: string,
  transcript: string,
  flagged: readonly Link[],
): readonly Introduced[] => {
  // Your transcript, not your graph. child-speech.md section 2 says "a content word in that
  // line that I never said", and the graph is a narrower thing than that: a sentence you spoke
  // that Extract found no link in contributes no anchors at all, so every word of it would read
  // as new. That is not rare — the probe under child-speech.md ruling 7 found Extract returning nothing on
  // three lines of three. Found by review, 2026-08-12.
  //
  // Reading your words is not re-extracting them, which is what section 3 forbids and what
  // invariant 9 is about.
  const yours = new Set(stemsOf(transcript))

  // Which flagged link a word sits inside, by stem. The row is named by its cause, because that
  // is what a link row leads with, and only flagged links count — a word stamped with a link
  // it is not inside disappears from child-speech.md ruling 16's count. Red-team hole 7.
  const inside = new Map<string, string>()
  for (const link of flagged) {
    for (const word of [...stemsOf(link.cause.quote), ...stemsOf(link.effect.quote)]) {
      if (!inside.has(word)) inside.set(word, link.cause.quote)
    }
  }

  const items: Introduced[] = []
  const counted = new Set<string>()

  for (const word of conceptOf(line).match(TOKEN) ?? []) {
    const root = stem(word)
    if (STOP.has(word) || STOP.has(root)) continue
    if (yours.has(root)) continue
    // Two inflections of one word are one concept, so they are one note. child-speech.md ruling 14.
    if (counted.has(root)) continue
    counted.add(root)

    // The surface word, never the stem: a row is shown back, and *empti* is not what anyone
    // said. The stem is the key and is never the value.
    const link = inside.get(root)
    items.push(link === undefined ? { kind: 'word', word } : { kind: 'word', word, within: link })
  }

  return items
}

export function tallyIntroduced(
  line: string,
  said: ExtractResult,
  graph: readonly Link[],
  transcript: string,
): readonly Introduced[] {
  const items: Introduced[] = []

  // The link check is the half that needs a model. An empty list is the correct reading of a
  // question and is counted, not logged; only an unreachable model is an item. child-speech.md ruling 9.
  const asserted = said.kind === 'extraction' ? said.extraction.links : []
  const novel = asserted.filter(link => !alreadyYours(graph, link))

  // The child's words, never renamed into yours. A row rewritten into your phrasing hands
  // Supply your own sentence to check while the child's claim goes unrecorded. Red-team hole 5.
  for (const link of novel) {
    items.push({
      kind: 'link',
      cause: link.cause.quote,
      effect: link.effect.quote,
      relation: link.relation,
    })
  }

  // Debts first, then the notes. child-speech.md ruling 15.
  items.push(...wordsIntroduced(line, transcript, novel))

  // Last, and never behind a guard on the line: a turn of nothing but function words is still
  // a turn nobody read, and the whole point is that it must not read as a clean one. Red-team
  // hole 1.
  if (said.kind === 'unavailable') items.push({ kind: 'unread', reason: said.reason })

  return items
}

/**
 * Total: a silent child gives an empty `child` and no items, and that empty string is the whole
 * record of the silence. The line is kept verbatim — nothing cleans the child's own words,
 * because `say` would turn its question into a statement and any span shown back would no
 * longer be literal. Invariant 2, and red-team hole 8.
 */
export function turn(said: string, spoken: Spoken, introduced: readonly Introduced[]): Turn {
  if (spoken.kind === 'silent') return { you: said, child: '', introduced: [] }
  return { you: said, child: spoken.line, introduced: [...introduced] }
}
