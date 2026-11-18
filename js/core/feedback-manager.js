(function (global) {
  'use strict';

  const { el, clear, icon } = global.VV;
  const listeners = new Map();
  const fieldCleaners = new Map();

  const VVBus = {
    on(eventName, handler) {
      if (!eventName || typeof handler !== "function") return () => {};
      if (!listeners.has(eventName)) listeners.set(eventName, new Set());
      const bucket = listeners.get(eventName);
      bucket.add(handler);
      return () => bucket.delete(handler);
    },

    once(eventName, handler) {
      const unsub = this.on(eventName, (payload) => {
        unsub();
        handler(payload);
      });
      return unsub;
    },

    off(eventName, handler) {
      listeners.get(eventName)?.delete(handler);
    },

    emit(eventName, payload) {
      const bucket = listeners.get(eventName);
      if (!bucket) return;
      bucket.forEach((fn) => {
        try {
          fn(payload);
        } catch (_) {}
      });
    }
  };

  function resolveFieldElement(target) {
    if (!target) return null;
    if (typeof target === "string") {
      return document.querySelector(target) || document.getElementById(target.replace(/^#/, ""));
    }
    return target instanceof Element ? target : null;
  }

  function clearFieldHighlights(scope) {
    const bucket = fieldCleaners.get(scope);
    if (!bucket) return;
    bucket.forEach(({ node, cleanup }) => {
      node.classList.remove("vv-field-invalid");
      node.removeAttribute("aria-invalid");
      cleanup();
    });
    fieldCleaners.delete(scope);
  }

  function highlightFields(scope, fields = []) {
    clearFieldHighlights(scope);
    if (!fields || !fields.length) return;

    const bucket = [];
    let firstNode = null;

    fields.forEach((entry) => {
      const node = resolveFieldElement(entry);
      if (!node) return;
      if (!firstNode) firstNode = node;
      node.classList.add("vv-field-invalid");
      node.setAttribute("aria-invalid", "true");

      const onEdit = () => {
        clearScope(scope);
      };
      node.addEventListener("input", onEdit);
      node.addEventListener("change", onEdit);

      bucket.push({
        node,
        cleanup: () => {
          node.removeEventListener("input", onEdit);
          node.removeEventListener("change", onEdit);
        }
      });
    });

    if (bucket.length) {
      fieldCleaners.set(scope, bucket);
      const customTrigger = firstNode?.id
        ? document.getElementById(`${firstNode.id}-trigger`)
        : null;
      (customTrigger || firstNode)?.focus?.();
    }
  }

  function findSlot(scope) {
    if (!scope) return null;
    const candidates = document.querySelectorAll(`[data-feedback-scope="${scope}"]`);
    for (const node of candidates) {
      if (node.closest(".hidden") === null || node.id === "auth-feedback-slot") {
        return node;
      }
    }
    return candidates[0] || null;
  }

  function isSlotRenderable(slot) {
    if (!slot) return false;
    let cur = slot.parentElement;
    while (cur && cur !== document.body) {
      if (cur.classList.contains("hidden")) return false;
      cur = cur.parentElement;
    }
    return true;
  }

  function clearScope(scope) {
    if (!scope) return;
    clearFieldHighlights(scope);
    document.querySelectorAll(`[data-feedback-scope="${scope}"]`).forEach((slot) => {
      clear(slot);
      slot.classList.add("hidden");
      slot.classList.remove("error", "success", "info", "loading", "vv-shake");
    });
    VVBus.emit("feedback:cleared", { scope });
  }

  function clearAll() {
    Array.from(fieldCleaners.keys()).forEach((scope) => clearScope(scope));
    document.querySelectorAll("[data-feedback-scope]").forEach((slot) => {
      clear(slot);
      slot.classList.add("hidden");
      slot.classList.remove("error", "success", "info", "loading", "vv-shake");
    });
  }

  function renderIntoSlot(slot, opts) {
    const type = opts.type || "info";
    const scope = opts.scope;
    const iconName =
      type === "error"
        ? "error"
        : type === "success"
        ? "check_circle"
        : type === "loading"
        ? "hourglass_top"
        : "info";

    clear(slot);
    slot.classList.remove("hidden", "error", "success", "info", "loading", "vv-shake");
    slot.classList.add(type);
    slot.setAttribute("role", type === "error" ? "alert" : "status");

    const closeBtn =
      opts.dismissible === false
        ? null
        : el(
            "button",
            {
              type: "button",
              className: "vv-feedback-close",
              ariaLabel: "Закрити",
              onClick: () => clearScope(scope)
            },
            icon("close", 16)
          );

    const iconNode =
      type === "loading" ? el("span", { className: "vv-spinner" }) : icon(iconName, 18);

    slot.appendChild(iconNode);
    slot.appendChild(el("span", { className: "vv-feedback-text", text: opts.message || "" }));
    if (closeBtn) slot.appendChild(closeBtn);

    if (type === "error") {
      void slot.offsetWidth;
      slot.classList.add("vv-shake");
    }

    if (opts.autoHideMs && opts.autoHideMs > 0) {
      const targetMsg = opts.message;
      setTimeout(() => {
        const textNode = slot.querySelector(".vv-feedback-text");
        if (textNode && textNode.textContent === targetMsg) {
          clearScope(scope);
        }
      }, opts.autoHideMs);
    }
  }

  function notify(opts = {}) {
    const scope = opts.scope || "global";
    const message = String(opts.message || "").trim();
    const type = opts.type || "info";
    if (!message) return;

    VVBus.emit("feedback:notify", { scope, message, type, fields: opts.fields || [] });

    const slot = findSlot(scope);
    if (slot && isSlotRenderable(slot)) {
      highlightFields(scope, type === "error" ? opts.fields : []);
      renderIntoSlot(slot, {
        scope,
        message,
        type,
        dismissible: opts.dismissible !== false,
        autoHideMs:
          typeof opts.autoHideMs === "number"
            ? opts.autoHideMs
            : type === "success" || type === "info"
            ? 4200
            : 0
      });
      return;
    }

    global.VV.showToast(message, type === "loading" ? "info" : type);
  }

  function createSlot(scope) {
    return el("div", {
      className: "vv-inline-feedback hidden",
      dataset: { feedbackScope: scope }
    });
  }

  VVBus.on("router:change", () => {
    clearAll();
  });

  VVBus.on("feedback:clear", (payload) => {
    if (payload?.scope) clearScope(payload.scope);
    else clearAll();
  });

  global.VVBus = VVBus;
  global.VVFeedback = {
    notify,
    clear: clearScope,
    clearAll,
    createSlot
  };
})(window);
