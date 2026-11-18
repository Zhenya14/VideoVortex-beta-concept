(function (global) {
  'use strict';

  const { el, clear, icon, applyAvatarElement, applyWallpaperElement } = global.VV;
  let activeProfileRefs = [];

  function tr(key, fallback) {
    const val = global.t?.(key);
    return val && val !== key ? val : fallback;
  }

  function detachProfileRefs() {
    activeProfileRefs.forEach((ref) => {
      try {
        ref.off();
      } catch (e) {}
    });
    activeProfileRefs = [];
  }

  function createStatBlock(baseKey, initialCount) {
    const valEl = el("div", { className: "profile-nt-stat-val", text: String(initialCount) });
    const labelEl = el("div", { className: "profile-nt-stat-label" });
    if (typeof global.renderPluralStatLabel === "function") {
      global.renderPluralStatLabel(labelEl, baseKey, initialCount);
    } else {
      labelEl.textContent = baseKey;
    }
    const blockEl = el("div", { className: "profile-nt-stat" }, valEl, labelEl);
    const update = (count) => {
      const n = Number(count || 0);
      valEl.textContent = String(n);
      if (typeof global.renderPluralStatLabel === "function") {
        global.renderPluralStatLabel(labelEl, baseKey, n);
      } else {
        labelEl.textContent = baseKey;
      }
    };
    return { blockEl, update };
  }

  async function openProfile(uid, pushState = true) {
    if (!uid || !global.db) return;
    detachProfileRefs();

    const container = document.getElementById("spa-profile-content");
    if (!container) return;

    global.VVRouter.navigate("profile", { profileUid: uid }, pushState);
    clear(container);
    container.appendChild(
      el("div", {
        className: "panel-card",
        dataset: { i18n: "profile-loading" },
        text: tr("profile-loading", "Завантаження профілю...")
      })
    );

    const [pubSnap, userSnap] = await Promise.all([
      global.db.ref(`publicUsers/${uid}`).once("value").catch(() => null),
      global.db.ref(`users/${uid}`).once("value").catch(() => null)
    ]);

    const profile = { ...(pubSnap?.val() || {}), ...(userSnap?.val() || {}) };
    const displayName = profile.name || profile.username || "Користувач";
    const supername = profile.supername ? `@${profile.supername.replace(/^@/, "")}` : "";
    const currentUser = global.VVState?.currentUser;
    const isOwnProfile = Boolean(currentUser && currentUser.uid === uid);
    const isPrivate = profile.privateProfile === true && !isOwnProfile;
    const rawWallpaper = profile.wallpaper || profile.wallpaperUrl || profile.wallpaperId || "";
    const bioText = String(profile.bio || profile.description || "").trim();

    const bannerEl = el(
      "div",
      { className: "profile-nt-banner" },
      el("div", { className: "profile-nt-banner-scrim" })
    );
    applyWallpaperElement(bannerEl, rawWallpaper);

    const profAvatarEl = el("div", { className: "profile-avatar profile-nt-avatar" });
    applyAvatarElement(profAvatarEl, {
      avatarId: profile.avatarId,
      avatarUrl: profile.avatar,
      name: displayName,
      color: profile.color
    });

    const statVideos = createStatBlock("videos", 0);
    const statPosts = createStatBlock("posts", 0);
    const statSubs = createStatBlock("subscribers", 0);

    const isAuthorized = Boolean(global.VVState?.isAuthorized?.());

    const subsRef = global.db.ref(`subscribers/${uid}`);
    activeProfileRefs.push(subsRef);
    subsRef.on(
      "value",
      (snap) => {
        statSubs.update(snap.numChildren());
      },
      () => {}
    );

    const editProfileBtn = isOwnProfile
      ? el(
          "button",
          {
            type: "button",
            className: "btn",
            onClick: () => {
              global.VVRouter.navigate("settings");
              global.VVBus?.emit("settings:select-tab", "profile");
            }
          },
          icon("edit"),
          el("span", { dataset: { i18n: "edit-profile" }, text: tr("edit-profile", "Редагувати профіль") })
        )
      : null;

    const subTextEl = el("span", {
      text: global.VVState?.subscribedUids?.has(uid)
        ? tr("subscribed", "Ви підписані")
        : tr("subscribe", "Підписатися")
    });
    const subscribeBtn =
      isAuthorized && !isOwnProfile
        ? el(
            "button",
            {
              type: "button",
              className: global.VVState?.subscribedUids?.has(uid) ? "btn" : "btn btn-primary",
              onClick: async () => {
                await global.VVState.toggleSubscribe(uid, { name: displayName });
                const nowSub = global.VVState.subscribedUids.has(uid);
                subscribeBtn.className = nowSub ? "btn" : "btn btn-primary";
                subTextEl.textContent = nowSub
                  ? tr("subscribed", "Ви підписані")
                  : tr("subscribe", "Підписатися");
              }
            },
            icon("notifications_active"),
            subTextEl
          )
        : null;

    const blockLabelEl = el("span", { text: tr("block", "Заблокувати") });
    const blockBtn =
      isAuthorized && !isOwnProfile
        ? el(
            "button",
            {
              type: "button",
              className: "btn btn-danger",
              onClick: async () => {
                try {
                  const nowBlocked = await global.VV.isUserBlockedByMe(currentUser.uid, uid);
                  if (nowBlocked) {
                    await global.db.ref(`users/${currentUser.uid}/blockedUsers/${uid}`).remove();
                    blockLabelEl.textContent = tr("block", "Заблокувати");
                    global.VV.showToast(tr("user-unblocked", "Користувача розблоковано"), "info");
                  } else {
                    await global.db.ref(`users/${currentUser.uid}/blockedUsers/${uid}`).set({
                      blocked: true,
                      uid,
                      userName: displayName
                    });
                    blockLabelEl.textContent = tr("unblock-user", "Розблокувати");
                    global.VV.showToast("Користувача заблоковано", "info");
                  }
                } catch (err) {
                  global.VV.showToast("Не вдалося оновити блокування", "error");
                }
              }
            },
            icon("block"),
            blockLabelEl
          )
        : null;

    if (blockBtn && currentUser) {
      global.VV.isUserBlockedByMe(currentUser.uid, uid).then((blocked) => {
        blockLabelEl.textContent = blocked
          ? tr("unblock-user", "Розблокувати")
          : tr("block", "Заблокувати");
      });
    }

    const shareProfileBtn = el(
      "button",
      {
        type: "button",
        className: "btn",
        onClick: () => {
          const url = new URL(global.location.href);
          url.search = `?profile=${encodeURIComponent(uid)}`;
          if (!navigator.clipboard?.writeText) {
            global.VV.showToast("Буфер обміну недоступний", "warning");
            return;
          }
          navigator.clipboard
            .writeText(url.toString())
            .then(() => {
              global.VV.showToast(tr("profile-link-copied", "Посилання на профіль скопійовано"), "success");
            })
            .catch(() => {
              global.VV.showToast("Не вдалося скопіювати посилання", "warning");
            });
        }
      },
      icon("share"),
      el("span", { dataset: { i18n: "shareBtn" }, text: tr("shareBtn", "Поділитися") })
    );

    const videosGrid = el("div", { className: "video-container" });
    const postsGrid = el("div", { className: "photos-grid" });
    const archiveTbody = el("tbody");
    const repostsGrid = el("div", { className: "video-container" });

    const tabSecVideos = el("section", { className: "profile-tab-section active" }, videosGrid);
    const tabSecPosts = el("section", { className: "profile-tab-section" }, postsGrid);
    const tabSecArchive = el(
      "section",
      { className: "profile-tab-section" },
      el(
        "div",
        { className: "panel-card", style: { overflowX: "auto" } },
        el(
          "table",
          { className: "archive-table" },
          el(
            "thead",
            null,
            el("tr", null, el("th", { text: "Файл" }), el("th", { text: "Дата" }), el("th", { text: "Дії" }))
          ),
          archiveTbody
        )
      )
    );
    const tabSecReposts = el("section", { className: "profile-tab-section" }, repostsGrid);

    const tabSections = {
      videos: tabSecVideos,
      posts: tabSecPosts,
      archive: tabSecArchive,
      reposts: tabSecReposts
    };

    const tabTitles = {
      videos: { key: "profile-user-videos", fallback: "Відео користувача" },
      posts: { key: "profile-tab-posts", fallback: "Дописи" },
      archive: { key: "profile-tab-archive", fallback: "ZIP Архіви" },
      reposts: { key: "profile-tab-reposts", fallback: "Репости" }
    };

    const mainTitleEl = el("h2", {
      className: "profile-nt-section-title",
      dataset: { i18n: tabTitles.videos.key },
      text: tr(tabTitles.videos.key, tabTitles.videos.fallback)
    });

    const tabButtons = {};
    const switchTab = (tabKey) => {
      Object.entries(tabButtons).forEach(([k, btn]) => btn.classList.toggle("active", k === tabKey));
      Object.entries(tabSections).forEach(([k, sec]) => sec.classList.toggle("active", k === tabKey));
      const meta = tabTitles[tabKey] || tabTitles.videos;
      mainTitleEl.dataset.i18n = meta.key;
      mainTitleEl.textContent = tr(meta.key, meta.fallback);
    };

    tabButtons.videos = el(
      "button",
      { type: "button", className: "tab-btn active", onClick: () => switchTab("videos") },
      icon("smart_display"),
      el("span", { dataset: { i18n: "profile-tab-videos" }, text: tr("profile-tab-videos", "Відео") })
    );
    tabButtons.posts = el(
      "button",
      { type: "button", className: "tab-btn", onClick: () => switchTab("posts") },
      icon("photo_library"),
      el("span", { dataset: { i18n: "profile-tab-posts" }, text: tr("profile-tab-posts", "Дописи") })
    );
    tabButtons.archive = el(
      "button",
      { type: "button", className: "tab-btn", onClick: () => switchTab("archive") },
      icon("folder_zip"),
      el("span", { dataset: { i18n: "profile-tab-archive" }, text: tr("profile-tab-archive", "ZIP Архіви") })
    );
    tabButtons.reposts = el(
      "button",
      { type: "button", className: "tab-btn", onClick: () => switchTab("reposts") },
      icon("repeat"),
      el("span", { dataset: { i18n: "profile-tab-reposts" }, text: tr("profile-tab-reposts", "Репости") })
    );

    if (!isPrivate) {
      const videosRef = global.db
        .ref("videos")
        .orderByChild("authorUid")
        .equalTo(uid);
      activeProfileRefs.push(videosRef);
      videosRef.on(
        "value",
        (snap) => {
          clear(videosGrid);
          const items = [];
          snap.forEach((c) => {
            const v = c.val();
            if (!v.private || isOwnProfile) {
              items.push({ key: c.key, ...v });
            }
          });
          statVideos.update(items.length);
          if (!items.length) {
            videosGrid.appendChild(
              global.VVComponents.createEmptyNotice(
                tr("profile-no-videos", "У користувача ще немає відео."),
                "profile-no-videos"
              )
            );
            return;
          }
          items.reverse().forEach((v) => {
            videosGrid.appendChild(
              global.VVComponents.createVideoCard(v.key, v, {
                onOpen: (k, vid) => global.VVViews.openVideo(k, vid),
                onAuthorClick: (authorUid) => openProfile(authorUid)
              })
            );
          });
        },
        () => {}
      );

      const postsRef = global.db
        .ref("photos")
        .orderByChild("authorUid")
        .equalTo(uid);
      activeProfileRefs.push(postsRef);
      postsRef.on(
        "value",
        (snap) => {
          clear(postsGrid);
          const items = [];
          snap.forEach((c) => items.push({ key: c.key, ...c.val() }));
          statPosts.update(items.length);
          if (!items.length) {
            postsGrid.appendChild(
              global.VVComponents.createEmptyNotice(
                tr("profile-no-posts", "Дописів ще немає."),
                "profile-no-posts"
              )
            );
            return;
          }
          items.reverse().forEach((post) => {
            postsGrid.appendChild(
              global.VVComponents.createPhotoCard(post.key, post, {
                isOwner: isOwnProfile,
                onDelete: async (photoKey) => {
                  try {
                    await global.db.ref(`photos/${photoKey}`).remove();
                    global.VV.showToast("Допис видалено", "success");
                  } catch (err) {
                    global.VV.showToast("Не вдалося видалити допис", "error");
                  }
                }
              })
            );
          });
        },
        () => {}
      );

      const archiveRef = global.db.ref(`users/${uid}/archive`);
      activeProfileRefs.push(archiveRef);
      archiveRef.on(
        "value",
        (snap) => {
          clear(archiveTbody);
          const items = [];
          snap.forEach((c) => items.push({ id: c.key, ...c.val() }));
          if (!items.length) {
            archiveTbody.appendChild(
              el(
                "tr",
                null,
                el("td", {
                  colspan: "3",
                  style: { color: "var(--text-secondary)" },
                  dataset: { i18n: "profile-no-archive" },
                  text: tr("profile-no-archive", "Архіви відсутні")
                })
              )
            );
            return;
          }
          items.reverse().forEach((a) => {
            archiveTbody.appendChild(
              global.VVComponents.createArchiveRow(a, {
                canDelete: isOwnProfile,
                onDelete: (id) =>
                  global.db.ref(`users/${uid}/archive/${id}`).remove().catch(() => {})
              })
            );
          });
        },
        () => {}
      );

      const repostsRef = global.db.ref(`reposts/${uid}`);
      activeProfileRefs.push(repostsRef);
      repostsRef.on(
        "value",
        (snap) => {
          clear(repostsGrid);
          const items = [];
          snap.forEach((c) => items.push({ id: c.key, ...c.val() }));
          if (!items.length) {
            repostsGrid.appendChild(
              global.VVComponents.createEmptyNotice(
                tr("profile-no-reposts", "Репостів ще немає."),
                "profile-no-reposts"
              )
            );
            return;
          }
          items.reverse().forEach((r) => {
            repostsGrid.appendChild(
              global.VVComponents.createVideoCard(
                r.videoKey,
                {
                  title: r.title || "Відео",
                  thumbnail: r.thumbnail,
                  author: displayName,
                  views: 0
                },
                {
                  onOpen: (targetKey) => global.VVViews.openVideo(targetKey)
                }
              )
            );
          });
        },
        () => {}
      );
    }

    const sidebarCard = el(
      "div",
      { className: "profile-nt-card" },
      bannerEl,
      el(
        "div",
        { className: "profile-nt-body" },
        profAvatarEl,
        el(
          "div",
          { className: "profile-nt-identity" },
          el(
            "h1",
            { className: "profile-name-row", style: { margin: "0" } },
            el("span", { text: displayName }),
            profile.verifiedBadge ? global.VVComponents.createVerifiedBadge(profile.verifiedBadge) : null
          ),
          supername ? el("div", { className: "profile-username", text: supername }) : null,
          profile.privateProfile === true
            ? el(
                "span",
                { className: "profile-private-badge" },
                icon("lock"),
                el("span", {
                  dataset: { i18n: "profile-private-badge" },
                  text: tr("profile-private-badge", "Приватний профіль")
                })
              )
            : null
        ),
        el(
          "div",
          { className: "profile-nt-stats" },
          statVideos.blockEl,
          statPosts.blockEl,
          statSubs.blockEl
        ),
        el(
          "div",
          { className: "profile-nt-actions" },
          editProfileBtn,
          subscribeBtn,
          blockBtn,
          shareProfileBtn
        ),
        bioText ? el("div", { className: "profile-nt-bio", text: bioText }) : null
      )
    );

    const asideColumn = el("aside", { className: "profile-nt-aside" }, sidebarCard);

    const mainColumn = el(
      "div",
      { className: "profile-nt-main" },
      isPrivate
        ? el(
            "div",
            { className: "private-notice-card" },
            icon("lock", 36),
            el("h3", {
              style: { margin: "8px 0 6px" },
              dataset: { i18n: "profile-private-title" },
              text: tr("profile-private-title", "Цей профіль приватний")
            }),
            el("p", {
              style: { margin: "0" },
              dataset: { i18n: "profile-private-desc" },
              text: tr("profile-private-desc", "Автор обмежив перегляд свого контенту.")
            })
          )
        : el(
            "div",
            { style: { display: "flex", flexDirection: "column", gap: "16px" } },
            el(
              "div",
              { className: "profile-nt-main-head" },
              mainTitleEl,
              el(
                "div",
                { className: "profile-tabs" },
                tabButtons.videos,
                tabButtons.posts,
                tabButtons.archive,
                tabButtons.reposts
              )
            ),
            tabSecVideos,
            tabSecPosts,
            tabSecArchive,
            tabSecReposts
          )
    );

    clear(container);
    container.appendChild(
      el(
        "div",
        null,
        el(
          "div",
          { className: "profile-top-bar" },
          el(
            "button",
            { type: "button", className: "btn", onClick: () => global.VVRouter.navigate("home") },
            icon("arrow_back"),
            el("span", { dataset: { i18n: "back-to-feed" }, text: tr("back-to-feed", "Назад до стрічки") })
          )
        ),
        el("div", { className: "profile-nt-layout" }, asideColumn, mainColumn)
      )
    );
  }

  global.VVBus?.on("router:change", ({ view }) => {
    if (view !== "profile") {
      detachProfileRefs();
    }
  });

  global.VVViews = global.VVViews || {};
  global.VVViews.openProfile = openProfile;
  global.openPublicProfile = openProfile;
})(window);
