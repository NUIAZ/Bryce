/* Adapter Designer v2 — the store's header and footer navigation.
   Mirrors customwheeladapters.com (same business, Bronson Investments) so the
   builder feels like one more page of the store. Links go to the live store.
   Loaded first; needs nothing from the other files. */

var STORE = "https://customwheeladapters.com";

/* Same menu as the store header. A group with `u` is a link; with `items`, a heading. */
var STORE_NAV = [
  {t:"Wheel Adapters", groups:[
    {t:"10 Lug Wheel Adapters", u:"/collections/10-lug-wheel-adapters"},
    {t:"8 Lug Wheel Adapters", items:[
      ["8x6.5 Wheel Adapters", "/collections/8x6-5-wheel-adapters"],
      ["8x170 Wheel Adapters", "/collections/8x170-wheel-adapters"],
      ["8x180 Wheel Adapters", "/collections/8x180-wheel-adapters"],
      ["8x200 Wheel Adapters", "/collections/8x200-wheel-adapters"],
      ["8 to 10 Lug Wheel Adapters", "/collections/8-to-10-lug-adapter-conversion"],
      ["8x210 Wheel Adapters", "/collections/8x210-wheel-adapters-1"]]},
    {t:"6 Lug Wheel Adapters", items:[
      ["6x115 Wheel Adapters", "/collections/6x115-wheel-adapters"],
      ["6x120 Wheel Adapters", "/collections/6x120-wheel-adapters"],
      ["6x132 Wheel Adapters", "/collections/6x132-wheel-adapters"],
      ["6x135 Wheel Adapters", "/collections/6x135-wheel-adapters"],
      ['6x4.5" / 6x114.3mm Wheel Adapters', "/collections/6x4-5-wheel-adapters"],
      ['6x5" / 6x127mm Wheel Adapters', "/collections/6x5-wheel-adapters"],
      ['6x5.5" Wheel Adapters', "/collections/6x5-5-wheel-adapters"]]},
    {t:"5 Lug Wheel Adapters", items:[
      ["5x100 Wheel Adapters", "/collections/5x100-wheel-adapters"],
      ["5x105 Wheel Adapters", "/collections/5x105-wheel-adapters"],
      ["5x110 Wheel Adapters", "/collections/5x110-wheel-adapters"],
      ["5x112 Wheel Adapters", "/collections/5x112-wheel-adapters"],
      ["5x115 Wheel Adapters", "/collections/5x115-wheel-adapters"],
      ["5x120 Wheel Adapters", "/collections/5x120-wheel-adapters"],
      ["5x130 Wheel Adapters", "/collections/5x130-wheel-adapters"],
      ["5x135 Wheel Adapters", "/collections/5x135-wheel-adapters"],
      ["5x150 Wheel Adapters", "/collections/5x150-wheel-adapters"],
      ['5x4" Wheel Adapters', "/collections/5x4-wheel-adapters"],
      ['5x4.25" / 5x108mm Wheel Adapters', "/collections/5x4-25-wheel-adapters"],
      ["5x5 / 5x127mm Wheel Adapters", "/collections/5x5-wheel-adapters"],
      ['5x4.5" / 5x114.3mm Wheel Adapters', "/collections/5x4-5-wheel-adapters"],
      ['5x4.75" / 5x120.7mm Wheel Adapters', "/collections/5x4-75-wheel-adapters"],
      ['5x5.5" Wheel Adapters', "/collections/5x5-5-wheel-adapters"]]},
    {t:"4 Lug Wheel Adapters", items:[
      ["4x98 Wheel Adapters", "/collections/4x98-wheel-adapters"],
      ["4x100 Wheel Adapters", "/collections/4x100-adapters"],
      ["4x110 Wheel Adapters", "/collections/4x110-adapters"],
      ["4x115 Wheel Adapters", "/collections/4x115-wheel-adapters"],
      ["4x120 Wheel Adapters", "/collections/4x120-wheel-adapters"],
      ["4x130 Wheel Adapters", "/collections/4x130-wheel-adapters"],
      ["4x137 Wheel Adapters", "/collections/4x137-wheel-adapters"],
      ["4x140 Wheel Adapters", "/collections/4x140-wheel-adapters"],
      ["4x144 Wheel Adapters", "/collections/4x144-wheel-adapters"],
      ["4x156 Wheel Adapters", "/collections/4x156-wheel-adapters"],
      ['4x4" Wheel Adapters', "/collections/4x4-wheel-adapters"],
      ['4x4.25" Wheel Adapters', "/collections/4x4-25-wheel"],
      ['4x4.5" Wheel Adapters', "/collections/4x4-5-wheel-adapters"]]},
    {t:"3 Lug Adapters", u:"/collections/3-to-x"},
    {t:"2-Piece Wheel Adapters", items:[
      ["5 to 6 Lug Wheel Adapters", "/collections/5-to-6-lug-wheel-adapters"],
      ["5 to 10 Lug Wheel Adapters", "/collections/5-to-10-lug-wheel-adapters"]]}
  ]},
  {t:"Wheel Spacers", groups:[
    {t:"By Vehicle", items:[
      ["Chevrolet", "/collections/chevrolet"],
      ["GMC", "/collections/gmc-wheel-spacers"],
      ["Dodge", "/collections/dodgewheel-spacers"],
      ["Ford", "/collections/ford"],
      ["Tesla", "/collections/5-lug-wheel-spacers"]]},
    {t:"8 Lug Wheel Spacers", items:[
      ["8x6.5 (8x165.1)", "/collections/8x6-5-wheel-spacers"],
      ["8x170", "/collections/8x170-wheel-spacers"],
      ["8x200", "/collections/8x200-wheel-spacers"],
      ["8x210", "/collections/8x210-wheel-spacers"],
      ["8x225", "/collections/8x225-wheel-spacers"]]},
    {t:"6 Lug Wheel Spacers", items:[
      ["6x5.5 (6x139.7)", "/collections/6x5-5-wheel-spacers"],
      ["6x135", "/collections/6x135-wheel-spacers"],
      ["6x132", "/collections/6x132-wheel-spacers-for-gmc-chevy-buick-saturn"],
      ["6x130", "/collections/6x130-wheel-spacers"]]}
  ]},
  {t:"Slip On Wheel Spacers", groups:[
    {t:"10 Lug Wheel Spacers", u:"/collections/10-lug-wheel-spacers"},
    {t:"8 Lug Wheel Spacers", u:"/collections/8-lug-wheel-spacers"},
    {t:"5 Lug Wheel Spacers", u:"/collections/5-lug-wheel-spacers-usa-made"}
  ]},
  {t:"Lug Nuts & Lug Bolts", groups:[
    {t:"Lug Nuts", items:[
      ["Open End Lug Nuts", "/collections/open-end-lug-nuts"],
      ["Semi Truck Lug Nuts", "/collections/semi-truck-lug-nuts"]]},
    {t:"Lug Bolts", items:[
      ["Low Profile Lug Bolts", "/collections/short-head-lug-bolt"],
      ["Acorn Seat Lug Bolts", "/collections/lug-bolts"]]}
  ]},
  {t:"Info / Contact Us", groups:[
    {t:"Contact Us", u:"/pages/contact-us"},
    {t:"About Us", u:"/pages/about-us"},
    {t:"Refund Policy", u:"/policies/refund-policy"},
    {t:"Shipping Policy", u:"/policies/shipping-policy"},
    {t:"Privacy Policy", u:"/policies/privacy-policy"},
    {t:"Terms of Service", u:"/policies/terms-of-service"},
    {t:"FAQ", u:"/pages/faq"}
  ]},
  {t:"Custom Build Quote", here:true}          /* this page — the builder replaces the store's form */
];

function storeEsc(s){ return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;"); }
function storeLink(t, u, cls){
  return '<a class="' + (cls || "") + '" href="' + STORE + u + '">' + storeEsc(t) + "</a>";
}
var CHEVRON = '<svg class="sh-chev" width="10" height="6" viewBox="0 0 10 6" aria-hidden="true">' +
  '<path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>';

function storeMenu(m){
  /* groups that are plain links sit in one column; headed groups get their own */
  var links = m.groups.filter(function(g){ return g.u; }), heads = m.groups.filter(function(g){ return g.items; });
  var cols = heads.map(function(g){
    return '<div class="sh-col"><p class="sh-colh">' + storeEsc(g.t) + "</p><ul>" +
      g.items.map(function(it){ return "<li>" + storeLink(it[0], it[1]) + "</li>"; }).join("") + "</ul></div>";
  });
  if (links.length) cols.unshift('<div class="sh-col"><ul>' +
    links.map(function(g){ return "<li>" + storeLink(g.t, g.u, "sh-strong") + "</li>"; }).join("") + "</ul></div>");
  return cols.join("");
}

function buildStoreHeader(){
  var nav = document.getElementById("shnav"), drawer = document.getElementById("shdrawer");
  nav.innerHTML = '<ul class="sh-list">' + STORE_NAV.map(function(m, i){
    if (m.here) return '<li><a class="sh-top sh-here" href="./" aria-current="page">' + storeEsc(m.t) + "</a></li>";
    return '<li><details class="sh-dd"><summary class="sh-top">' + storeEsc(m.t) + CHEVRON + "</summary>" +
      '<div class="sh-panel' + (m.groups.length > 3 && m.groups.some(function(g){ return g.items; }) ? " wide" : "") + '">' +
      storeMenu(m) + "</div></details></li>";
  }).join("") + "</ul>";

  drawer.innerHTML = STORE_NAV.map(function(m){
    if (m.here) return '<a class="sh-dr-top sh-here" href="./" aria-current="page">' + storeEsc(m.t) + "</a>";
    return '<details class="sh-dr"><summary class="sh-dr-top">' + storeEsc(m.t) + CHEVRON + "</summary>" +
      m.groups.map(function(g){
        if (g.u) return storeLink(g.t, g.u, "sh-dr-link");
        return '<details class="sh-dr sh-sub"><summary class="sh-dr-sub">' + storeEsc(g.t) + CHEVRON + "</summary>" +
          g.items.map(function(it){ return storeLink(it[0], it[1], "sh-dr-link"); }).join("") + "</details>";
      }).join("") + "</details>";
  }).join("");

  /* one desktop menu open at a time; a click elsewhere or Esc closes it */
  var dds = nav.querySelectorAll("details.sh-dd");
  function closeAll(except){ for (var i = 0; i < dds.length; i++) if (dds[i] !== except) dds[i].open = false; }
  for (var i = 0; i < dds.length; i++) dds[i].addEventListener("toggle", function(e){ if (e.target.open) closeAll(e.target); });
  document.addEventListener("click", function(e){ if (!e.target.closest || !e.target.closest(".sh-dd")) closeAll(null); });
  document.addEventListener("keydown", function(e){
    if (e.key === "Escape" || e.key === "Esc"){ closeAll(null); setDrawer(false); }
  });

  var burger = document.getElementById("shburger");
  function setDrawer(open){
    drawer.hidden = !open;
    burger.setAttribute("aria-expanded", open);
    burger.setAttribute("aria-label", open ? "Close menu" : "Menu");
    burger.classList.toggle("open", open);
  }
  burger.addEventListener("click", function(){ setDrawer(drawer.hidden); });
}
buildStoreHeader();
