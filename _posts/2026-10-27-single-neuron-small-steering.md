---
title: "Can One Neuron Make Qwen Describe Smaller Things?"
description: "Changing one neuron made Qwen describe smaller creatures and objects. I read all 448 replies to find out how well it worked."
date: 2026-10-27
tags:
  - ai
  - interpretability
  - activation-steering
reading_time: "10 min read"
repo_card:
  url: "https://github.com/curtiscovington/small-neuron-steering/tree/v1.0.0"
  title: "Small-Neuron Steering"
  description: "Steering code, fixed prompts, saved results, and reproducible analysis."
og_image: "/img/posts/single-neuron-small-steering/social-preview-v2.png"
---

Can changing one number inside a language model make the things it describes smaller? On my DGX Spark, I found a neuron in Qwen3-8B that did just that—often enough to make the effect worth following.

**TL;DR:** With steering turned on, reviewers judged the main subject clearly small in **35–43 of 64 replies**, compared with **4–9 of 64** without it. All three found the same broad pattern. It worked well for these creature and object descriptions, though it was far from an every-prompt size switch.

<figure>
  <img src="/img/posts/single-neuron-small-steering/social-preview-v2.png" alt="Comic illustrating the single-neuron experiment: changing one neuron, comparing creature descriptions, and reviewing 448 replies. Human ratings found clearly small subjects in 9 of 64 baseline replies and 43 of 64 steered replies.">
  <figcaption>The cover shows my human ratings. The original AI reviewers counted 35–36 small subjects with steering and 4–5 without it.</figcaption>
</figure>

## Why I Tried This

This experiment was inspired by [Sauers’ single-neuron steering post](https://x.com/Sauers_/status/2114565634789142785) and examples combining single-neuron effects such as tiny, cat-like, and magical. I wanted to find controls like those myself.

It continues a thread from my earlier experiments. In [*AI Brain Surgery on a Small Model*](/posts/ai-brain-surgery-feature-knobs/), I tried changing a learned feature in Pythia-70M. In [*Hardening SAE Steering on Gemma*](/posts/gemma-pretrained-sae-steering-plan/), stricter tests weakened most of the promising effects; code was the strongest survivor. The [Gemma poetry experiment](/posts/nla-gemma3-natural-language-autoencoder-poetry-probe/) raised a similar problem: changing the model’s word probabilities does not always change what it actually writes.

This time, I wanted to judge the replies themselves.

## Finding A Lead

I started by measuring which neurons responded differently to examples of a concept and contrasting examples. The aim was a searchable map of possible controls, from size and personality to profanity. That produced plenty of leads, but recognizing a concept and controlling it turned out to be different things.

The clearest lesson came from a profanity candidate. It passed the early scoring tests, yet **none of its next 98 replies to neutral prompts contained a swear word**. A later quick check with more suitable prompts produced one match in 14 replies—no better than some random controls. That small check gave me little reason to pursue the lead, rather than definitively ruling it out.

Smallness was another lead from that map. After the profanity result, I compared actual replies from three size-related neurons. One at **layer 17, neuron 11605** looked strongest.

The early screen counted size words, so a large machine with “tiny gears” could count as a hit. I chose layer 17 after seeing these results; the table explains how I picked the lead, rather than proving that it worked.

| Neuron | Steering Toward Small | Reverse Direction | No Steering | Best Random Control |
|---|---:|---:|---:|---:|
| Layer 17, neuron 11605 | 7/14 | 0/14 | 1/14 | 2/14 |
| Layer 21, neuron 9409 | 5/14 | 0/14 | 1/14 | 1/14 |
| Layer 24, neuron 5072 | 2/14 | 1/14 | 1/14 | 1/14 |

Each candidate was compared with two random neurons, each tested in both directions. “Toward small” was the direction selected in earlier tests; the reverse direction was not necessarily a reliable way to make things large.

![Size-word matches across three candidate neurons and control conditions.](/img/posts/single-neuron-small-steering/transfer-counts.png)

The earlier measurements were mixed: layer 17 distinguished smallness examples strongly enough to pass one test, but not another. I needed to find out whether changing it consistently made the main subject small.

## What Changing A Neuron Looks Like

One prompt asked:

> Describe the appearance of a fictional animal glimpsed beyond a greenhouse window in two sentences.

Without steering, the reply began with “A shimmering, iridescent creature with translucent wings…” and gave no clear indication of smallness.

Adding to the neuron’s activity produced:

> A small, iridescent creature with translucent wings flickered just beyond the glass, its body shimmering like oil on water.

Subtracting from it produced:

> A massive, iridescent creature with translucent, jellyfish-like skin glides silently through the mist, its elongated body shimmering in hues of violet and silver.

That was the kind of change I was looking for: the animal itself became small or massive. But the example also shows that other details can change along with size.

## How I Tested It

I used **Qwen3-8B on a DGX Spark**, adding about **8.33** to the activity of layer 17, neuron 11605 while it read and wrote text. This changes a value during generation; it does not retrain the model.

The +8.33 was a strong push: roughly eight standard deviations of the discovery sample, which contained 160 tokens. I selected that strength during discovery and kept it fixed for this test.

I then used 64 fresh prompts: 32 about fictional creatures and 32 about objects. Each prompt ran seven ways:

- No steering.
- The selected neuron, increased and decreased.
- Two random neurons in the same layer, each increased and decreased.

That gave me **448 replies**, generated in about **38 minutes**. None hit the 160-token limit.

Before generating them, I saved the prompts, settings, rating rules, and passing criteria. The main question was simple: **Is the main subject clearly physically small?** Small eyes, gears, or decorations did not count. Neither did uncertain size.

To pass, steering had to beat no steering and all four random settings by at least 15 percentage points, with statistical support for every comparison. At least 58 of its 64 replies also had to be coherent, complete, and free of flagged problems. I chose that quality bar beforehand as a practical standard for usability.

<details markdown="1">
<summary>Technical setup and statistical test</summary>

The model was Qwen/Qwen3-8B in BF16, with greedy decoding and thinking disabled. Layer and neuron numbers are zero-based. The offset is added to the MLP intermediate activation, `SiLU(gate_proj(x)) * up_proj(x)`, immediately before `down_proj`, on both prompt and generated tokens.

For calibration, I recorded this neuron’s activity on the answer tokens in the supplied positive and contrasting discovery examples, without steering. The sample standard deviation across those 160 tokens was about 1.04; multiplying it by eight gave +8.33. This describes that small discovery sample, not a typical range for all conversations.

The random neurons were N12170 and N2750, with calibrated offsets of approximately ±8.72 and ±7.98. The selected neuron used approximately ±8.33. Exact values and the model revision are saved in the [frozen protocol](https://github.com/curtiscovington/small-neuron-steering/blob/v1.0.0/protocols/followup-protocol.json).

The five planned comparisons used one-sided paired tests with Holm correction at 0.05, plus the 15-percentage-point minimum effect. The quality rule required coherence of at least 4, no unwanted-issue flag, and no truncation in at least 58/64 replies. The saved protocol hash is `09e7aaddfddb2db11f0a12b439da779ec1701bf5d2be22f0c439131fd2a6ebdc`.

</details>

## Reading All 448 Replies

I rated every reply myself. It was exhausting, but valuable: reading them exposed assumptions that a word counter would miss.

Codex and Qwen 27B also rated all 448 replies. My review screen hid which steering setting produced each answer, and the AI reviewers were not given that information either.

This was not a fully blind review. I had seen interim results and earlier explanations; Codex had also seen a small sample of Qwen’s judgments. I saved each answer before revealing Qwen’s judgment for that reply, and any later change of mind was stored separately. The three reviewers assessed the same replies, so they provide different perspectives on one experiment, not three separate experiments. Qwen 27B also belongs to the same model family as the Qwen3-8B being tested, so it may share some of its assumptions.

The counts below mean **“the reviewer judged the main subject clearly small.”** They describe this set of creature and object prompts.

| Setting | Me / 64 | Codex / 64 | Qwen 27B / 64 |
|---|---:|---:|---:|
| Selected neuron, increased | **43** | **35** | **36** |
| No steering | 9 | 4 | 5 |
| Selected neuron, decreased | 4 | 1 | 4 |
| Random neuron 1, increased | 9 | 3 | 3 |
| Random neuron 1, decreased | 15 | 5 | 9 |
| Random neuron 2, increased | 6 | 3 | 4 |
| Random neuron 2, decreased | 14 | 8 | 10 |

![Original human, Codex, and Qwen ratings: steering increased clearly-small descriptions, with 95% Wilson intervals shown for each proportion.](/img/posts/single-neuron-small-steering/main-results.png)

*The lines show 95% Wilson intervals for each count out of 64. They assume independent observations and are descriptive for this authored prompt set, whose related prompts may violate that assumption. The paired comparisons below test the steering difference.*

The pattern was consistent: increasing the selected neuron produced many more small subjects than any other setting. In my ratings, that was a **53-percentage-point increase** over no steering. The increase appeared in both creatures and objects.

The random controls were not inert. Decreasing them produced 15/64 and 14/64 small judgments from me, above the 9/64 baseline; both AI reviewers also rated those settings above baseline. The selected neuron still led by a wide margin, but these counts alone cannot tell us whether the smaller shifts reflect a general steering effect or variation in these prompts. One possibility is that a large negative offset makes descriptions plainer or less grand, which reviewers may read as smaller. I have not measured that; more random controls and separate style ratings would help test it.

All three reviewers’ results passed the planned statistical and quality checks. My least favorable comparison still had an adjusted **p-value of 2.89 × 10⁻⁸**. That is strong statistical evidence for a difference within this test; it does not tell us how well the effect carries into other conversations.

The quality rule passed for **64/64 replies under my ratings, 63/64 under Codex, and 64/64 under Qwen**, against the required 58. It combined coherence, flagged problems, and truncation; it did not measure whether size was the only thing that changed.

## What Counts As Small?

Some disagreements were more interesting than the agreement score.

A three-foot brass machine seemed small to me relative to machinery. Both AI reviewers treated its size more conservatively. A delicate glass instrument with narrow openings suggested small laboratory equipment to me, while the reviewers saw an object whose overall size was unspecified.

The prompts contributed to this. “Hand tool” already suggests something a person can use. Giving every setting the same prompt makes the comparison fair, but it does not make the prompt neutral about size. I kept those examples rather than removing awkward cases after seeing the results.

## Giving Qwen Clearer Instructions

After looking at the disagreements, I asked Qwen 27B to review the same replies again with clearer guidance. I wrote the revised guidance after seeing our disagreements. This was an exploratory re-rating of the same replies, not independent confirmation; the original ratings stayed unchanged.

The new instructions used ordinary human scale as a reference. A familiar small animal could qualify without the word “tiny”; a cat-sized subject counted as small. Small parts still did not imply a small whole, and words such as “delicate” or “slender” were not enough on their own.

Qwen completed the new pass in about **74 minutes**.

| Setting | Original Qwen / 64 | Guided Qwen / 64 | Me / 64 |
|---|---:|---:|---:|
| Selected neuron, increased | 36 | **42** | 43 |
| No steering | 5 | **7** | 9 |

The largest random-control count under the revised guidance was 11/64. The main effect remained clear.

Guided Qwen agreed with me on whether a reply was clearly small in **417 of 448 cases, or 93.1%**. Agreement across all three choices—clearly small, uncertain, and not clearly small—was much lower at **57.8%**. We often agreed that an example did not qualify, but disagreed about whether its size was uncertain or simply unsupported. The 93.1% includes **340 replies neither of us called small**. Among the **108 replies either of us called small, we both did so on 77 (71.3%)**. Cohen’s kappa, which adjusts agreement for the reviewers’ overall label frequencies, was **0.79** for the two-way decision. These measures describe agreement, not correctness.

## Limitations And Next Steps

This neuron made small descriptions more common, but it did not make them inevitable. Even with steering, I judged only about two-thirds of the replies clearly small. It also failed to produce the tiny-assistant persona that first caught my attention, and size changes sometimes came with changes to anatomy, abilities, or other details.

I did not separately rate “clearly large,” so the reverse-direction examples do not establish a reliable small-to-large dial. I also have not measured whether cuteness, delicacy, fantasy tone, or reply length changes alongside size. The effect could involve a bundle of those traits. Those are useful follow-up questions, with rating rules set before testing new replies.

The test used one model, one generation setup, a narrow set of prompts, and only two random neurons. The next useful step is a fresh test with more random controls and a deliberate mix of prompts that suggest small things, large things, or neither. I would define the size reference before writing those replies.

If the advantage disappears on those new prompts, or comes at the cost of worse writing, I would narrow or drop the claim. For now, I have a useful result to investigate: changing one neuron noticeably shifts the size of the creatures and objects Qwen describes.

## Related Papers

These papers helped shape the experiment.

- Turner et al., [*Steering Language Models With Activation Engineering*](https://arxiv.org/abs/2308.10248) (2023, revised 2024). Introduces ActAdd, which builds steering vectors from contrasting prompt activations. It explores changing model behavior during generation; my experiment applies that idea to one neuron.
- Gurnee et al., [*Finding Neurons in a Haystack: Case Studies with Sparse Probing*](https://arxiv.org/abs/2305.01610) (2023). Uses sparse probes to locate feature-related neurons. It helped frame the difference between recognizing a concept and controlling it.
- Fedzechkina et al., [*ExpertLens: Activation steering features are highly interpretable*](https://arxiv.org/abs/2502.15090) (2025). Studies concept representations through neurons identified by a “finding experts” method and compares their organization with human behavioral data. This connects most directly to the longer-term goal of a concept atlas.
- Liu, [*Leverage Is Not Reach: A Control-Window Law for Single-Neuron Steering in Language Models*](https://arxiv.org/abs/2606.19831v1) (2026 preprint). Proposes a framework for the range of interventions that can change behavior while preserving coherence, with a held-out evaluation on 15 neurons. It explores how steering strength affects both behavior and writing quality.
