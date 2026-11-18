import assert from 'node:assert/strict';
import test from 'node:test';
import { migrateStoryIds, PRIMARY_SERIES_ID, resolveStoryId, storyForCatalogSeries, stories } from '../dist/stories.js';

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

test('a renamed canonical story still joins the Supabase catalog by stable slug', () => {
  assert.equal(storyForCatalogSeries({ slug: 'the-old-man', title: 'The Old Man' })?.id, PRIMARY_SERIES_ID);
  assert.equal(storyForCatalogSeries({ slug: 'her-own-world', title: 'Renamed by editor' })?.id, 'world');
  assert.equal(storyForCatalogSeries({ slug: 'the-third-friend', title: 'The Third Friend' })?.id, 'friends');
});

test('unknown catalog slugs never silently become a different story', () => {
  assert.equal(storyForCatalogSeries({ slug: 'hospital-story', title: 'A Second Chance' }), null);
  assert.equal(storyForCatalogSeries({ slug: 'the-next-ten', title: 'The Next Ten' }), null);
  assert.equal(storyForCatalogSeries({ slug: 'a-boys-journey', title: 'A Boy’s Journey' }), null);
  assert.equal(storyForCatalogSeries({ slug: 'unknown', title: 'Her Own World' }), null);
  assert.equal(storyForCatalogSeries(null), null);
});

test('legacy series records without slug still use explicit existing title aliases', () => {
  assert.equal(storyForCatalogSeries({ title: 'The Man Who Refused a Dollar' })?.id, PRIMARY_SERIES_ID);
  assert.equal(storyForCatalogSeries({ title: 'The Third Friend' })?.id, 'friends');
});
