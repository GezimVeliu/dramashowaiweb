import { readConfirmation, confirmEmail } from './flow.mjs';
let input = readConfirmation(location.hash);
// Credentials stay in this page's memory only, never history, storage or analytics.
history.replaceState(null, '', location.pathname);
const $ = id => document.getElementById(id);
const fail = reason => {
  $('title').textContent = reason === 'missing' ? 'Open your email link.' : 'Let’s try that again.';
  $('message').textContent = reason === 'missing'
    ? 'Use the confirmation link from your newest BONC email, or enter its code in the app.'
    : reason === 'rate-limit' ? 'Too many attempts. Wait a little, then try again.'
    : 'This link may have expired or already been used. If you confirmed with a code, you’re all set. Otherwise, request a new email in the app.';
};
if (input.kind === 'missing' || input.kind === 'expired') fail(input.kind);
else {
  $('confirm').hidden = false;
  $('message').textContent = 'One more step and you’re ready for BONC.';
}
$('confirm').onclick = async () => {
  $('confirm').disabled = true;
  $('confirm').textContent = 'Confirming…';
  try {
    const link = await confirmEmail(input);
    input = null;
    $('title').textContent = 'You’re confirmed.';
    $('message').textContent = 'Your email is confirmed. Continue in the BONC app.';
    $('confirm').hidden = true;
    $('help').hidden = true;
    $('fallback').hidden = false;
    $('open').href = link;
    $('open').hidden = false;
    // Keep a visible, user-initiated fallback when a browser blocks automatic app opening.
    if (/Android|iPhone|iPad|iPod/.test(navigator.userAgent)) location.href = link;
  } catch (error) {
    fail(error.message);
    $('confirm').disabled = false;
    $('confirm').textContent = 'Try again';
  }
};
