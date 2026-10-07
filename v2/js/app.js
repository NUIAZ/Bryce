/* Adapter Designer v2 — Tour, measurement highlight, start over, theme switch, start-up.
   Split from v1 index.html lines 3728-4008; load order matters (see index.html). */

/* =====================================================================
   SPOTLIGHT TOUR
   Artifacts cannot use position:fixed (it collapses the frame), so the
   mask and tooltip are positioned absolutely in DOCUMENT coordinates:
   getBoundingClientRect() + scrollY. The dimming is one box-shadow
   spreading out from the highlighted rect.
   ===================================================================== */
var TOUR = [
  {view:"design", sel:".tabs", title:"Four sections",
   body:"Design something new, check what you have already sent, and — for our team — the rules and prices behind it all."},
  {view:"design", step:0, sel:"#fields .modes", title:"Three ways to start",
   body:"Tap a popular truck, search by make and model, or type your specs in directly. All three fill the same fields."},
  {view:"design", step:0, sel:"#fields", title:"Always editable",
   body:"A vehicle lookup fills these in, but it never locks them. Check them against your own hub — trim and drivetrain change the answer."},
  {view:"design", step:0, draw:"2d", sel:"#canvas2d", title:"Drawn to scale",
   body:"Not a stock photo. Bolt circles, hole sizes and the centre bore are computed from your numbers and redraw as you type."},
  {view:"design", step:0, sel:".viewtog", title:"Three ways to look at it",
   body:"Switch between the flat drawing, a side view of the whole setup, and a 3D model with machining toolpaths."},
  {view:"design", step:0, draw:"stack", sel:"#camvp, #stack", title:"How it bolts up",
   body:"Vehicle hub, adapter and wheel in 3D, cut in half so you can see inside. Press Bolt it together to slide the parts into place."},
  {view:"design", step:0, draw:"3d", sel:"#camvp", title:"The part in 3D",
   body:"The finished adapter with the stock and the path each cutting tool takes. Drag to turn it. Click to open it full size; turn on Hover spin there and it follows your mouse."},
  {view:"design", step:0, draw:"3d", sel:"#cambp", title:"Watch it being cut",
   body:"Press Play or drag the slider. The readout shows where the tool is in X, Y and Z. This is an illustration — our machinists program the real job after review."},
  {view:"design", step:0, sel:"#checks", title:"Checks as you go",
   body:"Every change runs against our rule set. Green clears. Amber needs a person to look. Red cannot be built at all."},
  {view:"design", step:0, sel:".price", title:"Price or quote",
   body:"Standard builds price on the spot. Anything flagged goes to our team to quote by hand."},
  {view:"list", sel:"#subs .sub:nth-child(2)", title:"Your designs",
   body:"Everything you have started or sent. Each thumbnail is rebuilt from your saved numbers, so it can never go stale."},
  {view:"list", sel:"#subs .sub:nth-child(3) .sub-side", title:"Twelve hours to change your mind",
   body:"The clock runs from when you submit. Inside it, edit the design yourself. After it, our team has to re-approve."},
  {view:"admin", sel:"#rulelist .rule", title:"Rules are editable",
   body:"Switch a rule off, change its threshold, or move it between Block and Flag. It affects every customer the moment you publish."},
  {view:"admin", sel:"#pricecheck", title:"The safety net",
   body:"Live check that the pricing formula still reproduces our published prices. If one of these turns red, stop and undo."},
  {view:"admin", sel:".verbar", title:"Versioned and logged",
   body:"Edits stack up until you publish. Publishing bumps the version and writes who changed what to a log nobody can edit."}
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

function setView(v){
  view = v;
  el("view-design").hidden = v !== "design";
  el("view-list").hidden = v !== "list";
  el("view-admin").hidden = v !== "admin";
  el("view-help").hidden = v !== "help";
  var tabs = document.querySelectorAll("[data-view]");
  for (var i = 0; i < tabs.length; i++){
    tabs[i].setAttribute("aria-pressed", tabs[i].getAttribute("data-view") === v);
  }
  if (v === "list") renderDesigns();
  else if (v === "admin") renderAdmin();
  else render();
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
  wheelBore:    ["lip",   4, "Wheel centre bore", "the raised lip your wheel centres on"],
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
  var k;
  for (k in design) delete design[k];
  for (k in DESIGN_START) design[k] = DESIGN_START[k];
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
  if (c.on) camView(c.mode === "stack" ? "s-iso" : "iso");
  window.scrollTo(0, 0);
}

/* ---------------- theme switch ---------------- */
function themeNow(){
  var t = document.documentElement.getAttribute("data-theme");
  if (t === "light" || t === "dark") return t;
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
function paintThemeBtn(){
  var dark = themeNow() === "dark", b = el("themetog");
  /* the button names the theme it switches TO */
  b.innerHTML = dark
    ? '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">' +
      '<circle cx="12" cy="12" r="4.5"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/></svg>Light'
    : '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/></svg>Dark';
  b.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
}
function setTheme(t){
  document.documentElement.setAttribute("data-theme", t);
  try { localStorage.setItem("wa-theme", t); } catch (e) {}
  paintThemeBtn();
  if (cam3d.on && cam3d.gl){ camBuild(); camKick(); }   /* the 3D view reads its colours from the tokens */
}
el("themetog").addEventListener("click", function(){ setTheme(themeNow() === "dark" ? "light" : "dark"); });
if (window.matchMedia){
  var tmq = window.matchMedia("(prefers-color-scheme: dark)");
  if (tmq.addEventListener) tmq.addEventListener("change", paintThemeBtn); else if (tmq.addListener) tmq.addListener(paintThemeBtn);
}
paintThemeBtn();

renderStages();
renderDesigns();
render();
/* Opens in 3D where the device can run it; anything that cannot gets the exact
   2D drawing — the low-end fallback the brief requires. */
setDraw(camSupported() ? "3d" : "2d");
setInterval(function(){ if (view === "list") tickClocks(); }, 1000);
