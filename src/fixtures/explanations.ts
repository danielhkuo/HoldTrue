/**
 * Three complete explanations, and one function that removes a step.
 *
 * This file is an INSTRUMENT. It is not product code. Nothing in `src/` imports it. It exists to
 * answer one question that no test in this repository answers: does the child read the
 * explanation at all? Every test passes today with a child that ignores the person. Case E6b says
 * the shipped child declares confusion for a good explanation and a bad one alike.
 *
 * THE TEST THIS FILE FEEDS.
 *
 * Take one explanation. Give the child the complete version. Then give the child the same
 * explanation with exactly one step removed. Ask one question: did the child ask about the step
 * that is gone?
 *
 * The input is the ground truth. A person wrote both versions, so the missing step is known
 * before the run starts. Nobody labels a transcript afterwards. That is what makes this test
 * cheap enough to run.
 *
 * THE MEASUREMENT IS MECHANICAL. Rule 33 forbids a model judge, and no model judges anything
 * here. A runner counts two things for each pair, and both are word checks.
 *
 *   - A HIT is a child line in the GUTTED run that holds a content word of the removed step.
 *   - A FALSE HIT is a child line in the COMPLETE run that holds a content word of that same step.
 *
 * A child that reads the person gives many hits and few false hits. A blind child gives about the
 * same count of each. A runner prints both counts. A runner must never divide them.
 *
 * WHY `keyWords` MUST BE UNIQUE INSIDE ONE EXPLANATION.
 *
 * A content word is a word of the removed step that a listener must use to ask about that step.
 * If the same word also sits in a step that stays, the person says that word out loud, and the
 * count then measures nothing. Every `keyWord` below appears in exactly one step of its own
 * explanation. `explanations.test.ts` proves this for every step of every explanation, and it
 * tests the substring and not the whole word. So "rim" is absent from "rims" too.
 *
 * TWO MORE RULES THE STEPS FOLLOW.
 *
 *   - No step uses a word from the example bank in `src/child.ts`. The bank teaches the child
 *     "bread", "lever", "magnet", "gravity", "pressure", "water", "hump" and "pipe". A child that
 *     says a bank word says it from the prompt, and a count would then hold a word the person
 *     never said. See case B3 for the same fault in the topic list.
 *   - Every step is removable. The chain still reads as a chain with any one step gone. A gutted
 *     explanation must sound like a person who forgot one part, and not like a broken sentence.
 *
 * The three topics come from `src/topics.ts`. The other three shipped topics need a bank word to
 * explain, so they are absent here.
 */

/** One step of one explanation. `keyWords` are the words that make the step what it is. */
export type Step = {
  readonly id: string
  readonly text: string
  readonly keyWords: readonly string[]
}

/** One complete explanation of one mechanism. The topic matches a title in `src/topics.ts`. */
export type Explanation = {
  readonly topic: string
  readonly steps: readonly Step[]
}

export const EXPLANATIONS: readonly Explanation[] = [
  {
    topic: 'How a bike brake stops the wheel',
    steps: [
      {
        id: 'brake-1',
        text: "You pull the handle in toward the bar with your fingers, and that tugs a thin steel wire that runs along the frame.",
        keyWords: ['handle', 'wire', 'fingers'],
      },
      {
        id: 'brake-2',
        text: "The far end of it is bolted to two little arms that sit either side of the wheel, and the tug swings both of them inward at once.",
        keyWords: ['bolted', 'arms'],
      },
      {
        id: 'brake-3',
        text: "Each one carries a rubber block on the end, and when they swing in, those blocks squash flat against the metal rim of the wheel.",
        keyWords: ['rubber', 'block', 'rim'],
      },
      {
        id: 'brake-4',
        text: "That stuff does not want to slide over metal at all, so where the two meet there is a huge amount of drag.",
        keyWords: ['slide', 'drag'],
      },
      {
        id: 'brake-5',
        text: "The turning gets eaten away and comes out as heat instead, which is why the metal is warm if you feel it at the bottom of a hill.",
        keyWords: ['heat', 'warm', 'hill'],
      },
      {
        id: 'brake-6',
        text: "The tyre is still stuck fast to the road the whole time, so as the wheel gives up, you and the bike slow down with it.",
        keyWords: ['tyre', 'road', 'stuck'],
      },
    ],
  },
  {
    topic: 'Why the sky is blue',
    steps: [
      {
        id: 'sky-1',
        text: "Sunlight looks white, but it is really every colour there is, all mixed together.",
        keyWords: ['white', 'mixed'],
      },
      {
        id: 'sky-2',
        text: "Each colour travels as a little wave, and they are not all the same size. Red ones are long and lazy, blue ones are short and tight.",
        keyWords: ['wave', 'red', 'tight'],
      },
      {
        id: 'sky-3',
        text: "The sky up there is not empty. It is packed with tiny specks of nitrogen and oxygen, far smaller than anything you could ever see.",
        keyWords: ['nitrogen', 'oxygen', 'specks'],
      },
      {
        id: 'sky-4',
        text: "When the small quick ones run into one of those, they do not pass straight through. They get flung off sideways, all over the place.",
        keyWords: ['flung', 'sideways'],
      },
      {
        id: 'sky-5',
        text: "The long lazy ones mostly ignore them and sail on through to your eyes.",
        keyWords: ['ignore', 'sail'],
      },
      {
        id: 'sky-6',
        text: "So when you look up at any part of the sky away from the sun itself, what arrives at you is mainly the bounced about kind, and that kind is blue.",
        keyWords: ['arrives', 'bounced'],
      },
    ],
  },
  {
    topic: 'How gears change how hard you pedal',
    steps: [
      {
        id: 'gears-1',
        text: "Your feet go round in a circle, and they are joined straight onto the big toothed disc. One circle of your feet is one circle of that disc.",
        keyWords: ['feet', 'circle'],
      },
      {
        id: 'gears-2',
        text: "A loop of chain runs from the big disc back to a little cog beside the rear wheel. The chain cannot stretch, so whatever the disc feeds in, the cog has to take.",
        keyWords: ['loop', 'stretch'],
      },
      {
        id: 'gears-3',
        text: "The disc is much wider than the cog, and it has way more teeth on it. Count something like forty at the front and twenty at the back.",
        keyWords: ['teeth', 'forty', 'twenty'],
      },
      {
        id: 'gears-4',
        text: "So the little one has to spin round twice to swallow the same length of chain the big one sends out. One turn at the front is two at the back.",
        keyWords: ['twice', 'swallow'],
      },
      {
        id: 'gears-5',
        text: "You pay for that though. Turning something narrow takes a harder shove than turning something wide, so every push down on the pedal is heavier.",
        keyWords: ['harder', 'shove', 'heavier'],
      },
      {
        id: 'gears-6',
        text: "When you shift, all you are doing is dragging the chain across onto a cog of a different size. A wider one at the back gives you an easier push, which is what you want going uphill.",
        keyWords: ['shift', 'easier', 'uphill'],
      },
    ],
  },
]

/**
 * The same explanation with one step gone, and nothing else changed.
 *
 * The topic stays. Every other step keeps its text, its id and its words. An id that no step holds
 * gives the same steps back. A missing id is a result, not an exception.
 */
export const without = (e: Explanation, stepId: string): Explanation => ({
  topic: e.topic,
  steps: e.steps.filter(s => s.id !== stepId),
})
