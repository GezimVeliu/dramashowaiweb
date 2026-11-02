import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const html = await readFile(new URL('../email-templates/confirm-signup.html', import.meta.url), 'utf8');
const text = await readFile(new URL('../email-templates/confirm-signup.txt', import.meta.url), 'utf8');

test('uses only live Supabase confirmation placeholders', () => {
  // The button href, fallback href, and visible fallback text all use the live URL.
  assert.equal((html.match(/{{ \.ConfirmationURL }}/g) ?? []).length, 3);
  assert.equal((html.match(/{{ \.Token }}/g) ?? []).length, 1);
  assert.match(text, /{{ \.ConfirmationURL }}/);
  assert.match(text, /{{ \.Token }}/);
  assert.doesNotMatch(html, /token=[A-Za-z0-9]/i);
});

test('contains accessible actions and security context', () => {
  assert.match(html, /<html lang="en"/);
  assert.match(html, />Confirm email<\/a>/);
  assert.match(html, /If you didn't create this account, you can ignore this email/);
  assert.match(html, /prefers-color-scheme: dark/);
  assert.match(html, /role="presentation"/);
});

test('has no remote images or tracking links', () => {
  assert.doesNotMatch(html, /<img\b/i);
  assert.doesNotMatch(html, /href="https?:\/\//i);
  assert.doesNotMatch(html, /workers\.dev|pages\.dev/i);
});
