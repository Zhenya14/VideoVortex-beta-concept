(function (global) {
  'use strict';

  const VIEW_IDS = {
    home: "home-view",
    popular: "popular-view",
    photos: "photos-view",
    library: "library-view",
    archive: "archive-view",
    upload: "upload-view",
    settings: "settings-view",
    auth: "auth-view",
    video: "spa-video-view",
    profile: "spa-profile-view"
  };

  const TAB_ORDER = ["home", "popular", "photos", "library", "settings"];
  const TRANSITION_CLASSES = [
    "vv-view-initial",
    "vv-view-entering",
    "vv-view-leaving",
    "vv-dir-forward",
    "vv-dir-backward",
    "vv-dir-push-detail",
    "vv-dir-predictive-back"
  ];

  let currentView = "home";
  let activeVideoKey = null;
  let activeProfileUid = null;
  let initialHandled = false;
  let hasRenderedFirstView = false;
  let navIndex = 0;
  let leavingSection = null;
  let transitionTimer = null;
  let pendingPopOptions = null;

  function isReducedMotion() {
    return Boolean(
      document.body?.classList.contains("reduced-motion") ||
      global.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches
    );
  }

  function clearTransitionClasses(el) {
    if (!el) return;
    el.classList.remove(...TRANSITION_CLASSES);
    el.style.top = "";
    el.style.transform = "";
    el.style.opacity = "";
    el.style.borderRadius = "";
    el.style.transition = "";
  }

  function finalizeLeavingSection() {
    if (transitionTimer) {
      clearTimeout(transitionTimer);
      transitionTimer = null;
    }
    if (leavingSection) {
      clearTransitionClasses(leavingSection);
      if (VIEW_IDS[currentView] !== leavingSection.id) {
        leavingSection.classList.add("hidden");
      }
      leavingSection = null;
    }
    Object.entries(VIEW_IDS).forEach(([key, domId]) => {
      const section = document.getElementById(domId);
      if (!section) return;
      section.classList.remove("vv-view-entering", "vv-view-initial", "vv-dir-forward", "vv-dir-backward", "vv-dir-push-detail", "vv-dir-predictive-back");
      if (key !== currentView) {
        section.classList.add("hidden");
      }
    });
  }

  function resolveDirection(prevView, targetView, options = {}) {
    if (options.direction) return options.direction;

    const prevIdx = TAB_ORDER.indexOf(prevView);
    const targetIdx = TAB_ORDER.indexOf(targetView);

    if (prevIdx !== -1 && targetIdx !== -1) {
      if (targetIdx > prevIdx) return "forward";
      if (targetIdx < prevIdx) return "backward";
    }

    if (options.isBack) {
      return "predictive-back";
    }

    if (prevIdx === -1 && targetIdx !== -1) {
      return "predictive-back";
    }

    return "push-detail";
  }

  function navigate(viewName, params = {}, pushState = true, options = {}) {
    let effectiveOptions = options;
    if (!pushState && pendingPopOptions) {
      effectiveOptions = { ...pendingPopOptions, ...options };
      pendingPopOptions = null;
    } else if (pushState) {
      pendingPopOptions = null;
    }

    const targetView = VIEW_IDS[viewName] ? viewName : "home";
    const prevView = currentView;
    const prevVideoKey = activeVideoKey;
    const prevProfileUid = activeProfileUid;

    if (params.videoKey !== undefined) activeVideoKey = params.videoKey;
    if (params.profileUid !== undefined) activeProfileUid = params.profileUid;

    const isSameView = hasRenderedFirstView && prevView === targetView;
    const isSameDetailItem =
      (targetView === "video" && activeVideoKey === prevVideoKey) ||
      (targetView === "profile" && activeProfileUid === prevProfileUid) ||
      (targetView !== "video" && targetView !== "profile");

    if (isSameView && isSameDetailItem) {
      global.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    finalizeLeavingSection();

    const prevDomId = VIEW_IDS[prevView];
    const targetDomId = VIEW_IDS[targetView];
    const outgoingEl = prevDomId ? document.getElementById(prevDomId) : null;
    const incomingEl = targetDomId ? document.getElementById(targetDomId) : null;
    const prevScrollY = global.scrollY || document.documentElement.scrollTop || 0;
    const reduced = isReducedMotion();

    currentView = targetView;

    if (!hasRenderedFirstView || reduced || !incomingEl || !outgoingEl || outgoingEl === incomingEl) {
      Object.entries(VIEW_IDS).forEach(([key, domId]) => {
        const section = document.getElementById(domId);
        if (!section) return;
        clearTransitionClasses(section);
        section.classList.toggle("hidden", key !== targetView);
      });

      if (!hasRenderedFirstView && incomingEl && !reduced) {
        incomingEl.classList.add("vv-view-initial");
        transitionTimer = setTimeout(() => {
          incomingEl.classList.remove("vv-view-initial");
          transitionTimer = null;
        }, 280);
      } else if (isSameView && incomingEl && !reduced) {
        incomingEl.classList.add("vv-view-entering", "vv-dir-push-detail");
        transitionTimer = setTimeout(() => {
          incomingEl.classList.remove("vv-view-entering", "vv-dir-push-detail");
          transitionTimer = null;
        }, 360);
      }
      hasRenderedFirstView = true;
    } else {
      const direction = resolveDirection(prevView, targetView, effectiveOptions);
      const dirClass = `vv-dir-${direction}`;
      const baseTop = (global.innerWidth || 0) <= 768 ? 14 : 20;

      Object.entries(VIEW_IDS).forEach(([key, domId]) => {
        const section = document.getElementById(domId);
        if (!section) return;
        clearTransitionClasses(section);
        if (section !== outgoingEl && section !== incomingEl) {
          section.classList.add("hidden");
        }
      });

      outgoingEl.classList.remove("hidden");
      if (prevScrollY > 0) {
        outgoingEl.style.top = `${baseTop - prevScrollY}px`;
      }
      outgoingEl.classList.add("vv-view-leaving", dirClass);
      leavingSection = outgoingEl;

      incomingEl.classList.remove("hidden");
      incomingEl.classList.add("vv-view-entering", dirClass);
      void incomingEl.offsetWidth;

      transitionTimer = setTimeout(() => {
        finalizeLeavingSection();
      }, 360);
    }

    if (targetView !== "video") {
      const vidEl = document.getElementById("spa-video-element");
      if (vidEl && typeof vidEl.pause === "function") {
        vidEl.pause();
      }
    }

    document.querySelectorAll("[data-nav]").forEach((btn) => {
      if (
        btn.classList.contains("menu-btn") ||
        btn.classList.contains("desktop-nav-btn")
      ) {
        btn.classList.toggle("active", btn.getAttribute("data-nav") === targetView);
      }
    });

    if (pushState && global.history && global.history.pushState) {
      const url = new URL(global.location.href);
      url.searchParams.delete("view");
      url.searchParams.delete("video");
      url.searchParams.delete("key");
      url.searchParams.delete("profile");
      url.searchParams.delete("uid");

      if (targetView === "video" && activeVideoKey) {
        url.searchParams.set("video", activeVideoKey);
      } else if (targetView === "profile" && activeProfileUid) {
        url.searchParams.set("profile", activeProfileUid);
      } else if (targetView !== "home") {
        url.searchParams.set("view", targetView);
      }

      navIndex += 1;
      global.history.pushState(
        { viewName: targetView, activeVideoKey, activeProfileUid, navIndex },
        "",
        url.toString()
      );
    }

    global.VVBus?.emit("router:change", {
      view: targetView,
      activeVideoKey,
      activeProfileUid
    });

    if (prevScrollY > 0) {
      global.scrollTo({ top: 0, behavior: reduced ? "auto" : "instant" });
    }
  }

  function syncRouteFromUrl(options = {}) {
    const params = new URLSearchParams(global.location.search);
    const videoKey = params.get("video") || params.get("key");
    const profileUid = params.get("profile") || params.get("uid");
    const view = params.get("view");

    if (videoKey && global.VVViews?.openVideo) {
      global.VVViews.openVideo(videoKey, null, false);
    } else if (profileUid && global.VVViews?.openProfile) {
      global.VVViews.openProfile(profileUid, false);
    } else if (view && VIEW_IDS[view]) {
      navigate(view, {}, false, options);
    } else {
      navigate("home", {}, false, options);
    }
  }

  function handleInitialRoute() {
    if (initialHandled) return;
    initialHandled = true;
    syncRouteFromUrl();
  }

  global.addEventListener("popstate", (e) => {
    const state = e.state;
    const nextIdx = typeof state?.navIndex === "number" ? state.navIndex : 0;
    const isBack = nextIdx < navIndex || !state;
    navIndex = nextIdx;

    const options = { isBack };
    pendingPopOptions = options;

    if (!state) {
      syncRouteFromUrl(options);
      return;
    }

    if (state.viewName === "video" && state.activeVideoKey && global.VVViews?.openVideo) {
      global.VVViews.openVideo(state.activeVideoKey, null, false);
    } else if (state.viewName === "profile" && state.activeProfileUid && global.VVViews?.openProfile) {
      global.VVViews.openProfile(state.activeProfileUid, false);
    } else if (state.viewName) {
      navigate(state.viewName, {}, false, options);
    }
  });

  function initPredictiveGestures() {
    let gesture = null;

    const isBlockedTarget = (el) => {
      if (!el || typeof el.closest !== "function") return false;
      if (
        el.closest(
          "input, textarea, select, button, a, video, .stories-container, .smart-menu, .vv-dropdown, .vv-file-picker, [data-no-swipe]"
        )
      ) {
        return true;
      }
      if (
        document.querySelector(
          ".modal-overlay:not(.hidden), .story-viewer-modal:not(.hidden), .notifications-dropdown:not(.hidden)"
        )
      ) {
        return true;
      }
      let cur = el;
      while (cur && cur !== document.body) {
        if (cur.scrollWidth > cur.clientWidth + 6) {
          const ox = global.getComputedStyle(cur).overflowX;
          if (ox === "auto" || ox === "scroll") return true;
        }
        cur = cur.parentElement;
      }
      return false;
    };

    document.addEventListener(
      "touchstart",
      (e) => {
        if (isReducedMotion()) return;
        if (!e.touches || e.touches.length !== 1) return;
        if (isBlockedTarget(e.target)) return;

        const touch = e.touches[0];
        const tabIdx = TAB_ORDER.indexOf(currentView);
        const isEdgeBack =
          touch.clientX <= 26 && (navIndex > 0 || tabIdx === -1 || currentView !== "home");
        const canTabSwipe = !isEdgeBack && tabIdx !== -1;

        if (!isEdgeBack && !canTabSwipe) return;

        const domId = VIEW_IDS[currentView];
        const section = domId ? document.getElementById(domId) : null;
        if (!section || section.classList.contains("hidden")) return;

        gesture = {
          startX: touch.clientX,
          startY: touch.clientY,
          dx: 0,
          startTime: Date.now(),
          axis: null,
          isEdgeBack,
          canTabSwipe,
          tabIdx,
          section
        };
      },
      { passive: true }
    );

    document.addEventListener(
      "touchmove",
      (e) => {
        if (!gesture || !e.touches || e.touches.length !== 1) return;
        const touch = e.touches[0];
        const dx = touch.clientX - gesture.startX;
        const dy = touch.clientY - gesture.startY;
        gesture.dx = dx;

        if (!gesture.axis) {
          if (Math.abs(dy) > 14 && Math.abs(dy) > Math.abs(dx)) {
            gesture = null;
            return;
          }
          if (Math.abs(dx) > 16 && Math.abs(dx) > Math.abs(dy) * 1.45) {
            if (gesture.isEdgeBack) {
              if (dx <= 10) {
                gesture = null;
                return;
              }
              gesture.axis = "x";
            } else if (gesture.canTabSwipe) {
              const targetTabIdx = gesture.tabIdx + (dx < 0 ? 1 : -1);
              if (targetTabIdx < 0 || targetTabIdx >= TAB_ORDER.length) {
                gesture = null;
                return;
              }
              gesture.axis = "x";
            }
          }
        }

        if (gesture && gesture.axis === "x") {
          const sec = gesture.section;
          sec.style.transition = "none";
          if (gesture.isEdgeBack) {
            const maxSpan = Math.min(260, (global.innerWidth || 360) * 0.72);
            const progress = Math.min(1, Math.max(0, dx / maxSpan));
            const scale = 1 - progress * 0.085;
            const tx = Math.min(72, Math.max(0, dx * 0.32));
            sec.style.transform = `translate3d(${tx}px, 0, 0) scale(${scale})`;
            sec.style.borderRadius = `${Math.round(progress * 24)}px`;
            sec.style.opacity = String(1 - progress * 0.24);
          } else {
            const damp = Math.max(-72, Math.min(72, dx * 0.24));
            sec.style.transform = `translate3d(${damp}px, 0, 0)`;
            sec.style.opacity = String(Math.max(0.76, 1 - Math.abs(dx) / 920));
          }
        }
      },
      { passive: true }
    );

    const endGesture = () => {
      if (!gesture) return;
      const g = gesture;
      gesture = null;

      if (g.axis !== "x") return;

      const elapsed = Math.max(1, Date.now() - g.startTime);
      const vx = Math.abs(g.dx) / elapsed;
      const committed = g.isEdgeBack
        ? g.dx > 78 || (g.dx > 40 && vx > 0.45)
        : Math.abs(g.dx) > 68 || (Math.abs(g.dx) > 36 && vx > 0.45);

      const sec = g.section;

      if (committed) {
        sec.style.transition = "";
        sec.style.transform = "";
        sec.style.opacity = "";
        sec.style.borderRadius = "";

        if (g.isEdgeBack) {
          if (navIndex > 0 && global.history) {
            global.history.back();
          } else {
            navigate("home", {}, true, { direction: "predictive-back" });
          }
        } else {
          const nextTab = TAB_ORDER[g.tabIdx + (g.dx < 0 ? 1 : -1)];
          if (nextTab) {
            navigate(nextTab);
          }
        }
      } else {
        sec.style.transition =
          "transform 0.22s cubic-bezier(0.2, 0, 0, 1), opacity 0.22s ease, border-radius 0.22s ease";
        sec.style.transform = "";
        sec.style.opacity = "";
        sec.style.borderRadius = "";
        setTimeout(() => {
          sec.style.transition = "";
        }, 240);
      }
    };

    document.addEventListener("touchend", endGesture, { passive: true });
    document.addEventListener("touchcancel", endGesture, { passive: true });
  }

  document.addEventListener("DOMContentLoaded", initPredictiveGestures);

  global.VVRouter = {
    navigate,
    handleInitialRoute,
    getCurrentView: () => currentView
  };
  global.switchSpaView = (viewName, pushState = true) => navigate(viewName, {}, pushState);
})(window);
