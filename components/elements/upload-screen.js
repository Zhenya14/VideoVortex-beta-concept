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

  global.VVElements.createUploadScreen = function () {
    return el(
      "section",
      { id: "upload-view", className: "hidden" },
      el(
        "div",
        {
          id: "upload-guest-gate",
          className: "panel-card",
          style: { maxWidth: "560px", margin: "0 auto" }
        },
        el(
          "h3",
          { className: "section-title" },
          icon("cloud_upload"),
          el("span", { "data-i18n": "upload-auth-title", text: "Публікація контенту" })
        ),
        el("p", {
          style: { color: "var(--text-secondary)", margin: "8px 0 16px" },
          "data-i18n": "upload-auth-desc",
          text: "Увійдіть в обліковий запис, щоб завантажувати відео, фото-дописи та історії."
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
        {
          id: "upload-forms-grid",
          className: "hidden",
          style: {
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))",
            gap: "20px"
          }
        },
        el(
          "div",
          { className: "panel-card" },
          el(
            "h3",
            { className: "section-title", style: { marginBottom: "16px" } },
            icon("video_call"),
            el("span", { "data-i18n": "label-video", text: "Завантажити відео" })
          ),
          el("div", {
            className: "vv-inline-feedback hidden",
            "data-feedback-scope": "upload-video"
          }),
          el(
            "form",
            { id: "video-upload-form", className: "form-grid" },
            el(
              "div",
              { className: "form-row" },
              el("label", {
                for: "upload-channel-select",
                "data-i18n": "upload-channel",
                text: "Канал публікації"
              }),
              el(
                "select",
                { id: "upload-channel-select" },
                el("option", {
                  value: "main",
                  "data-i18n": "main-channel",
                  text: "Основний канал"
                })
              )
            ),
            el(
              "div",
              { className: "form-row" },
              el("label", {
                for: "video-title-input",
                "data-i18n": "video-title",
                text: "Назва відео"
              }),
              el("input", {
                type: "text",
                id: "video-title-input",
                "data-i18n-placeholder": "video-title-ph",
                placeholder: "Введіть назву відео",
                required: true
              })
            ),
            el(
              "div",
              { className: "form-row" },
              el("label", {
                for: "video-desc-input",
                "data-i18n": "video-description",
                text: "Опис відео (необов'язково)"
              }),
              el("textarea", {
                id: "video-desc-input",
                "data-i18n-placeholder": "video-desc-ph",
                placeholder: "Про що це відео..."
              }),
              el(
                "button",
                {
                  type: "button",
                  className: "btn generate-description"
                },
                icon("smart_toy"),
                el("span", {
                  "data-i18n": "generate-description",
                  text: "Згенерувати опис"
                })
              )
            ),
            el(
              "div",
              { className: "form-row" },
              el("label", {
                for: "video-file-input",
                "data-i18n": "video-file",
                text: "Відеофайл"
              }),
              el("input", {
                type: "file",
                id: "video-file-input",
                accept: "video/*",
                required: true
              })
            ),
            el(
              "div",
              { className: "form-row" },
              el("label", {
                for: "thumb-file-input",
                "data-i18n": "thumb-file",
                text: "Обкладинка (Thumbnail)"
              }),
              el("input", {
                type: "file",
                id: "thumb-file-input",
                accept: "image/*",
                required: true
              })
            ),
            buildSwitchRow("private-video-checkbox", "Приватне відео", "video-private-check"),
            buildSwitchRow("nsfw-checkbox", "Контент 18+ (NSFW)", "video-nsfw-check"),
            buildSwitchRow("domain-restrict", "Лише для мого поштового домену", "video-domain-check"),
            buildSwitchRow("disable-comments", "Вимкнути коментарі", "video-nocomments-check"),
            buildSwitchRow("autodelete-24h", "Автовидалення через 24 години", "video-autodelete-check"),
            buildSwitchRow("bandura-meta", "Метадані виступу (Бандура)", "video-bandura-toggle"),
            el(
              "div",
              { id: "bandura-fields-box", className: "form-grid hidden" },
              el(
                "div",
                { className: "form-row" },
                el("label", {
                  for: "bandura-instrument",
                  "data-i18n": "bandura-instrument",
                  text: "Тип інструмента / стрій"
                }),
                el("input", {
                  type: "text",
                  id: "bandura-instrument",
                  placeholder: "Наприклад: Харківська / Чернігівська"
                })
              ),
              el(
                "div",
                { className: "form-row" },
                el("label", {
                  for: "bandura-tempo",
                  "data-i18n": "bandura-tempo",
                  text: "Темп / Тональність"
                }),
                el("input", {
                  type: "text",
                  id: "bandura-tempo",
                  placeholder: "Наприклад: 92 BPM, Ля мінор"
                })
              )
            ),
            el(
              "button",
              { type: "submit", className: "btn btn-primary" },
              icon("cloud_upload"),
              el("span", { "data-i18n": "publish-video", text: "Опублікувати відео" })
            )
          )
        ),
        el(
          "div",
          { className: "panel-card" },
          el(
            "h3",
            { className: "section-title", style: { marginBottom: "16px" } },
            icon("add_photo_alternate"),
            el("span", { "data-i18n": "label-photo", text: "Завантажити фото" })
          ),
          el("div", {
            className: "vv-inline-feedback hidden",
            "data-feedback-scope": "upload-photo"
          }),
          el(
            "form",
            { id: "photo-upload-form", className: "form-grid" },
            el(
              "div",
              { className: "form-row" },
              el("label", {
                for: "photo-title-input",
                "data-i18n": "photo-title",
                text: "Заголовок допису"
              }),
              el("input", {
                type: "text",
                id: "photo-title-input",
                "data-i18n-placeholder": "photo-title-ph",
                placeholder: "Введіть заголовок",
                required: true
              })
            ),
            el(
              "div",
              { className: "form-row" },
              el("label", {
                for: "photo-desc-input",
                "data-i18n": "photo-desc",
                text: "Текст допису"
              }),
              el("textarea", {
                id: "photo-desc-input",
                "data-i18n-placeholder": "photo-desc-ph",
                placeholder: "Опис або історія до фото..."
              })
            ),
            el(
              "div",
              { className: "form-row" },
              el("label", {
                for: "photo-files-input",
                "data-i18n": "photo-files",
                text: "Зображення (до 10 фото)"
              }),
              el("input", {
                type: "file",
                id: "photo-files-input",
                accept: "image/*",
                multiple: true,
                required: true
              })
            ),
            el(
              "button",
              { type: "submit", className: "btn btn-primary" },
              icon("send"),
              el("span", { "data-i18n": "publish-post", text: "Опублікувати допис" })
            )
          )
        )
      )
    );
  };
})(window);