# Proposal: one review, one label removed, one cap

**Status: drafted 2026-08-25 under decision 19. The owner has not ruled on the two questions or
the cap.**

## The removal

Decision 19 makes the omniscient toggle meaningless. The code must lose it.

- `src/page.html`: the toggle and both labels go. The consent checkbox stays, and it now belongs
  to the review, because the review always sends text off the device.
- `src/server.ts`: `POST /api/start` loses the `omniscient` field. The end phase uses `provided`
  only. Rule 53. The `childModel` handle stays as it is.
- `src/session.ts`, `src/types.ts`: the `omniscient` flag and the label field go where they
  appear.
- The e2e check loses the label assertions and gains one: no review output ever names a label.

## ANSWERED 2026-08-27

The owner ruled on both questions and the cap. Decision 20: no provided model, no session, design
A below. Decision 21: consent at the start screen, and the soft cap at twelve turns. The sections
below stay as the record of the options.

## Question 1 for the owner: no key, no session?

The app holds no provided model. Two designs.

- **A. The session does not start.** The review is the product, so a session that cannot end with
  a review must not begin. Law 1 stays absolute.
- **B. The session starts with a warning.** "No review will run." The person can still practise
  production. Rule 46 states the failure at the end.

The recommendation is A. Law 1 says a session must not end with a question open, and only the
review closes questions.

## Question 2 for the owner: where the consent moves

Consent today attaches to the toggle or a sending startup backend. Under decision 19 every
session with a review sends text at the end. The recommendation: consent moves to the start
screen, one checkbox, one sentence naming the provider. Rule 48 holds unchanged.

## The cap on session length

The owner asked for a cap. The evidence for one: attention drifts across turns, and the frame of
the other party wins inside about eight rounds. The generated transcripts run 8 to 18 child
lines. The recommendation: a soft cap at 12 turns. The app shows one line at turn 12: "This is a
good place to end and see the review." The button still ends the session. Rule 44 holds: nothing
ends a session except the button. A hard cap is rejected, because it would be an end without the
person's hand.

## Not decided here

The child model size. `measurements/director/counts.md` will hold the run I counts: a small child
model against the same person model, same flags, same counts. The result informs the default, and
the owner rules after reading it.
