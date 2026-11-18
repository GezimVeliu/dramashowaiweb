import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { separatePrivateDocument, resolveStudioSlug, studioEpisodeTitle, imageAlreadyFailed, approvedDriveSourceLink } from '../dist/studio/guard.mjs';

const file = path => readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('all studio routes contain no sensitive production content and permit a private Blob script', () => {
  for (const ep of ['e01', 'e02', 'e03']) {
    const html = file('dist/studio/'+ep+'/index.html');
    assert.match(html, new RegExp('data-studio-episode="'+ep+'"'));
    assert.match(html, /studio\/guard\.mjs/);
    assert.match(html, /script-src 'self' blob:/);
    assert.match(html, /img-src 'self' https: data:/);
    assert.doesNotMatch(html, /const DATA=|E01S01A|f035188e-95d1-4ca4-98b2/);
  }
});
test('private document script is extracted, not executed inline', () => {
  const html = '<!doctype html><html><body><div id="dashboard"></div><script>window.__studioInit = true;<\/script></body></html>';
  const { markup, javascript } = separatePrivateDocument(html);
  assert.ok(!markup.includes('<script>'));
  assert.match(markup, /id="dashboard"/);
  assert.match(javascript, /__studioInit/);
});
test('malformed or multiple private scripts are rejected', () => {
  assert.throws(() => separatePrivateDocument('<!doctype html><script src="evil.js"></script>'));
  assert.throws(() => separatePrivateDocument('<!doctype html><script>1</script><script>2</script>'));
  assert.throws(() => separatePrivateDocument('<html><script>1</script>'));
});
test('supported episode slugs are explicitly allowlisted', () => {
  for (const slug of ['e01','e02','e03']) assert.equal(resolveStudioSlug(slug), slug);
  for (const slug of ['../../secret','e04','admin']) assert.equal(resolveStudioSlug(slug), null);
});
test('guard requires user identity, admin role, and RLS-protected page before rendering', () => {
  const s = file('dist/studio/guard.mjs');
  assert.match(s, /getUser\(session\.access_token\)/);
  assert.match(s, /rows\[0\]\.is_admin !== true/);
  assert.match(s, /studio_pages\?select=content_html/);
  assert.match(s, /Authorization: 'Bearer '/);
  assert.match(s, /URL\.createObjectURL\(new Blob/);
  assert.doesNotMatch(s, /unsafe-eval|email\s*===?\s*['"]gezimveliu/);
});
test('navigation is hidden by default and shown only after server-checked admin role', () => {
  assert.match(file('dist/account/index.html'), /id="studioNav"[^>]+hidden/);
  assert.match(file('dist/account/account.mjs'), /isStudioAdmin/);
  assert.match(file('dist/index.html'), /id="studioMenuItem"[^>]+hidden/);
  assert.match(file('dist/app.js'), /isStudioAdmin\(accountSession.access_token,user.id\)/);
});

test('private Drive image fallback only links to verified canonical Drive file URLs', () => {
  const good = 'https://drive.google.com/file/d/1TSgBAH4C8bV2jOAu4M_oKqmYU__2Rggk/view?usp=drivesdk';
  assert.equal(approvedDriveSourceLink(good),
    'https://drive.google.com/file/d/1TSgBAH4C8bV2jOAu4M_oKqmYU__2Rggk/view');
  for (const unsafe of [
    'https://evil.example/file/d/abc/view',
    'https://drive.google.com.evil.example/file/d/abc/view',
    'javascript:alert(1)',
    '/file/d/abc/view',
    'https://drive.google.com/drive/folders/secret',
    'http://drive.google.com/file/d/abc/view',
  ]) {
    assert.equal(approvedDriveSourceLink(unsafe), null, unsafe);
  }
});
test('fallback does not publish private Drive bytes or bypass admin RLS', () => {
  const code = file('dist/studio/guard.mjs');
  assert.match(code, /document.addEventListener\('error', showStudioImageFallback, true\)/);
  assert.match(code, /studio_pages\?select=content_html/);
  assert.match(code, /rows\[0\]\.is_admin !== true/);
  assert.doesNotMatch(code, /setFilePermissions|storage\.from|update\(.*is_admin/);
});

test('private page title reflects the authorized E01-E03 route, not stale document title', () => {
  assert.equal(studioEpisodeTitle('e01'), 'BONC Production Hub — E01');
  assert.equal(studioEpisodeTitle('e02'), 'BONC Production Hub — E02');
  assert.equal(studioEpisodeTitle('e03'), 'BONC Production Hub — E03');
  assert.equal(studioEpisodeTitle('e04'), 'BONC Studio');
  const source = file('dist/studio/guard.mjs');
  assert.match(source, /document\.title = studioEpisodeTitle\(slug\)/);
  assert.match(source, /renderPrivateDocument\(pages\[0\]\.content_html, slug\)/);
});

test('earlier image failures are recovered and not reported for pending images', () => {
  const image = { tagName:'IMG', currentSrc:'https://example.test/still.png', complete:true, naturalWidth:0 };
  assert.equal(imageAlreadyFailed(image),true);
  assert.equal(imageAlreadyFailed({ ...image, complete:false }),false);
  assert.equal(imageAlreadyFailed({ ...image, naturalWidth:200 }),false);
  assert.equal(imageAlreadyFailed({ ...image, currentSrc:'', getAttribute:()=>null }),false);
  assert.equal(imageAlreadyFailed({ tagName:'DIV', complete:true, naturalWidth:0, currentSrc:'x' }),false);
  const guard = file('dist/studio/guard.mjs');
  assert.match(guard, /document\.querySelectorAll\('img'\)\.forEach/);
  assert.match(guard, /imageAlreadyFailed\(img\)/);
});

test('rich linked image cards never contain a clickable nested Drive fallback link', () => {
  const source = file('dist/studio/guard.mjs');
  assert.match(source, /source && \(!anchor \|\| mayReplaceAnchor\)/);
  assert.match(source, /const target = mayReplaceAnchor \? anchor : image;/);
  assert.match(source, /!image\.isConnected/);
});
