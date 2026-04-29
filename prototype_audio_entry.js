/**
 * UI sounds from @web-kits/audio patch "Minimal" (raphaelsalaja/audio).
 * Installed with: npx @web-kits/audio add raphaelsalaja/audio --patch minimal
 * https://audio.raphaelsalaja.com/
 */
import { defineSound } from "@web-kits/audio";
import {
  tap as tapDef,
  tabSwitch as tabSwitchDef,
  select as selectDef,
} from "./.web-kits/minimal.ts";

var UI_SOUND_VOL = 0.32;
var playTap = defineSound(tapDef);
var playTabSwitch = defineSound(tabSwitchDef);
var playSelect = defineSound(selectDef);

function safe(fn) {
  try {
    fn();
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
  if (!shouldPlayForTarget(e.target)) return;
  var el = e.target;
  var v = { volume: UI_SOUND_VOL };
  if (el.closest(".sw") || el.closest(".tab")) safe(function () { playTabSwitch(v); });
  else if (el.closest(".seg-btn")) safe(function () { playSelect(v); });
  else safe(function () { playTap(v); });
}

function init() {
  document.addEventListener("pointerdown", onPointerDown, true);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
