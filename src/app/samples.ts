/**
 * Sample explanations, so the skeleton opens on something rather than a blank box.
 *
 * These are **not** measurement data and must never be treated as any. `decisions.md`'s
 * *Two models may talk; nothing they produce is a measurement* sets the rule and the structural
 * guard: no figure from generated or canned prose enters a tracked file, and nothing here goes into
 * `measurements/within-sentence/explanations/` or Extract's eval set. That directory takes
 * explanations the owner wrote from memory, and nothing else.
 *
 * The toilet one is the explanation `demo.ts` already ships as its `DEFAULT`. It is duplicated here
 * rather than shared, and that is a known smell — `demo.ts` should import from this file, and the
 * only reason it does not yet is that it is a top-level script this module must not pull in.
 *
 * The topics are picked to satisfy the eligibility rule in `features/feynman.md`: mechanisms, not
 * facts and not procedures. The illusion of explanatory depth measures .918 for devices and .860
 * for natural phenomena against .291 for facts and −.173 for procedures.
 */

export type Sample = {
  readonly slug: string
  readonly title: string
  readonly text: string
}

export const SAMPLES: readonly Sample[] = [
  {
    slug: 'toilet',
    title: 'How a toilet flushes',
    text: [
      'when you push the handle down that pulls the chain and the chain lifts the flapper.',
      'the flapper lifting lets the tank water rush into the bowl.',
      'the rushing water pushes everything over the siphon and once it goes over the top it pulls the rest along.',
      'a toilet uses about thousands of gallons a year which is kind of a lot.',
      'then the fill valve refills the tank.',
    ].join(' '),
  },
  {
    slug: 'bread',
    title: 'How bread rises',
    text: [
      'the yeast eats the sugar in the dough and gives off carbon dioxide.',
      'that gas gets stuck in the stretchy dough made by flour and water.',
      'the trapped bubbles push outward so the loaf gets bigger.',
      'then the oven heat kills the yeast and sets the crumb around the holes.',
    ].join(' '),
  },
  {
    slug: 'brakes',
    title: 'How a bike brake stops the wheel',
    text: [
      'squeezing the lever pulls the cable and the cable pinches the pads onto the rim.',
      'the pads rubbing the rim makes friction which slows the wheel down.',
      'the spinning energy has to go somewhere so it turns into heat in the rim.',
      'the warm rim gives that heat off into the air as you ride.',
    ].join(' '),
  },
]

export const sampleOf = (slug: string): Sample | undefined => SAMPLES.find(s => s.slug === slug)
