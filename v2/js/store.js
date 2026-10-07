/* Adapter Designer v2 — header behaviour.
   The header looks like customwheeladapters.com (same business), but its menu is the
   builder's own: New design · My designs · Help, with the logo and "Main Site"
   linking back to the store. Loaded first; needs nothing from the other files. */

var STORE = "https://customwheeladapters.com";

(function(){
  var burger = document.getElementById("shburger"), drawer = document.getElementById("shdrawer");
  function setDrawer(open){
    drawer.hidden = !open;
    burger.setAttribute("aria-expanded", open);
    burger.setAttribute("aria-label", open ? "Close menu" : "Menu");
    burger.classList.toggle("open", open);
  }
  burger.addEventListener("click", function(){ setDrawer(drawer.hidden); });
  drawer.addEventListener("click", function(e){ if (e.target.closest && e.target.closest("a")) setDrawer(false); });
  document.addEventListener("keydown", function(e){ if (e.key === "Escape" || e.key === "Esc") setDrawer(false); });
})();
