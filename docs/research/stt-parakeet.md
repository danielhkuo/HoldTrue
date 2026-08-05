# STT: NVIDIA Parakeet

> **Partial answer to [issue 23](https://github.com/danielhkuo/HoldTrue/issues/23), "Which
> speech-to-text engine."** Covers one of the four local candidates. Apple SpeechAnalyzer,
> whisper.cpp and Vosk are still uncovered. The ticket stays open.

> **Provenance: agent-produced, not independently verified.** Gathered by a research subagent
> on 2026-08-04 against primary sources, with URLs per claim. Nobody has re-walked them by
> hand. Treat as *cited but unchecked*, in the sense [`evidence-base.md`](evidence-base.md)
> means by "cite only after retrieval." Verify before any of it reaches
> [`decisions.md`](../decisions.md).

## Verdict: Parakeet satisfies neither branch of the stack rule

The rule is *"no bundled inference — Ollama, or bring your own API key."* Parakeet fails both.

**Ollama branch: closed.** A search of the Ollama library for "parakeet" returns only unrelated
text LLMs — no Parakeet, and **no ASR model of any kind**
(<https://ollama.com/search?q=parakeet>).

**Own-API-key branch: legally closed for a shipping product.** NVIDIA does host Parakeet at
`build.nvidia.com` with a Bearer-token key, but:

- It is **gRPC only**, not REST — `grpc.nvcf.nvidia.com:443` with `authorization` plus a
  per-model `function-id` metadata header
  (<https://build.nvidia.com/nvidia/parakeet-tdt-0_6b-v2/api>). An OpenAI-compatible REST
  surface exists **only when self-hosting**.
- The governing terms forbid production use outright. §1.2: access is "for limited trial
  purposes only and without use of the API Service or Generated Content in production." §1.4:
  "you may only use the API Service for internal testing and evaluation purposes, not in
  production."
  ([trial ToS](https://assets.ngc.nvidia.com/products/api-catalog/legal/NVIDIA%20API%20Trial%20Terms%20of%20Service.pdf))
- §4.3 of the same terms: "you will not upload any personal information relating to an
  identifiable individual." **A learner's recorded voice is exactly that.** Independently
  disqualifying for this product.
- No per-minute price for hosted Parakeet is published anywhere. The only documented commercial
  path is self-hosting under NVIDIA AI Enterprise at "$4500 per GPU per year"
  (<https://docs.api.nvidia.com/nim/docs/product>).

That leaves bundled local inference, which the rule forbids.

## If the rule were relaxed, the local story is still bad on macOS

**The documented path is Python.** `pip install -U nemo_toolkit["asr"]`, then
`import nemo.collections.asr` (<https://huggingface.co/nvidia/parakeet-tdt-0.6b-v2>). Hugging
Face `transformers` now has a native implementation too, but that is still Python + PyTorch.

**CPU inference is possible but undocumented for performance.** NeMo's README says "PyTorch 2.7
or above (CPU, CUDA, etc. — your choice)" and lists an NVIDIA GPU as "required for training;
recommended for inference"
(<https://raw.githubusercontent.com/NVIDIA-NeMo/NeMo/main/README.md>). **The model cards
contradict the toolkit README** — they list supported hardware as Ampere/Blackwell/Hopper/Volta
and preferred OS Linux, with no CPU and no macOS. No NVIDIA-published CPU latency or RTFx
figure exists.

**Apple Silicon is officially documented but experimental and opt-in.** NVIDIA has a section
titled "Inference on Apple M-Series GPU" requiring `PYTORCH_ENABLE_MPS_FALLBACK=1` "since not
all operations in PyTorch are currently implemented on `mps` device"
(<https://docs.nvidia.com/nemo/speech/nightly/asr/results.html>). The in-tree flag carries
NVIDIA's own warning: "MPS device (Apple Silicon M-series GPU) support is experimental." macOS
appears in **no** support matrix.

**No non-Python runtime from NVIDIA.** No official ONNX weights exist for any Parakeet model —
zero `.onnx` files across v2, v3, `parakeet-ctc-0.6b` and `parakeet-unified-en-0.6b`. Export is
documented but splits the model, leaving the greedy decode loop in Python, and the shipped
reference covers RNN-T only with **no TDT duration-head branch**. No NVIDIA C++ binary runs
Parakeet locally: the Riva C++ clients need a Riva server, and the Riva SDK is now
embedded-only.

**Riva/NIM self-hosting is Linux-x86_64 with a 16 GB-VRAM NVIDIA GPU**, Docker, and an NGC key
(<https://docs.nvidia.com/nim/speech/latest/reference/support-matrix/asr.html>). A Mac can be a
gRPC *client*, never a server. Windows is WSL2-partial, and `parakeet-0.6b-tdt` is explicitly
unsupported there.

Community ports exist — `sherpa-onnx`, `onnx-asr`, `parakeet-mlx` — and solve precisely the
preprocessor, TDT-decode and Apple Silicon gaps NVIDIA leaves open. **All are secondary: not
published, endorsed, or supported by NVIDIA.**

## Licence, and a drift worth flagging

`parakeet-tdt-0.6b-v2` and `-v3` are **CC-BY-4.0**, commercial use explicitly permitted,
attribution the only condition.

The newest model, `parakeet-unified-en-0.6b` (released 2026-04-07), moved to the **NVIDIA Open
Model License** — commercially usable, but granting a "perpetual, worldwide, non-exclusive,
no-charge, royalty-free, **revocable** license"
(<https://www.nvidia.com/en-us/agreements/enterprise-software/nvidia-open-model-license/>).
Revocable is materially weaker than CC-BY-4.0, which is irrevocable.

Separately: **the HF weights and the NVIDIA-served versions carry different terms.** The
`build.nvidia.com` card for v2 cites the NVIDIA Community Model License, not CC-BY-4.0, and
that licence requires a NIM runtime under an AI Enterprise subscription for production, with
carve-outs for local-on-end-user-device use. Read the licence attached to the artefact actually
shipped, not the family.

## Accuracy: the read-vs-spontaneous gap, and a scoring caveat

NVIDIA co-authored the Open ASR Leaderboard paper (arXiv:2510.06961), whose Table 1 classifies
datasets by style — LibriSpeech, MLS, FLEURS as **Read**; AMI and CORAAL as **Spontaneous**.
Per-dataset WER from NVIDIA's own cards:

| Model | Avg | **AMI** (spontaneous) | **Earnings-22** | LS-clean (read) | LS-other |
|---|---|---|---|---|---|
| `tdt-0.6b-v2` | 6.05 | **11.16** | **11.15** | 1.69 | 3.19 |
| `tdt-0.6b-v3` | 6.34 | **11.31** | **11.42** | 1.93 | 3.59 |
| `unified-en-0.6b` | — | **10.14** | **11.16** | 1.63 | 3.11 |

**AMI ≈ 11.2% against LibriSpeech-clean 1.69% is a ~6.6× error multiplier** between read
audiobook speech and real conversational speech. The headline "6.05 average" is taken over a
set that is half read or oratory, so it is not the number a thinking-aloud user experiences.
This is direct support for the ticket's own constraint that read-speech benchmarks are not
evidence here.

**One caveat that generalizes to every vendor.** The leaderboard's normalization strips
disfluencies before scoring: "punctuation and casing are removed, as well as disfluencies such
as fillers (e.g., 'ah,' 'uh,' 'um'), repetitions, and repairs." So even the spontaneous-speech
numbers are flattered. **Any published WER should be read as a floor, not an expectation**, and
that applies to every engine this ticket evaluates. The paper itself flags the gap as future
work.

## Fairness: the absence is the finding

**For both flagships, NVIDIA answers the fairness questions with the word "None."** The Bias
subcards of `parakeet-tdt-0.6b-v2` and `-v3` are identical and verbatim:

> Participation considerations from adversely impacted groups [protected classes] in model
> design and testing: **None**
> Measures taken to mitigate against unwanted bias: **None**

No race, dialect, accent, age, gender or disability breakdown appears anywhere in either card.
The only acknowledgement that these variables matter carries no numbers: "Accuracy varies based
on language and characteristics of input audio (Domain, Use Case, Accent, Noise, Speech Type,
Context of speech, etc.)."

The newest model is a partial improvement that still stops short of error rates. Its standalone
`bias.md` publishes **validation-set composition** — English 100%; geographic origin US 80% /
UK 10% / others 10%; accent American 80% / British 10% / others 10% — and a *statement* that a
"custom dataset" was used "to evaluate model performance across genders, age groups, and
linguistic backgrounds." **No WER disaggregated by any of those axes is published**, and the
custom dataset is neither named nor released. Note what the composition itself discloses: a
validation set that is 90% two prestige varieties.

CORAAL is now in the leaderboard's long-form track and is inside Parakeet v3's 10.7 long-form
average, but **the per-dataset CORAAL number for Parakeet is not published** — obtainable only
by running the leaderboard's own eval scripts.

## Two findings worth keeping even though Parakeet is rejected

1. **The read-vs-spontaneous multiplier is ~6.6×, and published WERs strip disfluencies before
   scoring.** Treat every vendor's headline number as a floor. This is a lens for the whole
   ticket, not a fact about Parakeet.
2. **"Do you publish error rates disaggregated by speaker demographics?" should be asked of
   every engine.** Parakeet answers "None" twice, in writing. Combined with the cloud vendors
   ([`stt-cloud-byok.md`](stt-cloud-byok.md)), no engine evaluated so far publishes one.

## Still open on the ticket

- **Apple SpeechAnalyzer, whisper.cpp, Vosk.** Not covered.
- **Verification** of everything above.
