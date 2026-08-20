/**
 * The child. This file is the product.
 *
 * A person explains one causal mechanism out loud, from memory. A model answers with one short
 * line. The line makes the person produce more of the explanation. The file makes one model call
 * for each turn. It serves cases M1, E6a, E7a, E7b, E10 and E13a. It also serves the build defects
 * B3, B6 and B7.
 *
 * This file must not judge the explanation. It must not supply a cause. It must not run any part
 * of the end phase.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────────────
 * THE PROMPT SHOWS WORKED EXAMPLES. IT DOES NOT DESCRIBE HOW A CHILD SOUNDS. This is a measured
 * result and not a style. Read the results below before you edit the prompt. A reasonable person
 * writes the described version from scratch. The owner measured that version and it failed.
 *
 * Measured result 1. The first prompt described the voice. It quoted the openers it wanted: wait,
 * ohhh, how come, whoa. Six turns of six came back with the opener "ohhh". Each line was a
 * confirmation. The adult answers a confirmation with "yeah exactly". The child then made nobody
 * explain anything. That is the whole job of the child.
 *
 * Measured result 2. The owner tried the obvious repair three times. Each repair failed. The
 * deletion of the quoted openers took "ohhh" to zero, and the collapse moved to "So". The child
 * read its own recent openers back as a fact, and nothing changed. The prohibition of "ohhh" moved
 * the token to "whoa".
 *
 * Measured result 3. The named openers were never the cause. The instruction "sound like a child"
 * is the cause. That instruction gives the model a label. The model fills a label from its own
 * prior data. You cannot delete a prior. You can outweigh a prior with a sample. So the most
 * important property of the text below is a thing it does not hold. No sentence in it describes
 * how a child sounds.
 *
 * Measured result 4. Two of the five old examples asked for a word. They were "Who's Bernoulli."
 * and "Stoma-what?". The child then asked "what is X" in five turns of sixteen. The owner rewrote
 * those two replies as mechanism questions. The rate went to zero in eleven turns. An example is
 * load bearing at the granularity of one line.
 *
 * Measured result 5. At temperature 0 the strongest example in the prompt is not the foreign pair.
 * It is the child's own previous line. That line sits in the conversation and compounds. The owner
 * measured this twice. One run asked the same question for three turns. A second run removed the
 * only other varying block, and the child repeated itself immediately. The rotation below is the
 * mitigation. It is not a fix.
 *
 * Measured result 6. The transcripts hold 275 child lines. An opener of the form "oh*" starts 8%
 * of them. The deployed child started 100% of its lines that way.
 *
 * Every result above is n≈1. One local model produced them over three days. No replication attempt
 * has run. Treat the results as the best evidence available. Re-measure before you rewrite the
 * prompt, and not after.
 * ─────────────────────────────────────────────────────────────────────────────────────────────
 * THE MOVE LIST, THE DRIFT AND THE GROOVE. THE OWNER TESTED ELEVEN PROMPT DESIGNS LIVE. THE THREE
 * RESULTS BELOW COME FROM THOSE TESTS. NOBODY HAS MEASURED THE CODE THAT THE RESULTS PRODUCED.
 *
 * Measured result 7. A labelled list of moves in the system prompt becomes a template. The list
 * held the bullet "say where you stopped following them". The child then said "I stopped following
 * at the <X> part" for six turns together. A named move hands the model a sentence to copy. The
 * framing below therefore names no move. `lateBlock` carries one required move for each turn.
 *
 * Measured result 8. All eleven designs locked into one sentence frame by turn three. A prompt
 * does not fix this. The remedy changes the required move for each turn. A deterministic scheduler
 * picks the move. The model does not choose it. `lateBlock` is that scheduler.
 *
 * Result 9 comes from the literature. It is not a measurement of this build. A model adopts the
 * frame of the other party inside about eight rounds. See Li et al., arXiv 2402.10962. This
 * citation is unfiled. `docs/research/evidence-base.md` does not hold it. Rule 27 does not apply,
 * because the claim describes a model and not a person. Attention over a long context has a U
 * shape. See "Lost in the Middle", also unfiled. A system prompt sits in the dead middle by turn
 * eight. The remedy states the governing rule again near the END of the context, on every turn.
 * That remedy beat every other remedy in the later rounds. `promptFor` puts `lateBlock` after the
 * whole script for this reason. The position is the whole point. Do not move the block into
 * `systemFor`.
 *
 * The punctuation of the bank is a performance instruction. The line goes to a speech engine
 * later. Most engines raise the pitch for a question mark. A question with a full stop sounds
 * flat, and flat sounds bored. The bank holds seven replies. Four replies end with a question mark.
 * Two imperatives end with a full stop. One question, "Which one.", keeps a flat full stop on
 * purpose. Real
 * speakers ask a question without the rise. `docs/transcripts/round-1.md` holds "What's a siphon."
 * at line 32 and "Where's it carrying it to though." at line 196. The corpus of 275 child lines
 * ends 143 lines with a question mark and 125 lines with a full stop. Keep the mixture. A bank of
 * one punctuation mark teaches one intonation.
 *
 * The framing no longer names the lost move or the stop move. The examples show the lost move, so
 * rule 40 still holds. The fallback line replaces the stop move. Cases E6a, E7b and E13a need a
 * new measurement against this design.
 *
 * Two changes from the previous build survive here, and nobody has measured them either.
 *   1. `speak` keeps two sentences of the answer. It kept the first line only, and a two line
 *      answer lost its question. See case B6.
 *   2. `systemFor` takes the topic. The server held the topic and sent nothing, so turn one had no
 *      subject. See case B7. The parameter carries a default, because `src/server.ts` has another
 *      owner and must still compile.
 *
 * Two risks in the bank carry no measurement. The example about the hump and the pipe describes a
 * siphon, and the topic list offers "How a toilet flushes". No word is shared, so case B3 passes,
 * and the subject is still close. The fallback line is a fixed sentence, and result 7 says the
 * model copies a fixed sentence. Count how often the child says the fallback line before you add
 * a second one.
 * ─────────────────────────────────────────────────────────────────────────────────────────────
 */

import type { ModelHandle } from './model.js'

/** What the child said, or why it did not. Silence is a result, never an exception. */
export type Said =
  | { readonly kind: 'said'; readonly line: string }
  | { readonly kind: 'silent'; readonly reason: string }

/** One exchange. Two strings and the cost of getting them. */
export type Exchange = {
  readonly you: string
  readonly child: Said
  readonly seconds: number
}

/** One line of a worked example. `them` is the adult. `you` is the child. */
export type Line = {
  readonly who: 'them' | 'you'
  readonly text: string
}

/**
 * One worked example. It holds two lines, or four lines for a re-ask.
 *
 * The example carries no label for its move. A label in the prompt becomes a template. See
 * measured result 7. The lines are the whole example.
 */
export type Example = {
  readonly lines: readonly Line[]
}

/**
 * The example bank. This is the control surface of the product.
 *
 * The bank holds six examples. Each example holds a different shape. One example holds four lines.
 * That example asks a second time about the same step, and it is the only example that refuses to
 * move on. An earlier bank showed one ask and then an advance, and the child copied that habit.
 *
 * Five properties hold for every example. All five are invisible in the text. All five are easy to
 * destroy when you tidy the bank.
 *
 *   - The topic is foreign. No topic here matches a topic in `src/topics.ts`. A copied surface is
 *     then visibly off topic, and it does not answer the user. See case B3.
 *   - The structure disagrees with the neighbours. The model then has no frame to induct.
 *   - The shape comes from real child speech. `docs/transcripts/round-1.md` and
 *     `docs/transcripts/round-2.md` hold the lines.
 *   - The bank holds no forbidden move. No reply says that the child understands. No reply says
 *     the user's mechanism back as a statement. No reply offers an analogy. See rules 3, 4 and 7.
 *   - The punctuation is mixed on purpose. A question mark drives the rise in a speech engine.
 *     Read the punctuation paragraph in the header before you change a mark.
 */
export const EXAMPLES: readonly Example[] = [
  {
    lines: [
      { who: 'them', text: 'You put the bread in and push the lever down and it stays down.' },
      { who: 'you', text: 'What holds it down?' },
    ],
  },
  {
    lines: [
      { who: 'them', text: "There's a magnet in there I think." },
      { who: 'you', text: "What's the magnet holding onto?" },
      { who: 'them', text: 'The lever bit. It just holds it.' },
      { who: 'you', text: 'You said it holds the lever. What makes it let go?' },
    ],
  },
  {
    lines: [
      { who: 'them', text: "It's gravity, that's all it is." },
      { who: 'you', text: "I don't know what gravity means. Say that bit again without it." },
    ],
  },
  {
    lines: [
      { who: 'them', text: 'And then the pressure just drops.' },
      { who: 'you', text: 'Where does the pressure go?' },
    ],
  },
  {
    lines: [
      {
        who: 'them',
        text: "The water can't get past the hump. ... and then it goes over the hump and down the pipe.",
      },
      { who: 'you', text: "Before you said it can't get past. Now it goes over. Which one." },
    ],
  },
  {
    lines: [
      { who: 'them', text: "Honestly I don't know that part." },
      { who: 'you', text: "Say the last bit you're sure about." },
    ],
  },
]

/** One example as a script fragment. */
const render = (e: Example): string => e.lines.map(l => `${l.who}: ${l.text}`).join('\n')

/**
 * Four examples, dealt by turn index. No two turns in a row get the same four.
 *
 * The deal is by position and never random. A run must repeat, and this runner is already not byte
 * deterministic without help. The window moves by one place for each turn, so the deal repeats
 * after one pass through the bank.
 *
 * The window holds four of the six examples. The child then sees two thirds of the bank on every
 * turn, and the pair of examples it does not see changes every turn.
 */
export const dealt = (turnIndex: number): readonly Example[] =>
  Array.from({ length: 4 }, (_, i) => EXAMPLES[(turnIndex + i) % EXAMPLES.length]!)

export const examplesFor = (turnIndex: number): string =>
  dealt(turnIndex).map(render).join('\n\n')

/**
 * The vocabulary rule. Every late block carries this sentence.
 *
 * The rule holds SUBJECT TERMINOLOGY ONLY. Never write it as "use only words they have used".
 * That version forbids ordinary English, and the child then cannot make a sentence.
 */
const VOCABULARY =
  'Do not use a technical or subject-specific word they have not used. Ordinary everyday words are fine.'

/**
 * The three required moves, in the order the scheduler uses.
 *
 * Every move is valid after every possible thing the user says. The block therefore holds no
 * condition, and the model has no branch to get wrong.
 */
const LATE_BLOCKS: readonly string[] = [
  `[Ask what makes the last thing they said happen. ${VOCABULARY}]`,
  `[Ask where a thing they mentioned goes, or what happens to it next. ${VOCABULARY}]`,
  `[Pick a word they used as if it were an explanation. Say you do not know what it means, and ask for that part again without it. ${VOCABULARY}]`,
]

/**
 * The required move for one turn. `promptFor` puts it after the whole script.
 *
 * The scheduler picks the move. The model does not choose it. Measured result 8 gives the reason:
 * every design the owner tested locked into one sentence frame by turn three.
 *
 * The block sits late in the context on purpose. See result 9.
 */
export const lateBlock = (turnIndex: number): string =>
  LATE_BLOCKS[turnIndex % LATE_BLOCKS.length]!

/**
 * The system message for one turn. The function is pure, so a test needs no model.
 *
 * The subject reaches the model here. The server holds the topic, and turn one has no other
 * subject. See case B7. An empty topic falls back to the phrase the server uses.
 *
 * This message names no move. A named move becomes a template. See measured result 7. The move
 * for the turn arrives from `lateBlock`, at the end of the user message.
 */
export const systemFor = (turnIndex: number, topic = ''): string => {
  const subject = topic.trim() === '' ? 'how something works' : topic.trim()
  return `You are a curious 10-year-old. An adult is explaining something to you, out
loud, from memory. The subject is: ${subject}. You are listening.

You have read nothing about this. You cannot look anything up. You know only
what this person has said here.

Say ONE short line back.

You are the one who does not know. Never explain anything back to them, and
never tell them their explanation was bad.

Never ask something they can answer with just "yes" or "yeah exactly".

When you have nothing to ask about what they just said, say exactly:
"I'm not sure I follow that. Can you say it a different way."

Here is how you sound. These are other conversations, about other things:

${examplesFor(turnIndex)}

Do not reuse the words in those lines. They are a different conversation about
different things. Take how they sound, not what they say.

Now your conversation. One line back. Never a bullet point, never a heading,
never more than two sentences.`
}

/**
 * The user message. It holds the conversation as a script. It ends on an empty `you:` line.
 *
 * The words of the user go in UNTOUCHED. See rule 10. The old build sent them through a cleaner.
 * The cleaner removed a filled pause and a stammer. It also removed a leading "so", "then" or
 * "and", and the final full stop. The user then typed "so what happens after that?" and the model
 * received "what happens after that". That is an unmeasured edit to the only input the product
 * has. Voice arrives later. The cleaning then belongs at the transcription boundary, and not here.
 *
 * The late block goes AFTER the script and before the empty line. The position is the change. A
 * model drifts to the frame of the other party inside about eight rounds, and the system message
 * is then in the dead middle of the context. See result 9. The turn index comes from the length of
 * the history, so this function and `systemFor` always count the same turn.
 */
export const promptFor = (history: readonly Exchange[], you: string): string => {
  const script = history
    .flatMap(e => [`them: ${e.you}`, ...(e.child.kind === 'said' ? [`you: ${e.child.line}`] : [])])
    .join('\n')
  const head = script === '' ? '' : `${script}\n`
  return `${head}them: ${you}\n\n${lateBlock(history.length)}\n\nyou:`
}

/**
 * The first two sentences of a string.
 *
 * A sentence ends at a full stop, a question mark or an exclamation mark. Text with no such mark
 * counts as one sentence. The function cuts. It edits no word.
 */
const twoSentences = (text: string): string =>
  (text.match(/[^.!?]+[.!?]*/g) ?? []).slice(0, 2).join('').trim()

/**
 * One model call. One short line back.
 *
 * A model that returns nothing gives a `silent` result with a reason. It never throws. That is what
 * keeps a turn total. See rule 23.
 *
 * The answer is cut to the first two lines, and then to the first two sentences. The old code kept
 * the first line only. A two line answer then arrived as a bare verdict, and the question in the
 * second line went missing. See case B6. The prompt asks for two sentences, so the cut and the
 * prompt agree.
 */
export const speak = async (
  history: readonly Exchange[],
  you: string,
  model: ModelHandle,
  topic = '',
): Promise<Said> => {
  const answer = await model.ask(systemFor(history.length, topic), promptFor(history, you))
  // The model layer holds the reason for the last failed ask. The child passes that reason
  // through, so a dead backend, a rejected key, a timeout and a wrong model name each keep a
  // distinct message on the screen. Rule 25.
  if (answer === null) {
    return { kind: 'silent', reason: model.lastReason?.() ?? 'no answer from the model' }
  }
  const lines = answer.trim().split('\n').map(l => l.trim()).filter(l => l !== '')
  const line = twoSentences(lines.slice(0, 2).join(' '))
  return line === '' ? { kind: 'silent', reason: 'the model said nothing' } : { kind: 'said', line }
}
