const section=document.querySelector('.hero-gallery');
const toggle=document.getElementById('heroMotionToggle');
if(section && toggle){
 const preference=window.matchMedia('(prefers-reduced-motion: reduce)');
 let manuallyPaused=false;
 const sync=()=>{const paused=manuallyPaused||preference.matches;section.classList.toggle('hero-motion-paused',paused);toggle.hidden=preference.matches;toggle.textContent=manuallyPaused?'Play motion':'Pause motion';toggle.setAttribute('aria-pressed',String(manuallyPaused));toggle.setAttribute('aria-label',manuallyPaused?'Play animated story artwork':'Pause animated story artwork');};
 toggle.addEventListener('click',()=>{manuallyPaused=!manuallyPaused;sync()});
 preference.addEventListener?.('change',sync);sync();
}
