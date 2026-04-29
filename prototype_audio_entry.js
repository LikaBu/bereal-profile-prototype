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
  swoosh as swooshDef,
  pageExit as pageExitDef,
} from "./.web-kits/minimal.ts";

var UI_SOUND_VOL = 0.32;
var playTap = defineSound(tapDef);
var playTabSwitch = defineSound(tabSwitchDef);
var playSelect = defineSound(selectDef);
var playSwoosh = defineSound(swooshDef);
var playPageExit = defineSound(pageExitDef);

function volOpts() {
  return { volume: UI_SOUND_VOL };
}

function safe(fn) {
  try {
    fn();
  } catch (_e) {
    // ignore
  }
}

window.protoUiSound = {
  swoosh: function () {
    safe(function () {
      playSwoosh(volOpts());
    });
  },
  pageExit: function () {
    safe(function () {
      playPageExit(volOpts());
    });
  },
};

function shouldPlayForTarget(t) {
  if (!t || !t.closest) return false;
  return !!t.closest(
    "button, .sw, .seg-btn, .hl-item, .gi, .hl-vgi, .brc, .cp, .tab, .camb, .gi-act, .bbl, .mf-inline, .ctx-menu"
  );
}

function onPointerDown(e) {
  if (e.target.closest(".brd-back, .bsh-close, .hl-sht-x")) return;
  if (!shouldPlayForTarget(e.target)) return;
  var el = e.target;
  var v = volOpts();
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
