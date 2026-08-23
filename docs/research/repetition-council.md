# The repetition council

Four research agents each took one lens on the child's repetition on 2026-08-22. This file holds
their four reports as they returned them. A report is research and not a ruling. Rule 27 and rule
29 hold. `docs/proposals/director-experiment.md` holds the design that came from them.


---

# Lens: The prompt text

# Report: prompt-text remedies for the period-three repetition

## 1. The three best remedies

### Remedy 1. Replace the instruction sentence with a matching foreign example

Each turn, `lateBlock` shows one two-line example that performs the required move. It shows no sentence about the move. Three examples for each move rotate, so the period becomes nine.

Replacement text for move 1, wording A:

```
[Like this, about something else:
them: and the belt just pulls the drum round.
you: What's pulling the belt?
Do not use a technical or subject-specific word they have not used. Ordinary everyday words are fine.]
```

Mechanism. Result 3 says a sample outweighs a prior. Result 7 says a named move becomes a sentence to copy. An example carries no name and no imperative. The model copies the shape, and the foreign nouns make a verbatim copy off topic. That is the case B3 defence.

Threat. A/B result 5 says the model copies an example line almost verbatim. The frame "What's pulling the X?" may recur. The rotation of three examples for each move limits this.

Rules. Rule 9 supports it. Rule 1 holds, because no call is added. The example must hold no analogy and no restatement, per rules 3, 4 and 7.

Falsifier. Count repeated frames across eight turns. A count equal to the baseline falsifies it.

### Remedy 2. Write each move as a direction of attention, in several wordings

Each move gets four wordings. The turn index deals one. No wording holds a question verb or a question shape.

Replacement text for move 1:

```
[They said a thing happens. They did not say what causes it. Go after that cause. ${VOCABULARY}]
[The last step has no cause in their words. Point at that step. ${VOCABULARY}]
[Something made the last thing happen. They skipped it. ${VOCABULARY}]
[Find the missing push behind the last step. ${VOCABULARY}]
```

Mechanism. The open defect in `child-prompt-ab.md` says the model inflects "ask what makes X happen" into "What makes X happen?". A direction with no question verb offers no sentence to inflect. Four wordings give a period of twelve.

Threat. Result 7 says a list becomes a template. The model may inflect "missing push" into "What pushes it?". This is still a different frame each turn.

Rules. Rule 9 warns against description. These lines direct attention and do not describe a voice. Rule 1 holds.

Falsifier. The first three words of child lines repeat at the same count as today.

### Remedy 3. Deal the first word

Add one dealt line above the move. Most slots are empty.

```
[Start with: "Wait."]    turn 3
[Start with: "Hang on."] turn 7
[ ]                      all other turns
```

Mechanism. Result 1 shows the model copies a quoted opener at 100 percent. This remedy uses that copying on purpose. It controls which opener appears and when.

Threat. Result 6 says 8 percent of corpus lines open with "oh*". A dealt opener on every turn breaks that mixture. The empty slot on most turns keeps it.

Rules. Rule 9 is touched. The line quotes a word and does not describe a voice. Result 2 says a deleted opener moves the collapse to a new token. This remedy supplies and does not delete.

Falsifier. The empty-slot turns still share one opener.

## 2. Rejected remedies

- Show the child's recent lines as "do not repeat these shapes". Result 2 refuted this. The model read its openers back and nothing changed.
- Move the instruction to the system message. Result 9 refuted this. The end position is the whole point.
- Negative examples of bad lines. A/B result 3 says a banned shape does not work. An example of a bad line is a sample, and result 3 says samples get copied.
- Enlarge the bank to twelve. The bank is not the copied source. The late block is. This changes the wrong text.
- Reshuffle the bank by a random seed. The deal must repeat for a run to repeat.
- Add the word list from the director plan. It is already proposed.

---

# Lens: Plain code around the call

# Report: plain code around the call

## 1. The three best remedies

### Remedy 1. The state of the conversation picks the move

**Mechanism.** Replace `turnIndex % 3` in `lateBlock`. A pure function reads the history and returns one move. The rules are fixed and ordered.

- The last `them:` line holds a word that the child has never used. Pick the "what makes it happen" move and name the word. State: "They said: bend. Ask what makes that happen."
- Every word in the last line is already pressed. Pick the "where does it go" move.
- The last line holds a word that the child pressed two times. Pick the "say it without that word" move.
- The last line holds "can't" and a later line holds "can" for the same noun. Pick the contradiction move.

**State.** Two word sets. `said`: every content word in every `them:` line. `pressed`: every content word in every `you:` line. Build both with `wordsIn` and `STOP_WORDS` from `src/discriminate.ts`. Add a count of turns since each word entered `said`.

**Where.** A pure function in `src/child.ts`, next to `lateBlock`. `promptFor` calls it. A unit test needs no model.

**What the child sees.** One bracketed block with one target word. The word changes every turn, so the block text rarely repeats.

**Cost.** One call. **Rules.** 1, 6, 10, 33, 32 hold. Rule 9 holds because the block names no style.

**Falsifier.** Eight turns. The first three words repeat as often as in run A of the director plan.

### Remedy 2. Code detects the repeated opener and swaps the instruction

**Mechanism.** Before the call, take the first three words of the last two child lines. If they are equal, the block for this turn carries a ban: "Do not start with: what makes." The ban is a literal string. Result 3 in `child-prompt-ab.md` says a literal string ban works.

**State.** The last two `you:` lines. Nothing else.

**Where.** In `promptFor`. One string compare.

**What the child sees.** The normal move block plus one banned phrase. The banned phrase is the opener it used, not a list of openers.

**Cost.** One call. **Rules.** 1 and 33 hold. No model judges the line. Code compares three words.

**Falsifier.** Measured result 2. The opener moves to a new phrase and that phrase then repeats. Count openers across eight turns. A rotation of two openers is a fail.

### Remedy 3. Prefill the opener

**Mechanism.** Add a third message `{ role: 'assistant', content: opener }` to the Ollama request. The model continues from the opener. Code picks the opener from a small bank by the move of remedy 1. The model cannot choose its first words. Concatenate the opener and the answer in `speak`.

**State.** The move for this turn, and the last opener dealt. Never deal the same opener two turns in a row.

**Where.** `ModelHandle.ask` gains an optional third argument. `model.ts` appends the assistant message. `speak` joins the text.

**What the child sees.** Its own first words already written. It finishes the sentence.

**Cost.** One call. **Rules.** 1, 10, 23 hold. Rule 9 is at risk: an opener bank looks like the quoted openers of measured result 1. Keep the bank to question heads, not interjections. The Anthropic backend also supports a trailing assistant message.

**Falsifier.** The returned content starts with a new first word and ignores the prefill. The chat template of `muse-glimmer` then closes the assistant turn. Test with one request before you build.

## 2. Rejected remedies

- Stop sequence `"\n"` in `options.stop`. It only cuts the line. `speak` already cuts. It changes no opener.
- `seed` or `temperature > 0` for variety. Rule 34 says the runner is not deterministic now. Noise is not a move.
- `num_predict` small. It cuts mid-sentence. Rule 23 still holds, but the line is broken.
- Rotate many wordings per move by turn number. The period grows but stays a period.
- Ban the last three openers as a list. Four agents proposed it. Measured result 2 says the ban moves the collapse.
- Post-edit the returned line. It edits the child's words with no ground truth and hides the defect.

## 3. Verified Ollama facts

- `/api/chat` `options` holds `stop`, `seed`, `num_predict`, `temperature`. No prefill is documented. https://docs.ollama.com/api/chat
- Issue 5775 reported that `/api/chat` ignored a trailing assistant message. https://github.com/ollama/ollama/issues/5775
- PR 5802 "preserve last assistant message" merged on 2024-07-20 and fixed it. The fix lives in template handling, so it depends on the chat template of each model. https://github.com/ollama/ollama/pull/5802
- Issue 6778 asked for a "continue last message" option and is closed. https://github.com/ollama/ollama/issues/6778

---

# Lens: The literature

**Report: the literature on repetition and diversity collapse, applied to the child**

**1. Findings, ranked by bearing on this build**

F1. Self-reinforcement of repetition. Holtzman et al. 2019 (GPT-2 Large, 762M, open text): "The probability of a repeated phrase increases with each repetition, creating a positive feedback loop." Greedy repetition was 73.66% against 0.28% for humans. Xu et al. 2022 (GPT-2, BART, NeurIPS): "the more times a sentence is repeated in the context, the higher the probability of continuing to generate that sentence." Both use small base models and single-document generation. The mechanism is a property of likelihood decoding, so it transfers to a 30B chat model at temperature 0. This is measured result 5 with a name. It predicts that the lock tightens with each turn and no prompt wording can break it from inside the context.

F2. Own-turn omission. "Do LLMs Benefit From Their Own Words?" arXiv 2602.24287 (Qwen3-4B, DeepSeek-R1-Distill-8B, GPT-OSS-20B, GPT-5.2; 300 WildChat/ShareLM coding and math conversations). Prior assistant turns cause "context pollution" where "stylistic artifacts ... propagate into subsequent turns." For the 8B and 20B models "average response quality is maintained" when assistant history is removed. For Qwen3-4B and GPT-5.2 quality "decreases to some extent." The task is technical QA, not persona dialogue, and it did not measure repetition directly. It still supports the plan in the latest commit: show the child one of its own lines instead of all of them. No paper measured the exact design.

F3. Instruction drift and attention decay. Li et al. arXiv 2402.10962 (LLaMA2-chat-70B, GPT-3.5, self-chat, N=8 rounds). Attention to the system prompt "remains almost constant" within a turn but shows "significant decreases across turns." The paper's term is "instruction drift." The header's phrase "adopts the frame of the other party" is a paraphrase, not a quote. Their prompt-repetition baseline injects "the system prompt ... before each user utterance." That is `lateBlock`. The paper counts it as costly in context, not as ineffective. Transfers well: a 30B chat model is between the two tested.

F4. Lost in the Middle. Liu et al. arXiv 2307.03172 (MPT-30B-Instruct, LongChat-13B, GPT-3.5, Claude-1.3). GPT-3.5 at 20 documents: 75.8% at the start, 53.8% in the middle, 63.2% at the end. MPT-30B is the same size class as this build. Supports placing the rule at the end of the context.

F5. Discourse-move stickiness. arXiv 2604.11742 (Qwen3-1.7B, 4B; empathic dialogue). Models reuse a tactic in the next turn at 0.50-0.56 against 0.27 for humans. Verbalized Sampling "consistently degrades empathy" and reduced unique tactics per turn. Only an RL fix (MINT) worked. Small models and a different task. It predicts that shape-level repetition survives lexical fixes, which matches A/B result 3.

F6. Alignment reduces diversity. Kirk et al. arXiv 2310.06452: "RLHF significantly reduces output diversity compared to SFT." Verbalized Sampling arXiv 2510.01171 blames "typicality bias" and gains 1.6-2.1x diversity, but larger models gain "1.5 to 2 times" more than small ones, and the method needs k outputs per call. One call is allowed, so VS fits only if the call returns k candidates and code picks one. UNVERIFIED whether that holds at 30B.

F7. Temperature. Holtzman: "Sampling with temperatures lower than 0.9 severely increase repetition." Laban et al. arXiv 2505.06120 (15 models, T=1 default) found lowering temperature to 0 helps single-turn but multi-turn gains are "minor ... on the order of 15-20%." Neither measured a persona asking questions. Temperature 0 is the worst case for F1 by design.

F8. Example order. Lu et al. arXiv 2104.08786: order alone moves results from "near state-of-the-art" to "random guess," and "a given good permutation for one model is not transferable." Classification on GPT-3. Transfers weakly, but supports the bank rotation.

**2. Two remedies with best support**

R1. Remove the child's own prior lines from the context (F1, F2). Keep the adult's lines. Falsifier: over five conversations, the count of turns that share a sentence frame with the previous child turn does not fall against the full-history control.

R2. Sample at a low non-zero temperature (0.7-0.9) with top-p, instead of greedy (F1, F7). Falsifier: repeated-frame count at T=0.8 is not lower than at T=0, or the guard violation count (subject word leak, explaining) rises.

UNVERIFIED: that R1 and R2 combine additively. No source tested both.

**3. Sources**

- Holtzman et al., https://arxiv.org/abs/1904.09751
- Xu et al., https://arxiv.org/abs/2206.02369
- Do LLMs Benefit From Their Own Words, https://arxiv.org/abs/2602.24287
- Li et al., https://arxiv.org/abs/2402.10962
- Liu et al., https://arxiv.org/abs/2307.03172
- Discourse Diversity, https://arxiv.org/abs/2604.11742
- Kirk et al., https://arxiv.org/abs/2310.06452
- Verbalized Sampling, https://arxiv.org/abs/2510.01171
- Laban et al., https://arxiv.org/abs/2505.06120
- Lu et al., https://arxiv.org/abs/2104.08786

---

# Lens: Decoding and sampling

**Report: decoding-layer remedies for the child's frame lock**

Facts that bound every remedy. The model `muse-glimmer:30b-mlx` runs on the Ollama MLX runner (`~/.ollama/logs/server.log`, 2026-08-19). That runner implements temperature, top_k, top_p, min_p, seed, repeat_penalty, presence_penalty, frequency_penalty and repeat_last_n (`x/mlxrunner/sample/sample.go`, `server.go` lines 130-142). It has no logit_bias, no grammar and no mirostat. `format` does nothing there, which matches the note in `src/model.ts`. The penalty ring is seeded with the LAST `repeat_last_n` prompt tokens (`pipeline.go` line 114). The request in `src/model.ts` sends `temperature: 0` only. Ollama's defaults then apply: repeat_penalty 1.0, so no penalty runs today.

**1. Sample, do not argmax. Options: `temperature`, `min_p`, `top_k: 0`, `top_p: 1`, `seed`.**
Mechanism. Xu et al. 2022 show a repeated sentence raises its own probability, and the effect is strongest for the highest-probability sentence. Temperature 0 always picks that sentence. Kirk et al. 2023 show preference tuning narrows the distribution, so the mode is a narrow groove. min_p keeps only tokens above a fraction of the top token, so a high temperature stays coherent (Nguyen et al. 2024). Start at `temperature: 1` (the model's own modelfile default), `min_p: 0.1`, `seed: 7`. Cost: zero extra calls. Rules: none broken. Rule 34 already accepts non-determinism. Falsifier: five conversations, eight turns each. If four of five still show one frame on three of four consecutive turns, the groove is in the prompt and not in the decoder.

**2. `frequency_penalty` with `repeat_last_n: -1`.**
Mechanism. Every token gets a fixed subtraction times its count in the window (`sample.go` line 907). The child's frame words ("What", "makes", "happens") recur in every child line and every late block. The penalty grows with each repeat, so a third "What makes" costs more than the first. Try 0.3. Cost: zero calls. Rules touched: 39, 40 and the vocabulary rule. The window then holds the person's words too, and the person's nouns also recur. Rule 40 requires the child to reuse them. Falsifier: count subject nouns the child uses that the person used first. If that count falls, or one line leaks a noun the person never said (case B3), the penalty failed.

**3. `presence_penalty` with `repeat_last_n: -1`.**
Mechanism. One flat subtraction for every token seen once (`sample.go` line 901). It is the crudest lever. It punishes the person's nouns as hard as the child's frame words. Keep it small, 0.2. Cost: zero calls. Rules: same risk as remedy 2, larger. Falsifier: same noun count. Rank it last because the count-blind rule hurts the person's words first.

**A warning on the default window.** `repeat_last_n` defaults to 64. The last 64 prompt tokens are the late block and the person's newest line. A penalty with the default window therefore punishes exactly the words the child must reuse, and sees no previous child line. Any penalty must set `repeat_last_n: -1` or it is worse than no penalty.

**Rejected remedies.**
- `repeat_penalty`. It multiplies logits, so it hits negative and positive logits differently (`sample.go` line 894). It is less predictable than remedy 2.
- `logit_bias`. Ollama does not support it (issue #3795, open).
- Grammar or JSON schema. The MLX runner has no grammar. The child's line must be free prose.
- `mirostat`. Not in the current parameter table.
- `stop` and `num_predict`. They cut length. They change no frame.
- `seed` alone. At temperature 0 a seed changes nothing.
- `top_k` or `top_p` alone. At temperature 0 both are dead. At temperature 1 min_p does the same job with one knob.
- Logprobs. They exist on the MLX runner, but use of them to pick a line would be code judging the line (rule 33).

**Sources.**
- Ollama modelfile parameters: https://docs.ollama.com/modelfile
- Ollama API: https://github.com/ollama/ollama/blob/main/docs/api.md
- MLX sampler: https://github.com/ollama/ollama/blob/main/x/mlxrunner/sample/sample.go and pipeline.go, server.go
- Go runner ignores penalties (not the MLX runner): https://github.com/ollama/ollama/issues/15783
- logit_bias request: https://github.com/ollama/ollama/issues/3795
- Xu et al. 2022, self-reinforcement of repeated sentences: https://arxiv.org/abs/2206.02369
- Kirk et al. 2023, RLHF reduces diversity: https://arxiv.org/abs/2310.06452
- Nguyen et al. 2024, min-p: https://arxiv.org/abs/2407.01082
- Li et al. 2024, instruction drift within eight rounds: https://arxiv.org/abs/2402.10962
- Liu et al. 2023, Lost in the Middle: https://arxiv.org/abs/2307.03172