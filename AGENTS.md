# AGENTS.md

Read this file before you change anything in this repository.

This file owns four things: the numbered rules, the evidence rule, the testing position and the
writing standard. It owns nothing else. `docs/README.md` maps the documents and gives the
precedence order. `docs/product.md` says what the product is. `docs/architecture.md` says how it
works. `docs/decisions.md` gives the reason for each design choice. It also lists the open decisions.
Both phases run today. `docs/architecture.md` lists what exists in `src/`.

## The rules

A violation of a rule below is a defect. This is true when the code works and the tests pass.

Each rule has a permanent number. A number identifies one rule. A dead rule keeps its number. Mark
a dead rule with the word WITHDRAWN. Never renumber. This numbering starts at 1. It does not
continue an older numbering. Some rules rest on unfiled evidence.
`docs/research/feynman-edge-cases.md` holds that evidence and marks it CANDIDATE. A CANDIDATE row
is not a fact. Rule 27 keeps it out of the product.

### The child

1. The live phase must make exactly one model call for each turn. A second call is a second place
   where outside knowledge can enter the child.
2. The child must not repair your incomplete explanation with its own knowledge. This is M3 in
   `docs/product.md`. M3 is the premise the product rests on.
3. The child must not say that it understands. This rule rests on unfiled evidence: the Echterhoff,
   Higgins & Groll 2005 row in `feynman-edge-cases.md`, case E5, marked CANDIDATE.
4. The child must not say your mechanism back to you as a statement. Same evidence as rule 3. A
   restatement is a line you answer with "yeah exactly". That answer stops your production.
5. The child must not assert a cause that your words do not contain. It may name a thing. Case E9
   shows the child inventing a premise inside a question. That observation is one run.
6. The child must be able to ask about the same link again. It must not ask a new question every
   turn. `docs/research/evidence-base.md` holds the elaborative interrogation row: infrequent
   prompts dilute the effect and can reverse it.
7. The child must not offer an analogy. `evidence-base.md` holds Weisberg et al. 2008. Mechanism
   flavoured language hides a missing mechanism.
8. WITHDRAWN. The app does not implement quiet. Rule 44 replaces this rule.
9. The prompt must show worked examples. It must not describe how a child sounds. A description
   gives the model a label. The model then fills the label from its own prior data.
10. The user's words must reach the model untouched. Do not strip a filled pause, a stammer, a
    leading connective or a final full stop. An edit is an unmeasured change to the only input the
    product has.
38. The child's line must make the user produce more of the explanation. This rule rests on
    unfiled evidence: the Rozenblit & Keil rating series and Crawford & Ruscio 2021, both marked
    CANDIDATE. Both report that judged understanding falls after a person produces an explanation.
39. The child must ask for a cause. It must not ask for a definition. The illusion of explanatory
    depth is largest for a mechanism. `docs/product.md` owns the figures. `src/child.ts` records a
    matching prompt result at n=1.
40. The child must name the step where it stopped following. Rule 4 still holds. Use this
    distinction. The child may name the step it did not reach, because that is a location. The child
    must not repeat the chain it did reach, because that hands the user their own explanation back.
    This rule rests on unfiled evidence: the Frazier, Gelman & Wellman 2009 row and the Kurkul &
    Corriveau 2018 row. Both rows carry the CANDIDATE mark. Case E6b reports that the shipped child declares confusion for
    a good explanation and a bad one alike.

### The end phase

11. A session must not end with a question open. The end phase must close every gap the child
    opened. This is Law 1 in `docs/product.md`.
12. The Diff step must be plain code. A model must not perform it. `docs/decisions.md` gives the
    reason.
13. The Diff step must emit its rows in the order that `docs/architecture.md` sets. A contradiction
    is a false belief, so it outranks a missing link.
14. The Probe step is required. Check cannot tell "did not say it" from "does not know it".
15. The Close step must state the user's claim first, then the missing link. The user must
    recognise the claim as their own before the correction arrives.
41. The Probe step runs once. It takes the first row of the Diff output. Do not write "the largest
    gap". That phrase has no definition.
42. The Close step runs for every Diff row. For the probed row Close uses the verdict. For every
    other row Close must state that the user did not say the link. Close must never state that the
    user does not know the link. Only the probe separates the two.
43. The Diff step must read ids and flags only. It must never compare text. Check decides whether
    two links are the same link, because that judgement needs a model.

### The product surface

16. The product must not display a score, a rating, a grade or a progress bar next to a finding.
    `docs/product.md` gives the study.
17. The product must not say that an explanation was unclear. No ground truth exists for that.
18. The product must not treat hesitation or a filled pause as a signal. The research refutes this.
19. The product must not run on a topic that is not a causal mechanism. Facts, vocabulary and
    procedures are out of scope. The app does not have a topic gate. The owner curates the topic
    list. The page also has a button named "Something else". That button starts a session with the
    fixed title "Explaining". The user cannot type a topic today.
20. The app must label the findings of a session with the omniscient toggle ON as verified. The app
    must also disclose that such a session sends text to a remote service. `docs/architecture.md`
    owns the toggle.
21. The app must label the findings of a session with the toggle OFF as unverified. The user must
    know which model produced a finding.
22. The app must not promise that nothing leaves the device. An API key sends text to a provider.
    State this plainly. Do not repeat the old sentence from the retired documents.
44. The design ends a session with a button. A child that goes quiet is a later build. No document
    may say that quiet ends a session today. No code implements the button.
45. The app must not use the startup model in place of the provided model without telling the user.
    A silent fall back labels an unverified session verified.
46. The end phase can fail to run. Then the app must state on the screen that no review ran. The
    app must also state that the questions stay open. A stated failure is the only honest end for a session with open questions.
47. The app must tell the user that it holds one session in memory and writes nothing to disk. The
    findings appear once and the app loses them when the process stops.
48. The app must disclose where the text goes. The app must take the user's consent before the
    first send. Do not invent a retention policy, a training policy or a deletion policy.
    `docs/decisions.md` holds these three as open decisions for the owner.
49. Every document must describe a part as built only when `src/` holds it. Check, Diff, Probe and
    Close now exist, and `POST /api/end` runs them. A document must not call the end phase a design.
    A document must still name every part that `src/` does not hold.
50. The app must not ship a default model. The user makes one choice at startup.
    `docs/architecture.md` owns the model layer.

### The code

23. A model call must not throw. It returns a string or null. A model that does not respond is a
    result, not an exception. This rule lets a turn end with a stated silence.
24. An attribution must name the thing that answered, never the setting that made the request. A
    setting and a running model can disagree, so a setting can print a lie.
25. A distinct failure must get a distinct reason. One message must not stand for a stopped
    backend, an unsupported model and a wrong model name.
26. Do not recover the deleted documents from git history. The owner deleted them on purpose.

## The evidence rule

27. A claim about how people learn must not reach the user unless `docs/research/evidence-base.md`
    holds it. A document may cite a source that the evidence base does not hold. The document must
    mark that citation as unfiled.
28. An engineering measurement is a separate category. It carries its source where you use it.
29. Two models in conversation are not a measurement. A figure from `src/rig.ts` comes from a
    machine that answers its own output. Do not argue a rule change from such a figure.

Read `docs/research/feynman-edge-cases.md` before you write about how people learn.

## How to test

Run `npm run check`. It runs the type check and then the test suite. Both must pass before you
deliver the work.

Agents write the tests. Agents write the implementation. This is the honest position for this
build. No rule says a human writes the assertions. This repository dropped that rule. Two rules
replace it.

30. An adversarial code review must run against the change. Use the `holdtrue-code-review` skill.
    The review tries to refute each finding and reports only the survivors.
31. An end-to-end test must run against the real service. An agent plays the user. The agent
    speaks an explanation. It takes the child's replies. It reads the end phase output. A unit test
    with a fake model does not find these failures.
32. A unit test must not need Ollama, a network or Electron. A module that needs them to test has
    its seam in the wrong place.
33. A model must not judge whether the child's line is good. There is no oracle for that.
34. A golden transcript must not be an oracle. The runner is not byte-deterministic at temperature
    0. Such a test fails for unrelated reasons. Somebody then updates it until it asserts nothing.
35. Coverage is a gap-finder, not a target. A low number is a signal. A high number is not. Do not
    add a coverage threshold.
36. A test name must state what the test asserts. A name that claims more than the assertion checks
    is a defect.

## The writing standard

37. Every document in this repository uses ASD-STE100 Simplified Technical English. This is a
    requirement, not a preference. One word with one meaning removes the reading cost. The rules
    follow.

- Write one idea for each sentence. Use 20 words or fewer.
- Use the active voice. Do not use the passive voice.
- Use the present tense where you can.
- Always use the articles "the" and "a".
- Use three words or fewer in a noun cluster.
- Give one word one meaning. Do not use a synonym for variety.
- Do not use an idiom, a metaphor, a rhetorical question or irony.
- Put the main point first in the sentence.
- Use "must" for a requirement. Use "must not" for a prohibition.
- Write six sentences or fewer in a paragraph.
- Use a list when you have three or more items.

Do not write literary prose. Do not write in the voice of the old documents.
