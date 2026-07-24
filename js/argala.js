/* ============================================================
   ARGALA & VIRODHARGALA (JAIMINI INTERVENTION/OBSTRUCTION ANALYSIS)
   For each of the 12 houses, checks which houses classically
   "intervene" on its behalf (Argala) and whether that intervention
   is obstructed (Virodhargala) by planets in the mirroring house.
   Pure calculation - no DOM. Rendered by renderArgalaTab() in
   render-tabs.js.
   ============================================================ */

// Primary Argala houses: 2nd, 4th, 11th from the house in question. 5th is included as a secondary/
// subsidiary Argala per some classical authorities (disclosed below). Each Argala's Virodhargala
// (counter-obstruction) comes from the mirroring house on the opposite side of the house in question:
// 2nd<->12th, 4th<->10th, 11th<->3rd, 5th<->9th.
const ARGALA_DEFS=[
  {offset:2,counterOffset:12,label:'2nd house',primary:true},
  {offset:4,counterOffset:10,label:'4th house',primary:true},
  {offset:11,counterOffset:3,label:'11th house',primary:true},
  {offset:5,counterOffset:9,label:'5th house',primary:false}
];

// n-th house counted from h (inclusive, 1-indexed) - same counting convention used throughout
// this codebase for aspects/house-lordship (e.g. ASPECT_OFFSETS usage in render-chart.js).
function houseFromArgala(h,offset){
  return((h-1+offset-1)%12)+1;
}

// calcArgala(lagnaSign, houseMap) -> {1..12: {house, sources:[...], overall}}
// Virodhargala rule: a counter house with occupant-count >= the Argala house's occupant-count fully
// cancels that Argala; fewer occupants weaken it but don't cancel it; zero occupants leave it active.
function calcArgala(lagnaSign,houseMap){
  const results={};
  for(let h=1;h<=12;h++){
    const sources=ARGALA_DEFS.map(def=>{
      const argalaHouse=houseFromArgala(h,def.offset);
      const counterHouse=houseFromArgala(h,def.counterOffset);
      const argalaPlanets=houseMap[argalaHouse]||[];
      const counterPlanets=houseMap[counterHouse]||[];
      let status;
      if(argalaPlanets.length===0)status='none';
      else if(counterPlanets.length>=argalaPlanets.length)status='cancelled';
      else if(counterPlanets.length>0)status='weakened';
      else status='active';
      return{label:def.label,primary:def.primary,argalaHouse,counterHouse,argalaPlanets,counterPlanets,status};
    });
    const contributing=sources.filter(s=>s.status==='active'||s.status==='weakened');
    const active=sources.filter(s=>s.status==='active');
    let overall;
    if(!contributing.length){
      overall='No significant Argala present on this house from the classical 2nd/4th/11th (+5th) houses.';
    }else if(active.length){
      overall=`Supported by Argala from ${active.map(s=>s.label).join(', ')}`+
        (contributing.length>active.length?', with some additional Argala present but partly obstructed elsewhere.':'.');
    }else{
      overall=`Argala is present (from ${contributing.map(s=>s.label).join(', ')}) but weakened by Virodhargala counters — its supportive effect on this house is muted rather than absent.`;
    }
    results[h]={house:h,sources,overall};
  }
  return results;
}

const ARGALA_METHODOLOGY='Argala ("intervention" or "support") is a classical Jaimini technique that examines whether the promise of a house is actively helped along by planets positioned to intervene on its behalf — distinct from the Grahas occupying or aspecting the house itself. This tool checks the most widely cited Argala houses: the 2nd, 4th, and 11th counted from the house in question (primary), plus the 5th house, which some classical authorities include as a secondary/subsidiary Argala source. Each Argala is checked against its classical Virodhargala ("counter-obstruction") house — respectively the 12th, 10th, 3rd, and 9th — using the standard rule that a Virodhargala needs at least as many occupying planets as its Argala to fully cancel it; fewer planets weaken but do not fully cancel it, and zero planets leave the Argala fully active. Some classical schools use slightly different house-lists (a few include the 10th as a direct Argala source too) or add planetary dignity/benefic-malefic weighting on top of the raw occupant-count used here — treat this as one widely-used reading of the technique, not the only classical variant.';
