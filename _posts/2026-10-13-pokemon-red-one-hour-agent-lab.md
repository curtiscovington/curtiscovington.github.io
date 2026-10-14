---
layout: post
title: "I Gave a Local Model Pokémon Red. Then I Started Fixing What Held It Back."
description: "From slow button presses to four badge-winning runs out of eight: an exploratory local Pokémon agent study, with controller repairs, an unsuccessful recovery experiment, and an eight-run confirmation."
date: 2026-10-13
reading_time: "14 min read"
og_image: "/img/posts/pokemon-red-one-hour-agent-lab/social-preview.png"
og_image_width: 1536
og_image_height: 1024
repo_card:
  url: "https://github.com/curtiscovington/pokemon-red-agent-lab-results"
  title: "Pokémon Red Agent Lab: Logs and Results"
  description: "Six experiment batches, original decision logs and frames, frozen controls, and reproducible result audits."
tags:
  - ai
  - agents
  - evaluation
  - local-ai
  - dgx-spark
---

What happens if I give a local model control of Pokémon Red, let it play, and then start improving the things that hold it back?

I started by watching it play. Early on, that meant waits of over a minute between actions and little meaningful progress. Across the final eight runs, every run entered Pewter Gym and **four earned the Boulder Badge**, with model decisions typically taking under two seconds.

The most useful finding came from investigating the failures in between. **Some apparent model failures exposed defects in the controls I had given it.** The walking helper reached the forest exit but never crossed it. In a later saved game, the nurse was missing from the offered walking targets because she stood behind a counter. I also found a data-quality error: the recorded map labels called the forest a museum.

Replaying saved games and checking the records helped distinguish bad decisions from broken ways to carry them out.

![A four-panel black-and-white research comic showing a slow start, repairs to the controls, reaching the gym, and four badge wins across eight runs.](/img/posts/pokemon-red-one-hour-agent-lab/social-preview.png)

### TL;DR

Investigating a local Pokémon agent’s stalls exposed broken controls and misleading game-state labels. In this small batch, all eight runs entered Pewter Gym; three of four with extra recovery controls earned a badge, versus one of four without. **Checking what the agent can actually see and do became as important as checking what it decides.**

## Why Pokémon Was A Useful Place To Start

Pokémon requires useful decisions that hold together as the world changes.

A random encounter interrupts a walk. A conversation introduces a task several maps away. Healing requires finding a building, approaching a counter, and finishing a dialogue. Earlier decisions need to remain relevant through those interruptions.

Failure is easy to watch: repeated stair trips, direction changes after battles, or another Jigglypuff performance. Saved states and action logs let me investigate what I saw.

My priority became **progress first, speed second**. Generalizing the approach to other games could come later. A fast agent spending an hour in the same room was not the outcome I wanted.

## What I Gave The Model

I ran the project locally on a [DGX Spark](https://www.nvidia.com/en-us/products/workstations/dgx-spark/) with an NVIDIA GB10 and 128 GB of unified memory, using the [PyBoy Game Boy emulator](https://github.com/Baekalfen/PyBoy). The later comparisons use `qwen3.8-flash-next:iq4_nl`, a local Ollama tag for Qwen3.8-Flash-Next in IQ4_NL format ([source and pinned revision below](#limitations)).

The model receives a game screenshot alongside structured information read from the emulator: location, party, health, inventory, battle state, and available interactions. Its output selects from a constrained set of game actions.

Over time, those actions expanded from short button inputs to bounded operations:

- Walk to an available local exit, passage, or interaction target.
- Select a named move that is actually available in battle.
- Advance ordinary dialogue until a meaningful choice or unexpected state requires another decision.

The local map and interaction targets come from game data. Later versions also provide explicit Pokémon Red objectives and clearer labels for useful interactions. **This is assisted play:** the software supplies map structure, task guidance, and executable controls alongside the image.

I wanted to explore that division of work between software and model.

The timeline below covers **about 40 hours 38 minutes of gameplay**: five completed eight-hour batches (eight sequential one-hour runs each), plus 38 minutes before v2.20 was stopped. Loading and setup time are additional. The v2.14–15 row combines two batches; v2.21 replaces the interrupted v2.20 batch:

| Order | Experiment | State of the walking helper |
|---|---|---|
| v2.14–15 | Goals and output format | Forest-boundary bug still present |
| v2.16 | Boundary repair | Later runs cross the forest and reach Pewter |
| v2.19 | Recovery comparison | Boundary fixed; nurse interaction still missing |
| v2.20 | Decision example below | Boundary and nurse fixed; separate doorway loop interrupts run |
| v2.21 | Replacement comparison | Doorway and cycle handling corrected; four of eight runs earn a badge |

### One Actual Decision

This example comes from v2.20, **after the forest-boundary fix and the recovery comparison below**:

![Player on a narrow path between a fence and trees in Viridian Forest.](/img/posts/pokemon-red-one-hour-agent-lab/forest-decision.png)

*After the boundary fix: the player is 12 tiles south of the offscreen exit, at 32:05 in an archived run. A separate Route 2 doorway defect later interrupted this run; it illustrates the interface and is excluded from the final results.*

Alongside that image, the request said the player was in Viridian Forest at `(1,12)`, facing up, with a level-9 Charmander at 10/26 HP. These are selected fields from the actual request:

```json
{
  "allowed_actions": {
    "go:51-exit-1": "Exit 1 at (1,0); 12 steps",
    "cancel_route": "Cancel retained route to heal or choose a new objective."
  },
  "objective": {
    "id": "cross_forest",
    "instruction": "Traverse Viridian Forest toward its north exit. Avoid returning through the southern entrance. Resolve battles and continue toward the north gate.",
    "success_evidence": "North gate map 47 observed.",
    "source": "Explicit Pokemon Red guide; completion checked from observed game state."
  }
}
```

“Retained route” is the destination remembered through an interruption. The model could continue or cancel it, and returned:

```json
{"action": "go:51-exit-1"}
```

The response took 1.811 seconds. **Twelve inputs reached the exit tile; the thirteenth pushed across the map boundary into the north gate.** That extra push is precisely what the earlier walking helper omitted.

The [request and action log](/assets/data/pokemon-red-one-hour-agent-lab/forest-decision.json) preserve the prompt, response, and 13 walking inputs.

## Turning Watching Into Experiments

I compared changes in sequential batches.

For the later comparisons, every scored run starts from the same bedroom save and gets one hour. Loading and warmup happen before the scored clock starts; inference, actions, interruptions, and recovery consume the hour. Agent memory resets between runs. Paired conditions use the same configured seeds, with their order alternated.

Later saved games were for debugging; every scored run had to make the journey from the bedroom.

I recorded first-observed times for the starter, parcel acquisition and delivery, Pokédex, forest north gate, Pewter, gym, and badge. These milestones measure progress; button presses and experience points help explain behavior. The [measurement code and source index](/assets/data/pokemon-red-one-hour-agent-lab/evidence-index.md) define the checks.

I also had to make the machine reliable enough to trust an unattended run. Competing model services and loading pressure had caused serious interruptions. The experiment now enforces one large loaded model and checks memory headroom. A machine failure and a bad game decision need different explanations in the results.

## What Improved, And What Did Not

### Decisions Got Faster; One Change Was Measured

Decisions in seconds let me watch sequences unfold and investigate where they went wrong. In v2.14, I measured one contributor: responses containing an explanation versus responses containing only the selected action.

| Goal guidance | Explanation output | Action-only output |
|---|---:|---:|
| Off | 2.430 seconds | 1.626 seconds |
| On | 2.660 seconds | 1.920 seconds |

These are medians of the per-run median **model decision latencies**, with two runs per cell. Action-only output had roughly **28–33% lower latency** on this measure.

A completed game action also includes execution and observation time. The trace above, for example, combines one model response with 13 walking inputs. The [reviewed latency and guidance results](/assets/data/pokemon-red-one-hour-agent-lab/latency-guidance-review.md) retain the per-condition definitions and sample sizes.

### Concrete Objectives Looked More Useful In Four Runs

The same batch also tested goal guidance. All eight runs obtained a starter. The four guided runs delivered the parcel and received the Pokédex; the four unguided runs did neither.

The guided receipt times ranged from 15:17 to 18:36. No run earned a badge.

Concrete next tasks looked worth testing further.

I then broke the journey after the Pokédex into stages: reach the forest, cross it, reach Pewter, recover the team, and approach the gym. In v2.15, **before the boundary fix**, all four broad-goal and all four staged-goal runs entered the forest. None crossed its north exit. The [forest-exit review](/assets/data/pokemon-red-one-hour-agent-lab/forest-exit-review.md) records the eight runs and the subsequent trace investigation.

The logs explained why that apparent ceiling needed another look.

### Some Planning Failures Were Broken Controls

At the forest’s northern boundary, the walking helper moved onto the exit tile, stepped back, and returned. It never issued the extra upward movement needed to cross the boundary.

The model could select a useful destination and still fail because its controller did not know how to execute it. More time or a stronger instruction would not repair that particular action.

Separately, an upstream map-name table labeled the actual forest as a museum in the recorded game state. I checked the names against the [map constants in pret’s Pokémon Red disassembly](https://github.com/pret/pokered/blob/af519899719f0754965776faac0e836a3b906e6d/constants/map_constants.asm), then corrected the labels and the interpretation of those location records. I have not shown that the wrong label affected a model decision.

With boundary handling corrected in v2.16, later runs crossed the forest and reached Pewter. An [archived full-run excerpt](/assets/data/pokemon-red-one-hour-agent-lab/forest-to-pewter.json) records the north gate at 36:22 and Pewter at 39:41 in one such run.

### Keeping A Destination Can Also Keep A Mistake

Small persistent notebooks produced mixed early results: some runs retained a completed starter objective, while others fell back to a generic Champion goal. That pushed me toward a more concrete question: could the controller preserve a useful journey through an interruption?

I added a rule to keep the chosen walking destination through a random encounter. Without it, the agent could head north, finish a battle, then choose to go south. The battle had interrupted the journey, but had not necessarily made the destination wrong.

That idea introduced its own failure mode. If the destination was broken, retaining it could preserve the mistake. The v2.20 run used for the decision example later encountered a different doorway on Route 2. There, the walker alternated between two tiles for over 220 inputs.

The latest walking helper stops after repeated movement around the same positions, drops the failed destination, and removes it from the offered choices until the character moves away or changes maps. Doorway attempts are bounded too. I tested these repairs by loading archived game saves and executing the actual controls, including walking out of the gate and back in.

### Added Recovery Rules Had Lower Completion Counts

The v2.19 recovery comparison ran **after the forest-boundary fix**, with four runs per condition. Both kept the chosen destination through battles. The added package told the agent to heal when its party was weak and restricted choices that repeatedly sent it between the same maps or back to the same unchanged conversation. The completion counts favored the simpler setup in this batch:

| Milestone within one hour | Keep destination after battle | Also heal and restrict repeats |
|---|---:|---:|
| Pokédex received | 3/4 | 1/4 |
| Forest north gate reached | 3/4 | 0/4 |
| Pewter City reached | 1/4 | 0/4 |
| First badge | 0/4 | 0/4 |

*Four runs per column. Added controls: seek healing at low health, avoid repeated trips between maps, and restrict revisiting unchanged conversations.*

This result prompted the closer audit below ([selection caveat](#how-the-audit-was-selected)). The [reviewed results and defect audit](/assets/data/pokemon-red-one-hour-agent-lab/recovery-audit.md) preserve both the outcome and investigation.

In baseline run 8, I found the model pursuing healing in Pewter while repeatedly interacting with Jigglypuff. The nurse was missing from its offered walking targets: the helper required an adjacent walkable tile, and a counter separated the player from her. I taught the helper to recognize counters and talk across them. Replaying that saved game then healed the party from 6/28 to 28/28 HP.

### How The Audit Was Selected

That v2.19 audit was outcome-driven: disappointing results and visible loops prompted closer inspection. I had no predeclared procedure ensuring equally deep inspection of winners and losers.

The checks described here involve three of eight runs: the nurse in baseline run 8 and starter failures in baseline run 1 and recovery run 6. I kept no per-run audit-completeness checklist.

The audit also found defects elsewhere in the run. Switching to healing disabled the rule that discouraged repeated trips between the same maps. In Oak’s Lab, an attempt to leave before choosing a starter could remain the chosen destination even after Oak stopped the player.

### The Final Batch Reached Brock

I gave both conditions the corrected walking and interaction controls, then froze the source and configuration for v2.21. The comparison still tested the added healing and repetition rules. An earlier attempt, v2.20, had been interrupted by the Route 2 doorway loop; its partial run stays separate.

This time, **all eight runs completed the hour, crossed the forest, and entered Pewter Gym**. Four earned the first badge:

| Milestone within one hour | Keep destination after battle | Also heal and restrict repeats |
|---|---:|---:|
| Pokédex received | 4/4 | 4/4 |
| Forest north gate reached | 4/4 | 4/4 |
| Pewter Gym entered | 4/4 | 4/4 |
| **Boulder Badge earned** | **1/4** | **3/4** |

*Four runs per condition, paired on seeds 8000–8003. Both use the same corrected controls; the second adds healing and restrictions on repeated journeys and conversations.*

<picture>
  <source media="(max-width: 600px)" srcset="/img/posts/pokemon-red-one-hour-agent-lab/final-milestones-mobile.png">
  <img src="/img/posts/pokemon-red-one-hour-agent-lab/final-milestones.png" alt="Eight paired runs all entered Pewter Gym. Three recovery runs and one baseline earned a badge. Crosses at 60 minutes mark the four runs without a badge.">
</picture>

*Rows are paired by seed; numbers identify runs. Times start from the bedroom after model loading and warmup. Crosses at 60 minutes mark runs without a badge, not 60-minute completions. [Download the milestone data](/assets/data/pokemon-red-one-hour-agent-lab/final-batch-milestones.csv).* 

The recovery wins recorded their badge states at **49:39, 58:23, and 59:59**. The baseline win recorded it at **55:06**. These are the frozen metric’s first observations of the badge state, after post-battle dialogue. Receipt text appeared earlier—for the 59:59 run, at 59:14—so the apparent last-second finish includes observation delay.

The four seed pairs tell a compact story: neither condition won on the first seed, only recovery won on the next two, and both won on the last. That favors the recovery package in this small batch. It does not tell us which of its rules supplied the benefit.

<figure>
  <img src="/img/posts/pokemon-red-one-hour-agent-lab/boulder-badge-awarded.png" alt="Original Pokémon Red frame showing Brock, Charmander at 11 HP, and the dialogue: AAAAAAA received the BOULDERBADGE!" width="320" height="288" style="image-rendering: pixelated; border-radius: 0;">
  <figcaption>Run 8 receives the Boulder Badge. This original frame was saved at 54:23; the frozen milestone check first observed the badge state at 55:06. <a href="https://github.com/curtiscovington/pokemon-red-agent-lab-results/blob/main/results/badge-award-provenance.json">Frame provenance</a>.</figcaption>
</figure>

### Five HP Away

The most exciting battle I watched was actually a loss. In run 2, Charmander brought Brock’s Onix down to **5 of 36 HP** with about three and a half minutes left. Then Onix released Bide’s stored energy, Charmander fainted, and the player blacked out.

By around minute 58, the player was back in Pewter Gym with full health. It finished the hour without a badge. The [near-miss trace](/assets/data/pokemon-red-one-hour-agent-lab/brock-near-miss.json) preserves the enemy HP, battle text, and blackout.

After watching so many repeated stair trips and failed doorways, that battle felt different. The agent had made the whole journey and was close enough that I was watching each turn to see whether it would finish. Four runs did.

### What Changed In The Result

The final batch showed progress through the gym and into badge wins, while speed stayed secondary. Median time to Pewter was **37:19 for baseline and 38:15 for recovery**. The median of per-run median decision latencies was **1.74 seconds versus 1.85 seconds**. The condition with more badge wins had slightly higher times on both measures; with four runs per condition, these small differences do not establish a speed tradeoff.

Loops still cost time. Baseline run 4 selected the gym guide 17 times, plus direct button presses that reopened the conversation. Across all four runs per condition, explicit guide selections totaled 28 for baseline and 10 for recovery. Run 4 alone accounts for 17 of the baseline’s 28 selections, so one run dominates that contrast. It is a useful mechanism hint to investigate; the recovery package also changes healing and replanning.

For this batch I applied the same log checks to all eight runs, including successful ones: badge state and dialogue, battle evidence, guide selections, observed healing, navigation outcomes, and recorded errors. All four wins have receipt dialogue and final Boulder Badge records. The source/configuration hashes matched the freeze, and no run recorded a model recovery or resource failure. This was a uniform log audit, not an exhaustive manual review of every frame. The [complete results and audit](/assets/data/pokemon-red-one-hour-agent-lab/final-batch-results.md) link the per-run evidence. I have also published the [logs, saved frames, and frozen controls for all six batches in this timeline](https://github.com/curtiscovington/pokemon-red-agent-lab-results), including unsuccessful runs and the interrupted batch.

The earlier nurse defect came from the baseline and cannot explain why the old recovery runs failed before reaching Pewter. The final batch evaluates the corrected system as a whole. Individual contributions from the nurse, doorway, healing, and repetition changes remain open questions; the earlier unsuccessful comparison stays in the record.

## Limitations

Models, backends, quantization, prompts, output budgets, and controls changed during development. Their individual contributions to the minute-to-seconds improvement were never isolated. Historical batches stay separate.

Paired seeds help organize comparisons; they do not make different action trajectories identical. Explicit Red objectives, emulator state, and deterministic walking make this a test of an assisted system.

The [model identity and experiment settings](/assets/data/pokemon-red-one-hour-agent-lab/model-and-protocol.json) record the pinned digest and locally reported metadata. The local tag imports [ggml-org’s IQ4_NL conversion](https://huggingface.co/ggml-org/Qwen3.8-Flash-Next-GGUF/tree/052beeaca7bec4a303e59cc7bc630c4f3a1b845d) of [Qwen3.8-Flash-Next](https://huggingface.co/Qwen/Qwen3.8-Flash-Next/tree/de4b8e4d43b917e7706784d8bb445c9af86a3540). Both downloaded model shards and the vision projector match the publisher’s SHA-256 hashes; the linked identity record preserves the revisions and import details.

The final comparison has four seed pairs and one model configuration. It supports further testing of recovery under this harness, rather than a general ranking of agent designs. Full-game completion remains an open goal.

## What I Would Check First Next Time

I began by asking what a local model could do with Pokémon. The failures taught me to make that question more precise: what can it do with this view of the game and these controls?

The forest exit, museum label, and missing nurse changed my debugging order. I first check the observation against the game. Then I check whether the useful action is offered. Then I replay that action from the saved state. Those checks establish what the model actually had a chance to accomplish.

**Before spending more reasoning time on a stuck agent, I now check whether its information and controls give it a working path forward.** That is the debugging method I take from this exploration.

The next question is how much the model adds once these controls are held fixed. I plan to start with random and scripted policies over the same offered actions, then compare pinned models under one frozen harness. This exploration made that study possible. Four Boulder Badges are a satisfying place to begin it.
