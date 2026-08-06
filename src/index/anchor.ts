/**
 * Anchor: a reference to a range of characters in a document, and the way back.
 *
 * Where invariant 2 is enforced for the whole codebase. Rejection is `null`, never a
 * throw. Exact offsets only — no searching, no fuzzy fallback, no stored context.
 *
 * Reasoning, rulings and rejected alternatives: docs/specs/anchor.md.
 */

/** A document as Anchor sees it. `doc_id` is a content hash, so it names a *version*. */
export type Doc = {
  readonly doc_id: string
  readonly unit_id: string
  readonly text: string
}

/** Half-open character range over `Doc['text']`: [start, end). */
export type Span = {
  readonly start: number
  readonly end: number
}

/** The one anchor shape, per AGENTS.md. Serialisable and comparable. */
export type Anchor = {
  readonly doc_id: string
  readonly unit_id: string
  readonly char_start: number
  readonly char_end: number
  readonly quote: string
}

const isUsableOffset = (value: number, length: number): boolean =>
  Number.isInteger(value) && value >= 0 && value <= length

/**
 * May this string be put in front of a user as a quote? Carries both rulings: non-empty,
 * because the empty string is a substring of every document; well-formed, because half a
 * character renders as a replacement glyph. Splitting a combining sequence stays allowed.
 *
 * Also the only thing keeping a `Span` well-ordered — see spec ruling 1.
 */
const isShowableQuote = (quote: string): boolean =>
  quote.length > 0 && quote.isWellFormed()

/** Null when the range is unusable or the text there could not be shown. Never throws. */
export function createAnchor(doc: Doc, start: number, end: number): Anchor | null {
  const { text } = doc

  if (!isUsableOffset(start, text.length)) return null
  if (!isUsableOffset(end, text.length)) return null

  const quote = text.slice(start, end)
  if (!isShowableQuote(quote)) return null

  return {
    doc_id: doc.doc_id,
    unit_id: doc.unit_id,
    char_start: start,
    char_end: end,
    quote,
  }
}

/**
 * Null unless the stored quote is exactly the text at its own offsets, in this document
 * version, and could be shown.
 *
 * Total by construction: every check runs on the slice, never on `anchor.quote`, so an
 * anchor from storage or IPC with a missing or non-string quote is rejected rather than
 * thrown on.
 */
export function resolveAnchor(doc: Doc, anchor: Anchor): Span | null {
  if (doc.doc_id !== anchor.doc_id) return null
  if (doc.unit_id !== anchor.unit_id) return null

  const { char_start, char_end } = anchor
  const { text } = doc

  if (!isUsableOffset(char_start, text.length)) return null
  if (!isUsableOffset(char_end, text.length)) return null

  const found = text.slice(char_start, char_end)
  if (!isShowableQuote(found)) return null
  if (found !== anchor.quote) return null

  return { start: char_start, end: char_end }
}
