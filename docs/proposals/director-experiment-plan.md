# Director Experiment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build three flags on the child, each off by default, and a harness that runs five conversations against Ollama.

**Architecture:** Two flags are string work in `src/child.ts` and a new pure module `src/director.ts`. The third flag is one number in `src/model.ts`. A script `src/experiment.ts` calls `speak` directly, like `src/rig.ts`, and writes a transcript to `measurements/director/`.

**Tech Stack:** TypeScript, Node 24, vitest, Ollama at `http://127.0.0.1:11434`.

## Global Constraints

- `AGENTS.md` binds every task. Read it first.
- Rule 1: exactly one model call per turn. No task adds a call.
- Rule 10: the person's words reach the model untouched.
- Rule 32: a unit test must not need Ollama, a network or Electron.
- Rule 36: a test name states what the test asserts.
- Rule 37: every document, comment and commit message uses ASD-STE100 Simplified Technical English.
- Rule 51 and 52: stage files with `git add`. Do not run `git commit`. Write the commit message in the report.
- Every flag defaults off. `npm run check` must pass with the same 181 tests plus the new ones.
- The spec is `docs/proposals/director-experiment.md`. One deviation from it: `sampling` is an option of the model handle, not of `speak`. The model handle owns the request body. `speak` never sees the temperature.

## File structure

| File | Responsibility |
|---|---|
| `src/child.ts` | `Options` type. `promptFor` reads `hideOwnLines` and `director`. `speak` passes options through. |
| `src/director.ts` | New. `direct(history, you)` picks the move from the words. Pure. |
| `src/director.test.ts` | New. Tests for `direct`. |
| `src/model.ts` | `ollama(model, temperature)` and `open(backend, temperature)`. |
| `src/server.ts` | Reads three environment variables. Passes options. |
| `src/experiment.ts` | New. One run, one transcript file. |
| `measurements/director/README.md` | New. Says what the folder holds and what it is not. |

---

### Task 1: `hideOwnLines` in `promptFor`

**Files:**
- Modify: `src/child.ts` (the `promptFor` function, near line 290)
- Test: `src/child.test.ts`

**Interfaces:**
- Produces: `export type Options = { readonly hideOwnLines: boolean; readonly director: boolean }`, `export const DEFAULTS: Options`, and `promptFor(history, you, options?: Partial<Options>)`.

- [ ] **Step 1: Write the failing tests**

Add to `src/child.test.ts`, at the end of the file:

```ts
describe('flag hideOwnLines: the prompt holds the last child line only', () => {
  const history: Exchange[] = [
    ex('the lever pulls the cable', 'What does the cable pull?'),
    ex('the pads I think', 'What do the pads do?'),
    ex('they squeeze the rim', 'What makes them squeeze?'),
  ]

  test('the prompt holds every them line', () => {
    const prompt = promptFor(history, 'the cable does', { hideOwnLines: true })
    expect(prompt).toContain('them: the lever pulls the cable')
    expect(prompt).toContain('them: the pads I think')
    expect(prompt).toContain('them: they squeeze the rim')
  })

  test('the prompt holds the last child line', () => {
    const prompt = promptFor(history, 'the cable does', { hideOwnLines: true })
    expect(prompt).toContain('you: What makes them squeeze?')
  })

  test('the prompt holds no earlier child line', () => {
    const prompt = promptFor(history, 'the cable does', { hideOwnLines: true })
    expect(prompt).not.toContain('What does the cable pull?')
    expect(prompt).not.toContain('What do the pads do?')
  })

  test('without the flag the prompt holds every child line', () => {
    const prompt = promptFor(history, 'the cable does')
    expect(prompt).toContain('What does the cable pull?')
    expect(prompt).toContain('What do the pads do?')
    expect(prompt).toContain('What makes them squeeze?')
  })

  test('with the flag the prompt still ends on the late block and an empty you line', () => {
    const prompt = promptFor(history, 'x', { hideOwnLines: true })
    expect(prompt).toContain(lateBlock(3))
    expect(prompt).toMatch(/\n\nyou:$/)
  })
})
```

- [ ] **Step 2: Run the tests and watch them fail**

Run: `npx vitest run src/child.test.ts -t hideOwnLines`
Expected: FAIL. `promptFor` ignores the third argument, so "holds no earlier child line" fails.

- [ ] **Step 3: Stage the test**

```bash
git add src/child.test.ts
```

- [ ] **Step 4: Write the implementation**

In `src/child.ts`, above `promptFor`, add:

```ts
/**
 * The flags on the child. Every flag defaults off. `docs/proposals/director-experiment.md` owns
 * the design. A flag changes the prompt string only. No flag adds a model call. Rule 1.
 */
export type Options = {
  /** The prompt holds the last child line only. An earlier child line does not appear. */
  readonly hideOwnLines: boolean
  /** The words the person said pick the move. The turn number does not. */
  readonly director: boolean
}

export const DEFAULTS: Options = { hideOwnLines: false, director: false }
```

Replace `promptFor` with:

```ts
export const promptFor = (
  history: readonly Exchange[],
  you: string,
  options: Partial<Options> = {},
): string => {
  const { hideOwnLines } = { ...DEFAULTS, ...options }
  const lastSaid = [...history].reverse().findIndex(e => e.child.kind === 'said')
  const lastSaidIndex = lastSaid === -1 ? -1 : history.length - 1 - lastSaid
  const script = history
    .flatMap((e, i) => [
      `them: ${e.you}`,
      ...(e.child.kind === 'said' && (!hideOwnLines || i === lastSaidIndex)
        ? [`you: ${e.child.line}`]
        : []),
    ])
    .join('\n')
  const head = script === '' ? '' : `${script}\n`
  return `${head}them: ${you}\n\n${lateBlock(history.length)}\n\nyou:`
}
```

Keep the doc comment above `promptFor`. Add one paragraph to it:

```
 * With `hideOwnLines` the script holds the last child line only. A repeated phrase raises its
 * own probability with every repeat, and the child's own lines were the strongest example in the
 * prompt. See measured result 5. The child still reads its own last question, so a fragment
 * answer keeps its meaning.
```

- [ ] **Step 5: Run the whole suite**

Run: `npm run check`
Expected: PASS. 181 old tests and 5 new tests.

- [ ] **Step 6: Stage**

```bash
git add src/child.ts
```

Commit message for the report:

```
feat: the child can see one of its own lines instead of all of them

A flag on promptFor. Off by default. docs/proposals/director-experiment.md
owns the design.
```

---

### Task 2: the director

**Files:**
- Create: `src/director.ts`
- Create: `src/director.test.ts`
- Modify: `src/child.ts` (`promptFor` reads `options.director`)

**Interfaces:**
- Consumes: `wordsIn`, `STOP_WORDS` from `src/discriminate.ts`. `Exchange` from `src/child.ts`. `VOCABULARY` must become an export of `src/child.ts`.
- Produces: `export const direct = (history: readonly Exchange[], you: string): string`. `export const debts = (history: readonly Exchange[], you: string): readonly Debt[]`. `export type Debt = { readonly word: string; readonly openedTurn: number; readonly pressed: number }`.

- [ ] **Step 1: Export `VOCABULARY` from `src/child.ts`**

Change `const VOCABULARY =` to `export const VOCABULARY =`. Run `npm run check`. Expected: PASS.

- [ ] **Step 2: Write the failing tests**

Create `src/director.test.ts`:

```ts
/**
 * The tests for the director. Every test runs a pure function. No test needs a model. Rule 32.
 * No test judges a line. The tests check which word and which move the block names. Rule 33.
 */

import { describe, expect, test } from 'vitest'
import { debts, direct } from './director.js'
import { VOCABULARY, type Exchange, type Said } from './child.js'

const said = (line: string): Said => ({ kind: 'said', line })
const ex = (you: string, line: string): Exchange => ({ you, child: said(line), seconds: 0 })

describe('debts: the words the person said, and how often the child pressed each', () => {
  test('a content word the person said is a debt', () => {
    const d = debts([], 'the lever pulls the cable')
    expect(d.map(x => x.word)).toEqual(expect.arrayContaining(['lever', 'pulls', 'cable']))
  })

  test('a stop word is not a debt', () => {
    const d = debts([], 'the lever pulls the cable')
    expect(d.map(x => x.word)).not.toContain('the')
  })

  test('a debt records the turn where the person first said the word', () => {
    const history = [ex('the lever moves', 'What moves it?'), ex('the cable', 'What is it?')]
    const d = debts(history, 'the lever again')
    expect(d.find(x => x.word === 'lever')?.openedTurn).toBe(0)
    expect(d.find(x => x.word === 'cable')?.openedTurn).toBe(1)
  })

  test('a debt counts the child lines that hold the word', () => {
    const history = [
      ex('the pads squeeze', 'What do the pads do?'),
      ex('they grip', 'The pads grip what?'),
    ]
    const d = debts(history, 'the pads')
    expect(d.find(x => x.word === 'pads')?.pressed).toBe(2)
  })
})

describe('direct: the words pick the move', () => {
  test('the block carries the vocabulary rule', () => {
    expect(direct([], 'the lever pulls the cable')).toContain(VOCABULARY)
  })

  test('the block names a word the person said and the child never used', () => {
    const block = direct([], 'the lever pulls the cable')
    expect(block).toMatch(/"(lever|pulls|cable)"/)
  })

  test('a new word gets the cause move', () => {
    expect(direct([], 'the lever pulls the cable')).toContain('Ask what makes that happen')
  })

  test('a word pressed twice gets the word ban move', () => {
    const history = [
      ex('it is friction', 'What is friction doing?'),
      ex('friction just does it', 'What does friction do to the wheel?'),
    ]
    const block = direct(history, 'friction, like I said')
    expect(block).toContain('"friction"')
    expect(block).toContain('Say you do not know that word')
  })

  test('a word pressed three times is never named again', () => {
    const history = [
      ex('it is friction', 'What is friction doing?'),
      ex('friction just does it', 'What does friction do?'),
      ex('friction, like I said', 'Friction does what though?'),
    ]
    expect(direct(history, 'friction')).not.toContain('"friction"')
  })

  test('the oldest unpressed word outranks a newer one', () => {
    const history = [ex('the spring pushes', 'What pushes what?')]
    const block = direct(history, 'the cable goes tight')
    expect(block).toContain('"spring"')
  })

  test('a contradiction on one noun gets the contradiction move', () => {
    const history = [ex("the water can't get past the hump", 'What is the hump?')]
    const block = direct(history, 'then the water goes over the hump')
    expect(block).toContain('"water"')
    expect(block).toContain('do not agree')
  })

  test('with no open debt the block carries the destination move', () => {
    const history = [ex('it is friction', 'What is friction?'), ex('friction', 'Friction how?'), ex('friction', 'What does friction do?')]
    const block = direct(history, 'friction')
    expect(block).toContain('Ask where a thing they mentioned goes')
  })

  test('the block text changes when the target word changes', () => {
    const a = direct([], 'the lever pulls')
    const b = direct([], 'the spring pushes')
    expect(a).not.toBe(b)
  })
})
```

- [ ] **Step 3: Run the tests and watch them fail**

Run: `npx vitest run src/director.test.ts`
Expected: FAIL. `./director.js` does not exist.

- [ ] **Step 4: Stage the test**

```bash
git add src/director.test.ts src/child.ts
```

- [ ] **Step 5: Write the implementation**

Create `src/director.ts`:

```ts
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

import { STOP_WORDS, wordsIn } from './discriminate.js'
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
 * A noun that the person negated in one line and affirmed in a later line.
 *
 * The noun of a negation or an affirmation is the nearest content word within three words
 * before it. In "the water can't get past" the noun is "water". The words must match exactly.
 * `src/` holds no stem function.
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
  for (let i = 0; i < lines.length; i++) {
    for (const noun of after(lines[i]!, NEGATIONS)) {
      for (let j = i + 1; j < lines.length; j++) {
        if (after(lines[j]!, AFFIRMATIONS).includes(noun)) return noun
      }
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
```

- [ ] **Step 6: Wire the flag into `promptFor`**

In `src/child.ts`, add `import { direct } from './director.js'` at the top. This is a cycle: `director.ts` imports `VOCABULARY` and the `Exchange` type from `child.ts`. ES modules allow it, because `direct` runs after both modules load. If `npm run check` reports a problem with the cycle, move `VOCABULARY` and the `Exchange`, `Said` and `Line` types to a new file `src/child-types.ts` and import them in both files.

In `promptFor`, change the destructure and the last line:

```ts
  const { hideOwnLines, director } = { ...DEFAULTS, ...options }
  ...
  const block = director ? direct(history, you) : lateBlock(history.length)
  return `${head}them: ${you}\n\n${block}\n\nyou:`
```

Add to `src/child.test.ts`, at the end:

```ts
describe('flag director: the words pick the move', () => {
  test('with the flag the prompt ends on the director block', () => {
    const prompt = promptFor([], 'the lever pulls the cable', { director: true })
    expect(prompt).toContain('"')
    expect(prompt).not.toContain(lateBlock(0))
  })

  test('without the flag the prompt ends on the rotated block', () => {
    expect(promptFor([], 'the lever pulls the cable')).toContain(lateBlock(0))
  })
})
```

- [ ] **Step 7: Run the whole suite**

Run: `npm run check`
Expected: PASS.

- [ ] **Step 8: Stage**

```bash
git add src/director.ts src/child.ts src/child.test.ts
```

Commit message for the report:

```
feat: the director picks the move from the words the person said

A new pure module. A word the person said is a debt. The oldest unpressed
debt is the target. Two presses turn the move into the word ban. Three
presses write the word off. A negated noun that a later line affirms gets the
contradiction move. Off by default, behind the director flag on promptFor.
```

---

### Task 3: `speak` passes the options through

**Files:**
- Modify: `src/child.ts` (`speak`)
- Test: `src/child.test.ts`

**Interfaces:**
- Produces: `speak(history, you, model, topic = '', options: Partial<Options> = {})`.

- [ ] **Step 1: Write the failing test**

Add to `src/child.test.ts`, at the end:

```ts
describe('speak passes the flags to the prompt', () => {
  test('with hideOwnLines the user message holds the last child line only', async () => {
    const { handle, seen } = fake('What holds it?')
    const history = [ex('a', 'FIRST LINE'), ex('b', 'SECOND LINE')]
    await speak(history, 'c', handle, '', { hideOwnLines: true })
    expect(seen[0]?.user).toContain('SECOND LINE')
    expect(seen[0]?.user).not.toContain('FIRST LINE')
  })
})
```

- [ ] **Step 2: Run and watch it fail**

Run: `npx vitest run src/child.test.ts -t "passes the flags"`
Expected: FAIL. `speak` takes four arguments.

- [ ] **Step 3: Stage the test**

```bash
git add src/child.test.ts
```

- [ ] **Step 4: Implement**

Change the signature of `speak` and the call inside it:

```ts
export const speak = async (
  history: readonly Exchange[],
  you: string,
  model: ModelHandle,
  topic = '',
  options: Partial<Options> = {},
): Promise<Said> => {
  const answer = await model.ask(systemFor(history.length, topic), promptFor(history, you, options))
```

- [ ] **Step 5: Run the whole suite and stage**

Run: `npm run check`. Expected: PASS.

```bash
git add src/child.ts
```

Commit message for the report:

```
feat: speak takes the child flags
```

---

### Task 4: the sampling flag in the model layer

**Files:**
- Modify: `src/model.ts` (`open`, `ollama`, the two request bodies)
- Test: `src/model.test.ts`

**Interfaces:**
- Produces: `open(backend: Backend, temperature = 0)` and `ollama(model?: string, temperature = 0)`.

- [ ] **Step 1: Write the failing tests**

Add to `src/model.test.ts`, inside `describe('the ollama request', ...)`:

```ts
  test('the request sends temperature 0 by default', async () => {
    const calls = answers(ollamaBody('hi'))
    await ollama('llama3.2').ask('s', 'u')

    expect(bodyOf(calls[0]!)['options']).toEqual({ temperature: 0 })
  })

  test('the request sends the temperature the caller gave', async () => {
    const calls = answers(ollamaBody('hi'))
    await ollama('llama3.2', 0.8).ask('s', 'u')

    expect(bodyOf(calls[0]!)['options']).toEqual({ temperature: 0.8 })
  })
```

Add inside `describe('the anthropic request', ...)`, using the same helpers that describe block already uses for a key and a body:

```ts
  test('the request sends the temperature the caller gave', async () => {
    const calls = answers(anthropicBody('hi'))
    await open({ kind: 'apiKey', provider: 'anthropic', key: 'k', model: 'm' }, 0.8).ask('s', 'u')

    expect(bodyOf(calls[0]!)['temperature']).toBe(0.8)
  })
```

Read the existing anthropic tests first. Use the helper names they use for the body. If the helper is not named `anthropicBody`, use the name in the file.

- [ ] **Step 2: Run and watch them fail**

Run: `npx vitest run src/model.test.ts -t temperature`
Expected: FAIL on the two 0.8 tests.

- [ ] **Step 3: Stage the test**

```bash
git add src/model.test.ts
```

- [ ] **Step 4: Implement**

In `src/model.ts`:

```ts
export const open = (backend: Backend, temperature = 0): ModelHandle => {
```

Replace `options: { temperature: 0 }` with `options: { temperature }`. Replace `temperature: 0,` in the anthropic body with `temperature,`.

```ts
export const ollama = (model?: string, temperature = 0): ModelHandle =>
  open({ kind: 'ollama', model }, temperature)
```

Read the existing `ollama` export at line 260 and keep its shape. Add the parameter only.

Add to the header comment of `src/model.ts`, after the sentence about temperature 0 on line 22:

```
 * A caller can pass a temperature. The default stays 0. `docs/proposals/director-experiment.md`
 * owns the sampling flag. Only `temperature` goes to a backend. `min_p`, `top_p` and a penalty
 * stay out, because not every backend holds them.
```

- [ ] **Step 5: Run the whole suite and stage**

Run: `npm run check`. Expected: PASS.

```bash
git add src/model.ts
```

Commit message for the report:

```
feat: a caller can set the temperature of a model handle

The default stays 0. Only temperature goes to a backend.
```

---

### Task 5: the server reads three environment variables

**Files:**
- Modify: `src/server.ts` (near line 62 for the variables, line 267 for `open`, line 365 for `speak`)

**Interfaces:**
- Consumes: `open(backend, temperature)`, `speak(history, said, startup, topic, options)`.

- [ ] **Step 1: Read the flags**

After `const PORT = ...` add:

```ts
/**
 * The three child flags. Each defaults off. A value of "1" turns one on.
 * `docs/proposals/director-experiment.md` owns the design. The flags change the prompt and the
 * temperature only. `POST /api/turn` does not change.
 */
const flag = (name: string): boolean => (process.env[name] ?? '') === '1'
const CHILD_OPTIONS = {
  hideOwnLines: flag('CHILD_HIDE_OWN_LINES'),
  director: flag('CHILD_DIRECTOR'),
}
const TEMPERATURE = flag('CHILD_SAMPLING') ? 0.8 : 0
```

- [ ] **Step 2: Pass them**

Change `startup = open(backend)` to `startup = open(backend, TEMPERATURE)`.

Change `const child = await speak(history, said, startup, live.topic)` to
`const child = await speak(history, said, startup, live.topic, CHILD_OPTIONS)`.

- [ ] **Step 3: Check and stage**

Run: `npm run check`. Expected: PASS. No new test: the server has no unit test today, and rule 32 keeps it that way.

```bash
git add src/server.ts
```

Commit message for the report:

```
feat: the server reads the three child flags from the environment
```

---

### Task 6: the experiment harness

**Files:**
- Create: `src/experiment.ts`
- Create: `measurements/director/README.md`
- Modify: `package.json` (one script)

**Interfaces:**
- Consumes: `ollama(model, temperature)`, `speak(history, you, model, topic, options)`, `Exchange`.

- [ ] **Step 1: Write the README**

Create `measurements/director/README.md`:

```markdown
# The director experiment

This folder holds the transcripts of the five runs in
[`docs/proposals/director-experiment.md`](../../docs/proposals/director-experiment.md).
`src/experiment.ts` writes one file for each run letter.

Two models talked to each other. No person spoke. Every number in this folder is an engineering
count about a machine. Rule 29 holds. No figure from this folder argues a rule change. No figure
from this folder may enter a document outside this folder.

| Run | Flags |
|---|---|
| A | none |
| B | hideOwnLines |
| C | director |
| D | sampling, temperature 0.8 |
| E | all three |

Run one with `npm run experiment -- A`. The script reads `OLLAMA_MODEL` for the model name. Both
sides use the same model.
```

- [ ] **Step 2: Write the script**

Create `src/experiment.ts`:

```ts
/**
 * The experiment: one run, one transcript.
 *
 *     npm run experiment -- A            -- the run letter picks the flags
 *     npm run experiment -- E 8          -- the second argument sets the number of turns
 *
 * A model plays the person. The person explains a bike brake from memory, reaches for the word
 * "friction", and never says the planted gap. The child answers with the flags of the run. The
 * script writes the transcript to `measurements/director/<run>.md`.
 *
 * This script is a rig. It emits a transcript and nothing else. It judges no line. It counts
 * nothing. The counts come from a reader. Rule 29 holds: two models in conversation are not a
 * measurement. `docs/proposals/director-experiment.md` owns the design.
 */

import { writeFileSync, mkdirSync } from 'node:fs'
import { ollama } from './model.js'
import { speak, type Exchange, type Options } from './child.js'

type Run = { readonly options: Partial<Options>; readonly temperature: number }

const RUNS: Record<string, Run> = {
  A: { options: {}, temperature: 0 },
  B: { options: { hideOwnLines: true }, temperature: 0 },
  C: { options: { director: true }, temperature: 0 },
  D: { options: {}, temperature: 0.8 },
  E: { options: { hideOwnLines: true, director: true }, temperature: 0.8 },
}

const PERSON = `You are explaining how a bicycle brake works, out loud, to a curious 10-year-old. You go from memory. You are not a physicist.

RULES:
1. One or two spoken sentences per turn. Never more.
2. Plain spoken English. "so when you...", "and that makes...".
3. Answer the child's last line. Then carry on if you can.
4. You use the word "friction" as if the word itself explains the step. You do not unpack it.
5. You never say that friction turns the motion of the wheel into heat. You do not know that part. If the child pushes on it, say you are not sure.
6. Never use a bullet point, a heading or a numbered list.`

const TOPIC = 'How a bicycle brake stops the wheel'

const letter = (process.argv[2] ?? 'A').toUpperCase()
const run = RUNS[letter]
if (run === undefined) {
  console.error(`Unknown run "${letter}". Use A, B, C, D or E.`)
  process.exit(1)
}
const maxTurns = Number(process.argv[3] ?? 8)
const modelName = process.env.OLLAMA_MODEL
if (modelName === undefined || modelName.trim() === '') {
  console.error('Set OLLAMA_MODEL. Rule 50: no default model.')
  process.exit(1)
}

const person = ollama(modelName, 0.8)
const child = ollama(modelName, run.temperature)
const who = await child.identify()

const history: Exchange[] = []
for (let n = 0; n < maxTurns; n++) {
  const script = history
    .flatMap(e => [`you: ${e.you}`, ...(e.child.kind === 'said' ? [`child: ${e.child.line}`] : [])])
    .join('\n')
  const raw = await person.ask(PERSON, `${script}\nyou:`)
  if (raw === null) break
  const you = raw.trim().split('\n').filter(l => l.trim() !== '').join(' ').trim()
  if (you === '') break

  const started = Date.now()
  const said = await speak(history, you, child, TOPIC, run.options)
  history.push({ you, child: said, seconds: (Date.now() - started) / 1000 })
  console.log(`them:  ${you}`)
  console.log(`child: ${said.kind === 'said' ? said.line : `(silent: ${said.reason})`}\n`)
}

const flags = Object.entries({ ...run.options, temperature: run.temperature })
  .map(([k, v]) => `${k}=${String(v)}`)
  .join(', ')
const lines = [
  `# Run ${letter}`,
  '',
  `Two models talked to each other. No person spoke. This is not a measurement. Rule 29 holds.`,
  '',
  `- Model: ${who.model_id} (${who.runtime})`,
  `- Flags: ${flags}`,
  `- Turns: ${history.length}`,
  '',
  ...history.flatMap((e, i) => [
    `**${i + 1}. them:** ${e.you}`,
    '',
    `**${i + 1}. child:** ${e.child.kind === 'said' ? e.child.line : `(silent: ${e.child.reason})`}`,
    '',
  ]),
]
mkdirSync('measurements/director', { recursive: true })
writeFileSync(`measurements/director/${letter}.md`, lines.join('\n'))
console.log(`wrote measurements/director/${letter}.md`)
```

- [ ] **Step 3: Add the script to `package.json`**

Add after `"rig"`:

```json
    "experiment": "npx --yes tsx src/experiment.ts",
```

- [ ] **Step 4: Check the types and do one smoke run**

Run: `npm run check`. Expected: PASS.
Run: `OLLAMA_MODEL=muse-glimmer:30b-mlx npm run experiment -- A 1`
Expected: one `them:` line, one `child:` line, and the file `measurements/director/A.md`. Delete that file after the smoke run: the real run A overwrites it in Task 7.

- [ ] **Step 5: Stage**

```bash
git add src/experiment.ts measurements/director/README.md package.json
```

Commit message for the report:

```
build: the experiment harness writes one transcript for each run letter
```

---

### Task 7: the five runs and the counts

This task needs Ollama and `muse-glimmer:30b-mlx`. It is not a unit test.

- [ ] **Step 1: Run the five conversations**

Five subagents, one per letter, in parallel. Each runs:

```bash
OLLAMA_MODEL=muse-glimmer:30b-mlx npm run experiment -- <LETTER> 8
```

Each agent then reads `measurements/director/<LETTER>.md` and counts the five things in the spec section "The counts". Each agent returns the five counts and one line of evidence for each count (the child lines that it counted).

- [ ] **Step 2: The blind count**

A sixth agent reads the five transcripts with the run letter and the flags line removed. It counts the same five things. It returns a table.

- [ ] **Step 3: Write the report**

Create `measurements/director/counts.md` with both tables, the disagreements, and one line for each flag: the claim from the spec, and whether the count supports it. No average. No rate.

- [ ] **Step 4: Stage**

```bash
git add measurements/director/
```

Commit message for the report:

```
measure: five runs of the child, A to E, and two counts of each

Two models talked to each other. The counts are engineering counts about a
machine. Rule 29 holds. The owner reads them and rules on each flag.
```
