(function (global) {
  'use strict';

  const { el, icon } = global.VV;
  global.VVElements = global.VVElements || {};

  global.VVElements.createRulesModal = function () {
    return el(
      "div",
      { id: "rules-modal", className: "vv-modal-backdrop hidden" },
      el(
        "div",
        { className: "vv-modal-card", style: { textAlign: "center" } },
        el(
          "div",
          {
            style: {
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "19px",
              fontWeight: "700",
              marginBottom: "10px"
            }
          },
          el("i", {
            className: "material-symbols",
            style: { color: "var(--warning-primary)" },
            text: "notifications_active"
          }),
          el("span", { "data-i18n": "rules-title", text: "Оновлені правила" })
        ),
        el("p", {
          style: { color: "var(--text-secondary)", fontSize: "14px", margin: "0 0 14px" },
          "data-i18n": "rules-intro",
          text: "Ми оновили правила спільноти VideoVortex:"
        }),
        el(
          "ul",
          {
            style: {
              listStyle: "none",
              padding: "0",
              margin: "0 0 20px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              textAlign: "left",
              fontSize: "14px"
            }
          },
          el(
            "li",
            { style: { display: "flex", alignItems: "center", gap: "10px" } },
            el("i", {
              className: "material-symbols",
              style: { color: "#f87171" },
              text: "block"
            }),
            el("span", {
              "data-i18n": "rules-item-1",
              text: "Заборонено фейки та образи."
            })
          ),
          el(
            "li",
            { style: { display: "flex", alignItems: "center", gap: "10px" } },
            el("i", {
              className: "material-symbols",
              style: { color: "#fbbf24" },
              text: "lock"
            }),
            el("span", {
              "data-i18n": "rules-item-2",
              text: "Посилено правила приватності."
            })
          ),
          el(
            "li",
            { style: { display: "flex", alignItems: "center", gap: "10px" } },
            el("i", {
              className: "material-symbols",
              style: { color: "#60a5fa" },
              text: "verified_user"
            }),
            el("span", {
              "data-i18n": "rules-item-3",
              text: "Обмеження для користувачів до 16 років."
            })
          )
        ),
        el("button", {
          type: "button",
          id: "rules-accept-btn",
          className: "btn btn-primary",
          style: { width: "100%" },
          "data-i18n": "rules-accept",
          text: "Зрозуміло"
        })
      )
    );
  };

  global.VVElements.createStoryViewerModal = function () {
    return el(
      "div",
      { id: "story-viewer", className: "story-viewer" },
      el(
        "div",
        { className: "story-modal-card" },
        el("div", { id: "story-progress", className: "story-progress" }),
        el(
          "div",
          { className: "story-header" },
          el(
            "div",
            {
              id: "story-user-link",
              className: "story-user-info",
              style: { cursor: "pointer" }
            },
            el("div", { id: "story-author-avatar", className: "story-user-avatar" }),
            el("span", {
              id: "story-author-name",
              style: { fontWeight: "600", fontSize: "14px" }
            })
          ),
          el(
            "div",
            { style: { display: "flex", gap: "6px" } },
            el(
              "button",
              { type: "button", id: "delete-story-btn", className: "btn btn-icon btn-danger hidden" },
              icon("delete")
            ),
            el(
              "button",
              { type: "button", id: "close-story-btn", className: "btn btn-icon" },
              icon("close")
            )
          )
        ),
        el("div", { id: "story-media-stage", className: "story-media-stage" }),
        el("div", { id: "story-prev-zone", className: "story-nav-zone prev" }),
        el("div", { id: "story-next-zone", className: "story-nav-zone next" }),
        el("div", { id: "story-caption-text", className: "story-caption-bar hidden" })
      )
    );
  };

  global.VVElements.createStoryUploadModal = function () {
    return el(
      "div",
      { id: "story-upload-modal", className: "vv-modal-backdrop hidden" },
      el(
        "div",
        { className: "vv-modal-card" },
        el(
          "div",
          { className: "section-header" },
          el(
            "h3",
            { className: "section-title" },
            icon("amp_stories"),
            " ",
            el("span", {
              "data-i18n": "story-add-title",
              text: "Додати історію (24 год)"
            })
          ),
          el(
            "button",
            { type: "button", id: "close-story-upload-modal", className: "btn btn-icon" },
            icon("close")
          )
        ),
        el("div", {
          className: "vv-inline-feedback hidden",
          "data-feedback-scope": "story-upload"
        }),
        el(
          "form",
          { id: "story-upload-form", className: "form-grid" },
          el(
            "div",
            { className: "form-row" },
            el("label", {
              for: "story-file-input",
              "data-i18n": "story-media-label",
              text: "Фото або коротке відео"
            }),
            el("input", {
              type: "file",
              id: "story-file-input",
              accept: "image/*,video/*",
              "data-allow-paste": "true",
              required: true
            })
          ),
          el(
            "div",
            { className: "form-row" },
            el("label", {
              for: "story-caption-input",
              "data-i18n": "story-caption-label",
              text: "Підпис"
            }),
            el("input", {
              type: "text",
              id: "story-caption-input",
              "data-i18n-placeholder": "story-caption-ph",
              placeholder: "Короткий підпис..."
            })
          ),
          el(
            "button",
            { type: "submit", className: "btn btn-primary" },
            icon("publish"),
            el("span", { "data-i18n": "story-publish", text: "Опублікувати історію" })
          )
        )
      )
    );
  };
})(window);
