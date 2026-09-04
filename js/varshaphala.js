/* ============================================================
   VARSHAPHALA (TAJIKA ANNUAL CHART) - CORE ENGINE
   Classical solar-return-based yearly forecasting system, distinct
   from (and layered on top of) the D1/D9/Dasha machinery elsewhere
   in this app. Computes: the precise Solar Return moment for the
   currently-running birthday year, a full annual (Varsha) chart at
   that moment, Muntha (the year's progressed-Ascendant point), a
   simplified Varshesh (year lord), and Mudda Dasha (the year's own
   nine-planet Vimshottari-proportioned sub-period timeline).

   Disclosed scope: this models the well-documented core of Tajika
   practice (solar return, annual chart, Muntha) plus a SIMPLIFIED
   Varshesh selection - comparing classical dignity across the three
   most commonly-cited candidate lords (annual Lagnesh, Muntha lord,
   current Dasha lord) rather than the full classical Panchadhikari
   five-lord weighted comparison, which involves finer point-scoring
   this tool does not attempt to reproduce exactly. Tajika-specific
   aspect doctrine (Ithasala/Isarapha - applying/separating aspects
   between annual-chart planets) and the 16 classical Sahams (Arabic
   Parts) are not modeled at all - both are substantial standalone
   systems in their own right. Treat the Varshesh and yearly reading
   here as a solid, honestly-scoped core rather than full classical
   Tajika precision.
   ============================================================ */

// Solves for the JD (UT) of the Nth solar return after birth: the moment the sidereal Sun's
// longitude returns to its natal value, searched near birthJD + N*365.2425 days and refined via
// Newton's method (mean solar motion ~0.9856 deg/day gives a fast, reliably-converging step).
function solveSolarReturnJD(natalSunSidLon,birthJD,n){
  let guessJD=birthJD+n*365.2425;
  for(let i=0;i<10;i++){
    const T=(guessJD-2451545.0)/36525;
    const ayan=lahiriAyanamsa(guessJD);
    const trop=allPlanets(guessJD,T);
    const sunSid=sid(trop.Sun,ayan);
    let diff=sunSid-natalSunSidLon;
    if(diff>180)diff-=360;if(diff<-180)diff+=360;
    if(Math.abs(diff)<0.00005)break;
    guessJD-=diff/0.9856;
  }
  return guessJD;
}

// Finds the CURRENTLY-RUNNING Varsha year's solar return: starts from the completed-years estimate,
// solves precisely, then nudges n up/down if the precise result lands after/long-before the reference
// date (guards against the average-year-length guess landing one cycle off near a birthday).
function findCurrentSolarReturn(natalSunSidLon,birthJD,refJD){
  let n=Math.floor((refJD-birthJD)/365.2425);
  let srJD=solveSolarReturnJD(natalSunSidLon,birthJD,n);
  if(srJD>refJD){n-=1;srJD=solveSolarReturnJD(natalSunSidLon,birthJD,n);}
  else{
    const nextJD=solveSolarReturnJD(natalSunSidLon,birthJD,n+1);
    if(nextJD<=refJD){n+=1;srJD=nextJD;}
  }
  return{n,srJD};
}

// Casts a full chart (Lagna + all 9 grahas, whole-sign houses) at a given JD/location - same
// pipeline as the natal chart, just at the solar-return moment instead of birth.
function castChartAt(jd,lat,lon){
  const T=(jd-2451545.0)/36525;
  const ayan=lahiriAyanamsa(jd);
  const trop=allPlanets(jd,T);
  const sidMap={};
  for(const p in trop)sidMap[p]=sid(trop[p],ayan);
  sidMap.Ketu=sid(trop.Ketu,ayan);
  const ascSid=sid(calcAsc(jd,lat,lon),ayan);
  const lagnaSign=getSign(ascSid);
  const houseMap={};for(let i=1;i<=12;i++)houseMap[i]=[];
  const planetData={};
  PLANETS.forEach(p=>{
    const l=sidMap[p],sign=getSign(l),house=((sign-lagnaSign+12)%12)+1,deg=getDeg(l);
    houseMap[house].push(p);planetData[p]={lon:l,sign,house,deg};
  });
  return{jd,ascSid,lagnaSign,planetData,houseMap};
}

// Dignity rank used only to compare Varshesh candidates against each other (higher = stronger).
const DIGNITY_RANK={exalted:5,moolatrikona:4,own:3,null:2,debilitated:1};
function dignityRank(planet,sign,deg){
  const dig=getDignity(planet,sign,deg);
  return DIGNITY_RANK[dig===null?'null':dig];
}

// ---------------- MUDDA DASHA (Varsha Vimshottari) ----------------
// The genuine classical sub-period system for a Varshaphala year, and the direct answer to
// "what does this year actually break down into": the same nine-lord order and proportional
// weights as natal Vimshottari Dasha, but compressed to span exactly this one solar-return year
// (Solar Return -> next Solar Return) instead of a lifetime. The starting lord is the nakshatra
// lord of the Moon's position in the ANNUAL chart (cast at the solar return moment) - a
// genuinely distinct calculation from the natal Moon's own dasha lord, and the standard basis
// for Mudda Dasha in classical Tajika practice. Because the nine lords' years (120 total) are
// simply rescaled to fit exactly one year, no "balance" first period is needed the way natal
// Dasha needs one: the first Mudda period runs its full proportional share starting right at
// the solar return, and the nine periods together exactly fill the year. Reuses the same
// calcSubPeriods() engine that already generates Antardashas from a parent Mahadasha - the
// math is identical, only the span it's stretched across differs.
function calcMuddaDasha(annual,srJD,nextSrJD){
  const mLon=annual.planetData.Moon.lon;
  const startLord=getNakshatra(mLon).lord;
  const srDate=new Date((srJD-2440587.5)*86400000);
  const nextSrDate=new Date((nextSrJD-2440587.5)*86400000);
  const totalDays=(nextSrDate-srDate)/86400000;
  return calcSubPeriods({lord:startLord,start:srDate,end:nextSrDate,years:totalDays/365.2425});
}

// calcVarshaphala(chartData, refDate=now) -> the currently-running annual chart + Muntha + a
// simplified Varshesh, or null if birth data is somehow missing.
function calcVarshaphala(chartData,refDate){
  if(!chartData||!chartData.planetData||!chartData.planetData.Sun)return null;
  refDate=refDate||new Date();
  const[yr,mo,dy]=chartData.dob.split('-').map(Number);
  const[hr,mn]=chartData.tob.split(':').map(Number);
  const utcHr=(hr+mn/60)-chartData.tz;
  const birthJD=julianDay(yr,mo,dy,utcHr);
  const refJD=julianDay(refDate.getUTCFullYear(),refDate.getUTCMonth()+1,refDate.getUTCDate(),
    refDate.getUTCHours()+refDate.getUTCMinutes()/60+refDate.getUTCSeconds()/3600);
  const natalSunSidLon=chartData.planetData.Sun.lon;
  const{n,srJD}=findCurrentSolarReturn(natalSunSidLon,birthJD,refJD);
  // Classical default: cast the annual chart for the birthplace, not current location (Tajika's
  // traditional convention - some modern practitioners use current residence instead).
  const annual=castChartAt(srJD,chartData.lat,chartData.lon);
  const nextSrJD=solveSolarReturnJD(natalSunSidLon,birthJD,n+1);
  const muddaDasha=calcMuddaDasha(annual,srJD,nextSrJD);

  // Muntha: advances one sign per year from the natal Ascendant, cycling every 12 years.
  const munthaSign=(chartData.lagnaSign+n)%12;
  const munthaLord=SIGN_LORD[munthaSign];

  // Varshesh: strongest-dignity candidate among annual Lagnesh, Muntha lord, and the natal chart's
  // currently-running Mahadasha lord (a disclosed simplification - see file header).
  const annualLagnesh=SIGN_LORD[annual.lagnaSign];
  const now=new Date();
  const activeMaha=(chartData.dashas||[]).find(d=>now>=d.start&&now<d.end);
  const dashaLord=activeMaha?DASHA_LORD_FULLNAME[activeMaha.lord]:null;
  const candidates=[...new Set([annualLagnesh,munthaLord,dashaLord].filter(Boolean))];
  let varshesh=candidates[0],bestRank=-1;
  candidates.forEach(p=>{
    const pd=annual.planetData[p];
    if(!pd)return;
    const rank=dignityRank(p,pd.sign,pd.deg);
    if(rank>bestRank){bestRank=rank;varshesh=p;}
  });

  return{n,srJD,nextSrJD,annual,munthaSign,munthaLord,annualLagnesh,dashaLord,varshesh,muddaDasha};
}

const VARSHAPHALA_METHODOLOGY='Varshaphala ("fruits of the year") is the classical Tajika system for yearly forecasting, distinct from the D1/Dasha-based reading elsewhere in this app. This tool models its well-documented core: the precise Solar Return moment (when the transiting Sun returns to its exact natal sidereal degree, marking the start of the current birthday year), a full annual chart cast for that moment at the birthplace (the classical convention), Muntha (a point that advances one sign per year from the natal Ascendant, cycling every 12 years), and Mudda Dasha (the annual chart Moon\'s nakshatra lord starts a nine-planet Vimshottari-proportioned sub-period sequence that exactly fills the year, giving this year its own internal timeline). Varshesh (year lord) is determined here by a SIMPLIFIED method - comparing classical dignity (exaltation/moolatrikona/own sign/neutral/debilitated) across the three most commonly-cited candidates (the annual chart\'s own Lagna lord, the Muntha lord, and the natal chart\'s currently-running Mahadasha lord) and picking the strongest - rather than the full classical Panchadhikari five-candidate weighted-point comparison, which this tool does not attempt to reproduce exactly. Two further pillars of full classical Tajika practice are not modeled at all: Ithasala/Isarapha (a distinct applying/separating aspect doctrine between annual-chart planets) and the sixteen classical Sahams (Arabic Parts/sensitive degree points). Treat the yearly reading here as a solidly-grounded core reading rather than complete classical Tajika precision.';
