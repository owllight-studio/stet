/* The three-position mode switch.
   Auto is the default and stores nothing: the page follows the machine.
   Light and dark stamp data-theme on the root, which every token block reads.
   The anti-flash half of this runs inline in each page head, before first paint. */
(function () {
  "use strict";

  var KEY = "stet-theme";
  var root = document.documentElement;

  function current() {
    var t = root.getAttribute("data-theme");
    return t === "dark" || t === "light" ? t : "auto";
  }

  function apply(mode) {
    if (mode === "auto") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", mode);
    try {
      if (mode === "auto") localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, mode);
    } catch (e) {
      /* private browsing refuses storage. The switch still works for this page. */
    }
    mark();
  }

  function mark() {
    var now = current();
    var buttons = document.querySelectorAll(".modes button[data-mode]");
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].setAttribute("aria-pressed", String(buttons[i].dataset.mode === now));
    }
  }

  document.addEventListener("click", function (event) {
    var button = event.target.closest && event.target.closest(".modes button[data-mode]");
    if (button) apply(button.dataset.mode);
  });

  mark();
})();
