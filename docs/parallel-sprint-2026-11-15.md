# BONC Studios — five-track technical sprint (15 November 2026)

**Owner authorization:** technical implementation and reviewed PRs are approved. This document is a coordination record, not evidence that any external release or device QA is complete.

## Source audit / current state
- Linear project: Drama show ai app, 69 issues — 30 Done, 15 In Progress, 13 Todo, 9 Backlog, 1 In Review, 1 Duplicate as audited 15 November 2026.
- GitHub: `GezimVeliu/dramashowaiweb` (public, main), `GezimVeliu/dramashowaimobile` (private, main).
- Web: `https://dramashow.gezimveliu.com`, Netlify deploy ready, but a real owner Google sign-in + private Studio E01–E03 visual test is still pending.
- Supabase Bonc Show Video: `studio_pages` 3 RLS-protected documents; `episodes` 1 catalog row, `episode_media` 0 rows. Do not report film content as published.
- Native: iOS TestFlight PR #20 is open and currently reports mergeable=false; Apple account/signing/device evidence are not cleared.
- Android: `com.bonc.dev` initial version and unsigned candidate; physical Android E2E and owner-approved Play listing not verified.

## Exactly five independent workstreams

| # | Scope / existing Linear issue | Repo / branch | Integration boundary | QA & stop condition |
|---|---|---|---|---|
| 1 | WEB production/hub — BONC-65 | dramashowaiweb / feat/bonc65-studio-reliability-sprint-20261115 | **Only web integration PR.** Covers web BONC-47/61/62/64 followups, not separate competing web PRs | Unit + browser smoke, admin RLS, image fallback, review deploy; never leak private stills. Owner login E2E remains pending |
| 2 | MOBILE in-app Google OAuth — BONC-66 | dramashowaimobile / feat/bonc66-oauth-callback-hardening-20261115 | Changes to auth service, OAuth trust/callback tests; not native release gates | URL trust and callback tests first, then supported ASWebAuthenticationSession/Custom Tabs implementation and real device QA. Do not claim the browser-sheet UX from just URL tests |
| 3 | ANDROID device QA — BONC-53 | dramashowaimobile / feat/bonc53-android-qa-gate-20261115 | Android evidence gate scripts/docs only; does not mutate auth | Need physical device evidence, approved disposable identities and no blocker; keep Play Console release blocked |
| 4 | iOS TestFlight prep — BONC-56 | dramashowaimobile / existing PR #20 | Existing PR only; reconcile merge conflict and signed-release readiness without touching OAuth/Android | Verify CI, static release gate; no signing/upload/ASC create without owner account + real device acceptance |
| 5 | CI/release coordination — BONC-58 | Cross-repo audit / this document; shares WEB integration branch | No competing release workflows, no unconditional automerge. Track exact head SHA, owner approvals and rollback | Green checks, scoped PR integration order, Netlify post-deploy smoke, physical device E2E before beta claims |

### Integration order
1. Merge independently verified production-safe web changes **only after** passing checks and PR review; recheck public route and private hub with owner account.
2. Merge Android evidence gate and OAuth hardening separately after their own checks; native browser sheet remains a distinct native implementation.
3. Rebase/reconcile old iOS PR #20 without rewriting unreviewed commits; verify owner Apple membership and device availability before any TestFlight attempt.
4. Rebaseline open Linear statuses after proof, not after PR creation.
5. Do not create/upload/publish original E01 movie media merely because its studio keyframes exist. Final approved media is a separate gate.

### Non-negotiable boundaries
- No new paid infrastructure, app-store purchases or account-verification steps.
- No destructive DB migration, user deletion or private keys in Git.
- Studio RLS must deny anon/non-admin; Drive thumbnails may be private and should show an honest source link rather than prompting public Drive sharing.
- Real-device E2E is required for actual mobile release; Jest/Node/CI checks are not a substitute.
- Never claim unattended autonomous development from this plan alone; branch and PR status are tracked directly on GitHub.
