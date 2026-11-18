export const PRIMARY_SERIES_ID = 'man-who-refused-a-dollar';

export const stories = [
  {
    id: PRIMARY_SERIES_ID, aliases: ['chance'], catalogSlugs: ['the-old-man'], catalogTitles: ['The Man Who Refused a Dollar', 'A Second Chance'],
    title: 'The Man Who Refused a Dollar', poster: 'The Man Who\nRefused a Dollar', genre: 'Drama', image: null,
    sub: 'One refusal. A story twelve years in the making.',
    description: 'In 2026, 64-year-old Michael Carter refuses a dollar from Emma Brooks. Their encounter reaches back to Brooklyn in 2014, when Michael was 52, in a short drama about dignity, memory, and human connection.',
    episodeCount: 10, episodeDuration: 'About 2 min',
    eps: Array.from({ length: 10 }, (_, index) => [`Episode ${index + 1}`, index === 0 ? 'Michael Carter and Emma Brooks meet after an offered dollar is refused.' : 'Story details will be shared after the episode is approved for release.'])
  },
  { id: 'talent', title: 'New Talent', poster: 'New\nTalent', genre: 'Sports', image: 'assets/story-0.jpg', sub: 'Every legend starts somewhere.', description: 'A proposed football coming-of-age series. Story details are still in development.', episodeCount: 5, eps: [] },
  { id: 'aid', title: 'Aid: A Light Within', poster: 'A Light\nWithin', genre: 'Family', image: 'assets/story-1.jpg', sub: 'Love lives in the little moments.', description: 'A proposed family drama. Story details are still in development.', episodeCount: 5, eps: [] },
  { id: 'world', catalogSlugs: ['her-own-world'], title: 'Her Own World', poster: 'Her Own\nWorld', genre: 'Coming of age', image: 'assets/story-2.jpg', sub: 'Belonging begins with understanding.', description: 'A proposed coming-of-age drama. Story details are still in development.', episodeCount: 5, eps: [] },
  { id: 'friends', catalogSlugs: ['the-third-friend'], title: 'The Third Friend', poster: 'The Third\nFriend', genre: 'Coming of age', image: 'assets/story-3.jpg', sub: 'Three friends. One left outside.', description: 'A proposed coming-of-age drama about friendship. Story details are still in development.', episodeCount: 5, eps: [] }
];

export function resolveStoryId(value) {
  return stories.find(story => story.id === value || story.aliases?.includes(value))?.id || null;
}

export function migrateStoryIds(values = []) {
  return [...new Set(values.map(resolveStoryId).filter(Boolean))];
}

/**
 * Map live Supabase series rows to editorial cards by stable, verified slugs.
 * A known slug takes precedence over a stale title. Unknown slugs fail closed:
 * we must not alias unrelated stories (e.g. hospital concepts) merely because
 * a historical title happened to match. Legacy rows *without* a slug retain
 * the original explicit title mapping for backwards compatibility.
 */
export function storyForCatalogSeries(catalogRow) {
  if (!catalogRow || typeof catalogRow !== 'object') return null;
  const slug = typeof catalogRow.slug === 'string'
    ? catalogRow.slug.trim().toLowerCase() : '';
  if (slug) return stories.find(item => item.catalogSlugs?.includes(slug)) || null;
  const title = typeof catalogRow.title === 'string' ? catalogRow.title : '';
  if (!title) return null;
  return stories.find(item => item.title === title || item.catalogTitles?.includes(title)) || null;
}
