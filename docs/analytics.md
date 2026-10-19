# Blog Analytics

## Configuration

The blog uses Google Analytics 4 property `G-GEE9RVSV3L`, configured in
`analytics.measurement_id` in `_config.yml`. Emptying the ID disables collection.
The Google tag sends a pageview through its config command, then custom events
record the readership signals below. Umami is no longer loaded.

Production builds on `curtiscovington.com` and `www.curtiscovington.com` collect
analytics. Development builds, other hostnames, Do Not Track, and Global Privacy
Control are excluded. Visit a production post and check GA4 Realtime to verify
receipt; script delivery alone does not prove events reached the property.

For detailed GA4 reporting, register event-scoped custom dimensions for
`depth_percent`, `visible_seconds`, `resource_type`, and `link_path` in Admin >
Custom definitions. Use the built-in link domain dimension for `link_domain`.
Enhanced Measurement may also collect scroll/click events; use our custom event
names below consistently, rather than adding those counts together.

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
visitor identifiers, session replay, or form values are added. Google Analytics
uses its own cookies. Google Signals and advertising personalization are disabled.
URL stripping applies to our configured pageview and custom events; additional
Enhanced Measurement behavior is controlled in the GA4 property.

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
Export results periodically for longer-term comparisons.

## Verification

Run `node --test tests/analytics.test.cjs` for local behavior checks. A live
GA4 Realtime check is still required after deployment.

References:
- https://developers.google.com/analytics/devguides/collection/ga4/events
- https://developers.google.com/analytics/devguides/collection/ga4/views
