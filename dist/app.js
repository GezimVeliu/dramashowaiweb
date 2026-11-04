import { stories } from './stories.js';
import { appConfig, detectPlatform, getAppDestinations } from './app-config.mjs';
import { addFavorite, findSeriesByTitle, loadLibrary, removeFavorite } from './account/account-data.mjs';
import { getUser, refreshSession } from './auth/auth-flow.mjs';

const $ = id => document.getElementById(id);
const cats = ['All stories', 'Drama', 'Family', 'Coming of age', 'Sports'];
let saved;
try {
  saved = JSON.parse(localStorage.getItem('bonc-list') || '[]');
  if (!Array.isArray(saved)) saved = [];
} catch { saved = []; }
let filter = 'All stories', listOnly = false, current = null;
let accountSession = null, remoteSeries = new Map();
let detailFocus, appFocus, toastTimer;
let appContent = null;
try {
  const previous = JSON.parse(sessionStorage.getItem('bonc-app-content') || 'null');
  if (stories.some(s => s.id === previous?.series)) appContent = { series: previous.series };
} catch { /* Session storage is optional. */ }

function setHidden(element, hidden) {
  element.hidden = hidden;
  element.classList.toggle('hidden', hidden);
}
function syncModalState() {
  const detailsOpen = !$('overlay').hidden;
  const appOpen = !$('appOverlay').hidden;
  $('sitePage').inert = detailsOpen || appOpen;
  $('overlay').inert = appOpen;
  document.body.style.overflow = detailsOpen || appOpen ? 'hidden' : '';
}
function showToast(message) {
  clearTimeout(toastTimer);
  $('toast').textContent = message;
  $('toast').classList.remove('hidden');
  toastTimer = setTimeout(() => $('toast').classList.add('hidden'), 2200);
}

$('filters').innerHTML = cats.map(c => `<button class="filter" data-filter="${c}" aria-pressed="false">${c}</button>`).join('');
function render() {
  const query = $('query').value.toLowerCase();
  const shown = stories.filter(s => (filter === 'All stories' || s.genre === filter)
    && (!listOnly || saved.includes(s.id))
    && (s.title + ' ' + s.description).toLowerCase().includes(query));
  $('grid').innerHTML = shown.map(s => `<button class="card" data-id="${s.id}" aria-label="Explore ${s.title}"><div class="poster"><img src="${s.image}" alt="${s.id === 'chance' ? 'The elderly man outside the hospital at dusk' : 'Atmospheric concept artwork for ' + s.title}" loading="lazy"><span class="tag">IN DEVELOPMENT</span><div class="poster-title"><small>BONC ORIGINAL</small>${s.poster.replace('\n', '<br>')}</div></div><h3>${s.title}</h3><p>${s.genre} · 5 planned episodes ${saved.includes(s.id) ? '· Saved' : ''}</p></button>`).join('')
    || `<p class="empty">${listOnly ? 'Your list is waiting for its first story. Explore a series and save it here.' : 'No stories found. Try another title or genre.'}</p>`;
  $('heroSave').textContent = saved.includes('chance') ? '✓ Saved' : '＋ My list';
  $('heroSave').setAttribute('aria-pressed', String(saved.includes('chance')));
  $('collectionTitle').textContent = listOnly ? 'Your stories, kept close.' : 'Stories that stay with you.';
  document.querySelectorAll('.filter').forEach(b => {
    const active = b.dataset.filter === filter;
    b.classList.toggle('on', active);
    b.setAttribute('aria-pressed', String(active));
  });
  document.querySelectorAll('.poster img').forEach(img => img.onerror = () => {
    img.style.opacity = '0';
    img.parentElement.style.background = 'linear-gradient(145deg,#46533b,#192419 65%,#686344)';
  });
}
async function save(id) {
  const wasSaved = saved.includes(id);
  saved = saved.includes(id) ? saved.filter(x => x !== id) : [...saved, id];
  let persisted = true;
  try { localStorage.setItem('bonc-list', JSON.stringify(saved)); } catch { persisted = false; }
  render();
  if (current) {
    $('saveDetail').textContent = saved.includes(current) ? '✓ In my list' : '＋ Add to my list';
    $('saveDetail').setAttribute('aria-pressed', String(saved.includes(current)));
  }
  showToast((saved.includes(id) ? 'Added to your list' : 'Removed from your list')
    + (accountSession ? ' · Synced with your account' : (persisted ? ' · Sign in to sync' : ' · For this visit only')));
  if (accountSession) {
    try {
      let catalog = remoteSeries.get(id);
      if (!catalog) { catalog = await findSeriesByTitle(accountSession.access_token, stories.find(s => s.id === id)?.title); if (catalog) remoteSeries.set(id, catalog); }
      if (!catalog) throw new Error('This story is not in the app catalog yet.');
      if (wasSaved) await removeFavorite(accountSession.access_token, catalog.id); else await addFavorite(accountSession.access_token, catalog.id);
    } catch (error) {
      saved = wasSaved ? [...saved, id] : saved.filter(value => value !== id); render();
      showToast(`${error.message} Your local list was restored.`);
    }
  }
}

async function connectAccount() {
  try { accountSession = JSON.parse(localStorage.getItem('bonc-auth-session')); } catch { accountSession = null; }
  if (!accountSession?.access_token) return;
  try {
    let user;
    try { user = await getUser(accountSession.access_token); }
    catch { accountSession = await refreshSession(accountSession.refresh_token); localStorage.setItem('bonc-auth-session', JSON.stringify(accountSession)); user = await getUser(accountSession.access_token); }
    const library = await loadLibrary(accountSession.access_token);
    const synced = [];
    for (const favorite of library.favorites) {
      const story = stories.find(item => item.title === favorite.series.title);
      if (story) { synced.push(story.id); remoteSeries.set(story.id, favorite.series); }
    }
    saved = synced; localStorage.setItem('bonc-list', JSON.stringify(saved)); render();
    const link = document.querySelector('.account-link'); link.textContent = 'My BONC'; link.href = '/account/'; link.setAttribute('aria-label', `Open account for ${user.email || 'signed-in viewer'}`);
  } catch { /* Keep guest discovery available when the session or network is stale. */ }
}
function openSeries(id, trigger = document.activeElement) {
  const s = stories.find(x => x.id === id);
  if (!s) return;
  current = id;
  detailFocus = trigger;
  $('detail').innerHTML = `<div class="detail-top"><img class="detail-art" src="${s.image}" alt="${s.title} concept artwork"><div class="detail-copy"><div class="eyebrow">Bonc original · ${s.genre}</div><h2 id="detailTitle">${s.title}</h2><p>${s.sub}</p><p>${s.description}</p><button class="secondary" id="saveDetail" aria-pressed="${saved.includes(id)}">${saved.includes(id) ? '✓ In my list' : '＋ Add to my list'}</button></div></div><div class="episodes"><div class="preview-notice"><span class="status">FREE PREVIEWS · COMING SOON</span><p>No preview or video episode is available yet. Explore the planned episode guide below.</p></div><div class="section-head"><h2>Season 1</h2><span class="count">EPISODE GUIDE</span></div><p class="notice">In development · Proposed episode outlines. Video episodes are coming soon.</p>${s.eps.map((e, i) => `<div class="episode"><span class="number">0${i + 1}</span><div class="eptext"><h3>${e[0]}</h3><p>${e[1]}</p></div><span class="status">COMING SOON</span></div>`).join('')}<p class="notice">${s.id === 'chance' ? 'Based on the hospital story and character artwork developed for this series.' : 'Working title and episode outlines developed from the original series concept.'}</p><div class="premium-handoff"><div><h3>The story continues in the app.</h3><p>Premium episodes will be unlocked in the BONC app. App and episodes coming soon.</p></div><button class="primary" id="unlockApp">Unlock in app <span aria-hidden="true">↗</span></button></div></div>`;
  setHidden($('overlay'), false);
  $('overlay').scrollTop = 0;
  syncModalState();
  $('close').focus();
  $('saveDetail').onclick = () => save(id);
  // Premium actions have only a native app handoff. No media is loaded here.
  $('unlockApp').onclick = e => openApp({ series: id }, e.currentTarget);
}
function closeSeries() {
  if ($('overlay').hidden || !$('appOverlay').hidden) return;
  setHidden($('overlay'), true);
  current = null;
  syncModalState();
  if (detailFocus?.isConnected) detailFocus.focus();
  else $('browseNav').focus();
}
function openApp(content = appContent, trigger = document.activeElement) {
  appFocus = trigger;
  appContent = content && stories.some(s => s.id === content.series) ? { series: content.series } : null;
  try { sessionStorage.setItem('bonc-app-content', JSON.stringify(appContent)); } catch { /* Optional. */ }
  const s = stories.find(s => s.id === appContent?.series);
  $('appSelection').replaceChildren();
  if (s) {
    const image = document.createElement('img');
    image.src = s.image;
    image.alt = '';
    const copy = document.createElement('div');
    const label = document.createElement('span');
    label.textContent = 'Your selected story';
    const title = document.createElement('strong');
    title.textContent = s.title;
    const note = document.createElement('small');
    note.textContent = 'Season 1 · In development';
    copy.append(label, title, note);
    $('appSelection').append(image, copy);
  }
  setHidden($('appSelection'), !s);
  const platform = detectPlatform(navigator.userAgent, navigator.maxTouchPoints);
  const links = getAppDestinations(appConfig, platform, appContent);
  $('appDestinations').replaceChildren();
  for (const destination of links) {
    const a = document.createElement('a');
    a.href = destination.url;
    a.className = destination.kind === 'app' ? 'primary' : 'secondary';
    a.textContent = destination.label + ' ↗';
    a.rel = 'noopener';
    $('appDestinations').append(a);
  }
  const configured = getAppDestinations(appConfig, 'ios').length || getAppDestinations(appConfig, 'android').length;
  $('appTitle').textContent = configured ? 'Take the next chapter with you.' : 'App coming soon.';
  $('appDescription').textContent = configured
    ? 'Discover BONC on your phone. Continue with premium episodes in the app as they are released.'
    : 'We’re creating a home for our stories on iPhone and Android. The app and video episodes are still in development.';
  $('appAvailability').textContent = links.length
    ? (links.some(l => l.kind === 'app') ? 'Open BONC if installed, or use the store link below when available.' : 'Choose a store to check availability for your device.')
    : configured ? 'A download for this device is not available yet. Visit on a supported phone to see its app options.'
      : 'There’s no app download available yet. Come back here for official launch links.';
  $('appBack').textContent = current ? 'Back to the series' : 'Back to the stories';
  setHidden($('appOverlay'), false);
  $('appOverlay').scrollTop = 0;
  syncModalState();
  $('closeApp').focus();
}
function closeApp() {
  if ($('appOverlay').hidden) return;
  setHidden($('appOverlay'), true);
  syncModalState();
  if (appFocus?.isConnected) appFocus.focus();
}
function setCollection(onlySaved) {
  listOnly = onlySaved;
  if (onlySaved) { filter = 'All stories'; $('query').value = ''; }
  $('listNav').classList.toggle('active', onlySaved);
  $('browseNav').classList.toggle('active', !onlySaved);
  render();
}
$('grid').onclick = e => { const c = e.target.closest('[data-id]'); if (c) openSeries(c.dataset.id, c); };
$('filters').onclick = e => { if (e.target.dataset.filter) { filter = e.target.dataset.filter; render(); } };
$('explore').onclick = e => openSeries('chance', e.currentTarget);
$('heroSave').onclick = () => save('chance');
$('heroApp').onclick = e => openApp({ series: 'chance' }, e.currentTarget);
$('headerApp').onclick = e => openApp(appContent, e.currentTarget);
$('bannerApp').onclick = e => openApp(appContent, e.currentTarget);
$('close').onclick = closeSeries;
$('closeApp').onclick = closeApp;
$('appBack').onclick = closeApp;
$('overlay').onclick = e => { if (e.target === $('overlay')) closeSeries(); };
$('appOverlay').onclick = e => { if (e.target === $('appOverlay')) closeApp(); };
document.addEventListener('keydown', e => {
  const modal = !$('appOverlay').hidden ? $('appOverlay') : !$('overlay').hidden ? $('overlay') : null;
  if (!modal) return;
  if (e.key === 'Escape') { e.preventDefault(); modal === $('appOverlay') ? closeApp() : closeSeries(); }
  if (e.key === 'Tab') {
    const els = [...modal.querySelectorAll('button:not(:disabled),a[href],input:not(:disabled),[tabindex="0"]')].filter(el => !el.hidden && el.getClientRects().length);
    if (e.shiftKey && document.activeElement === els[0]) { e.preventDefault(); els.at(-1)?.focus(); }
    else if (!e.shiftKey && document.activeElement === els.at(-1)) { e.preventDefault(); els[0]?.focus(); }
  }
});
$('listNav').onclick = () => setCollection(true);
$('browseNav').onclick = () => setCollection(false);
$('searchBtn').onclick = () => {
  $('query').classList.remove('hidden');
  $('series').scrollIntoView({ behavior: 'smooth' });
  $('query').focus();
};
$('query').oninput = render;
$('studioBtn').onclick = () => { setCollection(false); filter = 'All stories'; render(); $('series').scrollIntoView({ behavior: 'smooth' }); };
render();
connectAccount();
