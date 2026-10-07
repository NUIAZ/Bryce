/* Adapter Designer v2 — Hole sizes, clocking + 1-pc/2-pc, joining plans, 2D section and face drawings.
   Split from v1 index.html lines 1402-1859; load order matters (see index.html). */

/* =====================================================================
   HOLE SIZES — the shop's own list (Bryce, 2026-10-05). Inches.
     lug  = the hole the VEHICLE lug nut sits in (pocket on the wheel side)
     stud = the hole for the PRESSED wheel stud's head
   Which size goes with which thread is NOT from the shop yet — HOLE_FOR is
   an assumption to replace with their answer. Unused sizes (1.12, 1.25 lug;
   1.25 stud) are listed so nothing is lost.
   ===================================================================== */
var SHOP_HOLES = {
  lug:  [0.82, 0.90, 1.00, 1.06, 1.12, 1.25],
  stud: [0.75, 0.80, 0.875, 1.25]
};
var HOLE_FOR = {              /* v0.1 ASSUMED mapping — confirm with the shop */
  "12x1.25": {lug:0.90, stud:0.75},
  "12x1.5":  {lug:0.90, stud:0.75},
  "1/2-20":  {lug:0.90, stud:0.80},
  "14x1.5":  {lug:1.06, stud:0.875},
  "14x2.0":  {lug:1.06, stud:0.875},
  "9/16-18": {lug:1.06, stud:0.875}
};
var ONE_PIECE_WALL_MM = 4;    /* ASSUMED: least wall for a one-piece build */

/* =====================================================================
   TWO-PIECE JOINING — CONCEPTS FOR SHOP REVIEW, NOT THE SHOP'S METHOD.
   The shop has not said how its two halves fasten. Two common ways are
   drawn so they can pick one or correct both:
     A  Cap screws: 5/16-18 socket-head screws through the wheel half into
        tapped holes in the hub half — confirmed by the shop: countersunk flat-head
        hex-socket screws, black, no dowels.
     B  Stacked: the hub half carries its own pressed studs on an in-between
        bolt circle; the wheel half bolts to those with lug nuts sunk in
        pockets — two one-piece conversions back to back.
   ===================================================================== */
/* A, as the shop builds it (photo, 2026-10-07): black-oxide FLAT-HEAD hex-socket screws,
   90° countersunk flush in the wheel half, threaded into the hub half. No dowels.
   Size from the photo looks like 3/8-16 — UNVERIFIED, confirm with the shop. */
var JOIN_A = {n:6, screwD:0.375, pitch:1 / 16, clearD:0.397, tapD:0.3125,
              headD:0.762, headH:0.212, socket:0.219, tapDepth:0.6};
/* Thread pitch in inches, for drawing threads true to size. */
var THREAD_PITCH = {"12x1.5":1.5 / 25.4, "12x1.25":1.25 / 25.4, "14x1.5":1.5 / 25.4, "14x2.0":2.0 / 25.4,
                    "1/2-20":1 / 20, "9/16-18":1 / 18};
var joinOpt = "A";

/* Pure: where each concept puts its fasteners, and what it costs in size. */
function joinPlan(d){
  var key = [d.hubPattern, d.wheelPattern, d.vehicleThread, d.studThread, d.hubBore, d.wheelBore].join("|");
  if (joinPlan.memo[key]) return joinPlan.memo[key];
  var src = PATTERNS[d.hubPattern], dst = PATTERNS[d.wheelPattern], h = holeSizes(d), ck = clockOf(d);
  var A0 = CAM_ASSUME, JA = JOIN_A, mm = 1 / 25.4, W = ONE_PIECE_WALL_MM * mm;
  var rs = src.bcd / 2, rd = dst.bcd / 2, base = (Math.max(src.bcd, dst.bcd) + 2.0) / 2;
  var hubR = d.hubBore * mm / 2, lipR = d.wheelBore * mm / 2;
  var halfMin = A0.flangeMax + A0.nutH + 0.15;      /* a half deep enough to bury a lug nut */

  /* A, as on the shop's parts (photo, 2026-10-07): one screw midway between each pair
     of VEHICLE lugs, on about the vehicle's bolt circle — so the count follows the
     vehicle lug count and the OD stays compact. In the hub half a screw must clear the
     lug pockets and stud holes; in the wheel half it must clear the pressed studs. On a
     two-piece the studs no longer fight the lug pockets, so they are re-clocked to clear
     the screws instead (dstOff). Radius: closest to the vehicle circle that leaves
     ONE_PIECE_WALL_MM everywhere without growing the OD; outward only if it must. */
  var nA = src.lugs, a0A = Math.PI / 2 - Math.PI / nA, k25 = 25.4;
  var thru = Math.max(0.5, Math.min(hubR, lipR - A0.lipWall));
  var rLo = Math.max(thru + JA.clearD / 2, lipR + JA.headD / 2) + W;
  var rHi = base - JA.headD / 2 - 0.12;
  function hubWall(r){
    var m = Infinity;
    for (var i = 0; i < src.lugs; i++){
      var ai = Math.PI / 2 - i * 2 * Math.PI / src.lugs;
      for (var k = 0; k < nA; k++){
        var ak = a0A - k * 2 * Math.PI / nA, dd = Math.sqrt(r * r + rs * rs - 2 * r * rs * Math.cos(ak - ai));
        m = Math.min(m, dd - Math.max(h.lugR, h.holeR) - JA.tapD / 2);
      }
    }
    return m;
  }
  function wheelWall(r, off){
    var m = Infinity;
    for (var j = 0; j < dst.lugs; j++){
      var aj = Math.PI / 2 - (off + j * 360 / dst.lugs) * Math.PI / 180;
      for (var k = 0; k < nA; k++){
        var ak = a0A - k * 2 * Math.PI / nA, dd = Math.sqrt(r * r + rd * rd - 2 * r * rd * Math.cos(ak - aj));
        m = Math.min(m, dd - Math.max(JA.headD / 2 + h.studR, JA.clearD / 2 + h.headR));
      }
    }
    return m;
  }
  function bestOff(r){
    var half = 360 / dst.lugs / 2, b = {off:half, w:wheelWall(r, half)};
    for (var q = 0; q < half * 8; q++){ var w = wheelWall(r, q / 4); if (w > b.w + 0.002) b = {off:q / 4, w:w}; }
    return b;
  }
  var pick = null, cands = [], rr;
  for (rr = rLo; rr <= rHi + 2.0; rr += 0.02) cands.push(rr);
  cands.sort(function(x, y){ return Math.abs(x - rs) - Math.abs(y - rs) + ((x > rHi) - (y > rHi)) * 100; });
  for (var ci = 0; ci < cands.length && !pick; ci++){
    var hw = hubWall(cands[ci]); if (hw < W) continue;
    var bo = bestOff(cands[ci]); if (bo.w < W) continue;
    pick = {r:cands[ci], off:bo.off};
  }
  if (!pick) pick = {r:rHi, off:bestOff(rHi).off};          /* nothing clears: closest try, flag via review */
  var A = {kind:"A", n:nA, r:pick.r, a0:a0A, dstOff:pick.off,
           R:Math.max(base, pick.r + JA.headD / 2 + 0.12), needT:halfMin + 0.5};

  /* B: search for an in-between pattern (same thread as the vehicle) that clears
     the vehicle pattern in the hub half and the wheel pattern in the wheel half.
     Inside both bolt circles first, which keeps the OD; outside if not. */
  var ih = {holeR:h.holeR, lugR:h.lugR, studR:THREADS[d.vehicleThread].dia * mm / 2,
            headR:HOLE_FOR[d.vehicleThread].stud / 2};
  function wall(r, n, a0){
    var m = Infinity, i, k, ak, ai, dist;
    for (k = 0; k < n; k++){
      ak = a0 - k * 2 * Math.PI / n;
      for (i = 0; i < src.lugs; i++){
        ai = Math.PI / 2 - i * 2 * Math.PI / src.lugs;
        dist = Math.sqrt(r * r + rs * rs - 2 * r * rs * Math.cos(ak - ai));
        m = Math.min(m, dist - Math.max(h.lugR + ih.studR, h.holeR + ih.headR));
      }
      for (i = 0; i < dst.lugs; i++){
        ai = Math.PI / 2 - ck.off * Math.PI / 180 - i * 2 * Math.PI / dst.lugs;
        dist = Math.sqrt(r * r + rd * rd - 2 * r * rd * Math.cos(ak - ai));
        m = Math.min(m, dist - Math.max(ih.lugR + h.studR, ih.holeR + h.headR));
      }
    }
    return m;
  }
  var minIn = Math.max(lipR + ih.lugR, hubR + ih.headR) + W, radii = [], r, best = null;
  for (r = Math.min(rs, rd) - 0.15; r >= minIn; r -= 0.05) radii.push(r);
  var firstOut = radii.length;
  for (r = Math.max(rs, rd) + 0.15; r <= Math.max(rs, rd) + 2.5; r += 0.05) radii.push(r);
  var counts = [src.lugs, dst.lugs].filter(function(n, i, a){ return a.indexOf(n) === i; });
  for (var ri = 0; ri < radii.length && !best; ri++){
    counts.forEach(function(n){
      for (var q = 0; q < 360 / n; q += 2){
        var a0 = Math.PI / 2 - q * Math.PI / 180, wl = wall(radii[ri], n, a0);
        if (wl >= W && (!best || wl > best.w)) best = {n:n, r:radii[ri], a0:a0, w:wl};
      }
    });
  }
  var B = best ? {kind:"B", n:best.n, r:best.r, a0:best.a0, inside:ri - 1 < firstOut,
                  holeR:ih.holeR, lugR:ih.lugR, studR:ih.studR, headR:ih.headR,
                  R:Math.max(base, best.r + Math.max(ih.lugR, ih.headR) + W + 0.1), needT:2 * halfMin}
               : null;
  return (joinPlan.memo[key] = {A:A, B:B, baseR:base});
}
joinPlan.memo = {};

/* Pure: hole radii in inches for a design. */
function holeSizes(d){
  var mm = 1 / 25.4;
  return {
    holeR:(THREADS[d.vehicleThread].dia + 2.4) * mm / 2,   /* vehicle stud clearance */
    lugR:HOLE_FOR[d.vehicleThread].lug / 2,                /* vehicle lug-nut pocket  */
    studR:THREADS[d.studThread].dia * mm / 2,              /* pressed stud shank      */
    headR:HOLE_FOR[d.studThread].stud / 2                  /* pressed stud head       */
  };
}

/* Wheel-stud clocking and one-piece vs two-piece.
   The wheel pattern can be machined at any rotation relative to the hub pattern;
   pick the one that leaves the most metal where the two would fight in a single
   piece: a lug-nut pocket against a pressed stud's shank, and a vehicle stud hole
   against a pressed stud's head. Ties go to half pitch, so same-count conversions
   draw exactly as before.
   If even the best rotation leaves less than ONE_PIECE_WALL_MM, the bolt circles
   are too close for one piece. The shop's answer is two halves: the hub half holds
   the lug-nut pockets, the wheel half holds the pressed studs, so the two never meet.
   Pure; used by faceSvg, stackSvg and camGeom.
   Returns {off: degrees clockwise from 12 o'clock, clear: mm of wall (<0 = overlap),
            onePiece: bool}. */
function clockOf(d){
  var src = PATTERNS[d.hubPattern], dst = PATTERNS[d.wheelPattern];
  var key = d.hubPattern + "|" + d.wheelPattern + "|" + d.vehicleThread + "|" + d.studThread;
  if (clockOf.memo[key]) return clockOf.memo[key];
  var h = holeSizes(d), k = 25.4;
  var need = Math.max(h.lugR + h.studR, h.holeR + h.headR) * k;
  var rs = src.bcd * k / 2, rd = dst.bcd * k / 2, half = 360 / dst.lugs / 2;
  function clear(off){
    var m = Infinity, i, j, a, b;
    for (i = 0; i < src.lugs; i++) for (j = 0; j < dst.lugs; j++){
      a = (i * 360 / src.lugs) * Math.PI / 180;
      b = (off + j * 360 / dst.lugs) * Math.PI / 180;
      m = Math.min(m, Math.sqrt(rs * rs + rd * rd - 2 * rs * rd * Math.cos(a - b)) - need);
    }
    return m;
  }
  var best = {off:half, clear:clear(half)};
  for (var q = 0; q < half * 8; q++){
    var c = clear(q / 4);
    if (c > best.clear + 0.01) best = {off:q / 4, clear:c};
  }
  best.onePiece = best.clear >= ONE_PIECE_WALL_MM;
  return (clockOf.memo[key] = best);
}
clockOf.memo = {};

/* =====================================================================
   STACK-UP DIAGRAM — vehicle hub, adapter, wheel, to scale, as an aligned
   section: the vehicle stud is rotated into the plane above the centreline,
   the wheel stud below it (standard drafting practice for bolt circles).
   Derived from the design every redraw, like faceSvg. Hub flange, wheel
   pad and nut sizes are generic and only there to show how it bolts up.
   ===================================================================== */
var stackExploded = true;

function stackSvg(d){
  var g = camGeom(d), T = g.T;
  var vr = THREADS[d.vehicleThread].dia / 25.4 / 2;          /* vehicle stud radius */
  var Fr = g.src.r + 0.8;                                      /* hub flange radius   */
  var Wt = 0.8, Wr = Math.max(Fr, g.dst.r + 0.9, g.R + 0.4);   /* wheel pad           */
  var nutH = 0.6, nutR = Math.min(0.4, g.src.nutR * 0.85), gap = 0.7;
  var xmin = -2.0 - gap, xmax = T + Wt + nutH + 0.25 + gap * 2;
  var W = 340, H = 352, top = 30, bot = 52;
  var S = Math.min((W - 24) / (xmax - xmin), (H - top - bot) / (2 * Wr + 0.3));
  var ox = (W - (xmax - xmin) * S) / 2 - xmin * S, cy = top + (H - top - bot) / 2;
  var gpx = (gap * S).toFixed(1), s = [];

  function X(x){ return (ox + x * S).toFixed(1); }
  /* rect from x0..x1 (in) and radius r0..r1 (in), in the top half, bottom half or both */
  function band(x0, x1, r0, r1, half, attr){
    var out = "", w = ((x1 - x0) * S).toFixed(1), h = ((r1 - r0) * S).toFixed(1);
    if (half !== "bot") out += '<rect x="' + X(x0) + '" y="' + (cy - r1 * S).toFixed(1) +
      '" width="' + w + '" height="' + h + '" ' + attr + "/>";
    if (half !== "top") out += '<rect x="' + X(x0) + '" y="' + (cy + r0 * S).toFixed(1) +
      '" width="' + w + '" height="' + h + '" ' + attr + "/>";
    return out;
  }
  function label(x, y, txt, anchor){
    return '<text x="' + X(x) + '" y="' + y + '" text-anchor="' + (anchor || "middle") +
      '" fill="var(--steel)" font-family="IBM Plex Mono, monospace" font-size="9.5" letter-spacing=".04em">' + txt + "</text>";
  }
  var HUB = 'fill="var(--line)" stroke="var(--ink)" stroke-width=".9"';
  var VEH = 'fill="var(--cyan-soft)" stroke="var(--cyan)" stroke-width="1.1"';
  var BODY = 'fill="url(#hatch2)" stroke="var(--ink)" stroke-width="1.2"';
  var VOID = 'fill="var(--paper)" stroke="var(--ink)" stroke-width=".8"';
  var RED = 'fill="var(--stud)" stroke="var(--ink)" stroke-width=".6"';
  var WHL = 'fill="var(--line-2)" fill-opacity=".55" stroke="var(--ink)" stroke-width=".9"';
  var NUT = 'fill="var(--steel-2)" stroke="var(--ink)" stroke-width=".7"';

  s.push('<svg class="stk' + (stackExploded ? "" : " together") + '" viewBox="0 0 ' + W + " " + H +
    '" role="img" aria-label="Section through vehicle hub, adapter and wheel, drawn to scale">');
  s.push('<defs><pattern id="hatch2" width="5" height="5" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">' +
    '<rect width="5" height="5" fill="var(--card)"/><line x1="0" y1="0" x2="0" y2="5" stroke="var(--line-2)" stroke-width="1.2"/></pattern></defs>');

  /* ---- vehicle hub: bearing housing, flange, pilot, studs ---- */
  s.push('<g class="mv" style="--dx:-' + gpx + 'px">');
  s.push(band(-2.0, -0.6, 0, g.hubR * 1.15, "both", HUB));
  s.push(band(-0.6, 0, 0, Fr, "both", HUB));
  s.push(band(0, g.pocketDepth * 0.85, 0, g.hubR - 0.015, "both", HUB + ' class="hl-hub"'));
  s.push(band(-0.78, -0.6, g.src.r - vr * 1.7, g.src.r + vr * 1.7, "top", VEH + ' class="hl-src"'));        /* stud head */
  s.push(band(-0.6, g.src.flange + nutH + 0.12, g.src.r - vr, g.src.r + vr, "top", VEH + ' class="hl-src"')); /* stud     */
  s.push(label(-1.0, 14, "VEHICLE HUB"));
  s.push("</g>");

  /* ---- adapter: hatched section with every cut, then its pressed studs.
          Two-piece: the hub half (0 … J) keeps the lug-nut pockets, the wheel half
          (J … T) the pressed studs, and it slides off on its own when pulled apart. ---- */
  var J = g.tA, two = !g.one;
  function studs(x0){
    s.push(band(x0 - 0.01, T + 0.01, g.dst.r - g.dst.studR, g.dst.r + g.dst.studR, "bot", VOID));
    s.push(band(x0 - 0.01, x0 + g.dst.headDepth, g.dst.r - g.dst.headR, g.dst.r + g.dst.headR, "bot", VOID));
    s.push(band(x0 + 0.005, x0 + g.dst.headDepth, g.dst.r - g.dst.headR * 0.96, g.dst.r + g.dst.headR * 0.96, "bot", RED + ' class="hl-dst"'));
    s.push(band(x0 + g.dst.headDepth, T + g.dst.len, g.dst.r - g.dst.studR, g.dst.r + g.dst.studR, "bot", RED + ' class="hl-dst"'));
  }
  s.push("<g>");
  s.push(band(0, J, g.thruR, g.R, "both", BODY + ' class="hl-thick"'));
  if (!two) s.push(band(T - 0.01, T + g.lipH, g.thruR, g.lipR, "both", BODY + ' class="hl-lip"'));
  s.push(band(0, g.pocketDepth, g.thruR - 0.001, g.hubR, "both", VOID + ' class="hl-hub"'));                 /* hub pocket */
  s.push(band(-0.01, J + 0.01, g.src.r - g.src.holeR, g.src.r + g.src.holeR, "top", VOID));
  s.push(band(g.src.flange, J + 0.01, g.src.r - g.src.nutR, g.src.r + g.src.nutR, "top", VOID));
  if (!two) studs(0);
  s.push(band(g.src.flange, g.src.flange + nutH, g.src.r - nutR, g.src.r + nutR, "top", VEH + ' class="hl-src"')); /* lug nut */
  /* how the halves join (concept): A taps into the hub half, B presses in-between studs into it */
  var jn = g.join, JA = JOIN_A, jh = "top";
  var INT = 'fill="#7b5cd6" stroke="var(--ink)" stroke-width=".6"';
  if (jn && jn.kind === "B"){
    var jw = Math.max(jn.lugR, jn.headR);
    /* aligned section: put it in whichever half it crowds less */
    var olTop = jw + g.src.nutR - Math.abs(jn.r - g.src.r), olBot = jw + g.dst.headR - Math.abs(jn.r - g.dst.r);
    jh = olBot < olTop ? "bot" : "top";
    s.push(band(-0.01, J + 0.01, jn.r - jn.studR, jn.r + jn.studR, jh, VOID));
    s.push(band(-0.01, g.dst.headDepth, jn.r - jn.headR, jn.r + jn.headR, jh, VOID));
    s.push(band(0.005, g.dst.headDepth, jn.r - jn.headR * 0.96, jn.r + jn.headR * 0.96, jh, INT));
    s.push(band(g.dst.headDepth, J + jn.flangeB + nutH + 0.12, jn.r - jn.studR, jn.r + jn.studR, jh, INT));
  } else if (jn){
    s.push(band(J - JA.tapDepth, J + 0.01, jn.r - JA.screwD / 2, jn.r + JA.screwD / 2, "top", VOID));
  }
  s.push("</g>");
  if (two){
    s.push('<g class="mv" style="--dx:' + (gap * 0.5 * S).toFixed(1) + 'px">');
    s.push(band(J, T, g.thruR, g.R, "both", BODY + ' class="hl-thick"'));
    s.push(band(T - 0.01, T + g.lipH, g.thruR, g.lipR, "both", BODY + ' class="hl-lip"'));
    studs(J);
    if (jn && jn.kind === "A"){
      var SCR = 'fill="#23262b" stroke="var(--ink)" stroke-width=".6"';
      s.push(band(J - 0.01, T + 0.01, jn.r - JA.clearD / 2, jn.r + JA.clearD / 2, "top", VOID));
      /* the countersink and the flat head fill it: wide at the wheel face, narrow below */
      var hx0 = X(T - JA.headH), hx1 = X(T + 0.005), y0 = (cy - (jn.r + JA.screwD / 2) * S).toFixed(1),
          y1 = (cy - (jn.r - JA.screwD / 2) * S).toFixed(1), Y0 = (cy - (jn.r + JA.headD / 2) * S).toFixed(1),
          Y1 = (cy - (jn.r - JA.headD / 2) * S).toFixed(1);
      s.push('<polygon points="' + hx0 + "," + y0 + " " + hx1 + "," + Y0 + " " + hx1 + "," + Y1 + " " + hx0 + "," + y1 + '" ' + SCR + "/>");
      s.push(band(J - 0.55, T - JA.headH, jn.r - JA.screwD / 2, jn.r + JA.screwD / 2, "top", SCR));
    } else if (jn){
      var bnut = Math.min(0.4, jn.lugR * 0.85);
      s.push(band(J - 0.01, T + 0.01, jn.r - jn.holeR, jn.r + jn.holeR, jh, VOID));
      s.push(band(J + jn.flangeB, T + 0.01, jn.r - jn.lugR, jn.r + jn.lugR, jh, VOID));
      s.push(band(J + jn.flangeB, J + jn.flangeB + nutH, jn.r - bnut, jn.r + bnut, jh, INT));
    }
    s.push("</g>");
  }

  /* ---- wheel: mounting pad cut off with a break line, then its lug nuts ---- */
  s.push('<g class="mv" style="--dx:' + gpx + 'px">');
  s.push(band(T, T + Wt, g.lipR, Wr, "top", WHL));
  s.push(band(T, T + Wt, g.lipR, g.dst.r - g.dst.studR - 0.03, "bot", WHL));
  s.push(band(T, T + Wt, g.dst.r + g.dst.studR + 0.03, Wr, "bot", WHL));
  [-1, 1].forEach(function(sg){                                       /* break lines */
    var y = cy - sg * Wr * S, zz = [];
    for (var k = 0; k <= 4; k++) zz.push(X(T + Wt * k / 4) + "," + (y - sg * (k % 2 ? 4 : 0)).toFixed(1));
    s.push('<polyline points="' + zz.join(" ") + '" fill="none" stroke="var(--ink)" stroke-width=".9"/>');
  });
  s.push(label(T + Wt / 2, 14, "WHEEL"));
  s.push("</g>");
  s.push('<g class="mv" style="--dx:' + (gap * 2 * S).toFixed(1) + 'px">');
  s.push(band(T + Wt, T + Wt + nutH, g.dst.r - nutR, g.dst.r + nutR, "bot", NUT));
  s.push("</g>");

  /* centreline */
  s.push('<line x1="8" y1="' + cy + '" x2="' + (W - 8) + '" y2="' + cy + '" stroke="var(--steel-2)" ' +
    'stroke-width=".8" stroke-dasharray="9 3 2 3"/>');

  /* how far the wheel moves out — the number the customer is buying */
  var dy = H - 30;
  s.push('<g class="hl-thick" stroke="var(--steel)" stroke-width=".9">' +
    '<line x1="' + X(0) + '" y1="' + dy + '" x2="' + X(T) + '" y2="' + dy + '"/>' +
    '<line x1="' + X(0) + '" y1="' + (dy - 5) + '" x2="' + X(0) + '" y2="' + (dy + 5) + '"/>' +
    '<line x1="' + X(T) + '" y1="' + (dy - 5) + '" x2="' + X(T) + '" y2="' + (dy + 5) + '"/></g>');
  s.push('<text x="' + X(T / 2) + '" y="' + (dy + 16) + '" text-anchor="middle" fill="var(--ink)" ' +
    'font-family="IBM Plex Mono, monospace" font-size="10.5">' + (two ? "2-PIECE " : "") + "ADAPTER " +
    T.toFixed(2) + '" · wheel ' + T.toFixed(2) + '" further out</text>');
  s.push(label(4, cy - 6, "VEHICLE STUD", "start"));
  s.push(label(4, cy + 13, "WHEEL STUD", "start"));
  s.push("</svg>");
  return s.join("");
}

function renderStack(){
  var g = camGeom(design);
  el("stack").innerHTML = stackSvg(design) +

    '<div class="stk-bar"><button type="button" class="btn-sm" id="stkbtn">' +
    (stackExploded ? "Bolt it together" : "Pull it apart") + "</button>" +
    (camSupported() ? '<button type="button" class="btn-sm" id="stk3d">View in 3D</button>' : "") +
    "<span>Section view, to scale. Vehicle stud above the centreline, wheel stud below.</span></div>";
}

/* 2D drawing · stack-up · 3D CAM — one of three in the drawing panel. */
var drawView = "2d", stack3d = true;
function setDraw(v){
  if (v === "3d" || (v === "stack" && stack3d)){
    cam3d.mode = v === "3d" ? "cam" : "stack";
    camSet(true);
    if (!cam3d.on && v === "3d") v = "2d";
  } else camSet(false);
  drawView = v;
  var bld = document.querySelector(".builder");
  if (bld) bld.setAttribute("data-draw", v);     /* lets the dock clear the stack view's bar */
  el("canvas2d").hidden = v !== "2d";
  el("stack").hidden = !(v === "stack" && !cam3d.on);
  el("v2d").setAttribute("aria-pressed", v === "2d");
  el("vstack").setAttribute("aria-pressed", v === "stack");
  el("v3d").setAttribute("aria-pressed", v === "3d");
  if (v === "stack" && !cam3d.on) renderStack();
}

/* ---------------- drawing ---------------- */
/* compact=true draws the face only, for list thumbnails. */
function faceSvg(d, compact){
  var src = PATTERNS[d.hubPattern], dst = PATTERNS[d.wheelPattern];
  var cgm = camGeom(d), od = 2 * cgm.R;
  if (compact){
    var c = 50, cs = 46 / od, s2 = [];
    s2.push('<svg viewBox="0 0 100 100" role="img" aria-label="' + d.hubPattern + " to " +
      d.wheelPattern + ' adapter">');
    s2.push('<circle cx="50" cy="50" r="' + (od / 2 * cs).toFixed(1) +
      '" fill="var(--paper)" stroke="var(--ink)" stroke-width="1.4"/>');
    s2.push('<circle cx="50" cy="50" r="' + (d.hubBore / 25.4 / 2 * cs).toFixed(1) +
      '" fill="var(--card)" stroke="var(--ink)" stroke-width="1"/>');
    var j, ang;
    for (j = 0; j < src.lugs; j++){
      ang = (-90 + j * 360 / src.lugs) * Math.PI / 180;
      s2.push('<circle cx="' + (c + src.bcd / 2 * cs * Math.cos(ang)).toFixed(1) +
        '" cy="' + (c + src.bcd / 2 * cs * Math.sin(ang)).toFixed(1) +
        '" r="2.4" fill="none" stroke="var(--cyan)" stroke-width="1.3"/>');
    }
    for (j = 0; j < dst.lugs; j++){
      ang = (-90 + (Math.PI / 2 - cgm.dst.a0) * 180 / Math.PI + j * 360 / dst.lugs) * Math.PI / 180;
      s2.push('<circle cx="' + (c + dst.bcd / 2 * cs * Math.cos(ang)).toFixed(1) +
        '" cy="' + (c + dst.bcd / 2 * cs * Math.sin(ang)).toFixed(1) +
        '" r="2.6" fill="var(--stud)"/>');
    }
    s2.push("</svg>");
    return s2.join("");
  }
  var W = 340, cx = 150, cy = 168;
  var S = 222 / od;                     // px per inch
  var R = od / 2 * S;
  var hubR = d.hubBore / 25.4 / 2 * S;
  var srcHoleR = (THREADS[d.vehicleThread].dia + 2.4) / 25.4 / 2 * S;
  var dstStudR = THREADS[d.studThread].dia / 25.4 / 2 * S;
  var s = [];

  s.push('<svg viewBox="0 0 ' + W + ' 352" role="img" aria-label="Adapter face and side profile drawn to scale">');
  s.push('<defs><pattern id="hatch" width="5" height="5" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">' +
         '<line x1="0" y1="0" x2="0" y2="5" stroke="var(--line-2)" stroke-width="1"/></pattern></defs>');

  /* construction grid */
  s.push('<g stroke="var(--grid)" stroke-width="1">');
  for (var g = 12; g < 352; g += 24) s.push('<line x1="0" y1="' + g + '" x2="' + W + '" y2="' + g + '"/>');
  for (var g2 = 12; g2 < W; g2 += 24) s.push('<line x1="' + g2 + '" y1="0" x2="' + g2 + '" y2="352"/>');
  s.push('</g>');

  /* body */
  s.push('<circle cx="' + cx + '" cy="' + cy + '" r="' + R.toFixed(1) + '" fill="url(#hatch)" opacity=".45"/>');
  s.push('<circle cx="' + cx + '" cy="' + cy + '" r="' + R.toFixed(1) + '" fill="none" stroke="var(--ink)" stroke-width="1.6"/>');

  /* centre lines */
  s.push('<g stroke="var(--steel-2)" stroke-width=".8" stroke-dasharray="9 3 2 3" opacity=".8">');
  s.push('<line x1="' + (cx - R - 14) + '" y1="' + cy + '" x2="' + (cx + R + 14) + '" y2="' + cy + '"/>');
  s.push('<line x1="' + cx + '" y1="' + (cy - R - 14) + '" x2="' + cx + '" y2="' + (cy + R + 14) + '"/>');
  s.push('</g>');

  /* bolt circles */
  s.push('<circle class="hl-src" cx="' + cx + '" cy="' + cy + '" r="' + (src.bcd / 2 * S).toFixed(1) +
         '" fill="none" stroke="var(--cyan)" stroke-width=".9" stroke-dasharray="4 4" opacity=".85"/>');
  s.push('<circle class="hl-dst" cx="' + cx + '" cy="' + cy + '" r="' + (dst.bcd / 2 * S).toFixed(1) +
         '" fill="none" stroke="var(--stud)" stroke-width=".9" stroke-dasharray="4 4" opacity=".85"/>');

  /* centre bore */
  /* centring lip (wheel bore), then the hub bore inside it */
  s.push('<circle class="hl-lip" cx="' + cx + '" cy="' + cy + '" r="' + (d.wheelBore / 25.4 / 2 * S).toFixed(1) +
         '" fill="none" stroke="var(--steel-2)" stroke-width="1"/>');
  s.push('<circle class="hl-hub" cx="' + cx + '" cy="' + cy + '" r="' + hubR.toFixed(1) +
         '" fill="var(--paper)" stroke="var(--ink)" stroke-width="1.2"/>');

  /* vehicle-side through holes */
  var i, a, x, y;
  for (i = 0; i < src.lugs; i++){
    a = (-90 + i * 360 / src.lugs) * Math.PI / 180;
    x = cx + src.bcd / 2 * S * Math.cos(a);
    y = cy + src.bcd / 2 * S * Math.sin(a);
    s.push('<circle class="hl-src" cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + srcHoleR.toFixed(1) +
           '" fill="var(--paper)" stroke="var(--cyan)" stroke-width="1.5"/>');
  }
  /* wheel-side pressed studs, clocked off the through holes */
  var off = (Math.PI / 2 - cgm.dst.a0) * 180 / Math.PI;
  for (i = 0; i < dst.lugs; i++){
    a = (-90 + off + i * 360 / dst.lugs) * Math.PI / 180;
    x = cx + dst.bcd / 2 * S * Math.cos(a);
    y = cy + dst.bcd / 2 * S * Math.sin(a);
    s.push('<circle class="hl-dst" cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + dstStudR.toFixed(1) +
           '" fill="var(--stud)" stroke="var(--ink)" stroke-width=".8"/>');
  }

  /* two-piece: how the halves join — concept for shop review, in violet */
  if (cgm.join){
    var jn = cgm.join, JC = jn.kind === "A" ? "#23262b" : "#7b5cd6";
    for (i = 0; i < jn.n; i++){
      a = jn.a0 - i * 2 * Math.PI / jn.n;
      x = cx + jn.r * S * Math.cos(a); y = cy - jn.r * S * Math.sin(a);
      if (jn.kind === "A"){
        /* flush countersunk head, hex socket */
        s.push('<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + (JOIN_A.headD / 2 * S).toFixed(1) +
               '" fill="' + JC + '" stroke="var(--ink)" stroke-width=".6"/>');
        var hx = [], hr = JOIN_A.socket / 2 / Math.cos(Math.PI / 6) * S;
        for (var q = 0; q < 6; q++) hx.push((x + hr * Math.cos(q * Math.PI / 3)).toFixed(1) + "," + (y + hr * Math.sin(q * Math.PI / 3)).toFixed(1));
        s.push('<polygon points="' + hx.join(" ") + '" fill="#6b7078"/>');
        continue;
      }
      var rOut = jn.lugR * S, rIn = jn.holeR * S;
      s.push('<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + rOut.toFixed(1) +
             '" fill="none" stroke="' + JC + '" stroke-width=".9" stroke-dasharray="2 2"/>');
      s.push('<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + rIn.toFixed(1) +
             '" fill="var(--paper)" stroke="' + JC + '" stroke-width="1.3"/>');
    }
  }

  /* OD dimension */
  var dy = cy + R + 22;
  s.push('<g stroke="var(--steel)" stroke-width=".9">');
  s.push('<line x1="' + (cx - R) + '" y1="' + dy + '" x2="' + (cx + R) + '" y2="' + dy + '"/>');
  s.push('<line x1="' + (cx - R) + '" y1="' + (dy - 4) + '" x2="' + (cx - R) + '" y2="' + (dy + 4) + '"/>');
  s.push('<line x1="' + (cx + R) + '" y1="' + (dy - 4) + '" x2="' + (cx + R) + '" y2="' + (dy + 4) + '"/>');
  s.push('</g>');
  s.push('<text x="' + cx + '" y="' + (dy + 15) + '" text-anchor="middle" fill="var(--steel)" ' +
         'font-family="IBM Plex Mono, monospace" font-size="11">&#8709; ' + od.toFixed(2) + '" OD</text>');

  /* side profile */
  var px = 306, tw = Math.max(8, Math.min(24, d.thickness * S * 0.42)), ph = R * 1.5;
  var py = cy - ph / 2;
  s.push('<rect class="hl-thick" x="' + (px - tw / 2) + '" y="' + py + '" width="' + tw + '" height="' + ph +
         '" fill="url(#hatch)" stroke="var(--ink)" stroke-width="1.3"/>');
  s.push('<g stroke="var(--stud)" stroke-width="2.4" stroke-linecap="round">');
  s.push('<line x1="' + (px + tw / 2) + '" y1="' + (py + 12) + '" x2="' + (px + tw / 2 + 13) + '" y2="' + (py + 12) + '"/>');
  s.push('<line x1="' + (px + tw / 2) + '" y1="' + (py + ph - 12) + '" x2="' + (px + tw / 2 + 13) + '" y2="' + (py + ph - 12) + '"/>');
  s.push('</g>');
  s.push('<text class="hl-thick-t" x="' + px + '" y="' + (py - 8) + '" text-anchor="middle" fill="var(--steel)" ' +
         'font-family="IBM Plex Mono, monospace" font-size="11">' + d.thickness.toFixed(2) + '"</text>');
  var cg = camGeom(d);
  if (!cg.one){
    var jx = px - tw / 2 + tw * cg.tA / d.thickness;      /* hub side left, wheel side right */
    s.push('<line x1="' + jx.toFixed(1) + '" y1="' + py + '" x2="' + jx.toFixed(1) + '" y2="' + (py + ph) +
           '" stroke="var(--ink)" stroke-width="1.3"/>');
  }
  s.push('<text x="' + px + '" y="' + (py + ph + 16) + '" text-anchor="middle" fill="var(--steel-2)" ' +
         'font-family="IBM Plex Mono, monospace" font-size="9.5">' + (cg.one ? "SIDE" : "2-PC") + '</text>');

  s.push('</svg>');
  return s.join("");
}
