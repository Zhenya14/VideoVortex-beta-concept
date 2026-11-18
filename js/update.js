const APP_VERSION = "8.0.0";

function clearLocalStorageExceptAuth() {
  const keepPrefixes = [
    "firebase:authUser:",
    "firebase:authEvent:",
    "firebase:previous_websocket_failure",
    "firebase:heartbeat",
    "lang"
  ];

  Object.keys(localStorage).forEach((key) => {
    const keep = keepPrefixes.some((prefix) => key.startsWith(prefix));
    if (!keep) {
      localStorage.removeItem(key);
    }
  });
}

function isNewVersion(current, saved) {
  const currentParts = String(current).replace(/[^0-9.]/g, "").split(".").map(Number);
  const savedParts = String(saved).replace(/[^0-9.]/g, "").split(".").map(Number);
  const len = Math.max(currentParts.length, savedParts.length);

  for (let i = 0; i < len; i++) {
    const c = currentParts[i] || 0;
    const s = savedParts[i] || 0;
    if (c > s) return true;
    if (c < s) return false;
  }
  return false;
}

function checkUpdateButton() {
  const lastVersion = localStorage.getItem("lastUpdateVersion") || "0.0.0";
  const updateBtn = document.getElementById("update-app-btn");
  if (!updateBtn) return;

  if (isNewVersion(APP_VERSION, lastVersion)) {
    updateBtn.style.display = "inline-flex";
  } else {
    updateBtn.style.display = "none";
  }
}

function syncVersionElements() {
  document.querySelectorAll("[data-app-version]").forEach((node) => {
    node.textContent = APP_VERSION;
  });
}

window.VVUpdate = {
  APP_VERSION,
  isNewVersion,
  checkUpdateButton,
  syncVersionElements
};

window.addEventListener("DOMContentLoaded", () => {
  syncVersionElements();
  checkUpdateButton();
  const updateBtn = document.getElementById("update-app-btn");
  if (updateBtn) {
    updateBtn.addEventListener("click", () => {
      clearLocalStorageExceptAuth();
      localStorage.setItem("lastUpdateAt", new Date().toISOString());
      localStorage.setItem("lastUpdateVersion", APP_VERSION);
      updateBtn.style.display = "none";
      location.reload();
    });
  }
});