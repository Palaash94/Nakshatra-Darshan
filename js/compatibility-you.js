/* ============================================================
   COMPATIBILITY - COMBINED "YOU" & LIFE-AREA TABLE (COUPLE MODE)
   Two more couple-specific views layered on top of ashtakoot.js and
   compatibility-extra.js:

     1. A combined "You" section - the couple counterpart to the
        individual You tab (you-tab.js). Instead of one card per D1
        planet describing a single chart, each card here holds BOTH
        partners' placement for that planet side by side, opens with
        what the planet generally rules, states each partner's own
        placement, then closes with a genuine synthesis sentence
        (same sign / same element / classical angle) plus a sign-
        lord-friendship nudge, so the read is explicitly comparative
        rather than two solo paragraphs stapled together. Reuses
        SIGN_TRAIT_PHRASE and PLANET_WORD from you-tab.js instead of
        duplicating trait language.
     2. A Life-Area Compatibility Table - a quick-glance, Co-Star-
        style set of horizontal bars (one per classical personal/
        social planet, relabelled to its everyday life-area) showing
        each axis's score against a fixed "average pairing" baseline.
        A disclosed simplification: sign-distance between the two
        partners' placements (same convention as the Venus-Mars read
        in compatibility-extra.js) blended with a small nudge from
        whether the two placements' sign-lords are natural friends,
        NOT a classical technique on its own.

   Pure calculation + HTML string builders - no DOM. Rendered by
   renderCompatibilityTab() in render-tabs.js.
   ============================================================ */

// ---------------- Combined "You" section ----------------

// What each planet generally rules - shown once per card, ahead of either partner's specific
// placement, the same role the opening sentence plays in a mainstream "both signs" comparison card.
const COUPLE_PLANET_INTRO={
  Sun:"The Sun rules identity, ego, and how each of you shines. It's the core self both of you are quietly organised around.",
  Moon:"The Moon rules emotions, moods, and comfort. It's the self each of you retreats to when no one else is watching, and the one most in charge of how safe this relationship actually feels day to day.",
  Mercury:"Mercury rules thought, communication, and how information moves between two people. It shapes how each of you talks, listens, and argues.",
  Venus:"Venus rules love, beauty, and pleasure. It shapes what each of you finds attractive and how each of you shows affection.",
  Mars:"Mars rules drive, desire, and conflict. It shapes how each of you goes after what you want, and how each of you fights.",
  Jupiter:"Jupiter rules growth, belief, and luck. It shapes what each of you is optimistic about, and how each of you tends to grow.",
  Saturn:"Saturn rules discipline, fear, and responsibility. It shapes what each of you takes seriously, and where each of you feels tested.",
  Rahu:"Rahu is a shadow point of hunger and reinvention, not a physical planet. It shapes what each of you chases, sometimes without fully knowing why.",
  Ketu:"Ketu is a shadow point of release and detachment, the other end of Rahu's axis. It shapes what each of you lets go of without much of a fight."
};

// One sentence naming a specific partner's placement for this planet - written with the verb form
// already conjugated for a proper name (always third-person singular), so this never needs the
// same "shape who you are" phrasing you-tab.js uses for direct address. `seed` (a partner-specific,
// degree-derived value from planetCoupleParagraph) picks the sign-trait variant via signTraitPhrase
// so two different couples sharing a placement don't read back identical prose.
const COUPLE_PLANET_CLAUSE={
  Sun:(name,sign,seed)=>`${name}'s Sun is in ${SIGNS[sign]}, so ${name}'s identity leans on ${signTraitPhrase(sign,seed)}.`,
  Moon:(name,sign,seed)=>`${name}'s Moon is in ${SIGNS[sign]}, so ${name}'s emotional world runs on ${signTraitPhrase(sign,seed)}.`,
  Mercury:(name,sign,seed)=>`${name}'s Mercury is in ${SIGNS[sign]}, so ${name} thinks and communicates through ${signTraitPhrase(sign,seed)}.`,
  Venus:(name,sign,seed)=>`${name}'s Venus is in ${SIGNS[sign]}, so ${name} loves through ${signTraitPhrase(sign,seed)}.`,
  Mars:(name,sign,seed)=>`${name}'s Mars is in ${SIGNS[sign]}, so ${name} pushes and pursues through ${signTraitPhrase(sign,seed)}.`,
  Jupiter:(name,sign,seed)=>`${name}'s Jupiter is in ${SIGNS[sign]}, so ${name} grows and believes through ${signTraitPhrase(sign,seed)}.`,
  Saturn:(name,sign,seed)=>`${name}'s Saturn is in ${SIGNS[sign]}, so ${name}'s sense of duty is built on ${signTraitPhrase(sign,seed)}.`,
  Rahu:(name,sign,seed)=>`${name}'s Rahu is in ${SIGNS[sign]}, so ${name} chases ${signTraitPhrase(sign,seed)}, often without quite knowing why.`,
  Ketu:(name,sign,seed)=>`${name}'s Ketu is in ${SIGNS[sign]}, so ${name} lets go of things through ${signTraitPhrase(sign,seed)}, almost instinctively.`
};

// Classifies the angle between two placements the same way the Venus-Mars synastry read in
// compatibility-extra.js does (sign-distance), plus a same-element fallback for anything that
// doesn't land on a named classical angle, since "different sign, same element" is still a
// genuinely different, milder read than "unrelated".
function planetCoupleRelation(signA,signB){
  if(signA===signB)return'same';
  const dist=((signB-signA+12)%12)+1;
  if(dist===5||dist===9)return'trine';
  if(dist===4||dist===10)return'square';
  if(dist===7)return'opposition';
  if(dist===3||dist===11)return'sextile';
  if(RASHI_TATVA[signA]===RASHI_TATVA[signB])return'element';
  return'neutral';
}
// Closing synthesis line - what the angle between the two placements actually MEANS for the couple,
// phrased around the planet's own bare theme word (PLANET_WORD, you-tab.js) so the same six relation
// banks read as genuinely planet-specific rather than a copy-pasted generic verdict.
const COUPLE_SYNTHESIS={
  same:word=>[`You share the same placement here, so your sense of ${word} barely needs translating between you, it already matches.`,
              `Landing in the same sign here means this axis of ${word} is basically the same language for both of you.`,
              `There's no translation needed here, ${word} already speaks the same language for both of you.`,
              `This one just matches, ${word} isn't something you'll need to negotiate between you.`],
  element:word=>[`Different signs, but the same underlying element, so your approach to ${word} feels instinctively familiar even where the details differ.`,
                 `You're not identical here, but you're built from the same elemental material, ${word} shows up in a compatible register even when the specifics diverge.`,
                 `The specifics differ, but the underlying material is the same, ${word} still feels instinctively compatible.`,
                 `Not a literal match, but close enough in spirit that ${word} rarely feels foreign between you.`],
  trine:word=>[`This is an easy angle between you, your styles of ${word} support each other naturally, without much translation needed.`,
               `A naturally flowing angle here, ${word} tends to move smoothly between the two of you rather than needing to be negotiated.`,
               `${word} tends to just work here, one of the genuinely easier threads running between you.`,
               `This angle asks little of either of you, ${word} moves smoothly without much active effort.`],
  sextile:word=>[`A workable, mildly supportive angle, your approaches to ${word} aren't identical, but they cooperate more often than not.`,
                 `There's a quiet ease to this angle, ${word} isn't a major friction point between you, more a gentle background compatibility.`,
                 `Not headline chemistry, but a real, quiet cooperation around ${word} all the same.`,
                 `${word} isn't where the sparks fly, but it's steady, dependable background support.`],
  square:word=>[`This is a charged angle, your instincts around ${word} genuinely differ, and it can take real, ongoing effort to find a shared rhythm.`,
                `A friction-prone angle, ${word} is somewhere the two of you are more likely to have to work at understanding each other than have it come naturally.`,
                `${word} is where the two of you are least alike, worth naming honestly rather than smoothing over.`,
                `Expect real, recurring friction around ${word}, the kind that needs active work rather than hoping it resolves.`],
  opposition:word=>[`A polarised angle, you sit at opposite ends of how ${word} shows up, which can mean real magnetism or real friction, often both at once.`,
                    `Opposite placements here mean ${word} pulls you toward each other and away from each other in roughly equal measure, rarely neutral.`,
                    `${word} swings between real attraction and real friction here, rarely settling in the middle.`,
                    `You complete each other around ${word} as much as you clash, both are true at once.`],
  neutral:word=>[`Not a strongly wired angle either way, ${word} isn't a major source of friction or automatic ease between you, mostly it's what you make of it.`,
                 `A quieter angle overall, ${word} isn't heavily activated between your two charts, more background than headline.`,
                 `${word} isn't strongly activated between you either way, mostly it depends on what you both bring to it.`,
                 `A background axis, ${word} won't make or break this on its own.`]
};
function planetCoupleParagraph(chartDataA,chartDataB,nameA,nameB,p,seed){
  const degA=chartDataA.planetData[p].deg,degB=chartDataB.planetData[p].deg;
  const signA=chartDataA.planetData[p].sign,signB=chartDataB.planetData[p].sign;
  let text=COUPLE_PLANET_INTRO[p]+' ';
  text+=COUPLE_PLANET_CLAUSE[p](nameA,signA,Math.round(degA*97))+' '+COUPLE_PLANET_CLAUSE[p](nameB,signB,Math.round(degB*97)+5)+' ';
  const rel=planetCoupleRelation(signA,signB);
  // Mixes both partners' exact degrees into the seed (not just the planet index) so two different
  // couples sharing the same relation on the same planet don't get an identical synthesis line.
  text+=pickVariant(COUPLE_SYNTHESIS[rel](PLANET_WORD[p]),seed+Math.round((degA+degB)*53));
  if(signA!==signB){
    const lordA=SIGN_LORD[signA],lordB=SIGN_LORD[signB];
    if(lordA===lordB){
      text+=` Both signs share the same ruling planet (${lordA}), which quietly reinforces the connection here even though the signs themselves differ.`;
    }else{
      const relAB=naturalRelation(lordA,lordB),relBA=naturalRelation(lordB,lordA);
      if(relAB==='friend'&&relBA==='friend')text+=` It helps that the signs' rulers, ${lordA} and ${lordB}, are natural friends classically.`;
      else if(relAB==='enemy'&&relBA==='enemy')text+=` Worth knowing: the signs' rulers, ${lordA} and ${lordB}, are classical natural enemies, adding a layer of real effort underneath.`;
    }
  }
  return text;
}

function coupleYouPlanetCardHtml(chartDataA,chartDataB,nameA,nameB,p,seed){
  const signA=chartDataA.planetData[p].sign,signB=chartDataB.planetData[p].sign;
  const photo=PLANET_PHOTO[p];
  const sizeCls=photo.small?' you-planet-bg-photo--small':'';
  const m=photo.mask||{inner:45,outer:76};
  const maskGrad=`radial-gradient(circle at ${photo.position},#000 ${m.inner}%,transparent ${m.outer}%)`;
  const photoStyle=`object-position:${photo.position};-webkit-mask-image:${maskGrad};mask-image:${maskGrad}`;
  const rel=planetCoupleRelation(signA,signB);
  const relLabel={same:'Same Sign',element:'Same Element',trine:'Trine',sextile:'Sextile',square:'Square',opposition:'Opposition',neutral:'Background'}[rel];
  const relColor={same:'#4ade80',element:'#4ade80',trine:'#4ade80',sextile:'#c9a24b',square:'#f87171',opposition:'#c9a24b',neutral:'#666'}[rel];
  return`<div class="shadbala-card you-planet-card">
    <img class="you-planet-bg-photo${sizeCls}" src="img/planets/${photo.file}" alt="" aria-hidden="true" style="${photoStyle}">
    <div class="you-planet-card-inner">
    <div class="shadbala-card-head">
      <div style="flex:1;min-width:0">
        <div class="shadbala-planet-name">${p}</div>
        <div class="seg-sub you-planet-meta">${signIconSvg(signA,13,'#a68b52',0.9)}<span>${nameA}: ${SIGNS[signA]}</span><span class="you-meta-dot">·</span>${signIconSvg(signB,13,'#a68b52',0.9)}<span>${nameB}: ${SIGNS[signB]}</span></div>
      </div>
      <span class="rel-badge" style="background:${relColor}22;color:${relColor};border:1px solid ${relColor}55">${relLabel}</span>
    </div>
    <p class="reading-text" style="margin-top:10px">${planetCoupleParagraph(chartDataA,chartDataB,nameA,nameB,p,seed)}</p>
    </div>
  </div>`;
}

function renderCoupleYouHtml(chartDataA,chartDataB){
  const nameA=chartDataA.name||'Partner A',nameB=chartDataB.name||'Partner B';
  const opener=`<span class="you-opener-glyph">${signIconSvg(chartDataA.lagnaSign,15,'#c9a24b',1)}</span>Planet by planet, here's how ${nameA}'s and ${nameB}'s charts actually meet, where they naturally speak the same language, and where each of you is working from a different playbook.`;
  const cards=PLANETS.map((p,i)=>coupleYouPlanetCardHtml(chartDataA,chartDataB,nameA,nameB,p,i)).join('');
  return`<p class="reading-text you-opener">${opener}</p>
  <div class="you-divider"><span>✦</span></div>
  <div class="shadbala-grid">${cards}</div>`;
}

// ---------------- Life-Area Compatibility Table ----------------

// The seven classical personal/social grahas, relabelled to the everyday life-area each one is most
// associated with in mainstream (and Vedic) astrology alike - Sun/identity, Moon/emotion, Mercury/
// mind, Venus/love, Mars/drive, Jupiter/belief, Saturn/duty. Phrased in this app's own voice (short,
// warm, plain-language noun phrases) rather than the blunter "Sex & Aggression"-style category names
// some mainstream apps use for the same seven axes. `short` is the radial label used on the radar
// chart, where a longer phrase would overlap its neighbours.
const LIFE_AREA_PLANET=[
  {p:'Sun',label:'Core Identity',short:'Identity'},
  {p:'Moon',label:'Emotional Rhythm',short:'Emotion'},
  {p:'Mercury',label:'Mind & Conversation',short:'Mind'},
  {p:'Venus',label:'Romance & Affection',short:'Romance'},
  {p:'Mars',label:'Passion & Drive',short:'Passion'},
  {p:'Jupiter',label:'Beliefs & Outlook',short:'Beliefs'},
  {p:'Saturn',label:'Duty & Discipline',short:'Duty'}
];
const LIFE_AREA_BASELINE=50;
// Sign-distance score table - the same convention as SYNASTRY_DIST_READ (compatibility-extra.js),
// extended with an actual number: conjunction and trine score highest, square lowest, opposition a
// charged middle ground, everything else a quiet, near-baseline background influence.
const LIFE_AREA_DIST_SCORE={1:78,2:55,3:68,4:38,5:84,6:55,7:60,8:55,9:84,10:38,11:68,12:55};
const LIFE_AREA_DIST_LABEL={1:'Conjunction',2:'Background',3:'Sextile',4:'Square',5:'Trine',6:'Background',7:'Opposition',8:'Background',9:'Trine',10:'Square',11:'Sextile',12:'Background'};
function planetCompatScore(chartDataA,chartDataB,p){
  const signA=chartDataA.planetData[p].sign,signB=chartDataB.planetData[p].sign;
  const dist=((signB-signA+12)%12)+1;
  let score=LIFE_AREA_DIST_SCORE[dist];
  const lordA=SIGN_LORD[signA],lordB=SIGN_LORD[signB];
  if(lordA===lordB)score+=8;
  else{
    const relAB=naturalRelation(lordA,lordB),relBA=naturalRelation(lordB,lordA);
    if(relAB==='friend'&&relBA==='friend')score+=8;
    else if(relAB==='enemy'&&relBA==='enemy')score-=8;
  }
  return{score:Math.max(8,Math.min(92,Math.round(score))),dist,signA,signB};
}
// Five-tier verdict, used only for the small text badge next to each meter (the meter fill itself
// is a single bright colour regardless of tier - see .life-area-meter-fill in styles.css - the
// red/green/amber traffic-light treatment this used to carry has been deliberately dropped from the
// bar; the badge's colour + wording is the only place tier still shows up visually).
function lifeAreaTierPhrase(score){
  if(score>=70)return{label:'Well above baseline',color:'#4ade80'};
  if(score>=58)return{label:'Above baseline',color:'#4ade80'};
  if(score>=42)return{label:'Around baseline',color:'#c9a24b'};
  if(score>=28)return{label:'Below baseline',color:'#e0995e'};
  return{label:'Well below baseline',color:'#f87171'};
}

// The bright, single colour every Life Areas visual (this radar's polygon, every meter fill) uses -
// reverted from a per-couple elemental gradient back to one fixed bright warm-white, matching the
// original "strength shown by length, not colour" design the meters already follow.
const LIFE_AREA_BRIGHT='#f5eedc';

// The radar chart - same construction as lifeMapRadarSvg (render-tabs.js) reused here for visual
// consistency across the app: concentric rings at 25/50/75/100%, one spoke per axis, a single filled
// polygon for this pairing's scores, in that same bright colour. The 50% ring is picked out in a
// warmer dashed stroke specifically BECAUSE it doubles as "Baseline" here, an average unrelated
// pairing's expected shape, so the couple's own polygon bulging outside it (or pulling inside it)
// reads at a glance.
function lifeAreaRadarSvg(rows){
  const cx=170,cy=150,R=88,n=rows.length;
  const angleFor=i=>-Math.PI/2+i*(2*Math.PI/n);
  const pt=(i,r)=>{const a=angleFor(i);return[cx+r*Math.cos(a),cy+r*Math.sin(a)]};
  let svg=`<svg viewBox="0 0 340 300" style="width:100%;height:auto;max-width:360px;display:block;margin:0 auto" role="img" aria-label="Life-area compatibility radar, baseline ring at the halfway point">`;
  [0.25,0.5,0.75,1].forEach(f=>{
    const ptsStr=rows.map((_,i)=>pt(i,R*f).join(',')).join(' ');
    const isBaseline=f===0.5;
    svg+=`<polygon points="${ptsStr}" fill="none" stroke="${isBaseline?'#8a713c':'#262626'}" stroke-width="${isBaseline?'1.3':'1'}"${isBaseline?' stroke-dasharray="3,3"':''}/>`;
  });
  rows.forEach((_,i)=>{
    const[x,y]=pt(i,R);
    svg+=`<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#262626" stroke-width="1"/>`;
  });
  const dataPts=rows.map((r,i)=>pt(i,R*(r.score/100)).join(',')).join(' ');
  svg+=radarGlowPolygon(dataPts,LIFE_AREA_BRIGHT,0.28,LIFE_AREA_BRIGHT,2,LIFE_AREA_BRIGHT);
  rows.forEach((r,i)=>{
    const[x,y]=pt(i,R*(r.score/100));
    svg+=radarGlowPoint(x.toFixed(1),y.toFixed(1),4,LIFE_AREA_BRIGHT,i);
  });
  rows.forEach((r,i)=>{
    const[x,y]=pt(i,R+30);
    const cosA=Math.cos(angleFor(i));
    const anchor=Math.abs(cosA)<0.3?'middle':(cosA>0?'start':'end');
    svg+=`<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="${anchor}" font-size="11" fill="#ccc" font-family="-apple-system,sans-serif">${r.area.short}</text>`;
  });
  svg+=`</svg>`;
  return svg;
}

// One card per life-area, styled with the same shadbala-card shell as the rest of the app (no photo
// watermark - reusing the You Two cards' planet photography here read as a copy-paste of that tab
// rather than its own identity, so this stays plain). The meter fill is the same fixed bright colour
// as the radar above (LIFE_AREA_BRIGHT), not a red/green/amber verdict, with a glowing white handle
// at the tip and a faint centre tick for Baseline.
function lifeAreaRowHtml(chartDataA,chartDataB,nameA,nameB,area,seed){
  const{score,dist,signA,signB}=planetCompatScore(chartDataA,chartDataB,area.p);
  const tier=lifeAreaTierPhrase(score);
  const distLabel=LIFE_AREA_DIST_LABEL[dist];
  const rel=planetCoupleRelation(signA,signB);
  const degA=chartDataA.planetData[area.p].deg,degB=chartDataB.planetData[area.p].deg;
  const note=pickVariant(COUPLE_SYNTHESIS[rel](PLANET_WORD[area.p]),seed+Math.round((degA+degB)*53));
  return`<div class="shadbala-card life-area-card">
    <div class="shadbala-card-head">
      <div style="flex:1;min-width:0">
        <div class="shadbala-planet-name">${area.label}</div>
        <div class="seg-sub you-planet-meta">${planetIconSvg(area.p,13,'#a68b52',0.9)}<span>${area.p} &middot; ${distLabel}</span></div>
      </div>
      <span class="rel-badge" style="background:${tier.color}22;color:${tier.color};border:1px solid ${tier.color}55">${tier.label}</span>
    </div>
    <div class="life-area-meter">
      <div class="life-area-meter-baseline-label">Baseline</div>
      <div class="life-area-meter-track">
        <div class="life-area-meter-baseline"></div>
        <div class="life-area-meter-fill" style="width:${score}%;background:${LIFE_AREA_BRIGHT}"></div>
        <div class="life-area-meter-dot" style="left:${score}%"></div>
      </div>
    </div>
    <p class="reading-text" style="margin-top:14px;font-size:13.5px">${nameA} &amp; ${nameB}'s ${area.p} (${SIGNS[signA]} / ${SIGNS[signB]}) form a classical ${distLabel}. ${note}</p>
  </div>`;
}
const LIFE_AREA_METHODOLOGY='This table is a quick-glance, disclosed simplification, not a classical Vedic technique on its own (graha drishti is house-based within one chart, not directly comparable sign-to-sign across two independent charts). Each row scores the sign-distance between the two partners\' placements for one classical personal/social graha (the same convention already used for the Venus-Mars synastry read elsewhere in this app: conjunction and trine score highest, square lowest, opposition a charged middle ground), with a small additional nudge when the two placements\' sign-lords are natural classical friends or enemies (Naisargika Maitri). "Baseline" (the dashed ring on the radar, the centre tick on each meter) marks the score an average, astrologically unrelated pairing would land on; this pairing is shown relative to that. For a fuller, classically weighted verdict, see the Ashtakoot Guna Milan score on the Overview tab, which this table does not replace.';
function renderLifeAreaTableHtml(chartDataA,chartDataB){
  const nameA=chartDataA.name||'Partner A',nameB=chartDataB.name||'Partner B';
  const scored=LIFE_AREA_PLANET.map(area=>({area,score:planetCompatScore(chartDataA,chartDataB,area.p).score}));
  const radarRows=scored.map(s=>({area:s.area,score:s.score}));
  const rows=LIFE_AREA_PLANET.map((area,i)=>lifeAreaRowHtml(chartDataA,chartDataB,nameA,nameB,area,i)).join('');
  return`<div class="shadbala-intro" style="margin-bottom:14px">
      <span class="info-icon" id="lifearea-info-trigger">i</span>
      <span style="font-size:12.5px;color:#888">Tap the info icon for methodology &amp; simplification notes</span>
    </div>
    <div class="shadbala-card life-area-radar-card">
      <div class="seg-sub" style="text-align:center;margin-bottom:6px">${nameA} &amp; ${nameB}, across all seven axes</div>
      ${lifeAreaRadarSvg(radarRows)}
    </div>
    <div class="shadbala-grid">${rows}</div>`;
}
