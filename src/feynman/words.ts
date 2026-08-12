/**
 * Words a ten-year-old already has.
 *
 * Used for one thing: deciding when the child stops and asks "what's a siphon?". Anything
 * outside this list, long enough to be a real term, is a word it would not know.
 *
 * SKELETON. The real one is a frequency list — this is hand-written and will be wrong at the
 * edges. It errs toward *knowing* words, because a child that asks about "chain" is more
 * annoying than one that lets "gradient" past.
 */
export const KNOWN: ReadonlySet<string> = new Set(
  `a about above across after again against air all almost alone along already also always am
   an and animal another answer any anything are arm around as ask at away baby back bad bag
   ball be because become bed been before begin behind being believe below best better between
   big bird bit black block blood blow blue board boat body bone book both bottle bottom bowl
   box boy brain branch bread break bring brother brown build burn but buy by call came can
   cap car care carry case cat catch cause center chain chair chance change check child
   children circle city clean clear climb clock close cloth cloud cold color come common
   complete cook cool corner could count country cover cross cup cut dad dark day dead deep
   did die different dig dinner direction do dog done door down draw dream drink drive drop
   dry during each ear early earth easy eat edge egg eight either else empty end energy engine
   enough even ever every everything exactly example eye face fact fall family far fast fat
   father feel feet fell felt few field fight fill find fine finger finish fire first fish fit
   five fix flat floor flow fly follow food foot for force forest form found four free fresh
   friend from front fruit full fun game garden gas gave get girl give glass go goes gold gone
   good got grass gray great green ground group grow guess had hair half hand happen happy
   hard has hat have he head hear heart heat heavy held help her here high hill him his hit
   hold hole home hope horse hot hour house how huge human hundred hurt i ice idea if in inch
   inside instead into iron is it its jump just keep kept key kick kid kill kind king kitchen
   knew know lake land large last late later laugh law lay lead leaf learn leave left leg less
   let letter level lie life lift light like line lip liquid list listen little live lock long
   look lose lot loud love low machine made magnet main make man many map mark match matter
   may maybe me mean meat meet melt metal middle might mile milk mind mine minute miss mix mom
   moment money month moon more morning most mother mountain mouth move much music must my
   name near neck need never new next nice night nine no noise none nor north nose not note
   nothing notice now number ocean of off often oil old on once one only open or order other
   our out outside over own page pain paint pair paper part pass past path pay people perhaps
   person pick picture piece pipe place plan plant play please point pop possible pot pour
   power press pretty problem pull push put question quick quiet quite race radio rain raise
   ran reach read ready real reason record red remember rest return rich ride right ring rise
   river road rock roll roof room root rope round row rub rule run sad safe said sail salt
   same sand save saw say school science sea seat second see seed seem seen sell send sense
   sent set seven several shake shape share sharp she sheet shell shine ship shoe shop short
   should shoulder shout show shut sick side sign silver simple since sing single sit six size
   skin sky sleep slide slow small smell smile smoke snow so soft soil sold solid some someone
   something sometimes son song soon sound south space speak special speed spin spot spread
   spring square stand star start stay steam steel step stick still stone stood stop store
   storm story straight strange street strong such sudden sugar summer sun suppose sure
   surface sweet swim table tail take talk tall tank taste teach team tell ten test than thank
   that the their them then there these they thick thin thing think third this those though
   thought three through throw tie tight time tiny tire to today together told too took tool
   top touch toward town track trade train travel tree trip trouble truck true try tube turn
   twice two under until up upon us use usual valley very view visit voice wait walk wall want
   warm was wash watch water wave way we wear weather week weight well went were wet what
   wheel when where whether which while white who whole why wide wild will win wind window
   wing winter wire wish with within without woman women wood word work world would write
   wrong yard year yes yet you young your
   handle button switch lever spring gear motor pump wheel wire cable rope string hook latch
   knob dial screw nail hammer blade brush needle thread ladder shelf drawer basket bucket
   bottle basin sink drain faucet tap toilet flush plug socket lamp torch mirror clock timer
   bell alarm whistle balloon bubble sponge towel blanket pillow curtain carpet fence gate
   garage attic basement ceiling stair step floor roof chimney pocket wallet ticket stamp
   letter package parcel envelope battery charger screen keyboard mouse phone camera speaker
   inside outside upstairs downstairs everywhere somewhere anywhere nowhere
   rush flow drip splash swirl spill leak soak float sink stack pile squeeze stretch bend
   twist shake tap knock slam swing roll slip stick press release trap block clear settle`
    .split(/\s+/)
    .filter(Boolean),
)

/**
 * The one word in a phrase a child would stop at, or null.
 *
 * Takes the last unknown word, because English puts the head of a noun phrase at the end —
 * "the tank water" is about water, "a pressure gradient" is about the gradient.
 */
export const unfamiliarWord = (phrase: string): string | null => {
  const words = phrase
    .toLowerCase()
    .split(/[^\p{L}\p{N}']+/u)
    .filter(Boolean)

  let found: string | null = null
  for (const word of words) {
    const stem = word.replace(/(?:'s|s|ing|ed|es)$/, '')
    if (word.length < 5) continue
    if (KNOWN.has(word) || KNOWN.has(stem)) continue
    found = word
  }
  return found
}
