# BONC Stories Supabase Auth email templates

This directory versions the hosted Supabase **Confirm signup** and **Reset password** messages for development review. It does not configure SMTP, sender identity, redirects, or either application.

## Apply the templates manually

In the Supabase Dashboard, select **Bonc Show Video** (`xbkfudvnewhescwbmrgt`), then:

1. Open **Authentication → Email Templates → Confirm signup**. Set the subject to `Confirm your email for BONC Stories`, paste all of `confirm-signup.html` into the message body, and save. BONC-38 owns this existing template; keep its `{{ .ConfirmationURL }}` and `{{ .Token }}` placeholders unchanged.
2. Open **Authentication → Email Templates → Reset password**. Set the subject to `Reset your BONC Stories password`, paste all of `reset-password.html` into the message body, and save. Keep every `{{ .ConfirmationURL }}` occurrence unchanged.
3. Do not paste a rendered preview. Supabase expands the Go-template variables when it sends the relevant Auth message.

The dashboard supplies an HTML body editor; it may not expose a separate plain-text editor. The `.txt` files are reviewed, safe fallback copy for a future SMTP/provider path that supports a text MIME part. They are not automatically installed by these steps.

### Why the recovery template uses `ConfirmationURL`

Supabase's Reset password template supports `{{ .ConfirmationURL }}` for the generated, single-use recovery link. A client starts the flow with `resetPasswordForEmail(email, { redirectTo })`; after the link establishes a recovery session, the client must handle the `PASSWORD_RECOVERY` event and call `updateUser({ password })`. This repository does not invent a callback, expose a token, or implement that application flow. It deliberately does not show `{{ .Token }}` because no reviewed BONC recovery code-entry handler exists.

## URL Configuration — coordinate with BONC-36

Do not change routes as part of this template work. The BONC-36 owner must provide and verify the confirmation and recovery destinations first.

1. Open **Authentication → URL Configuration**.
2. Set **Site URL** to the agreed HTTPS web fallback. `https://web.dramashowai.workers.dev` may be used only after BONC-36 verifies that it handles the relevant Auth response; it is a destination, not an email sender domain.
3. Add each exact web callback or native deep-link destination used as `emailRedirectTo`/`redirectTo` to **Redirect URLs**. Prefer exact development URLs; do not add an unreviewed broad wildcard.
4. Verify that the application-supplied reset `redirectTo` is allowlisted. If it is absent or not accepted, Supabase can fall back to **Site URL** rather than the intended reset screen.
5. Run the link, expired-link, reused-link, and invalid-link cases in both supported clients. Confirm the recovery session reaches a password-entry screen before enabling external tests.

The email intentionally consumes Supabase's complete `{{ .ConfirmationURL }}` rather than constructing a URL from `TokenHash`, `SiteURL`, or a hardcoded route. This keeps routing ownership in BONC-36 and gives the visible fallback exactly the same destination as the button.

## Development-only sending and BONC-27 blockers

Supabase's built-in mailer is a restricted test service, not proof of public delivery. Current provider limits must be checked in the Dashboard and current Supabase documentation before each test. At the time this guide was prepared, the documented defaults restrict delivery to email addresses belonging to the project's organization team, apply a low and changeable project-wide email rate limit, and provide no delivery SLA.

Resend external SMTP is a separate configuration. Resend currently has no verified sending domain for BONC, so do **not** enter guessed SMTP credentials, use a `workers.dev` address as **From**, claim authenticated delivery, buy a domain, or change a paid plan. Never commit provider keys or SMTP passwords.

The BONC-27 owner must manually:

- choose and verify an authorized sender domain/address with the intended provider;
- configure Supabase **Authentication → SMTP Settings** using secrets outside source control, confirm the current Free-plan/provider limits, and disable provider link tracking that could rewrite Auth links;
- review Auth email expiry and rate limits, then test only with approved addresses;
- record actual delivery, sender/SPF/DKIM/DMARC results, signup and recovery outcomes, and expired/invalid/reused-link behavior in representative mail clients.

Until those steps and BONC-36 routing are verified, this work enables only local rendering and restricted development-template review. It does **not** enable public signup, external SMTP, or live email delivery.

## Local checks and preview

Run:

```sh
node --test tests/email-template.test.mjs
node email-templates/render-preview.mjs
```

Open the generated `email-templates/preview/confirm-signup.html` and `email-templates/preview/reset-password.html`. Preview output is git-ignored and uses the reserved `.invalid` domain plus visibly fake values. Never paste it into Supabase. Review both narrow and wide viewport layouts and light/dark mode in an email-capable renderer before dashboard testing.

No tracking links, remote images, secrets, sender-domain claims, paid-service changes, auth-route changes, or native-code changes are included.
