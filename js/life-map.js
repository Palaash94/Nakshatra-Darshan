/* ============================================================
   LIFE MAP
   A plain-language "where does my chart's strength concentrate"
   view across six everyday venues of life (Career, Wealth, Family,
   Love, Health, Spirituality), built from a genuine blend of three
   independent readings of each area's governing houses, not a
   single reused number:

     80% - the D1 (birth) chart itself: the house lord's dignity,
           which planets occupy the house, and which planets aspect
           it, with benefics counted as support and malefics as
           friction (softened in the Upachaya houses 3/6/10/11,
           which classically improve under pressure rather than
           suffer from it).
     15% - the same reading applied to the D9 (Navamsa) chart in its
           own right (its own Lagna, its own house lords, its own
           occupants and aspects), the classical "second look" that
           confirms or complicates what D1 alone suggests.
      5% - a small technical kicker from the house lord's Shadbala
           (classical strength) and Avastha (mood at birth), plus
           Argala on the house itself (support/obstruction from
           neighbouring houses) - the numbers that already live on
           the Shadbala, Avastha, and Argala tabs, folded in at low
           weight rather than driving the score.

   Each raw score also weighs in more than just the house lord: every
   occupant and every aspecting planet is read through its OWN dignity
   at its own position too (an aspect from an exalted planet lands
   heavier than one from a debilitated one; an exalted occupant helps
   more than a merely-neutral one), so the read draws on the planets'
   actual positions, signs, and drishtis across the chart, not a
   single lord's placement in isolation.

   Each of the three readings is then converted to a 0-100 score on a
   fixed, calibrated scale (a neutral, unremarkable placement sits at
   50; genuinely strong or weak placements push toward the ends) and
   only then blended 80/15/5 - keeping one dimension's raw units from
   accidentally dominating the other two. Earlier versions stretched
   each chart's own weakest and strongest area to anchor 0 and 100,
   which could make ordinary, closely-matched areas look artificially
   maxed-out or hollowed-out just for being relatively first or last
   among six. The fixed scale keeps the spread tied to genuine
   intensity in the chart instead: a well-balanced chart shows areas
   clustered near the middle, and only real concentration produces a
   wide spread. Disclosed simplification, same spirit as Varshesh in
   varshaphala.js.
   ============================================================ */

const LIFE_AREAS=[
  {id:'career',label:'Career & Status',
    houses:[{h:10,w:0.65},{h:6,w:0.35}],
    blurb:'How your public standing, profession, and daily effort are shaping up.'},
  {id:'wealth',label:'Wealth & Resources',
    houses:[{h:2,w:0.55},{h:11,w:0.45}],
    blurb:'Accumulated wealth and family resources, plus the income and gains that keep building them.'},
  {id:'family',label:'Family & Home',
    houses:[{h:4,w:0.65},{h:2,w:0.35}],
    blurb:'Home, mother, emotional roots, and the wider family that anchors you.'},
  {id:'love',label:'Love & Relationships',
    houses:[{h:7,w:0.65},{h:5,w:0.35}],
    blurb:'Marriage, partnerships, and romance, the one-on-one bonds in your life.'},
  {id:'health',label:'Health & Vitality',
    houses:[{h:1,w:0.6},{h:6,w:0.4}],
    blurb:'Your body, self-expression, and resilience against illness or obstacles.'},
  {id:'spirituality',label:'Spirituality & Purpose',
    houses:[{h:9,w:0.55},{h:12,w:0.45}],
    blurb:'Dharma, higher meaning, and the pull toward something beyond the everyday.'}
];

// Simplified classical Naisargika (natural) benefic/malefic grouping, the same one used on the
// You tab, applied here to occupants of and aspects on a house. Upachaya houses (3rd/6th/10th/
// 11th) classically strengthen with pressure rather than suffer from it, so a malefic's usual
// penalty is softened there instead of applying at full weight.
const LIFEMAP_BENEFIC=['Moon','Mercury','Venus','Jupiter'];
const LIFEMAP_UPACHAYA=[3,6,10,11];
const LIFEMAP_DIGNITY_POINTS={exalted:2,moolatrikona:1.5,own:1,debilitated:-1.5};

// How much weight an occupant's or an aspecting planet's OWN dignity (at its own position)
// lends to whatever it's contributing here - an exalted planet brings more of itself to the
// houses it touches, a debilitated one brings less, so the same "benefic occupant" or "malefic
// aspect" doesn't count identically regardless of how strong that planet actually is right now.
function lifemapDignityMultiplier(dignity){
  if(dignity==='exalted')return 1.5;
  if(dignity==='moolatrikona')return 1.25;
  if(dignity==='own')return 1.15;
  if(dignity==='debilitated')return 0.55;
  return 1;
}

// Shared scoring rule for one house's D1-style factors (lord dignity, occupants, aspects
// received), reused as-is for both the actual D1 chart and the D9 chart by simply passing in
// that chart's own house/occupant/aspect data - the technique is identical, only which chart's
// numbers feed it differs. getPos(planet) resolves a planet's OWN sign/degree in that same
// chart, so its own dignity there can weigh its contribution.
function lifemapHouseRaw(house,dignity,occupants,aspects,getPos){
  let raw=dignity?(LIFEMAP_DIGNITY_POINTS[dignity]||0):0;
  const upachaya=LIFEMAP_UPACHAYA.includes(house);
  occupants.forEach(o=>{
    const pos=getPos(o);
    const mult=lifemapDignityMultiplier(pos?getDignity(o,pos.sign,pos.deg):null);
    raw+=(LIFEMAP_BENEFIC.includes(o)?1:(upachaya?-0.2:-0.7))*mult;
  });
  aspects.forEach(a=>{
    const weight=a.grade/60;
    const pos=getPos(a.planet);
    const mult=lifemapDignityMultiplier(pos?getDignity(a.planet,pos.sign,pos.deg):null);
    raw+=(LIFEMAP_BENEFIC.includes(a.planet)?1:(upachaya?-0.2:-0.6))*weight*mult;
  });
  return raw;
}

function lifemapD1HouseRaw(chartData,house){
  const signIdx=(chartData.lagnaSign+house-1)%12;
  const lord=SIGN_LORD[signIdx];
  const lordPos=chartData.planetData[lord];
  const dignity=getDignity(lord,lordPos.sign,lordPos.deg);
  const occupants=chartData.houseMap[house]||[];
  const aspects=getAspectsOnHouseGraded(house,chartData.houseMap);
  const getPos=p=>chartData.planetData[p]?{sign:chartData.planetData[p].sign,deg:chartData.planetData[p].deg}:null;
  return lifemapHouseRaw(house,dignity,occupants,aspects,getPos);
}

function lifemapD9HouseRaw(chartData,house){
  const nav=chartData.navamsa;
  const signIdx=(nav.navAscSign+house-1)%12;
  const lord=SIGN_LORD[signIdx];
  const dignity=getDignity(lord,nav.navPlanetSign[lord],0);
  const occupants=nav.navHouseMap[house]||[];
  const aspects=getAspectsOnHouseGraded(house,nav.navHouseMap);
  const getPos=p=>(nav.navPlanetSign[p]!==undefined)?{sign:nav.navPlanetSign[p],deg:0}:null;
  return lifemapHouseRaw(house,dignity,occupants,aspects,getPos);
}

// The 5% technical kicker: house lord's Shadbala (as a fraction of its classical requirement),
// a small Avastha bonus/penalty, and Argala support/obstruction on the house itself. argalaAll
// is calcArgala's full 12-house result, computed once by the caller and reused across houses
// rather than recomputed per house.
function lifemapTechHouseRaw(chartData,house,argalaAll){
  const signIdx=(chartData.lagnaSign+house-1)%12;
  const lord=SIGN_LORD[signIdx];
  const sb=chartData.shadbala[lord],av=chartData.avasthas[lord];
  const avSummary=avasthaSummary(av.jagradadi,av.deeptadi);
  const avBonus=avSummary.label==='Favourable'?0.4:avSummary.label==='Unfavourable'?-0.4:0;
  const argalaScore=argalaAll[house].sources.reduce((sum,src)=>{
    if(src.status==='active')return sum+0.5;
    if(src.status==='weakened')return sum+0.15;
    return sum;
  },0);
  return(sb.pct/100)+avBonus+argalaScore;
}

// Converts a raw score to a 0-100 read on a FIXED scale, not relative to this chart's own other
// areas: `center` is the raw value that counts as a neutral, unremarkable placement (maps to
// 50%), and `k` sets how quickly the curve saturates toward the ends as raw moves away from
// center. tanh keeps the whole thing smooth and self-limiting (never quite hits 0 or 100), so a
// chart where every area's raw score sits close to center reads as six closely-matched
// percentages near the middle, genuine intensity, rather than always being force-stretched to
// span the full range the way a per-chart min-max scale would.
function lifemapSquash(raw,center,k){
  return Math.max(2,Math.min(98,50+45*Math.tanh((raw-center)/k)));
}

// calcLifeMap(chartData) -> array of LIFE_AREAS entries each extended with {pct, d1Pct, d9Pct,
// techPct, rank}, or null if this chart hasn't finished computing (shouldn't happen for a
// fully-calculated chart).
function calcLifeMap(chartData){
  if(!chartData||!chartData.houseMap||!chartData.navamsa||!chartData.shadbala||!chartData.avasthas)return null;
  const argalaAll=calcArgala(chartData.lagnaSign,chartData.houseMap);
  const d1Raw=[],d9Raw=[],techRaw=[];
  LIFE_AREAS.forEach(area=>{
    let d1=0,d9=0,tech=0;
    area.houses.forEach(hw=>{
      d1+=lifemapD1HouseRaw(chartData,hw.h)*hw.w;
      d9+=lifemapD9HouseRaw(chartData,hw.h)*hw.w;
      tech+=lifemapTechHouseRaw(chartData,hw.h,argalaAll)*hw.w;
    });
    d1Raw.push(d1);d9Raw.push(d9);techRaw.push(tech);
  });
  // k is calibrated against the formula's own typical scale (a single dignity point, occupant,
  // or graded aspect contributes roughly 0.5-2 raw, so most real charts land in the -2..+3
  // range): tight enough that an ordinary chart's real differences between areas show up as
  // real percentage spread, not just a wide-enough band that only rare extreme charts ever move
  // off the fixed 50% centre.
  const d1N=d1Raw.map(v=>lifemapSquash(v,0,1.3));
  const d9N=d9Raw.map(v=>lifemapSquash(v,0,1.3));
  const techN=techRaw.map(v=>lifemapSquash(v,0.7,0.45));
  const areas=LIFE_AREAS.map((area,i)=>{
    const pct=d1N[i]*0.80+d9N[i]*0.15+techN[i]*0.05;
    return Object.assign({},area,{pct,d1Pct:d1N[i],d9Pct:d9N[i],techPct:techN[i]});
  });
  const ranked=[...areas].sort((a,b)=>b.pct-a.pct);
  areas.forEach(a=>{a.rank=ranked.indexOf(a)+1});
  return areas;
}

const LIFE_MAP_METHODOLOGY='The Life Map blends three independent readings of each area\'s governing houses rather than reusing one number for everything. Eighty percent comes from the D1 (birth) chart itself: the house lord\'s classical dignity, which planets occupy the house, and which planets aspect it, with benefics counted as support and malefics as friction, softened in the Upachaya houses (3rd/6th/10th/11th) which classically strengthen under pressure rather than suffer from it. Every occupant and aspecting planet is also read through its own dignity at its own position, so an aspect from an exalted planet counts for more than one from a debilitated planet, drawing on the planets\' actual positions and drishtis across the whole chart, not just the house lord in isolation. Fifteen percent comes from applying that same reading to the D9 (Navamsa) chart in its own right, using its own Lagna, its own house lords, and its own occupants and aspects, the classical "second look" that confirms or complicates what D1 alone suggests. The remaining five percent is a small technical kicker from the house lord\'s Shadbala (classical strength), Avastha (mood at birth), and Argala on the house (support or obstruction from neighbouring houses), the same numbers behind the Shadbala, Avastha, and Argala tabs, folded in at low weight rather than left to drive the score. Each of the three readings is then placed on a fixed, calibrated 0-100% scale, a neutral, unremarkable placement sits at 50%, rather than stretched against that same chart\'s own weakest and strongest area, so a well-balanced chart shows areas clustered near the middle instead of always being forced to span the full range. A "quiet" area is not a prediction of trouble, just less concentration there relative to the rest of this particular chart.';
