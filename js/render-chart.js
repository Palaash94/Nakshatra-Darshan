/* ============================================================
   CHART RENDERING (SVG)
   Rashi Chakra (D1), Navamsa (D9), and the generic Varga chart
   wheel drawing (used by all other divisional charts) plus house
   segment detail popups (drishti/aspect info is shown there as text).
   ============================================================ */

// Shared wheel geometry - identical across the D1, D9, and every divisional (Varga) wheel, so every
// draw function (here and in render-tabs.js) and the drishti overlay below reuse these instead of
// each redeclaring their own copy of the same cx/cy/radii and polar/wedge-angle math.
const WHEEL_CX=130,WHEEL_CY=130,WHEEL_OUTER_R=124,WHEEL_INNER_R=92,WHEEL_LABEL_R=109,WHEEL_PLANET_R=58;

function wheelPolar(r,angleDeg){
  const a=(angleDeg-90)*Math.PI/180; // -90 so 0deg points up
  return{x:WHEEL_CX+r*Math.cos(a),y:WHEEL_CY+r*Math.sin(a)};
}
// House 1 (lagna sign) CENTERED at top, going ANTICLOCKWISE = decreasing angle.
// Shift by +15deg so the wedge boundary sits at +/-15deg and house 1's middle is at 0deg (top).
function wheelWedgeAngles(houseIdx){
  return{start:15-(houseIdx-1)*30,end:15-houseIdx*30,mid:-(houseIdx-1)*30};
}
function wheelArcPath(rOuter,rInner,startDeg,endDeg){
  const p1=wheelPolar(rOuter,startDeg),p2=wheelPolar(rOuter,endDeg);
  const p3=wheelPolar(rInner,endDeg),p4=wheelPolar(rInner,startDeg);
  return`M${p1.x.toFixed(2)},${p1.y.toFixed(2)} A${rOuter},${rOuter} 0 0,0 ${p2.x.toFixed(2)},${p2.y.toFixed(2)} L${p3.x.toFixed(2)},${p3.y.toFixed(2)} A${rInner},${rInner} 0 0,1 ${p4.x.toFixed(2)},${p4.y.toFixed(2)} Z`;
}

// Maps a classical aspect grade (aspectGradeVirupa, shadbala-dashas.js: 60=Full, 45=Three-quarter
// [Mars 4th/8th], 30=Half [Jupiter/Rahu/Ketu 5th/9th], 15=Quarter [Saturn 3rd/10th]) to a human label.
// Used by the segment-popup's Drishti strength text (no on-wheel line overlay - text only, by design).
function drishtiGradeLabel(grade){
  if(grade>=60)return'Full';
  if(grade>=45)return'Three-quarter';
  if(grade>=30)return'Half';
  if(grade>0)return'Quarter';
  return null;
}

// Draws current transit planet positions as a distinct outer ring on top of an already-drawn natal
// wheel (drawGenericChartWheel), for the Transit tab. Widens the viewBox beyond the standard 260x260
// so the outer ring has room, since drawGenericChartWheel always resets the viewBox to 0 0 260 260.
function drawTransitOverlay(svgId,transitPlanetData,lagnaSign){
  const svg=document.getElementById(svgId);
  if(!svg)return;
  svg.setAttribute('viewBox','-40 -40 340 340');
  let g=svg.querySelector('#'+svgId+'-transit-overlay');
  if(!g){
    g=document.createElementNS('http://www.w3.org/2000/svg','g');
    g.setAttribute('id',svgId+'-transit-overlay');
    svg.appendChild(g);
  }
  const ringR=WHEEL_OUTER_R+16,pitch=12;
  const houseCounts={};
  let out=`<circle cx="${WHEEL_CX}" cy="${WHEEL_CY}" r="${ringR-6}" fill="none" stroke="#38bdf8" stroke-width="0.6" stroke-dasharray="1.5 3" opacity="0.5" pointer-events="none"/>`;
  PLANETS.forEach(p=>{
    const d=transitPlanetData[p];
    if(!d)return;
    const house=((d.sign-lagnaSign+12)%12)+1;
    const idx=houseCounts[house]||0;
    houseCounts[house]=idx+1;
    const ang=wheelWedgeAngles(house).mid;
    const r=ringR+idx*pitch;
    const c=wheelPolar(r,ang);
    out+=`<g transform="translate(${(c.x-7).toFixed(2)},${(c.y-7).toFixed(2)})" pointer-events="none">${planetIconSvg(p,14,'#38bdf8',1)}</g>`;
  });
  g.innerHTML=out;
}
function clearTransitOverlay(svgId){
  const g=document.getElementById(svgId+'-transit-overlay');
  if(g)g.innerHTML='';
}

function drawKundli(houseMap,lagnaSign){
  const svg=document.getElementById('kundli-svg');
  const cx=WHEEL_CX,cy=WHEEL_CY,outerR=WHEEL_OUTER_R,innerR=WHEEL_INNER_R,labelR=WHEEL_LABEL_R,planetR=WHEEL_PLANET_R;
  const gridColor='#2a2a2a',rimColor='#c9a24b';
  const polar=wheelPolar,wedgeAngles=wheelWedgeAngles,arcPath=wheelArcPath;

  // Reveal-on-draw animation: circles/spokes "draw in" via stroke-dashoffset, signs/planets fade in
  // staggered. Defined once as embedded SVG <style> so it replays cleanly every time drawKundli
  // re-runs (fresh chart calc, or switching Partner A/B) without needing a JS animation loop.
  const rimLen=(2*Math.PI*outerR).toFixed(1),innerLen=(2*Math.PI*innerR).toFixed(1);
  let svgContent=`<style>
    @keyframes ck-draw{to{stroke-dashoffset:0}}
    @keyframes ck-fade{from{opacity:0}to{opacity:1}}
    .ck-rim{stroke-dasharray:${rimLen};stroke-dashoffset:${rimLen};animation:ck-draw 1.1s ease-out forwards}
    .ck-inner{stroke-dasharray:${innerLen};stroke-dashoffset:${innerLen};animation:ck-draw 1.1s ease-out 0.1s forwards}
    .ck-spoke{stroke-dasharray:${outerR};stroke-dashoffset:${outerR};animation:ck-draw 0.5s ease-out forwards}
    .ck-sign{opacity:0;animation:ck-fade 0.5s ease-out forwards}
    .ck-planet{opacity:0;animation:ck-fade 0.45s ease-out forwards}
  </style>`;

  // Clickable wedge hit-areas (drawn first, transparent fill, sit on top via pointer-events but visually behind text)
  let wedgeLayer='';
  for(let h=1;h<=12;h++){
    const ang=wedgeAngles(h);
    const d=arcPath(outerR,innerR,ang.start,ang.end);
    wedgeLayer+=`<path id="wedge-fill-${h}" d="${d}" class="wedge-hit house-highlight" fill="rgba(0,0,0,0)" stroke="none" data-house="${h}" onclick="showSegmentDetail(${h})"/>`;
  }
  svgContent+=wedgeLayer;

  // Outer and inner circles
  svgContent+=`<circle cx="${cx}" cy="${cy}" r="${outerR}" fill="none" stroke="${rimColor}" stroke-width="1.2" class="ck-rim" pointer-events="none"/>`;
  svgContent+=`<circle cx="${cx}" cy="${cy}" r="${innerR}" fill="none" stroke="${gridColor}" stroke-width="0.7" class="ck-inner" pointer-events="none"/>`;

  let planetDelayIdx=0;
  // Radial divider lines (12 spokes) + sign labels + planets
  for(let h=1;h<=12;h++){
    const ang=wedgeAngles(h);
    const p1=polar(outerR,ang.start);
    svgContent+=`<line x1="${cx}" y1="${cy}" x2="${p1.x.toFixed(2)}" y2="${p1.y.toFixed(2)}" stroke="${gridColor}" stroke-width="0.6" class="ck-spoke" style="animation-delay:${h*40}ms" pointer-events="none"/>`;

    // Sign for this house
    const signIdx=(lagnaSign+h-1)%12;

    // Sign icon (white, semi-transparent) near outer rim, centered in wedge
    const labelPos=polar(labelR,ang.mid);
    const iconSize=20;
    svgContent+=`<g class="ck-sign" style="animation-delay:${300+h*25}ms" transform="translate(${(labelPos.x-iconSize/2).toFixed(2)},${(labelPos.y-iconSize/2).toFixed(2)})" pointer-events="none">${signIconSvg(signIdx,iconSize,'#fff',0.55)}</g>`;

    // House number (small, near center edge, well clear of the sign icon above it)
    const hNumPos=polar(innerR+3,ang.mid);
    svgContent+=`<text x="${hNumPos.x.toFixed(2)}" y="${hNumPos.y.toFixed(2)}" text-anchor="middle" dominant-baseline="middle" font-size="6.5" fill="#444" font-family="-apple-system,sans-serif" pointer-events="none">${h}</text>`;

    // Planets in this house (+ ASC marker if this is house 1)
    const planets=houseMap[h]||[];
    const items=h===1?['ASC',...planets]:planets.slice();
    if(items.length){
      const n=items.length;
      // Clean vertical stack along the wedge's mid-angle: each "row" = icon + degree label, fixed pitch
      const rowPitch=17;
      const iconSize=11;
      const totalHeight=(n-1)*rowPitch;
      const startR=planetR+totalHeight/2;
      const rotateDeg=ang.mid; // align icon's local "up" with the radial direction outward
      items.forEach((p,j)=>{
        const rowR=startR-j*rowPitch;
        const iconCenter=polar(rowR+3,ang.mid);
        const degCenter=polar(rowR-5,ang.mid);
        const isAsc=p==='ASC';
        const delay=600+planetDelayIdx*70;planetDelayIdx++;
        if(isAsc){
          svgContent+=`<g class="ck-planet" style="animation-delay:${delay}ms" transform="rotate(${rotateDeg.toFixed(2)} ${iconCenter.x.toFixed(2)} ${iconCenter.y.toFixed(2)})" pointer-events="none"><text x="${iconCenter.x.toFixed(2)}" y="${iconCenter.y.toFixed(2)}" text-anchor="middle" dominant-baseline="central" font-size="8" fill="#c9a24b" font-family="-apple-system,sans-serif" font-weight="700">Asc</text></g>`;
        }else{
          // Dignity: exalted planets get a soft glow, debilitated ones render dimmer - same getDignity()
          // used everywhere else in the app (planet table, karakas), just surfaced visually here too.
          const dignity=chartData?getDignity(p,chartData.planetData[p].sign,0):null;
          const filterAttr=dignity==='exalted'?' filter="drop-shadow(0 0 2.5px rgba(201,162,75,0.85))"':'';
          const iconOpacity=dignity==='debilitated'?0.5:1;
          // Rahu/Ketu (mean node) are astronomically retrograde essentially always, so flagging them
          // "R" carries no information and reads as a mistake - reserve the marker for the 5 classical
          // planets whose retrograde status is actually variable and worth noticing.
          const isRetro=!!(chartData&&chartData.retrograde&&chartData.retrograde[p]);
          const retroMark=isRetro?`<text x="${iconSize+1}" y="3" font-size="5" fill="#f87171" font-family="-apple-system,sans-serif" font-weight="700">R</text>`:'';
          svgContent+=`<g class="ck-planet" style="animation-delay:${delay}ms" transform="rotate(${rotateDeg.toFixed(2)} ${iconCenter.x.toFixed(2)} ${iconCenter.y.toFixed(2)}) translate(${(iconCenter.x-iconSize/2).toFixed(2)},${(iconCenter.y-iconSize/2).toFixed(2)})"${filterAttr} pointer-events="none">${planetIconSvg(p,iconSize,'#c9a24b',iconOpacity)}${retroMark}</g>`;
        }
        const degVal=isAsc?(chartData?getDeg(chartData.ascSid):null):(chartData&&chartData.planetData[p]?chartData.planetData[p].deg:null);
        if(degVal!==null&&degVal!==undefined){
          const isRetroDeg=!isAsc&&!!(chartData&&chartData.retrograde&&chartData.retrograde[p]);
          svgContent+=`<g class="ck-planet" style="animation-delay:${delay}ms" transform="rotate(${rotateDeg.toFixed(2)} ${degCenter.x.toFixed(2)} ${degCenter.y.toFixed(2)})" pointer-events="none"><text x="${degCenter.x.toFixed(2)}" y="${degCenter.y.toFixed(2)}" text-anchor="middle" dominant-baseline="central" font-size="5.5" fill="${isRetroDeg?'#f87171':'#c9a24b'}" font-family="-apple-system,sans-serif">${degVal.toFixed(0)}°</text></g>`;
        }
      });
    }
  }

  // Top marker triangle indicating Ascendant point (at angle 0, top)
  const ascTip=polar(outerR+8,0);
  const ascL=polar(outerR+2,-4);
  const ascR2=polar(outerR+2,4);
  svgContent+=`<polygon points="${ascTip.x.toFixed(1)},${ascTip.y.toFixed(1)} ${ascL.x.toFixed(1)},${ascL.y.toFixed(1)} ${ascR2.x.toFixed(1)},${ascR2.y.toFixed(1)}" fill="${rimColor}" pointer-events="none"/>`;
  svgContent+=`<text x="${cx}" y="${cy-outerR-14}" text-anchor="middle" font-size="7" fill="${rimColor}" font-family="-apple-system,sans-serif" font-weight="600" pointer-events="none">ASC</text>`;

  // Center dot
  svgContent+=`<circle cx="${cx}" cy="${cy}" r="2" fill="${rimColor}"/>`;

  svg.setAttribute('viewBox','0 0 260 260');
  svg.innerHTML=svgContent;
}

// Ambient glow/star colour per Tatva (element) - gold-to-violet duotone rather than a literal
// fire=red/water=blue rainbow, so the Big Three cards and wheel glow stay inside the site's two
// established accents (gold + violet) and vary by warmth instead of hue. Deliberately monochrome-
// adjacent after the Shadbala Houses tab's four-colour scheme read as "tacky."
const TATVA_GLOW_COLOR={Fire:'#dbb864',Earth:'#a6884f',Air:'#b39bc9',Water:'#9b86d9'};

// "Big Three" hero strip (Sun / Moon / Ascendant) shown above the wheel - the headline moment most
// astrology apps (Co-Star, CHANI) lead with, instead of dropping straight into a dense diagram.
function renderBigThree(){
  if(!chartData)return;
  const el=document.getElementById('chart-big-three');
  if(!el)return;
  const{planetData,lagnaSign}=chartData;
  const items=[
    {label:'Sun',sub:'Core identity',signIdx:planetData.Sun.sign,house:planetData.Sun.house},
    {label:'Moon',sub:'Emotional nature',signIdx:planetData.Moon.sign,house:planetData.Moon.house},
    {label:'Ascendant',sub:'Outer manner',signIdx:lagnaSign,house:1}
  ];
  el.innerHTML=items.map((it,i)=>{
    const tatva=RASHI_TATVA[it.signIdx];
    const glow=TATVA_GLOW_COLOR[tatva]||'#c9a24b';
    return`<div class="big-three-card" style="animation-delay:${i*90}ms;--bt-glow:${glow}">
      <div class="big-three-icon">${signIconSvg(it.signIdx,30,'#c9a24b',1)}</div>
      <div class="big-three-label">${it.label}</div>
      <div class="big-three-sign">${SIGNS[it.signIdx]}</div>
      <div class="big-three-meta">House ${it.house} &middot; ${SIGN_TRAIT[it.signIdx]}</div>
    </div>`;
  }).join('');
}

// Single bold teaser line above the wheel, surfacing the chart's strongest Yoga (or, failing that,
// the Atmakaraka, which every chart has) - gives users one thing to read before they have to start
// clicking around, matching the "one headline moment" pattern from Co-Star/CHANI.
function renderChartHeadline(){
  if(!chartData)return;
  const el=document.getElementById('chart-headline');
  if(!el)return;
  const yogas=(chartData.yogas||[]).filter(y=>y.category==='yoga');
  if(yogas.length){
    const top=[...yogas].sort((a,b)=>b.strength-a.strength)[0];
    el.innerHTML=`<span class="chart-headline-spark">&#10022;</span> Your chart carries <strong>${top.name}</strong><span class="chart-headline-tag">${top.strengthLabel}</span>`;
  }else if(chartData.karakas&&chartData.karakas.length){
    const ak=chartData.karakas[0];
    el.innerHTML=`<span class="chart-headline-spark">&#10022;</span> <strong>${ak.planet}</strong> is your Atmakaraka — the soul's chosen focus this lifetime`;
  }else{
    el.innerHTML='';
  }
}

// Ambient tatva-tinted glow behind the wheel (from the Moon's element) plus a small field of
// independently-twinkling stars, so the chart card itself feels alive rather than a static diagram
// dropped on a flat background.
function renderChartAtmosphere(){
  if(!chartData)return;
  const glowEl=document.getElementById('chart-wheel-glow');
  const starsEl=document.getElementById('chart-star-field');
  if(!glowEl||!starsEl)return;
  const tatva=RASHI_TATVA[chartData.planetData.Moon.sign];
  const color=TATVA_GLOW_COLOR[tatva]||'#c9a24b';
  // .chart-wheel-glow's layout box matches the wheel's own box exactly (same max-width/aspect-ratio),
  // then gets visually enlarged 1.18x via CSS `scale`. `closest-side` is required here - without it a
  // bare `circle` gradient defaults to `farthest-corner` sizing (radius to the box's CORNER, not its
  // edge), which put the wheel's rim at ~57% of the gradient instead of where it actually sits, so the
  // "halo" rendered as a diffuse center-ish glow nowhere near the rim. With `closest-side`, 100% is
  // exactly the box edge (S/2), so after the 1.18x scale the wheel's true rim - at 95.4% of the
  // wheel's own radius (124/130) - lands at (0.954/1.18)=100 ~= 81% of this gradient's percentage space.
  glowEl.style.background=`radial-gradient(circle closest-side, transparent 0%, transparent 72%, ${color}55 81%, ${color}26 90%, transparent 100%)`;
  let starsHtml='';
  for(let i=0;i<16;i++){
    const top=(Math.random()*100).toFixed(1),left=(Math.random()*100).toFixed(1);
    const size=(Math.random()*1.3+0.6).toFixed(2);
    const delay=(Math.random()*4).toFixed(2),dur=(2.6+Math.random()*2.4).toFixed(2);
    starsHtml+=`<span class="chart-star" style="top:${top}%;left:${left}%;width:${size}px;height:${size}px;animation-delay:${delay}s;animation-duration:${dur}s"></span>`;
  }
  starsEl.innerHTML=starsHtml;
}

// ASPECT_OFFSETS now lives in ephemeris.js (shared with Shadbala's Drik Bala and the Transit module)

function getAspectsOnHouse(targetHouse,houseMap){
  const aspects=[];
  for(const planet in ASPECT_OFFSETS){
    // find which house this planet sits in
    let fromHouse=null;
    for(let h=1;h<=12;h++){if((houseMap[h]||[]).includes(planet)){fromHouse=h;break}}
    if(fromHouse===null)continue;
    for(const offset of ASPECT_OFFSETS[planet]){
      const aspectedHouse=((fromHouse-1+offset-1)%12)+1;
      if(aspectedHouse===targetHouse){aspects.push(planet);break}
    }
  }
  return aspects;
}

// Graded version of getAspectsOnHouse: same lookup, but each result also carries its classical
// strength grade (via aspectGradeVirupa, shadbala-dashas.js) - the "Graha Drishti strength grading"
// shown as text in the house segment popup.
function getAspectsOnHouseGraded(targetHouse,houseMap){
  const result=[];
  for(const planet in ASPECT_OFFSETS){
    let fromHouse=null;
    for(let h=1;h<=12;h++){if((houseMap[h]||[]).includes(planet)){fromHouse=h;break}}
    if(fromHouse===null)continue;
    for(const offset of ASPECT_OFFSETS[planet]){
      const aspectedHouse=((fromHouse-1+offset-1)%12)+1;
      if(aspectedHouse===targetHouse){
        const grade=aspectGradeVirupa(planet,offset);
        result.push({planet,fromHouse,offset,grade,label:drishtiGradeLabel(grade)});
        break;
      }
    }
  }
  return result;
}

// Symmetric to the above: aspects CAST outward by planets occupying `house` itself.
function getAspectsCastFromHouse(house,houseMap){
  const result=[];
  (houseMap[house]||[]).forEach(planet=>{
    if(!ASPECT_OFFSETS[planet])return;
    ASPECT_OFFSETS[planet].forEach(offset=>{
      const toHouse=((house-1+offset-1)%12)+1;
      if(toHouse===house)return;
      const grade=aspectGradeVirupa(planet,offset);
      result.push({planet,toHouse,offset,grade,label:drishtiGradeLabel(grade)});
    });
  });
  return result;
}

function showSegmentDetail(house){
  if(!chartData)return;
  const{lagnaSign,houseMap,planetData}=chartData;
  const signIdx=(lagnaSign+house-1)%12;
  const signName=SIGNS[signIdx];
  const lord=SIGN_LORD[signIdx];
  const planets=houseMap[house]||[];
  const aspectsOn=getAspectsOnHouseGraded(house,houseMap);
  const aspectsCast=getAspectsCastFromHouse(house,houseMap);
  const isAscHouse=house===1;

  // Watermark: rashi icon, white & transparent, large in background
  const watermarkSvg=signIconSvg(signIdx,128,'#fff',1);

  let planetChips='';
  if(planets.length){
    planetChips=planets.map(p=>{
      const d=planetData[p];
      return`<div class="planet-chip">
        <div class="planet-chip-icon">${planetIconSvg(p,30,'#c9a24b',1)}</div>
        <div class="planet-chip-body">
          <div class="planet-chip-name">${p}</div>
          <div class="planet-chip-deg">${d.deg.toFixed(2)}°</div>
          <div class="planet-chip-nak">${d.nakshatra.name} · pada ${d.nakshatra.pada} <span class="info-icon" onclick="event.stopPropagation();showPadaInfo(${d.nakshatra.idx},${d.nakshatra.pada},'${d.nakshatra.name}')">i</span></div>
        </div>
      </div>`;
    }).join('');
  }else{
    planetChips='<div class="planet-chip empty"><span style="opacity:0.3;font-size:18px">—</span><div class="planet-chip-nak">No planets in this house</div></div>';
  }

  const ascChip=isAscHouse?`<div class="planet-chip asc-chip">
      <div class="planet-chip-icon asc-icon">Asc</div>
      <div class="planet-chip-body">
        <div class="planet-chip-name">Ascendant</div>
        <div class="planet-chip-deg">${getDeg(chartData.ascSid).toFixed(2)}°</div>
        <div class="planet-chip-nak">${getNakshatra(chartData.ascSid).name}</div>
      </div>
    </div>`:'';

  const aspectChipsOn=aspectsOn.length
    ?aspectsOn.map(a=>`<span class="aspect-chip">${planetIconSvg(a.planet,13,'#ccc',1)} ${a.planet} <span class="aspect-chip-nak">· ${a.label} aspect (${a.offset===7?'7th':a.offset+'th'})</span></span>`).join('')
    :'<span class="aspect-chip none">No aspects</span>';
  const aspectChipsCast=aspectsCast.length
    ?aspectsCast.map(a=>`<span class="aspect-chip">${planetIconSvg(a.planet,13,'#ccc',1)} ${a.planet} → H${a.toHouse} <span class="aspect-chip-nak">· ${a.label} aspect</span></span>`).join('')
    :'<span class="aspect-chip none">No planets here to cast aspects</span>';

  const panel=document.getElementById('segment-detail');
  panel.innerHTML=`
    <div class="seg-watermark">${watermarkSvg}</div>
    <span class="seg-close" onclick="closeSegmentDetail()">✕</span>
    <div class="seg-header">
      <div class="seg-rashi-icon">${signIconSvg(signIdx,36,'#c9a24b',1)}</div>
      <div>
        <div class="seg-title">House ${house} · ${signName}</div>
        <div class="seg-sub">Ruled by ${lord}</div>
      </div>
    </div>
    <div class="planet-chip-row">${ascChip}${planetChips}</div>
    <div class="seg-section-label">Drishti (aspects) received by this house</div>
    <div class="aspect-chip-row">${aspectChipsOn}</div>
    <div class="seg-section-label">Aspects cast from this house</div>
    <div class="aspect-chip-row">${aspectChipsCast}</div>
  `;
  panel.classList.remove('hidden');
}

function closeSegmentDetail(){
  document.getElementById('segment-detail').classList.add('hidden');
}

// House groupings: Trikonas, Kendras, and other classical axes
const HOUSE_GROUPS=[
  {id:'dharma',label:'Dharma Trikona',houses:[1,5,9],desc:'Houses of self, creativity/past merit, and dharma/fortune — the axis of higher purpose and spiritual growth.'},
  {id:'artha',label:'Artha Trikona',houses:[2,6,10],desc:'Houses of wealth, daily work/competition, and career/public status — the axis of material achievement.'},
  {id:'kama',label:'Kama Trikona',houses:[3,7,11],desc:'Houses of desire, relationships/partnerships, and gains — the axis of ambition and social connection.'},
  {id:'moksha',label:'Moksha Trikona',houses:[4,8,12],desc:'Houses of inner life, transformation/hidden matters, and liberation/loss — the axis of spiritual release.'},
  {id:'kendra',label:'Kendra (Angles)',houses:[1,4,7,10],desc:'The four angular houses — self, home, relationships, career. The most powerful pillars of the chart.'},
  {id:'panaphara',label:'Panaphara',houses:[2,5,8,11],desc:'Succedent houses — wealth, creativity, transformation, gains. Support houses to the Kendras.'},
  {id:'apoklima',label:'Apoklima',houses:[3,6,9,12],desc:'Cadent houses — courage, service, fortune, loss. The most subtle and least stable houses.'}
];

let activeGroupId=null;

function renderTrikonaButtons(){
  const row=document.getElementById('trikona-btn-row');
  row.innerHTML=HOUSE_GROUPS.map(g=>`<button class="trikona-btn" id="trikona-btn-${g.id}" onclick="toggleGroup('${g.id}')">${g.label}</button>`).join('');
}

function toggleGroup(groupId){
  if(activeGroupId===groupId){
    activeGroupId=null;
    clearHouseHighlights();
    document.getElementById('group-detail').classList.add('hidden');
    document.querySelectorAll('.trikona-btn').forEach(b=>b.classList.remove('active'));
    return;
  }
  activeGroupId=groupId;
  document.querySelectorAll('.trikona-btn').forEach(b=>b.classList.toggle('active',b.id==='trikona-btn-'+groupId));
  const group=HOUSE_GROUPS.find(g=>g.id===groupId);
  highlightHouses(group.houses);
  showGroupDetail(group);
}

function highlightHouses(houses){
  clearHouseHighlights();
  houses.forEach(h=>{
    const el=document.getElementById('wedge-fill-'+h);
    if(el)el.setAttribute('fill','rgba(201,162,75,0.13)');
  });
}
function clearHouseHighlights(){
  for(let h=1;h<=12;h++){
    const el=document.getElementById('wedge-fill-'+h);
    if(el)el.setAttribute('fill','rgba(0,0,0,0)');
  }
}

function showGroupDetail(group){
  if(!chartData)return;
  const{lagnaSign,houseMap,planetData}=chartData;
  const panel=document.getElementById('group-detail');
  document.getElementById('segment-detail').classList.add('hidden');

  const houseCards=group.houses.map(h=>{
    const signIdx=(lagnaSign+h-1)%12;
    const planets=houseMap[h]||[];
    const planetList=planets.length
      ?planets.map(p=>`<span class="aspect-chip">${planetIconSvg(p,12,'#ccc',1)} ${p} ${planetData[p].deg.toFixed(1)}° <span class="aspect-chip-nak">· ${planetData[p].nakshatra.name} (P${planetData[p].nakshatra.pada})</span></span>`).join('')
      :'<span class="aspect-chip none">Empty</span>';
    return`<div class="group-house-card">
      <div class="group-house-head">
        <div class="seg-rashi-icon" style="width:24px;height:24px">${signIconSvg(signIdx,24,'#c9a24b',1)}</div>
        <div><div class="group-house-title">House ${h} · ${SIGNS[signIdx]}</div><div class="seg-sub">Ruled by ${SIGN_LORD[signIdx]}</div></div>
      </div>
      <div class="aspect-chip-row" style="margin-top:8px">${planetList}</div>
    </div>`;
  }).join('');

  panel.innerHTML=`
    <span class="seg-close" onclick="closeGroupDetail()">✕</span>
    <div class="seg-title" style="margin-bottom:4px">${group.label}</div>
    <div class="seg-sub" style="margin-bottom:14px">${group.desc}</div>
    <div class="group-house-grid">${houseCards}</div>
  `;
  panel.classList.remove('hidden');
}

function closeGroupDetail(){
  document.getElementById('group-detail').classList.add('hidden');
  activeGroupId=null;
  clearHouseHighlights();
  document.querySelectorAll('.trikona-btn').forEach(b=>b.classList.remove('active'));
}

function relationBadge(rel){
  const cls={friend:'rel-friend',neutral:'rel-neutral',enemy:'rel-enemy',self:'rel-neutral'}[rel]||'rel-neutral';
  const label={friend:'Friend',neutral:'Neutral',enemy:'Enemy',self:'—'}[rel]||'—';
  return`<span class="rel-badge ${cls}">${label}</span>`;
}

// =====================================================================
// GENERIC CHART WHEEL RENDERER (used by D1, D9, and all divisional charts)
// Draws the circular wheel shared by drawKundli/drawNavamsaChart. Drishti (graha
// aspect) info is shown as text only (see showSegmentDetail's grading section) -
// no line overlay is drawn on the wheel itself, on-click or otherwise.
// =====================================================================
function drawGenericChartWheel(svgId,houseMap,ascSign,options){
  const opts=options||{};
  const onWedgeClick=opts.onWedgeClick||null; // function(house) or null to disable clicking
  const svg=document.getElementById(svgId);
  if(!svg)return;
  const cx=WHEEL_CX,cy=WHEEL_CY,outerR=WHEEL_OUTER_R,innerR=WHEEL_INNER_R,labelR=WHEEL_LABEL_R,planetR=WHEEL_PLANET_R;
  const gridColor='#2a2a2a',rimColor='#c9a24b';
  const polar=wheelPolar,wedgeAngles=wheelWedgeAngles,arcPath=wheelArcPath;

  let svgContent='';
  let wedgeLayer='';
  for(let h=1;h<=12;h++){
    const ang=wedgeAngles(h);
    const clickAttr=onWedgeClick?` onclick="${onWedgeClick}(${h})"`:'';
    wedgeLayer+=`<path id="${svgId}-wedge-${h}" d="${arcPath(outerR,innerR,ang.start,ang.end)}" class="wedge-hit house-highlight" fill="rgba(0,0,0,0)" stroke="none"${clickAttr}/>`;
  }
  svgContent+=wedgeLayer;
  svgContent+=`<circle cx="${cx}" cy="${cy}" r="${outerR}" fill="none" stroke="${rimColor}" stroke-width="1.2" pointer-events="none"/>`;
  svgContent+=`<circle cx="${cx}" cy="${cy}" r="${innerR}" fill="none" stroke="${gridColor}" stroke-width="0.7" pointer-events="none"/>`;

  for(let h=1;h<=12;h++){
    const ang=wedgeAngles(h);
    const p1=polar(outerR,ang.start);
    svgContent+=`<line x1="${cx}" y1="${cy}" x2="${p1.x.toFixed(2)}" y2="${p1.y.toFixed(2)}" stroke="${gridColor}" stroke-width="0.6" pointer-events="none"/>`;
    const signIdx=(ascSign+h-1)%12;
    const labelPos=polar(labelR,ang.mid);
    const iconSize=20;
    svgContent+=`<g transform="translate(${(labelPos.x-iconSize/2).toFixed(2)},${(labelPos.y-iconSize/2).toFixed(2)})" pointer-events="none">${signIconSvg(signIdx,iconSize,'#fff',0.55)}</g>`;
    const hNumPos=polar(innerR+3,ang.mid);
    svgContent+=`<text x="${hNumPos.x.toFixed(2)}" y="${hNumPos.y.toFixed(2)}" text-anchor="middle" dominant-baseline="middle" font-size="6.5" fill="#444" font-family="-apple-system,sans-serif" pointer-events="none">${h}</text>`;

    const planets=houseMap[h]||[];
    const items=h===1?['ASC',...planets]:planets.slice();
    if(items.length){
      const n=items.length,rowPitch=17,iconSize2=11;
      const totalHeight=(n-1)*rowPitch;
      const startR=planetR+totalHeight/2;
      const rotateDeg=ang.mid;
      items.forEach((p,j)=>{
        const rowR=startR-j*rowPitch;
        const iconCenter=polar(rowR+3,ang.mid);
        const isAsc=p==='ASC';
        if(isAsc){
          svgContent+=`<g transform="rotate(${rotateDeg.toFixed(2)} ${iconCenter.x.toFixed(2)} ${iconCenter.y.toFixed(2)})" pointer-events="none"><text x="${iconCenter.x.toFixed(2)}" y="${iconCenter.y.toFixed(2)}" text-anchor="middle" dominant-baseline="central" font-size="8" fill="#c9a24b" font-family="-apple-system,sans-serif" font-weight="700">Asc</text></g>`;
        }else{
          svgContent+=`<g transform="rotate(${rotateDeg.toFixed(2)} ${iconCenter.x.toFixed(2)} ${iconCenter.y.toFixed(2)}) translate(${(iconCenter.x-iconSize2/2).toFixed(2)},${(iconCenter.y-iconSize2/2).toFixed(2)})" pointer-events="none">${planetIconSvg(p,iconSize2,'#c9a24b',1)}</g>`;
        }
      });
    }
  }
  const ascTip=polar(outerR+8,0),ascL=polar(outerR+2,-4),ascR2=polar(outerR+2,4);
  svgContent+=`<polygon points="${ascTip.x.toFixed(1)},${ascTip.y.toFixed(1)} ${ascL.x.toFixed(1)},${ascL.y.toFixed(1)} ${ascR2.x.toFixed(1)},${ascR2.y.toFixed(1)}" fill="${rimColor}" pointer-events="none"/>`;
  svgContent+=`<circle cx="${cx}" cy="${cy}" r="2" fill="${rimColor}"/>`;
  svg.setAttribute('viewBox','0 0 260 260');
  svg.innerHTML=svgContent;
}

// =====================================================================
// PANCHANG & NAKSHATRA-KOOTA RENDERING (Positions tab)
// =====================================================================
