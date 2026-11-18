(function (global) {
  'use strict';

  const { el, icon } = global.VV;
  global.VVElements = global.VVElements || {};

  global.VVElements.createHomeScreen = function () {
    return el(
      "section",
      { id: "home-view" },
      el(
        "div",
        { id: "home-stories-section", className: "stories-section hidden" },
        el("div", { id: "stories-container", className: "stories-container" })
      ),
      el(
        "div",
        { className: "section-header" },
        el(
          "h2",
          { className: "section-title" },
          icon("smart_display"),
          el("span", { "data-i18n": "video", text: "Відео" })
        )
      ),
      el("div", { id: "video-container", className: "video-container" })
    );
  };

  global.VVElements.createPopularScreen = function () {
    return el(
      "section",
      { id: "popular-view", className: "hidden" },
      el(
        "div",
        { className: "section-header" },
        el(
          "h2",
          { className: "section-title" },
          icon("local_fire_department"),
          el("span", { "data-i18n": "popular", text: "Популярне" })
        )
      ),
      el("div", { id: "popular-videos", className: "video-container" })
    );
  };

  global.VVElements.createPhotosScreen = function () {
    return el(
      "section",
      { id: "photos-view", className: "hidden" },
      el(
        "div",
        { className: "section-header" },
        el(
          "h2",
          { className: "section-title" },
          icon("photo_library"),
          el("span", { "data-i18n": "post", text: "Дописи" })
        ),
        el(
          "button",
          {
            type: "button",
            id: "photos-new-post-btn",
            className: "btn btn-primary hidden",
            "data-nav": "upload"
          },
          icon("add_photo_alternate"),
          el("span", { "data-i18n": "new-post", text: "Новий допис" })
        )
      ),
      el("div", { id: "photos-container", className: "photos-grid" })
    );
  };
})(window);
