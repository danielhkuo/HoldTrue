# STT: the cloud bring-your-own-key branch

> **Partial answer to [issue 23](https://github.com/danielhkuo/HoldTrue/issues/23), "Which
> speech-to-text engine."** Covers the three BYOK cloud vendors only. The four *local*
> candidates the ticket names — Apple SpeechAnalyzer, whisper.cpp, NVIDIA Parakeet, Vosk —
> are **not** covered here; the agents researching them died before writing anything. The
> ticket stays open.

> **Provenance: agent-produced, not independently verified.** Gathered by a research subagent
> on 2026-08-04 against primary sources, with URLs recorded per claim. Nobody has re-walked
> those sources by hand. Treat every number here as *cited but unchecked* — in the sense
> [`evidence-base.md`](evidence-base.md) means by "unverified, cite only after retrieval."
> Verify before any of it enters [`decisions.md`](../decisions.md).

## Why this branch exists at all

The stack rule is *"Ollama, or bring your own API key"*
([`decisions.md`](../decisions.md)). Ollama does not serve ASR models, so a local engine has
to find a served path or break the no-bundled-inference decision. A BYOK cloud API breaks
nothing — it is the second half of the rule as written.

It does collide with something else, and that collision is a decision, not a fact:
[`philosophy.md`](../philosophy.md) opens with *"Nothing leaves the device unless you turn
something on."* Sending explanation audio to a vendor is precisely the class of thing
[`decisions.md`](../decisions.md) already puts behind an explicit switch for cloud embedding
and web retrieval. **A cloud STT default would contradict that; a cloud STT option behind the
same switch would not.** Nothing below settles which.

## Cross-vendor summary

| | OpenAI | Deepgram | AssemblyAI |
|---|---|---|---|
| Flagship (batch) | `gpt-transcribe` | Nova-3 | Universal-3.5 Pro |
| Flagship (stream) | `gpt-live-transcribe` | Flux | U3.5 Pro Realtime |
| Batch price/hr | $0.27 | **$0.258** | $0.21 |
| Stream price/hr | $1.02 | $0.462 | $0.45 + idle-time billing |
| Free tier | **none** | $200 credit | $50 credit |
| BYOK REST | `/v1/audio/transcriptions`, `Bearer` | `/v1/listen`, `Token` | `/v2/transcript`, bare key |
| Conversational WER published | Whisper only; **nothing for GPT models** | numbers but **no named datasets** | per-set table |
| Test sets named and checkable | yes (Whisper paper) | **no** | yes |
| Demographic disparity acknowledged | **yes, explicitly** | vaguely, industry-level | only via third-party citation |
| Demographic WER measured and published | no | **no** | only CORAAL, older model |

## The three findings that matter

**1. No vendor publishes a fairness evaluation of its current flagship.** If demographic
robustness matters here, it has to be measured in-house — none of them will hand over the
number. This directly answers the ticket's fairness constraint for the cloud branch: the
answer is *no data*, same as the ticket already suspected of the local options.

**2. OpenAI is the only vendor that names the risk in writing, and its citation is broken.**
The Whisper model card states the models "exhibit disparate performance on different accents
and dialects," with "a higher word error rate across speakers of different genders, races,
ages, or other demographic criteria"
([model card](https://github.com/openai/whisper/blob/main/model-card.md)). It forward-refers to
the paper for full results — and the agent reports reading the paper end to end and finding no
fairness, bias, or demographic section at all. CORAAL is evaluated there purely as an
out-of-distribution robustness set, never split by speaker demographics. The disclosure also
covers Whisper, not the GPT-series models one would actually ship.

**3. The one real demographic datapoint anyone published is bad, and then disappeared.**
AssemblyAI's Universal-1 research report gives CORAAL — the Corpus of Regional African
American Language, segmented per the FairSpeech project — at **16.9% WER**, its worst English
result, ~5.5× its own LibriSpeech Test-Other score and roughly 1.8× worse than Azure on the
same audio ([research report](https://www.assemblyai.com/research/universal-1)). It is
published without comment. **CORAAL does not appear in the current Universal-3.5 Pro benchmark
table** — the demographically-relevant set was dropped between models.

## OpenAI

**Models.** `gpt-transcribe` is the recommended default; lineup also has `gpt-4o-transcribe`,
`gpt-4o-mini-transcribe`, `gpt-4o-transcribe-diarize`, `gpt-live-transcribe` (realtime), and
`whisper-1`, which is not deprecated and remains the option for word timestamps, SRT/VTT, and
translation-to-English.
<https://developers.openai.com/api/docs/guides/speech-to-text>

**Price** (<https://developers.openai.com/api/docs/pricing>): `gpt-transcribe` $0.0045/min,
`gpt-4o-transcribe` $0.006, `gpt-4o-mini-transcribe` $0.003, `gpt-4o-transcribe-diarize`
$0.006, Whisper $0.006, and **`gpt-live-transcribe` realtime $0.017/min** — roughly 3.8× the
batch flagship.

**Free tier: none.** No signup credits for API usage. A separate free-daily-tokens program for
orgs opting into data sharing lists text models only; audio models not found as eligible
(secondary source — the help article 403s).

**BYOK: yes**, plain REST. `POST /v1/audio/transcriptions`, `Authorization: Bearer $KEY`,
multipart. `stream=true` supported; realtime is a separate WebSocket path.

**WER.** No benchmark tables in the docs. For `gpt-4o-transcribe` the only named datasets are
FLEURS, Common Voice and Multilingual LibriSpeech — **all read or scripted speech**, none
conversational; the single quantitative claim is ~90% fewer hallucinations than Whisper v2
(<https://developers.openai.com/blog/updates-audio-models>). **No conversational-English WER is
published for any GPT-series transcription model.**

Whisper's paper (<https://arxiv.org/abs/2212.04356>) is the only source with conversational
numbers, and it is the strongest such evidence any of the three vendors publishes:

| Dataset | Kind | Whisper WER |
|---|---|---|
| LibriSpeech Clean | read | 2.7 |
| LibriSpeech Other | read | 5.2 |
| Common Voice | read | 9.0 |
| VoxPopuli En | parliamentary | 7.3 |
| **Switchboard** | conversational telephone | **13.8** |
| **CORAAL** | African American Language interviews | **16.2** |
| **AMI IHM** | meetings | **16.9** |
| **CallHome** | conversational telephone | **17.6** |
| **CHiME6** | dinner-party | **25.5** |
| **AMI SDM1** | meetings, far-field | **36.4** |

The ~13× spread between LibriSpeech Clean and AMI SDM1 is the whole argument for the ticket's
"read-speech benchmarks are not evidence here" constraint.

## Deepgram

**Models.** Nova-3, "our highest performing model," for batch; Flux, "the first conversational
speech recognition model built specifically for voice agents," for realtime.
<https://developers.deepgram.com/docs/models-languages-overview>

**Price.** The pricing page is a JS toggle and is easy to misread — the raw source shows
promo-vs-list *streaming* prices side by side, not streaming-vs-batch. Deepgram's own current
article resolves it: **Nova-3 batch $0.0043/min ($0.258/hr), streaming $0.0077/min
($0.462/hr)** (<https://deepgram.com/learn/best-speech-to-text-apis-2026>). Streaming is only
~1.8× batch, and batch is the cheapest of the three.

**Free tier:** $200 credit on signup, no card. **BYOK: yes** — `POST
https://api.deepgram.com/v1/listen?model=nova-3`, `Authorization: Token $KEY`.

**WER — numbers without named datasets, which is the key weakness.** Nova-3 is claimed at
median 6.84% WER streaming and 5.26% batch over 2,703 files / 81.69 hours spanning Air Traffic
Control, Conversational AI, Drive-Thru, Finance, Medical, Meeting, Phone Call, Podcast,
Video/Media and Voicemail (<https://deepgram.com/learn/introducing-nova-3-speech-to-text-api>).
The domains are genuinely spontaneous, but **the underlying datasets are private and unnamed,
with no published methodology**, so none of it is reproducible or independently checkable.
Flux is claimed to match Nova-3 with **no numbers given at all**.

**Fairness: no.** Two bias-adjacent posts exist, neither containing a single WER number for a
Deepgram model on any demographic axis — one a conceptual primer on sampling bias
(<https://deepgram.com/learn/detecting-and-reducing-bias-in-speech-recognition>), one advocacy
content whose only performance statement is a general industry observation
(<https://deepgram.com/learn/celebrating-black-history-month-with-a-vision-of-more-inclusive-speech-recognition>).
The English product page lists AAVE among supported dialects with **no accuracy data behind
it**; treat that listing as unsubstantiated.

## AssemblyAI

**Models.** Universal-3.5 Pro (async flagship, launched 2026-07-07) and Universal-3.5 Pro
Realtime. SLAM-1 is marked "Deprecated—do not use."

**Price** (<https://www.assemblyai.com/pricing>): Universal-3.5 Pro async **$0.21/hr**
($0.0035/min); Realtime **$0.45/hr** base; Universal-2 async $0.15/hr.

Two billing traps worth carrying into any decision:

- **Streaming bills per session duration — the time the WebSocket is open, not audio sent.
  Idle time counts.** A desktop app holding a socket open through a learner's silence pays for
  the silence. This matters here: the Feynman session is explicitly someone thinking aloud.
- Add-ons stack additively: diarization +$0.02/hr async or +$0.12/hr streaming, Medical Mode
  +$0.15/hr, entity detection +$0.08/hr, voice focus +$0.10/hr.

**Free tier:** $50 credit, no card; free-tier streaming throttled to 5 new streams/min against
100/min paid. **BYOK: yes** — `POST https://api.assemblyai.com/v2/transcript` after `/v2/upload`,
then poll. API key goes in the `authorization` header with **no `Bearer` prefix**, a documented
trip-up.

**WER — by far the most transparent of the three**, a live per-test-set, per-competitor table
(<https://www.assemblyai.com/benchmarks>), English pre-recorded:

| Model | Synthetic Medical | Accented English (India) | General Speech | Webinar | Avg |
|---|---|---|---|---|---|
| AssemblyAI Universal-3.5 Pro | 0.33% | 5.19% | 6.24% | 5.63% | **4.35%** |
| Mistral Voxtral Mini | 1.25% | 6.44% | 6.64% | 6.65% | 5.24% |
| OpenAI GPT-4o Transcribe | 0.55% | 6.49% | 7.45% | 6.87% | 5.34% |
| ElevenLabs Scribe V2 | 0.41% | 5.92% | 7.19% | 9.96% | 5.87% |
| Deepgram Nova-3 | 0.51% | 7.77% | 8.81% | 9.55% | 6.66% |
| Azure Batch | 1.55% | 8.04% | 8.42% | 10.07% | 7.02% |
| Soniox | 0.72% | **53.48%** | 7.55% | 7.79% | 17.39% |

Outputs are normalized with the Whisper text normalizer before WER, so scores reflect
transcription rather than styling. **Caveat: vendor-run, and AssemblyAI wins every column.**
No publication date on the page.

Note their stated position that WER is the wrong metric
(<https://www.assemblyai.com/blog/word-error-rate-is-broken>), claiming their model transcribed
words the human ground truth had missed. Read as part principle, part hedge against being
scored on WER.

**Fairness — partially, and only for a superseded model.** No fairness study, no model card, no
stratified accuracy statement. What exists is CORAAL and "Accented English (India)" evaluated
as *accuracy* categories, not fairness axes — and CORAAL, the damaging one, is absent from the
current flagship's table. See finding 3 above.

## What this leaves open on the ticket

- **All four local candidates.** Apple SpeechAnalyzer, whisper.cpp, Parakeet, Vosk: nothing
  captured. This is the half of the ticket that actually tests the no-bundled-inference
  constraint.
- **Whether cloud STT is admissible at all**, given the local-first promise. A decision, not a
  fact — see "Why this branch exists."
- **Idle-time billing against a thinking-aloud session.** Only AssemblyAI's terms were read on
  this point; the others were not checked for the same trap.
- **Every number above.** Cited but not re-walked by a human.
