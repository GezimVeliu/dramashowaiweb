import { getUser, refreshSession, signOut } from '../auth/auth-flow.mjs';
import { loadLibrary, removeFavorite } from './account-data.mjs';
import { appConfig, detectPlatform, getAppDestinations } from '../app-config.mjs';

const $ = id => document.getElementById(id);
const storageKey = 'bonc-auth-session';
const escape = value => String(value || '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
let session;
try { session = JSON.parse(localStorage.getItem(storageKey)); } catch { localStorage.removeItem(storageKey); }
const store = value => value ? localStorage.setItem(storageKey, JSON.stringify(value)) : localStorage.removeItem(storageKey);
const empty = message => `<div class="inline-empty"><p>${message}</p><a href="/">Discover BONC stories</a></div>`;
const time = seconds => `${Math.max(1, Math.round(Number(seconds || 0) / 60))} min`;

function showSignedOut(message = '') { $('status').textContent = message; $('signedOut').hidden = false; $('dashboard').hidden = true; $('logout').hidden = true; }
function historyRow(item) {
  const label = item.isComplete ? 'Watched' : `${item.percent}% complete`;
  const number = item.episode.episode_number || item.episode.number || 1;
  return `<article class="history"><div class="episode-number">${String(number).padStart(2, '0')}</div><div class="history-copy"><p>${escape(item.series.title)}</p><h3>${escape(item.episode.title)}</h3><small>Episode ${escape(number)} · ${time(item.duration_seconds || item.episode.duration_seconds)}</small><div class="progress"><i style="width:${item.percent}%"></i></div><span>${label}</span></div><button class="continue" data-series="${escape(item.series.id)}" data-episode="${escape(item.episode.id)}">Continue in App ↗</button></article>`;
}
async function render() {
  if (!session?.access_token) return showSignedOut();
  try {
    let user;
    try { user = await getUser(session.access_token); }
    catch { session = await refreshSession(session.refresh_token); store(session); user = await getUser(session.access_token); }
    $('identity').textContent = user.email ? `Signed in as ${user.email}. Your favorites and viewing activity sync with the BONC app.` : 'Your favorites and viewing activity sync with the BONC app.';
    const library = await loadLibrary(session.access_token);
    $('favorites').innerHTML = library.favorites.map(item => `<article class="favorite"><div class="favorite-art">${item.series.poster_url ? `<img src="${escape(item.series.poster_url)}" alt="">` : '<span>✳</span>'}</div><div><p>BONC ORIGINAL</p><h3>${escape(item.series.title)}</h3><small>${escape(item.series.description || 'Saved to My List')}</small><button class="remove" data-remove="${escape(item.series.id)}">Remove from favorites</button></div></article>`).join('') || empty('Your favorites will appear here on every signed-in device.');
    $('continueWatching').innerHTML = library.continueWatching.map(historyRow).join('') || empty('Start an episode in the BONC app and continue it from any device.');
    $('watched').innerHTML = library.watched.map(historyRow).join('') || empty('Completed episodes will be kept here.');
    $('status').textContent = '';
    $('signedOut').hidden = true; $('dashboard').hidden = false; $('logout').hidden = false;
  } catch (error) { if (error.status === 401) { store(null); showSignedOut(error.message); } else { $('status').textContent = `${error.message} Try refreshing the page.`; } }
}
function openApp(content) {
  const platform = detectPlatform(navigator.userAgent, navigator.maxTouchPoints);
  const destination = getAppDestinations(appConfig, platform, content)[0];
  if (destination) location.href = destination.url;
  else $('status').textContent = 'The BONC app link is not published yet. Your library is safe and will be ready when the app is available.';
}
document.addEventListener('click', async event => {
  const remove = event.target.closest('[data-remove]');
  if (remove) { remove.disabled = true; try { await removeFavorite(session.access_token, remove.dataset.remove); await render(); } catch (error) { $('status').textContent = error.message; remove.disabled = false; } }
  const button = event.target.closest('.continue');
  if (button) openApp({ series: button.dataset.series, episode: button.dataset.episode });
});
$('openApp').onclick = () => openApp(null);
$('logout').onclick = async () => { try { await signOut(session.access_token); } catch {} store(null); showSignedOut('You are signed out on this device.'); };
render();
