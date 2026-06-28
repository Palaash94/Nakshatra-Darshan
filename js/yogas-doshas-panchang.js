/* ============================================================
   KARAKAS, YOGAS & DOSHAS ENGINE, PANCHANG & NAKSHATRA-KOOTA
   Jaimini Chara Karaka ranking, the full classical Yoga/Dosha
   detection engine (Panch Mahapurusha, Gajakesari, Raja Yoga,
   Mangal/Kaal Sarp/Kemadruma Dosha, etc.), Panchang calculation
   (Tithi/Nitya Yoga/Karana/Vara), Nakshatra Koota (Gana/Yoni/Nadi/
   Varna/Tatva), and the personality snapshot generator.
   ============================================================ */
const KARAKA_NAMES=['Atmakaraka','Amatyakaraka','Bhratrukaraka','Matrukaraka','Putrakaraka','Gnatikaraka','Darakaraka'];
const KARAKA_SHORT=['AK','AmK','BK','MK','PK','GK','DK'];
const KARAKA_SIGNIFIES=[
  'Soul, self, life purpose — the core karmic lesson this lifetime is built around.',
  'Career, profession, intellect, and the means by which you pursue your soul\'s purpose in the world.',
  'Siblings, courage, communication, and short journeys or efforts.',
  'Mother, home, emotional nourishment, and property.',
  'Children, creativity, intelligence, and past-life merit (Purva Punya).',
  'Obstacles, rivals, disease, and the friction that forces growth.',
  'Spouse, marriage, and committed partnership — what you seek in, and learn through, relationships.'
];
const KARAKA_INFO={
  Atmakaraka:'Atmakaraka literally means "significator of the soul." In Jaimini astrology, it is the planet with the highest degree within its sign (among the 7 classical planets, excluding Rahu/Ketu). It represents your soul\'s deepest desire, primary life purpose, and the core karmic lesson you are here to learn — the theme that keeps recurring across this lifetime until it is understood. The sign and house this planet occupies, along with where it lands in the Navamsa (D9) chart — called the Karakamsha — are considered the strongest indicators of dharmic life direction in Jaimini astrology.',
  Amatyakaraka:'Amatyakaraka means "significator of the minister" — the second-highest degree planet. Where the Atmakaraka shows what the soul wants, the Amatyakaraka shows the vehicle that carries it into the world: career path, profession, intellect, and practical strategy. It often becomes especially relevant when analysing career-related questions.',
  Bhratrukaraka:'Bhratrukaraka is the significator of siblings, courage, and initiative. Third in the degree ranking, it relates to co-born relationships, communication style, and short bursts of effort or short journeys.',
  Matrukaraka:'Matrukaraka is the significator of the mother and emotional nourishment. Fourth in the degree ranking, it relates to home, property, emotional security, and the capacity for receptivity and care.',
  Putrakaraka:'Putrakaraka is the significator of children and creativity. Fifth in the degree ranking, it covers offspring, creative or intellectual output, and past-life spiritual merit (Purva Punya) that ripens in this life.',
  Gnatikaraka:'Gnatikaraka is the significator of obstacles, rivals, and disease. Sixth in the degree ranking, it points to the recurring friction, conflicts, or health matters that — handled consciously — become a source of growth and resilience.',
  Darakaraka:'Darakaraka means "significator of the spouse" — the planet with the lowest degree within its sign. It reveals the nature of your life partner, what you unconsciously seek in committed relationships, and what those relationships are here to teach you about yourself.'
};

// Core nature/theme of each planet, used to generate planet-specific Karaka summaries
const PLANET_NATURE={
  Sun:'authority, identity, vitality, and the drive to lead or be recognised',
  Moon:'emotion, instinct, nurturing, and the need for psychological security',
  Mars:'action, courage, drive, and the willingness to fight for what matters',
  Mercury:'intellect, communication, analysis, and adaptability',
  Jupiter:'wisdom, expansion, faith, and the search for meaning',
  Venus:'love, beauty, harmony, and the pursuit of pleasure and connection',
  Saturn:'discipline, patience, responsibility, and lessons learned through restriction or delay'
};

// Generates a planet-specific narrative for a given Karaka role, blending the planet's nature with the karaka's domain
function karakaPlanetSummary(planet,karaka){
  const nature=PLANET_NATURE[planet];
  const templates={
    Atmakaraka:`With ${planet} as your Atmakaraka, your soul\'s core lesson this lifetime is expressed through ${nature}. Whatever ${planet} touches in this chart is likely to feel less like an ordinary life area and more like a recurring, almost unavoidable theme you are here to master.`,
    Amatyakaraka:`With ${planet} as your Amatyakaraka, the practical vehicle for your life\'s purpose runs through ${nature}. Career and strategic decisions tend to work best when they lean into this rather than against it.`,
    Bhratrukaraka:`With ${planet} as your Bhratrukaraka, your relationship with siblings and your sense of personal courage are coloured by ${nature}. Short efforts and initiatives succeed when they draw on this quality.`,
    Matrukaraka:`With ${planet} as your Matrukaraka, your bond with your mother and your sense of emotional home are shaped by ${nature}. What nourishes you is closely tied to this energy.`,
    Putrakaraka:`With ${planet} as your Putrakaraka, your creativity, relationship with children, and the past-life merit ripening now all carry the signature of ${nature}.`,
    Gnatikaraka:`With ${planet} as your Gnatikaraka, the obstacles and rivalries you repeatedly encounter tend to involve ${nature} — and learning to work consciously with this quality, rather than against it, is often the way through.`,
    Darakaraka:`With ${planet} as your Darakaraka, you are drawn to a partner who embodies ${nature} — and committed relationships become a mirror that teaches you about this very quality in yourself.`
  };
  return templates[karaka]||'';
}

function calcCharaKarakas(planetData){
  const sevenPlanets=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn'];
  const ranked=sevenPlanets.map(p=>({planet:p,deg:planetData[p].deg})).sort((a,b)=>b.deg-a.deg);
  return ranked.map((r,i)=>({...r,karaka:KARAKA_NAMES[i],short:KARAKA_SHORT[i],signifies:KARAKA_SIGNIFIES[i]}));
}

// =====================================================================
// YOGAS & DOSHAS ENGINE
// Detects classical BPHS-sourced planetary combinations from chartData.
// Each detector returns null (not present) or a result object with:
//   { name, category, strength (0-100), strengthLabel, formation, signifies, planetsInvolved }
// =====================================================================

const KENDRA_HOUSES=[1,4,7,10];
const TRIKONA_HOUSES=[1,5,9];
const DUSTHANA_HOUSES=[6,8,12];

function houseOf(planet,planetData){return planetData[planet].house}
function signOf(planet,planetData){return planetData[planet].sign}
function houseDistance(h1,h2){ // returns the kendra-counted distance (1-12) from h1 to h2
  return((h2-h1+12)%12)+1;
}
function isKendraFrom(h1,h2){
  const d=houseDistance(h1,h2);
  return d===1||d===4||d===7||d===10;
}
function planetsConjunct(p1,p2,planetData){return houseOf(p1,planetData)===houseOf(p2,planetData)}
function houseLordOf(houseNum,lagnaSign){
  const signIdx=(lagnaSign+houseNum-1)%12;
  return SIGN_LORD[signIdx];
}
function isBenefic(planet){return['Jupiter','Venus','Mercury','Moon'].includes(planet)}

// Combustion check (Asta): a planet too close to the Sun is classically held to have its independent
// strength overwhelmed. Orbs match Phaladeepika/BPHS as commonly cited (Moon 12, Mars 17, Mercury 14,
// Jupiter 11, Venus 10, Saturn 15 degrees) - the same table used by the Avastha (Deeptadi/Kopa) module.
// Note: this uses the standard (non-retrograde) orb throughout as a deliberate simplification, since
// retrograde status isn't threaded into this module; retrograde Mercury/Venus combust at a slightly
// tighter orb in some classical sources, so this errs very slightly generous in borderline cases.
const COMBUSTION_ORBS={Moon:12,Mars:17,Mercury:14,Jupiter:11,Venus:10,Saturn:15};
function isCombust(planet,planetData){
  if(planet==='Sun'||planet==='Rahu'||planet==='Ketu')return false; // Sun can't combust itself; nodes are shadow points, exempt classically
  const orb=COMBUSTION_ORBS[planet];
  if(!orb)return false;
  let elong=Math.abs(norm360(planetData[planet].lon-planetData.Sun.lon));
  if(elong>180)elong=360-elong;
  return elong<orb;
}

// ---- helper: is a planet "strong" here (own/exalted/moolatrikona, or in kendra/trikona, decent dignity) ----
function dignityScore(planet,planetData){
  const d=planetData[planet];
  const dig=getDignity(planet,d.sign,d.deg);
  if(dig==='exalted')return 100;
  if(dig==='moolatrikona')return 90;
  if(dig==='own')return 80;
  if(dig==='debilitated')return 20;
  return 55;
}

// ---------------- PANCH MAHAPURUSHA YOGAS ----------------
// Formed when Mars/Mercury/Jupiter/Venus/Saturn is in its own sign or exalted, AND posited in a Kendra house (1,4,7,10)
const MAHAPURUSHA_DEFS=[
  {planet:'Mars',name:'Ruchaka Yoga',signifies:'Courage, physical strength, leadership, a commanding and competitive presence, and success through bold action.'},
  {planet:'Mercury',name:'Bhadra Yoga',signifies:'Sharp intellect, eloquence, business acumen, and success through communication, analysis, or trade.'},
  {planet:'Jupiter',name:'Hamsa Yoga',signifies:'Wisdom, moral authority, grace, and a life respected for knowledge, ethics, and teaching others.'},
  {planet:'Venus',name:'Malavya Yoga',signifies:'Charm, artistic refinement, comfort, beauty, and lasting prosperity through pleasant, harmonious means.'},
  {planet:'Saturn',name:'Sasa Yoga',signifies:'Discipline, organisational power, authority over masses, and success built slowly through patience and structure.'}
];
function detectMahapurushaYogas(planetData,lagnaSign){
  const results=[];
  MAHAPURUSHA_DEFS.forEach(def=>{
    const d=planetData[def.planet];
    const dig=getDignity(def.planet,d.sign,d.deg);
    const inKendra=KENDRA_HOUSES.includes(d.house);
    if(inKendra&&(dig==='own'||dig==='exalted'||dig==='moolatrikona')){
      let strength=dig==='exalted'?92:dig==='moolatrikona'?85:78;
      const combust=isCombust(def.planet,planetData);
      if(combust)strength-=22;
      results.push({
        name:def.name,category:'yoga',
        strength,strengthLabel:strength>=85?'Very strong':strength>=60?'Strong':'Weakened by combustion',
        formation:`${def.planet} is ${dig==='exalted'?'exalted':dig==='moolatrikona'?'in its Moolatrikona':'in its own sign'} (${SIGNS[d.sign]}) while posited in House ${d.house}, a Kendra (angular house). This is one of the five classical Panch Mahapurusha Yogas, formed only when one of these five planets is both dignified and angular.${combust?` However, ${def.planet} is also combust here (too close to the Sun), which classical texts say significantly mutes a yoga even when the underlying placement is technically present.`:''}`,
        signifies:def.signifies,
        planetsInvolved:[def.planet]
      });
    }
  });
  return results;
}

// ---------------- GAJAKESARI YOGA ----------------
// Moon and Jupiter in mutual Kendra (1st/4th/7th/10th from each other)
function detectGajakesari(planetData){
  const moonHouse=houseOf('Moon',planetData),jupHouse=houseOf('Jupiter',planetData);
  if(isKendraFrom(moonHouse,jupHouse)){
    const moonD=planetData.Moon,jupD=planetData.Jupiter;
    const moonDig=getDignity('Moon',moonD.sign,moonD.deg),jupDig=getDignity('Jupiter',jupD.sign,jupD.deg);
    const jupCombust=isCombust('Jupiter',planetData);
    const maleficsOnJup=getAspectsOnHouseGeneric(jupHouse,planetData).filter(p=>['Saturn','Mars','Rahu','Ketu'].includes(p));
    const jupHasMaleficCompany=(houseMatesOf('Jupiter',planetData)).some(p=>['Saturn','Mars','Rahu','Ketu'].includes(p));

    let strength=70;
    if(jupDig==='exalted'||jupDig==='own')strength+=15;
    if(moonDig==='exalted'||moonDig==='own')strength+=10;
    if(moonDig==='debilitated'||jupDig==='debilitated')strength-=28;
    if(jupCombust)strength-=22;
    if(maleficsOnJup.length||jupHasMaleficCompany)strength-=12;
    strength=Math.max(15,Math.min(95,strength));

    const caveats=[];
    if(jupDig==='debilitated')caveats.push('Jupiter is debilitated here, which classical sources describe as turning this into a "paper yoga" — technically present but largely unable to deliver its promise unless Neechabhanga (debilitation cancellation) conditions also apply');
    if(jupCombust)caveats.push('Jupiter is also combust (too close to the Sun), which significantly mutes its independent strength');
    if(maleficsOnJup.length)caveats.push(`Jupiter is aspected by ${maleficsOnJup.join(' and ')}, a classical weakening factor`);
    if(jupHasMaleficCompany&&!maleficsOnJup.length)caveats.push('Jupiter shares its house with a malefic planet, which classical texts hold constrains its results');

    return{
      name:'Gajakesari Yoga',category:'yoga',
      strength,strengthLabel:strength>=75?'Strong':strength>=50?'Moderate':strength>=30?'Mild':'Present but heavily weakened',
      formation:`Jupiter (House ${jupHouse}) stands in a Kendra position relative to the Moon (House ${moonHouse}) — the two are angular to one another. This is the classical condition for Gajakesari Yoga, named for the elephant (Gaja) and lion (Kesari): two powerful, fearless creatures.${caveats.length?' However: '+caveats.join('; ')+'.':' Jupiter carries reasonable dignity here with no major affliction, allowing the yoga to express closer to its classical promise.'}`,
      signifies:'Intelligence, eloquence, a respected reputation, good fortune, and the ability to overcome obstacles with composure. Natives often gain recognition through wisdom or public standing. Results are strongest during the Dasha or Antardasha of Jupiter or the Moon, and — as with all yogas — the chart-wide context (the planets\' overall dignity, aspects, and the active Dasha) determines how visibly this manifests in life.',
      planetsInvolved:['Moon','Jupiter']
    };
  }
  return null;
}
function houseMatesOf(planet,planetData){
  const house=houseOf(planet,planetData);
  return PLANETS.filter(p=>p!==planet&&houseOf(p,planetData)===house);
}

// ---------------- BUDHADITYA YOGA ----------------
// Sun-Mercury conjunction. Classical sources are emphatic that combustion is the deciding factor here:
// Mercury is never more than 28 degrees from the Sun, so this conjunction is common (~1/3 of charts),
// but most of those have Mercury within its 14-degree combustion orb, muting the yoga's promise.
function detectBudhaditya(planetData){
  if(planetsConjunct('Sun','Mercury',planetData)){
    const sunD=planetData.Sun,merD=planetData.Mercury;
    let closeOrb=Math.abs(norm360(sunD.lon-merD.lon));
    if(closeOrb>180)closeOrb=360-closeOrb;
    const merCombust=isCombust('Mercury',planetData);
    const merDig=getDignity('Mercury',merD.sign,merD.deg);
    const maleficsPresent=houseMatesOf('Sun',planetData).some(p=>['Saturn','Rahu','Ketu'].includes(p));

    let strength=58;
    if(merDig==='own'||merDig==='exalted'||merDig==='moolatrikona')strength+=18;
    if(merDig==='debilitated')strength-=20;
    if(merCombust)strength-=26;
    if(KENDRA_HOUSES.includes(houseOf('Sun',planetData))||TRIKONA_HOUSES.includes(houseOf('Sun',planetData)))strength+=8;
    if(maleficsPresent)strength-=8;
    strength=Math.max(15,Math.min(88,strength));

    const caveats=[];
    if(merCombust)caveats.push(`Mercury is combust at this distance (within its classical 14° orb), which most sources treat as the single deciding factor for this yoga — combust Budhaditya is often described as a "paper yoga" whose intellectual promise rarely manifests at full strength`);
    if(merDig==='debilitated')caveats.push('Mercury is debilitated here, further constraining the yoga');
    if(maleficsPresent)caveats.push('a malefic shares the house, which classical texts say can divert this combination toward Pitra Dosha-like themes rather than its usual benefic promise');

    return{
      name:'Budhaditya Yoga',category:'yoga',
      strength,strengthLabel:strength>=70?'Strong':strength>=45?'Moderate':merCombust?'Present but largely suppressed (combust)':'Mild',
      formation:`Sun and Mercury are conjunct in House ${houseOf('Sun',planetData)} (${SIGNS[sunD.sign]}), separated by roughly ${closeOrb.toFixed(1)}°. Since Mercury never strays more than 28° from the Sun, this conjunction itself is fairly common — what determines whether it functions as a genuine yoga is almost entirely whether Mercury falls within its combustion orb.${caveats.length?' Here: '+caveats.join('; ')+'.':' Mercury is clear of combustion at this distance, giving the yoga room to express its classical promise.'}`,
      signifies:'Sharp analytical intelligence, strong communication skills, and an aptitude for administration, strategy, or scholarship when the yoga is genuinely active. Especially favourable for academic, analytical, or public-facing careers, with results concentrated in Sun or Mercury Dasha/Antardasha periods.',
      planetsInvolved:['Sun','Mercury']
    };
  }
  return null;
}

// ---------------- CHANDRA-MANGAL YOGA ----------------
function detectChandraMangal(planetData){
  if(planetsConjunct('Moon','Mars',planetData)){
    return{
      name:'Chandra-Mangal Yoga',category:'yoga',
      strength:60,strengthLabel:'Moderate',
      formation:`Moon and Mars are conjunct in House ${houseOf('Moon',planetData)} (${SIGNS[planetData.Moon.sign]}), combining the mind's instinctive nature with raw drive and assertiveness.`,
      signifies:'Entrepreneurial drive, business acumen, and a strong instinct for acquiring wealth or property. Can also indicate a restless, emotionally intense temperament if afflicted.',
      planetsInvolved:['Moon','Mars']
    };
  }
  return null;
}

// ---------------- LAKSHMI YOGA ----------------
// Lagna lord is strong (own/exalted) AND the 9th lord (Bhagya) is well placed in a Kendra/Trikona, with Venus also dignified
function detectLakshmiYoga(planetData,lagnaSign,houseMap){
  const lagnaLord=SIGN_LORD[lagnaSign];
  const ninthLord=houseLordOf(9,lagnaSign);
  if(!planetData[lagnaLord]||!planetData[ninthLord])return null;
  const lagnaLordD=planetData[lagnaLord],ninthLordD=planetData[ninthLord];
  const lagnaLordDig=getDignity(lagnaLord,lagnaLordD.sign,lagnaLordD.deg);
  const ninthLordDig=getDignity(ninthLord,ninthLordD.sign,ninthLordD.deg);
  const lagnaLordStrong=lagnaLordDig==='own'||lagnaLordDig==='exalted'||lagnaLordDig==='moolatrikona'||KENDRA_HOUSES.includes(lagnaLordD.house);
  const ninthLordStrong=(ninthLordDig==='own'||ninthLordDig==='exalted'||ninthLordDig==='moolatrikona')&&(KENDRA_HOUSES.includes(ninthLordD.house)||TRIKONA_HOUSES.includes(ninthLordD.house));
  if(lagnaLordStrong&&ninthLordStrong){
    const venusD=planetData.Venus;
    const venusDig=getDignity('Venus',venusD.sign,venusD.deg);
    let strength=65;
    if(venusDig==='own'||venusDig==='exalted')strength+=15;
    if(ninthLordDig==='exalted')strength+=10;
    strength=Math.min(92,strength);
    return{
      name:'Lakshmi Yoga',category:'yoga',
      strength,strengthLabel:strength>=80?'Very strong':'Strong',
      formation:`The Lagna lord ${lagnaLord} is well placed (${lagnaLordDig||'angular'}), and the 9th house (Bhagya/fortune) lord ${ninthLord} is dignified (${ninthLordDig}) while sitting in a Kendra or Trikona house. Venus is ${venusDig||'reasonably placed'} as well, completing the classical picture for Lakshmi Yoga.`,
      signifies:'Wealth, grace, good fortune, and a magnetic, prosperous quality to one\'s life. Often indicates financial comfort, a pleasant disposition, and being favoured by circumstance.',
      planetsInvolved:[lagnaLord,ninthLord,'Venus'].filter((v,i,a)=>a.indexOf(v)===i)
    };
  }
  return null;
}

// ---------------- SARASWATI YOGA ----------------
// Jupiter, Venus, Mercury all in Kendra or Trikona (or conjunct/mutually well placed), with at least 2 of them dignified
function detectSaraswatiYoga(planetData){
  const houses=['Jupiter','Venus','Mercury'].map(p=>planetData[p].house);
  const allWellPlaced=houses.every(h=>KENDRA_HOUSES.includes(h)||TRIKONA_HOUSES.includes(h));
  if(allWellPlaced){
    const digs=['Jupiter','Venus','Mercury'].map(p=>{const d=planetData[p];return getDignity(p,d.sign,d.deg)});
    const dignifiedCount=digs.filter(d=>d==='own'||d==='exalted'||d==='moolatrikona').length;
    if(dignifiedCount>=1){
      let strength=60+dignifiedCount*12;
      strength=Math.min(90,strength);
      return{
        name:'Saraswati Yoga',category:'yoga',
        strength,strengthLabel:strength>=80?'Strong':'Moderate',
        formation:`Jupiter (House ${houseOf('Jupiter',planetData)}), Venus (House ${houseOf('Venus',planetData)}), and Mercury (House ${houseOf('Mercury',planetData)}) are all placed in Kendra or Trikona houses, with ${dignifiedCount} of the three in good dignity — the classical signature of Saraswati Yoga.`,
        signifies:'Deep learning, eloquence, artistic or scholarly talent, and a life touched by knowledge and creative or intellectual accomplishment. Often favours writers, teachers, artists, and scholars.',
        planetsInvolved:['Jupiter','Venus','Mercury']
      };
    }
  }
  return null;
}

// ---------------- RAJA YOGA (Kendra-Trikona lord connection) ----------------
// Classical: when a Kendra-house lord and a Trikona-house lord conjoin, mutually aspect, or exchange signs (parivartana)
function detectRajaYogas(planetData,lagnaSign){
  const results=[];
  const kendraLords=new Set(KENDRA_HOUSES.map(h=>houseLordOf(h,lagnaSign)));
  const trikonaLords=new Set(TRIKONA_HOUSES.map(h=>houseLordOf(h,lagnaSign)));
  const seen=new Set();
  kendraLords.forEach(kl=>{
    trikonaLords.forEach(tl=>{
      if(kl===tl)return; // same planet ruling both — not a 2-planet combination
      if(!planetData[kl]||!planetData[tl])return;
      const key=[kl,tl].sort().join('-');
      if(seen.has(key))return;
      // Conjunction
      if(planetsConjunct(kl,tl,planetData)){
        seen.add(key);
        results.push({
          name:`Raja Yoga (${kl}\u2013${tl})`,category:'yoga',
          strength:75,strengthLabel:'Strong',
          formation:`${kl} (lord of a Kendra house) and ${tl} (lord of a Trikona house) are conjunct in House ${houseOf(kl,planetData)} (${SIGNS[planetData[kl].sign]}). The union of an angular-house lord and a trinal-house lord is the classical formula for Raja Yoga — a combination for power, status, and rising fortune.`,
          signifies:'Authority, success, rise in status, and the capacity to convert effort into recognised achievement — particularly active during the Dashas of these two planets.',
          planetsInvolved:[kl,tl]
        });
      }
      // Sign exchange (Parivartana) — kl sits in tl's sign and vice versa
      else{
        const klSign=signOf(kl,planetData),tlSign=signOf(tl,planetData);
        if(SIGN_LORD[klSign]===tl&&SIGN_LORD[tlSign]===kl){
          seen.add(key);
          results.push({
            name:`Raja Yoga (${kl}\u2013${tl} exchange)`,category:'yoga',
            strength:80,strengthLabel:'Strong',
            formation:`${kl} sits in a sign ruled by ${tl}, while ${tl} sits in a sign ruled by ${kl} — a mutual sign exchange (Parivartana Yoga) between a Kendra lord and a Trikona lord, considered one of the most powerful Raja Yoga formations.`,
            signifies:'A significant rise in status and fortune, often involving both effort and circumstance working together. The houses these two planets rule both become activated and mutually supportive.',
            planetsInvolved:[kl,tl]
          });
        }
      }
    });
  });
  return results;
}

// ---------------- DHANA YOGA (wealth combinations) ----------------
// Simplified: 2nd lord, 11th lord, and/or 5th & 9th lords (Lakshmi-sthana) conjunct, exchanged, or mutually aspecting
function detectDhanaYoga(planetData,lagnaSign){
  const results=[];
  const l2=houseLordOf(2,lagnaSign),l11=houseLordOf(11,lagnaSign);
  if(l2!==l11&&planetData[l2]&&planetData[l11]){
    if(planetsConjunct(l2,l11,planetData)){
      results.push({
        name:'Dhana Yoga (2nd\u201311th)',category:'yoga',
        strength:68,strengthLabel:'Moderate',
        formation:`The 2nd house lord (${l2}, wealth accumulated) and 11th house lord (${l11}, gains and income) are conjunct in House ${houseOf(l2,planetData)}. A direct link between these two wealth-related houses is a classical Dhana (wealth) Yoga.`,
        signifies:'Steady accumulation of wealth, multiple income streams, and financial gains over the life — particularly active during the Dashas of these planets.',
        planetsInvolved:[l2,l11]
      });
    }else{
      const l2Sign=signOf(l2,planetData),l11Sign=signOf(l11,planetData);
      if(SIGN_LORD[l2Sign]===l11&&SIGN_LORD[l11Sign]===l2){
        results.push({
          name:'Dhana Yoga (2nd\u201311th exchange)',category:'yoga',
          strength:72,strengthLabel:'Moderate',
          formation:`The 2nd lord (${l2}) and 11th lord (${l11}) occupy each other's signs — a Parivartana (exchange) directly linking accumulated wealth with the house of gains.`,
          signifies:'A strong, often unexpected capacity to convert resources and effort into financial gain, with wealth themes recurring favourably across the life.',
          planetsInvolved:[l2,l11]
        });
      }
    }
  }
  return results;
}

// ---------------- NEECHABHANGA RAJA YOGA (debilitation cancellation) ----------------
function detectNeechabhanga(planetData,lagnaSign){
  const results=[];
  PLANETS.forEach(p=>{
    if(p==='Rahu'||p==='Ketu')return;
    const d=planetData[p];
    const dig=getDignity(p,d.sign,d.deg);
    if(dig!=='debilitated')return;
    // Lord of the sign the debilitated planet sits in
    const signLord=SIGN_LORD[d.sign];
    const conditions=[];
    // Condition 1: dispositor (sign lord) is in a Kendra from Lagna or Moon
    if(planetData[signLord]){
      const lordHouse=planetData[signLord].house;
      if(KENDRA_HOUSES.includes(lordHouse))conditions.push(`the dispositor ${signLord} is itself angular (House ${lordHouse})`);
    }
    // Condition 2: planet that would be exalted in this sign is placed in Kendra from Lagna/Moon (simplified: check exaltation lord)
    const exaltedHereEntry=Object.entries(EXALTATION).find(([pl,ex])=>ex.sign===d.sign);
    if(exaltedHereEntry){
      const[exPlanet]=exaltedHereEntry;
      if(planetData[exPlanet]&&KENDRA_HOUSES.includes(planetData[exPlanet].house)&&exPlanet!==p){
        conditions.push(`${exPlanet} (which would be exalted in this very sign) is posited in a Kendra house (House ${planetData[exPlanet].house}), strengthening the cancellation`);
      }
    }
    // Condition 3: Moon-from-Lagna kendra placement of the debilitated planet itself
    if(KENDRA_HOUSES.includes(d.house))conditions.push(`${p} itself occupies a Kendra house (House ${d.house}) from the Ascendant, which helps offset the debility`);
    if(conditions.length>0){
      results.push({
        name:`Neechabhanga Raja Yoga (${p})`,category:'yoga',
        strength:55+conditions.length*10,strengthLabel:conditions.length>=2?'Moderate':'Mild',
        formation:`${p} is debilitated in ${SIGNS[d.sign]}, but the debilitation shows signs of cancellation: ${conditions.join('; ')}. When cancellation conditions are met, classical texts say the planet can give results far better than an ordinary placement — sometimes Raja Yoga-like results — though they often arrive later in life or after some struggle.`,
        signifies:'A "fall before the rise" pattern — initial struggle, delay, or self-doubt connected to this planet\'s themes, followed by an unexpected strengthening and turnaround, often surprising compared to early appearances.',
        planetsInvolved:[p]
      });
    }
  });
  return results;
}

// ---------------- VESI / VASI / OBHAYACHARI YOGA (planets around Sun) ----------------
function detectSunAdjacentYogas(planetData){
  const results=[];
  const sunHouse=houseOf('Sun',planetData);
  const secondHouse=((sunHouse)%12)+1;
  const twelfthHouse=((sunHouse-2+12)%12)+1;
  const benefics=['Jupiter','Venus','Mercury'];
  const inSecond=benefics.filter(p=>houseOf(p,planetData)===secondHouse&&!planetsConjunct(p,'Sun',planetData));
  const inTwelfth=benefics.filter(p=>houseOf(p,planetData)===twelfthHouse);
  if(inSecond.length&&inTwelfth.length){
    results.push({
      name:'Obhayachari Yoga',category:'yoga',strength:62,strengthLabel:'Moderate',
      formation:`Benefic planet(s) (${inSecond.join(', ')}) occupy the house right after the Sun, while benefic(s) (${inTwelfth.join(', ')}) occupy the house right before it — the Sun is flanked on both sides by benefics.`,
      signifies:'A well-rounded, supported personality with both eloquence and practical resourcefulness; the native tends to be liked and finds help arriving from multiple directions.',
      planetsInvolved:['Sun',...inSecond,...inTwelfth]
    });
  }else if(inSecond.length){
    results.push({
      name:'Vesi Yoga',category:'yoga',strength:55,strengthLabel:'Mild',
      formation:`Benefic planet(s) (${inSecond.join(', ')}) occupy the house immediately following the Sun's house.`,
      signifies:'A capable, articulate disposition with a tendency toward fair and balanced conduct.',
      planetsInvolved:['Sun',...inSecond]
    });
  }else if(inTwelfth.length){
    results.push({
      name:'Vasi Yoga',category:'yoga',strength:55,strengthLabel:'Mild',
      formation:`Benefic planet(s) (${inTwelfth.join(', ')}) occupy the house immediately preceding the Sun's house.`,
      signifies:'A resourceful, prudent nature with a good capacity for saving and steady accumulation.',
      planetsInvolved:['Sun',...inTwelfth]
    });
  }
  return results;
}

function detectAllYogas(planetData,lagnaSign,houseMap){
  let all=[];
  all=all.concat(detectMahapurushaYogas(planetData,lagnaSign));
  const gk=detectGajakesari(planetData);if(gk)all.push(gk);
  const ba=detectBudhaditya(planetData);if(ba)all.push(ba);
  const cm=detectChandraMangal(planetData);if(cm)all.push(cm);
  const lk=detectLakshmiYoga(planetData,lagnaSign,houseMap);if(lk)all.push(lk);
  const sw=detectSaraswatiYoga(planetData);if(sw)all.push(sw);
  all=all.concat(detectRajaYogas(planetData,lagnaSign));
  all=all.concat(detectDhanaYoga(planetData,lagnaSign));
  all=all.concat(detectNeechabhanga(planetData,lagnaSign));
  all=all.concat(detectSunAdjacentYogas(planetData));
  return all.sort((a,b)=>b.strength-a.strength);
}

// =====================================================================
// DOSHAS
// =====================================================================

// ---------------- MANGAL (KUJA) DOSHA ----------------
// Mars in houses 1,2,4,7,8,12 from the Lagna (some schools also check from Moon and Venus)
const MANGAL_DOSHA_HOUSES=[1,2,4,7,8,12];
function detectMangalDosha(planetData,lagnaSign){
  const marsHouseFromLagna=houseOf('Mars',planetData);
  const moonHouse=houseOf('Moon',planetData);
  const venusHouse=houseOf('Venus',planetData);
  const marsHouseFromMoon=houseDistance(moonHouse,marsHouseFromLagna);
  const marsHouseFromVenus=houseDistance(venusHouse,marsHouseFromLagna);
  const fromLagna=MANGAL_DOSHA_HOUSES.includes(marsHouseFromLagna);
  const fromMoon=MANGAL_DOSHA_HOUSES.includes(marsHouseFromMoon);
  const fromVenus=MANGAL_DOSHA_HOUSES.includes(marsHouseFromVenus);
  if(!fromLagna&&!fromMoon&&!fromVenus)return null;

  const marsD=planetData.Mars;
  const marsDig=getDignity('Mars',marsD.sign,marsD.deg);
  const cancellations=[];

  // 1. Mars in own sign (Aries/Scorpio), exaltation (Capricorn), or debilitation (Cancer) - a planet
  // that is either fully dignified or too weak to assert itself is classically held not to cause the dosha.
  if(marsDig==='own'||marsDig==='exalted')cancellations.push(`Mars is in ${marsDig==='own'?'its own sign':'exaltation'} (${SIGNS[marsD.sign]}), expressing its disciplined rather than disruptive nature`);
  else if(marsDig==='debilitated')cancellations.push(`Mars is debilitated (${SIGNS[marsD.sign]}), too weak here to assert the aggressive influence the dosha depends on`);

  // 2. Yogakaraka exception: for Cancer and Leo ascendants, Mars rules both a Kendra and a Trikona house,
  // making it a functional benefic for that chart - classical texts hold the dosha does not apply here.
  if(lagnaSign===3||lagnaSign===4){ // Cancer=3, Leo=4 (0-indexed)
    const marsRulesKendra=KENDRA_HOUSES.some(h=>houseLordOf(h,lagnaSign)==='Mars');
    const marsRulesTrikona=TRIKONA_HOUSES.some(h=>houseLordOf(h,lagnaSign)==='Mars');
    if(marsRulesKendra&&marsRulesTrikona)cancellations.push(`for ${SIGNS[lagnaSign]} Ascendant, Mars rules both a Kendra and a Trikona house (Yogakaraka), making it a functional benefic for this chart rather than a source of affliction`);
  }

  // 3. Jupiter's conjunction or aspect on Mars - the classical "great benefic tempers the warrior" rule.
  const jupAspectsMars=getAspectsOnHouseGeneric(marsHouseFromLagna,planetData).includes('Jupiter');
  if(jupAspectsMars||planetsConjunct('Mars','Jupiter',planetData))cancellations.push('Jupiter conjoins or aspects Mars, classically said to temper its aggressive tendencies with wisdom and restraint');

  // 4. Mars in the 12th house is the mildest of the six dosha houses in most classical treatments.
  if(marsHouseFromLagna===12)cancellations.push('Mars in the 12th house is considered the mildest of the six classical Mangal Dosha placements');

  // 5. Mars in the 2nd house in a sign of Mercury (Gemini/Virgo) is held by some schools to be cancelled,
  // since Mercury's gentle, communicative rulership softens Mars's harshness there.
  if(marsHouseFromLagna===2&&(marsD.sign===2||marsD.sign===5))cancellations.push('Mars in the 2nd house falls in a sign ruled by gentle Mercury, which some classical schools hold softens this particular placement');

  let strength=55;
  if(fromLagna)strength+=12;
  if(fromMoon)strength+=8;
  if(fromVenus)strength+=5;
  strength-=cancellations.length*14;
  strength=Math.max(12,Math.min(85,strength));

  const refPoints=[fromLagna?'Ascendant':null,fromMoon?'Moon':null,fromVenus?'Venus':null].filter(Boolean);
  return{
    name:'Mangal Dosha (Kuja Dosha)',category:'dosha',
    strength,strengthLabel:strength>=55?'Significant':strength>=30?'Mild':'Largely cancelled',
    formation:`Mars is placed in House ${marsHouseFromLagna} from the ${refPoints.join(', ')} — one of the six houses (1, 2, 4, 7, 8, 12) classically used to assess Mangal Dosha, primarily examined for marital compatibility and timing.${cancellations.length?' However: '+cancellations.join('; ')+'.':' No major classical cancellation factors are present in this chart.'}`,
    signifies:'Traditionally associated with friction, delay, or intensity in marriage and partnerships — more a matter of compatibility and timing than an absolute affliction. Classical texts list over a dozen cancellation conditions (this reading checks several of the most consistently cited ones), and many traditions also hold the dosha auto-cancels when both partners in a match share it, or weakens considerably after the late twenties.',
    planetsInvolved:['Mars']
  };
}
function getAspectsOnHouseGeneric(targetHouse,planetData){
  const aspects=[];
  for(const planet in ASPECT_OFFSETS){
    if(!planetData[planet])continue;
    const fromHouse=planetData[planet].house;
    for(const offset of ASPECT_OFFSETS[planet]){
      const aspectedHouse=((fromHouse-1+offset-1)%12)+1;
      if(aspectedHouse===targetHouse){aspects.push(planet);break}
    }
  }
  return aspects;
}

// ---------------- KAAL SARP DOSHA ----------------
// All seven classical planets fall within the houses spanned by Rahu and Ketu on one side (no planet outside the Rahu-Ketu axis).
// 12 named types exist based on which house Rahu occupies from the Ascendant.
const KAAL_SARP_TYPES=['Anant','Kulik','Vasuki','Shankhapal','Padma','Mahapadma','Takshak','Karkotak','Shankhanaad','Patak','Vishdhar','Sheshnag'];
function detectKaalSarpDosha(planetData){
  const rahuLon=planetData.Rahu.lon,ketuLon=planetData.Ketu.lon;
  const sevenPlanets=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn'];
  const inArc=(lon,start,end)=>{
    const norm=(x)=>((x%360)+360)%360;
    const s=norm(start),e=norm(end),l=norm(lon);
    if(s<e)return l>=s&&l<=e;
    return l>=s||l<=e;
  };
  const oneSideCount=sevenPlanets.filter(p=>inArc(planetData[p].lon,rahuLon,ketuLon)).length;
  const otherSideCount=sevenPlanets.filter(p=>inArc(planetData[p].lon,ketuLon,rahuLon)).length;
  const allOneSide=oneSideCount===7,allOtherSide=otherSideCount===7;
  // Partial Kaal Sarp: exactly 6 of 7 planets hemmed, one breaking the axis - classically a markedly weaker, "Anshik" form
  const partialOneSide=oneSideCount===6,partialOtherSide=otherSideCount===6;
  if(!allOneSide&&!allOtherSide&&!partialOneSide&&!partialOtherSide)return null;

  const headFirst=allOneSide||partialOneSide;
  const isPartial=!allOneSide&&!allOtherSide;
  const rahuHouse=houseOf('Rahu',planetData);
  const typeName=KAAL_SARP_TYPES[(rahuHouse-1+12)%12];

  let strength=isPartial?42:70;
  return{
    name:isPartial?`Kaal Sarp Dosha (Partial — ${typeName})`:`Kaal Sarp Dosha (${typeName})`,
    category:'dosha',
    strength,strengthLabel:isPartial?'Mild (partial)':'Significant',
    formation:isPartial
      ?`Six of the seven classical planets fall within the ${headFirst?'Rahu-to-Ketu':'Ketu-to-Rahu'} half of the zodiac, with one planet breaking the enclosure. This is classically read as "Anshik" (partial) Kaal Sarp Dosha — present in form, but markedly weaker than the full configuration since the nodal axis does not fully hem in every planet. Rahu's placement in House ${rahuHouse} would give this the name ${typeName} Kaal Sarp if the enclosure were complete.`
      :`All seven classical planets fall within the ${headFirst?'Rahu-to-Ketu':'Ketu-to-Rahu'} half of the zodiac, with no planet on the opposite side of the Rahu-Ketu axis. This is the classical definition of Kaal Sarp Dosha. With Rahu in House ${rahuHouse}, this is the ${typeName} type, one of twelve named varieties — each said to colour a different area of life (this one ${typeName==='Takshak'?'most affecting marriage and partnerships':typeName==='Shankhanaad'?'most affecting career and authority':typeName==='Padma'?'most affecting children and creativity':'most affecting the houses Rahu touches'}).`,
    signifies:'A theme of delay followed by sudden, often dramatic turns — recurring obstacles in early life that frequently resolve into unusual strength or success later, especially after Rahu or Ketu\'s own Dasha periods. It is worth noting Kaal Sarp Dosha does not appear in foundational texts like Brihat Parashara Hora Shastra and is a later addition to the tradition — many modern Jyotishis treat it as a useful but non-canonical interpretive lens rather than a scripturally fixed affliction, best read as a karmic, transformational undertone.',
    planetsInvolved:['Rahu','Ketu']
  };
}

// ---------------- KEMADRUMA DOSHA ----------------
// Classical (BPHS) definition: no planet (Rahu/Ketu excluded; some schools also exclude Sun) in the
// 2nd or 12th house from the Moon. Many well-attested cancellation conditions exist - this checks several.
function detectKemadrumaDosha(planetData){
  const moonHouse=houseOf('Moon',planetData);
  const secondFromMoon=((moonHouse)%12)+1;
  const twelfthFromMoon=((moonHouse-2+12)%12)+1;
  // BPHS excludes Sun, Rahu, Ketu from the planets that can "support" the Moon for this specific check
  const supportingPlanets=PLANETS.filter(p=>p!=='Moon'&&p!=='Sun'&&p!=='Rahu'&&p!=='Ketu');
  const planetsAdjacent=supportingPlanets.filter(p=>{const h=houseOf(p,planetData);return h===secondFromMoon||h===twelfthFromMoon});
  if(planetsAdjacent.length>0)return null; // base condition not met - a planet flanks the Moon

  const moonD=planetData.Moon;
  const moonDig=getDignity('Moon',moonD.sign,moonD.deg);
  const cancellations=[];

  // 1. Moon conjunct any other planet in its own house (distinct from the 2nd/12th adjacency check above)
  const conjunctPlanets=supportingPlanets.filter(p=>houseOf(p,planetData)===moonHouse);
  if(conjunctPlanets.length>0)cancellations.push(`the Moon is conjunct ${conjunctPlanets.join(' and ')} in the same house, providing direct planetary company`);

  // 2. Moon in a Kendra from the Lagna
  if(KENDRA_HOUSES.includes(moonHouse))cancellations.push('the Moon occupies a Kendra house from the Ascendant, gaining strength from this central position');

  // 3. Moon in own sign (Cancer) or exaltation (Taurus)
  if(moonDig==='own'||moonDig==='exalted')cancellations.push(`the Moon is in ${moonDig==='own'?'its own sign (Cancer)':'exaltation (Taurus)'}, which substantially strengthens it against isolation`);

  // 4. Any planet aspecting the Moon (not just adjacent by house) - classical aspect check
  const aspectingPlanets=getAspectsOnHouseGeneric(moonHouse,planetData).filter(p=>p!=='Rahu'&&p!=='Ketu');
  if(aspectingPlanets.length>0)cancellations.push(`the Moon receives an aspect from ${aspectingPlanets.join(' and ')}, which classically mitigates the isolation`);

  // 5. A benefic (Jupiter or Venus) placed in a Kendra counted from the Moon itself (not the Lagna)
  const benefics=['Jupiter','Venus'];
  const beneficsInKendraFromMoon=benefics.filter(p=>{
    const dist=houseDistance(moonHouse,houseOf(p,planetData));
    return KENDRA_HOUSES.includes(dist);
  });
  if(beneficsInKendraFromMoon.length>0)cancellations.push(`${beneficsInKendraFromMoon.join(' and ')} occupies a Kendra position counted from the Moon itself, lending grounding support`);

  if(cancellations.length>0){
    return null; // any one of these well-attested classical conditions is treated as a full cancellation (Bhanga)
  }

  return{
    name:'Kemadruma Dosha',category:'dosha',
    strength:50,strengthLabel:'Mild',
    formation:`The Moon (House ${moonHouse}) has no planet in the houses immediately before or after it (its classical "flanking" positions), is not conjunct another planet, receives no aspect, has no benefic in a Kendra from itself, and is not itself in a Kendra house or in own/exaltation dignity — the full classical definition of an isolated Moon with none of the well-known cancellation conditions present.`,
    signifies:'A tendency toward emotional self-reliance, periods of feeling unsupported, or fluctuating circumstances early in life — particularly during Moon-related Dasha periods. Classical texts describe this as one of the most heavily-cancelled doshas in the system (most charts with the raw configuration also satisfy at least one mitigating condition), and even when present without cancellation, many traditions read it as converting to an indicator of hard-won self-reliance and resilience rather than fixed misfortune.',
    planetsInvolved:['Moon']
  };
}

// ---------------- GURU CHANDAL DOSHA ----------------
function detectGuruChandalDosha(planetData){
  if(planetsConjunct('Jupiter','Rahu',planetData)){
    return{
      name:'Guru Chandal Dosha',category:'dosha',
      strength:58,strengthLabel:'Mild to moderate',
      formation:`Jupiter and Rahu are conjunct in House ${houseOf('Jupiter',planetData)} (${SIGNS[planetData.Jupiter.sign]}).`,
      signifies:'A tendency to question or unconventionally reinterpret tradition, ethics, teachers, or belief systems — can manifest as unorthodox wisdom and original thinking, or as confusion and compromised judgement depending on the rest of the chart. Often softened considerably when Jupiter is otherwise well-dignified.',
      planetsInvolved:['Jupiter','Rahu']
    };
  }
  return null;
}

// ---------------- SHRAPIT DOSHA ----------------
function detectShrapitDosha(planetData){
  if(planetsConjunct('Saturn','Rahu',planetData)){
    return{
      name:'Shrapit Dosha',category:'dosha',
      strength:60,strengthLabel:'Moderate',
      formation:`Saturn and Rahu are conjunct in House ${houseOf('Saturn',planetData)} (${SIGNS[planetData.Saturn.sign]}).`,
      signifies:'Classically linked to a sense of prolonged delay, ancestral or karmic burdens, and lessons learned through patience under restrictive circumstances. Often eases significantly once the associated Dasha periods pass and the underlying lesson is integrated.',
      planetsInvolved:['Saturn','Rahu']
    };
  }
  return null;
}

// ---------------- PITRA DOSHA (simplified) ----------------
// Sun afflicted by Rahu/Ketu/Saturn in the 9th house (ancestors/father), or Rahu/Ketu in 9th
function detectPitraDosha(planetData){
  const ninthOccupants=PLANETS.filter(p=>houseOf(p,planetData)===9);
  const afflictors=ninthOccupants.filter(p=>['Rahu','Ketu','Saturn'].includes(p));
  const sunInNinth=ninthOccupants.includes('Sun');
  if(afflictors.length&&(sunInNinth||planetsConjunct('Sun','Rahu',planetData)||planetsConjunct('Sun','Ketu',planetData))){
    return{
      name:'Pitra Dosha',category:'dosha',
      strength:52,strengthLabel:'Mild',
      formation:`House 9 (signifying father, ancestry, and dharma) contains ${afflictors.join(' and ')}${sunInNinth?', alongside the Sun':''}, a classical (though simplified) marker some traditions read as Pitra Dosha.`,
      signifies:'Associated with unresolved ancestral patterns or a complex relationship with one\'s father or paternal lineage. Many family-lineage remedies and rituals in Vedic tradition specifically address this theme.',
      planetsInvolved:afflictors
    };
  }
  return null;
}

function detectAllDoshas(planetData,lagnaSign){
  const all=[];
  const md=detectMangalDosha(planetData,lagnaSign);if(md)all.push(md);
  const ks=detectKaalSarpDosha(planetData);if(ks)all.push(ks);
  const kd=detectKemadrumaDosha(planetData);if(kd)all.push(kd);
  const gc=detectGuruChandalDosha(planetData);if(gc)all.push(gc);
  const sd=detectShrapitDosha(planetData);if(sd)all.push(sd);
  const pd=detectPitraDosha(planetData);if(pd)all.push(pd);
  return all.sort((a,b)=>b.strength-a.strength);
}

// Lords of active Dasha/Antardasha relevant to a yoga/dosha (for "when it activates" note)
function relevantDashaNote(planetsInvolved,dashas){
  if(!dashas||!dashas.length)return'';
  const now=new Date();
  const activeMaha=dashas.find(d=>now>=d.start&&now<d.end);
  if(!activeMaha)return'';
  const mahaFull=DASHA_LORD_FULLNAME[activeMaha.lord]||activeMaha.lord;
  const involvedShort=planetsInvolved.map(p=>{
    const rev=Object.entries(DASHA_LORD_FULLNAME).find(([k,v])=>v===p);
    return rev?rev[0]:null;
  }).filter(Boolean);
  const activeSub=(activeMaha.antardashas||[]).find(s=>now>=s.start&&now<s.end);
  const subFull=activeSub?(DASHA_LORD_FULLNAME[activeSub.lord]||activeSub.lord):null;
  if(involvedShort.includes(activeMaha.lord)){
    return`This combination is especially relevant right now: the current Mahadasha is ${mahaFull}, one of the planets directly involved.`;
  }
  if(activeSub&&involvedShort.includes(activeSub.lord)){
    return`This combination is especially relevant right now: the current Antardasha is ${subFull}, one of the planets directly involved.`;
  }
  return`This combination tends to activate most strongly during the Mahadasha or Antardasha of ${planetsInvolved.join(' or ')}.`;
}

// =====================================================================
// PANCHANG & NAKSHATRA-KOOTA REFERENCE DATA
// Classical per-nakshatra attributes used for personality/compatibility reading:
// Gana (temperament), Yoni (instinctual animal), Nadi (constitutional humor).
// Indexed 0-26 matching the NAKSHATRAS array order.
// =====================================================================
const NAK_GANA=['Deva','Manushya','Rakshasa','Manushya','Deva','Manushya','Deva','Deva','Rakshasa','Rakshasa','Manushya','Manushya','Deva','Rakshasa','Deva','Rakshasa','Deva','Rakshasa','Rakshasa','Manushya','Manushya','Deva','Rakshasa','Rakshasa','Manushya','Manushya','Deva'];
const NAK_GANA_INFO={
  Deva:{label:'Deva (Divine)',desc:'Gentle, refined, and inclined toward spiritual or sattvic pursuits. Tends to be helpful, calm, and well-liked.'},
  Manushya:{label:'Manushya (Human)',desc:'A balanced mix of worldly and spiritual interests. Practical, sociable, and adaptable to circumstance.'},
  Rakshasa:{label:'Rakshasa (Fierce)',desc:'Intense, strong-willed, and independent. Often driven, competitive, and resistant to being controlled.'}
};
const NAK_YONI=['Horse (M)','Elephant (M)','Goat (F)','Serpent (M)','Serpent (F)','Dog (F)','Cat (F)','Goat (M)','Cat (M)','Rat (M)','Rat (F)','Cow (M)','Buffalo (F)','Tiger (F)','Buffalo (M)','Tiger (M)','Deer (F)','Deer (M)','Dog (M)','Monkey (M)','Mongoose (M)','Monkey (F)','Lion (F)','Horse (F)','Lion (M)','Cow (F)','Elephant (F)'];
const NAK_NADI=['Adi','Madhya','Antya','Antya','Madhya','Adi','Adi','Madhya','Antya','Antya','Madhya','Adi','Adi','Madhya','Antya','Antya','Madhya','Adi','Adi','Madhya','Antya','Antya','Madhya','Adi','Adi','Madhya','Antya'];
const NAK_NADI_INFO={
  Adi:{label:'Adi (Vata)',desc:'Governed by the air (Vata) principle — quick, changeable, communicative energy.'},
  Madhya:{label:'Madhya (Pitta)',desc:'Governed by the fire principle — driven, transformative, intense energy.'},
  Antya:{label:'Antya (Kapha)',desc:'Governed by the water/earth principle — steady, nurturing, grounded energy.'}
};

// Varna and Tatva by Rashi (sign index 0=Aries ... 11=Pisces)
const RASHI_VARNA=['Kshatriya','Vaishya','Shudra','Brahmin','Kshatriya','Vaishya','Shudra','Brahmin','Kshatriya','Vaishya','Shudra','Brahmin'];
const RASHI_VARNA_INFO={
  Brahmin:'Associated with wisdom, contemplation, and a priest-like temperament — drawn to knowledge and inner refinement.',
  Kshatriya:'Associated with leadership, courage, and a warrior-like temperament — drawn to action, protection, and command.',
  Vaishya:'Associated with commerce, resourcefulness, and a merchant-like temperament — drawn to building, trade, and material security.',
  Shudra:'Associated with service, adaptability, and a worker-like temperament — drawn to cooperation and practical support of others.'
};
const RASHI_TATVA=['Fire','Earth','Air','Water','Fire','Earth','Air','Water','Fire','Earth','Air','Water'];
const RASHI_TATVA_INFO={
  Fire:'Agni Tatva — dynamic, transformative, and driven by will and passion.',
  Earth:'Prithvi Tatva — stable, practical, and driven by material security and patience.',
  Air:'Vayu Tatva — intellectual, communicative, and driven by ideas and social connection.',
  Water:'Jala Tatva — emotional, intuitive, and driven by feeling and inner depth.'
};

// Vashya (behavioural/compatibility group) by Rashi. Sagittarius and Capricorn are each split by half
// classically (Chatushpada in one half, a different group in the other) - approximated here at the
// whole-sign level for simplicity, using each sign's more commonly cited group.
const RASHI_VASHYA=['Chatushpada','Chatushpada','Nara','Jalachara','Vanachara','Nara','Nara','Keeta','Nara','Chatushpada','Nara','Jalachara'];
const RASHI_VASHYA_INFO={
  Chatushpada:{label:'Chatushpada (Quadruped)',desc:'A grounded, instinctual temperament — most naturally at ease with fellow Chatushpada or Nara (human) types, classically said to feel some friction with Vanachara (wild) types.'},
  Nara:{label:'Nara / Manava (Human)',desc:'A socially attuned, adaptable temperament that gets along with nearly every other group — the most broadly compatible of the five Vashya groups.'},
  Jalachara:{label:'Jalachara (Aquatic)',desc:'An emotionally fluid, intuitive temperament — most naturally at ease with fellow water-dwellers, comfortable adapting around Chatushpada types too.'},
  Vanachara:{label:'Vanachara (Wild)',desc:'An independent, untamed temperament — Leo\'s sole occupant of this group, said to hold a natural upper hand over every group except Jalachara.'},
  Keeta:{label:'Keeta (Insect)',desc:'A private, intensely focused temperament — Scorpio\'s sole occupant of this group, most comfortable with Nara (human) types.'}
};

// Paya (the "foot" / metal) by birth Nakshatra - one of the eight Avakhada Chakra attributes,
// used alongside Gana/Yoni/Nadi/Varna in traditional naming ceremonies and chart reading.
const NAK_PAYA=['Gold','Gold','Iron','Iron','Iron','Silver','Silver','Silver','Silver','Silver','Silver','Silver','Silver','Silver','Silver','Copper','Copper','Copper','Copper','Copper','Copper','Copper','Copper','Copper','Copper','Copper','Gold'];
const NAK_PAYA_INFO={
  Gold:{label:'Swarna (Gold)',desc:'Classically tied to comfort, status, and being noticed — though several traditions note its blessings are often only realised after some early struggle.'},
  Silver:{label:'Rajat (Silver)',desc:'Widely held as the most evenly auspicious Paya — steady emotional intelligence, harmonious relationships, and balanced growth.'},
  Copper:{label:'Tamra (Copper)',desc:'An energy of action and resourcefulness — steady, self-made progress built through effort rather than luck.'},
  Iron:{label:'Loha (Iron)',desc:'Classically read as the most effort-intensive Paya — real strength and depth built specifically through facing and working through hardship.'}
};

// 15 Tithi names (shared by both Paksha; 15th differs: Purnima in Shukla, Amavasya in Krishna)
const TITHI_NAMES=['Pratipada','Dwitiya','Tritiya','Chaturthi','Panchami','Shashthi','Saptami','Ashtami','Navami','Dashami','Ekadashi','Dwadashi','Trayodashi','Chaturdashi'];
const TITHI_TYPE=['Nanda','Bhadra','Jaya','Rikta','Poorna','Nanda','Bhadra','Jaya','Rikta','Poorna','Nanda','Bhadra','Jaya','Rikta','Poorna'];
const TITHI_TYPE_INFO={
  Nanda:'Joyful tithi — favourable for celebrations and beginning new ventures.',
  Bhadra:'Stable tithi — generally auspicious for ceremonies and purchases.',
  Jaya:'Victorious tithi — favourable for efforts requiring strength and resolve.',
  Rikta:'"Empty" tithi — less ideal for new beginnings, though suited to inward or devotional work.',
  Poorna:'Complete/full tithi — considered highly auspicious for most undertakings.'
};

// 27 Nitya Yogas (Sun + Moon longitude based)
const NITYA_YOGA_NAMES=['Vishkambha','Priti','Ayushman','Saubhagya','Shobhana','Atiganda','Sukarma','Dhriti','Shoola','Ganda','Vriddhi','Dhruva','Vyaghata','Harshana','Vajra','Siddhi','Vyatipata','Variyana','Parigha','Shiva','Siddha','Sadhya','Shubha','Shukla','Brahma','Aindra','Vaidhriti'];
const NITYA_YOGA_NATURE=['Mixed','Auspicious','Auspicious','Auspicious','Auspicious','Inauspicious','Auspicious','Mixed','Inauspicious','Inauspicious','Auspicious','Auspicious','Inauspicious','Auspicious','Inauspicious','Auspicious','Inauspicious','Mixed','Inauspicious','Auspicious','Auspicious','Auspicious','Auspicious','Auspicious','Auspicious','Auspicious','Inauspicious'];
const NITYA_YOGA_MEANING=['a mixed yoga of obstacles met with resilience','love, harmony, and warmth in relationships','health, vitality, and longevity','good fortune and comfortable opportunity','beauty, charm, and magnetic presence','obstacles and accident-proneness requiring caution','virtuous, generous action','restless determination, drawn to others\' company','confrontation and a quarrelsome edge','obstacles tied to flawed judgement','natural growth and increase','steady fixity, sometimes stubbornness','disruption and sudden hindrance','joyous enthusiasm, especially in the arts','sudden powerful bursts, can cut both ways','accomplishment and skillful mastery','disruption and discord — classically avoided for new beginnings','generosity that can tip into excess','obstruction, best worked around rather than through','auspicious grace and goodwill','spiritual accomplishment','achievability through steady effort','auspiciousness and general goodwill','brightness, clarity, and purity of purpose','creative, foundational energy','authority and rightful command','severance and division — classically avoided for new beginnings'];

// 11 Karanas (7 movable, repeating cyclically; 4 fixed, occurring once per lunar month at specific points)
const KARANA_MOVABLE=['Bava','Balava','Kaulava','Taitila','Garaja','Vanija','Vishti'];
const KARANA_FIXED=['Shakuni','Chatushpada','Naga','Kimstughna'];
const KARANA_INFO_MAP={
  Bava:'Favourable for new beginnings, learning, and friendly undertakings.',
  Balava:'Favourable for happiness, new relationships, and comfort-seeking activity.',
  Kaulava:'Supportive of friendship, partnership, and alliance-building.',
  Taitila:'Good for business, trade, and intellectual or analytical work.',
  Garaja:'Mixed — favours sustained effort more than fresh starts.',
  Vanija:'Excellent for trade, commerce, and business dealings.',
  Vishti:'Also called Bhadra — classically the most avoided Karana for important new undertakings.',
  Shakuni:'Calm and intuitive, but generally not favoured for new beginnings.',
  Chatushpada:'Mixed, traditionally tied to animal-related or grounding activities.',
  Naga:'Mixed, associated with transformation and hidden undercurrents.',
  Kimstughna:'Favourable for closure, completion, and tying up loose ends — not for fresh starts.'
};
function getKaranaName(k){
  // k: 1-60 index of half-tithi across the lunar month
  if(k===1)return'Kimstughna';
  if(k===58)return'Shakuni';
  if(k===59)return'Chatushpada';
  if(k===60)return'Naga';
  // k=2..57 cycles through the 7 movable karanas
  return KARANA_MOVABLE[(k-2)%7];
}

const VARA_NAMES=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const VARA_LORDS=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn'];
const VARA_INFO=[
  'Ravivara — ruled by the Sun. Associated with vitality, authority, and self-expression.',
  'Somavara — ruled by the Moon. Associated with emotion, intuition, and nurturing.',
  'Mangalavara — ruled by Mars. Associated with courage, action, and assertiveness.',
  'Budhavara — ruled by Mercury. Associated with intellect, communication, and commerce.',
  'Guruvara — ruled by Jupiter. Associated with wisdom, growth, and good fortune.',
  'Shukravara — ruled by Venus. Associated with beauty, relationships, and comfort.',
  'Shanivara — ruled by Saturn. Associated with discipline, endurance, and structure.'
];

// Master Panchang calculator — takes sidereal Sun/Moon longitudes and the birth Date object
function calcPanchang(sunLon,moonLon,birthDate){
  // Tithi: angular distance Moon - Sun, each 12 deg = 1 tithi, 30 tithis per lunar month
  let diff=norm360(moonLon-sunLon);
  const tithiNum=Math.floor(diff/12)+1; // 1-30
  const paksha=tithiNum<=15?'Shukla':'Krishna';
  const tithiInPaksha=paksha==='Shukla'?tithiNum:tithiNum-15;
  let tithiName;
  if(tithiInPaksha===15)tithiName=paksha==='Shukla'?'Purnima':'Amavasya';
  else tithiName=TITHI_NAMES[tithiInPaksha-1];
  const tithiType=tithiInPaksha===15?'Poorna':TITHI_TYPE[tithiInPaksha-1];
  const tithiPct=((diff%12)/12*100);

  // Nitya Yoga: sum of Sun+Moon longitudes, each 13deg20' (=13.3333) = 1 yoga, 27 total
  const yogaSum=norm360(sunLon+moonLon);
  const yogaIdx=Math.floor(yogaSum/13.33333)%27;
  const yogaName=NITYA_YOGA_NAMES[yogaIdx];
  const yogaNature=NITYA_YOGA_NATURE[yogaIdx];
  const yogaMeaning=NITYA_YOGA_MEANING[yogaIdx];

  // Karana: half-tithi, each 6 deg of Moon-Sun difference
  const karanaIdx=Math.floor(diff/6)+1; // 1-60
  const karanaName=getKaranaName(karanaIdx);

  // Vara: weekday of birth (using the birth date's local calendar day)
  const varaIdx=birthDate.getDay();

  return{
    tithi:{name:tithiName,paksha,number:tithiInPaksha,type:tithiType,typeInfo:TITHI_TYPE_INFO[tithiType],pct:tithiPct},
    yoga:{name:yogaName,nature:yogaNature,meaning:yogaMeaning,idx:yogaIdx},
    karana:{name:karanaName,info:KARANA_INFO_MAP[karanaName]},
    vara:{name:VARA_NAMES[varaIdx],lord:VARA_LORDS[varaIdx],info:VARA_INFO[varaIdx]}
  };
}

// Full nakshatra-koota profile for a given nakshatra index (used for both Moon nakshatra and Ascendant nakshatra)
function getNakshatraKoota(nakIdx){
  const gana=NAK_GANA[nakIdx];
  const nadi=NAK_NADI[nakIdx];
  const paya=NAK_PAYA[nakIdx];
  return{
    gana,ganaInfo:NAK_GANA_INFO[gana],
    yoni:NAK_YONI[nakIdx],
    nadi,nadiInfo:NAK_NADI_INFO[nadi],
    paya,payaInfo:NAK_PAYA_INFO[paya]
  };
}
function getRashiVarnaTatva(signIdx){
  const varna=RASHI_VARNA[signIdx],tatva=RASHI_TATVA[signIdx],vashya=RASHI_VASHYA[signIdx];
  return{varna,varnaInfo:RASHI_VARNA_INFO[varna],tatva,tatvaInfo:RASHI_TATVA_INFO[tatva],vashya,vashyaInfo:RASHI_VASHYA_INFO[vashya]};
}

// Lagna sign flavor - short phrase describing how the rising sign colours one's outward manner/style
const LAGNA_SIGN_FLAVOR=[
  'a direct, assertive, somewhat impatient way of meeting the world',
  'a steady, deliberate, comfort-seeking way of meeting the world',
  'a curious, talkative, quick-shifting way of meeting the world',
  'a sensitive, home-oriented, protective way of meeting the world',
  'a confident, warm, attention-commanding way of meeting the world',
  'a precise, modest, detail-oriented way of meeting the world',
  'a diplomatic, relationship-focused, image-conscious way of meeting the world',
  'an intense, private, all-or-nothing way of meeting the world',
  'an optimistic, philosophical, freedom-loving way of meeting the world',
  'a disciplined, ambitious, reserved way of meeting the world',
  'an unconventional, idea-driven, socially detached way of meeting the world',
  'a dreamy, empathetic, boundary-blurring way of meeting the world'
];

// Generates a personality snapshot blending Lagna nakshatra (outer self), Moon nakshatra (inner self), and Lagna sign flavor
function generatePersonalitySnapshot(lagnaSign,ascNakName,moonNakName){
  const lagnaTrait=NAKSHATRA_TRAITS[ascNakName]||'distinctive';
  const moonTrait=NAKSHATRA_TRAITS[moonNakName]||'distinctive';
  const lagnaFlavor=LAGNA_SIGN_FLAVOR[lagnaSign];
  const sameNak=(ascNakName===moonNakName);

  let html=`<div class="ps-title">A quick snapshot — outer vs. inner</div>`;
  html+=`<div class="ps-row"><span class="ps-label">To the outside world</span> (Lagna nakshatra: ${ascNakName}) you tend to come across as ${lagnaTrait}, carrying ${lagnaFlavor}.</div>`;
  if(sameNak){
    html+=`<div class="ps-row">Your Moon shares this same nakshatra, which means your outer presentation and inner emotional world are unusually aligned — what people see is close to what you actually feel.</div>`;
  }else{
    html+=`<div class="ps-row"><span class="ps-label">Internally</span> (Moon nakshatra: ${moonNakName}) you are emotionally driven by something different — ${moonTrait}. This is the part of you that rarely shows on the surface but quietly steers how you feel and what you need to feel secure.</div>`;
  }
  html+=`<div class="ps-row" style="color:#888;font-size:11.5px;margin-top:10px">Based on Lagna nakshatra, Moon nakshatra, and Lagna sign only — a starting read, not the full chart.</div>`;
  return html;
}

function renderPersonalitySnapshot(){
  if(!chartData)return;
  const{lagnaSign,ascSid,planetData}=chartData;
  const ascNak=getNakshatra(ascSid);
  const moonNak=planetData.Moon.nakshatra;
  const container=document.getElementById('personality-snapshot');
  container.innerHTML=generatePersonalitySnapshot(lagnaSign,ascNak.name,moonNak.name);
  container.classList.remove('hidden');
}
