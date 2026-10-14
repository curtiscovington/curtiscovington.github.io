# v2.14 review and next batch (2026-10-12)

Batch20261011-212309-b75445: all8 completed one hour, no model recoveries,
resource-affected flags or errors. Exclude earlier interrupted v2.13.

| Goal guidance | Output | Parcel / delivery / Pokedex | Pokedex receipt times | Median of per-run decision medians |
|---|---|---|---|---|
| Off | Explanation | 0/2 each | Unreached | 2.430s |
| Off | Action only | 0/2 each | Unreached | 1.626s |
| On | Explanation | 2/2 each | 18:36,16:47 | 2.660s |
| On | Action only | 2/2 each | 15:17,17:50 | 1.920s |

All8 obtained starters; no badges. Receipt times use explicit dialogue, not
provisional flags. Guidance4/4 vs0/4 is promising but only two seeds per cell.
Action-only is ~28–33% faster on median-of-run-medians, not100ms. It preserves
observed completion here; fastest game completion is not established with n=2.
Guidance includes explicit Red knowledge, so this is assisted progress, not proof
of unaided planning. Shared new prompts differ from older baselines.

Critical newly verified harness defect: upstream pokemon_agent/memory/red.py
MAP_NAMES labels map50 as Viridian Forest and51 as Pewter Museum1F. In the Red
map constants,50 is Viridian Forest south gate and51 is Viridian Forest;47 is
north gate, also mislabeled south locally. Broader table drift continues onward.
Run3 final screenshot is visibly outdoors in forest, yet state says Museum.
Source: https://raw.githubusercontent.com/pret/pokered/master/constants/map_constants.asm
Do not report these museum labels as genuine museum/Pewter visits. Guided runs
spend much of the last40min around Route2/south gate/forest; generic first_badge
instruction and misleading labels are plausible contributors, not isolated causes.
Unguided runs repeat Route1↔Viridian without obtaining parcel.

Measurement gap: all outcome-metrics reconsideration signals report0, but actual
request repeat_feedback.reconsider counts are25,32,44,26,27,89,32,26. Parser has not
followed the new prompt format. Repair before interpreting recovery effectiveness.
870 stale actions across8runs; investigate their reasons before changing safeguards.

## Proposed next batch: first-badge progress

First correct map metadata across all arms and validate representative saved
forest/gate/Pewter states against screenshot/ROM map IDs. Update metrics to parse
repeat_feedback and verified_objective. These are common bug fixes, not treatments.

Eight one-hour runs, four paired new seeds, alternating order:
A: existing guided goals + action-only (4runs).
B: same + staged post-Pokedex goals (4runs): reach forest, traverse to north gate,
reach Pewter, heal/prepare, enter gym and challenge Brock (verified boundaries).
Do not label the forest traversed merely from entering it. Keep objectives across
battle/dialogue interruptions. Both start bedroom, same model, single residency,
evidence budgets, controls and loading protocol. No checkpoint starts; historical
saves only used for short offline integration checks. No new batch launched here.

Primary: first-badge completion; intermediate first times for forest north exit,
Pewter, gym and Brock encounter/outcome. Track team HP/level at challenge, blackout,
heal visits, time without new milestone, repeat transitions and stale decisions
in compact summaries. Secondary latency/output tokens; no extra screenshots or
full-state duplication. Need reliable detectors validated before launch. Progress
first; no more output-format factor now. After route success, battle preparation
can become the next separate experiment if it is the observed blocker.
