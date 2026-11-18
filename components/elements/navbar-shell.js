(function (global) {
  'use strict';

  const { el, icon } = global.VV;
  global.VVElements = global.VVElements || {};

  global.VVElements.createTopNavbar = function () {
    return el(
      "nav",
      { className: "top-navbar" },
      el(
        "div",
        { className: "nav-brand", "data-nav": "home" },
        el("img", {
          src: "assets/images/logos/VideoVortex_logo_192x192.png",
          alt: "VideoVortex"
        }),
        el("span", { text: "VideoVortex" })
      ),
      el(
        "div",
        { className: "desktop-nav" },
        el(
          "button",
          { type: "button", className: "desktop-nav-btn active", "data-nav": "home" },
          icon("home"),
          el("span", { "data-i18n": "video", text: "Відео" })
        ),
        el(
          "button",
          { type: "button", className: "desktop-nav-btn", "data-nav": "popular" },
          icon("local_fire_department"),
          el("span", { "data-i18n": "popular", text: "Популярне" })
        ),
        el(
          "button",
          { type: "button", className: "desktop-nav-btn", "data-nav": "photos" },
          icon("photo_library"),
          el("span", { "data-i18n": "post", text: "Дописи" })
        ),
        el(
          "button",
          { type: "button", className: "desktop-nav-btn", "data-nav": "library" },
          icon("video_library"),
          el("span", { "data-i18n": "you", text: "Ви" })
        )
      ),
      el(
        "div",
        { className: "search-container", id: "search-container" },
        el(
          "button",
          { type: "button", className: "search-toggle", "aria-label": "Пошук" },
          icon("search")
        ),
        el("input", {
          type: "search",
          id: "search-input",
          className: "search-input",
          "data-i18n-placeholder": "search-placeholder",
          placeholder: "Пошук відео або автора..."
        }),
        el(
          "button",
          {
            type: "button",
            id: "search-close-btn",
            className: "search-close-btn",
            "aria-label": "Закрити пошук"
          },
          icon("close")
        )
      ),
      el(
        "div",
        { className: "nav-actions" },
        el(
          "button",
          {
            type: "button",
            id: "mobile-search-trigger",
            className: "btn mobile-search-trigger",
            "aria-label": "Пошук"
          },
          icon("search")
        ),
        el(
          "button",
          {
            type: "button",
            id: "desktop-plus-btn",
            className: "btn btn-icon desktop-only-action hidden",
            "aria-label": "Завантажити"
          },
          icon("add_circle")
        ),
        el(
          "button",
          { type: "button", id: "installBtn", className: "btn hidden" },
          icon("install_desktop"),
          el("span", {
            className: "nav-pill-label",
            "data-i18n": "installBtn",
            text: "Встановити додаток"
          })
        ),
        el(
          "button",
          {
            type: "button",
            id: "update-app-btn",
            className: "btn btn-primary",
            style: { display: "none" }
          },
          icon("system_update_alt"),
          el("span", {
            className: "nav-pill-label",
            "data-i18n": "update-app",
            text: "Оновити VideoVortex"
          })
        ),
        el(
          "button",
          {
            type: "button",
            id: "notification-bell",
            className: "notification-bell hidden",
            "aria-label": "Сповіщення"
          },
          icon("notifications"),
          el("span", {
            id: "notif-count",
            className: "notif-count hidden",
            text: "0"
          })
        ),
        el(
          "button",
          {
            type: "button",
            id: "nav-login-btn",
            className: "btn btn-primary nav-auth-pill",
            "data-nav": "auth"
          },
          icon("login"),
          el("span", {
            className: "nav-pill-label",
            "data-i18n": "login",
            text: "Увійти"
          })
        ),
        el(
          "button",
          {
            type: "button",
            id: "nav-profile-btn",
            className: "btn btn-icon hidden",
            "aria-label": "Профіль",
            "aria-haspopup": "menu",
            "aria-expanded": "false",
            "aria-controls": "profile-popover",
            style: { padding: "0" }
          },
          el("div", {
            id: "nav-user-avatar",
            className: "avatar-circle",
            style: { border: "none" }
          })
        )
      )
    );
  };

  global.VVElements.createNotificationsDropdown = function () {
    return el(
      "div",
      { id: "notifications-dropdown", className: "notifications-dropdown hidden" },
      el(
        "div",
        { className: "section-header", style: { marginBottom: "10px" } },
        el(
          "h4",
          { className: "section-title", style: { fontSize: "15px" } },
          icon("notifications"),
          " ",
          el("span", { "data-i18n": "notifications", text: "Сповіщення" })
        )
      ),
      el("div", { id: "notifications-list" })
    );
  };

  global.VVElements.createProfilePopover = function () {
    return el(
      "div",
      {
        id: "profile-popover",
        className: "profile-popover hidden",
        role: "menu",
        "aria-labelledby": "nav-profile-btn"
      },
      el(
        "div",
        { className: "profile-popover-header" },
        el("div", {
          id: "popover-user-avatar",
          className: "avatar-circle profile-popover-avatar"
        }),
        el(
          "div",
          { className: "profile-popover-identity" },
          el("div", {
            id: "popover-user-name",
            className: "profile-popover-name",
            text: "Користувач"
          }),
          el("div", {
            id: "popover-user-handle",
            className: "profile-popover-handle"
          }),
          el("button", {
            type: "button",
            id: "popover-open-channel-btn",
            className: "profile-popover-channel-link",
            "data-i18n": "view-channel",
            text: "Переглянути канал"
          })
        )
      ),
      el("div", { className: "profile-popover-divider" }),
      el(
        "div",
        { className: "profile-popover-group" },
        el(
          "button",
          {
            type: "button",
            id: "popover-library-btn",
            className: "profile-popover-item",
            role: "menuitem"
          },
          icon("video_library"),
          el("span", {
            "data-i18n": "library-and-history",
            text: "Бібліотека та історія"
          })
        ),
        el(
          "button",
          {
            type: "button",
            id: "popover-archive-btn",
            className: "profile-popover-item",
            role: "menuitem"
          },
          icon("folder_zip"),
          el("span", { "data-i18n": "zip-archive", text: "Файловий ZIP-архів" })
        ),
        el(
          "button",
          {
            type: "button",
            id: "popover-settings-btn",
            className: "profile-popover-item",
            role: "menuitem"
          },
          icon("settings"),
          el("span", { "data-i18n": "settings", text: "Налаштування" })
        )
      ),
      el("div", { className: "profile-popover-divider" }),
      el(
        "div",
        { className: "profile-popover-group" },
        el(
          "button",
          {
            type: "button",
            id: "popover-logout-btn",
            className: "profile-popover-item is-danger",
            role: "menuitem"
          },
          icon("logout"),
          el("span", {
            "data-i18n": "log-out-of-account",
            text: "Вийти з акаунта"
          })
        )
      )
    );
  };

  global.VVElements.createGoTopButton = function () {
    return el(
      "button",
      {
        type: "button",
        id: "go-top-btn",
        className: "go-top-btn",
        "aria-label": "Вгору"
      },
      icon("arrow_upward")
    );
  };

  global.VVElements.createBottomDock = function () {
    return el(
      "div",
      { className: "bottom-dock-wrap" },
      el(
        "nav",
        { id: "smart-menu", className: "smart-menu" },
        el(
          "button",
          { type: "button", className: "menu-btn active", "data-nav": "home" },
          icon("home"),
          el("span", { className: "menu-label", "data-i18n": "video", text: "Відео" })
        ),
        el(
          "button",
          { type: "button", className: "menu-btn", "data-nav": "popular" },
          icon("local_fire_department"),
          el("span", { className: "menu-label", "data-i18n": "popular", text: "Популярне" })
        ),
        el(
          "button",
          { type: "button", className: "menu-btn", "data-nav": "photos" },
          icon("photo_library"),
          el("span", { className: "menu-label", "data-i18n": "post", text: "Дописи" })
        ),
        el(
          "button",
          { type: "button", className: "menu-btn", "data-nav": "library" },
          icon("video_library"),
          el("span", { className: "menu-label", "data-i18n": "you", text: "Ви" })
        ),
        el(
          "button",
          { type: "button", className: "menu-btn", "data-nav": "settings" },
          icon("settings"),
          el("span", { className: "menu-label", "data-i18n": "settings", text: "Налаштування" })
        )
      ),
      el(
        "button",
        {
          type: "button",
          id: "plus-button",
          className: "hidden",
          "aria-label": "Завантажити"
        },
        icon("add")
      )
    );
  };
})(window);
