(function (global) {
  'use strict';

  const { el, icon } = global.VV;
  global.VVElements = global.VVElements || {};

  function buildSwitchRow(i18nKey, labelText, inputId) {
    return el(
      "div",
      { className: "switch-row" },
      el("span", { "data-i18n": i18nKey, text: labelText }),
      el(
        "label",
        { className: "vv-switch" },
        el("input", { type: "checkbox", id: inputId }),
        el("span", { className: "vv-switch-slider" })
      )
    );
  }

  function buildSidebarButton(tabId, iconName, i18nKey, labelText, isActive) {
    return el(
      "button",
      {
        type: "button",
        className: `settings-nav-item${isActive ? " active" : ""}`,
        dataset: { settingsTab: tabId }
      },
      icon(iconName),
      el("span", { "data-i18n": i18nKey, text: labelText })
    );
  }

  global.VVElements.createSettingsScreen = function () {
    return el(
      "section",
      { id: "settings-view", className: "hidden" },
      el(
        "div",
        { className: "settings-shell" },
        el(
          "div",
          { className: "settings-page-header" },
          el(
            "div",
            { className: "settings-identity" },
            el("div", {
              id: "settings-header-avatar",
              className: "avatar-circle settings-header-avatar hidden"
            }),
            el(
              "div",
              { style: { minWidth: "0" } },
              el("h2", {
                id: "settings-header-name",
                className: "settings-header-title",
                text: "Налаштування"
              }),
              el("p", {
                id: "settings-header-handle",
                className: "settings-header-sub",
                text: "Керуйте інтерфейсом, плеєром та параметрами каналу"
              })
            )
          ),
          el(
            "button",
            {
              type: "button",
              id: "settings-header-profile-btn",
              className: "btn hidden"
            },
            icon("account_circle"),
            el("span", { "data-i18n": "view-channel", text: "Переглянути канал" })
          )
        ),
        el(
          "div",
          { className: "settings-layout" },
          el(
            "aside",
            { className: "settings-sidebar", "aria-label": "Налаштування" },
            el(
              "div",
              { className: "settings-sidebar-group" },
              el("div", {
                className: "settings-nav-group-label",
                "data-i18n": "settings-nav-group-app",
                text: "Застосунок"
              }),
              buildSidebarButton("general", "tune", "settings-nav-general", "Інтерфейс і плеєр", true)
            ),
            el(
              "div",
              { id: "settings-account-nav", className: "settings-sidebar-group hidden" },
              el("div", { className: "settings-nav-divider" }),
              el("div", {
                className: "settings-nav-group-label",
                "data-i18n": "settings-nav-group-account",
                text: "Обліковий запис"
              }),
              buildSidebarButton("profile", "person", "settings-nav-profile", "Профіль і канали", false),
              buildSidebarButton("blocking", "block", "settings-nav-blocking", "Блокування", false),
              buildSidebarButton("account", "shield_person", "settings-nav-account", "Підтримка й безпека", false)
            )
          ),
          el(
            "div",
            { className: "settings-main" },
            el(
              "div",
              { className: "settings-panel settings-panel-stack", dataset: { settingsPanel: "general" } },
              el(
                "div",
                { className: "panel-card", id: "settings-general-card" },
                el(
                  "h2",
                  { className: "section-title", style: { marginBottom: "18px" } },
                  icon("tune"),
                  el("span", {
                    "data-i18n": "settings-interface-player",
                    text: "Налаштування інтерфейсу та плеєра"
                  })
                ),
                el(
                  "div",
                  { className: "form-grid" },
                  el(
                    "div",
                    { className: "form-row" },
                    el("label", {
                      for: "settings-lang-select",
                      "data-i18n": "interface-language",
                      text: "Мова інтерфейсу"
                    }),
                    el(
                      "select",
                      { id: "settings-lang-select" },
                      el("option", { value: "ua", text: "Українська (UA)" }),
                      el("option", { value: "en", text: "English (EN)" }),
                      el("option", { value: "de", text: "Deutsch (DE)" })
                    )
                  ),
                  el(
                    "div",
                    { className: "settings-range-card" },
                    el(
                      "div",
                      { className: "settings-range-head" },
                      el(
                        "div",
                        {},
                        el("div", {
                          className: "settings-range-title",
                          "data-i18n": "pref-nav-height",
                          text: "Розмір верхньої панелі"
                        }),
                        el("div", {
                          className: "settings-range-hint",
                          "data-i18n": "pref-nav-height-hint",
                          text: "Точне налаштування висоти та масштабу верхньої панелі"
                        })
                      ),
                      el(
                        "div",
                        { className: "settings-range-actions" },
                        el("span", {
                          id: "pref-nav-height-value",
                          className: "settings-range-badge",
                          text: "52 px"
                        }),
                        el(
                          "button",
                          {
                            type: "button",
                            id: "pref-nav-height-reset",
                            className: "btn settings-reset-btn"
                          },
                          icon("restart_alt"),
                          el("span", { "data-i18n": "reset-default", text: "Скинути" })
                        )
                      )
                    ),
                    el(
                      "div",
                      { className: "settings-range-controls" },
                      el("span", { className: "settings-range-bound", text: "42" }),
                      el("input", {
                        type: "range",
                        id: "pref-nav-height-range",
                        className: "vv-range-slider",
                        min: "42",
                        max: "68",
                        step: "2",
                        value: "52"
                      }),
                      el("span", { className: "settings-range-bound", text: "68" })
                    )
                  ),
                  buildSwitchRow("pref-autoplay", "Автовідтворення відео при відкритті", "pref-autoplay-check"),
                  buildSwitchRow("pref-reduced-motion", "Зменшений рух і спрощена анімація", "pref-reduced-motion"),
                  el(
                    "div",
                    {
                      style: {
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: "10px",
                        paddingTop: "6px"
                      }
                    },
                    el(
                      "button",
                      { type: "button", id: "open-rules-again-btn", className: "btn" },
                      icon("gavel"),
                      el("span", { "data-i18n": "community-rules", text: "Правила спільноти" })
                    ),
                    el(
                      "div",
                      { style: { fontSize: "12.5px", color: "var(--text-muted)" } },
                      el("span", {
                        "data-i18n": "application-version",
                        text: "Версія додатка:"
                      }),
                      " ",
                      el("strong", {
                        id: "settings-app-version",
                        dataset: { appVersion: "true" },
                        text: global.VVUpdate?.APP_VERSION || ""
                      })
                    )
                  )
                )
              ),
              el(
                "div",
                { className: "panel-card", id: "settings-guest-box" },
                el(
                  "h3",
                  { className: "section-title", style: { marginBottom: "8px" } },
                  icon("manage_accounts"),
                  el("span", { "data-i18n": "account-management", text: "Керування акаунтом" })
                ),
                el("p", {
                  style: { fontSize: "13.5px", color: "var(--text-secondary)", margin: "0 0 14px" },
                  "data-i18n": "settings-guest-desc",
                  text: "Увійдіть або створіть обліковий запис, щоб налаштовувати два канали, аватар, шпалери профілю, приватність і список блокувань."
                }),
                el(
                  "button",
                  { type: "button", className: "btn btn-primary", "data-nav": "auth" },
                  icon("login"),
                  el("span", { "data-i18n": "login-signup", text: "Увійти / Реєстрація" })
                )
              )
            ),
            el(
              "div",
              { id: "settings-account-sections", className: "settings-account-sections-wrap hidden" },
              el(
                "div",
                { className: "settings-panel is-inactive", dataset: { settingsPanel: "profile" } },
                el(
                  "div",
                  { className: "panel-card" },
                  el(
                    "h2",
                    { className: "section-title", style: { marginBottom: "18px" } },
                    icon("manage_accounts"),
                    el("span", { "data-i18n": "edit-settings-profile", text: "Редагувати профіль" })
                  ),
                  el("div", {
                    className: "vv-inline-feedback hidden",
                    "data-feedback-scope": "settings"
                  }),
                  el(
                    "form",
                    { id: "settings-form", className: "form-grid" },
                    el(
                      "div",
                      { className: "settings-form-two-col" },
                      el(
                        "div",
                        { className: "form-row" },
                        el("label", {
                          for: "settings-name",
                          "data-i18n": "main-channel",
                          text: "Основний канал"
                        }),
                        el("input", {
                          type: "text",
                          id: "settings-name",
                          "data-i18n-placeholder": "name-placeholder",
                          placeholder: "Ваше ім'я",
                          required: true
                        })
                      ),
                      el(
                        "div",
                        { className: "form-row" },
                        el("label", {
                          for: "settings-supername",
                          "data-i18n": "supername-label",
                          text: "Унікальний нікнейм (@supername)"
                        }),
                        el("input", {
                          type: "text",
                          id: "settings-supername",
                          placeholder: "username"
                        })
                      )
                    ),
                    el(
                      "div",
                      { className: "settings-form-two-col" },
                      el(
                        "div",
                        { className: "form-row" },
                        el("label", {
                          for: "settings-second-channel",
                          "data-i18n": "second-channel",
                          text: "Другий канал"
                        }),
                        el("input", {
                          type: "text",
                          id: "settings-second-channel",
                          "data-i18n-placeholder": "second-channel-ph",
                          placeholder: "Назва додаткового каналу"
                        })
                      ),
                      el(
                        "div",
                        { className: "form-row" },
                        el("label", {
                          for: "settings-birthdate",
                          "data-i18n": "birthdate",
                          text: "Введіть дату народження"
                        }),
                        el("input", { type: "date", id: "settings-birthdate" })
                      )
                    ),
                    buildSwitchRow("privacy", "Приватність профілю", "settings-private-profile"),
                    el(
                      "div",
                      { className: "settings-form-two-col" },
                      el(
                        "div",
                        { className: "form-row" },
                        el("label", {
                          for: "settings-avatar-file",
                          "data-i18n": "avatar-file-label",
                          text: "Аватар профілю (файл зображення)"
                        }),
                        el("input", {
                          type: "file",
                          id: "settings-avatar-file",
                          accept: "image/*"
                        })
                      ),
                      el(
                        "div",
                        { className: "form-row" },
                        el("label", {
                          for: "settings-wallpaper-file",
                          "data-i18n": "edit-wallpaper-profile",
                          text: "Редагувати шпалери профілю"
                        }),
                        el("input", {
                          type: "file",
                          id: "settings-wallpaper-file",
                          accept: "image/*"
                        })
                      )
                    ),
                    el(
                      "div",
                      { className: "form-row" },
                      el("label", { "data-i18n": "profile-color", text: "Колір профілю" }),
                      el("div", { id: "settings-color-picker", className: "color-picker-grid" }),
                      el(
                        "div",
                        { style: { marginTop: "6px" } },
                        el(
                          "button",
                          {
                            type: "button",
                            id: "settings-clear-avatar-btn",
                            className: "btn hidden",
                            style: { padding: "6px 12px", fontSize: "12.5px" }
                          },
                          icon("palette", 16),
                          el("span", {
                            "data-i18n": "reset-avatar-photo",
                            text: "Прибрати фото (кольорова іконка)"
                          })
                        )
                      )
                    ),
                    el(
                      "div",
                      {
                        style: {
                          display: "flex",
                          justifyContent: "flex-end",
                          gap: "10px",
                          marginTop: "8px"
                        }
                      },
                      el(
                        "button",
                        { type: "submit", className: "btn btn-primary" },
                        icon("save"),
                        el("span", { "data-i18n": "save", text: "Зберегти" })
                      )
                    )
                  )
                )
              ),
              el(
                "div",
                { className: "settings-panel is-inactive", dataset: { settingsPanel: "blocking" } },
                el(
                  "div",
                  { className: "panel-card" },
                  el(
                    "h3",
                    { className: "section-title", style: { marginBottom: "8px" } },
                    icon("block"),
                    el("span", { "data-i18n": "blocked-users", text: "Заблоковані користувачі" })
                  ),
                  el("p", {
                    style: { fontSize: "12.5px", color: "var(--text-secondary)", margin: "0 0 12px" },
                    "data-i18n": "information-blocked",
                    text: "Від заблокованих користувачів приховано аватар профілю, історії, відео, дописи та коментарі."
                  }),
                  el("div", { id: "blocked-users-list" })
                )
              ),
              el(
                "div",
                { className: "settings-panel settings-panel-stack is-inactive", dataset: { settingsPanel: "account" } },
                el(
                  "div",
                  { className: "panel-card" },
                  el(
                    "h3",
                    { className: "section-title", style: { marginBottom: "12px" } },
                    icon("support_agent"),
                    el("span", { "data-i18n": "help-zone", text: "Допомога" })
                  ),
                  el(
                    "div",
                    { style: { display: "flex", flexWrap: "wrap", gap: "10px" } },
                    el(
                      "button",
                      { type: "button", id: "need-support-btn", className: "btn" },
                      icon("help"),
                      el("span", { "data-i18n": "need-support", text: "Мені потрібна допомога" })
                    ),
                    el(
                      "button",
                      { type: "button", id: "i-am-fine-btn", className: "btn" },
                      icon("check_circle"),
                      el("span", { "data-i18n": "i-am-fine", text: "Я в порядку" })
                    )
                  )
                ),
                el(
                  "div",
                  { className: "panel-card" },
                  el(
                    "h3",
                    {
                      className: "section-title",
                      style: { marginBottom: "12px", color: "#fca5a5" }
                    },
                    icon("warning"),
                    el("span", { "data-i18n": "danger-zone", text: "Небезпечна зона" })
                  ),
                  el(
                    "button",
                    { type: "button", id: "delete-account-btn", className: "btn btn-danger" },
                    icon("delete_forever"),
                    el("span", { "data-i18n": "delete-account", text: "Видалити акаунт" })
                  )
                )
              )
            )
          )
        )
      )
    );
  };
})(window);
