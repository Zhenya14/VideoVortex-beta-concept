(function (global) {
  'use strict';

  const E = global.VVElements || {};
  const appShell = document.getElementById("app-shell");
  if (!appShell) return;

  const body = document.body;

  if (typeof E.createTopNavbar === "function") {
    body.insertBefore(E.createTopNavbar(), appShell);
  }
  if (typeof E.createNotificationsDropdown === "function") {
    body.insertBefore(E.createNotificationsDropdown(), appShell);
  }
  if (typeof E.createProfilePopover === "function") {
    body.insertBefore(E.createProfilePopover(), appShell);
  }

  [
    E.createHomeScreen,
    E.createPopularScreen,
    E.createPhotosScreen,
    E.createLibraryScreen,
    E.createArchiveScreen,
    E.createUploadScreen,
    E.createSettingsScreen,
    E.createAuthScreen,
    E.createVideoScreen,
    E.createProfileScreen
  ].forEach((factory) => {
    if (typeof factory === "function") {
      appShell.appendChild(factory());
    }
  });

  const footerFragment = document.createDocumentFragment();
  [
    E.createRulesModal,
    E.createStoryViewerModal,
    E.createStoryUploadModal,
    E.createGoTopButton,
    E.createBottomDock
  ].forEach((factory) => {
    if (typeof factory === "function") {
      footerFragment.appendChild(factory());
    }
  });
  body.insertBefore(footerFragment, appShell.nextSibling);
})(window);
