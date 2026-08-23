# AGENTS.md

Read this file before you change anything in this repository.

This file owns the numbered rules, the evidence rule, the testing position, the hand-over and
the writing standard. `docs/README.md` maps the other documents and gives the precedence order.

## The rules

A violation of a rule is a defect. This is true when the code works and the tests pass.

Each rule has a permanent number. A dead rule keeps its number and the word WITHDRAWN. Never
renumber. Some rules rest on unfiled evidence. `docs/research/feynman-edge-cases.md` holds that
evidence and marks it CANDIDATE. Rule 27 keeps a CANDIDATE claim out of the product.

### The child

1. The live phase must make exactly one model call for each turn.
2. The child must not repair your incomplete explanation with its own knowledge. This is M3 in
   `docs/product.md`.
3. The child must not say that it understands. Unfiled evidence: case E5.
4. The child must not say your mechanism back to you as a statement. A restatement stops your
   production. Unfiled evidence: case E5.
5. The child must not assert a cause that your words do not contain. It may name a thing. Case E9.
6. The child must be able to ask about the same link again. It must not ask a new question every
   turn. `docs/research/evidence-base.md` holds the elaborative interrogation row.
7. The child must not offer an analogy. `evidence-base.md` holds Weisberg et al. 2008.
8. WITHDRAWN. Rule 44 replaces this rule.
9. The prompt must show worked examples. It must not describe how a child sounds.
10. The user's words must reach the model untouched. Do not strip a filled pause, a stammer, a
    leading connective or a final full stop.
38. The child's line must make the user produce more of the explanation. Unfiled evidence:
    Rozenblit & Keil and Crawford & Ruscio 2021.
39. The child must ask for a cause. It must not ask for a definition. `docs/product.md` owns the
    figures.
40. The child must name the step where it stopped following. It may name the step it did not
    reach. It must not repeat the chain it did reach. Rule 4 still holds. Unfiled evidence: Frazier,
    Gelman & Wellman 2009 and Kurkul & Corriveau 2018. Case E6b.

### The end phase

11. A session must not end with a question open. The end phase must close every gap the child
    opened. This is Law 1 in `docs/product.md`.
12. The Diff step must be plain code. A model must not perform it.
13. The Diff step must emit its rows in the order that `docs/architecture.md` sets. A
    contradiction outranks a missing link.
14. The Probe step is required. Check cannot tell "did not say it" from "does not know it".
15. The Close step must state the user's claim first, then the missing link.
41. The Probe step runs once. It takes the first row of the Diff output.
42. The Close step runs for every Diff row. For the probed row Close uses the verdict. For every
    other row Close must state that the user did not say the link. Close must never state that the
    user does not know the link.
43. The Diff step must read ids and flags only. It must never compare text.

### The product surface

16. The product must not display a score, a rating, a grade or a progress bar next to a finding.
17. The product must not say that an explanation was unclear. No ground truth exists for that.
18. The product must not treat hesitation or a filled pause as a signal.
19. The product must not run on a topic that is not a causal mechanism. The owner curates the
    topic list. The app does not have a topic gate. `docs/architecture.md` describes the page.
20. The app must label the findings of a session with the omniscient toggle ON as verified. The app
    must also disclose that such a session sends text to a remote service.
21. The app must label the findings of a session with the toggle OFF as unverified.
22. The app must not promise that nothing leaves the device. An API key sends text to a provider.
44. A button ends a session. A child that goes quiet is a later build. No document may say that
    quiet ends a session today.
45. The app must not use the startup model in place of the provided model without telling the user.
46. The end phase can fail to run. Then the app must state on the screen that no review ran and
    that the questions stay open.
47. The app must tell the user that it holds one session in memory and writes nothing to disk.
48. The app must disclose where the text goes. The app must take the user's consent before the
    first send. Do not invent a retention policy, a training policy or a deletion policy.
49. Every document must describe a part as built only when `src/` holds it. A document must name
    every part that `src/` does not hold.
50. The app must not ship a default model. The user makes one choice at startup.

### The code

23. A model call must not throw. It returns a string or null.
24. An attribution must name the thing that answered, never the setting that made the request.
25. A distinct failure must get a distinct reason. One message must not stand for a stopped
    backend, an unsupported model and a wrong model name.
26. Do not recover the deleted documents from git history. The owner deleted them on purpose.

## The evidence rule

27. A claim about how people learn must not reach the user unless `docs/research/evidence-base.md`
    holds it. A document may cite a source that the evidence base does not hold. The document must
    mark that citation as unfiled.
28. An engineering measurement is a separate category. It carries its source where you use it.
29. Two models in conversation are not a measurement. Do not argue a rule change from a figure
    that `src/rig.ts` produced.

## How to test

Run `npm run check`. It runs the type check and then the test suite. Both must pass before you
deliver the work. Agents write the tests. Agents write the implementation.

30. An adversarial code review must run against the change. Use the `holdtrue-code-review` skill.
31. An end-to-end test must run against the real service. An agent plays the user. `npm run e2e`
    runs it.
32. A unit test must not need Ollama, a network or Electron. A module that needs them to test has
    its seam in the wrong place.
33. A model must not judge whether the child's line is good. There is no oracle for that.
34. A golden transcript must not be an oracle. The runner is not deterministic at temperature 0.
35. Coverage is a gap-finder, not a target. Do not add a coverage threshold.
36. A test name must state what the test asserts.

## How to hand over

The owner commits. An agent does not run `git commit`.

51. An agent must stage every file it changed with `git add`. It must not stage a file it did not
    change. It must not stage a file that `.gitignore` lists.
52. An agent must write the commit message and give it to the owner in the reply. The first line
    is the type and a summary. The body says what changed and why.

## The writing standard

37. Every document, reply and commit message uses ASD-STE100 Simplified Technical English. Use
    no other style. This is a requirement, not a preference.

- Write one idea for each sentence. Use 20 words or fewer.
- Use the active voice.
- Use the present tense where you can.
- Always use the articles "the" and "a".
- Use three words or fewer in a noun cluster.
- Give one word one meaning. Do not use a synonym for variety.
- Do not use an idiom, a metaphor, a rhetorical question or irony.
- Put the main point first in the sentence.
- Use "must" for a requirement. Use "must not" for a prohibition.
- Write six sentences or fewer in a paragraph.
- Use a list when you have three or more items.
