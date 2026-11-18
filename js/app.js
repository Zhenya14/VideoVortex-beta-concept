(function (global) {
  'use strict';

  let deferredInstallPrompt = null;

  let subsRef = null;
  let userRef = null;
  let pubUserRef = null;
  let modRef = null;
  let rawPrivateUserData = null;
  let rawPublicUserData = null;
  let topBarGeometryCache = null;

  function computeTopBarGeometry(force = false) {
    const topNav = document.querySelector("nav.top-navbar");
    if (!topNav) return null;

    const vw = global.innerWidth || document.documentElement.clientWidth || 0;
    const vh = global.innerHeight || document.documentElement.clientHeight || 0;
    const lang = document.documentElement.lang || "uk";
    const navH = document.documentElement.style.getPropertyValue("--nav-height") || "default";
    const authSig = `${Boolean(global.VVState?.isAuthorized?.())}:${Boolean(global.VVState?.currentUser)}`;
    const cacheKey = `${vw}x${vh}|${lang}|${navH}|${authSig}`;

    if (!force && topBarGeometryCache && topBarGeometryCache.key === cacheKey) {
      return topBarGeometryCache;
    }

    const wasPinned = topNav.classList.contains("is-pinned");
    const wasReady = topNav.classList.contains("is-ready");
    const desktopNav = topNav.querySelector(".desktop-nav");
    const navActions = topNav.querySelector(".nav-actions");

    if (wasReady && wasPinned) topNav.classList.remove("is-ready");
    if (desktopNav) desktopNav.style.minWidth = "";
    if (navActions) navActions.style.minWidth = "";
    if (wasPinned) topNav.classList.remove("is-pinned");

    const navRect = topNav.getBoundingClientRect();
    const cs = global.getComputedStyle(topNav);
    const padLeft = parseFloat(cs.paddingLeft) || 12;
    const padRight = parseFloat(cs.paddingRight) || 12;
    const desktopW = desktopNav ? Math.ceil(desktopNav.getBoundingClientRect().width) : 0;
    const actionsW = navActions ? Math.ceil(navActions.getBoundingClientRect().width) : 0;
    const sideOffset = Math.max(0, (vw - navRect.width) / 2);
    const pinnedPadL = Math.round(sideOffset + padLeft);
    const pinnedPadR = Math.round(sideOffset + padRight);

    topNav.style.setProperty("--vv-pinned-pad-l", `${pinnedPadL}px`);
    topNav.style.setProperty("--vv-pinned-pad-r", `${pinnedPadR}px`);
    if (desktopNav && desktopW > 0) desktopNav.style.minWidth = `${desktopW}px`;
    if (navActions && actionsW > 0) navActions.style.minWidth = `${actionsW}px`;

    if (wasPinned) topNav.classList.add("is-pinned");
    if (wasReady && wasPinned) {
      void topNav.offsetWidth;
      topNav.classList.add("is-ready");
    }

    topBarGeometryCache = {
      key: cacheKey,
      vw,
      vh,
      navWidth: Math.round(navRect.width),
      navHeight: Math.round(navRect.height),
      pinnedPadL,
      pinnedPadR,
      desktopW,
      actionsW
    };
    return topBarGeometryCache;
  }

  global.VVUI = global.VVUI || {};
  global.VVUI.recomputeTopBarGeometry = computeTopBarGeometry;

  global.VVState = {
    currentUser: null,
    currentUserData: null,
    currentModerationStatus: "active",
    subscribedUids: new Set(),
    allVideosMap: {},
    allPhotosMap: {},

    isAuthorized() {
      return Boolean(this.currentUser && !this.currentUser.isAnonymous);
    },

    canUserPost() {
      if (!this.isAuthorized()) {
        global.VV.showToast("Увійдіть в акаунт для виконання цієї дії", "error");
        global.VVRouter.navigate("auth");
        return false;
      }
      if (
        this.currentModerationStatus === "frozen_soft" ||
        this.currentModerationStatus === "frozen_hard" ||
        this.currentModerationStatus === "disabled" ||
        this.currentModerationStatus === "banned"
      ) {
        global.VV.showToast("Ваш акаунт обмежено для публікації контенту", "error");
        return false;
      }
      return true;
    },

    async toggleSubscribe(targetUid, targetMeta = {}) {
      if (!this.isAuthorized() || !global.db) {
        global.VV.showToast("Увійдіть в акаунт, щоб підписуватися на канали", "info");
        global.VVRouter.navigate("auth");
        return false;
      }
      const myUid = this.currentUser.uid;
      if (!targetUid || myUid === targetUid) return false;

      const isSub = this.subscribedUids.has(targetUid);
      const subRef = global.db.ref(`users/${myUid}/subscriptions/${targetUid}`);
      const followerRef = global.db.ref(`subscribers/${targetUid}/${myUid}`);

      try {
        if (isSub) {
          await Promise.all([subRef.remove(), followerRef.remove()]);
          global.VV.showToast("Ви відписалися від каналу", "info");
        } else {
          await Promise.all([
            subRef.set({
              uid: targetUid,
              name: targetMeta.name || "",
              subscribedAt: Date.now()
            }),
            followerRef.set(true)
          ]);
          global.VV.showToast("Ви підписалися на канал!", "success");
        }
        return true;
      } catch (err) {
        global.VV.showToast("Не вдалося оновити підписку", "error");
        return false;
      }
    },

    isUserAdult() {
      const bdate = this.currentUserData?.birthdate || this.currentUserData?.birthYear;
      if (!bdate) return true;
      const year = typeof bdate === "number" ? bdate : new Date(bdate).getFullYear();
      if (!year || isNaN(year)) return true;
      return new Date().getFullYear() - year >= 18;
    }
  };

  function syncAuthVisibility(isAuthorized, hasSession) {
    document.getElementById("plus-button")?.classList.toggle("hidden", !isAuthorized);
    document.getElementById("desktop-plus-btn")?.classList.toggle("hidden", !isAuthorized);
    document.getElementById("notification-bell")?.classList.toggle("hidden", !isAuthorized);
    document.getElementById("photos-new-post-btn")?.classList.toggle("hidden", !isAuthorized);
    document.getElementById("upload-guest-gate")?.classList.toggle("hidden", isAuthorized);
    document.getElementById("upload-forms-grid")?.classList.toggle("hidden", !isAuthorized);
    document.getElementById("settings-guest-box")?.classList.toggle("hidden", isAuthorized);
    document.getElementById("settings-account-sections")?.classList.toggle("hidden", !isAuthorized);
    document.getElementById("settings-account-nav")?.classList.toggle("hidden", !isAuthorized);
    document.getElementById("settings-header-avatar")?.classList.toggle("hidden", !isAuthorized);
    document.getElementById("settings-header-profile-btn")?.classList.toggle("hidden", !isAuthorized);
    document.getElementById("guest-auth-box")?.classList.toggle("hidden", hasSession);
    document.getElementById("user-profile-box")?.classList.toggle("hidden", !hasSession);
    document.getElementById("nav-login-btn")?.classList.toggle("hidden", hasSession);
    document.getElementById("nav-profile-btn")?.classList.toggle("hidden", !hasSession);

    if (!isAuthorized) {
      document.getElementById("notifications-dropdown")?.classList.add("hidden");
      const sName = document.getElementById("settings-header-name");
      const sHandle = document.getElementById("settings-header-handle");
      if (sName) sName.textContent = global.t?.("settings-title") || "Налаштування";
      if (sHandle) sHandle.textContent = global.t?.("settings-subtitle") || "Керуйте інтерфейсом, плеєром та параметрами каналу";
    }

    if (!hasSession) {
      document.getElementById("profile-popover")?.classList.add("hidden");
      document.getElementById("nav-profile-btn")?.setAttribute("aria-expanded", "false");
    }

    global.VVBus?.emit("settings:auth-changed", isAuthorized);
    computeTopBarGeometry();
  }

  function initRulesModal() {
    const modal = document.getElementById("rules-modal");
    const acceptBtn = document.getElementById("rules-accept-btn");
    if (!modal || !acceptBtn) return;

    if (!localStorage.getItem("rulesSeen")) {
      modal.classList.remove("hidden");
    }

    acceptBtn.addEventListener("click", () => {
      localStorage.setItem("rulesSeen", "true");
      modal.classList.add("hidden");
    });
  }

  function initPwaInstall() {
    const installBtn = document.getElementById("installBtn");
    if (!installBtn) return;

    global.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      deferredInstallPrompt = e;
      installBtn.classList.remove("hidden");
    });

    installBtn.addEventListener("click", async () => {
      if (!deferredInstallPrompt) return;
      deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
      installBtn.classList.add("hidden");
    });

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("service-worker.js").catch(() => {});
    }
  }

  function bindGlobalNavigation() {
    document.querySelectorAll("[data-nav]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const target = btn.getAttribute("data-nav");
        global.VVRouter.navigate(target);
      });
    });

    const handleOpenUpload = () => {
      if (!global.VVState.canUserPost()) return;
      global.VVRouter.navigate("upload");
    };

    document.getElementById("plus-button")?.addEventListener("click", handleOpenUpload);
    document.getElementById("desktop-plus-btn")?.addEventListener("click", handleOpenUpload);

    document.getElementById("notification-bell")?.addEventListener("click", (e) => {
      e.stopPropagation();
      const panel = document.getElementById("notifications-dropdown");
      const profilePopover = document.getElementById("profile-popover");
      profilePopover?.classList.add("hidden");
      document.getElementById("nav-profile-btn")?.setAttribute("aria-expanded", "false");
      if (panel) panel.classList.toggle("hidden");
    });

    initProfilePopover();
  }

  function initProfilePopover() {
    const triggerBtn = document.getElementById("nav-profile-btn");
    const popover = document.getElementById("profile-popover");
    if (!triggerBtn || !popover) return;

    const popoverModeQuery = global.matchMedia?.(
      "(min-width: 960px), (min-width: 768px) and (orientation: landscape)"
    );

    const isPopoverMode = () => Boolean(popoverModeQuery?.matches);

    const positionPopover = () => {
      const rect = triggerBtn.getBoundingClientRect();
      const vw = global.innerWidth || document.documentElement.clientWidth || 1024;
      const top = Math.round(rect.bottom + 8);
      const right = Math.max(12, Math.round(vw - rect.right));
      popover.style.top = `${top}px`;
      popover.style.right = `${right}px`;
    };

    const closePopover = () => {
      if (!popover.classList.contains("hidden")) {
        popover.classList.add("hidden");
        triggerBtn.setAttribute("aria-expanded", "false");
      }
    };

    const openPopover = () => {
      document.getElementById("notifications-dropdown")?.classList.add("hidden");
      positionPopover();
      popover.classList.remove("hidden");
      triggerBtn.setAttribute("aria-expanded", "true");
    };

    triggerBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (isPopoverMode()) {
        if (popover.classList.contains("hidden")) {
          openPopover();
        } else {
          closePopover();
        }
      } else {
        closePopover();
        global.VVRouter.navigate("library");
      }
    });

    document.getElementById("popover-open-channel-btn")?.addEventListener("click", () => {
      const uid = global.VVState?.currentUser?.uid;
      closePopover();
      if (uid) global.VVViews.openProfile(uid);
    });

    document.getElementById("popover-library-btn")?.addEventListener("click", () => {
      closePopover();
      global.VVRouter.navigate("library");
    });

    document.getElementById("popover-archive-btn")?.addEventListener("click", () => {
      closePopover();
      global.VVRouter.navigate("archive");
    });

    document.getElementById("popover-settings-btn")?.addEventListener("click", () => {
      closePopover();
      global.VVRouter.navigate("settings");
    });

    document.getElementById("popover-logout-btn")?.addEventListener("click", async () => {
      closePopover();
      if (!global.auth) return;
      await global.auth.signOut();
      global.VV.showToast("Ви вийшли з акаунту", "info");
      global.VVRouter.navigate("auth");
    });

    document.addEventListener("pointerdown", (e) => {
      if (!popover.classList.contains("hidden") && !popover.contains(e.target) && !triggerBtn.contains(e.target)) {
        closePopover();
      }
      const notifPanel = document.getElementById("notifications-dropdown");
      const notifBell = document.getElementById("notification-bell");
      if (notifPanel && !notifPanel.classList.contains("hidden") && !notifPanel.contains(e.target) && !notifBell?.contains(e.target)) {
        notifPanel.classList.add("hidden");
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closePopover();
        document.getElementById("notifications-dropdown")?.classList.add("hidden");
      }
    });

    global.VVBus?.on("router:change", closePopover);
    global.addEventListener(
      "resize",
      () => {
        if (!popover.classList.contains("hidden")) {
          if (!isPopoverMode()) closePopover();
          else positionPopover();
        }
      },
      { passive: true }
    );
  }

  function initScrollEffects() {
    const topNav = document.querySelector("nav.top-navbar");
    const bottomDock = document.querySelector(".bottom-dock-wrap");
    const goTopBtn = document.getElementById("go-top-btn");
    if (!topNav && !bottomDock && !goTopBtn) return;

    let ticking = false;
    let morphTimer = null;
    let lastY = Math.max(0, global.scrollY || document.documentElement.scrollTop || 0);
    let dirAnchorY = lastY;
    let lastDir = 0;
    let dockHidden = false;

    const updateScrollUI = () => {
      const y = Math.max(0, global.scrollY || document.documentElement.scrollTop || 0);
      const delta = y - lastY;
      if (delta > 0 && lastDir <= 0) {
        dirAnchorY = lastY;
        lastDir = 1;
      } else if (delta < 0 && lastDir >= 0) {
        dirAnchorY = lastY;
        lastDir = -1;
      }
      lastY = y;

      if (topNav) {
        topNav.classList.toggle("is-pinned", y > 10);
      }
      if (bottomDock) {
        const isCompactDock = (global.innerWidth || 0) < 960;
        const dist = y - dirAnchorY;
        if (!isCompactDock || y <= 36) {
          dockHidden = false;
          dirAnchorY = y;
        } else if (dist >= 18 && y > 72) {
          dockHidden = true;
        } else if (dist <= -12) {
          dockHidden = false;
        }
        bottomDock.classList.toggle("is-scroll-hidden", dockHidden);
        goTopBtn?.classList.toggle("is-dock-hidden", dockHidden);
      }
      if (goTopBtn) {
        goTopBtn.classList.toggle("visible", y > 240);
        if (y <= 12) {
          goTopBtn.classList.remove("is-morphing");
        }
      }
      ticking = false;
    };

    global.addEventListener(
      "scroll",
      () => {
        if (!ticking) {
          ticking = true;
          global.requestAnimationFrame(updateScrollUI);
        }
      },
      { passive: true }
    );

    global.VVBus?.on("router:change", () => {
      dockHidden = false;
      lastY = Math.max(0, global.scrollY || document.documentElement.scrollTop || 0);
      dirAnchorY = lastY;
      lastDir = 0;
      bottomDock?.classList.remove("is-scroll-hidden");
      goTopBtn?.classList.remove("is-dock-hidden");
      global.requestAnimationFrame(updateScrollUI);
    });

    goTopBtn?.addEventListener("click", () => {
      const reduced =
        document.body.classList.contains("reduced-motion") ||
        global.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

      goTopBtn.classList.add("is-morphing");
      if (morphTimer) clearTimeout(morphTimer);
      morphTimer = setTimeout(() => {
        goTopBtn.classList.remove("is-morphing");
      }, 650);

      global.scrollTo({
        top: 0,
        behavior: reduced ? "auto" : "smooth"
      });
    });

    computeTopBarGeometry(true);
    global.requestAnimationFrame(() => {
      if (topNav) topNav.classList.add("is-ready");
      updateScrollUI();
    });

    let resizeRaf = 0;
    const handleDimensionChange = () => {
      if (resizeRaf) global.cancelAnimationFrame(resizeRaf);
      resizeRaf = global.requestAnimationFrame(() => {
        resizeRaf = 0;
        computeTopBarGeometry();
        updateScrollUI();
      });
    };

    if (typeof ResizeObserver === "function") {
      const ro = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          if (
            !topBarGeometryCache ||
            Math.round(width) !== topBarGeometryCache.vw ||
            Math.round(height) !== topBarGeometryCache.vh
          ) {
            handleDimensionChange();
          }
        }
      });
      ro.observe(document.documentElement);
    } else {
      global.addEventListener("resize", handleDimensionChange, { passive: true });
    }

    global.VVBus?.on("i18n:updated", () => {
      global.requestAnimationFrame(() => {
        computeTopBarGeometry(true);
      });
    });

    updateScrollUI();
  }

  document.addEventListener("DOMContentLoaded", () => {
    const savedNavHeight = Number(localStorage.getItem("vv_nav_height"));
    if (!isNaN(savedNavHeight) && savedNavHeight >= 42 && savedNavHeight <= 68) {
      document.documentElement.style.setProperty("--nav-height", `${savedNavHeight}px`);
    }

    global.VVComponents?.initDropdowns?.();
    global.VVComponents?.initFilePickers?.();
    bindGlobalNavigation();
    syncAuthVisibility(false, false);
    initScrollEffects();
    initRulesModal();
    initPwaInstall();

    global.VVViews.initHomeView();
    global.VVViews.initPhotosView();
    global.VVViews.initStoriesView();
    global.VVViews.initLibraryView();
    global.VVViews.initUploadView();
    global.VVViews.initSettingsView();
    global.VVViews.initAuthView();

    if (global.auth) {
      global.auth.onAuthStateChanged((user) => {
        global.VVState.currentUser = user;
        const isAuthorized = global.VVState.isAuthorized();
        syncAuthVisibility(isAuthorized, Boolean(user));

        if (subsRef) {
          subsRef.off();
          subsRef = null;
        }
        if (userRef) {
          userRef.off();
          userRef = null;
        }
        if (pubUserRef) {
          pubUserRef.off();
          pubUserRef = null;
        }
        if (modRef) {
          modRef.off();
          modRef = null;
        }
        rawPrivateUserData = null;
        rawPublicUserData = null;

        if (isAuthorized && user && global.db) {
          subsRef = global.db.ref(`users/${user.uid}/subscriptions`);
          subsRef.on(
            "value",
            (snap) => {
              const nextSet = new Set();
              snap.forEach((child) => {
                nextSet.add(child.key);
              });
              global.VVState.subscribedUids = nextSet;
              global.VVViews.renderStoriesStrip?.();
            },
            () => {
              global.VVState.subscribedUids = new Set();
              global.VVViews.renderStoriesStrip?.();
            }
          );
        } else {
          global.VVState.subscribedUids = new Set();
          global.VVViews.renderStoriesStrip?.();
        }

        if (user && global.db) {
          const syncMergedUser = () => {
            global.VVState.currentUserData = {
              ...(rawPrivateUserData || {}),
              ...(rawPublicUserData || {})
            };
            global.VVViews.populateUserForms();
          };

          userRef = global.db.ref(`users/${user.uid}`);
          userRef.on(
            "value",
            (snap) => {
              rawPrivateUserData = snap.val() || {};
              syncMergedUser();
            },
            () => {
              rawPrivateUserData = rawPrivateUserData || {};
              syncMergedUser();
            }
          );

          pubUserRef = global.db.ref(`publicUsers/${user.uid}`);
          pubUserRef.on(
            "value",
            (snap) => {
              rawPublicUserData = snap.val() || {};
              syncMergedUser();
            },
            () => {
              rawPublicUserData = rawPublicUserData || {};
            }
          );

          modRef = global.db.ref(`moderation/users/${user.uid}/status`);
          modRef.on(
            "value",
            (snap) => {
              global.VVState.currentModerationStatus = snap.val() || "active";
            },
            () => {
              global.VVState.currentModerationStatus = "active";
            }
          );

          global.VVViews.loadUserLibrary(user.uid);
        } else {
          global.VVState.currentUserData = null;
          global.VVState.currentModerationStatus = "active";
        }

        global.VVRouter.handleInitialRoute();
      });
    } else {
      global.VVViews.renderStoriesStrip?.();
      global.VVRouter.handleInitialRoute();
    }
  });
})(window);