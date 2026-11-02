import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { confirmEmail, readConfirmation } from '../dist/auth/confirm/flow.mjs';

const tokenHash = 'a'.repeat(64);
const session = { access_token: 'access-token', refresh_token: 'refresh-token' };

test('reads only a signup token hash or complete signup session from the fragment', () => {
  assert.deepEqual(readConfirmation(`#token_hash=${tokenHash}&type=signup`), { kind: 'token', token: tokenHash });
  assert.deepEqual(readConfirmation('#type=signup&access_token=a&refresh_token=r'), {
    kind: 'session', access_token: 'a', refresh_token: 'r',
  });
  assert.deepEqual(readConfirmation(`#token_hash=${tokenHash}&type=recovery`), { kind: 'missing' });
  assert.deepEqual(readConfirmation('#error_code=otp_expired&type=signup'), { kind: 'expired' });
  assert.deepEqual(readConfirmation('#type=signup&token_hash=not-a-token'), { kind: 'missing' });
});

test('exchanges a token, verifies the confirmed user, and returns only the fixed app destination', async () => {
  const calls = [];
  const request = async (url, options) => {
    calls.push({ url, options });
    if (url.endsWith('/verify')) return { ok: true, json: async () => session };
    return { ok: true, json: async () => ({ email_confirmed_at: '2026-11-02T00:00:00Z' }) };
  };
  const link = await confirmEmail({ kind: 'token', token: tokenHash }, request);
  assert.equal(calls.length, 2);
  assert.deepEqual(JSON.parse(calls[0].options.body), { token_hash: tokenHash, type: 'signup' });
  assert.equal(new URL(link).protocol, 'bonc:');
  assert.equal(new URL(link).hostname, 'auth');
  assert.match(link, /access_token=access-token/);
  assert.doesNotMatch(link, /redirect|return|localhost/i);
});

test('rejects failed, incomplete, or unconfirmed verification responses', async () => {
  await assert.rejects(confirmEmail({ kind: 'token', token: tokenHash }, async () => ({ ok: false, status: 400 })), /expired/);
  await assert.rejects(confirmEmail({ kind: 'session', access_token: 'a' }, async () => ({})), /expired/);
  await assert.rejects(confirmEmail({ kind: 'session', ...session }, async () => ({ ok: true, json: async () => ({ email_confirmed_at: null }) })), /expired/);
});

test('email links target the canonical Worker and never localhost or a caller-controlled redirect', async () => {
  const template = await readFile(new URL('../email-templates/confirm-signup.html', import.meta.url), 'utf8');
  const links = [...template.matchAll(/href="([^"]*auth\/confirm\/[^"]*)"/g)].map(match => match[1]);
  assert.equal(links.length, 2);
  for (const link of links) {
    assert.equal(link, 'https://web.dramashowai.workers.dev/auth/confirm/#token_hash={{ .TokenHash }}&amp;type=signup');
  }
  assert.doesNotMatch(template, /localhost|dramashowaiweb\.dramashowai\.workers\.dev|\.ConfirmationURL/);
  assert.match(template, /\{\{ \.Token \}\}/);
});
