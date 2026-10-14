# v2.15 results (2026-10-12)
Batch20261012-082345-7459db:8/8 full-hour completion, no model recoveries,
errors or resource-affected flags. Broad4 vs staged4, paired seeds4000–4003.
Both arms4/4 parcel delivery, Pokedex receipt, forest entry; neither north gate,
Pewter or badge observed. Pokedex receipts across batch12:18–17:09.
Broad final party levels7,7,8,8; staged11,13,12,13. Staged runs engage/traverse
forest instead of repeatedly choosing southern entrance. Level is supporting
behavioral evidence, not the primary success outcome.

Critical execution defect discovered during review: navigation.execute treats
bottom-border exits specially (walk_down) but treats top-border exits like stairs,
stepping off then back onto the warp. Run3 at north exit(1,0) visibly logs repeated
walk_down to(1,1), walk_up to(1,0), never walk_up across the northern boundary.
Runs2/3 reached y=0; repeated target executions ended step_limit. Thus this batch
cannot fairly conclude staged goals cannot cross forest: harness mishandles exit
activation. Run6 reached y=1; run7 y=7 among main observations after25min.
Other losses include battles and stale observations; not all failures assigned
to the exit bug. Correct map labels and choice availability alone did not validate
successful boundary crossing. Earlier validation was insufficient here.

Next priority: direction-aware boundary warp execution; validate actual archived
run3 save crossing into north gate47, plus south exits/stairs regressions. Then
repeat same paired matrix with new protocol/source snapshot before adding more
planning features. Preserve this batch and acknowledge confounding. No new run
launched or behavioral code changed during review.
