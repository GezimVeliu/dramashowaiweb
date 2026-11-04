import test from 'node:test';
import assert from 'node:assert/strict';
import { addFavorite, joinLibrary, loadLibrary, removeFavorite } from '../dist/account/account-data.mjs';

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
