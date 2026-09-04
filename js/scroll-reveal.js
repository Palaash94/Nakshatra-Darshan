/* ============================================================
   SCROLL REVEAL
   A tiny, dependency-free fade-and-rise-on-scroll utility, built to
   match this app's own no-build, zero-dependency philosophy rather
   than pulling in a library (Sal.js, GSAP, etc). Most of this app's
   markup is generated as HTML strings at runtime (tabs, cards,
   popups) via container.innerHTML = "...", not written once into
   index.html - so a one-time, page-load-only pass would miss almost
   everything. Instead this watches the DOM itself: a single shared
   MutationObserver on <body> notices matching elements the moment
   any render function injects them, and arms each one with the same
   shared IntersectionObserver the first time it's seen.

   REVEAL_SELECTOR intentionally targets the app's existing repeated
   card/section classes rather than requiring every render-*.js
   template to be hand-annotated with a new data-attribute - far less
   surface area to touch, and any new card class added later just
   needs adding to this one list to opt in.

   One shared IntersectionObserver (not one per element - cheaper)
   flips a `.revealed` class the first time an element crosses into
   view, then stops watching it (a reveal only ever happens once per
   element). Respects prefers-reduced-motion by skipping the whole
   apparatus and leaving every element at its normal, fully-visible
   styling - no class ever gets added, so there's nothing to reveal.
   ============================================================ */
(function(){
  if(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;

  const REVEAL_SELECTOR=[
    '.shadbala-card','.karaka-card','.vargottama-planet-card','.group-house-card',
    '.mangal-partner-card','.update-card','.panchang-card','.koota-hero-card',
    '.current-dasha-card','.big-three-card','.life-area-card','.life-area-radar-card',
    '.you-opener'
  ].join(',');

  let io=null;
  function getObserver(){
    if(io)return io;
    io=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){
          entry.target.classList.add('revealed');
          io.unobserve(entry.target);
        }
      });
    },{root:null,rootMargin:'0px 0px -8% 0px',threshold:0.08});
    return io;
  }

  function armElement(el){
    if(el.dataset.revealArmed)return;
    el.dataset.revealArmed='1';
    el.classList.add('reveal-init');
    getObserver().observe(el);
  }

  function scanForNewReveals(root){
    if(root.matches&&root.matches(REVEAL_SELECTOR))armElement(root);
    if(root.querySelectorAll)root.querySelectorAll(REVEAL_SELECTOR).forEach(armElement);
  }

  document.addEventListener('DOMContentLoaded',()=>scanForNewReveals(document.body));

  const mo=new MutationObserver(mutations=>{
    mutations.forEach(m=>{
      m.addedNodes.forEach(node=>{
        if(node.nodeType!==1)return;
        scanForNewReveals(node);
      });
    });
  });
  mo.observe(document.body,{childList:true,subtree:true});
})();
