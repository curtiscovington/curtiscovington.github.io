---
title: "Did My Tiny Transformer Learn an Internal FSM State?"
description: "I trained a tiny decoder-only transformer from scratch on a finite-state-machine task, then probed its activations. The strongest evidence was a fragile mid-training next-state representation, not a robust learned state machine."
date: 2026-03-28
tags:
  - ai
  - interpretability
  - transformers
  - mechanistic-interpretability
  - finite-state-machines
reading_time: "8 min read"
og_image: "/img/posts/fsm-latent-state/latent_state_probe_late_accuracy.png"
repo_card:
  url: "https://github.com/curtiscovington/sae-interpretability/tree/exp-2026-03-28-fsm-state-probe"
  title: "SAE Interpretability (tag: exp-2026-03-28-fsm-state-probe)"
  description: "Scratch transformer + finite-state-machine lab with latent-state probing."
---

I wanted to answer one practical question:

**If I train a tiny transformer from scratch on a synthetic finite-state-machine task, does it actually learn an internal state, or does it just learn to guess the final answer token?**

Short answer: **partially, with real caveats.** I found some evidence of a linearly decodable transition representation, especially around the middle of training. I did **not** find strong evidence that the final model had learned a robust, generalizing FSM solver.

![FSM latent-state probe beyond training horizon](/img/posts/fsm-latent-state/latent_state_probe_late_accuracy.png)

### TL;DR (Layman Version)
I trained a very small AI model to keep track of a simple state machine. On a small smoke test, it looked surprisingly good. On a larger and more careful evaluation, that result mostly disappeared. When I looked inside the model, I found some evidence that it briefly learned a useful internal "next state" signal, but not enough to say it had really learned the whole state machine in a robust way.

## Why This Post Exists

This is the kind of experiment that can fool you twice.

The first failure mode is external: a tiny synthetic benchmark can look solved when the eval set is small or lucky. The second is internal: even if end-task accuracy is unstable, the model might still learn a partially useful latent representation worth studying.

That made this a good local-first interpretability lab. I could train the whole stack from scratch, save checkpoints, run probes over hidden activations, and inspect what changed over training instead of only checking the final answer accuracy.

## What Changed And Why

My earlier goal was to get a "pretty decent" FSM model. That did not really happen.

I added a scratch-training path to the lab so I could train a small decoder-only transformer on a synthetic finite-state-machine task, then I ran a few rounds of tuning. Some smoke runs looked promising. But once I reran the experiment with larger long-trace eval sets and multiple seeds, the long-horizon accuracy mostly collapsed toward chance.

That changed the question.

Instead of asking, "Did the model solve the task?", the more useful question became, "Did the model learn any internally decodable state-tracking structure before the end-task metric fell apart?"

## Setup

- **Model:** local tiny decoder-only transformer
- **Architecture:** `d_model=96`, `n_layers=4`, `n_heads=4`, `d_ff=384`, `max_seq_len=48`
- **Task:** hidden-state trace completion on one deterministic finite-state machine
- **States / symbols:** 8 states, 4-symbol alphabet
- **Train lengths:** traces of length 4 to 6
- **Long-horizon probe lengths:** traces of length 7 to 10
- **Objective:** answer-only loss plus auxiliary next-state supervision (`state_aux_weight=1.0`)
- **Smoke training schedule:** 10 epochs, batch size 32, learning rate `5e-4`
- **Probe method:** multinomial linear probes trained on checkpoint activations from `seen_eval` and evaluated on `unseen_eval`

The task format is simple: the model sees a start state and a sequence of input symbols, but not the intermediate hidden states. It has to predict the final state.

The probing protocol is also simple on purpose. For each checkpoint and layer, I extracted activations at each symbol position and trained a linear classifier to predict either:

- the **current FSM state**, or
- the **next FSM state**

That follows the basic probe idea from Alain and Bengio: if a variable is linearly decodable from a representation, that tells you something about what information is present there, even if it does not prove the full computation is being implemented there.

## Core Results

The first thing I had to disentangle was the smoke-run story from the broader evaluation story.

### Smoke Run: Looks Good

On the original smoke config, the model went from essentially random performance at initialization to a surprisingly strong long-trace result:

- `base` unseen accuracy: `0.0000` on 128 long-trace examples
- `frac_050` unseen accuracy: `0.5859`
- `frac_100` unseen accuracy: `0.5859`

The by-length smoke breakdown was also striking. At the halfway checkpoint, unseen accuracy was:

- length 7: `0.500`
- length 8: `0.625`
- length 9: `0.500`
- length 10: `0.750`

If I had stopped there, I could have told a neat story about a tiny model learning to track latent state beyond the training horizon.

### Larger Eval: Mostly Falls Apart

That story did not survive a better check.

I reran the experiment with a larger long-trace validation setup and aggregated across 3 seeds. With 8 states, uniform chance is `1/8 = 0.125`.

For the baseline scratch recipe (`answer_state_aux`):

- final `unseen_eval` mean: `0.1250 +/- 0.0088`
- selected checkpoint `unseen_eval` mean: `0.1185 +/- 0.0133`

For a longer-training variant (`answer_state_aux_longer_40`):

- final `unseen_eval` mean: `0.1289 +/- 0.0109`
- selected checkpoint `unseen_eval` mean: `0.1234 +/- 0.0078`
- oracle best mean across checkpoints: `0.1370 +/- 0.0117`

That is the number that reset my confidence. Training longer did not rescue long-horizon generalization in any meaningful way.

![Unseen accuracy over training](/img/posts/fsm-latent-state/unseen_accuracy_by_checkpoint.png)

So the answer metric said: **the final model is not a robust FSM solver.**

## What The Probe Found

Even with the answer metric looking weak, the hidden states were still interesting.

### Current State Is Decodable, But Not Persuasive

`current_state` was already fairly decodable at initialization, which makes it a weak signal for "learned latent state."

For example, on late unseen steps:

- layer 0 `current_state` accuracy at `base`: `0.375`
- layer 0 `current_state` accuracy at `frac_050`: `0.138`
- layer 0 `current_state` accuracy at `frac_100`: `0.202`

The majority baseline there was only `0.167`, so the representation is carrying real information. But because the untrained model already exposes a lot of it, and training mostly makes it worse, I do not think this is the right place to make a strong claim.

### Next State Is More Interesting

`next_state` is where the best evidence shows up.

On late unseen steps, the layer-0 probe moved like this:

- `base`: `0.381`
- `frac_050`: `0.526`
- `frac_100`: `0.484`

At layer 3:

- `base`: `0.282`
- `frac_050`: `0.452`
- `frac_100`: `0.372`

The important caveat is that the majority baseline for this target is high: `0.427`. So not all of that apparent performance is impressive. Still, the halfway checkpoint does exceed that baseline in a way the base model does not, especially in the later layer.

That is the narrow claim I am willing to make:

**mid-training, the model appears to form a more linearly decodable representation of the next transition state, especially on steps beyond the training horizon.**

I am not willing to stretch that into "the model learned an internal FSM" without stronger evidence.

## Visuals And Artifacts

The two most useful plots are:

- the long-trace answer metric over training, which shows how weak and unstable the larger-eval result really is,
- and the late-step probe plot, which shows the temporary improvement in `next_state` decodability around the middle checkpoint.

The tagged lab snapshot for this write-up is here:

- `exp-2026-03-28-fsm-state-probe`
- [github.com/curtiscovington/sae-interpretability/tree/exp-2026-03-28-fsm-state-probe](https://github.com/curtiscovington/sae-interpretability/tree/exp-2026-03-28-fsm-state-probe)

## Interpretation

My current read is:

- the smoke task was easy to overread,
- the larger long-trace evaluation says the model is not robustly solving the FSM problem,
- but the probes still show some transient internal structure that looks more like state-transition tracking than pure answer memorization.

That is a useful result even though it is not the clean win I originally wanted.

It suggests the training process may briefly pass through a regime where the model's hidden states contain a more explicit transition representation, and then fail to stabilize that into reliable long-horizon behavior. If that is right, the next round should probably focus less on brute-force tuning and more on inductive bias or curriculum.

This also matches the general spirit of two related lines of work:

- `Thinking Like Transformers` argues that transformer computations can often be usefully described in more structured algorithmic terms.
- `Finite State Automata Inside Transformers with Chain-of-Thought` reports explicit state-tracking circuits in transformer models on automaton-style tasks.

My result is much smaller and weaker than either of those stories. But it points in the same qualitative direction: there can be latent state-like structure inside the network even when end-task behavior is not fully convincing.

## Limitations

- The strongest probe result came from a smoke run, not the larger multi-seed eval harness.
- Linear probes measure decodability, not necessarily the causal computation the model is using.
- `current_state` being decodable at initialization means raw decodability alone is not enough evidence here.
- The `next_state` target has a relatively strong majority baseline, so apparent gains need to be interpreted conservatively.
- I only tested one tiny architecture family and one synthetic FSM setup.

## Next Steps

If I want a genuinely decent FSM model, I think the next useful steps are:

1. add a stronger inductive bias for state tracking instead of just training longer,
2. run the latent-state probe across larger-eval checkpoints and more seeds,
3. test whether the probe-positive checkpoint is causally special, not just more linearly readable,
4. and separate "representation briefly appears" from "representation supports stable long-horizon generalization."

That last distinction matters. Right now I have better evidence for the first than the second.

## References

1. Guillaume Alain and Yoshua Bengio (2016), *Understanding intermediate layers using linear classifier probes*.
   - [https://arxiv.org/abs/1610.01644](https://arxiv.org/abs/1610.01644)

2. Gail Weiss, Yoav Goldberg, and Eran Yahav (2021), *Thinking Like Transformers*.
   - [https://arxiv.org/abs/2106.06981](https://arxiv.org/abs/2106.06981)

3. Yifan Zhang, Wenyu Du, Dongming Jin, Jie Fu, and Zhi Jin (2025), *Finite State Automata Inside Transformers with Chain-of-Thought: A Mechanistic Study on State Tracking*.
   - [https://arxiv.org/abs/2502.20129](https://arxiv.org/abs/2502.20129)
