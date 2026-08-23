---
name: holdtrue-workflow
description: The front door for building anything in HoldTrue. Finds the next piece of work, then builds it test first, reviews it, and runs the end-to-end check. Use when the user says "next piece", "build X", "what is next", or invokes it with nothing at all.
---

One skill, one procedure. `AGENTS.md` owns the rules. This file owns the order of the work.

## 1. Locate

Read four files in this order. Do not ask a question before you read them.

1. `AGENTS.md`. Every rule. A violation is a defect.
2. `docs/README.md`. The document map and the precedence order.
3. `docs/decisions.md`. Read "Open decisions". An open decision belongs to the owner. Do not
   answer it.
4. `docs/proposals/`. A proposal is a design that nobody has ruled on. The owner must rule before
   you build it. Ask the owner to rule if the user names a proposal.

Then read `docs/architecture.md` under "What exists today". That section lists what `src/` holds.
`docs/cases.md` lists every case. A case marked "Feature, not built" is candidate work. A case
marked "Guard" is a test to write.

State the piece you will build in one sentence. State the rule numbers it touches. Then start.

## 2. Build one piece

1. **The contract.** Add or change a type in `src/types.ts` if the piece needs one. Commit it alone.
2. **The test, red.** Write the unit test. Rule 32 holds: no Ollama, no network, no Electron.
   Rule 36 holds: the name states what the test asserts. Run `npm run test`. Watch it fail.
   Commit the test alone. The pre-commit hook blocks a test and its implementation in one commit.
3. **The implementation, green.** Write the code. Run `npm run check`. Both must pass. Commit.
4. **The documents.** Rule 49 holds. Update `docs/architecture.md` "What exists today",
   `docs/cases.md` and `docs/product.md` so that every claim matches `src/`. Use Simplified
   Technical English. Commit.

## 3. Review

Run the `holdtrue-code-review` skill against the commits of the piece. Rule 30 requires it. Fix
every finding that survives, or state why the finding is wrong.

## 4. The end-to-end check

Run `npm run e2e`. Rule 31 requires it. It needs a running model. Read the output. A failure here
is a finding, not noise. State the result in the report.

## 5. Hand over

Stage every file you changed with `git add`. Write the commit message and give it to the owner in
the reply. Do not run `git commit`. Rules 51 and 52 hold. State what exists now, what the tests
prove, and what the end-to-end check showed.
