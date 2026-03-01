# Blog Drafting Agent Guidelines (Curtis Covington)

These instructions define how to draft blog posts for this site in Curtis's current style and structure.

## Objective

Write technically credible posts that are:
- practical and reproducible
- quantitative when possible
- honest about caveats
- readable by engineers without hype

## Voice and Tone

- Lead with a concrete question or thesis in the first 1-3 lines.
- Use direct first-person framing (`I wanted to test...`, `I ran...`, `I found...`).
- Prefer clear claims over abstract language.
- Keep confidence calibrated: strong where measured, cautious where inferred.
- Avoid marketing tone, fluff, and grand predictions.
- Use short emphasis for key claims (`**yes—with caveats**`, `**k=16 was best**`).

## Post Shape

Use this section order by default:

1. Hook: practical question + short answer
2. Why this matters
3. Setup (condensed, reproducible details)
4. Core results (metrics first)
5. Visuals/artifacts
6. Interpretation (what patterns/features appeared)
7. Tradeoffs/limitations
8. Next steps
9. TL;DR (actionable takeaway)

## Writing Patterns to Match

- Use "local-first" framing when relevant (local hardware, reproducible runs, no unnecessary cloud dependency).
- Contrast goals in pairs: qualitative vs quantitative, reconstruction vs sparsity, in-domain vs transfer.
- Explain evaluation protocol briefly before metrics so readers trust the numbers.
- Call out asymmetries and edge behavior explicitly (for example, A→B differs from B→A).
- Include one concise caveat block when needed (`Note:`), not repeated disclaimers.

## Evidence and Rigor Rules

- Do not invent metrics, experiment configs, or outcomes.
- Separate measured facts from interpretation.
- If exact numbers are missing, state what is known and mark unknowns clearly.
- Include at least one "what changed and why" paragraph when comparing iterations.
- Always include a `Limitations` section for technical posts.

## Formatting Conventions

- Keep paragraphs short (2-5 sentences).
- Use bullets for configs, metrics, and takeaways.
- Prefer explicit labels:
  - `Model`, `Layer/stream`, `Token budget`, `Hardware`, `Objective`
- Use section headers in title case.
- Include a final TL;DR with one clear sentence in bold.

## Front Matter Template

Use this baseline and fill only known values:

```yaml
---
title: "..."
description: "..."
date: YYYY-MM-DD
tags:
  - ai
  - ...
reading_time: "X min read"
repo_card:
  url: "..."
  title: "..."
  description: "..."
---
```

## Drafting Workflow (Preferred)

Best practice is a two-pass workflow:

1. During project work: capture running notes
- Save commands run, config diffs, key metric snapshots, and notable failures.
- Keep a lightweight changelog so later writing is factual and fast.

2. After a meaningful milestone: draft the post
- Write once results are stable enough to summarize.
- Use captured notes to fill setup, protocol, metrics, and caveats.
- Add visuals only if they clarify the decision or finding.

This is better than fully writing in parallel because real conclusions usually shift while building. Parallel capture + post-milestone drafting gives speed without narrative drift.

## If Asked to Draft Mid-Project

Produce a `working draft` with explicit placeholders:
- mark provisional claims as `preliminary`
- include a `What may change` section
- avoid hard TL;DR conclusions until core metrics settle

## Reusable Prompt Stub

Use this when asked to draft:

`Draft a blog post in Curtis's style using the AGENTS.md blog guidelines. Lead with a practical question, prioritize reproducible setup + measured results, include limitations, and end with a one-sentence bold TL;DR. Do not invent numbers; mark unknowns clearly.`
