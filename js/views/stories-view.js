(function (global) {
  'use strict';

  const { el, clear, applyAvatarElement } = global.VV;
  let rawStoriesList = [];
  let visibleGroups = [];
  let currentGroupIndex = 0;
  let currentItemIndex = 0;
  let storyTimer = null;

  function getVisibleStoryGroups() {
    const isAuthorized = global.VVState?.isAuthorized?.();
    const currentUser = global.VVState?.currentUser;
    if (!isAuthorized || !currentUser) return [];

    const now = Date.now();
    const subscribedUids = global.VVState?.subscribedUids || new Set();
    const groupedMap = new Map();

    rawStoriesList.forEach((story) => {
      if (!story || !story.uid) return;
      if (story.expiresAt && Number(story.expiresAt) <= now) return;
      if (story.uid !== currentUser.uid && !subscribedUids.has(story.uid)) return;

      if (!groupedMap.has(story.uid)) {
        groupedMap.set(story.uid, {
          uid: story.uid,
          name: story.name || "Користувач",
          avatar: story.avatar || "",
          authorColor: story.authorColor || "",
          latestAt: Number(story.createdAt || 0),
          items: []
        });
      }

      const group = groupedMap.get(story.uid);
      group.items.push(story);
      const ts = Number(story.createdAt || 0);
      if (ts > group.latestAt) {
        group.latestAt = ts;
        if (story.name) group.name = story.name;
        if (story.avatar) group.avatar = story.avatar;
        if (story.authorColor) group.authorColor = story.authorColor;
      }
    });

    const groups = Array.from(groupedMap.values());
    groups.forEach((g) => {
      g.items.sort((a, b) => Number(a.createdAt || 0) - Number(b.createdAt || 0));
    });

    groups.sort((a, b) => {
      if (a.uid === currentUser.uid) return -1;
      if (b.uid === currentUser.uid) return 1;
      return b.latestAt - a.latestAt;
    });

    return groups;
  }

  function renderStoriesStrip() {
    const section = document.getElementById("home-stories-section");
    const strip = document.getElementById("stories-container");
    if (!strip) return;

    const isAuthorized = global.VVState?.isAuthorized?.();
    if (!isAuthorized) {
      section?.classList.add("hidden");
      clear(strip);
      visibleGroups = [];
      return;
    }

    section?.classList.remove("hidden");
    clear(strip);

    strip.appendChild(
      global.VVComponents.createStoryAddItem(() => {
        if (!global.VVState.canUserPost()) return;
        document.getElementById("story-upload-modal")?.classList.remove("hidden");
      })
    );

    visibleGroups = getVisibleStoryGroups();
    visibleGroups.forEach((group, groupIdx) => {
      strip.appendChild(
        global.VVComponents.createStoryItem(group, () => openStoryViewer(groupIdx, 0))
      );
    });
  }

  function stepStory(delta) {
    if (!visibleGroups.length) {
      closeStoryViewer();
      return;
    }

    const activeGroup = visibleGroups[currentGroupIndex];
    if (!activeGroup) {
      closeStoryViewer();
      return;
    }

    const nextItem = currentItemIndex + delta;
    if (nextItem >= 0 && nextItem < activeGroup.items.length) {
      openStoryViewer(currentGroupIndex, nextItem);
      return;
    }

    const nextGroup = currentGroupIndex + (delta > 0 ? 1 : -1);
    if (nextGroup >= 0 && nextGroup < visibleGroups.length) {
      const targetItems = visibleGroups[nextGroup].items;
      openStoryViewer(nextGroup, delta > 0 ? 0 : Math.max(0, targetItems.length - 1));
      return;
    }

    closeStoryViewer();
  }

  function openStoryViewer(groupIndex, itemIndex = 0) {
    if (!visibleGroups.length) return;
    currentGroupIndex = Math.max(0, Math.min(groupIndex, visibleGroups.length - 1));
    const group = visibleGroups[currentGroupIndex];
    if (!group || !group.items.length) return;

    currentItemIndex = Math.max(0, Math.min(itemIndex, group.items.length - 1));
    const story = group.items[currentItemIndex];
    const viewer = document.getElementById("story-viewer");
    if (!viewer) return;

    viewer.classList.add("active");
    const stage = document.getElementById("story-media-stage");
    const nameEl = document.getElementById("story-author-name");
    const avatarEl = document.getElementById("story-author-avatar");
    const captionEl = document.getElementById("story-caption-text");
    const delBtn = document.getElementById("delete-story-btn");
    const progressWrap = document.getElementById("story-progress");
    const userLink = document.getElementById("story-user-link");
    const currentUser = global.VVState?.currentUser;

    if (nameEl) nameEl.textContent = group.name || story.name || "Користувач";
    applyAvatarElement(avatarEl, {
      avatarUrl: group.avatar || story.avatar,
      name: group.name || story.name,
      color: group.authorColor || story.authorColor
    });

    if (userLink) {
      userLink.onclick = () => {
        closeStoryViewer();
        if (story.uid) global.VVViews.openProfile(story.uid);
      };
    }

    if (captionEl) {
      captionEl.textContent = story.description || "";
      captionEl.classList.toggle("hidden", !story.description);
    }

    if (delBtn) {
      delBtn.classList.toggle("hidden", !currentUser || currentUser.uid !== story.uid);
    }

    let activeFill = null;
    if (progressWrap) {
      clear(progressWrap);
      group.items.forEach((_, idx) => {
        const fill = el("div", {
          className: "story-progress-fill",
          style: { width: idx < currentItemIndex ? "100%" : "0%" }
        });
        if (idx === currentItemIndex) activeFill = fill;
        progressWrap.appendChild(el("div", { className: "story-progress-bar" }, fill));
      });
    }

    if (stage) {
      clear(stage);
      if (story.type === "video") {
        stage.appendChild(el("video", { src: story.url, autoplay: true, playsInline: true }));
      } else {
        stage.appendChild(el("img", { src: story.url, alt: story.name || "Story" }));
      }
    }

    clearInterval(storyTimer);
    let progress = 0;
    storyTimer = setInterval(() => {
      progress += 2;
      if (activeFill) activeFill.style.width = `${Math.min(progress, 100)}%`;
      if (progress >= 100) {
        clearInterval(storyTimer);
        stepStory(1);
      }
    }, 120);
  }

  function closeStoryViewer() {
    clearInterval(storyTimer);
    const viewer = document.getElementById("story-viewer");
    if (viewer) viewer.classList.remove("active");
    const stage = document.getElementById("story-media-stage");
    if (stage) clear(stage);
  }

  function initStoriesView() {
    if (!global.db) return;

    global.db.ref("stories").on(
      "value",
      (snap) => {
        const now = Date.now();
        const list = [];
        snap.forEach((child) => {
          const s = child.val();
          if (s && (!s.expiresAt || Number(s.expiresAt) > now)) {
            list.push({ id: child.key, ...s });
          }
        });
        rawStoriesList = list;
        renderStoriesStrip();
      },
      () => {
        rawStoriesList = [];
        renderStoriesStrip();
      }
    );

    document.getElementById("close-story-btn")?.addEventListener("click", closeStoryViewer);
    document.getElementById("story-prev-zone")?.addEventListener("click", () => stepStory(-1));
    document.getElementById("story-next-zone")?.addEventListener("click", () => stepStory(1));

    document.getElementById("delete-story-btn")?.addEventListener("click", async () => {
      const activeGroup = visibleGroups[currentGroupIndex];
      const story = activeGroup?.items?.[currentItemIndex];
      const currentUser = global.VVState?.currentUser;
      if (!story || !currentUser || currentUser.uid !== story.uid) return;
      try {
        await global.db.ref(`stories/${story.id}`).remove();
        global.VV.showToast("Історію видалено", "success");
        closeStoryViewer();
      } catch (err) {
        global.VV.showToast("Не вдалося видалити історію", "error");
      }
    });
  }

  global.VVViews = global.VVViews || {};
  global.VVViews.initStoriesView = initStoriesView;
  global.VVViews.renderStoriesStrip = renderStoriesStrip;
})(window);
