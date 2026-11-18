(function (global) {
  'use strict';

  const { el, icon } = global.VV;
  global.VVElements = global.VVElements || {};

  global.VVElements.createLibraryScreen = function () {
    return el(
      "section",
      { id: "library-view", className: "hidden" },
      el(
        "div",
        { id: "guest-auth-box", className: "panel-card" },
        el(
          "h3",
          { className: "section-title" },
          icon("account_circle"),
          " ",
          el("span", { "data-i18n": "account-signin", text: "Вхід в акаунт" })
        ),
        el("p", {
          style: { color: "var(--text-secondary)", margin: "8px 0 16px" },
          "data-i18n": "guest-library-desc",
          text: "Увійдіть або створіть обліковий запис, щоб публікувати відео, зберігати історію та керувати двома каналами."
        }),
        el(
          "button",
          { type: "button", className: "btn btn-primary", "data-nav": "auth" },
          icon("login"),
          el("span", { "data-i18n": "login-signup", text: "Увійти / Реєстрація" })
        )
      ),
      el(
        "div",
        { id: "user-profile-box", className: "hidden" },
        el(
          "div",
          { className: "profile-summary-bar" },
          el(
            "div",
            { className: "profile-summary-left" },
            el("div", { id: "user-display-avatar", className: "profile-avatar-lg" }),
            el(
              "div",
              null,
              el("div", {
                id: "user-display-name",
                style: { fontSize: "18px", fontWeight: "700" },
                text: "Користувач"
              }),
              el("div", {
                id: "user-display-email",
                style: { fontSize: "13px", color: "var(--text-secondary)" }
              })
            )
          ),
          el(
            "div",
            { style: { display: "flex", flexWrap: "wrap", gap: "8px" } },
            el(
              "button",
              { type: "button", className: "btn", id: "open-my-public-profile-btn" },
              icon("person"),
              el("span", { "data-i18n": "my-profile", text: "Мій профіль" })
            ),
            el(
              "button",
              { type: "button", className: "btn", "data-nav": "archive" },
              icon("folder_zip"),
              el("span", { "data-i18n": "archive", text: "Архів" })
            ),
            el(
              "button",
              { type: "button", className: "btn", "data-nav": "settings" },
              icon("settings"),
              el("span", { "data-i18n": "settings", text: "Налаштування" })
            ),
            el(
              "button",
              { type: "button", className: "btn btn-danger", id: "logout-btn" },
              icon("logout"),
              el("span", { "data-i18n": "log-out-of-account", text: "Вийти з акаунта" })
            )
          )
        ),
        el(
          "div",
          { className: "panel-card" },
          el(
            "div",
            { className: "section-header" },
            el(
              "h3",
              { className: "section-title" },
              icon("history"),
              " ",
              el("span", { "data-i18n": "history", text: "Історія переглядів:" })
            ),
            el(
              "button",
              { type: "button", className: "btn btn-danger", id: "clear-history-btn" },
              icon("delete_sweep"),
              el("span", { "data-i18n": "clear", text: "Очистити" })
            )
          ),
          el("div", { id: "history-list", className: "horizontal-scroll-row" })
        ),
        el(
          "div",
          { className: "panel-card" },
          el(
            "div",
            { className: "section-header" },
            el(
              "h3",
              { className: "section-title" },
              icon("bookmark"),
              " ",
              el("span", { "data-i18n": "saved-videos", text: "Збережені відео" })
            )
          ),
          el("div", { id: "saved-videos-list", className: "horizontal-scroll-row" })
        ),
        el(
          "div",
          { className: "panel-card" },
          el(
            "div",
            { className: "section-header" },
            el(
              "h3",
              { className: "section-title" },
              icon("repeat"),
              " ",
              el("span", { "data-i18n": "reposts", text: "Репости" })
            )
          ),
          el("div", { id: "my-reposts-list", className: "horizontal-scroll-row" })
        )
      )
    );
  };

  global.VVElements.createArchiveScreen = function () {
    return el(
      "section",
      { id: "archive-view", className: "hidden" },
      el(
        "div",
        { className: "panel-card" },
        el(
          "div",
          { className: "section-header" },
          el(
            "h2",
            { className: "section-title" },
            icon("folder_zip"),
            " ",
            el("span", { "data-i18n": "zip-archive", text: "Файловий ZIP-архів" })
          )
        ),
        el("div", {
          className: "vv-inline-feedback hidden",
          "data-feedback-scope": "archive"
        }),
        el(
          "form",
          {
            id: "archive-upload-form",
            style: {
              display: "flex",
              flexWrap: "wrap",
              gap: "10px",
              alignItems: "center",
              marginBottom: "20px"
            }
          },
          el("input", {
            type: "file",
            id: "archive-file-input",
            accept: ".zip",
            required: true
          }),
          el(
            "button",
            { type: "submit", className: "btn btn-primary" },
            icon("upload_file"),
            el("span", { "data-i18n": "upload-zip", text: "Завантажити ZIP" })
          )
        ),
        el(
          "div",
          { style: { overflowX: "auto" } },
          el(
            "table",
            { className: "archive-table" },
            el(
              "thead",
              null,
              el(
                "tr",
                null,
                el("th", { "data-i18n": "col-file", text: "Файл" }),
                el("th", { "data-i18n": "col-date", text: "Дата" }),
                el("th", { "data-i18n": "col-actions", text: "Дії" })
              )
            ),
            el("tbody", { id: "archive-table-body" })
          )
        )
      )
    );
  };
})(window);
