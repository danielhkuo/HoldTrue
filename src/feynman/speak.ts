/**
 * Speak: the child's line.
 *
 * THE PROMPT IS FIVE EXAMPLES, NOT A DESCRIPTION, AND THAT WAS SETTLED BY EXPERIMENT.
 *
 * The first version described the voice in rules and quoted the openers it wanted — "wait", "ohhh",
 * "how come", "whoa". A six-turn rig run came back with six lines opening "ohhh", every one a
 * confirmation the adult could answer with "yeah exactly", so the child never made anybody explain
 * more, which is its whole job.
 *
 * The obvious fix was tested and failed. Deleting the quoted openers dropped "ohhh" to zero and the
 * collapse simply moved: "So" then opened four of six, and the lines stayed confirmations. Feeding
 * the child its own recent openers back as a fact did nothing. Forbidding "ohhh" moved the token to
 * "whoa" and changed nothing else. **Naming the openers was not the cause.** "Sound like a child" is,
 * because it hands the model a label and lets it fill the label from its own prior, and a prior
 * cannot be deleted — only outweighed by a sample.
 *
 * The examples are verbatim in shape from docs/transcripts/, where 275 real child lines open "oh*"
 * 8% of the time. The deployed child ran at 100%. They are on foreign topics on purpose, so a copied
 * surface is visibly off-topic, and they disagree with each other structurally so there is no shared
 * frame to induct.
 *
 * **What examples did not fix, and it is recorded rather than hidden.** They buy the move, not the
 * variation. At temperature 0 the strongest exemplar in the prompt is not these five foreign pairs —
 * it is the child's own previous lines sitting in the conversation, and they compound. Rotating a
 * bank of a dozen by turn index is the named remedy and is not built.
 *
 * A model is handed the conversation so far and the shapes Cohere found, and says one thing back.
 * The shapes are context, never an instruction — child-speech.md ruling 12. It is told where your
 * chain does not close and left to decide whether that is what a child would ask about.
 *
 * This is the piece that makes the child worth talking to, and it is the piece that can ratify a
 * belief you never held. The guarantee is not that it cannot say such a thing; it is that it cannot
 * say it without `tallyIntroduced` writing it down.
 *
 * DEMO-GRADE, 2026-08-12. No eval, no labelled set, and the prompt below has been tuned by nobody.
 * child-speech.md is the contract; this is the first thing that satisfies it.
 */

import { normalise } from './normalise.js'
import type { ModelHandle } from './model.js'
import type { Shape } from './cohere.js'
import type { Spoken, Turn } from './tally.js'

/**
 * Leading glue a speaker would drop. Note what is NOT here: `that`, `it` and `which`. Those are
 * doing grammatical work — strip "that" from "that pulls the chain" and it reads with no subject.
 */
const LEAD = /^(?:and|so|then|but|because|cause|when)\s+/i

/**
 * Your words, cleaned for saying out loud. Filled pauses and stammers go; the anchors keep them.
 * child-speech.md ruling 6.
 *
 * Everything this module puts in the prompt goes through here first, which is the whole mechanism
 * of that ruling: your stammer never reaches the model, so it cannot come back out. Nothing cleans
 * the child's own line, and nothing should — the model wrote it, and it is not a rendering of you.
 */
export const say = (phrase: string): string => {
  let s = normalise(phrase).text.trim()
  for (let i = 0; i < 2 && LEAD.test(s); i++) s = s.replace(LEAD, '')
  return s.replace(/[.,;:!?]+$/, '').trim()
}

const SYSTEM = `You are a curious 10-year-old. An adult is explaining how something works, out
loud, from memory. You are listening.

Say ONE short line back, and make them keep explaining. You are the one who does
not know: never explain anything back to them, and never tell them their
explanation was bad. If you are lost, say YOU are lost.

Never ask something they can answer with just "yes" or "yeah exactly".

ONE EXCEPTION, and only when you are shown it below. If they named two things
that both lead to the same place but never connected those two to each other,
you may GUESS that one of them leads to the other.

Say the guess FLAT, the way you would say something you believe, with a hedge in
front. "I think X makes Y happen?" or "wait, maybe X makes Y happen?" Do NOT
start it with does, do, is or are — a guess that comes out as a question is not a
guess, it is another question, and it is the asking you already do.

Guess from what THEY said and nothing else. Never guess about anything you were
not shown. At most one guess, and never two turns running.

Here is how you sound. These are other conversations, about other things:

them: the compressor squishes the gas up and that's what makes it hot
you: Wait why does squishing it make it hot? That doesn't make sense.

them: the air moves faster over the top of the wing, that's Bernoulli's principle
you: What's making it go faster up there though.

them: so it all goes out the pipe and down into the sewer
you: Where's it going after that though.

them: and the middle of it, the eye, that part is actually dead calm
you: Calm? I thought the middle would be the worst part!

them: the warm air rises off the sea, and the spinning comes from the earth turning
you: Wait, I think the warm air rising makes the spinning happen?

them: the leaves have these little holes in them called stomata
you: And the holes are what, just open all the time?

Do not reuse the words in those lines. They are a different conversation about
different things. Take how they sound, not what they say.

Now your conversation. One line back. Never a bullet point, never a heading,
never more than two sentences.`

/** What the model is told about your chain, as context and not as an instruction. Ruling 12. */
const context = (shapes: readonly Shape[]): string => {
  const lines: string[] = []
  // Three at most. Ten bullets is a list, and a list invites a list-shaped answer.
  for (const shape of shapes.slice(0, 3)) {
    if (shape.kind === 'dangling') lines.push(`they mentioned "${say(shape.concept)}" but never said what it does`)
    if (shape.kind === 'rootless') lines.push(`they mentioned "${say(shape.concept)}" but never said what makes it happen`)
    // The one shape that invites the guess, and the only place the exception in SYSTEM is armed.
    // decisions.md's *The child may assert a guess* scopes a plant to two of the speaker's OWN
    // unlinked concepts, which is exactly what this shape is — so a guess made from it needs no
    // world knowledge and can only be wrong about them. Ruling 4's own note in cohere.ts says the
    // same: "this is where the child guesses, and where its guess is a plant."
    if (shape.kind === 'unlinkedPair')
      lines.push(
        `"${say(shape.a)}" and "${say(shape.b)}" both lead to "${say(shape.via)}", but they never connected those two to each other — you could guess that one of them leads to the other`,
      )
    if (shape.kind === 'conflict')
      lines.push(`they said "${say(shape.a.cause.quote)}" both causes and prevents "${say(shape.a.effect.quote)}"`)
  }
  if (lines.length === 0) return ''
  return `\n\nSome things you might have noticed, or might not. You do not have to use any of these:\n${lines.map(l => `- ${l}`).join('\n')}`
}

export async function speak(
  history: readonly Turn[],
  said: string,
  shapes: readonly Shape[],
  model: ModelHandle,
): Promise<Spoken> {
  const conversation = history
    .flatMap(turn => [`them: ${say(turn.you)}`, turn.child === '' ? [] : [`you: ${turn.child}`]].flat())
    .join('\n')

  const prompt = `${conversation === '' ? '' : `${conversation}\n`}them: ${say(said)}${context(shapes)}\n\nyou:`

  const line = await model.ask(SYSTEM, prompt)
  if (line === null) return { kind: 'silent', reason: 'no answer from the model' }

  // One line, always. A model that writes a paragraph is answering a different question, and the
  // fiction does not survive a child delivering three sentences with a preamble.
  const first = line.trim().split('\n').find(l => l.trim().length > 0)
  if (first === undefined) return { kind: 'silent', reason: 'the model returned nothing to say' }

  return { kind: 'said', line: first.trim() }
}
