(function (global) {
  'use strict';

  const { clear } = global.VV;

  function renderPhotosFeed() {
    const container = document.getElementById("photos-container");
    if (!container) return;
    clear(container);

    const allPhotosMap = global.VVState?.allPhotosMap || {};
    const currentUser = global.VVState?.currentUser;
    const entries = Object.entries(allPhotosMap).reverse();

    if (!entries.length) {
      container.appendChild(global.VVComponents.createEmptyNotice("Дописів поки немає."));
      return;
    }

    entries.forEach(([key, post]) => {
      const isOwner =
        currentUser && (currentUser.uid === post.authorUid || currentUser.email === post.email);

      container.appendChild(
        global.VVComponents.createPhotoCard(key, post, {
          isOwner,
          onAuthorClick: (uid) => global.VVViews.openProfile(uid),
          onDelete: async (photoKey) => {
            const ok = await global.VV.showConfirmModal({
              title: "Видалення допису",
              message: "Видалити цей фото-допис?",
              confirmText: "Видалити",
              danger: true
            });
            if (ok) {
              try {
                await global.db.ref(`photos/${photoKey}`).remove();
                global.VV.showToast("Допис видалено", "success");
              } catch (err) {
                global.VV.showToast("Не вдалося видалити допис", "error");
              }
            }
          }
        })
      );
    });
  }

  function initPhotosView() {
    if (!global.db) return;
    global.db.ref("photos").on(
      "value",
      (snap) => {
        global.VVState.allPhotosMap = snap.val() || {};
        renderPhotosFeed();
      },
      () => {}
    );
  }

  global.VVViews = global.VVViews || {};
  global.VVViews.initPhotosView = initPhotosView;
  global.VVViews.renderPhotosFeed = renderPhotosFeed;
})(window);
