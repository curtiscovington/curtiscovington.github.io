## Building a Baby-Name CLI with GPT-5-Codex

*Project repo: **[github.com/curtiscovington/ssa-names](https://github.com/curtiscovington/ssa-names)*

What happens when you hand an AI a giant list of baby names and ask it to build a tool? In my case, curiosity led me to test GPT-5-Codex against the U.S. Social Security Administration’s [baby-name dataset](https://www.ssa.gov/oact/babynames/limits.html). I didn’t start with a plan — just an idea to see what Codex could do. By the end, I had a polished CLI that not only analyzed naming trends but also produced publication-ready charts and even generated random names that followed real-world statistics.

### Pairing With Codex

Working with GPT-5-Codex felt like collaborating with a junior engineer. I’d describe what I wanted — “add a trend command that plots data” or “embed the dataset into the binary” — and Codex would draft the code. I refined, tested, and nudged the design forward. Thanks to Go’s compiled nature, each step produced a working binary or a clear error, keeping the loop tight and momentum steady.

### From Dataset to Tool

The baby-name dataset itself is a classic in the data science world — almost a “toy dataset,” much like Iris or MNIST, but with the advantage of being real and relatable. Analysts, students, and hobbyists have long used it to explore time-series, clustering, or just to visualize cultural trends in naming. It’s clean, simple, and common to play with, which made it a perfect fit for experimenting with Codex.

The tool ended up answering two simple but interesting questions:

1. *What are the top names for a place and time?*
2. *How does a name’s popularity change over decades?*

Codex helped implement key design choices, like embedding the dataset inside the binary for zero setup and reproducibility. It also handled visualization: ASCII sparklines for quick checks, and SVG exports polished enough for articles or reports. Small touches like clean legends and mid-year ticks gave the charts a professional look.

### Quirky but Fun

One of the most entertaining outcomes was a feature to generate random names based on actual statistical distributions. It’s silly and not exactly practical, but it highlights Codex’s flexibility. The fact that a throwaway idea could quickly become a working feature shows how fluid the collaboration was.

### How the Name Distribution Works

Behind the scenes, the generator uses the frequencies from the SSA dataset to build a weighted distribution. Each name’s count for a given year (or set of years) is treated as its weight. When generating a random name, the program samples from this weighted pool. This means names like *Emily* or *Michael*, which historically had very high counts, are much more likely to be drawn than rarer names.

#### The math (plain English)

- Give each name a weight equal to its observed count.
- Let C be the total of all counts; the probability of a name is its count divided by C.
- To sample, draw a uniform random number between 0 and 1 and find the first cumulative probability that exceeds it ([[roulette‑wheel selection](https://en.wikipedia.org/wiki/Roulette_wheel_selection)]\([https://en.wikipedia.org/wiki/Stochastic\_universal\_sampling](https://en.wikipedia.org/wiki/Stochastic_universal_sampling))). The integer equivalent is to draw r uniformly from 1..C and walk the cumulative counts until you pass r.
- Edge cases: if the list is empty or C equals 0, return an error; ignore any entries with zero weight.

Why this works: over many trials, the fraction of times each name is drawn converges to its true share of the counts (law of large numbers). We verify this with tests that check both single-name proportions and whole-distribution fit.

### Go implementation (core sampler)

This project uses an **alias method** sampler (constant-time picks after preprocessing). The sampler stores two arrays — `prob` (scaled probabilities) and `alias` (alternate indices) — alongside the original entries. If the alias tables aren’t present (e.g., precomputation skipped), it falls back to a simple uniform pick among the aggregated entries.

Instead of embedding the full code here, the gist is:

- During construction, probabilities are scaled so their average is 1.
- Entries with scaled < 1 go into a “small” list; others into “large.”
- Small and large entries are paired so that each index has a probability and (if needed) an alias fallback.
- Picks are O(1): choose an index at random, then either keep it or fall back to its alias depending on a uniform draw.

You can see the full implementation, including the `NewNameSampler` constructor and `Pick` method, directly in the [names.go file](https://github.com/curtiscovington/ssa-names/blob/main/internal/namesdata/names.go).

**Why alias sampling?** After a one-time preprocessing step that builds `prob` and `alias`, each draw is O(1) and preserves the original weighted distribution exactly. This is equivalent in distribution to roulette‑wheel selection but avoids a linear scan or binary search per pick.

### Testing the statistics

- **Single-name proportion via binomial CI.** If a name’s true share is p and we draw n samples, the observed draws should fall inside a high-confidence binomial interval most of the time. The tests compute this interval (99%) and assert compliance for multiple seeds.
- **Whole-distribution fit via chi-square.** Combine categories with small expected counts until each bucket has at least \~5 expected, then compare the chi-square statistic to the 99th percentile for (K-1) degrees of freedom. The sampler stays below the threshold on synthetic and real slices of the dataset.

These checks, plus deterministic results under fixed seeds, give high confidence that the sampler reproduces the empirical distribution accurately while staying fast and simple.

### Lessons Learned

- **Speed of iteration.** The “ask–build–refine” loop made development addictive.
- **Data fluency.** With light guidance, Codex could parse, aggregate, and visualize real-world data.
- **Pair-programming potential.** Treating Codex like a junior engineer kept me in control while offloading the heavy lifting.

### Polish and Release

To finish the project, I also had Codex help me wire up GitHub Actions. Now, whenever I push a new tag, an automated workflow builds and publishes a release on GitHub. That means anyone can grab a fresh binary directly from the repository without needing to compile from source. It also reinforces the theme of reproducibility: one tag, one artifact, ready to run. This step made the project feel less like an experiment and more like real software you could share.

### Next Steps for Distribution

Another good next step would be to sign and notarize the binaries. Right now, macOS users may see a warning that the binary is from an unidentified developer. Code signing and notarization would eliminate those warnings, making the CLI feel fully published and professional, just like software you’d download from a trusted source.

### Looking Ahead

The baby-name dataset also pairs well with other public data sources. For example, U.S. Census demographic data could highlight naming trends across different regions or populations. Immigration records and cultural trend datasets could show how new influences shift name popularity. Even birth statistics by geography or socioeconomic factors could add layers of insight. These combinations could turn a simple toy dataset into a richer exploration of culture and history.

This project taught me that building software with AI isn’t just faster — it’s more enjoyable. Instead of wrestling with boilerplate, I could focus on ideas and experimentation. If this is what’s possible today, the future of coding with AI may feel less like writing code line by line and more like shaping projects through conversation. My advice: pick a dataset, start small, and let the loop of “ask, build, refine” surprise you.

