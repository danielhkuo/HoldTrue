/**
 * The shared normaliser: the one place raw speech is cleaned, and the way back.
 *
 * Two callers, and they must be the same code. `validate` matches a model's phrase against
 * the sentence on normalised text and then mints an anchor into the *raw* text, so it needs
 * the map back. Voice speaks a cleaned rendering of an anchor's quote — child-speech.md
 * ruling 6 — and its property is that no child utterance names a concept absent from the
 * transcript *after the same normalisation*. Two normalisers that drift apart break that
 * property silently, which is the worst way for it to break, so this module is owned by
 * neither piece and tested on its own.
 *
 * What it does is stated in extract.md section 6: strip filled pauses, collapse stammer
 * repeats, and remember which raw characters survived, so a match found at normalised
 * position 12 can be minted as a raw span.
 *
 * Three passes, in this order, and the order is forced. Filled pauses go first, because
 * "and the uh the pressure drops" is a stammer only once the *uh* between the halves is
 * gone; the repeat collapse goes second; whitespace is folded throughout, because a
 * transcript engine puts a newline mid-sentence and a model puts a space there.
 *
 * What it deliberately does NOT do, because nobody has ruled and writing code is a ruling:
 *   - no case folding. "İ".toLowerCase() is two code units, so a fold is not
 *     length-preserving and would have to be carried by the map for no stated gain.
 *   - no Unicode form folding, and no NFKC. Both change content or length; a quote is
 *     sliced from raw text, never rebuilt from normalised text.
 *   - no punctuation folding beyond the punctuation that brackets a removed filled pause.
 *   - "like" and "you know" are not filled pauses here. They are the open question in
 *     validate.test.ts (finding 45): stripping them changes what Voice says and what
 *     Notice compares, and neither has been decided.
 * Each of those is a question the tests mark OPEN. They are answered by a human, not here.
 */

import type { Span } from '../index/anchor.js'

/**
 * A raw string, its normalised form, and the correspondence between them.
 *
 * `text` is what matching compares and what Voice speaks. `raw` is what anchors point at.
 * `rawOffsets` is the map: for each UTF-16 code-unit index in `text`, the UTF-16 index in
 * `raw` that code unit came from. Code units, not code points and not graphemes — every
 * offset in this codebase is a UTF-16 index because `createAnchor` takes UTF-16 indices,
 * and mixing the three is silent (AGENTS.md, Testing).
 */
export type Normalisation = {
  readonly raw: string
  readonly text: string
  readonly rawOffsets: readonly number[]
}

/**
 * Filled pauses, matched as whole tokens and never as substrings: "pump" carries *um* and
 * "water" carries *er*, and a substring strip yields "the pp pushes the wat". A token here
 * is a run of letters, marks, digits and apostrophes, so `Ωuh漢` is one token and is not a
 * filled pause — which `\buh\b` would get wrong, because `\b` is defined over ASCII.
 */
const FILLED_PAUSES: ReadonlySet<string> = new Set([
  'uh',
  'uhh',
  'uhm',
  'um',
  'umm',
  'er',
  'err',
  'erm',
  'ah',
  'ahh',
  'hm',
  'hmm',
  'mm',
  'mmm',
  'mhm',
])

/**
 * The punctuation that brackets a filled pause in speech, removed with it. The modal shape
 * in the transcripts is ", um, " rather than " um ", and leaving the commas behind gives
 * "it starts with, , evaporation", where the phrase the model named is no longer there.
 * Commas and dashes only: a full stop is a sentence boundary and this piece never crosses
 * one.
 */
const BRACKETING_PUNCTUATION: ReadonlySet<string> = new Set([
  ',',
  '-',
  '‐',
  '‑',
  '‒',
  '–',
  '—',
])

const WHITESPACE = /\s/
const WORD_CHARACTER = /[\p{L}\p{M}\p{N}'’]/u

type SegmentKind = 'word' | 'space' | 'bracket' | 'other'

type Segment = {
  readonly kind: SegmentKind
  readonly text: string
  /** UTF-16 index in `raw` where this segment begins. */
  readonly start: number
}

const classify = (character: string): SegmentKind => {
  if (WHITESPACE.test(character)) return 'space'
  if (WORD_CHARACTER.test(character)) return 'word'
  if (BRACKETING_PUNCTUATION.has(character)) return 'bracket'
  return 'other'
}

/** Compared, never emitted: a fold that changes length is safe only where no offset rides on it. */
const fold = (token: string): string => token.toLowerCase()

/**
 * Raw text as runs. Words and whitespace run together; everything else is one code point at
 * a time, kept verbatim — an emoji, a zero-width joiner and a combining mark all land here
 * and all survive into the normalised text, because dropping them is a ruling nobody made.
 *
 * Walked by code point so a surrogate pair is never split, and `start` is a code-*unit*
 * index because that is what `createAnchor` takes.
 */
const segment = (raw: string): Segment[] => {
  const segments: Segment[] = []
  let index = 0

  while (index < raw.length) {
    const first = String.fromCodePoint(raw.codePointAt(index)!)
    const kind = classify(first)
    const start = index

    if (kind !== 'word' && kind !== 'space') {
      segments.push({ kind, text: first, start })
      index += first.length
      continue
    }

    let text = ''
    while (index < raw.length) {
      const character = String.fromCodePoint(raw.codePointAt(index)!)
      if (classify(character) !== kind) break
      text += character
      index += character.length
    }
    segments.push({ kind, text, start })
  }

  return segments
}

/**
 * Filled pauses out, with the whitespace and bracketing punctuation that surrounds them,
 * replaced by one space. The space is what keeps "the valve opens uh and the water flows"
 * from becoming "opensand".
 */
const dropFilledPauses = (segments: readonly Segment[]): Segment[] => {
  const isPause = segments.map(
    segment => segment.kind === 'word' && FILLED_PAUSES.has(fold(segment.text)),
  )
  const removed = [...isPause]
  const brackets = (segment: Segment): boolean =>
    segment.kind === 'space' || segment.kind === 'bracket'

  for (let index = 0; index < segments.length; index += 1) {
    if (!isPause[index]) continue
    for (let left = index - 1; left >= 0 && !removed[left] && brackets(segments[left]!); left -= 1) {
      removed[left] = true
    }
    for (
      let right = index + 1;
      right < segments.length && !removed[right] && brackets(segments[right]!);
      right += 1
    ) {
      removed[right] = true
    }
  }

  const kept: Segment[] = []
  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index]!
    if (!removed[index]) {
      kept.push(segment)
      continue
    }
    // One space for the whole removed run, mapped at its first raw character. A leading or
    // trailing one is trimmed at emission.
    if (index > 0 && removed[index - 1]) continue
    kept.push({ kind: 'space', text: ' ', start: segment.start })
  }

  return kept
}

/**
 * Stammer repeats collapsed to their first occurrence: *it's it's* becomes *it's*, and a
 * run of three collapses as far as a pair does — a single left-to-right pass that advances
 * by two leaves one behind, and then Voice says "so it's it's a new set of beliefs".
 *
 * Adjacent identical tokens only. A repeat across punctuation — "that, that", "not — not" —
 * is not touched, because whether the rule reaches across punctuation is unruled, and so is
 * the doubling that carries meaning ("not stuck stuck").
 */
const collapseRepeats = (segments: readonly Segment[]): Segment[] => {
  const kept: Segment[] = []

  for (const segment of segments) {
    const previous = kept[kept.length - 1]
    const beforeThat = kept[kept.length - 2]
    const repeats =
      segment.kind === 'word' &&
      previous !== undefined &&
      previous.kind === 'space' &&
      beforeThat !== undefined &&
      beforeThat.kind === 'word' &&
      fold(beforeThat.text) === fold(segment.text)

    if (repeats) {
      kept.pop()
      continue
    }
    kept.push(segment)
  }

  return kept
}

/** Total. Any string in, a normalisation out. */
export function normalise(raw: string): Normalisation {
  if (typeof raw !== 'string') return { raw: '', text: '', rawOffsets: [] }

  const segments = collapseRepeats(dropFilledPauses(segment(raw)))

  const characters: string[] = []
  const rawOffsets: number[] = []

  const emit = (text: string, start: number): void => {
    for (let index = 0; index < text.length; index += 1) {
      characters.push(text[index]!)
      rawOffsets.push(start + index)
    }
  }

  for (const segment of segments) {
    if (segment.kind === 'space') {
      // Every run of whitespace is one space, and a leading one is dropped outright.
      if (characters.length === 0) continue
      if (characters[characters.length - 1] === ' ') continue
      emit(' ', segment.start)
      continue
    }
    emit(segment.text, segment.start)
  }

  if (characters[characters.length - 1] === ' ') {
    characters.pop()
    rawOffsets.pop()
  }

  return { raw, text: characters.join(''), rawOffsets }
}

/**
 * Maps a half-open span in normalised coordinates back to a half-open span in raw
 * coordinates. Null when the span is not usable — out of range, inverted, or empty.
 *
 * The endpoints are tight: the raw span starts at the character the first normalised
 * character came from and ends just past the character the last one came from, so material
 * stripped *beside* the match is outside the span while material stripped *inside* it is
 * carried along. Which of those two answers is right for an endpoint that touches stripped
 * material is open (validate.test.ts, finding 13/35/36); this is the tight one.
 */
export function toRawSpan(normalisation: Normalisation, start: number, end: number): Span | null {
  if (!Number.isInteger(start) || !Number.isInteger(end)) return null
  if (start < 0 || end > normalisation.rawOffsets.length) return null
  if (start >= end) return null

  const rawStart = normalisation.rawOffsets[start]
  const rawLast = normalisation.rawOffsets[end - 1]
  if (rawStart === undefined || rawLast === undefined) return null

  const rawEnd = rawLast + 1
  if (rawEnd <= rawStart) return null

  return { start: rawStart, end: rawEnd }
}
