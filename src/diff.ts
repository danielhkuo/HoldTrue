/**
 * Diff. This part turns one Check result into an ordered list of rows.
 *
 * Diff is plain code. No model runs here. Rule 12 and rule 43 set this position.
 * Diff reads an id, a correct flag and a covered flag. Diff reads nothing else.
 *
 * Diff emits a contradiction row for each claim with the correct flag false.
 * Diff emits an intrusion row for each intrusion.
 * Diff emits an omission row for each link with the covered flag false.
 * Diff emits every contradiction, then every intrusion, then every omission. Rule 13 sets the
 * order. A false belief outranks an invented step. An invented step outranks a missing step.
 * Diff keeps the order of the Check result inside one kind.
 * Diff returns an empty list for a failed Check result. Rule 23 makes a model failure a result.
 *
 * The row id comes from the kind and the source id. The id is stable, so Probe and Close can name
 * a row, and a Verdict can point at the same row.
 *
 * The cases: M2, M4, B1, E1, E2b, E3, E9, E12 and C4.
 *
 * Diff must not read a cause, a relation, an effect, a text, a span or a turn index.
 * Diff must not compare text. Check owns that judgement, because that judgement needs a model.
 * Diff must not read the verdict. Probe and Close own the verdict.
 * Diff must not call a model. Diff must not hold a prompt. Diff must not throw.
 */

import type { CheckResult, DiffRow } from './types.js'

/** The row id. It comes from the kind and the source id. It never comes from the words. */
const rowId = (kind: DiffRow['kind'], sourceId: string): string => `${kind}:${sourceId}`

/**
 * The Diff step. It takes one Check result and it returns the rows in the required order.
 * The function is pure. The same input always gives the same output.
 */
export const diff = (c: CheckResult): readonly DiffRow[] => {
  if (c.kind === 'failed') return []

  const contradictions: DiffRow[] = c.claims
    .filter(({ correct }) => !correct)
    .map(({ id }) => ({ kind: 'contradiction', id: rowId('contradiction', id), claimId: id }))

  const intrusions: DiffRow[] = c.intrusions.map(({ id }) => ({
    kind: 'intrusion',
    id: rowId('intrusion', id),
    intrusionId: id,
  }))

  const omissions: DiffRow[] = c.mechanism
    .filter(({ covered }) => !covered)
    .map(({ id }) => ({ kind: 'omission', id: rowId('omission', id), linkId: id }))

  return [...contradictions, ...intrusions, ...omissions]
}
