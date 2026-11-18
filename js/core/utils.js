(function (global) {
  'use strict';

  const DEFAULT_THUMBNAIL = "assets/images/default.jpg";
  const DEFAULT_LOGO = "assets/images/logos/VideoVortex_logo_192x192.png";

  const SOLID_COLORS = [
    "#2563eb",
    "#0284c7",
    "#0d9488",
    "#059669",
    "#4f46e5",
    "#7c3aed",
    "#9333ea",
    "#c026d3",
    "#e11d48",
    "#ea580c",
    "#d97706",
    "#475569"
  ];

  function pickSolidColor(seed) {
    if (!seed) {
      return SOLID_COLORS[Math.floor(Math.random() * SOLID_COLORS.length)];
    }
    const str = String(seed);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return SOLID_COLORS[Math.abs(hash) % SOLID_COLORS.length];
  }

  function sanitizeSolidColor(colorValue, seed) {
    if (!colorValue || typeof colorValue !== "string") {
      return pickSolidColor(seed);
    }
    const trimmed = colorValue.trim();
    if (trimmed.includes("gradient")) {
      return pickSolidColor(seed || trimmed);
    }
    return trimmed;
  }

  function escapeHtml(str) {
    return String(str ?? "").replace(/[&<>"']/g, function (m) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      }[m];
    });
  }

  function getInitials(name, fallback) {
    const clean = String(name || fallback || "U").trim();
    if (!clean) return "U";
    const parts = clean.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return clean.slice(0, 2).toUpperCase();
  }

  const STORAGE_URL_CACHE_KEY = "vv_storage_url_cache_v1";
  const IMAGE_CACHE_NAME = "videovortex-media-v1";
  const URL_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
  const MAX_URL_CACHE_ENTRIES = 150;
  const MAX_BLOB_CACHE_ENTRIES = 80;

  const storageUrlCache = new Map();
  const imageBlobCache = new Map();
  const pendingImageLoads = new Map();

  function loadPersistedStorageUrls() {
    try {
      const raw = global.localStorage?.getItem(STORAGE_URL_CACHE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (e) {
      return {};
    }
  }

  function savePersistedStorageUrl(cacheKey, url) {
    if (!url) return;
    try {
      const map = loadPersistedStorageUrls();
      const now = Date.now();
      map[cacheKey] = { url, ts: now };
      const entries = Object.entries(map).filter(
        ([, v]) => v && typeof v.url === "string" && now - Number(v.ts || 0) < URL_CACHE_TTL_MS
      );
      entries.sort((a, b) => Number(b[1].ts || 0) - Number(a[1].ts || 0));
      const trimmed = Object.fromEntries(entries.slice(0, MAX_URL_CACHE_ENTRIES));
      global.localStorage?.setItem(STORAGE_URL_CACHE_KEY, JSON.stringify(trimmed));
    } catch (e) {}
  }

  function getPersistedStorageUrl(cacheKey) {
    const map = loadPersistedStorageUrls();
    const entry = map[cacheKey];
    if (!entry || typeof entry.url !== "string") return "";
    if (Date.now() - Number(entry.ts || 0) >= URL_CACHE_TTL_MS) return "";
    return entry.url;
  }

  function isDirectMediaUrl(value) {
    if (!value || typeof value !== "string") return false;
    return (
      value.startsWith("http://") ||
      value.startsWith("https://") ||
      value.startsWith("assets/") ||
      value.startsWith("data:image/") ||
      value.startsWith("blob:")
    );
  }

  function setBlobCacheEntry(url, blobUrl) {
    if (!url || !blobUrl) return;
    if (imageBlobCache.size >= MAX_BLOB_CACHE_ENTRIES && !imageBlobCache.has(url)) {
      const oldestKey = imageBlobCache.keys().next().value;
      const oldestVal = imageBlobCache.get(oldestKey);
      imageBlobCache.delete(oldestKey);
      if (oldestVal && oldestVal.startsWith("blob:")) {
        try {
          global.URL?.revokeObjectURL?.(oldestVal);
        } catch (e) {}
      }
    }
    imageBlobCache.set(url, blobUrl);
  }

  async function resolveCachedImageUrl(url) {
    if (!url || typeof url !== "string") return "";
    const trimmed = url.trim();
    if (!trimmed) return "";
    if (trimmed.startsWith("data:") || trimmed.startsWith("blob:")) return trimmed;
    if (imageBlobCache.has(trimmed)) return imageBlobCache.get(trimmed);
    if (pendingImageLoads.has(trimmed)) return pendingImageLoads.get(trimmed);

    const task = (async () => {
      try {
        if (typeof global.caches !== "undefined") {
          const cache = await global.caches.open(IMAGE_CACHE_NAME);
          const cachedRes = await cache.match(trimmed);
          if (cachedRes && cachedRes.ok) {
            const blob = await cachedRes.blob();
            if (blob && blob.size > 0) {
              const objUrl = global.URL.createObjectURL(blob);
              setBlobCacheEntry(trimmed, objUrl);
              return objUrl;
            }
          }

          const fetchMode = trimmed.startsWith("assets/") ? "same-origin" : "cors";
          const netRes = await global.fetch(trimmed, { mode: fetchMode, cache: "force-cache" });
          if (netRes && netRes.ok) {
            const clone = netRes.clone();
            cache.put(trimmed, clone).catch(() => {});
            const blob = await netRes.blob();
            if (blob && blob.size > 0) {
              const objUrl = global.URL.createObjectURL(blob);
              setBlobCacheEntry(trimmed, objUrl);
              return objUrl;
            }
          }
        }
      } catch (e) {}
      return trimmed;
    })();

    pendingImageLoads.set(trimmed, task);
    task.finally(() => {
      pendingImageLoads.delete(trimmed);
    });
    return task;
  }

  async function resolveStorageMediaUrl(folder, idOrUrl) {
    if (!idOrUrl || typeof idOrUrl !== "string") return "";
    const trimmed = idOrUrl.trim();
    if (!trimmed) return "";
    if (isDirectMediaUrl(trimmed)) return trimmed;

    const cacheKey = `${folder}/${trimmed}`;
    if (storageUrlCache.has(cacheKey)) {
      return storageUrlCache.get(cacheKey);
    }

    const persisted = getPersistedStorageUrl(cacheKey);
    if (persisted) {
      const resolvedPromise = Promise.resolve(persisted);
      storageUrlCache.set(cacheKey, resolvedPromise);
      return resolvedPromise;
    }

    if (!global.storage) return "";

    const hasExt = /\.(webp|jpg|jpeg|png|gif|mp4|webm|zip)$/i.test(trimmed);
    const candidates = hasExt
      ? [`${folder}/${trimmed}`]
      : [
          `${folder}/${trimmed}.webp`,
          `${folder}/${trimmed}.jpg`,
          `${folder}/${trimmed}.png`
        ];

    const lookupPromise = (async () => {
      for (const path of candidates) {
        try {
          const url = await global.storage.ref(path).getDownloadURL();
          if (url) {
            savePersistedStorageUrl(cacheKey, url);
            return url;
          }
        } catch (e) {}
      }
      return "";
    })();

    storageUrlCache.set(cacheKey, lookupPromise);
    return lookupPromise;
  }

  function resolveAvatarUrl(avatarIdOrUrl) {
    if (isDirectMediaUrl(avatarIdOrUrl)) {
      return avatarIdOrUrl;
    }
    return "";
  }

  function resolveWallpaperUrl(wallIdOrUrl) {
    if (isDirectMediaUrl(wallIdOrUrl)) {
      return wallIdOrUrl;
    }
    return DEFAULT_THUMBNAIL;
  }

  function applyWallpaperElement(targetEl, wallIdOrUrl, fallbackUrl = "") {
    if (!targetEl) return;
    targetEl.style.backgroundSize = "cover";
    targetEl.style.backgroundPosition = "center center";

    const raw = typeof wallIdOrUrl === "string" ? wallIdOrUrl.trim() : "";
    targetEl.dataset.vvWallpaperKey = raw;

    const setBg = (finalUrl) => {
      if ((targetEl.dataset.vvWallpaperKey || "") !== raw) return;
      targetEl.style.backgroundImage = `url("${finalUrl}")`;
      targetEl.style.backgroundSize = "cover";
      targetEl.style.backgroundPosition = "center center";
    };

    if (!raw) {
      if (fallbackUrl) {
        setBg(imageBlobCache.get(fallbackUrl) || fallbackUrl);
        resolveCachedImageUrl(fallbackUrl).then((cached) => {
          if (cached && cached !== fallbackUrl) setBg(cached);
        });
      } else {
        targetEl.style.backgroundImage = "";
      }
      return;
    }

    if (isDirectMediaUrl(raw)) {
      setBg(imageBlobCache.get(raw) || raw);
      resolveCachedImageUrl(raw).then((cached) => {
        if (cached && cached !== raw) setBg(cached);
      });
      return;
    }

    if (fallbackUrl) {
      setBg(imageBlobCache.get(fallbackUrl) || fallbackUrl);
    }

    resolveStorageMediaUrl("wallpapers", raw).then((resolved) => {
      if (!resolved || (targetEl.dataset.vvWallpaperKey || "") !== raw) return;
      setBg(imageBlobCache.get(resolved) || resolved);
      resolveCachedImageUrl(resolved).then((cached) => {
        if (cached && cached !== resolved) setBg(cached);
      });
    });
  }

  function applyAvatarElement(targetEl, options) {
    if (!targetEl) return;
    const rawDirect = resolveAvatarUrl(options?.avatarUrl || options?.avatar || options?.avatarId);
    const rawId =
      typeof options?.avatarId === "string" && !isDirectMediaUrl(options.avatarId)
        ? options.avatarId.trim()
        : "";
    const name = options?.name || options?.email || "U";
    const color = sanitizeSolidColor(options?.color, name);
    const avatarToken = `${rawDirect}|${rawId}`;
    targetEl.dataset.vvAvatarKey = avatarToken;

    targetEl.style.backgroundImage = "";
    targetEl.style.backgroundColor = color;
    targetEl.textContent = "";

    const setAvatarImg = (finalUrl) => {
      if ((targetEl.dataset.vvAvatarKey || "") !== avatarToken) return;
      targetEl.style.backgroundImage = `url("${finalUrl}")`;
      targetEl.style.backgroundSize = "cover";
      targetEl.style.backgroundPosition = "center center";
      targetEl.textContent = "";
    };

    if (rawDirect) {
      setAvatarImg(imageBlobCache.get(rawDirect) || rawDirect);
      resolveCachedImageUrl(rawDirect).then((cached) => {
        if (cached && cached !== rawDirect) setAvatarImg(cached);
      });
    } else {
      targetEl.textContent = getInitials(name);
      if (rawId) {
        resolveStorageMediaUrl("avatars", rawId).then((resolved) => {
          if (!resolved || (targetEl.dataset.vvAvatarKey || "") !== avatarToken) return;
          setAvatarImg(imageBlobCache.get(resolved) || resolved);
          resolveCachedImageUrl(resolved).then((cached) => {
            if (cached && cached !== resolved) setAvatarImg(cached);
          });
        });
      }
    }
  }

  function formatDate(dateInput) {
    if (!dateInput) return "";
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);
    const docLang = document.documentElement?.lang || "uk";
    const dateLocale = docLang === "de" ? "de-DE" : docLang === "en" ? "en-US" : "uk-UA";
    return d.toLocaleDateString(dateLocale, {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  }

  function formatPlayerTime(seconds) {
    if (!seconds || isNaN(seconds)) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  }

  function safeEncodeBase64(str) {
    try {
      return btoa(unescape(encodeURIComponent(str)));
    } catch (e) {
      return str;
    }
  }

  function safeDecodeBase64(str) {
    try {
      return decodeURIComponent(escape(atob(str)));
    } catch (e) {
      return str;
    }
  }

  global.VV = global.VV || {};
  Object.assign(global.VV, {
    DEFAULT_THUMBNAIL,
    DEFAULT_LOGO,
    SOLID_COLORS,
    pickSolidColor,
    sanitizeSolidColor,
    escapeHtml,
    getInitials,
    resolveStorageMediaUrl,
    resolveCachedImageUrl,
    resolveAvatarUrl,
    resolveWallpaperUrl,
    applyWallpaperElement,
    applyAvatarElement,
    formatDate,
    formatPlayerTime,
    safeEncodeBase64,
    safeDecodeBase64
  });

  global.randomGradient = pickSolidColor;
  global.escapeHtml = escapeHtml;
})(window);
