# BONC merge, release verification, and rollback runbook

This is the operating checklist for BONC web changes and the shared safety policy for coordinated mobile releases. It does not grant permission to publish privacy/support content, change accounts or payments, or submit an app to a store.

## 1. Current inventory and required policy

Repository-local inventory (recorded 5 November 2026):

- The web repository is a buildless static site published from `dist/` by Netlify. Its build command is `npm run build`.
- Web CI is `.github/workflows/ci.yml`; its required candidate check is **Web CI / Syntax and unit tests**.
- The checkout available for this inventory has no authenticated GitHub remote/API context. Branch protection, rulesets, repository settings, installed apps, and the mobile repository's live checks therefore remain **unknown until inspected in GitHub by an authorized maintainer**. Do not represent this file as evidence that those settings are enabled.
- Before the first protected merge, inspect both `dramashowaiweb` and `dramashowaimobile` under **Settings → Rules → Rulesets** (or Branch protection), and record the default branch, applicable rule, required checks, review requirement, merge queue setting, and any bypass actors in the Linear audit comment.
- Protect the default branch from force pushes and deletion; require conflict-free pull requests and current critical checks. Do not enable unconditional repository-wide auto-merge and do not add a bypass solely to complete a release.

For mobile, use the existing native CI and release-preflight commands from `dramashowaimobile`; do not copy them into this repository or create a second workflow with the same purpose. The mobile PR must show lint, typecheck, tests, configuration validation, and the existing release preflight as successful for the same head SHA. If any command or check is absent, unknown, duplicated, or stale, stop and resolve it in that repository before merging.

## 2. Pull request and merge gate

1. Open a normal, non-draft PR and include the Linear identifier and URL (for example, `BONC-58`) in the PR body. Link the PR back from Linear.
2. Complete `.github/pull_request_template.md`, including user-facing release notes or an explicit `None — internal only`.
3. Run `npm run ci` locally for web. Review the entire diff and confirm it contains no credentials, tokenized URLs, production user data, or unapproved legal copy.
4. Immediately before merge, obtain the candidate SHA from the PR's latest commit or `git rev-parse HEAD`. Confirm the GitHub checks UI is displaying that exact SHA and that **Web CI / Syntax and unit tests** succeeded. A success attached to an older SHA is not valid.
5. Confirm the PR is mergeable, the base is current under the configured rule, required reviews/approvals are present, and every critical check is successful. Failing, cancelled, pending, skipped unexpectedly, missing, stale, conflicting, or unknown critical checks are a hard stop. Never bypass a rule or permission.
6. An authorized operator may merge a passing low-risk PR while actively supervising the run. Do not promise a later unattended merge. Account, payment, privacy/legal, production-domain, and store-publishing actions retain their separate owner approval gates.
7. Record in Linear: PR URL, final head SHA, merge commit SHA, checks and results, reviewer/merger, merge time in UTC, release notes, deployment URL/ID, smoke results, and any follow-up or rollback.

## 3. Web deploy and production verification

Netlify must build the merge commit with `npm run build` and publish `dist/`. Before promoting a preview or declaring production healthy, compare the provider's deployed commit SHA with the recorded merge commit. A deploy of another revision is not verification.

After an authorized production deployment, use a clean browser profile and run the following non-destructive checks against the canonical production origin:

| Route | Expected smoke result |
| --- | --- |
| `/` | HTTP success; BONC shell and catalog render; no console-breaking error |
| `/auth/` | Auth form renders over HTTPS; do not create an account without disposable-identity approval |
| `/auth/confirm/` | Confirmation page renders without a token; no localhost redirect and no credential in logs |
| `/account/` | Page renders and safely requests sign-in when logged out; no protected data is exposed |
| Privacy URL | Check only after BONC-57 owner approval and publication; exact approved URL returns the approved revision |
| Support URL | Check only after BONC-57 owner approval and publication; exact approved URL is reachable |

Also check a narrow mobile viewport, security-sensitive redirects, and a representative static asset. Do not claim email delivery, Supabase production behavior, cross-device sync, or native handoff from route availability alone. Capture UTC time, deployed SHA, status/result, browser/device, and redacted evidence in Linear. Never paste OTPs, session values, password-reset links, JWTs, or email addresses.

## 4. Reversible web rollback

Rollback is indicated by a broken critical route, authentication regression, data exposure, unsafe redirect, material content error, or sustained production failure.

1. Pause further promotion and record the incident time, deployed SHA, symptoms, and decision owner. For credential exposure, revoke/rotate through the authorized service process before ordinary redeployment.
2. In Netlify, select the last known-good production deploy whose commit SHA and prior smoke evidence are recorded. Use the provider's rollback/restore-published-deploy control. Do not rebuild an unknown branch or mutate `dist/` directly in production.
3. Repeat the production smoke matrix and record the restored deploy ID/SHA. If restoration fails, keep the release held and escalate; do not conceal the failure with redirects or disabled checks.
4. Revert the faulty merge through a new, linked, non-draft PR so the default branch matches production. Run the normal current-SHA checks and review; emergency context does not authorize bypassing protections.
5. Document impact, rollback SHA/deploy ID, verification, and follow-up in Linear. A later fix uses the full PR and release gate again.

## 5. Safe mobile beta update or hold

Mobile beta distribution is a separate, approval-gated operation. A green PR or signed artifact is not permission to upload or submit.

Before an approved beta update, record the source SHA, immutable artifact/checksum, application/package ID, version and build number, signing identity (never private key material), environment/config validation, native CI and release-preflight results, device QA, release notes, privacy/support approval state, and target track/tester group.

- **Hold by default** when approval is missing; identifiers/signing are uncertain; checks or device QA are incomplete; privacy/support URLs are unapproved; or auth, playback, account deletion, or data isolation is unverified.
- For Google Play, keep the release in the approved internal testing track and use a staged/held release where available. Do not promote tracks or send for production review from this runbook.
- For TestFlight, upload only after explicit approval, restrict the build to the approved internal group, and do not submit for external beta review or App Store review automatically.
- To stop a bad beta, halt rollout or remove the build from tester availability using the store console's supported controls. Mobile binaries already installed cannot be remotely rolled back reliably; prepare a higher-build-number corrective release from the last known-good source, rerun every gate, and obtain fresh approval.
- Never reuse version/build identifiers, replace a signed artifact in place, expose signing secrets, weaken access restrictions, or claim that a console hold removes an already installed build.

Record every approved upload, hold, tester availability change, and corrective build in Linear with operator, UTC time, source SHA, artifact identity, track/group, outcome, and redacted evidence.
