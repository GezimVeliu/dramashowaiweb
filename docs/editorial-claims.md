# Public editorial claims

This checklist records the source and release treatment for public story claims in BONC-61. It prevents draft artwork or historical marketing copy from silently becoming canon.

| Public claim | Approved source | Website treatment |
| --- | --- | --- |
| Series title: **The Man Who Refused a Dollar** | `homeless_season1_production_bible.md` (owner-approved Drive document linked in BONC-61) | Hero, collection card, pilot panel, and detail dialog use the approved title. |
| Michael Carter is 64 in 2026 and 52 in the 2014 Brooklyn timeline | Production Bible; BONC-42 identity lock | The synopsis states both ages and years. No unapproved portrait is presented as Michael. |
| Emma Brooks is the other named lead | Production Bible | The synopsis and Episode 1 teaser identify Emma without adding biography. |
| Season 1 has 10 episodes of about two minutes each | Production Bible | Hero metadata, card count, and detail guide show the approved plan. |
| Michael refuses a dollar offered by Emma | Production Bible | Used as the non-spoiler series premise and Episode 1 teaser. Later episode beats stay withheld. |
| Other four series remain separate proposed concepts | BONC-61 editorial direction; no approved production bibles supplied in this repository | Cards retain distinct artwork and titles, use restrained “proposed” summaries, and do not publish invented episode plots. All remain labelled **In development**. |

## Migration and catalog compatibility

`man-who-refused-a-dollar` is the single canonical web ID. The historical `chance` value remains an accepted alias for browser deep links, session handoff state, and saved-list entries. On read, local IDs are normalized and deduplicated. Supabase matching accepts both the approved title and historical `A Second Chance` catalog title so existing watchlist rows remain reachable during a catalog migration.

The historical hospital image is not displayed. An approval placeholder is used until owner-approved Michael Carter artwork is delivered.
