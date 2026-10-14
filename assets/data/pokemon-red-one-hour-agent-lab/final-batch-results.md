# v2.21 confirmation results — 2026-10-13

Batch20261013-105028-575ffb. All8 runs completed one hour. Source/config freeze hashes match. No recorded run errors, model recoveries or resource-affected runs. No NPC-label edits made.

| Run | Setup | Seed | Pewter | Gym | Badge state first observed |
|---|---|---:|---:|---:|---:|
| 01 | Baseline | 8000 | 36:25 | 38:31 | Unreached (60min) |
| 02 | Recovery | 8000 | 38:42 | 41:44 | Unreached (60min) |
| 03 | Recovery | 8001 | 38:28 | 40:02 | 58:23 |
| 04 | Baseline | 8001 | 31:31 | 43:22 | Unreached (60min) |
| 05 | Baseline | 8002 | 49:17 | 51:24 | Unreached (60min) |
| 06 | Recovery | 8002 | 30:06 | 32:14 | 49:39 |
| 07 | Recovery | 8003 | 38:01 | 39:40 | 59:59 |
| 08 | Baseline | 8003 | 38:13 | 39:50 | 55:06 |

Both arms4/4 Pokédex, forest north gate, Pewter and gym. First badge baseline1/4 vs recovery3/4. Paired outcomes: seed8000 neither;8001 and8002 recovery only;8003 both. Encouraging direction, only four pairs; no general or statistically established superiority claim.

Median time to Pewter: baseline37:19, recovery38:15. Median of per-run median model-decision latency: baseline1.742s, recovery1.852s. More badge completions did not coincide with faster arrival in Pewter or faster inference.

Badge victories corroborated for all4 by receipt dialogue, subsequent Boulder badge state and final summary including TM34. Existing metric records first badge state after post-battle dialogue completes. Explicit receipt text occurs earlier:
- Run03: receipt text 57:38; badge state 58:23.
- Run06: receipt text 48:54; badge state 49:39.
- Run07: receipt text 59:14; badge state 59:59.
- Run08: receipt text 54:22; badge state 55:06.

Keep frozen first-badge metric above; do not silently substitute dialogue timings. Run7 recorded badge state at3598.595s, within3600s; receipt text at3553.811s supports success before deadline.

Run2 is the observed near miss: Onix5/36HP before Charmander fainted; no badge. Run4 baseline repeatedly talked to gym guide:17 named target calls, plus direct confirms; no Onix observed. Named guide calls across baseline28 vs recovery10, and all recovery runs had interaction-block decisions (7/10/9/2). These are diagnostic counts, not standardized loop duration or proof that NPC suppression alone caused the badge difference. The recovery package also changes healing/replanning.

Audit applies same streaming checks to all8 runs: badges/text, Brock/Onix evidence, named-guide actions, observed center HP increases, navigation completion reasons, errors/resource recoveries, terminal observations. Details in confirmation-v221-audit.json. This is not exhaustive manual frame review. Existing short-cycle metrics undercount longer dialogue/menu loops; do not report their longest-cycle seconds as full loop time.

Next research gate: preserve this frozen result, finish uniform trace review if publishing detailed causal accounts, then develop random/scripted baselines as described in follow-up-frozen-harness-model-study.md. No new run or label change authorized by this results request.

## Supporting Files

[Uniform log audit for all eight runs](final-batch-audit.json),
[per-run milestone CSV](final-batch-milestones.csv),
[frozen source and configuration hashes](confirmation-v221-freeze.json),
[run2 near-miss observation excerpt](brock-near-miss.json).
