# v2.25 — frozen route-and-combat baseline comparison

Approved 2026-10-14: 45 sequential one-hour wall-clock runs, 15 each random, scripted red-route-combat-v4, and pinned reactive model. Complete the fixed sample regardless of interim outcomes. No streaming. Historical v2.22/v2.23 pilot data are development data and excluded from this analysis.

## Question and fixed conditions

Primary question: does the pinned model differ from a route-and-damage-aware deterministic script in first-badge completion within one hour under this assisted harness? Primary outcome: Boulder Badge recorded in game state by 3600 seconds. Use all 15 scheduled runs per arm; keep unreached milestones censored at 3600, never discard them when summarizing speed. No claim that n=15 guarantees statistical significance or 80% power for all alternatives.

Reset identical bedroom save every run. Seed IDs10000–10014 label random-policy RNG and order blocks, not game RNG: script is deterministic; emulator timing/actions produce uncontrolled encounter variation. Conclusions concern repeated operation of this particular local system, not 15 independently seeded game worlds. Cycle the existing six arm permutations, yielding five appearances per order position per arm over15 blocks. Same observation builder, prompt, legal offered actions, staged objectives, navigation, evidence, dialogue skills, recovery filters and model settings as v2.22. Warmup/loading excluded; no artificial delay for baselines. Only one model resident; exclusive service/headroom protections remain active. Stop on infrastructure failure, preserve incomplete data, no silent replacement or modification of scored runs.

Model pin: config retains exact prior digest. Shared harness originally developed against this model; disclose this. Script has fixed prior route and public game-mechanics knowledge and ignores pixels; this is a comparison of specified assisted policies, not an equal-information intelligence ranking.

## Improved script fixed before launch

Inherits explicit Mart→parcel→Oak→Pokédex→forest→Pewter→Brock routing from v2.23. Corrects two observed script-only Route2 defects: on its north section use the reachable northern passage for healing and gym objectives, instead of an unreachable southern edge or south-forest door; north forest gate healing proceeds toward Pewter. No shared walker changes.

Combat scores only offered named moves with observed positive PP. Uses Gen-I move power, accuracy, species typing, STAB, dual-type effectiveness, physical/special split, level-based approximate attack/defense, enemy HP cap and PP tie-breaking. Known multi-hit and charge moves have simple adjustments. This is immediate expected-damage selection: no strategic setup, learned planning, full exact damage simulation, critical-hit/stat-stage inference or optimal healing/item/switch policy. Stats unavailable in the shared prompt are estimated from public species base stats with neutral DVs and no EVs, not read from hidden live memory. First conscious party member is fallback active Pokémon when the visible battle name does not identify one. Existing shared healing objectives remain in force. First-useful-move behavior remains the fallback when no scored damage action is available; record it, do not claim optimal combat.

Public data source: https://github.com/pret/pokered/tree/af519899719f0754965776faac0e836a3b906e6d (data/moves/moves.asm, data/types/type_matchups.asm, data/pokemon/base_stats). Parsed compact tables frozen as src/imajev_player/combat_data.json; no network calls during runs. Species base stats and move chart are added prior knowledge. Damage heuristic does not faithfully simulate all165 move effects; its intended scope is the starter/early-game battles.

## Pre-specified analysis and audit

One primary contrast: model vs improved script, two-sided Fisher exact test at alpha0.05 on badge completion, with 95% Wilson intervals for each arm's rate and the raw counts. Interpret a non-significant result as insufficient evidence, not equivalence. Random comparisons and all milestone/throughput measures are secondary exploratory results; any pairwise significance claims across all three contrasts require Holm correction. No early stopping for success/futility, no optional sample extension described as confirmatory. Sample is small and may have low power; previous 0/5 badges could persist.

Report milestone counts with all denominators, and administrative-censor restricted mean time at3600 seconds (mean of observed event times clipped to3600, with unreached runs contributing their censor limit). Do not label this ordinary mean completion time. Non-administrative infrastructure failures require separate reporting and suspend the planned complete-case analysis; no pretending failed infrastructure is a gameplay loss. Report per-run timelines and order blocks. No 80%-power claim is made, especially with uncontrolled game RNG and dependent repeated system operation.

Every run receives the same automatic policy audit (all legality/errors/failed-navigation counts, first/every100th request and flagged references), regardless of outcome. Review identical fixed samples and all flagged categories in every arm before publication; record review completion separately from auto checks. No outcome-driven audit selection. Combat rule counts and repeated route-unavailable decisions are mechanisms to inspect, not causal proof. Retain compact existing traces and screenshots only; no additional video or per-frame recording.

## Validation and reproducibility

Before launch: selector unit tests for resistance, immunity, PP, capped finishing damage, physical/special differences and legal offered actions; all five prior script traces checked for legality and the reproduced Route2 stalls; isolated real-ROM bedroom→gym test with actual Ember use; isolated northern Route2→Pewter check; baseline lifecycle check with zero model inference and fixed budgets. Freeze source (including combat JSON), config, this protocol, starting save, ROM and safe loader. Archive the source with each batch, retain validation reports. No claim of progression based only on issuing an action.

Analysis references: [SciPy Fisher exact definition and worked example](https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.fisher_exact.html); [NIST Wilson interval discussion](https://www.itl.nist.gov/div898/handbook/prc/section2/prc241.htm). scripts/analyze-fixed-comparison.py implements the primary exact test and Wilson intervals with standard-library arithmetic; checked against SciPy's published 6/2 vs1/4 example and the all-zero-success case. It refuses incomplete or resource-affected batches. Secondary comparisons remain descriptive unless a separate Holm-adjusted analysis is explicitly reported.

Validation completed before launch: 43 selected shared-control/baseline tests pass; five improved-policy tests (including isolated real emulator lifecycle, no inference) pass. Bedroom→Pewter Gym accelerated replay:308 decisions, actual `used EMBER!` text observed,48.56 seconds of test runtime (not scored gameplay). Northern Route2 saved-state replay:2 decisions reaches Pewter. Reports: research/scripted-combat-validation.json and research/scripted-combat-north-validation.json. Archived-trace regression checks all five v2.23 scripts, including over2000 previously stalled requests. These are integration checks, not badge-success evidence.


## Replacement after reproduced interaction deadlock (2026-10-15)

v2.24 batch20261014-192314-b165bd was stopped during scripted run18 on user instruction to fix a real Brock restriction deadlock. All its results remain development data and are excluded from the replacement's planned analysis. Restart the full45-run budget, identical15 blocks and arm ordering, with new source hashes. Prior outcome-driven corrections disclosed; do not pool partial old/new controls.

Shared InteractionGuard now permanently discards visit counts when observed party/inventory/objective/badge progress changes the signature, and clears map-local counts and pending interactions on battle entry. Previously, the dialogue-to-battle gap could count Brock visits as unproductive; healing restored an old full-health signature and resurrected a stored restriction. No special Brock exemption: unchanged optional NPC conversations still become blocked. All three arms get this same correction.

The scripted variant also selects the least-tried currently offered local destination when its prescribed target is missing; counters are bounded at128 entries. It never selects a suppressed target or uses raw movement to bypass the filter. This is a fallback strategy, not a guarantee of eventual progress. Combat scoring unchanged.

Validation: saved run18 final.state plus reconstructed logged objective/interaction history, isolated emulator, reached Brock battle and observed actual used EMBER text in11 decisions. See research/brock-recovery-v225-validation.json and scripts/validate-brock-recovery.py. Regression tests ensure battle entry clears stale visits without needing damage, healing cannot resurrect old restrictions, optional repeated interactions still block, and scripted fallback changes destinations instead of waiting. Initial lifecycle test encountered the shutting-down old lab lock; no lock bypass. Rerun after shutdown completes.

Final regression run:37 tests passed after shutdown, including both baseline and improved-script real-emulator lifecycle checks.
