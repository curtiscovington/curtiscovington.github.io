---
layout: post
title: "With Shared Controls, My Pokémon Script Beat My Local Model"
description: "In 45 one-hour Pokémon Red runs, a route-and-combat script earned 12 badges in 15 attempts. The local model earned none. A follow-up on baselines, broken controls, and a result that did not reproduce."
date: 2026-10-17
reading_time: "13 min read"
og_image: "/img/posts/pokemon-red-fixed-controls/social-preview.png"
og_image_width: 1536
og_image_height: 1024
repo_card:
  url: "https://github.com/curtiscovington/pokemon-red-agent-lab-results/tree/main/results/fixed-controls"
  title: "Pokémon Red: Fixed-Controls Results"
  description: "All 45 runs, original logs and frames, frozen controls, and reproducible audits."
tags:
  - ai
  - agents
  - evaluation
  - local-ai
  - dgx-spark
---

How much did the model add once I gave it working controls for Pokémon Red?

In [my first experiment](/posts/pokemon-red-one-hour-agent-lab/), a local model earned four Boulder Badges across eight one-hour runs. I had spent much of that exploration repairing the software around it: walking through doorways, finding useful interactions, and preserving destinations through battles. The next question was whether a model was needed to make good use of those controls.

I ran a fresh comparison: **15 runs with random choices, 15 with a deterministic script, and 15 with the same pinned local model.** Every run started in the bedroom and received one hour of wall-clock gameplay.

The script earned **12 badges out of 15**. The model earned **zero**. Random also earned zero.

That is a useful result, and an uncomfortable one. Building a stronger baseline changed what I could say about the model. It also exposed a second question: why had the earlier model wins stopped reproducing?

![A black-and-white research comic comparing random, scripted, and model policies over shared Pokémon Red controls: 0, 12, and 0 badges respectively in 15 runs each.](/img/posts/pokemon-red-fixed-controls/social-preview.png)

## TL;DR

A script with explicit route knowledge and damage-aware move selection beat this local model under the same assisted controls. The script earned 12 badges in 15 runs; the model earned none. The four model wins from the first post remain verified, but did not reproduce in twenty later runs across two batches. **A working agent demo becomes much more informative when it has to beat a competent baseline.**

## What I Held Fixed

This was still the local DGX Spark setup from the first post: Pokémon Red in a Game Boy emulator, with software that could walk to local destinations, advance ordinary dialogue, select named battle moves, track objectives, and restrict repetitive interactions.

Those helpers matter. Choosing “go to this exit” can execute several steps. Choosing a named move can open the battle menu and select it. This comparison asks which decision policy makes better use of that assistance.

| Setting | Final comparison |
|---|---|
| Policies | Random, route-and-combat script, local model |
| Runs | 15 per policy; 45 total |
| Start | The same bedroom save, reset for every run |
| Budget | 3,600 seconds of wall-clock gameplay |
| Primary outcome | Boulder Badge observed in game state before the deadline |
| Model | Local `qwen3.8-flash-next:iq4_nl` tag, pinned to the same digest as the first post |
| Inference | Thinking off; temperature 0.2; 8,192-token context; 64-token output limit |
| Shared assistance | Observations, offered actions, objectives, walking, dialogue, memory, and recovery controls enabled for all three policies |

The run order rotated across 15 three-policy blocks, giving each policy five appearances in each order position. Loading and warmup happened outside the gameplay budget. The non-model policies received no artificial thinking delay; their faster selection was part of the system being tested.

The seed IDs organized the blocks and seeded random-policy choices. They did not reseed the game's encounter RNG. Each policy's inputs and timing could produce a different trajectory from the same save.

I froze the final controls and configuration before starting the replacement batch. The source hashes still matched when it finished on October 17. The [protocol](/assets/data/pokemon-red-fixed-controls/protocol.md) records the details; the earlier post's [model provenance record](/assets/data/pokemon-red-one-hour-agent-lab/model-and-protocol.json) identifies the imported weights.

## A Baseline Has To Be Competent At Something

Before the final comparison, I ran a 15-run pilot: five random, five original-script, and five model runs. Its model arm earned zero badges. Those are the 0/5 pilot runs in the historical table below; they are separate development data, not part of the final 45.

My first scripted policy was too weak to answer the question I cared about. It chose the first usable attack and ranked destinations using their offered labels. In Viridian City, its preference for a northward passage beat an unnamed building exit. That exit was the Mart, where it needed to collect Oak's parcel.

A model outperforming that script would have been easy to celebrate and hard to interpret.

I added explicit route knowledge: visit the Mart, speak to the clerk, observe the parcel in the bag, return to Oak, verify delivery and Pokédex receipt, then continue through the forest toward Pewter. The route-informed script completed delivery in all five development runs and entered Pewter Gym in four. None earned a badge.

Watching those runs exposed another weakness: the script kept selecting Scratch even after learning Ember.

The next version scored available attacks using move power, type matchups, same-type attack bonus, accuracy, remaining PP, and an estimate of damage against the observed opponent. It used Pokémon Red's physical/special split and public species data to estimate stats absent from the shared observation. The [pinned Pokémon Red disassembly](https://github.com/pret/pokered/tree/af519899719f0754965776faac0e836a3b906e6d) supplied the move, type, and species tables.

This was a practical immediate-damage heuristic, not an optimal battle planner. It did not plan several turns ahead or fully model stat changes and every move effect. It did, however, stop treating the first attack in the menu as the best attack.

The stronger script had explicit prior knowledge of the game. The model received screenshots and structured observations; the script ignored the pixels and used fixed route and combat rules. The shared interface was held fixed, while the policies brought different knowledge and decision costs to it.

## Why I Restarted the Batch

The first longer comparison exposed another interaction bug. The script stood inside Pewter Gym with a healthy Charmander, trying to approach Brock. The shared repetition safeguard had removed Brock from the offered destinations. The script's fallback was to wait.

The safeguard had retained an old count of apparently unproductive conversations across a battle. After healing restored the earlier party state, that old restriction became applicable again. Waiting could not change the state needed to release it.

The repair made observed progress invalidate stale interaction counts and made battle entry clear the relevant conversation history. I also gave the script a fallback that chose another offered destination instead of waiting indefinitely. An isolated replay of the stuck save reached Brock, began the battle, and used Ember.

Because one fix changed the shared controls, I stopped that batch and restarted all three policies under the corrected version. The stopped batch contained five completed scripted runs, four of which had earned badges, plus an interrupted sixth scripted run. Both its wins and its failures are excluded from the final comparison. The random and model runs from that batch are excluded too.

This was another outcome-driven development correction. The fresh batch kept that tuning separate from the fixed 45-run comparison; it did not make the development history disappear.

## The Final 45 Runs

All 45 runs completed their one-hour budgets.

| Milestone within one hour | Random | Script | Model |
|---|---:|---:|---:|
| Starter obtained | 15/15 | 15/15 | 15/15 |
| Parcel collected | 5/15 | 15/15 | 15/15 |
| Pokédex receipt observed | 1/15 | 15/15 | 14/15 |
| Pewter City reached | 0/15 | 15/15 | 13/15 |
| Pewter Gym entered | 0/15 | 15/15 | 9/15 |
| Boulder Badge earned | 0/15 | 12/15 | 0/15 |

[Download the per-run results](/assets/data/pokemon-red-fixed-controls/runs.csv) or the [aggregate analysis](/assets/data/pokemon-red-fixed-controls/aggregate.json).

The model was much more useful than random choices for getting through the early game. It collected the parcel in every run and reached Pewter in 13. But reaching the city and finishing the gym were different hurdles: only nine model runs entered the gym, and none finished with a badge.

The script reached Pewter and entered the gym in every run. Its twelve badge wins took 37:27–54:29, with a median of 48:34 among the successful runs. All three failures encountered Brock's Geodude, and two also encountered Onix. Their failure causes have not yet been isolated; reaching Brock was not sufficient to finish within the hour.

That median leaves out three failures, so it is not the whole policy's average completion time. For an all-run timing summary, I capped observation at one hour and kept unreached badges censored at that limit. The script's restricted mean time was 50:05; with no observed badges, both other policies remained at the 60:00 censoring limit.

The script was already ahead before Brock. It reached Pewter in all 15 runs, averaging 25:44 (median 25:31). The model's 13 arrivals averaged 41:31 (median 38:41); its other two runs never arrived. Keeping those two failures in the all-run restricted mean gives 43:59 for the model, versus 25:44 for the script. The model's median decision latency was about 1.87 seconds (the median of the 15 per-run medians). These timing differences combine decision speed with route and battle choices; latency alone does not tell us how much of the arrival-time gap came from inference.

![Pewter, gym, and badge times for all 45 runs. Each policy has 15 points per milestone; crosses at 60 minutes indicate non-arrivals.](/img/posts/pokemon-red-fixed-controls/milestones.png)

*All runs start in the bedroom. Circles show observed milestones; crosses at 60 minutes mark unreached milestones, not completions. [Underlying per-run data](/assets/data/pokemon-red-fixed-controls/runs.csv).*

The primary comparison was model versus script on badge completion. The pre-specified two-sided [Fisher exact test](https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.fisher_exact.html) gives p ≈ 0.0000105. The script's success rate was 80%, with a 95% [Wilson interval](https://www.itl.nist.gov/div898/handbook/prc/section2/prc241.htm) of approximately 55–93%. For the model's zero successes, the interval is approximately 0–20%.

That is a large observed difference between these configurations. The assumptions behind turning repeated local runs into population estimates belong alongside it.

## Back At The Gym Guide

One model run arrived early enough to make the remaining time feel generous. Run 17 entered Pewter Gym at 27:35, leaving more than half an hour to finish.

At 27:46, it selected the gym guide. At 57:37, it selected the same guide for the tenth time. The saved frame returned to the familiar greeting: “Hiya! I can tell you have what it…” The clock had moved; the conversation was starting again.

<figure>
  <img src="/img/posts/pokemon-red-fixed-controls/gym-guide-run17.png" alt="Original frame after model run 17’s tenth gym-guide selection: the player faces the guide near the entrance and the guide starts his greeting again." width="320" height="288" style="image-rendering: pixelated; border-radius: 0;">
  <figcaption>Run 17, after its tenth explicit guide selection at 57:37. Original frame 000530.png; the guide is near the entrance, not Brock. <a href="https://github.com/curtiscovington/pokemon-red-agent-lab-results/blob/main/results/fixed-controls/README.md">Trace provenance</a>.</figcaption>
</figure>

Three of the nine model runs that entered the gym never encountered Brock's Geodude. Two of those three selected the guide more than once: run 17 made ten selections and run 35 made two. Run 28 selected the guide once. The latter two entered the gym at 54:07 and 54:41, leaving much less time than run 17. These are explicit destination selections, not counts of every conversation or proof that guide visits caused all three failures. Run 17 is the clearest repeated-guide example, rather than a pattern shared equally by all three.

## What Happened To The Earlier Four Model Badges?

The first post's record stands; my interpretation of it is weaker. I went back to the records rather than treating the newer batch as a correction to it.

| Model experiment | Badge results |
|---|---:|
| First post: recovery controls enabled | 3/4 |
| First post: recovery controls disabled | 1/4 |
| Subsequent baseline pilot | 0/5 |
| Latest fixed comparison | 0/15 |

I checked original event logs, explicit award dialogue, final observations, and independently loaded the saved emulator states for all 28 model runs across those three batches. The four earlier winners had both badge-award dialogue and a Boulder Badge in their saves. The later twenty saves had none. The [cross-check](/assets/data/pokemon-red-fixed-controls/model-badge-crosscheck.json) preserves the evidence references.

The earlier winning runs first recorded their badge states at 49:39, 55:06, 58:23, and 59:59. All were within the one-hour limit. That includes a very narrow final win, where the award dialogue appeared before the badge-state observation.

The model digest and core inference settings matched the inspected records. Seed IDs and harness versions differed. The earlier successes have not reproduced, and I have not yet isolated why.

All twenty later model runs had recovery controls enabled. The earlier 3/4 versus 1/4 result now looks much less persuasive as evidence of a durable recovery benefit. It could reflect small-sample variation, or a benefit that does not survive changes in the surrounding system. Since the later batches did not include a recovery-off model arm, they cannot isolate the recovery rules' effect.

The gym-entry change is the clearest lead before the battle: all eight model runs in the first post entered the gym, compared with only nine of fifteen here. Restricting the earlier comparison to recovery-enabled runs gives 4/4 versus 9/15. The uniform audit found Brock's Geodude in all four earlier recovery runs but only six of the latest fifteen. The loss of opportunities begins before Brock's battle, so investigating attack choice alone would miss part of the decline.

A summary table cannot tell me whether the later runs lost their time on route choices, recovery, conversations, battle decisions, or some interaction among them. That requires comparing traces and replaying controlled differences. I would not explain away this change as ordinary randomness without doing that work.

## What I Take From This Result

The first exploration taught me to check the controls before blaming the model. This follow-up adds a second check: once those controls work, see what simple software can accomplish with them.

The script's result establishes that this final assisted setup can reach the first badge reliably enough to win twelve of fifteen attempts. It does not attribute those wins to one feature. Explicit routing, combat rules, and faster decisions arrived together in the stronger policy.

That distinction changes the next engineering question. I no longer need to ask a model to prove it can perform every routine decision in this particular route. I need to find decisions where it improves on the script: adapting to an unfamiliar state, choosing a better recovery, or pursuing a goal outside the programmed route. Those are hypotheses for another comparison, not benefits demonstrated here.

## Limitations

This study compares one model configuration with two specific policies under substantial Pokémon Red assistance. The script was revised using development failures; the shared controls were originally developed around the model. Neither policy is a neutral measure of general game-playing ability.

Fifteen repetitions per policy still leave wide rate intervals. The exact test assumes an appropriate independent-trial model, while these runs reused one save and did not independently seed game worlds. The test is evidence about this repeated local setup under those assumptions, not proof of performance across games, machines, models, or starting conditions. Random sampling was uniform over offered action strings, including aliases and ineffective choices; it was a low-information reference, not a competent player.

I applied the same full-log checks to all 45 runs, including successes: badge state and award dialogue, offered-action legality, Brock/Onix encounters, named moves and guide visits, observed healing, navigation outcomes, and errors. All twelve script wins have award dialogue and matching final badge observations. The model saves received the independent replay check described above. The [uniform audit and its implementation](https://github.com/curtiscovington/pokemon-red-agent-lab-results/tree/main/results/fixed-controls) preserve deterministic first/every-100th-request context samples as well. This meets the first post's uniform log-audit scope; neither audit is an exhaustive manual review of every frame. The original machine-generated per-run audit files still mark exhaustive manual review as pending; those fields are separate from this completed uniform log audit.

Three timeout events occurred in random runs: two at the one-hour deadline and one observation timeout during play. All runs completed, and none were marked resource-affected. The [results repository](https://github.com/curtiscovington/pokemon-red-agent-lab-results) now includes all 45 runs' original decision logs, saved frames, metrics and frozen source, with archive/member hashes and reproducible audit instructions. ROMs and emulator saves remain excluded.

Finally, the larger gap does not resolve the model's decline from the first post. Its cause remains a separate investigation.

## What I Would Test Next

The frozen protocol, per-run results, original logs, and uniform audit are now together in the results repository. The next step is a targeted causal investigation, building on those common checks.

Compare the earlier winning model runs with the later failures, using saved-state replays to isolate changes in controls and decision inputs. Establishing whether there is a regression is more useful than immediately trying another model.

After that, a focused hybrid comparison would be worthwhile: keep routine routing and combat in software, and call the model only at clearly defined exceptions. Measure whether those calls improve completion or recovery time over the script alone.

The first post ended with four model badges. This one ends with a stronger baseline and a harder question. **The model has to demonstrate where it adds value beyond the software I already know how to write.**
