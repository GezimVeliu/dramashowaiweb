import { getUser, googleOAuthUrl, readCallback, refreshSession, requestRecovery, resendSignup, signIn, signOut, signUp, updatePassword, validateEmail, validatePassword, verifySignupCode } from './auth-flow.mjs';
const $ = id => document.getElementById(id);
const storageKey = 'bonc-auth-session';
let mode = 'signup', pendingEmail = '', session = null;
const setStatus = (message = '', success = false) => { $('status').textContent = message; $('status').classList.toggle('success', success); };
const busy = (button, on) => { button.disabled = on; };
function store(value) { session = value; value ? localStorage.setItem(storageKey, JSON.stringify(value)) : localStorage.removeItem(storageKey); }
function showAccount(user) { $('signedOut').hidden = true; $('recovery').hidden = true; $('signedIn').hidden = false; $('accountEmail').textContent = user.email ? `Signed in as ${user.email}` : 'Your account is ready.'; setStatus('Your session is active on this device.', true); }
function setMode(next) {
  mode = next; const signup = mode === 'signup';
  $('signupTab').setAttribute('aria-selected', signup); $('signinTab').setAttribute('aria-selected', !signup);
  $('cardTitle').textContent = signup ? 'Create your account' : 'Welcome back';
  $('lead').textContent = signup ? 'We’ll email a one-time link and code to confirm it’s you.' : 'Sign in with your confirmed email and password.';
  $('submit').textContent = signup ? 'Create account' : 'Sign in'; $('password').autocomplete = signup ? 'new-password' : 'current-password'; $('verify').hidden = true; setStatus();
}
async function acceptSession(next) { const user = await getUser(next.access_token); store(next); showAccount(user); }
const callback = readCallback(location.hash);
const oauthError = new URLSearchParams(location.search).has('error') || new URLSearchParams(location.search).has('error_code');
if (location.hash || oauthError) history.replaceState(null, '', location.pathname);
if (oauthError || callback?.kind === 'error') setStatus('This link is invalid or expired. Request a new email.');
else if (callback?.kind === 'recovery') { session = callback; $('signedOut').hidden = true; $('recovery').hidden = false; setStatus('Recovery link accepted.', true); }
else if (callback?.kind === 'session') acceptSession(callback).catch(error => setStatus(error.message));
else {
  try { session = JSON.parse(localStorage.getItem(storageKey)); } catch { store(null); }
  if (session?.access_token) getUser(session.access_token).then(showAccount).catch(async () => { try { await acceptSession(await refreshSession(session.refresh_token)); } catch { store(null); } });
}
$('signupTab').onclick = () => setMode('signup'); $('signinTab').onclick = () => setMode('signin');
$('credentials').onsubmit = async event => {
  event.preventDefault(); const email = $('email').value.trim().toLowerCase(), password = $('password').value;
  if (!validateEmail(email)) return setStatus('Enter a valid email address.');
  if (!validatePassword(password)) return setStatus('Use a password between 8 and 72 characters.');
  busy($('submit'), true); setStatus(mode === 'signup' ? 'Creating your account…' : 'Signing in…');
  try {
    const result = mode === 'signup' ? await signUp(email, password) : await signIn(email, password);
    if (mode === 'signup' && !result.access_token) { pendingEmail = email; $('verify').hidden = false; setStatus('Check your email for a confirmation link or code.', true); $('code').focus(); } else await acceptSession(result);
  } catch (error) { setStatus(error.status === 400 && mode === 'signin' ? 'Email or password is incorrect, or the email is not confirmed.' : error.message); } finally { busy($('submit'), false); }
};
$('verifyCode').onclick = async () => { const token = $('code').value.replace(/\s/g, ''); if (!pendingEmail || !/^\d{6,10}$/.test(token)) return setStatus('Enter the code from your newest email.'); busy($('verifyCode'), true); try { await acceptSession(await verifySignupCode(pendingEmail, token)); } catch { setStatus('That code is invalid, expired, or already used. Request a new code.'); } finally { busy($('verifyCode'), false); } };
$('resend').onclick = async () => { if (!pendingEmail) return; busy($('resend'), true); try { await resendSignup(pendingEmail); $('code').value = ''; setStatus('A new email is on its way. Use only its newest code.', true); } catch (error) { setStatus(error.message); } finally { busy($('resend'), false); } };
$('forgot').onclick = async () => { const email = $('email').value.trim().toLowerCase(); if (!validateEmail(email)) return setStatus('Enter your email address first.'); busy($('forgot'), true); try { await requestRecovery(email); setStatus('If an account exists, a recovery email is on its way.', true); } catch (error) { setStatus(error.message); } finally { busy($('forgot'), false); } };
$('savePassword').onclick = async () => { const password = $('newPassword').value; if (!validatePassword(password)) return setStatus('Use a password between 8 and 72 characters.'); busy($('savePassword'), true); try { await updatePassword(session.access_token, password); await acceptSession(session); setStatus('Your password was updated.', true); } catch (error) { setStatus(error.message); } finally { busy($('savePassword'), false); } };
$('logout').onclick = async () => { busy($('logout'), true); try { await signOut(session.access_token); } catch { /* Clear expired local sessions too. */ } store(null); location.reload(); };

$('googleSignin').onclick = () => {
  $('googleSignin').disabled = true;
  setStatus('Opening secure Google sign-in…');
  // Browser navigates to Supabase Auth, then to Google, then back to this fixed page.
  location.assign(googleOAuthUrl());
};
