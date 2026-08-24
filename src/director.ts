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
 * `docs/proposals/director-experiment.md` owns the design, including the five rules in order:
 * contradiction, confession, word ban, cause and destination. Round 2 added the confession rule
 * and three wordings for the cause, ban and destination moves. `direct` deals one wording by
 * `history.length % 3`. The contradiction and the confession keep one wording each. Round 3 added
 * the opener guard. Every block passes through `wrap`, which bans the child's last repeated
 * opener before the closing bracket.
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

/**
 * The phrase for a confession. The match is case blind. It reads the newest `them:` line only.
 *
 * `docs/proposals/director-experiment.md`, section "Round 2", owns this pattern.
 */
const CONFESSION =
  /\b(?:don'?t|do not|dunno|can'?t|cannot)\s+(?:know|remember)\b|\bnot\s+(?:really\s+)?sure\b|\bno idea\b/i

/**
 * Three wordings for each frequent move. `direct` deals one by `history.length % 3`. The word
 * "{W}" is a placeholder. `direct` puts the target word in its place, inside the quotes that are
 * already in the string. `docs/proposals/director-experiment.md`, section "Round 2", owns the
 * three sets. No wording holds a question. A question sentence gives the model a line to copy.
 */
export const WORDINGS: {
  readonly cause: readonly string[]
  readonly ban: readonly string[]
  readonly destination: readonly string[]
} = {
  cause: [
    'They said "{W}". They did not say what makes that happen. Go after that missing piece.',
    'Something causes "{W}", and they skipped it. Get them to say the step behind it.',
    'The word "{W}" arrived with no cause behind it. Pull that cause out of them.',
  ],
  ban: [
    'They keep leaning on the word "{W}" as if it explains the step. Say you do not know that word, and get the step without it.',
    'The word "{W}" is doing all the work. Tell them the word means nothing to you, and get that part again in plain words.',
    '"{W}" keeps standing in for the explanation. Get them to say the step another way, without it.',
  ],
  destination: [
    'Something they mentioned goes somewhere, or turns into something else. Find out where, or what.',
    'Pick a thing they mentioned, and chase what happens to it next.',
    'A thing in their story moves on. Follow it one step further.',
  ],
}

/** The wording for this turn, from the list, dealt by the length of the history. */
const dealt = (list: readonly string[], history: readonly Exchange[]): string =>
  list[history.length % list.length]!

/** The wording with the target word in place of the placeholder. */
const named = (wording: string, word: string): string => wording.replace('{W}', word)

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

/**
 * The first three words of a child line. The match is lower case. Punctuation is stripped.
 * A line under three words gives a shorter opener. The ban then quotes the words that exist.
 *
 * `docs/proposals/director-experiment.md`, section "Round 3", owns this rule.
 */
const opener = (line: string): string =>
  line
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .trim()
    .split(/\s+/)
    .slice(0, 3)
    .join(' ')

/**
 * The ban line for the opener guard. Empty when the guard does not fire.
 *
 * The guard reads the last two child said-lines only. It ignores an older repeat. When both
 * lines share the same first-three-words opener, the child gets one line that names those
 * words. Round 2 made a new most-repeated shape. This guard caps that repeat. It is one string
 * compare. No model judges anything. Rule 33 holds.
 */
const openerBan = (history: readonly Exchange[]): string => {
  const said = youLines(history)
  if (said.length < 2) return ''
  const [first, second] = said.slice(-2) as [string, string]
  const a = opener(first)
  const b = opener(second)
  return a !== '' && a === b ? ` Do not start with: "${a}".` : ''
}

/** The block, wrapped in brackets, with the opener guard applied before the closing bracket. */
const wrap = (text: string, history: readonly Exchange[]): string => `[${text}${openerBan(history)}]`

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
    return wrap(
      `They said two things about "${noun}" that do not agree. Put both together and ask which one holds. ${VOCABULARY}`,
      history,
    )
  }

  if (CONFESSION.test(you)) {
    return wrap(
      `They said they are not sure of that part. Have them say the last part they are sure of. ${VOCABULARY}`,
      history,
    )
  }

  const open = debts(history, you)
    .filter(d => d.pressed < WRITE_OFF)
    .sort((a, b) => score(b, now) - score(a, now) || a.openedTurn - b.openedTurn)
  const top = open[0]
  if (top === undefined) {
    return wrap(`${dealt(WORDINGS.destination, history)} ${VOCABULARY}`, history)
  }
  if (top.pressed === 2) {
    return wrap(`${named(dealt(WORDINGS.ban, history), top.word)} ${VOCABULARY}`, history)
  }
  return wrap(`${named(dealt(WORDINGS.cause, history), top.word)} ${VOCABULARY}`, history)
}
