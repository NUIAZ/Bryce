/* Adapter Designer v2 — Rule set (data) and the pure rule engine: evalRule, validate.
   Split from v1 index.html lines 1286-1379; load order matters (see index.html). */

/* =====================================================================
   RULE SET — data, not code. Each rule is a row the shop can switch off,
   retune or re-level without a developer. evalRule() is the only place
   that knows how a kind is computed; adding a kind is the one thing that
   still needs a code change.
   ===================================================================== */
var RULES = [
  {id:"R-101", on:true, level:"block", kind:"lugDrop", p:{from:8, to:5},
   title:"8 lug down to 5 lug",
   msg:"There is not enough material between the through-bolts and the pressed studs to do this safely at any thickness."},
  {id:"R-102", on:true, level:"block", kind:"lugDrop", p:{from:6, to:4},
   title:"Lug count drop too large",
   msg:"Going from {sl} lug down to {dl} lug leaves insufficient stud spacing."},
  {id:"R-110", on:true, level:"block", kind:"patternPair", p:{a:"8x200", b:"8x6.5"},
   title:"8x200 to 8x6.5",
   msg:"The bolt circles overlap through the adapter body. This conversion is not producible."},
  {id:"R-201", on:true, level:"flag", kind:"bcdReduction", p:{max:1.25},
   title:"Large bolt pattern reduction",
   msg:"Dropping {v}\" of bolt circle diameter needs a strength review before we quote."},
  {id:"R-202", on:true, level:"flag", kind:"radialGap", p:{min:0.35},
   title:"Bolt circles sit close together",
   msg:"Only {v}\" of radial separation. Our machinist will check stud-to-hole clearance."},
  {id:"R-203", on:true, level:"flag", kind:"thinConversion", p:{min:1.5},
   title:"Thin adapter for a pattern change",
   msg:"Pattern conversions under {t}\" need a stud engagement review."},
  {id:"R-301", on:true, level:"flag", kind:"lipClearance", p:{min:4},
   title:"Centring lip crowds the studs",
   msg:"Only {v} mm of wall between the wheel lip and the pressed studs. Needs a machinist check."},
  {id:"R-302", on:true, level:"flag", kind:"pocketClearance", p:{min:4},
   title:"Hub pocket crowds the through-holes",
   msg:"Only {v} mm of wall between the hub pocket and the vehicle stud holes. Confirm the hub measurement."},
  {id:"R-303", on:true, level:"flag", kind:"minWheelBore", p:{min:50},
   title:"Wheel bore unusually small",
   msg:"Under {v} mm we will confirm the measurement before cutting."}
];

var KINDS = {
  lugDrop:        {label:"Lug count drop",        unit:"lugs", field:"from/to"},
  patternPair:    {label:"Specific pattern pair", unit:"",     field:"pair"},
  bcdReduction:   {label:"Bolt circle reduction", unit:"in",   field:"max"},
  radialGap:      {label:"Radial separation",     unit:"in",   field:"min"},
  thinConversion: {label:"Thickness on a conversion", unit:"in", field:"min"},
  lipClearance:   {label:"Wheel lip clearance",   unit:"mm",   field:"min"},
  pocketClearance:{label:"Hub pocket clearance",  unit:"mm",   field:"min"},
  minWheelBore:   {label:"Minimum wheel bore",    unit:"mm",   field:"min"}
};

/* Returns substitution values when the rule trips, or null when it does not. */
function evalRule(r, d, src, dst){
  var v;
  if (r.kind === "lugDrop")
    return (src.lugs >= r.p.from && dst.lugs <= r.p.to) ? {sl:src.lugs, dl:dst.lugs} : null;
  if (r.kind === "patternPair")
    return (d.hubPattern === r.p.a && d.wheelPattern === r.p.b) ? {} : null;
  if (r.kind === "bcdReduction"){
    v = src.bcd - dst.bcd;
    return v > r.p.max ? {v:v.toFixed(2)} : null;
  }
  if (r.kind === "radialGap"){
    if (src.lugs === dst.lugs) return null;
    v = Math.abs(src.bcd - dst.bcd) / 2;
    return v < r.p.min ? {v:v.toFixed(2)} : null;
  }
  if (r.kind === "thinConversion")
    return (src.lugs !== dst.lugs && d.thickness < r.p.min) ? {t:r.p.min.toFixed(2)} : null;
  if (r.kind === "lipClearance"){
    v = (dst.bcd * 25.4 / 2) - (THREADS[d.studThread].dia / 2) - (d.wheelBore / 2);
    return v < r.p.min ? {v:v.toFixed(1)} : null;
  }
  if (r.kind === "pocketClearance"){
    v = (src.bcd * 25.4 / 2) - ((THREADS[d.vehicleThread].dia + 2.4) / 2) - (d.hubBore / 2);
    return v < r.p.min ? {v:v.toFixed(1)} : null;
  }
  if (r.kind === "minWheelBore")
    return d.wheelBore < r.p.min ? {v:r.p.min} : null;
  return null;
}

function fill(msg, sub){
  return msg.replace(/\{(\w+)\}/g, function(m, k){ return sub[k] !== undefined ? sub[k] : m; });
}

function validate(d){
  var src = PATTERNS[d.hubPattern], dst = PATTERNS[d.wheelPattern], out = [];
  RULES.forEach(function(r){
    if (!r.on) return;
    var sub = evalRule(r, d, src, dst);
    if (sub) out.push({id:r.id, level:r.level, title:r.title, body:fill(r.msg, sub)});
  });
  if (!out.length) out.push({id:"R-000", level:"ok", title:"Buildable as drawn",
    body:"Clears every rule in the current set. Standard lead time applies."});
  return out;
}
