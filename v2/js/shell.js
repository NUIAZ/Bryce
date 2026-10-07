/* Adapter Designer v2 — page shell.
   Routes (#/, #/build/adapter|spacer|custom, #/designs, #/help, #/admin), the three
   categories, the landing showcase, and the wizard card that sits over the 3D model
   and tucks away after each step so the customer can explore what they built. */

var CATS = {
  adapter:{label:"Adapter",      noun:"adapter"},
  spacer: {label:"Spacer",       noun:"spacer"},
  custom: {label:"Custom build", noun:"custom build"}
};

/* The landing showcase: a popular two-piece (lug-count change, the store's biggest
   group). Drawn from parameters like everything else. */
var DEMO = {hubPattern:"5x5.5", hubBore:77.8, vehicleThread:"14x1.5", wheelPattern:"6x5.5",
            wheelBore:78.1, thickness:2, studThread:"14x1.5", qty:2};

var wizMin = false, dockMsg = null;

/* A fresh design for a category. Spacers keep one bolt pattern on both faces. */
function applyCategory(cat){
  var k;
  for (k in design) delete design[k];
  for (k in DESIGN_START) design[k] = DESIGN_START[k];
  design.cat = cat;
  syncCategory();
  step = 0; shownErrors = {}; editing = null; stepsPassed = {}; railGlow = null;
  wizMin = false; dockMsg = null; joinOpt = "A"; stackExploded = true;
  el("accept").checked = false; el("reviewed3d").checked = false;
}
function syncCategory(){
  if (design.cat === "spacer"){ design.wheelPattern = design.hubPattern; }
}

/* ---------------- routing ---------------- */
function routeFor(v){
  return v === "design" ? "#/build/" + (design.cat || "adapter")
       : v === "list" ? "#/designs" : v === "help" ? "#/help" : v === "admin" ? "#/admin" : "#/";
}
function route(){
  var h = location.hash.replace(/^#\/?/, ""), m = /^build\/(adapter|spacer|custom)$/.exec(h);
  if (m){
    /* same category with work in it resumes; anything else starts fresh */
    if (design.cat !== m[1]) applyCategory(m[1]);
    setView("design");
  }
  else if (h === "designs") setView("list");
  else if (h === "help") setView("help");
  else if (h === "admin") setView("admin");
  else setView("home");
}
window.addEventListener("hashchange", function(){ endTour(); route(); window.scrollTo(0, 0); });

/* ---------------- one 3D viewer, two stages ---------------- */
function placeViewer(where){
  var cam = el("cam");
  if (where === "home"){
    if (cam.parentNode !== el("homestage")) el("homestage").insertBefore(cam, el("homestage").firstChild);
  } else {
    var stage = document.querySelector(".bstage");
    if (cam.parentNode !== stage) stage.insertBefore(cam, stage.querySelector(".legend"));
  }
  camKick();
}

function enterHome(){
  var r = el("resume");
  if (design.cat && (step > 0 || Object.keys(stepsPassed).length)){
    r.innerHTML = 'Picking up where you left off? <a href="#/build/' + design.cat + '">Continue your ' +
      CATS[design.cat].noun + " &rarr;</a>";
    r.hidden = false;
  } else r.hidden = true;

  if (!camSupported()){
    el("homestage").classList.add("flat");
    var f = el("homeface") || document.createElement("div");
    f.id = "homeface"; f.innerHTML = faceSvg(DEMO);
    el("homestage").insertBefore(f, el("homestage").firstChild);
    return;
  }
  if (cam3d.modal) camModal(false);
  setDraw("3d");
  placeViewer("home");
  var c = cam3d;
  if (c.mode !== "cam"){ c.mode = "cam"; camApplyMode(); c.modeShown = "cam"; }
  camUpdate(DEMO);
  c.showPart = true; c.showStock = false; c.showPaths = false; c.showHub = c.showWheel = true;
  c.playing = false; c.t = 1e9; c.hl = 0;
  camBuild();
  camView("iso"); c.pitch = 0.42; c.yaw = -0.6;
  c.sep = c.sepT = 1; c.shT = 0;
  c.showcase = true;
  camKick();
}
function leaveHome(){
  cam3d.showcase = false;
  if (camSupported()) placeViewer("builder");
}

/* ---------------- builder: wizard over the model ---------------- */
function enterBuilder(){
  if (!design.cat) design.cat = "adapter";
  syncCategory();
  if (history.replaceState && location.hash.indexOf("#/build/") !== 0)
    history.replaceState(null, "", routeFor("design"));
  if (camSupported() && drawView !== "stack" && drawView !== "2d"){ setDraw("3d"); }
  else if (!camSupported()) setDraw("2d");
  paintWizard();
}

function paintWizard(){
  var b = document.querySelector(".builder");
  b.classList.toggle("min", wizMin);
  el("wizard").hidden = wizMin;
  el("dock").hidden = !wizMin;
  el("catchip").textContent = CATS[design.cat || "adapter"].label;
  if (wizMin){
    el("docktitle").textContent = dockMsg || "Exploring your " + CATS[design.cat || "adapter"].noun;
    el("docksub").textContent = "Drag to turn it, scroll or pinch to zoom.";
    el("docknext").textContent = dockMsg ? "Next: " + STEPS[step].label : "Back to step " + (step + 1);
  }
  camKick();                      /* the stage changes width with the card */
}

/* Called by the Continue handler after a step is passed. */
function onStepDone(){
  dockMsg = STEPS[step - 1].label + " done — have a look at your " + CATS[design.cat || "adapter"].noun;
  wizMin = true;
  paintWizard();
}

document.addEventListener("click", function(e){
  var b = e.target.closest ? e.target.closest("button") : null;
  if (!b) return;
  if (b.id === "wizmin"){ dockMsg = null; wizMin = true; paintWizard(); el("docknext").focus(); }
  else if (b.id === "docknext"){
    wizMin = false; dockMsg = null; paintWizard();
    var f = el("fields").querySelector("select, input, button");
    if (f) f.focus({preventScroll:true});
  }
});

/* The landing showcase pauses for a few seconds when someone grabs it. */
document.addEventListener("pointerdown", function(e){
  if (cam3d.showcase && e.target.closest && e.target.closest("#homestage")) cam3d.showHold = performance.now() + 5000;
});
