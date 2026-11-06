import assert from 'node:assert/strict';
import test from 'node:test';
import { migrateStoryIds, PRIMARY_SERIES_ID, resolveStoryId, stories } from '../dist/stories.js';

test('legacy chance links resolve to the canonical series ID', () => {
  assert.equal(resolveStoryId('chance'), PRIMARY_SERIES_ID);
  assert.equal(resolveStoryId(PRIMARY_SERIES_ID), PRIMARY_SERIES_ID);
});

test('saved-list migration preserves the legacy first series and removes duplicates', () => {
  assert.deepEqual(migrateStoryIds(['chance', PRIMARY_SERIES_ID, 'friends', 'unknown']), [PRIMARY_SERIES_ID, 'friends']);
});

test('canonical first series uses the approved title and ten-episode plan', () => {
  const first = stories.find(story => story.id === PRIMARY_SERIES_ID);
  assert.equal(first.title, 'The Man Who Refused a Dollar');
  assert.equal(first.episodeCount, 10);
  assert.equal(first.eps.length, 10);
  assert.match(first.description, /Michael Carter/);
  assert.match(first.description, /Emma Brooks/);
  assert.doesNotMatch(JSON.stringify(first), /hospital|operation|boy's kindness/i);
});
