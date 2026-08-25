---
title: "I Put a Jacobian Lens on Gemma 4 31B. The Signal Got Stronger—and Less Specific."
description: "Scaling a Jacobian-lens experiment from Gemma E2B to 31B produced a preregistered 5.91x answer-rank advantage, but an answer-matched copying control was stronger."
date: 2026-08-25
tags:
  - ai
  - interpretability
  - transformers
  - gemma
  - mechanistic-interpretability
  - dgx-spark
reading_time: "10 min read"
og_image: "/img/posts/gemma-jacobian-lens-31b/gemma-jacobian-lens-31b-cover.png"
repo_card:
  url: "https://github.com/curtiscovington/gemma-jspace-demo/tree/v0.2.0"
  title: "Gemma Jacobian-lens scale study (tag: v0.2.0)"
  description: "Resumable E2B-to-31B fits, frozen batteries, preregistration, controls, and raw readouts."
huggingface_card:
  url: "https://huggingface.co/XROCRO/gemma-4-jacobian-lenses"
  title: "Gemma 4 31B Jacobian lenses"
  description: "Reusable 10–100-prompt FP16 lenses and resumable FP32 aggregate checkpoints."
---

Does a Jacobian lens become more useful when the model gets much larger—or does scale mostly make
the ordinary logit lens better?

My last Jacobian-lens experiment ended with that question and an obvious next step: try the same
measurement on a larger open model with enough memory to stop treating every gigabyte as a crisis.

So I moved the experiment from an RTX 3080 Ti to an NVIDIA DGX Spark, scaled the same controlled
protocol through Gemma 4 E4B, 12B, and finally 31B, and let the largest fit run for 36 hours.

The result was both stronger and less magical than I expected.

At one layer in Gemma 4 31B, a fixed Jacobian lens beat the ordinary logit lens on a fresh,
preregistered set of 100 direct object-location questions. Its median answer-token rank was
**5.91 times better**, the bootstrap interval excluded parity, and it won 65 of 100 paired cases.

Then the most important control did even better.

When I replaced each location question with an answer-matched prompt that simply asked the model
to retrieve a word already present in context, the Jacobian advantage increased to **9.54 times**.

That does not erase the signal. It changes what the signal most likely means.

**Code and results:** The scripts, frozen battery, preregistration, raw ranks, and negative controls
are pinned to [release tag v0.2.0](https://github.com/curtiscovington/gemma-jspace-demo/tree/v0.2.0).

![Gemma 4 31B Jacobian-lens scale-up: a fresh confirmatory signal, a stronger matched-retrieval control, and a narrower contextual-token-transport interpretation.](/img/posts/gemma-jacobian-lens-31b/gemma-jacobian-lens-31b-cover.png)

### TL;DR (Layman Version)

I built a mathematical readout that asks how activity inside a large Gemma model will flow toward
its eventual next-word scores. On 100 new questions, that readout exposed the expected answer more
clearly than a simpler baseline. But it helped even more when the task was just to copy a word from
the prompt.

So the lens appears to capture a real, reusable route for bringing context tokens toward the
output. It does **not** show that I found a location-reasoning circuit, a transcript of hidden
thought, or a universal workspace.

## What I Was Scaling

A logit lens takes an intermediate activation and decodes it as if the model were already done
processing. It is simple and useful, but it ignores every transformer layer that still comes next.

A Jacobian lens asks a more local question:

> If this intermediate activation changed by an infinitesimal amount, how would the model's final
> word scores change after the rest of the network processed it?

The Jacobian is the derivative of that downstream transformation. Averaging it over calibration
text produces a linear transport map from one internal layer toward a later layer where language
can be decoded.

In the [first post](/2026/08/11/gemma-jacobian-lens-on-gemma-4-e2b/), this method found a useful,
prompt-sensitive readout in Gemma E2B and a small causal probability shift. It did not reveal a
clean Jacobian-specific workspace band. The obvious possibilities were that the model was too
small, the calibration set was too small, or the 12 GB GPU forced the experiment into an
unhelpfully narrow part of the network.

The DGX Spark removed the hardware excuse. Its 128 GB coherent memory let me fit larger models,
retain gradients through the frozen network, and checkpoint matrices that would have been
impractical on the original machine.

This was still not fine-tuning. The Gemma weights never changed. I was fitting readout matrices,
not training the model.

## Setup

- **Hardware:** NVIDIA DGX Spark with 128 GB coherent memory.
- **Models:** instruction-tuned Gemma 4 E2B, E4B, 12B, and 31B at pinned Hugging Face revisions.
- **Calibration:** the same 100 short passages, with lenses saved at 10/20/35/50/75/100 prompts.
- **Readout layers:** five depth-matched source layers per model transported to its final stable
  target layer.
- **Primary comparison:** paired `log10(Jacobian answer rank / logit answer rank)` on fixed,
  held-out one-word prompts. Lower is better.
- **Controls:** identity transport, coordinate-shuffled Jacobians, and norm-matched random matrices
  where applicable.

Every long fit saved an atomic FP32 running sum after each prompt, then emitted compact FP16 lenses
and raw JSON readouts at the declared milestones.

## Bigger Models Did Not Produce a Simple Scale Curve

I first reran the same 100 calibration passages and 40 held-out one-word questions across E2B,
E4B, 12B, and 31B. Each model used five layers at approximately matched depth fractions. At every
milestone I compared the Jacobian lens with the identity-transport logit lens on exactly the same
prompts.

Negative values below favor the Jacobian lens. The “best layer” is descriptive—the layer with the
lowest paired median after the fact—not a universal layer selected in advance.

| Model | 100-prompt descriptive layer | Median log10(J-rank / logit-rank) | 95% bootstrap interval | J/logit/ties |
| --- | ---: | ---: | ---: | ---: |
| E2B | 8 | -0.763 | [-1.172, -0.456] | 34/6/0 |
| E4B | 26 | -0.699 | [-1.404, -0.540] | 35/5/0 |
| 12B | 43 | 0.000 | [0.000, 0.151] | 1/14/25 |
| 31B | 38 | -0.293 | [-0.452, 0.299] | 23/17/0 |

The clean story would have been a smooth improvement with parameter count. That did not happen.

E2B and E4B showed strong descriptive advantages at particular layers. The 12B model became so
readable near the end that the logit lens saturated at rank 1 and left little room for a learned
transport to help. The 31B model showed a modest possible advantage at layer 38, but its interval
still crossed parity.

Larger models often had stronger native late-layer representations. That can make the logit lens
better faster than it makes the Jacobian lens distinctive. “The model is easier to decode” and
“this particular lens is better” are not the same claim.

<!-- Suggested figure: four-model Track A milestone plot. Caption: “The paired Jacobian-vs-logit
effect does not improve monotonically with model size. Late-layer saturation is especially visible
in 12B.” -->

## The Interesting 31B Signal Was Narrower

The aggregate 40-question result hid a category split at layer 47.

On ten object-and-location prompts, the 100-prompt 31B Jacobian lens reached a median answer rank
of **345.5**, compared with **2,044** for the logit lens. On factual recall and basic
classification, the logit lens was substantially better. Arithmetic was close.

That made layer 47 interesting—but it was a discovery on a tiny subset. Treating those ten cases
as confirmation would have been the easiest possible way to fool myself.

Instead, I froze a new battery before evaluating it.

## A Fresh, Answer-Matched Confirmatory Battery

The new battery contained 300 prompts arranged as 100 triplets. Every triplet used the same answer
word in three conditions:

1. **Direct relation:** “The badge is inside the bag. Where is the badge?”
2. **Multi-step relocation:** “The badge started in the cart. It was then moved to the bag. Where
   is the badge now?”
3. **Matched token retrieval:** “The clerk wrote the verification word bag. What verification word
   was written?”

The third condition is the important control. It preserves the expected answer token and requires
contextual retrieval, but it removes the object-location relation I thought might be special.

I generated and hashed all 300 prompts, froze the layer-47 lens and model revision, and wrote down
the primary success criteria before running the model. I also disclosed that the hypothesis and
layer came from the earlier exploratory battery. This was post-discovery confirmation, not a
pristine first hypothesis.

The primary test required all three of the following on the 100 direct-relation prompts:

- a median Jacobian/logit rank ratio of at most 0.5;
- a bootstrap 95% interval entirely below parity; and
- an exact paired sign-test p-value below 0.05.

All three passed.

| Frozen layer-47 subset | J/logit/ties | Median J/logit rank ratio | Jacobian advantage | 95% ratio interval | Sign p |
| --- | ---: | ---: | ---: | ---: | ---: |
| Direct relation | 65/35/0 | 0.169 | 5.91x | [0.122, 0.574] | 0.00352 |
| Multi-step relocation | 65/35/0 | 0.131 | 7.65x | [0.080, 0.359] | 0.00352 |
| Matched token retrieval | 63/37/0 | 0.105 | 9.54x | [0.068, 0.348] | 0.0120 |

This is the strongest readout result in the project. It survived fresh prompts, a fixed layer, a
fixed lens, a confidence interval, and a paired test.

It also undermined the most tempting interpretation.

<!-- Suggested figure: three-condition forest plot of median rank ratios. Caption: “All three fresh
conditions favor the fixed layer-47 Jacobian lens, but the answer-matched retrieval control shows
the largest advantage.” -->

## Passing the Primary Test Was Not the End of the Test

If layer 47 carried a special object-location representation, the direct and relocation prompts
should have enjoyed an advantage beyond the matched copying control.

They did not.

Within each answer-matched triplet, I compared the direct-relation log rank ratio with the control
log rank ratio. The median direct-minus-control contrast was **+0.248 log10 units**, with a 95%
bootstrap interval of **[+0.108, +0.372]**. Negative values would favor a relation-specific
Jacobian advantage. The observed interval was entirely positive.

In plain language: the Jacobian lens helped most when the answer word was simply available to be
retrieved from context.

The honest interpretation is therefore narrower:

> Gemma 4 31B layer 47 contains a robust transport signal that makes a contextually relevant token
> easier to recover than an identity-transport logit lens does.

That may still be useful. Contextual retrieval and copying are central operations in language
models. A lens that captures their downstream transport could become a live diagnostic: show which
prompt tokens are being routed toward the answer as a conversation unfolds.

But it is not evidence for a dedicated location-reasoning mechanism. It is certainly not enough
to establish the full global-workspace properties reported in
[the work that inspired this study](https://transformer-circuits.pub/2026/workspace/index.html).

## The 36-Hour Fit—and the Reboot That Did Not Ruin It

The 31B fit made the difference between inference and interpretability compute very concrete.

Ordinary inference runs the network forward. This experiment repeatedly propagated derivative
information from five source layers—14, 27, 38, 47, and 55—to target layer 59. At
`dim_batch=1`, each calibration prompt took an average of **1,300.88 seconds**. The 100-prompt fit
took **36.14 hours** and peaked at **63.13 GB** of PyTorch allocation.

The saved FP16 lens is about 289 MB. The resumable FP32 running sums are about 578 MB. Those are
small compared with the model, but expensive to produce.

Halfway through, the experiment also became a systems test. While Gemma held roughly 63 GB in the
Spark's shared memory pool, another local service tried to load a 284B GGUF model with an enormous
context. The NVIDIA driver ran out of memory, the machine became unresponsive, and I eventually
had to reboot it.

The fit survived because it wrote an atomic checkpoint after every prompt. The prompt-6 checkpoint
was finite and complete, so the service resumed from prompt 7 instead of starting over. Afterward I
paused other model-serving services during the long fit.

The lesson is mundane and important: on a unified-memory machine, “another model fits by itself”
does not mean it can safely coexist with a long gradient job. Freedom to run everything is useful;
resource isolation and resumable checkpoints are what keep that freedom from destroying a day of
work.

<!-- Suggested figure: runtime and memory panel. Caption: “The final 31B fit averaged 21.7 minutes
per calibration prompt. Atomic per-prompt checkpoints allowed a clean recovery after system-wide
memory exhaustion.” -->

## Was 100 Calibration Prompts Enough?

Enough for this result, yes. Enough forever, no.

At prompt 100, the latest layer-47 contribution changed the running mean matrix by about 1%. That
is a useful convergence sign, and the confirmatory result was measured on 300 completely new
prompts. Fitting another hundred calibration passages would have been much less informative than
spending that compute on a larger held-out battery with an answer-matched control.

Convergence should decide this question, not a round number. More calibration may still improve
the matrix, but it cannot rescue the relation-specific story from a control that already produced
a stronger effect.

## Reproducibility and Artifacts

The 31B run used `google/gemma-4-31B-it` at revision
`842da3794eaa0b77d5f08bae87a17459d91ff475`. The frozen battery SHA-256 is
`7716882e2c23963bca04e6a55c9f61c873f40582d8b43eb1b1d5239bf7c1c73a`; the final FP16 lens
SHA-256 is `6d4dc94b50cd899f7b7ec6c4c35e1a1af9a84ff029688159f8308e27817ec183`.

Release v0.2.0 includes:

- the [frozen preregistration](https://github.com/curtiscovington/gemma-jspace-demo/blob/v0.2.0/artifacts/confirmatory/31b-preregistration-v1.json);
- the [300-case battery](https://github.com/curtiscovington/gemma-jspace-demo/blob/v0.2.0/artifacts/confirmatory/31b-battery-v1.json);
- the [complete confirmatory readout](https://github.com/curtiscovington/gemma-jspace-demo/blob/v0.2.0/artifacts/readouts/32-31b-confirmatory-v1.json); and
- a compact [human-readable result report](https://github.com/curtiscovington/gemma-jspace-demo/blob/v0.2.0/outputs/31b-confirmatory-report.md).

The multi-hundred-megabyte lenses and resumable FP32 sums live in a separate model-artifact
repository rather than Git. Every stored tensor was verified against its local content hash.

## What This Experiment Established

It established that:

- a 100-prompt Jacobian lens can be fitted reproducibly on Gemma 4 31B with consumer-accessible
  workstation hardware;
- a post-discovery layer-47 signal replicated on 100 fresh direct-relation prompts;
- the fixed Jacobian lens produced a large paired answer-rank advantage over the logit lens in
  that condition; and
- the same transport was at least as useful for multi-step relocation and even more useful for
  explicit contextual token retrieval.

## Limitations

It did not show:

- a monotonic relationship between model size and Jacobian-lens quality;
- a location-specific representation at layer 47;
- that the lens reads a format-independent hidden answer;
- that this transport is causally necessary for the model's behavior;
- a universal J-space or model-wide global workspace; or
- anything about consciousness.

The primary preregistered test passed. The broader interpretation got narrower. Those statements
can both be true.

## Where I Would Take It Next

The lens artifacts are now worth using rather than merely archiving. My next step would be a live
viewer attached to a normal inference server: as I talk to Gemma, capture selected residual states
and display the layer-47 Jacobian projection beside the ordinary logit lens. That would test whether
the contextual-retrieval interpretation appears in natural conversations rather than only in
one-word synthetic prompts.

The stronger scientific follow-ups would be:

1. Freeze a natural-text retrieval battery where the relevant token appears far from the answer
   boundary and competes with plausible distractors.
2. Test paraphrases and answer formats to measure how stable the layer-47 advantage really is.
3. Intervene along fixed, cross-prompt directions and measure whether retrieval succeeds or fails,
   rather than only reading token ranks.
4. Compare the same lens with stronger tuned-lens and probe baselines, not only identity transport.
5. Repeat the answer-matched battery on another 31B checkpoint to separate architecture from one
   model revision.

The public repository contains the scripts, exact prompt hashes, raw JSON/CSV readouts, and frozen
analysis plan. The large tensor checkpoints are separately archived with content hashes so the lens
can be reused without pretending Git is a model registry.

## TL;DR

**Scaling to Gemma 4 31B produced a real, preregistered Jacobian-lens signal. The control that made
the claim smaller also made the result better: this looks less like a special reasoning workspace
and more like a measurable transport route for contextually relevant tokens.**
