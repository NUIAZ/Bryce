/* Adapter Designer v2 — Input, change and click handling.
   Split from v1 index.html lines 3505-3727; load order matters (see index.html). */

/* ---------------- events ---------------- */
/* Live update while typing a measurement — redraw everything except the inputs. */
document.addEventListener("input", function(e){
  var t = e.target;
  if (!t.getAttribute || t.type !== "number") return;
  var k = t.getAttribute("data-key");
  if (!k) return;
  design[k] = parseFloat(t.value) || 0;
  if (k === "hubPattern" || k === "hubBore" || k === "vehicleThread") design.vehicle = null;
  if (shownErrors[k]) revalidate(k);
  render(true);
});

/* Re-check one field rather than assuming any edit fixed it. Replacing the fields
   markup fires a change event on the discarded input, so a blind delete here would
   wipe an error the moment it was shown. */
function revalidate(k){
  var e = stepErrors(step);
  if (e[k]) shownErrors[k] = e[k]; else delete shownErrors[k];
}

/* backplot scrubber */
document.addEventListener("input", function(e){
  if (e.target.id !== "camseek") return;
  cam3d.t = +e.target.value / 1000 * cam3d.total;
  cam3d.playing = false; el("camplay").textContent = "Play";
  camKick();
});

/* admin edits: rule params, severity, pricing */
document.addEventListener("input", function(e){
  var t = e.target;
  if (!t.getAttribute) return;
  var rp = t.getAttribute("data-rp");
  if (rp){
    var parts = rp.split("."), rr = RULES[+parts[0]];
    rr.p[parts[1]] = parseFloat(t.value) || 0;
    dirty++; renderPriceCheck(); render(true);
    el("verstate").textContent = dirty + (dirty === 1 ? " unsaved change" : " unsaved changes");
    el("verstate").className = "dirty";
    el("publish").disabled = false;
    el("publish").textContent = "Publish v" + VERSION.major + "." + (VERSION.minor + 1);
    el("discard").hidden = false;
    return;
  }
  var pb = t.getAttribute("data-pb"), pt = t.getAttribute("data-pt"), pc = t.getAttribute("data-pc");
  if (pb || pt || pc){
    if (pb) PRICING.base[pb] = parseFloat(t.value) || 0;
    if (pt) PRICING.thick[pt] = parseFloat(t.value) || 0;
    if (pc) PRICING.conversion = parseFloat(t.value) || 0;
    dirty++; renderPriceCheck(); render(true);
    el("verstate").textContent = dirty + (dirty === 1 ? " unsaved change" : " unsaved changes");
    el("verstate").className = "dirty";
    el("publish").disabled = false;
    el("publish").textContent = "Publish v" + VERSION.major + "." + (VERSION.minor + 1);
    el("discard").hidden = false;
  }
});

document.addEventListener("change", function(e){
  var co = e.target.getAttribute && e.target.getAttribute("data-camop");
  if (co){ var oo = cam3d.ops[+co]; cam3d.off[oo.grp + "|" + oo.name] = !e.target.checked; camBuild(); camKick(); return; }
  if (e.target.id === "stkcut"){ cam3d.cut = e.target.checked; camKick(); return; }
  var cs = e.target.getAttribute && e.target.getAttribute("data-camshow");
  if (cs){ cam3d[cs] = e.target.checked; camBuild(); camKick(); return; }
  var cg = e.target.getAttribute && e.target.getAttribute("data-camgrp");
  if (cg){
    cam3d.ops.forEach(function(o){ if (o.grp === cg) cam3d.off[o.grp + "|" + o.name] = !e.target.checked; });
    camBuild(); camRenderOps(); camKick(); return;
  }
  var lv = e.target.getAttribute && e.target.getAttribute("data-level");
  if (lv){ RULES[+lv].level = e.target.value; touch(); return; }
  var k = e.target.getAttribute && e.target.getAttribute("data-key");
  if (k){
    design[k] = e.target.type === "number" ? parseFloat(e.target.value) || 0 : e.target.value;
    /* Changing the make or model invalidates the year pick; hand-editing any of the
       three hub values means it is no longer "filled from" a vehicle. */
    if (k === "pickMake" || k === "pickModel") design.vehicle = null;
    if (k === "hubPattern" || k === "hubBore" || k === "vehicleThread") design.vehicle = null;
    if (shownErrors[k]) revalidate(k);
    /* Never rebuild the fields on a value change — a blur mid-click would move
       the button out from under the pointer. */
    render(e.target.type === "number");
  }
  if (e.target.id === "accept" || e.target.id === "reviewed3d"){
    if (shownErrors[e.target.id] && e.target.checked) delete shownErrors[e.target.id];
    render();
  }
});
document.addEventListener("click", function(e){
  var b = e.target.closest ? e.target.closest("button") : null;
  if (!b) return;
  if (b.id === "starttour"){ if (cam3d.modal) camModal(false); showTour(0); return; }
  if (b.id === "v2d" || b.id === "vstack" || b.id === "v3d"){
    setDraw(b.id === "v3d" ? "3d" : b.id === "vstack" ? "stack" : "2d"); return;
  }
  if (b.id === "stkbtn3"){
    stackExploded = !stackExploded;
    cam3d.exT = stackExploded ? 1 : 0;
    b.textContent = stackExploded ? "Bolt it together" : "Pull it apart";
    camKick(); return;
  }
  if (b.hasAttribute("data-join")){ joinOpt = b.getAttribute("data-join"); render(true); return; }
  if (b.id === "stk2d" || b.id === "stk3d"){ stack3d = b.id === "stk3d"; setDraw("stack"); return; }
  if (b.id === "stkbtn"){
    stackExploded = !stackExploded;
    document.querySelector(".stk").classList.toggle("together", !stackExploded);
    b.textContent = stackExploded ? "Bolt it together" : "Pull it apart";
    return;
  }
  if (b.hasAttribute("data-camview")){ camView(b.getAttribute("data-camview")); return; }
  if (b.id === "camexpand"){ camModal(true); return; }
  if (b.id === "camclose"){ camModal(false); return; }
  if (b.id === "camsep"){
    cam3d.sepT = cam3d.sepT === 1 ? 0 : 1;
    camViewButtons(); el("camsep").focus(); camKick(); return;
  }
  if (b.id === "open3d"){
    if (camSupported()){
      var back = drawView;
      if (drawView !== "3d") setDraw("3d");
      cam3d.modalReturn = back !== "3d" ? back : null;
      cam3d.modalOpener = b;
      camModal(true);
    } else {
      setDraw("2d");
      document.querySelector(".draw").scrollIntoView({block:"start"});
    }
    return;
  }
  /* Start over asks first, inline — confirm() is inert in artifact frames */
  if (b.id === "startover"){ b.hidden = true; el("startask").hidden = false; el("startno").focus(); return; }
  if (b.id === "startno"){ el("startask").hidden = true; el("startover").hidden = false; el("startover").focus(); return; }
  if (b.id === "startyes"){ startOver(); return; }
  if (b.id === "camspin"){ camSpin(!cam3d.hoverSpin); return; }
  if (b.id === "camplay"){
    if (!cam3d.playing && cam3d.t >= cam3d.total) cam3d.t = 0;
    /* a backplot with no paths drawn is just a tool waving in the air */
    if (!cam3d.playing && !cam3d.showPaths){ cam3d.showPaths = true; camBuild(); camRenderOps(); }
    cam3d.playing = !cam3d.playing;
    b.textContent = cam3d.playing ? "Pause" : "Play";
    camKick(); return;
  }
  if (b.id === "tournext"){ showTour(tourAt + 1); return; }
  if (b.id === "tourback"){ showTour(tourAt - 1); return; }
  if (b.id === "tourskip"){ endTour(); return; }
  if (b.hasAttribute("data-view")){ endTour(); setView(b.getAttribute("data-view")); }
  else if (b.hasAttribute("data-toggle")){
    var r = RULES[+b.getAttribute("data-toggle")];
    r.on = !r.on; touch();
  }
  else if (b.id === "publish"){
    VERSION.minor++;
    AUDIT.unshift({at:Date.now(), who:"You (demo)",
      what:"Published rule set v" + VERSION.major + "." + VERSION.minor + " — " +
           dirty + (dirty === 1 ? " change" : " changes")});
    dirty = 0;
    el("rulestamp").textContent = "Rule set v" + VERSION.major + "." + VERSION.minor;
    renderAdmin();
  }
  else if (b.id === "discard"){
    dirty = 0; renderAdmin();
  }
  else if (b.hasAttribute("data-edit")){
    var s = subById(b.getAttribute("data-edit"));
    for (var key in s.d) design[key] = s.d[key];
    design.vehicle = null; design.mode = "manual";
    editing = s.id; step = 0; shownErrors = {};
    setView("design");
    window.scrollTo({top:0, behavior:"smooth"});
  }
  else if (b.hasAttribute("data-change")){
    var sc = subById(b.getAttribute("data-change"));
    b.outerHTML = '<div class="win closed">Change requested. Our team will email you.</div>';
    sc.note = "Change requested — awaiting re-approval";
  }
  else if (b.id === "leave-edit"){ editing = null; render(); }
  else if (b.hasAttribute("data-mode")){ design.mode = b.getAttribute("data-mode"); render(); }
  else if (b.hasAttribute("data-veh")){
    var v = VEHICLES[+b.getAttribute("data-veh")];
    design.vehicle = +b.getAttribute("data-veh");
    design.pickMake = v.mk; design.pickModel = v.md;
    design.hubPattern = v.p; design.hubBore = v.b; design.vehicleThread = v.t;
    render();
  }
  else if (b.hasAttribute("data-step")){
    step = +b.getAttribute("data-step"); shownErrors = {}; render();
  }
  else if (b.hasAttribute("data-thick")){ design.thickness = parseFloat(b.getAttribute("data-thick")); render(); }
  else if (b.hasAttribute("data-qty")){ design.qty = +b.getAttribute("data-qty"); render(); }
  else if (b.id === "back"){ step = Math.max(0, step - 1); render(); window.scrollTo({top:0, behavior:"smooth"}); }
  else if (b.id === "next"){
    var errs = stepErrors(step);
    var bad = Object.keys(errs);
    if (bad.length){
      shownErrors = errs;
      render();
      var first = el(bad[0]);
      if (first){
        first.scrollIntoView({block:"center", behavior:"smooth"});
        first.focus({preventScroll:true});
      }
      return;
    }
    shownErrors = {};
    if (step < 3){
      stepsPassed[step] = true;
      step++;
      railGlow = {i:step, at:Date.now()};
      render();
      /* v2: tuck the wizard away so they can look at what the step added */
      if (window.onStepDone) onStepDone();
    }
    else {
      var d = "WA-" + String(Math.floor(Math.random() * 9000) + 1000);
      b.textContent = "Submitted · draft " + d;
      b.disabled = true;
      el("rev").textContent = "REV A · SUBMITTED";
      var live = document.querySelectorAll(".stage");
      if (live[0]) live[0].classList.remove("live");
      if (live[1]) live[1].classList.add("live");
    }
  }
});
