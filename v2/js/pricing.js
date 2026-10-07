/* Adapter Designer v2 — Pricing table and priceOf (per PAIR).
   Split from v1 index.html lines 1380-1401; load order matters (see index.html). */

/* =====================================================================
   PRICING — editable in admin. base is the price per PAIR before the
   thickness multiplier and the conversion surcharge.
   ===================================================================== */
var PRICING = {
  base:  {4:70, 5:75, 6:80, 8:105},
  thick: {1:0.85, 1.25:0.92, 1.5:1.0, 2:1.12, 2.5:1.3, 3:1.45},
  conversion: 40
};

function priceOf(d, issues){
  if (issues.some(function(i){return i.level === "block"})) return {mode:"blocked"};
  if (issues.some(function(i){return i.level === "flag"}))  return {mode:"quote"};
  var src = PATTERNS[d.hubPattern], dst = PATTERNS[d.wheelPattern];
  var base = PRICING.base[Math.max(src.lugs, dst.lugs)] || 80;
  var tf = PRICING.thick[d.thickness] || 1;
  var pairRaw = base * tf;
  if (d.hubPattern !== d.wheelPattern) pairRaw += PRICING.conversion;
  var pair = Math.round(pairRaw) - 0.05;
  return {mode:"price", pair:pair, total:pair * (d.qty / 2)};
}
