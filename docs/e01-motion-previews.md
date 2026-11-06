# E01 motion-preview provenance and release gate

The website motion studies are limited to **A Second Chance, Episode 01**. They apply camera transforms to the existing canonical hospital still at `dist/assets/second-chance.png`; they do not generate faces, expressions, wardrobe, character action, or a new story beat. The page labels them as artistic motion studies rather than finished-episode footage.

## Owner review package

The production package remains in the dedicated [BONC E01 teaser Drive folder](https://drive.google.com/drive/folders/1CaLIoBEStxI-q9TQ453GwG6h2avk2Kks). These Drive items are recorded for provenance and review only and are **not fetched or published by the website while marked DRAFT**:

| Candidate | Review file ID | MP4 file ID | Publication state |
| --- | --- | --- | --- |
| Michael NOW 64 | `10EBbFlXyZshCJJ2ZtPj81eXhTFy85rsK` | `1j6BlfrbgBaI6pB4LHpgsAWrLL0Ch7EwS` | DRAFT — owner approval required |
| Emma NOW 34 | `1uwDlXmFt1X9CNbiwyaB228B-EhXSEQI5` | `1x6z6-LzEB9DVuofelkxtq-35WNaUw-An` | DRAFT — owner approval required |
| E01S01A | `170PNz6LlrOUG7iVHeD8QNCrfgNEvLexx` | `1fwCg3BLI7Pd0Ngk7yumJYwA2y9nf_X4G` | DRAFT — owner approval required |

Source mapping manifest: `1JwIOGfWaPKEU9SewQccrjpSybl58AA5E`.

Do not replace the website still with any candidate until the owner changes its state to APPROVED and the crop/loop passes identity, mobile data, layout-shift, and codec-fallback review. Never substitute Michael 2014 for present-day Michael.

## Delivery and accessibility

- The static source declares intrinsic dimensions, preventing layout shift, and non-leading cards lazy-load.
- Motion consists only of compositor transforms on the already-delivered still, avoiding a multi-megabyte GIF request.
- `prefers-reduced-motion: reduce` disables transforms and hides the unnecessary motion control.
- A visible play/pause control and live status expose the current state without auto-playing sound.
- An intersection observer pauses transforms away from the viewport.
