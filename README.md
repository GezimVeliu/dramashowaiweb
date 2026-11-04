# BONC — Stories that stay

Existing public Sites project: `appgprj_6ae446d4eb188191a9868b5424e88011`.

This is a buildless static site. Serve `dist/` over HTTP for local preview. Run:

```
node --check dist/app.js
node --check dist/stories.js
node --check dist/app-config.mjs
node --test tests/*.test.mjs
```

The versioned BONC Stories Supabase signup-confirmation and password-recovery emails, local preview command, and development-only dashboard setup guide are in [`email-templates/`](email-templates/README.md). These templates do not configure email delivery or authentication routing.

## Signup confirmation deployment

The public confirmation destination is exactly `https://web.dramashowai.workers.dev/auth/confirm/`. The email template sends its one-time `TokenHash` in the URL fragment, so it is not included in the request to Cloudflare. The page exchanges it directly with the Bonc Show Video Supabase project, checks that the returned user is confirmed, removes credentials from browser history, and only then offers the fixed `bonc://auth/confirmed` app handoff. It never accepts a caller-supplied return URL.

### Owner dashboard configuration (not applied by this repository)

In Supabase project **Bonc Show Video** (`xbkfudvnewhescwbmrgt`):

1. Open **Authentication → URL Configuration**.
2. Set **Site URL** to `https://web.dramashowai.workers.dev` (no localhost value).
3. Add `https://web.dramashowai.workers.dev/auth/confirm/` to **Redirect URLs**. Remove production-facing localhost entries after confirming no development client relies on them; never use a wildcard for this route.
4. Keep **Confirm email** enabled under the email provider settings.
5. In the native signup call, set `options.emailRedirectTo` to `https://web.dramashowai.workers.dev/auth/confirm/`. Do not pass `localhost`, the old ChatGPT preview, or `dramashowaiweb.dramashowai.workers.dev`.
6. Apply the versioned **Confirm signup** template as described in `email-templates/README.md`. These dashboard steps require owner access and have **not** been performed or verified from this repository.

### Deployment and QA checklist

- Deploy `dist/` to the existing `web.dramashowai.workers.dev` Worker and confirm the route returns HTTPS with the expected page and no redirect to localhost.
- With a fresh disposable address, sign up in the native app and inspect the received link: its origin/path must be the canonical confirmation route, and neither its URL nor redirects may contain localhost.
- Click the newest link once; verify the success state, then use **Open BONC** and verify the native handler restores the supplied session and shows the confirmed account. Reopen the consumed link and verify the invalid/expired state.
- Repeat with an intentionally malformed token and an expired email; verify neither offers an app handoff. Request a replacement and verify only the newest email succeeds.
- Sign up another disposable account and enter the `{{ .Token }}` code in the waiting native app; verify `verifyOtp({ email, token, type: 'signup' })` establishes the session without using the web link.
- Record browser/device, email timestamp, redacted destination, confirmation result, app-return result, and cleanup. Do not mark BONC-36 done until the deployed link, OTP, invalid/expired, and app-return cases pass. External delivery remains dependent on BONC-27.

## Launch destinations

`dist/app-config.mjs` is the only destination configuration. All URLs are intentionally null until published, verified destinations are supplied. Do not insert guessed identifiers, custom schemes, dummy links or store badges.

- `appStoreUrl`: official published `https://apps.apple.com/…` URL.
- `googlePlayUrl`: official published `https://play.google.com/…` URL.
- `appLinkUrl`: verified HTTPS universal/Android app link, with native association and a valid web fallback.
- `contentQueryKeys`: match the native app handler's agreed series/episode parameters. The selected series is retained for the browser session; configured mobile app links receive that content reference. Store links cannot promise deferred deep linking after installation.

Mobile visitors see their platform's available destination. Desktop visitors see configured store choices. Missing options are omitted. There are no automatic app launches or timed fallback redirects.

## Episodes and access

All five original series, artwork references, descriptions and 25 proposed episode outlines are preserved. No finished video or free preview exists in this source, so every episode remains Coming soon. Future free preview playback needs a real, authorized preview asset and a deliberate implementation; adding store URLs does not enable videos.

Premium/Unlock actions only open the app handoff panel. No premium media URLs, web player, web checkout, server routes or authorization backend exist. This static UX is not an access-control security boundary. Any future premium media API must authorize entitlements on the server before issuing playback access; never ship premium playback URLs in the public catalog.

The native app remains planned as React Native without Expo, with local Xcode/Android Studio builds. Supabase and Mux remain proposed services. This website change provisions neither service and implements no mobile app.

## BONC-46 web auth implementation and QA boundary

The website account page is available at `/auth/`. It implements email/password signup, confirmation-code entry with resend, existing-account sign-in, local sign-out, session refresh, and password recovery/update against the **Bonc Show Video** Supabase project. Signup and resend use the fixed confirmation destination; recovery uses the fixed `/auth/` destination. Auth fragments are removed from browser history before any UI work, and credentials are never written to application logs or analytics.

The web flow is automated at the request-contract and error-state level in `tests/auth-flow.test.mjs`. The production Supabase settings, SMTP delivery, Auth logs, deployed callback, disposable identities, and installed iOS application are outside this repository and were not accessed by this change. Therefore this is **not** real E2E evidence and does not satisfy the issue's final acceptance gate by itself.

### Real E2E QA matrix (owner/device run required)

Use a different BONC-29-approved disposable identity for each signup case. Never record a password, OTP, JWT, tokenized URL, SMTP key, or service-role key. Record only timestamp, platform/build, redacted identity, delivery/result, and corresponding redacted Supabase Auth/Resend event.

| Journey | Web production | Installed iOS app | Evidence required |
| --- | --- | --- | --- |
| New signup + newest OTP | Not run | Not run | Email delivered; OTP accepted; confirmed user/session |
| New signup + email link | Not run | Not run | Canonical HTTPS link; authenticated landing/native handoff |
| Invalid, expired, reused, resent code/link | Not run | Not run | Accessible failure; newest resend succeeds; no session on failures |
| Existing account sign-in/out | Not run | Not run | Sign-in, local logout, protected state removed |
| Refresh/relaunch and second device | Not run | Not run | Session persists/refreshes; second device works |
| Password recovery | Not run | Not run | Recovery delivery, password update, old password rejected |
| Redirect/token safety | Static checks only | Not run | No localhost, unsupported redirect, token logs, or analytics payload |
| Android | Deferred | Deferred | Track with BONC-24 when an Android build/device exists |

Before executing this matrix, the owner must verify **Confirm email** is enabled, both exact callback URLs are allowlisted, the approved templates are installed, and Resend custom SMTP is healthy (BONC-27/BONC-36/BONC-38/BONC-39). Apple Sign-In remains off; Google Sign-In is not part of this implementation.
