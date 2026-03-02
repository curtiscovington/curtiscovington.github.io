# Open Graph Preview Workflow

Use this process for every post-specific social image.

## Path Convention

Store each post preview at:

`/img/posts/<slug>/social-preview.png`

Then set front matter:

```yaml
og_image: "/img/posts/<slug>/social-preview.png"
```

## Card Recipe (Consistent Base)

- Canvas: `1200x630`
- Background: dark blue gradient based on the site palette
  - `#0B1020` to `#111833`
- Left element: monogram mark
- Right element: `Curtis Covington` name lockup
- Overlay: post title text
- Watermark: very faint `CC` in the background
- No additional imagery

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
