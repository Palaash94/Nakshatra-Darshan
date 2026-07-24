/* ============================================================
   LIFE MAP (8-DOMAIN STRENGTH RADAR)
   Blends each life theme's already-computed Bhava Bala (house
   strength) and Shadbala (planetary strength) into a single 0-100
   score, nudged by any directly relevant classical Yoga/Dosha
   already detected for this chart. Pure calculation - no DOM.
   Rendered by renderLifeMapTab() in render-tabs.js.
   ============================================================ */

const LIFE_DOMAINS=[
  {key:'wealth',label:'Wealth',houses:[2,11],planets:['Jupiter','Venus'],goodYogaHint:['Dhana'],badDoshaHint:[]},
  {key:'health',label:'Health',houses:[1,6,8],planets:['Sun','Mars'],goodYogaHint:[],badDoshaHint:[]},
  {key:'family',label:'Family',houses:[2,4],planets:['Moon','Jupiter'],goodYogaHint:[],badDoshaHint:[]},
  {key:'dharma',label:'Dharma',houses:[1,5,9],planets:['Jupiter'],goodYogaHint:['Raja','Lakshmi'],badDoshaHint:[]},
  {key:'career',label:'Career',houses:[10,2,6],planets:['Sun','Saturn','Mercury'],goodYogaHint:['Raja','Dhana'],badDoshaHint:[]},
  {key:'relationships',label:'Relationships',houses:[7],planets:['Venus'],goodYogaHint:[],badDoshaHint:['Mangal']},
  {key:'wisdom',label:'Wisdom & Gyan',houses:[5,9],planets:['Mercury','Jupiter'],goodYogaHint:['Saraswati'],badDoshaHint:[]},
  {key:'spirituality',label:'Spirituality',houses:[9,12],planets:['Jupiter'],goodYogaHint:[],badDoshaHint:[]}
];

function domainYogaBonus(domain,yogas){
  if(!domain.goodYogaHint.length||!yogas||!yogas.length)return 0;
  return yogas.some(y=>domain.goodYogaHint.some(hint=>y.name.includes(hint)))?8:0;
}
function domainDoshaPenalty(domain,doshas){
  if(!domain.badDoshaHint.length||!doshas||!doshas.length)return 0;
  return doshas.some(d=>domain.badDoshaHint.some(hint=>d.name.includes(hint)))?10:0;
}
function lifeMapGrade(score){
  if(score>=80)return'Excellent';
  if(score>=60)return'Good';
  if(score>=40)return'Moderate';
  return'Needs Attention';
}

// calcLifeMap(chartData) -> [{key,label,score(0-100),grade,explanation,houses,planets}, ...] (8 entries)
function calcLifeMap(chartData){
  const{bhavaBala,shadbala,yogas,doshas}=chartData;
  const maxBhava=Math.max(...Array.from({length:12},(_,i)=>bhavaBala[i+1].totalRupas));
  return LIFE_DOMAINS.map(domain=>{
    const bhavaAvg=domain.houses.reduce((s,h)=>s+bhavaBala[h].totalRupas,0)/domain.houses.length;
    const bhavaPct=maxBhava>0?(bhavaAvg/maxBhava)*100:50;
    const shadbalaAvg=domain.planets.reduce((s,p)=>s+Math.min(150,shadbala[p].pct),0)/domain.planets.length;
    const shadbalaPct=(shadbalaAvg/150)*100;
    let score=bhavaPct*0.5+shadbalaPct*0.5;
    const bonus=domainYogaBonus(domain,yogas);
    const penalty=domainDoshaPenalty(domain,doshas);
    score=Math.max(0,Math.min(100,score+bonus-penalty));
    const houseStr=domain.houses.map(h=>'H'+h).join(', ');
    const planetStr=domain.planets.join(', ');
    let explanation=`Drawn from Bhava Bala of house(s) ${houseStr} and Shadbala of ${planetStr}.`;
    if(bonus)explanation+=` Boosted by a detected ${domain.goodYogaHint.join('/')} Yoga.`;
    if(penalty)explanation+=` Reduced by a detected ${domain.badDoshaHint.join('/')} Dosha.`;
    return{key:domain.key,label:domain.label,score:Math.round(score),grade:lifeMapGrade(score),explanation,houses:domain.houses,planets:domain.planets};
  });
}

const LIFE_MAP_METHODOLOGY='This Life Map blends two measures already computed elsewhere in this app — each relevant house\'s Bhava Bala (house strength, normalized against the strongest house in this specific chart) and the average Shadbala (six-fold planetary strength, as % of classical minimum) of that domain\'s natural significator planets — into a single 0-100 score per life theme, then nudges it up or down if a directly relevant classical Yoga or Dosha was detected elsewhere in this chart. It is a curated, broad-strokes summary meant to complement — not replace — the more granular Shadbala, Bhava Bala, and Yoga/Dosha tabs, where the full underlying detail lives. Domain-to-house/planet mappings follow commonly cited classical significations (e.g. 2nd/11th houses and Jupiter/Venus for Wealth; 7th house and Venus for Relationships), but any single domain in real classical practice draws on more nuance — divisional charts, dasha timing, aspects — than one number can capture.';
