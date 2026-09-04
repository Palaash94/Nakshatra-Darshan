/* ============================================================
   LIFE BALANCE (COUPLE MODE)
   Overlays both partners' individual Life Maps (calcLifeMap,
   life-map.js) on one radar instead of leaving them as two
   separate single-person tabs, then reads the overlay for what a
   single Life Map can't show:

     1. What each partner individually holds - where THEIR OWN
        chart concentrates and where it's quiet (reuses calcLifeMap's
        own rank field, no new scoring).
     2. How the two balance each other - per life-area, whether
        you're both strong there (reinforcing), both quiet there
        (a shared gap), one compensates for the other (balance), or
        you're both simply middling (steady ground).
     3. A dedicated callout for areas BOTH of you run quiet in at
        once - "if life is nudging this relationship to focus
        somewhere together, it's probably here."

   Deliberately no red/green traffic-light colour anywhere - see the
   Life Areas table's own note on this. Both partners' polygons/meters
   stay in the same bright-white family as the Life Areas tab (not a
   judgement colour), told apart by only a faint hue difference - warm
   white for Partner A, cool white for Partner B - rather than two
   fully saturated, unrelated colours. The four balance "kinds" below
   stay a fixed gold/violet/cream/grey language of their own, since
   those describe a PATTERN (shared strength, shared gap...) rather
   than either partner.
   Pure calculation + HTML string builders - no DOM. Rendered by
   renderCompatibilityTab() in render-tabs.js.
   ============================================================ */

const LIFE_BALANCE_COLOR_A='#f7f0dd'; // bright warm white
const LIFE_BALANCE_COLOR_B='#dde7f2'; // bright cool white - same brightness, just a hue apart

function calcLifeBalance(chartDataA,chartDataB){
  const areasA=calcLifeMap(chartDataA),areasB=calcLifeMap(chartDataB);
  if(!areasA||!areasB)return null;
  const byIdB={};areasB.forEach(a=>byIdB[a.id]=a);
  const rows=areasA.map(a=>{
    const b=byIdB[a.id];
    const diff=a.pct-b.pct;
    let kind;
    if(a.pct>=58&&b.pct>=58)kind='sharedStrength';
    else if(a.pct<42&&b.pct<42)kind='sharedGap';
    else if(Math.abs(diff)>=18)kind='balance';
    else kind='aligned';
    return{id:a.id,label:a.label,pctA:a.pct,pctB:b.pct,diff,kind};
  });
  return{areasA,areasB,rows};
}

// Overlay radar - identical construction to lifeMapRadarSvg (render-tabs.js) and lifeAreaRadarSvg
// (compatibility-you.js), reused a third time here deliberately: one shared visual language for
// "radar chart" across this whole app rather than three different ones. Two translucent polygons,
// each partner's own elemental colour, drawn B-then-A so A's outline stays crisp on top.
function lifeBalanceRadarSvg(areasA,areasB,glowA,glowB){
  const cx=170,cy=150,R=88,n=areasA.length;
  const angleFor=i=>-Math.PI/2+i*(2*Math.PI/n);
  const pt=(i,r)=>{const a=angleFor(i);return[cx+r*Math.cos(a),cy+r*Math.sin(a)]};
  let svg=`<svg viewBox="0 0 340 300" style="width:100%;height:auto;max-width:360px;display:block;margin:0 auto" role="img" aria-label="Life Map overlay radar for both partners">`;
  [0.25,0.5,0.75,1].forEach(f=>{
    const ptsStr=areasA.map((_,i)=>pt(i,R*f).join(',')).join(' ');
    svg+=`<polygon points="${ptsStr}" fill="none" stroke="#262626" stroke-width="1"/>`;
  });
  areasA.forEach((_,i)=>{
    const[x,y]=pt(i,R);
    svg+=`<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#262626" stroke-width="1"/>`;
  });
  const ptsB=areasB.map((a,i)=>pt(i,R*(a.pct/100)).join(',')).join(' ');
  const ptsA=areasA.map((a,i)=>pt(i,R*(a.pct/100)).join(',')).join(' ');
  svg+=radarGlowPolygon(ptsB,glowB,0.18,glowB,2,glowB);
  svg+=radarGlowPolygon(ptsA,glowA,0.18,glowA,2,glowA);
  areasB.forEach((a,i)=>{const[x,y]=pt(i,R*(a.pct/100));svg+=radarGlowPoint(x.toFixed(1),y.toFixed(1),3.5,glowB,i+0.5)});
  areasA.forEach((a,i)=>{const[x,y]=pt(i,R*(a.pct/100));svg+=radarGlowPoint(x.toFixed(1),y.toFixed(1),3.5,glowA,i)});
  areasA.forEach((a,i)=>{
    const[x,y]=pt(i,R+30);
    const cosA=Math.cos(angleFor(i));
    const anchor=Math.abs(cosA)<0.3?'middle':(cosA>0?'start':'end');
    const label=LIFE_MAP_RADAR_LABELS[a.id]||a.label;
    svg+=`<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="${anchor}" font-size="11" fill="#ccc" font-family="-apple-system,sans-serif">${label}</text>`;
  });
  svg+=`</svg>`;
  return svg;
}

// "What each of you holds" - one line naming each partner's own strongest and quietest life-area
// (calcLifeMap's own rank field, no new scoring), two phrasings so a repeat visit doesn't read
// identically. This is genuinely just THEIR chart, no couple math yet, that comes in the rows below.
const LIFE_BALANCE_SOLO_LINE=[
  (n,s,w)=>`Right now, ${n}'s own chart leans most into ${s.label.toLowerCase()} (${s.pct.toFixed(0)}%), with ${w.label.toLowerCase()} sitting quietest (${w.pct.toFixed(0)}%).`,
  (n,s,w)=>`${n}'s life currently concentrates most around ${s.label.toLowerCase()} (${s.pct.toFixed(0)}%), while ${w.label.toLowerCase()} stays comparatively in the background (${w.pct.toFixed(0)}%).`
];
function lifeBalanceSoloLine(name,areas,seed){
  const strongest=areas.find(a=>a.rank===1),weakest=areas.find(a=>a.rank===areas.length);
  return pickVariant(LIFE_BALANCE_SOLO_LINE,seed)(name,strongest,weakest);
}
// Reuses the Life Areas tab's own slim-pill meter classes (rather than the generic app-wide
// strengthMeter) so both tabs share one visual language, filled with this specific partner's own
// elemental colour instead of a fixed shade.
function lifeBalanceMeterHtml(pct,color){
  return`<div class="life-area-meter-track" style="margin-top:2px"><div class="life-area-meter-fill" style="width:${pct}%;background:${color}"></div></div>`;
}
function lifeBalanceIndividualCardHtml(name,areas,glowColor,seed){
  const rows=areas.map(a=>`<div style="margin-bottom:10px">
    <div style="display:flex;justify-content:space-between;font-size:12px;color:#ccc;margin-bottom:3px"><span>${a.label}</span><span style="color:#888">${a.pct.toFixed(0)}%</span></div>
    ${lifeBalanceMeterHtml(a.pct,glowColor)}
  </div>`).join('');
  return`<div class="mangal-partner-card">
    <div class="mangal-partner-name">${name}</div>
    <div class="seg-sub" style="margin-bottom:12px">${lifeBalanceSoloLine(name,areas,seed)}</div>
    ${rows}
  </div>`;
}

// "How you balance each other" - per-area read, bucketed by the same `kind` calcLifeBalance already
// computed. Every template takes the full (nameA,nameB,area,pctA,pctB,stronger,weaker) signature even
// where a given kind ignores some of it, so one dispatcher can call any of them uniformly.
const LIFE_BALANCE_LINE={
  sharedStrength:[
    (A,B,area,pA,pB)=>`${A} and ${B} are both genuinely strong here (${pA}% and ${pB}%), a real shared strength you can lean on together rather than one of you carrying it alone.`,
    (A,B,area,pA,pB)=>`This is a place you reinforce each other rather than compete: both charts run strong in ${area.toLowerCase()} (${pA}%, ${pB}%).`
  ],
  sharedGap:[
    (A,B,area,pA,pB)=>`${area} is quietly under-emphasised for both of you right now (${pA}%, ${pB}%). If this relationship is being nudged to focus somewhere together, it's probably here.`,
    (A,B,area,pA,pB)=>`Neither chart concentrates much in ${area.toLowerCase()} at the moment (${pA}%, ${pB}%), a shared blind spot worth deliberately making room for rather than assuming it sorts itself out.`
  ],
  balance:[
    (A,B,area,pA,pB,s,w)=>`${area} splits unevenly between you: ${s} carries real weight here while ${w} carries much less, a place where one of you can genuinely lean on the other instead of both reinventing it.`,
    (A,B,area,pA,pB,s,w)=>`One of you naturally fills the gap the other leaves here: ${s}'s chart runs stronger in ${area.toLowerCase()}, ${w}'s quieter, worth letting that division actually happen instead of both reaching for it.`
  ],
  aligned:[
    (A,B,area,pA,pB)=>`${area} sits at a similar, middling level for both of you (${pA}%, ${pB}%), neither a strength nor a gap, just steady, shared ground.`,
    (A,B,area,pA,pB)=>`Neither of you is especially concentrated or especially quiet here, ${area.toLowerCase()} stays fairly even between your two charts (${pA}%, ${pB}%).`
  ]
};
const LIFE_BALANCE_KIND_LABEL={sharedStrength:'Shared Strength',sharedGap:'Shared Growth Edge',balance:'You Balance Each Other',aligned:'Steady Ground'};
// Identity colours only (gold=A, violet=B, cream=both, grey=neither) - never red/green/amber, this
// is the one badge in the app that deliberately avoids the good/bad convention other tier badges use.
const LIFE_BALANCE_KIND_COLOR={sharedStrength:'#c9a24b',sharedGap:'#9b86d9',balance:'#e8e2d0',aligned:'#888'};
function lifeBalanceRowText(row,nameA,nameB,seed){
  const pctA=row.pctA.toFixed(0),pctB=row.pctB.toFixed(0);
  const stronger=row.diff>=0?nameA:nameB,weaker=row.diff>=0?nameB:nameA;
  const fn=pickVariant(LIFE_BALANCE_LINE[row.kind],seed);
  return fn(nameA,nameB,row.label,pctA,pctB,stronger,weaker);
}

// The dedicated callout answering "or if their map is skewed one way, that is where life is asking
// them more to focus" directly, rather than leaving it as just one row among six.
function lifeBalanceFocusCallout(rows){
  const gaps=rows.filter(r=>r.kind==='sharedGap');
  if(!gaps.length){
    return`<div class="yd-dasha-note"><span class="chart-headline-spark">&#10022;</span>No single life-area sits quietly low for both of you at once right now, a genuinely good place for this relationship's shared foundation to be in.</div>`;
  }
  const areaList=naturalJoin(gaps.map(g=>g.label));
  return`<div class="yd-dasha-note"><span class="chart-headline-spark">&#10022;</span>${areaList} ${gaps.length>1?'are':'is'} where both of your charts run quietest right now. If this relationship is being asked to focus somewhere together, rather than lean on whichever of you is individually stronger, it's probably ${gaps.length>1?'here':'here'}.</div>`;
}

const LIFE_BALANCE_METHODOLOGY='This overlays both partners\' individual Life Maps (see the Life Map tab\'s own methodology for how each person\'s percentages are built - 80% D1 chart, 15% D9 Navamsa, 5% Shadbala/Avastha/Argala) on one radar and reads the two together. "Shared Strength" and "Shared Growth Edge" mark areas where both charts land on the same side (both &ge;58%, or both &lt;42%); "You Balance Each Other" marks areas where the two charts differ by 18 points or more (one stronger, one quieter); everything else reads as "Steady Ground". These four bands are a simple, disclosed threshold read on top of each person\'s own already-calculated Life Map, not a new classical technique or a fifth independent score.';

function renderLifeBalanceHtml(chartDataA,chartDataB){
  const nameA=chartDataA.name||'Partner A',nameB=chartDataB.name||'Partner B';
  const data=calcLifeBalance(chartDataA,chartDataB);
  if(!data)return'<div class="yd-empty">Life Balance needs both charts fully calculated.</div>';
  const{areasA,areasB,rows}=data;
  const glowA=LIFE_BALANCE_COLOR_A,glowB=LIFE_BALANCE_COLOR_B;
  const legend=`<div class="life-balance-legend">
    <span class="life-balance-legend-item"><span class="life-balance-dot" style="background:${glowA}"></span>${nameA}</span>
    <span class="life-balance-legend-item"><span class="life-balance-dot" style="background:${glowB}"></span>${nameB}</span>
  </div>`;
  const individualCards=`<div class="mangal-partner-grid">
    ${lifeBalanceIndividualCardHtml(nameA,areasA,glowA,1)}
    ${lifeBalanceIndividualCardHtml(nameB,areasB,glowB,2)}
  </div>`;
  const balanceRows=rows.map((r,i)=>{
    const color=LIFE_BALANCE_KIND_COLOR[r.kind];
    return`<div class="life-balance-row">
      <div class="life-balance-row-head">
        <span class="life-balance-row-label">${r.label}</span>
        <span class="rel-badge" style="background:${color}22;color:${color};border:1px solid ${color}55">${LIFE_BALANCE_KIND_LABEL[r.kind]}</span>
      </div>
      <div class="seg-sub">${lifeBalanceRowText(r,nameA,nameB,i)}</div>
    </div>`;
  }).join('');
  return`<div class="shadbala-intro" style="margin-bottom:14px">
      <span class="info-icon" id="lifebalance-info-trigger">i</span>
      <span style="font-size:12.5px;color:#888">Tap the info icon for methodology &amp; simplification notes</span>
    </div>
    <div class="shadbala-card life-area-radar-card">
      <div class="seg-sub" style="text-align:center;margin-bottom:6px">${nameA} &amp; ${nameB}'s Life Maps, overlaid</div>
      ${lifeBalanceRadarSvg(areasA,areasB,glowA,glowB)}
      ${legend}
    </div>
    <div class="section-title" style="margin-top:1.4rem">What Each of You Holds</div>
    ${individualCards}
    <div class="section-title" style="margin-top:1.4rem">How You Balance Each Other</div>
    <div class="shadbala-card">${balanceRows}</div>
    <div style="margin-top:1.2rem">${lifeBalanceFocusCallout(rows)}</div>`;
}
