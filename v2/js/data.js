/* Adapter Designer v2 — Patterns, threads, fitment table, demo submissions, wizard state.
   Split from v1 index.html lines 1090-1285; load order matters (see index.html). */

/* ---------------------------------------------------------------
   Structure maps 1:1 to React components when this gets ported:
     Rail        -> <StepRail steps current onSelect />
     renderStep  -> <VehicleStep/> <WheelStep/> <AdapterStep/> <ReviewStep/>
     validate    -> useValidation(design)  [pure, no DOM]
     priceOf     -> usePricing(design, issues)  [pure, no DOM]
     faceSvg     -> <FaceDrawing design />  [pure, returns markup]
   validate/priceOf/faceSvg touch no DOM, so they port unchanged.
----------------------------------------------------------------*/

/* Bolt patterns: lugs + bolt circle diameter in inches. */
var PATTERNS = {
  "4x100":   {lugs:4, bcd:3.937,  label:"4x100"},
  "4x4.5":   {lugs:4, bcd:4.5,    label:"4x4.5 (4x114.3)"},
  "5x100":   {lugs:5, bcd:3.937,  label:"5x100"},
  "5x4.5":   {lugs:5, bcd:4.5,    label:"5x4.5 (5x114.3)"},
  "5x4.75":  {lugs:5, bcd:4.75,   label:"5x4.75 (5x120.65)"},
  "5x120":   {lugs:5, bcd:4.724,  label:"5x120"},
  "5x5":     {lugs:5, bcd:5.0,    label:"5x5 (5x127)"},
  "5x5.5":   {lugs:5, bcd:5.5,    label:"5x5.5 (5x139.7)"},
  "5x150":   {lugs:5, bcd:5.906,  label:"5x150"},
  "5x135":   {lugs:5, bcd:5.315,  label:"5x135"},
  "6x5.5":   {lugs:6, bcd:5.5,    label:"6x5.5 (6x139.7)"},
  "6x135":   {lugs:6, bcd:5.315,  label:"6x135"},
  "8x6.5":   {lugs:8, bcd:6.5,    label:"8x6.5 (8x165.1)"},
  "8x170":   {lugs:8, bcd:6.693,  label:"8x170"},
  "8x180":   {lugs:8, bcd:7.087,  label:"8x180"},
  "8x200":   {lugs:8, bcd:7.874,  label:"8x200"}
};
var THREADS = {
  "12x1.5":  {dia:12.0, label:"12x1.5"},
  "12x1.25": {dia:12.0, label:"12x1.25"},
  "14x1.5":  {dia:14.0, label:"14x1.5"},
  "14x2.0":  {dia:14.0, label:"14x2.0"},
  "1/2-20":  {dia:12.7, label:'1/2"-20'},
  "9/16-18": {dia:14.3, label:'9/16"-18'}
};
var THICKNESS = [0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3, 3.5, 4];   /* the store's options */

/* =====================================================================
   FITMENT TABLE v0.1 — SEED DATA, NOT VERIFIED.
   Every row needs sign-off from the shop before this ships. In production
   this should be generated from 28 years of order history, which is a far
   better source than any table typed by hand.
   p = hub bolt pattern · b = hub bore (mm) · t = vehicle stud thread
   ===================================================================== */
var VEHICLES = [
  {mk:"Chevrolet", md:"Silverado 1500",      yr:"1999–2018", p:"6x5.5", b:78.1,  t:"14x1.5"},
  {mk:"Chevrolet", md:"Silverado 1500",      yr:"2019–2026", p:"6x5.5", b:78.1,  t:"14x1.5"},
  {mk:"Chevrolet", md:"Silverado 2500/3500", yr:"2001–2010", p:"8x6.5", b:116.7, t:"14x1.5"},
  {mk:"Chevrolet", md:"Silverado 2500/3500", yr:"2011–2026", p:"8x180", b:124.2, t:"14x1.5"},
  {mk:"Chevrolet", md:"Tahoe / Suburban",    yr:"2000–2026", p:"6x5.5", b:78.1,  t:"14x1.5"},
  {mk:"Ford",      md:"F-150",               yr:"2004–2014", p:"6x135", b:87.1,  t:"14x2.0"},
  {mk:"Ford",      md:"F-150",               yr:"2015–2026", p:"6x135", b:87.1,  t:"14x1.5"},
  {mk:"Ford",      md:"F-250 / F-350",       yr:"1999–2004", p:"8x170", b:125.0, t:"14x2.0"},
  {mk:"Ford",      md:"F-250 / F-350",       yr:"2005–2026", p:"8x170", b:125.0, t:"14x1.5"},
  {mk:"Ford",      md:"Bronco",              yr:"2021–2026", p:"6x5.5", b:93.1,  t:"14x1.5"},
  {mk:"Ford",      md:"Mustang",             yr:"2005–2026", p:"5x4.5", b:70.5,  t:"1/2-20"},
  {mk:"Ram",       md:"1500",                yr:"2002–2010", p:"5x5.5", b:77.8,  t:"14x1.5"},
  {mk:"Ram",       md:"1500",                yr:"2012–2026", p:"5x5.5", b:77.8,  t:"14x1.5"},
  {mk:"Ram",       md:"2500 / 3500",         yr:"1994–2010", p:"8x6.5", b:121.3, t:"9/16-18"},
  {mk:"Ram",       md:"2500 / 3500",         yr:"2013–2026", p:"8x6.5", b:121.3, t:"14x1.5"},
  {mk:"Jeep",      md:"Wrangler JL / Gladiator", yr:"2018–2026", p:"5x5",   b:71.5, t:"1/2-20"},
  {mk:"Jeep",      md:"Wrangler JK",         yr:"2007–2018", p:"5x5",   b:71.5,  t:"1/2-20"},
  {mk:"Jeep",      md:"Wrangler TJ / YJ",    yr:"1987–2006", p:"5x4.5", b:71.5,  t:"1/2-20"},
  {mk:"Jeep",      md:"Grand Cherokee",      yr:"2011–2026", p:"5x5",   b:71.5,  t:"14x1.5"},
  {mk:"GMC",       md:"Sierra 1500",         yr:"1999–2018", p:"6x5.5", b:78.1,  t:"14x1.5"},
  {mk:"GMC",       md:"Sierra 1500",         yr:"2019–2026", p:"6x5.5", b:78.1,  t:"14x1.5"},
  {mk:"Toyota",    md:"Tacoma",              yr:"2005–2026", p:"6x5.5", b:106.0, t:"12x1.5"},
  {mk:"Toyota",    md:"4Runner",             yr:"2003–2026", p:"6x5.5", b:106.0, t:"12x1.5"},
  {mk:"Toyota",    md:"Tundra",              yr:"2007–2021", p:"5x150", b:110.0, t:"14x1.5"},
  {mk:"Nissan",    md:"Titan",               yr:"2004–2015", p:"6x5.5", b:77.8,  t:"12x1.25"}
];

/* Quick picks — swap for the shop's actual top sellers by volume. */
var POPULAR = [
  {label:"Silverado / Sierra 1500", sub:"6x5.5", i:0},
  {label:"F-150 2015+",             sub:"6x135", i:6},
  {label:"Wrangler JK / JL",        sub:"5x5",   i:15},
  {label:"Ram 2500 / 3500",         sub:"8x6.5", i:14},
  {label:"Tacoma / 4Runner",        sub:"6x5.5", i:21},
  {label:"F-250 / F-350",           sub:"8x170", i:8}
];

/* Opens on the shop's best seller so the page is never an empty shell. */
var design = {
  hubPattern:"6x5.5", hubBore:78.1, vehicleThread:"14x1.5",
  wheelPattern:"5x4.5", wheelBore:87.1,
  thickness:2, studThread:"14x1.5", qty:2, hubCentric:false,
  mode:"popular", vehicle:0,
  pickMake:"Chevrolet", pickModel:"Silverado 1500"
};
var DESIGN_START = JSON.parse(JSON.stringify(design));

/* =====================================================================
   SUBMISSIONS — demo data spanning the whole pipeline so the list view
   shows every state. In production these come from Postgres, keyed to the
   Shopify customer id. Each row stores the PARAMETERS, so the drawing is
   regenerated rather than stored as a stale image.
   ===================================================================== */
var EDIT_WINDOW_H = 12;
var STAGES = ["Draft","Submitted","Under review","Quoted","Paid","Production","Quality control","Shipped"];
var HOUR = 3600000;

function ago(h){ return Date.now() - h * HOUR; }

var SUBMISSIONS = [
  {id:"WA-4821", stage:0, at:null, note:"Started on your phone",
   d:{hubPattern:"6x135", hubBore:87.1, vehicleThread:"14x1.5", wheelPattern:"5x4.5",
      wheelBore:70.5, thickness:1.5, studThread:"1/2-20", qty:2}},
  {id:"WA-4795", stage:1, at:ago(3.3), note:"With the office",
   d:{hubPattern:"6x5.5", hubBore:78.1, vehicleThread:"14x1.5", wheelPattern:"5x4.5",
      wheelBore:87.1, thickness:2, studThread:"14x1.5", qty:2}},
  {id:"WA-4702", stage:2, at:ago(11.6), note:"Being checked for safety and cost",
   d:{hubPattern:"8x6.5", hubBore:121.3, vehicleThread:"9/16-18", wheelPattern:"8x180",
      wheelBore:124.2, thickness:2.5, studThread:"14x1.5", qty:4}},
  {id:"WA-4655", stage:3, at:ago(38), note:"Invoice sent — awaiting payment", quote:157.95,
   d:{hubPattern:"8x170", hubBore:125, vehicleThread:"14x1.5", wheelPattern:"8x6.5",
      wheelBore:116.7, thickness:2, studThread:"14x1.5", qty:2}},
  {id:"WA-4610", stage:5, at:ago(140), note:"On the floor — order #10442", quote:129.95,
   d:{hubPattern:"5x5", hubBore:71.5, vehicleThread:"1/2-20", wheelPattern:"5x4.5",
      wheelBore:71.5, thickness:1.25, studThread:"1/2-20", qty:2}},
  {id:"WA-4588", stage:7, at:ago(400), note:"Tracking 9400 1102 0086 5512 3390 77", quote:114.95,
   d:{hubPattern:"6x5.5", hubBore:106, vehicleThread:"12x1.5", wheelPattern:"6x135",
      wheelBore:87.1, thickness:1, studThread:"12x1.5", qty:4}}
];

/* Hours left in the edit window, or null when it never applied. */
function editLeft(s){
  if (s.stage === 0) return Infinity;            /* an unsent draft is always editable */
  if (s.stage > 2) return -1;                    /* quoted and beyond needs re-approval */
  return EDIT_WINDOW_H - (Date.now() - s.at) / HOUR;
}
function fmtLeft(h){
  if (h === Infinity) return "Not submitted yet";
  if (h <= 0) return "Edit window closed";
  var hh = Math.floor(h), mm = Math.floor((h - hh) * 60), ss = Math.floor(((h - hh) * 60 - mm) * 60);
  return hh > 0 ? hh + "h " + mm + "m left" : mm + "m " + (ss < 10 ? "0" : "") + ss + "s left";
}
function fmtWhen(t){
  if (!t) return "—";
  var h = (Date.now() - t) / HOUR;
  if (h < 1) return Math.round(h * 60) + " min ago";
  if (h < 24) return Math.round(h) + " hours ago";
  return Math.round(h / 24) + " days ago";
}

var STEPS = [
  {n:"01", label:"Vehicle",  title:"Vehicle side",
   blurb:"What the adapter bolts onto. Read these off the hub, not off the wheel."},
  {n:"02", label:"Wheel",    title:"Wheel side",
   blurb:"What you are mounting. The bolt pattern stamped on the wheel or in its listing."},
  {n:"03", label:"Adapter",  title:"The adapter",
   blurb:"Thickness, studs and quantity. Thickness is measured face to face, not including studs."},
  {n:"04", label:"Review",   title:"Review and submit",
   blurb:"Check the drawing against your vehicle. Once you submit, this goes to our design team in CA and OR."}
];
var step = 0;
var shownErrors = {};   /* only populated after a failed Continue press */
var view = "design";
var editing = null;     /* submission id currently being edited, if any */

/* Required fields per step. Selects always carry a value, so the gates are the
   measured numbers and the acceptance box. */
function stepErrors(s){
  var e = {};
  if (s === 0){
    if (!design.hubBore) e.hubBore = "Enter the hub bore in millimetres.";
    else if (design.hubBore < 40 || design.hubBore > 200)
      e.hubBore = "Hub bores run about 40 to 200 mm. Check the measurement.";
  }
  if (s === 1){
    if (!design.wheelBore) e.wheelBore = "Enter the wheel centre bore in millimetres.";
    else if (design.wheelBore < 40 || design.wheelBore > 200)
      e.wheelBore = "Centre bores run about 40 to 200 mm. Check the measurement.";
  }
  if (s === 3){
    /* The step rail allows free navigation, so submit re-checks everything upstream. */
    var up = {};
    Object.keys(stepErrors(0)).forEach(function(k){ up[k] = stepErrors(0)[k]; });
    Object.keys(stepErrors(1)).forEach(function(k){ up[k] = stepErrors(1)[k]; });
    Object.keys(up).forEach(function(k){ e[k] = up[k]; });
    if (!el("accept").checked) e.accept = "Tick the box to confirm you have verified the specs.";
    if (!el("reviewed3d").checked) e.reviewed3d = camSupported()
      ? "Tick the box to confirm you have reviewed the 3D model. The i button opens it."
      : "Tick the box to confirm you have reviewed the drawing.";
  }
  return e;
}

var LEGAL = "I understand that I am building a part based on the specifications I have supplied. " +
  "I am confirming this order to Wheel Adapters USA to be built for me. My design is a final drawing, " +
  "and whether it works or not, I hold the Company harmless. I further understand that this is my " +
  "project and not a joint project. I am responsible to order, arrange, calculate, change, fit, " +
  "install, and drive the vehicle I am working on.";
