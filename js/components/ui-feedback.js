(function (global) {
  'use strict';

  const { el, icon } = global.VV;

  function ensureToastContainer() {
    let container = document.getElementById("vv-toast-container");
    if (!container) {
      container = el("div", { id: "vv-toast-container", className: "vv-toast-container" });
      document.body.appendChild(container);
    }
    return container;
  }

  function showToast(message, type = "info") {
    const container = ensureToastContainer();
    const iconName =
      type === "error"
        ? "error"
        : type === "success"
        ? "check_circle"
        : "info";

    const toast = el(
      "div",
      { className: `vv-toast ${type}` },
      icon(iconName),
      el("span", { text: message })
    );

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transition = "opacity 0.2s ease";
      setTimeout(() => toast.remove(), 220);
    }, 3500);
  }

  function showConfirmModal(opts = {}) {
    return new Promise((resolve) => {
      const title = opts.title || "Підтвердження";
      const message = opts.message || "Ви впевнені?";
      const confirmText = opts.confirmText || "Підтвердити";
      const cancelText = opts.cancelText || "Скасувати";
      const danger = Boolean(opts.danger);

      let backdrop = null;
      const close = (result) => {
        if (backdrop) backdrop.remove();
        resolve(result);
      };

      const cancelBtn = el(
        "button",
        { type: "button", className: "btn", onClick: () => close(false) },
        cancelText
      );
      const confirmBtn = el(
        "button",
        {
          type: "button",
          className: `btn ${danger ? "btn-danger" : "btn-primary"}`,
          onClick: () => close(true)
        },
        confirmText
      );

      const card = el(
        "div",
        { className: "vv-modal-card" },
        el("h3", { style: { margin: "0 0 10px", fontSize: "18px" }, text: title }),
        el("p", {
          style: { margin: "0 0 20px", color: "var(--text-secondary)", fontSize: "14px" },
          text: message
        }),
        el(
          "div",
          { style: { display: "flex", justifyContent: "flex-end", gap: "10px" } },
          cancelBtn,
          confirmBtn
        )
      );

      backdrop = el(
        "div",
        {
          className: "vv-modal-backdrop",
          onClick: (e) => {
            if (e.target === backdrop) close(false);
          }
        },
        card
      );

      document.body.appendChild(backdrop);
    });
  }

  function showPromptModal(opts = {}) {
    return new Promise((resolve) => {
      const title = opts.title || "Введіть значення";
      const message = opts.message || "";
      const placeholder = opts.placeholder || "";
      const defaultValue = opts.defaultValue || "";

      let backdrop = null;
      const close = (val) => {
        if (backdrop) backdrop.remove();
        resolve(val);
      };

      const input = el("input", {
        type: "text",
        className: "vv-prompt-input",
        value: defaultValue,
        placeholder,
        style: { marginBottom: "18px" },
        onKeydown: (e) => {
          if (e.key === "Enter") close(input.value);
          if (e.key === "Escape") close(null);
        }
      });

      const cancelBtn = el(
        "button",
        { type: "button", className: "btn", onClick: () => close(null) },
        "Скасувати"
      );
      const confirmBtn = el(
        "button",
        { type: "button", className: "btn btn-primary", onClick: () => close(input.value) },
        "Зберегти"
      );

      const card = el(
        "div",
        { className: "vv-modal-card" },
        el("h3", { style: { margin: "0 0 8px", fontSize: "18px" }, text: title }),
        message
          ? el("p", {
              style: { margin: "0 0 12px", color: "var(--text-secondary)", fontSize: "13.5px" },
              text: message
            })
          : null,
        input,
        el(
          "div",
          { style: { display: "flex", justifyContent: "flex-end", gap: "10px" } },
          cancelBtn,
          confirmBtn
        )
      );

      backdrop = el(
        "div",
        {
          className: "vv-modal-backdrop",
          onClick: (e) => {
            if (e.target === backdrop) close(null);
          }
        },
        card
      );

      document.body.appendChild(backdrop);
      setTimeout(() => input.focus(), 30);
    });
  }

  function createEmptyNotice(text, i18nKey) {
    return el("p", {
      style: { color: "var(--text-secondary)", margin: "0" },
      dataset: i18nKey ? { i18n: i18nKey } : undefined,
      text
    });
  }

  global.VV = global.VV || {};
  Object.assign(global.VV, {
    showToast,
    showConfirmModal,
    showPromptModal
  });

  global.VVComponents = global.VVComponents || {};
  global.VVComponents.createEmptyNotice = createEmptyNotice;
})(window);
