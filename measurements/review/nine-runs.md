# Nine end-to-end runs of the review

Nine runs on 2026-08-27, after the one-review build. One scenario: the fridge chain with the
planted gap (the expansion valve drops the pressure). The person and the child ran on
`muse-glimmer:30b-mlx`. The review ran on `composer-2.5` over a local OpenAI-compatible proxy.
The plan in `docs/proposals/mvp.md` asked for three topics. The check holds one built scenario,
so these are nine runs of one topic. Two more scenarios are an open task.

| Run | Checks | Review ran | Findings | Named the planted step |
|---|---|---|---|---|
| 1 | 7 of 7 | yes | 4 | yes |
| 2 | 7 of 7 | yes | 4 | yes |
| 3 | 7 of 7 | yes | 3 | yes |
| 4 | 6 of 7 | yes | 3 | no |
| 5 | 5 of 7 | yes | 0 | no |
| 6 | 7 of 7 | yes | 4 | yes |
| 7 | 6 of 7 | yes | 4 | no |
| 8 | 6 of 7 | no, Check failed at the endpoint | 0 | no |
| 9 | 7 of 7 | yes | 4 | yes |

## The counts

- The child guards held in nine runs of nine. No understanding claim, no restatement, no analogy.
- The review ran in eight runs of nine. The one failure was the endpoint, and the app stated it.
- The review named the planted step in five runs of nine.
- Runs 4 and 7 produced findings and none named the step.
- Run 5 returned an empty findings list. The screen then reads as "nothing was wrong", and a step
  was left out on purpose. This is the worst miss. A wrong silence is a false clean bill.

## What the counts say

The review on `composer-2.5` names the planted step in about half the runs. The design sends the
review to the strongest model the user provides. `composer-2.5` is a mid-size model behind a
proxy. Nobody has run the nine on a frontier provided model. That run needs a paid key and the
owner's hand.

Run 5 strengthens decision 22: a second model that refutes and a check against an empty list. An
empty findings list over a transcript with a planted gap must read as a doubt, not as a pass.

Every number is an engineering count about one scenario on one machine. Rule 29 holds.
