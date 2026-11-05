import test from 'node:test';
import assert from 'node:assert/strict';
import { joinWaitlist } from '../dist/pilot-funnel.mjs';

test('waitlist requires valid email and explicit consent', async () => {
  await assert.rejects(joinWaitlist('nope', true), /valid email/);
  await assert.rejects(joinWaitlist('viewer@example.com', false), /agree/);
});

test('waitlist requests a verification email without exposing email in URL', async () => {
  let captured;
  const request = async (url, options) => {
    captured = { url, options };
    return { ok: true, json: async () => ({}) };
  };
  const result = await joinWaitlist(' Viewer@Example.com ', true, request);
  assert.equal(result.email, 'viewer@example.com');
  assert.match(captured.url, /\/otp\?redirect_to=/);
  assert.doesNotMatch(captured.url, /viewer/i);
  const body = JSON.parse(captured.options.body);
  assert.deepEqual(body, {
    email: 'viewer@example.com', create_user: true,
    data: { bonc_waitlist: true, consent_version: '2026-11-05' },
  });
  assert.equal(captured.options.referrerPolicy, 'no-referrer');
});
