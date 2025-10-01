---
title: "Building a Name CLI with GPT-5-Codex"
description: "Pairing with GPT-5-Codex to turn the SSA baby-name dataset into a polished Go CLI with weighted sampling, charts, and automated releases."
date: 2025-09-29
tags:
  - ai
  - go
  - cli
reading_time: "6 min read"
repo_card:
  url: "https://github.com/curtiscovington/ssa-names"
  title: "SSA Names CLI"
  description: "Explore the weighted sampler, statistical tests, and release automation on GitHub."
---
I handed GPT-5-Codex the SSA's baby-name dataset and asked it to build a CLI. No plan, just curiosity about what modern AI could deliver when paired with a real dataset. Two hours later, I had a tool that could generate statistically accurate random names—and I'd validated it with proper hypothesis testing. Yay statistics!

## The Hook: Probabilistic Name Generation

The most interesting feature turned out to be the random name generator. It samples from the actual distribution of baby names in the SSA dataset, meaning if you ask for a random female name from California in 2019, you're far more likely to get "Olivia" (2,610 occurrences) than "Zelda" (maybe 5).

This required solving a classic computer science problem: weighted random sampling. Given a list of items with different frequencies, pick one at random such that the probability matches the real-world distribution.

## Why This Matters

Most sampling code you'll find online uses the naive approach: build a cumulative sum array, pick a random number, binary search. That's O(log n) per sample. For a baby-name generator that might run thousands of times, we can do better.

The solution is the alias method—a 1970s algorithm that does O(n) preprocessing to enable O(1) sampling forever after. Here's how it works:

1. Scale all probabilities so their average equals 1.
2. Partition into "small" (< 1) and "large" (≥ 1) buckets.
3. Pair each small probability with a large one as an "alias".
4. To sample: pick a random index, then either keep it or jump to its alias based on a coin flip.

The implementation is elegant. Codex drafted it, I refined the edge cases, and then—critically—I validated it.

## Statistical Rigor: Actually Testing the Distribution

Most AI coding articles end with "it works!" This one ends with proof.

I wrote tests that validate the sampler using two techniques from probability theory:

### Single-Name Validation: Binomial Confidence Intervals

If Olivia represents 1.4% of names and we draw 5,000 samples, we expect roughly 70 Olivias. But random variation means we might get 65 or 75. How much variation is acceptable?

The binomial distribution gives us exact bounds. At 99% confidence, 5,000 draws of a 1.4% probability should yield between 51 and 91 successes. My tests compute these intervals using the cumulative distribution function and assert that observed counts fall within bounds across multiple random seeds.

```go
trials := 5000
share := 0.014  // Olivia's true proportion
lower, upper := binomialConfidenceBounds(trials, share, 0.99)
// Run sampler with different seeds
// Assert: lower <= observed && observed <= upper
```

This catches subtle bugs. If the sampler had even a small bias, the tests would fail across different seeds.

### Whole-Distribution Validation: Chi-Square Testing

Testing one name proves that name works. Testing the entire distribution requires the chi-square goodness-of-fit test.

The idea: for each name, compute expected vs. observed counts. If the sampler is unbiased, the sum of `(observed - expected)^2 / expected` follows a chi-square distribution. Compare this to the 99th percentile threshold—if you exceed it, your sampler is broken.

One wrinkle: chi-square requires each category to have at least ~5 expected occurrences. For rare names, I combine them into buckets until this threshold is met.

```go
chiSquare := 0.0
for _, bucket := range buckets {
    diff := bucket.observed - bucket.expected
    chiSquare += (diff * diff) / bucket.expected
}
threshold := chiSquaredQuantile(0.99, degreesOfFreedom)
// Assert: chiSquare < threshold
```

I run this on 20,000 samples. It passes. The alias method produces a distribution statistically indistinguishable from the true dataset.

## The Real Dataset Validation

The final test uses actual SSA data—California 2019 female names, 184,494 births across thousands of names. I validate two ground truth values:

- Total births: 184,494
- Olivia's count: 2,610

Then I run the sampler for 6,000 trials across multiple seeds and verify Olivia's draw count falls within the 99% binomial confidence interval. It does.

This proves the sampler works not just on toy data but on real-world distributions with long tails and rare names.

## Working With Codex

The collaboration felt like pair programming with a junior engineer who types fast but needs direction. I'd say "implement the alias method" and Codex would draft it. I'd catch edge cases—what if all weights are zero? What about negative counts?—and Codex would patch them.

The tight feedback loop mattered. Go's compiled nature meant every iteration either produced a working binary or a clear error. No mystery runtime failures, no silent bugs. When I asked for statistical tests, Codex generated the scaffolding; I added the mathematical details.

Key insight: AI isn't replacing the thinking; it's handling the translation from idea to code. I still needed to know what the alias method was, why it mattered, and how to validate it properly. Codex just made the implementation phase dramatically faster.

## Beyond Random Names: The Full CLI

The tool also answers practical questions:

### What are the top names for a place and time?

```bash
$ ssa-names top --state CA --year 2019 --gender F --limit 5
1. Olivia (2,610)
2. Emma (2,377)
3. Mia (2,144)
...
```

### How has a name's popularity changed over decades?

```bash
$ ssa-names trend --state CA --name Olivia --gender F
```

This generates SVG charts with clean legends and mid-year tick marks. Codex handled the visualization logic; I focused on making the output publication-ready.

One design choice worth noting: the dataset is embedded in the binary. No setup, no downloading files, no version drift. You install the CLI and it just works. This matters for reproducibility—anyone can verify my statistical tests by running the exact same binary.

## Lessons Learned

Validation takes longer than implementation. Writing the sampler took 20 minutes. Writing tests that prove it's correct took an hour. The tests are more valuable than the code.

AI accelerates the boring parts. Parsing CSVs, aggregating data, generating SVG—this is well-trodden territory that Codex handles easily. The interesting work (choosing algorithms, designing tests, validating correctness) still requires human expertise.

Reproducibility matters. Embedding the dataset, adding GitHub Actions for releases, and making the CLI zero-setup turns a toy project into something others can actually use and verify.

## What's Next

The dataset pairs well with other public data. U.S. Census demographics, immigration records, regional birth statistics—these could reveal how naming trends correlate with cultural shifts. The SSA data is clean and accessible, but it's just one dimension of a much richer story.

For the CLI itself, code signing would eliminate the "unidentified developer" warning on macOS. Right now it works but requires users to bypass Gatekeeper. Proper notarization would make it feel like production software.

This project taught me that AI-assisted development isn't about writing less code—it's about spending time on the parts that matter. Instead of wrestling with CSV parsing, I validated a probabilistic system with proper statistical tests. That's a better use of time, and it's a hint of how development might feel in the future: less typing, more thinking.

If you want to try it yourself, grab the dataset, pick an algorithm that interests you, and let the "ask, build, test" loop surprise you. The code is at [github.com/curtiscovington/ssa-names](https://github.com/curtiscovington/ssa-names).
