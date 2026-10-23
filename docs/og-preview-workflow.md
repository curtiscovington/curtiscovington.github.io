# Open Graph Preview Workflow

Use this process for social images. The site-wide default is
`/img/social/site-preview-portrait-v2.png`, rendered at 1200×630 from
`docs/social-card.html` using Chromium with Newsreader and Inter loaded.
The HTML source is excluded from the published site by the `docs` exclusion.

## Path Convention

Store each post preview at:

`/img/posts/<slug>/social-preview.png`

Then set front matter:

```yaml
og_image: "/img/posts/<slug>/social-preview.png"
```

## Card Recipe (Consistent Base)

- Canvas: `1200x630`
- Background: warm paper `#f5f2ea`
- Main text: ink `#252d29`; secondary accent: muted olive `#66705b`
- Typography: Newsreader headings and Inter labels
- Fine horizontal rules, generous margins, no gradients or watermarks
- Site-wide card: author name and Experiments & Lab Notes on the left, approved portrait on the right
- New post cards: use the same typography and palette with the post title;
  evidence or article-specific imagery can be included when useful
- Existing custom post images remain independent and take priority over the site default

## Pre-Publish Checks

- Confirm image exists in the expected post directory.
- Confirm front matter path begins with `/img/...`.
- Confirm generated page output resolves `og:image` and `twitter:image`.
- Validate the URL after deploy with Open Graph/Twitter preview validators.

## Fallback Behavior

If a post has no `og_image`, social metadata falls back to:

1. `page.og_image`
2. `page.image`
3. `site.og_image` in `_config.yml`
