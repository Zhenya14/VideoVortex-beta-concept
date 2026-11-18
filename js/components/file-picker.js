(function (global) {
  'use strict';

  const { el, clear, icon } = global.VV;
  const registry = new WeakMap();
  const instances = new Set();

  function formatFileSize(bytes) {
    const num = Number(bytes || 0);
    if (num < 1024) return `${num} B`;
    if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
    if (num < 1024 * 1024 * 1024) return `${(num / (1024 * 1024)).toFixed(1)} MB`;
    return `${(num / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }

  function resolveAcceptInfo(acceptStr) {
    const raw = String(acceptStr || "").toLowerCase();
    const hasImg = raw.includes("image");
    const hasVid = raw.includes("video");
    const hasZip = raw.includes(".zip") || raw.includes("zip");

    if (hasImg && hasVid) {
      return { iconName: "perm_media", hint: "IMG / MP4 / WebM" };
    }
    if (hasVid) {
      return { iconName: "movie", hint: "MP4 / WebM / MOV" };
    }
    if (hasImg) {
      return { iconName: "image", hint: "JPG / PNG / WebP" };
    }
    if (hasZip) {
      return { iconName: "folder_zip", hint: "ZIP" };
    }
    return { iconName: "upload_file", hint: "FILE" };
  }

  function fileMatchesAccept(file, acceptStr) {
    if (!acceptStr || !file) return true;
    const rules = String(acceptStr)
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    if (!rules.length) return true;

    const mime = String(file.type || "").toLowerCase();
    const name = String(file.name || "").toLowerCase();

    return rules.some((rule) => {
      if (rule.startsWith(".")) return name.endsWith(rule);
      if (rule.endsWith("/*")) return mime.startsWith(rule.slice(0, -1));
      return mime === rule;
    });
  }

  function tOr(key, fallback) {
    const val = global.t?.(key);
    return val && val !== key ? val : fallback;
  }

  function revokePreview(entry) {
    if (entry.previewObjectUrl) {
      try {
        URL.revokeObjectURL(entry.previewObjectUrl);
      } catch (e) {}
      entry.previewObjectUrl = "";
    }
  }

  function syncFileInput(inputEl) {
    const entry = registry.get(inputEl);
    if (!entry) return;

    const { wrapEl, thumbWrap, titleEl, subEl, clearBtn, badgeEl } = entry;
    const files = Array.from(inputEl.files || []);
    const acceptInfo = resolveAcceptInfo(inputEl.accept);

    revokePreview(entry);
    clear(thumbWrap);

    if (!files.length) {
      wrapEl.classList.remove("has-file");
      clearBtn.classList.add("hidden");
      thumbWrap.classList.remove("has-preview");
      thumbWrap.appendChild(icon(acceptInfo.iconName, 22));
      titleEl.textContent = inputEl.multiple
        ? tOr("file-pick-multi", "Оберіть файли або перетягніть сюди")
        : tOr("file-pick-single", "Оберіть файл або перетягніть сюди");
      subEl.textContent =
        inputEl.dataset.allowPaste === "true"
          ? tOr("file-pick-paste-hint", "Натисніть, перетягніть або вставте (Ctrl+V)")
          : tOr("file-pick-hint", "Натисніть для вибору з пристрою");
      badgeEl.textContent = acceptInfo.hint;
      badgeEl.classList.remove("hidden");
      return;
    }

    wrapEl.classList.add("has-file");
    clearBtn.classList.remove("hidden");
    badgeEl.classList.add("hidden");

    const totalBytes = files.reduce((acc, f) => acc + (f.size || 0), 0);

    if (files.length === 1) {
      const f = files[0];
      titleEl.textContent = f.name;
      subEl.textContent = formatFileSize(f.size);
      if (f.type && f.type.startsWith("image/")) {
        entry.previewObjectUrl = URL.createObjectURL(f);
        thumbWrap.classList.add("has-preview");
        thumbWrap.appendChild(
          el("img", {
            src: entry.previewObjectUrl,
            alt: f.name,
            className: "vv-file-preview-img"
          })
        );
      } else {
        thumbWrap.classList.remove("has-preview");
        thumbWrap.appendChild(icon(acceptInfo.iconName, 22));
      }
    } else {
      titleEl.textContent =
        global.tPlural?.("files-selected", files.length, true) ||
        `Вибрано файлів: ${files.length}`;
      subEl.textContent = `${files
        .slice(0, 2)
        .map((f) => f.name)
        .join(", ")}${files.length > 2 ? "..." : ""} • ${formatFileSize(totalBytes)}`;
      if (files[0]?.type?.startsWith("image/")) {
        entry.previewObjectUrl = URL.createObjectURL(files[0]);
        thumbWrap.classList.add("has-preview");
        thumbWrap.appendChild(
          el("img", {
            src: entry.previewObjectUrl,
            alt: files[0].name,
            className: "vv-file-preview-img"
          })
        );
      } else {
        thumbWrap.classList.remove("has-preview");
        thumbWrap.appendChild(icon(acceptInfo.iconName, 22));
      }
    }
  }

  function applyDroppedFiles(inputEl, fileList) {
    const incoming = Array.from(fileList || []);
    if (!incoming.length) return;

    const valid = incoming.filter((f) => fileMatchesAccept(f, inputEl.accept));
    if (!valid.length) {
      global.VV?.showToast?.(
        tOr("file-wrong-type", "Непідтримуваний формат файлу"),
        "error"
      );
      return;
    }

    const picked = inputEl.multiple ? valid : [valid[0]];
    if (typeof DataTransfer !== "undefined") {
      const dt = new DataTransfer();
      picked.forEach((f) => dt.items.add(f));
      inputEl.files = dt.files;
      inputEl.dispatchEvent(new Event("input", { bubbles: true }));
      inputEl.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  function enhanceFileInput(inputEl) {
    if (!inputEl || registry.has(inputEl)) return;

    const thumbWrap = el("div", { className: "vv-file-thumb" });
    const titleEl = el("div", { className: "vv-file-title" });
    const subEl = el("div", { className: "vv-file-sub" });
    const badgeEl = el("span", { className: "vv-file-badge" });
    const clearBtn = el(
      "button",
      {
        type: "button",
        className: "vv-file-clear hidden",
        ariaLabel: tOr("file-clear", "Очистити файл"),
        onClick: (e) => {
          e.preventDefault();
          e.stopPropagation();
          inputEl.value = "";
          syncFileInput(inputEl);
          inputEl.dispatchEvent(new Event("change", { bubbles: true }));
        }
      },
      icon("close", 16)
    );

    const triggerEl = el(
      "div",
      {
        className: "vv-file-trigger",
        role: "button",
        tabIndex: 0,
        ariaRequired: inputEl.required ? "true" : undefined,
        id: inputEl.id ? `${inputEl.id}-trigger` : undefined
      },
      thumbWrap,
      el("div", { className: "vv-file-meta" }, titleEl, subEl),
      badgeEl,
      clearBtn
    );

    const wrapEl = el("div", { className: "vv-file-picker" }, triggerEl);

    if (inputEl.required) {
      inputEl.dataset.vvRequired = "true";
      inputEl.removeAttribute("required");
    }
    inputEl.classList.add("vv-native-file");
    inputEl.tabIndex = -1;
    inputEl.setAttribute("aria-hidden", "true");
    inputEl.parentNode.insertBefore(wrapEl, inputEl.nextSibling);

    if (inputEl.id === "archive-file-input") {
      wrapEl.classList.add("compact");
    }

    const entry = {
      inputEl,
      wrapEl,
      triggerEl,
      thumbWrap,
      titleEl,
      subEl,
      badgeEl,
      clearBtn,
      previewObjectUrl: ""
    };

    registry.set(inputEl, entry);
    instances.add(inputEl);
    syncFileInput(inputEl);

    const openNativeDialog = () => {
      if (!inputEl.disabled) inputEl.click();
    };

    triggerEl.addEventListener("click", openNativeDialog);
    triggerEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openNativeDialog();
      }
    });

    if (inputEl.id) {
      const linkedLabel = document.querySelector(`label[for="${inputEl.id}"]`);
      linkedLabel?.addEventListener("click", (e) => {
        e.preventDefault();
        triggerEl.focus();
        openNativeDialog();
      });
    }

    triggerEl.addEventListener("dragenter", (e) => {
      e.preventDefault();
      wrapEl.classList.add("is-dragover");
    });
    triggerEl.addEventListener("dragover", (e) => {
      e.preventDefault();
      wrapEl.classList.add("is-dragover");
    });
    triggerEl.addEventListener("dragleave", (e) => {
      if (!triggerEl.contains(e.relatedTarget)) {
        wrapEl.classList.remove("is-dragover");
      }
    });
    triggerEl.addEventListener("drop", (e) => {
      e.preventDefault();
      wrapEl.classList.remove("is-dragover");
      applyDroppedFiles(inputEl, e.dataTransfer?.files);
    });

    inputEl.addEventListener("change", () => syncFileInput(inputEl));
    inputEl.form?.addEventListener("reset", () => {
      setTimeout(() => syncFileInput(inputEl), 0);
    });
  }

  function initFilePickers(root = document) {
    root.querySelectorAll('input[type="file"]').forEach((input) => enhanceFileInput(input));
  }

  global.VVBus?.on("i18n:updated", () => {
    instances.forEach((inputEl) => syncFileInput(inputEl));
  });

  global.VVComponents = global.VVComponents || {};
  Object.assign(global.VVComponents, {
    enhanceFileInput,
    syncFileInput,
    initFilePickers
  });
})(window);
