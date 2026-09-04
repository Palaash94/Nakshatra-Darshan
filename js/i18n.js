/* ============================================================
   I18N, LANGUAGE SWITCHER (Phase 1: static UI chrome only)
   English is never stored anywhere separately, it's captured live
   from the page's own initial rendered markup (captureOriginalEnglish),
   so it always exactly matches whatever's actually in index.html
   and doubles as the "reset to English" target and the fallback
   for any key a translation hasn't filled in yet.
   Other languages live in i18n/<lang>.js, each a plain <script> tag
   (index.html) that assigns into window.I18N_DATA.<lang> - loaded
   as real scripts, not fetch()'d as JSON. This app is a static site
   with no server behind it, meant to also work when the file is
   opened directly (file://) rather than through a dev server; a
   fetch() to a local i18n/<lang>.json file is blocked by every
   Chromium/Firefox browser's file:// CORS policy, which is exactly
   why the language switcher previously did nothing when the page
   wasn't served over http(s) - the fetch silently failed, the catch
   swallowed it, and every language fell back to English. A <script
   src="..."> tag has no such restriction, so this reads from the
   already-loaded global object instead of fetching anything.
   Sanskrit/Vedic terms (Nakshatra, Dasha, Yoga, Dosha, etc.) are
   never translated in meaning, only re-spelled per language: the
   Romanized spelling stays as-is for fr/es/de, Devanagari for hi,
   Katakana for ja - that re-spelling lives inside each i18n/*.js
   file, this script is just the plumbing.
   ============================================================ */

const SUPPORTED_LANGS=['en','fr','es','de','hi','ja'];
const I18N_STORAGE_KEY='nd_lang';

let currentLang='en';
let originalEnglishText={};        // key -> innerHTML, captured from the live DOM
let originalEnglishPlaceholder={}; // key -> placeholder text, captured from the live DOM

function captureOriginalEnglish(){
  document.querySelectorAll('[data-i18n]').forEach(el=>{
    const key=el.getAttribute('data-i18n');
    if(!(key in originalEnglishText))originalEnglishText[key]=el.innerHTML;
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el=>{
    const key=el.getAttribute('data-i18n-placeholder');
    if(!(key in originalEnglishPlaceholder))originalEnglishPlaceholder[key]=el.placeholder;
  });
}

// Synchronous in practice (the dictionaries are already loaded via <script> tags by the time this
// runs) but kept async so callers (setLanguage) don't need to change if this ever goes back to a
// real fetch for some language added later.
async function loadLanguage(lang){
  if(lang==='en')return{};
  const dict=(window.I18N_DATA&&window.I18N_DATA[lang])||null;
  if(!dict){
    console.error(`i18n: no data loaded for "${lang}" - is i18n/${lang}.js included in index.html?`);
    return{};
  }
  return dict;
}

function applyTranslations(lang,dict){
  document.querySelectorAll('[data-i18n]').forEach(el=>{
    const key=el.getAttribute('data-i18n');
    el.innerHTML=(dict&&dict[key])||originalEnglishText[key]||el.innerHTML;
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el=>{
    const key=el.getAttribute('data-i18n-placeholder');
    el.placeholder=(dict&&dict[key])||originalEnglishPlaceholder[key]||el.placeholder;
  });
  document.documentElement.lang=lang;
}

async function setLanguage(lang){
  if(SUPPORTED_LANGS.indexOf(lang)===-1)lang='en';
  const dict=await loadLanguage(lang);
  applyTranslations(lang,dict);
  currentLang=lang;
  try{localStorage.setItem(I18N_STORAGE_KEY,lang);}catch(e){}
  const sel=document.getElementById('lang-select');
  if(sel&&sel.value!==lang)sel.value=lang;
}

function initI18n(){
  captureOriginalEnglish();
  let saved='en';
  try{saved=localStorage.getItem(I18N_STORAGE_KEY)||'en';}catch(e){}
  setLanguage(saved);
}

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',initI18n);
}else{
  initI18n();
}
