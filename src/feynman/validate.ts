/**
 * validate: what the model said about one sentence, turned into links or into nothing.
 *
 * Extract asks a model to find causal links in one sentence. The model answers with
 * untrusted text. `validate` checks the model's cause and effect phrases against the
 * sentence the person actually said, mints an `Anchor` for each from offsets it computes
 * itself, and drops anything it cannot anchor. Matching ignores filled pauses and stammers;
 * the anchor always points at raw text.
 *
 * Deterministic, and it carries its own oracle — extract.md section 6, transcribed into
 * validate.test.ts. Section 3 of that spec is what this module must not do:
 *
 *   - No offsets from the model. Every anchor is minted here. A model that returns a
 *     character position is returning a number this piece throws away, and that is how
 *     invariant 2 stays mechanically true without a second validation path.
 *   - No quote that is not a literal substring. `createAnchor` returning null is a dropped
 *     link, not a warning.
 *   - No reading across a sentence boundary at emission. Invariant 8.
 *   - No throwing. A model that returns junk costs that sentence its links and nothing else
 *     (ruling 6).
 *
 * The shape of one match, end to end: normalise the sentence once; normalise the phrase;
 * find the leftmost occurrence in normalised coordinates; map that back to a raw span;
 * shift it by the sentence's own `char_start`, because an anchor is in transcript
 * coordinates and not sentence-local ones; hand the two offsets to `createAnchor`; and
 * then check the human's invariant against what came back, so a span that does not contain
 * the phrase is dropped rather than repaired.
 */

import { createAnchor, type Anchor, type Doc } from '../index/anchor.js'
import { normalise, toRawSpan, type Normalisation } from './normalise.js'

/**
 * One sentence, as Transcribe's adapter cuts it. `anchor.quote` is the sentence text, and
 * **the anchor resolves against the full transcript** — so every anchor `validate` mints is
 * in transcript coordinates too, not sentence-local ones. Ruling 3.
 *
 * `dropped` counts links the model returned for this sentence that could not be anchored.
 * Per-sentence, deliberately: it points at the one sentence where we know something was lost.
 * `resay`, the move that read it, is retired with the deterministic child by child-speech.md
 * ruling 11; `npm run demo` is the only reader left. Ruling 7.
 *
 * Declared here because `validate` is being built before `extract`. extract.md section 2
 * puts this type, `Relation`, `Link`, `Extraction` and `ExtractResult` in
 * src/feynman/extract.ts; when that module lands it takes ownership and this file imports
 * from it.
 */
export type Sentence = {
  readonly anchor: Anchor
  readonly dropped: number
}

/** A closed set, so `conflict` is decidable and the audit compares a relation by equality.
    Ruling 2. */
export type Relation = 'causes' | 'enables' | 'prevents' | 'requires'

/**
 * What you said connects to what. Both sides carry their own anchor, because the shapes the
 * child is handed quote them separately and the audit compares them separately. Ruling 1.
 */
export type Link = {
  readonly cause: Anchor
  readonly effect: Anchor
  readonly relation: Relation
  readonly sentence: Anchor
}

/**
 * What survived, and how much did not. Ruling 8.
 *
 * `dropped` counts links the model **offered** and this module could not anchor. A payload
 * that never parsed offers nothing, so it drops nothing — `dropped` is 0 on a sentence where
 * the system learned less than usual, and telling *said nothing* from *said something
 * unreadable* needs a channel this type does not have. Recorded in extract.md ruling 8.
 *
 * A plain object, and it was briefly not. The first implementation made this an Array
 * carrying `links` and `dropped` as non-enumerable properties, so that a deep comparison
 * walked past them — which let it satisfy both `const { links } = validate(...)` and
 * `expect(validate(...)).toEqual([])` at once. That shape was not the implementer's
 * invention so much as the only way to pass a suite whose migration to ruling 8 was
 * incomplete: seven call sites still compared the whole return value to a bare array. The
 * call sites were fixed; the shape is honest again. Recorded because a passing suite hid it
 * and only the red team found it.
 */
export type Validation = {
  readonly links: readonly Link[]
  readonly dropped: number
}

const RELATIONS: readonly string[] = ['causes', 'enables', 'prevents', 'requires']

/**
 * Ruling 2's closed set, checked against a list rather than an object, so that
 * `constructor`, `toString` and `__proto__` are relations nobody named rather than
 * relations found up the prototype chain.
 */
const toRelation = (value: unknown): Relation | null =>
  typeof value === 'string' && RELATIONS.includes(value) ? (value as Relation) : null

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const buildValidation = (links: readonly Link[], dropped: number): Validation =>
  Object.freeze({ links: Object.freeze([...links]), dropped })

const NOTHING = (): Validation => buildValidation([], 0)

/**
 * A model asked for JSON answers with prose, a markdown fence, JSON encoded twice, or
 * nothing at all. None of that is an error here: it is a sentence that contributed no
 * links (ruling 6). Two unwrapping attempts, no recursion, no walking of arbitrary shapes
 * — a payload nested twenty thousand deep must not cost a stack.
 */
/**
 * The body of the first fenced block, or the text unchanged when there is not one.
 *
 * **Scans, never matches.** This was a regex — ```` /```[a-zA-Z]*[ \t]*\r?\n?([\s\S]*?)```/ ````
 * — and it backtracked catastrophically on an unterminated fence followed by a long run of
 * letters, because the run fits the `[a-zA-Z]*` info-string slot and the engine retries every
 * position in it. Measured through this module's public entry point: `'```' + 'a'.repeat(300_000)`
 * cost **4,170 ms**, about two hundred times the worst degenerate input this piece already
 * accepts. Found by the red team's review pass on 2026-08-10 and confirmed against four
 * attempts to refute it. `indexOf` and a bounded slice cannot backtrack, so the shape of the
 * input cannot buy time here at all.
 */
const betweenFences = (body: string): string => {
  const open = body.indexOf('```')
  if (open === -1) return body

  const close = body.indexOf('```', open + 3)
  if (close === -1) return body

  let inner = body.slice(open + 3, close)

  // Drop the info string, if the first line is one: letters and horizontal space only.
  // Bounded to that line, so a long run below it is never rescanned.
  const nl = inner.indexOf('\n')
  const first = nl === -1 ? inner : inner.slice(0, nl)
  if (first.length <= 32 && !/[^a-zA-Z \t\r]/.test(first)) inner = nl === -1 ? '' : inner.slice(nl + 1)

  return inner.trim()
}

const parsePayload = (text: string, attemptsLeft = 2): unknown => {
  if (attemptsLeft <= 0) return null

  let body = text.trim()
  body = betweenFences(body)
  if (body.length === 0) return null

  let parsed: unknown
  try {
    parsed = JSON.parse(body)
  } catch {
    return null
  }

  return typeof parsed === 'string' ? parsePayload(parsed, attemptsLeft - 1) : parsed
}

/**
 * Whatever came back, as a list of entries to look at. A bare array, the `{ links: [...] }`
 * wrapper models volunteer without being asked, or a single link object. Anything else
 * offered nothing.
 */
const offeredEntries = (raw: unknown): readonly unknown[] => {
  const value = typeof raw === 'string' ? parsePayload(raw) : raw

  if (Array.isArray(value)) return value
  if (!isRecord(value)) return []
  if (Array.isArray(value.links)) return value.links
  if ('cause' in value && 'effect' in value) return [value]
  return []
}

/**
 * An entry the model offered as a link, whether or not it survives. A `null` in the list,
 * a bare string or a number is not a link the model returned, so it is not a loss to
 * report; an object naming a cause and an effect is one, however badly formed. Ruling 8:
 * `dropped` counts what was offered and could not be anchored.
 */
const isOffer = (entry: unknown): entry is Record<string, unknown> =>
  isRecord(entry) && 'cause' in entry && 'effect' in entry

/** The sentence, ready to match against, or null when the sentence itself is unusable. */
type Site = {
  readonly doc: Doc
  readonly charStart: number
  readonly anchor: Anchor
  readonly normalised: Normalisation
  readonly anchors: Map<string, Anchor | null>
}

/**
 * `validate` is handed a `Sentence`, never the `Doc` — so the transcript is reconstructed
 * as far as this sentence and no further: filler up to `char_start`, then the sentence's own
 * raw text. Every offset `createAnchor` sees is therefore a transcript offset, and the
 * quote it slices is the speaker's own text, since the slice never leaves the sentence.
 */
const readSentence = (sentence: Sentence): Site | null => {
  if (!isRecord(sentence)) return null
  const source: unknown = sentence.anchor
  if (!isRecord(source)) return null

  const { doc_id, unit_id, char_start, char_end, quote } = source
  if (typeof doc_id !== 'string' || typeof unit_id !== 'string') return null
  if (typeof quote !== 'string' || quote.length === 0) return null
  if (!Number.isSafeInteger(char_start) || (char_start as number) < 0) return null
  // The sentence anchor's own contract, since every span minted below sits inside it: a
  // `char_end` that does not agree with the quote is an anchor `createAnchor` never made,
  // and matching inside it would put spans outside the sentence it claims.
  if (char_end !== (char_start as number) + quote.length) return null

  const charStart = char_start as number
  const doc: Doc = { doc_id, unit_id, text: ' '.repeat(charStart) + quote }
  const anchor = createAnchor(doc, charStart, charStart + quote.length)
  if (anchor === null) return null

  return { doc, charStart, anchor, normalised: normalise(quote), anchors: new Map() }
}

/**
 * The phrase the model named, as a span into the speaker's raw words — or null, which is a
 * dropped link and never a warning.
 *
 * Leftmost occurrence, which is oracle example 2 and a known defect recorded as one: where
 * a phrase appears twice the first is sometimes the wrong one, and refusing every ambiguous
 * match would add to the dominant failure of missing 35.70% of links. The mitigation lives
 * in the prompt.
 */
const anchorPhrase = (site: Site, phrase: string): Anchor | null => {
  const cached = site.anchors.get(phrase)
  if (cached !== undefined) return cached

  const anchor = mintPhrase(site, phrase)
  site.anchors.set(phrase, anchor)
  return anchor
}

/**
 * A letter or a digit, by Unicode rather than by ASCII — so `\w` is not used anywhere here.
 * `résumé`, `Держава` and `日本` are words; a space, a comma and a dash are not.
 */
const isWordChar = (ch: string | undefined): boolean => ch !== undefined && /\p{L}|\p{N}/u.test(ch)

/**
 * The leftmost occurrence that begins and ends at a word boundary, or -1.
 *
 * **Why a plain `indexOf` is wrong here**, decided 2026-08-10 after the red team got three of
 * four implementations through the suite on it. `"the pressure drops in the hose"` contains
 * the characters of `"sure drop"`, and `"the therapist calms the patient"` contains
 * `"the rapist"`. Both are inside the sentence and neither is anything the speaker said. The
 * owner's ruling: *"These are completely different concepts. Obviously that shouldn't
 * happen."*
 *
 * Linear: each start position is tested once, and the boundary test is two character reads.
 */
const leftmostWholeToken = (haystack: string, needle: string): number => {
  for (let at = haystack.indexOf(needle); at >= 0; at = haystack.indexOf(needle, at + 1)) {
    const before = at === 0 ? undefined : haystack[at - 1]
    const after = haystack[at + needle.length]
    const opensCleanly = !isWordChar(before) || !isWordChar(needle[0])
    const closesCleanly = !isWordChar(after) || !isWordChar(needle[needle.length - 1])
    if (opensCleanly && closesCleanly) return at
  }
  return -1
}

const mintPhrase = (site: Site, phrase: string): Anchor | null => {
  const needle = normalise(phrase).text
  // A phrase that normalises away names nothing: the empty string is inside every sentence
  // at every position, which is the vacuity anchor.md ruling 1 refuses one layer down.
  if (needle.length === 0) return null

  const at = leftmostWholeToken(site.normalised.text, needle)
  if (at < 0) return null

  const span = toRawSpan(site.normalised, at, at + needle.length)
  if (span === null) return null

  const anchor = createAnchor(site.doc, site.charStart + span.start, site.charStart + span.end)
  if (anchor === null) return null

  // The human's invariant, checked rather than assumed: the span's text, normalised,
  // contains the model's phrase, normalised. Slicing raw text around a match can cut a
  // token, and a span that no longer contains what the model named is dropped here rather
  // than adjusted into one that does.
  if (!normalise(anchor.quote).text.includes(needle)) return null

  return anchor
}

const linkFrom = (site: Site, entry: Record<string, unknown>): Link | null => {
  const { cause, effect } = entry
  // Not coerced. `String(1)` finds "1" in "the 1 way valve" and mints an anchor that
  // satisfies invariant 2 to the letter and says nothing; a number is not a phrase.
  if (typeof cause !== 'string' || typeof effect !== 'string') return null

  const relation = toRelation(entry.relation)
  if (relation === null) return null

  const causeAnchor = anchorPhrase(site, cause)
  if (causeAnchor === null) return null

  const effectAnchor = anchorPhrase(site, effect)
  if (effectAnchor === null) return null

  return { cause: causeAnchor, effect: effectAnchor, relation, sentence: site.anchor }
}

/**
 * Total. Whatever the model returned for one sentence becomes links, or nothing. `raw` is
 * `unknown` because it is whatever came back from a local endpoint: a bare array, a wrapper
 * object, a markdown fence, an apology, an empty body.
 */
export function validate(sentence: Sentence, raw: unknown): Validation {
  try {
    const site = readSentence(sentence)
    if (site === null) return NOTHING()

    const links: Link[] = []
    let dropped = 0

    for (const entry of offeredEntries(raw)) {
      if (!isOffer(entry)) continue
      const link = linkFrom(site, entry)
      if (link === null) dropped += 1
      else links.push(link)
    }

    return buildValidation(links, dropped)
  } catch {
    // Section 3, and it is absolute: one sentence failing costs that sentence. Every path
    // above returns rather than throws, so nothing is expected here — but "nothing is
    // expected" is what a live session cannot rely on when the input is untrusted.
    return NOTHING()
  }
}
