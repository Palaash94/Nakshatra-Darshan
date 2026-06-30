/* ============================================================
   DIVISIONAL (VARGA) CHARTS — SHODASAVARGA ENGINE
   Calculates all 16 classical divisional charts (D1 Rashi through
   D60 Shashtiamsa) from a planet's sidereal longitude. Each chart
   is built from a verified classical sign-assignment rule (sourced
   against BPHS-citing references; ambiguous/disputed rules are
   flagged in their own comments below) and shares the same generic
   "build chart from per-planet sign" pipeline as calcNavamsaChart,
   so every Varga can be drawn and clicked through using the same
   generic chart-wheel renderer.
   ============================================================ */

const MOVABLE_SIGNS=[0,3,6,9],FIXED_SIGNS=[1,4,7,10],DUAL_SIGNS=[2,5,8,11];
const ODD_SIGNS=[0,2,4,6,8,10],EVEN_SIGNS=[1,3,5,7,9,11];
const FIRE_SIGNS=[0,4,8],EARTH_SIGNS=[1,5,9],AIR_SIGNS=[2,6,10],WATER_SIGNS=[3,7,11];

function signElementGroup(signIdx){
  if(FIRE_SIGNS.includes(signIdx))return'fire';
  if(EARTH_SIGNS.includes(signIdx))return'earth';
  if(AIR_SIGNS.includes(signIdx))return'air';
  return'water';
}

// ---------------- D2: HORA (wealth) ----------------
// Standard "Cancer-Leo" Hora (the default convention used by most software incl. Jagannath Hora):
// odd signs - first half (0-15deg) -> Leo (Sun's Hora), second half (15-30deg) -> Cancer (Moon's Hora);
// even signs - reversed (first half -> Cancer, second half -> Leo).
function getHoraSign(siderealLon){
  const signIdx=Math.floor(siderealLon/30);
  const degInSign=siderealLon%30;
  const firstHalf=degInSign<15;
  const isOdd=ODD_SIGNS.includes(signIdx);
  if(isOdd)return firstHalf?4:3; // Leo=4, Cancer=3
  return firstHalf?3:4;
}

// ---------------- D3: DREKKANA (siblings) ----------------
// 1st decanate (0-10deg) -> same sign; 2nd (10-20deg) -> 5th sign from it; 3rd (20-30deg) -> 9th sign from it.
function getDrekkanaSign(siderealLon){
  const signIdx=Math.floor(siderealLon/30);
  const degInSign=siderealLon%30;
  const part=Math.floor(degInSign/10); // 0,1,2
  const offset=part===0?0:part===1?4:8; // 5th sign = +4, 9th sign = +8 (0-indexed offsets)
  return(signIdx+offset)%12;
}

// ---------------- D4: CHATURTHAMSA (property) ----------------
// Each quarter (0-7.5, 7.5-15, 15-22.5, 22.5-30deg) maps to the sign itself, then the 4th, 7th, 10th sign from it
// (i.e. the angular/Kendra houses from the occupied sign) - per BPHS 6.9, lords of the 4 angles from a sign.
function getChaturthamsaSign(siderealLon){
  const signIdx=Math.floor(siderealLon/30);
  const degInSign=siderealLon%30;
  const part=Math.floor(degInSign/7.5); // 0,1,2,3
  const offset=[0,3,6,9][part];
  return(signIdx+offset)%12;
}

// ---------------- D7: SAPTAMSA (children) ----------------
// Odd signs: 7 divisions counted starting from the sign itself. Even signs: starting from the 7th sign from it.
function getSaptamsaSign(siderealLon){
  const signIdx=Math.floor(siderealLon/30);
  const degInSign=siderealLon%30;
  const part=Math.floor(degInSign/(30/7)); // 0-6
  const isOdd=ODD_SIGNS.includes(signIdx);
  const start=isOdd?signIdx:(signIdx+6)%12;
  return(start+part)%12;
}

// ---------------- D9: NAVAMSA (marriage, already used elsewhere as getNavamsaSign) ----------------
// (defined in shadbala-dashas.js as getNavamsaSign - reused here for consistency, not redefined)

// ---------------- D10: DASAMSA (career) ----------------
// Odd signs: 10 divisions starting from the sign itself. Even signs: starting from the 9th sign from it.
function getDasamsaSign(siderealLon){
  const signIdx=Math.floor(siderealLon/30);
  const degInSign=siderealLon%30;
  const part=Math.floor(degInSign/3); // 0-9
  const isOdd=ODD_SIGNS.includes(signIdx);
  const start=isOdd?signIdx:(signIdx+8)%12;
  return(start+part)%12;
}

// ---------------- D12: DWADASAMSA (parents) ----------------
// All signs: 12 divisions counted starting from the sign itself, sequentially (no odd/even distinction).
function getDwadasamsaSign(siderealLon){
  const signIdx=Math.floor(siderealLon/30);
  const degInSign=siderealLon%30;
  const part=Math.floor(degInSign/2.5); // 0-11
  return(signIdx+part)%12;
}

// ---------------- D16: SHODASAMSA (vehicles, comforts) ----------------
// Movable signs start from Aries, fixed from Leo, dual from Sagittarius (same triad as D9).
function getShodasamsaSign(siderealLon){
  const signIdx=Math.floor(siderealLon/30);
  const degInSign=siderealLon%30;
  const part=Math.floor(degInSign/(30/16)); // 0-15
  let start;
  if(MOVABLE_SIGNS.includes(signIdx))start=0;
  else if(FIXED_SIGNS.includes(signIdx))start=4;
  else start=8;
  return(start+part)%12;
}

// ---------------- D20: VIMSAMSA (spiritual progress) ----------------
// Movable signs start from Aries, fixed from Sagittarius, dual from Leo (different triad order than D9/D16).
function getVimsamsaSign(siderealLon){
  const signIdx=Math.floor(siderealLon/30);
  const degInSign=siderealLon%30;
  const part=Math.floor(degInSign/1.5); // 0-19
  let start;
  if(MOVABLE_SIGNS.includes(signIdx))start=0;
  else if(FIXED_SIGNS.includes(signIdx))start=8;
  else start=4;
  return(start+part)%12;
}

// ---------------- D24: CHATURVIMSAMSA (education) ----------------
// Odd signs start from Leo, even signs start from Cancer.
function getChaturvimsamsaSign(siderealLon){
  const signIdx=Math.floor(siderealLon/30);
  const degInSign=siderealLon%30;
  const part=Math.floor(degInSign/1.25); // 0-23
  const isOdd=ODD_SIGNS.includes(signIdx);
  const start=isOdd?4:3; // Leo=4, Cancer=3
  return(start+part)%12;
}

// ---------------- D27: SAPTAVIMSAMSA / BHAMSA (strengths & weaknesses) ----------------
// Elemental starting points: Fire->Aries, Earth->Cancer, Air->Libra, Water->Capricorn (mainstream software
// convention). Note: a documented textual ambiguity exists in how BPHS's verse is read here - some
// commentators instead read Fire->Aries, Air->Libra, Water->Capricorn, Earth->Cancer (same as this) while
// a minority reading swaps Earth/Water's starting points; this tool follows the convention used by the
// overwhelming majority of modern Jyotish software.
function getBhamsaSign(siderealLon){
  const signIdx=Math.floor(siderealLon/30);
  const degInSign=siderealLon%30;
  const part=Math.floor(degInSign/(30/27)); // 0-26
  const elem=signElementGroup(signIdx);
  const start=elem==='fire'?0:elem==='earth'?3:elem==='air'?6:9; // Aries,Cancer,Libra,Capricorn
  return(start+part)%12;
}

// ---------------- D30: TRIMSAMSA (misfortunes, evils) ----------------
// Unequal divisions ruled by the 5 non-luminous planets. Odd signs: Mars(0-5 deg, ->Aries), Saturn(5-10,
// ->Aquarius), Jupiter(10-18,->Sagittarius), Mercury(18-25,->Gemini), Venus(25-30,->Libra). Even signs
// reverse the order and each maps to that planet's OTHER sign: Venus(0-5,->Taurus), Mercury(5-12,->Virgo),
// Jupiter(12-20,->Pisces), Saturn(20-25,->Capricorn), Mars(25-30,->Scorpio).
function getTrimsamsaSign(siderealLon){
  const signIdx=Math.floor(siderealLon/30);
  const degInSign=siderealLon%30;
  const isOdd=ODD_SIGNS.includes(signIdx);
  if(isOdd){
    if(degInSign<5)return 0; // Aries (Mars)
    if(degInSign<10)return 10; // Aquarius (Saturn)
    if(degInSign<18)return 8; // Sagittarius (Jupiter)
    if(degInSign<25)return 2; // Gemini (Mercury)
    return 6; // Libra (Venus)
  }else{
    if(degInSign<5)return 1; // Taurus (Venus)
    if(degInSign<12)return 5; // Virgo (Mercury)
    if(degInSign<20)return 11; // Pisces (Jupiter)
    if(degInSign<25)return 9; // Capricorn (Saturn)
    return 7; // Scorpio (Mars)
  }
}

// ---------------- D40: KHAVEDAMSA (maternal karma) ----------------
// Odd signs start from Aries, even signs start from Libra.
function getKhavedamsaSign(siderealLon){
  const signIdx=Math.floor(siderealLon/30);
  const degInSign=siderealLon%30;
  const part=Math.floor(degInSign/0.75); // 0-39
  const isOdd=ODD_SIGNS.includes(signIdx);
  const start=isOdd?0:6; // Aries or Libra
  return(start+part)%12;
}

// ---------------- D45: AKSHAVEDAMSA (paternal karma) ----------------
// Movable signs start from Aries, fixed from Leo, dual from Sagittarius (same triad as D16).
function getAkshavedamsaSign(siderealLon){
  const signIdx=Math.floor(siderealLon/30);
  const degInSign=siderealLon%30;
  const part=Math.floor(degInSign/(2/3)); // 0-44 (each part = 40 arcmin = 2/3 deg)
  let start;
  if(MOVABLE_SIGNS.includes(signIdx))start=0;
  else if(FIXED_SIGNS.includes(signIdx))start=4;
  else start=8;
  return(start+part)%12;
}

// ---------------- D60: SHASHTIAMSA (past-life karma, the final tie-breaker) ----------------
// Per BPHS's own text ("tadraaseh" = "from THAT sign"), the 60 divisions count starting from the
// planet's own occupied sign - NOT always from Aries (a common implementation error). Verified against
// a worked classical example (Asc 17deg41' Capricorn -> Sagittarius; Moon 20deg36' Sagittarius -> Taurus):
// take degrees-in-sign x2 (60 divisions of 0.5deg = 2 per degree), floor it, mod 12 for the remainder,
// then count that many signs forward from the occupied sign itself (the occupied sign = the 1st count).
function getShashtiamsaSign(siderealLon){
  const signIdx=Math.floor(siderealLon/30);
  const degInSign=siderealLon%30;
  const remainder=Math.floor(degInSign*2)%12;
  return(signIdx+remainder)%12;
}

// ---------------- Registry of all divisional charts (excluding D1 and D9, which already exist) ----------------
const DIVISIONAL_CHARTS=[
  {key:'D2',name:'Hora',title:'D2 — Hora',signifies:'Wealth, money management, and accumulated resources.',fn:getHoraSign},
  {key:'D3',name:'Drekkana',title:'D3 — Drekkana',signifies:'Siblings, courage, communication, and short journeys.',fn:getDrekkanaSign},
  {key:'D4',name:'Chaturthamsa',title:'D4 — Chaturthamsa',signifies:'Property, fixed assets, vehicles, and general fortune.',fn:getChaturthamsaSign},
  {key:'D7',name:'Saptamsa',title:'D7 — Saptamsa',signifies:'Children, progeny, and creative legacy.',fn:getSaptamsaSign},
  {key:'D10',name:'Dasamsa',title:'D10 — Dasamsa',signifies:'Career, profession, public standing, and authority.',fn:getDasamsaSign},
  {key:'D12',name:'Dwadasamsa',title:'D12 — Dwadasamsa',signifies:'Parents, ancestry, and inherited family patterns.',fn:getDwadasamsaSign},
  {key:'D16',name:'Shodasamsa',title:'D16 — Shodasamsa',signifies:'Vehicles, comforts, and material luxuries.',fn:getShodasamsaSign},
  {key:'D20',name:'Vimsamsa',title:'D20 — Vimsamsa',signifies:'Spiritual practice, devotion, and inner development.',fn:getVimsamsaSign},
  {key:'D24',name:'Chaturvimsamsa',title:'D24 — Chaturvimsamsa',signifies:'Education, learning, and academic accomplishment.',fn:getChaturvimsamsaSign},
  {key:'D27',name:'Bhamsa',title:'D27 — Bhamsa (Nakshatramsa)',signifies:'Inherent strengths, hidden weaknesses, and resilience.',fn:getBhamsaSign},
  {key:'D30',name:'Trimsamsa',title:'D30 — Trimsamsa',signifies:'Misfortunes, vulnerabilities, and hidden difficulties.',fn:getTrimsamsaSign},
  {key:'D40',name:'Khavedamsa',title:'D40 — Khavedamsa',signifies:'Auspicious/inauspicious effects inherited through the mother\'s lineage.',fn:getKhavedamsaSign},
  {key:'D45',name:'Akshavedamsa',title:'D45 — Akshavedamsa',signifies:'Character, general well-being, and effects inherited through the father\'s lineage.',fn:getAkshavedamsaSign},
  {key:'D60',name:'Shashtiamsa',title:'D60 — Shashtiamsa',signifies:'Fine-grained past-life karma — classically the final, decisive judgment among all Vargas.',fn:getShashtiamsaSign}
];

// Generic builder: works for any of the divisional sign-mapping functions above (and is reused for D9 too).
function buildDivisionalChart(planetData,ascSid,signFn){
  const ascSign=signFn(ascSid);
  const planetSign={};
  PLANETS.forEach(p=>{planetSign[p]=signFn(planetData[p].lon)});
  const houseMap={};for(let i=1;i<=12;i++)houseMap[i]=[];
  const planetHouse={};
  PLANETS.forEach(p=>{
    const house=((planetSign[p]-ascSign+12)%12)+1;
    houseMap[house].push(p);
    planetHouse[p]=house;
  });
  const vargottama={};
  PLANETS.forEach(p=>{vargottama[p]=(planetSign[p]===planetData[p].sign)});
  return{ascSign,planetSign,houseMap,planetHouse,vargottama};
}

// Computes all 16 charts (D1 passthrough + D9 via existing function + the 14 new ones) for a given chart.
// Returns a map keyed by chart key (e.g. "D2", "D10") to {ascSign, planetSign, houseMap, planetHouse, vargottama, title, signifies}.
function calcAllDivisionalCharts(planetData,ascSid,lagnaSign,houseMap){
  const all={};
  all.D1={ascSign:lagnaSign,planetSign:Object.fromEntries(PLANETS.map(p=>[p,planetData[p].sign])),houseMap,planetHouse:Object.fromEntries(PLANETS.map(p=>[p,planetData[p].house])),vargottama:Object.fromEntries(PLANETS.map(p=>[p,true])),title:'D1 — Rashi',signifies:'The foundational chart: physical body, overall personality, and general life path. Every other Varga refines a specific theme already promised here.'};
  const nav=buildDivisionalChart(planetData,ascSid,getNavamsaSign);
  all.D9={...nav,title:'D9 — Navamsa',signifies:'Marriage, spouse, inner character, dharma, and the second most important chart after D1 — confirms or refines the strength promised by D1.'};
  DIVISIONAL_CHARTS.forEach(def=>{
    all[def.key]={...buildDivisionalChart(planetData,ascSid,def.fn),title:def.title,signifies:def.signifies};
  });
  return all;
}
