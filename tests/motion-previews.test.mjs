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
  const elements = { e01Teasers: section, teaserMotionToggle: toggle, teaserMotionStatus: status };
  const query = { matches: true, addEventListener() {} };
  wireMotionPreviews({ getElementById: id => elements[id] }, { matchMedia: () => query });
  assert.equal(toggle.hidden, true);
  assert.equal(classes.has('motion-paused'), true);
  assert.match(status.textContent, /reduced motion/i);
});
