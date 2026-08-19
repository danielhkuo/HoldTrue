/**
 * Something to explain, for people who do not arrive with a topic in mind.
 *
 * These are PROMPTS, not scripts. The old build shipped full explanations and typed them into the
 * box for you a sentence at a time, which made the demo path "the model reacts to prose nobody
 * thought of" — the opposite of the product. The product is somebody explaining from memory and
 * discovering they cannot.
 *
 * Mechanisms only, and the boundary has numbers behind it: the illusion of explanatory depth
 * measures .918 for devices and .860 for natural phenomena against .291 for facts and −.173 for
 * procedures — negative, meaning explaining a procedure slightly increases confidence.
 */

export type Topic = { readonly title: string }

export const TOPICS: readonly Topic[] = [
  { title: 'How a toilet flushes' },
  { title: 'How bread rises' },
  { title: 'How a bike brake stops the wheel' },
  { title: 'How a fridge makes things cold' },
  { title: 'Why the sky is blue' },
  { title: 'How gears change how hard you pedal' },
]
