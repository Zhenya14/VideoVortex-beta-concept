(function (global) {
  'use strict';

  const { el, clear } = global.VV;

  let activeLibraryRefs = [];

  function detachLibraryRefs() {
    activeLibraryRefs.forEach((ref) => {
      try {
        ref.off();
      } catch (e) {}
    });
    activeLibraryRefs = [];
  }

  function loadUserLibrary(uid) {
    detachLibraryRefs();
    if (!uid || !global.db) return;

    const historyRow = document.getElementById("history-list");
    if (historyRow) {
      const historyRef = global.db.ref(`users/${uid}/history`).limitToLast(20);
      activeLibraryRefs.push(historyRef);
      historyRef.on(
        "value",
        (snap) => {
          clear(historyRow);
          const items = [];
          snap.forEach((c) => items.push({ key: c.key, ...c.val() }));
          if (!items.length) {
            historyRow.appendChild(
              global.VVComponents.createEmptyNotice("Історія переглядів порожня")
            );
            return;
          }
          items.reverse().forEach((item) => {
            historyRow.appendChild(
              global.VVComponents.createMiniVideoCard(item, () =>
                global.VVViews.openVideo(item.key)
              )
            );
          });
        },
        () => {}
      );
    }

    const savedRow = document.getElementById("saved-videos-list");
    if (savedRow) {
      const savedRef = global.db.ref(`saveVideos/${uid}`);
      activeLibraryRefs.push(savedRef);
      savedRef.on(
        "value",
        (snap) => {
          clear(savedRow);
          const items = [];
          snap.forEach((c) => items.push({ pushKey: c.key, ...c.val() }));
          if (!items.length) {
            savedRow.appendChild(
              global.VVComponents.createEmptyNotice("Немає збережених відео")
            );
            return;
          }
          items.reverse().forEach((item) => {
            savedRow.appendChild(
              global.VVComponents.createMiniVideoCard(item, () =>
                global.VVViews.openVideo(item.videoKey)
              )
            );
          });
        },
        () => {}
      );
    }

    const repostsRow = document.getElementById("my-reposts-list");
    if (repostsRow) {
      const repostsRef = global.db.ref(`reposts/${uid}`);
      activeLibraryRefs.push(repostsRef);
      repostsRef.on(
        "value",
        (snap) => {
          clear(repostsRow);
          const items = [];
          snap.forEach((c) => items.push({ pushKey: c.key, ...c.val() }));
          if (!items.length) {
            repostsRow.appendChild(
              global.VVComponents.createEmptyNotice("Репостів поки немає")
            );
            return;
          }
          items.reverse().forEach((item) => {
            repostsRow.appendChild(
              global.VVComponents.createMiniVideoCard(item, () =>
                global.VVViews.openVideo(item.videoKey)
              )
            );
          });
        },
        () => {}
      );
    }

    const archiveBody = document.getElementById("archive-table-body");
    if (archiveBody) {
      const archiveRef = global.db.ref(`users/${uid}/archive`);
      activeLibraryRefs.push(archiveRef);
      archiveRef.on(
        "value",
        (snap) => {
          clear(archiveBody);
          const items = [];
          snap.forEach((c) => items.push({ id: c.key, ...c.val() }));
          if (!items.length) {
            archiveBody.appendChild(
              el(
                "tr",
                null,
                el("td", {
                  colspan: "3",
                  style: { color: "var(--text-muted)" },
                  text: "Немає завантажених ZIP-архівів"
                })
              )
            );
            return;
          }
          items.reverse().forEach((arch) => {
            archiveBody.appendChild(
              global.VVComponents.createArchiveRow(arch, {
                canDelete: true,
                onDelete: (id) => {
                  global.db
                    .ref(`users/${uid}/archive/${id}`)
                    .remove()
                    .then(() => global.VV.showToast("Архів видалено", "info"))
                    .catch(() => global.VV.showToast("Не вдалося видалити архів", "error"));
                }
              })
            );
          });
        },
        () => {}
      );
    }

    const notifList = document.getElementById("notifications-list");
    const notifCount = document.getElementById("notif-count");
    if (notifList) {
      const notifRef = global.db.ref(`notifications/${uid}`).limitToLast(30);
      activeLibraryRefs.push(notifRef);
      notifRef.on(
        "value",
        (snap) => {
          clear(notifList);
          let unread = 0;
          const items = [];
          snap.forEach((c) => {
            const val = c.val();
            if (!val.read) unread++;
            items.push({ id: c.key, ...val });
          });
          if (notifCount) {
            notifCount.textContent = String(unread);
            notifCount.classList.toggle("hidden", unread === 0);
          }
          if (!items.length) {
            notifList.appendChild(global.VVComponents.createEmptyNotice("Сповіщень немає"));
            return;
          }
          items.reverse().forEach((n) => {
            notifList.appendChild(
              global.VVComponents.createNotificationItem(n, {
                onOpen: (notif) => {
                  global.db
                    .ref(`notifications/${uid}/${notif.id}/read`)
                    .set(true)
                    .catch(() => {});
                  if (notif.videoKey) global.VVViews.openVideo(notif.videoKey);
                },
                onDelete: (id) =>
                  global.db.ref(`notifications/${uid}/${id}`).remove().catch(() => {})
              })
            );
          });
        },
        () => {}
      );
    }
  }

  function initLibraryView() {
    document.getElementById("clear-history-btn")?.addEventListener("click", async () => {
      const currentUser = global.VVState?.currentUser;
      if (!currentUser) return;
      try {
        await global.db.ref(`users/${currentUser.uid}/history`).remove();
        global.VV.showToast("Історію переглядів очищено", "info");
      } catch (err) {
        global.VV.showToast("Не вдалося очистити історію", "error");
      }
    });

    document.getElementById("open-my-public-profile-btn")?.addEventListener("click", () => {
      const currentUser = global.VVState?.currentUser;
      if (currentUser) global.VVViews.openProfile(currentUser.uid);
    });

    document.getElementById("logout-btn")?.addEventListener("click", async () => {
      if (!global.auth) return;
      await global.auth.signOut();
      global.VV.showToast("Ви вийшли з акаунту", "info");
      global.VVRouter.navigate("auth");
    });
  }

  global.VVViews = global.VVViews || {};
  global.VVViews.loadUserLibrary = loadUserLibrary;
  global.VVViews.initLibraryView = initLibraryView;
})(window);
