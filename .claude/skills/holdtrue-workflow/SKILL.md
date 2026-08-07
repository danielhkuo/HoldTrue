---
name: holdtrue-workflow
description: The front door for building anything in HoldTrue. Locates where the work is, then either starts a feature or builds one piece end to end. Use when the user says "next piece", "build X", "start the <name> feature", or names a piece like Index, Retrieve, Extract, Cohere, Compare or Contradict — and when they invoke it with nothing at all.
---

One skill, one command. `docs/workflow.md` holds the argument for why the work is shaped this
way; this holds the procedure. It is the only numbered document — a citation to "step 4" means
a step here.

Two loops. **Feature entry** runs once per feature and produces a decomposition. **The piece
loop** runs once per piece and produces working code. Locate first; it will tell you which.

---

## Locate, before anything else

Four reads, in order. No questions until they are done — the answers are in files.

1. **The build order in [`docs/decisions.md`](../../../docs/decisions.md).** The single source.
   **Entries are not completed in order** — Anchor shipped while the falsification week above it
   was still open. So take the first entry not marked done **that this skill can act on**, and
   name any earlier open entry as a caveat rather than skipping it silently.

   **Then check the entry is still on the default path.** The model-knowledge pivot of 2026-08-07
   moved several pieces off it; `docs/decisions.md` marks which, and `docs/philosophy.md` says
   why. A piece with no subject on the default path is not the next piece, however high it sits.
   Say so and take the next one rather than building it because the list has not been renumbered.

2. **Classify that entry.** It is one of four things, and they go different ways:

   | Kind | Example | Where it goes |
   |---|---|---|
   | A measurement | *the falsification week* | Not this skill. Say so, name where the protocol lives, stop |
   | A deterministic piece | *Anchor* | The piece loop |
   | A model-dependent piece | *the extraction harness* | The piece loop, with the eval branch at step 5 |
   | A bundle naming a feature | *Feynman. Cohere, Compare…* | Open `docs/features/<name>.md`, take the first piece in its order that is unbuilt |

   A feature named in the build order with no `docs/features/<name>.md` goes to feature entry.

3. **`docs/specs/<piece>.md`.** Its status line says how far the piece got. **Verify before
   trusting it** — a session that died mid-step leaves a status line that lies. Three checks:
   does the test file exist, is there a red commit in the log, does the implementation exist.
   Correct the line rather than believing it.

4. **The map.** `gh issue list --label wayfinder:map`, then its open children — **bodies and
   comments both**. Wayfinder records a resolution as a comment, so a body alone is the question
   without the answer. Cross-check against the spec's section 5, which may already have ruled
   some of them non-blocking.

Then say where you are and what is next, and stop if the answer is that nothing can start.

The worked example below is what the four reads produced **on 2026-08-06**, and it is kept for its
shape rather than its content. Its content was overtaken a day later: the pivot took source
material off the default path, so #22 — where the source's causal link comes from — is superseded
there rather than blocking, and the same goes for #20. Read the paragraph as a demonstration of
how to answer, never as the current state of the repo. Run the four reads yourself.

> The falsification week is still open and is not this skill's work — its protocol is in
> `docs/features/feynman.md`. The first buildable entry is the extraction harness, which is
> model-dependent and takes the eval branch. It is blocked by
> [#22](https://github.com/danielhkuo/HoldTrue/issues/22), which the map calls the load-bearing
> decision on it: Extract's schema, Retrieve's return type and the eval set's contents all read
> from it. Resolve #22 before this piece starts.

That is the shape. Name the blocking ticket and stop; do not start a piece whose contract is
about to change.

**Not this skill:** whether the thing should exist at all. That is a project question answered by
measurements and councils. Building a piece of something that should not exist is the most
expensive mistake available.

---

## Feature entry

Runs once, when the build order names a feature with no `docs/features/<name>.md`.

### F1. The walkthrough

The human describes it; you write it back. Plain prose, one page, present tense, from the user's
point of view. No types, no file names, no architecture.

**Ask about every ambiguity rather than filling it in.** The questions are the output. They are
the things otherwise discovered halfway through building.

### F2. The seams

Propose a decomposition — for each piece a name, what it takes, what it returns, and whether it
is deterministic or depends on a model. A table is enough; write no code.

Constraints: every piece testable without the others present; keep any model-dependent surface as
small as possible; anything computable deterministically from a model's output is a separate
deterministic piece.

**The human corrects.** Reaching for a model where none is needed is the expensive mistake here —
it converts something a property test would settle into something needing a hand-labelled
evaluation set. Say plainly when you think a piece does not need one.

### F3. The order

The human orders the pieces. You check **dependency violations only**: does any piece depend on
something scheduled later? Answer that and nothing else. Do not propose a different order for any
other reason.

### F4. The fog check

Wayfinder is for features with genuinely open design questions. It is not a tollbooth every
feature pays — a Pomodoro timer has no fog, and charting one would be ceremony.

Ask: is there anything here that **cannot be specified until a decision is made**?

- **No fog.** Write `docs/features/<name>.md` and append the order to the build order in
  `docs/decisions.md`. Go straight to the piece loop.
- **Fog.** Write the feature doc, then prepare a `/wayfinder` invocation and hand it over.
  **You cannot invoke wayfinder yourself** — its frontmatter sets `disable-model-invocation`, and
  `AGENTS.md` forbids editing a user-level skill to suit this repo. Print the exact text for the
  human to paste, then stop.

**One map per feature.** A design question found later, while building a piece, becomes a ticket
on that feature's existing map. Never a second map.

---

## The piece loop

### 1. Branch

```
git checkout -b feat/<piece>
```

Never build on `main`. Step 7 commits a deliberately failing test, and a red commit does not
belong on the default branch — the pre-commit hook exists to enforce that split.

One piece per branch. A docs correction or toolchain fix that turns up still goes here, but say so
in the commit message: a commit message that cannot describe its own diff is the first sign the
branch has sprawled.

### 2. Harvest the map — before research, not after

This is the step that stops the same question being answered twice.

**Read every ticket's comments, not only its body.** Wayfinder posts a resolution as a comment
and step 11 below writes back the same way, so the body is the question and the comments are
where the thinking is. Found by running this skill on 2026-08-06: #22 and #25 each carried a
substantive comment the body did not, and #22's had already argued one of its three candidate
shapes out on the extraction arithmetic. A harvest that reads bodies only re-opens decisions that
are already half made, which is precisely the duplication this step exists to prevent.

An open ticket carrying a resolution comment is a **third state** — not decided, not untouched.
Say what the comment already settled and what it left open, and scope any further work to the
remainder. (Both tickets in that example were themselves overtaken by the 2026-08-07 pivot. What
survives is the lesson about comments, not the tickets.)

Query the feature's map and sort every child:

- **Closed, and it bears on this piece.** Decided. Cite the ticket in the spec. Do not
  re-litigate it and do not re-research it.
- **Closed research ticket.** Its findings live on a `research/<name>` branch — `research/stt-engine`
  is the existing one. Read them.
- **Open, and it blocks this piece.** The piece waits. Name the ticket and stop.
- **Open, and it does not block.** Say why in one sentence. That sentence goes into spec section 5
  as a closed ruling.
- **Superseded from outside the map.** A decision taken elsewhere can remove a ticket's subject
  without anyone closing it — the 2026-08-07 pivot did that to at least #20 and #22. This is not
  the same as decided. Name the decision that superseded it, say which path the ticket still
  applies to, which is usually the optional RAG hook, and leave its reasoning alone. Do not
  re-argue a question that no longer has a subject, and do not delete the argument either.

Anchor shipped with [#21](https://github.com/danielhkuo/HoldTrue/issues/21) and
[#25](https://github.com/danielhkuo/HoldTrue/issues/25) open, both ruled non-blocking with the
reason recorded. That is the move, not an exception to it.

**Write down what the harvest answered**, so step 3 can be seen not to repeat it.

### 3. Research the gaps — only what the harvest did not answer

The map answers **design** questions. This answers **implementation** questions, and the second of
the two below matters more than the first:

1. What library or technique already does this?
2. **How did the people who already solved this fail at it?**

Evidence it pays: `remark`/`mdast` turned out to be the only markdown parser preserving character
offsets, and reciprocal rank fusion is ten lines rather than a dependency. Against that,
LlamaIndex *removed* offset tracking because it "was frequently not correct," and LangChain's
`add_start_index` is a post-hoc `text.find()` returning −1 when the tokenizer altered the chunk.
Both are what a reasonable person reaches for first, and both are the failure
`docs/specs/anchor.md` exists to prevent.

**Research the numbers too, not just the libraries.** A performance claim in `AGENTS.md` sat
uncited for days and was wrong by twenty times. Benchmark anything a decision rests on. A number
that cannot be reproduced does not get to close a decision.

Fan out — one narrow topic per agent, per [Fan-out settings](#fan-out-settings).

**If research contradicts something the map decided**, comment on that ticket and re-open it. A
quiet local fix leaves the map wrong for whoever builds the next piece.

### 4. The spec, and the ruling loop

`docs/specs/<piece>.md`. Seven sections; write one to five now, six at step 6 and seven at step 11.

1. One paragraph on what it does.
2. The public API as TypeScript signatures. No implementation.
3. What it must not do.
4. Which `AGENTS.md` invariants apply, **by number and quoted in full — the number alone is not
   enough.** `AGENTS.md` guarantees the numbers are permanent addresses and does not renumber, so a
   number will not redirect you. What it will not tell you is whether the rule is still in force:
   the 2026-08-07 pivot repealed two entries outright, narrowed one, and put another under review,
   all of them keeping their numbers. A spec that says only *invariant 1* reads as a live citation
   and is a dead one. Quoting the sentence puts that in front of the next reader at the point of
   use, and it is the check that catches a repeal you did not know about.
5. Rulings and open questions.
6. Hard cases the property test generator must produce.
7. What is not closed.

**Section 5 is the state machine, and it is what makes the deliberation survive a dead session.**
Every question whose answer would change a signature is a numbered heading carrying a **proposed**
answer, the alternative it rejects, and either OPEN or a date and the ruling.

**Propose, never merely ask.** The human corrects; they do not author. A bare question is more
work for them than a wrong proposal is.

Then commit the spec and **stop**. They answer in chat or by editing the file — both work, because
the file is what the next session reads.

**The gate:** an OPEN ruling that would change a signature blocks the oracle. One that would not,
does not. Assumptions baked into a signature are expensive to remove later, which is the whole
reason this stops here rather than at step 8.

### 5. The oracle — the human's, and only the human's

They write: one sentence saying what correct means, two or three examples by hand, and the
invariant in plain words. You write the property test from that invariant, plus fixtures,
generators and structure.

**Write the oracle for this piece. Do not borrow one.** Anchor's was lifted from a teaching example
in another document and scoped out the exact case the piece existed for, which cost a full extra
cycle to discover.

**Check the generator produces its hard cases, and prove it.** Sample it, count the categories, and
assert the counts. This is measured, not hypothetical: degrading one generator to plain ASCII left
every property test green and the mutation score at 100%.

**Banned assertions**, per `AGENTS.md`: snapshot-only, `toBeDefined()` alone, mock-only tests that
never touch real logic, bare boolean assertions.

*A model-dependent piece takes [the eval branch](#the-model-dependent-piece) instead.*

### 6. Red-team the oracle — before implementation, not after

Four agents. Each gets the spec and the test file and one instruction:

> **Write an implementation that passes every test in this file and is wrong** — wrong meaning it
> violates something section 1 or section 3 states. Return the implementation and the input that
> exposes it, or say plainly that you could not.

Four angles, so this is not one prior sampled four times:

- **The degenerate input.** Empty, zero-length, absent.
- **The boundary.** First, last, one past.
- **Plausible but from the wrong place.** Right shape, wrong provenance.
- **The letter of section 3 kept, section 1 broken.**

Every survivor is a hole in the oracle at a named input. **The human rules on each**: write the
example, or dismiss it with a reason. Both outcomes are recorded in section 6.

No agent has been near an assertion — they write implementations, so the restriction holds by
construction rather than by instruction. This is mutation testing run before the code exists, and
it is aimed at the failure that put 23 green tests around a real defect in Anchor.

### 7. Run it red, and commit it red

```
npx vitest run src/<path>/<piece>.test.ts
```

Three checks: it runs, it fails, and it fails for the reason expected. A new test that passes here
is asserting nothing.

Commit the test **alone**. The hook blocks a test and its implementation landing together.

### 8. Implement

A **fresh agent**, which has seen the spec, the test file and the human's new examples, and which
**has not seen the red team's wrong implementations**. Showing them poisons it toward exactly the
shapes it was asked to avoid.

Write the implementation and whatever fixtures, setup and teardown it needs. Do not touch an
assertion. If a test cannot be made to pass, say why and stop.

### 9. Mutation — before the commit, not after

```
npm run mutate
```

**For anything gating an invariant this runs before the piece is called done.** Anchor was
committed green with 30 tests and a real defect in it; only mutation found it.

**Verify the instrument before trusting it.** A missing config once made Stryker fall back silently
to a runner that produced fictional coverage analysis. Check the output says what you think it says.

Surviving mutants are bug reports, not a score. Three verdicts:

- **Test it** — a real hole.
- **Dismiss it** — no input distinguishes mutant from original.
- **Fix the code** — the guard is genuinely dead. Delete it rather than writing a test to protect
  it. This is the verdict people forget, and it makes modules smaller.

**A survivor the red team also named is the strongest signal available**: two independent
instruments agreeing on the same hole.

### 10. Review

```
/holdtrue-code-review
```

Standards and Spec axes, then the refutation stage. Every finding is attacked before you read it;
only survivors are reported.

**Verify checkable findings yourself rather than refuting them by proxy.** Faster and more reliable.

**Expect a fix to introduce a bug.** It has happened: a correction to one Anchor defect added the
first unguarded property access on an untrusted field, breaking a stated contract. Re-run the full
loop after any non-trivial fix, mutation included.

### 11. Close the spec, and write back to the map

Update the status line — built, and what the review rounds found. Fill in section 7: what this
piece hands on.

**Every note in section 7 becomes a ticket on the feature's map**, or a comment on an existing one.
Anchor's note to Index is a paragraph Index's builder has to go and find; it should have been on
the map. Then merge.

A spec still reading as a draft after the piece ships is how the next reader learns to distrust the
specs.

---

## The model-dependent piece

At most one per feature. It replaces steps 5, 6 and 9 — there is no oracle to attack, so the red
team does not apply.

**The harness itself is specified in `AGENTS.md` under Testing** — its four layers, the size of the
labelled set, and the ban on an LLM judge. Read it there. It is deliberately not copied here; a
copy drifts, and this file has one source per fact. What this skill adds is the two things
`AGENTS.md` does not say.

**The cold control.** The human labels 30 items completely cold, no agent and no suggestions on
screen. The rest are agent-proposed and human-corrected. Then **run the assisted process over the
original 30 and compare** — if it agrees, the rest of the set is trustworthy; if not, label by
hand. Skipping that check is how you get an evaluation set that agrees with the model rather than
with reality. Never compare a fresh number against a remembered one.

**Open since 2026-08-07: not every piece still has a gold standard.** The harness assumes gold
labels exist. For Extract they do, and the pivot did not touch them — its labels are spans into the
user's *own explanation*, so the falsification week's explanations are still the first items of its
set. For the judgement downstream of extraction — *did this finding name a real gap in this
person's understanding* — they do not. The user's own source material was what authorised that
judgement, it is off the default path now, and nobody has decided what replaces it. So **if the
piece in front of you needs that judgement scored, it is blocked on a decision rather than on
labelling.** Say so and stop. Do not invent a gold standard inside a piece loop, and do not let a
model grade itself in place of one.

---

## When to convene a council

**Not per piece.** A council on a small piece is waste — the oracle is cheap and mutation finds
more than debate would.

Convene one when a decision is **expensive to reverse**: a data format other pieces will depend on,
an interface many callers bind to, or a choice the human is genuinely torn on. Adversarial pairs,
each side required to concede the strongest point against it.

## Fan-out settings

Four workflows died before these settled:

- **One narrow topic per agent.** Bundling four research topics into one prompt makes agents spawn
  children and hang.
- **Prose output, not a forced nested schema.** Complex schemas cause retry loops.
- **Say explicitly: do not spawn subagents.**
- **Give a tool-call budget** and permission to return partial findings with gaps marked. A partial
  answer that lands beats a complete one that never arrives.
- **Never claim independence you do not have.** Four instances of one model reading the same
  documents is one prior sampled four times. Useful, but say what it is — which is why the red team
  at step 6 is given four different attacks rather than four copies of one.

## The rules that do not bend

- **The human writes assertions.** Everything else is yours. Every fan-out in this file is shaped so
  that no agent can reach one.
- **Red-first**, except for tests derived from a mutation survivor — those are green by
  construction, since killing a mutant means passing on the original.
- **One source per fact.** A fact in two files will drift. It has already cost a wrong build order,
  a wrong performance number, and a benchmark figure that sat in four files with a source under
  none of them. The build order lives in `docs/decisions.md`, the decomposition in
  `docs/features/<name>.md`, the piece contract in `docs/specs/<piece>.md`, engineering figures in
  `docs/research/extraction-benchmarks.md`, and design decisions on the map. Nothing is copied
  between them; they cite each other.
- **Where a finding may come from is `docs/philosophy.md`'s to state, and it changed on
  2026-08-07.** Read it there rather than inferring it from a doc, a spec or a ticket written
  before that date. Several of them still argue from the repealed premise, and they are being
  corrected rather than deleted, so an uncorrected one is a live hazard.
- **One map per feature**, and this skill cannot invoke wayfinder — it prepares the invocation and
  hands it over.
- **A claim about how people learn** must already be in `docs/research/evidence-base.md`. The
  evidence gate is unchanged by the 2026-08-07 pivot — checked, not assumed — and it is still
  scoped to claims about learning. An engineering number is not gated there and is not exempt
  either: it carries its source, genre, metric and sample size, and if more than one file needs it,
  it lives in `docs/research/extraction-benchmarks.md` and the files cite it.
- **Never edit a test to make it pass.**
