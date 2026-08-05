/* ============================================================
   EPHEMERIS & CORE REFERENCE DATA
   Signs, planet dignities/relations, icon path definitions,
   nakshatras, dasha order, and core date/math helper functions.
   (VSOP87 planetary series data lives separately in vsop-data.js)
   ============================================================ */

const SIGNS=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const SIGN_ABBR=['ARI','TAU','GEM','CAN','LEO','VIR','LIB','SCO','SAG','CAP','AQU','PIS'];
const SIGN_LORD=['Mars','Venus','Mercury','Moon','Sun','Mercury','Venus','Mars','Jupiter','Saturn','Saturn','Jupiter'];
// One-word keyword per sign, used by the Big Three hero cards on the Chart tab (a Co-Star-style
// "in one word" caption rather than a full paragraph).
const SIGN_TRAIT=['Bold','Steady','Curious','Nurturing','Radiant','Precise','Harmonious','Intense','Adventurous','Disciplined','Visionary','Dreamy'];

// Natural friendship (Naisargika Maitri) per classical BPHS - asymmetric matrix
const NATURAL_FRIENDS={
  Sun:{friends:['Moon','Mars','Jupiter'],neutrals:['Mercury'],enemies:['Venus','Saturn']},
  Moon:{friends:['Sun','Mercury'],neutrals:['Mars','Jupiter','Venus','Saturn'],enemies:[]},
  Mars:{friends:['Sun','Moon','Jupiter'],neutrals:['Venus','Saturn'],enemies:['Mercury']},
  Mercury:{friends:['Sun','Venus'],neutrals:['Mars','Jupiter','Saturn'],enemies:['Moon']},
  Jupiter:{friends:['Sun','Moon','Mars'],neutrals:['Saturn'],enemies:['Mercury','Venus']},
  Venus:{friends:['Mercury','Saturn'],neutrals:['Mars','Jupiter'],enemies:['Sun','Moon']},
  Saturn:{friends:['Mercury','Venus'],neutrals:['Jupiter'],enemies:['Sun','Moon','Mars']},
  Rahu:{friends:['Jupiter','Venus','Saturn'],neutrals:['Mercury'],enemies:['Sun','Moon','Mars']},
  Ketu:{friends:['Mars','Venus','Saturn'],neutrals:['Mercury','Jupiter'],enemies:['Sun','Moon']}
};
function naturalRelation(p1,p2){
  if(p1===p2)return'self';
  const rel=NATURAL_FRIENDS[p1];
  if(!rel)return'neutral';
  if(rel.friends.includes(p2))return'friend';
  if(rel.enemies.includes(p2))return'enemy';
  return'neutral';
}

// Exaltation / debilitation degree (sign index, degree within sign)
const EXALTATION={Sun:{sign:0,deg:10},Moon:{sign:1,deg:3},Mars:{sign:9,deg:28},Mercury:{sign:5,deg:15},Jupiter:{sign:3,deg:5},Venus:{sign:11,deg:27},Saturn:{sign:6,deg:20}};
const DEBILITATION={Sun:{sign:6,deg:10},Moon:{sign:7,deg:3},Mars:{sign:3,deg:28},Mercury:{sign:11,deg:15},Jupiter:{sign:9,deg:5},Venus:{sign:5,deg:27},Saturn:{sign:0,deg:20}};
// Own signs per planet (multiple for 5 classical planets with 2 signs each)
const OWN_SIGNS={Sun:[4],Moon:[3],Mars:[0,7],Mercury:[2,5],Jupiter:[8,11],Venus:[1,6],Saturn:[9,10]};
// Moolatrikona sign (subset of own sign, classical primary sign)
const MOOLATRIKONA={Sun:4,Moon:3,Mars:0,Mercury:5,Jupiter:8,Venus:6,Saturn:9};

function getDignity(planet,signIdx,degInSign){
  if(planet==='Rahu'||planet==='Ketu')return null;
  const ex=EXALTATION[planet],db=DEBILITATION[planet];
  if(ex&&ex.sign===signIdx)return'exalted';
  if(db&&db.sign===signIdx)return'debilitated';
  if(MOOLATRIKONA[planet]===signIdx)return'moolatrikona';
  if(OWN_SIGNS[planet]&&OWN_SIGNS[planet].includes(signIdx))return'own';
  return null;
}

// Compound (Panchadha/5-fold) relationship: combines natural friendship with placement-based dignity
// Simplified per classical convention: exaltation lord treated as friend override; otherwise natural relation stands,
// refined by temporary (Tatkala) friendship based on house distance from each other
function compoundRelation(planet,signIdx,allPlanetHouses,planetHouse){
  if(planet==='Rahu'||planet==='Ketu'){
    const dignity=null;
    return{relation:naturalSelfRelation(planet),dignity};
  }
  const signLord=SIGN_LORD[signIdx];
  const dignity=getDignity(planet,signIdx,0);
  // Exalted/own/moolatrikona always reads as strong regardless of lord friendship
  if(dignity==='exalted')return{relation:'friend',dignity};
  if(dignity==='debilitated')return{relation:'enemy',dignity};
  if(dignity==='own'||dignity==='moolatrikona')return{relation:'friend',dignity};
  // Otherwise: relation to the sign's lord (natural friendship as proxy for compound, since full Tatkala needs all planet positions)
  if(planet===signLord)return{relation:'friend',dignity:'own'};
  const rel=naturalRelation(planet,signLord);
  return{relation:rel,dignity};
}
function naturalSelfRelation(){return'neutral'}
const SIGN_ICON_PATHS=[
  'M5 9 Q5 4 8 4 Q11 4 11 8 L11 20 M11 8 Q11 4 14 4 Q17 4 17 9',
  'M6 7 Q6 3 12 5 Q18 3 18 7',
  'M7 4v16M17 4v16M5 4h4M15 4h4M5 20h4M15 20h4',
  'M16 7a4 4 0 1 0-4 4M8 17a4 4 0 1 0 4-4',
  'M9 10.2v4.3a5.5 5.5 0 0 0 5.5 5.5 3.5 3.5 0 0 0 3.5-3.5c0-2.5-2.3-3.2-2.3-6a3.7 3.7 0 0 0-3.7-3.7',
  'M3 4v10a3 3 0 0 0 6 0V4M9 4v14a3 3 0 0 0 6 0V4M15 4v10a3 3 0 0 0 3 3c1.7 0 3-1.3 3-3s-1.3-3-3-3',
  'M4 17h16M4 17a8 4 0 0 1 16 0M12 17V8M9 5l3-3 3 3',
  'M3 5v9a3 3 0 0 0 6 0V5M9 5v12a3 3 0 0 0 6 0V5M15 5v9a3 3 0 0 0 3 3|M18 17l3 3M21 17l-3 3',
  'M4 20L20 4M11 4h9v9M8 13l3 3',
  'M5 4v13a3 3 0 1 0 3-3H4M14 4v16M14 8a4 4 0 1 1 0 8',
  'M3 9q3-3 6 0t6 0 6 0M3 15q3-3 6 0t6 0 6 0',
  'M7 3.5q-3 4 0 8.5t0 8.5M17 3.5q3 4 0 8.5t0 8.5M3.5 12h17'
];
const SIGN_EXTRA_CIRCLE=[null,{cx:12,cy:15,r:6},null,null,{cx:9,cy:7,r:3.2},null,null,null,null,null,null,null];
// Each glyph follows its classical astrological symbol (circle+dot for the Sun, crescent for the
// Moon, the alchemical marks for Mercury/Jupiter/Venus/Saturn, arrowed circle for Mars, mirrored
// arch/valley + head/tail dot for Rahu/Ketu) rendered in one consistent thin-line style, so the set
// reads as a single refined glyph family rather than mismatched clip-art — while still staying
// distinguishable by silhouette alone, since only a single flat color is ever passed in.
const PLANET_ICON_PATHS={
  Sun:{circle:{cx:12,cy:12,r:6},dot:{cx:12,cy:12,r:1.6}},
  Moon:{fillPath:'M15.3 4.3a7.8 7.8 0 1 0 0 15.4 9.4 9.4 0 0 1 0-15.4z'},
  Mars:{circle:{cx:9,cy:15,r:5.3},path:'M12.7 11.3L18 6',fillPath:'M19 5L17.1 10.1L13.9 6.9Z'},
  Mercury:{circle:{cx:12,cy:13,r:4},path:'M8.6 6.2a3.4 3.4 0 0 0 6.8 0|M12 17v4.3|M9.2 19.6h5.6'},
  Jupiter:{path:'M5 8.2c0-3.1 2.5-5.2 5.1-5.2 2.7 0 4.9 1.9 4.9 4.3 0 2.2-1.7 3.7-4 3.7H4.3|M15.5 3v18|M11.5 14.5h8'},
  Venus:{circle:{cx:12,cy:8,r:4.4},path:'M12 12.4v7.4|M8.8 17.4h6.4'},
  Saturn:{path:'M8 4h7|M11.5 4v11.5c0 2.8 2.2 4.7 4.8 4.2'},
  Rahu:{dot:{cx:12,cy:5.5,r:1.6},path:'M4.8 19.2c0-6.6 3.6-10.7 7.2-10.7s7.2 4.1 7.2 10.7|M4.8 19.2a3.2 3.2 0 0 0 3.2 3.2|M19.2 19.2a3.2 3.2 0 0 1-3.2 3.2'},
  Ketu:{dot:{cx:12,cy:22.2,r:1.4},path:'M4.8 4.8c0 6.6 3.6 10.7 7.2 10.7s7.2-4.1 7.2-10.7|M4.8 4.8a3.2 3.2 0 0 1 3.2-3.2|M19.2 4.8a3.2 3.2 0 0 0-3.2-3.2|M12 15.5v6'}
};

function signIconSvg(signIdx,size,color,opacity){
  const extra=SIGN_EXTRA_CIRCLE[signIdx];
  const circlePart=extra?`<circle cx="${extra.cx}" cy="${extra.cy}" r="${extra.r}" fill="none" stroke="${color}" stroke-width="1.5"/>`:'';
  const pathStr=SIGN_ICON_PATHS[signIdx];
  const pathsArr=pathStr.split('|').map(d=>`<path d="${d}" stroke="${color}" stroke-width="1.5" fill="none" stroke-linecap="round"/>`).join('');
  return`<svg width="${size}" height="${size}" viewBox="0 0 24 24" style="opacity:${opacity}">${circlePart}${pathsArr}</svg>`;
}

function planetIconSvg(planet,size,color,opacity){
  const def=PLANET_ICON_PATHS[planet];
  if(!def)return'';
  let inner='';
  if(def.ellipse)inner+=`<ellipse cx="${def.ellipse.cx}" cy="${def.ellipse.cy}" rx="${def.ellipse.rx}" ry="${def.ellipse.ry}" fill="none" stroke="${color}" stroke-width="${def.ellipse.strokeWidth||1.1}" transform="rotate(${def.ellipse.rotate} ${def.ellipse.cx} ${def.ellipse.cy})"/>`;
  if(def.circle)inner+=`<circle cx="${def.circle.cx}" cy="${def.circle.cy}" r="${def.circle.r}" fill="none" stroke="${color}" stroke-width="${def.circle.strokeWidth||1.4}"/>`;
  if(def.ring)inner+=`<circle cx="${def.ring.cx}" cy="${def.ring.cy}" r="${def.ring.r}" fill="none" stroke="${color}" stroke-width="${def.ring.strokeWidth||1.3}"/>`;
  if(def.fillCircle)inner+=`<circle cx="${def.fillCircle.cx}" cy="${def.fillCircle.cy}" r="${def.fillCircle.r}" fill="${color}" stroke="none"/>`;
  if(def.fillPath)inner+=`<path d="${def.fillPath}" fill="${color}" stroke="none"/>`;
  if(def.dot)inner+=`<circle cx="${def.dot.cx}" cy="${def.dot.cy}" r="${def.dot.r}" fill="${color}" stroke="none"/>`;
  if(def.path)inner+=def.path.split('|').map(d=>`<path d="${d}" stroke="${color}" stroke-width="1.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`).join('');
  return`<svg width="${size}" height="${size}" viewBox="0 0 24 24" style="opacity:${opacity}">${inner}</svg>`;
}

// Renders a moon-phase disc (crescent/quarter/gibbous/full) for a given illuminated fraction
// (0 = new moon, 1 = full moon) via the standard two-arc terminator trick: the outer arc is a
// fixed half-circle, the inner arc's rx shrinks to 0 at half-moon and grows back out toward the
// far edge at either new or full, flipping concavity at the 0.5 mark. `waxing` mirrors which side
// lights up. Used by the Panchang Tithi card so the icon matches the actual lunar day.
function moonPhaseSvg(illumFrac,waxing,size,color){
  const r=9,cx=12,cy=12;
  const f=Math.max(0,Math.min(1,illumFrac));
  const rx=Math.abs(f-0.5)*2*r;
  const innerSweep=f<0.5?0:1;
  const path=`M${cx} ${(cy-r).toFixed(2)} A${r} ${r} 0 0 1 ${cx} ${(cy+r).toFixed(2)} A${rx.toFixed(2)} ${r} 0 0 ${innerSweep} ${cx} ${(cy-r).toFixed(2)} Z`;
  const transform=waxing?'':`scale(-1,1) translate(-24,0)`;
  return`<svg width="${size}" height="${size}" viewBox="0 0 24 24"><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="1" opacity="0.3"/><g transform="${transform}"><path d="${path}" fill="${color}"/></g></svg>`;
}
const PLANETS=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
const PLANET_SYM={Sun:'Su',Moon:'Mo',Mars:'Ma',Mercury:'Me',Jupiter:'Ju',Venus:'Ve',Saturn:'Sa',Rahu:'Ra',Ketu:'Ke'};

// Subtle transparent watermark backgrounds for each classical Tatva (element), used behind the
// Birth Star card so the card's dominant element is felt visually, not just stated in text.
// Built from the same alchemical triangle glyph as tatvaMiniIconSvg (render-tabs.js) - just scaled
// up and set inside a seal ring with compass ticks, echoing the site's favicon/hero-icon motif -
// rather than a separate literal flame/mountain/droplet illustration that would clash with it.
function tatvaSealRing(){
  const cx=150,cy=70,r=58,ticks=[0,90,180,270].map(a=>{
    const rad=(a-90)*Math.PI/180;
    const x1=cx+r*Math.cos(rad),y1=cy+r*Math.sin(rad);
    const x2=cx+(r+9)*Math.cos(rad),y2=cy+(r+9)*Math.sin(rad);
    return`<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="currentColor" stroke-width="1"/>`;
  }).join('');
  return`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="currentColor" stroke-width="1"/>${ticks}`;
}
const TATVA_BG_GLYPH={
  Fire:'<path d="M150 20L92.3 120H207.7Z" fill="none" stroke="currentColor" stroke-width="2"/>',
  Water:'<path d="M92.3 20H207.7L150 120Z" fill="none" stroke="currentColor" stroke-width="2"/>',
  Air:'<path d="M150 20L92.3 120H207.7Z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M109.6 90H190.4" stroke="currentColor" stroke-width="2"/>',
  Earth:'<path d="M92.3 20H207.7L150 120Z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M109.6 50H190.4" stroke="currentColor" stroke-width="2"/>'
};
function tatvaBackgroundSvg(tatva){
  const glyph=TATVA_BG_GLYPH[tatva];
  if(!glyph)return'';
  return`<svg class="tatva-bg" viewBox="0 0 200 140" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${tatvaSealRing()}${glyph}</svg>`;
}

const NAKSHATRAS=['Ashwini','Bharani','Krittika','Rohini','Mrigashira','Ardra','Punarvasu','Pushya','Ashlesha','Magha','Purva Phalguni','Uttara Phalguni','Hasta','Chitra','Swati','Vishakha','Anuradha','Jyeshtha','Mula','Purva Ashadha','Uttara Ashadha','Shravana','Dhanishtha','Shatabhisha','Purva Bhadrapada','Uttara Bhadrapada','Revati'];
const NAK_LORDS=['Ke','Ve','Su','Mo','Ma','Ra','Ju','Sa','Me','Ke','Ve','Su','Mo','Ma','Ra','Ju','Sa','Me','Ke','Ve','Su','Mo','Ma','Ra','Ju','Sa','Me'];

// Core trait keywords per nakshatra - used to generate outer (Lagna) and inner (Moon) personality narrative
const NAKSHATRA_TRAITS={
  Ashwini:'quick, energetic, pioneering, and eager to act before others',
  Bharani:'intense, determined, and carrying a deep sense of responsibility for others',
  Krittika:'sharp, purposeful, and cutting straight to what matters',
  Rohini:'magnetic, sensual, and quietly persuasive',
  Mrigashira:'curious, searching, and restless until the next discovery',
  Ardra:'intense, transformative, and drawn to truth even when it is uncomfortable',
  Punarvasu:'renewing, optimistic, and able to start over with grace',
  Pushya:'nurturing, steady, and instinctively protective of others',
  Ashlesha:'penetrating, perceptive, and quietly strategic',
  Magha:'regal, proud, and driven by a sense of legacy',
  'Purva Phalguni':'warm, pleasure-loving, and creatively expressive',
  'Uttara Phalguni':'generous, reliable, and quietly leader-like',
  Hasta:'skillful, resourceful, and good with the hands and with people',
  Chitra:'charismatic, visually attuned, and drawn to making an impression',
  Swati:'independent, adaptable, and uncomfortable being boxed in',
  Vishakha:'ambitious, driven, and torn between personal goals and devotion to something larger',
  Anuradha:'devoted, disciplined, and deeply loyal once trust is earned',
  Jyeshtha:'commanding, protective, and carrying natural authority',
  Mula:'investigative, root-seeking, and unafraid to dismantle what no longer works',
  'Purva Ashadha':'invincible-feeling, proud, and energized by a cause worth fighting for',
  'Uttara Ashadha':'principled, enduring, and quietly unstoppable once committed',
  Shravana:'attentive, learned, and gifted at listening and absorbing wisdom',
  Dhanishtha:'rhythmic, ambitious, and driven toward wealth, music, or recognition',
  Shatabhisha:'unconventional, healing-oriented, and secretive about its depths',
  'Purva Bhadrapada':'intense, idealistic, and prone to inner fire about what is right',
  'Uttara Bhadrapada':'deep, calm on the surface, with profound undercurrents',
  Revati:'gentle, nurturing, and guided by an instinct to help others reach safety'
};

const DASHA_YRS={Ke:7,Ve:20,Su:6,Mo:10,Ma:7,Ra:18,Ju:16,Sa:19,Me:17};
const DASHA_ORDER=['Ke','Ve','Su','Mo','Ma','Ra','Ju','Sa','Me'];
const DASHA_LORD_FULLNAME={Ke:'Ketu',Ve:'Venus',Su:'Sun',Mo:'Moon',Ma:'Mars',Ra:'Rahu',Ju:'Jupiter',Sa:'Saturn',Me:'Mercury'};

// Standard Vedic drishti (graha aspects) - house offsets each planet casts FROM its own house.
// Shared reference data: used by the chart-wheel drishti overlay (render-chart.js), Shadbala's
// Drik Bala / Bhava Bala (shadbala-dashas.js), and transit-to-natal aspect analysis (transit.js).
const ASPECT_OFFSETS={
  Sun:[7],Moon:[7],Mercury:[7],Venus:[7],
  Mars:[4,7,8],
  Jupiter:[5,7,9],
  Saturn:[3,7,10],
  Rahu:[5,7,9],
  Ketu:[5,7,9]
};
