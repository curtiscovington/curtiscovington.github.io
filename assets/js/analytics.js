(function () {
  "use strict";
  var config = document.currentScript;
  if (!config || navigator.doNotTrack === "1" || navigator.globalPrivacyControl) return;
  if (!(config.dataset.domains || "").split(",").includes(location.hostname)) return;
  if (!config.dataset.websiteId) return;
  var source;
  try { source = new URL(config.dataset.scriptUrl); } catch (_) { return; }
  if (source.protocol !== "https:") return;
  var tracker = document.createElement("script");
  tracker.src = source.href;
  tracker.async = true;
  tracker.dataset.websiteId = config.dataset.websiteId;
  tracker.dataset.autoTrack = "false";
  tracker.dataset.excludeSearch = "true";
  tracker.dataset.excludeHash = "true";
  tracker.onload = function () {
    if (!window.umami) return;
    function cleanURL(value) {
      try { var url = new URL(value); return url.origin + url.pathname; }
      catch (_) { return ""; }
    }
    function send(name, data) {
      try {
        Promise.resolve(window.umami.track(function (props) {
          var payload = Object.assign({}, props, {
            url: location.pathname,
            referrer: cleanURL(document.referrer)
          });
          if (name) { payload.name = name; payload.data = data; }
          return payload;
        })).catch(function () {});
      } catch (_) { /* Tracking failure must never interrupt navigation. */ }
    }
    send();
    document.addEventListener("click", function (event) {
      var link = event.target.closest && event.target.closest("a[href]");
      if (!link) return;
      var url;
      try { url = new URL(link.href); } catch (_) { return; }
      if (!/^https?:$/.test(url.protocol)) return;
      var kind;
      if (url.origin === location.origin && url.pathname.endsWith("/feed.xml")) kind = "rss";
      else if (url.origin !== location.origin) {
        kind = url.hostname === "github.com" ? "repository" :
          url.hostname === "huggingface.co" ? "huggingface" : "external";
      }
      if (kind) send("resource_click", {
        resource_type: kind, link_domain: url.hostname, link_path: url.pathname
      });
    });
    var article = document.querySelector(".post__content");
    if (!article) return;
    var depths = new Set();
    var times = new Set();
    var visibleSeconds = 0;
    var previous = performance.now();
    var wasVisible = !document.hidden;
    function progress() {
      if (document.hidden) return;
      var rect = article.getBoundingClientRect();
      if (rect.height <= 0 || rect.top >= innerHeight) return;
      var percent = Math.min(100, Math.max(0, (innerHeight - rect.top) / rect.height * 100));
      [25, 50, 75, 100].forEach(function (depth) {
        if (percent >= depth && !depths.has(depth)) {
          depths.add(depth);
          send("article_depth", { depth_percent: depth });
        }
      });
    }
    function tick() {
      var now = performance.now();
      // Avoid counting long suspended/background timer gaps as reading time.
      if (wasVisible) visibleSeconds += Math.min((now - previous) / 1000, 2);
      previous = now;
      wasVisible = !document.hidden;
      [30, 60, 120, 300].forEach(function (seconds) {
        if (visibleSeconds >= seconds && !times.has(seconds)) {
          times.add(seconds);
          send("article_visible_time", { visible_seconds: seconds });
        }
      });
      progress();
    }
    document.addEventListener("visibilitychange", tick);
    window.setInterval(tick, 1000);
    window.addEventListener("scroll", progress, { passive: true });
    progress();
  };
  document.head.appendChild(tracker);
})();
