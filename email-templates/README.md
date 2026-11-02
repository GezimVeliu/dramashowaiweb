# BONC Stories signup confirmation email

This directory versions the Supabase **Confirm signup** message. It does not configure SMTP, sender identity, redirects, or the mobile app.

## Apply in Supabase

1. Open the **Bonc Show Video** project (`xbkfudvnewhescwbmrgt`) in the Supabase Dashboard.
2. Go to **Authentication → Email Templates → Confirm signup**.
3. Set the subject to `Confirm your email for BONC Stories`.
4. Paste the complete contents of `confirm-signup.html` into the message body and save it.
5. Keep both `{{ .ConfirmationURL }}` occurrences and `{{ .Token }}` unchanged. Supabase replaces them at send time; no code or link is hard-coded in this repository.
6. Send a test only after the redirect configuration from BONC-36 and sender/delivery configuration from BONC-27 are ready. Verify the resulting link destination, code-entry flow, sender display, Gmail/Apple Mail rendering, and light/dark mobile views before calling the live flow verified.

Supabase's dashboard currently accepts an HTML body for this template, but does not expose a separate plain-text editor for every configuration. `confirm-signup.txt` is the reviewed fallback copy for an SMTP/provider configuration that supports a text part.

## Preview

Run `node email-templates/render-preview.mjs`, then open `email-templates/preview/confirm-signup.html`. The renderer substitutes conspicuously non-production preview values only in the generated, git-ignored file. Never paste preview output into Supabase.

The button and fallback link use the same Supabase-generated `{{ .ConfirmationURL }}`. The displayed OTP is the real `{{ .Token }}` template value, not a generated code. If the agreed app flow does not offer code entry, remove the OTP instruction and block together before publishing; do not leave an unusable code in the message.

## Ownership boundaries

- **BONC-36** owns the public confirmation destination, Site URL, redirect allowlist, native deep links, and successful verification. The template only consumes the URL Supabase supplies.
- **BONC-27** owns SMTP/provider configuration, authenticated sender domain, SPF/DKIM/DMARC, recovery email, and live delivery evidence.
- The `workers.dev` address may be a website destination; it must not be presented as an authenticated email sender identity.

No tracking links, remote images, secrets, sender-domain claims, or paid-service changes are included.
