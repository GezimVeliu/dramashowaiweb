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

## Pilot waitlist and measurement

The home page now presents an honest pilot funnel: trailer and pilot media remain visibly unavailable until approved URLs exist. The waitlist uses the existing Supabase Auth email-OTP flow, stores the consent version in user metadata, and asks the visitor to verify the address through the canonical confirmation destination. A successful browser request is not E2E proof of email delivery; production delivery and confirmation must be tested before publicly claiming the waitlist is operational.

`dist/pilot-funnel.mjs` defines the only media and analytics configuration. Its analytics endpoint is intentionally `null` pending owner approval of a privacy-appropriate first-party collector. The page emits `bonc:analytics` browser events for CTA clicks and confirmation requests without email addresses or persistent identifiers; an approved collector can receive the same allowlisted event payload by setting the HTTPS endpoint. Trailer variant and pilot start/completion event names are reserved, but must only be wired when real approved players are added.

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

## Account library and cross-device sync

Authenticated viewers can open `/account/` to review Favorites, Continue Watching, and Watched activity. The browser uses the existing Supabase session and the existing `watchlist`, `watch_progress`, `series`, and `episodes` tables; it creates no parallel schema and never supplies a `user_id`. Supabase RLS derives ownership from the bearer token. Favorite changes on the discovery page are written to `watchlist`, while episode progress remains read-only on the web because full playback belongs in the native app.

The account UI deliberately labels every episode action **Continue in App**. App links remain disabled until `dist/app-config.mjs` contains a verified HTTPS destination. Live cross-device and account-isolation acceptance still requires BONC-29-approved disposable identities against the deployed site; unit tests exercise request shape and presentation logic, not production RLS.
