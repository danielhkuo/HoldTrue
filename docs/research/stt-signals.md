# What the transcriber tells us it got wrong

**Engineering research, 2026-08-12.** Read from the source and the paper, every claim carrying its
URL. Written because the repeat-gate in [`../specs/child-speech.md`](../specs/child-speech.md)
ruling 18 needs a signal, and because the three earlier speech-to-text files evaluated eight engines
against four criteria — rule compliance, platform, word error rate, fairness — and **none of them
asked whether an engine can say which words it is unsure of.**

**Not independently re-walked.** Agent-produced against primary sources. Verify before any of it
closes a decision.

## What `whisper-server` returns

The default `response_format=json` returns one field, `{"text": ...}`. Everything a gate could use
is in **`verbose_json`** only.

| Field | Level | What it actually is |
|---|---|---|
| `avg_logprob` | segment | Summed token log-probability over token count, computed by the server rather than taken from the decoder |
| `no_speech_prob` | segment | **A 30-second window value copied onto every segment in that window.** A window value wearing a segment label |
| `temperature` | segment | **Echoes the temperature you asked for, not the one the decoder settled on after fallback** |
| `words[].probability` | token | Per BPE token, not per word. A low-confidence run can land mid-word |
| `words[].start`/`end` | token | Needs `token_timestamps`; `t_dtw` additionally needs launching with `-dtw` |

**`compression_ratio` does not exist.** It is a commented-out `TODO` in the server source.

**The field whose name promises the most delivers nothing.** `temperature` reports your request. The
counters that do know a fallback happened, `n_fail_p` and `n_fail_h`, are printed in timings and
never serialised.

## The published thresholds, and why ours cannot be borrowed from them

OpenAI's reference implementation defines `compression_ratio_threshold=2.4`,
`logprob_threshold=-1.0`, `no_speech_threshold=0.6`. Fallback fires when the gzip ratio exceeds 2.4
or average log probability falls below −1.0 — except that when `no_speech_prob > 0.6` **and**
`avg_logprob` is low, fallback is suppressed and the segment is called silence.

**whisper.cpp keeps the constants and changes the measurement.** Its `entropy_thold` is the Shannon
entropy of the last 32 token ids, failure is `entropy < 2.4`, and short segments are exempt. The
inequality runs the **opposite direction** from a gzip ratio, and the header calls it *"similar to"*
OpenAI's compression ratio. It is a different statistic that happens to share a number.

**No source publishes any calibration from `avg_logprob` or token probability to word error rate.**
These are decoder-fallback triggers, not *the human could not be understood* thresholds. Any number
this repo uses for the gate is ours to measure, and citing −1.0 as though it meant intelligibility
would be the same mistake as the 97/5 figure.

## The three degenerate modes, and which one has no signal

| Mode | How it shows |
|---|---|
| **Repetition loop** | Low entropy while token probabilities stay **high** — the model is confident. `avg_logprob` will not catch it, which is why a separate statistic exists |
| **Hallucination over silence** | High `no_speech_prob` with low `avg_logprob`. whisper.cpp computes the verdict internally and exposes only the two raw numbers |
| **Truncation** — dropping the first or last words of a window | **No signal in any returned field.** It is also the mode most likely to bite a speaker who rambles |

## The one that matters most, and it is not on that list

**Whisper's characteristic failure is fluent, confident, wrong text.** A substitution — *flapper* to
*flopper*, *siphon* to *cyphon* — transcribes with high token probability, normal entropy and clean
grammar. Every signal above reads healthy.

So a gate built on these fields catches **unintelligible** turns and cannot catch **misheard** ones.
Those are different failures, and only the first is what ruling 18 is for.

## Open, and it may relocate the whole gate

**Nobody has read `/inference`'s response body.** Issue [#23](https://github.com/danielhkuo/HoldTrue/issues/23)
resolved the engine to whisper.cpp behind `whisper-server`, and the server's own README documents
`/inference` and `/load` — not the OpenAI-shaped route the table above describes.
[`../specs/supply.md`](../specs/supply.md) still carries *"whether there is a `confidence` field"*
as an open question. Until someone runs the server and reads what comes back, the table above
describes a route this app may not be using.

## Sources

- `examples/server/server.cpp` and `src/whisper.cpp`, <https://github.com/ggml-org/whisper.cpp>
- `whisper/transcribe.py`, <https://github.com/openai/whisper>
- Radford et al., *Robust Speech Recognition via Large-Scale Weak Supervision*, arXiv:2212.04356, §4.5
