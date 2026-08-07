# Spec: Anchor

> **Status: built and closed, 2026-08-06. Role narrowed 2026-08-07.** First piece of the build
> order. `src/index/anchor.ts`, 87 lines, 30 tests, mutation 52/52 at 100%.
>
> The code is unchanged, still correct, and still has callers — Extract's spans point into the
> user's own explanation and resolve through here. What it lost is the claim in section 1 that
> everything else reads from it: the model-knowledge pivot took source material off the default
> path, so Index and Retrieve, two of its four callers, have no subject there. Anchor is now the
> validator for any quote that is still shown and the infrastructure the optional RAG hook needs.
> Not deprecated, not superseded, not to be deleted. Section 1 says what it is for now.
>
> Built through the [`/holdtrue-workflow`](../../.claude/skills/holdtrue-workflow/SKILL.md)
> piece loop, before the red-team step existed. Four review rounds found and fixed: an inverted boundary predicate, a
> vacuous fixture, three untested guards, a totality regression introduced while fixing the
> second of those, and a second vacuous fixture next door to the first. Nothing here is
> outstanding — see "What is not closed" at the end for the two notes this piece hands on.

## 1. What it does

Anchor turns a range of characters in a document into a reference that can find that same range
again after the document has been re-parsed, and turns it back. Nothing about it is clever, and
that is deliberate — it either finds the exact original range or it returns nothing. It never
guesses.

**Who reads from it. Corrected 2026-08-07.** This section used to open by calling Anchor *the
foundation every other piece reads from*: Index produces anchors, Retrieve returns them, Extract
emits them, and every quote the user ever sees is one. That was true while every user-facing
sentence had to trace to the user's own words, a quoted passage in their material, or plain code.
The model-knowledge pivot repealed that rule — see [`../philosophy.md`](../philosophy.md) for what
replaced it — and took source material off the default path with it. Three of the four callers
change:

- **Extract still reads from it, on the default path, unchanged.** Its spans point into the
  *user's own explanation*, which is a document like any other, and its eval rule is that every
  span resolves. This is the load-bearing caller now.
- **Index and Retrieve have no subject on the default path.** They are the optional RAG hook's
  pieces. The reasoning in their favour is not refuted, it is unemployed by default.
- **Any citation shown to the user still comes through here.** Fewer sentences are quotes than
  before, but a quote that is not verified is not a quote, and this is where it is verified.

So Anchor is optional infrastructure rather than the foundation, and it is still the only place
invariant 2 is enforced. The code, the API and the rulings below are all unaffected; what narrowed
is the number of callers, not the contract. See section 7 for the one thing this does leave open.

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

/** Null when the range is unusable, the text there is not showable, or it is not the stored
    quote. Never a best guess, and never a throw — a malformed anchor is a null, not an error. */
resolveAnchor(doc: Doc, anchor: Anchor): Span | null
```

Both return `null` rather than throwing, because a missing quote is a **normal outcome** the
caller must handle — a document changed on disk is expected, not exceptional. **`resolveAnchor`
is total**: it is the gate for anchors arriving from storage, from IPC, or from a model, so a
`quote` that is missing, renamed or not a string must be rejected rather than thrown on. This
was briefly broken on 2026-08-06 by asking the showability predicate of `anchor.quote`; it is
asked of the slice instead, which is a string by construction.

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
- **No resolving a range whose text could not be shown.** Present-verbatim is necessary and not
  sufficient: the empty string is present verbatim at every offset pair `n..n`, and half a
  character is present verbatim wherever `slice` can cut one. Both are refused. See E.
- **No property access on an untrusted anchor field.** Anything reached before the shape has
  been established must be total.

## 4. Invariants that apply

Numbered *and* quoted. `AGENTS.md` keeps invariant numbers as permanent addresses and does not
renumber, so the number is safe to cite; what it does not carry is whether the rule is still in
force, and after 2026-08-07 several are not. The quote is what makes that visible here.

**Invariant 2**, quoted: *"Quotes are validated as literal substrings of the source before
display; a non-matching quote is a rejected extraction, not a warning."* Anchor is where this is
enforced for the whole codebase. `resolveAnchor` returning `null` **is** the rejection. Its
**scope narrowed** with the pivot — far less of what
the user reads is a quote now — but it is unweakened wherever anything is quoted at all, which
includes every citation and the whole of the optional RAG path.

**The anchor format section**, quoted: *"`quote` must be a literal substring of the source at
that offset. Build plain text by concatenating extracted characters yourself, so offsets are
yours by construction. IDs are content-addressed: re-parsing must not reshuffle identity."*

**Repealed 2026-08-07, recorded so the deletion is not mistaken for an oversight.** This section
also cited *no user-facing text originates from the model* (invariant 1), on the ground that a bug
here was the most direct route to text on screen that was not the user's or their source's. That
invariant went with Law 2. Nothing in Anchor changes: the argument for exact-slice validation
never depended on it, and the quote-validation invariant above carries the whole of what this
module enforces.

## 5. Rulings and open questions

(Named "two things to rule on before the oracle" when there were two. A, B, C and the three
numbered rulings were settled 2026-08-05; D and E the following day, both off mutation runs.)

**A. `unit_id` is opaque here, and stays opaque. CLOSED.**
[What a unit is](https://github.com/danielhkuo/HoldTrue/issues/21) is open, but it does not block
this piece and never did: the round-trip property holds for any stable string, so Anchor carries
and compares `unit_id` without ever interpreting it. Whatever #21 decides, no change is needed
here — the decision lands in Index, which mints them.

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
amendment, and the context can itself change. No context window exists in this module; a worked
mutation example in `docs/workflow.md` once implied one, and it was illustrative rather than
normative.

**The consequence to hold onto:** a file edited mid-session makes its anchors unresolvable, and
`null` is the correct answer. Under invariant 2 a quote that cannot be verified is not shown.
Failing closed is the whole point.

**C. `doc_id` is a content hash, and that is what actually invalidates a stale anchor.**

Exact-offset comparison alone has a hole, found by a test rather than by reasoning: an edit that
slides a *different but identical* piece of text into the bookmarked position resolves
successfully and returns the wrong occurrence, silently. The likelier the more a term repeats,
and study notes repeat their key terms constantly.

So `doc_id` hashes the document's text, identifying **a version of a document** rather than a
file. An edited file has a different `doc_id`, and the `doc_id` comparison at the top of
`resolveAnchor` rejects every anchor made from the old version — before any text is compared, so
the collision is unreachable.

**Anchor needs no code for this.** It already compares `doc_id`. Computing the hash belongs to
whatever constructs a `Doc`, which is Index. Anchor stays a comparison, not a hasher.

Full reasoning and rejected alternatives in [`../decisions.md`](../decisions.md).

**The three rulings, decided 2026-08-05.** Stated by the human, encoded by agent. They were
enforced by tests and recorded in the commit history but not written down here, which the test
file nonetheless claimed; fixed 2026-08-06.

1. **A zero-length span is refused**, at creation and at resolution. An anchor exists to carry a
   quote. An empty quote carries nothing, and every string contains the empty string, so it would
   verify against any document at all — satisfying invariant 2 vacuously rather than actually.
   **Note the second job this now does:** with the offset comparisons gone it is also the only
   thing stopping `resolveAnchor` returning an inverted or zero-width `Span`. Relaxing it for a
   caret or insertion-point anchor would silently reopen that, and no test currently covers it.
2. **A span that cuts a character in half is refused** — at creation *and* at resolution; see E.
   A quote is user-facing, and a span that can only ever put a replacement glyph on screen is
   refused. See D for how the rule is expressed and how the first attempt got it backwards.
   (This ruling cited Law 2 when it was made. Law 2 was repealed 2026-08-07 and the ruling is
   untouched by that: it rests on the quote being *shown*, not on where the sentence around it
   came from.)
3. **A span that splits a letter from its combining accent is allowed.** Both halves are real
   readable text. The line is *is this valid text*, not *is this a whole visual character* — the
   latter would need full grapheme segmentation.

**D. The half-a-character rule asks about the quote, not about the offset. Corrected 2026-08-06.**

The first implementation asked whether an *offset* sat between two particular code units — was
the code unit before it a high surrogate. A mutation run found that wrong in both directions:

- It **accepted** a truncated character at the end of a document. On `'wave \uD83D'` it returned
  a fully verified anchor whose quote was half an emoji — precisely what the rule forbids.
- It **refused** readable text that merely sat beside a lone surrogate. In `'a\uD83Db'` the
  letter `b` was unanchorable.

Both are only reachable on malformed text *at creation*, and reading a UTF-8 file cannot produce
a lone surrogate — invalid bytes become U+FFFD. **This paragraph was wrong about resolution**:
`slice` manufactures half a character at bad offsets in a perfectly well-formed document, so the
resolve door was reachable on ordinary input all along. Corrected in E.

The rule now asks whether the **quote** is well-formed (`String.prototype.isWellFormed`), which
is what the ruling says in the first place. Requires `ES2024`; the Node 24 floor covers it at
runtime.

**The lesson generalises.** The predicate was written from the mechanism (surrogate pairs
occupy two code units) rather than from the rule (a quote must be valid text on its own).
Encoding the mechanism happened to agree with the rule on well-formed input and diverge
elsewhere. Where a rule can be stated directly, state it directly.


**E. Both rulings apply at both doors. Ruled 2026-08-06.**

Rulings 1 and 2 above ask the same question — *may this string be put in front of a user?* — so
they are asked once, by `isShowableQuote`, at **both** `createAnchor` and `resolveAnchor`.

**Why both doors.** An anchor can reach `resolveAnchor` without ever passing through
`createAnchor`: from storage, over IPC, or from a model that emits spans. Build order now puts
Extract second, and `AGENTS.md`'s eval rule for it is *"every span resolves"* — so `resolveAnchor`
is the gate for spans that were never created here. `slice` will manufacture half a character at
bad offsets in a perfectly **well-formed** document, so section 5D's "only reachable on malformed
text" was true of creation and false of resolution. Verified: on `'wave 👋 here'`,
`createAnchor(5, 6)` returned `null` while `resolveAnchor` accepted the same offsets and handed
back a lone surrogate.

**Consequence: two guards were deleted, not added.** A zero-length or inverted span slices to the
empty string, which is unshowable, so the separate `end <= start` comparisons in both functions
became dead code. A mutation run reported them as survivors, and they were removed rather than
tested — the module is smaller than before the ruling, not larger.

**Not a licence to relax `isUsableOffset`.** Those guards stay: `slice` coerces, so an anchor
whose start is shifted down by exactly the document length slices back to its own quote and would
otherwise resolve to a negative offset.

## 6. Hard cases the property test generator must produce

Named here so the generator can be checked against a list rather than inspected by vibe:

- **Astral-plane characters.** `"👋".length === 2` in JavaScript. Mixing code points and code
  units returns a wrong span silently and nothing throws.
- **Combining characters.** `e` + U+0301 is two code units that render as one glyph.
- **Repeated substrings**, so occurrence identity is actually tested.
- **Spans at position 0 and at `text.length`**, and the empty span where `start === end`.
- **CRLF**, which changes offsets between platforms if any layer normalises line endings.

## 7. What is not closed

Nothing in the code. One open question the pivot opened, and two notes it hands on:

**Open: how much of this module the default path still calls.** Extract does, for spans into the
user's explanation, and that is settled. What is not settled is whether the default path shows a
citation at all now that the finding comes from the model rather than from a passage, and that
answer sets whether `resolveAnchor` also runs on a display path or only on Extract's. It is a
question for the feature doc and the philosophy doc, not for this spec, and nothing here should be
changed in anticipation of either answer. Recorded 2026-08-07.

**To Index — deferred, not cancelled.** `doc_id` must be the hash of the `text` in the same `Doc`,
computed from the bytes just read. A `(size, mtime)` pre-filter is fine for deciding *whether* to
re-index; it is not fine
for constructing a `Doc`. Pair a cached hash with freshly read text and the silent-collision hole
in C reopens. Index also owns durable file identity, which `doc_id` deliberately is not — see
[issue #25](https://github.com/danielhkuo/HoldTrue/issues/25). Index moved off the default path on
2026-08-07, so this note waits for whoever builds the optional RAG hook. It is not weaker for
waiting: the collision it prevents is a property of hashing files, not of what the app does with
them.

**To whoever next trusts a mutation score here.** Extracting `isShowableQuote` means Stryker can
no longer express *"the rule was applied at one door and not the other"* — any mutation of the
predicate dies at the `createAnchor` call site before reaching the resolve door. The tests still
catch it semantically; the instrument cannot. 100% on this module is worth slightly less than it
reads.
