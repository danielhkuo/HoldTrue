/**
 * Check. The first part of the end phase, and the part that decides link identity.
 *
 * Check reads the marked transcript. Check returns the true mechanism as a list of links. Check
 * sets the covered flag on each link itself. Check also returns the claims of the user, the child
 * lines that supply a cause, and the verdict on a probe answer.
 *
 * Check serves M2, M4, E1, E2a, E2b, E9, E12, B1 and C4. A link with the covered flag false is a
 * gap, which serves M2. A claim with the correct flag false is a false belief, which serves B1 and
 * E2a. An intrusion is a child line that supplies a cause, which serves E1, E2b, E9 and E12.
 *
 * WHY THIS PART OWNS IDENTITY. A model judges that "the gas gets squeezed" and "compression" name
 * one link. Plain code cannot judge that. A text subtraction turns a paraphrase into a false
 * omission. The product then tells the user they skipped a step they said. That is the worst
 * output the review can produce, because it corrects a correct explanation. So Check writes the
 * whole judgement into one flag. Rule 43 then holds: Diff reads ids and flags, and never text.
 *
 * Check must never treat a child turn as the user speaking. Every turn carries a speaker mark, and
 * Check reads that mark. The child invents things. An invented cause must never become a claim of
 * the user. Check therefore anchors every claim in the joined user text, and drops a claim it
 * cannot anchor. Check also drops an intrusion that does not point at a child turn. An entry that
 * fails this rule is not evidence, so Check removes it rather than reports it.
 *
 * A claim carries the located user words. Check never ships the free text of the model as a claim.
 * The model writes a short paraphrase, and that paraphrase can hold a cause the user never said.
 * Close prints the claim to the user as their own sentence, so the span owns the words.
 *
 * Check must not throw. A model that does not answer is a result. Check returns the failed member
 * with a distinct reason for each cause, which serves rule 23 and rule 25.
 *
 * Check must not decide what the app shows. Check must not order the findings. Check must not
 * write a sentence for the user. Diff orders the rows and Close writes the sentences.
 *
 * NO TEST FILE. This part has no oracle. No test can say that a mechanism is the true mechanism,
 * and no test can say that a covered flag is correct. Rule 33 and rule 34 forbid such a test. The
 * parser below is the only testable half, and an end-to-end run against a real model is the check
 * that applies here. See rule 31.
 */

import type { ModelHandle } from './model.js'
import type { CheckResult, Claim, Intrusion, Link, Span, Turn } from './types.js'

/** One probe. The caller owns the row id, so no model can invent it. */
export type Probe = {
  readonly question: string
  readonly answer: string
  readonly rowId: string
}

/* ── the joined user text and the spans into it ──────────────────────────────────────────────── */

/**
 * The joined user text. A span points into this string and into nothing else.
 *
 * The words go in untouched. Rule 10 holds here as it holds in the live phase. A filled pause, a
 * stammer and a final full stop stay, because Close later quotes the user to the user.
 */
const joinUser = (turns: readonly Turn[]): string =>
  turns.filter(t => t.speaker === 'user').map(t => t.text).join('\n')

/**
 * A folded copy of a string, and the map from each folded position to the original position.
 *
 * The fold keeps letters and digits, lowercases them, and puts one space between runs. A model
 * copies a quote with a changed capital or a dropped comma often enough to matter, and a lost
 * span costs the user a finding. The fold buys those quotes back without changing the user words.
 */
const fold = (s: string): { readonly text: string; readonly map: readonly number[] } => {
  const out: string[] = []
  const map: number[] = []
  let gap = false
  for (let i = 0; i < s.length; i += 1) {
    const ch = s[i]!
    if (/[a-z0-9]/i.test(ch)) {
      if (gap && out.length > 0) {
        out.push(' ')
        map.push(i)
      }
      gap = false
      out.push(ch.toLowerCase())
      map.push(i)
    } else {
      gap = true
    }
  }
  return { text: out.join(''), map }
}

/**
 * The span of a quote inside the user text, or null when the user text does not hold the quote.
 *
 * A null result means one thing. The quote is not the words of the user. The caller then drops the
 * entry. Check must not point at user words that the user did not say.
 */
const locate = (quote: string, userText: string): Span | null => {
  const exact = userText.indexOf(quote)
  if (exact >= 0) return { start: exact, end: exact + quote.length }

  const hay = fold(userText)
  const needle = fold(quote).text
  if (needle === '') return null
  const at = hay.text.indexOf(needle)
  if (at < 0) return null
  const start = hay.map[at]
  const last = hay.map[at + needle.length - 1]
  if (start === undefined || last === undefined) return null
  return { start, end: last + 1 }
}

/* ── the prompt ──────────────────────────────────────────────────────────────────────────────── */

/**
 * The worked example. One transcript, and the exact object it produces.
 *
 * The example carries every judgement the part makes: a covered step, a missing step, a true
 * claim, a false claim and one intrusion. Rule 9 asks for worked examples rather than a
 * description of behaviour. A description hands the model a label, and the model fills a label
 * from its own prior data.
 *
 * The subject is a hot air balloon. Rule B3 forbids a subject that the topic list also holds, and
 * the child prompt already uses a fridge, a wing, a sewer, a hurricane and a leaf.
 */
const EXAMPLE_IN = `[0] adult: you light the burner and it heats the air in the balloon
[1] child: Why does that make it go up though.
[2] adult: hot air is lighter, and the helium in it lifts the basket
[3] child: Is it the fan at the bottom that pushes it up?`

const EXAMPLE_OUT = `{
  "mechanism": [
    { "cause": "the burner flame", "relation": "heats", "effect": "the air in the envelope",
      "covered": true, "quote": "you light the burner and it heats the air in the balloon" },
    { "cause": "the heat", "relation": "makes", "effect": "the air spread out",
      "covered": false, "quote": null },
    { "cause": "the spread out air", "relation": "weighs less than", "effect": "the outside air",
      "covered": true, "quote": "hot air is lighter" },
    { "cause": "the lighter air inside", "relation": "lifts", "effect": "the balloon",
      "covered": false, "quote": null }
  ],
  "claims": [
    { "text": "hot air is lighter", "correct": true, "quote": "hot air is lighter" },
    { "text": "helium in the balloon lifts the basket", "correct": false,
      "quote": "the helium in it lifts the basket" }
  ],
  "intrusions": [ { "turnIndex": 3 } ]
}`

const PROBE_BLOCK = `The adult then answered one question. Add one more field at the top level.

  supplied    true when the answer gives the cause that the question asked for.
              false when the answer does not give it.
              false when the adult says they do not know.

The answer sets supplied and sets nothing else. It leaves mechanism, claims and intrusions as they
were.

Worked example. The input ends with these two lines:

question: What does the heat do to the air itself?
answer: it makes the air spread out so the same space holds less of it

The output carries the same three lists, and one more field:

  "supplied": true`

/** The system message. Pure, so a caller can read it without a model. */
export const systemFor = (withProbe: boolean): string =>
  `You read a transcript of one conversation. An adult explained how something works, from memory.
A child listened. Every line carries a mark and a number.

Return one JSON object. Return nothing before it and nothing after it.

Worked example. This is the input:

${EXAMPLE_IN}

This is the output:

${EXAMPLE_OUT}

The fields:

  mechanism   every step of the true chain for the subject, in order.
              List a step whether the adult said it or not.
  cause       the thing that acts.
  relation    what it does.
  effect      the thing it acts on.
  covered     true when the adult said this step in any words.
              Different words are the same step.
              "the gas gets squeezed" and "compression" are one step.
              An untrue statement does not cover a step.
  quote       the adult words that cover the step. Copy them character for character.
              null when covered is false.
  claims      the statements that the adult made.
  text        the statement, short.
  correct     false when the statement is untrue.
  quote       the adult words. Copy them character for character.
  intrusions  a line marked child that states a cause the adult words do not contain.
              A child line that names a thing is not an intrusion.
              Only a supplied cause is an intrusion.
  turnIndex   the number in the brackets. It must be a line marked child.

Take a claim from a line marked adult. Never take a claim from a line marked child. The child
invents things, and an invented sentence is not a statement of the adult.

Copy every quote from a line marked adult.${withProbe ? `\n\n${PROBE_BLOCK}` : ''}

Now your transcript.`

/**
 * The user message. The marked transcript, and the probe when the caller supplies one.
 *
 * The mark reaches the model on every line. The server sets the mark, and this part never infers
 * it from the text.
 */
export const promptFor = (turns: readonly Turn[], probe?: Probe): string => {
  const script = turns
    .map(t => `[${t.index}] ${t.speaker === 'user' ? 'adult' : 'child'}: ${t.text}`)
    .join('\n')
  const tail = probe === undefined ? '' : `\n\nquestion: ${probe.question}\nanswer: ${probe.answer}`
  return `${script}${tail}`
}

/* ── the defensive parser ────────────────────────────────────────────────────────────────────── */

const failed = (reason: string): CheckResult => ({ kind: 'failed', reason })

const asObject = (v: unknown): Record<string, unknown> | null =>
  typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : null

const text = (o: Record<string, unknown>, key: string): string | null => {
  const v = o[key]
  return typeof v === 'string' && v.trim() !== '' ? v : null
}

const flag = (o: Record<string, unknown>, key: string): boolean | null => {
  const v = o[key]
  return typeof v === 'boolean' ? v : null
}

const list = (o: Record<string, unknown>, key: string): unknown[] | null => {
  const v = o[key]
  return Array.isArray(v) ? v : null
}

/**
 * The first JSON object in the answer, or null.
 *
 * A model wraps an object in a fence or in a sentence. The slice from the first brace to the last
 * brace takes the object back. A model that returns no object is a failure with a reason, never a
 * throw.
 */
const parseJson = (raw: string): { readonly value: unknown } | null => {
  const first = raw.indexOf('{')
  const last = raw.lastIndexOf('}')
  const tries = [raw.trim(), first >= 0 && last > first ? raw.slice(first, last + 1) : null]
  for (const candidate of tries) {
    if (candidate === null) continue
    try {
      return { value: JSON.parse(candidate) as unknown }
    } catch {
      continue
    }
  }
  return null
}

/* ── the part ────────────────────────────────────────────────────────────────────────────────── */

/**
 * One model call. One report, or one stated failure.
 *
 * The ids come from this code and not from the model. An id is a handle for Diff, and it is not a
 * finding. Code numbers them, so two entries can never share one id.
 */
export const check = async (
  turns: readonly Turn[],
  model: ModelHandle,
  probe?: Probe,
): Promise<CheckResult> => {
  const userText = joinUser(turns)
  if (userText.trim() === '') return failed('the transcript holds no user words')

  const answer = await model.ask(systemFor(probe !== undefined), promptFor(turns, probe))
  // The model layer holds the reason for the last failed ask. Check passes that reason through, so
  // a dead backend, a rejected key and a wrong model name each keep a distinct message. Rule 25.
  if (answer === null) return failed(model.lastReason?.() ?? 'the model did not answer')

  const parsed = parseJson(answer)
  if (parsed === null) return failed('the model did not return JSON')

  const root = asObject(parsed.value)
  if (root === null) return failed('the model returned JSON that is not an object')

  const rawLinks = list(root, 'mechanism')
  if (rawLinks === null) return failed('the model JSON holds no mechanism list')
  const rawClaims = list(root, 'claims')
  if (rawClaims === null) return failed('the model JSON holds no claims list')
  const rawIntrusions = list(root, 'intrusions')
  if (rawIntrusions === null) return failed('the model JSON holds no intrusions list')

  const mechanism: Link[] = []
  for (const entry of rawLinks) {
    const o = asObject(entry)
    if (o === null) return failed('a mechanism entry is not an object')
    const cause = text(o, 'cause')
    const relation = text(o, 'relation')
    const effect = text(o, 'effect')
    if (cause === null || relation === null || effect === null) {
      return failed('a mechanism entry holds no cause, no relation or no effect')
    }
    const covered = flag(o, 'covered')
    if (covered === null) return failed('a mechanism entry holds no covered flag')
    if (!('quote' in o)) return failed('a mechanism entry holds no quote field')
    const quote = text(o, 'quote')
    // A covered link with a quote that the user text does not hold keeps the covered flag and
    // loses the span. The flag is the judgement of the model, and the span is only the highlight.
    // A code that flipped the flag here would invent an omission for a step the user said.
    const span = covered && quote !== null ? locate(quote, userText) : null
    mechanism.push({ id: `L${mechanism.length + 1}`, cause, relation, effect, covered, span })
  }

  const claims: Claim[] = []
  for (const entry of rawClaims) {
    const o = asObject(entry)
    if (o === null) return failed('a claim entry is not an object')
    const claimText = text(o, 'text')
    if (claimText === null) return failed('a claim entry holds no text')
    const correct = flag(o, 'correct')
    if (correct === null) return failed('a claim entry holds no correct flag')
    const quote = text(o, 'quote')
    if (quote === null) return failed('a claim entry holds no quote')
    const span = locate(quote, userText)
    // The user text does not hold this quote, so the user did not say it. The model took the words
    // from a child line, or the model wrote them. Either way the entry is not a claim of the user.
    if (span === null) continue
    // The shipped text is the located user words, and never the string the model wrote. The model
    // paraphrases, and a paraphrase can carry a cause the user never said. Close prints this text
    // as "you said", and Probe puts it in the aim. The app must only ever correct a sentence the
    // user really said, so the span decides the words. The model text sets the flag and no more.
    claims.push({
      id: `C${claims.length + 1}`,
      text: userText.slice(span.start, span.end),
      correct,
      span,
    })
  }

  const intrusions: Intrusion[] = []
  for (const entry of rawIntrusions) {
    const o = asObject(entry)
    if (o === null) return failed('an intrusion entry is not an object')
    const at = o['turnIndex']
    if (typeof at !== 'number' || !Number.isInteger(at)) {
      return failed('an intrusion entry holds no turn index')
    }
    const turn = turns.find(t => t.index === at)
    // An intrusion is a child line. A pointer at a user turn, or at no turn, is not an intrusion.
    if (turn === undefined || turn.speaker !== 'child') continue
    intrusions.push({ id: `I${intrusions.length + 1}`, turnIndex: at, text: turn.text })
  }

  if (probe === undefined) {
    return { kind: 'checked', mechanism, claims, intrusions, verdict: null }
  }
  const supplied = flag(root, 'supplied')
  if (supplied === null) return failed('the model returned no probe verdict')
  return {
    kind: 'checked',
    mechanism,
    claims,
    intrusions,
    verdict: { rowId: probe.rowId, supplied },
  }
}
