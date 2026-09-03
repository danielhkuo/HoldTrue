# The case register

Every behaviour this product must produce, and every behaviour it must stop.

This file is the register. A case has one line. Another document must not restate a case. A document
must point at the case number instead.

**How to read a verdict.**

- **Feature.** The product must produce this. It produces it today.
- **Feature, not built.** The product must produce this. It does not produce it today.
- **Guard.** The product must not produce this.

**How to read an owner.**

- **Child.** The live phase owns the case. The child prevents the fault, or the child performs the
  feature.
- **Reviewer.** The end phase owns the case. The end phase finds the fault after the session.
- **Both.** The child prevents the fault. The end phase finds the fault that the child lets through.
- **Code.** Plain code owns the case. No model is involved.

**The owner named Reviewer now has a builder.** `src/` holds Check, Diff, Probe and Close, and
`POST /api/end` runs them. No eval measures what the end phase produces. A case with the owner
Reviewer therefore has a builder and no measurement. See [`architecture.md`](architecture.md).

**This file and [`product.md`](product.md) hold different facts.** This file holds the case and its
one sentence. `product.md` holds the enforcement table, which says for each rule whether the product
prevents the case, records the case, or does neither.

**Prevention and detection are different.** A prompt is a disposition and not a test. The child
cannot be made to obey a rule every time. Ten guards therefore moved to the end phase, where set
arithmetic finds them and a test checks every row. This is the reason the product has two phases.

**The evidence for every case is in [`research/feynman-edge-cases.md`](research/feynman-edge-cases.md).**
That file is not gated. A case here must not be quoted as a measurement.

---

## The four mechanisms

| # | The mechanism | Verdict | Owner |
|---|---|---|---|
| **M1** | You say the explanation from memory, and the attempt shows the step you cannot say. | Feature | Child |
| **M2** | You cannot find your own gap, so the listener must find it for you. | Feature | Both |
| **M3** | The listener must not complete your chain for you. | Feature | Child |
| **M4** | Something must give the correct answer after the gap appears. | Feature, not built | Reviewer |

Every case below serves one of these four, or it breaks one of them.

---

## The child's behaviours

| # | The behaviour | Verdict | Owner |
|---|---|---|---|
| **E1** | The model repairs your incomplete explanation with its own knowledge, and the gap stays hidden. | Guard | Both |
| **E2a** | The child finds an error that is common in its training data. | Feature, not built | Reviewer |
| **E2b** | The child asks about an invented part, and this accepts that the part exists. | Guard | Both |
| **E3** | The child asks a question, and no part of the product answers it. | Guard | Reviewer |
| **E4** | A better prompt makes the child ask harder questions, and nothing can answer them. | Guard | Reviewer |
| **E5** | The child says that it understands, and your memory moves to the simple version. | Guard | Both |
| **E6a** | The child tells you that it is lost. | Feature | Child |
| **E6b** | The child says that it is lost after a good explanation and after a bad one. | Guard | Child |
| **E7a** | The child asks a question that needs a cause in the answer. | Feature | Child |
| **E7b** | The child asks a new question every turn and always moves forward. | Guard | Child |
| **E8** | The child says your mechanism back to you as a statement. | Guard | Child |
| **E9** | The child invents a part that you did not mention and puts it in a question. | Guard | Both |
| **E10** | The child asks one question about a link and then moves on. | Guard | Child |
| **E11** | You never watch the child use what you taught. | Feature, not built | Reviewer |
| **E12** | The child offers an analogy, and you accept it in place of the mechanism. | Guard | Both |
| **E13a** | The child never stops and never ends the session. | Guard | Child |
| **E13b** | The child goes quiet when it follows you. | Feature, not built | Child |
| **E14** | The child keeps all your words and learns nothing from them. | Feature, not built | Reviewer |

---

## The build defects

Every defect below exists in the code today. A defect stays on this list until the code changes. The
owner can decide to leave a defect in place for now. That decision does not remove the defect from
this list. [`decisions.md`](decisions.md) records each such decision.

| # | The defect | Verdict | Owner |
|---|---|---|---|
| **B1** | The child accepts a false statement and asks a question about it. | Guard | Reviewer |
| **B2** | You say that you do not know, and the child says that it is also lost. | Guard | Reviewer |
| **B3** | Two worked examples use the same subjects as two topics in the list. | Guard | Code |
| **B4** | No code stops a session about a fact or a procedure. | Guard | Code |
| **B5** | The app uses the model that Ollama changed last. | Guard | Code |
| **B6** | The code keeps only the first line, and the question can be in the second line. | Guard | Code |
| **B7** | The code holds the topic and does not send the topic to the model. | Guard | Code |
| **B8** | A rule names a file that does not exist. | Guard | Code |
| **B9** | The code reverses a ruling, and the document still shows the ruling as live. | Guard | Code |
| **B10** | A long session pushes the worked examples out of the prompt. | Guard | Code |
| **B11** | All model failures show the same message. | Guard | Code |
| **B12** | The server accepts connections from the whole network. | Guard | Code |
| **B13** | A reload during a turn hides that turn from you. | Guard | Code |

---

## The joint finding

| # | The finding | Verdict | Owner |
|---|---|---|---|
| **C4** | You say that you do not know, and no permitted move remains for the child. | Guard | Reviewer |

**C4 is the reason the end phase must exist.** Six rulings each forbid one move. Together they forbid
every move at the exact moment M1 delivers its result. The end phase gives the product something to
do at that moment.

---

## The voice

| # | The behaviour | Verdict | Owner |
|---|---|---|---|
| **V1** | You speak, the app turns the audio into words on this machine, and the words reach the model untouched. | Feature | Code |
| **V2** | The app reads the line of the child aloud on this machine. | Feature | Code |
| **V3** | The app sends audio off the machine, or writes audio to disk. | Guard | Code |

The speech model decides which sounds become words. V1 binds the code between the engine and the
model. It does not bind the engine. `architecture.md` states the limit.

---

## The count

- Seven features that the product produces today.
- Five features that the product does not produce yet.
- Twenty-seven guards.

Every feature that the product does not produce yet needs the end phase, except E13b. E13b needs a
change to the child.

Ten of the twenty-six guards have the owner Reviewer or the owner Both. Those ten moved from the
child to the end phase. None of the ten has a builder today.
