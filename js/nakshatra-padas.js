/* ============================================================
   NAKSHATRA PADA (QUARTER) MEANINGS
   Generates a distinct symbolic meaning for each of the 108 Nakshatra
   padas (27 nakshatras x 4 padas) from existing classical building
   blocks already in this codebase, rather than 108 hand-authored
   entries: the pada's Navamsa sign/lord (derived via the same
   getNavamsaSign() used for the D9 chart), the fixed classical
   Purushartha-per-pada rule (pada 1=Dharma, 2=Artha, 3=Kama,
   4=Moksha - this ordering is constant across every nakshatra), and
   the nakshatra's own trait keywords (NAKSHATRA_TRAITS, ephemeris.js).
   ============================================================ */

const PURUSHARTHA_BY_PADA=['Dharma','Artha','Kama','Moksha'];
const PURUSHARTHA_INFO={
  Dharma:'righteous duty, purpose, and acting in line with one\'s deeper nature',
  Artha:'material resource, achievement, and the practical means to sustain a life',
  Kama:'desire, relationship, enjoyment, and creative or sensory fulfilment',
  Moksha:'release, introspection, and liberation from limitation'
};

// Lazily-built cache: key "nakIdx-pada" -> meaning string. Computed once per pada, on demand.
const _padaMeaningCache={};

function getPadaMeaning(nakIdx,pada){
  const key=nakIdx+'-'+pada;
  if(_padaMeaningCache[key])return _padaMeaningCache[key];
  const nakName=NAKSHATRAS[nakIdx];
  const purushartha=PURUSHARTHA_BY_PADA[pada-1];
  // Representative longitude at the pada's midpoint, fed through the same navamsa math used for D9
  const midLon=nakIdx*13.33333+(pada-1)*3.33333+1.66667;
  const navSign=getNavamsaSign(midLon);
  const navLord=SIGN_LORD[navSign];
  const navFlavor=LAGNA_SIGN_FLAVOR[navSign];
  const trait=NAKSHATRA_TRAITS[nakName]||'distinctive';
  const purushInfo=PURUSHARTHA_INFO[purushartha];

  const text=`This is the ${purushartha} quarter (pada ${pada}) of ${nakName}, falling in the ${SIGNS[navSign]} Navamsa (ruled by ${navLord}). `+
    `${nakName}'s underlying nature — ${trait} — expresses here through ${navFlavor}. `+
    `Because this pada carries a ${purushartha} orientation, its themes of ${purushInfo} tend to colour how this specific quarter's energy is most naturally used and fulfilled.`;
  _padaMeaningCache[key]=text;
  return text;
}

// Convenience wrapper: opens the existing generic info modal (showGenericInfo, render-tabs.js)
// pre-filled with a given pada's meaning. Used by the info-icons wired into the planet/navamsa tables.
function showPadaInfo(nakIdx,pada,nakName){
  const title=`${nakName||NAKSHATRAS[nakIdx]} — Pada ${pada}`;
  showGenericInfo(title,getPadaMeaning(nakIdx,pada));
}
