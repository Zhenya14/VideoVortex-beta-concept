(function (global) {
  "use strict";

  let snowTimer = null;
  let activeTheme = null;

  const holidayForDate = (date) => {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    if (month === 10 && (day === 30 || day === 31)) return "halloween";
    if ((month === 12 && day >= 15) || (month === 1 && day <= 25)) return "newyear";
    if (month === 2 && (day === 13 || day === 14)) return "valentine";
    if (month === 8 && (day === 23 || day === 24)) return "independence";
    if (month === 5 && (day === 20 || day === 21)) return "vyshyvanka";
    if (month === 4 && day >= 10 && day <= 25) return "easter";
    return null;
  };

  function clearSeasonalEffects() {
    if (snowTimer) {
      global.clearInterval(snowTimer);
      snowTimer = null;
    }
    document.querySelectorAll(".vv-seasonal-decoration").forEach((node) => node.remove());
    document.body.classList.remove(
      "vv-season-halloween", "vv-season-newyear", "vv-season-valentine",
      "vv-season-independence", "vv-season-vyshyvanka", "vv-season-easter"
    );
  }

  function addDecoration(className, glyph, count) {
    const layer = document.createElement("div");
    layer.className = "vv-seasonal-decoration " + className;
    layer.setAttribute("aria-hidden", "true");
    for (let i = 0; i < count; i++) {
      const item = document.createElement("span");
      item.textContent = glyph;
      item.style.left = (Math.random() * 100).toFixed(2) + "%";
      item.style.animationDelay = (Math.random() * 5).toFixed(2) + "s";
      item.style.fontSize = (14 + Math.random() * 18).toFixed(0) + "px";
      layer.appendChild(item);
    }
    document.body.appendChild(layer);
  }

  function startSnow() {
    if (snowTimer || global.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) return;
    snowTimer = global.setInterval(() => {
      const flake = document.createElement("span");
      flake.className = "vv-seasonal-snowflake vv-seasonal-decoration";
      flake.textContent = ["❄", "❅", "❆"][Math.floor(Math.random() * 3)];
      flake.style.left = Math.random() * 100 + "vw";
      flake.style.fontSize = 10 + Math.random() * 18 + "px";
      flake.style.animationDuration = 5 + Math.random() * 4 + "s";
      document.body.appendChild(flake);
      global.setTimeout(() => flake.remove(), 9500);
    }, 450);
  }

  function applySeasonalTheme(theme) {
    clearSeasonalEffects();
    activeTheme = theme || null;
    if (!theme) return;
    document.body.classList.add("vv-season-" + theme);
    if (theme === "newyear") startSnow();
    if (theme === "halloween") addDecoration("vv-season-bats", "🦇", 7);
    if (theme === "valentine") addDecoration("vv-season-hearts", "♥", 9);
    if (theme === "independence") addDecoration("vv-season-flags", "🇺🇦", 5);
    if (theme === "vyshyvanka") addDecoration("vv-season-flowers", "🌺", 7);
    if (theme === "easter") addDecoration("vv-season-eggs", "🐣", 7);
  }

  function initSeasonalTheme() {
    applySeasonalTheme(holidayForDate(new Date()));
  }

  global.VVSeasonal = {
    init: initSeasonalTheme,
    apply: applySeasonalTheme,
    current: () => activeTheme,
    clear: clearSeasonalEffects
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSeasonalTheme, { once: true });
  } else {
    initSeasonalTheme();
  }
})(window);
