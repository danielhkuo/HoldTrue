/**
 * The shared contract. This file holds every type that the end phase parts pass to each other.
 *
 * Check, Diff, Probe and Close import their types from here. The parts then agree on one shape.
 * Every field is readonly. A part must copy a value to change it.
 *
 * The types serve these cases: M2, M4, E1, E2a, E2b, E3, E9, E12, B1 and C4.
 * A Link with the covered flag false is a gap, which serves M2 and M4.
 * A Claim with the correct flag false is a false belief, which serves B1 and E2a.
 * An Intrusion is a child line that supplies a cause, which serves E1, E2b, E9 and E12.
 * A Review that is unavailable states that no review ran, which serves E3 and C4.
 *
 * This file must hold types only. It must not hold logic. It must not hold a constant.
 * A DiffRow must carry a kind, its own id and the id of the entry it points at. Probe and Close
 * read that second id to find the entry. Diff reads ids and flags, and Diff never reads text.
 * A model call must not throw. CheckResult and Review therefore each carry a failure member.
 */

/** Who said one turn. The server sets this mark, and no code infers it from the text. */
export type Speaker = "user" | "child";

/** One line in the session. The index is the position of the line in the session. */
export type Turn = {
  readonly speaker: Speaker;
  readonly text: string;
  readonly index: number;
};

/**
 * A range of the joined user text. The start and the end are offsets into that text.
 *
 * NO PART READS THESE TWO NUMBERS TODAY. Check writes a span. Diff, Probe and Close read none.
 * The app draws no highlight yet. Do not delete the field, and do not delete the code that makes
 * it. `locate()` in `src/check.ts` makes the span, and `locate()` is load bearing as a filter.
 * A null result from `locate()` means the user text does not hold the quote of the model. Check
 * then drops that claim. Check also takes the shipped text of a claim from the span, so the
 * claim carries the words of the user and never the paraphrase of the model. The stored offsets
 * are unread. The filter is not.
 */
export type Span = {
  readonly start: number;
  readonly end: number;
};

/**
 * One step of the true mechanism.
 * The id is stable inside one Check result. Diff keys on the id, and Diff never reads the words.
 * The covered flag true means the user said this link, and the span points at the user words.
 * The covered flag false means the user did not say this link.
 * A covered link can still carry a null span. Check keeps the flag and loses the offsets.
 */
export type Link = {
  readonly id: string;
  readonly cause: string;
  readonly relation: string;
  readonly effect: string;
  readonly covered: boolean;
  /** Check writes this. No part reads the offsets today. See the Span type. */
  readonly span: Span | null;
};

/** A statement that the user made, and whether that statement is true. */
export type Claim = {
  readonly id: string;
  readonly text: string;
  readonly correct: boolean;
  /** Check writes this, and Check cuts the text above from it. No part reads the offsets today. */
  readonly span: Span;
};

/** A child line that asserts a cause the user words do not contain. */
export type Intrusion = {
  readonly id: string;
  readonly turnIndex: number;
  readonly text: string;
};

/** The result of one probe. The supplied flag true means the user answer gave the link. */
export type Verdict = {
  readonly rowId: string;
  readonly supplied: boolean;
};

/**
 * What Check returns.
 * The checked member carries the report. The failed member carries the reason that Check stopped.
 */
export type CheckResult =
  | {
      readonly kind: "checked";
      readonly mechanism: readonly Link[];
      readonly claims: readonly Claim[];
      readonly intrusions: readonly Intrusion[];
      readonly verdict: Verdict | null;
    }
  | {
      readonly kind: "failed";
      readonly reason: string;
    };

/**
 * One row that Diff emits.
 * A contradiction row points at a claim. An intrusion row points at an intrusion.
 * An omission row points at a link. A row carries no text.
 */
export type DiffRow =
  | { readonly kind: "contradiction"; readonly id: string; readonly claimId: string }
  | { readonly kind: "intrusion"; readonly id: string; readonly intrusionId: string }
  | { readonly kind: "omission"; readonly id: string; readonly linkId: string };

/**
 * What Close produced for one row.
 * The stated flag false means that no model wrote this text. The text then names the failure.
 * The caller must not print such a row as a finding of a model.
 */
export type Finding = {
  readonly row: DiffRow;
  readonly text: string;
  readonly stated?: boolean;
};

/**
 * What the app shows after the session.
 * The reviewed member carries the findings. The end phase runs on the provided model only. Rule
 * 53. One kind of review needs no label, so the type carries no verified flag.
 * The unavailable member means that no review ran, and the questions stay open.
 */
export type Review =
  | {
      readonly kind: "reviewed";
      readonly findings: readonly Finding[];
    }
  | {
      readonly kind: "unavailable";
      readonly reason: string;
    };
