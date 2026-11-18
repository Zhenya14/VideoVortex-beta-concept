(function (global) {
  'use strict';

  const { el, clear, icon } = global.VV;
  const registry = new WeakMap();
  let idCounter = 0;

  function syncDropdown(selectEl) {
    const entry = registry.get(selectEl);
    if (!entry) return;

    const { valueEl, menuEl } = entry;
    const options = Array.from(selectEl.options || []);
    const selectedOpt = options.find((opt) => opt.value === selectEl.value) || options[0];
    valueEl.textContent = selectedOpt ? selectedOpt.textContent : "";

    clear(menuEl);
    options.forEach((opt) => {
      const isSelected = opt.value === selectEl.value;
      const itemBtn = el(
        "button",
        {
          type: "button",
          role: "option",
          className: `vv-dropdown-option${isSelected ? " active" : ""}`,
          ariaSelected: isSelected ? "true" : "false",
          disabled: Boolean(opt.disabled),
          dataset: { value: opt.value },
          onClick: () => {
            if (opt.disabled) return;
            const changed = selectEl.value !== opt.value;
            selectEl.value = opt.value;
            syncDropdown(selectEl);
            closeDropdown(selectEl);
            entry.triggerEl.focus();
            if (changed) {
              selectEl.dispatchEvent(new Event("change", { bubbles: true }));
            }
          }
        },
        el("span", { className: "vv-dropdown-option-label", text: opt.textContent }),
        isSelected ? icon("check", 16) : null
      );
      menuEl.appendChild(itemBtn);
    });
  }

  function closeDropdown(selectEl) {
    const entry = registry.get(selectEl);
    if (!entry) return;
    entry.wrapEl.classList.remove("open");
    entry.triggerEl.setAttribute("aria-expanded", "false");
  }

  function openDropdown(selectEl) {
    const entry = registry.get(selectEl);
    if (!entry || selectEl.disabled) return;
    global.VVBus?.emit("dropdown:open", { id: entry.id });
    entry.wrapEl.classList.add("open");
    entry.triggerEl.setAttribute("aria-expanded", "true");
    const activeOpt = entry.menuEl.querySelector(".vv-dropdown-option.active");
    activeOpt?.scrollIntoView?.({ block: "nearest" });
  }

  function enhanceSelect(selectEl) {
    if (!selectEl || registry.has(selectEl)) return;

    const id = `vv-dd-${++idCounter}`;
    const valueEl = el("span", { className: "vv-dropdown-value" });
    const chevronEl = el("span", { className: "vv-dropdown-chevron" }, icon("expand_more", 20));
    const triggerEl = el(
      "button",
      {
        type: "button",
        className: "vv-dropdown-trigger",
        ariaHaspopup: "listbox",
        ariaExpanded: "false",
        id: selectEl.id ? `${selectEl.id}-trigger` : undefined
      },
      valueEl,
      chevronEl
    );
    const menuEl = el("div", {
      className: "vv-dropdown-menu",
      role: "listbox"
    });
    const wrapEl = el("div", { className: "vv-dropdown" }, triggerEl, menuEl);

    selectEl.classList.add("vv-native-select");
    selectEl.tabIndex = -1;
    selectEl.setAttribute("aria-hidden", "true");
    selectEl.parentNode.insertBefore(wrapEl, selectEl.nextSibling);

    if (selectEl.id) {
      const linkedLabel = document.querySelector(`label[for="${selectEl.id}"]`);
      linkedLabel?.addEventListener("click", (e) => {
        e.preventDefault();
        triggerEl.focus();
        openDropdown(selectEl);
      });
    }

    registry.set(selectEl, { id, wrapEl, triggerEl, valueEl, menuEl });
    syncDropdown(selectEl);

    triggerEl.addEventListener("click", (e) => {
      e.stopPropagation();
      if (wrapEl.classList.contains("open")) {
        closeDropdown(selectEl);
      } else {
        openDropdown(selectEl);
      }
    });

    triggerEl.addEventListener("keydown", (e) => {
      const options = Array.from(menuEl.querySelectorAll(".vv-dropdown-option:not(:disabled)"));
      if (!options.length) return;

      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        if (!wrapEl.classList.contains("open")) {
          openDropdown(selectEl);
          return;
        }
        const activeIdx = options.findIndex((o) => o === document.activeElement);
        const dir = e.key === "ArrowDown" ? 1 : -1;
        const nextIdx =
          activeIdx === -1
            ? Math.max(0, options.findIndex((o) => o.classList.contains("active")))
            : (activeIdx + dir + options.length) % options.length;
        options[nextIdx]?.focus();
      } else if (e.key === "Escape") {
        closeDropdown(selectEl);
      }
    });

    menuEl.addEventListener("keydown", (e) => {
      const options = Array.from(menuEl.querySelectorAll(".vv-dropdown-option:not(:disabled)"));
      const idx = options.indexOf(document.activeElement);
      if (e.key === "ArrowDown") {
        e.preventDefault();
        options[(idx + 1) % options.length]?.focus();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        options[(idx - 1 + options.length) % options.length]?.focus();
      } else if (e.key === "Escape") {
        e.preventDefault();
        closeDropdown(selectEl);
        triggerEl.focus();
      }
    });

    selectEl.addEventListener("change", () => syncDropdown(selectEl));

    const observer = new MutationObserver(() => syncDropdown(selectEl));
    observer.observe(selectEl, { childList: true, subtree: true, characterData: true });

    global.VVBus?.on("dropdown:open", (payload) => {
      if (payload?.id !== id) closeDropdown(selectEl);
    });
    global.VVBus?.on("router:change", () => closeDropdown(selectEl));
    document.addEventListener("click", (e) => {
      if (!wrapEl.contains(e.target)) closeDropdown(selectEl);
    });
  }

  function initDropdowns(root = document) {
    root.querySelectorAll("select").forEach((sel) => enhanceSelect(sel));
  }

  global.VVComponents = global.VVComponents || {};
  Object.assign(global.VVComponents, {
    enhanceSelect,
    syncDropdown,
    initDropdowns
  });
})(window);
