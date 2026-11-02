import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import test from 'node:test';

const execFileAsync = promisify(execFile);
const templates = new URL('../email-templates/', import.meta.url);
const signupHtml = await readFile(new URL('confirm-signup.html', templates), 'utf8');
const signupText = await readFile(new URL('confirm-signup.txt', templates), 'utf8');
const recoveryHtml = await readFile(new URL('reset-password.html', templates), 'utf8');
const recoveryText = await readFile(new URL('reset-password.txt', templates), 'utf8');

const occurrences = (source, value) => (source.match(new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) ?? []).length;

test('signup uses the canonical Worker route and live Supabase placeholders', () => {
  assert.equal(occurrences(signupHtml, '{{ .TokenHash }}'), 2);
  assert.equal(occurrences(signupHtml, '{{ .Token }}'), 1);
  assert.match(signupText, /{{ \.TokenHash }}/);
  assert.match(signupText, /{{ \.Token }}/);
  assert.doesNotMatch(signupHtml + signupText, /{{ \.ConfirmationURL }}/);
  assert.doesNotMatch(signupHtml, /token=[A-Za-z0-9]/i);
  const absoluteLinks = [...signupHtml.matchAll(/href="(https?:\/\/[^"]+)"/gi)].map(match => match[1]);
  assert.equal(absoluteLinks.length, 2);
  assert.ok(absoluteLinks.every(link => link.startsWith('https://web.dramashowai.workers.dev/auth/confirm/#')));
});

test('recovery actions and fallback use only the Supabase-generated URL', () => {
  assert.equal(occurrences(recoveryHtml, '{{ .ConfirmationURL }}'), 3);
  assert.equal(occurrences(recoveryText, '{{ .ConfirmationURL }}'), 1);
  assert.doesNotMatch(recoveryHtml + recoveryText, /{{ \.Token(?:Hash)? }}|{{ \.RedirectTo }}|{{ \.SiteURL }}/);
  assert.match(recoveryHtml, /href="{{ \.ConfirmationURL }}"[^>]*>Reset password<\/a>/);
  assert.match(recoveryHtml, /href="{{ \.ConfirmationURL }}"[^>]*>{{ \.ConfirmationURL }}<\/a>/);
});

test('templates contain accessible actions and security context', () => {
  for (const html of [signupHtml, recoveryHtml]) {
    assert.match(html, /<html lang="en"/);
    assert.match(html, /prefers-color-scheme: dark/);
    assert.match(html, /role="presentation"/);
  }
  assert.match(recoveryHtml, /If you didn't request a password reset/);
  assert.match(recoveryText, /Do not forward or share this link/);
});

test('source templates have no secrets, remote images, or tracking', () => {
  for (const source of [signupHtml, signupText, recoveryHtml, recoveryText]) {
    assert.doesNotMatch(source, /pages\.dev|utm_|pixel/i);
  }
  for (const source of [recoveryHtml, recoveryText]) {
    assert.doesNotMatch(source, /(?:href|src)="https?:\/\//i);
    assert.doesNotMatch(source, /workers\.dev|token=[A-Za-z0-9]/i);
  }
  assert.doesNotMatch(signupHtml + recoveryHtml, /<img\b/i);
  assert.doesNotMatch(signupHtml, /localhost|dramashowaiweb\.dramashowai\.workers\.dev/i);
});

test('preview renderer creates safe, complete local previews', async () => {
  const { stdout } = await execFileAsync(process.execPath, [fileURLToPath(new URL('render-preview.mjs', templates))]);
  assert.match(stdout, /preview\/confirm-signup\.html/);
  assert.match(stdout, /preview\/reset-password\.html/);

  const signupPreview = await readFile(new URL('preview/confirm-signup.html', templates), 'utf8');
  const recoveryPreview = await readFile(new URL('preview/reset-password.html', templates), 'utf8');

  for (const preview of [signupPreview, recoveryPreview]) {
    assert.match(preview, /LOCAL PREVIEW/);
    assert.doesNotMatch(preview, /{{ \.\w+ }}/);
  }
  assert.match(signupPreview, /PREVIEW-TOKEN-HASH-NOT-REAL/);
  assert.match(recoveryPreview, /https:\/\/preview\.invalid/);
});
