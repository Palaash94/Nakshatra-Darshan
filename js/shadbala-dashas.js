/* ============================================================
   AVASTHA, SHADBALA & DASHA CALCULATIONS
   Baladi/Jagradadi/Deeptadi Avastha states, full Shadbala six-fold
   strength engine, Bhava Bala, Navamsa (D9) chart calculation,
   Ishta/Kashta Phala, and the Vimshottari Dasha/Antardasha/
   Pratyantardasha/Sookshma Dasha recursive period calculator.
   ============================================================ */

// ============ AVASTHA MODULE ============
// 1. Baladi Avastha - 5 states based on degree-within-sign; direction reverses for even signs
const BALADI_NAMES=['Bala','Kumara','Yuva','Vriddha','Mrita'];
const BALADI_MEANING={
  Bala:'Infant state (¼ strength). The planet is young and tentative — results come slowly and need nurturing before they mature.',
  Kumara:'Youthful state (½ strength). Growing capability — the planet is gaining confidence but not yet at its peak.',
  Yuva:'Adolescent/youthful prime (full strength). The planet is at its most vigorous and capable of delivering its best results.',
  Vriddha:'Old age state (minimum strength). The planet is past its peak — results are tired, delayed, or diminished.',
  Mrita:'"Dead" state (no result). The planet struggles to deliver any meaningful result in this condition without other strong support.'
};
const BALADI_STRENGTH_FACTOR={Bala:0.25,Kumara:0.5,Yuva:1,Vriddha:0.5,Mrita:0};
function calcBaladiAvastha(signIdx,degInSign){
  const isOddSign=(signIdx%2===0); // signIdx 0=Aries(odd/male sign)
  const band=Math.floor(degInSign/6); // 0-4
  const order=isOddSign?band:4-band;
  return BALADI_NAMES[order];
}

// 2. Jagrat / Swapna / Sushupti Avastha - based on sign dignity (3 states)
const JAGRADADI_MEANING={
  Jagrat:'Awakened state. The planet is in its own or exaltation sign — fully alert and capable of delivering complete, unobstructed results.',
  Swapna:'Dreaming state. The planet is in a friendly or neutral sign — results arrive but only partially (roughly 50-70%), often requiring more effort.',
  Sushupti:'Sleeping state. The planet is in an enemy or debilitated sign — results are negligible, delayed, or can even turn adverse.'
};
function calcJagradadiAvastha(planet,signIdx){
  const dignity=getDignity(planet,signIdx,0);
  if(dignity==='exalted'||dignity==='own'||dignity==='moolatrikona')return'Jagrat';
  if(dignity==='debilitated')return'Sushupti';
  const lord=SIGN_LORD[signIdx];
  const rel=(planet===lord)?'friend':naturalRelation(planet,lord);
  if(rel==='enemy')return'Sushupti';
  return'Swapna'; // friend or neutral
}

// 3. Deeptadi Avastha - 9 states per BPHS Chapter 49, verses 8-9 (Sanskrit: svoccasthah khecaro diptah svarkshe svastho'dhimitrabhe / mudito mitrabhe shantah samabhe dina uchyate // shutrabhe duhkhito prokto vikalah paapasamyutah / khalah khalagrihe jneyah kopi syaadarkasamyutah)
const DEEPTADI_MEANING={
  Dipta:'Glowing/blazing state. Planet is exalted. Gives landlordship, enthusiasm, courage, wealth, property, vehicles, respect and fame in its periods.',
  Swastha:'Healthy state. Planet is in its own sign. Gives sound health, recognition, wealth, education, fame and lands in its periods.',
  Mudita:'Delighted state. Planet is in a great friend\'s sign. Gives joyful, abundant results — happiness from spouse, wealth, victory over enemies.',
  Shanta:'Peaceful state. Planet is in a friendly sign. Gives calm, steady, generally favourable results — comfort, wisdom, helpfulness to others.',
  Deena:'Humble/poor state. Planet is in a neutral sign. Gives modest, mixed results — neither strongly good nor bad.',
  Dukhita:'Distressed state. Planet is in an enemy\'s sign. Gives little or troubled results in its significations.',
  Vikala:'Crippled state. Planet is conjunct (same sign/house) with a malefic planet. Gives weak, disrupted, or anxious results regardless of its own sign placement.',
  Khala:'Wicked/mischievous state. Planet sits in an inauspicious (malefic-owned) Varga. Gives scheming, troublesome, or mischievous results.',
  Kopa:'Enraged state. Combust (too close to the Sun) — the planet\'s light is overwhelmed. Gives irritable, hidden, or frustrated results regardless of sign placement.'
};
const MALEFIC_PLANETS=['Mars','Saturn','Sun','Rahu','Ketu'];
function calcDeeptadiAvastha(planet,signIdx,planetHouses,sunLon,planetLon,houseMap,planetHouse){
  if(planet==='Sun')return calcDeeptadiCore(planet,signIdx,planetHouses); // Sun cannot combust itself
  // Kopa: combustion check (conjunct/eclipsed by Sun) - simplified to a single classical orb per planet, approximation noted in info text
  let elong=Math.abs(norm360(planetLon-sunLon));
  if(elong>180)elong=360-elong;
  const combustionOrb={Moon:12,Mars:17,Mercury:14,Jupiter:11,Venus:10,Saturn:15}[planet]||8;
  if(elong<combustionOrb)return'Kopa';
  // Vikala: conjunct (same house/sign) with a malefic planet (Mars, Saturn, Rahu, Ketu, or weak/afflicted Sun) - per BPHS 49.9 "paapasamyutah"
  if(houseMap&&planetHouse){
    const housemates=houseMap[planetHouse]||[];
    const hasMaleficConjunction=housemates.some(p=>p!==planet&&MALEFIC_PLANETS.includes(p));
    if(hasMaleficConjunction)return'Vikala';
  }
  return calcDeeptadiCore(planet,signIdx,planetHouses);
}
function calcDeeptadiCore(planet,signIdx,planetHouses){
  const dignity=getDignity(planet,signIdx,0);
  if(dignity==='exalted')return'Dipta';
  if(dignity==='own'||dignity==='moolatrikona')return'Swastha';
  const lord=SIGN_LORD[signIdx];
  if(planet===lord)return'Swastha';
  const natural=naturalRelation(planet,lord);
  const lordHouse=planetHouses[lord],planetHouse=planetHouses[planet];
  let compound=natural;
  if(lordHouse&&planetHouse){
    const temporal=temporalRelation(planetHouse,lordHouse);
    compound=panchadhaMaitri(natural,temporal);
  }
  if(compound==='greatFriend')return'Mudita';
  if(compound==='friend')return'Shanta';
  if(compound==='neutral')return'Deena';
  if(compound==='enemy')return'Dukhita';
  return'Khala'; // great enemy sign treated as the harshest classical tier (debilitation also falls here per dignity, since BPHS's 9-fold list has no separate debilitation state - it is covered by the Baladi/Jagradadi systems instead)
}

// Master Avastha calculation for all 7 classical planets
function calcAllAvasthas(planetData,sunLon,houseMap){
  const planetHouses={};
  SHADBALA_PLANETS.forEach(p=>{planetHouses[p]=planetData[p].house});
  const results={};
  SHADBALA_PLANETS.forEach(planet=>{
    const d=planetData[planet];
    const baladi=calcBaladiAvastha(d.sign,d.deg);
    const jagradadi=calcJagradadiAvastha(planet,d.sign);
    const deeptadi=calcDeeptadiAvastha(planet,d.sign,planetHouses,sunLon,d.lon,houseMap,d.house);
    results[planet]={baladi,jagradadi,deeptadi};
  });
  return results;
}

// ============ NAVAMSA (D9) MODULE ============
// Navamsa sign uses getNavamsaSign() (already defined below in Shadbala support functions) - computed here for all 9 grahas + Ascendant
function calcNavamsaChart(planetData,ascSid){
  const navAscSign=getNavamsaSign(ascSid);
  const navPlanetSign={};
  PLANETS.forEach(p=>{navPlanetSign[p]=getNavamsaSign(planetData[p].lon)});
  const navHouseMap={};for(let i=1;i<=12;i++)navHouseMap[i]=[];
  const navPlanetHouse={};
  PLANETS.forEach(p=>{
    const house=((navPlanetSign[p]-navAscSign+12)%12)+1;
    navHouseMap[house].push(p);
    navPlanetHouse[p]=house;
  });
  const vargottama={};
  PLANETS.forEach(p=>{vargottama[p]=(navPlanetSign[p]===planetData[p].sign)});
  return{navAscSign,navPlanetSign,navHouseMap,navPlanetHouse,vargottama};
}

// ============ SHADBALA MODULE ============
// All values in Shashtiamsa (60ths of a "Virupa") unless noted; final totals converted to Rupas (1 Rupa = 60 Virupa).
const SHADBALA_PLANETS=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn'];
const REQUIRED_RUPAS={Sun:6.5,Moon:6,Mars:5,Mercury:7,Jupiter:6.5,Venus:5.5,Saturn:5};
const NAISARGIKA_VIRUPA={Sun:60,Moon:51.43,Venus:42.85,Jupiter:34.28,Mercury:25.7,Mars:17.14,Saturn:8.57};
const DIG_BALA_STRONG_HOUSE={Sun:10,Mars:10,Jupiter:1,Mercury:1,Moon:4,Venus:4,Saturn:7};

// --- 1. STHANA BALA (positional strength) ---
function uchchaBalaClean(planet,signIdx,degInSign){
  const ex=EXALTATION[planet]; if(!ex)return 0;
  const exactLon=ex.sign*30+ex.deg;
  const planetLon=signIdx*30+degInSign;
  let dist=Math.abs(planetLon-exactLon);
  if(dist>180)dist=360-dist;
  return 60*(1-dist/180);
}
// Temporal (Tatkalika) friendship: planets in 2nd,3rd,4th,10th,11th,12th houses from another planet are temporal friends; 1st,5th,6th,7th,8th,9th are temporal enemies
function temporalRelation(fromHouse,toHouse){
  let dist=((toHouse-fromHouse+12)%12)+1; // 1-12
  const friendHouses=[2,3,4,10,11,12];
  return friendHouses.includes(dist)?'friend':'enemy';
}

// Panchadha Maitri (5-fold compound relationship): combines Natural + Temporal friendship into 5 grades
function panchadhaMaitri(natural,temporal){
  if(natural==='friend'&&temporal==='friend')return'greatFriend';
  if(natural==='enemy'&&temporal==='enemy')return'greatEnemy';
  if(natural==='friend'&&temporal==='enemy')return'neutral';
  if(natural==='enemy'&&temporal==='friend')return'neutral';
  if(natural==='neutral'&&temporal==='friend')return'friend';
  if(natural==='neutral'&&temporal==='enemy')return'enemy';
  return'neutral';
}

// Saptavargaja Bala: the planet's compound-relationship dignity is scored SEPARATELY in each of the
// 7 classical vargas (D1, D2, D3, D7, D9, D10, D12) using this scale, then SUMMED across all 7 (not
// averaged - back-calculating from a known Jagannatha Hora chart confirms JHora's reported Saptavargaja
// figures are consistent with a sum: e.g. a Moon Sthana Bala of 226.46V only reconciles against its
// Uchcha+Ojayugma+Kendradi+Drekkana total if the Saptavargaja component itself is ~135V, which matches
// summing 7 per-varga scores of this size, not capping at a single varga's ~45V max).
const SAPTAVARGA_KEYS=['D1','D2','D3','D7','D9','D10','D12'];
const SAPTAVARGAJA_SCALE={moolatrikona:45,own:30,greatFriend:22.5,friend:15,neutral:7.5,enemy:3.75,greatEnemy:1.875};

// Scores a single varga's dignity for `planet`, given that varga's sign for the planet and the
// planet-house map WITHIN THAT SAME VARGA (so the sign lord's temporal relationship can be checked
// using its position in that varga, not the D1 chart).
function vargaDignityScore(planet,vargaSignOfPlanet,vargaPlanetHouse){
  const dignity=getDignity(planet,vargaSignOfPlanet,0);
  if(dignity==='moolatrikona')return SAPTAVARGAJA_SCALE.moolatrikona;
  if(dignity==='exalted'||dignity==='own')return SAPTAVARGAJA_SCALE.own;
  const lord=SIGN_LORD[vargaSignOfPlanet];
  if(planet===lord)return SAPTAVARGAJA_SCALE.own;
  const natural=naturalRelation(planet,lord);
  const lordHouse=vargaPlanetHouse[lord],ownHouse=vargaPlanetHouse[planet];
  let compound=natural;
  if(lordHouse&&ownHouse){
    const temporal=temporalRelation(ownHouse,lordHouse);
    compound=panchadhaMaitri(natural,temporal);
  }
  return SAPTAVARGAJA_SCALE[compound]!==undefined?SAPTAVARGAJA_SCALE[compound]:SAPTAVARGAJA_SCALE.neutral;
}

// Full Saptavargaja Bala: sum of vargaDignityScore() across all 7 classical vargas. `vargaCharts` is
// the calcAllDivisionalCharts() result (divisional-charts.js), computed once per chart and shared with
// the Vargas tab, so D2/D3/D7/D9/D10/D12 (plus D1 itself) are all already available here.
function saptavargajaBalaFull(planet,vargaCharts){
  let total=0;
  SAPTAVARGA_KEYS.forEach(key=>{
    const varga=vargaCharts&&vargaCharts[key];
    if(!varga)return;
    total+=vargaDignityScore(planet,varga.planetSign[planet],varga.planetHouse);
  });
  return total;
}
function ojayugmaBala(planet,signIdx,navamsaSignIdx){
  const isFemale=(planet==='Moon'||planet==='Venus');
  const signOdd=(signIdx%2===0); // signIdx 0=Aries(odd sign,male-favored)
  const navOdd=(navamsaSignIdx%2===0);
  let total=0;
  if(isFemale){if(!signOdd)total+=15; if(!navOdd)total+=15;}
  else{if(signOdd)total+=15; if(navOdd)total+=15;}
  return total;
}
function kendradiBala(house){
  const kendra=[1,4,7,10],panapara=[2,5,8,11];
  if(kendra.includes(house))return 60;
  if(panapara.includes(house))return 30;
  return 15;
}
function drekkanaBala(planet,degInSign){
  const drekkanaIdx=Math.floor(degInSign/10); // 0,1,2
  const male=['Sun','Jupiter','Mars'],female=['Moon','Venus'],neutral=['Mercury','Saturn'];
  if(male.includes(planet)&&drekkanaIdx===0)return 15;
  if(neutral.includes(planet)&&drekkanaIdx===1)return 15;
  if(female.includes(planet)&&drekkanaIdx===2)return 15;
  return 0;
}
function sthanaBala(planet,signIdx,degInSign,house,navamsaSignIdx,planetHouses,vargaCharts){
  const uch=uchchaBalaClean(planet,signIdx,degInSign);
  const sapta=saptavargajaBalaFull(planet,vargaCharts);
  const ojy=ojayugmaBala(planet,signIdx,navamsaSignIdx);
  const kendra=kendradiBala(house);
  const drek=drekkanaBala(planet,degInSign);
  return{uchcha:uch,saptavargaja:sapta,ojayugma:ojy,kendradi:kendra,drekkana:drek,total:uch+sapta+ojy+kendra+drek};
}

// --- 2. DIG BALA (directional strength) ---
// Degree-precise: the planet's strong direction is an exact angular Kendra point measured from the
// Ascendant's own exact degree (1st/4th/7th/10th Kendras are 90deg apart), not just "which whole-sign
// house" - Dig Bala is 60V exactly at that point, tapering to 0V at the diametrically opposite point.
// Verified against a real Jagannatha Hora chart: all 7 planets matched this formula exactly, while the
// previous whole-house-distance approximation matched none of them.
function digBala(planet,planetLon,ascSid){
  const strongHouse=DIG_BALA_STRONG_HOUSE[planet];
  const strongPointLon=norm360(ascSid+((strongHouse-1)/3)*90);
  let dist=Math.abs(norm360(planetLon-strongPointLon));
  if(dist>180)dist=360-dist;
  return 60*(1-dist/180);
}

// --- 3. KALA BALA (temporal strength) - simplified to most impactful sub-components given available data ---
function nathonnataBala(hourDecimal){
  // Day strength (Unnata) for Sun/Jupiter/Venus peaks at noon; Night strength (Nata) for Moon/Mars/Saturn peaks at midnight; Mercury always strong
  const h=hourDecimal;
  const noonDist=Math.min(Math.abs(h-12),24-Math.abs(h-12)); // 0 at noon, 12 at midnight
  const midnightDist=12-noonDist; // 0 at midnight, 12 at noon
  return{
    Sun:60*(1-noonDist/12),Jupiter:60*(1-noonDist/12),Venus:60*(1-noonDist/12),
    Moon:60*(1-midnightDist/12),Mars:60*(1-midnightDist/12),Saturn:60*(1-midnightDist/12),
    Mercury:60
  };
}
function pakshaBala(moonLon,sunLon){
  // Strength from lunar phase. Benefics (Jup,Ven,Merc,well-placed Moon) gain in Shukla(waxing); malefics gain in Krishna(waning)
  // Per BPHS: angular distance Sun-Moon divided by 3 gives Paksha Bala for benefics (max 60V at full elongation of 180deg).
  // The Moon's OWN Paksha Bala is double everyone else's, with true max of 120V (2 Rupas) at exact Full/New Moon.
  let elong=norm360(moonLon-sunLon);
  if(elong>180)elong=360-elong;
  const benificStrength=elong/3; // 0-60V scale for benefics
  return benificStrength;
}
// Each third of the ACTUAL day/night (sunrise-to-sunset and sunset-to-sunrise, not fixed 12-hour
// spans) is ruled by a planet; Jupiter ALWAYS gets 60V regardless of birth time (unconditional bonus).
// Day thirds: Mercury, Sun, Saturn. Night thirds: Moon, Venus, Mars.
function tribhagaBala(hourDecimal,isDayBirth,sunriseHr,sunsetHr){
  const dayLords=['Mercury','Sun','Saturn'],nightLords=['Moon','Venus','Mars'];
  const dayLen=sunsetHr-sunriseHr,nightLen=24-dayLen;
  if(isDayBirth){
    const elapsed=hourDecimal-sunriseHr;
    return dayLords[Math.min(2,Math.max(0,Math.floor((elapsed/dayLen)*3)))];
  }
  const elapsed=hourDecimal>=sunsetHr?hourDecimal-sunsetHr:(24-sunsetHr)+hourDecimal;
  return nightLords[Math.min(2,Math.max(0,Math.floor((elapsed/nightLen)*3)))];
}
function varshaMasaDinaHoraBala(weekday){
  // Simplified: Hora lord of birth hour gets 60V (full weekday-lord cycling requires precise hora tables; approximated using weekday lord only)
  const weekdayLords=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn'];
  return weekdayLords[weekday];
}
// Hora Bala (planetary-hour lord, 60V - the single largest Varshadi Bala sub-component per BPHS 27.13).
// Classical rule: the first Hora after sunrise is ruled by the weekday lord; each subsequent Hora cycles
// through the Chaldean order (Saturn, Jupiter, Mars, Sun, Venus, Mercury, Moon) across 12 day Horas
// (sunrise-to-sunset, divided into 12 equal parts) + 12 night Horas (sunset-to-sunrise, same), using
// the true local sunrise/sunset for the birth date (calcSunriseSunset) rather than a fixed 6am/6pm.
const CHALDEAN_ORDER=['Saturn','Jupiter','Mars','Sun','Venus','Mercury','Moon'];
function horaLord(weekday,hourDecimal,sunriseHr,sunsetHr){
  const dayLord=varshaMasaDinaHoraBala(weekday);
  const startIdx=CHALDEAN_ORDER.indexOf(dayLord);
  const dayLen=sunsetHr-sunriseHr,nightLen=24-dayLen;
  const sinceSunrise=((hourDecimal-sunriseHr)+24)%24;
  let horaIdx;
  if(sinceSunrise<dayLen)horaIdx=Math.floor((sinceSunrise/dayLen)*12);
  else horaIdx=12+Math.floor(((sinceSunrise-dayLen)/nightLen)*12);
  return CHALDEAN_ORDER[(startIdx+horaIdx)%7];
}
// Varsha Bala (year lord, 15V - the smallest Varshadi Bala sub-component). The classical year boundary
// is Mesha Sankranti (the moment the sidereal Sun enters Aries), NOT the Gregorian Jan 1 - the previous
// Jan-1-weekday heuristic had no relationship to the actual Hindu solar calendar. varshaLordFromSankranti
// numerically locates the most recent Mesha Sankranti before the birth moment and uses ITS weekday.
function varshaLordFromSankranti(jd){
  const weekdayLords=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn'];
  const T=(jd-2451545.0)/36525;
  const sunSidNow=norm360(sunLongitudeApparent(T)-lahiriAyanamsa(jd));
  let testJD=jd-sunSidNow/0.9856; // Sun's mean motion is ~0.9856deg/day
  for(let i=0;i<4;i++){
    const Tt=(testJD-2451545.0)/36525;
    let diff=norm360(sunLongitudeApparent(Tt)-lahiriAyanamsa(testJD));
    if(diff>180)diff-=360; // signed degrees from 0 Aries
    testJD-=diff/0.9856;
  }
  // JD 2451545.0 (Jan 1 2000, 12:00 UTC) was a Saturday (weekday index 6 in JS Date's Sun=0..Sat=6).
  const weekdayIdx=((6+Math.round(testJD-2451545.0))%7+7)%7;
  return weekdayLords[weekdayIdx];
}
// Standard sunrise/sunset (hour-angle) equation for the birth's local calendar date, replacing the
// previous fixed 6am/6pm approximation. Uses the standard -0.833deg reference altitude (atmospheric
// refraction + solar disk radius). Ignores the equation of time (+-15min) for simplicity - a much
// smaller residual error than the fixed-hours approximation it replaces, which could be off by hours
// at high latitudes or in extreme seasons. Returns LOCAL CLOCK decimal hours (comparable directly to
// hourDecimal), using the birth's own UTC-offset `tz` and longitude `lon`.
function calcSunriseSunset(jd,lat,lon,tz){
  const T=(jd-2451545.0)/36525;
  const sunTropicalLon=sunLongitudeApparent(T);
  const eps=23.4392911*D2R;
  const decl=Math.asin(Math.sin(eps)*Math.sin(sunTropicalLon*D2R));
  const latR=lat*D2R;
  const cosH0=(Math.sin(-0.833*D2R)-Math.sin(latR)*Math.sin(decl))/(Math.cos(latR)*Math.cos(decl));
  const clamped=Math.max(-1,Math.min(1,cosH0));
  const H0deg=Math.acos(clamped)*R2D;
  const solarNoonLocalClock=12+tz-lon/15;
  return{sunriseHr:solarNoonLocalClock-H0deg/15,sunsetHr:solarNoonLocalClock+H0deg/15,polar:clamped<=-1||clamped>=1};
}

function ayanaBala(planet,declination){
  // Northern declination favors Sun/Mars/Jupiter/Venus/Mercury(always added); Southern favors Moon/Saturn
  const maxDecl=23.45;
  const normalized=Math.max(-1,Math.min(1,declination/maxDecl));
  let val;
  if(planet==='Mercury')val=30+30*Math.abs(normalized);
  else if(planet==='Moon'||planet==='Saturn')val=30-30*normalized;
  else val=30+30*normalized;
  if(planet==='Sun')val=val*2>60?60:val*2;
  return Math.max(0,Math.min(60,val));
}
function kalaBala(planet,hourDecimal,moonLon,sunLon,weekday,declination,isDayBirth,varshaLordName,sunriseHr,sunsetHr){
  const nat=nathonnataBala(hourDecimal)[planet];
  const paksha=pakshaBala(moonLon,sunLon); // 0-60V scale benefic strength
  const benefics=['Moon','Mercury','Jupiter','Venus'];
  // Moon's own Paksha Bala doubles (true max 120V/2 Rupas at exact Full/New Moon); other benefics use it directly; malefics get the complement
  const pakshaApplied=(planet==='Moon')?Math.min(120,paksha*2):(benefics.includes(planet)?paksha:(60-paksha));
  const tribhagaLord=tribhagaBala(hourDecimal,isDayBirth,sunriseHr,sunsetHr);
  let tribhaga=tribhagaLord===planet?60:0;
  if(planet==='Jupiter')tribhaga=60; // Jupiter ALWAYS receives full 60V Tribhaga Bala regardless of birth time (classical unconditional rule)
  const weekdayLord=varshaMasaDinaHoraBala(weekday);
  const dinaBala=weekdayLord===planet?45:0; // Dina(weekday) bala - BPHS 27.13: 45V to the weekday lord
  const horaBalaLord=horaLord(weekday,hourDecimal,sunriseHr,sunsetHr);
  const hora=horaBalaLord===planet?60:0; // Hora bala - BPHS 27.13: 60V to the planetary-hour lord (largest Varshadi sub-component)
  const varsha=varshaLordName===planet?15:0; // Varsha bala - BPHS 27.13: 15V to the year lord (Mesha Sankranti weekday), the smallest Varshadi sub-component
  const ayana=ayanaBala(planet,declination);
  // Masa Bala (month lord) and Yuddha (planetary war) bala remain omitted: Masa Bala needs the exact
  // solar month boundary (Sun's sign-ingress date) and a verified classical month-lord cycling rule
  // neither of which this project has confirmed against a primary source closely enough to implement
  // without risking a confidently-wrong number; Yuddha is a rare exact-conjunction condition.
  const total=nat+pakshaApplied+tribhaga+dinaBala+hora+varsha+ayana;
  return{nathonnata:nat,paksha:pakshaApplied,tribhaga,dina:dinaBala,hora,varsha,ayana,total};
}

// --- 4. CHESHTA BALA (motional strength) ---
// Per BPHS 27.18, 27.24-25: Sun's Cheshta Bala = its Ayana Bala; Moon's Cheshta Bala = her Paksha Bala.
// For Mars-Saturn(-Mercury-Venus): graded by Sighra Kendra - the heliocentric longitudinal separation
// between the planet and Earth (see getMotionInfo's kendraDist). Astronomically, stationary/retrograde
// motion for BOTH inner and outer planets occurs when this separation is small (Earth and the planet
// are at their closest orbital "alignment"); direct motion is fastest/cleanest near the opposite point
// (kendraDist=180, e.g. solar conjunction for an outer planet). This was previously approximated from
// raw apparent angular speed, which cannot distinguish "fast because near-station" from "fast because
// near conjunction" - verified against a real chart where Jupiter's apparent speed spiked near solar
// conjunction (old formula wrongly gave it max 60V Cheshta) while Jagannatha Hora's reported Cheshta
// Bala was near-zero there, matching what kendraDist correctly predicts (kendraDist≈180 at that
// configuration => Cheshta≈0).
function cheshtaBala(planet,isRetrograde,kendraDist){
  if(planet==='Sun'||planet==='Moon')return 0; // handled via Ayana/Paksha Bala instead, per BPHS 27.18
  if(isRetrograde)return 60; // Vakri (retrograde) - unambiguous per BPHS 27.24, maximum classical strength
  if(kendraDist===null||kendraDist===undefined)return 30; // fallback if motion data unavailable
  const clamped=Math.max(0,Math.min(180,kendraDist));
  return Math.max(0,Math.min(60,60*(1-clamped/180)));
}

// --- 5. NAISARGIKA BALA (natural strength) - fixed classical values ---
function naisargikaBala(planet){return NAISARGIKA_VIRUPA[planet]}

// --- 6. DRIK BALA (aspectual strength) ---
// Classical graded aspect strength: 7th aspect (all planets) = full(60V); Mars's 4th/8th = 3/4(45V); Jupiter's 5th/9th = 1/2(30V); Saturn's 3rd/10th = 1/4(15V)
function aspectGradeVirupa(aspector,offset){
  if(offset===7)return 60;
  if(aspector==='Mars'&&(offset===4||offset===8))return 45;
  if(aspector==='Jupiter'&&(offset===5||offset===9))return 30;
  if(aspector==='Saturn'&&(offset===3||offset===10))return 15;
  if((aspector==='Rahu'||aspector==='Ketu')&&(offset===5||offset===9))return 30;
  return 0;
}
// NOTE on Drig Bala's remaining approximation: classical Drishti Bala is graded by the exact degree
// separation between aspecting and aspected planet, not by whole-house membership. Reimplementing that
// precisely requires the exact classical orb/taper curve, which this project could not confirm against
// a primary source closely enough to change with confidence - shipping a wrong "precise-looking"
// formula would be worse than the current, disclosed, house-based approximation. Left unchanged
// pending a verified reference; everything else in this app (Yoga/Dosha detection, the Argala module,
// the chart's own drishti display) already uses the same whole-house aspect system, so this also keeps
// Drig Bala internally consistent with the rest of the app.
function drikBala(planet,houseMap,planetData){
  // Benefic aspects (Jupiter, Venus, well-placed Mercury/Moon) add strength; malefic (Saturn, Mars, Sun) subtract
  const benefics=['Jupiter','Venus','Mercury','Moon'],malefics=['Saturn','Mars','Sun'];
  let netHouse=null;
  for(let h=1;h<=12;h++){if((houseMap[h]||[]).includes(planet)){netHouse=h;break}}
  if(netHouse===null)return 0;
  let strength=0;
  SHADBALA_PLANETS.forEach(aspector=>{
    if(aspector===planet)return;
    let fromHouse=null;
    for(let h=1;h<=12;h++){if((houseMap[h]||[]).includes(aspector)){fromHouse=h;break}}
    if(fromHouse===null)return;
    const offsets=ASPECT_OFFSETS[aspector]||[7];
    offsets.forEach(off=>{
      const aspectedHouse=((fromHouse-1+off-1)%12)+1;
      if(aspectedHouse===netHouse){
        const grade=aspectGradeVirupa(aspector,off);
        const isBenefic=benefics.includes(aspector);
        // Scale graded full-aspect strength (max 60V) down to a quarter-rupa-ish contribution per aspect, consistent with classical Drik Bala typically totaling under 1-2 rupas
        strength+=(isBenefic?1:-1)*(grade/4);
      }
    });
  });
  return strength;
}

// --- Supporting calculations for Shadbala inputs ---
function getNavamsaSign(siderealLon){
  // Navamsa: each sign divided into 9 parts of 3°20' each. Counting depends on sign's element (movable/fixed/dual cycle from Aries/Leo/Sagittarius etc per classical rule simplified to standard 9-fold cycle from the sign itself)
  const signIdx=Math.floor(siderealLon/30);
  const degInSign=siderealLon%30;
  const navamsaNum=Math.floor(degInSign/(30/9)); // 0-8
  // Starting sign for navamsa counting cycles by element: movable signs start from themselves, fixed from 9th, dual from 5th
  const movable=[0,3,6,9],fixed=[1,4,7,10],dual=[2,5,8,11];
  let startSign;
  if(movable.includes(signIdx))startSign=signIdx;
  else if(fixed.includes(signIdx))startSign=(signIdx+8)%12;
  else startSign=(signIdx+4)%12;
  return(startSign+navamsaNum)%12;
}

function getDeclination(siderealLon,ayanamsa){
  // Approximate declination from ecliptic longitude using mean obliquity (tropical longitude needed, so add back ayanamsa)
  const tropicalLon=norm360(siderealLon+ayanamsa);
  const eps=23.4393*D2R;
  const lonR=tropicalLon*D2R;
  return Math.asin(Math.sin(eps)*Math.sin(lonR))*R2D;
}

// Detect retrograde by sampling planet position shortly before and after the birth moment, and
// compute the Sighra Kendra distance (heliocentric longitude separation from Earth - see cheshtaBala()).
// Window is a narrow +/-4.8h (0.2 day) rather than +/-1 full day: a full-day central difference
// approximates the AVERAGE motion over that 2-day span, which reads the wrong direction whenever the
// planet actually stations (velocity crosses zero) somewhere inside that window rather than exactly
// at the birth moment - exactly the case someone cross-checking near a station would notice as wrong.
// The narrower window keeps the central difference close to the true instantaneous velocity at jd.
function getMotionInfo(planet,jd,ayanamsa){
  if(planet==='Sun'||planet==='Moon')return{retrograde:false,kendraDist:null};
  const H=0.2;
  const T0=(jd-H-2451545.0)/36525,T1=(jd+H-2451545.0)/36525;
  const tau0=T0/10,tau1=T1/10;
  function lonAt(tau){
    const earthPos=vsopPlanetPos(VSOP.earth,tau);
    const key=planet.toLowerCase();
    if(!VSOP[key])return null;
    return toGeocentric(vsopPlanetPos(VSOP[key],tau),earthPos);
  }
  const lon0=lonAt(tau0),lon1=lonAt(tau1);
  if(lon0===null||lon1===null)return{retrograde:false,kendraDist:null};
  let delta=lon1-lon0;
  if(delta>180)delta-=360; if(delta<-180)delta+=360;
  const dailyMotion=delta/(2*H);
  const T=(jd-2451545.0)/36525,tau=T/10;
  const earthHelioLon=vsopPlanetPos(VSOP.earth,tau).lon*R2D;
  const planetHelioLon=vsopPlanetPos(VSOP[planet.toLowerCase()],tau).lon*R2D;
  let kendraDist=Math.abs(norm360(planetHelioLon-earthHelioLon));
  if(kendraDist>180)kendraDist=360-kendraDist;
  return{retrograde:dailyMotion<0,kendraDist};
}


function calcShadbala(planetData,houseMap,birthInfo,vargaCharts,ascSid){
  const{hourDecimal,weekday,isDayBirth,navamsaSigns,retrograde,declinations,kendraDists,sunTimes,varshaLordName}=birthInfo;
  const planetHouses={};
  SHADBALA_PLANETS.forEach(p=>{planetHouses[p]=planetData[p].house});
  const results={};
  SHADBALA_PLANETS.forEach(planet=>{
    const d=planetData[planet];
    const sthana=sthanaBala(planet,d.sign,d.deg,d.house,navamsaSigns[planet],planetHouses,vargaCharts);
    const dig=digBala(planet,d.lon,ascSid);
    const kala=kalaBala(planet,hourDecimal,planetData.Moon.lon,planetData.Sun.lon,weekday,declinations[planet]||0,isDayBirth,varshaLordName,sunTimes.sunriseHr,sunTimes.sunsetHr);
    const cheshta=cheshtaBala(planet,retrograde[planet],kendraDists[planet]);
    const naisargika=naisargikaBala(planet);
    const drik=drikBala(planet,houseMap,planetData);
    const totalVirupa=sthana.total+dig+kala.total+cheshta+naisargika+drik;
    const totalRupas=totalVirupa/60;
    const required=REQUIRED_RUPAS[planet];
    results[planet]={
      sthana,dig,kala,cheshta,naisargika,drik,
      totalVirupa,totalRupas,required,
      pct:(totalRupas/required)*100
    };
  });
  return results;
}

// ============ ISHTA PHALA / KASHTA PHALA MODULE ============
// Per BPHS Ch.30: Ishta Phala ("benefic result") = sqrt(Uchcha Bala x Cheshta Bala) / 60 (in Rupas, 0-1 scale via /60 then x60 back for display)
// Kashta Phala ("malefic result") = sqrt((60-Uchcha Bala) x (60-Cheshta Bala)) / 60
// For Sun: Cheshta-equivalent = Ayana Bala. For Moon: Cheshta-equivalent = Paksha Bala (both already 0-60 scale, per BPHS 27.18 substitution rule)
function calcIshtaKashtaPhala(shadbalaResults){
  const results={};
  SHADBALA_PLANETS.forEach(planet=>{
    const s=shadbalaResults[planet];
    const uchcha=s.sthana.uchcha; // 0-60 scale
    let cheshtaEquiv;
    if(planet==='Sun')cheshtaEquiv=s.kala.ayana;
    // Moon's s.kala.paksha is the DOUBLED Paksha Bala (0-120 scale, per this app's Kala Bala doubling
    // convention - see SHADBALA_INFO). Ishta/Kashta's Cheshta-equivalent substitution (BPHS 27.18) needs
    // the standard 0-60 scale, so halve it back; otherwise (60-cheshtaEquiv) goes negative whenever the
    // Moon is more than 90deg from the Sun, and Math.sqrt() of that produces NaN.
    else if(planet==='Moon')cheshtaEquiv=s.kala.paksha/2;
    else cheshtaEquiv=s.cheshta;
    const ishta=Math.sqrt(uchcha*cheshtaEquiv);
    const kashta=Math.sqrt((60-uchcha)*(60-cheshtaEquiv));
    results[planet]={uchcha,cheshtaEquiv,ishta,kashta,net:ishta-kashta};
  });
  return results;
}

// ============ BHAVA BALA MODULE (House Strength) ============
// Formula: Bhava Bala = Bhavadhipati Bala (house lord's total Shadbala) + Bhava Dig Bala (Kendra/Panapara/Apoklima) + Bhava Drishti Bala (aspects on house, same graded formula as Drik Bala)
function bhavaDigBala(house){
  const kendra=[1,4,7,10],panapara=[2,5,8,11];
  if(kendra.includes(house))return 60;
  if(panapara.includes(house))return 30;
  return 15;
}
function bhavaDrishtiBala(house,houseMap){
  const benefics=['Jupiter','Venus','Mercury','Moon'];
  let strength=0;
  SHADBALA_PLANETS.forEach(aspector=>{
    let fromHouse=null;
    for(let h=1;h<=12;h++){if((houseMap[h]||[]).includes(aspector)){fromHouse=h;break}}
    if(fromHouse===null)return;
    const offsets=ASPECT_OFFSETS[aspector]||[7];
    offsets.forEach(off=>{
      const aspectedHouse=((fromHouse-1+off-1)%12)+1;
      if(aspectedHouse===house){
        const grade=aspectGradeVirupa(aspector,off);
        const isBenefic=benefics.includes(aspector);
        strength+=(isBenefic?1:-1)*(grade/4);
      }
    });
  });
  return strength;
}
function calcBhavaBala(lagnaSign,houseMap,shadbalaResults){
  const results={};
  for(let h=1;h<=12;h++){
    const signIdx=(lagnaSign+h-1)%12;
    const lord=SIGN_LORD[signIdx];
    const lordShadbala=shadbalaResults[lord]?shadbalaResults[lord].totalVirupa:0;
    const digBalaVal=bhavaDigBala(h);
    const drishtiBalaVal=bhavaDrishtiBala(h,houseMap);
    const totalVirupa=lordShadbala+digBalaVal+drishtiBalaVal;
    const totalRupas=totalVirupa/60;
    results[h]={sign:signIdx,lord,bhavadhipati:lordShadbala,dig:digBalaVal,drishti:drishtiBalaVal,totalVirupa,totalRupas};
  }
  return results;
}

function calcDashas(mLon,dob){
  const nak=getNakshatra(mLon),frac=(mLon%13.3333)/13.3333;
  const sl=NAK_LORDS[nak.idx],si=DASHA_ORDER.indexOf(sl),rem=(1-frac)*DASHA_YRS[sl];
  const add=(d,y)=>{const n=new Date(d);n.setFullYear(n.getFullYear()+Math.floor(y));n.setDate(n.getDate()+Math.round((y%1)*365));return n};
  const dashas=[];let cur=new Date(dob),end=add(cur,rem);
  dashas.push({lord:sl,years:rem,start:new Date(cur),end});cur=end;
  for(let i=1;i<9;i++){const lord=DASHA_ORDER[(si+i)%9],y=DASHA_YRS[lord];end=add(cur,y);dashas.push({lord,years:y,start:new Date(cur),end:new Date(end)});cur=new Date(end)}
  // Attach Antardashas (sub-periods) to each Mahadasha
  dashas.forEach(d=>{d.antardashas=calcAntardashas(d)});
  return dashas;
}

// Antardasha: within a Mahadasha, all 9 lords run in the same cyclical order, starting from the Mahadasha's own lord.
// Classical formula: each Antardasha's share of the Mahadasha's TOTAL span = (Antardasha_lord_years / 120).
// This correctly handles partial first Mahadashas too, since it scales off the Mahadasha's actual total duration.
// Generalized so the same logic computes Antardasha, Pratyantardasha, and Sookshma Dasha (and could go deeper to Prana Dasha).
function calcSubPeriods(parent){
  const parentIdx=DASHA_ORDER.indexOf(parent.lord);
  const totalDays=(parent.end-parent.start)/86400000;
  const subs=[];
  let cur=new Date(parent.start);
  for(let i=0;i<9;i++){
    const subLord=DASHA_ORDER[(parentIdx+i)%9];
    const fraction=DASHA_YRS[subLord]/120;
    const subYears=parent.years*fraction;
    const subDays=totalDays*fraction;
    const end=new Date(cur.getTime()+subDays*86400000);
    subs.push({lord:subLord,years:subYears,start:new Date(cur),end:new Date(end)});
    cur=new Date(end);
  }
  if(subs.length)subs[subs.length-1].end=new Date(parent.end);
  return subs;
}
function calcAntardashas(maha){return calcSubPeriods(maha)}
// Pratyantardasha for one Antardasha (lazily computed per-Antardasha, attached on first access)
function getPratyantardashas(antardasha){
  if(!antardasha.pratyantardashas)antardasha.pratyantardashas=calcSubPeriods(antardasha);
  return antardasha.pratyantardashas;
}
// Sookshma Dasha for one Pratyantardasha (lazily computed)
function getSookshmaDashas(pratyantar){
  if(!pratyantar.sookshmas)pratyantar.sookshmas=calcSubPeriods(pratyantar);
  return pratyantar.sookshmas;
}

