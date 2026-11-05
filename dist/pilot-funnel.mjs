import { apiKey, apiUrl, confirmationUrl, validateEmail } from './auth/auth-flow.mjs';

export const funnelConfig = Object.freeze({
  trailerUrl: null,
  pilotUrl: null,
  analyticsEndpoint: null,
});

export async function joinWaitlist(email, consent, request = fetch) {
  const normalized = email.trim().toLowerCase();
  if (!validateEmail(normalized)) throw new Error('Enter a valid email address.');
  if (!consent) throw new Error('Please agree to receive BONC pilot updates.');
  const response = await request(`${apiUrl}/otp?redirect_to=${encodeURIComponent(confirmationUrl)}`, {
    method: 'POST',
    headers: { apikey: apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: normalized,
      create_user: true,
      data: { bonc_waitlist: true, consent_version: '2026-11-05' },
    }),
    referrerPolicy: 'no-referrer',
    cache: 'no-store',
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(response.status === 429
    ? 'Too many attempts. Please wait, then try again.'
    : payload.msg || payload.message || 'We could not save your request. Please try again.');
  return { email: normalized };
}

const allowedEvents = new Set(['trailer_variant', 'pilot_start', 'pilot_complete', 'cta_click', 'registration']);

export function trackFunnelEvent(name, properties = {}, endpoint = funnelConfig.analyticsEndpoint, request = fetch) {
  if (!allowedEvents.has(name)) return Promise.resolve(false);
  const event = {
    name,
    properties: Object.fromEntries(Object.entries(properties).filter(([, value]) => ['string', 'number', 'boolean'].includes(typeof value))),
    path: location.pathname,
    occurred_at: new Date().toISOString(),
  };
  window.dispatchEvent(new CustomEvent('bonc:analytics', { detail: event }));
  if (!endpoint) return Promise.resolve(false);
  return request(endpoint, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(event),
    keepalive: true, credentials: 'omit', referrerPolicy: 'no-referrer',
  }).then(response => response.ok).catch(() => false);
}

export function wirePilotFunnel(root = document) {
  const form = root.querySelector('#waitlistForm');
  const status = root.querySelector('#waitlistStatus');
  root.querySelectorAll('[data-track-cta]').forEach(button => button.addEventListener('click', () => {
    trackFunnelEvent('cta_click', { placement: button.dataset.trackCta });
  }));
  form?.addEventListener('submit', async event => {
    event.preventDefault();
    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;
    status.textContent = 'Sending your confirmation email…';
    try {
      const result = await joinWaitlist(form.elements.email.value, form.elements.consent.checked);
      form.reset();
      status.textContent = `Check ${result.email} and use the confirmation link to verify your request.`;
      trackFunnelEvent('registration', { status: 'confirmation_requested' });
    } catch (error) {
      status.textContent = error.message;
    } finally { submit.disabled = false; }
  });
}
