/* ============================================================
   I18N — LANGUAGE SWITCHER (Phase 1: static UI chrome only)
   English is never stored in a JSON file — it's captured live from
   the page's own initial rendered markup (captureOriginalEnglish),
   so it always exactly matches whatever's actually in index.html
   and doubles as the "reset to English" target and the fallback
   for any key a translation file hasn't filled in yet.
   Other languages are lazy-fetched from i18n/<lang>.json on demand
   and cached in memory - nothing is bundled upfront.
   Sanskrit/Vedic terms (Nakshatra, Dasha, Yoga, Dosha, etc.) are
   never translated in meaning, only re-spelled per language: the
   Romanized spelling stays as-is for fr/es/de, Devanagari for hi,
   Katakana for ja - that re-spelling lives inside each JSON file,
   this script is just the plumbing.
   ============================================================ */

const SUPPORTED_LANGS=['en','fr','es','de','hi','ja'];
const I18N_STORAGE_KEY='nd_lang';

let currentLang='en';
let originalEnglishText={};        // key -> innerHTML, captured from the live DOM
let originalEnglishPlaceholder={}; // key -> placeholder text, captured from the live DOM
const i18nCache={};                // lang -> {key:value}, populated on first use

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

async function loadLanguage(lang){
  if(lang==='en')return{};
  if(i18nCache[lang])return i18nCache[lang];
  try{
    const res=await fetch(`i18n/${lang}.json`);
    if(!res.ok)throw new Error(`HTTP ${res.status}`);
    const dict=await res.json();
    i18nCache[lang]=dict;
    return dict;
  }catch(err){
    console.error(`i18n: failed to load "${lang}"`,err);
    return{};
  }
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
