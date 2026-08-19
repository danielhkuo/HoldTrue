# Docs

**What runs today, 2026-08-19.** The child, and one model call per turn. You explain something out
loud, the child answers and asks where your chain breaks, and that is the session. The child and its
prompt are the product.

**What is dormant.** Extract, validate, Cohere, the tally, Supply and Contradict — the deterministic
pipeline. Off the live path, not deleted. So there are **no findings at all** right now, and the
review phase of the session produces nothing. Each piece returns one at a time, and only when
someone shows it improves what the child says. **Why, what it costs, and the rule for letting a
piece back: [`decisions.md`](decisions.md), the row *The child is the product, and determinism
returns as prompt material*.** Read that row before anything else here; several documents were
written while the pipeline was live and carry marks pointing back to it.

**Which document wins.** [`philosophy.md`](philosophy.md) beats a feature doc, which is the only
precedence it claims for itself. [`../AGENTS.md`](../AGENTS.md) holds the numbered invariants and is
not in the list below because it is not under `docs/` — read it first anyway; a violation of an
invariant is wrong even where a doc here says otherwise. [`decisions.md`](decisions.md) owns the
build order, and no other file may restate it.

- [philosophy.md](philosophy.md): **the core law.** Two laws — *we close what we open*, and *nothing
  is asserted anonymously* — plus the evidence gate and what we refuse to build. Wins any conflict.
  Law 2 is new as of 2026-08-07 and replaced the notes-only rule, so do not assume it from the
  number. Law 1 is unchanged, but **where it rests moved on 2026-08-19**: the review phase used to
  close what the child opened, and now the child's prompt does. That section says plainly why that
  is weaker.
- [features/feynman.md](features/feynman.md): the first shipping feature — its law, its session, its
  eligibility boundary. The session is written as it is (steps 1 to 3) with the review phase kept
  visible as the destination (steps 4 to 8).
- [decisions.md](decisions.md): stack, macOS lifecycle, roadmap constraints, build order, and every
  ruling with its reason and its rejected alternatives. Superseded rows stay visible.
- [workflow.md](workflow.md): why the build procedure is shaped the way it is. The procedure itself
  is [`/holdtrue-workflow`](../.claude/skills/holdtrue-workflow/SKILL.md), the only numbered document.
- [specs/](specs/): one per piece — its contract, its rulings, and what it hands on. Five exist, at
  every stage from built-and-closed to unbuilt draft; each carries its own status and its own open
  rulings, and this map does not copy them. All but the child's cover dormant pieces.
  [specs/child-speech.md](specs/child-speech.md) is the one covering what runs.
  [specs/supply.md](specs/supply.md) — **read its banner first**; it was written against a repo that
  no longer exists.
- [transcripts/](transcripts/): 18 generated conversations of an adult explaining a mechanism to a
  child, written blind to this design. Design material and test fixtures, **not** a measurement.
- [research/evidence-base.md](research/evidence-base.md): every empirical claim about **how people
  learn**, its source, and the strength that source licenses. A claim about learning that is not in
  here does not appear in the product or in a design doc.
- [research/extraction-benchmarks.md](research/extraction-benchmarks.md): the **engineering**
  figures — causal extraction, open IE, ASR — each with its genre, metric and sample size. Ungated,
  but every number carries its source.
- [research/stt-parakeet.md](research/stt-parakeet.md),
  [research/stt-cloud-byok.md](research/stt-cloud-byok.md),
  [research/stt-local-candidates.md](research/stt-local-candidates.md),
  [research/stt-signals.md](research/stt-signals.md): the speech-to-text candidates and what the
  chosen engine can tell us about its own errors, from
  [issue 23](https://github.com/danielhkuo/HoldTrue/issues/23), which resolved to whisper.cpp behind
  a sidecar. Model size is still open.
- [../measurements/within-sentence/README.md](../measurements/within-sentence/README.md): the
  falsification week's protocol and its kill numbers — never run, and the one measurement nobody
  else can do. It scores a dormant piece; `AGENTS.md` still calls it the operative document for it.
- [research/prior-art/](research/prior-art/): per-paper analyses from the retired product.
  **Superseded** and partly refuted.

## The split

`philosophy.md` holds what generalizes, a feature doc holds what doesn't. The seam is
empirical: *close what you open* landed in two independent literatures, so it is core, while
*the gap is a missing connection* is false of flashcards, so it stays with Feynman.
