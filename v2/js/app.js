/* Adapter Designer v2 — Tour, measurement highlight, start over, start-up.
   Split from v1 index.html lines 3728-4008; load order matters (see index.html). */

/* =====================================================================
   SPOTLIGHT TOUR
   Artifacts cannot use position:fixed (it collapses the frame), so the
   mask and tooltip are positioned absolutely in DOCUMENT coordinates:
   getBoundingClientRect() + scrollY. The dimming is one box-shadow
   spreading out from the highlighted rect.
   ===================================================================== */
var TOUR = [
  {view:"home", sel:".bnav", title:"Three places",
   body:"Start a new design, check the designs you have already sent us, or get help. The logo and Main Site take you back to the store."},
  {view:"home", sel:"#homestage", title:"Built live, in 3D",
   body:"This is a real two-piece adapter, drawn from its measurements. Yours is built the same way, as you fill it in."},
  {view:"home", sel:".cats", title:"Pick what you need",
   body:"Adapters change the bolt pattern, spacers keep it and push the wheel out, and Custom covers everything else."},
  {view:"design", step:0, sel:"#wizard", title:"One step at a time",
   body:"Each step is a short card over your model. Fill it in, press Continue, and see what it added."},
  {view:"design", step:0, sel:"#fields", title:"Always editable",
   body:"A vehicle lookup fills these in, but it never locks them. Check them against your own hub — trim and drivetrain change the answer."},
  {view:"design", step:0, sel:".bstage-bar .viewtog", title:"Three ways to look at it",
   body:"The adapter in 3D, the whole setup on the truck, or the exact 2D drawing."},
  {view:"design", step:0, sel:"#wizmin", title:"Get a closer look",
   body:"Hide the steps any time and turn, zoom and inspect your model. One click brings the steps back."},
  {view:"design", step:0, sel:"#checks", title:"Checks as you go",
   body:"Every change runs against our rule set. Green clears. Amber needs a person to look. Red cannot be built at all."},
  {view:"design", step:0, sel:".wiz .price", title:"Price or quote",
   body:"Standard builds price on the spot. Anything flagged — and every custom build — goes to our team to quote."},
  {view:"list", sel:"#subs .sub:nth-child(2)", title:"Your designs",
   body:"Everything you have started or sent. Each thumbnail is rebuilt from your saved numbers, so it can never go stale."},
  {view:"list", sel:"#subs .sub:nth-child(3) .sub-side", title:"Twelve hours to change your mind",
   body:"The clock runs from when you submit. Inside it, edit the design yourself. After it, our team has to re-approve."}
];
var tourAt = -1;

function tourEls(){
  var m = el("tourmask");
  if (!m){
    m = document.createElement("div");
    m.id = "tourmask"; m.hidden = true;
    m.innerHTML = '<div class="spot" id="spot"></div>' +
      '<div class="tip" id="tip" role="dialog" aria-label="Tour step">' +
        '<div class="tip-n mono" id="tipn"></div>' +
        '<b id="tipt"></b><p id="tipb"></p>' +
        '<div class="tip-a">' +
          '<button type="button" class="btn-sm" id="tourskip">Skip</button>' +
          '<button type="button" class="btn-sm" id="tourback">Back</button>' +
          '<button type="button" class="btn-sm primary" id="tournext">Next</button>' +
        "</div></div>";
    document.body.appendChild(m);
  }
  return m;
}

var tourAt0 = 0;
function showTour(i){
  if (i < 0 || i >= TOUR.length) return endTour();
  tourAt0 = tourAt;
  var t = TOUR[i];
  tourAt = i;
  if (t.view && view !== t.view) setView(t.view);
  if (t.view === "design" && wizMin){ wizMin = false; paintWizard(); }
  if (t.step !== undefined && step !== t.step){ step = t.step; render(); }
  if (t.draw && drawView !== t.draw) setDraw(t.draw);
  var m = tourEls(); m.hidden = false;
  /* first match that is actually showing — "#camvp, #stack" means 3D if it is on, else 2D */
  var cands = document.querySelectorAll(t.sel), target = null;
  for (var ci = 0; ci < cands.length && !target; ci++) if (cands[ci].getClientRects().length) target = cands[ci];
  /* Skip a step whose target is missing or hidden — e.g. the 3D steps on a device
     without WebGL2. Going Back past it skips the other way. */
  if (!target)
    return i < tourAt0 ? showTour(i - 1) : showTour(i + 1);

  /* Fill the tooltip first so offsetHeight is real when we place it. */
  el("tipn").textContent = (i + 1) + " of " + TOUR.length;
  el("tipt").textContent = t.title;
  el("tipb").textContent = t.body;
  el("tourback").disabled = i === 0;
  el("tournext").textContent = i === TOUR.length - 1 ? "Done" : "Next";

  /* Instant scroll, not smooth: a smooth scroll is still moving when we measure,
     which put the tooltip thousands of pixels off on a phone. The spotlight has a
     CSS transition, so it still glides between steps. */
  requestAnimationFrame(function(){
    /* Scroll explicitly rather than via scrollIntoView, which did not reliably move
       the page after a view switch. Centre the target, or pin it near the top when
       it is taller than the screen. */
    var vh = window.innerHeight;
    var r0 = target.getBoundingClientRect();
    if (r0.top < 8 || r0.bottom > vh - 8){
      var centre = r0.top + window.scrollY - Math.max(12, (vh - r0.height) / 2);
      window.scrollTo(0, Math.max(0, centre));
    }
    requestAnimationFrame(function(){ placeTour(target); });
  });
}

function placeTour(target){
  var spot = el("spot"), tip = el("tip");
  var r = target.getBoundingClientRect();          /* viewport coords */
  var sx = window.scrollX, sy = window.scrollY;
  var vw = window.innerWidth;
  var vh = window.innerHeight;
  var pad = 6, gap = 14;

  /* Spotlight, clamped so a wide target cannot push the document sideways. */
  var sLeft = Math.max(2, r.left + sx - pad);
  var sWide = Math.min(r.width + pad * 2, vw - 4);
  spot.style.top = (r.top + sy - pad) + "px";
  spot.style.left = sLeft + "px";
  spot.style.width = sWide + "px";
  spot.style.height = (r.height + pad * 2) + "px";

  /* Tooltip: below the target, else above, else pinned inside the visible band —
     which is what happens when the target is taller than the screen. */
  var tw = tip.offsetWidth, th = tip.offsetHeight, y;
  if (r.bottom + gap + th <= vh - 8)      y = r.bottom + gap;
  else if (r.top - gap - th >= 8)         y = r.top - gap - th;
  else                                    y = Math.max(8, vh - th - 12);
  tip.style.top = (y + sy) + "px";

  var x = r.left + sx + r.width / 2 - tw / 2;
  tip.style.left = Math.max(10, Math.min(x, sx + vw - tw - 10)) + "px";
}

function endTour(){
  var m = el("tourmask");
  if (m) m.hidden = true;
  tourAt = -1;
}

function subById(id){
  for (var i = 0; i < SUBMISSIONS.length; i++) if (SUBMISSIONS[i].id === id) return SUBMISSIONS[i];
  return null;
}

/* v2 pages: home (showcase + categories), design (the builder), list, help, admin. */
function setView(v){
  var was = view;
  view = v;
  ["home", "design", "list", "help", "admin"].forEach(function(n){ el("view-" + n).hidden = n !== v; });
  document.body.setAttribute("data-page", v);
  var navOn = v === "design" ? "home" : v, links = document.querySelectorAll("[data-nav]");
  for (var i = 0; i < links.length; i++){
    if (links[i].getAttribute("data-nav") === navOn) links[i].setAttribute("aria-current", "page");
    else links[i].removeAttribute("aria-current");
  }
  if (history.replaceState && location.hash !== routeFor(v) && !(v === "home" && (location.hash === "" || location.hash === "#/")))
    history.replaceState(null, "", routeFor(v));
  if (was === "home" && v !== "home") leaveHome();
  if (v === "list") renderDesigns();
  else if (v === "admin") renderAdmin();
  else if (v === "home"){ render(); enterHome(); }
  else { enterBuilder(); render(); }
}

/* ---------------- measurement highlight ----------------
   Point at or focus a measurement and the part of the drawing it refers to glows
   neon green, in whichever view is showing, with a one-line caption. */
var HL_MAP = {
  hubPattern:   ["src",   1, "Hub bolt pattern", "the holes your vehicle's studs pass through"],
  vehicleThread:["src",   1, "Vehicle stud thread", "your vehicle's studs, the holes they pass through and their lug nuts"],
  hubBore:      ["hub",   2, "Hub bore", "the recess your hub's centre sits in"],
  wheelPattern: ["dst",   3, "Wheel bolt pattern", "the new studs your wheel bolts onto"],
  studThread:   ["dst",   3, "Pressed stud thread", "the new studs your wheel bolts onto"],
  wheelBore:    ["lip",   4, "Wheel centre bore", "the hole in the back of your wheel — on a hub-centric build, the lip it centres on"],
  thickness:    ["thick", 5, "Thickness", "the adapter's depth — how far your wheel moves out"]
};
var hlFocus = null, hlHover = null;
/* Some parts face away from the default camera; while their field is active the
   3D view turns to look, then goes back to where it was. */
var HL_PEEK = {hubBore:{cam:"under", stack:"s-hub"}, thickness:{stack:"s-side"}};

function fieldKey(f){
  if (!f) return null;
  var n = f.querySelector("[data-key]");
  if (n) return n.getAttribute("data-key");
  return f.querySelector("[data-thick]") ? "thickness" : null;
}
function paintHL(){
  var key = hlHover || hlFocus, m = HL_MAP[key], d = document.querySelector(".draw"), cap = el("hlcap");
  if (m){
    d.setAttribute("data-hl", m[0]);
    cap.innerHTML = "<b>" + m[2] + "</b> &mdash; " + m[3];
    cap.hidden = false;
    /* sit just inside the visible view, below the 3D camera buttons */
    var vw = cam3d.on ? el("camvp") : drawView === "stack" ? el("stack") : el("canvas2d");
    cap.style.top = (vw.offsetTop + (cam3d.on ? 38 : 8)) + "px";
  } else {
    d.removeAttribute("data-hl");
    cap.hidden = true;
  }
  var fs = document.querySelectorAll("#fields .f");
  for (var i = 0; i < fs.length; i++) fs[i].classList.toggle("hl-on", !!m && fieldKey(fs[i]) === key);
  if (cam3d.hl !== (m ? m[1] : 0)){ cam3d.hl = m ? m[1] : 0; camKick(); }
  var c = cam3d, pk = HL_PEEK[key], want = pk && c.on ? pk[c.mode === "stack" ? "stack" : "cam"] : null;
  if (want && !c.peek){
    c.peek = {yaw:c.yaw, pitch:c.pitch, dist:c.dist, view:c.view, mode:c.mode};
    camView(want);
  } else if (want && c.view !== want) camView(want);
  else if (!want && c.peek){
    if (c.peek.mode === c.mode){ c.yaw = c.peek.yaw; c.pitch = c.peek.pitch; c.dist = c.peek.dist; c.view = c.peek.view; camMarkViews(); camKick(); }
    c.peek = null;
  }
}
document.addEventListener("focusin", function(e){
  var f = e.target.closest ? e.target.closest("#fields .f") : null;
  hlFocus = fieldKey(f); paintHL();
});
document.addEventListener("focusout", function(){
  /* wait for focus to land, so moving between controls of one field does not flicker */
  setTimeout(function(){
    var a = document.activeElement, f = a && a.closest ? a.closest("#fields .f") : null;
    hlFocus = fieldKey(f); paintHL();
  }, 0);
});
document.addEventListener("mouseover", function(e){
  var f = e.target.closest ? e.target.closest("#fields .f") : null, k = fieldKey(f);
  if (k !== hlHover){ hlHover = k; paintHL(); }
});

/* ---------------- start over ---------------- */
/* Back to the design the page opened on, step 1, nothing half-entered. Keeps the
   view choice (2D / stack / 3D) and theme — those are the viewer's, not the design's. */
function startOver(){
  var k, cat = design.cat || "adapter";
  for (k in design) delete design[k];
  for (k in DESIGN_START) design[k] = DESIGN_START[k];
  design.cat = cat;                       /* start over within the same category */
  wizMin = false; dockMsg = null;
  step = 0; shownErrors = {}; editing = null;
  stepsPassed = {}; railGlow = null;
  joinOpt = "A"; stackExploded = true;
  var c = cam3d;
  c.playing = false; c.ex = c.exT = 1; c.sep = c.sepT = 1; c.off = {}; c.t = 1e9;
  c.showPart = true; c.showStock = false; c.showPaths = false; c.showHub = true; c.showWheel = true;
  if (el("camplay")) el("camplay").textContent = "Play";
  el("accept").checked = false;
  el("reviewed3d").checked = false;
  t0 = null;
  el("startask").hidden = true; el("startover").hidden = false;
  renderStages();
  render();
  paintWizard();
  if (c.on) camView(c.mode === "stack" ? "s-iso" : "iso");
  window.scrollTo(0, 0);
}

renderStages();
renderDesigns();
view = "";             /* nothing shown yet; route() picks the page from the address */
render();
/* 3D where the device can run it; anything that cannot gets the exact 2D drawing —
   the low-end fallback the brief requires. */
setDraw(camSupported() ? "3d" : "2d");
route();
setInterval(function(){ if (view === "list") tickClocks(); }, 1000);
