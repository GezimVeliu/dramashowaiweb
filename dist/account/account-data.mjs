import { apiKey } from '../auth/auth-flow.mjs';

export const restUrl = 'https://xbkfudvnewhescwbmrgt.supabase.co/rest/v1';

const headers = (token, extra = {}) => ({
  apikey: apiKey,
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
  ...extra,
});

async function request(path, token, options = {}, fetcher = fetch) {
  const response = await fetcher(`${restUrl}/${path}`, {
    ...options,
    headers: headers(token, options.headers),
    referrerPolicy: 'no-referrer',
    cache: 'no-store',
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const error = new Error(response.status === 401 ? 'Your session has expired. Sign in again.' : payload.message || 'Your library could not be loaded.');
    error.status = response.status;
    throw error;
  }
  if (response.status === 204) return null;
  return response.json().catch(() => null);
}

export async function loadLibrary(token, fetcher = fetch) {
  const [watchlist, progress, series, episodes] = await Promise.all([
    request('watchlist?select=*&order=created_at.desc', token, {}, fetcher),
    request('watch_progress?select=*&order=updated_at.desc', token, {}, fetcher),
    request('series?select=*', token, {}, fetcher),
    request('episodes?select=*', token, {}, fetcher),
  ]);
  return joinLibrary({ watchlist, progress, series, episodes });
}

export async function findSeriesByTitle(token, title, fetcher = fetch) {
  const rows = await request(`series?select=id,title&title=eq.${encodeURIComponent(title)}&limit=1`, token, {}, fetcher);
  return rows?.[0] || null;
}

export function joinLibrary({ watchlist = [], progress = [], series = [], episodes = [] }) {
  const seriesById = new Map(series.map(item => [item.id, item]));
  const episodeById = new Map(episodes.map(item => [item.id, item]));
  const favorites = watchlist.map(item => ({ ...item, series: seriesById.get(item.series_id) })).filter(item => item.series);
  const history = progress.map(item => {
    const episode = episodeById.get(item.episode_id);
    const duration = Number(item.duration_seconds || episode?.duration_seconds || 0);
    const position = Number(item.position_seconds ?? item.progress_seconds ?? 0);
    const completed = item.completed ?? item.is_completed;
    const percent = duration > 0 ? Math.min(100, Math.round(position / duration * 100)) : (completed ? 100 : 0);
    return { ...item, episode, series: seriesById.get(episode?.series_id), percent, isComplete: Boolean(completed || percent >= 95) };
  }).filter(item => item.episode && item.series);
  return { favorites, history, continueWatching: history.filter(item => !item.isComplete && item.percent > 0), watched: history.filter(item => item.isComplete) };
}

export function addFavorite(token, seriesId, fetcher = fetch) {
  return request('watchlist?on_conflict=user_id,series_id', token, { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify({ series_id: seriesId }) }, fetcher);
}

export function removeFavorite(token, seriesId, fetcher = fetch) {
  return request(`watchlist?series_id=eq.${encodeURIComponent(seriesId)}`, token, { method: 'DELETE', headers: { Prefer: 'return=minimal' } }, fetcher);
}

export async function isStudioAdmin(token,userId,fetcher=fetch){
  if(!token||!userId)return false;
  const rows=await request('profiles?select=is_admin&id=eq.'+encodeURIComponent(userId),token,{},fetcher);
  return rows?.length===1&&rows[0].is_admin===true;
}
