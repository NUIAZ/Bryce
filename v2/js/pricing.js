/* Adapter Designer v2 — pricing (per PAIR, like the store: one price = a set of 2).

   A table, not a formula: one price per build type × lug count × thickness, each the
   median of the matching products on customwheeladapters.com (same business), lug-centric,
   pulled 2026-10-07 from 6,877 store variants. Hub-centric adds a per-lug-count surcharge,
   also from the store. Blank (null) cells are sizes the store doesn't sell in enough
   volume to price — those go to quote rather than guess.

   Measured against every store price it covers: median 3.9% off, 85% within 20%
   (the old formula was 34% under). Editable in Admin, like the rules. */

var PRICE_THICK = [0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3, 3.5, 4];   /* inches — the store's options */
var PRICE_LUGS = [4, 5, 6, 8, 10];
var PRICE_KINDS = [["spacer", "Spacer"], ["one", "One-piece adapter"], ["two", "Two-piece adapter"]];

var PRICING = {
  source:"customwheeladapters.com · 6,877 variants · 2026-10-07",
  table:{
    spacer:{
      4:[106.99, 117.99, 128.99, 133.99, 139.99, 144.99, 171.99, 192.99, 219.99, 235.99],
      5:[117.99, 120.99, 126.99, 132.99, 141.99, 150.99, 180.99, 205.99, 223.99, 261.99],
      6:[124.99, 128.99, 138.99, 148.99, 158.99, 168.99, 188.99, 217.99, 240.99, 278.99],
      8:[96.99, 133.99, 154.99, 169.99, 179.99, 209.99, 242.99, 249.99, 255.99, 288.99],
      10:[null, null, null, null, null, null, null, null, null, null]
    },
    one:{
      4:[106.99, 117.99, 128.99, 133.99, 139.99, 144.99, 171.99, 192.99, 219.99, 235.99],
      5:[102.99, 105.99, 115.99, 120.99, 125.99, 130.99, 154.99, 173.99, 197.99, 211.99],
      6:[117.99, 117.99, 117.99, 121.99, 125.99, 130.99, 154.99, 173.99, 197.99, 211.99],
      8:[null, 154.99, 163.99, 174.99, 189.99, 203.99, 265.99, 284.99, 317.99, 338.99],
      10:[null, null, null, null, null, null, null, null, null, null]
    },
    two:{                        /* the store sells two-piece from 1.5" */
      4:[null, null, null, 189.99, 195.99, 200.99, 243.99, 266.99, null, null],
      5:[null, null, null, 189.99, 195.99, 200.99, 243.99, 266.99, null, null],
      6:[null, null, null, 195.99, 203.99, 207.99, 255.99, 281.99, null, null],
      8:[null, null, null, 191.99, 208.99, 218.99, 241.99, 278.99, 442.99, 442.99],
      10:[null, null, null, null, null, null, null, null, null, null]
    }
  },
  hubCentric:{4:38, 5:39, 6:44, 8:106, 10:45}    /* added per pair */
};

/* spacer: same pattern both sides · one/two: what the geometry decided (clockOf). */
function priceKind(d){
  if (d.hubPattern === d.wheelPattern) return "spacer";
  return clockOf(d).onePiece ? "one" : "two";
}

function priceOf(d, issues){
  if (issues.some(function(i){return i.level === "block"})) return {mode:"blocked"};
  if (issues.some(function(i){return i.level === "flag"}))  return {mode:"quote", why:"flag"};
  var src = PATTERNS[d.hubPattern], dst = PATTERNS[d.wheelPattern];
  var kind = priceKind(d), lugs = Math.max(src.lugs, dst.lugs);
  var row = PRICING.table[kind][lugs], i = PRICE_THICK.indexOf(d.thickness);
  var base = row && i > -1 ? row[i] : null;
  if (base === null || base === undefined) return {mode:"quote", why:"size", kind:kind};
  var pair = base + (d.hubCentric ? (PRICING.hubCentric[lugs] || 0) : 0);
  return {mode:"price", pair:pair, total:pair * (d.qty / 2), kind:kind};
}
