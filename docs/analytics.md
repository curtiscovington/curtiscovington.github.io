# Blog Analytics

## Activate

1. Create a free Umami Cloud Hobby account and add `curtiscovington.com`.
2. Copy the public website ID and script URL from its tracking snippet into
   `analytics.website_id` and `analytics.script_url` in `_config.yml`.
3. Build with `JEKYLL_ENV=production` and deploy through the existing GitHub Pages workflow.
4. Visit a post on the production domain and check Umami Realtime for a single
   pageview, depth milestones, and a repository click. Development builds,
   other hostnames, Do Not Track, and Global Privacy Control are excluded.

The integration is inactive until configured. No account or dashboard is created
by the code. The dashboard stays in your Umami account, not on the public blog.

## Signals and decisions

| Signal | Question it helps answer |
| --- | --- |
| Pageviews and referring pages | Which posts and sources bring readers? |
| `article_depth`, `depth_percent`: 25, 50, 75, 100 | Where do visitors stop scrolling? |
| `article_visible_time`, `visible_seconds`: 30, 60, 120, 300 | Which posts stay open in a visible tab? |
| `resource_click`, `resource_type`: repository, huggingface, external, rss | Do readers move from the post to its artifacts or feed? |

Clicks also include `link_domain` and `link_path`, without query strings,
fragments, or link text. Page URLs and referrers are also stripped of queries
and fragments. This deliberately forgoes UTM campaign attribution. No custom
visitor identifiers, cookies, session replay, or form values are added.

Depth means the viewport reached that part of the article, not that the person
read it. Short articles can reach all thresholds immediately. Visible time is
not proof of attention; idle visible tabs still count. Milestones fire once per
page load, so repeat visits count again. Blockers, privacy preferences, rapid
navigation, and network failures cause undercounting. Background timer gaps are
capped, and no events are queued indefinitely when the tracker is blocked.

## Weekly review

Compare the last 28 days with the previous 28, filtered by post and referral
source. Compare posts at similar ages after publication and include raw counts.

- High traffic, low depth: test a clearer opening or move the key result upward.
- High depth, low artifact clicks: clarify what the repository/model contains.
- Low traffic, strong engagement: improve discovery and distribution.
- Strong artifact clicks: consider a follow-up with more runnable examples.

Use 100% depth events / post pageviews as a rough bottom-reach rate, and
60-second events / pageviews as a rough sustained-visibility rate. Click events
can repeat: clicks / pageviews is a click frequency, not a unique-user conversion
rate. Avoid conclusions from a handful of visits and change one thing at a time.
Export results monthly if you want comparisons beyond the retention window.

## Free plan and verification

As checked on 2026-10-19, Hobby includes one website, 100,000 monthly events,
and six months of retention. Event properties also count toward usage. A visit
that reaches every depth/time milestone consumes 17 units before clicks; each
resource click adds four. Monitor usage; do not start a paid trial or upgrade
for this setup. API/MCP access is paid, so use dashboard exports for free reviews.

Sources: https://umami.is/pricing and https://docs.umami.is/docs/tracker-functions

Run `node --test tests/analytics.test.cjs` for local behavior checks. A live
Realtime check is still required after adding the real ID and deploying.
