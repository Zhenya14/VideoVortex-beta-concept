(function (global) {
  'use strict';

  const { clear } = global.VV;

  function renderFeeds(filterQuery = "") {
    const homeContainer = document.getElementById("video-container");
    const popularContainer = document.getElementById("popular-videos");
    const allVideosMap = global.VVState?.allVideosMap || {};
    const currentUser = global.VVState?.currentUser;
    const q = filterQuery.trim().toLowerCase();

    const entries = Object.entries(allVideosMap).filter(([, v]) => {
      if (!v) return false;
      if (v.expiresAt && Date.now() > Number(v.expiresAt)) return false;
      if (
        v.private &&
        (!currentUser || (currentUser.uid !== v.authorUid && currentUser.email !== v.email))
      ) {
        return false;
      }
      if (!q) return true;
      const titleMatch = String(v.title || "").toLowerCase().includes(q);
      const authorMatch = String(v.author || "").toLowerCase().includes(q);
      return titleMatch || authorMatch;
    });

    if (homeContainer) {
      clear(homeContainer);
      entries
        .slice()
        .reverse()
        .forEach(([key, video]) => {
          homeContainer.appendChild(
            global.VVComponents.createVideoCard(key, video, {
              onOpen: (k, v) => global.VVViews.openVideo(k, v),
              onAuthorClick: (uid) => global.VVViews.openProfile(uid)
            })
          );
        });
    }

    if (popularContainer) {
      clear(popularContainer);
      entries
        .slice()
        .sort((a, b) => {
          const scoreB = Number(b[1].boostCount || 0) * 15 + Number(b[1].views || 0);
          const scoreA = Number(a[1].boostCount || 0) * 15 + Number(a[1].views || 0);
          return scoreB - scoreA;
        })
        .forEach(([key, video]) => {
          popularContainer.appendChild(
            global.VVComponents.createVideoCard(key, video, {
              onOpen: (k, v) => global.VVViews.openVideo(k, v),
              onAuthorClick: (uid) => global.VVViews.openProfile(uid)
            })
          );
        });
    }
  }

  function initHomeView() {
    if (!global.db) return;

    const topNav = document.querySelector("nav.top-navbar");
    const searchContainer = document.getElementById("search-container");
    const searchInput = document.getElementById("search-input");
    const searchToggle = searchContainer?.querySelector(".search-toggle");
    const searchCloseBtn = document.getElementById("search-close-btn");
    const mobileSearchTrigger = document.getElementById("mobile-search-trigger");

    const syncQueryState = () => {
      const hasQuery = Boolean(searchInput?.value.trim());
      searchContainer?.classList.toggle("has-query", hasQuery);
    };

    const openTopSearch = () => {
      topNav?.classList.add("is-search-active");
      global.requestAnimationFrame(() => {
        searchInput?.focus();
      });
    };

    const closeTopSearch = (clearQuery = true) => {
      if (clearQuery && searchInput && searchInput.value) {
        searchInput.value = "";
        renderFeeds("");
      }
      syncQueryState();
      topNav?.classList.remove("is-search-active");
      searchInput?.blur();
    };

    if (searchInput) {
      searchInput.addEventListener("input", () => {
        syncQueryState();
        renderFeeds(searchInput.value);
      });

      searchInput.addEventListener("focus", () => {
        topNav?.classList.add("is-search-active");
      });

      searchInput.addEventListener("blur", () => {
        if ((global.innerWidth || 0) >= 600) {
          topNav?.classList.remove("is-search-active");
        }
      });

      searchInput.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          closeTopSearch(true);
        } else if (e.key === "Enter") {
          const activeView = global.VVRouter?.getCurrentView?.();
          if (activeView && activeView !== "home" && activeView !== "popular") {
            global.VVRouter.navigate("home");
          }
          renderFeeds(searchInput.value);
          if ((global.innerWidth || 0) < 600 && searchInput.value.trim()) {
            searchInput.blur();
          }
        }
      });
    }

    searchToggle?.addEventListener("click", () => {
      openTopSearch();
    });

    mobileSearchTrigger?.addEventListener("click", () => {
      openTopSearch();
    });

    searchCloseBtn?.addEventListener("click", () => {
      const isCompact = (global.innerWidth || 0) < 600;
      if (isCompact) {
        closeTopSearch(true);
      } else {
        if (searchInput) {
          searchInput.value = "";
          renderFeeds("");
          syncQueryState();
          searchInput.focus();
        }
      }
    });

    document.addEventListener("pointerdown", (e) => {
      if (!topNav || !topNav.classList.contains("is-search-active")) return;
      if ((global.innerWidth || 0) >= 600) return;
      if (!topNav.contains(e.target) && !searchInput?.value.trim()) {
        closeTopSearch(false);
      }
    });

    syncQueryState();

    global.db.ref("videos").on(
      "value",
      (snapshot) => {
        global.VVState.allVideosMap = snapshot.val() || {};
        renderFeeds(searchInput?.value || "");
      },
      () => {}
    );
  }

  global.VVViews = global.VVViews || {};
  global.VVViews.initHomeView = initHomeView;
  global.VVViews.renderFeeds = renderFeeds;
})(window);
