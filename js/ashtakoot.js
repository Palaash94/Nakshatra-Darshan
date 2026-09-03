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
// Dynamic "what it means / how it manifests" text for the specific Varna pair present in these two
// charts, reusing the same per-Varna descriptions already written for the individual Birth Star card
// (RASHI_VARNA_INFO, yogas-doshas-panchang.js) instead of duplicating them.
function varnaManifestation(varnaA,varnaB,nameA,nameB){
  const infoA=RASHI_VARNA_INFO[varnaA];
  const infoB=RASHI_VARNA_INFO[varnaB];
  let manifestation;
  if(varnaA===varnaB){
    manifestation=`Both share the same ${varnaA} temperament, so this axis naturally agrees — little classical friction expected in what each of you instinctively prioritises day to day.`;
  }else{
    const scoreAwarded=VARNA_RANK[varnaA]>=VARNA_RANK[varnaB];
    if(scoreAwarded){
      manifestation=`Classically this point is scored by checking whether ${nameA}'s rank sits at or above ${nameB}'s — since ${varnaA} outranks ${varnaB} here, the point is awarded. In practice this reads as ${nameA}'s pace and priorities being the easier ones for the relationship to organise around, with ${nameB} doing more of the stretching when the two pull in different directions.`;
    }else{
      manifestation=`Classically this point is scored by checking whether ${nameA}'s rank sits at or above ${nameB}'s — since ${varnaB} outranks ${varnaA} here, the point isn't awarded under this ordering (it would be, the other way round). In practice this axis flags some values/temperament friction worth watching for: ${nameB}'s ${varnaB} priorities may naturally take precedence over ${nameA}'s ${varnaA} ones unless both consciously make room for the other's pace.`;
    }
  }
  return`Ranks each partner's Moon-sign temperament on a 4-tier spiritual/behavioural hierarchy (Brahmin > Kshatriya > Vaishya > Shudra). ${nameA} is ${varnaA} (${infoA}) ${nameB} is ${varnaB} (${infoB}) ${manifestation}`;
}

// ---------------- Vashya (max 2) ----------------
// Classical 5-group behavioural-dominance compatibility. Exact point values for specific cross-group
// pairs vary somewhat by classical source; this follows the widely-published convention (matches the
// table most Vedic compatibility calculators use). Chatushpada-Jalachara (0.5) and Chatushpada-Vanachara
// (0) were previously swapped here - fixed.
const VASHYA_SCORE_TABLE={
  'Chatushpada-Nara':1,'Chatushpada-Jalachara':0.5,'Chatushpada-Vanachara':0,'Chatushpada-Keeta':0,
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
// Reuses the same per-group descriptions already written for the individual Birth Star card
// (RASHI_VASHYA_INFO, yogas-doshas-panchang.js) instead of duplicating them.
function vashyaManifestation(groupA,groupB,nameA,nameB,score){
  const infoA=RASHI_VASHYA_INFO[groupA].desc,infoB=RASHI_VASHYA_INFO[groupB].desc;
  let manifestation;
  if(groupA===groupB){
    manifestation=`Both share the same ${groupA} group — instinctive rhythms and the sense of who naturally leads align closely, with neither partner needing to adapt to the other's pace.`;
  }else if(score===1){
    manifestation=`Different groups, but a classically complementary pairing — distinct natural instincts that tend to work well together without either side needing to dominate.`;
  }else if(score===0.5){
    manifestation=`A partial mismatch — some natural friction in pace or dominance style, workable but noticeable at times.`;
  }else{
    manifestation=`The most different pairing on this axis — ${nameA}'s and ${nameB}'s instinctive styles pull in quite different directions when it comes to who naturally leads or sets the pace, classically the relationship dynamic needing the most conscious accommodation.`;
  }
  return`Groups each partner's Moon-sign into one of five behavioural-dominance types, measuring who naturally leads the relationship's rhythm. ${nameA} is ${groupA} (${infoA}) ${nameB} is ${groupB} (${infoB}) ${manifestation}`;
}

// ---------------- Tara (max 3) ----------------
// 9-fold Tara counted from each partner's birth Nakshatra to the other's, in both directions.
const TARA_NAMES=['Janma','Sampat','Vipat','Kshema','Pratyak','Sadhaka','Vadha','Mitra','Ati-Mitra'];
const TARA_GOOD_IDX=[1,3,5,7,8]; // Sampat, Kshema, Sadhaka, Mitra, Ati-Mitra
const TARA_MEANING={
  Janma:'"birth" — ties to core identity, a largely neutral influence here',
  Sampat:'"prosperity" — auspicious, supports growth and shared resources',
  Vipat:'"danger" — inauspicious, associated with obstacles',
  Kshema:'"well-being" — auspicious, supports safety and stability',
  Pratyak:'"obstruction" — inauspicious, associated with opposition',
  Sadhaka:'"accomplishment" — auspicious, supports achieving shared goals',
  Vadha:'"destruction" — the most inauspicious Tara, associated with significant obstacles',
  Mitra:'"friend" — auspicious, natural mutual support',
  'Ati-Mitra':'"great friend" — the most auspicious Tara, strong mutual support'
};
function taraCategory(fromIdx,toIdx){
  return((toIdx-fromIdx+27)%27)%9;
}
function taraScore(nakA,nakB){
  const catAtoB=taraCategory(nakA,nakB),catBtoA=taraCategory(nakB,nakA);
  const goodAtoB=TARA_GOOD_IDX.includes(catAtoB),goodBtoA=TARA_GOOD_IDX.includes(catBtoA);
  const score=(goodAtoB&&goodBtoA)?3:(goodAtoB||goodBtoA)?1.5:0;
  return{score,nameAtoB:TARA_NAMES[catAtoB],nameBtoA:TARA_NAMES[catBtoA]};
}
function taraManifestation(tara,nameA,nameB){
  let overall;
  if(tara.score===3)overall=`Both directions land in auspicious Tara categories — a doubly-reinforced, mutual sense of support between you, favourable for shared undertakings.`;
  else if(tara.score===1.5)overall=`Only one direction lands in an auspicious Tara category — the support this axis predicts runs stronger one way than the other, rather than being fully mutual.`;
  else overall=`Neither direction lands in an auspicious Tara category — classically this axis suggests mutual understanding and support need more conscious effort here rather than coming automatically.`;
  return`Counts each partner's birth Nakshatra from the other's, in both directions, against the classical 9-fold Tara cycle. ${nameA}→${nameB} lands on ${tara.nameAtoB} (${TARA_MEANING[tara.nameAtoB]}); ${nameB}→${nameA} lands on ${tara.nameBtoA} (${TARA_MEANING[tara.nameBtoA]}). ${overall}`;
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
function yoniManifestation(yoniA,yoniB,score){
  const aA=yoniBaseAnimal(yoniA),aB=yoniBaseAnimal(yoniB);
  let manifestation;
  if(score===4)manifestation=`${aA} and ${aB} are the same Yoni animal, in opposite genders — the classical ideal on this axis, suggesting strong instinctual and physical chemistry.`;
  else if(score===3)manifestation=`${aA} and ${aB} are the same Yoni animal, but the same gender pairing — strong instinctual similarity, though classically read as slightly less complementary than an opposite-gender same-animal match.`;
  else if(score===0)manifestation=`${aA} and ${aB} are classical Yoni enemies — the most challenging pairing on this axis, suggesting fundamentally different instinctual and physical temperaments that may take real effort to reconcile.`;
  else manifestation=`${aA} and ${aB} are different, non-enemy Yoni animals — distinct instinctual styles, but without any inherent classical friction between them.`;
  return`Measures instinctual and physical compatibility via each partner's Nakshatra-linked animal symbol. ${manifestation}`;
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
function grahaMaitriManifestation(lordA,lordB,score){
  if(lordA===lordB)return`Both Moon signs are ruled by the same planet (${lordA}) — the strongest possible reading on this axis, suggesting deeply aligned mental and temperamental rapport.`;
  if(score===5)return`${lordA} and ${lordB} are mutual natural friends — an easy, supportive intellectual and temperamental rapport between you.`;
  if(score===4)return`${lordA} and ${lordB} are friendly (with a mild asymmetry between the two directions) — mostly easy rapport, with only minor friction.`;
  if(score===3)return`${lordA} and ${lordB} are mutually neutral — workable, without a strong natural pull or friction either way.`;
  if(score===1)return`${lordA} and ${lordB} have an uneven relationship (friend on one side, enemy on the other) — genuine support from one direction, alongside real tension in how the other naturally understands it.`;
  if(score===0.5)return`${lordA} and ${lordB} lean toward tension (enemy/neutral) — limited natural rapport between the sign-lords, worth being deliberate about communication styles.`;
  return`${lordA} and ${lordB} are mutual natural enemies — classically the most challenging Graha Maitri pairing, suggesting real friction in how each of you processes and communicates by default.`;
}

// ---------------- Gana (max 6) ----------------
// Symmetric version of the classical Gana Koota table. Some classical texts give a slightly
// asymmetric groom/bride-order table (e.g. Deva-groom+Manushya-bride scoring differently than the
// reverse); since this app doesn't collect partner gender, this tool uses the symmetric convention.
const GANA_SCORE_TABLE={'Deva-Deva':6,'Manushya-Manushya':6,'Rakshasa-Rakshasa':6,'Deva-Manushya':6,'Deva-Rakshasa':0,'Manushya-Rakshasa':0};
function ganaScore(g1,g2){
  return GANA_SCORE_TABLE[[g1,g2].sort().join('-')];
}
const GANA_TRAIT={
  Deva:'gentle, refined, and idealistic — drawn to harmony and higher ideals',
  Manushya:'balanced and practical — drawn to steady, grounded ambition',
  Rakshasa:'intense and strong-willed — drawn to competition and decisive action'
};
function ganaManifestation(ganaA,ganaB,nameA,nameB){
  if(ganaA===ganaB){
    if(ganaA==='Rakshasa')return`Both share the intense, driven Rakshasa Gana — this reads as shared fire rather than opposition: high passion and mutual respect for each other's strong will, though both may need to consciously avoid power struggles since neither instinctively backs down.`;
    if(ganaA==='Deva')return`Both share the gentle, idealistic Deva Gana — an easy emotional harmony, though the pairing can be conflict-avoidant since neither partner naturally pushes back.`;
    return`Both share the balanced, practical Manushya Gana — a grounded, cooperative match that organises life together with relatively little emotional friction.`;
  }
  if((ganaA==='Deva'&&ganaB==='Manushya')||(ganaA==='Manushya'&&ganaB==='Deva'))return`${nameA}'s ${ganaA} nature and ${nameB}'s ${ganaB} nature are classically read as complementary — gentle idealism paired with grounded practicality tends to balance rather than clash.`;
  const rakshaName=ganaA==='Rakshasa'?nameA:nameB,otherName=ganaA==='Rakshasa'?nameB:nameA,otherGana=ganaA==='Rakshasa'?ganaB:ganaA;
  return`${rakshaName}'s fierce, intense Rakshasa nature and ${otherName}'s gentler ${otherGana} nature run at very different emotional speeds — classically the most challenging Gana pairing, where ${rakshaName}'s intensity can feel overwhelming or destabilising to ${otherName}'s steadier temperament unless both sides make a deliberate effort to meet in the middle.`;
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
function bhakootManifestation(signA,signB,score){
  if(score===7){
    if(signA===signB)return`Both partners share the same Moon sign (${SIGNS[signA]}) — emotional rhythms are about as closely aligned as this axis can measure, with day-to-day moods and needs naturally in sync.`;
    const dist=((signB-signA+12)%12)+1;
    if([2,12,5,9,6,8].includes(dist))return`The Moon signs (${SIGNS[signA]} and ${SIGNS[signB]}) fall at a distance that would normally be flagged, but since both signs share the same ruling planet (${SIGN_LORD[signA]}), classical texts waive the dosha here — the friction this distance usually predicts is considered neutralised.`;
    return`The Moon signs (${SIGNS[signA]} and ${SIGNS[signB]}) sit at a classically favourable distance — emotional and domestic rhythms are read as naturally compatible without needing any special cancellation.`;
  }
  const dist=((signB-signA+12)%12)+1;
  let severity;
  if(dist===6||dist===8)severity=`the most serious of the three classical Bhakoot distances — traditionally linked to friction around health, longevity, or a sense of working against rather than with each other at a deep level`;
  else if(dist===2||dist===12)severity=`traditionally linked to friction around household finances and family harmony`;
  else severity=`traditionally linked to friction around children or differing outlooks on life's purpose — generally considered the mildest of the three classical Bhakoot distances`;
  return`The Moon signs (${SIGNS[signA]} and ${SIGNS[signB]}) fall at a classically inauspicious distance — ${severity}.`;
}

// ---------------- Nadi (max 8) ----------------
function nadiScore(n1,n2){return n1===n2?0:8}
function nadiManifestation(nadiA,nadiB,score){
  if(score===0)return`Both partners share the same Nadi (${nadiA} — ${NAK_NADI_INFO[nadiA].desc}) — classically the single most heavily weighted concern in Ashtakoot, traditionally linked to the couple's future health and progeny. Some traditions hold this can be waived under specific exceptions (e.g. same Nadi but different Nakshatra or pada), which this tool does not check exhaustively.`;
  return`Nadi differs — ${nadiA} (${NAK_NADI_INFO[nadiA].desc}) vs ${nadiB} (${NAK_NADI_INFO[nadiB].desc}) — the full 8 points are awarded; each partner draws on a different constitutional rhythm, classically read as complementary rather than competing.`;
}

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
    {name:'Varna',max:1,score:varnaPts,desc:varnaManifestation(vA.varna,vB.varna,nameA,nameB)},
    {name:'Vashya',max:2,score:vashyaPts,desc:vashyaManifestation(vA.vashya,vB.vashya,nameA,nameB,vashyaPts)},
    {name:'Tara',max:3,score:tara.score,desc:taraManifestation(tara,nameA,nameB)},
    {name:'Yoni',max:4,score:yoniPts,desc:yoniManifestation(mA.yoni,mB.yoni,yoniPts)},
    {name:'Graha Maitri',max:5,score:grahaMaitriPts,desc:`Measures friendship between the two Moon-sign lords. ${grahaMaitriManifestation(lordA,lordB,grahaMaitriPts)}`,planetsA:[lordA],planetsB:[lordB]},
    {name:'Gana',max:6,score:ganaPts,desc:`Measures each partner's Nakshatra-based temperament class (Deva/Manushya/Rakshasa). ${nameA}: ${mA.gana}, ${nameB}: ${mB.gana}. ${ganaManifestation(mA.gana,mB.gana,nameA,nameB)}`},
    {name:'Bhakoot',max:7,score:bhakootPts,desc:`Checks the sign-distance between the two Moon signs for the classical 2/12, 5/9, and 6/8 inauspicious distances. ${bhakootManifestation(moonSignA,moonSignB,bhakootPts)}`,signsA:[moonSignA],signsB:[moonSignB]},
    {name:'Nadi',max:8,score:nadiPts,desc:nadiManifestation(mA.nadi,mB.nadi,nadiPts)}
  ];
  const total=kootas.reduce((s,k)=>s+k.score,0);
  const maxTotal=36;
  const verdict=total>=32?'Excellent':total>=24?'Good':total>=18?'Marginal':'Not recommended';

  const criticalDoshas=[];
  if(nadiPts===0)criticalDoshas.push({name:'Nadi Dosha',desc:'Both partners share the same Nadi. Classically considered a significant concern (traditionally linked to the couple\'s future health/progeny) and examined closely regardless of the total score.'});
  if(bhakootPts===0)criticalDoshas.push({name:'Bhakoot Dosha',desc:'Moon signs fall at a classically inauspicious distance from one another, traditionally linked to friction around finances or family harmony.'});

  return{kootas,total,maxTotal,verdict,criticalDoshas};
}

// Joins a list naturally ("a", "a and b", "a, b, and c") instead of a raw comma-join.
function naturalJoin(items){
  if(items.length===0)return'';
  if(items.length===1)return items[0];
  if(items.length===2)return items[0]+' and '+items[1];
  return items.slice(0,-1).join(', ')+', and '+items[items.length-1];
}

// Plain-language synthesis of the koota-by-koota table into one readable paragraph - the raw score
// and per-koota grid tell you *what*, this tells you *so what*.
function ashtakootSummary(result,nameA,nameB){
  const strong=result.kootas.filter(k=>k.score/k.max>=0.7).map(k=>k.name);
  const weak=result.kootas.filter(k=>k.score/k.max<0.35).map(k=>k.name);
  const pct=Math.round(result.total/result.maxTotal*100);
  const verdictText={
    Excellent:'an excellent classical match',
    Good:'a good, workable classical match',
    Marginal:'a marginal match worth reviewing carefully with a knowledgeable astrologer',
    'Not recommended':'a classically challenging match'
  }[result.verdict];
  let text=`${nameA} and ${nameB} score ${result.total} out of ${result.maxTotal} (${pct}%), which classical Ashtakoot Guna Milan treats as ${verdictText}.`;
  if(strong.length)text+=` The strongest alignment shows up in ${naturalJoin(strong)}.`;
  if(weak.length)text+=` The areas most worth a closer look are ${naturalJoin(weak)}.`;
  if(result.criticalDoshas.length)text+=` ${naturalJoin(result.criticalDoshas.map(d=>d.name))} ${result.criticalDoshas.length>1?'are':'is'} also present here, which most traditions weigh independently of the raw score rather than letting a high total override them.`;
  return text;
}

const ASHTAKOOT_METHODOLOGY='Ashtakoot ("eight-fold") Guna Milan is the most widely used classical Vedic marriage-compatibility system, scoring two birth charts against each other across 8 factors (kootas) derived from each partner\'s Moon sign and Nakshatra, for a maximum of 36 points. This tool reuses the same Nakshatra Koota (Gana/Yoni/Nadi) and Rashi (Varna/Vashya) data already computed for each individual chart, rather than recalculating it separately. A few notes on where classical texts vary or where this tool simplifies: Vashya and Yoni scoring use widely-cited group/species compatibility conventions, but exact point values for specific cross-group or cross-species pairs vary somewhat by classical author. Gana Koota classically has a slightly asymmetric groom/bride-order table in some texts; since this app does not collect partner gender, a symmetric version is used instead. Nadi Dosha (same Nadi) and Bhakoot Dosha (inauspicious Moon-sign distance) are flagged separately as "critical" regardless of the total score, matching how most classical practitioners treat them — many traditions also hold specific cancellation (Bhanga) conditions that can waive Nadi Dosha (e.g. same nakshatra but different pada) or Bhakoot Dosha (shared sign lord, already applied above), which this tool does not model exhaustively. 18+ out of 36 is the most commonly cited minimum threshold for marriage compatibility, though a score with no critical doshas present reads very differently than the same score WITH them.';
