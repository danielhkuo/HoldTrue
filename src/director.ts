/**
 * The director. It reads the words of the conversation and picks the move for one turn.
 *
 * The turn number picked the move before. Three moves rotated, so three question shapes came
 * back on a period of three. See the open defect in `docs/research/child-prompt-ab.md`. This
 * module picks the move from what the person said and what the child has pressed. The block
 * names one word. The word changes every turn, so the block text rarely repeats.
 *
 * This module is plain code. It calls no model. It judges no line. Rules 1 and 33 hold. It reads
 * words only, through `wordsIn` and `STOP_WORDS`. It never edits the person's words. Rule 10.
 *
 * `docs/proposals/director-experiment.md` owns the design, including the four rules in order.
 */

import { STOP_WORDS, wordsIn } from './words.js'
import { VOCABULARY, type Exchange } from './child.js'

/** One word the person said. The child owes it a question until it is written off. */
export type Debt = {
  readonly word: string
  /** The turn where the person first said the word. Turn 0 is the first exchange. */
  readonly openedTurn: number
  /** The number of child lines that hold the word. */
  readonly pressed: number
}

/** A word is written off at this many presses. The child never names it again. */
const WRITE_OFF = 3

/** The presses weigh this much against the age. */
const PRESS_WEIGHT = 3

const NEGATIONS: ReadonlySet<string> = new Set(["can't", 'cannot', "doesn't", 'never', "won't", "isn't"])
const AFFIRMATIONS: ReadonlySet<string> = new Set(['can', 'does', 'goes', 'will', 'is'])

/** Content words only. */
const content = (line: string): readonly string[] => wordsIn(line).filter(w => !STOP_WORDS.has(w))

/** Every `them:` line, with the turn index. The new line is the last turn. */
const themLines = (history: readonly Exchange[], you: string): readonly string[] => [
  ...history.map(e => e.you),
  you,
]

/** Every `you:` line the child said. */
const youLines = (history: readonly Exchange[]): readonly string[] =>
  history.flatMap(e => (e.child.kind === 'said' ? [e.child.line] : []))

export const debts = (history: readonly Exchange[], you: string): readonly Debt[] => {
  const opened = new Map<string, number>()
  themLines(history, you).forEach((line, turn) => {
    for (const w of content(line)) if (!opened.has(w)) opened.set(w, turn)
  })
  const child = youLines(history).map(l => new Set(wordsIn(l)))
  return [...opened.entries()].map(([word, openedTurn]) => ({
    word,
    openedTurn,
    pressed: child.filter(set => set.has(word)).length,
  }))
}

/** The score of a debt. A higher score is a better target. */
const score = (d: Debt, now: number): number => now - d.openedTurn - PRESS_WEIGHT * d.pressed

/**
 * A noun that the person negated in an earlier line and affirms in the newest line.
 *
 * The noun of a negation or an affirmation is the nearest content word within three words
 * before it. In "the water can't get past" the noun is "water". The words must match exactly.
 * `src/` holds no stem function.
 *
 * The affirmation must sit in the newest line only. An earlier version matched an old affirmation
 * against an old negation. The same pair fired on every later turn. `direct` returned the same
 * block forever. The newest line is `lines[lines.length - 1]`, the `you` argument of `direct`. A
 * negation from any earlier line still counts.
 */
const contradiction = (lines: readonly string[]): string | null => {
  const after = (line: string, marks: ReadonlySet<string>): readonly string[] => {
    const raw = line.toLowerCase().split(/\s+/)
    const found: string[] = []
    raw.forEach((token, i) => {
      const bare = token.replace(/[^a-z']/g, '')
      if (!marks.has(bare)) return
      const before = raw.slice(Math.max(0, i - 3), i).reverse().flatMap(t => content(t))
      if (before[0] !== undefined) found.push(before[0])
    })
    return found
  }
  const newest = lines.length - 1
  for (let i = 0; i < newest; i++) {
    for (const noun of after(lines[i]!, NEGATIONS)) {
      if (after(lines[newest]!, AFFIRMATIONS).includes(noun)) return noun
    }
  }
  return null
}

/** The block for this turn. `promptFor` puts it after the script when the director flag is on. */
export const direct = (history: readonly Exchange[], you: string): string => {
  const lines = themLines(history, you)
  const now = lines.length - 1

  const noun = contradiction(lines)
  if (noun !== null) {
    return `[They said two things about "${noun}" that do not agree. Put both together and ask which one holds. ${VOCABULARY}]`
  }

  const open = debts(history, you)
    .filter(d => d.pressed < WRITE_OFF)
    .sort((a, b) => score(b, now) - score(a, now) || a.openedTurn - b.openedTurn)
  const top = open[0]
  if (top === undefined) {
    return `[Ask where a thing they mentioned goes, or what happens to it next. ${VOCABULARY}]`
  }
  if (top.pressed === 2) {
    return `[They keep using the word "${top.word}" as if it explains the step. Say you do not know that word and ask for the step without it. ${VOCABULARY}]`
  }
  return `[They said "${top.word}". Ask what makes that happen. ${VOCABULARY}]`
}
