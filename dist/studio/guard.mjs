import { apiKey, getUser, refreshSession } from '../auth/auth-flow.mjs';

const storageKey = 'bonc-auth-session';
const allowed = new Set(['e01', 'e02', 'e03']);
const rest = 'https://xbkfudvnewhescwbmrgt.supabase.co/rest/v1';

export function resolveStudioSlug(value) {
  return allowed.has(value) ? value : null;
}

// The private DB document contains one inline application script. Inline JS is
// deliberately prohibited by the public shell CSP. Extract it and run it from a
// short-lived, same-origin-generated blob: URL after authenticated RLS retrieval.
export function separatePrivateDocument(html) {
  if (typeof html !== 'string' || !html.startsWith('<!doctype html>')) {
    throw new Error('The production document is invalid.');
  }
  const scripts = [...html.matchAll(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi)];
  if (scripts.length !== 1 || !scripts[0][0].startsWith('<script>')) {
    throw new Error('The production document has an unexpected script layout.');
  }
  const javascript = scripts[0][0].slice('<script>'.length, -'</script>'.length);
  if (!javascript.trim()) throw new Error('Production controls are unavailable.');
  return { markup: html.replace(scripts[0][0], ''), javascript };
}

async function readRows(path, token, request = fetch) {
  const response = await request(rest + '/' + path, {
    headers: { apikey: apiKey, Authorization: 'Bearer ' + token, Accept: 'application/json' },
    cache: 'no-store', referrerPolicy: 'no-referrer',
  });
  if (!response.ok) throw Error('Studio authorization could not be verified.');
  const rows = await response.json();
  if (!Array.isArray(rows)) throw Error('Invalid studio response.');
  return rows;
}

function renderPrivateDocument(html) {
  const { markup, javascript } = separatePrivateDocument(html);
  const objectUrl = URL.createObjectURL(new Blob([javascript], { type: 'text/javascript' }));
  document.open();
  document.write(markup);
  document.close();

  // A dynamically appended external script executes reliably after document.write(),
  // unlike inline scripts inserted after the document's initial parse.
  const script = document.createElement('script');
  script.src = objectUrl;
  script.async = false;
  script.onload = () => URL.revokeObjectURL(objectUrl);
  script.onerror = () => {
    URL.revokeObjectURL(objectUrl);
    const message = document.createElement('p');
    message.setAttribute('role', 'alert');
    message.textContent = 'The studio controls did not load. Refresh the page and retry.';
    document.body.prepend(message);
  };
  document.body.append(script);
}

async function initialize() {
  const slug = document.body.dataset.studioEpisode;
  const status = document.getElementById('status');
  const actions = document.getElementById('state');
  const decline = message => { status.textContent = message; actions.hidden = false; };

  if (!resolveStudioSlug(slug)) return decline('Unknown production episode.');
  let session;
  try { session = JSON.parse(localStorage.getItem(storageKey) || 'null'); }
  catch { session = null; }
  if (!session?.access_token) return decline('Sign in with your BONC account to continue.');

  try {
    let user;
    try { user = await getUser(session.access_token); }
    catch {
      if (!session.refresh_token) throw Error('Your session expired.');
      session = await refreshSession(session.refresh_token);
      localStorage.setItem(storageKey, JSON.stringify(session));
      user = await getUser(session.access_token);
    }
    if (!user?.id) throw Error('Your session could not be verified.');
    const rows = await readRows('profiles?select=is_admin&id=eq.' + encodeURIComponent(user.id), session.access_token);
    if (rows.length !== 1 || rows[0].is_admin !== true) {
      return decline('Access denied. This workspace requires the administrator role.');
    }
    const pages = await readRows('studio_pages?select=content_html&slug=eq.' + encodeURIComponent(slug), session.access_token);
    if (pages.length !== 1 || typeof pages[0].content_html !== 'string') {
      return decline('No authorized production material was returned.');
    }
    renderPrivateDocument(pages[0].content_html);
  } catch (error) {
    decline(error?.message || 'Studio authorization failed.');
  }
}

if (typeof document !== 'undefined') initialize();
