/* Adapter Designer v2 — Rendering the wizard, drawing panel, checks, price, designs list and admin.
   Split from v1 index.html lines 3045-3504; load order matters (see index.html). */

/* ---------------- render ---------------- */
function el(id){ return document.getElementById(id); }

function fieldSelect(key, label, hint, map){
  var o = '<div class="f"><label for="' + key + '">' + label + '</label>' +
          '<select id="' + key + '" data-key="' + key + '">';
  for (var k in map){
    o += '<option value="' + k + '"' + (design[key] === k ? ' selected' : '') + '>' +
         (map[k].label || k) + '</option>';
  }
  o += '</select><span class="hint">' + hint + '</span></div>';
  return o;
}
/* Error styling is painted onto existing nodes by paintErrors(), never rebuilt here.
   Rebuilding mid-click shifts the layout and the button press misses. */
function fieldNum(key, label, hint, stepv){
  return '<div class="f"><label for="' + key + '">' + label + '</label>' +
    '<input type="number" id="' + key + '" data-key="' + key + '" value="' +
    (design[key] || "") + '" step="' + stepv + '" min="0" inputmode="decimal" ' +
    'aria-describedby="' + key + '-err">' +
    '<span class="hint">' + hint + "</span>" +
    '<span class="err" id="' + key + '-err" hidden></span></div>';
}

function paintErrors(){
  var nodes = document.querySelectorAll("#fields [data-key]");
  for (var i = 0; i < nodes.length; i++){
    var n = nodes[i], k = n.getAttribute("data-key"), f = n.parentNode;
    if (!f || f.className.indexOf("f") !== 0) continue;
    var msg = shownErrors[k];
    var errEl = f.querySelector(".err"), hintEl = f.querySelector(".hint");
    if (msg){
      f.className = "f bad" + (f.className.indexOf("full") > -1 ? " full" : "");
      if (errEl){ errEl.textContent = msg; errEl.hidden = false; }
      if (hintEl) hintEl.hidden = true;
      n.setAttribute("aria-invalid", "true");
    } else {
      f.className = "f" + (f.className.indexOf("full") > -1 ? " full" : "");
      if (errEl) errEl.hidden = true;
      if (hintEl) hintEl.hidden = false;
      n.removeAttribute("aria-invalid");
    }
  }
}

function renderFields(){
  var h = "";
  if (step === 0){
    h += '<div class="f full"><div class="modes">' +
      [["popular","Popular trucks"],["vehicle","Find my vehicle"],["manual","I know my specs"]]
      .map(function(m){
        return '<button type="button" data-mode="' + m[0] + '" aria-pressed="' +
          (design.mode === m[0]) + '">' + m[1] + "</button>";
      }).join("") + "</div></div>";

    if (design.mode === "popular"){
      h += '<div class="f full"><div class="picks">';
      POPULAR.forEach(function(p){
        var on = design.vehicle === p.i;
        h += '<button type="button" class="pick" data-veh="' + p.i + '" aria-pressed="' + on + '">' +
          "<b>" + p.label + "</b><span>" + p.sub + "</span></button>";
      });
      h += "</div><span class=\"hint\">Not here? Try <b>Find my vehicle</b> or enter specs by hand.</span></div>";
    }

    if (design.mode === "vehicle"){
      var makes = [], seen = {};
      VEHICLES.forEach(function(v){ if (!seen[v.mk]){ seen[v.mk] = 1; makes.push(v.mk); } });
      h += '<div class="f"><label for="pickMake">Make</label><select id="pickMake" data-key="pickMake">' +
        makes.map(function(m){
          return '<option value="' + m + '"' + (design.pickMake === m ? " selected" : "") + ">" + m + "</option>";
        }).join("") + "</select></div>";

      var models = [], seen2 = {};
      VEHICLES.forEach(function(v){
        if (v.mk === design.pickMake && !seen2[v.md]){ seen2[v.md] = 1; models.push(v.md); }
      });
      if (models.indexOf(design.pickModel) === -1) design.pickModel = models[0];
      h += '<div class="f"><label for="pickModel">Model</label><select id="pickModel" data-key="pickModel">' +
        models.map(function(m){
          return '<option value="' + m + '"' + (design.pickModel === m ? " selected" : "") + ">" + m + "</option>";
        }).join("") + "</select></div>";

      h += '<div class="f full"><label>Year range</label><div class="seg">';
      VEHICLES.forEach(function(v, i){
        if (v.mk === design.pickMake && v.md === design.pickModel){
          h += '<button type="button" data-veh="' + i + '" aria-pressed="' +
            (design.vehicle === i) + '">' + v.yr + "</button>";
        }
      });
      h += '</div><span class="hint">Dually, 2WD and 4WD can differ. Check the hub if you are unsure.</span></div>';
    }

    if (design.vehicle !== null && design.mode !== "manual"){
      var v = VEHICLES[design.vehicle];
      h += '<div class="f full"><div class="filled"><span class="ic">&#10003;</span>' +
        "<div><b>Filled from a " + v.yr + " " + v.mk + " " + v.md + "</b>" +
        "<p>Check these three against your actual hub before you submit. " +
        "Trim and drivetrain can change them.</p></div></div></div>";
    }

    h += fieldSelect("hubPattern", "Hub bolt pattern", "Studs on the vehicle hub.", PATTERNS);
    h += fieldNum("hubBore", "Hub bore (mm)", "Outside diameter of the centre hub.", "0.1");
    h += fieldSelect("vehicleThread", "Vehicle stud thread", "What threads onto the car's studs.", THREADS);
  } else if (step === 1){
    h += fieldSelect("wheelPattern", "Wheel bolt pattern", "Pattern of the wheel you are fitting.", PATTERNS);
    h += fieldNum("wheelBore", "Wheel centre bore (mm)", "Centre hole in the back of the wheel.", "0.1");
  } else if (step === 2){
    h += '<div class="f full"><label>Thickness</label><div class="seg" id="thickseg">';
    THICKNESS.forEach(function(t){
      h += '<button type="button" data-thick="' + t + '" aria-pressed="' +
           (design.thickness === t) + '">' + t.toFixed(2) + '"</button>';
    });
    h += '</div><span class="hint">Face to face. Studs add height on top of this.</span></div>';
    h += fieldSelect("studThread", "Pressed stud thread", "Studs the new wheel mounts to.", THREADS);
    h += '<div class="f"><label>Quantity</label><div class="seg" id="qtyseg">' +
         ['2','4'].map(function(q){
           return '<button type="button" data-qty="' + q + '" aria-pressed="' +
             (design.qty === +q) + '">' + q + ' pieces</button>';
         }).join('') + '</div><span class="hint">Two per axle.</span></div>';
  }
  el("fields").innerHTML = h;
}

function renderChecks(issues){
  var glyph = {block:"&#10005;", flag:"&#9888;", ok:"&#10003;", info:"i"};
  var ck = clockOf(design);
  el("pc2").hidden = ck.onePiece;
  /* Not a rule and not a flag: tells the customer how this one gets built. */
  if (!ck.onePiece) issues = [{level:"info", id:"2-PC", title:"Built as a two-piece adapter",
    body:"Your " + design.hubPattern + " and " + design.wheelPattern + " bolt circles sit too close for one " +
         "solid piece \u2014 a lug-nut hole would run into a wheel stud. So we make it in two halves: the " +
         "hub half holds your lug nuts, the wheel half carries the new studs. The 3D views show the two " +
         "halves in different shades."}].concat(issues);
  el("checks").innerHTML = issues.map(function(i){
    return '<div class="chk ' + i.level + '"><span class="ic">' + glyph[i.level] + '</span>' +
      '<span class="body"><b>' + i.title + ' <code>' + i.id + '</code></b>' +
      '<p>' + i.body + '</p></span></div>';
  }).join("");
}

function renderTitleBlock(d, issues){
  var src = PATTERNS[d.hubPattern], dst = PATTERNS[d.wheelPattern];
  var blocked = issues.some(function(i){return i.level === "block"});
  var rows = [
    ["Conversion", src.label.split(" ")[0] + " → " + dst.label.split(" ")[0]],
    ["Thickness", d.thickness.toFixed(2) + '"'],
    ["Hub bore", d.hubBore.toFixed(1) + " mm"],
    ["Wheel bore", d.wheelBore.toFixed(1) + " mm"],
    ["Studs", THREADS[d.studThread].label],
    ["Material", "6061-T6 · " + (clockOf(d).onePiece ? "1-piece" : "2-piece")],
    ["Quantity", d.qty + " pc"],
    ["Status", blocked ? "NOT BUILDABLE" : "DRAFT"]
  ];
  el("titleblock").innerHTML = rows.map(function(r){
    return "<div><dt>" + r[0] + "</dt><dd>" + r[1] + "</dd></div>";
  }).join("");
}

function renderPrice(p){
  var a = el("amt"), per = el("per");
  a.className = "amt";
  if (p.mode === "blocked"){
    a.classList.add("quote");
    a.textContent = "Not buildable";
    per.innerHTML = "<b>Pricing</b>Change the specs above to continue.";
  } else if (p.mode === "quote"){
    a.classList.add("quote");
    a.textContent = "Quote required";
    per.innerHTML = "<b>Pricing</b>Flagged for engineering review. We will price it and email you.";
  } else {
    a.textContent = "$" + p.total.toFixed(2);
    per.innerHTML = "<b>Pricing</b>$" + p.pair.toFixed(2) + " per pair, free shipping in the USA.";
  }
}

/* ---------------- admin ---------------- */
var VERSION = {major:1, minor:0};
var dirty = 0;
var AUDIT = [
  {at:ago(2), who:"Dana R.", what:"Published rule set v1.0 — initial set from the shop floor"},
  {at:ago(26), who:"Marcus T.", what:"Raised R-201 reduction limit from 1.00\" to 1.25\" after the Tundra job"},
  {at:ago(74), who:"Dana R.", what:"Added R-110 after the 8x200 sample cracked in test"}
];

/* The catalogue prices the formula has to keep reproducing. */
var CATALOGUE = [
  {label:"6x5.5 → 5x4.5, 2.00\"", want:129.95,
   d:{hubPattern:"6x5.5", wheelPattern:"5x4.5", thickness:2, qty:2}},
  {label:"8x6.5 → 8x180, 2.00\"", want:157.95,
   d:{hubPattern:"8x6.5", wheelPattern:"8x180", thickness:2, qty:2}},
  {label:"6x5.5 spacer, 1.00\"", want:67.95,
   d:{hubPattern:"6x5.5", wheelPattern:"6x5.5", thickness:1, qty:2}}
];

function touch(){ dirty++; renderAdmin(); render(true); }

function renderRules(){
  var h = "";
  RULES.forEach(function(r, i){
    var k = KINDS[r.kind];
    h += '<div class="rule' + (r.on ? "" : " off") + '">';
    h += '<div class="rule-hd">';
    h += '<button type="button" class="tgl" data-toggle="' + i + '" aria-pressed="' + r.on +
         '" aria-label="' + (r.on ? "Disable " : "Enable ") + r.id + '"><span></span></button>';
    h += '<span class="rule-id mono">' + r.id + "</span>";
    h += '<span class="rule-title">' + r.title + "</span>";
    h += '<select class="lvl" data-level="' + i + '" aria-label="Severity for ' + r.id + '">' +
         '<option value="block"' + (r.level === "block" ? " selected" : "") + ">Block</option>" +
         '<option value="flag"' + (r.level === "flag" ? " selected" : "") + ">Flag</option></select>";
    h += "</div>";
    h += '<div class="rule-bd"><span class="rule-kind">' + k.label + "</span>";
    if (r.kind === "lugDrop"){
      h += "<span>hub</span><input type='number' class='mini' data-rp='" + i +
           ".from' value='" + r.p.from + "' min='3' max='10'><span>lug or more → wheel</span>" +
           "<input type='number' class='mini' data-rp='" + i + ".to' value='" + r.p.to +
           "' min='3' max='10'><span>lug or fewer</span>";
    } else if (r.kind === "patternPair"){
      h += "<span class='mono'>" + r.p.a + " → " + r.p.b + "</span>";
    } else {
      var f = k.field;
      h += "<span>" + (f === "max" ? "over" : "under") + "</span>" +
           "<input type='number' class='mini' data-rp='" + i + "." + f + "' value='" + r.p[f] +
           "' step='0.05' min='0'><span>" + k.unit + "</span>";
    }
    h += "</div></div>";
  });
  el("rulelist").innerHTML = h;
}

function renderPricing(){
  var h = '<div class="pgrid"><span class="plabel">Base per pair</span>';
  [4,5,6,8].forEach(function(l){
    h += "<label class='punit'>" + l + " lug<input type='number' data-pb='" + l +
         "' value='" + PRICING.base[l] + "' step='1' min='0'></label>";
  });
  h += "</div>";
  h += '<div class="pgrid"><span class="plabel">Thickness multiplier</span>';
  [1,1.25,1.5,2,2.5,3].forEach(function(t){
    h += "<label class='punit'>" + t.toFixed(2) + "\"<input type='number' data-pt='" + t +
         "' value='" + PRICING.thick[t] + "' step='0.01' min='0'></label>";
  });
  h += "</div>";
  h += '<div class="pgrid"><span class="plabel">Conversion surcharge</span>' +
       "<label class='punit'>added once<input type='number' data-pc='1' value='" +
       PRICING.conversion + "' step='1' min='0'></label></div>";
  el("priceform").innerHTML = h;
}

function renderPriceCheck(){
  var h = "";
  CATALOGUE.forEach(function(c){
    var d = {}; for (var kk in design) d[kk] = design[kk];
    for (var j in c.d) d[j] = c.d[j];
    var got = priceOf(d, [{level:"ok"}]);
    var val = got.mode === "price" ? got.pair : null;
    var ok = val !== null && Math.abs(val - c.want) < 0.005;
    h += '<div class="ck' + (ok ? " ok" : " off") + '">' +
      "<span class='ck-l'>" + c.label + "</span>" +
      "<span class='ck-v mono'>" + (val === null ? "—" : "$" + val.toFixed(2)) + "</span>" +
      "<span class='ck-w mono'>" + (ok ? "matches" : "was $" + c.want.toFixed(2)) + "</span></div>";
  });
  el("pricecheck").innerHTML = h;
}

function renderAudit(){
  el("audit").innerHTML = AUDIT.map(function(a){
    return '<div class="aud"><span class="aud-when mono">' + fmtWhen(a.at) + "</span>" +
      '<span class="aud-who">' + a.who + "</span>" +
      '<span class="aud-what">' + a.what + "</span></div>";
  }).join("");
}

function renderAdmin(){
  el("verlabel").textContent = "Rule set v" + VERSION.major + "." + VERSION.minor;
  el("verstate").textContent = dirty
    ? dirty + (dirty === 1 ? " unsaved change" : " unsaved changes")
    : "Live · no unsaved changes";
  el("verstate").className = dirty ? "dirty" : "";
  el("publish").disabled = !dirty;
  el("publish").textContent = dirty
    ? "Publish v" + VERSION.major + "." + (VERSION.minor + 1) : "Publish";
  el("discard").hidden = !dirty;
  renderRules(); renderPricing(); renderPriceCheck(); renderAudit();
}

function renderDesigns(){
  var h = "";
  SUBMISSIONS.forEach(function(s){
    var left = editLeft(s);
    var urgent = left !== Infinity && left > 0 && left < 1;
    var open = left > 0;
    var pillClass = s.stage === 0 ? "s-draft"
      : s.stage <= 2 ? "s-live" : s.stage === 3 ? "s-act" : "s-done";

    h += '<article class="sub">';
    h += '<div class="sub-thumb">' + faceSvg(s.d, true) + "</div>";

    h += '<div class="sub-main">';
    h += '<div class="sub-top"><span class="sub-id mono">' + s.id + "</span>" +
         '<span class="pill ' + pillClass + '">' + STAGES[s.stage] + "</span></div>";
    h += '<div class="sub-spec mono">' + s.d.hubPattern + " → " + s.d.wheelPattern +
         " &middot; " + s.d.thickness.toFixed(2) + '" &middot; ' + s.d.qty + " pc &middot; " +
         THREADS[s.d.studThread].label + "</div>";
    h += '<div class="sub-note">' + s.note + " &middot; " + fmtWhen(s.at) + "</div>";
    h += '<div class="track" aria-label="Stage ' + (s.stage + 1) + ' of 8">';
    for (var i = 0; i < 8; i++){
      h += '<span class="tick' + (i <= s.stage ? " on" : "") + '"></span>';
    }
    h += "</div></div>";

    h += '<div class="sub-side">';
    if (s.quote) h += '<div class="sub-price mono">$' + s.quote.toFixed(2) + "</div>";
    if (left === Infinity){
      h += '<div class="win">Not submitted yet</div>' +
           '<button type="button" class="btn-sm primary" data-edit="' + s.id + '">Continue design</button>';
    } else if (open){
      h += '<div class="win' + (urgent ? " urgent" : "") + '" data-clock="' + s.id + '">' +
           fmtLeft(left) + "</div>" +
           '<button type="button" class="btn-sm primary" data-edit="' + s.id + '">Edit design</button>';
    } else {
      h += '<div class="win closed">Edit window closed</div>' +
           '<button type="button" class="btn-sm" data-change="' + s.id + '">Request a change</button>';
    }
    h += "</div></article>";
  });
  el("subs").innerHTML = h;
}

function tickClocks(){
  var nodes = document.querySelectorAll("[data-clock]");
  for (var i = 0; i < nodes.length; i++){
    var id = nodes[i].getAttribute("data-clock");
    for (var j = 0; j < SUBMISSIONS.length; j++){
      if (SUBMISSIONS[j].id === id){
        var left = editLeft(SUBMISSIONS[j]);
        if (left <= 0){ renderDesigns(); return; }
        nodes[i].textContent = fmtLeft(left);
        if (left < 1) nodes[i].className = "win urgent";
      }
    }
  }
}

function renderStages(){
  var S = [
    ["01","Draft","Drawing created from the data you gave us."],
    ["02","Submitted","Sent to the office for review."],
    ["03","Under review","Safety, design, production cost and time."],
    ["04","Quoted","Invoice created and emailed to you."],
    ["05","Paid","Payment creates your order number."],
    ["06","Production","Production order generated for the floor."],
    ["07","Quality control","Checked at the QC station."],
    ["08","Shipped","Tracking number and photos of your parts."]
  ];
  el("stages").innerHTML = S.map(function(s, i){
    return '<div class="stage' + (i === 0 ? " live" : "") + '"><div class="n">' + s[0] + '</div>' +
      "<h3>" + s[1] + "</h3><p>" + s[2] + "</p></div>";
  }).join("");
}

/* What the Vehicle step is set to: the picked vehicle, or — once a hub value is
   edited by hand and it is no longer true that it came from a vehicle — the specs. */
function vehicleSummary(){
  if (design.vehicle !== null && design.vehicle !== undefined && VEHICLES[design.vehicle]){
    var v = VEHICLES[design.vehicle];
    return {full:v.mk + " " + v.md + " · " + v.yr, short:v.md};
  }
  return design.hubPattern ? {full:design.hubPattern + " hub · own specs", short:design.hubPattern + " hub"} : null;
}

/* Steps passed with Continue get a tick; the step Continue lands on glows yellow
   for a moment. The rail is rebuilt on every keystroke, so the glow is given a
   negative animation-delay equal to its age — typing mid-glow neither restarts
   nor cuts it short. */
var stepsPassed = {}, railGlow = null;   /* railGlow = {i: step index, at: ms} */
var RAIL_GLOW_MS = 1800;

function renderRail(){
  var age = railGlow ? Date.now() - railGlow.at : Infinity;
  el("rail").innerHTML = STEPS.map(function(s, i){
    var sub = i === 0 ? vehicleSummary() : null;
    var glow = railGlow && railGlow.i === i && i === step && age < RAIL_GLOW_MS;
    return '<button type="button" data-step="' + i + '" aria-current="' + (i === step) + '"' +
      (stepsPassed[i] ? ' data-done="1"' : "") +
      (glow ? ' class="arrive" style="animation-delay:-' + age + 'ms"' : "") +
      (sub ? ' title="' + sub.full + '"' : "") + ">" +
      '<span class="rn">' + s.n + (stepsPassed[i] ? '<span class="rd" aria-label="done"> &#10003;</span>' : "") +
      "</span><span class=\"rl\">" + s.label + "</span>" +
      (sub ? '<span class="rs"><span class="rs-full">' + sub.full + '</span><span class="rs-short">' +
             sub.short + "</span></span>" : "") + "</button>";
  }).join("");
}

/* skipFields=true updates the drawing, checks and price without rebuilding the
   inputs — so typing in a number field does not blow away focus or the caret. */
function render(skipFields){
  var issues = validate(design);
  var p = priceOf(design, issues);
  renderRail();
  el("steptitle").textContent = STEPS[step].title;
  el("stepblurb").textContent = STEPS[step].blurb;

  if (editing){
    var es = subById(editing), left = editLeft(es);
    el("editbar").innerHTML = '<div class="editbar"><div><b>Editing ' + es.id + "</b>" +
      "<span>" + (left === Infinity ? "Unsent draft — no time limit"
                                    : fmtLeft(left) + " to change this without re-approval") +
      "</span></div><button type='button' class='btn-sm' id='leave-edit'>Start fresh instead</button></div>";
  } else {
    el("editbar").innerHTML = "";
  }

  var keys = Object.keys(shownErrors);
  el("alertzone").innerHTML = keys.length
    ? '<div class="alert" role="alert"><span class="ic">!</span><div>' +
      "<b>" + (keys.length === 1 ? "One thing to fix" : keys.length + " things to fix") + "</b>" +
      "<ul>" + keys.map(function(k){ return "<li>" + shownErrors[k] + "</li>"; }).join("") +
      "</ul></div></div>"
    : "";

  if (!skipFields){ renderFields(); if (window.paintHL) paintHL(); }
  paintErrors();
  renderChecks(issues);
  el("lgjoin").hidden = clockOf(design).onePiece;
  if (!camSupported()){
    el("rev3dtxt").textContent = "I have reviewed the drawing of my adapter and it shows what I want built.";
    el("open3d").setAttribute("aria-label", "Show the drawing"); el("open3d").title = "Show the drawing";
  }
  el("face").innerHTML = faceSvg(design);
  if (cam3d.on) camUpdate(design);
  if (drawView === "stack" && !cam3d.on) renderStack();
  renderTitleBlock(design, issues);
  renderPrice(p);

  var review = step === 3;
  el("reviewzone").hidden = !review;
  el("legaltext").textContent = LEGAL;
  el("back").hidden = step === 0;
  var blocked = issues.some(function(i){return i.level === "block"});
  var nx = el("next"), why = el("why");
  nx.textContent = review ? (p.mode === "quote" ? "Submit for quote" : "Submit design") : "Continue";
  /* The button stays live so pressing it explains what is missing. A hard block is
     the one case where it genuinely cannot proceed. */
  nx.disabled = blocked;
  why.textContent = blocked
    ? "This combination cannot be built. Change the specs to continue."
    : (review && !el("accept").checked ? "Accept the terms above to submit."
      : review && !el("reviewed3d").checked ? "Confirm you have reviewed the " + (camSupported() ? "3D model" : "drawing") + " to submit."
      : "");
  el("rev").textContent = "REV A · " + (blocked ? "BLOCKED" : "DRAFT");
  stamp();
}

var t0 = null;
function stamp(){
  if (!t0) t0 = new Date();
  el("saved").textContent = "Draft saved " + t0.toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"});
}
