# Final exploratory audit and confirmation plan — 2026-10-13

Audited batch20261013-010754-95c758, all8 completed. Paired seeds6000–6003.

| Outcome | Retained-walk baseline | Full recovery |
|---|---:|---:|
| Starter | 3/4 | 3/4 |
| Parcel acquired | 3/4 | 3/4 |
| Delivered / Pokedex receipt | 3/4 | 1/4 |
| Forest north gate | 3/4 | 0/4 |
| Pewter | 1/4 | 0/4 |
| Badge | 0/4 | 0/4 |

The package did not improve progress in this sample. Do not describe it as a
successful intervention. Small n, exploratory selection and execution defects
limit causal/general claims.

## Confirmed issues
Pewter nurse58-object-1 at(3,1) was absent from allowed navigation choices: route
search demanded an adjacent walkable tile, but a counter separates the nurse from
the player. Jigglypuff58-object-3 was reachable. Reproduced from run8 final save.
Fixed generic counter interactions using current tileset talking-over tile IDs
(RAM D532–D534; pokered wTilesetTalkingOverTiles). Actors reached across those
counter tiles can be addressed from two tiles away without walking through walls.
Nurse sprite29 gets a clear Nurse label. Center entrances to Viridian/Pewter are
labeled from current-map warp destination bytes (explicit Red metadata assistance,
shared across both arms). Saved run now navigates to nurse and heals6/28→28/28.

Oak's Lab: retained exit target repeatedly resumed after Oak interrupted leaving
before a starter was selected. Retention now releases dialogue-interrupted walks
that end at the same position without a battle. In-lab obtain_starter instruction
explicitly requests a Poke Ball and YES rather than leaving. Starter interactions
and nurse targets cannot be suppressed by optional-NPC repeat guard. Live run6
had601 block decisions, but blocked target was Oak40-object-5, not a blanket ban
on starter balls. Baseline run1 also failed to get a starter. Therefore prior
suspicion that NPC suppression itself caused the lab failure is NOT established.
Run6 final save does not respond to directional/A/B input in offline replay; its
terminal script state was not recovered. Root cause of that unresponsive terminal
state remains unresolved. Fresh original bedroom→valid starter path now passes
an actual emulator integration check; do not present that as recovery of run6.

Recovery healing goal was disabling route suppression during healing, allowing
Viridian↔Route1 oscillations while weak. Keep route-cycle evidence active during
healing. Guard thresholds otherwise unchanged. Baseline prompt no longer claims
NPC suppression is active when its guard is disabled.

References: https://raw.githubusercontent.com/pret/pokered/master/ram/wram.asm
and https://raw.githubusercontent.com/pret/pokered/master/constants/sprite_constants.asm

## Frozen prospective confirmation
Config experiments/confirmation-v220.json, protocol v2.20. Eight1-hour runs,
new seeds7000–7003, each paired and order alternated. Same model/digest, bedroom
save, action-only output, staged objectives, corrected exits/counter interactions,
clear nurse/center labels, starter instruction and safe retained destination.
Baseline: no additional recovery package. Treatment: corrected full recovery
(route-cycle restrictions, low-health override, optional-NPC-repeat suppression).
Shared bug fixes prevent comparison against a deliberately broken baseline.

Primary endpoint: first badge within60min. Secondary ordered progress endpoints:
Pokedex, forest north gate, Pewter, gym; report successes/all assigned runs, then
milestone times for successes with failures/unreached explicitly censored. Do not
substitute60min as a completion time. Also report decision latency, stale actions,
resource/model failures, repeat interaction blocks, route cancellations and healing.
With four pairs this is a small prospective check, not high-powered significance.
Do not pool historical batches or change endpoints after seeing results. No
mid-batch policy changes or selective replacements. Preserve failed runs. If a
material execution bug requires intervention, label the batch interrupted and
start a separate protocol. Do not continue knowingly unsafe resource conditions.

Freeze source/config SHA256 in research/confirmation-v220-freeze.json before
launch; standard per-batch source snapshot supplies reproducibility. All model
loading remains exclusive. No public stream. Scientific claims must disclose
Red-specific guide/metadata assistance and unresolved terminal-state limitation.
