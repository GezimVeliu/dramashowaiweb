# BONC-63 — archival concept motion studies (PR #12 conflict resolution)

This feature was originally drafted as **"A Second Chance / Episode 01"**, based on a hospital still. That 2026 draft is **not** the current approved E01 story: the live canonical hero and series remain **"The Man Who Refused a Dollar"**, with Emma Brooks and Michael Carter.

This conflict resolution keeps the original PR's useful **three silent CSS camera drift experiments** and its reduced-motion / manual pause behavior while preventing an outdated hospital storyline from replacing current production copy. It preserves the current homepage gallery, Studio admin link, authentication, Favorites sync, privacy links and release messaging.

## Media and approval boundaries

- The experiment renders only the already tracked source still `dist/assets/second-chance.png`. It does not download additional Drive assets, generate dialogue, or claim to be a final trailer, teaser or E01 film footage.
- The concept remains identified as an **earlier BONC creative archive study**, not E01.
- The original production review Drive folder is [here](https://drive.google.com/drive/folders/1CaLIoBEStxI-q9TQ453GwG6h2avk2Kks). The external MP4/GIF candidates documented in the original PR remain **DRAFT**; none are published by this change.
- No private Drive images are made public, and no approved E01 shot manifest, main character, or production status is changed.

## UX and testing

- Three figures use subtle transforms on one static image, no background music or autoplay video.
- `prefers-reduced-motion: reduce` disables animation, and the Play/Pause button is hidden for those viewers.
- An IntersectionObserver pauses animation when the section leaves view.
- Images declare width and height and lazy load.
- Test with `npm run ci`. Also inspect on mobile + desktop before merging.

## Merge policy

This is a focused replay of original PR #12 onto the current `main`; original PR branch is backed up as `backup/bonc63-pr12-before-reconcile-20261119`. No auto-deploy to production until owner approves the revised public concept presentation.
