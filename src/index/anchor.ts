// Anchor: a reference to a range of characters in a document, and the way back.
//
// Every quote the user ever reads passes through here, so this module is where
// AGENTS.md invariant 2 is enforced for the whole codebase — "quotes are validated
// as literal substrings of the source before display; a non-matching quote is a
// rejected extraction, not a warning." A rejection is `null`, and `null` is a
// normal outcome the caller must handle, never an error.
//
// Anchors are session-scoped. Resolution is exact-offset only: no searching, no
// nearest-occurrence fallback, no stored context. The durability the roadmap wants
// lives in content-addressed ids, which is Index's job. See docs/specs/anchor.md.

/** A document as Anchor sees it: an id and the plain text whose offsets are authoritative. */
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

/** The one anchor shape, per AGENTS.md. Serialisable, comparable, stable across re-parse. */
export type Anchor = {
  readonly doc_id: string
  readonly unit_id: string
  readonly char_start: number
  readonly char_end: number
  readonly quote: string
}

const isUsableOffset = (value: number, length: number): boolean =>
  Number.isInteger(value) && value >= 0 && value <= length

export function createAnchor(doc: Doc, start: number, end: number): Anchor | null {
  const { text } = doc

  if (!isUsableOffset(start, text.length)) return null
  if (!isUsableOffset(end, text.length)) return null

  // Zero-length and inverted spans both fail here. An empty quote is a substring of
  // every document, so it would satisfy invariant 2 vacuously rather than actually.
  if (end <= start) return null

  const quote = text.slice(start, end)

  // Half a character is half a character, whether or not the other half is still in
  // the document. JavaScript strings are UTF-16, so an astral-plane character such as
  // an emoji occupies two code units; a span taking one of them yields a lone surrogate
  // that renders as a replacement glyph, and quotes are user-facing under Law 2.
  //
  // Asking whether the *quote* is well-formed, rather than whether an offset sits
  // between two particular code units, is what makes this agree with the ruling in
  // both directions: it refuses a truncated character even at the end of a document,
  // and it allows readable text that merely happens to sit beside a lone surrogate.
  //
  // Splitting a combining sequence is deliberately still allowed: both halves of
  // `e` + U+0301 are real readable text, and refusing them would need full grapheme
  // segmentation.
  if (!quote.isWellFormed()) return null

  return {
    doc_id: doc.doc_id,
    unit_id: doc.unit_id,
    char_start: start,
    char_end: end,
    quote,
  }
}

export function resolveAnchor(doc: Doc, anchor: Anchor): Span | null {
  if (doc.doc_id !== anchor.doc_id) return null
  if (doc.unit_id !== anchor.unit_id) return null

  const { char_start, char_end, quote } = anchor
  const { text } = doc

  if (!isUsableOffset(char_start, text.length)) return null
  if (!isUsableOffset(char_end, text.length)) return null
  if (char_end <= char_start) return null

  // The whole of resolution. `slice` on a changed document yields different text,
  // and different text is a rejection — not a prompt to go looking for the quote
  // somewhere else in the document.
  if (text.slice(char_start, char_end) !== quote) return null

  return { start: char_start, end: char_end }
}
