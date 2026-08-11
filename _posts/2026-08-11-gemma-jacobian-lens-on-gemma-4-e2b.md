---
title: "I Put a Jacobian Lens on Gemma 4 E2B. It Found Signal, but No Workspace."
description: "A local experiment with a Jacobian lens on Gemma E2B found prompt-sensitive answer readiness and a small causal effect, while a broader multi-layer workspace claim did not hold up."
date: 2026-08-11
tags: [ai, interpretability, transformers, gemma, mechanistic-interpretability]
reading_time: "9 min read"
og_image: "/img/posts/gemma-jacobian-lens/gemma-jacobian-lens-cover.png"
repo_card:
  url: "https://github.com/curtiscovington/gemma-jspace-demo/tree/v0.1.0"
  title: "Gemma Jacobian-lens study (tag: v0.1.0)"
  description: "Frozen-weight Gemma E2B experiments, protocols, controls, and interactive result pages."
---

I wanted to answer a practical question: can I run a serious Jacobian-lens experiment on an open model locally—and learn something more than a pretty activation visualization?

Short answer: yes, with important caveats.

![Gemma 4 E2B Jacobian-lens study: local signal, prompt-format sensitivity, a causal probability shift, and no uniquely established workspace band.](/img/posts/gemma-jacobian-lens/gemma-jacobian-lens-cover.png)

**Code and results:** The full reproducibility package—including scripts, frozen protocols, lab notes, small interactive result pages, and environment lockfile—is pinned to [release tag v0.1.0](https://github.com/curtiscovington/gemma-jspace-demo/tree/v0.1.0).

### TL;DR (Layman Version)

I built a mathematical readout for a small Gemma model that often made the answer it was preparing to say easier to see, and small targeted nudges moved its answer probabilities in the predicted direction. But the result depended sharply on how I asked the model to answer, and a larger layer-by-layer test did *not* reveal a clean, unique “workspace band.”

That combination is the story. There is a real local signal here. It is not evidence that I found a model’s hidden thoughts, consciousness, or a universal J-space.

## Why This Post Exists

Interpretability often asks whether a model’s internal activity can be connected to the language it eventually produces. A standard tool for that is the **logit lens**: take an intermediate layer, pretend it is the final layer, and decode it with the model’s normal output machinery.

This experiment was inspired by Anthropic’s [*Verbalizable Representations Form a Global Workspace in Language Models*](https://transformer-circuits.pub/2026/workspace/index.html), which introduced the Jacobian lens and reports evidence for a privileged, workspace-like J-space in the larger Claude models it studied. I was not trying to claim that result for Gemma. I wanted to ask the smaller, practical question: how much of the measurement method—and how much of its behavior—survives on an open E2B model that I can run locally?

The problem is that an intermediate layer is not actually final. Many transformer layers still stand between it and the next word.

A **Jacobian lens** tries to account for those remaining transformations. With the model’s weights frozen, it uses derivatives to ask a local question:

> If I changed this layer’s activation by an almost infinitesimal amount, how would the model’s final word scores change after the rest of the network processed it?

I averaged that downstream sensitivity over ordinary calibration text. The result is a linear map: a compact, local approximation of how activity at one layer flows into later language.

The logit lens treats a half-finished object as finished. The Jacobian lens tries to model the rest of the assembly line.

## Setup

I used instruction-tuned **Gemma E2B** on an RTX 3080 Ti with 12 GB of VRAM, using CPU offload to stay within memory. The weights stayed frozen throughout. This was not fine-tuning and it was not “training J-space.”

The work progressed in stages:

1. Fit a late, local Jacobian readout and check that the plumbing worked.
2. Calibrate layer 27 with generic, unrelated passages and evaluate it on held-out questions.
3. Test how answer formatting changes what the lens can read.
4. Run a pre-specified causal nudge test with negative, shuffled, and random controls.
5. Fit a small multi-layer atlas around the middle and late network, then extend its calibration budget to 55 passages.

For evaluation, I tracked the rank of an expected answer token. Lower is better: rank 1 means the token is at the top of that readout’s vocabulary list. I always compared the Jacobian lens with the ordinary logit lens, a coordinate-shuffled Jacobian control, and norm-matched random directions where appropriate.

## Result 1: A Local Signal at Layer 27

Layer 27 was the interesting layer in the early work. On a fixed 40-prompt held-out set after 100 calibration passages, the Jacobian lens had a median answer rank of **52**, compared with **117.5** for the logit lens. The shuffled and random controls were far worse.

That is encouraging, but it is not a general victory. The tasks were hand-built, layer 27 was already the layer of interest from earlier exploration, and results varied substantially by task family. Factual recall and simple classification looked promising. Object-and-location tracking did not.

One illustrative prompt was:

> What is the capital city of France?

At the assistant-ready position, `Paris` ranked sixth through the layer-27 Jacobian lens and twenty-fifth through the matching logit lens. That does **not** mean the model had silently written “Paris” somewhere inside itself. It means this local readout made the `Paris` token more available than the simpler direct projection did.

<!-- Suggested figure: the existing France J-lens vs logit-lens word-map visual. Caption: “At one answer position, layer 27 makes the expected token more available under the Jacobian readout than under the logit lens. This is a token-rank comparison, not a transcript of hidden reasoning.” -->

## Result 2: Prompt Format Changes Readability

The most useful surprise came from object-and-location questions.

On the original assistant-style prompts, Gemma usually generated the correct location eventually. Yet at the prompt boundary, both lenses ranked the expected answer extremely poorly. The median ranks were roughly 37,000 for the Jacobian lens and 40,000 for the logit lens.

Then I changed only the instruction for how the model should answer:

| Answer instruction | Jacobian lens median rank | Logit lens median rank |
| --- | ---: | ---: |
| No extra suffix | 37,074.5 | 39,788.5 |
| “Answer concisely.” | 24.5 | 154 |
| “Answer with the location.” | 1 | 271 |
| “Answer with only the single location word.” | 1 | 1.5 |

The model’s content accuracy was already high in the original condition. What changed first was the *availability of the answer token at that exact boundary*.

This is an important constraint on the whole project: the lens is reading a prompt-conditioned state of readiness for the next utterance. It is not a format-independent decoder for a hidden answer that exists unchanged inside the model.

That is less magical than “mind reading,” but more useful. It shows that the boundary between reasoning, response planning, and surface form is experimentally consequential.

<!-- Suggested figure: the tracking-format-sweep visual. Caption: “A small change in answer instruction radically changes answer-token availability. The prompt changes the state, so this is not a format-invariant readout.” -->

## Result 3: A Local Causal Probability Shift

Readouts are descriptive. The stronger question is causal: if the lens says a particular local direction favors one answer over another, does adding that direction actually change the model’s output distribution?

I froze this protocol before looking at the result. For 12 new binary classification prompts, I derived a **prompt-specific** layer-27 direction that increased the target-answer group relative to a foil group. I injected it only at the final prompt token, then compared a positive nudge with:

- the same direction with the sign reversed;
- a fixed coordinate-shuffled direction; and
- a seeded, norm-matched random direction.

At the primary 3% intervention strength, the positive nudge increased target-versus-foil log-odds on **11 of 12** prompts. It also beat each control on 11 of 12 paired prompts. The median shifts were:

| Condition | Median target-vs-foil log-odds change |
| --- | ---: |
| Positive lens-derived nudge | +3.71 |
| Negative of the same direction | -3.96 |
| Coordinate-shuffled control | -0.08 |
| Norm-matched random control | -0.12 |

The effect scaled with intervention strength. That is a genuine local causal-alignment result: the readout-derived direction was not merely correlated with the target token.

But the experiment was deliberately saturated. The baseline model already gave the target answer on all 12 prompts, so no intervention flipped a visible answer. This is evidence for a local probability shift, **not** a demonstration that I can reliably rewrite a model’s beliefs or steer arbitrary behavior.

<!-- Suggested figure: the causal-intervention visual. Caption: “Positive and negative lens-derived directions move the target-versus-foil margin in opposite directions; shuffled and random controls remain near zero. Output choices stayed unchanged because the baseline was saturated.” -->

## Result 4: The Workspace Claim Did Not Survive the Atlas

The J-space paper motivates a more ambitious picture: a distinct layer range whose activity becomes globally available in a language-like workspace. I did not find enough evidence for that on this model.

I fitted comparable lenses at layers 8, 16, 22, 27, and 32; evaluated the same 24 held-out, one-word prompts; and ran the same controls. I then extended the shared calibration set from 20 to 55 generic passages—about 2.8 GPU-hours of fitting on this machine.

Late layers did show a raw-readability plateau. At layers 27 and 32, expected tokens often had median rank 1. But the controls mattered:

- At layer 27, results were heavily tied with the logit lens.
- At layer 32, the coordinate-shuffled control also reached median rank 1.
- No layer met the predeclared rule requiring a Jacobian-specific advantage over both the logit and control readouts.

More calibration made the late-layer matrices more numerically stable, but it did not change that conclusion. The data support “late layers are easier to decode on these constrained prompts,” not “I found a distinct Jacobian-specific workspace band.”

That negative result is worth keeping. It is precisely the kind of guardrail that stops an interpretability demo from turning into a story its evidence cannot carry.

<!-- Suggested figure: the 55-prompt multi-layer atlas. Caption: “Late layers are readily decodable on this task family, but the matched controls prevent a claim of a unique Jacobian-specific workspace band.” -->

## What This Experiment Established

On a small open model and a consumer GPU, I can:

- fit a local Jacobian-style language readout with frozen weights;
- see cases where it surfaces expected answer tokens better than a logit lens;
- show that answer format strongly changes what is readable at a response boundary; and
- derive prompt-specific directions that causally shift target-versus-foil probabilities beyond well-matched controls.

Those are meaningful results. They make the read–predict–intervene loop concrete.

## What It Did *Not* Establish

It did not show:

- a model-wide or stable “Gemma J-space” in the strong global-workspace sense;
- permanent, universal concept vectors such as a single model-native `cat` or `truth` direction;
- a method for reading format-invariant hidden answers;
- behavioral answer flips or general-purpose steering; or
- anything about consciousness or a literal model mind.

The practical lesson is almost the opposite of a grand claim: interpretability depends on controls, prompt formatting, and the exact question being asked. A beautiful activation picture is cheap. A result that survives a shuffled direction, a random direction, a held-out prompt, and a negative result is much more valuable.

> **Note:** This is a small, local study on one model, with hand-authored task sets and limited calibration data. The strongest results are layer- and prompt-family-specific. They should be treated as a reproducible feasibility demonstration, not a general theory of transformers.

## Where I Would Take It Next

The next worthwhile change is not simply “run longer.” More calibration tightened the atlas but did not turn it into a workspace result. Better next experiments would change a meaningful variable:

1. Repeat the controlled protocol on a larger open model with enough memory to avoid aggressive offload.
2. Screen naturally uncertain two-choice prompts before intervention, so a causal shift has a chance to change a visible choice rather than merely move an already-saturated probability.
3. Compare several nearby layers using the same large calibration set and a preregistered decision rule.
4. Test whether a direction learned on one prompt transfers to related prompts—a much stronger test than the prompt-specific directions used here.
5. Publish the code, prompt sets, raw ranks, and negative controls alongside the visuals.

That last point matters most. The useful contribution here is not a claim that Gemma has been opened up completely. It is a small, inspectable experiment that says exactly what happened: where a local lens helped, where prompt wording changed the picture, where a causal signal appeared, and where the larger story failed.

## Takeaway

**I found a local, prompt-sensitive readout in Gemma that predicts and can nudge answer probabilities; I did not find a robust, model-wide workspace band. That boundary is the result.**
