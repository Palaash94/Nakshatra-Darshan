/* ============================================================
   PERSONAL UPDATES (DAILY / MONTHLY / YEARLY)
   Plain-language forecast blurbs, but composed rather than looked
   up: each period blends several independent, genuinely astrological
   signals so the same house showing up twice in a row never reads
   identically, AND so Daily/Monthly/Yearly each carry their own
   distinct texture instead of all three reading like the same card
   at a different length -

     1. The driving house itself (transit Moon/Sun/Muntha from the
        natal Lagna) - three hand-written openings per house, not
        one, picked by a date-based rotator.
     2. That house's own natal LORD and its classical flavour,
        phrased through one of three sentence templates.
     3. The driving planet's own NAKSHATRA right now (27 options,
        changing daily even when the house itself hasn't) - a real,
        fast-moving second signal layered under the slower house one.
     4. A closing "try this" action, three variants per house.
     5. A period-specific extra layer that exists ONLY on its own
        cadence, so the three periods can't blur together: Daily
        gets today's Panchang (Tithi + Nitya Yoga, genuinely a
        day-by-day signal); Monthly gets transiting Venus's current
        sign as a relational undertone (changes every few weeks);
        Yearly gets a full "Year in Focus" breakdown, a bespoke line
        for EACH of the six life-areas rather than one paragraph
        standing in for the whole year (calcYearlyThemeLines below).

   No Sanskrit jargon (Mahadasha/Antardasha/Varshesh) in the prose
   itself - those stay as labelled technical detail one click away
   (the Yearly card's "Behind this reading" panel, Dashas/Shadbala
   tabs), same split the You tab and Karakas already use. Pure
   calculation - no DOM. Rendered by renderUpdatesTab() in
   render-tabs.js.
   ============================================================ */

// Which of six everyday life-areas each whole-sign house from the Lagna most classically governs -
// shared across daily/monthly/yearly so the same house always reads as the same theme.
const HOUSE_THEME={1:'Health',2:'Money',3:'Career',4:'Family',5:'Relationship',6:'Health',7:'Relationship',8:'Money',9:'Travel',10:'Career',11:'Money',12:'Travel'};

// The reverse of HOUSE_THEME, grouped: every house that feeds each of the six life-areas, used to
// build the multi-area rating row (the "Today's Rating" style breakdown mainstream horoscope sites
// show alongside the headline blurb).
const THEME_HOUSES={Health:[1,6],Money:[2,8,11],Career:[3,10],Family:[4],Relationship:[5,7],Travel:[9,12]};

// Classical valence per whole-sign house from the Lagna: Trikona/Upachaya houses read as generally
// favourable, Kendras as neutral (strong, but neither good nor bad on their own), and the three
// Dusthanas (6/8/12) as classically the effortful/challenging ones. This is what actually drives the
// update card's colour, not the life-area label, so a "Health" day landing on the 6th house reads as
// effortful (amber) rather than misleadingly favourable (green) just because Health defaults gold.
const HOUSE_VALENCE={1:'neutral',2:'positive',3:'positive',4:'neutral',5:'positive',6:'challenging',7:'neutral',8:'challenging',9:'positive',10:'positive',11:'positive',12:'challenging'};
const VALENCE_SCORE={positive:1,neutral:0,challenging:-1};
const VALENCE_COLOR={positive:'#4ade80',neutral:'#c9a24b',challenging:'#e0995e'};
const VALENCE_LABEL={positive:'Favourable',neutral:'Steady',challenging:'Take it easy'};

// Compact significations per graha, reused wherever a house lord needs a plain-language flavour.
const PLANET_FLAVOR={
  Sun:'confidence and visibility',Moon:'emotional needs and home',Mars:'drive, conflict, and action',
  Mercury:'communication and logistics',Jupiter:'growth, luck, and learning',Venus:'love, beauty, and money',
  Saturn:'discipline, delay, and long-term structure',Rahu:'ambition, obsession, and unconventional paths',
  Ketu:'detachment, spirituality, and loose ends'
};

// Blends each life-area's own classical valence (averaged across its houses) with whether today's/
// this month's/this year's driving house belongs to that area (activation, weighted toward the same
// direction) and a light natal-strength tilt from that area's primary house lord's own dignity, into a
// 1-5 rating. Not a full re-run of the Life Map engine, a much smaller, period-specific cousin of it.
function calcThemeRatings(chartData,drivingHouse){
  const ratings={};
  Object.keys(THEME_HOUSES).forEach(theme=>{
    const houses=THEME_HOUSES[theme];
    let score=houses.reduce((s,h)=>s+VALENCE_SCORE[HOUSE_VALENCE[h]],0)/houses.length;
    if(houses.includes(drivingHouse))score+=VALENCE_SCORE[HOUSE_VALENCE[drivingHouse]]*0.6;
    const primaryHouse=houses[0];
    const signIdx=(chartData.lagnaSign+primaryHouse-1)%12;
    const lord=SIGN_LORD[signIdx];
    const lp=chartData.planetData[lord];
    const dignity=getDignity(lord,lp.sign,lp.deg);
    if(dignity==='exalted'||dignity==='own'||dignity==='moolatrikona')score+=0.4;
    else if(dignity==='debilitated')score-=0.4;
    ratings[theme]=Math.max(1,Math.min(5,Math.round(3+score*1.6)));
  });
  return ratings;
}

// ============================================================
// COMPOSITION HELPERS - shared by all three periods
// ============================================================

// Day-of-year (0-365), used as the daily rotator seed so the same house lands on a different opening/
// action/template every time it recurs (roughly every 2-2.5 days for the Moon), rather than looping
// through the exact same 12 fixed paragraphs forever.
function dayOfYear(d){
  const start=new Date(d.getFullYear(),0,0);
  return Math.floor((d-start)/86400000);
}
// A monotonic month counter (so "this month" rotates independently of which calendar year it's in).
function monthCounter(d){return d.getFullYear()*12+d.getMonth()}
// Deterministic array pick from any integer seed. Runs the seed through a splitmix32-style integer
// hash before reducing mod length, rather than reducing the raw seed directly - raw `seed % length`
// cycles in lockstep with small, slowly-incrementing seeds (dayOfYear, monthCounter), so with a
// 3-slot array the same line resurfaces every 3rd visit like clockwork. The hash scrambles that
// linear walk into something that looks properly shuffled, which is what actually makes a bigger
// phrase bank pay off instead of just cycling a longer, still-predictable loop. Same seed always
// yields the same output (needed so a given day's copy is stable if re-rendered), it just no longer
// looks mechanically periodic across consecutive seeds.
function pickVariant(arr,seed){
  if(arr.length<=1)return arr[0];
  let s=Math.trunc(seed)>>>0;
  s=(s+0x9e3779b9)>>>0;
  s^=s>>>16; s=Math.imul(s,0x85ebca6b)>>>0;
  s^=s>>>13; s=Math.imul(s,0xc2b2ae35)>>>0;
  s=(s^(s>>>16))>>>0;
  return arr[s%arr.length];
}

// The fast-moving second signal: whichever planet is actually driving this period (transit Moon for
// Daily, transit Sun for Monthly, the annual chart's own Moon for Yearly) has its OWN nakshatra, which
// changes on a much shorter cycle than the house does. Reuses the same NAKSHATRA_TRAITS bank the You
// tab and personality snapshot draw from, just reframed as day/period energy rather than personality.
const NAK_FLAVOR_FRAME=[
  (label,nak,trait)=>`${label}'s own nakshatra right now is ${nak.name}, ${trait}, and that quietly flavours everything else.`,
  (label,nak,trait)=>`There's a second layer too: ${label} sits in ${nak.name}, ${trait}, which colours the undertone underneath the main theme.`,
  (label,nak,trait)=>`Underneath it all, this carries ${nak.name}'s signature, ${trait}.`,
  (label,nak,trait)=>`${label} is currently moving through ${nak.name}, ${trait}, a subtle thread worth noticing alongside the main theme.`,
  (label,nak,trait)=>`Layered underneath today's headline: ${label} is in ${nak.name} right now, ${trait}.`
];
function nakshatraFlavorLine(label,nak,seed){
  const trait=NAKSHATRA_TRAITS[nak.name]||'distinctive';
  return pickVariant(NAK_FLAVOR_FRAME,seed)(label,nak,trait);
}

// Names the driving house's own natal lord and its classical flavour - the one clause that is
// genuinely tied to THIS chart rather than any generic almanac, phrased through one of three
// templates so it doesn't read identically every time the same house recurs.
const RULER_CLAUSE=[
  (ruler,flavor)=>`${ruler} rules this house for you, so expect a thread of ${flavor} running through it.`,
  (ruler,flavor)=>`This is ${ruler}'s house in your chart, so a thread of ${flavor} tends to run quietly underneath.`,
  (ruler,flavor)=>`With ${ruler} as this house's natural lord, expect ${flavor} in how it actually plays out for you specifically.`,
  (ruler,flavor)=>`${ruler}'s fingerprints are on this one, so ${flavor} shows up more than the headline theme alone would suggest.`,
  (ruler,flavor)=>`Because ${ruler} governs this house for you, ${flavor} tends to be the real story underneath whatever else is happening.`,
  (ruler,flavor)=>`${ruler} sits behind this house in your chart, lending it a quiet undertone of ${flavor} that's easy to miss if you're not looking for it.`
];
function rulerClauseLine(ruler,seed){
  return pickVariant(RULER_CLAUSE,seed)(ruler,PLANET_FLAVOR[ruler]);
}

// A short "also, today happens to be Sun/Moon/Mars..." day closer - a small, real, classical signal
// (the Vara, weekday lord) that's cheap to add and changes every single day regardless of the house.
// Three phrasings per weekday (picked via pickVariant on a house/day-derived seed) so the same weekday
// doesn't read as the exact same sentence every single week.
const WEEKDAY_FLAVOR=[
  ["It's a Sun day too, a good one to simply be seen doing the thing rather than explaining it.",
   "It's also a Sun day, lean into being seen rather than downplaying it.",
   "Underneath everything else, it's a Sun day, confidence reads as competence today more than usual."],
  ["It's a Moon day as well, so trust the mood you're actually in more than the plan you made yesterday.",
   "It's also a Moon day, whatever mood shows up first is probably the accurate one.",
   "Underneath everything else, it's a Moon day, today runs on feeling more than logic, and that's fine."],
  ["It's a Mars day underneath it all, good for direct action, less good for patience.",
   "It's also a Mars day, momentum beats hesitation today.",
   "Underneath everything else, it's a Mars day, act first and adjust rather than waiting for certainty."],
  ["It's a Mercury day too, conversations and small logistics move faster than usual if you start them.",
   "It's also a Mercury day, the message you send now lands better than the one you overthink.",
   "Underneath everything else, it's a Mercury day, small logistics untangle faster than expected."],
  ["It's a Jupiter day as well, a good one to say yes to something that stretches you slightly.",
   "It's also a Jupiter day, the generous choice tends to pay off today.",
   "Underneath everything else, it's a Jupiter day, say yes before you've fully talked yourself out of it."],
  ["It's a Venus day too, worth spending a little extra care on how things look and feel today.",
   "It's also a Venus day, a little extra care today goes further than usual.",
   "Underneath everything else, it's a Venus day, taste and affection are more visible than usual."],
  ["It's a Saturn day underneath it all, the boring, disciplined choice pays off more than the exciting one.",
   "It's also a Saturn day, the unglamorous choice quietly wins today.",
   "Underneath everything else, it's a Saturn day, patience pays a real, if delayed, dividend."]
];

// ---------------- DAILY ----------------
// Driven by transit Moon's house from the natal Lagna (changes house roughly every 2-2.5 days - the
// fastest-moving classical signal, and the one most daily-horoscope apps lean on for exactly that
// reason). Two hand-written openings per house so even a repeat visit to the same house reads fresh.
const DAILY_HOUSE_TEXT={
  1:["The Moon lights up your own sign today. Your mood is unusually visible, what you're feeling is what people will clock first, for better or worse.",
     "Today you're hard to read wrong, whatever's going on inside shows up on your face before you've decided to share it. Use that instead of fighting it.",
     "Whatever mood you're actually in today is doing double duty as your appearance to the world, so it's worth deciding on purpose which one you lead with.",
     "People will read your mood today whether you mean them to or not, so it's worth choosing which one you're actually showing.",
     "Today, how you look and how you feel are basically the same broadcast. Might as well pick the channel on purpose.",
     "You're about as 'yourself' as you'll be all week today, use it instead of smoothing it over for other people's comfort."],
  2:["Today has a practical, close-to-home pull. Money, food, family conversations, small material things carry more emotional weight than usual.",
     "Small material things feel bigger today, a bill, a meal, a family text, and each one carries more weight than it technically should.",
     "You'll notice value in the plainest terms today, what something actually costs against what it's actually worth, and the two won't always agree.",
     "A small purchase or a family remark lands harder than it should today, notice what that reaction is actually telling you about what you value.",
     "Today measures things in plain, practical terms, what's actually in the fridge, the account, the calendar, rather than in how things are supposed to look.",
     "Something close to home asks for an actual decision today, not just a feeling about one."],
  3:["Restless, chatty energy today. You want to move, message people, start something. Short bursts of effort land better than one long push.",
     "You've got more nervous energy than usual today, and it wants an outlet. A conversation you start now moves faster than you'd expect.",
     "A short burst of initiative goes further today than a long, deliberated plan, momentum is the actual asset on a day like this.",
     "You'll think of the idea faster than you'll finish explaining it today, write it down before the momentum passes to someone else's conversation.",
     "Today rewards motion over certainty, you can always correct course later, but only if you've actually started.",
     "A short, unplanned conversation does more today than a scheduled one, stay reachable."],
  4:["Home is where your attention keeps drifting today. Comfort, family, a need to just be somewhere familiar, resist the urge to overthink it.",
     "Something in you wants to close the laptop and just be somewhere familiar today. That's not laziness, it's a real need worth listening to.",
     "Underneath today's to-do list there's a quieter pull toward feeling settled, worth noticing before you mistake it for simple distraction.",
     "Today measures success by how settled you feel by evening, not by how much you got through.",
     "Something domestic quietly outranks everything else on today's list, let it, even if it wasn't on the list to begin with.",
     "You'll work better today from somewhere that actually feels like yours, even if that means leaving early to get there."],
  5:["Playful, warmer energy today. Romance, creative ideas, or just wanting to be seen, let something feel a little unearned and fun.",
     "You're more charming than usual today, whether you're trying to be or not. Let a little unearned attention land without over-explaining it.",
     "Today carries a little extra shine, romance, a creative spark, or simply the pleasure of being watched doing something you're actually good at.",
     "Today has room for something that serves no purpose except that you enjoy it, take the room.",
     "You're more magnetic than usual today, not because you're trying, resist the urge to explain it away.",
     "A creative idea shows up today wanting an audience, not just a notebook entry."],
  6:["A grittier day. Minor conflicts, health niggles, or a workload that won't stop nagging. Handle the annoying thing directly instead of around it.",
     "Today rewards the boring fix over the dramatic one. A nagging task, a small ache, a minor disagreement, handle it directly and it stops following you.",
     "Today rewards finishing the unglamorous task over starting an exciting new one, small, boring discipline compounds visibly right now.",
     "Today's actual test is whether you handle the annoying thing directly or let it fester into something bigger by the weekend.",
     "A minor ache or a minor argument is more informative than it looks today, don't dismiss either too quickly.",
     "Discipline is oddly satisfying today, lean into the checklist instead of resenting it."],
  7:["Other people are the whole story today. A partner or close collaborator's mood will shape yours more than you'd like to admit.",
     "Someone else's timing, mood, or plans quietly become the frame for your whole day today. Notice how much you're adjusting around them.",
     "Your own plans keep bending around someone else's today, worth noticing how much of that is generosity and how much is just habit.",
     "Someone else's plans are quietly setting the shape of your day today, worth noticing before you assume it was your own idea.",
     "A conversation with one specific person outweighs everything else on today's agenda.",
     "Today asks you to actually negotiate instead of just accommodating, the difference matters more than usual."],
  8:["Something feels a little charged or hidden today, an intense conversation, an unexpected cost. Don't force answers; let it surface on its own.",
     "Today has a slightly charged undertone, a conversation that goes deeper than planned, a cost you didn't budget for. Let it unfold rather than steering it.",
     "Today carries an undertone that's hard to name exactly, trust the discomfort as information today rather than rushing to explain it away.",
     "Today has an undertone that doesn't explain itself right away, let it, forcing clarity too early usually backfires.",
     "An unexpected cost or an unexpectedly honest conversation shows up today, neither is really about the surface subject.",
     "Something buried resurfaces today in a small, almost throwaway comment, pay attention to it anyway."],
  9:["Big-picture, restless energy. You want distance, meaning, a reason to believe things are heading somewhere. Even a short trip helps today.",
     "You want a bigger view today, of your life, your options, your beliefs. Even a small change of scenery does more than usual.",
     "You're pulled today toward whatever feels bigger than your usual frame, a conversation, an idea, or an actual change of scenery.",
     "Today rewards zooming out, a long walk, a different route, a conversation with someone who sees things differently than you do.",
     "A small change of scenery does more for your mood today than any amount of thinking it through would.",
     "Something you believe gets quietly tested today, not attacked, just tested, and that's worth sitting with."],
  10:["Career energy is loud today. Whatever you do gets noticed more than usual, good if you're proud of it, worth knowing if you're not.",
      "What you do today is more visible than usual, whether you meant it to be or not. Choose the version you'd actually want people to remember.",
      "Effort and visibility are unusually connected today, what you actually do is what people are going to remember you doing.",
      "Today, the work speaks louder than the explanation you'd normally give alongside it.",
      "Someone's watching how you handle today's task more closely than you'd guess, do it like they are.",
      "What you finish today is more memorable than what you promise, so finish something."],
  11:["Social, gain-oriented energy today. Networks, group plans, and money conversations move easily. Say yes to the thing you'd usually skip.",
      "Today moves through people, not solo effort. A message, an introduction, a group chat, something useful comes from simply staying social.",
      "Today moves faster through other people than through solo effort, a message sent now outperforms a plan made quietly alone.",
      "A useful idea arrives today through someone else's mouth, not your own head, stay open to it.",
      "Today's actual currency is who you talk to, not how hard you work alone.",
      "A group conversation moves something forward today that a solo effort would have stalled on."],
  12:["Quiet, low-energy day. Rest, a need to withdraw, or unfinished business from the past resurfacing. Don't schedule anything that needs your full self.",
      "Today has a low, private hum to it. Something from the past may resurface quietly, let it, but don't force a decision out of it.",
      "Today asks for less output and more input, actual rest counts as a real accomplishment today, not a day off from one.",
      "Today runs better with fewer decisions in it, cut your list down rather than pushing through all of it.",
      "Something from a while back quietly resolves itself today if you stop poking at it.",
      "Solitude does more for you today than company would, even if that feels counterintuitive."]
};
const DAILY_HOUSE_ACTION={
  1:["Lead with instinct, you're reading the room correctly today.","Say the thing before you've rehearsed it too much.","Trust the first read you get on something today.","Choose which version of your mood you're leading with today.","Let your face say what you actually mean, for once.","Don't downplay what you're obviously feeling today."],
  2:["Have the money or family conversation you've been sitting on.","Buy or fix the small thing that actually matters to you.","Notice what you're actually spending on, not just what you planned to.","Write down what today's small expense actually bought you.","Say the quiet part about money out loud, just once.","Fix the small material thing you've been ignoring."],
  3:["Send the message. Start the small thing.","Make the call instead of typing it out.","Start the small thing before you've fully planned it.","Write the idea down the second you have it.","Have the unplanned conversation instead of scheduling it for later.","Move on the idea before it cools."],
  4:["Go home earlier than planned, on purpose.","Cook the meal instead of ordering it.","Give yourself permission to leave early, on purpose.","Leave early enough to actually enjoy being home.","Let the domestic thing take priority today, on purpose.","Do one thing today just to make home feel more like yours."],
  5:["Do the thing that's fun for no reason.","Wear the thing that makes you feel a little seen.","Let yourself enjoy the attention instead of deflecting it.","Do something today purely because you enjoy it.","Show someone the thing you made.","Stop deflecting the compliment and just take it."],
  6:["Deal with the annoying task before it compounds.","Finish the task you keep starting and abandoning.","Pick the boring fix over the exciting distraction.","Fix the small thing before it becomes the big thing.","Handle the annoying conversation head-on today.","Pick the checklist over the distraction, just this once."],
  7:["Ask the other person what they actually need today.","Let them choose, just this once.","Ask for what you actually want, plainly.","Ask instead of assuming what they want.","Negotiate instead of simply accommodating today.","Notice whose plan you're actually following today."],
  8:["Sit with the discomfort instead of rushing past it.","Ask the real question instead of the safe one.","Let the uncomfortable thing sit instead of rushing to resolve it.","Let the uncomfortable thing stay unresolved a little longer.","Ask the question you've been circling.","Don't force today's undertone into an explanation yet."],
  9:["Say yes to whatever pulls you further from routine.","Read, watch, or listen to something outside your usual lane.","Choose the option that stretches your view today.","Take the different route today, literally or otherwise.","Have the conversation that stretches how you see things.","Say yes to whatever pulls you out of the usual frame."],
  10:["Put your name on the work you're proud of.","Finish and ship the thing, imperfect is fine.","Do the visible version of the work, not just the private one.","Finish the thing instead of explaining what you're about to do.","Do the visible version of today's task.","Let today's work speak instead of the pitch around it."],
  11:["Reach out to the group, not just one person.","Introduce two people who should know each other.","Send the message you're putting off.","Ask someone else's opinion before deciding alone.","Show up to the group thing you were going to skip.","Follow up on the idea someone else handed you."],
  12:["Protect a block of time to do nothing at all.","Turn your phone away for an hour, on purpose.","Let rest count as today's actual accomplishment.","Cut today's list down instead of pushing through all of it.","Spend an hour alone, deliberately.","Let the old thing resolve itself without your interference today."]
};

// Panchang flavour line (Tithi +, when notably auspicious/inauspicious, Nitya Yoga) - the one genuinely
// daily-only classical signal, reused from calcPanchang() (yogas-doshas-panchang.js), computed here
// against TODAY's Sun/Moon rather than a birth date. This is what most clearly separates Daily's texture
// from Monthly/Yearly, since a Tithi and Nitya Yoga only mean anything on a day-by-day timescale.
// Strips TITHI_TYPE_INFO's own trailing period and lower-cases its first letter so it can be spliced
// mid-sentence (as the tail of "...is Ashtami, victorious tithi, favourable for...") without leaving
// a stray ".," behind wherever a Nitya Yoga clause gets appended after it.
function lowerFirstNoPeriod(s){
  const t=s.replace(/\.\s*$/,'');
  return t.charAt(0).toLowerCase()+t.slice(1);
}
const PANCHANG_DAILY_FRAME=[
  pc=>`Today's lunar day is ${pc.tithi.name} (${pc.tithi.paksha} Paksha), ${lowerFirstNoPeriod(pc.tithi.typeInfo)}`,
  pc=>`The Panchang marks today as ${pc.tithi.name}, ${pc.tithi.paksha} Paksha, ${lowerFirstNoPeriod(pc.tithi.typeInfo)}`,
  pc=>`Today runs on ${pc.tithi.name} of the ${pc.tithi.paksha} Paksha, ${lowerFirstNoPeriod(pc.tithi.typeInfo)}`,
  pc=>`By the Panchang, today falls on ${pc.tithi.name} (${pc.tithi.paksha} Paksha), ${lowerFirstNoPeriod(pc.tithi.typeInfo)}`,
  pc=>`Today's tithi is ${pc.tithi.name} of the ${pc.tithi.paksha} Paksha, ${lowerFirstNoPeriod(pc.tithi.typeInfo)}`
];
function panchangFlavorLine(pc,seed){
  let line=pickVariant(PANCHANG_DAILY_FRAME,seed)(pc);
  if(pc.yoga.nature!=='Mixed')line+=`, underneath a ${pc.yoga.name} Yoga day, ${pc.yoga.meaning}.`;
  else line+='.';
  return line;
}

function calcDailyUpdate(chartData,refDate){
  refDate=refDate||new Date();
  const transit=calcTransitPositions(refDate);
  const moonHouseFromLagna=((transit.planetData.Moon.sign-chartData.lagnaSign+12)%12)+1;
  const moonHouseFromMoon=((transit.planetData.Moon.sign-chartData.planetData.Moon.sign+12)%12)+1;
  const theme=HOUSE_THEME[moonHouseFromLagna];
  const valence=HOUSE_VALENCE[moonHouseFromLagna];
  const doy=dayOfYear(refDate);

  let text=pickVariant(DAILY_HOUSE_TEXT[moonHouseFromLagna],doy);
  const houseLord=SIGN_LORD[(chartData.lagnaSign+moonHouseFromLagna-1)%12];
  text+=' '+rulerClauseLine(houseLord,doy+moonHouseFromLagna);
  text+=' '+nakshatraFlavorLine('The Moon',transit.planetData.Moon.nakshatra,doy+3);
  text+=' '+pickVariant(WEEKDAY_FLAVOR[refDate.getDay()],doy+moonHouseFromLagna+11);
  const panchang=calcPanchang(transit.planetData.Sun.lon,transit.planetData.Moon.lon,refDate);
  text+=' '+panchangFlavorLine(panchang,doy+7);
  if(moonHouseFromMoon===8){
    text+=" One extra note: the Moon is also passing through a quieter, low-decision stretch relative to your own Moon today, so keep today's stakes small where you can.";
  }

  const action=pickVariant(DAILY_HOUSE_ACTION[moonHouseFromLagna],doy+5);
  const ratings=calcThemeRatings(chartData,moonHouseFromLagna);
  return{theme,valence,text,action,ratings,house:moonHouseFromLagna,ruler:houseLord,nakshatra:transit.planetData.Moon.nakshatra.name};
}

// ---------------- MONTHLY ----------------
// Driven by transit Sun's house from the natal Lagna (changes house roughly monthly). The second
// signal here is the Sun's own nakshatra (which shifts two or three times within a solar month),
// rather than any dasha reference, keeping the prose free of jargon the "Behind this reading" panel
// already covers in the Yearly card.
const MONTHLY_HOUSE_TEXT={
  1:["This month puts you visibly in your own spotlight, how you show up matters more than usual, and people are forming impressions that will stick.",
     "This month, you're the variable everyone else is reacting to, your energy, your decisions, your mood. Use that instead of downplaying it.",
     "This is a month where your own name is attached to more than usual, worth deciding on purpose what you actually want it attached to.",
     "This month asks you to stop softening how visible you actually are.",
     "By month's end, whatever you led with in week one will have quietly set the tone for everything after it."],
  2:["Money and family logistics take the lead this month. Expect real conversations about what you're building and who you're building it with.",
     "Money moves through real conversations this month, not spreadsheets. What you say out loud about what you want changes what actually happens.",
     "This month, what you actually value gets tested against what you say you value, worth letting the two line back up.",
     "This month, what you're willing to say out loud about money quietly changes what actually happens with it.",
     "Expect this month to test whether your spending actually matches what you claim to value."],
  3:["An initiating, communicative month. New projects, new conversations, more moving parts than usual, momentum matters more than a perfect plan.",
     "This is a month of momentum over planning. You'll learn more from starting three things imperfectly than from perfecting one.",
     "This month favours the version of you that sends the first message, momentum builds fastest for whoever moves first.",
     "This month rewards whoever starts, three imperfect beginnings beat one perfect plan sitting on a shelf.",
     "Expect more conversations than usual this month, and more of them to actually go somewhere."],
  4:["Home and emotional footing are the month's real subject, even if your calendar says otherwise. Something wants to feel settled before you move again.",
     "Whatever's unsettled at home asks for real attention this month, not a quick fix. Something wants to actually be resolved, not just managed.",
     "This month quietly runs on how steady home feels, everything else gets easier once that particular piece settles.",
     "This month, home keeps interrupting your bigger plans until you actually deal with it.",
     "Whatever needs fixing at home this month won't stay quietly in the background much longer."],
  5:["A warmer, more expressive month, romance, creative work, or just wanting credit for something you made. Let yourself want to be noticed.",
     "This month rewards being a little more visible than comfortable, in love, in creative work, in simply being seen enjoying something.",
     "This month has real room in it for something to feel a little unearned and enjoyable, worth actually taking that room.",
     "This month has real room for something to feel indulgent and creative, take it without over-justifying it.",
     "Expect to want more credit than usual this month for something you made, ask for it."],
  6:["A month of maintenance, health, workload, and small conflicts that need direct handling rather than avoidance. Boring effort pays off disproportionately now.",
     "Small, unglamorous fixes compound this month. A habit, a health routine, a boundary, none of it looks exciting, all of it matters later.",
     "This month rewards the unglamorous, repeated version of effort over the dramatic gesture, small and consistent beats big and occasional.",
     "This month's real gains are boring, a routine, a habit, a small fix, repeated until it holds.",
     "Expect a minor conflict this month that actually needed to happen, don't smooth it over too fast."],
  7:["Partnerships carry the month. A relationship, business or personal, is asking for more clarity than you've given it recently.",
     "A specific relationship becomes the month's real subject, whether you planned for that or not. Clarity matters more than harmony right now.",
     "This month, one particular relationship keeps reasserting itself as the real subject, worth giving it the direct attention it's asking for.",
     "This month, one relationship keeps demanding more clarity than you've given it so far.",
     "Expect this month to test whether a specific partnership can hold more honesty than it currently does."],
  8:["An intense, transformative month under the surface. Shared money, a shift you didn't choose, or a truth that's been avoided, it moves now.",
     "This month has a slow-burn intensity, a shift in shared resources or a truth finally surfacing. Let it move at its own pace.",
     "This month has a charged undertone that doesn't announce itself loudly, let it surface in its own time rather than forcing it early.",
     "This month's real story is happening quietly, under the surface, give it room instead of rushing it.",
     "Expect an unexpected shift in shared resources or a long-avoided truth to move this month."],
  9:["An expansive month, travel, study, or a shift in belief about where things are headed. Say yes to the thing that stretches your view.",
     "You'll want more room to breathe this month, literally or philosophically. A change of scenery or belief does real work now.",
     "This month rewards distance, physical or mental, from your usual frame, even a small step back changes what you notice.",
     "This month rewards distance, a trip, a course, or a belief you finally let go of.",
     "Expect your sense of what's possible to widen this month, in a way you didn't plan for."],
  10:["Career takes center stage this month. Visibility is high; so is scrutiny. Whatever you're building publicly gets real momentum now.",
      "Your public output gets more attention than usual this month. Whatever you're building, more people are watching it than you think.",
      "This month, effort and reputation move together more tightly than usual, what you do now is what you'll be known for doing.",
      "This month, what you finish in public matters more than what you plan in private.",
      "Expect more eyes on your work this month than you're used to, act accordingly."],
  11:["A month for networks and income, new connections, group efforts, and gains that come through other people rather than solo effort.",
      "This is a month for showing up in rooms, digital or otherwise. Gains this month tend to arrive through people, not solo effort.",
      "This month, staying reachable matters more than working harder alone, most of what moves forward moves through someone else first.",
      "This month's momentum comes through other people more than through solo effort.",
      "Expect a useful connection this month to arrive from somewhere you weren't expecting."],
  12:["A quieter, more internal month. Good for finishing rather than starting, for rest, and for closing loops before the next cycle opens.",
      "This month asks for less doing and more finishing. Close what's open before you let yourself start something new.",
      "This month runs better on less, less output, less noise, with real rest counting as genuine progress rather than a pause from it.",
      "This month runs better on less, fewer commitments, more actual rest.",
      "Expect this month to quietly close a chapter you'd stopped actively thinking about."]
};
const MONTHLY_HOUSE_ACTION={
  1:["Make one decision publicly instead of privately this month.","Make one call you'd normally leave for later.","Decide on purpose what you want your name attached to this month.","Say out loud what you actually want people to know you for this month.","Lead with the decision instead of the explanation this month."],
  2:["Have the bigger money conversation, not the small one.","Write down what you actually want to earn, then say it out loud.","Check that what you say you value matches what you're actually spending time and money on.","Put a number on what you actually want to earn this month.","Match your spending to what you say you value, this month."],
  3:["Start the project instead of still planning it.","Pick the project you'll regret not starting.","Send the first message instead of waiting for the better opening.","Start the project you'd regret not starting this month.","Have three imperfect conversations instead of one perfect one."],
  4:["Build one routine that makes home feel steadier.","Fix the one thing at home you keep stepping around.","Let one thing at home actually get resolved this month, not just managed.","Fix the one thing at home you keep stepping around, for real this time.","Give home the attention it's been quietly asking for."],
  5:["Make time for the creative thing you keep postponing.","Show someone the creative thing you've been hiding.","Take the unearned, enjoyable thing this month is offering.","Show someone the creative thing you've been sitting on.","Ask for the credit you'd normally skip asking for."],
  6:["Fix the recurring small problem, not just today's version.","Book the appointment you keep rescheduling.","Pick the boring, repeatable fix over the dramatic gesture.","Build the routine you'll actually keep past this month.","Have the minor conflict instead of avoiding it again."],
  7:["Name what you actually want from the partnership.","Have the conversation you've been avoiding out of politeness.","Give the one relationship that keeps resurfacing the direct attention it's asking for.","Give the one relationship that keeps resurfacing real, direct attention.","Ask for more honesty than usual from someone specific."],
  8:["Don't rush the transformation, let it finish properly.","Let the hard conversation happen instead of postponing it again.","Let this month's undertone surface in its own time instead of forcing it early.","Let this month's undertone finish moving before you judge it.","Have the conversation about shared resources you've been avoiding."],
  9:["Book the trip, the course, the leap.","Say yes to the plan that takes you somewhere new.","Take the small step back that changes what you're noticing.","Book the thing that widens your sense of what's possible.","Let go of the belief this month is quietly testing."],
  10:["Put your name on the biggest thing you're doing.","Ask for the credit, the raise, or the title, out loud.","Do the version of the work you'd want to be known for.","Put your name on the biggest thing you finish this month.","Act like more people are watching your work than usual, because they are."],
  11:["Follow up with the connection you made and forgot.","Show up to the thing you were going to skip.","Stay reachable, most of this month's progress arrives through someone else.","Follow the unexpected connection this month hands you.","Stay visible in the group, not just the one-on-one."],
  12:["Close one open loop before the month ends.","Delete, archive, or finish one long-open task.","Let real rest count as this month's actual progress.","Close the chapter you'd stopped actively thinking about.","Cut one commitment this month instead of adding one."]
};

// Secondary "relational undertone" for the month - reuses transiting Venus's sign (SIGN_TRAIT_PHRASE,
// you-tab.js), the classical significator of taste, affection, and what feels good, changing roughly
// every three to four weeks. This is what most clearly differentiates Monthly's texture from Daily's
// (which leans on the much faster Panchang) and Yearly's (which leans on the annual chart itself).
const MONTHLY_VENUS_FRAME=[
  (sign,seed)=>`Underneath the headline theme, Venus is moving through ${SIGNS[sign]} this month, so ${signTraitPhrase(sign,seed)} quietly colours what actually feels good right now.`,
  (sign,seed)=>`There's a second undertone worth naming: Venus sits in ${SIGNS[sign]} this month, lending a thread of ${signTraitPhrase(sign,seed)} to how affection and taste show up.`,
  (sign,seed)=>`Venus is currently transiting ${SIGNS[sign]}, adding a quiet undertone of ${signTraitPhrase(sign,seed)} to this month's relational tone.`,
  (sign,seed)=>`This month's second signal: Venus in ${SIGNS[sign]}, which shows up as ${signTraitPhrase(sign,seed)} in what actually feels good right now.`
];
function monthlyVenusLine(sign,seed){return pickVariant(MONTHLY_VENUS_FRAME,seed)(sign,seed+31)}

function calcMonthlyUpdate(chartData,refDate){
  refDate=refDate||new Date();
  const transit=calcTransitPositions(refDate);
  const sunHouseFromLagna=((transit.planetData.Sun.sign-chartData.lagnaSign+12)%12)+1;
  const theme=HOUSE_THEME[sunHouseFromLagna];
  const valence=HOUSE_VALENCE[sunHouseFromLagna];
  const mc=monthCounter(refDate);

  let text=pickVariant(MONTHLY_HOUSE_TEXT[sunHouseFromLagna],mc);
  const houseLord=SIGN_LORD[(chartData.lagnaSign+sunHouseFromLagna-1)%12];
  text+=' '+rulerClauseLine(houseLord,mc+sunHouseFromLagna);
  text+=' '+nakshatraFlavorLine('The Sun',transit.planetData.Sun.nakshatra,mc+2);
  text+=' '+monthlyVenusLine(transit.planetData.Venus.sign,mc+6);

  const action=pickVariant(MONTHLY_HOUSE_ACTION[sunHouseFromLagna],mc+4);
  const ratings=calcThemeRatings(chartData,sunHouseFromLagna);
  return{theme,valence,text,action,ratings,house:sunHouseFromLagna,ruler:houseLord,nakshatra:transit.planetData.Sun.nakshatra.name};
}

// ---------------- YEARLY ----------------
// Driven by the Varshaphala engine (varshaphala.js): Muntha's house from the natal Lagna sets the
// year's dominant theme. The year-lord and running life-period are still folded in as a second signal
// (they genuinely shape a full year), just described in plain language rather than named as
// "Varshesh"/"Mahadasha" - those technical labels live in the "Behind this reading" panel below.
const YEARLY_HOUSE_TEXT={
  1:["This is a year about you specifically, identity, health, and how you carry yourself. Whatever you start now, you'll be personally identified with it.",
     "This is a year that puts your own name on things, your identity, your body, your choices are the headline, not the background.",
     "This year quietly makes you the headline of your own story, whatever you start now carries your name specifically.",
     "A year where you stop diffusing credit and blame both, this one is visibly yours."],
  2:["A year that circles back to money, family, and what you actually value. Expect real decisions about resources and who you share them with.",
     "This year quietly rewrites your relationship with money and the people you share resources with. Expect real, not cosmetic, change.",
     "This year quietly rewrites what you're actually willing to say out loud about money and who you share it with.",
     "Expect a real, not cosmetic, shift in what you value and what you're building toward financially."],
  3:["An effort-driven year, new initiatives, new skills, more self-directed action than usual. What you build this year, you build largely by yourself.",
     "A year built by your own hands. What grows this year grows because you personally kept showing up for it.",
     "This year is built mostly by your own hands, one imperfect start after another, rather than one perfect plan.",
     "A year that rewards showing up consistently more than it rewards any single big move."],
  4:["A homecoming year, literally or emotionally. Property, family, or a need to feel rooted somewhere takes priority over external ambition.",
     "This year pulls you toward roots, home, family, a literal or emotional return to where you actually feel steady.",
     "This year keeps pulling you back toward home, literally or emotionally, until you actually deal with it.",
     "Property, family, or simply feeling rooted takes priority over outward ambition this year."],
  5:["A creative, romantic, self-expressive year. Children, creative projects, or love take center stage, this is a year to be seen, not just productive.",
     "A year that wants you visible, in love, in creativity, in whatever you make. Holding back costs more than usual this year.",
     "This year wants you visibly enjoying something, not just producing it, that's not a distraction from the point, it is the point.",
     "Children, romance, or creative work take the lead this year, hold back and it costs you more than usual."],
  6:["A year of real work, health routines, competition, or conflicts that finally get resolved through direct effort rather than avoidance.",
     "This year is earned through unglamorous, repeated effort, work, health, discipline. What you build this way actually holds.",
     "This year's real gains are unglamorous, health, routine, discipline, work that compounds quietly.",
     "A year that resolves old conflicts through direct, repeated effort rather than one dramatic confrontation."],
  7:["A partnership year, marriage, business alliances, or major one-on-one relationships define the arc. Who you commit to matters more than usual.",
     "This year is defined by who you choose to stand next to. A partnership, business or personal, sets the tone for everything else.",
     "This year is shaped by who you choose to stand next to, professionally or personally.",
     "Expect a defining partnership this year, its tone sets the tone for most of what else happens."],
  8:["A transformative, high-stakes year. Shared resources, inheritance, or a genuine before-and-after shift. Not comfortable, but rarely wasted.",
     "A genuinely transformative year, the kind you'll look back on as a turning point, even if it doesn't feel that way while it's happening.",
     "This year moves something you didn't choose, a genuine before-and-after, uncomfortable but rarely wasted.",
     "A high-stakes, transformative year, the kind that reads very differently in hindsight than it feels in the moment."],
  9:["An expansive year, travel, higher study, or a shift in belief system. This is a year that widens your sense of what's possible.",
     "This year expands your sense of what's possible, through travel, study, or a belief that finally shifts. Say yes more than usual.",
     "This year widens what you believe is possible, through travel, study, or a shift you didn't see coming.",
     "Expect to say yes more than usual this year, and for it to actually pay off."],
  10:["A career-defining year. Public recognition, a title change, or simply becoming known for something, the arc of the year is visibly professional.",
      "A year where your public life and your private effort finally match up. What you're known for starts catching up to what you actually do.",
      "This year, your public reputation finally starts catching up to the private effort you've already put in.",
      "A career-defining year, what you're known for by its end may not match what you were known for at its start."],
  11:["A year of gain, income, networks, long-held goals finally landing. Who you know matters as much as what you know this year.",
      "This year pays out through people, networks, long-held goals finally landing with help you didn't expect. Stay reachable.",
      "This year pays out through people, long-held goals landing with help you didn't fully expect.",
      "Networks and income both move this year, largely because you stayed reachable."],
  12:["A closing, internal year. Good for finishing long-running chapters, rest, travel, or spiritual work rather than launching anything new.",
      "A quieter, closing year. Its real work is finishing old chapters properly so the next one can start clean.",
      "This year's real work is finishing properly, closing loops, not opening new ones.",
      "A quieter year that rewards rest and reflection more than it rewards new launches."]
};
const YEARLY_HOUSE_ACTION={
  1:["Make the decision that's specifically, visibly yours.","Make the choice that's unmistakably yours this year.","Own the decision that's specifically, visibly yours this year, don't diffuse the credit.","Stop softening how visible you are this year."],
  2:["Get honest about what you actually want to own.","Have the honest conversation about what you actually want to own.","Rebuild your relationship with money on your own terms this year.","Decide, out loud, who you actually want to share resources with."],
  3:["Commit to the skill you'd build even without an audience.","Commit publicly to the skill you're building.","Show up consistently this year rather than waiting for the perfect plan.","Build the thing you'd build even with no one watching."],
  4:["Invest in the place or people that make you feel rooted.","Put real time into the place or people that ground you.","Deal with the thing at home you've been circling for a while.","Let home take priority over ambition at least once this year."],
  5:["Make the creative or romantic move you've been circling.","Make the bold creative or romantic move, this year rewards it.","Let yourself be visibly seen enjoying something this year, not just producing it.","Make the bold romantic or creative move this year rewards."],
  6:["Build the routine that finally sticks.","Build the one routine you'll still have next year.","Commit to the unglamorous routine that actually compounds.","Resolve the old conflict directly instead of managing around it again."],
  7:["Choose the partnership deliberately, not by default.","Choose your people deliberately this year, not by default.","Choose your closest partnership deliberately this year, not by default.","Let this year's defining relationship set an honest tone, not a convenient one."],
  8:["Let the transformation finish before judging it.","Let this year's transformation finish before you judge it.","Let this year's transformation finish before you judge the outcome.","Face the shift you didn't choose instead of resisting it."],
  9:["Take the trip or course that changes your frame.","Take the trip, the course, or the leap that changes your frame.","Say yes to the thing that widens what you think is possible.","Take the trip, the course, or the leap this year is offering."],
  10:["Put your name on your biggest professional bet.","Put your name on your biggest professional bet this year.","Let your public reputation catch up to your actual effort this year.","Put your name on the biggest professional bet you're willing to make."],
  11:["Reconnect with the network you've let go quiet.","Reinvest in the network that's gone quiet.","Stay reachable, this year's gains arrive largely through people.","Reinvest in the long-held goal that's finally close to landing."],
  12:["Close the chapter properly before starting the next one.","Close last year's loose ends before chasing anything new.","Close old loops properly before this year ends.","Let rest count as this year's real progress, not a pause from it."]
};
// Describes the year-lord's and the running life-period's real influence without naming them - three
// phrasings, picked by the same year-counter rotator as the rest of the yearly text.
const YEARLY_INFLUENCE_CLAUSE=[
  (v,vf,m,mf)=>`This year's dominant energy is ${v}'s, expect ${vf} to shape most of what happens.`+(m?` It's also unfolding within a longer stretch of your life carrying ${mf} as the deeper undercurrent.`:''),
  (v,vf,m,mf)=>`${v} is quietly running this year, so a pull toward ${vf} touches more of it than usual.`+(m?` Underneath that, a longer chapter defined by ${mf} continues in the background.`:''),
  (v,vf,m,mf)=>`The year leans on ${v}, so a thread of ${vf} shows up more than usual.`+(m?` And it's all happening inside a bigger arc of ${mf} that's been building for a while.`:''),
  (v,vf,m,mf)=>`${v} carries this year's real weight, so ${vf} shapes more of it than the headline theme alone.`+(m?` That's unfolding inside a longer arc of ${mf}, still running quietly underneath.`:''),
  (v,vf,m,mf)=>`The year is effectively run by ${v}, expect ${vf} to show up in places you wouldn't expect it.`+(m?` A longer-running chapter of ${mf} continues underneath, largely unaffected by any single year.`:'')
];

// ---------------- YEARLY: full theme-by-theme breakdown ----------------
// The one structural difference between Yearly and Daily/Monthly: instead of a single blended
// paragraph, the Yearly card also breaks out a short, bespoke line for EACH of the six life-areas
// (not just the Muntha-driven headline one), the way a mainstream "Year Analysis" report reads -
// separate Career, Finance, Health, Family, Relationship, and Travel notes rather than one paragraph
// standing in for the whole year. Built compositionally from each theme's already-computed 1-5 rating
// (calcThemeRatings) rather than 30 fully hand-written paragraphs, so it stays honest to the chart.
// Deliberately singular-headed noun phrases throughout ("financial picture", "home life", not the
// plural "finances"/"relationships" directly) so every TIER_PHRASE verb below can stay grammatically
// singular without needing a per-theme conjugation table - the same "wrapper noun" trick already
// used elsewhere in this file (rulerClauseLine) to dodge subject-verb agreement bugs.
const THEME_VERB_NOUN={
  Health:'Your health',Money:'Your financial picture',Career:'Your career',
  Family:'Your home life',Relationship:'Your relationship life',Travel:'Your sense of travel and learning'
};
const TIER_PHRASE={
  5:['moves with real ease this year, one of the genuinely stronger threads running through it',
     "is one of this year's clear bright spots, worth actively leaning into rather than taking for granted",
     'carries real momentum this year, one of the few areas where staying out of your own way is the whole strategy',
     'is genuinely thriving this year, the kind of area worth quietly doubling down on'],
  4:["has good, steady support this year, worth building on deliberately while it's easy",
     'trends favourably this year without needing to be forced, a place where effort compounds kindly',
     "keeps compounding this year as long as you don't overthink it",
     'is in a good, low-drama place this year, mostly a matter of maintaining rather than fixing'],
  3:['holds fairly steady this year, neither a headline nor a worry, mostly background rather than a big story',
     'stays workable this year, not the year\'s main event, but not a weak point either',
     "is neither rising nor falling this year, steady enough to not need urgent attention",
     'sits in the background this year, present but not decisive either way'],
  2:['asks for more deliberate effort this year than it has lately, drifting is the actual risk here',
     'needs a bit more attention this year to avoid quietly sliding, nothing dramatic, just real upkeep',
     "is worth double-checking this year rather than assuming it's fine",
     'shows small warning signs this year that are easy to miss if you\'re not deliberately looking'],
  1:["is this year's harder thread, worth real, direct attention rather than hoping it resolves on its own",
     'carries real friction this year, the kind that rewards facing it head-on rather than working around it',
     'genuinely needs your attention this year, avoidance is the one strategy that won\'t work',
     "is this year's honest weak point, better addressed early than left to compound"]
};
function themeYearLine(theme,rating,seed){
  return`${THEME_VERB_NOUN[theme]} ${pickVariant(TIER_PHRASE[rating],seed)}.`;
}
// order matches updateRatingsHtml's own THEME order for visual consistency across the rating dots
// and this text breakdown.
const YEAR_THEME_ORDER=['Health','Money','Career','Family','Relationship','Travel'];
function calcYearlyThemeLines(ratings,seed){
  return YEAR_THEME_ORDER.map((theme,i)=>({theme,rating:ratings[theme],text:themeYearLine(theme,ratings[theme],seed+i)}));
}

function calcYearlyUpdate(chartData,refDate){
  refDate=refDate||new Date();
  const vp=calcVarshaphala(chartData,refDate);
  if(!vp)return null;
  const munthaHouseFromLagna=((vp.munthaSign-chartData.lagnaSign+12)%12)+1;
  const theme=HOUSE_THEME[munthaHouseFromLagna];
  const valence=HOUSE_VALENCE[munthaHouseFromLagna];
  const now=refDate;
  const maha=(chartData.dashas||[]).find(d=>now>=d.start&&now<d.end);
  const mahaLord=maha?DASHA_LORD_FULLNAME[maha.lord]:null;
  const yc=vp.n;

  let text=pickVariant(YEARLY_HOUSE_TEXT[munthaHouseFromLagna],yc);
  text+=' '+pickVariant(YEARLY_INFLUENCE_CLAUSE,yc+2)(vp.varshesh,PLANET_FLAVOR[vp.varshesh],mahaLord,mahaLord?PLANET_FLAVOR[mahaLord]:null);
  const annualMoonNak=getNakshatra(vp.annual.planetData.Moon.lon);
  text+=' '+nakshatraFlavorLine("This year's Moon",annualMoonNak,yc+1);

  // Extra detail for the "Behind this reading" panel - Varshesh's own dignity/house in the annual
  // chart (a strong/weak year-lord genuinely changes how forcefully its theme plays out), plus the
  // annual Moon sign (the year's emotional/instinctual undertone) and Muntha's house/theme.
  const vDig=getDignity(vp.varshesh,vp.annual.planetData[vp.varshesh].sign,vp.annual.planetData[vp.varshesh].deg);
  const varsheshDetail={house:vp.annual.planetData[vp.varshesh].house,dignity:vDig,sign:vp.annual.planetData[vp.varshesh].sign};
  const annualMoonSign=vp.annual.planetData.Moon.sign;
  const ratings=calcThemeRatings(chartData,munthaHouseFromLagna);
  const action=pickVariant(YEARLY_HOUSE_ACTION[munthaHouseFromLagna],yc+3);
  const themeLines=calcYearlyThemeLines(ratings,yc+5);

  return{theme,valence,text,action,varshaphala:vp,
    munthaHouseFromLagna,munthaTheme:theme,varsheshDetail,annualMoonSign,mahaLord,ratings,themeLines,
    house:munthaHouseFromLagna,ruler:vp.varshesh,nakshatra:annualMoonNak.name};
}
