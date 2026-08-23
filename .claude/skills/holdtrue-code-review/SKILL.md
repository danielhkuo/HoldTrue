---
name: holdtrue-code-review
description: Review the changes since a fixed point (commit, branch, tag, or merge-base) along two axes - Standards (does the code follow this repo's documented standards and invariants?) and Spec (does the code match what the originating issue asked for?). Runs both in parallel sub-agents, then tries to refute every finding and reports only the survivors. Use when reviewing a branch, a PR, work in progress, or asked to "review since X".
---

> Derived from `code-review` in Matt Pocock's skills collection (MIT, see
> `../LICENSE-mattpocock`). Modified for this repo: standards sources point at `AGENTS.md`,
> and a refutation stage runs before aggregation. `AGENTS.md` rule 30 requires this review.

Two-axis review of the diff between `HEAD` and a fixed point the user supplies:

- **Standards** — does the code conform to this repo's documented coding standards?
- **Spec** — does the code faithfully implement the originating issue / PRD / spec?

Both axes run as **parallel sub-agents** so they don't pollute each other's context, then this skill aggregates their findings.

Issues live on GitHub for this repo. Use `gh` to fetch them.

## Process

### 1. Pin the fixed point

Whatever the user said is the fixed point — a commit SHA, branch name, tag, `main`, `HEAD~5`, etc. If they didn't specify one, ask for it.

Capture the diff command once: `git diff <fixed-point>...HEAD` (three-dot, so the comparison is against the merge-base). Also note the list of commits via `git log <fixed-point>..HEAD --oneline`.

Before going further, confirm the fixed point resolves (`git rev-parse <fixed-point>`) and the diff is non-empty. A bad ref or empty diff should fail here — not inside two parallel sub-agents.

### 2. Identify the spec source

Look for the originating spec, in this order:

1. Issue references in the commit messages (`#123`, `Closes #45`, etc.) — fetch with `gh issue view`.
2. A path the user passed as an argument.
3. A case in `docs/cases.md`, a decision in `docs/decisions.md`, or a file under `docs/proposals/`
   that matches the branch name or the feature.
4. If nothing is found, ask the user where the spec is. If they say there isn't one, the **Spec** sub-agent will skip and report "no spec available".

### 3. Identify the standards sources

**In this repo the standards source is `AGENTS.md`.** It carries numbered rules in seven
groups, an evidence rule, a testing section and a writing standard. Every finding against it must
cite the rule number. A document change must also meet rule 37, Simplified Technical English.

`docs/decisions.md` holds the reasoning behind the rules. Read it only when a finding turns on
*why* a rule exists.

On top of whatever the repo documents, the Standards axis always carries the **smell baseline** below — a fixed set of Fowler code smells (_Refactoring_, ch.3) that applies even when a repo documents nothing. Two rules bind it:

- **The repo overrides.** A documented repo standard always wins; where it endorses something the baseline would flag, suppress the smell.
- **Always a judgement call.** Each smell is a labelled heuristic ("possible Feature Envy"), never a hard violation — and, like any standard here, skip anything tooling already enforces.

Each smell reads *what it is* → *how to fix*; match it against the diff:

- **Mysterious Name** — a function, variable, or type whose name doesn't reveal what it does or holds. → rename it; if no honest name comes, the design's murky.
- **Duplicated Code** — the same logic shape appears in more than one hunk or file in the change. → extract the shared shape, call it from both.
- **Feature Envy** — a method that reaches into another object's data more than its own. → move the method onto the data it envies.
- **Data Clumps** — the same few fields or params keep travelling together (a type wanting to be born). → bundle them into one type, pass that.
- **Primitive Obsession** — a primitive or string standing in for a domain concept that deserves its own type. → give the concept its own small type.
- **Repeated Switches** — the same `switch`/`if`-cascade on the same type recurs across the change. → replace with polymorphism, or one map both sites share.
- **Shotgun Surgery** — one logical change forces scattered edits across many files in the diff. → gather what changes together into one module.
- **Divergent Change** — one file or module is edited for several unrelated reasons. → split so each module changes for one reason.
- **Speculative Generality** — abstraction, parameters, or hooks added for needs the spec doesn't have. → delete it; inline back until a real need shows.
- **Message Chains** — long `a.b().c().d()` navigation the caller shouldn't depend on. → hide the walk behind one method on the first object.
- **Middle Man** — a class or function that mostly just delegates onward. → cut it, call the real target direct.
- **Refused Bequest** — a subclass or implementer that ignores or overrides most of what it inherits. → drop the inheritance, use composition.

### 4. Spawn both sub-agents in parallel

Send a single message with two `Agent` tool calls. Use the `general-purpose` subagent for both.

**Standards sub-agent prompt** — include:

- The full diff command and commit list.
- The list of standards-source files you found in step 3, **plus the smell baseline from step 3** pasted in full — the sub-agent has no other access to it.
- The brief: "Report — per file/hunk where relevant — (a) every place the diff violates a documented standard: cite the standard (file + the rule); and (b) any baseline smell you spot: name it and quote the hunk. Distinguish hard violations from judgement calls — documented-standard breaches can be hard, but baseline smells are always judgement calls, and a documented repo standard overrides the baseline. Skip anything tooling enforces. Under 400 words."

**Spec sub-agent prompt** — include:

- The diff command and commit list.
- The path or fetched contents of the spec.
- The brief: "Report: (a) requirements the spec asked for that are missing or partial; (b) behaviour in the diff that wasn't asked for (scope creep); (c) requirements that look implemented but where the implementation looks wrong. Quote the spec line for each finding. Under 400 words."

If the spec is missing, skip the Spec sub-agent and note this in the final report.

### 5. Refute

**Do not skip this and do not show the user the raw findings.** For every finding from both
sub-agents, spawn a sub-agent whose only job is to argue the finding is *not* a real problem.
Give it the finding, the hunk, and the cited standard or spec line.

Its brief: "Construct the strongest case that this finding is wrong or does not matter. Check
whether the cited rule actually says what the finding claims, whether the code path is
reachable, and whether something elsewhere already handles it. If you cannot refute it, say so
and state what you tried."

Drop every finding that was refuted. Keep the rest, each with the refutation attempt that
failed.

Findings that read well and turn out to be wrong are common enough that reading unfiltered
review output costs more time than this pass does.

### 6. Aggregate

Present the surviving findings under `## Standards` and `## Spec` headings. Do **not** merge or
rerank *across* the two axes — they are deliberately separate (see _Why two axes_). Within an
axis, order by severity.

End with two lines: how many findings survived per axis, and how many were refuted and dropped.
The dropped count matters. If it is consistently near zero the refutation pass is not working,
and if it is consistently near total the review pass is producing noise.

## Why two axes

A change can pass one axis and fail the other:

- Code that follows every standard but implements the wrong thing → **Standards pass, Spec fail.**
- Code that does exactly what the issue asked but breaks the project's conventions → **Spec pass, Standards fail.**

Reporting them separately stops one axis from masking the other.
