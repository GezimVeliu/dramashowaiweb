import assert from 'node:assert/strict';
import test from 'node:test';
import { assetManifest } from '../dist/asset-manifest.js';

test('production art registry identifies only canonical BONC E01 source folders', () => {
  assert.equal(assetManifest.seriesId, 'chance');
  assert.equal(assetManifest.episodeId, 'E01');
  assert.deepEqual(Object.keys(assetManifest.sourceFolders), [
    'michael2026Age64', 'michael2014Age52', 'emmaNowAge34', 'approvedE01Frames'
  ]);
  assert.equal(JSON.stringify(assetManifest).includes('second-chance.png'), false);
});

test('published art entries are revision-pinned, local, responsive, and accessible', () => {
  for (const asset of assetManifest.assets) {
    assert.match(asset.driveFileId, /^[\w-]{20,}$/);
    assert.ok(asset.driveRevision);
    assert.deepEqual(asset.seriesId, 'chance');
    assert.deepEqual(asset.episodeId, 'E01');
    assert.ok(asset.alt && asset.caption && asset.label);
    assert.ok(asset.use.length);
    assert.match(asset.fallback, /^assets\//);
    assert.doesNotMatch(JSON.stringify(asset), /https?:|token|second-chance\.png/);
    assert.ok(asset.srcset.avif && asset.srcset.webp && asset.srcset.fallback && asset.sizes);
  }
});
