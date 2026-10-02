---
layout: post
title: "I Tested a Local Incident Triage Model. Accuracy Wasn't Enough."
description: "On 288 held-out synthetic cases, a trained text classifier beat Laya 86.5% to 34.7%. Its routing policy still missed a 5% error target."
date: 2026-10-02
tags:
  - ai
  - evaluation
  - local-ai
  - calibration
  - incident-response
reading_time: "11 min read"
og_image: "/img/posts/local-incident-triage/local-incident-triage-cover.png"
og_image_width: 1536
og_image_height: 1024
repo_card:
  url: "https://github.com/curtiscovington/laya-incident-triage/tree/v0.1.0"
  title: "Local Incident Triage Study (v0.1.0)"
  description: "Frozen protocol, grouped synthetic incidents, local inference, raw predictions, calibration, and routing-risk analysis."
---

Can a small local decision model read an incident report, identify the responsible team, and tell
me when it should ask for help?

I built a controlled experiment around that question. On **288 held-out synthetic cases**, the
Laya model got ownership, current impact, and evidence quality all correct **34.7%** of the time.
A task-trained TF-IDF classifier reached **86.5%**.

Then the stronger system failed a different test.

A routing policy selected on development data accepted 177 test cases. **Twenty-six of those
accepted decisions were wrong: a 14.7% error rate**, despite a development target of at most 5%.

The classifier was much better at the task. That still did not establish that I could trust it
to decide which incidents should bypass review.

[Code, frozen protocol, and complete results (v0.1.0)](https://github.com/curtiscovington/laya-incident-triage/tree/v0.1.0)

![A four-panel research comic showing local Laya decisions, 36 held-out incident families, Laya and TF-IDF accuracy, and 26 errors among 177 routed classifier cases.](/img/posts/local-incident-triage/local-incident-triage-cover.png)

### TL;DR (Layman Version)

I gave a small local model fictional incident reports and asked it to choose a team, an impact
level, and whether the evidence was good enough. A simpler classifier trained on examples did
much better. But when I let that classifier accept only the cases it considered sufficiently
certain, its error rate rose substantially from development to test.

**Choosing from valid labels, getting the labels right, and knowing when to ask for help were
three different problems.**

## Why I Wanted To Try This

Incident triage has a useful shape for testing AI inside software. The input is messy text, but
the output can be narrow: a team, an impact category, and a review decision.

That is what interested me in
[TypeSafe's introduction of Jev](https://typesafe.ai/blog/introducing-system-one-models-and-jev).
The idea of sending state and receiving typed decisions with probabilities felt closer to a
software component than a conversational assistant.

I wanted the experiment to run entirely locally, without an inference API or account. I did not
find a public release of TypeSafe Jev's weights, so I used the independent open-weight
[Laya model](https://huggingface.co/convaiinnovations/laya/tree/55cf4c4ebb4ebe31b2550e8bdf3bd21b99753851).
Its interface supports the same general pattern: supply context and explicit answer options,
then receive structured decisions and their probability distributions.

**This post evaluates Laya, not TypeSafe Jev.** The distinction matters more than the similar
interface. Nothing in these results establishes how TypeSafe's model would perform.

I also kept the task narrower than incident response. The system would recommend routing or
review. It would not page anyone, restart a service, or change infrastructure.

## What Changed And Why

The first version was a 20-case exploratory proof of concept. Laya got all three decisions right
on **6/20 cases**; a small keyword baseline got **13/20**. At the untuned 0.90 probability
threshold, Laya sent everything to review.

That was enough to prove the code worked. It was not enough to make a useful general claim.

The baseline had been written alongside the examples. There was no separate development set,
and the small collection mixed straightforward cases with several different failure conditions.
A handful of interesting errors could easily dominate the interpretation.

For the larger study, I froze a protocol, kept related cases together, added a learned baseline,
and separated model accuracy from probability quality and routing behavior. I also kept the
original pilot out of the reported test set.

The key change was the unit of evaluation. Rewriting one incident eight ways should not turn it
into eight independent pieces of evidence.

## Setup

The model ran directly in Python on my local workstation. The machine has an NVIDIA GB10, but
this experiment used **CPU inference**, not the GPU.

- **Model:** Laya English, 421M parameters, pinned Hugging Face revision.
- **Runtime:** `laya==0.3.20`, CPU PyTorch, four threads.
- **Inputs:** a short runbook plus incident text.
- **Outputs:** three Choice questions, each with explicit allowed labels.
- **Inference:** one incident at a time, after a fixed training-case warmup.
- **Network:** local weights, offline library settings, and Python socket connections blocked
  during the scored inference runs.
- **Primary metric:** all three labels correct on the same incident.

The questions were:

| Field | Allowed Labels | What I Wanted It To Establish |
|---|---|---|
| Owner | network, database, application, unknown | The demonstrated fault's owning team |
| Impact | critical, degraded, low, unknown | Current production impact |
| Evidence | sufficient, missing, conflicting | Whether owner and impact were established consistently |

The runbook distinguished a demonstrated cause from a symptom or a change that merely coincided
with a failure. It also made current impact explicit: an alarming fault in staging should not be
classified as a production outage, and a repaired incident should not retain its historical
severity.

Unknown was a valid answer. If the report did not establish ownership or current impact, the
model was supposed to say so.

The harness rejected inputs that would truncate the incident, question, or candidate descriptions.
Every scored case passed that check. This matters because silently dropping the last sentence of
an incident can change the task completely.

## A Grouped Synthetic Test

I built **72 fault-mechanism families**, evenly divided among the three known owner categories.
Each family had eight variants:

1. A clean statement of the fault and current impact.
2. A rewrite that changed wording and sentence order.
3. Irrelevant historical context and team-name distractors.
4. A ticket comment containing instructions to choose incorrect labels.
5. Missing evidence about the owner.
6. Missing evidence about current impact.
7. Unresolved contradictory impact observations.
8. An explicitly repaired incident with healthy production.

That produced **576 records**, split by family:

| Split | Families | Records | Purpose |
|---|---:|---:|---|
| Training | 24 | 192 | Fit the text classifier and majority baseline |
| Development | 12 | 96 | Select regularization, calibration, and routing thresholds |
| Test | 36 | 288 | Evaluate the frozen systems |

All eight variants of a mechanism stayed in the same split. Labels came from the explicit
runbook rules and controlled transformations, rather than another model acting as judge.

The inference runner read label-free inputs. After all test predictions were saved, the analysis
joined them to the expected labels. The protocol, source files, data, and weights were bound by
content hashes. The development selection file was written before test inference began.

This was a **local protocol freeze**, not an externally registered preregistration.

There is an important limit built into the design: the condition templates were shared across
splits. The mechanisms were held out; the writing style and template structure were not. The
study measures generalization to new mechanisms within that synthetic distribution.

## The Baselines Were Part Of The Experiment

I compared Laya with three alternatives:

- **Training majority:** choose the most common training label for each field.
- **Keyword rules:** the original pilot's simple word-matching logic.
- **TF-IDF logistic classification:** represent text using word and character sequences, then
  fit one classifier for each output.

TF-IDF gives weight to useful words and short sequences without running a pretrained language
model. I fitted its vocabulary and coefficients on training data only, selected regularization
from three candidates on development data, and did not refit on test data.

This is deliberately an asymmetric comparison. The classifier gets labeled examples of this
task; Laya gets the runbook and options but no task fine-tuning. It answers a practical question
about two local systems I could build. It does not isolate architecture or show that a bag of
words is generally better than a decision model.

## Core Result: The Learned Classifier Won

| System | All Three Correct | Exact Accuracy | 95% Family-Bootstrap Interval |
|---|---:|---:|---:|
| TF-IDF classifier | **249/288** | **86.5%** | 76.7–94.8% |
| Laya | 100/288 | 34.7% | 28.5–41.0% |
| Keyword rules | 66/288 | 22.9% | 16.0–30.2% |
| Training majority | 28/288 | 9.7% | 3.8–16.3% |

The prespecified paired comparison favored the classifier by **51.7 percentage points**. Its
95% family-bootstrap interval was **39.9 to 62.5 points**.

I resampled whole families, retaining their eight conditions together. The prespecified
cluster sign-flip test gave an approximate two-sided p-value of `0.00005`, at the resolution of
20,000 Monte Carlo draws. That inference is conditional on the study's family-level assumptions
and synthetic task distribution. It does not turn these records into a representative sample
of production incidents.

![All-three accuracy for the four systems, with confidence intervals resampling held-out incident families.](/img/posts/local-incident-triage/accuracy.png)

The individual fields explained much of the gap:

| System | Owner Accuracy | Impact Accuracy | Evidence Accuracy |
|---|---:|---:|---:|
| Laya | 79.2% | 53.1% | 75.3% |
| TF-IDF classifier | 86.5% | **100.0%** | **100.0%** |

The classifier learned the impact and evidence patterns perfectly on this test. That is useful
within the experiment, and also a reason to resist an expansive interpretation: those fields
had strong, repeated template cues. Ownership across unfamiliar mechanisms was the harder part.

Laya's owner score was much better than its joint score. Getting the team roughly right did not
mean the full triage recommendation was right.

## The Same Facts Could Produce A Different Impact

One held-out case concerned disabled proxy ARP. The clean incident read:

```text
Gateway inspection proves disabled proxy ARP prevents the routed subnet
from being reached. Current production observation: the fault is isolated
to staging; production is healthy and unaffected.
```

Laya returned the expected labels:

```text
owner: network
impact: low
evidence: sufficient
```

The rewritten version preserved those facts:

```text
Only staging is affected. There is no current effect on production customers.
The routed subnet is unreachable because gateway inspection confirms
proxy ARP was disabled.
```

This time, Laya returned `network / degraded / sufficient`.

The output was structurally valid. It was also wrong under the runbook's definition of current
production impact.

Across the **24 families where Laya got the clean case entirely correct**, the rewrite made
**18 incorrect**. The embedded-instruction condition also made 18 of those 24 incorrect.

![Accuracy by controlled condition for the keyword rules, learned classifier, and Laya.](/img/posts/local-incident-triage/conditions.png)

Those are descriptive failure rates, not two additional confirmatory hypothesis tests. The
rewrite changed both wording and sentence order, so this experiment cannot tell me which
change caused the instability. I would need separate order-only and wording-only controls to
make that attribution.

The example is still useful. The practical behavior I wanted was stable handling of a short,
explicit staging-only incident. That behavior did not survive the combined rewrite.

## Calibration Helped The Probabilities, Not The Answers

I also tested whether Laya's reported probabilities could be improved without changing its
weights or chosen labels.

For each of the three outputs, I fitted a single temperature on development data. Temperature
scaling sharpens or softens a distribution while preserving its class ranking. Here it operated
on the checkpoint's rounded output probabilities, not its original logits.

| Laya Condition | Mean Field Brier Score | Mean Field Negative Log-Likelihood | Exact Accuracy |
|---|---:|---:|---:|
| Raw | 0.4966 | 0.9191 | 34.7% |
| Development-calibrated | **0.4131** | **0.7336** | 34.7% |

Lower is better for both probability-quality metrics. The descriptive mean Brier improvement
was **0.0836**, with a family-bootstrap interval of **0.0686–0.0978**. Brier scores here sum
squared probability errors over the labels, then average across records and fields.

![Impact reliability before and after development-only calibration, alongside the text classifier.](/img/posts/local-incident-triage/reliability.png)

The development fit sharpened Laya's distributions on this task. I would not describe that as
proof that Laya is generally underconfident; the result depends on this checkpoint, prompt,
label space, and data distribution.

More directly: **better probability scores did not correct a single chosen label**. The model
still made the same classification mistakes. Calibration had to be evaluated separately from
whether a routing policy could use those probabilities successfully.

## The Routing Policy Was The More Important Test

A useful triage component needs more than a high average score. It needs a workable rule for
which decisions to accept and which to send for review.

My routing rule first required known owner and impact labels, plus sufficient evidence. Then
it gated on the minimum of the three selected-label probabilities. That minimum was a routing
score, not an assumption that it equaled the probability of the complete decision being correct.

On development data, I selected a threshold that maximized coverage while requiring:

- at most **5% empirical all-three error** among accepted cases;
- at least **20 accepted records**;
- representation from at least **five incident families**.

If no threshold qualified, automatic routing was disabled. The constraints and threshold grid
were fixed in the protocol. I did not relax them after looking at test results.

Neither raw nor calibrated Laya qualified.

The TF-IDF classifier did. At its selected threshold of `0.39`, it accepted **58 development
cases from 12 families**, with **two errors: 3.4%**.

Then I applied the same policy to the test set:

| System | Accepted Test Cases | Coverage | Wrong Accepted Cases | Accepted-Case Error |
|---|---:|---:|---:|---:|
| Laya | 0 | 0.0% | 0 | Undefined |
| Calibrated Laya | 0 | 0.0% | 0 | Undefined |
| TF-IDF classifier | **177** | **61.5%** | **26** | **14.7%** |

For the classifier, the descriptive family-bootstrap interval around routed error was
**5.7–24.9%**. It is not a certified risk bound. More fundamentally, the development constraint
had only bounded observed development error; it had never guaranteed future error.

![Descriptive test error versus routing coverage. These curves were not used to choose new test thresholds.](/img/posts/local-incident-triage/risk-coverage.png)

The test curves show what different thresholds would have done, but I did not use them to
choose a more flattering operating point.

Laya's zero accepted errors are not evidence of successful automation. It accepted no cases.
The classifier automated a substantial fraction, but its development target did not transfer.

That is the part of the result I would carry into an actual system design. Classification
accuracy, probability quality, and selective routing need separate held-out checks.

## Runtime And Reproducibility

Laya's median scored inference took **1.60 seconds per incident** on CPU; the nearest-rank p95
was **1.93 seconds**. Those measurements include the input-budget checks and all three questions,
but exclude loading the model. They follow one fixed training-case warmup.

I did not benchmark the alternatives under a matched latency protocol, so this is not a speed
comparison with a classifier, a local LLM, or a hosted service.

The public repository includes the data generator, split manifests, frozen protocol, complete
raw predictions, development-selected settings, trained classifier, and report figures.
You can reproduce the analysis without downloading Laya:

```bash
git clone https://github.com/curtiscovington/laya-incident-triage.git
cd laya-incident-triage
git checkout v0.1.0
python3 -m venv .venv
.venv/bin/pip install -r requirements-analysis.txt
.venv/bin/python study/run.py analyze
.venv/bin/python study/render_figures.py
.venv/bin/python study/verify_results.py
```

The [repository README](https://github.com/curtiscovington/laya-incident-triage/tree/v0.1.0)
also documents downloading the pinned public weights and running a new incident locally.
All 17 harness and study tests passed. A separate verification pass checked complete prediction
coverage, data regeneration, preserved class rankings after calibration, report counts, and
artifact provenance.

The initial public Git commit came after the experiment. The retained local freeze records the
earlier protocol state; I am not presenting the publication timestamp as preregistration.

## Limitations

The most important limit is the data distribution. This is a synthetic stress test with shared
condition templates, not an operational incident sample. The learned classifier can exploit
those repeated patterns. Its perfect impact and evidence scores should be read in that context.

There are **36 held-out families**, not 288 independent incidents. Some mechanisms are also
semantically related despite different family identifiers. The intervals preserve within-family
correlation; they cannot eliminate every dependency in an authored task bank.

The labels were authored with the generator and mechanically checked against the runbook.
Independent human adjudication has not happened. I included a blinded review sheet in the
repository, but that is preparation for review, not a claim that review is complete.

I tested one Laya checkpoint with fixed prompts. I did not fine-tune it, compare a second
open-weight decision model, or run a local generative LLM baseline. The classifier's supervised
training makes this a practical systems comparison, not an equal-data capability comparison.

Finally, no production actions occurred. “Routing” means accepting an advisory recommendation
inside the evaluation harness. The study says nothing about the downstream consequences of
paging the wrong team or delaying a real incident.

## What I Want To Test Next

The next useful data should look less like the generator.

I would start with independently written incident summaries and independently reviewed labels,
then freeze a new test set. That would test whether the classifier's advantage survives when
impact and evidence are expressed without the familiar template phrases.

I also want separate wording-only and order-only controls for the rewrite failures, a local LLM
comparator, and a second decision-model checkpoint. Those additions would help distinguish this
specific model/prompt combination from the broader interface idea.

For routing, I would use more development families and a procedure designed to estimate or bound
risk under stated assumptions, rather than treating a small development-set point estimate as a
promise. Another round of threshold tuning on the current test set would answer the wrong question.

The useful result here is already concrete: I could build a local typed-decision component, and
I could measure where it failed. The strongest classifier in the comparison still needed a
separate test of whether its accepted decisions were reliable enough to act on.
