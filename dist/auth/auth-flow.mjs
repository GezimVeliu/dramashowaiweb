export const apiUrl = 'https://xbkfudvnewhescwbmrgt.supabase.co/auth/v1';
const apiKey = 'sb_publishable_Qt4aAXF6GepS-reTaFvzmQ_0CwElQK1';
export const confirmationUrl = 'https://web.dramashowai.workers.dev/auth/confirm/';
export const recoveryUrl = 'https://web.dramashowai.workers.dev/auth/';

const headers = token => ({ apikey: apiKey, 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) });
async function authRequest(path, body, request = fetch, token, method = 'POST') {
  const response = await request(`${apiUrl}${path}`, { method, headers: headers(token), body: body === undefined ? undefined : JSON.stringify(body), referrerPolicy: 'no-referrer', cache: 'no-store' });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(response.status === 429 ? 'Too many attempts. Wait a little, then try again.' : payload.msg || payload.message || payload.error_description || 'That request could not be completed.');
    error.status = response.status;
    throw error;
  }
  return payload;
}
export function validateEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254; }
export function validatePassword(password) { return typeof password === 'string' && password.length >= 8 && password.length <= 72; }
export function signUp(email, password, request = fetch) { return authRequest(`/signup?redirect_to=${encodeURIComponent(confirmationUrl)}`, { email, password }, request); }
export function signIn(email, password, request = fetch) { return authRequest('/token?grant_type=password', { email, password }, request); }
export function verifySignupCode(email, token, request = fetch) { return authRequest('/verify', { email, token: token.replace(/\s/g, ''), type: 'signup' }, request); }
export function resendSignup(email, request = fetch) { return authRequest(`/resend?redirect_to=${encodeURIComponent(confirmationUrl)}`, { email, type: 'signup' }, request); }
export function requestRecovery(email, request = fetch) { return authRequest(`/recover?redirect_to=${encodeURIComponent(recoveryUrl)}`, { email }, request); }
export function updatePassword(accessToken, password, request = fetch) { return authRequest('/user', { password }, request, accessToken, 'PUT'); }
export function signOut(accessToken, request = fetch) { return authRequest('/logout?scope=local', undefined, request, accessToken); }
export function readCallback(hash) {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  if (params.get('error') || params.get('error_code')) return { kind: 'error' };
  const access_token = params.get('access_token'), refresh_token = params.get('refresh_token');
  if (!access_token || !refresh_token || access_token.length >= 16384 || refresh_token.length >= 4096) return null;
  return { kind: params.get('type') === 'recovery' ? 'recovery' : 'session', access_token, refresh_token };
}
export function refreshSession(refresh_token, request = fetch) { return authRequest('/token?grant_type=refresh_token', { refresh_token }, request); }
export async function getUser(accessToken, request = fetch) {
  const response = await request(`${apiUrl}/user`, { headers: headers(accessToken), referrerPolicy: 'no-referrer', cache: 'no-store' });
  if (!response.ok) throw new Error('Your session has expired. Sign in again.');
  return response.json();
}
