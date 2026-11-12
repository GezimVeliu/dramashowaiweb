import { apiKey, getUser, refreshSession } from '../auth/auth-flow.mjs';

const storageKey='bonc-auth-session';
const allowed=new Set(['e01','e02','e03']);
const slug=document.body.dataset.studioEpisode;
const status=document.getElementById('status');
const actions=document.getElementById('state');
const rest='https://xbkfudvnewhescwbmrgt.supabase.co/rest/v1';

function decline(message) {
  status.textContent=message;
  actions.hidden=false;
}
export function resolveStudioSlug(value) {
  return allowed.has(value)?value:null;
}
async function readRows(path, token, request=fetch) {
  const response=await request(rest+'/'+path,{
    headers:{apikey:apiKey,Authorization:'Bearer '+token,Accept:'application/json'},
    cache:'no-store',referrerPolicy:'no-referrer'
  });
  if(!response.ok)throw Error('Studio authorization could not be verified.');
  const rows=await response.json();
  if(!Array.isArray(rows))throw Error('Invalid studio response.');
  return rows;
}
async function initialize(){
  if(!resolveStudioSlug(slug))return decline('Unknown production episode.');
  let session;
  try{session=JSON.parse(localStorage.getItem(storageKey)||'null');}catch{session=null;}
  if(!session?.access_token)return decline('Sign in with your BONC account to continue.');
  let user;
  try{
    try{user=await getUser(session.access_token);}
    catch{
      if(!session.refresh_token)throw Error('Your session expired.');
      session=await refreshSession(session.refresh_token);
      localStorage.setItem(storageKey,JSON.stringify(session));
      user=await getUser(session.access_token);
    }
    if(!user?.id)throw Error('Your session could not be verified.');
    const rows=await readRows('profiles?select=is_admin&id=eq.'+encodeURIComponent(user.id),session.access_token);
    if(rows.length!==1||rows[0].is_admin!==true)return decline('Access denied. This workspace requires the administrator role.');
    const pages=await readRows('studio_pages?select=content_html&slug=eq.'+encodeURIComponent(slug),session.access_token);
    if(pages.length!==1||typeof pages[0].content_html!=='string')return decline('No authorized production material was returned.');
    // Source content comes exclusively from the DB table with admin-only RLS, not a publicly bundled HTML file.
    document.open();
    document.write(pages[0].content_html);
    document.close();
  }catch(error){decline(error?.message||'Studio authorization failed.');}
}
if(typeof document!=='undefined')initialize();
