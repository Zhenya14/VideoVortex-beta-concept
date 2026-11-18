(function (global) {
  'use strict';

  const { el } = global.VV;
  global.VVElements = global.VVElements || {};

  global.VVElements.createVideoScreen = function () {
    return el(
      "section",
      { id: "spa-video-view", className: "hidden" },
      el("div", { id: "spa-video-content" })
    );
  };

  global.VVElements.createProfileScreen = function () {
    return el(
      "section",
      { id: "spa-profile-view", className: "hidden" },
      el("div", { id: "spa-profile-content" })
    );
  };
})(window);
