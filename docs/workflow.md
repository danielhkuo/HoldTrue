# Workflow

A step by step guide to building a feature. Follow it in order.

Every step gives you a skeleton prompt to copy and fill in, then the same prompt filled in for
a real example, then what comes back and what to do with it. Placeholders look like
`<THIS>`.

This document is for you, the person doing the work. Agents read [`AGENTS.md`](../AGENTS.md),
which holds the rules they have to follow. For why the workflow is shaped this way, read
[`decisions.md`](decisions.md).

Steps 1 to 3 run once per feature. Steps 4 to 8 repeat once per piece. Step 9 applies only if
one of your pieces calls a model, which most features do not. Step 10 runs daily.

The rule underneath all of it: **you write the tests, agents write the code.** Agents given
human-written tests solve about 94% of a standard benchmark. Writing their own tests first,
about 70%. In a study of 33,000 agent pull requests, 80% of the test files asserted almost
nothing, because agents write tests that agree with whatever the code already does.

Step 2 is worked twice, once for a feature with no model and once for a feature with one,
because the two go differently. Everything after that follows the Feynman feature, since that
is what you are building next.

---

## Step 1. Write the walkthrough

Describe what happens from the user's side, in order, in plain language. No types, no file
names, no architecture. One page.

Talk it through with an agent and have it write your words back to you. You are not asking it
to design anything, you are using it as a transcriptionist so you can see whether the feature
holds together when written down. If you cannot produce a coherent walkthrough, you do not
understand the feature well enough to build it.

**Skill: `/grill-me`, optional.** If the feature is still vague in your head, run this first.
It asks one question at a time with a recommended answer, and the decisions stay yours. It is
better than the prompt below when you do not yet know what you are building. Use the prompt
below when you do.

### Prompt

**Skeleton.**

```
I'm building the <FEATURE NAME> feature. I'll describe it and you write it back
as a user walkthrough: plain prose, one page, present tense, from the user's
point of view. No types, no file names, no architecture.

Ask me about anything I leave ambiguous rather than filling it in yourself.

Here's the idea: <TWO OR THREE ROUGH SENTENCES>
```

**Filled in.**

```
I'm building the Feynman feature. I'll describe it and you write it back as a
user walkthrough: plain prose, one page, present tense, from the user's point of
view. No types, no file names, no architecture.

Ask me about anything I leave ambiguous rather than filling it in yourself.

Here's the idea: the user picks a document they've already read. The app asks
them to explain how it works from memory. Then it finds something they missed
and shows them.
```

**What comes back.**

```
The user opens HoldTrue and picks a document from their library, one they have
already read. The app clears the screen and asks them to explain, from memory,
how the thing works. Nothing else is visible while they write.

When they finish, the app shows them a passage from their own document that
connects two ideas they mentioned but never linked, and asks one question about
that specific gap.

If they answer it, the session ends. If they cannot, the app shows the passage in
full with its citation, and asks them to write their explanation again with the
missing step in it.

Questions:
1. Can they see their original explanation while rewriting, or is the second
   attempt also from memory?
2. What happens if the app finds no gap?
3. What happens if they write two sentences and stop?
```

**What you do with it.** Answer the questions, have it revise, read it once more and fix
anything subtly not what you meant. Save it as the top of `docs/features/<name>.md`. The
questions are the valuable part. They are the ambiguities you would otherwise hit halfway
through building.

---

## Step 2. Find the seams

A seam is a place you can cut the feature so the piece on either side can be built and tested
on its own. This is the most consequential thing you do, and the decision is yours. An agent
proposes, you correct.

**First, decide whether a model is involved at all.** Most features do not need one. A
Pomodoro timer, a study calendar, a document explorer, a tray icon and a focus blocker are all
ordinary code. If nothing in your walkthrough requires reading unstructured text, generating
prose, or making a judgement with no right answer, then you have no model-dependent piece.
Say so out loud in the prompt, skip step 9 entirely, and ignore the fourth question below.

Reaching for a model when you do not need one is a real and common mistake, and it is
expensive. It turns something you could have verified with a property test into something that
needs a hand-labelled evaluation set.

**Skill: `/codebase-design`, optional.** Useful vocabulary for module depth and interfaces, and
its design-it-twice fan-out is worth running when a decomposition feels forced. One warning:
it uses "seam" to mean a public test boundary, not a decomposition cut, so do not let an agent
substitute its definition for the one in this document.

Three questions find most seams, and a fourth applies only when a model is involved.

1. **Where does the data change shape?** Documents become chunks. Chunks become vectors. A
   review history becomes a due date.
2. **Where would you want to swap the implementation later?** If you can imagine replacing
   something without touching its neighbours, that boundary is real.
3. **Where does something become testable without the rest present?** If a piece needs four
   others to test, the seam is in the wrong place.
4. **Where does certainty change?** *Only if a model is involved.* Deterministic code gets
   unit tests, property tests and mutation checks. Model-dependent code gets an evaluation
   harness, because its quality is a distribution rather than a yes or no. You cannot run one
   strategy on the other, so cut the feature to make the model touch as little as possible.

### Prompt

**Skeleton.**

```
Here is the walkthrough for the <FEATURE NAME> feature.

<PASTE WALKTHROUGH>

Propose a decomposition into pieces that can each be built and tested
independently. For each piece: a name, what it takes as input, what it returns,
and whether it is deterministic or depends on a model.

Constraints:
- <PICK ONE OF THE TWO LINES BELOW>
- (no model) I do not believe any part of this needs a model. If you disagree,
  say which part and why, but do not add one on your own.
- (model) Keep the model-dependent surface as small as possible. If something
  can be computed deterministically from a model's output, it is a separate
  deterministic piece.
- Every piece must be testable without the others present.
- Do not write any code. A table is enough.
```

### Worked example A: a feature with no model

This is the common case, so start here.

**Filled in.**

```
Here is the walkthrough for the Study Calendar feature.

The user has topics drawn from documents they have already studied. The app
decides when each topic is due to be revisited and shows them what is due today.
When they finish reviewing one, the app schedules the next visit.

Propose a decomposition into pieces that can each be built and tested
independently. For each piece: a name, what it takes as input, what it returns,
and whether it is deterministic or depends on a model.

Constraints:
- I do not believe any part of this needs a model. If you disagree, say which
  part and why, but do not add one on your own.
- Every piece must be testable without the others present.
- Do not write any code. A table is enough.
```

**What comes back.**

```
| Piece    | Takes                              | Returns                    | Kind          |
|----------|------------------------------------|----------------------------|---------------|
| Topics   | An indexed document                | Stable topic ids           | Deterministic |
| Schedule | A topic id and its review history  | The next due date          | Deterministic |
| Queue    | Today's date and all schedules     | What is due, in order      | Deterministic |

I do not think any part of this needs a model. One possible exception: deciding
which topics matter enough to schedule could be a judgement call. But it can also
be derived from what the user has actually reviewed, which is deterministic.
```

**What you do with it.** Agree with it. The exception it raises is worth noticing and
rejecting: "decide which topics matter" sounds like a judgement, and it is exactly the kind
of place a model gets added for no reason. Spacing intervals are arithmetic with a known
correct answer, so a model there would replace something you can property-test with something
that needs a labelled evaluation set. Every piece is deterministic, so you skip step 9 and go
straight to step 3.

### Worked example B: a feature with a model

**Filled in.**

```
Here is the walkthrough for the Feynman feature.

The user opens HoldTrue and picks a document from their library, one they have
already read. The app clears the screen and asks them to explain, from memory,
how the thing works... [rest of walkthrough]

Propose a decomposition into pieces that can each be built and tested
independently. For each piece: a name, what it takes as input, what it returns,
and whether it is deterministic or depends on a model.

Constraints:
- Keep the model-dependent surface as small as possible. If something can be
  computed deterministically from a model's output, it is a separate
  deterministic piece.
- Every piece must be testable without the others present.
- Do not write any code. A table is enough.
```

**What comes back.**

```
| Piece    | Takes                           | Returns                          | Kind          |
|----------|---------------------------------|----------------------------------|---------------|
| Index    | A folder of documents           | Chunks with ids and offsets      | Deterministic |
| Anchor   | A document and a char range     | A re-findable reference          | Deterministic |
| Retrieve | A set of concepts               | Ranked passages from the library | Deterministic |
| Analyse  | The explanation and the source  | The gap, and a question about it | Model         |
```

**What you do with it.** This is where you work. The response above has a bug and finding it
is the job.

`Analyse` is doing two things. Reading prose to pull out concepts and links genuinely needs a
model. But deciding which link the source makes that the explanation did not, given concepts
on one side and passages on the other, is set arithmetic. It only looks like a model's job.

Split it and the box gets smaller:

```
| Extract | The user's explanation        | Concepts and links, with spans               | Model         |
| Compare | Extracted concepts + passages | The link present in one and absent in the other | Deterministic |
```

Now `Compare` can carry a property test, and you can be certain about the gap you show the
user even though the extraction feeding it is uncertain. That is the entire point of step 2.

---

## Step 3. Order the pieces

Sort them so each piece only depends on things already built. Then build whatever everything
else reads from first, even when it is not the interesting part.

If one of your pieces depends on a model, build it after the deterministic ones. They are
cheap to verify, and you need them working to generate the inputs for its evaluation set. If
none of them do, dependency order is the only rule you need.

Do the ordering yourself. It takes two minutes and the reasoning is about what will be
expensive to change. Then have an agent check it for dependency violations only.

### Prompt

**Skeleton.**

```
Here is my decomposition and my proposed build order.

<PASTE TABLE>

Build order: <PASTE ORDER>

Check the order for dependency violations only. Does any piece depend on
something scheduled later? Answer only that question. Do not propose a different
order for any other reason.
```

**Filled in.**

```
Here is my decomposition and my proposed build order.

| Anchor | Index | Retrieve | Extract | Compare | ...

Build order: Anchor, Index, Retrieve, Extract, Compare, Session, Interface

Check the order for dependency violations only. Does any piece depend on
something scheduled later? Answer only that question. Do not propose a different
order for any other reason.
```

**What comes back.**

```
No dependency violations. Anchor is depended on by Index, Retrieve, Extract and
Compare and is scheduled first. Compare depends on Retrieve and Extract, both
earlier. Session depends on all five. Interface depends on Session.
```

**What you do with it.** Write the order into `docs/features/<name>.md` under the walkthrough,
with a one-line reason per entry. Steps 4 to 8 now repeat once per line.

For Feynman the reasons are: Anchor first because everything produces or consumes anchors and
changing the format later means touching every other piece. Index next because Retrieve and
Extract need real chunks. Retrieve because Compare needs passages. Extract fourth because it
needs the earlier pieces to generate its evaluation inputs. Compare fifth. Then Session, then
Interface, always last.

---

## Step 4. Write the specification for one piece

Ask for a draft and correct it. It will get the prose right and the API shape wrong, so read
the signatures carefully and ignore how confident the description sounds.

### Prompt

**Skeleton.**

```
Write a specification for the <PIECE NAME> piece from this decomposition.

<PASTE THAT PIECE'S ROW>

Four sections only:
1. One paragraph on what it does.
2. The public API as TypeScript signatures. No implementation.
3. What it must not do.
4. Which invariants from AGENTS.md apply. Quote them by number.

Do not write tests and do not write the implementation.
```

**Filled in.**

```
Write a specification for the Anchor piece from this decomposition.

| Anchor | A document and a char range | A re-findable reference | Deterministic |

Four sections only:
1. One paragraph on what it does.
2. The public API as TypeScript signatures. No implementation.
3. What it must not do.
4. Which invariants from AGENTS.md apply. Quote them by number.

Do not write tests and do not write the implementation.
```

**What comes back.**

```ts
// src/index/anchor.ts
//
// Takes a document and a range of characters within it, and returns an anchor
// that can find that same range again after the document has been re-parsed.
// Returns null if the range is not valid for the document.

createAnchor(doc: Doc, start: number, end: number): Anchor | null
resolveAnchor(doc: Doc, anchor: Anchor): Span | null

// Must not do fuzzy matching. If the stored quote is not present verbatim,
// resolveAnchor returns null rather than guessing.
//
// Invariants: AGENTS.md #2, quotes validated as literal substrings, and the
// anchor format section.
```

**What you do with it.** Check the signatures, not the prose. Here `resolveAnchor` returning
`Span | null` is right, because returning a best guess would break invariant 2. If it had
proposed returning `Span` and throwing on failure, change it, because the caller needs a
missing quote to be a normal outcome rather than an error.

---

## Step 5. Write the oracle

This is the step you do not delegate.

The oracle answers "how would I know if this were wrong". Three parts. One sentence saying
what correct means. Two or three examples that encode something you know and an agent does
not, written by hand. Then the invariant in plain words, which an agent turns into a property
test.

You write the sentence and the examples yourself. There is no prompt for those, and that is
the point.

**No skill for this step, deliberately.** `/tdd` is installed but forbidden here. It has the agent write the
failing test, and it names writing tests up front as an anti-pattern in favour of one test and
one implementation at a time. That is correct when one person writes both halves. It is wrong
here, because the entire reason this workflow exists is that agents implementing against
human-written tests do far better than agents writing their own. If someone installs `/tdd`
later, an agent will cite it to justify editing your tests. Do not let it.

**The sentence.** An anchor created from a span resolves back to exactly that span, in the
same document, every time.

**The examples, by hand.**

```ts
// The ordinary case.
test('resolves a plain span', () => {
  const doc = makeDoc('the quick brown fox')
  expect(resolveAnchor(doc, createAnchor(doc, 4, 9)!)).toEqual({ start: 4, end: 9 })
})

// JavaScript strings are UTF-16, so "👋".length is 2, not 1. Mixing code points
// and code units returns the wrong span and nothing throws.
test('resolves a span containing an emoji', () => {
  const doc = makeDoc('wave 👋 here')
  expect(resolveAnchor(doc, createAnchor(doc, 5, 7)!)).toEqual({ start: 5, end: 7 })
})

// The same quote appears twice. It must resolve to the occurrence it came from,
// not the first match found.
test('resolves the correct occurrence of a repeated quote', () => {
  const doc = makeDoc('water splits. then water recombines.')
  expect(resolveAnchor(doc, createAnchor(doc, 19, 24)!)).toEqual({ start: 19, end: 24 })
})
```

None of those are obvious from the signature. Each encodes something you happen to know about
text, JavaScript, or documents. That is what makes them worth writing yourself.

### Prompt

**Skeleton.**

```
Here is an invariant in plain words:

  <ONE SENTENCE THAT MUST ALWAYS BE TRUE>

Write a fast-check property test for it, and write the arbitrary generator too.

The generator must produce hard cases, not just the easy ones. Specifically:
- <HARD CASE>
- <HARD CASE>
- <HARD CASE>

Do not write the implementation.
```

**Filled in.**

```
Here is an invariant in plain words:

  For any document and any valid character range within it, creating an anchor
  from that range and then resolving it returns the original range.

Write a fast-check property test for it, and write the arbitrary generator too.

The generator must produce hard cases, not just the easy ones. Specifically:
- Combining characters
- Astral-plane symbols such as emoji
- Repeated substrings
- Spans at the very start and the very end of the document

Do not write the implementation.
```

**What comes back.**

```ts
const arbitraryDocAndSpan = () =>
  fc.string({ unit: 'grapheme' }).chain(text =>
    fc.tuple(
      fc.constant(makeDoc(text)),
      fc.nat(text.length),
      fc.nat(text.length)
    ).map(([doc, a, b]) => ({
      doc,
      span: { start: Math.min(a, b), end: Math.max(a, b) }
    }))
  )

test('any anchor round-trips to the span it came from', () => {
  fc.assert(
    fc.property(arbitraryDocAndSpan(), ({ doc, span }) => {
      const anchor = createAnchor(doc, span.start, span.end)
      expect(resolveAnchor(doc, anchor!)).toEqual(span)
    })
  )
})
```

**What you do with it.** Read the generator, not the assertion. The assertion is your sentence
transcribed and will be fine. The generator is where an agent quietly cuts corners, and it is
where all the value is.

Then verify it actually generates what you asked for, with a second prompt:

```
Print 50 samples from arbitraryDocAndSpan() and show me the raw strings.
```

Look at them. If they are all plain ASCII, the generator is not doing its job and you say so.

---

## Step 6. Run the tests and watch them fail

Run them before any implementation exists. Check three things: they run, they fail, and they
fail for the reason you expected rather than some unrelated reason. Ten seconds, and you have
to actually look.

**No prompt for this step.** You run it yourself.

```
npx vitest run src/index/anchor.test.ts
```

**What comes back.**

```
 FAIL  src/index/anchor.test.ts > resolves a plain span
 ReferenceError: createAnchor is not defined
```

**What you do with it.** That is the correct failure, so continue. An assertion failure is
also fine once the function exists but returns nothing useful:

```
 AssertionError: expected undefined to deeply equal { start: 4, end: 9 }
```

What is not fine is a test that passes. If anything passes here it is asserting nothing. Fix
it now rather than finding out in six weeks that it never checked anything.

---

## Step 7. Hand the work to an agent

Give it the specification, the test file, and the relevant part of `AGENTS.md`. Then state the
restriction explicitly: it may not write or modify assertions. Without that, an agent which
cannot make a test pass will sometimes edit the test instead of the code, and the change looks
perfectly reasonable in a diff.

**No skill for this step.** `/implement` is installed but forbidden here. It chains straight into `/tdd` and
commits on its own, and both of those are wrong here.

### Prompt

**Skeleton.**

```
Implement <IMPLEMENTATION PATH> so that <TEST PATH> passes.

Read <ANY DOC THAT DEFINES THE FORMAT> and AGENTS.md invariant <NUMBERS> first.

You may write the implementation, plus any setup, teardown or fixtures the tests
need.

You may not write or modify any assertion, and you may not change any existing
test. If you believe a test is wrong, stop and tell me why instead of changing
it.

Run the tests when you are done and show me the output.
```

**Filled in.**

```
Implement src/index/anchor.ts so that src/index/anchor.test.ts passes.

Read docs/decisions.md for the anchor format and AGENTS.md invariant 2 first.

You may write the implementation, plus any setup, teardown or fixtures the tests
need.

You may not write or modify any assertion, and you may not change any existing
test. If you believe a test is wrong, stop and tell me why instead of changing
it.

Run the tests when you are done and show me the output.
```

**What comes back.** The implementation and a passing test run.

**What you do with it.** Two quick checks. Run `git diff` on the test file and confirm it is
empty. Then skim the implementation for anything special-casing your three examples rather
than solving the general problem. The property test should have caught that, but it is worth
a glance.

---

## Step 8. Verify the result

An agent runs the tests, scans for the banned assertion patterns in `AGENTS.md`, and runs a
mutation check if the piece is deterministic. Deciding which surviving mutants matter is
yours.

A mutation run makes small changes to your code and checks whether any test notices. A
survivor means nothing caught the change. Sometimes that is a real hole and sometimes the
change did not matter.

**Run it yourself.**

```
npx stryker run --incremental --mutate src/index/anchor.ts
```

**What comes back.**

```
Survived: src/index/anchor.ts:42
  - if (end <= start) return null
  + if (end < start) return null

Survived: src/index/anchor.ts:58
  - const context = text.slice(start - 32, start)
  + const context = text.slice(start - 31, start)

Mutation score: 71%
```

### Prompt

Use an agent to explain the survivors, not to judge them.

**Skeleton.**

```
Here is a mutation report for <FILE>.

<PASTE REPORT>

For each survivor, tell me in one sentence what behaviour is currently untested.

Do not tell me whether it matters, do not rank them, and do not propose tests.
```

**Filled in.**

```
Here is a mutation report for src/index/anchor.ts.

Survived: src/index/anchor.ts:42
  - if (end <= start) return null
  + if (end < start) return null

Survived: src/index/anchor.ts:58
  - const context = text.slice(start - 32, start)
  + const context = text.slice(start - 31, start)

For each survivor, tell me in one sentence what behaviour is currently untested.

Do not tell me whether it matters, do not rank them, and do not propose tests.
```

**What comes back.**

```
Line 42: no test passes a span where start equals end, so the zero-length case
is unverified.

Line 58: no test depends on the exact number of characters of context stored
alongside the quote.
```

**What you do with it.** Ignore the score, judge each survivor yourself.

The first one: can a caller legitimately pass a zero-length span? If yes, that is a real hole
and you write the test. If an upstream check makes it impossible, dismiss it.

The second one: 31 or 32 characters of context is an arbitrary choice, not a correctness
property. Dismiss it.

Most survivors are the second kind, which is why the score is not a target.

---

## Step 9. The model-dependent piece

**Skip this step if your decomposition has no model-dependent piece.** Most features do not.
Go straight to step 10.

At most one piece per feature should be model-dependent. It gets an evaluation harness rather
than tests, because its quality is a distribution rather than a pass or fail.

You need 100 to 150 labelled items. Label 30 completely cold yourself, with no agent and no
suggestions on screen, as a control set. Label the rest with an agent proposing and you
correcting. Then run the assisted process over your original 30 and compare. If it agrees with
you, the rest of the set is trustworthy. If not, label by hand.

Skipping that last check is how you end up with an evaluation set that agrees with the model
rather than with reality.

### Prompt

**Skeleton.**

```
Here are <N> <ITEM TYPE>.

<PASTE ITEMS>

For each one, extract <WHAT YOU WANT> and output JSON matching the schema in
<SCHEMA LOCATION>.

<THE RULE THAT KEEPS IT HONEST>
```

**Filled in.**

```
Here are 30 explanations written from memory by a learner.

[paste the 30 explanations]

For each one, list the concepts the person named and the causal links they
explicitly asserted between those concepts. Output JSON matching the schema in
docs/features/feynman.md.

Do not infer links that are implied but not stated. Only links the text actually
asserts.
```

**What comes back.** Thirty JSON objects.

**What you do with it.** Compute precision and recall against the labels you made by hand. If
concepts are both above roughly 0.9 and links are above roughly 0.75, trust the assisted
labels for the rest of the set. Below that, label by hand.

Later, when you change a prompt or a model, always run the new version against the old one on
the same fixed items and compare them paired. Never compare a fresh number against a
remembered one. A rate measured on 100 items carries about seven percentage points of error
either way, which is enough to detect a change and not enough to claim the system is 82%
accurate.

---

## Step 10. The daily review

Run this every day regardless of what you built. Several passes over different dimensions at
once, then a second pass that tries to knock down what the first pass found, before you read
any of it.

The refutation pass is not optional. Findings that read well and turn out to be wrong are
common, and reading unverified findings costs more time than running the extra pass.

**Skill: `/holdtrue-code-review`.** A vendored fork in `.claude/skills/`. It runs two passes,
one against repo standards and one against the originating spec, which is more than the prompt
below does. Upstream ships the instruction *"Do not merge or rerank findings"* and hands you
everything raw; the fork adds the refutation stage before aggregation and reports how many
findings were dropped. Use the fork, not `/code-review`.

### Prompt

**Skeleton.**

```
Review everything changed since <REFERENCE POINT>. Run independent passes, one
per dimension:

1. <DIMENSION>
2. <DIMENSION>
3. <DIMENSION>
4. <DIMENSION>

Then for every finding, try to refute it. Construct the strongest argument that
it is not a real problem. Drop anything you can refute.

Show me only the findings that survived, each with the refutation attempt that
failed.
```

**Filled in.**

```
Review everything changed since the last review. Run independent passes, one per
dimension:

1. Correctness. Bugs, edge cases, error handling.
2. Invariant violations. Check every change against the numbered invariants in
   AGENTS.md and cite the number.
3. Test quality. Look for the banned assertion patterns, and for tests that
   would still pass if the implementation were wrong.
4. Simplification. Code that could be shorter or clearer with no behaviour
   change.

Then for every finding, try to refute it. Construct the strongest argument that
it is not a real problem. Drop anything you can refute.

Show me only the findings that survived, each with the refutation attempt that
failed.
```

**What comes back.** A short list, usually far shorter than the raw finding count.

**What you do with it.** Fix what survived. If the list is empty on a day you wrote a lot of
code, be suspicious of the review rather than pleased with yourself, and spot-check one file
by hand.

---

## Skills

These come from Matt Pocock's collection (MIT, `mattpocock/skills`), installed in
`~/.claude/skills/`. That is **user level**, so they are shared with every other project on
this machine.

Because of that, none of the installed ones are edited. Editing a shared skill to suit one
repo would silently change how every other repo behaves.

Two of them need to behave differently here, so those two are **vendored into
`.claude/skills/` under `holdtrue-` names** and modified there. They travel with the repo, they
do not collide with the user-level originals, and they carry MIT attribution in
`.claude/skills/LICENSE-mattpocock`.

### Tied to a step

| Skill | Step | Note |
|---|---|---|
| `/grill-me` | 1 | Optional. Use when the feature is still vague. One question at a time, decisions stay yours |
| `/codebase-design` | 2 | Optional. Vocabulary and design-it-twice. Its "seam" means a test boundary, not a decomposition cut |
| `/holdtrue-code-review` | 10 | **Vendored fork.** Adds a refutation stage so you only see findings that survived an attack |

### Not tied to a step

| Skill | When |
|---|---|
| `/holdtrue-diagnosing-bugs` | Something is broken and you do not know why. **Vendored fork.** Phase 5 hands you the minimised repro so you write the assertion |
| `/research` | You need an external fact verified against primary sources |
| `/prototype` | You are unsure about a design and want to answer one question with throwaway code |
| `/wayfinder` | A piece turns out to be much bigger than step 2 suggested |
| `/handoff` | A session has run long and you want to carry the context forward |
| `/resolving-merge-conflicts` | Obvious |

### Installed but not used here

These arrived with the collection and are shared with your other projects, so they are present
and usable elsewhere. They are forbidden in this repo, and `AGENTS.md` says so in a form an
agent will read.

**`/tdd`.** It has the agent write the failing test, and it names writing tests before
implementation as an anti-pattern. Both are load-bearing disagreements, not preferences. See
step 5.

**`/implement`.** Chains into `/tdd` and commits unprompted.

**`/to-spec`.** Optimises for the fewest possible seams, stating that the ideal number is one.
Step 2 requires the opposite: every piece testable without the others present.

**`/triage` and `/to-tickets`.** Not forbidden, just unused: issue-tracker ceremony for a
team of one. They work if you ever want them.

### Issue tracker

GitHub issues, chosen at setup. `/triage`, `/to-tickets` and `/wayfinder` all read and write
tickets, so they need the GitHub remote to exist and be reachable before they work.

Specs are split. The walkthrough and the decomposition from steps 1 to 3 live in
`docs/features/<name>.md` and are versioned with the code. Tickets and their status live on
GitHub. Do not duplicate one into the other.

### If you re-pull from upstream

The user-level skills can be updated freely; nothing here depends on their contents.

The two vendored forks will not update, by design. They were taken from upstream on
2026-08-01. If you want a later version, diff upstream against the fork and re-apply the two
modifications by hand: the refutation stage in step 5 of `holdtrue-code-review`, and the
handoff in phase 5 of `holdtrue-diagnosing-bugs`. Both are marked in the file headers.

---

## Signs something has gone wrong

**A new test written by an agent passes on its first run.** It was never run red, or it is
asserting whatever the implementation already does. Delete it and write the assertion
yourself.

**You are on your fifth or sixth example for one piece.** Either the piece is doing too much
and should be split, or what you want is a property test rather than more examples.

**A piece needs three other pieces present to test.** The seams are wrong. Go back to step 2.

**The model-dependent box keeps growing.** Something deterministic has been pulled inside it.
Work out what can be computed from the model's output rather than by it, and move that out.

**A review finding reads well and cites nothing.** Verify before acting. That is exactly what
the refutation pass in step 10 exists to catch.

**A piece cannot be tested without loading Electron.** The seam is in the wrong place. Move the
logic into a plain module and leave a thin shell behind.

**You approved a batch of assisted labels without checking any.** Go back and run the step 9
comparison before trusting any measurement built on them.
