/**
 * Voice: the move, said the way a child says it.
 *
 * Pure. One move in, one sentence out. It is handed phrases and never the graph, so it
 * cannot name a concept you did not say — the property in docs/specs/child-speech.md.
 *
 * Every phrase is cleaned first (ruling 6): filled pauses and stammers go, the anchors keep
 * them. The anchor is for the machine; this is for a person.
 *
 * THE SHAPE THAT MAKES IT WORK. Extract returns whole clauses — "you push the handle down",
 * not "the handle". Slot a clause into "what makes X happen?" and you get "what makes you
 * push the handle down happen?", which is how the first version read. So the templates here
 * never slot a phrase mid-sentence. They **say the phrase as its own fragment and then point
 * at it with a pronoun**: "you push the handle down — but what makes that happen?" That is
 * grammar-proof whatever shape the phrase arrives in, and it is what the children in
 * docs/transcripts/ actually do. They say "that" and "it" constantly.
 */

import type { Move } from './notice.js'
import { normalise } from './normalise.js'

/**
 * Leading glue a speaker would drop. Note what is NOT here: `that`, `it` and `which`. Those
 * are doing grammatical work — strip "that" from "that pulls the chain" and the mirror reads
 * "you push the handle down, and then pulls the chain", with no subject. Keeping them is what
 * lets whole clauses join with "and" and still read like speech.
 */
const LEAD = /^(?:and|so|then|but|because|cause|when)\s+/i

/** What the child says out loud, from your words. Cleaned, never raw. Ruling 6. */
const say = (phrase: string): string => {
  let s = normalise(phrase).text.trim()
  for (let i = 0; i < 2 && LEAD.test(s); i++) s = s.replace(LEAD, '')
  return s.replace(/[.,;:!?]+$/, '').trim()
}

/** Stable choice, so a move always reads the same way and a test can pin it. */
const pick = <T>(options: readonly T[], seed: string): T => {
  let h = 2166136261
  for (const ch of seed) h = ((h ^ ch.charCodeAt(0)) * 16777619) >>> 0
  return options[h % options.length]!
}

export function voice(move: Move): string {
  switch (move.kind) {
    case 'conflict': {
      const a = say(move.a.cause.quote)
      const b = say(move.a.effect.quote)
      return pick(
        [
          `wait, hold on. you said ${a} makes ${b}, but you also said it stops it. which one?`,
          `but you just said the opposite though. does ${a} do ${b} or not?`,
        ],
        a,
      )
    }

    // The word, never the phrase. A child asks about one word it does not know.
    case 'term':
      return pick(
        [`what's a ${move.term}?`, `wait, what's ${move.term}?`, `${move.term}? what's that?`],
        move.term,
      )

    case 'resay':
      return pick([`wait — say that part again?`, `hold on, i missed that bit. again?`], move.sentence)

    // The plant. Two things you linked to a third and never to each other.
    case 'guess': {
      const a = say(move.cause)
      const b = say(move.effect)
      return pick(
        [`ohhh, so is it ${a} that does ${b}?`, `wait, so ${a} — is that what makes ${b} happen?`],
        a,
      )
    }

    // Fragment, then pronoun. Never a slot.
    case 'needed': {
      const c = say(move.concept)
      return pick(
        [
          `${c} — but what makes that happen?`,
          `wait. ${c}. how does that start though?`,
          `okay, ${c}. but where does that come from?`,
        ],
        c,
      )
    }

    case 'why': {
      const a = say(move.link.cause.quote)
      const b = say(move.link.effect.quote)
      return pick(
        [
          `so ${a}, and ${b}. but why does that work?`,
          `wait — ${a}, and ${b}? i don't get why that happens.`,
          `okay. ${a}, and ${b}. how come though?`,
        ],
        b,
      )
    }

    case 'mirror': {
      const steps = move.chain.map(l => say(l.cause.quote))
      steps.push(say(move.chain[move.chain.length - 1]!.effect.quote))
      return pick(
        [
          `okay so — ${steps.join(', and then ')}. and that's it?`,
          `wait let me say it back. ${steps.join(', then ')}. right?`,
        ],
        steps[0]!,
      )
    }

    case 'on':
      return pick([`okay. then what happens?`, `and then what?`, `okay... keep going.`], 'on')
  }
}
