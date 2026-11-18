(function (global) {
  'use strict';

  const { el, icon } = global.VV;
  global.VVElements = global.VVElements || {};

  function buildPasswordWrap(inputProps) {
    return el(
      "div",
      { className: "password-input-wrap" },
      el("input", inputProps),
      el(
        "button",
        {
          type: "button",
          className: "password-toggle-btn",
          "data-toggle-password": inputProps.id,
          "aria-label": "Показати пароль",
          "aria-pressed": "false"
        },
        icon("visibility")
      )
    );
  }

  global.VVElements.createAuthScreen = function () {
    return el(
      "section",
      { id: "auth-view", className: "hidden" },
      el(
        "div",
        { className: "auth-view-wrapper" },
        el(
          "div",
          { id: "auth-card", className: "panel-card auth-card" },
          el("div", { id: "auth-progress-bar", className: "auth-progress-bar" }),
          el(
            "div",
            { id: "auth-entering-banner", className: "auth-entering-banner hidden" },
            el("span", { id: "auth-entering-spinner", className: "vv-spinner" }),
            el("i", {
              id: "auth-entering-check",
              className: "material-symbols hidden",
              style: { color: "var(--success-primary)" },
              text: "check_circle"
            }),
            el("span", {
              id: "auth-entering-label",
              "data-i18n": "auth-entering",
              text: "Виконується вхід..."
            })
          ),
          el(
            "div",
            { className: "auth-tabs-bar" },
            el(
              "button",
              { type: "button", id: "tab-login-btn", className: "btn btn-primary" },
              icon("login"),
              el("span", { "data-i18n": "auth-login-tab", text: "Вхід" })
            ),
            el(
              "button",
              { type: "button", id: "tab-signup-btn", className: "btn" },
              icon("person_add"),
              el("span", { "data-i18n": "auth-signup-tab", text: "Реєстрація" })
            )
          ),
          el("div", {
            id: "auth-feedback-slot",
            className: "vv-inline-feedback hidden",
            "data-feedback-scope": "auth"
          }),
          el(
            "form",
            { id: "login-form", className: "form-grid" },
            el(
              "div",
              { className: "form-row" },
              el("label", {
                for: "login-email",
                "data-i18n": "email-label",
                text: "Електронна пошта"
              }),
              el("input", {
                type: "email",
                id: "login-email",
                placeholder: "you@example.com",
                required: true
              })
            ),
            el(
              "div",
              { className: "form-row" },
              el("label", {
                for: "login-password",
                "data-i18n": "password-label",
                text: "Пароль"
              }),
              buildPasswordWrap({
                type: "password",
                id: "login-password",
                "data-i18n-placeholder": "password-placeholder",
                placeholder: "Ваш пароль",
                required: true
              })
            ),
            el(
              "button",
              {
                type: "submit",
                id: "login-submit-btn",
                className: "btn btn-primary",
                style: { width: "100%" }
              },
              icon("login"),
              el("span", { "data-i18n": "login", text: "Увійти" })
            ),
            el(
              "div",
              { className: "auth-footer-links" },
              el(
                "button",
                {
                  type: "button",
                  id: "open-reset-form-btn",
                  className: "btn",
                  style: { padding: "6px 12px", fontSize: "12.5px" }
                },
                icon("lock_reset"),
                el("span", { "data-i18n": "forgot-password", text: "Забули пароль?" })
              ),
              el(
                "button",
                {
                  type: "button",
                  id: "anonymous-login-btn",
                  className: "btn",
                  style: { padding: "6px 12px", fontSize: "12.5px" }
                },
                icon("visibility"),
                el("span", { "data-i18n": "guest-login", text: "Увійти як гість" })
              )
            )
          ),
          el(
            "form",
            { id: "signup-form", className: "form-grid hidden" },
            el(
              "div",
              { className: "form-row" },
              el("label", {
                for: "signup-name",
                "data-i18n": "channel-name",
                text: "Ім'я каналу"
              }),
              el("input", {
                type: "text",
                id: "signup-name",
                "data-i18n-placeholder": "channel-name-ph",
                placeholder: "Ваше ім'я або назва каналу",
                required: true
              })
            ),
            el(
              "div",
              { className: "form-row" },
              el("label", {
                for: "signup-supername",
                "data-i18n": "handle-label",
                text: "Нікнейм (@supername)"
              }),
              el("input", {
                type: "text",
                id: "signup-supername",
                placeholder: "username"
              })
            ),
            el(
              "div",
              { className: "form-row" },
              el("label", {
                for: "signup-email",
                "data-i18n": "email-label",
                text: "Електронна пошта"
              }),
              el("input", {
                type: "email",
                id: "signup-email",
                placeholder: "you@example.com",
                required: true
              })
            ),
            el(
              "div",
              { className: "form-row" },
              el("label", {
                for: "signup-birthdate",
                "data-i18n": "birthdate",
                text: "Дата народження"
              }),
              el("input", {
                type: "date",
                id: "signup-birthdate",
                required: true
              })
            ),
            el(
              "div",
              { className: "form-row" },
              el("label", {
                for: "signup-password",
                "data-i18n": "password-min",
                text: "Пароль (мінімум 6 символів)"
              }),
              buildPasswordWrap({
                type: "password",
                id: "signup-password",
                minlength: "6",
                "data-i18n-placeholder": "password-strong-ph",
                placeholder: "Надійний пароль",
                required: true
              })
            ),
            el(
              "button",
              {
                type: "submit",
                id: "signup-submit-btn",
                className: "btn btn-primary",
                style: { width: "100%" }
              },
              icon("person_add"),
              el("span", { "data-i18n": "create-account", text: "Створити акаунт" })
            )
          ),
          el(
            "form",
            { id: "reset-password-form", className: "form-grid hidden" },
            el(
              "div",
              { className: "form-row" },
              el("label", {
                for: "reset-email",
                "data-i18n": "reset-email-label",
                text: "Електронна пошта для відновлення пароля"
              }),
              el("input", {
                type: "email",
                id: "reset-email",
                placeholder: "you@example.com",
                required: true
              })
            ),
            el(
              "button",
              { type: "submit", className: "btn btn-primary", style: { width: "100%" } },
              icon("mail"),
              el("span", { "data-i18n": "send-reset", text: "Надіслати лист" })
            ),
            el(
              "button",
              {
                type: "button",
                id: "back-to-login-btn",
                className: "btn",
                style: { width: "100%" }
              },
              icon("arrow_back"),
              el("span", { "data-i18n": "back-to-login", text: "Повернутися до входу" })
            )
          )
        )
      )
    );
  };
})(window);
