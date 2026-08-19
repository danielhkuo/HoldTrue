/**
 * The child. This file is the product.
 *
 * A person explains how something works, out loud, from memory. A model says one short line back
 * as a curious ten-year-old, and the job of that line is to make them keep explaining. One model
 * call per turn. Nothing else runs.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────────────
 * THE PROMPT IS FIVE WORKED EXAMPLES AND ALMOST NO DESCRIPTION, AND THAT IS A MEASURED RESULT
 * RATHER THAN A STYLE. Read this before editing it, because the version a reasonable person
 * writes from scratch is the version that was measured to fail.
 *
 * The first prompt described the voice and quoted the openers it wanted — *wait*, *ohhh*, *how
 * come*, *whoa*. Six turns came back opening *ohhh*, every one a confirmation the adult could
 * answer with "yeah exactly", so the child never made anybody explain anything, which is its whole
 * job.
 *
 * The obvious repair was tried three times and failed three times. Deleting the quoted openers
 * took *ohhh* to zero and the collapse moved to *So*. Feeding the child its own recent openers
 * back as a fact did nothing. Forbidding *ohhh* moved the token to *whoa*.
 *
 * **Naming the openers was never the cause.** "Sound like a child" is the cause: it hands the
 * model a label, and the model fills a label from its own prior. A prior cannot be deleted, only
 * outweighed by a sample. So the most important property of the text below is a thing it does not
 * contain — there is no sentence describing how a child sounds.
 *
 * A second measured result: two of the five examples used to be dictionary questions ("Who's
 * Bernoulli.", "Stoma-what?"), and the child asked "what is X" in five turns of sixteen.
 * Rewriting those two replies as mechanism questions took it to zero in eleven. The examples are
 * load-bearing at the granularity of a single line.
 *
 * All of this is n≈1 against one local model over three days, and none of it has survived a
 * replication attempt. Treat it as the best evidence available rather than as settled — but
 * re-measure before rewriting, not after.
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
 * The worked examples, as data so the bank can grow without touching prompt logic.
 *
 * Three properties, all invisible in the text and all easy to destroy by tidying:
 *   - **Foreign topics on purpose**, so a copied surface is visibly off-topic.
 *   - **Structurally disagreeing**, so there is no shared frame for the model to induct.
 *   - **Shaped like real child speech**, taken from 275 transcribed lines where *oh\** opens 8%
 *     of them against the deployed child's 100%.
 *
 * The bank wants a dozen entries and has five. The remaining lines are in the transcripts nobody
 * has pulled them from yet.
 */
const EXAMPLES: readonly { readonly them: string; readonly you: string }[] = [
  {
    them: "the compressor squishes the gas up and that's what makes it hot",
    you: "Wait why does squishing it make it hot? That doesn't make sense.",
  },
  {
    them: "the air moves faster over the top of the wing, that's Bernoulli's principle",
    you: "What's making it go faster up there though.",
  },
  {
    them: 'so it all goes out the pipe and down into the sewer',
    you: "Where's it going after that though.",
  },
  {
    them: 'and the middle of it, the eye, that part is actually dead calm',
    you: 'Calm? I thought the middle would be the worst part!',
  },
  {
    them: 'the leaves have these little holes in them called stomata',
    you: 'And the holes are what, just open all the time?',
  },
]

/**
 * Four of the five, dealt by turn index, so no two consecutive turns see the same prompt.
 *
 * At temperature 0 the strongest exemplar in the whole prompt is not these foreign pairs — it is
 * the child's own previous lines, sitting in the conversation and compounding. Measured twice:
 * once when a run asked the same question three turns running, and once when removing the only
 * other varying block made the child repeat itself immediately.
 *
 * Rotation is by position, never random: a run has to be reproducible, and this runner is already
 * not byte-deterministic without help.
 *
 * **This is a mitigation, not a fix.** Five examples give five rotations before the cycle repeats.
 */
export const examplesFor = (turnIndex: number): string =>
  Array.from({ length: 4 }, (_, i) => EXAMPLES[(turnIndex + i) % EXAMPLES.length]!)
    .map(e => `them: ${e.them}\nyou: ${e.you}`)
    .join('\n\n')

/** The system message for a given turn. Pure — testable without a model. */
export const systemFor = (turnIndex: number): string =>
  `You are a curious 10-year-old. An adult is explaining how something works, out
loud, from memory. You are listening.

Say ONE short line back, and make them keep explaining. You are the one who does
not know: never explain anything back to them, and never tell them their
explanation was bad. If you are lost, say YOU are lost.

Never ask something they can answer with just "yes" or "yeah exactly".

Here is how you sound. These are other conversations, about other things:

${examplesFor(turnIndex)}

Do not reuse the words in those lines. They are a different conversation about
different things. Take how they sound, not what they say.

Now your conversation. One line back. Never a bullet point, never a heading,
never more than two sentences.`

/**
 * The user message: the conversation as a script, ending on an empty `you:` to complete.
 *
 * Your words go in UNTOUCHED. The old build ran them through a cleaner that stripped filled pauses
 * and stammers — right for a voice transcript, wrong here, because it also stripped a leading
 * "so"/"then"/"and" and the final full stop. Typing "so what happens after that?" and having the
 * model receive "what happens after that" is an unmeasured edit to the only input that matters.
 * When voice lands, cleaning belongs at the transcription boundary, not here.
 */
export const promptFor = (history: readonly Exchange[], you: string): string => {
  const script = history
    .flatMap(e => [`them: ${e.you}`, ...(e.child.kind === 'said' ? [`you: ${e.child.line}`] : [])])
    .join('\n')
  return `${script === '' ? '' : `${script}\n`}them: ${you}\n\nyou:`
}

/**
 * One model call. One line back.
 *
 * A model that returns nothing is `silent` with a reason, never a throw — that is what keeps a
 * turn total. A model that returns three paragraphs is cut to its first non-empty line, because
 * the one-line rule is the difference between a child and an assistant.
 */
export const speak = async (
  history: readonly Exchange[],
  you: string,
  model: ModelHandle,
): Promise<Said> => {
  const answer = await model.ask(systemFor(history.length), promptFor(history, you))
  if (answer === null) return { kind: 'silent', reason: 'no answer from the model' }
  const line = answer.trim().split('\n').map(l => l.trim()).filter(l => l !== '')[0] ?? ''
  return line === '' ? { kind: 'silent', reason: 'the model said nothing' } : { kind: 'said', line }
}
