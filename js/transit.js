/* ============================================================
   TRANSIT (GOCHARA) ANALYSIS
   Current (or any chosen date/time) sidereal planetary positions,
   overlaid against a natal chart: house-from-Lagna, house-from-Moon
   (the classical Gochara reference point), classical Gochara good/
   challenging houses per planet, Sade Sati / Dhaiya detection, and
   transit-to-natal drishti (aspects). Pure calculation - no DOM.
   Rendered by renderTransitTab() in render-tabs.js, drawn on the
   wheel by drawTransitOverlay() in render-chart.js.
   ============================================================ */

// Sidereal transit positions for all 9 grahas at a given moment, using the same VSOP87D/Lahiri
// pipeline as the natal chart (allPlanets/sid/lahiriAyanamsa, ephemeris.js/ephemeris-cont.js).
// dateObj's UTC fields are used directly (no timezone input needed for a "current sky" snapshot).
function calcTransitPositions(dateObj){
  const yr=dateObj.getUTCFullYear(),mo=dateObj.getUTCMonth()+1,dy=dateObj.getUTCDate();
  const hr=dateObj.getUTCHours()+dateObj.getUTCMinutes()/60+dateObj.getUTCSeconds()/3600;
  const jd=julianDay(yr,mo,dy,hr);
  const T=(jd-2451545.0)/36525;
  const ayan=lahiriAyanamsa(jd);
  const trop=allPlanets(jd,T);
  const sidMap={};
  for(const p in trop)sidMap[p]=sid(trop[p],ayan);
  sidMap.Ketu=sid(trop.Ketu,ayan);
  const planetData={};
  PLANETS.forEach(p=>{
    const l=sidMap[p];
    planetData[p]={lon:l,sign:getSign(l),deg:getDeg(l),nakshatra:getNakshatra(l)};
  });
  return{jd,ayan,planetData};
}

// Classical Gochara (transit) good/challenging houses counted from the natal MOON sign - the
// traditional Chandra Rashi Gochara reference point. Houses not listed for a planet are read as
// mixed/neutral. Exact house-lists vary somewhat by classical author; this follows a commonly cited
// convention (disclosed in GOCHARA_METHODOLOGY below), matching this app's existing practice of
// disclosing where a classical technique has more than one textual version.
const GOCHARA_HOUSES={
  Sun:{good:[3,6,10,11],challenging:[1,4,7,8,9,12]},
  Moon:{good:[1,3,6,7,10,11],challenging:[4,8,9,12]},
  Mars:{good:[3,6,11],challenging:[1,2,4,7,8,12]},
  Mercury:{good:[2,4,6,8,10,11],challenging:[1,5,7,9,12]},
  Jupiter:{good:[2,5,7,9,11],challenging:[1,3,4,6,8,10,12]},
  Venus:{good:[1,2,3,4,5,8,9,11],challenging:[6,7,10,12]},
  Saturn:{good:[3,6,11],challenging:[1,2,4,8,12]},
  Rahu:{good:[3,6,11],challenging:[1,5,7,9,12]},
  Ketu:{good:[3,6,11],challenging:[1,5,7,9,12]}
};

function calcGocharaPhala(planet,houseFromMoon){
  const table=GOCHARA_HOUSES[planet];
  if(!table)return{verdict:'neutral',label:'Mixed'};
  if(table.good.includes(houseFromMoon))return{verdict:'good',label:'Favourable'};
  if(table.challenging.includes(houseFromMoon))return{verdict:'challenging',label:'Testing'};
  return{verdict:'neutral',label:'Mixed'};
}

// Sade Sati (Saturn in the 12th/1st/2nd from natal Moon - Rising/Peak/Setting phases of the
// classical ~7.5-year cycle) and the two minor Dhaiya periods (4th and 8th from Moon).
function calcSaturnSpecialPhase(houseFromMoon){
  if(houseFromMoon===12)return{name:'Sade Sati',phase:'Rising phase',desc:'Saturn is transiting the 12th house from your natal Moon — the first of three Sade Sati phases. Classically a build-up period: added responsibility, expense, or introspection ahead of the cycle\'s peak.'};
  if(houseFromMoon===1)return{name:'Sade Sati',phase:'Peak phase',desc:'Saturn is transiting your natal Moon\'s own sign — the peak of Sade Sati. Classically the most intensely felt phase, testing identity, health, and direction most directly.'};
  if(houseFromMoon===2)return{name:'Sade Sati',phase:'Setting phase',desc:'Saturn is transiting the 2nd house from your natal Moon — the final Sade Sati phase. Often brings family, finance, and speech-related lessons before the cycle eases.'};
  if(houseFromMoon===4)return{name:'Ardhashtama Shani (Dhaiya)',phase:null,desc:'Saturn is transiting the 4th house from your natal Moon — a minor roughly 2.5-year "Dhaiya" period, classically testing home, mother, and inner peace.'};
  if(houseFromMoon===8)return{name:'Ashtama Shani (Dhaiya)',phase:null,desc:'Saturn is transiting the 8th house from your natal Moon — a minor roughly 2.5-year "Dhaiya" period, classically testing transformation, shared resources, and sudden change.'};
  return null;
}

// Transit-to-natal drishti: each transit planet's house is found relative to the natal Lagna (the
// same whole-sign house frame the rest of this app uses), then ASPECT_OFFSETS + aspectGradeVirupa
// (shadbala-dashas.js) grade which natal houses it aspects from that transit position.
function calcTransitAspectsOnNatal(transitPlanetData,lagnaSign){
  const results=[];
  PLANETS.forEach(p=>{
    if(!ASPECT_OFFSETS[p])return;
    const transitSign=transitPlanetData[p].sign;
    const fromHouse=((transitSign-lagnaSign+12)%12)+1;
    ASPECT_OFFSETS[p].forEach(offset=>{
      const toHouse=((fromHouse-1+offset-1)%12)+1;
      const grade=aspectGradeVirupa(p,offset);
      if(grade<=0)return;
      results.push({planet:p,fromHouse,toHouse,grade});
    });
  });
  return results;
}

const GOCHARA_METHODOLOGY='Gochara (transit) analysis reads the CURRENT positions of the planets against a birth chart to gauge what a period is likely to activate. This tool uses the classical Chandra Rashi method — houses are counted from the natal MOON sign, not the Ascendant, since that is the traditional Gochara reference point (the Lagna-based house is also shown for reference, since some modern practitioners check both). The good/challenging house-list per planet follows a commonly cited convention; several classical authors give slightly different lists, especially for the faster-moving and node planets, so treat the verdicts here as one widely-used reading rather than the only one. Saturn\'s Sade Sati (12th/1st/2nd from Moon) and the two Dhaiya periods (4th/8th from Moon) are called out specifically since they are among the most consistently cited Gochara effects across traditions. Transit-to-natal aspects use the same graded Drishti system (Full/Three-quarter/Half/Quarter) used elsewhere in this app.';
