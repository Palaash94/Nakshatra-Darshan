/* ============================================================
   COMPATIBILITY - BEYOND ASHTAKOOT (COUPLE MODE)
   Five additional classical/synastry-style checks layered on top
   of the core Ashtakoot Guna Milan score in ashtakoot.js: mutual
   Mangal Dosha, 7th-house (marriage house) strength per partner,
   a simplified Venus-Mars cross-chart read, a Navamsa (D9) Moon
   comparison, and current-Mahadasha timing compatibility. Pure
   calculation - no DOM. Rendered by renderCompatibilityTab() in
   render-tabs.js.
   ============================================================ */

// ---------------- Mutual Mangal Dosha ----------------
function calcMutualMangalDosha(chartDataA,chartDataB){
  const nameA=chartDataA.name||'Partner A',nameB=chartDataB.name||'Partner B';
  const doshaA=detectMangalDosha(chartDataA.planetData,chartDataA.lagnaSign);
  const doshaB=detectMangalDosha(chartDataB.planetData,chartDataB.lagnaSign);
  let status,note;
  if(doshaA&&doshaB){
    status='both';
    note=`Both ${nameA} and ${nameB} carry Mangal Dosha. Most classical traditions hold this actually works in the couple's favour: the affliction is primarily a concern when only one partner carries it, and is widely considered to cancel itself out when both do.`;
  }else if(doshaA||doshaB){
    status='oneOnly';
    const who=doshaA?nameA:nameB;
    note=`Only ${who} carries Mangal Dosha. Classical texts treat this asymmetry as the condition most worth examining closely — check the specific cancellation factors noted below before drawing conclusions, since many classical exceptions can waive it entirely.`;
  }else{
    status='neither';
    note=`Neither ${nameA} nor ${nameB} carries classical Mangal Dosha from Ascendant, Moon, or Venus.`;
  }
  return{doshaA,doshaB,status,note,nameA,nameB};
}

// ---------------- 7th House (marriage house) strength, per partner ----------------
function seventhHouseStrength(planetData,lagnaSign,houseMap){
  const sign7=(lagnaSign+6)%12;
  const lord7=houseLordOf(7,lagnaSign);
  const lordData=planetData[lord7];
  const lordDig=getDignity(lord7,lordData.sign,lordData.deg);
  const lordHouse=lordData.house;
  const occupants=houseMap[7]||[];
  const beneficOccupants=occupants.filter(isBenefic);
  const maleficOccupants=occupants.filter(p=>!isBenefic(p));
  let score=55;
  if(lordDig==='exalted'||lordDig==='own')score+=20;
  else if(lordDig==='debilitated')score-=20;
  if([1,4,5,7,9,10].includes(lordHouse))score+=10;
  if([6,8,12].includes(lordHouse))score-=15;
  score+=beneficOccupants.length*8;
  score-=maleficOccupants.length*6;
  score=Math.max(10,Math.min(90,score));
  return{sign7,lord7,lordDig,lordHouse,occupants,beneficOccupants,maleficOccupants,score};
}
function calc7thHouseCompat(chartDataA,chartDataB){
  const a=seventhHouseStrength(chartDataA.planetData,chartDataA.lagnaSign,chartDataA.houseMap);
  const b=seventhHouseStrength(chartDataB.planetData,chartDataB.lagnaSign,chartDataB.houseMap);
  return{a,b};
}

// ---------------- Venus-Mars cross-chart read (simplified sign-distance synastry) ----------------
// Not a classical Vedic technique on its own (graha drishti is house-based, not directly comparable
// across two independent charts) - a disclosed simplification using the same sign-distance logic
// Bhakoot Koota already uses elsewhere in this app, applied here to attraction/drive instead of Moon.
const SYNASTRY_DIST_READ={
  1:{label:'Conjunction',desc:'An intense, magnetic pull — attraction and drive fused together in the same sign.'},
  7:{label:'Opposition',desc:'Strong polarity — a magnetic draw built on difference, capable of running hot and cold.'},
  5:{label:'Trine',desc:'Easy, natural chemistry — romantic and physical instincts align smoothly.'},
  9:{label:'Trine',desc:'Easy, natural chemistry — romantic and physical instincts align smoothly.'},
  4:{label:'Square',desc:'A charged, dynamic pull — exciting, but with real friction potential.'},
  10:{label:'Square',desc:'A charged, dynamic pull — exciting, but with real friction potential.'}
};
function synastryPairRead(signFrom,signTo){
  const dist=((signTo-signFrom+12)%12)+1;
  return SYNASTRY_DIST_READ[dist]||{label:'Background',desc:'A quieter influence — not a dominant factor for attraction either way.'};
}
function calcVenusMarsSynastry(chartDataA,chartDataB){
  const venusA=chartDataA.planetData.Venus.sign,marsA=chartDataA.planetData.Mars.sign;
  const venusB=chartDataB.planetData.Venus.sign,marsB=chartDataB.planetData.Mars.sign;
  return{
    aVenusToBMars:{...synastryPairRead(venusA,marsB),signA:venusA,signB:marsB},
    bVenusToAMars:{...synastryPairRead(venusB,marsA),signA:venusB,signB:marsA}
  };
}

// ---------------- Navamsa (D9) Moon comparison ----------------
function calcNavamsaCompat(chartDataA,chartDataB){
  const navMoonA=chartDataA.navamsa.navPlanetSign.Moon,navMoonB=chartDataB.navamsa.navPlanetSign.Moon;
  const navAscA=chartDataA.navamsa.navAscSign,navAscB=chartDataB.navamsa.navAscSign;
  const sameSign=navMoonA===navMoonB;
  const dist=((navMoonB-navMoonA+12)%12)+1;
  const inauspiciousDist=[2,12,5,9,6,8].includes(dist);
  const sameLord=SIGN_LORD[navMoonA]===SIGN_LORD[navMoonB];
  const favourable=sameSign||!inauspiciousDist||sameLord;
  return{navMoonA,navMoonB,navAscA,navAscB,favourable};
}

// ---------------- Current Mahadasha timing compatibility ----------------
function calcDashaTimingCompat(chartDataA,chartDataB){
  const now=new Date();
  const mahaA=(chartDataA.dashas||[]).find(d=>now>=d.start&&now<d.end);
  const mahaB=(chartDataB.dashas||[]).find(d=>now>=d.start&&now<d.end);
  if(!mahaA||!mahaB)return null;
  const lordA=DASHA_LORD_FULLNAME[mahaA.lord],lordB=DASHA_LORD_FULLNAME[mahaB.lord];
  const sameLord=lordA===lordB;
  const score=sameLord?5:grahaMaitriScore(lordA,lordB);
  return{lordA,lordB,sameLord,score};
}

// ---------------- Cross-chart "relationship yogas" (the positive counterpart to Mangal Dosha) ----------------
// Three defensible, disclosed adaptations of classical single-chart concepts to a pair of charts:
// mutual Moon-sign-lord exchange (Parivartana, normally checked within one chart, applied here across
// two), a shared Atmakaraka (Jaimini's "soul planet" - a synastry idea some Jaimini practitioners already
// use informally), and friendship between the two birth-Nakshatra dispositors (a different lord system
// than Graha Maitri's Moon-SIGN lords, so it's genuinely additional signal rather than a duplicate).
function calcCompatibilityYogas(chartDataA,chartDataB){
  const nameA=chartDataA.name||'Partner A',nameB=chartDataB.name||'Partner B';
  const yogas=[];

  const moonSignA=chartDataA.planetData.Moon.sign,moonSignB=chartDataB.planetData.Moon.sign;
  const lordA=SIGN_LORD[moonSignA],lordB=SIGN_LORD[moonSignB];
  const lordASignInOwnChart=chartDataA.planetData[lordA].sign;
  const lordBSignInOwnChart=chartDataB.planetData[lordB].sign;
  if(lordASignInOwnChart===moonSignB&&lordBSignInOwnChart===moonSignA){
    yogas.push({
      name:'Rashi Parivartana Yoga (Moon-Sign Exchange)',
      formation:`${nameA}'s Moon-sign lord (${lordA}) sits in ${nameB}'s Moon sign, and ${nameB}'s Moon-sign lord (${lordB}) sits in ${nameA}'s Moon sign — a mutual exchange between the two charts, adapting the classical single-chart Parivartana (sign-exchange) concept across the pair.`,
      signifies:'A mutual-reception bond between the two charts\' emotional foundations — classically, exchange yogas are read as each side actively supporting the other rather than one being dominant.',
      planetsInvolved:[lordA,lordB]
    });
  }

  const akA=calcCharaKarakas(chartDataA.planetData)[0].planet;
  const akB=calcCharaKarakas(chartDataB.planetData)[0].planet;
  if(akA===akB){
    yogas.push({
      name:'Shared Atmakaraka Yoga',
      formation:`Both ${nameA} and ${nameB} carry ${akA} as their Atmakaraka (the planet at the highest degree among the seven classical grahas) — the same "soul significator" in Jaimini astrology.`,
      signifies:'Some Jaimini traditions read a shared Atmakaraka between two people as a soul-level resonance — a shared core drive or life theme running through both charts, distinct from the Rashi/Nakshatra-based Ashtakoot factors above.',
      planetsInvolved:[akA]
    });
  }

  const nakLordA=DASHA_LORD_FULLNAME[chartDataA.planetData.Moon.nakshatra.lord];
  const nakLordB=DASHA_LORD_FULLNAME[chartDataB.planetData.Moon.nakshatra.lord];
  if(nakLordA===nakLordB){
    yogas.push({
      name:'Shared Nakshatra Lord Yoga',
      formation:`${nameA}'s birth Nakshatra (${chartDataA.planetData.Moon.nakshatra.name}) and ${nameB}'s birth Nakshatra (${chartDataB.planetData.Moon.nakshatra.name}) are both ruled by ${nakLordA}.`,
      signifies:'The birth-star dispositor is a different lordship system from the Moon-sign lord already checked in Graha Maitri above — sharing it suggests the two charts\' Vimshottari Dasha rhythms and underlying instincts are drawing from the same planetary source.',
      planetsInvolved:[nakLordA]
    });
  }else{
    const relAtoB=naturalRelation(nakLordA,nakLordB),relBtoA=naturalRelation(nakLordB,nakLordA);
    if(relAtoB==='friend'&&relBtoA==='friend'){
      yogas.push({
        name:'Nakshatra Lord Friendship Yoga',
        formation:`${nameA}'s birth-Nakshatra lord (${nakLordA}) and ${nameB}'s birth-Nakshatra lord (${nakLordB}) are mutual natural friends.`,
        signifies:'A supportive undertone between the two charts\' instinctual/emotional dispositors — a milder version of the Shared Nakshatra Lord Yoga above.',
        planetsInvolved:[nakLordA,nakLordB]
      });
    }
  }

  return yogas;
}

// ---------------- "Together" updates (couple daily/monthly/yearly) ----------------
// A composite relationship blurb, not two individual horoscopes stapled together - if both partners'
// underlying signal lands on the same life-area theme that day/month/year, the reading leans into that
// shared current; if they diverge, the reading names both and frames it as two currents to reconcile,
// rather than picking a "winner." Reuses the same house-theme signals as the individual updates
// (updates.js) so the two features stay conceptually consistent.
const COUPLE_SAME_THEME_TEXT={
  Health:'you\'re both tuned into the same frequency today: your bodies and routines. Compare notes rather than competing over who\'s more tired or more on top of things.',
  Money:'you\'re both circling the same subject: money and resources. A shared conversation lands better right now than two separate, private ones.',
  Career:'you\'re both in a driven, self-directed headspace. Give each other room to focus rather than reading the distance as disconnection.',
  Family:'home and family are pulling at both of you right now. Let yourselves actually be together instead of just occupying the same space.',
  Relationship:'the spotlight is on the two of you specifically. Whatever you\'ve been meaning to say to each other, this is a good window for it.',
  Travel:'you\'re both craving distance or a change of scenery. If you can get away together even briefly, take it.'
};
const COUPLE_DIFFERENT_THEME_TEXT='different currents are pulling at each of you right now — one of you is more caught up in {themeA}, the other in {themeB}. Neither is wrong; naming the difference out loud beats assuming the other one should already know.';
const COUPLE_SAME_ACTION={
  Health:'Check in on how you\'re each actually doing, not just how you look.',
  Money:'Have the shared-money conversation together, not around each other.',
  Career:'Ask what support (not company) they need right now.',
  Family:'Do one small domestic thing together, unplanned.',
  Relationship:'Say the thing you\'ve been rehearsing.',
  Travel:'Pick a date for the trip, even a short one.'
};
const COUPLE_DIFFERENT_ACTION='Trade one sentence each on what\'s actually on your mind today.';

function coupleThemeUpdate(themeA,themeB){
  if(themeA===themeB)return{text:COUPLE_SAME_THEME_TEXT[themeA],action:COUPLE_SAME_ACTION[themeA],theme:themeA};
  return{text:COUPLE_DIFFERENT_THEME_TEXT.replace('{themeA}',themeA).replace('{themeB}',themeB),action:COUPLE_DIFFERENT_ACTION,theme:null};
}

function calcCoupleDailyUpdate(chartDataA,chartDataB,refDate){
  refDate=refDate||new Date();
  const a=calcDailyUpdate(chartDataA,refDate),b=calcDailyUpdate(chartDataB,refDate);
  const u=coupleThemeUpdate(a.theme,b.theme);
  return{...u,text:`Today, ${u.text}`,themeA:a.theme,themeB:b.theme};
}
function calcCoupleMonthlyUpdate(chartDataA,chartDataB,refDate){
  refDate=refDate||new Date();
  const a=calcMonthlyUpdate(chartDataA,refDate),b=calcMonthlyUpdate(chartDataB,refDate);
  const u=coupleThemeUpdate(a.theme,b.theme);
  return{...u,text:`This month, ${u.text}`,themeA:a.theme,themeB:b.theme};
}
function calcCoupleYearlyUpdate(chartDataA,chartDataB,refDate){
  refDate=refDate||new Date();
  const a=calcYearlyUpdate(chartDataA,refDate),b=calcYearlyUpdate(chartDataB,refDate);
  if(!a||!b)return null;
  const u=coupleThemeUpdate(a.theme,b.theme);
  return{...u,text:`This year, ${u.text}`,themeA:a.theme,themeB:b.theme};
}
