/* ============================================================
   YOU TAB
   Replaces the old LLM-backed "AI Reading" tab (which needed a
   user-supplied API key that no longer lives on this page) with a
   fully deterministic, chart-computed read of each D1 planet: its
   sign, dignity, house, anyone it shares that house with, the
   drishtis (aspects) landing on and leaving it, and its Navamsa (D9)
   placement - narrated as continuous prose in an astrologer's voice
   rather than a data table or a list of keywords. Every planet+sign
   pairing gets its own verb (PLANET_SIGN_VERB), every planet+house
   pairing its own outcome (PLANET_HOUSE_VERB), and every one of the
   36 possible planet pairings (PLANET_PAIR_MEANING) its own written
   interpretation, reused for both conjunctions ("sits beside") and
   aspects ("reaches toward") since the same underlying relationship
   colours both - a disclosed simplification, same spirit as
   Varshesh in varshaphala.js. Deliberately written without em dashes
   throughout, in short narrated sentences rather than clause-strung
   ones. Shadbala/Avastha are folded in as soft, wordy impressions,
   not raw percentages - the numbers live one click away on their
   own tabs. Closes with a one-liner apiece on what Shadbala,
   Avastha, and Argala mean - a bridge toward Full Jyotish mode.
   Pure text generation, rendered by renderYouTab() below, called
   wherever generateReading() used to be (app-state.js).
   ============================================================ */

// What this planet DOES through a sign or house - the verb half of "meaning you ___ through ___".
// Distinct per planet so the same sign or house reads differently depending on who's standing
// there (Jupiter "grows" through a sign; Saturn "is tested by" it).
const PLANET_SIGN_VERB={
  Sun:'shape who you are through',
  Moon:'feel most alive through',
  Mars:'act and assert yourself through',
  Mercury:'think and make sense of things through',
  Jupiter:'grow and find understanding through',
  Venus:'love and find beauty through',
  Saturn:'build discipline and endurance through',
  Rahu:'hunger and reach beyond yourself through',
  Ketu:'release and quietly master through'
};
const PLANET_HOUSE_VERB={
  Sun:'shine and are recognised through',
  Moon:'feel most at home through',
  Mars:'fight for what you want through',
  Mercury:'figure things out through',
  Jupiter:'find success through',
  Venus:'find pleasure and connection through',
  Saturn:'carry your heaviest lessons through',
  Rahu:'chase what you have not earned yet through',
  Ketu:'quietly let go through'
};

// The object of "through ___" for the sign sentence - written as flowing, slightly literary
// phrases (mixing nouns and short gerund clauses) rather than flat keyword lists, since the same
// bank is reused across every planet (and across you-tab.js, compatibility-you.js, updates.js,
// and yogas-doshas-panchang.js) and needs to read naturally after any of the verbs above. Three
// variants per sign, picked via signTraitPhrase() below rather than indexed directly, so two
// different charts sharing a placement don't read back byte-identical prose.
const SIGN_TRAIT_PHRASE=[
  ['boldness, urgency, and the thrill of going first',
   'a need to act first and ask permission later',
   'restless courage, and a low tolerance for waiting around'],
  ['patience, sensation, and the comfort of what already works',
   'steadiness, appetite, and a quiet refusal to be rushed',
   'a grounded pull toward comfort, beauty, and what can actually be trusted'],
  ['curiosity, conversation, and the pull of a new idea',
   'quick wit, restlessness, and a mind that is always mid-conversation',
   'a hunger for variety, and the pleasure of connecting one idea to another'],
  ['memory, tenderness, and the need to feel truly held',
   'a deep need to protect and be protected in return',
   'moods that run close to the surface, and a long memory for how things felt'],
  ['warmth, performance, and the joy of being genuinely seen',
   'a generous, sun-warmed confidence that wants an audience',
   'pride, loyalty, and a flair for making things feel a little more dramatic'],
  ['precision, service, and the satisfaction of getting it right',
   'a quiet perfectionism, and real comfort in being genuinely useful',
   'sharp observation, and a habit of noticing what everyone else missed'],
  ['balance, beauty, and the give and take of real connection',
   'a pull toward fairness, and discomfort with anything left unresolved',
   'charm, diplomacy, and a genuine dislike of unnecessary conflict'],
  ['passion, intensity, and finding the deep heart of things',
   'a need to go beneath the surface of things, nothing halfway',
   'quiet intensity, and an instinct for what people are actually hiding'],
  ['adventure, honesty, and the search for a bigger truth',
   'restlessness, optimism, and a need for room to roam',
   'bluntness, a love of the big picture, and an allergy to small print'],
  ['patience, ambition, and the quiet weight of doing it properly',
   'a long-game seriousness, and pride taken in doing it right',
   'discipline, restraint, and a quiet suspicion of shortcuts'],
  ['originality, distance, and ideas that do not belong to the crowd',
   'a need to stand slightly apart from the crowd, on principle',
   'unconventional thinking, and loyalty to ideas over people sometimes'],
  ['imagination, empathy, and a willingness to dissolve into something larger',
   "a porous, absorbing sensitivity to whatever's in the room",
   'daydream, intuition, and a soft blur between self and other']
];
// Picks one phrasing for a sign from a seed - the seed is normally derived from the exact degree
// a planet sits at (planetYouParagraph, planetCoupleParagraph, karakaPlanetSummary), so the same
// birth chart always reads the same way on revisit, but two different people with the same Sun
// sign don't get byte-identical prose. Falls back to a plain index for callers with no seed handy.
function signTraitPhrase(sign,seed){return pickVariant(SIGN_TRAIT_PHRASE[sign],seed==null?sign:seed)}

// The object of "through ___" for the house sentence - short on purpose, naming the house's
// core theme rather than cataloguing it, so the sentence lands the way a real reading would.
const HOUSE_THEME_SHORT=[null,
  'your own body and identity',
  'money and what you value',
  'everyday courage and communication',
  'home and family',
  'romance and creative self-expression',
  'daily work and health',
  'partnership',
  'transformation',
  'belief and higher purpose',
  'career and public standing',
  'friendship and long-held hopes',
  'solitude and release'
];
const HOUSE_ORDINAL=[null,'1st','2nd','3rd','4th','5th','6th','7th','8th','9th','10th','11th','12th'];

// Self-contained clauses that follow "it" - e.g. "it operates here at its classical peak". Each
// tier carries a few phrasings now, picked via dignityNoteLine() below on the same degree-derived
// seed as signTraitPhrase(), for the same reason: variety across charts without breaking stability
// within one.
const DIGNITY_NOTE={
  exalted:["it operates here at its classical peak",
           "this is as strong and confident as this planet gets in a chart",
           "classically, this is close to the best possible seat for it"],
  moolatrikona:["it settles into one of its most self-assured signs",
                "this is a close second to exaltation, a genuinely comfortable seat",
                "it operates here with real, steady self-assurance"],
  own:["it's at home in its own sign, working entirely on its own terms",
       "this is its own territory, nothing borrowed, nothing compromised",
       "it answers to no one else's rules here, fully itself"],
  debilitated:["it's classically uncomfortable here, working harder than usual to deliver",
               "this is its most challenged seat, real effort required just to function normally",
               "classically its weakest placement, though what it lacks in ease it can make up in hard-won growth"],
  neutral:["a workmanlike, unremarkable placement, neither classically boosted nor strained",
           "an ordinary seat, doing its job without much classical fanfare either way"]
};
function dignityNoteLine(dignity,seed){return pickVariant(DIGNITY_NOTE[dignity],seed==null?0:seed)}
const DIGNITY_BADGE={exalted:'Exalted',moolatrikona:'Moolatrikona',own:'Own Sign',debilitated:'Debilitated'};

// A bare theme word per planet, used only as a small connective thread (a housemate's own
// gaze onto an otherwise-empty house, an unlisted pair's generic fallback).
const PLANET_WORD={Sun:'identity',Moon:'feeling',Mars:'drive',Mercury:'thought',Jupiter:'growth',Venus:'love',Saturn:'discipline',Rahu:'hunger',Ketu:'release'};

// What happens when two planets are linked, written once per unordered pair (36 in total, every
// combination of the 9 grahas) and reused for BOTH conjunction ("sits beside it here") and
// aspect ("reaches toward it") framing, since the underlying relationship between the two is the
// same either way and this is the one place in the tab that gets genuinely bespoke, not
// templated, content - the actual interpretive payoff of the tab. Classical yoga names are
// noted in passing where the pairing has one on record.
// Two phrasings per pairing now (still the tab's one genuinely bespoke content, not templated),
// picked via pairMeaning()'s own seed below so revisiting the same chart is stable but two
// different natives sharing a pairing don't read back identically.
const PLANET_PAIR_MEANING={
  'Jupiter|Sun':["your sense of self grows more expansive and generous here, wisdom and confidence reinforcing each other into a real, visible authority",
    "confidence widens here, wisdom lending real weight to how visibly you carry yourself"],
  'Jupiter|Mars':["drive meets purpose, giving a bold, principled kind of courage that's willing to fight for what it actually believes in",
    "action gets a conscience, drive tempered by a real sense of what's worth fighting for"],
  'Jupiter|Mercury':["detail meets big picture wisdom, giving a mind that can reason carefully and still hold a larger, more generous view",
    "the mind gets room to breathe, careful reasoning that still knows when to zoom out"],
  'Jupiter|Moon':["emotional warmth expands into real generosity and faith, one of the gentlest, most nourishing pairings a chart can carry",
    "your emotional world gets genuinely generous, faith and feeling reinforcing each other kindly"],
  'Jupiter|Venus':["growth and love reinforce each other, a naturally lucky, generous pairing around relationships, money, and simple enjoyment of life",
    "affection gets a lucky streak, love and money both tending to work out more often than not"],
  'Jupiter|Saturn':["the two social planets meet directly, faith tempered by discipline, so your growth tends to be real and earned rather than given freely",
    "expansion meets its own limits here, growth that has to be earned properly rather than handed over"],
  'Jupiter|Rahu':["expansion turns hungrier and less patient, sometimes read as Guru Chandal yoga, growth chasing more before it has digested what it already has",
    "ambition outruns patience here, a hunger for more before what's already there has settled"],
  'Jupiter|Ketu':["wisdom turns inward and philosophical, less interested in acquiring more and drawn instead to understanding what's already been lived",
    "belief turns quiet and internal, more interested in meaning than in acquiring anything further"],
  'Ketu|Mars':["action turns inward or gets cut short, better suited to solitary intensity than open confrontation",
    "drive turns private, most effective alone rather than in open confrontation"],
  'Ketu|Mercury':["thinking turns intuitive rather than linear, at its best when it stops trying to explain everything in words",
    "the mind stops trusting words alone, and starts trusting instinct instead"],
  'Ketu|Moon':["feeling turns private and detached, at ease with solitude in a way that can read as distant to people wanting more",
    "feeling learns to need less, comfortable with distance in a way others may misread"],
  'Ketu|Rahu':["the two ends of the same axis always face each other exactly, pulling you constantly between reaching forward and letting go",
    "the axis stays permanently in tension, always facing what it's reaching for and what it's releasing at once"],
  'Ketu|Saturn':["responsibility turns austere, comfortable carrying real weight alone and asking little recognition for it",
    "duty gets carried alone, quietly, without much need for anyone to notice"],
  'Ketu|Sun':["your sense of self turns inward, less interested in being seen and more in quietly already knowing who you are",
    "identity turns private, less concerned with being seen than with quietly knowing itself"],
  'Ketu|Venus':["love turns quiet and undemanding, capable of real devotion without needing much in return",
    "love asks for little in return, real but understated devotion"],
  'Mars|Mercury':["thought turns sharp and quick to act, useful for debate and decisive thinking, though patience isn't always the strong suit",
    "thinking moves fast and wants to act on itself immediately, sharp but sometimes too quick to sit still"],
  'Mars|Moon':["feeling and action fuse into real drive and resourcefulness, a pairing classically called Chandra Mangal yoga, though emotions can run hot and quick to react",
    "instinct and drive fuse, real resourcefulness, though the temper can run hot"],
  'Mars|Rahu':["ambition turns sharp and relentless, capable of real conquest but prone to picking fights it doesn't need to pick",
    "ambition sharpens into something almost combative, effective but prone to unnecessary battles"],
  'Mars|Saturn':["one of the harder pairings, urgency meeting restriction, so action gets delayed or tested before it's allowed to land",
    "momentum keeps meeting a wall here, so action has to be earned through patience it doesn't naturally have"],
  'Mars|Sun':["your identity picks up real fire here, and it's easy to lead, act first, and burn a little too hot chasing the front of the room",
    "identity runs hot, quick to lead and quick to want to win"],
  'Mars|Venus':["desire and attraction sit close together, giving real passion and chemistry, though love and conflict can end up more entangled than either alone",
    "attraction and conflict sit close together, real chemistry that can tip into real friction"],
  'Mercury|Moon':["your instincts and your mind talk to each other easily, so you think in feelings and explain what you sense with real clarity",
    "thought and feeling translate easily, so what you sense you can usually also explain"],
  'Mercury|Rahu':["the mind turns quick, clever, and a little restless, drawn to unconventional ideas others haven't caught onto yet",
    "the mind chases what's new and untested, clever but a little scattered"],
  'Mercury|Saturn':["your thinking turns careful and methodical, slower to speak but more likely to be right when it finally does",
    "thinking slows down and gets careful, less quick, more reliably correct"],
  'Mercury|Sun':["this is the mind lending its shine to the self, a classic pairing known as Budha Aditya yoga that sharpens how clearly and persuasively you think and speak",
    "self-expression sharpens, a classic pairing that makes speaking and thinking unusually persuasive together"],
  'Mercury|Venus':["thought and taste align, giving a naturally artistic, diplomatic mind that communicates with real charm",
    "taste and thought align, a naturally articulate, aesthetically minded way of communicating"],
  'Moon|Rahu':["your instincts get pulled toward the unfamiliar, restless and hungry for emotional experiences that stretch past what feels safe",
    "feeling reaches for what's unfamiliar, restless for experience that stretches past comfort"],
  'Moon|Saturn':["an old, heavy pairing, sometimes read as Vish yoga, where your emotional world meets real restriction and comfort has often had to be earned rather than given",
    "emotional ease has often had to be earned the hard way here, comfort rarely just given"],
  'Moon|Sun':["the light of who you are meets the tide of how you feel, so your outer confidence and inner moods are rarely far apart, working almost as one voice",
    "inner mood and outer confidence move almost as one, rarely far apart"],
  'Moon|Venus':["feeling and affection blend until they're barely separable, making you instinctively tuned to beauty, comfort, and the people you love",
    "feeling and affection blur together, a natural, easy tenderness toward beauty and the people you love"],
  'Rahu|Saturn':["a famously heavy pairing, discipline meeting raw hunger, so ambition here is real but has to be built through patience rather than shortcuts",
    "ambition here is real, but it only holds up if it's built slowly, with patience it doesn't naturally have"],
  'Rahu|Sun':["your identity gets restless and hungry here, pulled toward reinvention and recognition you haven't fully claimed yet",
    "identity keeps wanting reinvention, restless for a recognition not yet fully claimed"],
  'Rahu|Venus':["attraction turns intense and a little insatiable, drawn to love, beauty, or pleasure that always feels just out of reach",
    "desire stays just out of reach here, always wanting a little more than what's already there"],
  'Saturn|Sun':["a classically tense pairing, pride meeting restriction, so your confidence tends to be earned the slow way, through discipline rather than given freely",
    "confidence gets built the slow way here, through discipline rather than given freely"],
  'Saturn|Venus':["love meets restriction here, so affection and commitment are taken seriously, sometimes at the cost of spontaneity or ease",
    "love gets taken seriously here, sometimes at the cost of spontaneity"],
  'Sun|Venus':["identity softens into charm, and you carry yourself with warmth and taste, though it can be hard to separate who you are from what you're loved for",
    "identity and charm blend, though it can be hard to know where being loved ends and being yourself begins"]
};
function pairMeaning(a,b,seed){
  const key=[a,b].sort().join('|');
  const bank=PLANET_PAIR_MEANING[key];
  if(!bank)return`their stories intertwine here, ${PLANET_WORD[a]} colouring ${PLANET_WORD[b]} and the other way around`;
  return pickVariant(bank,seed==null?0:seed);
}

function formatNameList(arr){
  if(arr.length===1)return arr[0];
  if(arr.length===2)return arr.join(' and ');
  return arr.slice(0,-1).join(', ')+', and '+arr[arr.length-1];
}

// Soft, wordy impressions of Shadbala/Avastha standing - deliberately no percentages or clinical
// labels (Favourable/Unfavourable/Mixed) in the prose itself; those live one click away on the
// Shadbala and Avastha tabs for anyone who wants the raw numbers.
function shadbalaSoftPhrase(pct){
  if(pct>=130)return"carries an unusual depth of classical strength";
  if(pct>=100)return"carries real, dependable classical strength";
  if(pct>=75)return"carries a fair, workable measure of classical strength";
  return"carries a gentler, quieter measure of classical strength here";
}
function avasthaSoftPhrase(label){
  if(label==='Favourable')return"its mood at birth leans bright and unguarded";
  if(label==='Unfavourable')return"its mood at birth leans a little inward and tired";
  return"its mood at birth settles somewhere comfortably in between";
}

// Builds the narrated paragraph for one D1 planet: sign meaning, house meaning, dignity,
// housemates, drishtis received and cast, its Navamsa (D9) placement, and a soft read on its
// Shadbala/Avastha standing. Written as short, plainly punctuated sentences throughout, the way
// an astrologer would actually say it out loud, not as clause-heavy dashed prose.
function planetYouParagraph(chartData,p){
  const d=chartData.planetData[p];
  const dignity=getDignity(p,d.sign,d.deg);
  const house=d.house;
  const conjuncts=(chartData.houseMap[house]||[]).filter(x=>x!==p);
  const capSentence=s=>s.charAt(0).toUpperCase()+s.slice(1)+(/[.!?]$/.test(s)?'':'.');
  // Seeded off this planet's exact degree (not the date) - the same birth chart always reads the
  // same way on revisit, but two different natives sharing a placement don't get identical prose.
  const degSeed=Math.round(d.deg*97);
  const pairSeed=other=>Math.round((d.deg+chartData.planetData[other].deg)*53);

  let text=`Your ${p} is in ${SIGNS[d.sign]}, meaning you ${PLANET_SIGN_VERB[p]} ${signTraitPhrase(d.sign,degSeed)}.`;
  text+=` It's in your ${HOUSE_ORDINAL[house]} house, meaning you ${PLANET_HOUSE_VERB[p]} ${HOUSE_THEME_SHORT[house]}.`;
  if(dignity)text+=` Classically, ${dignityNoteLine(dignity,degSeed+11)}.`;

  if(conjuncts.length){
    const sentences=conjuncts.map(c=>capSentence(`${c} sits right beside it here, and ${pairMeaning(p,c,pairSeed(c))}`));
    text+=' '+sentences.join(' ');
  }

  let receivedPlanet=null;
  const received=getAspectsOnHouseGraded(house,chartData.houseMap).filter(a=>a.planet!==p);
  if(received.length){
    const top=[...received].sort((a,b)=>b.grade-a.grade)[0];
    receivedPlanet=top.planet;
    const strengthNote=top.label==='Full'?'':`, a ${top.label.toLowerCase()} aspect rather than a full one`;
    text+=' '+capSentence(`${top.planet}'s gaze reaches it too${strengthNote}, and ${pairMeaning(p,top.planet,pairSeed(top.planet)+3)}`);
  }

  const cast=getAspectsCastFromHouse(house,chartData.houseMap).filter(a=>a.planet===p);
  if(cast.length){
    const top=[...cast].sort((a,b)=>b.grade-a.grade)[0];
    const occupants=(chartData.houseMap[top.toHouse]||[]);
    // Prefer an occupant other than whichever planet already got a pairMeaning in the received-
    // aspect sentence above, so the same line never gets said twice in one paragraph.
    const other=occupants.find(o=>o!==receivedPlanet);
    if(occupants.length&&!other){
      // Every occupant here is the one planet already covered: a genuine mutual aspect, not just
      // two one-way glances, so it gets its own line rather than repeating the pair meaning.
      text+=' '+capSentence(`its own gaze answers ${receivedPlanet}'s in kind, a mutual aspect that pulls this thread tighter from both sides`);
    }else if(other){
      text+=' '+capSentence(`its own gaze reaches your ${HOUSE_ORDINAL[top.toHouse]} house too, touching ${formatNameList(occupants)} there, where ${pairMeaning(p,other,pairSeed(other)+7)}`);
    }else{
      text+=' '+capSentence(`its own gaze reaches into your ${HOUSE_ORDINAL[top.toHouse]} house as well, lending a thread of ${PLANET_WORD[p]} to ${HOUSE_THEME_SHORT[top.toHouse]}`);
    }
  }

  const d9Sign=chartData.navamsa.navPlanetSign[p];
  const vargottama=chartData.navamsa.vargottama[p];
  text+=vargottama
    ?` In the subtler Navamsa chart, it lands right back in ${SIGNS[d9Sign]}, a Vargottama placement classically read as this trait being settled and doubled down rather than a passing phase.`
    :` In the subtler Navamsa chart, it slips into ${SIGNS[d9Sign]}, carrying a quieter thread of ${signTraitPhrase(d9Sign,degSeed+19)} beneath everything above.`;

  const sb=chartData.shadbala[p],av=chartData.avasthas[p];
  if(sb&&av){
    const avSummary=avasthaSummary(av.jagradadi,av.deeptadi);
    text+=` In terms of raw strength, it ${shadbalaSoftPhrase(sb.pct)}, and ${avasthaSoftPhrase(avSummary.label)}.`;
  }else{
    text+=` As a shadow point rather than a physical body, ${p} isn't measured by classical Shadbala or Avastha the way the seven grahas are, its story told entirely through the houses and signs it touches.`;
  }
  return text;
}

// Real photographs, one per planet, used as an oversized watermark behind each card - not
// astronomical glyphs or hand-drawn symbols. Sun/Mercury/Venus/Mars/Jupiter/Saturn/Moon are
// actual imagery (NASA/ESA-sourced renders and photographs, via Wikimedia Commons; local copies
// in img/planets/, credited in img/planets/CREDITS.txt). Rahu and Ketu have no physical body -
// a lunar node is literally just the point where the Moon's path crosses the Sun's, which is
// also exactly what causes an eclipse - so real eclipse photography stands in for them instead
// of an invented icon: a total solar eclipse for Rahu, a total lunar ("blood moon") eclipse for
// Ketu, keeping the same "real photo, not a symbol" rule for the two that don't have a literal
// planet to photograph.
// "small" marks the four bodies sized down in the card watermark (the three small rocky planets
// plus the Moon) - Rahu, Ketu, Jupiter, and Saturn stay at the default larger size.
// mask (optional) tightens/loosens how much of the photo shows through the circular fade,
// {inner,outer} as percentages of the image box's own radius - the fade's own centre is always
// pinned to this same planet's `position`, so it lines up with wherever the actual bright body
// sits in frame instead of a one-size-fits-all centre that only some photos happen to match.
// Sun's corona is much darker and wider than the other bodies' clean edges, so it gets a
// tighter fade to crop the dark halo out entirely rather than rely on mix-blend-mode alone.
const PLANET_PHOTO={
  Sun:{file:'sun.jpg',position:'58% 42%',mask:{inner:26,outer:48}},
  // Moon's disc nearly fills its whole square source photo, so the default fade (which assumes
  // room to fade out before the image's own edge) was instead fading across the thin black
  // margin left in the square's corners - invisible at low resting opacity, but a visible ring
  // once :hover raises opacity. Tightened to fade out well inside the disc itself.
  Moon:{file:'moon.jpg',position:'50% 50%',small:true,mask:{inner:38,outer:50}},
  Mercury:{file:'mercury.png',position:'50% 50%',small:true},
  Venus:{file:'venus.png',position:'50% 50%',small:true},
  Mars:{file:'mars.png',position:'50% 50%',small:true},
  Jupiter:{file:'jupiter.png',position:'50% 50%'},
  Saturn:{file:'saturn.png',position:'50% 45%'},
  // Rahu/Ketu are real eclipse photography (not alpha-transparent renders like the other bodies),
  // same black-background risk as Sun/Moon, tightened the same way as a preventive measure.
  Rahu:{file:'rahu.jpg',position:'50% 50%',mask:{inner:34,outer:62}},
  Ketu:{file:'ketu.jpg',position:'32% 47%',mask:{inner:34,outer:52}}
};

function youPlanetCardHtml(chartData,p){
  const d=chartData.planetData[p];
  const dignity=getDignity(p,d.sign,d.deg);
  const vargottama=chartData.navamsa.vargottama[p];
  const badges=[];
  if(dignity)badges.push(`<span class="shadbala-status sb-strong">${DIGNITY_BADGE[dignity]}</span>`);
  if(vargottama)badges.push(`<span class="rel-badge rel-friend">Vargottama</span>`);
  const photo=PLANET_PHOTO[p];
  const sizeCls=photo.small?' you-planet-bg-photo--small':'';
  const m=photo.mask||{inner:45,outer:76};
  const maskGrad=`radial-gradient(circle at ${photo.position},#000 ${m.inner}%,transparent ${m.outer}%)`;
  const photoStyle=`object-position:${photo.position};-webkit-mask-image:${maskGrad};mask-image:${maskGrad}`;
  return`<div class="shadbala-card you-planet-card">
    <img class="you-planet-bg-photo${sizeCls}" src="img/planets/${photo.file}" alt="" aria-hidden="true" style="${photoStyle}">
    <div class="you-planet-card-inner">
    <div class="shadbala-card-head">
      <div style="flex:1;min-width:0">
        <div class="shadbala-planet-name">${p}</div>
        <div class="seg-sub you-planet-meta">${signIconSvg(d.sign,13,'#a68b52',0.9)}<span>${SIGNS[d.sign]}</span><span class="you-meta-dot">·</span><span>House ${d.house}</span></div>
      </div>
      ${badges.join('')}
    </div>
    <p class="reading-text" style="margin-top:10px">${planetYouParagraph(chartData,p)}</p>
    </div>
  </div>`;
}

// The short, personalised glossary footer: what Shadbala, Avastha, and Argala each mean, plus one
// soft, wordy line of this chart's own leaning for each - no raw numbers, a plain-language bridge
// toward the full data on their respective tabs (visible in Full Jyotish mode).
function youGlossaryHtml(chartData){
  const sbEntries=SHADBALA_PLANETS.map(p=>({p,pct:chartData.shadbala[p].pct}));
  const strongest=sbEntries.reduce((a,b)=>b.pct>a.pct?b:a);
  const weakest=sbEntries.reduce((a,b)=>b.pct<a.pct?b:a);

  const avLabels=SHADBALA_PLANETS.map(p=>{
    const av=chartData.avasthas[p];
    return avasthaSummary(av.jagradadi,av.deeptadi).label;
  });
  const favCount=avLabels.filter(l=>l==='Favourable').length;
  const unfavCount=avLabels.filter(l=>l==='Unfavourable').length;
  let avLine;
  if(favCount>unfavCount&&favCount>=4)avLine="Most of your planets are settling into a bright, easy mood at birth.";
  else if(unfavCount>favCount&&unfavCount>=4)avLine="Several of your planets carry a quieter, more effortful mood at birth right now, though that's not a flaw, just a place where a little patience helps.";
  else avLine="Your planets' moods at birth land mostly in between, neither especially easy nor especially strained.";

  const argala=calcArgala(chartData.lagnaSign,chartData.houseMap)[1];

  return`<div class="you-divider"><span>✦</span></div>
  <div class="update-behind">
    <div class="update-behind-title">A little more, in one line each</div>
    <div class="update-behind-row"><strong>Shadbala</strong> is a planet's six-fold classical strength score, a sense of how forcefully it can deliver on what it promises. In this chart, ${strongest.p} carries itself with the most ease, while ${weakest.p} leans more on quieter reserves.</div>
    <div class="update-behind-row"><strong>Avastha</strong> is a planet's "mood" at birth, roughly awake, dreaming, or asleep, which colours how easily it expresses itself. ${avLine}</div>
    <div class="update-behind-row"><strong>Argala</strong> checks which houses back up or block the promise of a house, like a second layer of support or resistance. On your own House 1 (sense of self): ${argala.overall}</div>
  </div>`;
}

function renderYouTab(){
  if(!chartData)return;
  const container=document.getElementById('reading-content');
  if(!container)return;
  const ascGlyph=signIconSvg(chartData.lagnaSign,15,'#c9a24b',1);
  const opener=`<span class="you-opener-glyph">${ascGlyph}</span>Rising in ${SIGNS[chartData.lagnaSign]}${chartData.name?`, here's how each planet in ${chartData.name}'s chart comes alive`:", here's how each planet in this chart comes alive"}, sign by sign, aspect by aspect, down to its subtler Navamsa placement.`;
  container.innerHTML=`
    <p class="reading-text you-opener">${opener}</p>
    <div class="you-divider"><span>✦</span></div>
    <div class="shadbala-grid">${PLANETS.map(p=>youPlanetCardHtml(chartData,p)).join('')}</div>
    ${youGlossaryHtml(chartData)}
  `;
}
