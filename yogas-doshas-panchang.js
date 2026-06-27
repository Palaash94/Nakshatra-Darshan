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
      const strength=dig==='exalted'?92:dig==='moolatrikona'?85:78;
      results.push({
        name:def.name,category:'yoga',
        strength,strengthLabel:strength>=85?'Very strong':'Strong',
        formation:`${def.planet} is ${dig==='exalted'?'exalted':dig==='moolatrikona'?'in its Moolatrikona':'in its own sign'} (${SIGNS[d.sign]}) while posited in House ${d.house}, a Kendra (angular house). This is one of the five classical Panch Mahapurusha Yogas, formed only when one of these five planets is both dignified and angular.`,
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
    let strength=70;
    if(jupDig==='exalted'||jupDig==='own')strength+=15;
    if(moonDig==='exalted'||moonDig==='own')strength+=10;
    if(moonDig==='debilitated'||jupDig==='debilitated')strength-=20;
    strength=Math.max(30,Math.min(95,strength));
    return{
      name:'Gajakesari Yoga',category:'yoga',
      strength,strengthLabel:strength>=75?'Strong':strength>=50?'Moderate':'Mild',
      formation:`Jupiter (House ${jupHouse}) stands in a Kendra position relative to the Moon (House ${moonHouse}) — the two are angular to one another. This is the classical condition for Gajakesari Yoga, named for the elephant (Gaja) and lion (Kesari): two powerful, fearless creatures.`,
      signifies:'Intelligence, eloquence, a respected reputation, good fortune, and the ability to overcome obstacles with composure. Natives often gain recognition through wisdom or public standing.',
      planetsInvolved:['Moon','Jupiter']
    };
  }
  return null;
}

// ---------------- BUDHADITYA YOGA ----------------
// Sun-Mercury conjunction (and Mercury not combust-weak / not too close which would be Vishti)
function detectBudhaditya(planetData){
  if(planetsConjunct('Sun','Mercury',planetData)){
    const sunD=planetData.Sun,merD=planetData.Mercury;
    const orb=Math.abs(sunD.lon-merD.lon);
    const closeOrb=Math.min(orb,360-orb);
    let strength=65;
    const merDig=getDignity('Mercury',merD.sign,merD.deg);
    if(merDig==='own'||merDig==='exalted'||merDig==='moolatrikona')strength+=20;
    if(closeOrb<3)strength-=10; // very tight conjunction can mean combustion, slightly reduces independent expression
    strength=Math.max(35,Math.min(90,strength));
    return{
      name:'Budhaditya Yoga',category:'yoga',
      strength,strengthLabel:strength>=75?'Strong':strength>=50?'Moderate':'Mild',
      formation:`Sun and Mercury are conjunct in House ${houseOf('Sun',planetData)} (${SIGNS[sunD.sign]}), separated by roughly ${closeOrb.toFixed(1)}°. Since Mercury never strays far from the Sun, this is a fairly common but still meaningful combination when the house and sign support it.`,
      signifies:'Sharp analytical intelligence, strong communication skills, and an aptitude for administration, strategy, or scholarship. Especially favourable for academic, analytical, or public-facing careers.',
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
function detectMangalDosha(planetData){
  const marsHouseFromLagna=houseOf('Mars',planetData);
  const moonHouse=houseOf('Moon',planetData);
  const marsHouseFromMoon=houseDistance(moonHouse,marsHouseFromLagna);
  const fromLagna=MANGAL_DOSHA_HOUSES.includes(marsHouseFromLagna);
  const fromMoon=MANGAL_DOSHA_HOUSES.includes(marsHouseFromMoon);
  if(!fromLagna&&!fromMoon)return null;
  // Cancellation checks (simplified, classical): Mars in own sign or exalted; Mars aspected/conjunct Jupiter; Mars in Aries/Scorpio (own) in certain houses
  const marsD=planetData.Mars;
  const marsDig=getDignity('Mars',marsD.sign,marsD.deg);
  const cancellations=[];
  if(marsDig==='own'||marsDig==='exalted')cancellations.push(`Mars is in ${marsDig==='own'?'its own sign':'exaltation'} (${SIGNS[marsD.sign]}), which significantly softens the dosha`);
  const jupAspectsMars=getAspectsOnHouseGeneric(marsHouseFromLagna,planetData).includes('Jupiter');
  if(jupAspectsMars||planetsConjunct('Mars','Jupiter',planetData))cancellations.push('Jupiter conjoins or aspects Mars, which is a classical mitigating factor');
  if(MANGAL_DOSHA_HOUSES.includes(7)&&marsHouseFromLagna===12)cancellations.push('Mars in the 12th house is considered among the milder Mangal Dosha placements');
  let strength=fromLagna&&fromMoon?78:fromLagna?65:55;
  strength-=cancellations.length*15;
  strength=Math.max(15,strength);
  return{
    name:'Mangal Dosha (Kuja Dosha)',category:'dosha',
    strength,strengthLabel:strength>=60?'Significant':strength>=35?'Mild':'Largely cancelled',
    formation:`Mars is placed in House ${marsHouseFromLagna} from the Ascendant${fromMoon?` and House ${marsHouseFromMoon} from the Moon`:''} — one of the six houses (1, 2, 4, 7, 8, 12) classically used to assess Mangal Dosha, primarily examined for marital compatibility and timing.${cancellations.length?' However: '+cancellations.join('; ')+'.':' No major classical cancellation factors are present in this chart.'}`,
    signifies:'Traditionally associated with friction, delay, or intensity in marriage and partnerships — more a matter of compatibility and timing than an absolute affliction. Many classical texts note it is auto-cancelled when both partners share a similar dosha, and its effects soften considerably after the late twenties.',
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
// All seven classical planets fall within the houses spanned by Rahu and Ketu on one side (no planet outside the Rahu-Ketu axis)
function detectKaalSarpDosha(planetData){
  const rahuLon=planetData.Rahu.lon,ketuLon=planetData.Ketu.lon;
  const sevenPlanets=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn'];
  // Check if all 7 planets fall in the 180° arc starting from Rahu going to Ketu
  const inArc=(lon,start,end)=>{
    const norm=(x)=>((x%360)+360)%360;
    const s=norm(start),e=norm(end),l=norm(lon);
    if(s<e)return l>=s&&l<=e;
    return l>=s||l<=e;
  };
  const allOneSide=sevenPlanets.every(p=>inArc(planetData[p].lon,rahuLon,ketuLon));
  const allOtherSide=sevenPlanets.every(p=>inArc(planetData[p].lon,ketuLon,rahuLon));
  if(!allOneSide&&!allOtherSide)return null;
  const headFirst=allOneSide;
  let strength=70;
  // Partial cancellation: if any planet is very close (within a few degrees) to Rahu/Ketu itself, count as borderline
  return{
    name:'Kaal Sarp Dosha',category:'dosha',
    strength,strengthLabel:'Significant',
    formation:`All seven classical planets fall within the ${headFirst?'Rahu-to-Ketu':'Ketu-to-Rahu'} half of the zodiac, with no planet on the opposite side of the Rahu-Ketu axis. This is the classical definition of Kaal Sarp Dosha — the "axis" formed by the lunar nodes encloses every other planet.`,
    signifies:'A theme of delay followed by sudden, often dramatic turns — recurring obstacles in early life that frequently resolve into unusual strength or success later, especially after Rahu or Ketu\'s own Dasha periods. Modern classical scholarship is divided on how strictly this should be weighted; it is best read as a karmic, transformational undertone rather than a fixed misfortune.',
    planetsInvolved:['Rahu','Ketu']
  };
}

// ---------------- KEMADRUMA DOSHA ----------------
// No planets (other than Sun) in the 2nd or 12th house from the Moon, and Moon is not in a Kendra, and not conjunct/aspected by other planets
function detectKemadrumaDosha(planetData){
  const moonHouse=houseOf('Moon',planetData);
  const secondFromMoon=((moonHouse)%12)+1;
  const twelfthFromMoon=((moonHouse-2+12)%12)+1;
  const others=PLANETS.filter(p=>p!=='Moon'&&p!=='Sun'&&p!=='Rahu'&&p!=='Ketu');
  const planetsNear=others.filter(p=>{const h=houseOf(p,planetData);return h===secondFromMoon||h===twelfthFromMoon||h===moonHouse});
  if(planetsNear.length>0)return null; // any classical planet adjacent to or with Moon cancels this
  if(KENDRA_HOUSES.includes(moonHouse))return null; // Moon in Kendra is itself a mitigating/cancelling factor in most schools
  return{
    name:'Kemadruma Dosha',category:'dosha',
    strength:50,strengthLabel:'Mild',
    formation:`The Moon (House ${moonHouse}) has no other classical planet in the houses immediately before or after it, nor conjunct it, and is not placed in a Kendra house — the classical definition of an "isolated" Moon.`,
    signifies:'A tendency toward emotional self-reliance, periods of feeling unsupported, or fluctuating circumstances — particularly during Moon-related Dasha periods. Classical texts note this dosha is heavily moderated by the Moon\'s own dignity and any aspects it receives, so it should be read as a tendency rather than a fixed outcome.',
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

function detectAllDoshas(planetData){
  const all=[];
  const md=detectMangalDosha(planetData);if(md)all.push(md);
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
  return{
    gana,ganaInfo:NAK_GANA_INFO[gana],
    yoni:NAK_YONI[nakIdx],
    nadi,nadiInfo:NAK_NADI_INFO[nadi]
  };
}
function getRashiVarnaTatva(signIdx){
  const varna=RASHI_VARNA[signIdx],tatva=RASHI_TATVA[signIdx];
  return{varna,varnaInfo:RASHI_VARNA_INFO[varna],tatva,tatvaInfo:RASHI_TATVA_INFO[tatva]};
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
