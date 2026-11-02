import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { appConfig, detectPlatform, getAppDestinations } from '../dist/app-config.mjs';

const configured = {
  appStoreUrl: 'https://apps.apple.com/app/test-app/id123456789',
  googlePlayUrl: 'https://play.google.com/store/apps/details?id=test.bonc',
  appLinkUrl: 'https://app.example.com/open?source=web',
  contentQueryKeys: { series: 'series', episode: 'episode' },
};

test('production with no launch destinations produces no download or app link on any platform', () => {
  for (const platform of ['ios', 'android', 'desktop']) {
    assert.deepEqual(getAppDestinations(appConfig, platform, { series: 'chance' }), []);
  }
});
test('configured mobile handoff prioritizes verified HTTPS app link, preserves selection, and selects matching store', () => {
  for (const [platform, store] of [['ios', 'ios'], ['android', 'android']]) {
    const links = getAppDestinations(configured, platform, { series: 'friends', episode: 'episode-2' });
    assert.deepEqual(links.map(l => l.kind), ['app', store]);
    const app = new URL(links[0].url);
    assert.equal(app.searchParams.get('series'), 'friends');
    assert.equal(app.searchParams.get('episode'), 'episode-2');
    assert.equal(app.searchParams.get('source'), 'web');
  }
});
test('desktop offers available official stores without launching a phone app', () => {
  assert.deepEqual(getAppDestinations(configured, 'desktop').map(l => l.kind), ['ios', 'android']);
});
test('absent platform destination stays absent; no cross-platform store fallback', () => {
  const iosOnly = { ...configured, appLinkUrl: null, googlePlayUrl: null };
  assert.deepEqual(getAppDestinations(iosOnly, 'android'), []);
  assert.deepEqual(getAppDestinations(iosOnly, 'ios').map(l => l.kind), ['ios']);
});
test('rejects scripts, custom schemes, credential URLs, insecure links and lookalike stores', () => {
  for (const url of ['javascript:alert(1)', 'bonc://premium', 'http://app.example.com', 'https://user:password@app.example.com', 'not-a-url']) {
    assert.deepEqual(getAppDestinations({ appLinkUrl: url }, 'ios'), []);
  }
  assert.deepEqual(getAppDestinations({ appStoreUrl: 'https://apps.apple.com.evil.example/app', googlePlayUrl: 'https://example.com/store' }, 'desktop'), []);
});
test('recognizes iOS, iPad desktop mode, Android and desktop', () => {
  assert.equal(detectPlatform('iPhone'), 'ios');
  assert.equal(detectPlatform('Macintosh', 5), 'ios');
  assert.equal(detectPlatform('Android'), 'android');
  assert.equal(detectPlatform('Macintosh', 0), 'desktop');
});
test('premium action is a selection-only app panel; catalog has no player, checkout or media paths', async () => {
  const js = await readFile(new URL('../dist/app.js', import.meta.url), 'utf8');
  assert.match(js, /\$\('unlockApp'\)\.onclick = e => openApp\(\{ series: id \}, e.currentTarget\)/);
  const files = ['index.html', 'app.js', 'stories.js', 'app-config.mjs'];
  for (const file of files) {
    assert.doesNotMatch(await readFile(new URL('../dist/' + file, import.meta.url), 'utf8'), /<video|<iframe|\.m3u8|\.mp4|checkout|stripe|mux\.com/i);
  }
});
