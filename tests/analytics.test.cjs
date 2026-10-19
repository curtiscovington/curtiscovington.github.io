const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const source = fs.readFileSync('assets/js/analytics.js', 'utf8');
function setup(options = {}) {
  const events = [], listeners = {}, scripts = [];
  let now = 0, interval;
  const rect = { top: 0, height: 4000 };
  const document = {
    currentScript: { dataset: { websiteId: 'test-id', scriptUrl: 'https://cloud.umami.is/script.js', domains: 'curtiscovington.com', ...options.config } },
    hidden: false, referrer: 'https://example.com/page?secret=yes#private',
    createElement: () => ({ dataset: {} }),
    head: { appendChild: s => scripts.push(s) },
    querySelector: () => options.home ? null : { getBoundingClientRect: () => rect },
    addEventListener: (name, callback) => { listeners[name] = callback; }
  };
  const context = {
    document, navigator: options.navigator || {},
    location: { hostname: options.hostname || 'curtiscovington.com', origin: 'https://curtiscovington.com', pathname: '/posts/example/' },
    URL, Promise, Set, innerHeight: 1000, performance: { now: () => now },
    setInterval: cb => { interval = cb; },
    addEventListener: (name, cb) => { listeners[name] = cb; },
    umami: { track: cb => events.push(cb({ website: 'test-id', url: '/?secret', referrer: document.referrer })) }
  };
  context.window = context;
  vm.runInNewContext(source, context);
  if (scripts[0] && !options.blocked) scripts[0].onload();
  return { events, scripts, document, rect, listeners, tick: () => { now += 1000; interval?.(); } };
}
test('disabled on privacy signals, preview hosts, absent config and insecure script', () => {
  for (const options of [{ navigator: { doNotTrack: '1' } }, { navigator: { globalPrivacyControl: true } }, { hostname: 'localhost' }, { config: { websiteId: '' } }, { config: { scriptUrl: 'http://bad.example/script.js' } }]) {
    assert.equal(setup(options).scripts.length, 0);
  }
});
test('one sanitized pageview and manual collection only', () => {
  const s = setup({ home: true });
  assert.equal(s.events.length, 1);
  assert.equal(s.events[0].url, '/posts/example/');
  assert.equal(s.events[0].referrer, 'https://example.com/page');
  assert.equal(s.scripts[0].dataset.autoTrack, 'false');
});
test('milestones deduplicate, hidden time does not count', () => {
  const s = setup();
  s.rect.top = -3000;
  s.listeners.scroll(); s.listeners.scroll();
  assert.equal(s.events.filter(e => e.name === 'article_depth').length, 4);
  for (let i = 0; i < 30; i++) s.tick();
  assert.equal(s.events.filter(e => e.name === 'article_visible_time').length, 1);
  s.document.hidden = true; s.listeners.visibilitychange();
  for (let i = 0; i < 90; i++) s.tick();
  assert.equal(s.events.filter(e => e.name === 'article_visible_time').length, 1);
});
test('resource classification strips query and fragment and ignores email links', () => {
  const s = setup({ home: true });
  for (const href of ['https://github.com/user/repo?secret=yes#token', 'mailto:private@example.com', 'https://curtiscovington.com/feed.xml']) {
    s.listeners.click({ target: { closest: () => ({ href }) } });
  }
  const clicks = s.events.filter(e => e.name === 'resource_click');
  assert.equal(clicks.length, 2);
  assert.equal(clicks[0].data.resource_type, 'repository');
  assert.equal(clicks[0].data.link_path, '/user/repo');
  assert.equal(clicks[1].data.resource_type, 'rss');
});
test('blocked tracker produces no events or listeners', () => {
  const s = setup({ blocked: true });
  assert.equal(s.events.length, 0);
  assert.equal(Object.keys(s.listeners).length, 0);
});
