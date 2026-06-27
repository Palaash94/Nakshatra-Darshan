/* ============================================================
   EPHEMERIS & CORE REFERENCE DATA
   Signs, planet dignities/relations, icon path definitions,
   nakshatras, dasha order, and core date/math helper functions.
   (VSOP87 planetary series data lives separately in vsop-data.js)
   ============================================================ */

const SIGNS=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const SIGN_ABBR=['ARI','TAU','GEM','CAN','LEO','VIR','LIB','SCO','SAG','CAP','AQU','PIS'];
const SIGN_LORD=['Mars','Venus','Mercury','Moon','Sun','Mercury','Venus','Mars','Jupiter','Saturn','Saturn','Jupiter'];

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
const PLANET_ICON_PATHS={
  Sun:{circle:{cx:12,cy:12,r:3.6},path:'M12 2.5L12 5.2|M12 18.8L12 21.5|M2.5 12L5.2 12|M18.8 12L21.5 12|M5.3 5.3L7.2 7.2|M16.8 16.8L18.7 18.7|M18.7 5.3L16.8 7.2|M7.2 16.8L5.3 18.7'},
  Moon:{fillPath:'M16 4a9.5 9.5 0 1 0 0 16 11 11 0 0 1 0-16z'},
  Mars:{circle:{cx:9.5,cy:14.5,r:5.2},path:'M13.2 10.8L19.5 4.5M14.8 4.5h4.7v4.7'},
  Mercury:{circle:{cx:12,cy:11.2,r:4.6},ring:{cx:12,cy:3.6,r:1.5},path:'M12 15.8v5.2|M9.2 19.6h5.6'},
  Jupiter:{path:'M5.5 7.5c0-2.5 2-4.3 4.3-4.3s4 1.7 4 3.8c0 2-1.4 3.4-3.5 3.4H4.8|M10 2.6v18|M6.4 15.2h7.2'},
  Venus:{fillCircle:{cx:12,cy:8.2,r:5.7},path:'M12 14.6v6.3|M8.8 18.1h6.4'},
  Saturn:{circle:{cx:11,cy:13.5,r:5},ellipse:{cx:11,cy:13.5,rx:10,ry:2.4,rotate:-17}},
  Rahu:{dot:{cx:12,cy:8,r:1.2},path:'M4 17.5c0-7.5 5-12.5 8-12.5s8 5 8 12.5|M4 17.5a4 4 0 0 0 4 4|M20 17.5a4 4 0 0 1-4 4'},
  Ketu:{path:'M4 6.5c0 7.5 5 12.5 8 12.5s8-5 8-12.5|M4 6.5a4 4 0 0 1 4-4|M20 6.5a4 4 0 0 0-4-4|M12 19v3.5'}
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
const PLANETS=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
const PLANET_SYM={Sun:'Su',Moon:'Mo',Mars:'Ma',Mercury:'Me',Jupiter:'Ju',Venus:'Ve',Saturn:'Sa',Rahu:'Ra',Ketu:'Ke'};
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
