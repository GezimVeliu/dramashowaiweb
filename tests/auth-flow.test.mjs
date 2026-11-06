import test from 'node:test';
import assert from 'node:assert/strict';
import { googleOAuthUrl, oauthReturnUrl, readCallback, requestRecovery, resendSignup, signIn, signOut, signUp, updatePassword, validateEmail, validatePassword, verifySignupCode } from '../dist/auth/auth-flow.mjs';

const response = (payload = {}, ok = true, status = 200) => ({ ok, status, json: async () => payload });
const capture = (payload = {}) => { const calls = []; return { calls, request: async (url, options) => { calls.push({ url, options }); return response(payload); } }; };
test('validates account inputs without sending a request', () => {
  assert.equal(validateEmail('viewer@example.com'), true); assert.equal(validateEmail('bad@'), false);
  assert.equal(validatePassword('12345678'), true); assert.equal(validatePassword('short'), false); assert.equal(validatePassword('x'.repeat(73)), false);
});
test('signup and resend use only the fixed confirmation destination', async () => {
  const mock = capture(); await signUp('viewer@example.com', 'password1', mock.request); await resendSignup('viewer@example.com', mock.request);
  for (const call of mock.calls) { assert.match(call.url, /redirect_to=https%3A%2F%2Fdramashow\.gezimveliu\.com%2Fauth%2Fconfirm%2F/); assert.doesNotMatch(call.url, /localhost/); }
  assert.deepEqual(JSON.parse(mock.calls[1].options.body), { email: 'viewer@example.com', type: 'signup' });
});
test('code verification consumes a signup OTP and sign-in uses the password grant', async () => {
  const mock = capture({ access_token: 'a', refresh_token: 'r' }); await verifySignupCode('viewer@example.com', ' 123 456 ', mock.request); await signIn('viewer@example.com', 'password1', mock.request);
  assert.deepEqual(JSON.parse(mock.calls[0].options.body), { email: 'viewer@example.com', token: '123456', type: 'signup' }); assert.match(mock.calls[1].url, /grant_type=password/);
});
test('recovery, password update, and logout keep credentials out of URLs', async () => {
  const mock = capture(); await requestRecovery('viewer@example.com', mock.request); await updatePassword('secret-access', 'newpassword', mock.request); await signOut('secret-access', mock.request);
  assert.doesNotMatch(mock.calls.map(call => call.url).join(' '), /secret-access|newpassword/); assert.equal(mock.calls[1].options.headers.Authorization, 'Bearer secret-access'); assert.equal(mock.calls[1].options.method, 'PUT'); assert.match(mock.calls[2].url, /scope=local/);
});
test('callback parser accepts complete sessions, distinguishes recovery, and rejects errors or partial tokens', () => {
  assert.deepEqual(readCallback('#access_token=a&refresh_token=r&type=recovery'), { kind: 'recovery', access_token: 'a', refresh_token: 'r' });
  assert.deepEqual(readCallback('#access_token=a&refresh_token=r&type=signup'), { kind: 'session', access_token: 'a', refresh_token: 'r' });
  assert.deepEqual(readCallback('#error_code=otp_expired'), { kind: 'error' }); assert.equal(readCallback('#access_token=a'), null);
});
test('auth failures expose safe API feedback and rate-limit guidance', async () => {
  await assert.rejects(signIn('viewer@example.com', 'password1', async () => response({ message: 'Invalid login credentials' }, false, 400)), /Invalid login credentials/);
  await assert.rejects(signIn('viewer@example.com', 'password1', async () => response({}, false, 429)), /Too many attempts/);
});

test('Google OAuth starts with fixed Supabase authorize endpoint and cannot open arbitrary callback destinations', () => {
  const url = new URL(googleOAuthUrl());
  assert.equal(url.origin, 'https://xbkfudvnewhescwbmrgt.supabase.co');
  assert.equal(url.pathname, '/auth/v1/authorize');
  assert.equal(url.searchParams.get('provider'), 'google');
  assert.equal(url.searchParams.get('redirect_to'), oauthReturnUrl);
  assert.equal(oauthReturnUrl, 'https://dramashow.gezimveliu.com/auth/');
  assert.equal(url.searchParams.has('client_secret'), false);
});
test('OAuth success and rejection preserve the existing secure callback parser', () => {
  assert.deepEqual(readCallback('#access_token=google-access&refresh_token=google-refresh&provider_token=ignored'), {kind:'session',access_token:'google-access',refresh_token:'google-refresh'});
  assert.deepEqual(readCallback('#error=access_denied&error_description=cancelled'), {kind:'error'});
});
