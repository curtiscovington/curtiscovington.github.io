(function () {
  "use strict";
  var config = document.currentScript;
  if (!config || navigator.doNotTrack === "1" || navigator.globalPrivacyControl) return;
  if (!(config.dataset.domains || "").split(",").includes(location.hostname)) return;
  var id = config.dataset.measurementId;
  if (!/^G-[A-Z0-9]+$/.test(id || "")) return;
  function cleanURL(value) {
    try { var url = new URL(value); return url.origin + url.pathname; }
    catch (_) { return ""; }
  }
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag("js", new Date());
  // The config command sends one pageview; do not also send a page_view event.
  window.gtag("config", id, {
    page_location: location.origin + location.pathname,
    page_referrer: cleanURL(document.referrer),
    allow_google_signals: false,
    allow_ad_personalization_signals: false
  });
  var tracker = document.createElement("script");
  tracker.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(id);
  tracker.async = true;
  tracker.onload = function () {
    function send(name, data) {
      window.gtag("event", name, Object.assign({ send_to: id }, data));
    }
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
