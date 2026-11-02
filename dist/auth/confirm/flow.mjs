export const apiUrl = 'https://xbkfudvnewhescwbmrgt.supabase.co/auth/v1';
const apiKey = 'sb_publishable_Qt4aAXF6GepS-reTaFvzmQ_0CwElQK1';
export function readConfirmation(hash) {
  const p = new URLSearchParams(hash.replace(/^#/, ''));
  if (p.get('error') || p.get('error_code')) return { kind: 'expired' };
  if (p.get('type') !== 'signup') return { kind: 'missing' };
  const token = p.get('token_hash');
  if (token && /^[a-f0-9]{40,128}$/i.test(token)) return { kind: 'token', token };
  const access_token = p.get('access_token'), refresh_token = p.get('refresh_token');
  if (access_token && refresh_token && access_token.length < 16384 && refresh_token.length < 4096)
    return { kind: 'session', access_token, refresh_token };
  return { kind: 'missing' };
}
export async function confirmEmail(input, request = fetch) {
  let session;
  if (input.kind === 'token') {
    const response = await request(`${apiUrl}/verify`, {
      method: 'POST', headers: { apikey: apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ token_hash: input.token, type: 'signup' }),
      referrerPolicy: 'no-referrer', cache: 'no-store',
    });
    if (!response.ok) throw new Error(response.status === 429 ? 'rate-limit' : 'expired');
    session = await response.json();
  } else if (input.kind === 'session') session = input;
  else throw new Error('missing');
  if (!session.access_token || !session.refresh_token) throw new Error('expired');
  const response = await request(`${apiUrl}/user`, {
    headers: { apikey: apiKey, Authorization: `Bearer ${session.access_token}` },
    referrerPolicy: 'no-referrer', cache: 'no-store',
  });
  if (!response.ok) throw new Error('expired');
  const user = await response.json();
  if (!user.email_confirmed_at) throw new Error('expired');
  return `bonc://auth/confirmed#${new URLSearchParams({
    type: 'signup', access_token: session.access_token, refresh_token: session.refresh_token,
  })}`;
}
