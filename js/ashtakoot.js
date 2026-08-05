/* ============================================================
   ASHTAKOOT GUNA MILAN (COUPLE COMPATIBILITY)
   Full 36-point classical 8-koota marriage compatibility scoring
   between two already-computed chartData objects (Couple mode
   only). Reuses each chart's existing moonNakKoota (Gana/Yoni/
   Nadi) and moonRashiVarna (Varna/Vashya) data instead of
   recomputing it. Pure calculation - no DOM. Rendered by
   renderCompatibilityTab() in render-tabs.js.
   ============================================================ */

// ---------------- Varna (max 1) ----------------
const VARNA_RANK={Brahmin:4,Kshatriya:3,Vaishya:2,Shudra:1};
function varnaScore(varnaA,varnaB){
  return VARNA_RANK[varnaA]>=VARNA_RANK[varnaB]?1:0;
}

// ---------------- Vashya (max 2) ----------------
// Classical 5-group behavioural-dominance compatibility. Exact point values for specific cross-group
// pairs vary somewhat by classical source; this follows a commonly published convention.
const VASHYA_SCORE_TABLE={
  'Chatushpada-Nara':1,'Chatushpada-Jalachara':1,'Chatushpada-Vanachara':0.5,'Chatushpada-Keeta':0,
  'Nara-Jalachara':1,'Nara-Vanachara':0,'Nara-Keeta':1,
  'Jalachara-Vanachara':1,'Jalachara-Keeta':0,
  'Vanachara-Keeta':0
};
function vashyaScore(g1,g2){
  if(g1===g2)return 2;
  const k1=g1+'-'+g2,k2=g2+'-'+g1;
  if(VASHYA_SCORE_TABLE[k1]!==undefined)return VASHYA_SCORE_TABLE[k1];
  if(VASHYA_SCORE_TABLE[k2]!==undefined)return VASHYA_SCORE_TABLE[k2];
  return 1;
}

// ---------------- Tara (max 3) ----------------
// 9-fold Tara counted from each partner's birth Nakshatra to the other's, in both directions.
const TARA_NAMES=['Janma','Sampat','Vipat','Kshema','Pratyak','Sadhaka','Vadha','Mitra','Ati-Mitra'];
const TARA_GOOD_IDX=[1,3,5,7,8]; // Sampat, Kshema, Sadhaka, Mitra, Ati-Mitra
function taraCategory(fromIdx,toIdx){
  return((toIdx-fromIdx+27)%27)%9;
}
function taraScore(nakA,nakB){
  const catAtoB=taraCategory(nakA,nakB),catBtoA=taraCategory(nakB,nakA);
  const goodAtoB=TARA_GOOD_IDX.includes(catAtoB),goodBtoA=TARA_GOOD_IDX.includes(catBtoA);
  const score=(goodAtoB&&goodBtoA)?3:(goodAtoB||goodBtoA)?1.5:0;
  return{score,nameAtoB:TARA_NAMES[catAtoB],nameBtoA:TARA_NAMES[catBtoA]};
}

// ---------------- Yoni (max 4) ----------------
// The 14 classical Yoni animals form exactly 7 natural-enemy pairs; same species scores highest
// (opposite-gender pairing is the classical ideal), enemy-species pairs score 0, everything else
// is scored as neutral - a disclosed simplification of the fuller friend/neutral/enemy species tables
// some classical sources use.
const YONI_ENEMY_PAIRS=[['Horse','Buffalo'],['Elephant','Lion'],['Goat','Monkey'],['Serpent','Mongoose'],['Dog','Deer'],['Cat','Rat'],['Cow','Tiger']];
function yoniBaseAnimal(y){return y.replace(/\s*\([MF]\)/,'').trim()}
function yoniGender(y){const m=y.match(/\(([MF])\)/);return m?m[1]:null}
function yoniScore(y1,y2){
  const a1=yoniBaseAnimal(y1),a2=yoniBaseAnimal(y2),g1=yoniGender(y1),g2=yoniGender(y2);
  if(a1===a2)return g1!==g2?4:3;
  const isEnemy=YONI_ENEMY_PAIRS.some(pair=>(pair[0]===a1&&pair[1]===a2)||(pair[0]===a2&&pair[1]===a1));
  return isEnemy?0:2;
}

// ---------------- Graha Maitri (max 5) ----------------
// Friendship between the two Moon-sign lords, reusing naturalRelation() (ephemeris.js) in both
// directions (natural friendship is not always symmetric) and combining via the standard 6-tier table.
const GRAHA_MAITRI_TABLE={
  'friend-friend':5,'friend-neutral':4,'neutral-neutral':3,
  'enemy-friend':1,'enemy-neutral':0.5,'enemy-enemy':0
};
function grahaMaitriScore(lordA,lordB){
  if(lordA===lordB)return 5;
  const relAtoB=naturalRelation(lordA,lordB),relBtoA=naturalRelation(lordB,lordA);
  const key=[relAtoB,relBtoA].sort().join('-');
  return GRAHA_MAITRI_TABLE[key]!==undefined?GRAHA_MAITRI_TABLE[key]:3;
}

// ---------------- Gana (max 6) ----------------
// Symmetric version of the classical Gana Koota table. Some classical texts give a slightly
// asymmetric groom/bride-order table (e.g. Deva-groom+Manushya-bride scoring differently than the
// reverse); since this app doesn't collect partner gender, this tool uses the symmetric convention.
const GANA_SCORE_TABLE={'Deva-Deva':6,'Manushya-Manushya':6,'Rakshasa-Rakshasa':6,'Deva-Manushya':6,'Deva-Rakshasa':0,'Manushya-Rakshasa':0};
function ganaScore(g1,g2){
  return GANA_SCORE_TABLE[[g1,g2].sort().join('-')];
}

// ---------------- Bhakoot (max 7) ----------------
// Moon-sign distance dosha: 2/12, 5/9, or 6/8 sign-distance combinations are classically inauspicious,
// commonly waived when both Moon signs share the same lord.
function bhakootScore(signA,signB){
  if(signA===signB)return 7;
  const dist=((signB-signA+12)%12)+1;
  if(![2,12,5,9,6,8].includes(dist))return 7;
  if(SIGN_LORD[signA]===SIGN_LORD[signB])return 7;
  return 0;
}

// ---------------- Nadi (max 8) ----------------
function nadiScore(n1,n2){return n1===n2?0:8}

// calcAshtakoot(chartDataA, chartDataB) -> {kootas:[{name,max,score,desc}], total, maxTotal, verdict, criticalDoshas}
function calcAshtakoot(chartDataA,chartDataB){
  const mA=chartDataA.moonNakKoota,mB=chartDataB.moonNakKoota;
  const vA=chartDataA.moonRashiVarna,vB=chartDataB.moonRashiVarna;
  const nameA=chartDataA.name||'Partner A',nameB=chartDataB.name||'Partner B';
  const moonSignA=chartDataA.planetData.Moon.sign,moonSignB=chartDataB.planetData.Moon.sign;
  const nakA=chartDataA.planetData.Moon.nakshatra.idx,nakB=chartDataB.planetData.Moon.nakshatra.idx;
  const lordA=SIGN_LORD[moonSignA],lordB=SIGN_LORD[moonSignB];

  const varnaPts=varnaScore(vA.varna,vB.varna);
  const vashyaPts=vashyaScore(vA.vashya,vB.vashya);
  const tara=taraScore(nakA,nakB);
  const yoniPts=yoniScore(mA.yoni,mB.yoni);
  const grahaMaitriPts=grahaMaitriScore(lordA,lordB);
  const ganaPts=ganaScore(mA.gana,mB.gana);
  const bhakootPts=bhakootScore(moonSignA,moonSignB);
  const nadiPts=nadiScore(mA.nadi,mB.nadi);

  const kootas=[
    {name:'Varna',max:1,score:varnaPts,desc:`Spiritual temperament hierarchy. ${nameA}: ${vA.varna}, ${nameB}: ${vB.varna}.`},
    {name:'Vashya',max:2,score:vashyaPts,desc:`Mutual influence/dominance group. ${nameA}: ${vA.vashya}, ${nameB}: ${vB.vashya}.`},
    {name:'Tara',max:3,score:tara.score,desc:`Birth-star counted compatibility. ${nameA}→${nameB}: ${tara.nameAtoB}; ${nameB}→${nameA}: ${tara.nameBtoA}.`},
    {name:'Yoni',max:4,score:yoniPts,desc:`Instinctual/physical compatibility. ${nameA}: ${mA.yoni}, ${nameB}: ${mB.yoni}.`},
    {name:'Graha Maitri',max:5,score:grahaMaitriPts,desc:`Friendship between Moon-sign lords: ${lordA} and ${lordB}.`},
    {name:'Gana',max:6,score:ganaPts,desc:`Temperament group. ${nameA}: ${mA.gana}, ${nameB}: ${mB.gana}.`},
    {name:'Bhakoot',max:7,score:bhakootPts,desc:bhakootPts===0?'Moon signs fall at a classically inauspicious 2/12, 5/9, or 6/8 distance (Bhakoot Dosha).':'Moon-sign distance is classically favourable (or the dosha is waived — both signs share a lord).'},
    {name:'Nadi',max:8,score:nadiPts,desc:nadiPts===0?`Both share the same Nadi (${mA.nadi}) — the most heavily weighted dosha in this system.`:`Nadi differs (${mA.nadi} vs ${mB.nadi}) — no Nadi Dosha.`}
  ];
  const total=kootas.reduce((s,k)=>s+k.score,0);
  const maxTotal=36;
  const verdict=total>=32?'Excellent':total>=24?'Good':total>=18?'Marginal':'Not recommended';

  const criticalDoshas=[];
  if(nadiPts===0)criticalDoshas.push({name:'Nadi Dosha',desc:'Both partners share the same Nadi. Classically considered a significant concern (traditionally linked to the couple\'s future health/progeny) and examined closely regardless of the total score.'});
  if(bhakootPts===0)criticalDoshas.push({name:'Bhakoot Dosha',desc:'Moon signs fall at a classically inauspicious distance from one another, traditionally linked to friction around finances or family harmony.'});

  return{kootas,total,maxTotal,verdict,criticalDoshas};
}

const ASHTAKOOT_METHODOLOGY='Ashtakoot ("eight-fold") Guna Milan is the most widely used classical Vedic marriage-compatibility system, scoring two birth charts against each other across 8 factors (kootas) derived from each partner\'s Moon sign and Nakshatra, for a maximum of 36 points. This tool reuses the same Nakshatra Koota (Gana/Yoni/Nadi) and Rashi (Varna/Vashya) data already computed for each individual chart, rather than recalculating it separately. A few notes on where classical texts vary or where this tool simplifies: Vashya and Yoni scoring use widely-cited group/species compatibility conventions, but exact point values for specific cross-group or cross-species pairs vary somewhat by classical author. Gana Koota classically has a slightly asymmetric groom/bride-order table in some texts; since this app does not collect partner gender, a symmetric version is used instead. Nadi Dosha (same Nadi) and Bhakoot Dosha (inauspicious Moon-sign distance) are flagged separately as "critical" regardless of the total score, matching how most classical practitioners treat them — many traditions also hold specific cancellation (Bhanga) conditions that can waive Nadi Dosha (e.g. same nakshatra but different pada) or Bhakoot Dosha (shared sign lord, already applied above), which this tool does not model exhaustively. 18+ out of 36 is the most commonly cited minimum threshold for marriage compatibility, though a score with no critical doshas present reads very differently than the same score WITH them.';
