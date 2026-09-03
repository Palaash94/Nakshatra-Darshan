/* ============================================================
   PERSONAL UPDATES (DAILY / MONTHLY / YEARLY)
   Short (~50-word), plain-language forecast blurbs in the style of
   mainstream astrology apps (direct second person, one dominant
   theme, a short suggested action) - but built on genuinely Vedic
   mechanics underneath: transit-Moon and transit-Sun house-from-
   Lagna for the fast/medium cadence, and the Varshaphala engine
   (varshaphala.js) for the yearly one. Pure calculation - no DOM.
   Rendered by renderUpdatesTab() in render-tabs.js.
   ============================================================ */

// Which of six everyday life-areas each whole-sign house from the Lagna most classically governs -
// shared across daily/monthly/yearly so the same house always reads as the same theme.
const HOUSE_THEME={1:'Health',2:'Money',3:'Career',4:'Family',5:'Relationship',6:'Health',7:'Relationship',8:'Money',9:'Travel',10:'Career',11:'Money',12:'Travel'};

// Compact significations per graha, reused wherever a Dasha/Varshesh lord needs a plain-language flavour.
const PLANET_FLAVOR={
  Sun:'confidence and visibility',Moon:'emotional needs and home',Mars:'drive, conflict, and action',
  Mercury:'communication and logistics',Jupiter:'growth, luck, and learning',Venus:'love, beauty, and money',
  Saturn:'discipline, delay, and long-term structure',Rahu:'ambition, obsession, and unconventional paths',
  Ketu:'detachment, spirituality, and loose ends'
};

// ---------------- DAILY ----------------
// Driven by transit Moon's house from the natal Lagna (changes house roughly every 2-2.5 days - the
// fastest-moving classical signal, and the one most daily-horoscope apps lean on for exactly that reason).
const DAILY_HOUSE_TEXT={
  1:"The Moon lights up your own sign today. Your mood is unusually visible — what you're feeling is what people will clock first, for better or worse.",
  2:"Today has a practical, close-to-home pull. Money, food, family conversations — small material things carry more emotional weight than usual.",
  3:"Restless, chatty energy today. You want to move, message people, start something. Short bursts of effort land better than one long push.",
  4:"Home is where your attention keeps drifting today. Comfort, family, a need to just be somewhere familiar — resist the urge to overthink it.",
  5:"Playful, warmer energy today. Romance, creative ideas, or just wanting to be seen — let something feel a little unearned and fun.",
  6:"A grittier day. Minor conflicts, health niggles, or a workload that won't stop nagging. Handle the annoying thing directly instead of around it.",
  7:"Other people are the whole story today. A partner or close collaborator's mood will shape yours more than you'd like to admit.",
  8:"Something feels a little charged or hidden today — an intense conversation, an unexpected cost. Don't force answers; let it surface on its own.",
  9:"Big-picture, restless energy. You want distance, meaning, a reason to believe things are heading somewhere. Even a short trip helps today.",
  10:"Career energy is loud today. Whatever you do gets noticed more than usual — good if you're proud of it, worth knowing if you're not.",
  11:"Social, gain-oriented energy today. Networks, group plans, and money conversations move easily. Say yes to the thing you'd usually skip.",
  12:"Quiet, low-energy day. Rest, a need to withdraw, or unfinished business from the past resurfacing. Don't schedule anything that needs your full self."
};
const DAILY_HOUSE_ACTION={
  1:"Lead with instinct — you're reading the room correctly today.",
  2:"Have the money or family conversation you've been sitting on.",
  3:"Send the message. Start the small thing.",
  4:"Go home earlier than planned, on purpose.",
  5:"Do the thing that's fun for no reason.",
  6:"Deal with the annoying task before it compounds.",
  7:"Ask the other person what they actually need today.",
  8:"Sit with the discomfort instead of rushing past it.",
  9:"Say yes to whatever pulls you further from routine.",
  10:"Put your name on the work you're proud of.",
  11:"Reach out to the group, not just one person.",
  12:"Protect a block of time to do nothing at all."
};

function calcDailyUpdate(chartData,refDate){
  refDate=refDate||new Date();
  const transit=calcTransitPositions(refDate);
  const moonHouseFromLagna=((transit.planetData.Moon.sign-chartData.lagnaSign+12)%12)+1;
  const moonHouseFromMoon=((transit.planetData.Moon.sign-chartData.planetData.Moon.sign+12)%12)+1;
  const theme=HOUSE_THEME[moonHouseFromLagna];
  let text=DAILY_HOUSE_TEXT[moonHouseFromLagna];
  if(moonHouseFromMoon===8){
    text+=" One extra note: the Moon is also crossing your Chandrashtama point today — a classically low-key, low-decision window, so keep today's stakes small where you can.";
  }
  return{theme,text,action:DAILY_HOUSE_ACTION[moonHouseFromLagna]};
}

// ---------------- MONTHLY ----------------
// Driven by transit Sun's house from the natal Lagna (changes house roughly monthly), blended with
// the currently-running Antardasha lord for a second, slower-moving layer underneath the month's theme.
const MONTHLY_HOUSE_TEXT={
  1:"This month puts you visibly in your own spotlight — how you show up matters more than usual, and people are forming impressions that will stick.",
  2:"Money and family logistics take the lead this month. Expect real conversations about what you're building and who you're building it with.",
  3:"An initiating, communicative month. New projects, new conversations, more moving parts than usual — momentum matters more than a perfect plan.",
  4:"Home and emotional footing are the month's real subject, even if your calendar says otherwise. Something wants to feel settled before you move again.",
  5:"A warmer, more expressive month — romance, creative work, or just wanting credit for something you made. Let yourself want to be noticed.",
  6:"A month of maintenance — health, workload, and small conflicts that need direct handling rather than avoidance. Boring effort pays off disproportionately now.",
  7:"Partnerships carry the month. A relationship, business or personal, is asking for more clarity than you've given it recently.",
  8:"An intense, transformative month under the surface. Shared money, a shift you didn't choose, or a truth that's been avoided — it moves now.",
  9:"An expansive month — travel, study, or a shift in belief about where things are headed. Say yes to the thing that stretches your view.",
  10:"Career takes center stage this month. Visibility is high; so is scrutiny. Whatever you're building publicly gets real momentum now.",
  11:"A month for networks and income — new connections, group efforts, and gains that come through other people rather than solo effort.",
  12:"A quieter, more internal month. Good for finishing rather than starting, for rest, and for closing loops before the next cycle opens."
};
const MONTHLY_HOUSE_ACTION={
  1:"Make one decision publicly instead of privately this month.",
  2:"Have the bigger money conversation, not the small one.",
  3:"Start the project instead of still planning it.",
  4:"Build one routine that makes home feel steadier.",
  5:"Make time for the creative thing you keep postponing.",
  6:"Fix the recurring small problem, not just today's version.",
  7:"Name what you actually want from the partnership.",
  8:"Don't rush the transformation — let it finish properly.",
  9:"Book the trip, the course, the leap.",
  10:"Put your name on the biggest thing you're doing.",
  11:"Follow up with the connection you made and forgot.",
  12:"Close one open loop before the month ends."
};

function calcMonthlyUpdate(chartData,refDate){
  refDate=refDate||new Date();
  const transit=calcTransitPositions(refDate);
  const sunHouseFromLagna=((transit.planetData.Sun.sign-chartData.lagnaSign+12)%12)+1;
  const theme=HOUSE_THEME[sunHouseFromLagna];
  const now=refDate;
  const maha=(chartData.dashas||[]).find(d=>now>=d.start&&now<d.end);
  const antar=maha?(maha.antardashas||[]).find(a=>now>=a.start&&now<a.end):null;
  const subLord=antar?DASHA_LORD_FULLNAME[antar.lord]:(maha?DASHA_LORD_FULLNAME[maha.lord]:null);
  let text=MONTHLY_HOUSE_TEXT[sunHouseFromLagna];
  if(subLord)text+=` Underneath it, you're running a ${subLord} period — ${PLANET_FLAVOR[subLord]} colour everything else this month.`;
  return{theme,text,action:MONTHLY_HOUSE_ACTION[sunHouseFromLagna]};
}

// ---------------- YEARLY ----------------
// Driven by the Varshaphala engine (varshaphala.js): Muntha's house from the natal Lagna sets the
// year's dominant theme, blended with the Varshesh (year lord) and the current Mahadasha for the
// deeper running current underneath the year.
const YEARLY_HOUSE_TEXT={
  1:"This is a year about you specifically — identity, health, and how you carry yourself. Whatever you start now, you'll be personally identified with it.",
  2:"A year that circles back to money, family, and what you actually value. Expect real decisions about resources and who you share them with.",
  3:"An effort-driven year — new initiatives, new skills, more self-directed action than usual. What you build this year, you build largely by yourself.",
  4:"A homecoming year, literally or emotionally. Property, family, or a need to feel rooted somewhere takes priority over external ambition.",
  5:"A creative, romantic, self-expressive year. Children, creative projects, or love take center stage — this is a year to be seen, not just productive.",
  6:"A year of real work — health routines, competition, or conflicts that finally get resolved through direct effort rather than avoidance.",
  7:"A partnership year — marriage, business alliances, or major one-on-one relationships define the arc. Who you commit to matters more than usual.",
  8:"A transformative, high-stakes year. Shared resources, inheritance, or a genuine before-and-after shift. Not comfortable, but rarely wasted.",
  9:"An expansive year — travel, higher study, or a shift in belief system. This is a year that widens your sense of what's possible.",
  10:"A career-defining year. Public recognition, a title change, or simply becoming known for something — the arc of the year is visibly professional.",
  11:"A year of gain — income, networks, long-held goals finally landing. Who you know matters as much as what you know this year.",
  12:"A closing, internal year. Good for finishing long-running chapters, rest, travel, or spiritual work rather than launching anything new."
};
const YEARLY_HOUSE_ACTION={
  1:"Make the decision that's specifically, visibly yours.",
  2:"Get honest about what you actually want to own.",
  3:"Commit to the skill you'd build even without an audience.",
  4:"Invest in the place or people that make you feel rooted.",
  5:"Make the creative or romantic move you've been circling.",
  6:"Build the routine that finally sticks.",
  7:"Choose the partnership deliberately, not by default.",
  8:"Let the transformation finish before judging it.",
  9:"Take the trip or course that changes your frame.",
  10:"Put your name on your biggest professional bet.",
  11:"Reconnect with the network you've let go quiet.",
  12:"Close the chapter properly before starting the next one."
};

function calcYearlyUpdate(chartData,refDate){
  refDate=refDate||new Date();
  const vp=calcVarshaphala(chartData,refDate);
  if(!vp)return null;
  const munthaHouseFromLagna=((vp.munthaSign-chartData.lagnaSign+12)%12)+1;
  const theme=HOUSE_THEME[munthaHouseFromLagna];
  const now=refDate;
  const maha=(chartData.dashas||[]).find(d=>now>=d.start&&now<d.end);
  const mahaLord=maha?DASHA_LORD_FULLNAME[maha.lord]:null;
  let text=YEARLY_HOUSE_TEXT[munthaHouseFromLagna];
  text+=` This year's Varshesh (year lord) is ${vp.varshesh} — expect ${PLANET_FLAVOR[vp.varshesh]} to shape how it plays out`;
  text+=mahaLord?`, running underneath your longer ${mahaLord} Mahadasha.`:'.';

  // Extra detail for the "Behind this reading" panel - Varshesh's own dignity/house in the annual
  // chart (a strong/weak year-lord genuinely changes how forcefully its theme plays out), plus the
  // annual Moon sign (the year's emotional/instinctual undertone) and Muntha's house/theme.
  const vDig=getDignity(vp.varshesh,vp.annual.planetData[vp.varshesh].sign,vp.annual.planetData[vp.varshesh].deg);
  const varsheshDetail={house:vp.annual.planetData[vp.varshesh].house,dignity:vDig,sign:vp.annual.planetData[vp.varshesh].sign};
  const annualMoonSign=vp.annual.planetData.Moon.sign;

  return{theme,text,action:YEARLY_HOUSE_ACTION[munthaHouseFromLagna],varshaphala:vp,
    munthaHouseFromLagna,munthaTheme:theme,varsheshDetail,annualMoonSign,mahaLord};
}
