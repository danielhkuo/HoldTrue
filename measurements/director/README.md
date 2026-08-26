# The director experiment

This folder holds the transcripts of the five runs in
[`docs/proposals/director-experiment.md`](../../docs/proposals/director-experiment.md).
`src/experiment.ts` writes one file for each run letter.

Two models talked to each other. No person spoke. Every number in this folder is an engineering
count about a machine. Rule 29 holds. No figure from this folder argues a rule change. No figure
from this folder may enter a document outside this folder.

| Run | Flags |
|---|---|
| A | none |
| B | hideOwnLines |
| C | director |
| D | sampling, temperature 0.8 |
| E | all three |
| F | director, round 2 |
| G | director round 2, hideOwnLines, sampling 0.8 |
| H | director round 2 + opener guard |
| I | as H, and the child runs on a small model (`OLLAMA_CHILD_MODEL`) |
| J | as I, with the next child model under test |
| K | the child on an OpenAI endpoint (`CHILD_OPENAI_URL`), director on |
| L | as K, and the subject anchor on |

Run one with `npm run experiment -- A`. The script reads `OLLAMA_MODEL` for the model name. Both
sides use the same model.
