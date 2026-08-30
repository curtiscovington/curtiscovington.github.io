---
title: "I Gave AI Agents a Shared Knowledge Repo. They Found the Rule—and Still Got the Math Wrong."
description: "A local OAKX experiment on 12 synthetic repository incidents improved bounded task success from 0/12 to 6/12; adding an answer-blind calculator reached 11/12."
date: 2026-08-30
tags:
  - ai
  - agents
  - evaluation
  - local-ai
  - knowledge-management
  - dgx-spark
reading_time: "11 min read"
og_image: "/img/posts/oakx-memory-to-action/oakx-memory-to-action-cover.png"
repo_card:
  url: "https://github.com/curtiscovington/oakx-memory-to-action"
  title: "OAKX Memory-to-Action Study"
  description: "Frozen protocols, synthetic task generators, immutable result bundles, analysis scripts, and publication figures."
---

Can a fresh coding agent solve an unfamiliar repository problem more reliably if it can search a
shared, reviewed knowledge base?

I wanted to test that question with the framework I have been building: the **Oracle Agent
Knowledge Exchange**, or **OAKX**.

The short answer is **yes—with an important qualification**.

On twelve held-out synthetic repository incidents, the same local model went from **0/12 strict
successes without OAKX to 6/12 with it**. The OAKX-enabled agent found the correct root cause and
authoritative source in all twelve tasks. But in half of them, it still applied the right rule
incorrectly.

Adding a small, deterministic, answer-blind calculator raised the combined condition to **11/12**.

That result changed how I think about agent memory. Persistent knowledge can get an agent to the
right rule. It does not guarantee that the model will execute that rule correctly.

[Code, frozen protocols, and result bundles](https://github.com/curtiscovington/oakx-memory-to-action)

![Strict success across the OAKX and calculator ablation](/img/posts/oakx-memory-to-action/oakx-ablation-strict-success.png)

### TL;DR (Layman Version)

I gave a local AI agent access to a small library of previously reviewed solutions. That library
helped it identify the right problem and find the file that proved the answer, but the model still
made arithmetic mistakes while applying the correct instructions. A basic calculator fixed almost
all of those remaining failures. The result was not simply 11/12: **“agent memory” is not one
capability. Retrieval, evidence checking, deterministic execution, and answer normalization can
fail independently.**

## Why This Post Exists

Most coding-agent sessions start nearly from zero. A person or another agent may have diagnosed the
same failure last week, yet the next session often investigates it again. Chat history is hard to
search and review, easy to make stale, and rarely distinguishes advice from authority.

OAKX is my attempt to make reusable agent knowledge behave more like maintained engineering
knowledge. Accepted findings live in a Git repository. They have evidence, scope, revision history,
and a review path. Agents search the accepted corpus before investigating a material unknown, then
verify anything they use against the current authoritative source.

One concrete inspiration came from a Hugging Face hack where agents created their own message board.
They had externalized useful state into a shared place that later agents could read. OAKX grew from
asking what would happen if that artifact persisted across runs and added search, provenance,
evidence, revisions, and review.

The knowledge remains advisory. An entry cannot grant credentials, authorize a command, expand the
task, or override a current policy file. That distinction matters because shared memory is useful
only if an old or malicious entry cannot silently become operational authority.

I had already been building OAKX when I later found
[WikiSkill](https://arxiv.org/abs/2608.27454), which compiles agent experience into a persistent wiki
and then into reusable skills. WikiSkill did not inspire OAKX; it gave me a useful comparison point
and sharpened the question: what does direct access to governed knowledge improve during a task?

## What Changed And Why

I started with a six-task developmental pilot. A six-call limit sometimes left no call for the final
answer, so I invalidated that run and froze an eight-call budget. The first placebo also retained
treatment formulas under different identifiers, so I invalidated it and added a test that rejects
placebo entries containing task signatures, root-cause labels, expected values, or applicable rules.

The corrected pilot exposed the most important design issue. When I let the agent enumerate an
irrelevant knowledge directory, it dutifully opened every entry and used its entire budget.
Persistent memory was not automatically helpful. Retrieval behavior was part of the system.

So the scaled protocol allowed one bounded search by exact incident code and did not allow directory
enumeration. A hit returned the matching accepted entry. A miss forced the agent back to operational
investigation. Either way, the agent still had to read the live authoritative policy before its
answer could pass.

That change was not cosmetic. It turned “has access to a folder” into a specific intervention that
could be compared against a baseline and a shape-matched placebo.

## Setup

I ran the experiment locally and sequentially on the same machine I use for the rest of this work.
Research mode disabled model routing, fallbacks, subagents, remote inference, network tools, shell
access, and file writes during episodes.

- **Model:** `qwen3.8:27b-q4_K_M`, pinned by model digest
- **Hardware:** NVIDIA DGX Spark, GB10, with roughly 121 GiB available unified memory
- **Temperature:** `0`
- **Seed:** `7319`
- **Task bank:** 12 held-out synthetic repository incidents
- **Tool budget:** 8 calls, including the final submission
- **Execution:** one local model, one episode at a time
- **Primary metric:** strict task success

Each task repository contained an incident log, one authoritative policy under an opaque filename,
and five distractor policies. The incident code was opaque. Solving the task required finding the
right policy, identifying the root cause, applying a task-specific rule to live values, and citing
the file that supported the answer.

The matching OAKX entry contained the reusable rule and a pointer to the authoritative file. It did
not contain the live incident values or the final computed answer. The placebo exchange had the
same overall format but no task identifiers, diagnoses, answers, or applicable rules.

Strict success required all four of the following:

1. The exact root-cause identifier.
2. The exact recommended value.
3. The expected authoritative evidence path.
4. A trace proving that the authoritative file was actually read.

The protocol and task-bank hashes were recorded in the run manifest before the first scaled model
call. The developmental pilots remain documented, but they are excluded from the reported results.
Bootstrap intervals resampled the twelve tasks as paired units, preserving the within-task condition
comparisons.

## Core Result: OAKX Found the Rule

The first scaled comparison had three conditions: no shared knowledge, an unrelated placebo
exchange, and matching OAKX knowledge.

| Condition | Submitted | Strict success | Root cause | Correct value | Source read | Mean calls |
|---|---:|---:|---:|---:|---:|---:|
| Baseline | 0/12 | 0/12 | 0/12 | 0/12 | 3/12 | 8.00 |
| Unrelated placebo | 0/12 | 0/12 | 0/12 | 0/12 | 0/12 | 8.00 |
| Matching OAKX | 12/12 | **6/12** | **12/12** | 6/12 | **12/12** | **6.58** |

Under the frozen eight-call budget, OAKX improved strict success by 50 percentage points over both
comparators. The 95% paired-bootstrap confidence interval was +25 to +75 percentage points. Against
baseline, there were six paired wins and no losses, for a two-sided exact paired sign-test p-value
of `0.03125`.

![OAKX separated retrieval from execution](/img/posts/oakx-memory-to-action/oakx-retrieval-and-execution.png)

The strongest result was not the final score. OAKX agents found the correct root-cause label and
read the correct authoritative source in **12/12 tasks**. Baseline agents spent their eight calls
opening opaque files one by one and never submitted a complete answer.

That does not mean the incidents were impossible without OAKX. It means the matching knowledge
changed what the model could solve within the fixed investigation budget. A larger budget, better
native search, or a different model could move the baseline substantially.

The placebo result also needs careful interpretation. Unrelated knowledge did not improve
performance, but the retrieval interface prevented agents from browsing it entry by entry. The
study tests bounded lookup of relevant knowledge, not whether a model can safely navigate an
arbitrary wiki.

## Then the Agent Got the Math Wrong

OAKX did its part more consistently than the final success rate suggested.

In every treatment task, the agent found the right diagnosis, the right rule, and the current file
that established the rule. Only six agents produced the right value.

One trace quoted the correct expression, wrote `7 * 12 + 3`, and answered `99`. Another found the
correct modular-arithmetic rule and returned the wrong remainder. These were not retrieval misses or
stale-memory failures. They were execution failures after successful retrieval and verification.

That distinction narrowed the claim. OAKX was functioning as navigation and institutional memory,
but I had accidentally made mental arithmetic part of the benchmark. If I wanted to understand the
knowledge exchange rather than the model's multiplication reliability, I needed to separate those
two variables.

## The 2×2 Ablation

I crossed OAKX absent or present with a deterministic calculator absent or present. The two
no-calculator cells came from the immutable scaled run. I executed only the 24 missing cells.

The calculator was intentionally answer-blind. It accepted an arithmetic expression constructed by
the agent and supported numeric literals, parentheses, basic operators, modulo, and a small set of
functions such as `ceil`, `floor`, `min`, and `max`. It could not see task identifiers, repository
files, OAKX entries, expected answers, or grader state.

| OAKX | Calculator | Strict success | Root cause | Correct value | Source read |
|---:|---:|---:|---:|---:|---:|
| No | No | 0/12 | 0/12 | 0/12 | 3/12 |
| No | Yes | 2/12 | 2/12 | 2/12 | 6/12 |
| Yes | No | 6/12 | 12/12 | 6/12 | 12/12 |
| Yes | Yes | **11/12** | **12/12** | **11/12** | **12/12** |

The calculator-only cell also found two root causes that the no-calculator cell missed. That should
not be read as evidence that arithmetic reveals diagnoses. Exposing another tool changes the
agent's action space and trajectory, so the four cells are whole-agent configurations rather than a
perfectly isolated manipulation of arithmetic ability.

The combined condition used the calculator exactly once on each of the nine numeric tasks. All nine
deterministic calculations matched ground truth. It correctly avoided the calculator on the three
categorical tasks.

Adding the calculator improved OAKX from **50.0% to 91.7%** strict success. OAKX plus calculator beat
calculator-only on nine paired tasks and lost none, for a two-sided exact paired sign-test p-value of
`0.0039`.

The estimated factorial interaction was +25 percentage points, but its 95% paired-bootstrap
confidence interval ran from -8.3 to +58.3 points. With twelve tasks, that is evidence worth
following up, not a conclusive synergy estimate.

The one combined-condition failure was useful too. The expected sequence was
`seal>index>publish`; the agent returned `forge -> seal>index>publish`. The rule had been found and
the relevant subsequence was present, but the answer violated the required normalization. A
calculator was never going to fix that.

The pattern across the four cells is cleaner than any single score:

- The calculator could execute a known expression, but it could not reliably find the rule.
- OAKX could find and verify the rule, but it could not guarantee exact execution.
- Combining the two removed nearly all numeric failures.
- The remaining failure moved to a different layer: output formatting.

This is the main result of the study. “Agent memory” is not one capability. Retrieval, evidence
checking, deterministic execution, and answer normalization can fail independently.

## How This Compares to WikiSkill

OAKX and WikiSkill independently converge on a related premise: useful agent experience should
become persistent, inspectable knowledge instead of disappearing into old trajectories.

They intervene at different layers. WikiSkill separates immutable raw traces, a persistent wiki,
and executable skills. A maintainer consolidates experience into the wiki, a proposer converts that
knowledge into atomic skill changes, and validation decides whether to accept or roll back those
changes. The task-solving agent receives active skills rather than direct access to the wiki.

OAKX currently exposes accepted knowledge through bounded task-time search. Its focus is the
exchange around that knowledge: current evidence, provenance, exact revision, independent review,
conflict handling, deprecation, and a hard boundary between advice and operational authority.

WikiSkill reports experiments across five benchmarks, five models, and three independent skill-
evolution runs. For Qwen3.6-27B, its reported average rises from 39.4% without skills to 63.3% with
WikiSkill. That is a much broader evaluation than this one.

The percentages should not be ranked against each other. The model versions, tasks, budgets,
interventions, and replication counts are different, and I did not run WikiSkill on this task bank.
This study is inspired by the same broad research area, not a replication or head-to-head result.

There is still a useful parallel. WikiSkill reports that giving its inference agent wiki access
during training reduced average performance relative to keeping the wiki behind the skill proposer.
My developmental placebo likewise showed that unconstrained access to irrelevant entries can consume
the entire task budget. In both cases, accumulated knowledge needs a controlled path into active
behavior.

I do not see the approaches as mutually exclusive. OAKX could hold reviewed institutional knowledge.
A WikiSkill-like process could compile recurring accepted patterns into narrow procedural skills.
Deterministic tools could execute the parts that should not depend on next-token arithmetic.

## What This Establishes

Within this synthetic, budgeted, single-model setting, the experiment supports three claims.

First, exact-key retrieval from a matching OAKX corpus improved bounded task completion over both no
memory and a shape-matched unrelated corpus.

Second, the benefit was primarily navigational. OAKX produced perfect root-cause and authoritative-
source retrieval, while final value accuracy remained at 50% without a deterministic executor.

Third, composing reviewed knowledge with an answer-blind calculator produced 11/12 strict successes.
The two components addressed different observed failure modes.

It does **not** establish that OAKX is better than WikiSkill, that Git-backed Markdown is the best
memory representation, or that these gains will transfer unchanged to real production incidents.
It also does not test the hardest part of a knowledge exchange: learning, reviewing, correcting, and
revoking knowledge over time.

## Limitations

This is enough for a decent local systems result, not a general benchmark claim.

- The task bank is synthetic and contains twelve incidents.
- I used one quantized local model and one deterministic run per condition.
- The eight-call ceiling strongly shaped baseline performance.
- OAKX entries were prepared in advance rather than learned from prior episodes.
- The exact-key search is deliberately narrow and does not test semantic retrieval.
- Two factorial cells reuse the frozen scaled run rather than repeating all 48 episodes together.
- I did not test stale, conflicting, malicious, or subsequently revoked entries.
- I did not run WikiSkill, Trace2Skill, EvoSkill, or SkillOpt on this task bank.
- The experiment measures task-time use, not autonomous contribution or independent review.

The biggest scientific limitation is replication. Temperature zero and a fixed seed reduce one
source of variation, but they do not replace repeated runs across models and task families. The
confidence intervals quantify variation across these twelve paired tasks, not the full uncertainty
of agent behavior.

## What I Want To Test Next

The next experiment should start with an empty exchange rather than a prefilled one.

Agents would solve an initial batch of incidents, propose reusable entries, and send those entries
through evidence and safety review. Later agents would receive only the accepted revision. That
would test the full OAKX loop: discovery, contribution, review, reuse, correction, and deprecation.

I also want to vary the tool-call budget. The current study shows a large advantage at eight calls,
but a budget curve would reveal whether OAKX mostly saves time or changes eventual solvability.

Finally, I want to add cross-model transfer, semantic retrieval, deliberately stale entries,
conflicting evidence, adversarial corpus text, and a normalization validator. The 11/12 result is a
good reason to scale the experiment, but the shape of the failures is the more valuable guide.

The first lesson was that memory got the agent to the rule. The second was that reaching the rule
was only one part of getting the task right.

## References

- Tang, L., Rashtchian, C., Ferng, C.-S., Tomkins, A., Juan, D.-C., & Vu, T.
  [“WikiSkill: Compiling Agent Experience into Persistent Knowledge for Skill Evolution.”](https://arxiv.org/abs/2608.27454)
  arXiv:2608.27454, 2026.
- [OAKX Memory-to-Action Study repository](https://github.com/curtiscovington/oakx-memory-to-action)
