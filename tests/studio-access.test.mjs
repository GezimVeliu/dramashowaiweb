import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const file=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('all studio routes are only protected empty auth shells',()=>{
 for(const ep of ['e01','e02','e03']){
  const s=file('dist/studio/'+ep+'/index.html');
  assert.match(s,new RegExp('data-studio-episode="'+ep+'"'));
  assert.match(s,/studio\/guard\.mjs/);
  assert.doesNotMatch(s,/const DATA=|E01S01A|f035188e-95d1-4ca4-98b2/);
 }
});
test('admin guard requires authenticated user, profile and RLS-protected page',()=>{
 const s=file('dist/studio/guard.mjs');
 assert.match(s,/getUser\(session\.access_token\)/);
 assert.match(s,/is_admin!==true/);
 assert.match(s,/studio_pages\?select=content_html/);
 assert.match(s,/Authorization:'Bearer '/);
 assert.doesNotMatch(s,/email\s*===?\s*['"]gezimveliu/);
});
test('account nav remains hidden by default',()=>{
 const s=file('dist/account/index.html');
 assert.match(s,/id="studioNav"[^>]+hidden/);
 assert.match(file('dist/account/account.mjs'),/isStudioAdmin/);
});

test('public home account menu grants no studio link without server-checked admin role',()=>{
 const home=file('dist/index.html');
 assert.match(home,/id="studioMenuItem"[^>]+hidden/);
 const js=file('dist/app.js');
 assert.match(js,/isStudioAdmin\(accountSession.access_token,user.id\)/);
 assert.match(js,/studioMenuItem/);
});
