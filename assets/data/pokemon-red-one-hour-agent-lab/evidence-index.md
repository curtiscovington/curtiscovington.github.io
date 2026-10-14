# Pokémon Red exploratory post: evidence index

These files accompany the exploratory blog post. Historical reviews are
copied from the project's research records; their next-step plans describe what
was proposed at that time. They are not final results for the current batch.

- [One actual forest decision](forest-decision.json): archived batch
  `20261013-100905-cacc2d`, run `01-reactive-87905656`, request at1925.3497s.
  Includes full text prompt, model response,13 walking inputs and completion.
  Unrelated event types omitted; image bytes moved to the linked PNG unchanged.
  This batch was subsequently interrupted after a separate Route2 doorway loop.
- [Latency and guidance review](latency-guidance-review.md): completed batch
  `20261011-212309-b75445`, two runs per guidance/output cell.
- [Forest exit investigation](forest-exit-review.md): completed batch
  `20261012-082345-7459db`, four broad-goal/four staged-goal runs.
- [Recovery comparison and audit](recovery-audit.md): completed batch
  `20261013-010754-95c758`, four runs per condition. Preserves negative result,
  baseline and treatment failures, and known unresolved cases.
- [Milestone measurement code](outcome_metrics.py) and
  [objective and evidence checks](objectives.py): unmodified copies from frozen
  source of `20261013-105028-575ffb`, protocol `lab-v2.21-confirmation`.
  Game-specific map identifiers and dialogue checks are explicit in these files.

This is a small supporting evidence selection, not a full reproducibility bundle.
It contains no ROM or model weights. The [public experiment repository](https://github.com/curtiscovington/pokemon-red-agent-lab-results)
contains the six batches’ decision logs, frames and frozen controls.

## Additional Provenance

- [Model identity and protocol](model-and-protocol.json): pinned experiment digest
  and verified public conversion/upstream revisions. Full local SHA-256 checks
  match both downloaded IQ4_NL shards and the Q8_0 vision projector.
- [Frozen source/config hashes](confirmation-v221-freeze.json): pre-launch v2.21
  source and protocol hash record, copied unchanged from project research files.
- [Forest-to-Pewter observations](forest-to-pewter.json): selected first main
  observations in the north gate and Pewter from completed v2.16 run6. Includes
  source-log hash and explicit field-selection description. A successful example,
  not a summary of all runs or an isolated causal estimate.

## External Primary Sources Checked On 2026-10-13

- [NVIDIA DGX Spark specifications](https://www.nvidia.com/en-us/products/workstations/dgx-spark/):
  GB10 and available128GB unified-memory configuration. Hardware reference only.
- [PyBoy](https://github.com/Baekalfen/PyBoy): emulator project; documents game
  inputs, memory access and screenshots. Our outcome claims come from our logs.
- [pret/pokered map constants at commit af519899](https://github.com/pret/pokered/blob/af519899719f0754965776faac0e836a3b906e6d/constants/map_constants.asm):
  identifies Viridian Forest as0x33 and Museum1F as0x34. Supports the correction
  of location names; does not establish behavioral effects of wrong labels.

## Final v2.21 Results

- [Reviewed results](final-batch-results.md): all8 completed; recovery3/4 badges,
  baseline1/4, all8 reach Pewter Gym. Recorded badge-state timings distinguished
  from earlier receipt dialogue.
- [All-run audit](final-batch-audit.json): same log checks across8 runs, including
  successes; exact scope and limitations embedded. Source/config hashes match.
- [Milestone CSV](final-batch-milestones.csv): figure data, including explicitly
  censored badge outcomes. Runs displayed in paired-seed order, not execution order.
- [Brock near miss](brock-near-miss.json): selected state fields at3380–3413s from
  run2; Onix5/36HP, Bide release, faint and blackout. No badge in this run.

The post reports this small comparison descriptively. The recovery package changes
several behaviors; this batch cannot assign the benefit to any single rule.

Figure exports: [PNG](/img/posts/pokemon-red-one-hour-agent-lab/final-milestones.png),
[SVG](/img/posts/pokemon-red-one-hour-agent-lab/final-milestones.svg).
[Figure generation script](plot-final-milestones.py) uses Matplotlib and the
included audit JSON; run it from this directory in the site checkout.

- [Original badge-award frame provenance](badge-award-provenance.json): run8, 54:23, unchanged PNG; badge-state milestone later at55:06.
