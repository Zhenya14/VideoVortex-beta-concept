(function (global) {
  'use strict';

  const { el, clear, icon, applyAvatarElement, DEFAULT_THUMBNAIL } = global.VV;

  let activeBlockedRef = null;
  let activeBlockedHandler = null;

  function applySettingsAvatarPreview(overrideColor, forceClearPhoto = false) {
    const headerAvatarEl = document.getElementById("settings-header-avatar");
    if (!headerAvatarEl) return;
    const currentUser = global.VVState?.currentUser;
    const currentUserData = global.VVState?.currentUserData || {};
    const nameInput = document.getElementById("settings-name")?.value.trim();
    const displayName =
      nameInput || currentUserData.name || currentUser?.email?.split("@")[0] || "Користувач";
    const selectedColor =
      overrideColor ||
      document.getElementById("settings-color-picker")?.dataset.selected ||
      currentUserData.color;
    const clearPhoto =
      forceClearPhoto ||
      document.getElementById("settings-color-picker")?.dataset.clearAvatar === "true";

    applyAvatarElement(headerAvatarEl, {
      avatarUrl: clearPhoto ? "" : currentUserData.avatar,
      avatarId: clearPhoto ? "" : currentUserData.avatarId,
      name: displayName,
      color: selectedColor
    });
  }

  function initSettingsPickers() {
    const colorGrid = document.getElementById("settings-color-picker");
    if (colorGrid) {
      clear(colorGrid);
      const customWrap = el("label", {
        className: "color-swatch-custom",
        title: global.t?.("custom-color-label") || "Обрати свій колір"
      });
      const customInput = el("input", {
        type: "color",
        id: "settings-custom-color",
        value: "#3b82f6",
        "aria-label": global.t?.("custom-color-label") || "Обрати свій колір"
      });

      const selectColor = (hex, activeSwatchEl, isCustom = false) => {
        colorGrid
          .querySelectorAll(".color-swatch, .color-swatch-custom")
          .forEach((node) => node.classList.remove("selected"));
        if (activeSwatchEl) activeSwatchEl.classList.add("selected");
        if (isCustom && customWrap) {
          customWrap.style.backgroundColor = hex;
        }
        colorGrid.dataset.selected = hex;
        colorGrid.dataset.colorDirty = "true";
        applySettingsAvatarPreview(hex);
      };

      global.VV.SOLID_COLORS.forEach((hex) => {
        const swatch = el("button", {
          type: "button",
          className: "color-swatch",
          style: { backgroundColor: hex },
          dataset: { color: hex },
          "aria-label": hex,
          onClick: () => selectColor(hex, swatch, false)
        });
        colorGrid.appendChild(swatch);
      });

      customInput.addEventListener("input", () => {
        selectColor(customInput.value, customWrap, true);
      });
      customWrap.appendChild(icon("colorize", 16));
      customWrap.appendChild(customInput);
      colorGrid.appendChild(customWrap);
    }

    const clearAvatarBtn = document.getElementById("settings-clear-avatar-btn");
    clearAvatarBtn?.addEventListener("click", () => {
      const cg = document.getElementById("settings-color-picker");
      if (cg) cg.dataset.clearAvatar = "true";
      const fileInput = document.getElementById("settings-avatar-file");
      if (fileInput) {
        fileInput.value = "";
        fileInput.dispatchEvent(new Event("change", { bubbles: true }));
      }
      clearAvatarBtn.classList.add("hidden");
      applySettingsAvatarPreview(undefined, true);
    });

    document.getElementById("settings-avatar-file")?.addEventListener("change", (e) => {
      if (e.target?.files?.length) {
        const cg = document.getElementById("settings-color-picker");
        if (cg) delete cg.dataset.clearAvatar;
      }
    });
  }

  function renderBlockedUsers(uid) {
    const listEl = document.getElementById("blocked-users-list");
    if (!listEl || !global.db || !uid) return;

    if (activeBlockedRef && activeBlockedHandler) {
      try {
        activeBlockedRef.off("value", activeBlockedHandler);
      } catch (e) {}
    }

    activeBlockedRef = global.db.ref(`users/${uid}/blockedUsers`);
    activeBlockedHandler = (snap) => {
      clear(listEl);
      const items = [];
      snap.forEach((child) => {
        const val = child.val();
        if (val && val.blocked) {
          items.push({ uid: child.key, ...val });
        }
      });

      if (!items.length) {
        listEl.appendChild(
          global.VVComponents.createEmptyNotice(
            global.t?.("no-blocked-users") || "Заблокованих користувачів немає.",
            "no-blocked-users"
          )
        );
        return;
      }

      items.forEach((entry) => {
        listEl.appendChild(
          el(
            "div",
            { className: "blocked-user-row" },
            el("span", { text: entry.userName || entry.uid }),
            el(
              "button",
              {
                type: "button",
                className: "btn",
                style: { padding: "6px 12px", fontSize: "12.5px" },
                onClick: async () => {
                  try {
                    await global.db.ref(`users/${uid}/blockedUsers/${entry.uid}`).remove();
                    global.VV.showToast(
                      global.t?.("user-unblocked") || "Користувача розблоковано",
                      "info"
                    );
                  } catch (err) {
                    global.VV.showToast(
                      global.t?.("user-unblock-error") || "Не вдалося розблокувати користувача",
                      "error"
                    );
                  }
                }
              },
              icon("lock_open", 15),
              el("span", {
                dataset: { i18n: "unblock-user" },
                text: global.t?.("unblock-user") || "Розблокувати"
              })
            )
          )
        );
      });
    };
    activeBlockedRef.on("value", activeBlockedHandler, () => {});
  }

  function populateUserForms() {
    const currentUser = global.VVState?.currentUser;
    const currentUserData = global.VVState?.currentUserData;
    if (!currentUser || !currentUserData) return;

    const nameEl = document.getElementById("user-display-name");
    const emailEl = document.getElementById("user-display-email");
    const avatarEl = document.getElementById("user-display-avatar");
    const navAvatarEl = document.getElementById("nav-user-avatar");
    const popNameEl = document.getElementById("popover-user-name");
    const popHandleEl = document.getElementById("popover-user-handle");
    const popAvatarEl = document.getElementById("popover-user-avatar");
    const headerNameEl = document.getElementById("settings-header-name");
    const headerHandleEl = document.getElementById("settings-header-handle");
    const headerAvatarEl = document.getElementById("settings-header-avatar");

    const displayName =
      currentUserData.name || currentUser.email?.split("@")[0] || "Користувач";
    const handleText = currentUserData.supername
      ? `@${String(currentUserData.supername).replace(/^@+/, "")}`
      : currentUser.email || "";

    if (nameEl) nameEl.textContent = displayName;
    if (emailEl) emailEl.textContent = currentUser.email || "";
    if (popNameEl) popNameEl.textContent = displayName;
    if (popHandleEl) popHandleEl.textContent = handleText;
    if (headerNameEl) headerNameEl.textContent = displayName;
    if (headerHandleEl) headerHandleEl.textContent = handleText;

    const avatarOpts = {
      avatarUrl: currentUserData.avatar,
      avatarId: currentUserData.avatarId,
      name: displayName,
      color: currentUserData.color
    };
    applyAvatarElement(avatarEl, avatarOpts);
    applyAvatarElement(navAvatarEl, avatarOpts);
    applyAvatarElement(popAvatarEl, avatarOpts);
    applyAvatarElement(headerAvatarEl, avatarOpts);

    const hasPhotoAvatar = Boolean(currentUserData.avatar || currentUserData.avatarId);
    const clearAvatarBtn = document.getElementById("settings-clear-avatar-btn");
    if (clearAvatarBtn) {
      clearAvatarBtn.classList.toggle("hidden", !hasPhotoAvatar);
    }

    const inputName = document.getElementById("settings-name");
    const inputSuper = document.getElementById("settings-supername");
    const inputBirth = document.getElementById("settings-birthdate");
    const inputPrivate = document.getElementById("settings-private-profile");
    const inputSecondName = document.getElementById("settings-second-channel");

    if (inputName) inputName.value = currentUserData.name || "";
    if (inputSuper) inputSuper.value = currentUserData.supername || "";
    if (inputBirth) inputBirth.value = currentUserData.birthdate || "";
    if (inputPrivate) inputPrivate.checked = Boolean(currentUserData.privateProfile);
    if (inputSecondName) inputSecondName.value = currentUserData.channels?.second?.name || "";

    const colorGrid = document.getElementById("settings-color-picker");
    if (colorGrid) {
      const normalizedColor = global.VV.sanitizeSolidColor(currentUserData.color, displayName);
      colorGrid.dataset.selected = normalizedColor;
      delete colorGrid.dataset.colorDirty;
      delete colorGrid.dataset.clearAvatar;
      let matchedPreset = false;
      colorGrid.querySelectorAll(".color-swatch").forEach((sw) => {
        const isMatch = sw.dataset.color?.toLowerCase() === normalizedColor.toLowerCase();
        sw.classList.toggle("selected", isMatch);
        if (isMatch) matchedPreset = true;
      });
      const customWrap = colorGrid.querySelector(".color-swatch-custom");
      const customInput = document.getElementById("settings-custom-color");
      if (customWrap) {
        customWrap.classList.toggle("selected", !matchedPreset);
        customWrap.style.backgroundColor = !matchedPreset ? normalizedColor : "";
      }
      if (customInput && /^#[0-9a-f]{6}$/i.test(normalizedColor)) {
        customInput.value = normalizedColor;
      }
    }

    const channelSelect = document.getElementById("upload-channel-select");
    if (channelSelect) {
      clear(channelSelect);
      channelSelect.appendChild(
        el("option", { value: "main", text: `${global.t?.("main-channel") || "Основний канал"} (${displayName})` })
      );
      const secondName = currentUserData.channels?.second?.name;
      if (secondName) {
        channelSelect.appendChild(
          el("option", { value: "second", text: `${global.t?.("second-channel") || "Другий канал"} (${secondName})` })
        );
      }
      global.VVComponents?.syncDropdown?.(channelSelect);
    }

    renderBlockedUsers(currentUser.uid);
  }

  function initSettingsSidebarTabs() {
    const view = document.getElementById("settings-view");
    if (!view) return;

    const tabBtns = Array.from(view.querySelectorAll("[data-settings-tab]"));
    const panels = Array.from(view.querySelectorAll("[data-settings-panel]"));

    const activateTab = (tabId) => {
      const targetBtn = tabBtns.find((b) => b.dataset.settingsTab === tabId);
      const safeId = targetBtn && !targetBtn.closest(".hidden") ? tabId : "general";
      tabBtns.forEach((b) => b.classList.toggle("active", b.dataset.settingsTab === safeId));
      panels.forEach((p) => p.classList.toggle("is-inactive", p.dataset.settingsPanel !== safeId));
    };

    tabBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        activateTab(btn.dataset.settingsTab || "general");
      });
    });

    global.VVBus?.on("settings:auth-changed", (isAuthorized) => {
      if (!isAuthorized) {
        activateTab("general");
      }
    });

    global.VVBus?.on("settings:select-tab", (tabId) => {
      activateTab(tabId || "general");
    });

    activateTab("general");
  }

  function initLocalPreferences() {
    const autoplayCheck = document.getElementById("pref-autoplay-check");
    const reducedMotionCheck = document.getElementById("pref-reduced-motion");
    const openRulesBtn = document.getElementById("open-rules-again-btn");
    const navRange = document.getElementById("pref-nav-height-range");
    const navValueEl = document.getElementById("pref-nav-height-value");
    const navResetBtn = document.getElementById("pref-nav-height-reset");

    const DEFAULT_NAV_HEIGHT = 52;
    const clampNavHeight = (raw) => {
      const n = Number(raw);
      if (isNaN(n)) return DEFAULT_NAV_HEIGHT;
      return Math.min(68, Math.max(42, Math.round(n / 2) * 2));
    };

    let navGeoRaf = 0;
    const applyNavHeight = (rawVal, persist = true) => {
      const val = clampNavHeight(rawVal);
      document.documentElement.style.setProperty("--nav-height", `${val}px`);
      if (navRange) navRange.value = String(val);
      if (navValueEl) navValueEl.textContent = `${val} px`;
      if (navResetBtn) navResetBtn.disabled = val === DEFAULT_NAV_HEIGHT;
      if (persist) localStorage.setItem("vv_nav_height", String(val));
      if (navGeoRaf) global.cancelAnimationFrame(navGeoRaf);
      navGeoRaf = global.requestAnimationFrame(() => {
        navGeoRaf = 0;
        global.VVUI?.recomputeTopBarGeometry?.(true);
      });
    };

    const initialNavHeight = clampNavHeight(localStorage.getItem("vv_nav_height") || DEFAULT_NAV_HEIGHT);
    applyNavHeight(initialNavHeight, false);

    navRange?.addEventListener("input", () => {
      applyNavHeight(navRange.value, true);
    });

    navRange?.addEventListener("change", () => {
      applyNavHeight(navRange.value, true);
    });

    navResetBtn?.addEventListener("click", () => {
      applyNavHeight(DEFAULT_NAV_HEIGHT, true);
    });

    const autoplayVal = localStorage.getItem("vv_autoplay") !== "false";
    const storedReduced = localStorage.getItem("vv_reduced_motion");
    const systemReducedQuery = global.matchMedia?.("(prefers-reduced-motion: reduce)");
    const initialReduced =
      storedReduced !== null ? storedReduced === "true" : Boolean(systemReducedQuery?.matches);

    document.body.classList.toggle("reduced-motion", initialReduced);

    if (autoplayCheck) {
      autoplayCheck.checked = autoplayVal;
      autoplayCheck.addEventListener("change", () => {
        localStorage.setItem("vv_autoplay", String(autoplayCheck.checked));
        global.VVBus?.emit("prefs:updated");
      });
    }

    if (reducedMotionCheck) {
      reducedMotionCheck.checked = initialReduced;
      reducedMotionCheck.addEventListener("change", () => {
        localStorage.setItem("vv_reduced_motion", String(reducedMotionCheck.checked));
        document.body.classList.toggle("reduced-motion", reducedMotionCheck.checked);
        global.VVBus?.emit("prefs:updated");
      });
    }

    systemReducedQuery?.addEventListener?.("change", (e) => {
      if (localStorage.getItem("vv_reduced_motion") === null) {
        document.body.classList.toggle("reduced-motion", e.matches);
        if (reducedMotionCheck) reducedMotionCheck.checked = e.matches;
        global.VVBus?.emit("prefs:updated");
      }
    });

    global.VVBus?.on("prefs:updated", () => {
      if (autoplayCheck) autoplayCheck.checked = localStorage.getItem("vv_autoplay") !== "false";
      if (reducedMotionCheck) reducedMotionCheck.checked = document.body.classList.contains("reduced-motion");
    });

    openRulesBtn?.addEventListener("click", () => {
      document.getElementById("rules-modal")?.classList.remove("hidden");
    });

    document.getElementById("settings-header-profile-btn")?.addEventListener("click", () => {
      const uid = global.VVState?.currentUser?.uid;
      if (uid) global.VVViews.openProfile(uid);
    });
  }

  function initSettingsView() {
    initSettingsPickers();
    initSettingsSidebarTabs();
    initLocalPreferences();

    global.VVBus?.on("i18n:updated", () => {
      if (global.VVState?.isAuthorized?.()) {
        populateUserForms();
      } else {
        const sName = document.getElementById("settings-header-name");
        const sHandle = document.getElementById("settings-header-handle");
        if (sName) sName.textContent = global.t?.("settings-title") || "Налаштування";
        if (sHandle) sHandle.textContent = global.t?.("settings-subtitle") || "Керуйте інтерфейсом, плеєром та параметрами каналу";
      }
    });

    async function writePathResilient(basePath, payload) {
      const entries = Object.entries(payload);
      if (!entries.length) return { ok: [], failed: [] };

      if (!basePath.startsWith("users/")) {
        try {
          await global.db.ref(basePath).update(payload);
          return { ok: entries.map(([k]) => k), failed: [] };
        } catch (err) {
          const ok = [];
          const failed = [];
          await Promise.all(
            entries.map(async ([k, val]) => {
              try {
                await global.db.ref(`${basePath}/${k}`).set(val);
                ok.push(k);
              } catch (subErr) {
                failed.push({ key: k, error: subErr });
              }
            })
          );
          return { ok, failed, error: err };
        }
      }

      const ok = [];
      const failed = [];
      await Promise.all(
        entries.map(async ([k, val]) => {
          try {
            await global.db.ref(`${basePath}/${k}`).set(val);
            ok.push(k);
          } catch (subErr) {
            failed.push({ key: k, error: subErr });
          }
        })
      );
      return { ok, failed, error: failed[0]?.error || null };
    }

    document.getElementById("settings-form")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const currentUser = global.VVState?.currentUser;
      const currentUserData = global.VVState?.currentUserData || {};
      if (!currentUser) {
        global.VV.showToast("Спочатку увійдіть в акаунт", "error");
        global.VVRouter.navigate("auth");
        return;
      }

      const name = document.getElementById("settings-name")?.value.trim() || "";
      const supername = document.getElementById("settings-supername")?.value.trim() || "";
      const birthdate = document.getElementById("settings-birthdate")?.value || "";
      const privateProfile = Boolean(
        document.getElementById("settings-private-profile")?.checked
      );
      const secondChannelName =
        document.getElementById("settings-second-channel")?.value.trim() || "";
      const colorGrid = document.getElementById("settings-color-picker");
      const color =
        colorGrid?.dataset.selected ||
        global.VV.sanitizeSolidColor(currentUserData.color, name);
      const wantsClearAvatar = colorGrid?.dataset.clearAvatar === "true";

      try {
        const userUpdates = {};
        const publicUpdates = {};

        if (name !== (currentUserData.name || "")) {
          userUpdates.name = name;
          publicUpdates.name = name;
        }
        if (supername !== (currentUserData.supername || "")) {
          userUpdates.supername = supername;
          publicUpdates.supername = supername;
        }
        if (birthdate !== (currentUserData.birthdate || "") && birthdate) {
          userUpdates.birthdate = birthdate;
        }
        if (privateProfile !== Boolean(currentUserData.privateProfile)) {
          userUpdates.privateProfile = privateProfile;
          publicUpdates.privateProfile = privateProfile;
        }
        if (colorGrid?.dataset.colorDirty === "true" || color !== currentUserData.color) {
          userUpdates.color = color;
          publicUpdates.color = color;
        }

        const avatarFile = document.getElementById("settings-avatar-file")?.files[0];
        if (avatarFile && global.storage) {
          const aRef = global.storage.ref(`avatars/${currentUser.uid}_${Date.now()}_${avatarFile.name}`);
          await aRef.put(avatarFile);
          const avatarUrl = await aRef.getDownloadURL();
          userUpdates.avatar = avatarUrl;
          publicUpdates.avatar = avatarUrl;
          if ("avatarId" in currentUserData) {
            userUpdates.avatarId = avatarUrl;
            publicUpdates.avatarId = avatarUrl;
          }
        } else if (wantsClearAvatar) {
          userUpdates.avatar = "";
          publicUpdates.avatar = "";
          if (currentUserData.avatarId) {
            userUpdates.avatarId = "";
            publicUpdates.avatarId = "";
          }
        }

        const wallFile = document.getElementById("settings-wallpaper-file")?.files[0];
        if (wallFile && global.storage) {
          const wRef = global.storage.ref(`wallpapers/${currentUser.uid}_${Date.now()}_${wallFile.name}`);
          await wRef.put(wallFile);
          const wallpaperUrl = await wRef.getDownloadURL();
          userUpdates.wallpaperId = wallpaperUrl;
          publicUpdates.wallpaperId = wallpaperUrl;
        }

        if (secondChannelName !== (currentUserData.channels?.second?.name || "")) {
          userUpdates["channels/second/name"] = secondChannelName;
        }

        const [userRes, pubRes] = await Promise.all([
          writePathResilient(`users/${currentUser.uid}`, userUpdates),
          writePathResilient(`publicUsers/${currentUser.uid}`, publicUpdates)
        ]);

        const totalAttempted = Object.keys(userUpdates).length + Object.keys(publicUpdates).length;
        const totalSucceeded = userRes.ok.length + pubRes.ok.length;

        if (totalAttempted > 0 && totalSucceeded === 0) {
          const firstErr = userRes.failed[0]?.error || pubRes.failed[0]?.error || userRes.error || pubRes.error;
          throw firstErr || new Error("permission_denied");
        }

        const mergedLocal = { ...currentUserData };
        userRes.ok.forEach((k) => {
          if (k === "channels/second/name") {
            mergedLocal.channels = {
              ...(mergedLocal.channels || {}),
              second: { ...(mergedLocal.channels?.second || {}), name: userUpdates[k] }
            };
          } else {
            mergedLocal[k] = userUpdates[k];
          }
        });
        pubRes.ok.forEach((k) => {
          mergedLocal[k] = publicUpdates[k];
        });
        global.VVState.currentUserData = mergedLocal;
        populateUserForms();

        if (userRes.failed.length > 0 && pubRes.ok.length === Object.keys(publicUpdates).length) {
          global.VVFeedback.notify({
            scope: "settings",
            type: "success",
            message: global.t?.("settings-saved") || "Налаштування профілю збережено"
          });
        } else if (userRes.failed.length > 0 || pubRes.failed.length > 0) {
          global.VVFeedback.notify({
            scope: "settings",
            type: "info",
            message:
              global.t?.("settings-permission-partial") ||
              "Деякі системні поля не змінено через права доступу; дозволені зміни збережено"
          });
        } else {
          global.VVFeedback.notify({
            scope: "settings",
            type: "success",
            message: global.t?.("settings-saved") || "Налаштування профілю збережено"
          });
        }
      } catch (err) {
        global.VVFeedback.notify({
          scope: "settings",
          type: "error",
          message: `${global.t?.("settings-save-error") || "Помилка збереження"}: ${err.message}`
        });
      }
    });

    document.getElementById("need-support-btn")?.addEventListener("click", async () => {
      const currentUser = global.VVState?.currentUser;
      if (!currentUser) return global.VV.showToast("Увійдіть в акаунт", "error");
      try {
        await global.db.ref(`supportRequests/${currentUser.uid}`).set({
          status: "pending",
          timestamp: Date.now()
        });
        global.VV.showToast("Запит на підтримку надіслано", "success");
      } catch (err) {
        global.VV.showToast("Не вдалося надіслати запит", "error");
      }
    });

    document.getElementById("i-am-fine-btn")?.addEventListener("click", async () => {
      const currentUser = global.VVState?.currentUser;
      if (!currentUser) return;
      try {
        await global.db.ref(`supportRequests/${currentUser.uid}`).remove();
        global.VV.showToast("Запит на підтримку скасовано", "info");
      } catch (err) {
        global.VV.showToast("Не вдалося скасувати запит", "error");
      }
    });

    document.getElementById("delete-account-btn")?.addEventListener("click", async () => {
      const currentUser = global.VVState?.currentUser;
      if (!currentUser) return;
      const ok = await global.VV.showConfirmModal({
        title: "Видалення акаунту",
        message: "Ця дія видалить ваш профіль і виведе з акаунту. Ви впевнені?",
        confirmText: "Видалити назавжди",
        danger: true
      });
      if (!ok) return;

      try {
        await global.db.ref(`users/${currentUser.uid}`).remove();
        await global.db.ref(`publicUsers/${currentUser.uid}`).remove();
        await currentUser.delete();
        global.VV.showToast("Акаунт видалено", "info");
        global.VVRouter.navigate("home");
      } catch (err) {
        global.VV.showToast("Для видалення виконайте повторний вхід: " + err.message, "error");
      }
    });
  }

  global.VVViews = global.VVViews || {};
  Object.assign(global.VVViews, {
    initSettingsView,
    populateUserForms
  });
})(window);
