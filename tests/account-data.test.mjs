import test from 'node:test';
import assert from 'node:assert/strict';
import { addFavorite, findSeriesBySlug, joinLibrary, loadLibrary, removeFavorite } from '../dist/account/account-data.mjs';
import { avatarProfile } from '../dist/account/account-ui.mjs';

const response = (payload, status = 200) => ({ ok: status < 400, status, json: async () => payload });
test('joins user-owned watchlist and progress with public catalog records', () => {
  const result = joinLibrary({ series: [{ id: 's1', title: 'Story' }], episodes: [{ id: 'e1', series_id: 's1', title: 'Pilot', episode_number: 1, duration_seconds: 100 }], watchlist: [{ series_id: 's1' }], progress: [{ episode_id: 'e1', position_seconds: 35, duration_seconds: 100, completed: false }] });
  assert.equal(result.favorites[0].series.title, 'Story'); assert.equal(result.continueWatching[0].percent, 35); assert.equal(result.watched.length, 0);
});
test('completion flag and 95 percent threshold classify watched episodes', () => {
  const base = { series: [{ id: 's' }], episodes: [{ id: 'a', series_id: 's', duration_seconds: 100 }, { id: 'b', series_id: 's', duration_seconds: 100 }], watchlist: [], progress: [{ episode_id: 'a', position_seconds: 95 }, { episode_id: 'b', completed: true }] };
  assert.equal(joinLibrary(base).watched.length, 2);
});
test('library requests send the user bearer token and never query another user id', async () => {
  const calls = []; const fetcher = async (url, options) => { calls.push({ url, options }); return response([]); };
  await loadLibrary('user-jwt', fetcher);
  assert.equal(calls.length, 4); calls.forEach(call => { assert.equal(call.options.headers.Authorization, 'Bearer user-jwt'); assert.doesNotMatch(call.url, /user_id/); });
});
test('favorite writes rely on RLS and update only the selected series', async () => {
  const calls = []; const fetcher = async (url, options) => { calls.push({ url, options }); return response(null, 204); };
  await addFavorite('jwt', 'series-1', fetcher); await removeFavorite('jwt', 'series-1', fetcher);
  assert.deepEqual(JSON.parse(calls[0].options.body), { series_id: 'series-1' }); assert.match(calls[1].url, /series_id=eq.series-1/); assert.ok(calls.every(call => !String(call.options.body).includes('user_id')));
});
test('default avatars use account initials and a stable generated color', () => {
  const first = avatarProfile({ id: 'viewer-1', email: 'anna@example.com' });
  assert.equal(first.initials, 'A');
  assert.deepEqual(first, avatarProfile({ id: 'viewer-1', email: 'anna@example.com' }));
  assert.notEqual(first.color, avatarProfile({ id: 'viewer-2', email: 'ben@example.com' }).color);
});

test('look up the canonical series by stable catalog slug, not mutable title', async () => {
  const calls = [];
  const fetcher = async (url, options) => {
    calls.push({ url, options });
    return response([{ id: 'series-uuid', slug: 'the-old-man', title: 'The Old Man' }]);
  };
  const catalog = await findSeriesBySlug('my-session', 'the-old-man', fetcher);
  assert.deepEqual(catalog, { id: 'series-uuid', slug: 'the-old-man', title: 'The Old Man' });
  assert.match(calls[0].url, /series\?select=id,title,slug&slug=eq.the-old-man&limit=1/);
  assert.equal(calls[0].options.headers.Authorization, 'Bearer my-session');
  assert.doesNotMatch(calls[0].url, /user_id/);
  assert.equal(await findSeriesBySlug('my-session', 'bad.slug', fetcher), null);
  assert.equal(calls.length, 1);
});

test('web favorite UI does not claim account sync before remote write succeeds', async () => {
  const { readFileSync } = await import('node:fs');
  const source = readFileSync(new URL('../dist/app.js', import.meta.url), 'utf8');
  const saveFn = source.slice(source.indexOf('async function save(id) {'), source.indexOf('async function connectAccount() {'));
  assert.ok(saveFn.indexOf('await addFavorite') < saveFn.indexOf('Synced with your account'));
  assert.ok(saveFn.includes('persistFavoritesLocally();\n    render();'));
  assert.ok(source.includes('storyForCatalogSeries(favorite.series)'));
});

test('title fallback returns slug for validating legacy identities', async () => {
  const calls = [];
  const fetcher = async url => {
    calls.push(url);
    return response([{ id: 'old', title: 'A Second Chance', slug: 'other-series' }]);
  };
  const { findSeriesByTitle } = await import('../dist/account/account-data.mjs');
  const row = await findSeriesByTitle('my-session', 'A Second Chance', fetcher);
  assert.equal(row.slug, 'other-series');
  assert.match(calls[0], /series\?select=id,title,slug&title=eq.A%20Second%20Chance&limit=1/);
});
