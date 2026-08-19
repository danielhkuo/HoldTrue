# Why the workflow is shaped this way

This is the argument. The procedure is [`.claude/skills/holdtrue-workflow/SKILL.md`](../.claude/skills/holdtrue-workflow/SKILL.md),
which is the only document with numbered steps — so a citation to "step 4" means a step there.
Agents also read [`AGENTS.md`](../AGENTS.md), which holds the rules they must follow.

Read this when you want to know *why* a step exists, when you are tempted to skip one, or when you
are about to change the procedure. Everything below is either evidence or something that went
wrong here and cost time.

## The rule underneath all of it

**You write the tests, agents write the code.**

Agents given human-written tests solve about 94% of a standard benchmark. Writing their own tests
first, about 70%. In a study of 33,000 agent pull requests, 80% of the test files asserted almost
nothing, because agents write tests that agree with whatever the code already does.

That single split is what the whole procedure is built around. Every fan-out in the skill is shaped
so that no agent can reach an assertion — the red team writes implementations, the research agents
write prose, the mutation report is read and judged by you. The restriction is narrow on purpose,
and nothing else about an agent's work is limited.

## Two loops, not one

Feature entry runs once and produces a decomposition. The piece loop runs once per piece and
produces working code. They are separated because the decisions they make have different costs:
a bad seam is expensive to move after four pieces bind to it, and a bad implementation is cheap to
replace behind a good one.

Between them sits the map. `/wayfinder` charts a feature's open design questions as tickets and
resolves them one at a time; the piece loop harvests those resolutions rather than re-deriving
them. Anchor shipped with two map tickets still open, both ruled non-blocking with the reason
written into its spec, and that is the normal case rather than an exception — the two loops run
concurrently, and the ruling is what keeps them honest about it.

Wayfinder is not a tollbooth every feature pays. If charting surfaces no fog, there is nothing to
chart. Most features are like that.

## The walkthrough

Describe what happens from the user's side, in order, in plain language. No types, no file names,
no architecture. One page.

Talk it through with an agent and have it write your words back. You are not asking it to design
anything; you are using it as a transcriptionist so you can see whether the feature holds together
when written down. If you cannot produce a coherent walkthrough, you do not understand the feature
well enough to build it.

The questions it asks back are the valuable part. They are the ambiguities you would otherwise hit
halfway through building. For Feynman they were: can the user see their original explanation while
rewriting, what happens if the app finds no gap, and what happens if they write two sentences and
stop. All three turned into map tickets, and one of them is still open.

`/grill-me` is better than transcription when the feature is still vague in your head. It asks one
question at a time with a recommended answer, and the decisions stay yours.

## Finding the seams

A seam is a place you can cut the feature so the piece on either side can be built and tested on
its own. This is the most consequential thing you do, and the decision is yours. An agent proposes,
you correct.

**First, decide whether a model is involved at all.** Most features do not need one. A Pomodoro
timer, a study calendar, a document explorer, a tray icon and a focus blocker are all ordinary
code. If nothing in the walkthrough requires reading unstructured text, generating prose, or making
a judgement with no right answer, there is no model-dependent piece.

Reaching for a model when you do not need one is a real and common mistake, and it is expensive. It
turns something you could have verified with a property test into something that needs a
hand-labelled evaluation set.

Three questions find most seams, and a fourth applies only when a model is involved.

1. **Where does the data change shape?** Documents become chunks. Chunks become vectors. A review
   history becomes a due date.
2. **Where would you want to swap the implementation later?** If you can imagine replacing
   something without touching its neighbours, that boundary is real.
3. **Where does something become testable without the rest present?** If a piece needs four others
   to test, the seam is in the wrong place.
4. **Where does certainty change?** *Only if a model is involved.* Deterministic code gets unit
   tests, property tests and mutation checks. Model-dependent code gets an evaluation harness,
   because its quality is a distribution rather than a yes or no. You cannot run one strategy on the
   other, so cut the feature to make the model touch as little as possible.

`/codebase-design` has useful vocabulary for module depth, and its design-it-twice fan-out is worth
running when a decomposition feels forced. One warning: it uses "seam" to mean a public test
boundary, not a decomposition cut, so do not let an agent substitute its definition for the one
above.

### A feature with no model

This is the common case. For a study calendar the decomposition comes back as three deterministic
pieces — Topics turning an indexed document into stable topic ids, Schedule turning a topic and its
review history into a next due date, and Queue turning today's date and all schedules into an
ordered list of what is due.

The agent will usually raise one possible exception, and for this feature it raised the right one:
deciding which topics matter enough to schedule sounds like a judgement call. Notice it and reject
it. Spacing intervals are arithmetic with a known correct answer, so a model there would replace
something you can property-test with something that needs a labelled evaluation set. Every piece
is deterministic, so the model-dependent branch never runs.

### A feature with a model

For Feynman the first decomposition came back as Index, Anchor, Retrieve and Analyse — and it had
a bug in it. Finding that bug is the job.

`Analyse` was doing two things. Reading prose to pull out concepts and links genuinely needs a
model. But deciding which link the source makes that the explanation did not, given concepts on one
side and passages on the other, is set arithmetic. It only looks like a model's job.

Split it and the box gets smaller: Extract takes the user's explanation and returns concepts and
links with their spans, and is model-dependent. Compare takes those concepts plus the retrieved
passages and returns the link present in one and absent from the other, and is deterministic.

Now Compare can carry a property test, and you can be certain about the gap you show the user even
though the extraction feeding it is uncertain. That is the entire point of the step.

## Ordering

Sort the pieces so each depends only on things already built. Then build whatever everything else
reads from first, even when it is not the interesting part.

If a piece depends on a model, build it after the deterministic ones where you can. They are cheap
to verify, and you often need them working to generate the inputs for an evaluation set. Where you
cannot, say why — the extraction harness sits second in the build order precisely because it does
*not* need the index, and believing otherwise is what put it behind the index in the first place.

Do the ordering yourself. It takes two minutes and the reasoning is about what will be expensive to
change. Then have an agent check it for dependency violations only, because that is a question with
a right answer and reordering for taste is not.

The order itself lives in [`decisions.md`](decisions.md) and nowhere else. It was written out in
three places once and the copies contradicted each other on the point that mattered.

## Specifications

Ask for a draft and correct it. An agent will get the prose right and the API shape wrong, so read
the signatures carefully and ignore how confident the description sounds.

For Anchor the draft proposed `resolveAnchor(doc, anchor): Span | null`, and the null is the whole
decision: returning a best guess would break invariant 2, and throwing would make a missing quote
an error rather than the normal outcome it is. A document changed on disk is expected. That is a
one-word difference in a signature and a completely different module behind it.

**Section 5 of a spec is the part that earns its keep.** It names every question whose answer would
change a signature, each with a proposed answer and the alternative it rejects, and the piece stops
until they are ruled on. Assumptions baked into a signature are expensive to remove later.

It is also what makes deliberation survive a dead session. The rulings are in a file, in git, so a
fresh session picks up at the first one still open rather than starting the conversation again.
Anchor's section 5 ran to five rulings across two days and two of them came out of mutation runs.

## The oracle

This is the step you do not delegate.

The oracle answers "how would I know if this were wrong". Three parts: one sentence saying what
correct means, two or three examples that encode something you know and an agent does not, and the
invariant in plain words. You write the sentence and the examples yourself.

For Anchor the sentence was *an anchor created from a span resolves back to exactly that span, in
the same document, every time*, and the three examples were a plain span, a span containing an
emoji, and a repeated quote:

```ts
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

Neither is obvious from the signature. Each encodes something you happen to know about text,
JavaScript, or documents. That is what makes them worth writing yourself.

**Write the oracle for the piece in front of you.** Anchor's was borrowed from a teaching example
in another document, and it scoped out the exact case the piece existed for. That cost a full extra
cycle to find.

**`/tdd` is forbidden here, and this is why.** It has the agent write the failing test, and it names
writing tests up front as an anti-pattern in favour of one test and one implementation at a time.
That is correct when one person writes both halves. It is wrong here, because the entire reason
this procedure exists is that agents implementing against human-written tests do far better than
agents writing their own. If someone installs it later, an agent will cite it to justify editing
your tests. Do not let it.

### The generator is where the value is

An agent turns your invariant into a property test. The assertion will be your sentence transcribed
and will be fine. **Read the generator, not the assertion.** That is where an agent quietly cuts
corners.

Then prove it produces what you asked for — sample it, count the categories, assert the counts.
This is not hypothetical: degrading one generator to plain ASCII left every property test green and
the mutation score sitting at 100%.

### Red-teaming it

Four agents each try to write an implementation that passes your tests and is wrong. Any that
succeeds hands you the exact input your oracle does not cover, and you decide whether to write the
example or dismiss it.

The agents write implementations, never assertions, so the restriction holds by construction rather
than by instruction. It is mutation testing run before the code exists, and it exists because
Anchor was committed green with 23 tests and a real defect in it that only mutation found
(**corrected 2026-08-12: this said 30, which is today's count after four later commits; 23 is what
the implementation landed with, and `specs/child-speech.md` had it right**) — days
later, after a review round had already passed over it.

Four different attacks rather than four copies of one, for the reason in the fan-out settings: four
instances of one model given the same prompt is one prior sampled four times.

## Red first

Run the tests before any implementation exists. Check three things: they run, they fail, and they
fail for the reason you expected rather than some unrelated one. Ten seconds, and you have to
actually look.

`ReferenceError: createAnchor is not defined` is correct. So is an assertion failure once the
function exists but returns nothing useful. What is not fine is a test that passes — if anything
passes here it is asserting nothing, and you fix it now rather than finding out in six weeks that
it never checked anything.

The commit is split for the same reason, and the pre-commit hook enforces it: a test and its
implementation landing together is how an agent that cannot make a test pass edits the test
instead, and the change looks perfectly reasonable in a diff.

## Handing the work over

Give an agent the specification, the test file, and the relevant part of `AGENTS.md`. Then state
the restriction explicitly: it may not write or modify assertions.

Do not show it the red team's wrong implementations. It has just been handed four worked examples
of how to pass these tests incorrectly, and that is the opposite of what you want in its context.

Afterwards, two quick checks. Run `git diff` on the test file and confirm it is empty. Then skim
the implementation for anything special-casing your examples rather than solving the general
problem. The property test should have caught that, but it is worth a glance.

`/implement` is forbidden here because it chains straight into `/tdd` and commits on its own.
Implementing is not off limits; that skill is.

## Mutation

A mutation run makes small changes to your code and checks whether any test notices. A survivor
means nothing caught the change. Sometimes that is a real hole and sometimes the change did not
matter, and telling them apart is yours.

Two survivors from Anchor, and they went different ways. `if (end <= start)` mutated to
`if (end < start)` survived because no test passed a zero-length span — a real hole, and the ruling
that came out of it was that a zero-length span is refused at both doors. A survivor about the
exact number of characters of stored context was dismissed, because the number was arbitrary rather
than a correctness property. Most survivors are the second kind, which is why the score is not a
target.

There is a third verdict people forget: **fix the code**. When a guard is genuinely dead, delete it
rather than writing a test to protect it. Anchor's `end <= start` comparisons became unreachable
once one predicate answered both rulings at both doors, a mutation run reported them as survivors,
and they were removed. The module came out smaller than before the ruling, not larger.

**Verify the instrument before trusting it.** A missing config once made Stryker fall back silently
to a runner that produced fictional coverage analysis. And when a survivor lands on something the
red team already named, that is the strongest signal available — two independent instruments
agreeing on the same hole.

## The model-dependent piece

At most one per feature. It gets an evaluation harness rather than tests, because its quality is a
distribution rather than a pass or fail. There is no oracle, so there is nothing for the red team
to attack.

You need 100 to 150 labelled items. Label 30 completely cold yourself, with no agent and no
suggestions on screen, as a control set. Label the rest with an agent proposing and you correcting.
Then run the assisted process over your original 30 and compare. If it agrees with you, the rest of
the set is trustworthy. If not, label by hand.

Skipping that last check is how you end up with an evaluation set that agrees with the model rather
than with reality.

When you change a prompt or a model, always run the new version against the old one on the same
fixed items and compare them paired. Never compare a fresh number against a remembered one. A rate
measured on 100 items carries about seven percentage points of error either way, which is enough to
detect a change and not enough to claim the system is 82% accurate.

## The daily review

Run it every day regardless of what you built. Several passes over different dimensions at once,
then a second pass that tries to knock down what the first pass found, before you read any of it.

The refutation pass is not optional. Findings that read well and turn out to be wrong are common,
and reading unverified findings costs more time than running the extra pass does.

`/holdtrue-code-review` is a vendored fork in `.claude/skills/`. It runs two passes, one against
repo standards and one against the originating spec, and adds the refutation stage before
aggregation. Upstream ships the instruction *"Do not merge or rerank findings"* and hands you
everything raw. Use the fork.

Fix what survived. If the list is empty on a day you wrote a lot of code, be suspicious of the
review rather than pleased with yourself, and spot-check one file by hand. And expect a fix to
introduce a bug: a correction to one Anchor defect added the first unguarded property access on an
untrusted field, breaking a stated contract. Re-run the full loop after any non-trivial fix.

---

## Skills

These come from Matt Pocock's collection (MIT, `mattpocock/skills`), installed in
`~/.claude/skills/`. That is **user level**, so they are shared with every other project on this
machine — which is why none of the installed ones are edited. Editing a shared skill to suit one
repo would silently change how every other repo behaves.

Two need to behave differently here, so those two are **vendored into `.claude/skills/` under
`holdtrue-` names** and modified there. They travel with the repo, they do not collide with the
user-level originals, and they carry MIT attribution in `.claude/skills/LICENSE-mattpocock`.

| Skill | When |
|---|---|
| `/holdtrue-workflow` | The front door. Locates the work and runs either loop. **Local, not vendored** |
| `/wayfinder` | Charting a feature's open design questions. Cannot be invoked by an agent; you type it |
| `/grill-me` | The feature is still vague. One question at a time, decisions stay yours |
| `/codebase-design` | Vocabulary and design-it-twice, when a decomposition feels forced |
| `/holdtrue-code-review` | **Vendored fork.** Adds a refutation stage so you only see findings that survived an attack |
| `/holdtrue-diagnosing-bugs` | **Vendored fork.** Phase 5 hands you the minimised repro so you write the assertion |
| `/research` | An external fact needs verifying against primary sources |
| `/prototype` | You are unsure about a design and want to answer one question with throwaway code |
| `/handoff` | A session has run long and you want to carry the context forward |
| `/resolving-merge-conflicts` | Obvious |

### Forbidden here

Present and usable in your other projects, forbidden in this one, and `AGENTS.md` says so in a form
an agent will read.

**`/tdd`** and **`/implement`**, for the reasons above. **`/to-spec`**, because it optimises for the
fewest possible seams and states that the ideal number is one — this repo requires the opposite,
that every piece be testable without the others present.

`/triage` and `/to-tickets` are not forbidden, just unused: issue-tracker ceremony for a team of
one. They work if you ever want them.

### Where things live

GitHub issues, chosen at setup. `/wayfinder` reads and writes them, so it needs the GitHub remote
reachable before it works.

One source per fact, and the four sources are: the build order in [`decisions.md`](decisions.md),
a feature's decomposition in `docs/features/<name>.md`, a piece's contract in
`docs/specs/<piece>.md`, and design decisions on the map. They cite each other and nothing is
copied between them.

### If you re-pull from upstream

The user-level skills can be updated freely; nothing here depends on their contents.

The two vendored forks will not update, by design. They were taken from upstream on 2026-08-01. If
you want a later version, diff upstream against the fork and re-apply the two modifications by
hand: the refutation stage in `holdtrue-code-review`, and the handoff in phase 5 of
`holdtrue-diagnosing-bugs`. Both are marked in the file headers.

---

## Signs something has gone wrong

**A new test written by an agent passes on its first run.** It was never run red, or it is
asserting whatever the implementation already does. Delete it and write the assertion yourself.

**You are on your fifth or sixth example for one piece.** Either the piece is doing too much and
should be split, or what you want is a property test rather than more examples.

**A piece needs three other pieces present to test.** The seams are wrong. Go back to the
decomposition.

**No red-team agent could write a wrong implementation that passes.** Either the oracle is genuinely
tight, or the four attacks were too similar to each other. Check that the four angles were actually
different before believing the first reading.

**The model-dependent box keeps growing.** Something deterministic has been pulled inside it. Work
out what can be computed from the model's output rather than by it, and move that out.

**A review finding reads well and cites nothing.** Verify before acting. That is exactly what the
refutation pass exists to catch.

**A piece cannot be tested without loading Electron.** The seam is in the wrong place. Move the
logic into a plain module and leave a thin shell behind.

**You approved a batch of assisted labels without checking any.** Go back and run the cold-30
comparison before trusting any measurement built on them.

**Research at the start of a piece re-answers something the map already closed.** The harvest was
skipped. That is the step the whole wayfinder integration exists for.

**A piece ships with a note in its spec that never became a ticket.** The next builder has to find
it by reading, which means they will not. Anchor's note to Index is the one that got away.
