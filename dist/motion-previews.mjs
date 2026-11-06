export function motionPreference(mediaQuery) {
  return mediaQuery.matches ? 'reduced' : 'full';
}

export function wireMotionPreviews(doc = document, win = window) {
  const section = doc.getElementById('e01Teasers');
  const toggle = doc.getElementById('teaserMotionToggle');
  const status = doc.getElementById('teaserMotionStatus');
  if (!section || !toggle || !status) return;

  const preference = win.matchMedia('(prefers-reduced-motion: reduce)');
  let manuallyPaused = false;

  const render = () => {
    const reduced = motionPreference(preference) === 'reduced';
    const paused = reduced || manuallyPaused;
    section.classList.toggle('motion-paused', paused);
    toggle.hidden = reduced;
    toggle.setAttribute('aria-pressed', String(manuallyPaused));
    toggle.textContent = manuallyPaused ? 'Play motion' : 'Pause motion';
    status.textContent = reduced
      ? 'Static previews shown because reduced motion is enabled.'
      : (manuallyPaused ? 'Motion previews paused.' : 'Subtle camera motion is playing without sound.');
  };

  toggle.addEventListener('click', () => { manuallyPaused = !manuallyPaused; render(); });
  preference.addEventListener?.('change', render);
  if ('IntersectionObserver' in win) {
    const observer = new win.IntersectionObserver(([entry]) => {
      section.classList.toggle('motion-offscreen', !entry.isIntersecting);
    }, { rootMargin: '150px 0px' });
    observer.observe(section);
  }
  render();
}
