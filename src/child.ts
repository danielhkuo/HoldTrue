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
 *
 * FOUR CHANGES ARRIVED AFTER THE MEASUREMENTS. NOBODY HAS MEASURED THEM.
 *   1. The bank holds twelve examples. It held five. Three examples serve each permitted move.
 *   2. The framing lists the four permitted moves. It replaced the instruction "make them keep
 *      explaining". That instruction named one move only, so the child always advanced. See cases
 *      E7b and E13a.
 *   3. `speak` keeps two sentences of the answer. It kept the first line only, and a two line
 *      answer lost its question. See case B6.
 *   4. `systemFor` takes the topic. The server held the topic and sent nothing, so turn one had no
 *      subject. See case B7. The parameter carries a default, because `src/server.ts` has another
 *      owner and must still compile.
 *
 * Two examples left the bank in change 1. One used a fridge compressor. One used a toilet waste
 * pipe. Both subjects match a topic in `src/topics.ts`. See case B3.
 *
 * One known risk carries no measurement. Three of the twelve examples end the child's turn with no
 * question. Nobody has counted how often the child now stops. Count that rate before you add a
 * fourth stop example.
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

/**
 * The four moves the child can make. The child has no other move.
 *
 *   - `cause` asks for the cause in the step the child did not get. Case E7a.
 *   - `again` asks about the same step a second time. Case E10.
 *   - `lost` says where the child stopped following. Case E6a.
 *   - `stop` ends the child's turn with no question. Case E13a.
 *
 * The label never reaches the prompt. It orders the bank, and it lets a test read the bank.
 */
export type Move = 'cause' | 'again' | 'lost' | 'stop'

/**
 * One worked example. `them` is the adult. `you` is the child.
 *
 * `before` holds an earlier child question. Only a `again` example needs it. The re-ask has no
 * meaning without the first ask.
 */
export type Example = {
  readonly move: Move
  readonly before?: string
  readonly them: string
  readonly you: string
}

/**
 * The example bank. This is the control surface of the product.
 *
 * The bank holds twelve examples and three examples for each move. The order repeats the four
 * moves, so any four examples in a row hold all four moves.
 *
 * Four properties hold for every example. All four are invisible in the text. All four are easy to
 * destroy when you tidy the bank.
 *
 *   - The topic is foreign. No topic here matches a topic in `src/topics.ts`. A copied surface is
 *     then visibly off topic, and it does not answer the user. See case B3.
 *   - The structure disagrees with the neighbours. The model then has no frame to induct.
 *   - The shape comes from real child speech. `docs/transcripts/round-1.md` and
 *     `docs/transcripts/round-2.md` hold the lines.
 *   - The bank holds no forbidden move. No reply says that the child understands. No reply says
 *     the user's mechanism back as a statement. No reply offers an analogy. See rules 3, 4 and 7.
 */
export const EXAMPLES: readonly Example[] = [
  {
    move: 'cause',
    them: "the air moves faster over the top of the wing, that's Bernoulli's principle",
    you: "What's making it go faster up there though.",
  },
  {
    move: 'again',
    before: 'Why is there a bulge on the far side too.',
    them: 'The stretching thing, I said. The moon stretches the whole planet, water and all.',
    you: 'Yeah but the far side. What pulls the water out there.',
  },
  {
    move: 'lost',
    them: 'so over thousands of years the ones with the longer necks end up being most of them',
    you: 'I stopped following at the thousands of years part.',
  },
  {
    move: 'stop',
    them: 'and those memory cells stay in there for years, sometimes your whole life',
    you: 'Can I go outside now.',
  },
  {
    move: 'cause',
    them: 'and the middle of it, the eye, that part is actually dead calm',
    you: 'Calm? I thought the middle would be the worst part!',
  },
  {
    move: 'again',
    before: "Why can't the electrons just go through the middle.",
    them: "They can't go through the middle, that's just how a battery is built.",
    you: "The middle part though. What's stopping them in there.",
  },
  {
    move: 'lost',
    them: 'then the chyme hits the small intestine and the bile breaks the fat up',
    you: 'You lost me at chyme.',
  },
  {
    move: 'stop',
    them: "honestly I don't know if the microphone hears its own sound, I never looked it up",
    you: 'We should look it up after dinner.',
  },
  {
    move: 'cause',
    them: 'the leaves have these little holes in them called stomata',
    you: 'And the holes are what, just open all the time?',
  },
  {
    move: 'again',
    before: 'How does the up and down turn into the wheels going round.',
    them: "There's a rod down to the crankshaft, and the crankshaft is bent. That's what does it.",
    you: 'But what does the bend do to the rod though.',
  },
  {
    move: 'lost',
    them: 'the gases up there work like a blanket, so the heat takes way longer to get out',
    you: 'Hold on, I got lost way back at the blanket.',
  },
  {
    move: 'stop',
    them: 'and then it soaks into the ground and works its way back down to the river',
    you: "I'm gonna go start the poster now.",
  },
]

/** One example as a script fragment. The move label never appears here. */
const render = (e: Example): string =>
  `${e.before === undefined ? '' : `you: ${e.before}\n`}them: ${e.them}\nyou: ${e.you}`

/**
 * Four examples, dealt by turn index. No two turns in a row see the same four.
 *
 * The deal is by position and never random. A run must repeat, and this runner is already not byte
 * deterministic without help. The bank orders the moves in a cycle, so four examples in a row hold
 * all four moves. The child then sees every permitted move on every turn.
 *
 * Twelve examples give twelve deals before the cycle repeats. The old bank gave five.
 */
export const dealt = (turnIndex: number): readonly Example[] =>
  Array.from({ length: 4 }, (_, i) => EXAMPLES[(turnIndex + i) % EXAMPLES.length]!)

export const examplesFor = (turnIndex: number): string =>
  dealt(turnIndex).map(render).join('\n\n')

/**
 * The system message for one turn. The function is pure, so a test needs no model.
 *
 * The subject reaches the model here. The server holds the topic, and turn one has no other
 * subject. See case B7. An empty topic falls back to the phrase the server uses.
 *
 * The move list is the instruction to act. It replaced "make them keep explaining". That
 * instruction named the advance and nothing else, so the child advanced every turn and never
 * stopped. See cases E7b and E13a.
 */
export const systemFor = (turnIndex: number, topic = ''): string => {
  const subject = topic.trim() === '' ? 'how something works' : topic.trim()
  return `You are a curious 10-year-old. An adult is explaining something to you, out
loud, from memory. The subject is: ${subject}. You are listening.

Say ONE short line back. You have four moves and no others:
- ask them for the cause in the step you did not get;
- ask again about the same step you already asked about;
- say where you stopped following them;
- stop, when you have no question.

You are the one who does not know. Never explain anything back to them, and
never tell them their explanation was bad.

Never ask something they can answer with just "yes" or "yeah exactly".

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
 */
export const promptFor = (history: readonly Exchange[], you: string): string => {
  const script = history
    .flatMap(e => [`them: ${e.you}`, ...(e.child.kind === 'said' ? [`you: ${e.child.line}`] : [])])
    .join('\n')
  return `${script === '' ? '' : `${script}\n`}them: ${you}\n\nyou:`
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
