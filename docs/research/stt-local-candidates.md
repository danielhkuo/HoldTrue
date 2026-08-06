# STT: Apple SpeechAnalyzer, whisper.cpp, Vosk

> **The remaining three candidates from [issue 23](https://github.com/danielhkuo/HoldTrue/issues/23).**
> With [`stt-cloud-byok.md`](stt-cloud-byok.md) and [`stt-parakeet.md`](stt-parakeet.md) this
> completes the ticket's candidate list.

> **Provenance: gathered in-session against primary sources, 2026-08-04.** Apple's developer
> docs are JavaScript-rendered and could not be fetched directly, so Apple platform and asset
> facts come from Apple's WWDC25 session and from third-party implementations reading the same
> API; **the Apple accuracy figure is third-party (Argmax), not published by Apple.** Vosk and
> whisper.cpp figures are from their own project pages. Flagged where each claim comes from.
> Verify before any of it reaches [`decisions.md`](../decisions.md).

## The rule test, which is what actually separates them

The stack rule is *"no bundled inference — Ollama, or bring your own API key."* Its stated
rationale in [`decisions.md`](../decisions.md) is concrete: no signing entitlements, no
notarization complications, no giant installer. Judged against that, the three candidates land
in three different places.

| Candidate | Bundles inference? | Verdict |
|---|---|---|
| **Apple SpeechAnalyzer** | **No — the OS owns the engine and the model** | **Satisfies the rule outright** |
| **whisper.cpp** | Only if shipped. Has an HTTP server mode | **Admissible as a user-installed sidecar** |
| **Vosk** | **Yes, by construction** | **Violates the rule** |

**Apple SpeechAnalyzer satisfies the rule more cleanly than Ollama does.** The app ships no
engine and no weights; models are downloaded and managed by the OS through `AssetInventory`,
are shared across every app on the device, and do not count against app size. Where Ollama
requires the user to install something, this requires nothing at all.

**whisper.cpp is the interesting case.** It ships `whisper-server`, an HTTP transcription server
with an OpenAI-like API — architecturally the same shape as Ollama: a local server the app
talks to over HTTP. Bundled into the installer it violates the rule; installed by the user
alongside Ollama it is exactly the pattern the rule already blesses. **The rule does not reject
whisper.cpp; it constrains how it may be delivered.**

**Vosk has no served path.** It is a library you link against with models you ship. That is
bundled inference with no alternative delivery, and the rule forecloses it.

## Apple SpeechAnalyzer / SpeechTranscriber

**Platform: Apple only, and new.** iOS 26, iPadOS 26, macOS 26, Mac Catalyst 26, visionOS 26,
tvOS 26. There is no Windows or Linux path and there will not be one. On-device only — no
cloud round trip.

**This is the binding constraint, not accuracy.** [`AGENTS.md`](../../AGENTS.md) states macOS is
primary but "Windows and Linux must work for most features." Voice is the *entry point* to the
Feynman session, so an Apple-only engine does not degrade the feature on other platforms — it
removes it. And requiring macOS **26** narrows even the Mac audience to machines on the current
major version.

**Accuracy: 14.0% WER on conversational speech** — measured by Argmax on "a random 10% subset
of the earnings22 dataset, consisting of ~12 hours of English conversations from earnings calls
with analysts" (<https://www.argmaxinc.com/blog/apple-and-argmax>). Genuinely spontaneous
material, which makes it one of the few directly usable numbers in this whole ticket.

| Model | WER on that set | Speed factor |
|---|---|---|
| OpenAI Whisper Small | 12.8% | 35 |
| **Apple SpeechTranscriber** | **14.0%** | **70** |
| OpenAI Whisper Base | 15.2% | 111 |

It sits between Whisper Base and Small on accuracy at twice Small's speed, running on Neural
Engine + CPU. **Do not compare this to Parakeet's Earnings-22 figure of 11.15%** — different
subset, different normalization, different harness.

**Fairness: no published Apple data.** No accent, dialect, or demographic breakdown could be
found from Apple. The benchmarker states its own limits plainly: testing was "limited to English
spoken audio, and the same results may not be obtained with accented speech, meetings with
multiple speakers, or audio recorded from distant locations."

## whisper.cpp

**Licence MIT.** Broadest platform coverage of anything in this ticket: macOS (Intel and Arm),
iOS, Android, Linux, FreeBSD, WebAssembly, Windows (MSVC and MinGW), Raspberry Pi, Docker.

**Delivery.** Single-file `ggml` format packing parameters, mel filters, vocabulary and weights
together. Weights are not bundled by default — a download script fetches them. `whisper-server`
provides the HTTP/OAI-like API described above.

**Apple Silicon acceleration is first-class:** "on Apple Silicon, the inference runs fully on
the GPU via Metal," with an optional Core ML path putting encoder inference on the Neural Engine
for "more than x3 faster."

**Accuracy: inherits Whisper's**, which are the best-documented conversational numbers anywhere
in this ticket — Switchboard 13.8, CORAAL 16.2, AMI IHM 16.9, CallHome 17.6, CHiME6 25.5,
against LibriSpeech-clean 2.7 (see [`stt-cloud-byok.md`](stt-cloud-byok.md)). Whisper is also
**the only model in this entire evaluation whose publisher admits demographic disparity in
writing**, though it publishes no numbers behind the admission.

## Vosk

**Licence Apache 2.0** across all models. Sizes from 40 MB to 2.3 GB.

**Vosk publishes the read-vs-spontaneous gap more honestly than anyone else in this ticket**,
and the gap is brutal (<https://alphacephei.com/vosk/models>):

| Model | Size | LibriSpeech clean | TED-LIUM | **callcenter** |
|---|---|---|---|---|
| `vosk-model-small-en-us-0.15` | 40M | 9.85 | 10.38 | **not published** |
| `vosk-model-en-us-0.22-lgraph` | 128M | 7.82 | 8.20 | **not published** |
| `vosk-model-en-us-0.22` | 1.8G | 5.69 | 6.05 | **29.78** |
| `vosk-model-en-us-0.42-gigaspeech` | 2.3G | 5.64 | 6.24 | **30.17** |

**~30% WER on call-centre audio against ~5.7% on read audiobooks is a 5.2–5.3× multiplier** —
independently reproducing the ~6.6× gap the Parakeet research found, from a different vendor on
different data. Two independent confirmations make this a property of the task, not of any one
engine.

Note also that the two small models — the ones you would actually consider shipping — publish
**no spontaneous number at all.** Their read-speech figures are the only evidence available for
them, which under this ticket's own constraint is no evidence.

## The fairness finding, now complete

With this file the candidate list is closed, and one answer holds across every single entry:

| Engine | Publishes error rates disaggregated by speaker demographics? |
|---|---|
| OpenAI (GPT-series) | No |
| OpenAI (Whisper) | No — but **admits the disparity in writing** |
| Deepgram | No |
| AssemblyAI | Only CORAAL, on a superseded model, since dropped |
| NVIDIA Parakeet | No — Bias subcard answers **"None"** twice |
| Apple SpeechAnalyzer | No |
| whisper.cpp | No (inherits Whisper's disclosure) |
| Vosk | No |

**Not one of eight publishes one.** The ticket framed missing fairness data as a cost to record
against particular candidates. It is not — it is universal, so it **cannot discriminate between
engines at all.** It converts from a selection criterion into a disclosure obligation toward
users, and into an argument for keeping the transcript-correction step regardless of which
engine wins.

## The second finding: every published WER is a floor

Three independent confirmations now:

- Whisper: LibriSpeech-clean 2.7 → CHiME6 25.5
- Parakeet: LibriSpeech-clean 1.69 → AMI 11.16 (~6.6×), **with fillers, repetitions and repairs
  stripped before scoring**
- Vosk: LibriSpeech-clean 5.69 → callcenter 29.78 (~5.2×)

The ticket's premise that thinking-aloud speech runs 15–25% WER is **corroborated**, and every
headline number any vendor quotes should be read as a floor.
