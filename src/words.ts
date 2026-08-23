/**
 * Plain words. This file holds no model, no fixture and no side effect.
 *
 * `src/discriminate.ts` imports the fixtures and `src/child.ts`. An import from
 * `src/director.ts` into `src/discriminate.ts` would make a second cycle. It would also pull the
 * fixtures into the server's module graph. This file gives both files one shared, side-effect-free
 * source for `STOP_WORDS` and `wordsIn`.
 */

/**
 * The ordinary English that proves nothing.
 *
 * A child says these words about any explanation at all. A count over them measures the language
 * and not the reading. The list holds the closed classes, the common verbs and the empty nouns
 * such as "thing", "stuff" and "bit".
 */
export const STOP_WORDS: ReadonlySet<string> = new Set([
  'a', 'about', 'after', 'again', 'all', 'also', 'am', 'an', 'and', 'another', 'any', 'anything',
  'are', 'around', 'as', 'at', 'away', 'back', 'be', 'because', 'been', 'before', 'big', 'bit',
  'both', 'but', 'by', 'call', 'called', 'came', 'can', 'come', 'comes', 'could', 'did', 'do',
  'does', 'doing', 'done', 'down', 'each', 'even', 'every', 'first', 'for', 'from', 'get', 'gets',
  'getting', 'give', 'gives', 'go', 'goes', 'going', 'good', 'got', 'had', 'happen', 'happens',
  'has', 'have', 'he', 'her', 'here', 'him', 'his', 'how', 'i', 'if', 'in', 'into', 'is', 'it',
  'its', 'just', 'keep', 'keeps', 'kind', 'know', 'last', 'let', 'like', 'little', 'lot', 'made',
  'make', 'makes', 'making', 'many', 'me', 'mean', 'means', 'more', 'most', 'much', 'must', 'my',
  'never', 'new', 'next', 'no', 'not', 'now', 'of', 'off', 'on', 'once', 'one', 'only', 'or',
  'other', 'our', 'out', 'over', 'own', 'part', 'place', 'put', 'puts', 'really', 'right', 'said',
  'same', 'say', 'says', 'see', 'she', 'should', 'small', 'so', 'some', 'something', 'still',
  'stuff', 'such', 'take', 'takes', 'than', 'that', 'the', 'their', 'them', 'then', 'there',
  'these', 'they', 'thing', 'things', 'think', 'this', 'those', 'though', 'through', 'time', 'to',
  'together', 'too', 'up', 'us', 'use', 'used', 'uses', 'very', 'want', 'wants', 'was', 'way',
  'we', 'well', 'went', 'were', 'what', 'when', 'where', 'which', 'while', 'who', 'why', 'will',
  'with', 'work', 'works', 'would', 'you', 'your',
])

/** Every whole word of a line, in lower case. Any mark that is not a letter or a digit splits. */
export const wordsIn = (line: string): readonly string[] =>
  line
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(word => word !== '')
