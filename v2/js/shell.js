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
  c.showPart = true; c.showStock = false; c.showPaths = false; c.showHub = c.showWheel = true;
  c.playing = false; c.t = 1e9; c.hl = 0;
  c.showcase = true;
  showSlide(0, true);
  startCarousel();
}

/* ---------------- landing carousel ----------------
   One model, three ways to see it, advancing on their own:
   spin (the original turn, joining and separating) · on the truck (hub, adapter and
   wheel bolting together) · open & close (a 90° turn, the halves part and close). */
var SHOW_SLIDES = [
  {style:"spin",  label:"Spin",          tag:"5x5.5&Prime; &rarr; 6x5.5&Prime; two-piece adapter"},
  {style:"stack", label:"On the truck",  tag:"How it bolts between hub and wheel"},
  {style:"turn",  label:"Open &amp; close", tag:"The two halves and the screws that join them"}
];
var SLIDE_MS = 12000, slideAt = 0, slideTimer = 0, slidePaused = false;
var REDUCED = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function showSlide(i, now){
  var c = cam3d, s = SHOW_SLIDES[i], vp = el("camvp");
  slideAt = i;
  var dots = document.querySelectorAll("#herodots button");
  for (var k = 0; k < dots.length; k++) dots[k].setAttribute("aria-current", k === i);
  el("herotag").innerHTML = "<b>" + s.label + "</b>" + s.tag;
  function apply(){
    if (vp) vp.classList.remove("fading");
    if (view !== "home" || !c.showcase) return;     /* they left mid-fade: leave the builder alone */
    var stk = s.style === "stack";
    if (c.mode !== (stk ? "stack" : "cam")){ c.mode = stk ? "stack" : "cam"; camApplyMode(); c.modeShown = c.mode; }
    camUpdate(DEMO);
    camBuild();
    if (stk){ camView("s-iso"); c.cut = true; c.ex = c.exT = 1; }
    else { camView("iso"); c.pitch = 0.42; c.yaw = -0.6; c.sep = c.sepT = 0; }
    c.shT = 0; c.shYaw0 = c.yaw; c.showHold = 0;
    c.showStyle = REDUCED ? "still" : s.style;
    camKick();
    if (vp) vp.classList.remove("fading");
  }
  if (now || !vp){ apply(); return; }
  vp.classList.add("fading");                  /* cross-fade: out, swap, back in */
  setTimeout(apply, 380);
}
function startCarousel(){
  clearInterval(slideTimer);
  if (REDUCED) return;
  slideTimer = setInterval(function(){
    if (view !== "home" || slidePaused || document.hidden || cam3d.dragging) return;
    showSlide((slideAt + 1) % SHOW_SLIDES.length);
  }, SLIDE_MS);
}
function buildDots(){
  el("herodots").innerHTML = SHOW_SLIDES.map(function(s, i){
    return '<button type="button" data-slide="' + i + '" aria-label="Show: ' + s.label.replace(/&amp;/g, "and") + '">' +
      "<span>" + s.label + "</span></button>";
  }).join("");
}
buildDots();
document.addEventListener("click", function(e){
  var b = e.target.closest ? e.target.closest("[data-slide]") : null;
  if (!b) return;
  showSlide(+b.getAttribute("data-slide"));
  startCarousel();                             /* a fresh full interval after a manual pick */
});
/* hovering the model or the dots holds the current slide */
["mouseenter", "mouseleave"].forEach(function(t){
  el("homestage").addEventListener(t, function(){ slidePaused = t === "mouseenter"; });
});

function leaveHome(){
  cam3d.showcase = false;
  clearInterval(slideTimer);
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
