import test from 'node:test';
import assert from 'node:assert/strict';
import { motionPreference, wireMotionPreviews } from '../dist/motion-previews.mjs';

test('motion preference selects a static presentation for reduced motion', () => {
  assert.equal(motionPreference({ matches: true }), 'reduced');
  assert.equal(motionPreference({ matches: false }), 'full');
});

test('motion controls announce state and hide themselves for reduced motion', () => {
  const classes = new Set();
  const section = { classList: { toggle: (name, on) => on ? classes.add(name) : classes.delete(name) } };
  const toggle = { hidden: false, textContent: '', attrs: {}, setAttribute(name, value) { this.attrs[name] = value; }, addEventListener() {} };
  const status = { textContent: '' };
  const elements = { conceptMotionStudies: section, teaserMotionToggle: toggle, teaserMotionStatus: status };
  const query = { matches: true, addEventListener() {} };
  wireMotionPreviews({ getElementById: id => elements[id] }, { matchMedia: () => query });
  assert.equal(toggle.hidden, true);
  assert.equal(classes.has('motion-paused'), true);
  assert.match(status.textContent, /reduced motion/i);
});

test('archival camera studies never replace the canonical series or account integration', async () => {
  const { readFileSync } = await import('node:fs');
  const html = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');
  const app = readFileSync(new URL('../dist/app.js', import.meta.url), 'utf8');
  assert.match(html, /The Man Who<br><em>Refused a Dollar/);
  assert.match(html, /id="conceptMotionStudies"/);
  assert.match(html, /not finished video footage or a preview of The Man Who Refused a Dollar/);
  assert.match(html, /id="studioMenuItem"/);
  assert.match(html, /Privacy Policy/);
  assert.match(html, /hero-motion\.mjs/);
  assert.match(html, /motion-previews\.mjs/);
  assert.doesNotMatch(html, /<h1>A Second<br>/);
  assert.match(app, /findSeriesBySlug/);
  assert.match(app, /isStudioAdmin/);
});
