/* ============================================================
   TIMEZONE LOOKUP (no external API / no key required)
   Determines a standard UTC offset from a city's ISO country code
   (as returned by Nominatim) plus longitude, then snaps to the
   nearest available <option> in the timezone <select>.

   Notes:
   - Uses STANDARD (winter / non-DST) offsets throughout, since the
     app's dropdown only ever shows fixed offsets, not DST-aware ones,
     and Vedic chart math needs a fixed numeric UTC offset anyway.
   - Most countries observe one offset nationwide, so a simple
     country-code -> offset table covers the large majority of cases.
   - A handful of geographically wide countries (US, Canada, Russia,
     Australia, Brazil, Mexico, Indonesia, Mongolia, Kazakhstan, DR
     Congo) have more than one standard offset; for these, longitude
     bands (and for Australia, latitude for the half-hour zone) refine
     the result.
   - If a country isn't in the table, we fall back to a plain
     15-degrees-per-hour solar estimate from longitude.
   ============================================================ */

// Single (or overwhelmingly dominant) standard-time offset by ISO 3166-1 alpha-2 country code.
// Countries that need finer-than-country resolution are intentionally omitted here
// and handled in MULTI_ZONE_COUNTRIES below instead.
const COUNTRY_TZ_OFFSET={
  AD:1,AE:4,AF:4.5,AG:-4,AI:-4,AL:1,AM:4,AO:1,AQ:0,AR:-3,AS:-11,AT:1,AU:null,AW:-4,AX:2,AZ:4,
  BA:1,BB:-4,BD:6,BE:1,BF:0,BG:2,BH:3,BI:2,BJ:1,BL:-4,BM:-4,BN:8,BO:-4,BQ:-4,BR:null,BS:-5,BT:6,BV:0,BW:2,BY:3,BZ:-6,
  CA:null,CC:6.5,CD:null,CF:1,CG:1,CH:1,CI:0,CK:-10,CL:-4,CM:1,CN:8,CO:-5,CR:-6,CU:-5,CV:-1,CW:-4,CX:7,CY:2,CZ:1,
  DE:1,DJ:3,DK:1,DM:-4,DO:-4,DZ:1,
  EC:-5,EE:2,EG:2,EH:0,ER:3,ES:1,ET:3,
  FI:2,FJ:12,FK:-3,FM:11,FO:0,FR:1,
  GA:1,GB:0,GD:-4,GE:4,GF:-3,GG:0,GH:0,GI:1,GL:-3,GM:0,GN:0,GP:-4,GQ:1,GR:2,GS:-2,GT:-6,GU:10,GW:0,GY:-4,
  HK:8,HM:5,HN:-6,HR:1,HT:-5,HU:1,
  ID:null,IE:0,IL:2,IM:0,IN:5.5,IO:6,IQ:3,IR:3.5,IS:0,IT:1,
  JE:0,JM:-5,JO:2,JP:9,
  KE:3,KG:6,KH:7,KI:13,KM:3,KN:-4,KP:9,KR:9,KW:3,KY:-5,KZ:5,
  LA:7,LB:2,LC:-4,LI:1,LK:5.5,LR:0,LS:2,LT:2,LU:1,LV:2,LY:2,
  MA:0,MC:1,MD:2,ME:1,MF:-4,MG:3,MH:12,MK:1,ML:0,MM:6.5,MN:null,MO:8,MP:10,MQ:-4,MR:0,MS:-4,MT:1,MU:4,MV:5,MW:2,MX:null,MY:8,MZ:2,
  NA:2,NC:11,NE:1,NF:11,NG:1,NI:-6,NL:1,NO:1,NP:5.75,NR:12,NU:-11,NZ:12,
  OM:4,
  PA:-5,PE:-5,PF:-10,PG:10,PH:8,PK:5,PL:1,PM:-3,PN:-8,PR:-4,PS:2,PT:0,PW:9,PY:-4,
  QA:3,
  RE:4,RO:2,RS:1,RU:null,RW:2,
  SA:3,SB:11,SC:4,SD:2,SE:1,SG:8,SH:0,SI:1,SJ:1,SK:1,SL:0,SM:1,SN:0,SO:3,SR:-3,SS:2,ST:0,SV:-6,SX:-4,SY:2,SZ:2,
  TC:-5,TD:1,TF:5,TG:0,TH:7,TJ:5,TK:13,TL:9,TM:5,TN:1,TO:13,TR:3,TT:-4,TV:12,TW:8,TZ:3,
  UA:2,UG:3,UM:-11,US:null,UY:-3,UZ:5,
  VA:1,VC:-4,VE:-4,VG:-4,VI:-4,VN:7,VU:11,
  WF:12,WS:13,
  YE:3,YT:3,
  ZA:2,ZM:2,ZW:2
};

// Countries spanning multiple standard offsets: longitude (and where noted, latitude) bands.
// Bands are checked in order; first match wins. minLat/maxLat are optional refinements.
const MULTI_ZONE_COUNTRIES={
  US:[ // CONUS + Alaska + Hawaii
    {minLon:-180,maxLon:-153,minLat:-90,maxLat:25,offset:-10},  // Hawaii (low latitude)
    {minLon:-180,maxLon:-141,offset:-9},                        // remaining far-west = Alaska
    {minLon:-141,maxLon:-115,offset:-8},                        // Pacific (incl. SE Alaska panhandle, approximated)
    {minLon:-115,maxLon:-102,offset:-7},                        // Mountain
    {minLon:-102,maxLon:-87,offset:-6},                         // Central
    {minLon:-87,maxLon:-66,offset:-5}                           // Eastern
  ],
  CA:[
    {minLon:-180,maxLon:-141,offset:-9},
    {minLon:-141,maxLon:-120,offset:-8},
    {minLon:-120,maxLon:-102,offset:-7},
    {minLon:-102,maxLon:-90,offset:-6},
    {minLon:-90,maxLon:-68,offset:-5},
    {minLon:-68,maxLon:-52,offset:-4},
    {minLon:-52,maxLon:-40,offset:-3.5}
  ],
  RU:[
    {minLon:19,maxLon:22.8,offset:2},    // Kaliningrad exclave
    {minLon:22.8,maxLon:52.5,offset:3},  // Moscow Time (MSK) band, incl. most of western Russia
    {minLon:52.5,maxLon:67.5,offset:5},  // Yekaterinburg (Samara at 4 is a small pocket, approximated)
    {minLon:67.5,maxLon:82.5,offset:6},  // Omsk
    {minLon:82.5,maxLon:97.5,offset:7},  // Krasnoyarsk/Novosibirsk
    {minLon:97.5,maxLon:112.5,offset:8}, // Irkutsk
    {minLon:112.5,maxLon:127.5,offset:9},// Yakutsk
    {minLon:127.5,maxLon:142.5,offset:10},// Vladivostok
    {minLon:142.5,maxLon:157.5,offset:11},// Magadan/Sakhalin
    {minLon:157.5,maxLon:180,offset:12}  // Kamchatka
  ],
  AU:[ // longitude bands; ACST (+9:30) belt roughly 129-141E, AEST east of that, AWST west
    {minLon:-180,maxLon:129,offset:8},
    {minLon:129,maxLon:141,offset:9.5},
    {minLon:141,maxLon:180,offset:10}
  ],
  BR:[
    {minLon:-180,maxLon:-67.5,offset:-5},
    {minLon:-67.5,maxLon:-52.5,offset:-4},
    {minLon:-52.5,maxLon:-30,offset:-3},
    {minLon:-30,maxLon:0,offset:-2}
  ],
  MX:[ // Note: longitude alone can't capture Quintana Roo's political UTC-5 (it falls in the -6 band geographically);
       // this is an acknowledged approximation limitation for a no-API lookup.
    {minLon:-180,maxLon:-115,offset:-8}, // Baja California
    {minLon:-115,maxLon:-105,offset:-7}, // Sonora / Pacific states
    {minLon:-105,maxLon:-86,offset:-6}   // Centro (bulk of the country)
  ],
  ID:[
    {minLon:-180,maxLon:109,offset:7},
    {minLon:109,maxLon:125,offset:8},
    {minLon:125,maxLon:180,offset:9}
  ],
  MN:[
    {minLon:-180,maxLon:100,offset:7},
    {minLon:100,maxLon:180,offset:8}
  ],
  CD:[
    {minLon:-180,maxLon:22.5,offset:1},
    {minLon:22.5,maxLon:180,offset:2}
  ]
};

// Available offsets in the app's <select> dropdown, used to snap a computed offset
// to the nearest selectable value.
const AVAILABLE_TZ_OFFSETS=[-12,-11,-10,-9.5,-9,-8,-7,-6,-5,-4,-3.5,-3,-2,-1,0,1,2,3,3.5,4,4.5,5,5.5,5.75,6,6.5,7,8,8.75,9,9.5,10,10.5,11,12,12.75,13,14];

function snapToAvailableOffset(rawOffset){
  let closest=AVAILABLE_TZ_OFFSETS[0],minDiff=Math.abs(rawOffset-closest);
  for(const opt of AVAILABLE_TZ_OFFSETS){
    const diff=Math.abs(rawOffset-opt);
    if(diff<minDiff){minDiff=diff;closest=opt}
  }
  return closest;
}

// Estimate UTC offset purely from longitude (15 degrees per hour), used as a last-resort fallback.
function longitudeOffsetEstimate(lon){
  return snapToAvailableOffset(lon/15);
}

// Resolve UTC offset for a given country code + coordinates.
function resolveTimezoneOffset(countryCode,lat,lon){
  if(!countryCode)return longitudeOffsetEstimate(lon);
  const cc=countryCode.toUpperCase();
  const multi=MULTI_ZONE_COUNTRIES[cc];
  if(multi){
    for(const band of multi){
      const lonMatch=lon>=band.minLon&&lon<band.maxLon;
      const latMatch=(band.minLat===undefined||lat>=band.minLat)&&(band.maxLat===undefined||lat<band.maxLat);
      if(lonMatch&&latMatch){
        return snapToAvailableOffset(band.offsetOverride!==undefined?band.offsetOverride:band.offset);
      }
    }
    // No band matched (shouldn't normally happen) - fall through to longitude estimate
    return longitudeOffsetEstimate(lon);
  }
  const single=COUNTRY_TZ_OFFSET[cc];
  if(single!==undefined&&single!==null)return snapToAvailableOffset(single);
  return longitudeOffsetEstimate(lon);
}

// Sets the given <select id="tz..."> element's value to the resolved offset, if that exact
// option exists (it always will, since resolveTimezoneOffset snaps to AVAILABLE_TZ_OFFSETS).
function applyTimezoneToSelect(selectId,countryCode,lat,lon){
  const offset=resolveTimezoneOffset(countryCode,lat,lon);
  const sel=document.getElementById(selectId);
  if(!sel)return;
  // Match by numeric value rather than string, to tolerate "5" vs "5.0" formatting
  let matched=false;
  for(const opt of sel.options){
    if(parseFloat(opt.value)===offset){opt.selected=true;matched=true;break}
  }
  if(!matched&&sel.options.length){
    // Extremely defensive fallback: pick the option whose value is numerically closest
    let best=sel.options[0],bestDiff=Math.abs(parseFloat(best.value)-offset);
    for(const opt of sel.options){
      const diff=Math.abs(parseFloat(opt.value)-offset);
      if(diff<bestDiff){bestDiff=diff;best=opt}
    }
    best.selected=true;
  }
}
