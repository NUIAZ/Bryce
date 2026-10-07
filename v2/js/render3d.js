/* Adapter Designer v2 — WebGL2 ray-marched 3D view: geometry, toolpaths, shaders, viewer, modal.
   Split from v1 index.html lines 1860-3044; load order matters (see index.html). */

/* =====================================================================
   3D CAM VIEW v0.1 — ILLUSTRATIVE. NOT A POST-PROCESSED PROGRAM.
   Same rule as the 2D drawing: the solid and every toolpath are derived
   from the eight design numbers on each redraw. Nothing is stored.

   The solid is ray-marched as CSG (cylinder minus holes, plus studs) in a
   WebGL2 fragment shader, so every hole is exact with no mesh library and
   no dependency. Toolpaths are GL lines depth-tested against it. Without
   WebGL2 the 3D button disables itself and the 2D SVG stays — the
   low-end-device fallback the brief asks for.

   Units: inches. Work offsets as a machinist would set them:
     G54  Setup 1 — wheel side up. X0 Y0 bore centre, Z0 on the wheel face.
     G55  Setup 2 — flipped about Y, hub side up. Z0 on the hub face.
   The DRO reads in the active setup's own coordinates.
   ===================================================================== */
var CAM_ASSUME = {            /* v0.1 — UNVERIFIED. Every value needs a machinist. */
  lipH: 0.375,                /* wheel-side centring lip height */
  pocketDepth: 0.40,          /* hub-side recess the vehicle hub sits in */
  lipWall: 0.15,              /* wall between through bore and lip OD */
  flangeMax: 0.50,            /* material left under a lug-nut pocket */
  nutH: 0.60,                 /* vehicle lug nut height, for sizing the hub half */
  studLen: 1.50,              /* pressed stud stick-out past the wheel face */
  headDepth: 0.20,            /* stud head counterbore */
  minHalf: 0.50,              /* thinnest either half of a two-piece may be */
  stockOver: 0.06,            /* stock oversize, radial and on each face */
  clear: 0.50,                /* clearance plane above stock */
  feed: {face:40, mill:60, drill:12, rapid:400},   /* in/min */
  toolChange: 0.15            /* min */
};
/* Hole sizes come from SHOP_HOLES / holeSizes(), not from here. */

/* Pure: design → solid dimensions in inches. Mirrors faceSvg's geometry.
   Two-piece: the hub half (z −T … −T+tA) carries the lug-nut pockets, open at the
   joint face; the wheel half (−T+tA … 0) carries the pressed studs, heads seated
   at the joint face. How the halves fasten together is not modelled — the shop has
   not said yet. */
function camGeom(d){
  var A = CAM_ASSUME, src = PATTERNS[d.hubPattern], dst = PATTERNS[d.wheelPattern];
  var mm = 1 / 25.4, T = d.thickness, h = holeSizes(d), ck = clockOf(d);
  var hubR = d.hubBore * mm / 2, lipR = d.wheelBore * mm / 2;
  var flange = Math.min(A.flangeMax, T * 0.4);
  var tA = Math.max(A.minHalf, Math.min(T - A.minHalf, flange + A.nutH + 0.15));
  var plan = ck.onePiece ? null : joinPlan(d);
  var jn = plan ? (joinOpt === "B" && plan.B ? plan.B : plan.A) : null;
  if (jn && jn.kind === "B") tA = T / 2;
  var tB = T - tA;
  if (jn) jn.flangeB = Math.min(A.flangeMax, tB * 0.4);
  return {
    T:T, R:jn ? jn.R : (Math.max(src.bcd, dst.bcd) + 2.0) / 2, so:A.stockOver, join:jn, plan:plan,
    lipR:lipR, lipH:A.lipH, hubR:hubR,
    thruR:Math.max(0.5, Math.min(hubR, lipR - A.lipWall)),
    pocketDepth:Math.min(A.pocketDepth, T * 0.4),
    one:ck.onePiece, tA:ck.onePiece ? T : tA,
    /* a0 matches faceSvg: first hole at 12 o'clock, wheel studs clocked by clockOf() */
    src:{n:src.lugs, r:src.bcd / 2, a0:Math.PI / 2, holeR:h.holeR, nutR:h.lugR, flange:flange},
    dst:{n:dst.lugs, r:dst.bcd / 2, a0:Math.PI / 2 - ck.off * Math.PI / 180,
         studR:h.studR, headR:h.headR, headDepth:A.headDepth, len:A.studLen}
  };
}

/* Pure: geometry → operations. Each point is [x, y, z, rapid] in the op's own
   setup coordinates, so the DRO reads them straight off. op.xf places a setup in
   part coordinates (camToPart); op.grp and op.wcs label it. */
function camPaths(g){
  var A = CAM_ASSUME, ops = [], T = g.T, so = g.so, Rs = g.R + so;
  var T1 = {id:"T1", name:"3.000 face mill", d:3.0},
      T2 = {id:"T2", name:"1/2 flat end mill", d:0.5},
      T3 = {id:"T3", name:"1/2 spot drill", d:0.5},
      T4 = {id:"T4", name:"drill " + (g.src.holeR * 2).toFixed(3), d:g.src.holeR * 2},
      T5 = {id:"T5", name:"drill " + (g.dst.studR * 2).toFixed(3), d:g.dst.studR * 2};
  var tr = T2.d / 2, o, L, n, r, z, zc, cur;

  function setup(grp, wcs, xf, top, half){ cur = {grp:grp, wcs:wcs, xf:xf, half:half || null}; zc = top + A.clear; }
  function op(name, tool, feed, color){
    o = {grp:cur.grp, wcs:cur.wcs, xf:cur.xf, half:cur.half, name:name, tool:tool, feed:feed, color:color, pts:[]};
    ops.push(o);
  }
  function mv(x, y, z, rapid){ o.pts.push([x, y, z, rapid ? 1 : 0]); }
  function circ(x, y, r, z){
    for (var k = 0; k <= 48; k++){
      var a = k / 48 * 2 * Math.PI;
      mv(x + r * Math.cos(a), y + r * Math.sin(a), z);
    }
  }
  function helix(x, y, r, z0, z1, pitch){
    var turns = Math.max(1, Math.ceil((z0 - z1) / pitch)), m = turns * 36;
    for (var k = 0; k <= m; k++){
      var a = k / 36 * 2 * Math.PI;
      mv(x + r * Math.cos(a), y + r * Math.sin(a), z0 + (z1 - z0) * k / m);
    }
    circ(x, y, r, z1);
  }
  function go(x, y, z){ mv(x, y, zc, 1); mv(x, y, z + 0.1, 1); }
  function up(){ var p = o.pts[o.pts.length - 1]; mv(p[0], p[1], zc, 1); }
  function ring(c){
    var out = [];
    for (var i = 0; i < c.n; i++){
      var a = c.a0 - i * 2 * Math.PI / c.n;
      out.push([c.r * Math.cos(a), c.r * Math.sin(a)]);
    }
    return out;
  }
  function mirror(L){ return L.map(function(h){ return [-h[0], h[1]]; }); }   /* flipped setups see X mirrored */
  function face(zf){
    var xr = Rs + T1.d / 2 + 0.2, rows = Math.max(1, Math.ceil(2 * Rs / (T1.d * 0.7))), dir = 1;
    for (var k = 0; k < rows; k++){
      var yy = -Rs + (k + 0.5) * 2 * Rs / rows;
      if (k === 0) go(-xr, yy, zf);
      mv(-xr * dir, yy, zf); mv(xr * dir, yy, zf);
      dir = -dir;
    }
    up();
  }
  function peck(holes, depth, q){
    holes.forEach(function(h){
      go(h[0], h[1], 0);
      for (var zz = 0; zz > depth + 1e-6;){
        var nz = Math.max(depth, zz - q);
        if (zz < 0) mv(h[0], h[1], zz + 0.02, 1);
        mv(h[0], h[1], nz);
        mv(h[0], h[1], 0.1, 1);
        zz = nz;
      }
    });
    up();
  }
  function roughLip(){
    n = Math.ceil(g.lipH / 0.2);
    for (L = 1; L <= n; L++){
      z = g.lipH - g.lipH * L / n;
      go(Rs + tr + 0.1, 0, z);
      for (r = Rs + tr - 0.05; r > g.lipR + tr + 0.05; r -= T2.d * 0.4) circ(0, 0, r, z);
      circ(0, 0, g.lipR + tr, z);
      up();
    }
  }
  function contour(depth){
    r = g.R + tr;
    go(r + 0.3, 0, 0);
    n = Math.ceil(depth / 0.25);
    for (L = 1; L <= n; L++){
      z = -depth * L / n;
      mv(r + 0.3, 0, z); mv(r, 0, z); circ(0, 0, r, z); mv(r + 0.3, 0, z);
    }
    up();
  }
  function spot(holes){
    holes.forEach(function(h){ go(h[0], h[1], 0); mv(h[0], h[1], -0.08); mv(h[0], h[1], 0.1, 1); });
    up();
  }
  function pockets(holes, R0, floor, pitch){
    holes.forEach(function(h){
      if (R0 - tr > 0.02){
        go(h[0] + R0 - tr, h[1], 0);
        helix(h[0], h[1], R0 - tr, 0, floor, pitch);
        mv(h[0], h[1], floor);
      } else { go(h[0], h[1], 0); mv(h[0], h[1], floor); }
      up();
    });
  }
  function bore(z0, z1){
    go(g.thruR - tr, 0, z0);
    helix(0, 0, g.thruR - tr, z0, z1, 0.1);
    up();
  }
  function hubRecess(){
    if (g.hubR <= g.thruR + 0.01) return;
    op("Pocket hub recess", T2, A.feed.mill, "#22a39a");
    n = Math.ceil(g.pocketDepth / 0.2);
    for (L = 1; L <= n; L++){
      z = -g.pocketDepth * L / n;
      r = Math.max(0.05, g.thruR - tr * 0.5);
      go(r, 0, z);
      for (; r < g.hubR - tr - 0.05; r += T2.d * 0.4) circ(0, 0, r, z);
      circ(0, 0, g.hubR - tr, z);
      up();
    }
  }
  var S = ring(g.src), D = ring(g.dst), J = -T + g.tA, tB = T - g.tA, jn = g.join, JA = JOIN_A;
  var JP = jn ? ring(jn) : [], DP = jn ? ring({n:2, r:jn.r, a0:jn.a0 + Math.PI / jn.n}) : [];
  var T6 = {id:"T6", name:"drill " + JA.clearD.toFixed(3), d:JA.clearD},
      T7 = {id:"T7", name:"tap drill " + JA.tapD.toFixed(3), d:JA.tapD},
      T8 = {id:"T8", name:"5/16-18 tap", d:0.3125},
      T9 = {id:"T9", name:"1/4 drill + ream", d:JA.dowelD},
      T10 = jn && jn.kind === "B" ? {id:"T10", name:"drill " + (jn.studR * 2).toFixed(3), d:jn.studR * 2} : null;

  if (g.one){
    setup("Setup 1 · G54 · wheel side up", "G54 · SETUP 1 · Z0 WHEEL FACE", {flip:false, z0:0}, g.lipH + so);
    op("Face wheel side", T1, A.feed.face, "#4f8fe0");                  face(g.lipH);
    op("Rough wheel face to Z0, finish lip", T2, A.feed.mill, "#22a39a"); roughLip();
    op("Contour OD", T2, A.feed.mill, "#8a6fd6");                         contour(T + 0.03);
    op("Spot drill all holes", T3, A.feed.drill, "#c9a227");              spot(S.concat(D));
    op("Peck drill vehicle stud holes", T4, A.feed.drill, "#2c9fc4");     peck(S, -T - 0.15, 0.25);
    op("Peck drill stud press holes", T5, A.feed.drill, "#e0703a");       peck(D, -T - 0.15, 0.25);
    op("Helix lug-nut pockets", T2, A.feed.mill, "#3fa34d");              pockets(S, g.src.nutR, -T + g.src.flange, 0.08);
    op("Helix through bore", T2, A.feed.mill, "#d1495b");                 bore(g.lipH, -T - 0.03);

    setup("Setup 2 · G55 · flipped, hub side up", "G55 · SETUP 2 · Z0 HUB FACE", {flip:true, z0:-T}, so);
    op("Face hub side", T1, A.feed.face, "#4f8fe0");                      face(0);
    hubRecess();
    op("Counterbore stud heads", T2, A.feed.mill, "#8a6fd6");             pockets(mirror(D), g.dst.headR, -g.dst.headDepth, 0.06);
  } else {
    /* Two-piece: each half is its own part with two setups. */
    setup("Wheel half · Setup 1 · G54 · wheel side up", "WHEEL HALF · G54 · Z0 WHEEL FACE", {flip:false, z0:0}, g.lipH + so, "wheel");
    op("Face wheel side", T1, A.feed.face, "#4f8fe0");                  face(g.lipH);
    op("Rough wheel face to Z0, finish lip", T2, A.feed.mill, "#22a39a"); roughLip();
    op("Contour OD", T2, A.feed.mill, "#8a6fd6");                         contour(tB + 0.03);
    op("Spot drill stud holes", T3, A.feed.drill, "#c9a227");             spot(D);
    op("Peck drill stud press holes", T5, A.feed.drill, "#e0703a");       peck(D, -tB - 0.15, 0.25);
    op("Helix through bore", T2, A.feed.mill, "#d1495b");                 bore(g.lipH, -tB - 0.03);
    if (jn.kind === "A"){
      op("Drill screw clearance holes", T6, A.feed.drill, "#7b5cd6");     peck(JP, -tB - 0.15, 0.25);
      op("Counterbore screw heads", T2, A.feed.mill, "#a48be6");          pockets(JP, JA.cbD / 2, -JA.cbDepth, 0.06);
    } else {
      op("Peck drill in-between stud holes", T4, A.feed.drill, "#7b5cd6"); peck(JP, -tB - 0.15, 0.25);
      op("Helix in-between nut pockets", T2, A.feed.mill, "#a48be6");     pockets(JP, jn.lugR, -(tB - jn.flangeB), 0.08);
    }

    setup("Wheel half · Setup 2 · G55 · joint face up", "WHEEL HALF · G55 · Z0 JOINT FACE", {flip:true, z0:J}, so, "wheel");
    op("Face joint side", T1, A.feed.face, "#4f8fe0");                    face(0);
    op("Counterbore stud heads", T2, A.feed.mill, "#8a6fd6");             pockets(mirror(D), g.dst.headR, -g.dst.headDepth, 0.06);
    if (jn.kind === "A"){ op("Drill + ream dowel holes", T9, A.feed.drill, "#5e44b0"); peck(mirror(DP), -0.36, 0.2); }

    setup("Hub half · Setup 1 · G56 · joint face up", "HUB HALF · G56 · Z0 JOINT FACE", {flip:false, z0:J}, so, "hub");
    op("Face joint side", T1, A.feed.face, "#4f8fe0");                    face(0);
    op("Contour OD", T2, A.feed.mill, "#8a6fd6");                         contour(g.tA + 0.03);
    op("Spot drill vehicle stud holes", T3, A.feed.drill, "#c9a227");     spot(S);
    op("Peck drill vehicle stud holes", T4, A.feed.drill, "#2c9fc4");     peck(S, -g.tA - 0.15, 0.25);
    op("Helix lug-nut pockets", T2, A.feed.mill, "#3fa34d");              pockets(S, g.src.nutR, -g.tA + g.src.flange, 0.08);
    op("Helix through bore", T2, A.feed.mill, "#d1495b");                 bore(0, -g.tA - 0.03);
    if (jn.kind === "A"){
      op("Drill screw tap holes", T7, A.feed.drill, "#7b5cd6");           peck(JP, -JA.tapDepth - 0.1, 0.25);
      op("Tap 5/16-18", T8, A.feed.drill, "#a48be6");                     peck(JP, -JA.tapDepth, JA.tapDepth);
      op("Drill + ream dowel holes", T9, A.feed.drill, "#5e44b0");        peck(DP, -0.36, 0.2);
    }

    setup("Hub half · Setup 2 · G57 · hub side up", "HUB HALF · G57 · Z0 HUB FACE", {flip:true, z0:-T}, so, "hub");
    op("Face hub side", T1, A.feed.face, "#4f8fe0");                      face(0);
    hubRecess();
    if (jn.kind === "B"){
      op("Peck drill in-between press holes", T10, A.feed.drill, "#7b5cd6"); peck(mirror(JP), -g.tA - 0.15, 0.25);
      op("Counterbore in-between stud heads", T2, A.feed.mill, "#a48be6");   pockets(mirror(JP), jn.headR, -g.dst.headDepth, 0.06);
    }
  }
  return ops;
}

/* Setup coordinates → part coordinates (the assembled adapter, G54 frame). */
function camToPart(p, o){
  return o.xf.flip ? [-p[0], p[1], o.xf.z0 - p[2]] : [p[0], p[1], p[2] + o.xf.z0];
}

/* ---- tiny column-major matrix kit ---- */
function v3sub(a, b){ return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
function v3dot(a, b){ return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
function v3cross(a, b){ return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
function v3norm(a){ var l = Math.sqrt(v3dot(a, a)) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }
function m4persp(fovy, asp, n, f){
  var t = 1 / Math.tan(fovy / 2), nf = 1 / (n - f);
  return [t / asp,0,0,0, 0,t,0,0, 0,0,(f + n) * nf,-1, 0,0,2 * f * n * nf,0];
}
function m4look(e, c, u){
  var z = v3norm(v3sub(e, c)), x = v3norm(v3cross(u, z)), y = v3cross(z, x);
  return [x[0],y[0],z[0],0, x[1],y[1],z[1],0, x[2],y[2],z[2],0,
          -v3dot(x, e),-v3dot(y, e),-v3dot(z, e),1];
}
function m4mul(a, b){
  var o = [], c, r, k, s;
  for (c = 0; c < 4; c++) for (r = 0; r < 4; r++){
    for (s = 0, k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k];
    o[c * 4 + r] = s;
  }
  return o;
}
function m4inv(m){
  var a00=m[0],a01=m[1],a02=m[2],a03=m[3],a10=m[4],a11=m[5],a12=m[6],a13=m[7],
      a20=m[8],a21=m[9],a22=m[10],a23=m[11],a30=m[12],a31=m[13],a32=m[14],a33=m[15];
  var b00=a00*a11-a01*a10,b01=a00*a12-a02*a10,b02=a00*a13-a03*a10,b03=a01*a12-a02*a11,
      b04=a01*a13-a03*a11,b05=a02*a13-a03*a12,b06=a20*a31-a21*a30,b07=a20*a32-a22*a30,
      b08=a20*a33-a23*a30,b09=a21*a32-a22*a31,b10=a21*a33-a23*a31,b11=a22*a33-a23*a32;
  var det = b00*b11-b01*b10+b02*b09+b03*b08-b04*b07+b05*b06;
  det = det ? 1 / det : 0;
  return [(a11*b11-a12*b10+a13*b09)*det,(a02*b10-a01*b11-a03*b09)*det,(a31*b05-a32*b04+a33*b03)*det,(a22*b04-a21*b05-a23*b03)*det,
          (a12*b08-a10*b11-a13*b07)*det,(a00*b11-a02*b08+a03*b07)*det,(a32*b02-a30*b05-a33*b01)*det,(a20*b05-a22*b02+a23*b01)*det,
          (a10*b10-a11*b08+a13*b06)*det,(a01*b08-a00*b10-a03*b06)*det,(a30*b04-a31*b02+a33*b00)*det,(a21*b02-a20*b04-a23*b00)*det,
          (a11*b07-a10*b09-a12*b06)*det,(a00*b09-a01*b07+a02*b06)*det,(a31*b01-a30*b03-a32*b00)*det,(a20*b03-a21*b01+a22*b00)*det];
}
function hexRgb(h){
  h = (h || "#888").trim().replace("#", "");
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  var v = parseInt(h, 16);
  return [(v >> 16 & 255) / 255, (v >> 8 & 255) / 255, (v & 255) / 255];
}
function cssVar(n){ return getComputedStyle(document.documentElement).getPropertyValue(n); }

var CAM_VS_SOLID = "#version 300 es\nin vec2 aP; out vec2 vN;\n" +
  "void main(){ vN = aP; gl_Position = vec4(aP, 0.0, 1.0); }";

var CAM_FS_SOLID = [
  "#version 300 es",
  "precision highp float;",
  "in vec2 vN; out vec4 o;",
  "uniform mat4 uInv, uVP;",
  "uniform vec4 uA;   // R, T, lipR, lipH",
  "uniform vec4 uB;   // thruR, hubR, pocketDepth, partOn",
  "uniform vec4 uS;   // n, bcdR, holeR, nutR",
  "uniform vec4 uD;   // n, bcdR, studR, headR",
  "uniform vec4 uE;   // flange, headDepth, studLen, dst a0",
  "uniform vec4 uTl;  // tool tip xyz, radius",
  "uniform vec4 uTm;  // axis sign, on, flute length, holder radius",
  "uniform vec4 uBd;  // bounding sphere (world)",
  "uniform vec4 uM;   // stack mode, cutaway, explode 0..1, rim radius",
  "uniform vec4 uH;   // hub flange radius, vehicle stud radius, -, wheel pad radius",
  "uniform vec4 uW;   // wheel pad thickness, nut half-flats, nut height, spokes",
  "uniform vec4 uP;   // two-piece, hub-half thickness, wheel-half pull-apart, screw pull-out",
  "uniform vec4 uJ;   // join kind (0 none, 1 screws, 2 stacked), count, radius, a0",
  "uniform vec4 uK;   // A: clear r, counterbore r, cb depth, tap r · B: hole r, stud r, head r, pocket r",
  "uniform vec4 uL;   // A: head r, head h, dowel r, dowel a0 · B: nut floor above joint, stud top z, nut half-flats, -",
  "uniform vec4 uV;   // show hub half, show wheel half",
  "uniform vec4 uG;   // highlighted feature: 0 none, 1 vehicle holes, 2 hub bore, 3 wheel studs, 4 lip, 5 thickness",
  "uniform vec3 uCAl, uCSrc, uCDst, uCTool, uCHub, uCWhl, uCNut, uCInt, uCNeon;",
  "float cyl(vec3 p, float r, float z0, float z1){",
  "  vec2 d = vec2(length(p.xy) - r, max(z0 - p.z, p.z - z1));",
  "  return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));",
  "}",
  "float hexz(vec3 p, float r, float z0, float z1){",
  "  vec2 q = abs(p.xy);",
  "  vec2 d = vec2(max(dot(q, vec2(0.5, 0.8660254)), q.x) - r, max(z0 - p.z, p.z - z1));",
  "  return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));",
  "}",
  "float box2(vec2 p, vec2 b){ vec2 d = abs(p) - b; return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0); }",
  "vec2 polar(vec2 p, float n, float a0){",
  "  float s = 6.2831853 / n;",
  "  float a = mod(atan(p.y, p.x) - a0 + 0.5 * s, s) - 0.5 * s;",
  "  return length(p) * vec2(cos(a), sin(a));",
  "}",
  "void add(inout vec2 r, float d, float m){ if (d < r.x) r = vec2(d, m); }",
  "vec2 scene(vec3 p){",
  "  float T = uA.y;",
  "  vec2 res = vec2(1e3, 0.0);",
  "  if (uB.w > 0.5){",
  "    float J = -T + uP.y;                        // joint face between the halves",
  "    vec3 q = vec3(polar(p.xy, uS.x, 1.5707963) - vec2(uS.y, 0.0), p.z);",
  "    float hs = min(cyl(q, uS.z, -T - 1.0, uA.w + 1.0), cyl(q, uS.w, -T + uE.x, uA.w + 1.0));",
  "    vec3 pb = p; pb.z -= uP.z;                  // wheel half, pulled apart in the stack",
  "    vec3 w = vec3(polar(pb.xy, uD.x, uE.w) - vec2(uD.y, 0.0), pb.z);",
  "    float hb = uP.x > 0.5 ? J : -T;             // where the stud heads seat",
  "    float sh = min(cyl(w, uD.z, -T - 1.0, 1.0), cyl(w, uD.w, hb - 1.0, hb + uE.y));",
  "    float st = min(min(cyl(w, uD.z * 0.97, hb + 0.004, uE.z - 0.05), cyl(w, uD.z * 0.78, 0.0, uE.z)),",
  "                   cyl(w, uD.w * 0.96, hb + 0.004, hb + uE.y - 0.004));",
  "    if (uP.x < 0.5){",
  "      float d = min(cyl(p, uA.x, -T, 0.0), cyl(p, uA.z, -0.02, uA.w));",
  "      d = max(d, -cyl(p, uB.x, -T - 1.0, uA.w + 1.0));",
  "      d = max(d, -cyl(p, uB.y, -T - 1.0, -T + uB.z));",
  "      d = max(max(d, -hs), -sh);",
  "      res = vec2(d, hs < 0.004 ? 1.0 : 0.0);",
  "      add(res, st, 2.0);",
  "    } else {",
  "      /* hub half: lug-nut pockets open at the joint face */",
  "      float a = cyl(p, uA.x, -T, J - 0.008);",
  "      a = max(a, -cyl(p, uB.x, -T - 1.0, J + 1.0));",
  "      a = max(a, -cyl(p, uB.y, -T - 1.0, -T + uB.z));",
  "      a = max(a, -hs);",
  "      /* wheel half: pressed studs, heads seated at the joint face */",
  "      float bw = min(cyl(pb, uA.x, J + 0.008, 0.0), cyl(pb, uA.z, -0.02, uA.w));",
  "      bw = max(bw, -cyl(pb, uB.x, -T - 1.0, uA.w + 1.0));",
  "      bw = max(bw, -sh);",
  "      float fa = 1e3, fb = 1e3, fi = 1e3;          // fasteners: hub side, wheel side, in-between studs",
  "      vec3 jq = vec3(polar(p.xy, uJ.y, uJ.w) - vec2(uJ.z, 0.0), p.z);",
  "      vec3 jb = vec3(polar(pb.xy, uJ.y, uJ.w) - vec2(uJ.z, 0.0), pb.z);",
  "      if (uJ.x > 0.5 && uJ.x < 1.5){",
  "        /* A: cap screws through the wheel half into tapped holes; two dowels locate */",
  "        vec3 dq = vec3(polar(p.xy, 2.0, uL.w) - vec2(uJ.z, 0.0), p.z);",
  "        vec3 db = vec3(polar(pb.xy, 2.0, uL.w) - vec2(uJ.z, 0.0), pb.z);",
  "        a = max(a, -min(cyl(jq, uK.w, J - 0.6, J + 1.0), cyl(dq, uL.z, J - 0.36, J + 1.0)));",
  "        bw = max(bw, -min(min(cyl(jb, uK.x, -T - 1.0, 1.0), cyl(jb, uK.y, -uK.z, 1.0)), cyl(db, uL.z, J - 1.0, J + 0.36)));",
  "        vec3 js = jb; js.z -= uP.w;",
  "        fb = min(cyl(js, uL.x, -uK.z, -uK.z + uL.y), cyl(js, uK.x * 0.88, J - 0.55, -uK.z));",
  "        fa = cyl(dq, uL.z * 0.94, J - 0.33, J + 0.33);",
  "      } else if (uJ.x > 1.5){",
  "        /* B: in-between studs pressed into the hub half, nutted in wheel-half pockets */",
  "        a = max(a, -min(cyl(jq, uK.y, -T - 1.0, J + 1.0), cyl(jq, uK.z, -T - 1.0, -T + uE.y)));",
  "        bw = max(bw, -min(cyl(jb, uK.x, -T - 1.0, 1.0), cyl(jb, uK.w, J + uL.x, 1.0)));",
  "        fi = min(cyl(jq, uK.y * 0.97, -T + 0.004, uL.y), cyl(jq, uK.z * 0.96, -T + 0.004, -T + uE.y - 0.004));",
  "        if (uM.x > 0.5) fb = hexz(jb, uL.z, J + uL.x, J + uL.x + uW.z);",
  "      }",
  "      if (uV.x < 0.5){ a = 1e3; fa = 1e3; fi = 1e3; }",
  "      if (uV.y < 0.5){ bw = 1e3; fb = 1e3; st = 1e3; }",
  "      res = vec2(a, hs < 0.004 ? 1.0 : 0.0);",
  "      add(res, bw, 8.0);",
  "      add(res, st, 2.0);",
  "      add(res, min(fa, fb), 9.0);",
  "      add(res, fi, 10.0);",
  "    }",
  "  }",
  "  if (uTm.y > 0.5){",
  "    vec3 t = p - uTl.xyz; t.z *= uTm.x;",
  "    add(res, min(cyl(t, uTl.w, 0.0, uTm.z), cyl(t, uTm.w, uTm.z, uTm.z + 1.4)), 3.0);",
  "  }",
  "  if (uM.x > 0.5){",
  "    float e = uM.z;",
  "    /* vehicle hub, spindle and studs: slide inboard when pulled apart */",
  "    vec3 h = p; h.z += 1.6 * e;",
  "    if (cyl(h, uH.x + 0.2, -T - 3.5, -T + uE.x + uW.z + 0.4) < res.x){",
  "      add(res, min(min(cyl(h, uH.x, -T - 0.6, -T), cyl(h, uB.y * 1.15, -T - 2.0, -T - 0.6)),",
  "                   min(cyl(h, uB.y * 0.6, -T - 3.3, -T - 2.0), cyl(h, uB.y - 0.015, -T - 0.01, -T + uB.z * 0.85))), 4.0);",
  "      vec3 q = vec3(polar(h.xy, uS.x, 1.5707963) - vec2(uS.y, 0.0), h.z);",
  "      add(res, min(cyl(q, uH.y, -T - 0.6, -T + uE.x + uW.z + 0.12), cyl(q, uH.y * 1.7, -T - 0.78, -T - 0.6)), 5.0);",
  "    }",
  "    /* vehicle lug nuts, seated in the adapter's pockets */",
  "    vec3 vq = vec3(polar(p.xy, uS.x, 1.5707963) - vec2(uS.y, 0.0), p.z);",
  "    add(res, hexz(vq, uW.y, -T + uE.x, -T + uE.x + uW.z), 5.0);",
  "    /* wheel: pad, spokes, barrel; slides outboard */",
  "    vec3 w = p; w.z -= (2.4 + 0.8 * uP.x) * e;",
  "    float rr = uM.w;",
  "    if (cyl(w, rr + 0.5, -4.7, 4.7) < res.x){",
  "      float pad = max(cyl(w, uH.w, 0.0, uW.x), -cyl(w, uA.z, -1.0, 2.0));",
  "      vec3 ws = vec3(polar(w.xy, uD.x, uE.w) - vec2(uD.y, 0.0), w.z);",
  "      pad = max(pad, -cyl(ws, uD.z + 0.03, -1.0, 2.0));",
  "      vec2 sp = polar(w.xy, uW.w, uE.w + 3.14159265 / uW.w);",
  "      float spoke = max(box2(sp - vec2((uH.w + rr) * 0.5, 0.0), vec2((rr - uH.w) * 0.5 + 0.15, 0.55)),",
  "                        abs(w.z - uW.x * 0.5 - 0.3) - 0.5);",
  "      float barrel = max(abs(length(w.xy) - rr) - 0.12, abs(w.z) - 4.5);",
  "      float beads = max(abs(length(w.xy) - rr - 0.2) - 0.22, abs(abs(w.z) - 4.35) - 0.15);",
  "      add(res, min(min(pad, spoke), min(barrel, beads)), 6.0);",
  "    }",
  "    vec3 wn = w; wn.z -= 1.2 * e;",
  "    vec3 wq = vec3(polar(wn.xy, uD.x, uE.w) - vec2(uD.y, 0.0), wn.z);",
  "    add(res, hexz(wq, uW.y, uW.x, uW.x + 0.65), 7.0);",
  "    /* cutaway: half-section through the axle, removing the half toward world -Y */",
  "    if (uM.y > 0.5){",
  "      float cq = -p.x;",
  "      if (cq > res.x) res = vec2(cq, res.y + 20.0);",
  "    }",
  "  }",
  "  return res;",
  "}",
  "vec3 nrm(vec3 p){",
  "  const vec2 k = vec2(1.0, -1.0); const float h = 0.0008;",
  "  return normalize(k.xyy * scene(p + k.xyy * h).x + k.yyx * scene(p + k.yyx * h).x +",
  "                   k.yxy * scene(p + k.yxy * h).x + k.xxx * scene(p + k.xxx * h).x);",
  "}",
  "void main(){",
  "  vec4 a = uInv * vec4(vN, -1.0, 1.0); a /= a.w;",
  "  vec4 b = uInv * vec4(vN, 1.0, 1.0); b /= b.w;",
  "  vec3 ro = a.xyz, rd = normalize(b.xyz - a.xyz);",
  "  vec3 oc = ro - uBd.xyz; float bb = dot(oc, rd);",
  "  float hh = bb * bb - dot(oc, oc) + uBd.w * uBd.w;",
  "  if (hh < 0.0) discard;",
  "  hh = sqrt(hh);",
  "  float t = max(-bb - hh, 0.0), tmax = -bb + hh;",
  "  /* the assembly lies along world X (axle horizontal); the part frame has Z on the axis */",
  "  bool stk = uM.x > 0.5;",
  "  vec3 rp = stk ? ro.yzx : ro, dp = stk ? rd.yzx : rd;",
  "  vec2 m = vec2(1.0, 0.0); bool hit = false;",
  "  for (int i = 0; i < 220; i++){",
  "    m = scene(rp + dp * t);",
  "    if (m.x < 0.0002 + 0.00006 * t){ hit = true; break; }",
  "    t += m.x * 0.85;",
  "    if (t > tmax) break;",
  "  }",
  "  if (!hit) discard;",
  "  vec3 p = rp + dp * t, n = nrm(p);",
  "  vec3 nw = stk ? n.zxy : n, pw = stk ? p.zxy : p;",
  "  bool cut = m.y > 19.5; float id = cut ? m.y - 20.0 : m.y;",
  "  vec3 base = id < 0.5 ? uCAl : id < 1.5 ? mix(uCAl, uCSrc, 0.6) : id < 2.5 ? uCDst : id < 3.5 ? uCTool :",
  "              id < 4.5 ? uCHub : id < 5.5 ? uCSrc : id < 6.5 ? uCWhl : id < 7.5 ? uCNut :",
  "              id < 8.5 ? uCAl * vec3(1.04, 1.0, 0.9) :   // wheel half: a warmer aluminium so the halves read apart",
  "              id < 9.5 ? mix(uCInt, uCNut, 0.25) : uCInt;  // joining hardware: purple, like the legend",
  "  vec3 L1 = normalize(-rd + vec3(0.0, 0.0, 0.5));",
  "  vec3 L2 = normalize(vec3(-0.5, 0.4, 0.8));",
  "  float dif = max(dot(nw, L1), 0.0) * 0.65 + max(dot(nw, L2), 0.0) * 0.35;",
  "  float ao = 0.55 + 0.45 * clamp(scene(p + n * 0.08).x / 0.08, 0.0, 1.0);",
  "  float spec = pow(max(dot(reflect(rd, nw), L1), 0.0), 36.0) * 0.35;",
  "  vec3 col = base * (0.34 + 0.16 * (0.5 + 0.5 * nw.z) + 0.66 * dif) * ao + spec;",
  "  if (cut) col = base * (0.62 + 0.3 * step(0.5, fract((p.z + p.x - p.y) * 4.0)));   // hatched section face",
  "  if (uG.x > 0.5){",
  "    float T = uA.y, hl = 0.0, body = (id < 0.5 || (id > 7.5 && id < 8.5)) ? 1.0 : 0.0;",
  "    vec3 pq = p; if (uP.x > 0.5 && id > 7.5 && id < 8.5) pq.z -= uP.z;     // wheel half, maybe lifted",
  "    if (uG.x < 1.5) hl = ((id > 0.5 && id < 1.5) || (id > 4.5 && id < 5.5)) ? 1.0 : 0.0;",
  "    else if (uG.x < 2.5) hl = (body > 0.5 && abs(cyl(p, uB.y, -T - 1.0, -T + uB.z)) < 0.02) ||",
  "                             (id > 3.5 && id < 4.5 && length(p.xy) < uB.y + 0.02) ? 1.0 : 0.0;",
  "    else if (uG.x < 3.5) hl = (id > 1.5 && id < 2.5) ? 1.0 : 0.0;",
  "    else if (uG.x < 4.5) hl = (body > 0.5 && pq.z > -0.03 && length(pq.xy) < uA.z + 0.02) ? 1.0 : 0.0;",
  "    else hl = (body > 0.5 && abs(length(p.xy) - uA.x) < 0.02) ? 1.0 : 0.0;",
  "    col = mix(col, uCNeon * (0.55 + 0.55 * dif) + 0.08, hl * 0.85);",
  "  }",
  "  o = vec4(col, 1.0);",
  "  vec4 c = uVP * vec4(pw, 1.0);",
  "  gl_FragDepth = c.z / c.w * 0.5 + 0.5;",
  "}"
].join("\n");

var CAM_VS_LINE = [
  "#version 300 es",
  "in vec3 aP; in vec4 aC; in vec2 aD; in float aH;",
  "uniform mat4 uVP; uniform float uSep;",
  "out vec4 vC; out vec2 vD;",
  "void main(){ gl_Position = uVP * vec4(aP + vec3(0.0, 0.0, uSep * aH), 1.0);",
  "             gl_Position.z -= 0.0008 * gl_Position.w; vC = aC; vD = aD; }"
].join("\n");

var CAM_FS_LINE = [
  "#version 300 es",
  "precision highp float;",
  "in vec4 vC; in vec2 vD; out vec4 o;",
  "uniform float uProg, uHide;",
  "void main(){",
  "  if (vD.x > 0.0 && mod(vD.x, 0.14) > 0.07) discard;   // rapids dashed",
  "  float a = vC.a * uHide;",
  "  if (vD.y > uProg) a *= 0.14;                         // not yet cut in backplot",
  "  o = vec4(vC.rgb * a, a);",
  "}"
].join("\n");

var cam3d = {on:false, gl:null, ops:[], g:null, tl:[], total:0, t:0, playing:false,
  yaw:-0.9, pitch:0.6, dist:0, view:"iso", dragging:false, raf:0, last:0, curOp:-1,
  showPart:true, showStock:false, showPaths:false, off:{},     /* opens on the clean part */
  mode:"cam", modeShown:null, ex:1, exT:1, cut:true, showHub:true, showWheel:true,
  sep:1, sepT:1};          /* two-piece halves separated in the CAM view, by default */
var CAM_SEP_IN = 1.25;     /* how far the wheel half lifts off when separated */

/* Stack mode: generic hub and wheel around the real adapter. Only the adapter is
   to scale from the design; these are just there to show how it bolts up. */
var STACK_3D = {rimR:8.5, padT:0.8, nutFlat:0.4, nutH:0.6};

function camSupported(){
  if (cam3d.ok !== undefined) return cam3d.ok;
  var ok = false;
  try {
    var c = document.createElement("canvas");
    ok = !!(window.WebGL2RenderingContext &&
            c.getContext("webgl2", {failIfMajorPerformanceCaveat:true}));
    if (navigator.deviceMemory && navigator.deviceMemory < 2) ok = false;
  } catch (e){ ok = false; }
  return (cam3d.ok = ok);
}

function camProgram(gl, vs, fs){
  function sh(type, src){
    var s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
  var p = gl.createProgram();
  gl.attachShader(p, sh(gl.VERTEX_SHADER, vs));
  gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  p.u = {};
  var n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
  for (var i = 0; i < n; i++){
    var nm = gl.getActiveUniform(p, i).name;
    p.u[nm] = gl.getUniformLocation(p, nm);
  }
  return p;
}

function camInit(){
  var box = el("cam");
  box.innerHTML =
    '<div class="cam-vp" id="camvp">' +
      '<canvas id="camcv" role="img" aria-label="3D model of the adapter with machining toolpaths. Drag to orbit, scroll or pinch to zoom."></canvas>' +
      '<div class="tag cam-wcs" id="camwcs"></div>' +
      '<div class="cam-views" id="camviews" role="group" aria-label="Camera"></div>' +
      '<div class="tag cam-dro" id="camdro"></div>' +
      '<span class="cam-lbl" id="cl-x" style="color:#d9534f">X</span>' +
      '<span class="cam-lbl" id="cl-y" style="color:#3f9b52">Y</span>' +
      '<span class="cam-lbl" id="cl-z" style="color:#3b7ddd">Z</span>' +
    "</div>" +
    '<div class="cam-bp" id="cambp">' +
      '<button type="button" class="btn-sm" id="camplay">Play</button>' +
      '<input type="range" id="camseek" min="0" max="1000" value="1000" aria-label="Backplot position">' +
      '<span class="t" id="camtime"></span>' +
    "</div>" +
    '<div class="cam-bp" id="camstk" hidden>' +
      '<button type="button" class="btn-sm" id="stkbtn3"></button>' +
      '<label class="stk-cut"><input type="checkbox" id="stkcut" checked>Cutaway</label>' +
      '<button type="button" class="btn-sm" id="stk2d">2D section</button>' +
    "</div>" +
    '<div class="cam-tog" id="camshow"></div>' +
    '<div class="cam-join" id="camjoin" hidden></div>' +
    '<details class="cam-opsbox" id="camopsbox"><summary><span>Operations</span><span class="sm" id="camopsn"></span></summary>' +
      '<ul class="cam-ops" id="camops" aria-label="Toolpath operations"></ul></details>' +
    '<p class="cam-note" id="camnote"></p>';

  var cv = el("camcv"), c = cam3d;
  var gl = cv.getContext("webgl2", {antialias:true, premultipliedAlpha:true, alpha:true});
  if (!gl) throw new Error("WebGL2 unavailable");
  c.cv = cv; c.gl = gl;
  c.ps = camProgram(gl, CAM_VS_SOLID, CAM_FS_SOLID);
  c.pl = camProgram(gl, CAM_VS_LINE, CAM_FS_LINE);

  c.vaoS = gl.createVertexArray();
  gl.bindVertexArray(c.vaoS);
  var tri = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, tri);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  var la = gl.getAttribLocation(c.ps, "aP");
  gl.enableVertexAttribArray(la);
  gl.vertexAttribPointer(la, 2, gl.FLOAT, false, 0, 0);

  c.vaoL = gl.createVertexArray();
  gl.bindVertexArray(c.vaoL);
  c.lbuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, c.lbuf);
  /* aH = 1 for wheel-half toolpaths, which move with that half when separated */
  [["aP", 3, 0], ["aC", 4, 12], ["aD", 2, 28], ["aH", 1, 36]].forEach(function(a){
    var loc = gl.getAttribLocation(c.pl, a[0]);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, a[1], gl.FLOAT, false, 40, a[2]);
  });
  gl.bindVertexArray(null);

  /* orbit · pinch · wheel */
  var ptrs = {};
  cv.addEventListener("pointerdown", function(e){
    cv.setPointerCapture(e.pointerId);
    ptrs[e.pointerId] = {x:e.clientX, y:e.clientY, x0:e.clientX, y0:e.clientY};
    c.dragging = true; c.moved = false;
  });
  cv.addEventListener("pointermove", function(e){
    var p = ptrs[e.pointerId];
    if (!p){
      /* In the modal a mouse just hovering spins the part: one canvas width of
         travel is a full 360°, top to bottom tips it over. Delta-based, so
         entering the canvas never makes the view jump. */
      if (c.modal && c.hoverSpin && e.pointerType === "mouse" && c.hover){
        c.yaw -= (e.clientX - c.hover.x) / cv.clientWidth * 2 * Math.PI;
        c.pitch = Math.max(-1.555, Math.min(1.555,
          c.pitch + (e.clientY - c.hover.y) / cv.clientHeight * Math.PI * 0.9));
        c.view = null; camMarkViews(); camKick();
      }
      c.hover = {x:e.clientX, y:e.clientY};
      return;
    }
    if (Math.abs(e.clientX - p.x0) + Math.abs(e.clientY - p.y0) > 5){
      if (!c.moved){ c.view = null; camMarkViews(); }
      c.moved = true;
    }
    if (!c.moved) return;
    var ids = Object.keys(ptrs);
    if (ids.length === 1){
      c.yaw -= (e.clientX - p.x) * 0.008;
      c.pitch = Math.max(-1.555, Math.min(1.555, c.pitch + (e.clientY - p.y) * 0.008));
    } else if (ids.length === 2){
      var q = ptrs[ids[0] === String(e.pointerId) ? ids[1] : ids[0]];
      var d0 = Math.sqrt(Math.pow(p.x - q.x, 2) + Math.pow(p.y - q.y, 2));
      var d1 = Math.sqrt(Math.pow(e.clientX - q.x, 2) + Math.pow(e.clientY - q.y, 2));
      if (d0 > 0 && d1 > 0) camZoom(d0 / d1);
    }
    p.x = e.clientX; p.y = e.clientY;
    camKick();
  });
  function endp(e){
    delete ptrs[e.pointerId];
    if (!Object.keys(ptrs).length){
      c.dragging = false; camKick();
      /* a click (not a drag) on the inline view opens the big one */
      if (e.type === "pointerup" && !c.moved && !c.modal) camModal(true);
      /* in the big view a click (not a drag) pauses or resumes the mouse spin */
      else if (e.type === "pointerup" && !c.moved && c.modal && c.hoverSpin) camSpin(false);
    }
  }
  cv.addEventListener("pointerleave", function(){ c.hover = null; });
  cv.addEventListener("pointerup", endp);
  cv.addEventListener("pointercancel", endp);
  cv.addEventListener("wheel", function(e){
    e.preventDefault();
    camZoom(Math.exp(e.deltaY * 0.0012));
    camKick();
  }, {passive:false});
  cv.addEventListener("dblclick", function(){ camView("iso"); });
  cv.addEventListener("webglcontextlost", function(e){ e.preventDefault(); c.gl = null; c.ok = false; setDraw("2d"); });
  window.addEventListener("resize", camKick);
  if (window.matchMedia){
    var mq = window.matchMedia("(prefers-color-scheme: dark)");
    var fn = function(){ if (c.on){ camBuild(); camKick(); } };
    if (mq.addEventListener) mq.addEventListener("change", fn); else if (mq.addListener) mq.addListener(fn);
  }
}

function camFit(){
  var g = cam3d.g;
  if (!g) return 15;
  return cam3d.mode === "stack" ? STACK_3D.rimR * 4.6 : g.R * 3.6 + g.T;
}
function camZoom(f){
  var base = camFit();
  cam3d.dist = Math.max(base * 0.3, Math.min(base * 3, cam3d.dist * f));
}

function camView(v){
  var c = cam3d;
  c.view = v;
  if (v === "iso"){ c.yaw = -0.9; c.pitch = 0.6; }
  else if (v === "top"){ c.yaw = -Math.PI / 2; c.pitch = 1.555; }
  else if (v === "front"){ c.yaw = -Math.PI / 2; c.pitch = 0.0; }
  else if (v === "bottom"){ c.yaw = Math.PI / 2; c.pitch = -1.555; }   /* reads as G55: X mirrored */
  else if (v === "under"){ c.yaw = -0.9; c.pitch = -0.72; }              /* three-quarter from the hub side */
  /* stack: axle along world X, hub inboard (−X), wheel outboard (+X) */
  else if (v === "s-iso"){ c.yaw = -1.2; c.pitch = 0.32; }
  else if (v === "s-side"){ c.yaw = -Math.PI / 2; c.pitch = 0.0; }
  else if (v === "s-hub"){ c.yaw = Math.PI - 0.35; c.pitch = 0.18; }
  else if (v === "s-wheel"){ c.yaw = 0.35; c.pitch = 0.18; }
  c.dist = camFit();
  camMarkViews(); camKick();
}

/* Camera row. A two-piece in the CAM view also gets SEPARATE / JOIN for its halves. */
function camViewButtons(views){
  var c = cam3d, two = c.mode !== "stack" && c.g && !c.g.one;
  views = views || [["iso", "ISO"], ["top", "TOP"], ["front", "FRONT"], ["bottom", "G55"]];
  el("camviews").innerHTML = (two ? '<button type="button" class="sepbtn" id="camsep" title="' + (c.sepT === 1 ? "Put the two halves together" : "Pull the two halves apart") + '">' +
      (c.sepT === 1 ? "JOIN" : "SEPARATE") + "</button>" : "") +
    views.map(function(v){
      return '<button type="button" data-camview="' + v[0] + '">' + v[1] + "</button>";
    }).join("") + '<button type="button" id="camexpand" aria-label="Open 3D view full size">&#x2922;</button>';
  camMarkViews();
}

/* Swap the controls around the one viewport for CAM or stack mode. */
function camApplyMode(){
  var c = cam3d, stk = c.mode === "stack";
  var views = stk ? [["s-iso", "ISO"], ["s-side", "SIDE"], ["s-hub", "HUB SIDE"], ["s-wheel", "WHEEL SIDE"]]
                  : [["iso", "ISO"], ["top", "TOP"], ["front", "FRONT"], ["bottom", "G55"]];
  camViewButtons(views);
  el("cambp").hidden = stk;
  el("camstk").hidden = !stk;
  el("camopsbox").hidden = stk;
  el("camshow").hidden = stk;
  el("camdro").hidden = stk;
  ["cl-x", "cl-y", "cl-z"].forEach(function(id){ el(id).style.visibility = stk ? "hidden" : ""; });
  el("camnote").textContent = stk
    ? "Only the adapter is drawn from your numbers. The hub, wheel and nuts are generic, " +
      "there to show how it all bolts up. Drag to turn it; untick Cutaway to see it whole."
    : "Illustrative toolpaths from your eight numbers, with assumed tools and feeds. " +
      "Our machinists program the real job after review.";
  c.exT = stackExploded ? 1 : 0;
  if (!stk || c.modeShown !== "stack") c.ex = c.exT;
  el("stkbtn3").textContent = stackExploded ? "Bolt it together" : "Pull it apart";
  el("stkcut").checked = c.cut;
  if (stk) c.playing = false;
}

function camMarkViews(){
  var b = document.querySelectorAll("[data-camview]");
  for (var i = 0; i < b.length; i++) b[i].setAttribute("aria-pressed", b[i].getAttribute("data-camview") === cam3d.view);
}

/* Recompute geometry, toolpaths and the backplot timeline from the design. */
function camUpdate(d){
  var c = cam3d, atEnd = c.t >= c.total;
  c.g = camGeom(d);
  c.ops = camPaths(c.g);
  if (!c.dist) c.dist = c.g.R * 3.6 + c.g.T;
  camBuild();
  if (atEnd) c.t = c.total; else c.t = Math.min(c.t, c.total);
  camRenderOps();
  camKick();
}

function camBuild(){
  var c = cam3d, g = c.g, gl = c.gl, A = CAM_ASSUME;
  if (!g || !gl) return;
  var v = [], tl = [], t = 0, prevTool = null;
  function seg(a, b, col, dash, s0, s1, h){
    v.push(a[0], a[1], a[2], col[0], col[1], col[2], col[3], dash ? 0.001 : 0, s0, h || 0,
           b[0], b[1], b[2], col[0], col[1], col[2], col[3], dash ? dash : 0, s1, h || 0);
  }
  c.cols = {al:hexRgb("#b3bdc7"), src:hexRgb(cssVar("--cyan")), dst:hexRgb(cssVar("--stud")),
            tool:hexRgb("#d4a937"), hub:hexRgb("#6e7780"), whl:hexRgb("#8d969f"), nut:hexRgb("#c9ced3"),
            int:hexRgb("#7b5cd6"), neon:hexRgb(cssVar("--neon"))};
  if (c.mode === "stack"){
    /* a shop floor under the wheel, in world coords (axle along X) */
    var ink0 = hexRgb(cssVar("--steel")), fz = -STACK_3D.rimR - 0.36, k0;
    for (k0 = -12; k0 <= 12; k0++){
      var gc0 = ink0.concat([k0 % 2 === 0 ? 0.3 : 0.12]);
      seg([k0, -12, fz], [k0, 12, fz], gc0, 0, -1, -1);
      seg([-12, k0, fz], [12, k0, fz], gc0, 0, -1, -1);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, c.lbuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(v), gl.DYNAMIC_DRAW);
    c.nLines = v.length / 10;
    v = [];
  }
  /* timeline: machining minutes, so rapids fly and drilling crawls */
  c.ops.forEach(function(o, oi){
    if (c.off[o.grp + "|" + o.name]) return;
    if ((o.half === "hub" && !c.showHub) || (o.half === "wheel" && !c.showWheel)) return;
    if (prevTool && prevTool !== o.tool.id) t += A.toolChange;
    prevTool = o.tool.id;
    o.t0 = t;
    for (var i = 1; i < o.pts.length; i++){
      var la = o.pts[i - 1], lb = o.pts[i];
      var len = Math.sqrt(Math.pow(lb[0] - la[0], 2) + Math.pow(lb[1] - la[1], 2) + Math.pow(lb[2] - la[2], 2));
      var dt = len / (lb[3] ? A.feed.rapid : o.feed);
      tl.push({op:oi, la:la, lb:lb, a:camToPart(la, o), b:camToPart(lb, o),
               t0:t, t1:t + dt, rapid:lb[3], len:len});
      t += dt;
    }
    o.t1 = t;
  });
  c.tl = tl; c.total = t;
  if (c.mode === "stack") return;

  if (c.showPaths){
    var rap = [0.88, 0.7, 0.2, 0.9];
    tl.forEach(function(s){
      var col = s.rapid ? rap : hexRgb(c.ops[s.op].color).concat([1]);
      seg(s.a, s.b, col, s.rapid ? s.len + 0.001 : 0, s.t0 / t, s.t1 / t, c.ops[s.op].half === "wheel" ? 1 : 0);
    });
  }

  /* grid under the part, 0.5" minor / 1" major */
  var ink = hexRgb(cssVar("--steel")), zg = -g.T - g.so - 0.01, E = Math.ceil(g.R + g.so + 1), k;
  for (k = -E * 2; k <= E * 2; k++){
    var gc = ink.concat([k % 2 === 0 ? 0.32 : 0.13]);
    seg([k / 2, -E, zg], [k / 2, E, zg], gc, 0, -1, -1);
    seg([-E, k / 2, zg], [E, k / 2, zg], gc, 0, -1, -1);
  }
  /* stock envelope */
  if (c.showStock){
    var Rs = g.R + g.so, zt = g.lipH + g.so, zb = -g.T - g.so, sc = ink.concat([0.6]), a0, a1;
    for (k = 0; k < 72; k++){
      a0 = k / 72 * 2 * Math.PI; a1 = (k + 1) / 72 * 2 * Math.PI;
      seg([Rs * Math.cos(a0), Rs * Math.sin(a0), zt], [Rs * Math.cos(a1), Rs * Math.sin(a1), zt], sc, 0, -1, -1);
      seg([Rs * Math.cos(a0), Rs * Math.sin(a0), zb], [Rs * Math.cos(a1), Rs * Math.sin(a1), zb], sc, 0, -1, -1);
      if (k % 9 === 0) seg([Rs * Math.cos(a0), Rs * Math.sin(a0), zt], [Rs * Math.cos(a0), Rs * Math.sin(a0), zb], sc, 0, -1, -1);
    }
  }
  /* work offsets: G54 at the wheel face, G55 flipped at the hub face */
  var X = [0.85, 0.33, 0.31, 1], Y = [0.25, 0.61, 0.32, 1], Z = [0.23, 0.49, 0.87, 1], L = 1.2;
  seg([0, 0, 0], [L, 0, 0], X, 0, -1, -1);
  seg([0, 0, 0], [0, L, 0], Y, 0, -1, -1);
  seg([0, 0, 0], [0, 0, L], Z, 0, -1, -1);
  seg([0, 0, -g.T], [-L * 0.7, 0, -g.T], X, 0, -1, -1);
  seg([0, 0, -g.T], [0, L * 0.7, -g.T], Y, 0, -1, -1);
  seg([0, 0, -g.T], [0, 0, -g.T - L * 0.7], Z, 0, -1, -1);

  if (c.mode === "stack") return;
  gl.bindBuffer(gl.ARRAY_BUFFER, c.lbuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(v), gl.DYNAMIC_DRAW);
  c.nLines = v.length / 10;
}

function camRenderOps(){
  var c = cam3d, g = c.g, h = "", lastGrp = "", groups = {};
  c.ops.forEach(function(o){ (groups[o.grp] = groups[o.grp] || []).push(o); });
  c.ops.forEach(function(o, i){
    if (o.grp !== lastGrp){
      lastGrp = o.grp;
      var on = groups[o.grp].filter(function(x){ return !c.off[x.grp + "|" + x.name]; }).length;
      h += '<li class="grp"><label><input type="checkbox" data-camgrp="' + o.grp + '"' +
        (on ? " checked" : "") + (on && on < groups[o.grp].length ? ' data-mixed="1"' : "") + ">" +
        "<span>" + o.grp + "</span></label></li>";
    }
    h += '<li><label id="camop' + i + '"><input type="checkbox" data-camop="' + i + '"' +
      (c.off[o.grp + "|" + o.name] ? "" : " checked") + '><i style="background:' + o.color + '"></i>' +
      '<span class="nm">' + (i + 1) + " · " + o.name + "</span>" +
      '<span class="tl">' + o.tool.id + " Ø" + o.tool.d.toFixed(3) + "</span></label></li>";
  });
  el("camops").innerHTML = h;
  var mixed = el("camops").querySelectorAll("[data-mixed]");
  for (var k = 0; k < mixed.length; k++) mixed[k].indeterminate = true;
  el("camopsn").textContent = c.ops.length + " ops · est. " + fmtMin(c.total);

  /* Show: whole-view layers, plus each half of a two-piece */
  var sh = [["showPart", "Part"], ["showStock", "Stock"], ["showPaths", "Toolpaths"]];
  if (g && !g.one) sh.push(["showHub", "Hub half"], ["showWheel", "Wheel half"]);
  el("camshow").innerHTML = '<span class="lbl">Show</span>' + sh.map(function(x){
    return '<label><input type="checkbox" data-camshow="' + x[0] + '"' + (c[x[0]] ? " checked" : "") + ">" + x[1] + "</label>";
  }).join("");
  el("camjoin").hidden = !g || g.one;
  if (c.mode !== "stack") camViewButtons();
  if (g && !g.one) el("camjoin").innerHTML = joinPicker(g);
  c.curOp = -2;
}

/* Two-piece joining concepts, side by side, with what each costs. */
function joinPicker(g){
  var pl = g.plan, k = g.join.kind;
  function cost(j){
    if (!j) return "no in-between pattern fits";
    var odv = (2 * j.R).toFixed(2) + '" OD';
    var grow = j.R > pl.baseR + 0.005 ? " (+" + (2 * (j.R - pl.baseR)).toFixed(2) + '")' : "";
    var th = g.T + 1e-6 < j.needT ? " · needs " + j.needT.toFixed(2) + '" thick' : "";
    return odv + grow + th;
  }
  return '<span class="lbl">Join halves &middot; concept for shop review</span>' +
    '<div class="jseg" role="group" aria-label="How the two halves join">' +
    '<button type="button" data-join="A" aria-pressed="' + (k === "A") + '"><b>A &middot; Cap screws</b>' +
      "<span>" + JOIN_A.n + ' &times; 5/16" + 2 dowels &middot; ' + cost(pl.A) + "</span></button>" +
    '<button type="button" data-join="B" aria-pressed="' + (k === "B") + '"' + (pl.B ? "" : " disabled") + ">" +
      "<b>B &middot; Stacked studs</b><span>" + (pl.B ? pl.B.n + " in-between studs &middot; " : "") + cost(pl.B) +
      "</span></button></div>";
}

function fmtMin(m){
  var s = Math.round(m * 60);
  return Math.floor(s / 60) + ":" + ("0" + s % 60).slice(-2);
}

/* Tool position at machining time t → {seg, part xyz, setup xyz}. */
function camAt(t){
  var tl = cam3d.tl, lo = 0, hi = tl.length - 1;
  if (!tl.length) return null;
  while (lo < hi){ var mid = (lo + hi) >> 1; if (tl[mid].t1 < t) lo = mid + 1; else hi = mid; }
  var s = tl[lo], f = s.t1 > s.t0 ? Math.max(0, Math.min(1, (t - s.t0) / (s.t1 - s.t0))) : 1;
  function lerp(a, b){ return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f]; }
  return {s:s, p:lerp(s.a, s.b), l:lerp(s.la, s.lb)};
}

function camKick(){
  if (cam3d.raf || !cam3d.on) return;
  cam3d.raf = requestAnimationFrame(camFrame);
}

function camFrame(now){
  var c = cam3d;
  c.raf = 0;
  if (!c.on || !c.gl) return;
  if (c.sep !== c.sepT){
    var ds = c.lastS ? Math.min(100, now - c.lastS) : 16, ss = ds / 600;
    c.sep = c.sep < c.sepT ? Math.min(c.sepT, c.sep + ss) : Math.max(c.sepT, c.sep - ss);
    c.lastS = now; c.anim = true; camKick();
  } else c.lastS = 0;
  if (c.ex !== c.exT){
    var de = c.lastE ? Math.min(100, now - c.lastE) : 16, stp = de / 700;
    c.ex = c.ex < c.exT ? Math.min(c.exT, c.ex + stp) : Math.max(c.exT, c.ex - stp);
    c.lastE = now; c.anim = true; camKick();
  } else { c.lastE = 0; if (c.sep === c.sepT) c.anim = false; }
  if (c.playing){
    var dt = c.last ? Math.min(100, now - c.last) : 16;
    c.t = Math.min(c.total, c.t + dt * c.total / 25000);    /* whole program in ~25 s */
    if (c.t >= c.total){ c.playing = false; el("camplay").textContent = "Play"; }
    el("camseek").value = String(Math.round(c.t / (c.total || 1) * 1000));
    c.last = now;
  } else c.last = 0;
  camDraw();
  if (c.playing) camKick();
}

function camDraw(){
  var c = cam3d, gl = c.gl, g = c.g, cv = c.cv;
  if (!gl || !g) return;
  var dpr = Math.min(window.devicePixelRatio || 1, 1.5) * (c.dragging || c.playing || c.anim ? 0.65 : 1);
  var stk = c.mode === "stack", SK = STACK_3D;
  var cw = cv.clientWidth, ch = cv.clientHeight;
  var w = Math.max(1, Math.round(cw * dpr)), h = Math.max(1, Math.round(ch * dpr));
  if (cv.width !== w || cv.height !== h){ cv.width = w; cv.height = h; }
  /* settle back to full resolution once interaction stops */
  if (dpr < 1 && !c.dragging && !c.playing && !c.anim) camKick();

  /* stack: part z runs along world x; frame the assembled stack */
  var es = c.sep * c.sep * (3 - 2 * c.sep);
  var sepOff = !stk && !g.one ? CAM_SEP_IN * es : 0;          /* CAM view: wheel half lifted */
  var tgt = stk ? [(-g.T - 3.3 + 4.5) / 2, 0, 0] : [0, 0, (g.lipH - g.T + sepOff) / 2];
  var dist = c.dist * Math.max(1, h / w);            /* keep the part in frame when tall and narrow */
  var eye = [tgt[0] + dist * Math.cos(c.pitch) * Math.cos(c.yaw),
             tgt[1] + dist * Math.cos(c.pitch) * Math.sin(c.yaw),
             tgt[2] + dist * Math.sin(c.pitch)];
  var P = m4persp(0.6, w / h, 0.2, 200), V = m4look(eye, tgt, [0, 0, 1]), VP = m4mul(P, V);

  var done = c.t >= c.total - 1e-9, at = camAt(c.t), A = CAM_ASSUME;
  var op = at && !done && !stk ? c.ops[at.s.op] : null;
  /* The gold tool only appears while the program is playing. Parked on its own it
     reads as part of the adapter. The readout still follows the slider. */
  var showTool = op && c.playing;

  gl.viewport(0, 0, w, h);
  gl.clearColor(0, 0, 0, 0); gl.clearDepth(1);
  gl.depthMask(true);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  /* solid */
  var u = c.ps.u, zTop = g.lipH + g.so + A.clear + 3.2, zBot = -g.T - g.so - A.clear - 3.2;
  gl.useProgram(c.ps);
  gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LESS); gl.disable(gl.BLEND);
  gl.uniformMatrix4fv(u.uInv, false, new Float32Array(m4inv(VP)));
  gl.uniformMatrix4fv(u.uVP, false, new Float32Array(VP));
  gl.uniform4f(u.uA, g.R, g.T, g.lipR, g.lipH);
  gl.uniform4f(u.uB, g.thruR, g.hubR, g.pocketDepth, c.showPart ? 1 : 0);
  gl.uniform4f(u.uS, g.src.n, g.src.r, g.src.holeR, g.src.nutR);
  gl.uniform4f(u.uD, g.dst.n, g.dst.r, g.dst.studR, g.dst.headR);
  gl.uniform4f(u.uE, g.src.flange, g.dst.headDepth, g.dst.len, g.dst.a0);
  if (showTool){
    var tr = op.tool.d / 2;
    gl.uniform4f(u.uTl, at.p[0], at.p[1], at.p[2] + (op.half === "wheel" ? sepOff : 0), tr);
    gl.uniform4f(u.uTm, op.xf.flip ? -1 : 1, 1, op.tool.d > 2 ? 0.6 : 1.4, Math.max(0.55, tr * 1.1));
  } else gl.uniform4f(u.uTm, 1, 0, 1, 0.5);
  if (stk){
    var zLo = -g.T - 3.5 - 1.6, zHi = 4.7 + 2.4 + 1.2;
    gl.uniform4f(u.uBd, (zLo + zHi) / 2, 0, 0,
      Math.sqrt(Math.pow(SK.rimR + 0.6, 2) + Math.pow((zHi - zLo) / 2, 2)));
  } else gl.uniform4f(u.uBd, 0, 0, (zTop + zBot) / 2,
    Math.sqrt(Math.pow(g.R + g.so + 2, 2) + Math.pow((zTop - zBot) / 2, 2)));
  var ee = c.ex * c.ex * (3 - 2 * c.ex);
  gl.uniform4f(u.uM, stk ? 1 : 0, stk && c.cut ? 1 : 0, ee, SK.rimR);
  gl.uniform4f(u.uH, g.src.r + 0.8, THREADS[design.vehicleThread].dia / 25.4 / 2, 0,
    Math.max(g.src.r + 0.8, g.dst.r + 0.9, g.R + 0.4));
  gl.uniform4f(u.uW, SK.padT, Math.min(SK.nutFlat, g.src.nutR * 0.82), SK.nutH, g.dst.n);
  var jn = g.join, JA = JOIN_A;
  gl.uniform4f(u.uP, g.one ? 0 : 1, g.tA, stk && !g.one ? 0.8 * ee : sepOff,
    jn && jn.kind === "A" ? (stk ? 0.7 * ee : 0.55 * es) : 0);   /* screws back out a little more */
  if (!jn) gl.uniform4f(u.uJ, 0, 1, 1, 0);
  else if (jn.kind === "A"){
    gl.uniform4f(u.uJ, 1, jn.n, jn.r, jn.a0);
    gl.uniform4f(u.uK, JA.clearD / 2, JA.cbD / 2, JA.cbDepth, JA.tapD / 2);
    gl.uniform4f(u.uL, JA.headD / 2, JA.headH, JA.dowelD / 2, jn.a0 + Math.PI / jn.n);
  } else {
    gl.uniform4f(u.uJ, 2, jn.n, jn.r, jn.a0);
    gl.uniform4f(u.uK, jn.holeR, jn.studR, jn.headR, jn.lugR);
    gl.uniform4f(u.uL, jn.flangeB, -g.T + g.tA + jn.flangeB + SK.nutH + 0.12,
      Math.min(SK.nutFlat, jn.lugR * 0.82), 0);
  }
  gl.uniform4f(u.uV, c.showHub || stk ? 1 : 0, c.showWheel || stk ? 1 : 0, 0, 0);
  gl.uniform3fv(u.uCAl, c.cols.al); gl.uniform3fv(u.uCSrc, c.cols.src);
  gl.uniform3fv(u.uCDst, c.cols.dst); gl.uniform3fv(u.uCTool, c.cols.tool);
  gl.uniform3fv(u.uCHub, c.cols.hub); gl.uniform3fv(u.uCWhl, c.cols.whl); gl.uniform3fv(u.uCNut, c.cols.nut); gl.uniform3fv(u.uCInt, c.cols.int);
  gl.uniform3fv(u.uCNeon, c.cols.neon); gl.uniform4f(u.uG, c.hl || 0, 0, 0, 0);
  gl.bindVertexArray(c.vaoS);
  gl.drawArrays(gl.TRIANGLES, 0, 3);

  /* lines: hidden pass faint, visible pass full */
  gl.useProgram(c.pl);
  gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.depthMask(false);
  gl.uniformMatrix4fv(c.pl.u.uVP, false, new Float32Array(VP));
  gl.uniform1f(c.pl.u.uProg, done ? 2 : c.t / (c.total || 1));
  gl.uniform1f(c.pl.u.uSep, sepOff);
  gl.bindVertexArray(c.vaoL);
  gl.depthFunc(gl.GREATER); gl.uniform1f(c.pl.u.uHide, 0.12);
  gl.drawArrays(gl.LINES, 0, c.nLines);
  gl.depthFunc(gl.LEQUAL); gl.uniform1f(c.pl.u.uHide, 1);
  gl.drawArrays(gl.LINES, 0, c.nLines);
  gl.bindVertexArray(null);

  /* HTML overlays: axis labels, WCS tag, DRO */
  function place(id, p){
    var q = VP, x = q[0] * p[0] + q[4] * p[1] + q[8] * p[2] + q[12],
        y = q[1] * p[0] + q[5] * p[1] + q[9] * p[2] + q[13],
        ww = q[3] * p[0] + q[7] * p[1] + q[11] * p[2] + q[15], n = el(id);
    n.hidden = ww <= 0;
    n.style.left = ((x / ww + 1) / 2 * cw).toFixed(1) + "px";
    n.style.top = ((1 - y / ww) / 2 * ch).toFixed(1) + "px";
  }
  place("cl-x", [1.4, 0, 0]); place("cl-y", [0, 1.4, 0]); place("cl-z", [0, 0, 1.4]);

  el("camwcs").textContent = stk ? "HUB · ADAPTER · WHEEL" + (g.one ? "" : " · 2-PIECE") + (c.cut ? " · CUTAWAY" : "")
    : (op || c.ops[0]).wcs;
  var l = at ? at.l : [0, 0, 0];
  el("camdro").innerHTML =
    '<span class="x"><b>X</b>' + l[0].toFixed(4) + "</span>" +
    '<span class="y"><b>Y</b>' + l[1].toFixed(4) + "</span>" +
    '<span class="z"><b>Z</b>' + l[2].toFixed(4) + "</span>" +
    '<span class="op">' + (op
      ? (at.s.rapid ? "G0" : "G1 F" + op.feed) + " · " + op.tool.id + " " + op.tool.name + " · " + (at.s.op + 1) + " " + op.name
      : (g.one ? "1-piece · " : "2-piece · ") + c.ops.length + " ops · est. cycle " + fmtMin(c.total) +
        " per adapter · v0.1 assumptions") + "</span>";
  el("camtime").textContent = fmtMin(c.t) + " / " + fmtMin(c.total);

  var cur = op ? at.s.op : -1;
  if (cur !== c.curOp){
    var prev = el("camop" + c.curOp), now = el("camop" + cur);
    if (prev) prev.className = "";
    if (now) now.className = "now";
    c.curOp = cur;
  }
}

/* Full-size view. The live viewport and backplot bar are MOVED into the
   dialog and back, so there is one GL context and nothing to keep in sync.
   No position:fixed (it collapses artifact frames) — like the tour, the
   dialog is absolute in document coordinates, sized to the viewport, with
   page scroll locked while it is open. */
function camModal(open){
  var c = cam3d, m = el("cammodal");
  if (!m){
    m = document.createElement("div");
    m.id = "cammodal"; m.className = "cam-modal"; m.hidden = true;
    m.innerHTML = '<div class="cam-modal-in" role="dialog" aria-modal="true" aria-labelledby="cammodalt">' +
      '<div class="cam-modal-hd"><b id="cammodalt">3D CAM view</b>' +
      '<span class="hint-mouse spin-info" id="camspininfo" role="status"></span>' +
      '<span class="hint-touch">Drag to spin · pinch to zoom</span>' +
      '<button type="button" class="btn-sm hint-mouse" id="camspin"></button>' +
      '<button type="button" class="btn-sm" id="camclose">Close</button></div>' +
      '<div class="cam-modal-bd" id="cammodalbd"></div></div>';
    document.body.appendChild(m);
    m.addEventListener("click", function(e){ if (e.target === m) camModal(false); });
  }
  var vp = el("camvp"), bp = el("cambp");
  if (open && !c.modal){
    c.modal = true; c.hover = null;
    camSpin(false);
    el("cammodalt").textContent = c.mode === "stack" ? "3D stack view" : "3D CAM view";
    el("cammodalbd").appendChild(vp);
    el("cammodalbd").appendChild(bp);
    el("cammodalbd").appendChild(el("camstk"));
    document.documentElement.style.overflow = "hidden";
    m.hidden = false;
    camPlaceModal();
    el("camclose").focus();
  } else if (!open && c.modal){
    c.modal = false;
    var box = el("cam");
    box.insertBefore(el("camstk"), box.firstChild);
    box.insertBefore(bp, el("camstk"));
    box.insertBefore(vp, bp);
    document.documentElement.style.overflow = "";
    m.hidden = true;
    /* opened from Review's i button: return the panel to the view it was on */
    if (c.modalReturn){ var rv = c.modalReturn; c.modalReturn = null; setDraw(rv); }
    var opener = c.modalOpener || el("camexpand"); c.modalOpener = null;
    if (opener) opener.focus({preventScroll:true});
  }
  camKick();
}
/* The big view turns by click-and-drag, same as the panel. Hover spin (the part
   follows the mouse with no button held) is opt-in, because while it is on you
   cannot move the mouse without turning the part — so the header always says
   which mode it is in and how to get out. */
function camSpin(on){
  var c = cam3d;
  c.hoverSpin = on; c.hover = null;
  var info = el("camspininfo"), btn = el("camspin");
  if (!info) return;
  info.innerHTML = on
    ? "<b>Hover spin is on</b> &mdash; the part follows your mouse. <b>Click the model</b> or press " +
      "<kbd>Space</kbd> to stop it."
    : "<b>Click and drag</b> to turn it. <span>Scroll to zoom · double-click to reset · " +
      "<kbd>Space</kbd> for hover spin.</span>";
  info.className = "hint-mouse spin-info" + (on ? " on" : "");
  btn.textContent = on ? "Stop hover spin" : "Hover spin";
  btn.setAttribute("aria-pressed", on);
}

function camPlaceModal(){
  var m = el("cammodal");
  if (!m || m.hidden) return;
  m.style.top = window.scrollY + "px";
  m.style.height = window.innerHeight + "px";
  camKick();
}
window.addEventListener("resize", camPlaceModal);
document.addEventListener("keydown", function(e){
  if (cam3d.modal && (e.key === "Escape" || e.key === "Esc")) camModal(false);
  /* Space pauses / resumes the mouse spin — unless a button has focus, where Space presses it */
  else if (cam3d.modal && (e.key === " " || e.key === "Spacebar") &&
           !(document.activeElement && document.activeElement.tagName === "BUTTON")){
    e.preventDefault(); camSpin(!cam3d.hoverSpin);
  }
});

function camSet(on){
  var c = cam3d;
  if (on && !camSupported()) on = false;
  if (on && !c.gl){
    try { camInit(); }
    catch (e){
      c.ok = false; on = false;
      if (window.console) console.warn("3D view unavailable:", e);
    }
  }
  c.on = on;
  if (!on){ c.playing = false; if (c.modal) camModal(false); }
  el("cam").hidden = !on;
  document.querySelector(".draw").classList.toggle("is3d", on);
  if (c.ok === false){
    el("v3d").disabled = true;
    el("v3d").title = "3D needs WebGL2 on a capable device. The 2D drawing is exact.";
  }
  if (on){
    var pb = el("camplay"); if (pb) pb.textContent = "Play";
    var fresh = c.modeShown !== c.mode;
    camApplyMode();
    c.modeShown = c.mode;
    camUpdate(design);
    if (fresh) camView(c.mode === "stack" ? "s-iso" : "iso");
    camMarkViews();
  }
}
