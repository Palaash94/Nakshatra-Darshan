/* ============================================================
   COMPATIBILITY - BEYOND ASHTAKOOT (COUPLE MODE)
   Five additional classical/synastry-style checks layered on top
   of the core Ashtakoot Guna Milan score in ashtakoot.js: mutual
   Mangal Dosha, 7th-house (marriage house) strength per partner,
   a simplified Venus-Mars cross-chart read, a Navamsa (D9) Moon
   comparison, and current-Mahadasha timing compatibility. Pure
   calculation - no DOM. Rendered by renderCompatibilityTab() in
   render-tabs.js.
   ============================================================ */

// ---------------- Mutual Mangal Dosha ----------------
function calcMutualMangalDosha(chartDataA,chartDataB){
  const nameA=chartDataA.name||'Partner A',nameB=chartDataB.name||'Partner B';
  const doshaA=detectMangalDosha(chartDataA.planetData,chartDataA.lagnaSign);
  const doshaB=detectMangalDosha(chartDataB.planetData,chartDataB.lagnaSign);
  let status,note;
  if(doshaA&&doshaB){
    status='both';
    note=`Both ${nameA} and ${nameB} carry Mangal Dosha. Most classical traditions hold this actually works in the couple's favour: the affliction is primarily a concern when only one partner carries it, and is widely considered to cancel itself out when both do.`;
  }else if(doshaA||doshaB){
    status='oneOnly';
    const who=doshaA?nameA:nameB;
    note=`Only ${who} carries Mangal Dosha. Classical texts treat this asymmetry as the condition most worth examining closely, check the specific cancellation factors noted below before drawing conclusions, since many classical exceptions can waive it entirely.`;
  }else{
    status='neither';
    note=`Neither ${nameA} nor ${nameB} carries classical Mangal Dosha from the Ascendant or the Moon (the two reference points that actually determine whether it's present).`;
  }
  return{doshaA,doshaB,status,note,nameA,nameB};
}

// ---------------- 7th House (marriage house) strength, per partner ----------------
function seventhHouseStrength(planetData,lagnaSign,houseMap){
  const sign7=(lagnaSign+6)%12;
  const lord7=houseLordOf(7,lagnaSign);
  const lordData=planetData[lord7];
  const lordDig=getDignity(lord7,lordData.sign,lordData.deg);
  const lordHouse=lordData.house;
  const occupants=houseMap[7]||[];
  const beneficOccupants=occupants.filter(isBenefic);
  const maleficOccupants=occupants.filter(p=>!isBenefic(p));
  let score=55;
  if(lordDig==='exalted'||lordDig==='own')score+=20;
  else if(lordDig==='debilitated')score-=20;
  if([1,4,5,7,9,10].includes(lordHouse))score+=10;
  if([6,8,12].includes(lordHouse))score-=15;
  score+=beneficOccupants.length*8;
  score-=maleficOccupants.length*6;
  score=Math.max(10,Math.min(90,score));
  return{sign7,lord7,lordDig,lordHouse,occupants,beneficOccupants,maleficOccupants,score};
}
function calc7thHouseCompat(chartDataA,chartDataB){
  const a=seventhHouseStrength(chartDataA.planetData,chartDataA.lagnaSign,chartDataA.houseMap);
  const b=seventhHouseStrength(chartDataB.planetData,chartDataB.lagnaSign,chartDataB.houseMap);
  return{a,b};
}
// Narrates the two independent 7th-house readings above as one combined story rather than leaving
// them as two isolated cards - not a new score, just a plain-language read of what the COMBINATION of
// both numbers actually suggests (both strong, both quiet, or one steadier than the other).
function seventhHouseCoupleSummary(a,b,nameA,nameB){
  const diff=a.score-b.score;
  const bothStrong=a.score>=65&&b.score>=65;
  const bothWeak=a.score<45&&b.score<45;
  const stronger=diff>=0?nameA:nameB,weaker=diff>=0?nameB:nameA;
  const strongerD=diff>=0?a:b,weakerD=diff>=0?b:a;
  if(bothStrong){
    return`Both of you come into this from genuinely fertile ground: ${nameA}'s own 7th house runs through ${a.lord7} (${a.lordDig||'a workmanlike placement'}), and ${nameB}'s through ${b.lord7} (${b.lordDig||'a workmanlike placement'}). Neither of you individually needs convincing that partnership is worth the effort, the story here is less about overcoming resistance and more about two people who already expect good things from commitment.`;
  }
  if(bothWeak){
    return`Neither of your own charts is naturally the easiest starting point for partnership: ${nameA}'s 7th house runs through ${a.lord7}, ${nameB}'s through ${b.lord7}, and both lean quieter than average on this axis. That's not a verdict on this specific relationship, it just means neither of you walks in with an automatic natural ease around commitment, so what you build here is more likely to be earned deliberately than to simply fall into place.`;
  }
  if(Math.abs(diff)>=15){
    return`This reads as one steadier hand and one that's working harder: ${stronger}'s own chart is the naturally more settled one around partnership (7th house led by ${strongerD.lord7}), while ${weaker}'s asks more conscious effort here (led by ${weakerD.lord7}). In practice this often plays out as ${stronger} holding steadier ground when things get uncertain, while ${weaker} does more of the active work of staying open to closeness.`;
  }
  return`Neither of you is dramatically favoured or strained here, ${nameA}'s 7th house (led by ${a.lord7}) and ${nameB}'s (led by ${b.lord7}) sit at a fairly similar level of natural readiness for partnership, so this isn't a place where one of you is quietly compensating for the other.`;
}

// ---------------- Venus-Mars cross-chart read (simplified sign-distance synastry) ----------------
// Not a classical Vedic technique on its own (graha drishti is house-based, not directly comparable
// across two independent charts) - a disclosed simplification using the same sign-distance logic
// Bhakoot Koota already uses elsewhere in this app, applied here to attraction/drive instead of Moon.
const SYNASTRY_DIST_READ={
  1:{label:'Conjunction',desc:'An intense, magnetic pull, attraction and drive fused together in the same sign.'},
  7:{label:'Opposition',desc:'Strong polarity, a magnetic draw built on difference, capable of running hot and cold.'},
  5:{label:'Trine',desc:'Easy, natural chemistry, romantic and physical instincts align smoothly.'},
  9:{label:'Trine',desc:'Easy, natural chemistry, romantic and physical instincts align smoothly.'},
  4:{label:'Square',desc:'A charged, dynamic pull, exciting, but with real friction potential.'},
  10:{label:'Square',desc:'A charged, dynamic pull, exciting, but with real friction potential.'}
};
function synastryPairRead(signFrom,signTo){
  const dist=((signTo-signFrom+12)%12)+1;
  return SYNASTRY_DIST_READ[dist]||{label:'Background',desc:'A quieter influence, not a dominant factor for attraction either way.'};
}
function calcVenusMarsSynastry(chartDataA,chartDataB){
  const venusA=chartDataA.planetData.Venus.sign,marsA=chartDataA.planetData.Mars.sign;
  const venusB=chartDataB.planetData.Venus.sign,marsB=chartDataB.planetData.Mars.sign;
  return{
    aVenusToBMars:{...synastryPairRead(venusA,marsB),signA:venusA,signB:marsB},
    bVenusToAMars:{...synastryPairRead(venusB,marsA),signA:venusB,signB:marsA},
    marsAtoMarsB:{...synastryPairRead(marsA,marsB),signA:marsA,signB:marsB},
    venusAtoVenusB:{...synastryPairRead(venusA,venusB),signA:venusA,signB:venusB}
  };
}
// This tab only makes sense once both partners' gender is known - it decides which classical check
// applies (opposite-gender: his Mars against her Venus, from each partner's own POV; same-gender:
// Mars-to-Mars or Venus-to-Venus, the one axis that still applies), so it's built to skip cleanly
// rather than guess at a generic framing when that information isn't there:
//   - one man, one woman -> TWO boxes, each partner's own POV: his Mars reaching toward her Venus,
//     and her Mars reaching toward his Venus (the traditional convention this check is built on).
//   - both men -> ONE box, Mars to Mars (Venus isn't the relevant axis between two Mars charts here).
//   - both women -> ONE box, Venus to Venus.
//   - either gender unset -> null, the tab shows a short explanation instead of a reading.
function venusMarsAnalysis(chartDataA,chartDataB,synastry){
  const gA=chartDataA.gender,gB=chartDataB.gender;
  const nameA=chartDataA.name||'Partner A',nameB=chartDataB.name||'Partner B';
  if(!gA||!gB)return null;
  if(gA!==gB){
    const maleIsA=gA==='male';
    const maleName=maleIsA?nameA:nameB,femaleName=maleIsA?nameB:nameA;
    // "his Mars -> her Venus" = the check between the female partner's Venus and the male partner's Mars.
    const hisMarsHerVenus=maleIsA?synastry.bVenusToAMars:synastry.aVenusToBMars;
    const herMarsHisVenus=maleIsA?synastry.aVenusToBMars:synastry.bVenusToAMars;
    return{mode:'cross',maleName,femaleName,hisMarsHerVenus,herMarsHisVenus};
  }
  if(gA==='male')return{mode:'marsOnly',nameA,nameB,read:synastry.marsAtoMarsB};
  return{mode:'venusOnly',nameA,nameB,read:synastry.venusAtoVenusB};
}
// One combined narrative reading both directions together (opposite-gender mode only), the "so what"
// the two cards above don't spell out on their own.
function articleFor(word){return/^[aeiou]/i.test(word)?'an':'a'}
function venusMarsCoupleSummary(maleName,femaleName,hisMarsHerVenus,herMarsHisVenus){
  let text=`Classically this axis is read from two angles at once: ${maleName}'s Mars reaching toward ${femaleName}'s Venus describes the pull of pursuit and desire, drive meeting what she finds attractive; ${femaleName}'s Mars reaching toward ${maleName}'s Venus is the reverse, her own drive and assertiveness meeting what he finds attractive.`;
  if(hisMarsHerVenus.label===herMarsHisVenus.label){
    text+=` Both directions land on the same kind of angle here (${hisMarsHerVenus.label}), so this dynamic reads fairly evenly, neither side is doing noticeably more of the reaching than the other.`;
  }else{
    text+=` The two directions land differently: ${maleName} reaching toward ${femaleName} is ${articleFor(hisMarsHerVenus.label)} ${hisMarsHerVenus.label}, while ${femaleName} reaching toward ${maleName} is ${articleFor(herMarsHisVenus.label)} ${herMarsHisVenus.label}, so the pull isn't quite symmetric, one direction likely feels more natural or automatic than the other.`;
  }
  return text;
}
// Same-gender single-axis summary (Mars-to-Mars or Venus-to-Venus) - the traditional his-Mars/her-
// Venus convention needs one man and one woman to make sense, so with both of you sharing a gender
// this reads the one axis that still applies between you directly instead.
function venusMarsSameGenderSummary(nameA,nameB,axis,read){
  const verb=axis==='Mars'?'drive and assertiveness':'affection and taste';
  return`With both of you sharing the same gender in the form, this reads ${axis} to ${axis} directly rather than the traditional cross-check: ${nameA}'s ${verb} meeting ${nameB}'s, ${articleFor(read.label)} ${read.label.toLowerCase()}. ${read.desc}`;
}

// ---------------- Current Mahadasha timing compatibility ----------------
function calcDashaTimingCompat(chartDataA,chartDataB){
  const now=new Date();
  const mahaA=(chartDataA.dashas||[]).find(d=>now>=d.start&&now<d.end);
  const mahaB=(chartDataB.dashas||[]).find(d=>now>=d.start&&now<d.end);
  if(!mahaA||!mahaB)return null;
  const lordA=DASHA_LORD_FULLNAME[mahaA.lord],lordB=DASHA_LORD_FULLNAME[mahaB.lord];
  const sameLord=lordA===lordB;
  const score=sameLord?5:grahaMaitriScore(lordA,lordB);
  return{lordA,lordB,sameLord,score};
}

// ---------------- Full Dasha timing: how each partner feels, and how long this exact pairing runs ----------------
// Goes beyond calcDashaTimingCompat's single friendship score above with three more layers: each
// partner's current Antardasha (the nearer-term sub-signal layered on top of their Mahadasha), a
// genuine "how does each of you actually feel right now" clause per partner reusing PLANET_FLAVOR
// (updates.js), and a relationship-timing read - how many years this EXACT combination of the two
// partners' Mahadashas has left to run before one of you shifts into a new one, since that's the
// actual answer to "how does it span for the relationship" rather than a single point-in-time score.
function calcDashaTimingFull(chartDataA,chartDataB,refDate){
  refDate=refDate||new Date();
  const nameA=chartDataA.name||'Partner A',nameB=chartDataB.name||'Partner B';
  const mahaA=(chartDataA.dashas||[]).find(d=>refDate>=d.start&&refDate<d.end);
  const mahaB=(chartDataB.dashas||[]).find(d=>refDate>=d.start&&refDate<d.end);
  if(!mahaA||!mahaB)return null;
  const antarA=(mahaA.antardashas||[]).find(d=>refDate>=d.start&&refDate<d.end);
  const antarB=(mahaB.antardashas||[]).find(d=>refDate>=d.start&&refDate<d.end);
  const lordA=DASHA_LORD_FULLNAME[mahaA.lord],lordB=DASHA_LORD_FULLNAME[mahaB.lord];
  const antarLordA=antarA?DASHA_LORD_FULLNAME[antarA.lord]:null;
  const antarLordB=antarB?DASHA_LORD_FULLNAME[antarB.lord]:null;
  const sameLord=lordA===lordB;
  const score=sameLord?5:grahaMaitriScore(lordA,lordB);
  const yearsLeftA=(mahaA.end-refDate)/(365.25*86400000);
  const yearsLeftB=(mahaB.end-refDate)/(365.25*86400000);
  const sharedYears=Math.min(yearsLeftA,yearsLeftB);
  const firstToShift=yearsLeftA<yearsLeftB?nameA:nameB;
  const laterName=yearsLeftA<yearsLeftB?nameB:nameA;
  let antarScore=null,antarRel=null;
  if(antarLordA&&antarLordB){
    antarScore=antarLordA===antarLordB?5:grahaMaitriScore(antarLordA,antarLordB);
  }
  return{nameA,nameB,lordA,lordB,antarLordA,antarLordB,sameLord,score,antarScore,
    mahaA,mahaB,antarA,antarB,yearsLeftA,yearsLeftB,sharedYears,firstToShift,laterName};
}
// Two hand-written phrasings of "how this feels day to day for one partner right now", built around
// PLANET_FLAVOR (updates.js) so it's tied to the actual running Mahadasha/Antardasha rather than
// being generic. Seeded so repeat visits within the same dasha period don't always read identically.
const DASHA_FEEL_LINE=[
  (name,mahaLord,antarLord,yearsLeft)=>`${name} is currently running a ${mahaLord} Mahadasha${antarLord?`, layered right now with a ${antarLord} Antardasha`:''}, meaning day-to-day life for ${name} leans toward ${PLANET_FLAVOR[mahaLord]}${antarLord?`, with a nearer-term thread of ${PLANET_FLAVOR[antarLord]} running underneath`:''}, for roughly the next ${yearsLeft.toFixed(1)} years.`,
  (name,mahaLord,antarLord,yearsLeft)=>`For ${name}, this is a ${mahaLord}-led chapter${antarLord?`, currently coloured by a ${antarLord} Antardasha`:''}, so a pull toward ${PLANET_FLAVOR[mahaLord]} sits closer to the surface of ${name}'s life than usual${antarLord?`, with ${PLANET_FLAVOR[antarLord]} as the more immediate undertone`:''}. About ${yearsLeft.toFixed(1)} years are left to run in it.`
];
function dashaFeelLine(name,mahaLord,antarLord,yearsLeft,seed){
  return pickVariant(DASHA_FEEL_LINE,seed)(name,mahaLord,antarLord,yearsLeft);
}
// The relationship-timing read: not just whether the two current Mahadashas get along, but how much
// runway this exact combination of periods actually has before the balance changes, genuinely useful
// information for a relationship that a single point-in-time compatibility score doesn't capture.
function dashaSpanLine(d){
  const closeness=Math.abs(d.yearsLeftA-d.yearsLeftB);
  if(closeness<1)return`${d.nameA}'s and ${d.nameB}'s current chapters are set to close out within about the same window of each other, so this particular combination of influences has roughly ${d.sharedYears.toFixed(1)} years left to run for both of you together before you're both due for a new one.`;
  if(closeness<3)return`${d.firstToShift} is due to shift into a new Mahadasha somewhat sooner than ${d.laterName}, so this exact pairing of periods has around ${d.sharedYears.toFixed(1)} years of shared runway left before the balance between you changes.`;
  return`${d.firstToShift}'s current Mahadasha ends well before ${d.laterName}'s does, a gap of several years, so treat this particular combination as a shorter-term backdrop, roughly ${d.sharedYears.toFixed(1)} years, rather than the defining note of the relationship's whole timeline. ${d.laterName}'s period will keep running long after this specific pairing has already changed.`;
}

// ---------------- Cross-chart "relationship yogas" (the positive counterpart to Mangal Dosha) ----------------
// Three defensible, disclosed adaptations of classical single-chart concepts to a pair of charts:
// mutual Moon-sign-lord exchange (Parivartana, normally checked within one chart, applied here across
// two), a shared Atmakaraka (Jaimini's "soul planet" - a synastry idea some Jaimini practitioners already
// use informally), and friendship between the two birth-Nakshatra dispositors (a different lord system
// than Graha Maitri's Moon-SIGN lords, so it's genuinely additional signal rather than a duplicate).
function calcCompatibilityYogas(chartDataA,chartDataB){
  const nameA=chartDataA.name||'Partner A',nameB=chartDataB.name||'Partner B';
  const yogas=[];

  const moonSignA=chartDataA.planetData.Moon.sign,moonSignB=chartDataB.planetData.Moon.sign;
  const lordA=SIGN_LORD[moonSignA],lordB=SIGN_LORD[moonSignB];
  const lordASignInOwnChart=chartDataA.planetData[lordA].sign;
  const lordBSignInOwnChart=chartDataB.planetData[lordB].sign;
  if(lordASignInOwnChart===moonSignB&&lordBSignInOwnChart===moonSignA){
    yogas.push({
      name:'Rashi Parivartana Yoga (Moon-Sign Exchange)',
      formation:`${nameA}'s Moon-sign lord (${lordA}) sits in ${nameB}'s Moon sign, and ${nameB}'s Moon-sign lord (${lordB}) sits in ${nameA}'s Moon sign, a mutual exchange between the two charts, adapting the classical single-chart Parivartana (sign-exchange) concept across the pair.`,
      signifies:'A mutual-reception bond between the two charts\' emotional foundations, classically, exchange yogas are read as each side actively supporting the other rather than one being dominant.',
      planetsInvolved:[lordA,lordB]
    });
  }

  const akA=calcCharaKarakas(chartDataA.planetData)[0].planet;
  const akB=calcCharaKarakas(chartDataB.planetData)[0].planet;
  if(akA===akB){
    yogas.push({
      name:'Shared Atmakaraka Yoga',
      formation:`Both ${nameA} and ${nameB} carry ${akA} as their Atmakaraka (the planet at the highest degree among the seven classical grahas), the same "soul significator" in Jaimini astrology.`,
      signifies:'Some Jaimini traditions read a shared Atmakaraka between two people as a soul-level resonance, a shared core drive or life theme running through both charts, distinct from the Rashi/Nakshatra-based Ashtakoot factors above.',
      planetsInvolved:[akA]
    });
  }

  const nakLordA=DASHA_LORD_FULLNAME[chartDataA.planetData.Moon.nakshatra.lord];
  const nakLordB=DASHA_LORD_FULLNAME[chartDataB.planetData.Moon.nakshatra.lord];
  if(nakLordA===nakLordB){
    yogas.push({
      name:'Shared Nakshatra Lord Yoga',
      formation:`${nameA}'s birth Nakshatra (${chartDataA.planetData.Moon.nakshatra.name}) and ${nameB}'s birth Nakshatra (${chartDataB.planetData.Moon.nakshatra.name}) are both ruled by ${nakLordA}.`,
      signifies:'The birth-star dispositor is a different lordship system from the Moon-sign lord already checked in Graha Maitri above, sharing it suggests the two charts\' Vimshottari Dasha rhythms and underlying instincts are drawing from the same planetary source.',
      planetsInvolved:[nakLordA]
    });
  }else{
    const relAtoB=naturalRelation(nakLordA,nakLordB),relBtoA=naturalRelation(nakLordB,nakLordA);
    if(relAtoB==='friend'&&relBtoA==='friend'){
      yogas.push({
        name:'Nakshatra Lord Friendship Yoga',
        formation:`${nameA}'s birth-Nakshatra lord (${nakLordA}) and ${nameB}'s birth-Nakshatra lord (${nakLordB}) are mutual natural friends.`,
        signifies:'A supportive undertone between the two charts\' instinctual/emotional dispositors, a milder version of the Shared Nakshatra Lord Yoga above.',
        planetsInvolved:[nakLordA,nakLordB]
      });
    }
  }

  return yogas;
}

// ---------------- "Together" updates (couple daily/monthly/yearly) ----------------
// A genuinely composite relationship reading, not two individual horoscopes stapled together. Reuses
// each partner's individual engine (updates.js) for the heavy lifting, then builds two more layers
// that only exist for a PAIR of charts:
//   1. An opening keyed to a 2x3 matrix - whether the two of you share a life-area theme right now
//      or are pulled toward different ones, crossed with whether the underlying valence for each of
//      you is favourable, effortful, or split. Each cell LEADS with a description of what the
//      relationship itself looks/feels like right now (a shared current, a doubled weight, two
//      engines running out of sync...) before naming each partner's specific theme, so the read is
//      about the bond, not a side-by-side comparison of two horoscopes.
//   2. A real synastry line: the classical natural-friendship relation (Naisargika Maitri) between
//      whichever planet is actually driving each of your individual readings right now, e.g. if
//      today's ruler for one of you and this month's ruler for the other are natural friends, that's
//      named directly, rather than the two readings just sitting side by side unrelated.
// Both layers rotate through hand-written variants via the same date-seeded pickVariant() from
// updates.js, so the same theme/valence combination doesn't read identically every time it recurs.
const COUPLE_OPENING={
  sameFav:["Right now, this relationship runs on a genuinely shared current: {A} and {B} are both moving through {themeA} at the same time, and favourable ground under both of you makes it easier to lean into together than to navigate apart.",
           "This is a stretch where the two of you are moving in step without even trying to. The same theme, {themeA}, is lit up for both of you, a good window to handle it as a team rather than two separate efforts.",
           "The relationship itself gets a genuine tailwind right now: {A} and {B} are both riding the same favourable current around {themeA}, worth actually noticing it instead of taking the ease for granted."],
  sameChallenge:["Right now, this relationship is carrying weight from both sides at once: {A} and {B} are both facing the same kind of friction, {themeA}, and neither of you is imagining it.",
                 "This is a stretch where the relationship itself feels a little heavier, not because of each other, but alongside each other. The same pressure, {themeA}, is showing up for both of you right now.",
                 "The relationship is holding a double dose of the same weather right now: {themeA} is pressing on both {A} and {B} at once, so what looks like tension between you may actually just be shared strain."],
  sameMixed:["Right now, this relationship looks aligned on paper but feels lopsided in practice: {A} and {B} are both tuned to {themeA}, but one of you clearly has an easier time with it than the other.",
             "This is a stretch where you're standing in the same room but not quite feeling the same room. Same subject, {themeA}, different weather for each of you right now.",
             "The relationship is circling one shared subject, {themeA}, right now, but the two of you are experiencing it at noticeably different intensities, worth naming that gap out loud."],
  diffFav:["Right now, this relationship runs on two separate engines, both running well: {A} is caught up in {themeA}, {B} in {themeB}, different currents, but both genuinely favourable.",
           "This is a stretch where the relationship holds two different good stories at once, {themeA} for {A}, {themeB} for {B}. Neither one needs to be sacrificed for the other.",
           "The relationship has room for two good things happening at once right now, {themeA} for {A} and {themeB} for {B}, worth celebrating both rather than letting one overshadow the other."],
  diffChallenge:["Right now, this relationship is being pulled at from two different directions, and neither of them is actually about the other person: {A} is dealing with {themeA}, {B} with {themeB}, both genuinely effortful.",
                 "This is a stretch where the relationship has to hold two separate weights at once, {themeA} for {A} and {themeB} for {B}. Easy to mistake each other's distraction for distance when it's really just two separate loads.",
                 "The relationship is doing double duty right now, carrying {A}'s {themeA} and {B}'s {themeB} side by side, worth remembering neither struggle is actually about the other person."],
  diffMixed:["Right now, this relationship is carrying two different weathers at once: {themeA} for {A}, {themeB} for {B}, and one of you clearly has the easier road.",
             "This is a stretch where one of you is having an easier time than the other, {themeA} for {A} against {themeB} for {B}, and the relationship itself sits in that gap between you.",
             "The relationship is stretched across two different stories right now, {themeA} for {A}, {themeB} for {B}, and they're not evenly weighted, worth checking in rather than assuming you're both fine."]
};
// Kept separate from COUPLE_OPENING's six buckets but bucketed the same way by valence-kind (not
// by theme match, the theme rarely changes what's actionable) so the suggestion never contradicts
// the reading above it - "name the different pace" only ever fires when there IS one.
const COUPLE_ACTION={
  Fav:["Do the fun thing today, not just the responsible one.",
       "Say the appreciative thing out loud instead of just feeling it.",
       "Make the plan while the energy is easy, not just when you need to.",
       "Bank a good memory now, it costs less effort than it will later."],
  Challenge:["Match effort, don't let one of you carry it alone.",
             "Give each other more patience than usual right now.",
             "Lower the stakes on anything that can wait.",
             "Say what's actually hard instead of just pushing through it quietly."],
  Mixed:["Name the different pace out loud instead of quietly noticing it.",
         "Let whoever's having the easier time carry a little more of the load.",
         "Check in on whoever's having the harder time before assuming they're fine.",
         "Don't compare notes to keep score, just to understand each other better."]
};
// The classical natural-friendship relation (ephemeris.js) between whichever planet is actually
// driving each partner's individual reading - the one place this couple layer genuinely looks at
// how the two charts interact, rather than just reporting them side by side.
const COUPLE_RULER_LINE={
  friend:["{rulerA} (driving it for {A}) and {rulerB} (driving it for {B}) are natural friends in classical terms, which tends to make this easier to move through side by side.",
          "Classically, {rulerA} and {rulerB} get along, {A}'s and {B}'s underlying planets are working with each other here, not against."],
  enemy:["{rulerA} (driving it for {A}) and {rulerB} (driving it for {B}) are classical natural enemies, so a little more patience than usual goes a long way here.",
         "{rulerA} and {rulerB} don't naturally get along in classical terms, worth being a bit more deliberate with each other than usual right now."],
  neutral:["{rulerA} and {rulerB}, the planets actually driving this for each of you, are neutral toward each other classically, neither helping nor working against you here.",
           "There's no strong pull either way between {rulerA} and {rulerB} here, so how this goes is really up to the two of you, not the planets."],
  self:["{rulerA} is quietly running both sides of this, {A}'s and {B}'s, from behind the scenes, so you're more in sync here than it might look.",
        "You're both being shaped by the same planet right now, {rulerA}, even if it's showing up differently on the surface."]
};
function coupleValenceKind(valenceA,valenceB){
  if(valenceA==='positive'&&valenceB==='positive')return'Fav';
  if(valenceA==='challenging'&&valenceB==='challenging')return'Challenge';
  return'Mixed';
}
function fillNames(str,nameA,nameB,themeA,themeB){
  return str.replace(/\{A\}/g,nameA).replace(/\{B\}/g,nameB).replace(/\{themeA\}/g,themeA).replace(/\{themeB\}/g,themeB);
}
function coupleUpdateFrom(a,b,nameA,nameB,seed){
  const kind=coupleValenceKind(a.valence,b.valence);
  const bucket=(a.theme===b.theme?'same':'diff')+kind;
  let text=fillNames(pickVariant(COUPLE_OPENING[bucket],seed),nameA,nameB,a.theme,b.theme);
  const rel=a.ruler===b.ruler?'self':naturalRelation(a.ruler,b.ruler);
  const rulerLine=pickVariant(COUPLE_RULER_LINE[rel]||COUPLE_RULER_LINE.neutral,seed+3)
    .replace(/\{rulerA\}/g,a.ruler).replace(/\{rulerB\}/g,b.ruler).replace(/\{A\}/g,nameA).replace(/\{B\}/g,nameB);
  text+=' '+rulerLine;
  const action=pickVariant(COUPLE_ACTION[kind],seed+5);
  const valence=kind==='Fav'?'positive':kind==='Challenge'?'challenging':'neutral';
  return{text,action,theme:a.theme===b.theme?a.theme:null,themeA:a.theme,themeB:b.theme,valence};
}

function calcCoupleDailyUpdate(chartDataA,chartDataB,refDate){
  refDate=refDate||new Date();
  const nameA=chartDataA.name||'Partner A',nameB=chartDataB.name||'Partner B';
  const a=calcDailyUpdate(chartDataA,refDate),b=calcDailyUpdate(chartDataB,refDate);
  return coupleUpdateFrom(a,b,nameA,nameB,dayOfYear(refDate));
}
function calcCoupleMonthlyUpdate(chartDataA,chartDataB,refDate){
  refDate=refDate||new Date();
  const nameA=chartDataA.name||'Partner A',nameB=chartDataB.name||'Partner B';
  const a=calcMonthlyUpdate(chartDataA,refDate),b=calcMonthlyUpdate(chartDataB,refDate);
  return coupleUpdateFrom(a,b,nameA,nameB,monthCounter(refDate));
}
function calcCoupleYearlyUpdate(chartDataA,chartDataB,refDate){
  refDate=refDate||new Date();
  const nameA=chartDataA.name||'Partner A',nameB=chartDataB.name||'Partner B';
  const a=calcYearlyUpdate(chartDataA,refDate),b=calcYearlyUpdate(chartDataB,refDate);
  if(!a||!b)return null;
  return coupleUpdateFrom(a,b,nameA,nameB,refDate.getFullYear());
}
