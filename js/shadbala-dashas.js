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
function uchchaBala(planet,signIdx,degInSign){
  const ex=EXALTATION[planet]; if(!ex)return 0;
  const exactLon=ex.sign*30+ex.deg;
  const planetLon=signIdx*30+degInSign;
  let dist=Math.abs(planetLon-exactLon);
  if(dist>180)dist=360-dist;
  // 60 Shashtiamsa at exact debilitation-opposite distance(180deg)=0, at exaltation point(0deg)=60
  return(dist/180)*60===60?0:60-(dist/180)*60; // will recompute cleanly below
}
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

function saptavargajaBala(planet,signIdx,planetHouses){
  // Full classical 7-tier scale applied to Rasi chart only (true Saptavargaja needs D1,D2,D3,D7,D9,D10,D12 - this app computes D1/D9 only, so this is a labeled single-varga estimate, not the full 7-varga average)
  const dignity=getDignity(planet,signIdx,0);
  if(dignity==='moolatrikona')return 45;
  if(dignity==='own')return 30;
  if(dignity==='exalted')return 30; // exaltation handled separately via Uchcha Bala; here treat as own-tier for Saptavargaja per BPHS (avoids double-counting exaltation degree, which Uchcha Bala already captures precisely)
  const lord=SIGN_LORD[signIdx];
  if(planet===lord)return 30; // occupying own sign via lordship match
  const natural=naturalRelation(planet,lord);
  const lordHouse=planetHouses[lord];
  const planetHouse=planetHouses[planet];
  let compound=natural;
  if(lordHouse&&planetHouse){
    const temporal=temporalRelation(planetHouse,lordHouse);
    compound=panchadhaMaitri(natural,temporal);
  }
  const scale={greatFriend:22.5,friend:15,neutral:7.5,enemy:3.75,greatEnemy:1.875};
  return scale[compound]!==undefined?scale[compound]:7.5;
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
function sthanaBala(planet,signIdx,degInSign,house,navamsaSignIdx,planetHouses){
  const uch=uchchaBalaClean(planet,signIdx,degInSign);
  const sapta=saptavargajaBala(planet,signIdx,planetHouses);
  const ojy=ojayugmaBala(planet,signIdx,navamsaSignIdx);
  const kendra=kendradiBala(house);
  const drek=drekkanaBala(planet,degInSign);
  return{uchcha:uch,saptavargaja:sapta,ojayugma:ojy,kendradi:kendra,drekkana:drek,total:uch+sapta+ojy+kendra+drek};
}

// --- 2. DIG BALA (directional strength) ---
function digBala(planet,house){
  const strongHouse=DIG_BALA_STRONG_HOUSE[planet];
  const weakHouse=((strongHouse-1+6)%12)+1; // house directly opposite
  let dist=Math.abs(house-weakHouse);
  if(dist>6)dist=12-dist;
  return(dist/6)*60;
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
function tribhagaBala(hourDecimal,isDayBirth){
  // Each third of day/night ruled by a planet. Jupiter ALWAYS gets 60V regardless of birth time (unconditional classical bonus).
  // Day thirds (sunrise-sunset): Mercury, Sun, Saturn. Night thirds (sunset-sunrise): Moon, Venus, Mars.
  const dayLords=['Mercury','Sun','Saturn'],nightLords=['Moon','Venus','Mars'];
  let lords=isDayBirth?dayLords:nightLords;
  const h=isDayBirth?hourDecimal-6:(hourDecimal>=18?hourDecimal-18:hourDecimal+6);
  const third=Math.min(2,Math.max(0,Math.floor(h/4)));
  return lords[third]; // caller adds Jupiter's unconditional 60V on top of this lord's 60V
}
function varshaMasaDinaHoraBala(weekday){
  // Simplified: Hora lord of birth hour gets 60V (full weekday-lord cycling requires precise hora tables; approximated using weekday lord only)
  const weekdayLords=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn'];
  return weekdayLords[weekday];
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
function kalaBala(planet,hourDecimal,moonLon,sunLon,weekday,declination,isDayBirth){
  const nat=nathonnataBala(hourDecimal)[planet];
  const paksha=pakshaBala(moonLon,sunLon); // 0-60V scale benefic strength
  const benefics=['Moon','Mercury','Jupiter','Venus'];
  // Moon's own Paksha Bala doubles (true max 120V/2 Rupas at exact Full/New Moon); other benefics use it directly; malefics get the complement
  const pakshaApplied=(planet==='Moon')?Math.min(120,paksha*2):(benefics.includes(planet)?paksha:(60-paksha));
  const tribhagaLord=tribhagaBala(hourDecimal,isDayBirth);
  let tribhaga=tribhagaLord===planet?60:0;
  if(planet==='Jupiter')tribhaga=60; // Jupiter ALWAYS receives full 60V Tribhaga Bala regardless of birth time (classical unconditional rule)
  const weekdayLord=varshaMasaDinaHoraBala(weekday);
  const dinaBala=weekdayLord===planet?45:0; // Dina(weekday) bala simplified
  const ayana=ayanaBala(planet,declination);
  // Yuddha (planetary war) bala omitted - rare condition, would need exact conjunction check within 1deg
  const total=nat+pakshaApplied+tribhaga+dinaBala+ayana;
  return{nathonnata:nat,paksha:pakshaApplied,tribhaga,dina:dinaBala,ayana,total};
}

// --- 4. CHESHTA BALA (motional strength) ---
// Per BPHS 27.18, 27.24-25: Sun's Cheshta Bala = its Ayana Bala; Moon's Cheshta Bala = her Paksha Bala.
// For Mars-Saturn: derived from Cheshta Kendra (deviation between true and mean motion/longitude).
// Stationary/retrograde planets (near their Sighra Kendra extremes) get maximum Cheshta Bala (60V);
// fast direct motion also adds strength; slow direct motion (approaching stationary-direct) reduces it.
function cheshtaBala(planet,isRetrograde,speedRatio){
  if(planet==='Sun'||planet==='Moon')return 0; // handled via Ayana/Paksha Bala instead, per BPHS 27.18 - these are reported as separate Kala Bala sub-components, not folded into Cheshta to avoid double-counting
  if(isRetrograde)return 60; // Vakri (retrograde) - near Sighra Kendra extreme, maximum classical strength
  // Direct motion: speedRatio = actual angular speed / mean angular speed for that planet
  // A planet moving at exactly mean speed sits at the chart's "neutral" Cheshta point (~30V midline);
  // faster-than-mean direct motion adds strength toward 60V, slower-than-mean (near-stationary) motion drops toward 0V
  const clamped=Math.max(0,Math.min(2,speedRatio||1));
  return Math.max(0,Math.min(60,30*clamped));
}

// --- 5. NAISARGIKA BALA (natural strength) - fixed classical values ---
function naisargikaBala(planet){return NAISARGIKA_VIRUPA[planet]}

// --- 6. DRIK BALA (aspectual strength) ---
// Classical graded aspect strength: 7th aspect (all planets) = full(60V); Mars's 4th/8th = 3/4(45V); Jupiter's 5th/9th = 1/2(30V); Saturn's 3rd/10th = 1/4(15V)
const ASPECT_STRENGTH_VIRUPA={7:60};
function aspectGradeVirupa(aspector,offset){
  if(offset===7)return 60;
  if(aspector==='Mars'&&(offset===4||offset===8))return 45;
  if(aspector==='Jupiter'&&(offset===5||offset===9))return 30;
  if(aspector==='Saturn'&&(offset===3||offset===10))return 15;
  if((aspector==='Rahu'||aspector==='Ketu')&&(offset===5||offset===9))return 30;
  return 0;
}
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

// Detect retrograde + speed ratio by sampling planet position 1 day before and after birth moment
function getMotionInfo(planet,jd,ayanamsa){
  if(planet==='Sun'||planet==='Moon')return{retrograde:false,speedRatio:1};
  const T0=(jd-1-2451545.0)/36525,T1=(jd+1-2451545.0)/36525;
  const tau0=T0/10,tau1=T1/10;
  function lonAt(tau){
    const earthPos=vsopPlanetPos(VSOP.earth,tau);
    const key=planet.toLowerCase();
    if(!VSOP[key])return null;
    return toGeocentric(vsopPlanetPos(VSOP[key],tau),earthPos);
  }
  const lon0=lonAt(tau0),lon1=lonAt(tau1);
  if(lon0===null||lon1===null)return{retrograde:false,speedRatio:1};
  let delta=lon1-lon0;
  if(delta>180)delta-=360; if(delta<-180)delta+=360;
  const dailyMotion=delta/2;
  const avgMotion={Mars:0.524,Mercury:1.383,Jupiter:0.083,Venus:1.2,Saturn:0.034}[planet]||1;
  return{retrograde:dailyMotion<0,speedRatio:Math.abs(dailyMotion)/avgMotion};
}


function calcShadbala(planetData,houseMap,birthInfo){
  const{hourDecimal,weekday,isDayBirth,navamsaSigns,retrograde,declinations,speedRatios}=birthInfo;
  const planetHouses={};
  SHADBALA_PLANETS.forEach(p=>{planetHouses[p]=planetData[p].house});
  const results={};
  SHADBALA_PLANETS.forEach(planet=>{
    const d=planetData[planet];
    const sthana=sthanaBala(planet,d.sign,d.deg,d.house,navamsaSigns[planet],planetHouses);
    const dig=digBala(planet,d.house);
    const kala=kalaBala(planet,hourDecimal,planetData.Moon.lon,planetData.Sun.lon,weekday,declinations[planet]||0,isDayBirth);
    const cheshta=cheshtaBala(planet,retrograde[planet],speedRatios[planet]);
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
    else if(planet==='Moon')cheshtaEquiv=s.kala.paksha;
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

