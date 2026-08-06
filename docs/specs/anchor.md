# Spec: Anchor

> [`workflow.md`](../workflow.md) **step 4**, first piece of the Feynman build order. Step 5,
> the oracle, is the human's and is not written here. Read the signatures, not the prose.

## 1. What it does

Anchor turns a range of characters in a document into a reference that can find that same range
again after the document has been re-parsed, and turns it back. It is the foundation every other
piece reads from: Index produces anchors, Retrieve returns them, Extract emits them, and every
quote the user ever sees is one. Nothing about it is clever, and that is deliberate — it either
finds the exact original range or it returns nothing. It never guesses.

## 2. Public API

```ts
// src/index/anchor.ts

/** A document as Anchor sees it: an id and the plain text whose offsets are authoritative. */
type Doc = {
  readonly doc_id: string
  readonly unit_id: string
  readonly text: string
}

/** Half-open character range over Doc['text']: [start, end). */
type Span = { readonly start: number; readonly end: number }

/** The one anchor shape, per AGENTS.md. Serialisable, comparable, stable across re-parse. */
type Anchor = {
  readonly doc_id: string
  readonly unit_id: string
  readonly char_start: number
  readonly char_end: number
  readonly quote: string
}

/** Null when the span is not valid for this document. Never throws on bad input. */
createAnchor(doc: Doc, start: number, end: number): Anchor | null

/** Null when the quote is not present verbatim at a resolvable position. Never a best guess. */
resolveAnchor(doc: Doc, anchor: Anchor): Span | null
```

Both return `null` rather than throwing, because a missing quote is a **normal outcome** the
caller must handle — a document changed on disk is expected, not exceptional.

## 3. What it must not do

- **No fuzzy matching, ever.** If the stored quote is not present verbatim, `resolveAnchor`
  returns `null`. Not the nearest match, not a trimmed match, not a case-insensitive match.
- **No normalisation** of whitespace, quotes, dashes or Unicode form. The quote is compared as
  stored. Normalising is fuzzy matching with better manners.
- **No resolution against a different document.** A `doc_id` mismatch is `null`, checked before
  anything else.
- **No throwing on out-of-range, inverted, or non-integer offsets.** Return `null`.
- **No dependence on what a `unit_id` means.** Treat it as an opaque stable string; see the
  dependency note below.

## 4. Invariants that apply

**Invariant 2**, quoted: *"Quotes are validated as literal substrings of the source before
display; a non-matching quote is a rejected extraction, not a warning."* Anchor is where this is
enforced for the whole codebase. `resolveAnchor` returning `null` **is** the rejection.

**The anchor format section**, quoted: *"`quote` must be a literal substring of the source at
that offset. Build plain text by concatenating extracted characters yourself, so offsets are
yours by construction. IDs are content-addressed: re-parsing must not reshuffle identity."*

**Invariant 1** applies indirectly: every quote a user reads arrives through this module, so a
bug here is the most direct route to text on screen that is not the user's or their source's.

## 5. Two things the human should rule on before the oracle is written

**A. `unit_id` is specified by an open ticket.** [What a unit is](https://github.com/danielhkuo/HoldTrue/issues/21)
is unresolved, so what a `unit_id` identifies is undecided. **This does not block Anchor**: the
round-trip property holds for any opaque stable string, so Anchor treats `unit_id` as a value it
carries and compares, never one it interprets. If that is wrong, it needs saying now, because it
is the one assumption baked into the signatures.

**B. Resolution strategy — DECIDED 2026-08-05: exact offsets only.**

`resolveAnchor` checks `text.slice(char_start, char_end) === quote`. Anything else is `null`.
No searching, no nearest-occurrence fallback, no stored context.

**Why this is safe despite the roadmap demanding durability.** The roadmap requires that
re-parsing a document not reshuffle identity, *"or the calendar silently breaks months later."*
That durability lives in the **IDs** being content-addressed — Index's job — not in character
offsets surviving an edit. Anchors are **session-scoped**: created and resolved inside one
session, against text that is not being edited underneath them. So Anchor only ever has to be
right about *this range, in this text, right now*, which exact-offset comparison answers exactly.

**Rejected.** *Nearest occurrence* — survives edits, but buys durability Anchor does not need and
introduces a tie-break rule for equidistant matches, i.e. a way to return the wrong span.
*Stored context* — would widen `Anchor` past the five fields `AGENTS.md` fixes, needing an
amendment, and the context can itself change. The workflow's mutation example implies a
32-character context window exists; it does not, and that example is illustrative rather than
normative.

**The consequence to hold onto:** a file edited mid-session makes its anchors unresolvable, and
`null` is the correct answer. Under invariant 2 a quote that cannot be verified is not shown.
Failing closed is the whole point.

## 6. Hard cases the property test generator must produce

Named here so the generator can be checked against a list rather than inspected by vibe:

- **Astral-plane characters.** `"👋".length === 2` in JavaScript. Mixing code points and code
  units returns a wrong span silently and nothing throws.
- **Combining characters.** `e` + U+0301 is two code units that render as one glyph.
- **Repeated substrings**, so occurrence identity is actually tested.
- **Spans at position 0 and at `text.length`**, and the empty span where `start === end`.
- **CRLF**, which changes offsets between platforms if any layer normalises line endings.
