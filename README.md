# BONC — Stories that stay

Existing public Sites project: `appgprj_6ae446d4eb188191a9868b5424e88011`.

This is a buildless static site. Serve `dist/` over HTTP for local preview. Run:

```
node --check dist/app.js
node --check dist/stories.js
node --check dist/app-config.mjs
node --test tests/app-handoff.test.mjs
```

The versioned BONC Stories Supabase signup-confirmation email, local preview command, and dashboard setup guide are in [`email-templates/`](email-templates/README.md). This template does not configure email delivery or confirmation routing.

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
