/* ============================================================
   TAB RENDERING
   Panchang & Nakshatra-Koota cards, planet positions table, Dasha
   list with nested Antardasha/Pratyantardasha/Sookshma expansion,
   Karakas, Yogas & Doshas, Shadbala, Bhava Bala, Ishta/Kashta,
   Avastha, AI reading, and the showTab() router.
   ============================================================ */
function renderPanchang(){
  if(!chartData||!chartData.panchang)return;
  const{tithi,yoga,karana,vara}=chartData.panchang;
  const grid=document.getElementById('panchang-grid');
  const yogaColor=NITYA_YOGA_BADGE_COLOR[yoga.nature]||'#999';
  grid.innerHTML=`
    <div class="panchang-card">
      <div class="panchang-label">Vara (Weekday)</div>
      <div class="panchang-value">${vara.name}</div>
      <div class="panchang-sub">${vara.info}</div>
    </div>
    <div class="panchang-card">
      <div class="panchang-label">Tithi (Lunar Day)</div>
      <div class="panchang-value">${tithi.paksha} ${tithi.name}</div>
      <div class="panchang-sub">${tithi.type} tithi — ${tithi.typeInfo}</div>
    </div>
    <div class="panchang-card">
      <div class="panchang-label">Nitya Yoga</div>
      <div class="panchang-value">${yoga.name} <span class="panchang-nature-tag" style="color:${yogaColor};border-color:${yogaColor}66;background:${yogaColor}1a">${yoga.nature}</span></div>
      <div class="panchang-sub">Signifies ${yoga.meaning}.</div>
    </div>
    <div class="panchang-card">
      <div class="panchang-label">Karana (Half-Tithi)</div>
      <div class="panchang-value">${karana.name}</div>
      <div class="panchang-sub">${karana.info}</div>
    </div>
  `;
}

function renderNakshatraKoota(){
  if(!chartData||!chartData.moonNakKoota)return;
  const{moonNakKoota,ascNakKoota,moonRashiVarna,planetData,lagnaSign}=chartData;
  const moonNakName=planetData.Moon.nakshatra.name;
  const ascNakName=getNakshatra(chartData.ascSid).name;
  const grid=document.getElementById('nakshatra-koota-grid');
  grid.innerHTML=`
    <div class="koota-card">
      <div class="koota-card-head">Moon Nakshatra — ${moonNakName}</div>
      <div class="koota-row"><span class="koota-key">Gana</span><span class="koota-val">${moonNakKoota.ganaInfo.label}</span></div>
      <div class="koota-desc">${moonNakKoota.ganaInfo.desc}</div>
      <div class="koota-row"><span class="koota-key">Yoni</span><span class="koota-val">${moonNakKoota.yoni}</span></div>
      <div class="koota-desc">Instinctual animal symbol — used in marriage compatibility (Yoni Koota) to assess temperament alignment.</div>
      <div class="koota-row"><span class="koota-key">Nadi</span><span class="koota-val">${moonNakKoota.nadiInfo.label}</span></div>
      <div class="koota-desc">${moonNakKoota.nadiInfo.desc}</div>
    </div>
    <div class="koota-card">
      <div class="koota-card-head">Moon Rashi — ${SIGNS[planetData.Moon.sign]}</div>
      <div class="koota-row"><span class="koota-key">Varna</span><span class="koota-val">${moonRashiVarna.varna}</span></div>
      <div class="koota-desc">${moonRashiVarna.varnaInfo}</div>
      <div class="koota-row"><span class="koota-key">Tatva</span><span class="koota-val">${moonRashiVarna.tatva}</span></div>
      <div class="koota-desc">${moonRashiVarna.tatvaInfo}</div>
    </div>
    <div class="koota-card">
      <div class="koota-card-head">Ascendant Nakshatra — ${ascNakName}</div>
      <div class="koota-row"><span class="koota-key">Gana</span><span class="koota-val">${ascNakKoota.ganaInfo.label}</span></div>
      <div class="koota-desc">Colours outward temperament and first impression, distinct from the Moon's inner Gana.</div>
      <div class="koota-row"><span class="koota-key">Yoni</span><span class="koota-val">${ascNakKoota.yoni}</span></div>
      <div class="koota-row"><span class="koota-key">Nadi</span><span class="koota-val">${ascNakKoota.nadiInfo.label}</span></div>
    </div>
  `;
}

function renderPlanetTable(pd,lagnaSign,asc){
  const tbody=document.getElementById('planet-tbody');
  let rows=`<tr><td>Ascendant</td><td>${SIGNS[lagnaSign]}</td><td>—</td><td>${getDeg(asc).toFixed(1)}°</td><td>${getNakshatra(asc).name} (pada ${getNakshatra(asc).pada})</td><td>—</td></tr>`;
  rows+=PLANETS.map(p=>{
    const d=pd[p];
    const comp=compoundRelation(p,d.sign,pd,d.house);
    let relLabel=relationBadge(comp.relation);
    if(comp.dignity==='exalted')relLabel+=`<span class="dignity-tag dignity-exalted">Exalted</span>`;
    else if(comp.dignity==='debilitated')relLabel+=`<span class="dignity-tag dignity-debilitated">Debilitated</span>`;
    else if(comp.dignity==='own'||comp.dignity==='moolatrikona')relLabel+=`<span class="dignity-tag dignity-own">Own sign</span>`;
    return`<tr><td>${p}</td><td>${SIGNS[d.sign]}</td><td>H${d.house}</td><td>${d.deg.toFixed(1)}°</td><td>${d.nakshatra.name} (pada ${d.nakshatra.pada})</td><td>${relLabel}</td></tr>`;
  }).join('');
  tbody.innerHTML=rows;
}

// --- Navamsa (D9) chart wheel - mirrors the Rashi wheel visual style but uses D9 placements ---
function drawNavamsaChart(){
  if(!chartData||!chartData.navamsa)return;
  const{navAscSign,navHouseMap}=chartData.navamsa;
  const svg=document.getElementById('navamsa-svg');
  if(!svg)return;
  const cx=130,cy=130,outerR=124,innerR=92,labelR=109,planetR=58;
  const gridColor='#2a2a2a',rimColor='#f59e0b';

  function polar(r,angleDeg){
    const a=(angleDeg-90)*Math.PI/180;
    return{x:cx+r*Math.cos(a),y:cy+r*Math.sin(a)};
  }
  function wedgeAngles(houseIdx){
    return{start:15-(houseIdx-1)*30,end:15-houseIdx*30,mid:-(houseIdx-1)*30};
  }
  function arcPath(rOuter,rInner,startDeg,endDeg){
    const p1=polar(rOuter,startDeg),p2=polar(rOuter,endDeg);
    const p3=polar(rInner,endDeg),p4=polar(rInner,startDeg);
    return`M${p1.x.toFixed(2)},${p1.y.toFixed(2)} A${rOuter},${rOuter} 0 0,0 ${p2.x.toFixed(2)},${p2.y.toFixed(2)} L${p3.x.toFixed(2)},${p3.y.toFixed(2)} A${rInner},${rInner} 0 0,1 ${p4.x.toFixed(2)},${p4.y.toFixed(2)} Z`;
  }

  let svgContent='';
  let wedgeLayer='';
  for(let h=1;h<=12;h++){
    const ang=wedgeAngles(h);
    wedgeLayer+=`<path id="nav-wedge-fill-${h}" d="${arcPath(outerR,innerR,ang.start,ang.end)}" class="wedge-hit house-highlight" fill="rgba(0,0,0,0)" stroke="none" onclick="showNavamsaSegmentDetail(${h})"/>`;
  }
  svgContent+=wedgeLayer;
  svgContent+=`<circle cx="${cx}" cy="${cy}" r="${outerR}" fill="none" stroke="${rimColor}" stroke-width="1.2" pointer-events="none"/>`;
  svgContent+=`<circle cx="${cx}" cy="${cy}" r="${innerR}" fill="none" stroke="${gridColor}" stroke-width="0.7" pointer-events="none"/>`;

  for(let h=1;h<=12;h++){
    const ang=wedgeAngles(h);
    const p1=polar(outerR,ang.start);
    svgContent+=`<line x1="${cx}" y1="${cy}" x2="${p1.x.toFixed(2)}" y2="${p1.y.toFixed(2)}" stroke="${gridColor}" stroke-width="0.6" pointer-events="none"/>`;
    const signIdx=(navAscSign+h-1)%12;
    const labelPos=polar(labelR,ang.mid);
    const iconSize=20;
    svgContent+=`<g transform="translate(${(labelPos.x-iconSize/2).toFixed(2)},${(labelPos.y-iconSize/2).toFixed(2)})" pointer-events="none">${signIconSvg(signIdx,iconSize,'#fff',0.55)}</g>`;
    const hNumPos=polar(innerR+3,ang.mid);
    svgContent+=`<text x="${hNumPos.x.toFixed(2)}" y="${hNumPos.y.toFixed(2)}" text-anchor="middle" dominant-baseline="middle" font-size="6.5" fill="#444" font-family="-apple-system,sans-serif" pointer-events="none">${h}</text>`;

    const planets=navHouseMap[h]||[];
    const items=h===1?['ASC',...planets]:planets.slice();
    if(items.length){
      const n=items.length,rowPitch=20,iconSize2=11;
      const startR=planetR+(n-1)*rowPitch/2;
      const rotateDeg=ang.mid;
      items.forEach((p,j)=>{
        const rowR=startR-j*rowPitch;
        const iconCenter=polar(rowR+5,ang.mid);
        const isAsc=p==='ASC';
        if(isAsc){
          svgContent+=`<g transform="rotate(${rotateDeg.toFixed(2)} ${iconCenter.x.toFixed(2)} ${iconCenter.y.toFixed(2)})" pointer-events="none"><text x="${iconCenter.x.toFixed(2)}" y="${iconCenter.y.toFixed(2)}" text-anchor="middle" dominant-baseline="central" font-size="9.5" fill="#f59e0b" font-family="-apple-system,sans-serif" font-weight="700">Asc</text></g>`;
        }else{
          svgContent+=`<g transform="rotate(${rotateDeg.toFixed(2)} ${iconCenter.x.toFixed(2)} ${iconCenter.y.toFixed(2)}) translate(${(iconCenter.x-iconSize2/2).toFixed(2)},${(iconCenter.y-iconSize2/2).toFixed(2)})" pointer-events="none">${planetIconSvg(p,iconSize2,'#f59e0b',1)}</g>`;
        }
      });
    }
  }
  const ascTip=polar(outerR+8,0),ascL=polar(outerR+2,-4),ascR2=polar(outerR+2,4);
  svgContent+=`<polygon points="${ascTip.x.toFixed(1)},${ascTip.y.toFixed(1)} ${ascL.x.toFixed(1)},${ascL.y.toFixed(1)} ${ascR2.x.toFixed(1)},${ascR2.y.toFixed(1)}" fill="${rimColor}" pointer-events="none"/>`;
  svgContent+=`<circle cx="${cx}" cy="${cy}" r="2" fill="${rimColor}"/>`;
  svg.innerHTML=svgContent;
}

function showNavamsaSegmentDetail(house){
  if(!chartData||!chartData.navamsa)return;
  const{navAscSign,navHouseMap}=chartData.navamsa;
  const signIdx=(navAscSign+house-1)%12;
  const planets=navHouseMap[house]||[];
  const panel=document.getElementById('navamsa-segment-detail');
  const watermarkSvg=signIconSvg(signIdx,128,'#fff',1);
  let planetChips=planets.length?planets.map(p=>{
    return`<div class="planet-chip">
      <div class="planet-chip-icon">${planetIconSvg(p,30,'#f59e0b',1)}</div>
      <div class="planet-chip-body"><div class="planet-chip-name">${p}</div></div>
    </div>`;
  }).join(''):'<div class="planet-chip empty"><span style="opacity:0.3;font-size:18px">—</span><div class="planet-chip-nak">No planets in this Navamsa house</div></div>';
  panel.innerHTML=`
    <div class="seg-watermark">${watermarkSvg}</div>
    <span class="seg-close" onclick="document.getElementById('navamsa-segment-detail').classList.add('hidden')">✕</span>
    <div class="seg-header">
      <div class="seg-rashi-icon">${signIconSvg(signIdx,36,'#f59e0b',1)}</div>
      <div><div class="seg-title">D9 House ${house} · ${SIGNS[signIdx]}</div><div class="seg-sub">Ruled by ${SIGN_LORD[signIdx]}</div></div>
    </div>
    <div class="planet-chip-row">${planetChips}</div>
  `;
  panel.classList.remove('hidden');
}

function renderNavamsaTable(){
  if(!chartData||!chartData.navamsa)return;
  const{navPlanetSign,vargottama}=chartData.navamsa;
  const tbody=document.getElementById('navamsa-tbody');
  tbody.innerHTML=PLANETS.map(p=>{
    const d1Sign=chartData.planetData[p].sign;
    const d9Sign=navPlanetSign[p];
    const isVargottama=vargottama[p];
    return`<tr><td><span class="table-planet-cell">${planetIconSvg(p,14,'#f59e0b',1)} ${p}</span></td><td>${SIGNS[d1Sign]}</td><td>${SIGNS[d9Sign]}</td><td>${isVargottama?'<span class="rel-badge rel-friend">Yes</span>':'<span class="rel-badge rel-neutral">No</span>'}</td></tr>`;
  }).join('');
  renderNavamsaAscCard();
  renderVargottamaSummary();
}

const VARGOTTAMA_INFO='Vargottama ("best of the divisions") is one of the most respected strength indicators in Vedic astrology. A planet is Vargottama when it occupies the exact same zodiac sign in both the Rashi (D1) birth chart and the Navamsa (D9) chart — meaning the outer-life placement (D1) and the inner/karmic placement (D9) fully agree with each other. Since each sign splits into 9 Navamsa divisions, any given planet has roughly a 1-in-9 chance of landing back on its own D1 sign, so this is a meaningfully rare confirmation, not a coincidence.\n\nWhy it matters: most planets show one face in the outer D1 chart and a different, sometimes contradictory face in the inner D9 chart — a kind of inner-outer split. A Vargottama planet has no such split. Its strength and promised results are doubled and far more reliable, especially during that planet\'s Mahadasha and Antardasha periods. If the Ascendant (Lagna) itself is Vargottama, the person\'s outer character and inner nature are unusually well-integrated, and classical texts consider this a significant lifelong blessing. The houses a Vargottama planet rules and occupies matter too — Vargottama in the 6th, 8th, or 12th house is generally considered to intensify difficulty rather than ease, since Vargottama amplifies whatever the placement already signifies, for better or worse.';

function renderNavamsaAscCard(){
  if(!chartData||!chartData.navamsa)return;
  const{navAscSign}=chartData.navamsa;
  const d1AscSign=chartData.lagnaSign;
  const isLagnaVargottama=(navAscSign===d1AscSign);
  const card=document.getElementById('navamsa-asc-card');
  card.innerHTML=`
    <div class="navamsa-asc-icon">${signIconSvg(navAscSign,34,'#f59e0b',1)}</div>
    <div style="flex:1">
      <div class="navamsa-asc-title">Navamsa Ascendant: ${SIGNS[navAscSign]}</div>
      <div class="navamsa-asc-sub">D1 Ascendant: ${SIGNS[d1AscSign]} ${isLagnaVargottama?' · <span style="color:#4ade80;font-weight:600">Vargottama Lagna ✓</span>':''}</div>
    </div>
  `;
}

function renderVargottamaSummary(){
  if(!chartData||!chartData.navamsa)return;
  const{vargottama,navPlanetSign}=chartData.navamsa;
  const container=document.getElementById('vargottama-summary');
  const sectionHeader=document.getElementById('vargottama-section-header');
  const trigger=document.getElementById('vargottama-info-trigger');
  if(trigger)trigger.onclick=function(){showGenericInfo('Vargottama',VARGOTTAMA_INFO.split('\n\n').join('<br><br>'))};

  const vargottamaPlanets=PLANETS.filter(p=>vargottama[p]);

  if(!vargottamaPlanets.length){
    container.innerHTML='';
    if(sectionHeader)sectionHeader.classList.add('hidden');
    return;
  }
  if(sectionHeader)sectionHeader.classList.remove('hidden');

  const overviewChips=vargottamaPlanets.map(p=>`<span class="vargottama-chip">${planetIconSvg(p,13,'#4ade80',1)} ${p} in ${SIGNS[navPlanetSign[p]]}</span>`).join('');

  // Detail cards only for planets that are actually Vargottama
  const planetCards=vargottamaPlanets.map(p=>{
    const d9Sign=navPlanetSign[p];
    const d1Sign=chartData.planetData[p].sign;
    const dignity=getDignity(p,d9Sign,0);
    let specialNote='';
    if(dignity==='exalted')specialNote=`This is an <strong>Uchcha Vargottama</strong> — ${p} is exalted in both D1 and D9, one of the strongest possible placements for a single planet. Its results in this lifetime are doubled, reliable, and significantly amplified.`;
    else if(dignity==='own'||dignity==='moolatrikona')specialNote=`This is a <strong>Swakshetra Vargottama</strong> — ${p} sits in its own sign in both D1 and D9. This gives strong, self-assured, dependable expression of everything ${p} signifies.`;
    else if(dignity==='debilitated')specialNote=`This is a <strong>Neecha Vargottama</strong> — ${p} is debilitated in both D1 and D9. Classical opinion is divided here: some texts say Vargottama still strengthens the planet meaningfully even from debilitation (a kind of "best of a weak position"), while others read this as a doubly-confirmed weak placement. Either way, this placement deserves closer individual attention.`;
    else specialNote=`${p}'s outer (D1) and inner/karmic (D9) placements are in full agreement here — its promised results in ${SIGNS[d9Sign]} are considered more reliable and substantial than an ordinary placement, especially during ${p}'s Dasha and Antardasha periods.`;
    return`<div class="vargottama-planet-card vargottama-yes">
      <div class="shadbala-card-head">
        <div class="karaka-icon">${planetIconSvg(p,24,'#4ade80',1)}</div>
        <div style="flex:1">
          <div class="shadbala-planet-name">${p}</div>
          <div class="seg-sub">D1: ${SIGNS[d1Sign]} &nbsp;·&nbsp; D9: ${SIGNS[d9Sign]}</div>
        </div>
        <div class="shadbala-status sb-strong">Vargottama</div>
      </div>
      <div class="karaka-planet-summary" style="padding-left:0;margin-top:10px;border-top:none">${specialNote}</div>
    </div>`;
  }).join('');

  container.innerHTML=`
    <div class="vargottama-chip-row" style="margin-bottom:1rem">${overviewChips}</div>
    <div class="shadbala-grid">${planetCards}</div>
  `;
}


function renderDashas(dashas){
  const now=new Date();
  document.getElementById('dasha-list').innerHTML=dashas.map((d,i)=>{
    const active=now>=d.start&&now<d.end,pct=Math.min(100,(d.years/20)*100);
    const s=d.start.toLocaleDateString('en-IN',{month:'short',year:'numeric'});
    const e=d.end.toLocaleDateString('en-IN',{month:'short',year:'numeric'});
    const subRows=(d.antardashas||[]).map((sub,j)=>{
      const subActive=now>=sub.start&&now<sub.end;
      const subPct=Math.min(100,(sub.years/d.years)*100);
      const ss=sub.start.toLocaleDateString('en-IN',{month:'short',year:'numeric'});
      const se=sub.end.toLocaleDateString('en-IN',{month:'short',year:'numeric'});
      const pratId=`pratyantar-${i}-${j}`;
      return`<div class="antardasha-row${subActive?' antardasha-active':''}">
        <div class="antardasha-lord">${d.lord}-${sub.lord}${subActive?'<span class="dasha-active-badge">now</span>':''}</div>
        <div class="dasha-bar-wrap antardasha-bar-wrap"><div class="dasha-bar antardasha-bar" style="width:${subPct}%"></div></div>
        <div class="dasha-dates">${ss} – ${se}</div>
        <div class="dasha-chevron" id="chevron-${pratId}" onclick="event.stopPropagation();togglePratyantardasha(${i},${j})">▾</div>
      </div>
      <div class="hidden" id="${pratId}"></div>`;
    }).join('');
    return`<div class="dasha-block">
      <div class="dasha-row${active?' dasha-active':''}" onclick="toggleAntardasha(${i})">
        <div class="dasha-lord">${d.lord}${active?'<span class="dasha-active-badge">now</span>':''}</div>
        <div class="dasha-bar-wrap"><div class="dasha-bar" style="width:${pct}%"></div></div>
        <div class="dasha-dates">${s} – ${e} · ${d.years.toFixed(1)}y</div>
        <div class="dasha-chevron" id="chevron-${i}">▾</div>
      </div>
      <div class="antardasha-list hidden" id="antardasha-${i}">${subRows}</div>
    </div>`;
  }).join('');
}

function toggleAntardasha(i){
  const el=document.getElementById('antardasha-'+i);
  const chev=document.getElementById('chevron-'+i);
  const isHidden=el.classList.contains('hidden');
  el.classList.toggle('hidden');
  chev.textContent=isHidden?'▴':'▾';
}

// Pratyantardasha: sub-periods within an Antardasha (Mahadasha lord - Antardasha lord - Pratyantardasha lord)
function togglePratyantardasha(i,j){
  const wrapId=`pratyantar-${i}-${j}`;
  const wrap=document.getElementById(wrapId);
  const chev=document.getElementById('chevron-'+wrapId);
  const now=new Date();
  const maha=chartData.dashas[i],antar=maha.antardashas[j];
  if(wrap.classList.contains('hidden')){
    if(!wrap.dataset.built){
      const pratyantars=getPratyantardashas(antar);
      wrap.innerHTML=pratyantars.map((prat,k)=>{
        const pratActive=now>=prat.start&&now<prat.end;
        const pratPct=Math.min(100,(prat.years/antar.years)*100);
        const ps=prat.start.toLocaleDateString('en-IN',{month:'short',year:'numeric'});
        const pe=prat.end.toLocaleDateString('en-IN',{month:'short',year:'numeric'});
        const sookshmaId=`sookshma-${i}-${j}-${k}`;
        return`<div class="pratyantar-row${pratActive?' pratyantar-active':''}">
          <div class="pratyantar-lord">${maha.lord}-${antar.lord}-${prat.lord}${pratActive?'<span class="dasha-active-badge">now</span>':''}</div>
          <div class="dasha-bar-wrap"><div class="dasha-bar" style="width:${pratPct}%"></div></div>
          <div class="dasha-dates">${ps} – ${pe}</div>
          <span class="sookshma-toggle" id="toggle-${sookshmaId}" onclick="event.stopPropagation();toggleSookshma(${i},${j},${k})">+ Sookshma</span>
        </div>
        <div class="hidden" id="${sookshmaId}"></div>`;
      }).join('');
      wrap.dataset.built='1';
    }
    wrap.classList.remove('hidden');
    wrap.className='pratyantar-list';
    chev.textContent='▴';
  }else{
    wrap.classList.add('hidden');
    chev.textContent='▾';
  }
}

// Sookshma Dasha: sub-periods within a Pratyantardasha (4th level: Maha-Antar-Pratyantar-Sookshma)
function toggleSookshma(i,j,k){
  const sookshmaId=`sookshma-${i}-${j}-${k}`;
  const wrap=document.getElementById(sookshmaId);
  const toggle=document.getElementById('toggle-'+sookshmaId);
  const now=new Date();
  const maha=chartData.dashas[i],antar=maha.antardashas[j],prat=antar.pratyantardashas[k];
  if(wrap.classList.contains('hidden')){
    if(!wrap.dataset.built){
      const sookshmas=getSookshmaDashas(prat);
      wrap.innerHTML=sookshmas.map(sk=>{
        const skActive=now>=sk.start&&now<sk.end;
        const sks=sk.start.toLocaleDateString('en-IN',{month:'short',year:'numeric'});
        const ske=sk.end.toLocaleDateString('en-IN',{month:'short',year:'numeric'});
        return`<div class="sookshma-row${skActive?' sookshma-active':''}">
          <span>${maha.lord}-${antar.lord}-${prat.lord}-${sk.lord}${skActive?' (now)':''}</span>
          <span class="dasha-dates">${sks} – ${ske}</span>
        </div>`;
      }).join('');
      wrap.dataset.built='1';
    }
    wrap.classList.remove('hidden');
    wrap.className='sookshma-list';
    toggle.textContent='– Sookshma';
  }else{
    wrap.classList.add('hidden');
    toggle.textContent='+ Sookshma';
  }
}

function renderKarakas(){
  if(!chartData)return;
  const{planetData}=chartData;
  const karakas=calcCharaKarakas(planetData);
  chartData.karakas=karakas;
  const list=document.getElementById('karaka-list');
  list.innerHTML=karakas.map(k=>{
    const d=planetData[k.planet];
    return`<div class="karaka-card">
      <div class="karaka-card-head">
        <div class="karaka-icon">${planetIconSvg(k.planet,26,'#f59e0b',1)}</div>
        <div class="karaka-card-titles">
          <div class="karaka-name-row">
            <span class="karaka-name">${k.karaka}</span>
            <span class="karaka-short">(${k.short})</span>
            <span class="info-icon" onclick="showKarakaInfo('${k.karaka}')">i</span>
          </div>
          <div class="seg-sub">${k.planet} · ${SIGNS[d.sign]} ${d.deg.toFixed(2)}° · House ${d.house}</div>
        </div>
      </div>
      <div class="karaka-signifies">${k.signifies}</div>
      <div class="karaka-planet-summary">${karakaPlanetSummary(k.planet,k.karaka)}</div>
    </div>`;
  }).join('');
}

function showKarakaInfo(karakaName){
  const info=KARAKA_INFO[karakaName]||'';
  const overlay=document.createElement('div');
  overlay.className='info-overlay';
  overlay.onclick=function(e){if(e.target===overlay)closeInfoOverlay()};
  overlay.innerHTML=`<div class="info-modal">
    <span class="seg-close" onclick="closeInfoOverlay()">✕</span>
    <div class="seg-title" style="margin-bottom:10px">${karakaName}</div>
    <div class="reading-text">${info}</div>
  </div>`;
  document.body.appendChild(overlay);
}
function closeInfoOverlay(){
  const el=document.querySelector('.info-overlay');
  if(el)el.remove();
}

// =====================================================================
// YOGA / DOSHA TAB RENDERING
// =====================================================================
let activeYDSubtab='yogas';
let activeYDItemIdx=0;

function strengthBarColor(strength,category){
  if(category==='dosha')return strength>=60?'#f87171':strength>=35?'#fbbf24':'#4ade80';
  return strength>=80?'#4ade80':strength>=55?'#f59e0b':'#999';
}

function renderYogasDoshas(){
  if(!chartData)return;
  const{planetData,lagnaSign,houseMap,dashas}=chartData;
  const yogas=detectAllYogas(planetData,lagnaSign,houseMap);
  const doshas=detectAllDoshas(planetData);
  chartData.yogas=yogas;chartData.doshas=doshas;
  showYDSubtab(activeYDSubtab);
}

function showYDSubtab(name){
  activeYDSubtab=name;
  activeYDItemIdx=0;
  document.querySelectorAll('#tab-yogadosha .subtab').forEach((btn,i)=>{
    btn.classList.toggle('active',['yogas','doshas'][i]===name);
  });
  const list=name==='yogas'?(chartData.yogas||[]):(chartData.doshas||[]);
  renderYDList(list,name);
}

function renderYDList(list,category){
  const container=document.getElementById('yd-content');
  if(!list.length){
    container.innerHTML=`<div class="yd-empty">No classical ${category==='yogas'?'Yogas':'Doshas'} were detected as clearly formed in this chart from the combinations this tool checks. This covers many — but not all — classical combinations; a qualified astrologer may identify additional subtler or chart-specific yogas.</div>`;
    return;
  }
  const chips=list.map((item,i)=>`<button class="yd-chip${i===activeYDItemIdx?' active':''}" onclick="selectYDItem(${i})">
    <span class="yd-chip-dot" style="background:${strengthBarColor(item.strength,item.category)}"></span>${item.name}
  </button>`).join('');
  container.innerHTML=`
    <div class="yd-chip-row">${chips}</div>
    <div id="yd-detail"></div>
  `;
  renderYDDetail(list[activeYDItemIdx]);
}

function selectYDItem(i){
  activeYDItemIdx=i;
  const list=activeYDSubtab==='yogas'?chartData.yogas:chartData.doshas;
  document.querySelectorAll('.yd-chip').forEach((c,idx)=>c.classList.toggle('active',idx===i));
  renderYDDetail(list[i]);
}

function renderYDDetail(item){
  if(!item)return;
  const el=document.getElementById('yd-detail');
  const barColor=strengthBarColor(item.strength,item.category);
  const planetIcons=item.planetsInvolved.map(p=>`<span class="yd-planet-tag">${planetIconSvg(p,15,'#f59e0b',1)}${p}</span>`).join('');
  const dashaNote=relevantDashaNote(item.planetsInvolved,chartData.dashas);
  el.innerHTML=`
    <div class="yd-detail-card ${item.category==='dosha'?'yd-dosha-card':'yd-yoga-card'}">
      <div class="yd-detail-head">
        <div>
          <div class="yd-detail-name">${item.name}</div>
          <div class="yd-detail-planets">${planetIcons}</div>
        </div>
        <div class="yd-strength-badge" style="color:${barColor};border-color:${barColor}66;background:${barColor}1a">${item.strengthLabel}</div>
      </div>
      <div class="yd-strength-bar-wrap"><div class="yd-strength-bar" style="width:${item.strength}%;background:${barColor}"></div></div>
      <div class="yd-section-label">How it is formed</div>
      <div class="yd-detail-text">${item.formation}</div>
      <div class="yd-section-label">What it signifies</div>
      <div class="yd-detail-text">${item.signifies}</div>
      ${dashaNote?`<div class="yd-dasha-note"><span class="info-icon" style="border-color:${barColor};color:${barColor}">i</span>${dashaNote}</div>`:''}
    </div>
  `;
}

const SHADBALA_INFO='Shadbala ("six-fold strength") is the classical Vedic method for measuring how capable a planet is of delivering the results promised by its sign and house placement. The six components are: Sthana Bala (positional strength — exaltation, sign dignity via 5-fold Panchadha Maitri relationship, odd/even placement, angularity, decanate), Dig Bala (directional strength), Kala Bala (temporal strength — day/night, lunar phase, weekday, declination; Jupiter always receives a fixed +60V Tribhaga bonus per classical rule regardless of birth time), Cheshta Bala (motional strength from retrograde/direct motion — by classical rule (BPHS 27.18) Sun and Moon route their motional strength through Ayana Bala and Paksha Bala respectively rather than Cheshta, since they never retrograde), Naisargika Bala (fixed natural strength by brightness — identical in every chart: Sun 60V down to Saturn 8.57V), and Drik Bala (graded aspect strength: 7th aspect=full, Mars 4th/8th=3/4, Jupiter 5th/9th=1/2, Saturn 3rd/10th=1/4 — benefic aspects add, malefic aspects subtract, and this is the only component that can go negative by classical design). The six are summed into Virupas, then divided by 60 to give Rupas. Each planet needs a different minimum Rupa threshold per BPHS 27.32-33 (Sun 6.5, Moon 6, Mars 5, Mercury 7, Jupiter 6.5, Venus 5.5, Saturn 5) to be considered functionally strong. Known point of disagreement among classical commentators: whether the Moon\'s own Paksha Bala should be doubled (max 120V vs 60V) — Santhanam\'s BPHS translation and B.V. Raman double it, while Sripati and the Girish Chand Sharma translation do not; this tool follows the doubling convention. Simplification notes: Saptavargaja Bala here uses the Rasi (D1) chart with full Panchadha Maitri (natural + temporal friendship) rather than averaging across all seven classical divisional charts (D1,D2,D3,D7,D9,D10,D12); Kala Bala uses a fixed 6am/6pm sunrise-sunset approximation rather than location-and-date-specific sunrise; Cheshta Bala for Mars-Saturn uses observed motion sampling rather than the exact classical Sighra Kendra formula; Yuddha (planetary war) bala is not modeled. Treat exact decimal values as indicative rather than to-the-decimal classical precision — different Shadbala calculators can legitimately disagree by 10-30% depending on which classical commentary they follow.';

function renderShadbala(){
  if(!chartData||!chartData.shadbala)return;
  const sb=chartData.shadbala;
  const container=document.getElementById('shadbala-content');

  const sortedPlanets=[...SHADBALA_PLANETS].sort((a,b)=>sb[b].totalRupas-sb[a].totalRupas);

  const summaryRows=sortedPlanets.map(p=>{
    const s=sb[p];
    const strong=s.totalRupas>=s.required;
    return`<tr><td><span class="table-planet-cell">${planetIconSvg(p,14,'#f59e0b',1)} ${p}</span></td><td>${s.totalRupas.toFixed(2)}</td><td>${s.required}</td><td>${s.pct.toFixed(0)}%</td><td>${strong?'<span class="rel-badge rel-friend">Strong</span>':'<span class="rel-badge rel-enemy">Below min</span>'}</td></tr>`;
  }).join('');

  const perPlanetCards=sortedPlanets.map(p=>{
    const s=sb[p];
    const pct=Math.min(100,s.pct);
    const strong=s.totalRupas>=s.required;
    return`<div class="shadbala-card">
      <div class="shadbala-card-head">
        <div class="karaka-icon">${planetIconSvg(p,24,'#f59e0b',1)}</div>
        <div style="flex:1">
          <div class="shadbala-planet-name">${p}</div>
          <div class="seg-sub">${s.totalRupas.toFixed(2)} Rupas of ${s.required} required</div>
        </div>
        <div class="shadbala-status ${strong?'sb-strong':'sb-weak'}">${strong?'Strong':'Below min'}</div>
      </div>
      <div class="dasha-bar-wrap" style="height:6px;margin:8px 0"><div class="dasha-bar" style="width:${pct}%;background:${strong?'#22c55e':'#f59e0b'}"></div></div>
      <table class="shadbala-breakdown">
        <tr><td>Sthana Bala</td><td>${(s.sthana.total).toFixed(1)} V</td></tr>
        <tr><td style="padding-left:14px;color:#666">— Uchcha (exaltation)</td><td style="color:#666">${s.sthana.uchcha.toFixed(1)} V</td></tr>
        <tr><td style="padding-left:14px;color:#666">— Saptavargaja*</td><td style="color:#666">${s.sthana.saptavargaja.toFixed(1)} V</td></tr>
        <tr><td style="padding-left:14px;color:#666">— Ojayugma</td><td style="color:#666">${s.sthana.ojayugma.toFixed(1)} V</td></tr>
        <tr><td style="padding-left:14px;color:#666">— Kendradi</td><td style="color:#666">${s.sthana.kendradi.toFixed(1)} V</td></tr>
        <tr><td style="padding-left:14px;color:#666">— Drekkana</td><td style="color:#666">${s.sthana.drekkana.toFixed(1)} V</td></tr>
        <tr><td>Dig Bala</td><td>${s.dig.toFixed(1)} V</td></tr>
        <tr><td>Kala Bala*</td><td>${s.kala.total.toFixed(1)} V</td></tr>
        <tr><td>Cheshta Bala</td><td>${s.cheshta.toFixed(1)} V</td></tr>
        <tr><td>Naisargika Bala</td><td>${s.naisargika.toFixed(1)} V</td></tr>
        <tr><td>Drik Bala</td><td>${s.drik.toFixed(1)} V</td></tr>
        <tr class="shadbala-total-row"><td>Total</td><td>${s.totalVirupa.toFixed(1)} V = ${s.totalRupas.toFixed(2)} Rupas</td></tr>
      </table>
    </div>`;
  }).join('');

  container.innerHTML=`
    <div class="shadbala-intro">
      <span class="info-icon" id="sb-info-trigger">i</span>
      <span style="font-size:12.5px;color:#888">Tap the info icon for methodology &amp; simplification notes (marked with *)</span>
    </div>
    <div style="overflow-x:auto">
    <table class="planet-table">
      <thead><tr><th>Planet</th><th>Total Rupas</th><th>Required</th><th>% of Min</th><th>Status</th></tr></thead>
      <tbody>${summaryRows}</tbody>
    </table>
    </div>
    <div class="section-title" style="margin-top:1.5rem">Full breakdown per planet</div>
    <div class="shadbala-grid">${perPlanetCards}</div>
  `;
  document.getElementById('sb-info-trigger').onclick=function(){showGenericInfo('Shadbala Methodology',SHADBALA_INFO)};
}

const BHAVA_BALA_INFO='Bhava Bala ("house strength") measures how capable a house is of delivering the results it promises — independent of which planets sit inside it. The formula is: Bhavadhipati Bala (the house lord\'s own total Shadbala — a strong lord empowers its house) + Bhava Dig Bala (Kendra/angular houses 1,4,7,10 get 60V; Panapara/succedent houses 2,5,8,11 get 30V; Apoklima/cadent houses 3,6,9,12 get 15V) + Bhava Drishti Bala (the same graded aspect formula used for planets, applied to the house itself — benefic aspects strengthen it, malefic aspects weaken it). A strong house supports the life area it governs even if no major planet occupies it; a weak house may struggle to deliver even when a strong planet sits there. Compare houses relative to each other rather than against a fixed number — there is no universal "required minimum" for houses the way there is for planets.';

function renderBhavaBalaSection(){
  if(!chartData||!chartData.bhavaBala)return;
  const container=document.getElementById('bhava-bala-content');
  container.innerHTML=`
    <div class="shadbala-intro">
      <span class="info-icon" id="bb-info-trigger">i</span>
      <span style="font-size:12.5px;color:#888">Bhavadhipati (house lord's Shadbala) + Bhava Dig Bala + Bhava Drishti Bala</span>
    </div>
    <div id="bhava-bala-chart"></div>
    <div style="overflow-x:auto;margin-top:14px">
    <table class="planet-table">
      <thead><tr><th>House</th><th>Sign</th><th>Lord</th><th>Bhavadhipati</th><th>Dig</th><th>Drishti</th><th>Total Rupas</th></tr></thead>
      <tbody id="bhava-bala-tbody"></tbody>
    </table>
    </div>
  `;
  document.getElementById('bb-info-trigger').onclick=function(){showGenericInfo('Bhava Bala Methodology',BHAVA_BALA_INFO)};
  renderBhavaBalaChart();
}

function renderBhavaBalaChart(){
  if(!chartData||!chartData.bhavaBala)return;
  const bb=chartData.bhavaBala;
  const maxRupas=Math.max(...Array.from({length:12},(_,i)=>bb[i+1].totalRupas));
  const barW=28,gap=10,chartH=160,leftPad=10;
  let svg=`<svg viewBox="0 0 ${12*(barW+gap)+leftPad} ${chartH+30}" style="width:100%;height:auto;max-width:560px;display:block;margin:0 auto">`;
  for(let h=1;h<=12;h++){
    const r=bb[h];
    const barH=Math.max(2,(r.totalRupas/maxRupas)*chartH);
    const x=leftPad+(h-1)*(barW+gap);
    const y=chartH-barH+10;
    const isStrong=r.totalRupas>=maxRupas*0.6;
    svg+=`<rect x="${x}" y="${y}" width="${barW}" height="${barH}" rx="3" fill="${isStrong?'#f59e0b':'#444'}" opacity="0.9"/>`;
    svg+=`<text x="${x+barW/2}" y="${chartH+24}" text-anchor="middle" font-size="10" fill="#888" font-family="-apple-system,sans-serif">H${h}</text>`;
    svg+=`<text x="${x+barW/2}" y="${y-5}" text-anchor="middle" font-size="9" fill="#f59e0b" font-family="-apple-system,sans-serif" font-weight="600">${r.totalRupas.toFixed(1)}</text>`;
  }
  svg+=`</svg>`;
  document.getElementById('bhava-bala-chart').innerHTML=svg;

  const tbody=document.getElementById('bhava-bala-tbody');
  tbody.innerHTML=Array.from({length:12},(_,i)=>{
    const h=i+1,r=bb[h];
    return`<tr><td>House ${h}</td><td>${SIGNS[r.sign]}</td><td>${r.lord}</td><td>${r.bhavadhipati.toFixed(1)}V</td><td>${r.dig.toFixed(1)}V</td><td>${r.drishti.toFixed(2)}V</td><td><strong style="color:#f59e0b">${r.totalRupas.toFixed(2)}</strong></td></tr>`;
  }).join('');
}

function showShadbalaSubtab(name){
  const subs=['planets','houses','ishtakashta'];
  subs.forEach(s=>{document.getElementById('shadbala-sub-'+s).classList.toggle('hidden',s!==name)});
  document.querySelectorAll('#tab-shadbala .subtab').forEach((btn,i)=>{btn.classList.toggle('active',subs[i]===name)});
  if(name==='houses')renderBhavaBalaSection();
  if(name==='ishtakashta')renderIshtaKashta();
}

const ISHTA_KASHTA_INFO='Ishta Phala ("favourable result") and Kashta Phala ("difficult result") measure how much a planet\'s placement actively HELPS or ACTIVELY HINDERS its own results — distinct from Shadbala\'s overall strength. The formula (BPHS Chapter 30) is: Ishta Phala = √(Uchcha Bala × Cheshta Bala), Kashta Phala = √((60−Uchcha Bala) × (60−Cheshta Bala)), where Uchcha Bala is exaltation-distance strength and Cheshta Bala is motional strength (for Sun, Ayana Bala substitutes for Cheshta; for Moon, Paksha Bala substitutes, per the classical rule).\\n\\nA planet can be strong overall (high Shadbala) yet still lean toward Kashta if it is far from exaltation and moving slowly/awkwardly — strength and favourability are not the same thing. A high Ishta Phala means the planet readily gives sweet, easy results; a high Kashta Phala means the planet\'s results come with more friction, delay, or difficulty, even if the planet is otherwise classically "strong." Compare the Ishta and Kashta values for each planet side by side rather than looking at either number alone.';

function renderIshtaKashta(){
  if(!chartData||!chartData.ishtaKashta)return;
  const ik=chartData.ishtaKashta;
  const container=document.getElementById('ishta-kashta-content');
  const sortedPlanets=[...SHADBALA_PLANETS].sort((a,b)=>ik[b].net-ik[a].net);
  const maxVal=60; // theoretical max for sqrt(60*60)

  const barW=32,gap=14,chartH=150,leftPad=10;
  let svg=`<svg viewBox="0 0 ${7*(barW*2+gap)+leftPad} ${chartH+40}" style="width:100%;height:auto;max-width:620px;display:block;margin:0 auto">`;
  SHADBALA_PLANETS.forEach((p,i)=>{
    const r=ik[p];
    const ishtaH=Math.max(2,(r.ishta/maxVal)*chartH);
    const kashtaH=Math.max(2,(r.kashta/maxVal)*chartH);
    const groupX=leftPad+i*(barW*2+gap);
    svg+=`<rect x="${groupX}" y="${chartH-ishtaH+10}" width="${barW}" height="${ishtaH}" rx="3" fill="#4ade80" opacity="0.9"/>`;
    svg+=`<rect x="${groupX+barW+2}" y="${chartH-kashtaH+10}" width="${barW}" height="${kashtaH}" rx="3" fill="#f87171" opacity="0.9"/>`;
    svg+=`<text x="${groupX+barW}" y="${chartH+24}" text-anchor="middle" font-size="9.5" fill="#888" font-family="-apple-system,sans-serif">${PLANET_SYM[p]||p.slice(0,2)}</text>`;
    svg+=`<text x="${groupX+barW/2}" y="${chartH-ishtaH+5}" text-anchor="middle" font-size="8" fill="#4ade80" font-family="-apple-system,sans-serif" font-weight="600">${r.ishta.toFixed(0)}</text>`;
    svg+=`<text x="${groupX+barW+2+barW/2}" y="${chartH-kashtaH+5}" text-anchor="middle" font-size="8" fill="#f87171" font-family="-apple-system,sans-serif" font-weight="600">${r.kashta.toFixed(0)}</text>`;
  });
  svg+=`</svg>`;

  const summaryRows=sortedPlanets.map(p=>{
    const r=ik[p];
    const verdict=r.net>10?'Favourable':r.net<-10?'Difficult':'Mixed';
    const cls=r.net>10?'rel-friend':r.net<-10?'rel-enemy':'rel-neutral';
    return`<tr><td><span class="table-planet-cell">${planetIconSvg(p,14,'#f59e0b',1)} ${p}</span></td><td style="color:#4ade80">${r.ishta.toFixed(1)}</td><td style="color:#f87171">${r.kashta.toFixed(1)}</td><td><span class="rel-badge ${cls}">${verdict}</span></td></tr>`;
  }).join('');

  const narratives=sortedPlanets.map(p=>{
    const r=ik[p];
    let text;
    if(r.net>15)text=`${p} leans strongly toward Ishta Phala (favourable) — its placement readily delivers sweet, easy results in its significations and during its periods.`;
    else if(r.net>5)text=`${p} leans mildly toward Ishta Phala — generally helpful results, with occasional friction.`;
    else if(r.net<-15)text=`${p} leans strongly toward Kashta Phala (difficult) — its results in its significations tend to come with real friction, delay, or struggle, even where the planet has other classical strengths.`;
    else if(r.net<-5)text=`${p} leans mildly toward Kashta Phala — some difficulty or extra effort is typically needed before this planet\'s results show.`;
    else text=`${p} is fairly balanced between Ishta and Kashta — neither notably easy nor notably difficult in how it delivers results.`;
    return`<div class="ik-narrative"><strong>${p}</strong> (Ishta ${r.ishta.toFixed(1)} / Kashta ${r.kashta.toFixed(1)}): ${text}</div>`;
  }).join('');

  container.innerHTML=`
    <div class="shadbala-intro">
      <span class="info-icon" id="ik-info-trigger">i</span>
      <span style="font-size:12.5px;color:#888">Ishta Phala (favourable) vs Kashta Phala (difficult) per planet</span>
    </div>
    ${svg}
    <div class="ik-legend"><span class="ik-legend-item"><span class="ik-dot" style="background:#4ade80"></span>Ishta Phala</span><span class="ik-legend-item"><span class="ik-dot" style="background:#f87171"></span>Kashta Phala</span></div>
    <div style="overflow-x:auto;margin-top:1rem">
    <table class="planet-table">
      <thead><tr><th>Planet</th><th>Ishta Phala</th><th>Kashta Phala</th><th>Verdict</th></tr></thead>
      <tbody>${summaryRows}</tbody>
    </table>
    </div>
    <div class="section-title" style="margin-top:1.5rem">Per-planet summary</div>
    <div class="ik-narrative-list">${narratives}</div>
  `;
  document.getElementById('ik-info-trigger').onclick=function(){showGenericInfo('Ishta Phala vs Kashta Phala',ISHTA_KASHTA_INFO.split('\n\n').join('<br><br>'))};
}

function showGenericInfo(title,text){
  const overlay=document.createElement('div');
  overlay.className='info-overlay';
  overlay.onclick=function(e){if(e.target===overlay)closeInfoOverlay()};
  overlay.innerHTML=`<div class="info-modal">
    <span class="seg-close" onclick="closeInfoOverlay()">✕</span>
    <div class="seg-title" style="margin-bottom:10px">${title}</div>
    <div class="reading-text">${text}</div>
  </div>`;
  document.body.appendChild(overlay);
}

const AVASTHA_INFO='Avastha ("state" or "condition") describes the mood and capability of a planet at the moment of birth — much like a person can be energetic or exhausted depending on their condition, a planet can be in a state that helps or hinders its ability to deliver results. This tab covers three classical Avastha systems: Baladi Avastha (5 states based on the planet\'s degree within its sign — like stages of human life from infancy to old age), Jagrat/Swapna/Sushupti Avastha (3 states based on sign dignity — awake/dreaming/sleeping), and Deeptadi Avastha (9 states per BPHS Chapter 49: Dipta=exalted, Swastha=own sign, Mudita=great friend\'s sign, Shanta=friendly sign, Deena=neutral sign, Dukhita=enemy\'s sign, Vikala=conjunct a malefic planet, Khala=inauspicious sign, Kopa=combust). The Summary column combines these into a quick read of how favourably each planet is likely to express itself. Note: Deeptadi\'s combustion (Kopa) check uses simplified fixed orb distances from the Sun, so treat results as indicative.';

function avasthaSummary(j,d){
  // Combine Jagradadi + Deeptadi into a quick favourable/mixed/unfavourable read
  const goodDeeptadi=['Dipta','Swastha','Mudita','Shanta'];
  const badDeeptadi=['Khala','Kopa','Vikala','Dukhita'];
  if(j==='Jagrat'&&goodDeeptadi.includes(d))return{label:'Favourable',cls:'av-good'};
  if(j==='Sushupti'||badDeeptadi.includes(d))return{label:'Unfavourable',cls:'av-bad'};
  return{label:'Mixed',cls:'av-mixed'};
}

function renderAvastha(){
  if(!chartData)return;
  const{planetData,houseMap}=chartData;
  const avasthas=calcAllAvasthas(planetData,planetData.Sun.lon,houseMap);
  chartData.avasthas=avasthas;
  const container=document.getElementById('avastha-content');

  const rows=SHADBALA_PLANETS.map(p=>{
    const a=avasthas[p];
    const summary=avasthaSummary(a.jagradadi,a.deeptadi);
    return`<tr>
      <td><span class="table-planet-cell">${planetIconSvg(p,14,'#f59e0b',1)} ${p}</span></td>
      <td>${a.baladi}</td>
      <td>${a.jagradadi}</td>
      <td>${a.deeptadi}</td>
      <td><span class="rel-badge ${summary.cls}">${summary.label}</span></td>
    </tr>`;
  }).join('');

  container.innerHTML=`
    <div class="shadbala-intro">
      <span class="info-icon" id="av-info-trigger">i</span>
      <span style="font-size:12.5px;color:#888">Tap the info icon to learn what each Avastha system means</span>
    </div>
    <div style="overflow-x:auto">
    <table class="planet-table">
      <thead><tr><th>Planet</th><th>Baladi</th><th>Jagrat/Swapna/Sushupti</th><th>Deeptadi</th><th>Summary</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    </div>
    <div class="section-title" style="margin-top:1.5rem">What each state means</div>
    <div id="avastha-detail-cards"></div>
  `;
  document.getElementById('av-info-trigger').onclick=function(){showGenericInfo('Avastha — Planetary States',AVASTHA_INFO)};

  // Detail cards explaining each planet's specific states in plain language
  const detailHtml=SHADBALA_PLANETS.map(p=>{
    const a=avasthas[p];
    return`<div class="shadbala-card">
      <div class="shadbala-card-head">
        <div class="karaka-icon">${planetIconSvg(p,24,'#f59e0b',1)}</div>
        <div style="flex:1"><div class="shadbala-planet-name">${p}</div></div>
      </div>
      <div class="avastha-detail-row"><strong>${a.baladi}</strong> (Baladi) — ${BALADI_MEANING[a.baladi]}</div>
      <div class="avastha-detail-row"><strong>${a.jagradadi}</strong> (Jagradadi) — ${JAGRADADI_MEANING[a.jagradadi]}</div>
      <div class="avastha-detail-row"><strong>${a.deeptadi}</strong> (Deeptadi) — ${DEEPTADI_MEANING[a.deeptadi]}</div>
    </div>`;
  }).join('');
  document.getElementById('avastha-detail-cards').innerHTML=detailHtml;
}

async function generateReading(){
  const key=savedKey||localStorage.getItem('nd_key')||'';
  if(!key){document.getElementById('reading-content').innerHTML=`<div class="status">Add your Anthropic API key above to generate the AI reading.</div>`;return}
  const{name,lagnaSign,planetData,dashas,houseMap}=chartData;
  const now=new Date(),active=dashas.find(d=>now>=d.start&&now<d.end);
  const activeAntar=active?(active.antardashas||[]).find(s=>now>=s.start&&now<s.end):null;
  const yogas=chartData.yogas||detectAllYogas(planetData,lagnaSign,houseMap);
  const doshas=chartData.doshas||detectAllDoshas(planetData);
  const yogaSummary=yogas.length?yogas.map(y=>`${y.name} (${y.strengthLabel}): ${y.signifies}`).join('\n'):'None clearly detected.';
  const doshaSummary=doshas.length?doshas.map(ds=>`${ds.name} (${ds.strengthLabel}): ${ds.signifies}`).join('\n'):'None clearly detected.';
  const summary=`Name: ${name||'Native'}\nLagna: ${SIGNS[lagnaSign]}\n`+PLANETS.map(p=>{const d=planetData[p];return`${p}: House ${d.house}, ${SIGNS[d.sign]} ${d.deg.toFixed(1)}°, ${d.nakshatra.name} nakshatra`}).join('\n')+`\nCurrent Dasha: ${active?active.lord+(activeAntar?'-'+activeAntar.lord:'')+' (ends '+(activeAntar||active).end.toLocaleDateString('en-IN',{month:'short',year:'numeric'})+')':'N/A'}\n\nDetected Yogas:\n${yogaSummary}\n\nDetected Doshas:\n${doshaSummary}`;
  const prompt=`You are a master Vedic astrologer. Analyze this birth chart and provide a structured reading with these sections:\n\n1. **Ascendant & Core Identity** — Lagna sign, nakshatra, core personality\n2. **Key Yogas & Doshas** — interpret the detected yogas and doshas below in the context of this specific chart, weaving them together rather than listing them mechanically\n3. **Nakshatra Analysis** — Moon and Ascendant nakshatras, mind and soul\n4. **House Axis Analysis** — Dharma (1-5-9), Artha (2-6-10), Moksha (4-8-12), Kama (3-7-11) trikonas\n5. **Soul Purpose & Transformation** — Rahu-Ketu axis, what to release and evolve toward\n6. **Current Dasha** — what this period (down to the active Antardasha) activates and what to focus on now\n\nChart:\n${summary}\n\nWrite in flowing prose, deeply insightful, specific to this chart. Format with bold headings. 700-900 words.`;
  try{
    const res=await fetch('https://api.anthropic.com/v1/messages',{
      method:'POST',
      headers:{'Content-Type':'application/json','x-api-key':key,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},
      body:JSON.stringify({model:'claude-sonnet-4-6',max_tokens:1200,messages:[{role:'user',content:prompt}]})
    });
    const data=await res.json();
    if(data.error){document.getElementById('reading-content').innerHTML=`<div class="status">API error: ${data.error.message}</div>`;return}
    renderReading(data.content?.[0]?.text||'No reading generated.');
  }catch(e){
    document.getElementById('reading-content').innerHTML=`<div class="status">Error connecting to API. Check your key and try again.</div>`;
  }
}

function renderReading(text){
  const parts=text.split(/\n\n+/);let html='';
  parts.forEach(s=>{
    const m=s.match(/^\*\*(.+?)\*\*/);
    if(m){const body=s.replace(/^\*\*(.+?)\*\*\s*/,'').replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>');html+=`<div class="reading-section"><h3>${m[1]}</h3><p class="reading-text">${body}</p></div>`}
    else{const c=s.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').trim();if(c)html+=`<p class="reading-text" style="margin-bottom:1rem">${c}</p>`}
  });
  document.getElementById('reading-content').innerHTML=html;
}

function showTab(name){
  const tabs=['chart','positions','dashas','karakas','yogadosha','shadbala','avastha','navamsa','reading'];
  tabs.forEach(t=>{document.getElementById('tab-'+t).classList.toggle('hidden',t!==name)});
  document.querySelectorAll('.tab').forEach((btn,i)=>{btn.classList.toggle('active',tabs[i]===name)});
}

window.addEventListener('DOMContentLoaded',()=>{
  const k=localStorage.getItem('nd_key');
  if(k){document.getElementById('api-key').value=k;savedKey=k;updateKeyStatus(true)}
});
