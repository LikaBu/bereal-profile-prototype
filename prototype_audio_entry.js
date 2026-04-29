/**
 * UI feedback using @web-kits/audio — bundled for static GitHub Pages.
 * https://audio.raphaelsalaja.com/
 */
import { defineSound } from "@web-kits/audio";

var tap = defineSound({
  source: { type: "sine", frequency: { start: 520, end: 190 } },
  envelope: { decay: 0.05 },
  gain: 0.2,
});

function playTap() {
  try {
    tap();
  } catch (_e) {
    // ignore
  }
}

function shouldPlayForTarget(t) {
  if (!t || !t.closest) return false;
  return !!t.closest(
    "button, .sw, .seg-btn, .hl-item, .gi, .brc, .cp, .tab, .camb, .gi-act, .bbl, .mf-inline, .brd-back, .hl-sht-x, .ctx-menu"
  );
}

function onPointerDown(e) {
  if (shouldPlayForTarget(e.target)) playTap();
}

function init() {
  document.addEventListener("pointerdown", onPointerDown, true);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
