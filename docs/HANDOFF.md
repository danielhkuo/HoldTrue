# Handoff — 2026-08-12

**Delete this file once it has been consumed.** It is a bridge between sessions, not a document.
Everything in it either belongs in `decisions.md` and the specs, or belongs in the bin.

Read [`README.md`](README.md) first for the map. This says only what a fresh session cannot work out
from the repo.

**Branch: `feat/cohere`, 47 commits ahead of `main`, working tree clean, 127 tests green,
`npx tsc --noEmit` clean. Nothing is pushed — the branch exists on this machine only.**

---

## 1. The loop runs, and you can watch it

```
npm run demo                 # your written explanation, sentence by sentence
npm run rig -- "how bread rises" 6   # two models talk, engineering counts only
```

Per turn: Extract per sentence → Cohere → a model child (`speak`) → Extract again over the child's
line → `tallyIntroduced`. Three model calls, about 30–50 seconds a turn. Everything between the
calls is arithmetic.

**What is built:** `validate`, `normalise`, `tally`, `stem`, `cohere`, `speak`, `demo`, `rig`.
`anchor` unchanged. **`notice.ts`, `voice.ts` and `words.ts` are deleted** under child-speech ruling
11.

**What is tested:** `anchor` (30), `validate` (56), `tally` (41, mutation 96.67%). **`cohere` and
`speak` have no test file at all** — both are marked DEMO-GRADE in their own headers. A green suite
says nothing about either.

---

## 2. The one thing that changed the product today

The child stopped confirming and started asking. Same subject, before and after:

```
before: ohhh so it's like a yo-yo string?   after: So where does all the spinning go if the
        ohhh do the arms pinch the wheel?          wheel can't spin as fast anymore?
        ohhh so rubbing makes it stop?             I'm lost, does the heat just vanish into the air?
        ohhh it gets hot?                          Wait, how does warm air drifting away actually
        ohhh a warm cookie?                        take the spin with it?
```

Six of six opened *ohhh* and every line was answerable with *yeah exactly*. Now not one is. The
explainer stopped answering in analogies — *"like a warm cookie"* — and started giving mechanism,
and links per sentence went 0.80 → 1.18 for that reason alone.

**How it was fixed matters more than that it was.** Three obvious fixes were tested and failed:
deleting the quoted openers (the collapse moved to *So*), feeding the child its own recent openers
back as a fact (nothing), and forbidding *ohhh* (the token moved to *whoa*). The cause was the rule
nobody suspected — **"Sound like a child"** hands the model a label and lets it fill the label from
its own prior. Five worked examples fixed it. The reasoning is in `speak.ts`'s header and in
`decisions.md`.

---

## 3. The loudest thing wrong, and it is measurable

**Cohere emits more shapes than there are links.** Last run: 13 links, 32 dangling + 31 rootless
raised, 19 standing at the end. More holes than links means **most nodes are isolated**, so most of
those flags are almost certainly false questions — the exact thing the four kill numbers exist to
catch.

**The cause is upstream and is not Cohere's arithmetic.** Extract returns **whole clauses** as
concepts — *"that gas gets stuck in the stretchy dough made by flour and water"* is one node — so two
mentions of one thing are never the same string, and no matcher joins them without inventing links.

**Do not reach for a looser matcher.** It was proposed twice and refuted by experiment both times:
subset matching merged nothing on real rig links, and where it did fire it merged a node with its own
effect, closed transitively, and emitted a pair the speaker never stated. `cohere.md` ruling 11 now
states the constraint — **no non-transitive test may key node identity; it may suppress a shape,
never form one.**

So this is Extract's prompt, and it is the first thing worth working on.

---

## 4. What is open, by who owns it

**Yours, and nobody else can do them.**

- **The falsification week.** Build-order entry 0, never started,
  `measurements/within-sentence/explanations/` still holds only a `.gitkeep`. It now clears two
  blockers: it is the only measurement that can end the project, **and** it is the gold set the
  Extract prompt work needs.
- **`cohere.md` rulings 3 and 5** still change a signature and block its oracle.
- **`cohere.md`'s oracle, section 6.** Unwritten and yours. The scaffolding pattern that worked last
  time: an agent writes the inputs, you write only what should come back.
- **`decisions.md`'s "The child asks, never tells"** was relaxed twice without anyone touching the
  row, which the row itself calls a constitutional change. Strike it or restate it.
- **Supply has a spec, ten open rulings and no build-order entry.**

**Anybody's.**

- **Extract's prompt**, per section 3. The largest available win.
- **Rotating the child's examples** by turn index. Examples fixed the *move* and not the *variation*
  — at temperature 0 the strongest exemplar is the child's own previous lines, and they compound.
- **The rig's repeat counter compares whole strings**, so six lines with an identical opener read as
  zero repeats. It cannot see the defect a human sees instantly.
- **`unavailable` is overloaded** — an empty turn returns it, and the tally logs that as a note
  saying the model could not read a turn it was never asked to read.
- **`asDoc` needs the turn id.** *The `Doc` is the turn* is decided and unimplemented.
- **Nobody has read `/inference`'s response body**, so ruling 18's repeat-gate is specced against a
  route this app may not use. One command settles it.

---

## 5. Three process findings worth keeping

**The instruments earn their cost, and the suite does not.** Every serious defect this session came
from the red team, mutation, a review, or running the thing — never from a green test run. The red
team wrote four implementations that passed all fourteen tests and broke the piece. Mutation found
that nothing tested the stemmer. A review found `tallyIntroduced` comparing against the graph where
the spec said transcript.

**The refutation pass must default to STANDS.** Its first run refuted twelve findings out of twelve
and nine were real. With the default flipped it produced eight survivors, all genuine.

**Re-run the tool, never read the artefact.** `reports/mutation/mutation.json` is gitignored and is
not regenerated by this config. Three agents read it as authoritative and reported a stale figure.

**And the pattern behind the two matcher failures:** an agent that re-ran the experiment beat an
agent that reasoned about it, every single time. Prefer the probe.

---

## 6. First three moves

1. **Extract's prompt** — ask for the shortest phrase that names the thing rather than the whole
   clause, and re-run the rig. This is what makes Cohere's output trustworthy instead of noisy.
2. **`cohere.md` rulings 3 and 5**, then its oracle, then the piece loop to the end — it has no tests
   and it carries a kill number.
3. **The falsification week**, which nothing else can substitute for and which two other jobs now
   wait on.

**Do not** treat any number from `npm run rig` as a measurement. The explainer has no misconceptions
and no disfluency. `decisions.md` carries the row and the structural guard: no figure from it enters
a tracked file until `explanations/` holds fifteen real ones.
