/* ============================================================
   APP STATE & FORM HANDLING
   Global chart state, Individual/Couple mode selection, city
   autocomplete (Nominatim), calculateChart()/calculateCoupleCharts(),
   and the downloadable Markdown report generator.
   ============================================================ */
let chartData=null;

// ===================== READING MODE (Individual vs Couple) =====================
let currentMode=null; // 'individual' | 'couple'
let chartDataStoreA=null,chartDataStoreB=null; // persisted per-person chart data in couple mode
let activePerson='a';

function chooseMode(mode){
  currentMode=mode;
  document.getElementById('mode-select').classList.add('hidden');
  if(mode==='individual'){
    document.getElementById('individual-mode').classList.remove('hidden');
    document.getElementById('couple-mode').classList.add('hidden');
  }else{
    document.getElementById('couple-mode').classList.remove('hidden');
    document.getElementById('individual-mode').classList.add('hidden');
  }
}

function backToModeSelect(){
  document.getElementById('mode-select').classList.remove('hidden');
  document.getElementById('individual-mode').classList.add('hidden');
  document.getElementById('couple-mode').classList.add('hidden');
  document.getElementById('result-area').classList.add('hidden');
  document.getElementById('person-switcher').classList.add('hidden');
  document.getElementById('download-row').classList.add('hidden');
  document.getElementById('name-card').classList.add('hidden');
  document.getElementById('couple-name-card').classList.add('hidden');
  currentMode=null;
}

function saveKeyCouple(){
  const k=document.getElementById('api-key-couple').value.trim();
  if(k){localStorage.setItem('nd_key',k);savedKey=k;
    const el=document.getElementById('key-status-couple');
    el.textContent='✓ API key saved — AI reading enabled';
    el.className='key-status key-ok';
  }
}

// Generalized city autocomplete supporting any field suffix ('', 'a', 'b')
let cityTimerMap={},cityResultsMap={},focusedIdxMap={};
function cityInputFor(suffix,val){
  clearTimeout(cityTimerMap[suffix]);
  const dd=document.getElementById('city-dropdown-'+suffix);
  if(val.length<2){dd.classList.add('hidden');cityResultsMap[suffix]=[];return}
  cityTimerMap[suffix]=setTimeout(()=>fetchCitiesFor(suffix,val),350);
}
async function fetchCitiesFor(suffix,q){
  const dd=document.getElementById('city-dropdown-'+suffix);
  dd.innerHTML='<div class="city-option" style="color:#666;cursor:default">Searching…</div>';
  dd.classList.remove('hidden');
  try{
    const res=await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=8`);
    if(!res.ok)throw new Error('Request failed: '+res.status);
    const data=await res.json();
    const results=data.filter(d=>d.lat&&d.lon);
    cityResultsMap[suffix]=results;
    if(!results.length){
      dd.innerHTML='<div class="city-option" style="color:#666;cursor:default">No matches found</div>';
      return;
    }
    focusedIdxMap[suffix]=-1;
    dd.innerHTML=results.map((r,i)=>{
      const a=r.address||{};
      const name=a.city||a.town||a.village||a.county||a.state||(r.display_name?r.display_name.split(',')[0]:'Unknown');
      const state=a.state||'';
      const country=a.country||'';
      const sub=[state,country].filter(Boolean).join(', ');
      return`<div class="city-option" onmousedown="selectCityFor('${suffix}',${i})" data-idx="${i}">
        <div class="city-name">${name}</div>
        <div class="city-sub">${sub}</div>
      </div>`;
    }).join('');
    dd.classList.remove('hidden');
  }catch(e){
    dd.innerHTML='<div class="city-option" style="color:#ef4444;cursor:default">Search failed — check connection</div>';
  }
}
function selectCityFor(suffix,idx){
  const r=(cityResultsMap[suffix]||[])[idx];
  if(!r)return;
  const a=r.address||{};
  const name=a.city||a.town||a.village||a.county||a.state||(r.display_name?r.display_name.split(',')[0]:'Unknown');
  const state=a.state||'';
  const country=a.country||'';
  document.getElementById('city-'+suffix).value=[name,state,country].filter(Boolean).join(', ');
  document.getElementById('lat-'+suffix).value=parseFloat(r.lat).toFixed(4);
  document.getElementById('lon-'+suffix).value=parseFloat(r.lon).toFixed(4);
  document.getElementById('city-dropdown-'+suffix).classList.add('hidden');
  document.getElementById('loc-status-'+suffix).style.color='#22c55e';
  document.getElementById('loc-status-'+suffix).textContent='✓ Location found — timezone set automatically';
  applyTimezoneToSelect('tz-'+suffix,a.country_code,parseFloat(r.lat),parseFloat(r.lon));
  focusedIdxMap[suffix]=-1;cityResultsMap[suffix]=[];
}
function cityKeydownFor(suffix,e){
  const dd=document.getElementById('city-dropdown-'+suffix);
  const opts=dd.querySelectorAll('.city-option');
  if(dd.classList.contains('hidden'))return;
  let idx=focusedIdxMap[suffix]!==undefined?focusedIdxMap[suffix]:-1;
  if(e.key==='ArrowDown'){e.preventDefault();idx=Math.min(idx+1,opts.length-1);focusedIdxMap[suffix]=idx;opts.forEach((o,i)=>o.classList.toggle('focused',i===idx))}
  else if(e.key==='ArrowUp'){e.preventDefault();idx=Math.max(idx-1,0);focusedIdxMap[suffix]=idx;opts.forEach((o,i)=>o.classList.toggle('focused',i===idx))}
  else if(e.key==='Enter'&&idx>=0){e.preventDefault();selectCityFor(suffix,idx)}
  else if(e.key==='Escape'){dd.classList.add('hidden')}
}
document.addEventListener('click',e=>{
  ['a','b'].forEach(suffix=>{
    const wrap=document.getElementById('city-'+suffix);
    if(wrap&&!e.target.closest('.city-wrap')){
      const dd=document.getElementById('city-dropdown-'+suffix);
      if(dd)dd.classList.add('hidden');
    }
  });
});

// Computes a full chart (identical pipeline to calculateChart) for one person, given raw form values, returning the chartData object without touching globals
function computeChartFor(name,dob,tob,lat,lon,tz){
  const[yr,mo,dy]=dob.split('-').map(Number),[hr,mn]=tob.split(':').map(Number);
  const utcHr=(hr+mn/60)-tz,jd=julianDay(yr,mo,dy,utcHr),T=(jd-2451545.0)/36525,ayan=lahiriAyanamsa(jd);
  const trop=allPlanets(jd,T),sidMap={};
  for(const p in trop)sidMap[p]=sid(trop[p],ayan);
  sidMap.Ketu=sid(trop.Ketu,ayan);
  const ascSid=sid(calcAsc(jd,lat,lon),ayan),lagnaSign=getSign(ascSid);
  const houseMap={};for(let i=1;i<=12;i++)houseMap[i]=[];
  const planetData={};
  PLANETS.forEach(p=>{
    const l=sidMap[p],sign=getSign(l),house=((sign-lagnaSign+12)%12)+1,deg=getDeg(l),nak=getNakshatra(l);
    houseMap[house].push(p);planetData[p]={lon:l,sign,house,deg,nakshatra:nak};
  });
  const dashas=calcDashas(sidMap.Moon,dob);
  const birthDateObj=new Date(yr,mo-1,dy);
  const panchang=calcPanchang(sidMap.Sun,sidMap.Moon,birthDateObj);
  const moonNakKoota=getNakshatraKoota(planetData.Moon.nakshatra.idx);
  const ascNakKoota=getNakshatraKoota(getNakshatra(ascSid).idx);
  const moonRashiVarna=getRashiVarnaTatva(planetData.Moon.sign);
  const cd={name,dob,lagnaSign,ascSid,planetData,houseMap,dashas,panchang,moonNakKoota,ascNakKoota,moonRashiVarna};

  const weekday=birthDateObj.getDay();
  const hourDecimal=hr+mn/60;
  const sunriseApprox=6,sunsetApprox=18;
  const isDayBirth=hourDecimal>=sunriseApprox&&hourDecimal<sunsetApprox;
  const navamsaSigns={},retrograde={},declinations={},speedRatios={};
  SHADBALA_PLANETS.forEach(p=>{
    navamsaSigns[p]=getNavamsaSign(planetData[p].lon);
    declinations[p]=getDeclination(planetData[p].lon,ayan);
    const motion=getMotionInfo(p,jd,ayan);
    retrograde[p]=motion.retrograde;speedRatios[p]=motion.speedRatio;
  });
  const birthInfo={hourDecimal,weekday,isDayBirth,navamsaSigns,retrograde,declinations,speedRatios};
  cd.shadbala=calcShadbala(planetData,houseMap,birthInfo);
  cd.bhavaBala=calcBhavaBala(lagnaSign,houseMap,cd.shadbala);
  cd.navamsa=calcNavamsaChart(planetData,ascSid);
  cd.ishtaKashta=calcIshtaKashtaPhala(cd.shadbala);
  return cd;
}

function renderActiveChart(){
  if(!chartData)return;
  const{houseMap,lagnaSign,planetData,ascSid,dashas}=chartData;
  drawKundli(houseMap,lagnaSign);renderPanchang();renderNakshatraKoota();renderPlanetTable(planetData,lagnaSign,ascSid);renderDashas(dashas);renderTrikonaButtons();renderKarakas();renderYogasDoshas();renderShadbala();renderAvastha();drawNavamsaChart();renderNavamsaTable();renderPersonalitySnapshot();
}

function calculateCoupleCharts(){
  const errEl=document.getElementById('couple-form-error');
  const nameA=document.getElementById('name-a').value.trim(),dobA=document.getElementById('dob-a').value,tobA=document.getElementById('tob-a').value;
  const latA=parseFloat(document.getElementById('lat-a').value),lonA=parseFloat(document.getElementById('lon-a').value),tzA=parseFloat(document.getElementById('tz-a').value);
  const nameB=document.getElementById('name-b').value.trim(),dobB=document.getElementById('dob-b').value,tobB=document.getElementById('tob-b').value;
  const latB=parseFloat(document.getElementById('lat-b').value),lonB=parseFloat(document.getElementById('lon-b').value),tzB=parseFloat(document.getElementById('tz-b').value);

  if(!dobA||!tobA||isNaN(latA)||isNaN(lonA)||!dobB||!tobB||isNaN(latB)||isNaN(lonB)){
    errEl.textContent='Please fill in date, time, and city for both partners (so we can find coordinates).';
    errEl.classList.remove('hidden');
    return;
  }
  errEl.classList.add('hidden');

  chartDataStoreA=computeChartFor(nameA||'Partner A',dobA,tobA,latA,lonA,tzA);
  chartDataStoreB=computeChartFor(nameB||'Partner B',dobB,tobB,latB,lonB,tzB);

  document.getElementById('switch-name-a').textContent=nameA||'Partner A';
  document.getElementById('switch-name-b').textContent=nameB||'Partner B';
  document.getElementById('switch-initial-a').textContent=(nameA||'A').trim()[0].toUpperCase();
  document.getElementById('switch-initial-b').textContent=(nameB||'B').trim()[0].toUpperCase();
  document.getElementById('person-switcher').classList.remove('hidden');

  activePerson='a';
  chartData=chartDataStoreA;
  document.getElementById('switch-btn-a').classList.add('active');
  document.getElementById('switch-btn-b').classList.remove('active');

  document.getElementById('result-area').classList.remove('hidden');
  showTab('chart');
  renderActiveChart();
  generateReading();
  collapseCoupleFormCard(nameA,nameB);
}

function switchActivePerson(person){
  if(person===activePerson)return;
  activePerson=person;
  chartData=person==='a'?chartDataStoreA:chartDataStoreB;
  document.getElementById('switch-btn-a').classList.toggle('active',person==='a');
  document.getElementById('switch-btn-b').classList.toggle('active',person==='b');
  renderActiveChart();
  generateReading();
}

function collapseCoupleFormCard(nameA,nameB){
  document.getElementById('couple-form-card').classList.add('hidden');
  document.getElementById('couple-name-card-text').textContent=`${nameA||'Partner A'} & ${nameB||'Partner B'}`;
  document.getElementById('couple-name-card').classList.remove('hidden');
  document.getElementById('download-row').classList.remove('hidden');
}
function expandCoupleFormCard(){
  document.getElementById('couple-name-card').classList.add('hidden');
  document.getElementById('couple-form-card').classList.remove('hidden');
  document.getElementById('calc-btn-couple').textContent='Save changes →';
}

let cityTimer=null,cityResults=[],focusedIdx=-1;

function cityInput(val){
  clearTimeout(cityTimer);
  const dd=document.getElementById('city-dropdown');
  if(val.length<2){dd.classList.add('hidden');cityResults=[];return}
  cityTimer=setTimeout(()=>fetchCities(val),350);
}

async function fetchCities(q){
  const dd=document.getElementById('city-dropdown');
  dd.innerHTML='<div class="city-option" style="color:#666;cursor:default">Searching…</div>';
  dd.classList.remove('hidden');
  try{
    const res=await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=8`);
    if(!res.ok)throw new Error('Request failed: '+res.status);
    const data=await res.json();
    cityResults=data.filter(d=>d.lat&&d.lon);
    if(!cityResults.length){
      dd.innerHTML='<div class="city-option" style="color:#666;cursor:default">No matches found</div>';
      return;
    }
    focusedIdx=-1;
    dd.innerHTML=cityResults.map((r,i)=>{
      const a=r.address||{};
      const name=a.city||a.town||a.village||a.county||a.state||(r.display_name?r.display_name.split(',')[0]:'Unknown');
      const state=a.state||'';
      const country=a.country||'';
      const sub=[state,country].filter(Boolean).join(', ');
      return`<div class="city-option" onmousedown="selectCity(${i})" data-idx="${i}">
        <div class="city-name">${name}</div>
        <div class="city-sub">${sub}</div>
      </div>`;
    }).join('');
    dd.classList.remove('hidden');
  }catch(e){
    dd.innerHTML='<div class="city-option" style="color:#ef4444;cursor:default">Search failed — check connection</div>';
  }
}

function selectCity(idx){
  const r=cityResults[idx];
  if(!r)return;
  const a=r.address||{};
  const name=a.city||a.town||a.village||a.county||a.state||(r.display_name?r.display_name.split(',')[0]:'Unknown');
  const state=a.state||'';
  const country=a.country||'';
  document.getElementById('city').value=[name,state,country].filter(Boolean).join(', ');
  document.getElementById('lat').value=parseFloat(r.lat).toFixed(4);
  document.getElementById('lon').value=parseFloat(r.lon).toFixed(4);
  document.getElementById('city-dropdown').classList.add('hidden');
  document.getElementById('loc-status').style.color='#22c55e';
  document.getElementById('loc-status').textContent=`✓ Location found — timezone set automatically`;
  applyTimezoneToSelect('tz',a.country_code,parseFloat(r.lat),parseFloat(r.lon));
  focusedIdx=-1;cityResults=[];
}

function cityKeydown(e){
  const dd=document.getElementById('city-dropdown');
  const opts=dd.querySelectorAll('.city-option');
  if(dd.classList.contains('hidden'))return;
  if(e.key==='ArrowDown'){e.preventDefault();focusedIdx=Math.min(focusedIdx+1,opts.length-1);opts.forEach((o,i)=>o.classList.toggle('focused',i===focusedIdx))}
  else if(e.key==='ArrowUp'){e.preventDefault();focusedIdx=Math.max(focusedIdx-1,0);opts.forEach((o,i)=>o.classList.toggle('focused',i===focusedIdx))}
  else if(e.key==='Enter'&&focusedIdx>=0){e.preventDefault();selectCity(focusedIdx)}
  else if(e.key==='Escape'){dd.classList.add('hidden')}
}

document.addEventListener('click',e=>{
  if(!e.target.closest('.city-wrap'))document.getElementById('city-dropdown').classList.add('hidden');
});

function calculateChart(){
  const dob=document.getElementById('dob').value,tob=document.getElementById('tob').value;
  const lat=parseFloat(document.getElementById('lat').value),lon=parseFloat(document.getElementById('lon').value);
  const tz=parseFloat(document.getElementById('tz').value),name=document.getElementById('name').value.trim();
  const errEl=document.getElementById('form-error');
  if(!dob||!tob||isNaN(lat)||isNaN(lon)){errEl.textContent='Please fill in date, time, and city (so we can find coordinates).';errEl.classList.remove('hidden');return}
  errEl.classList.add('hidden');
  const[yr,mo,dy]=dob.split('-').map(Number),[hr,mn]=tob.split(':').map(Number);
  const utcHr=(hr+mn/60)-tz,jd=julianDay(yr,mo,dy,utcHr),T=(jd-2451545.0)/36525,ayan=lahiriAyanamsa(jd);
  const trop=allPlanets(jd,T),sidMap={};
  for(const p in trop)sidMap[p]=sid(trop[p],ayan);
  sidMap.Ketu=sid(trop.Ketu,ayan);
  const ascSid=sid(calcAsc(jd,lat,lon),ayan),lagnaSign=getSign(ascSid);
  const houseMap={};for(let i=1;i<=12;i++)houseMap[i]=[];
  const planetData={};
  PLANETS.forEach(p=>{
    const l=sidMap[p],sign=getSign(l),house=((sign-lagnaSign+12)%12)+1,deg=getDeg(l),nak=getNakshatra(l);
    houseMap[house].push(p);planetData[p]={lon:l,sign,house,deg,nakshatra:nak};
  });
  const dashas=calcDashas(sidMap.Moon,dob);
  const birthDateObj=new Date(yr,mo-1,dy);
  const panchang=calcPanchang(sidMap.Sun,sidMap.Moon,birthDateObj);
  const moonNakKoota=getNakshatraKoota(planetData.Moon.nakshatra.idx);
  const ascNakKoota=getNakshatraKoota(getNakshatra(ascSid).idx);
  const moonRashiVarna=getRashiVarnaTatva(planetData.Moon.sign);
  chartData={name,dob,lagnaSign,ascSid,planetData,houseMap,dashas,panchang,moonNakKoota,ascNakKoota,moonRashiVarna};

  // Assemble inputs for Shadbala
  const weekday=new Date(yr,mo-1,dy).getDay(); // 0=Sunday
  const hourDecimal=hr+mn/60;
  const sunriseApprox=6,sunsetApprox=18; // simplified fixed sunrise/sunset (full precision needs lat/lon-based sunrise equation)
  const isDayBirth=hourDecimal>=sunriseApprox&&hourDecimal<sunsetApprox;
  const navamsaSigns={},retrograde={},declinations={},speedRatios={};
  SHADBALA_PLANETS.forEach(p=>{
    navamsaSigns[p]=getNavamsaSign(planetData[p].lon);
    declinations[p]=getDeclination(planetData[p].lon,ayan);
    const motion=getMotionInfo(p,jd,ayan);
    retrograde[p]=motion.retrograde;speedRatios[p]=motion.speedRatio;
  });
  const birthInfo={hourDecimal,weekday,isDayBirth,navamsaSigns,retrograde,declinations,speedRatios};
  chartData.shadbala=calcShadbala(planetData,houseMap,birthInfo);
  chartData.bhavaBala=calcBhavaBala(lagnaSign,houseMap,chartData.shadbala);
  chartData.navamsa=calcNavamsaChart(planetData,ascSid);
  chartData.ishtaKashta=calcIshtaKashtaPhala(chartData.shadbala);

  drawKundli(houseMap,lagnaSign);renderPanchang();renderNakshatraKoota();renderPlanetTable(planetData,lagnaSign,ascSid);renderDashas(dashas);renderTrikonaButtons();renderKarakas();renderYogasDoshas();renderShadbala();renderAvastha();drawNavamsaChart();renderNavamsaTable();renderPersonalitySnapshot();
  document.getElementById('result-area').classList.remove('hidden');
  showTab('chart');generateReading();
  collapseFormCard(name);
}

function collapseFormCard(name){
  document.getElementById('form-card').classList.add('hidden');
  const nameCard=document.getElementById('name-card');
  const initials=(name||'?').trim().split(/\s+/).map(w=>w[0]).slice(0,2).join('').toUpperCase()||'?';
  document.getElementById('name-card-text').textContent=name?name:'Your chart';
  nameCard.querySelector('.name-card-icon').textContent=initials;
  nameCard.classList.remove('hidden');
  document.getElementById('download-row').classList.remove('hidden');
}

function expandFormCard(){
  document.getElementById('name-card').classList.add('hidden');
  document.getElementById('form-card').classList.remove('hidden');
  document.getElementById('calc-btn').textContent='Save changes →';
}

function downloadReport(){
  if(!chartData)return;
  const{name,dob,lagnaSign,ascSid,planetData,houseMap,dashas,karakas,yogas,doshas,shadbala,bhavaBala,avasthas,navamsa,panchang,moonNakKoota,ascNakKoota,moonRashiVarna}=chartData;
  const lines=[];
  const now=new Date();

  lines.push(`# Vedic Kundli Report — ${name||'Unnamed'}`);
  lines.push('');
  lines.push(`*Generated by Nakshatra Darshan on ${now.toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}*`);
  lines.push('');
  lines.push('This document contains a complete machine-readable Vedic astrology (Jyotish) chart calculation, intended to be read and interpreted by Claude or any other AI assistant, as well as by a human. All values use the sidereal zodiac with Lahiri (Chitrapaksha) Ayanamsa. Houses are whole-sign from the Ascendant.');
  lines.push('');

  lines.push('## Birth Details');
  lines.push(`- Name: ${name||'(not provided)'}`);
  lines.push(`- Date of birth: ${dob}`);
  lines.push('');

  if(panchang){
    lines.push('## Panchang at Birth');
    lines.push(`- Vara (weekday): ${panchang.vara.name} — ${panchang.vara.info}`);
    lines.push(`- Tithi: ${panchang.tithi.paksha} ${panchang.tithi.name} (${panchang.tithi.type} tithi) — ${panchang.tithi.typeInfo}`);
    lines.push(`- Nitya Yoga: ${panchang.yoga.name} (${panchang.yoga.nature}) — signifies ${panchang.yoga.meaning}`);
    lines.push(`- Karana: ${panchang.karana.name} — ${panchang.karana.info}`);
    lines.push('');
  }

  if(moonNakKoota){
    lines.push('## Birth Star (Nakshatra) Details');
    lines.push(`- Moon Nakshatra: ${planetData.Moon.nakshatra.name} — Gana: ${moonNakKoota.ganaInfo.label}, Yoni: ${moonNakKoota.yoni}, Nadi: ${moonNakKoota.nadiInfo.label}`);
    lines.push(`- Moon Rashi: ${SIGNS[planetData.Moon.sign]} — Varna: ${moonRashiVarna.varna}, Tatva: ${moonRashiVarna.tatva}`);
    lines.push(`- Ascendant Nakshatra: ${getNakshatra(ascSid).name} — Gana: ${ascNakKoota.ganaInfo.label}, Yoni: ${ascNakKoota.yoni}, Nadi: ${ascNakKoota.nadiInfo.label}`);
    lines.push('');
  }

  lines.push('## Ascendant (Lagna)');
  const ascNak=getNakshatra(ascSid);
  lines.push(`- Sign: ${SIGNS[lagnaSign]}`);
  lines.push(`- Degree within sign: ${getDeg(ascSid).toFixed(2)}°`);
  lines.push(`- Nakshatra: ${ascNak.name}, Pada ${ascNak.pada} (lord: ${DASHA_LORD_FULLNAME[ascNak.lord]||ascNak.lord})`);
  lines.push('');

  lines.push('## Planetary Positions (Rashi / D1 Chart)');
  lines.push('');
  lines.push('| Planet | Sign | House | Degree | Nakshatra | Pada | Relation to Sign Lord | Dignity |');
  lines.push('|---|---|---|---|---|---|---|---|');
  PLANETS.forEach(p=>{
    const d=planetData[p];
    const comp=compoundRelation(p,d.sign,planetData,d.house);
    const dignity=comp.dignity?({exalted:'Exalted',debilitated:'Debilitated',own:'Own sign',moolatrikona:'Moolatrikona'}[comp.dignity]||'—'):'—';
    lines.push(`| ${p} | ${SIGNS[d.sign]} | ${d.house} | ${d.deg.toFixed(2)}° | ${d.nakshatra.name} | ${d.nakshatra.pada} | ${comp.relation} | ${dignity} |`);
  });
  lines.push('');
  lines.push('House occupancy summary:');
  for(let h=1;h<=12;h++){
    const signIdx=(lagnaSign+h-1)%12;
    const planets=houseMap[h]||[];
    lines.push(`- House ${h} (${SIGNS[signIdx]}, lord ${SIGN_LORD[signIdx]}): ${planets.length?planets.join(', '):'empty'}`);
  }
  lines.push('');

  lines.push('## Jaimini Chara Karakas');
  lines.push('(7 classical planets ranked by degree within sign, descending. Highest = Atmakaraka, lowest = Darakaraka.)');
  lines.push('');
  lines.push('| Karaka | Planet | Degree | Signifies |');
  lines.push('|---|---|---|---|');
  (karakas||calcCharaKarakas(planetData)).forEach(k=>{
    lines.push(`| ${k.karaka} (${k.short}) | ${k.planet} | ${k.deg.toFixed(2)}° | ${k.signifies} |`);
  });
  lines.push('');

  const ydYogas=yogas||detectAllYogas(planetData,lagnaSign,houseMap);
  const ydDoshas=doshas||detectAllDoshas(planetData,lagnaSign);
  lines.push('## Yogas & Doshas');
  lines.push('(Classical planetary combinations detected from this chart. Strength is an indicative 0-100 estimate, not a precise classical measurement.)');
  lines.push('');
  lines.push('### Yogas');
  if(ydYogas.length){
    ydYogas.forEach(y=>{
      lines.push(`**${y.name}** — ${y.strengthLabel} (${y.strength}/100)`);
      lines.push(`- Formation: ${y.formation}`);
      lines.push(`- Signifies: ${y.signifies}`);
      lines.push('');
    });
  }else{
    lines.push('No major classical Yogas were clearly detected among the combinations this tool checks.');
    lines.push('');
  }
  lines.push('### Doshas');
  if(ydDoshas.length){
    ydDoshas.forEach(ds=>{
      lines.push(`**${ds.name}** — ${ds.strengthLabel} (${ds.strength}/100)`);
      lines.push(`- Formation: ${ds.formation}`);
      lines.push(`- Signifies: ${ds.signifies}`);
      lines.push('');
    });
  }else{
    lines.push('No major classical Doshas were clearly detected among the combinations this tool checks.');
    lines.push('');
  }

  if(shadbala){
    lines.push('## Shadbala — Six-fold Planetary Strength');
    lines.push('(Values in Rupas; 1 Rupa = 60 Virupa/Shashtiamsa. Each planet has a different required minimum.)');
    lines.push('');
    lines.push('| Planet | Sthana | Dig | Kala | Cheshta | Naisargika | Drik | Total Rupas | Required | % of Minimum |');
    lines.push('|---|---|---|---|---|---|---|---|---|---|');
    SHADBALA_PLANETS.forEach(p=>{
      const s=shadbala[p];
      lines.push(`| ${p} | ${s.sthana.total.toFixed(1)}V | ${s.dig.toFixed(1)}V | ${s.kala.total.toFixed(1)}V | ${s.cheshta.toFixed(1)}V | ${s.naisargika.toFixed(1)}V | ${s.drik.toFixed(1)}V | ${s.totalRupas.toFixed(2)} | ${s.required} | ${s.pct.toFixed(0)}% |`);
    });
    lines.push('');
    lines.push('*Methodology notes: Saptavargaja Bala uses the Rasi (D1) chart with full Panchadha Maitri (5-fold relationship) rather than averaging across all seven classical divisional charts. Kala Bala uses a fixed 6am/6pm sunrise-sunset approximation. Sun and Moon Cheshta Bala are classically always zero (they never retrograde). Yuddha (planetary war) bala is not modeled.*');
    lines.push('');
  }

  if(bhavaBala){
    lines.push('## Bhava Bala — House Strength');
    lines.push('(Formula: Bhavadhipati Bala [house lord\'s total Shadbala] + Bhava Dig Bala [Kendra=60V/Panapara=30V/Apoklima=15V] + Bhava Drishti Bala [graded aspects on the house].)');
    lines.push('');
    lines.push('| House | Sign | Lord | Bhavadhipati | Dig | Drishti | Total Rupas |');
    lines.push('|---|---|---|---|---|---|---|');
    for(let h=1;h<=12;h++){
      const r=bhavaBala[h];
      lines.push(`| ${h} | ${SIGNS[r.sign]} | ${r.lord} | ${r.bhavadhipati.toFixed(1)}V | ${r.dig.toFixed(1)}V | ${r.drishti.toFixed(2)}V | ${r.totalRupas.toFixed(2)} |`);
    }
    lines.push('');
  }

  if(avasthas){
    lines.push('## Avastha — Planetary States');
    lines.push('');
    lines.push('| Planet | Baladi | Jagrat/Swapna/Sushupti | Deeptadi | Summary |');
    lines.push('|---|---|---|---|---|');
    SHADBALA_PLANETS.forEach(p=>{
      const a=avasthas[p];
      const summary=avasthaSummary(a.jagradadi,a.deeptadi);
      lines.push(`| ${p} | ${a.baladi} | ${a.jagradadi} | ${a.deeptadi} | ${summary.label} |`);
    });
    lines.push('');
  }

  if(navamsa){
    lines.push('## Navamsa (D9) Chart');
    lines.push(`Navamsa Ascendant: ${SIGNS[navamsa.navAscSign]}`);
    lines.push('');
    lines.push('| Planet | D1 Sign | D9 Sign | Vargottama |');
    lines.push('|---|---|---|---|');
    PLANETS.forEach(p=>{
      lines.push(`| ${p} | ${SIGNS[planetData[p].sign]} | ${SIGNS[navamsa.navPlanetSign[p]]} | ${navamsa.vargottama[p]?'Yes':'No'} |`);
    });
    lines.push('');
  }

  lines.push('## Vimshottari Dasha Periods');
  lines.push('');
  dashas.forEach(d=>{
    const isActive=now>=d.start&&now<d.end;
    lines.push(`### ${DASHA_LORD_FULLNAME[d.lord]||d.lord} Mahadasha ${isActive?'(CURRENT)':''}`);
    lines.push(`${d.start.toLocaleDateString('en-IN',{month:'short',year:'numeric'})} – ${d.end.toLocaleDateString('en-IN',{month:'short',year:'numeric'})} (${d.years.toFixed(2)} years)`);
    lines.push('');
    lines.push('| Antardasha | Start | End |');
    lines.push('|---|---|---|');
    (d.antardashas||[]).forEach(sub=>{
      const subActive=now>=sub.start&&now<sub.end;
      lines.push(`| ${d.lord}-${sub.lord}${subActive?' (CURRENT)':''} | ${sub.start.toLocaleDateString('en-IN',{month:'short',year:'numeric'})} | ${sub.end.toLocaleDateString('en-IN',{month:'short',year:'numeric'})} |`);
    });
    lines.push('');
  });

  // Detailed Pratyantardasha + Sookshma Dasha breakdown for the currently active period only (avoids an unwieldy 6,500+ row table)
  const currentMaha=dashas.find(d=>now>=d.start&&now<d.end);
  const currentAntar=currentMaha?(currentMaha.antardashas||[]).find(s=>now>=s.start&&now<s.end):null;
  if(currentMaha&&currentAntar){
    lines.push(`## Current Period Drill-Down: ${DASHA_LORD_FULLNAME[currentMaha.lord]}\u2013${DASHA_LORD_FULLNAME[currentAntar.lord]}`);
    lines.push('Pratyantardasha (3rd-level) and Sookshma Dasha (4th-level) sub-periods within the current Mahadasha-Antardasha, for fine-grained timing.');
    lines.push('');
    const pratyantars=getPratyantardashas(currentAntar);
    lines.push('| Pratyantardasha | Start | End |');
    lines.push('|---|---|---|');
    pratyantars.forEach(prat=>{
      const pratActive=now>=prat.start&&now<prat.end;
      lines.push(`| ${currentMaha.lord}-${currentAntar.lord}-${prat.lord}${pratActive?' (CURRENT)':''} | ${prat.start.toLocaleDateString('en-IN',{month:'short',year:'numeric'})} | ${prat.end.toLocaleDateString('en-IN',{month:'short',year:'numeric'})} |`);
    });
    lines.push('');
    const currentPrat=pratyantars.find(p=>now>=p.start&&now<p.end);
    if(currentPrat){
      const sookshmas=getSookshmaDashas(currentPrat);
      lines.push(`Sookshma Dasha within the current Pratyantardasha (${currentMaha.lord}-${currentAntar.lord}-${currentPrat.lord}):`);
      lines.push('');
      lines.push('| Sookshma Dasha | Start | End |');
      lines.push('|---|---|---|');
      sookshmas.forEach(sk=>{
        const skActive=now>=sk.start&&now<sk.end;
        lines.push(`| ${currentMaha.lord}-${currentAntar.lord}-${currentPrat.lord}-${sk.lord}${skActive?' (CURRENT)':''} | ${sk.start.toLocaleDateString('en-IN',{month:'short',year:'numeric'})} | ${sk.end.toLocaleDateString('en-IN',{month:'short',year:'numeric'})} |`);
      });
      lines.push('');
    }
  }

  lines.push('## House Group Reference (Trikonas & Kendras)');
  HOUSE_GROUPS.forEach(g=>{
    lines.push(`- **${g.label}** (Houses ${g.houses.join(', ')}): ${g.desc}`);
  });
  lines.push('');

  lines.push('---');
  lines.push('*Note on calculation precision: planetary positions use a truncated VSOP87D series (validated to sub-arcminute accuracy), ELP2000-based lunar theory, and the mean lunar node for Rahu/Ketu (standard for Vimshottari Dasha). Ascendant uses Meeus sidereal time with simplified nutation correction. This is a self-contained browser calculation, not a substitute for a professional consultation.*');

  const content=lines.join('\n');
  const blob=new Blob([content],{type:'text/markdown'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;
  a.download=`${(name||'kundli').replace(/\s+/g,'_')}_vedic_report.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

