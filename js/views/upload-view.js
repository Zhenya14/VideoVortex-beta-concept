(function (global) {
  'use strict';

  
async function generateVideoDescription(button) {
  const titleInput = document.getElementById("video-title-input");
  const descInput = document.getElementById("video-desc-input");

  const title = titleInput?.value.trim();

  if (!title) {
    global.VVFeedback.notify({
      scope: "upload-video",
      type: "error",
      message: "Спочатку введіть назву відео!",
      fields: ["#video-title-input"]
    });
    return;
  }

  const originalHTML = button.innerHTML;

  try {
    button.disabled = true;

    global.VVFeedback.notify({
      scope: "upload-video",
      type: "loading",
      message: "ШІ генерує опис відео...",
      dismissible: false,
      autoHideMs: 0
    });

    button.innerHTML = "⏳ Генерується...";

    const response = await fetch(
      "https://us-central1-videovortex-235cd.cloudfunctions.net/generateDescription",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          text: title,
          language: "uk"
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Помилка сервера");
    }

    if (!data?.result) {
      throw new Error("ШІ не повернув опис");
    }

    descInput.value = data.result;

    descInput.dispatchEvent(
      new Event("input", { bubbles: true })
    );

    global.VVFeedback.notify({
      scope: "upload-video",
      type: "success",
      message: "Опис успішно згенеровано!"
    });

  } catch (error) {
    console.error("VideoVortex AI:", error);

    global.VVFeedback.notify({
      scope: "upload-video",
      type: "error",
      message: "Помилка генерації: " + error.message
    });

  } finally {
    button.disabled = false;
    button.innerHTML = originalHTML;
  }
}

  function initUploadView() {
const uploadView = document.getElementById("upload-view");

if (uploadView && !uploadView.dataset.descriptionHandler) {
  uploadView.dataset.descriptionHandler = "true";

  uploadView.addEventListener("click", (e) => {
    const button = e.target.closest(".generate-description");

    if (!button || !uploadView.contains(button)) return;

    e.preventDefault();
    generateVideoDescription(button);
  });
}
    const banduraToggle = document.getElementById("video-bandura-toggle");
    const banduraFields = document.getElementById("bandura-fields-box");
    if (banduraToggle && banduraFields) {
      banduraToggle.addEventListener("change", () => {
        banduraFields.classList.toggle("hidden", !banduraToggle.checked);
      });
    }

    document.getElementById("video-upload-form")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!global.VVState.canUserPost()) return;

      const currentUser = global.VVState.currentUser;
      const currentUserData = global.VVState.currentUserData;
      const title = document.getElementById("video-title-input")?.value.trim();
      const desc = document.getElementById("video-desc-input")?.value.trim() || "";
      const videoFile = document.getElementById("video-file-input")?.files[0];
      const thumbFile = document.getElementById("thumb-file-input")?.files[0];
      const channelChoice = document.getElementById("upload-channel-select")?.value || "main";

      if (!title || !videoFile || !thumbFile) {
        global.VVFeedback.notify({
          scope: "upload-video",
          type: "error",
          message: "Виберіть відео, обкладинку та введіть назву",
          fields: [
            !title ? "#video-title-input" : null,
            !videoFile ? "#video-file-input" : null,
            !thumbFile ? "#thumb-file-input" : null
          ].filter(Boolean)
        });
        return;
      }

      const submitBtn = e.target.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;
      global.VVFeedback.notify({
        scope: "upload-video",
        type: "loading",
        message: "Завантаження відео розпочато...",
        dismissible: false,
        autoHideMs: 0
      });

      try {
        const ts = Date.now();
        const vRef = global.storage.ref(`videos/${currentUser.uid}_${ts}_${videoFile.name}`);
        const tRef = global.storage.ref(`thumbnails/${currentUser.uid}_${ts}_${thumbFile.name}`);

        await Promise.all([vRef.put(videoFile), tRef.put(thumbFile)]);
        const [videoUrl, thumbUrl] = await Promise.all([
          vRef.getDownloadURL(),
          tRef.getDownloadURL()
        ]);

        const isSecond =
          channelChoice === "second" && currentUserData?.channels?.second?.name;
        const authorName = isSecond
          ? currentUserData.channels.second.name
          : currentUserData?.name || currentUser.email?.split("@")[0] || "Користувач";

        const autoDelete24h = Boolean(
          document.getElementById("video-autodelete-check")?.checked
        );

        let banduraExtra = null;
        if (banduraToggle?.checked) {
          banduraExtra = {
            instrument: document.getElementById("bandura-instrument")?.value.trim() || "",
            tempo: document.getElementById("bandura-tempo")?.value.trim() || ""
          };
        }

        await global.db.ref("videos").push({
          title,
          description: desc,
          url: videoUrl,
          thumbnail: thumbUrl,
          author: authorName,
          authorUid: currentUser.uid,
          authorAvatar: global.VV.resolveAvatarUrl(
            currentUserData?.avatar || currentUserData?.avatarId
          ),
          authorColor: global.VV.sanitizeSolidColor(currentUserData?.color, authorName),
          email: currentUser.email || "",
          views: 0,
          boostCount: 0,
          private: Boolean(document.getElementById("video-private-check")?.checked),
          nsfw: Boolean(document.getElementById("video-nsfw-check")?.checked),
          domainRestrict: Boolean(document.getElementById("video-domain-check")?.checked),
          disabledComments: Boolean(document.getElementById("video-nocomments-check")?.checked),
          autoDelete24h,
          expiresAt: autoDelete24h ? Date.now() + 86400000 : null,
          banduraExtra,
          publishDate: new Date().toISOString()
        });

        e.target.reset();
        banduraFields?.classList.add("hidden");
        global.VVFeedback.clear("upload-video");
        global.VV.showToast("Відео успішно опубліковано!", "success");
        global.VVRouter.navigate("home");
      } catch (err) {
        global.VVFeedback.notify({
          scope: "upload-video",
          type: "error",
          message: "Помилка завантаження: " + err.message
        });
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });

    document.getElementById("photo-upload-form")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!global.VVState.canUserPost()) return;

      const currentUser = global.VVState.currentUser;
      const currentUserData = global.VVState.currentUserData;
      const title = document.getElementById("photo-title-input")?.value.trim();
      const desc = document.getElementById("photo-desc-input")?.value.trim() || "";
      const files = document.getElementById("photo-files-input")?.files;

      if (!title || !files || !files.length) {
        global.VVFeedback.notify({
          scope: "upload-photo",
          type: "error",
          message: "Додайте заголовок та хоча б одне фото",
          fields: [
            !title ? "#photo-title-input" : null,
            !files || !files.length ? "#photo-files-input" : null
          ].filter(Boolean)
        });
        return;
      }

      const submitBtn = e.target.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;
      global.VVFeedback.notify({
        scope: "upload-photo",
        type: "loading",
        message: "Публікація фото-допису...",
        dismissible: false,
        autoHideMs: 0
      });

      try {
        const urls = [];
        for (let i = 0; i < Math.min(files.length, 10); i++) {
          const f = files[i];
          const ref = global.storage.ref(
            `photos/${currentUser.uid}_${Date.now()}_${i}_${f.name}`
          );
          await ref.put(f);
          urls.push(await ref.getDownloadURL());
        }

        const authorName =
          currentUserData?.name || currentUser.email?.split("@")[0] || "Користувач";
        await global.db.ref("photos").push({
          title,
          description: desc,
          images: urls,
          url: urls[0],
          author: authorName,
          authorUid: currentUser.uid,
          authorAvatar: global.VV.resolveAvatarUrl(
            currentUserData?.avatar || currentUserData?.avatarId
          ),
          authorColor: global.VV.sanitizeSolidColor(currentUserData?.color, authorName),
          email: currentUser.email || "",
          publishDate: new Date().toISOString(),
          views: 0
        });

        e.target.reset();
        global.VVFeedback.clear("upload-photo");
        global.VV.showToast("Фото-допис опубліковано!", "success");
        global.VVRouter.navigate("photos");
      } catch (err) {
        global.VVFeedback.notify({
          scope: "upload-photo",
          type: "error",
          message: "Помилка: " + err.message
        });
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });

    document.getElementById("archive-upload-form")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!global.VVState.canUserPost()) return;
      const currentUser = global.VVState.currentUser;
      const file = document.getElementById("archive-file-input")?.files[0];
      if (!file) {
        global.VVFeedback.notify({
          scope: "archive",
          type: "error",
          message: "Виберіть ZIP-файл",
          fields: ["#archive-file-input"]
        });
        return;
      }
      global.VVFeedback.notify({
        scope: "archive",
        type: "loading",
        message: "Завантаження ZIP-архіву...",
        dismissible: false,
        autoHideMs: 0
      });
      try {
        const ref = global.storage.ref(
          `archives/${currentUser.uid}/${Date.now()}_${file.name}`
        );
        await ref.put(file);
        const url = await ref.getDownloadURL();
        const pushRef = global.db.ref(`users/${currentUser.uid}/archive`).push();
        await pushRef.set({
          id: pushRef.key,
          name: file.name,
          url,
          uid: currentUser.uid,
          createdAt: Date.now()
        });
        e.target.reset();
        global.VVFeedback.notify({
          scope: "archive",
          type: "success",
          message: "ZIP-архів завантажено!"
        });
      } catch (err) {
        global.VVFeedback.notify({
          scope: "archive",
          type: "error",
          message: "Помилка завантаження архіву: " + err.message
        });
      }
    });

    document.getElementById("story-upload-form")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!global.VVState.canUserPost()) return;
      const currentUser = global.VVState.currentUser;
      const currentUserData = global.VVState.currentUserData;
      const file = document.getElementById("story-file-input")?.files[0];
      const caption = document.getElementById("story-caption-input")?.value.trim() || "";
      if (!file) {
        global.VVFeedback.notify({
          scope: "story-upload",
          type: "error",
          message: "Виберіть фото або відео для історії",
          fields: ["#story-file-input"]
        });
        return;
      }
      global.VVFeedback.notify({
        scope: "story-upload",
        type: "loading",
        message: "Публікація історії...",
        dismissible: false,
        autoHideMs: 0
      });
      try {
        const ref = global.storage.ref(
          `stories/${currentUser.uid}_${Date.now()}_${file.name}`
        );
        await ref.put(file);
        const url = await ref.getDownloadURL();
        const authorName =
          currentUserData?.name || currentUser.email?.split("@")[0] || "Користувач";
        await global.db.ref("stories").push({
          uid: currentUser.uid,
          name: authorName,
          avatar: global.VV.resolveAvatarUrl(
            currentUserData?.avatar || currentUserData?.avatarId
          ),
          authorColor: global.VV.sanitizeSolidColor(currentUserData?.color, authorName),
          url,
          description: caption,
          type: file.type.startsWith("video") ? "video" : "image",
          createdAt: Date.now(),
          expiresAt: Date.now() + 86400000
        });
        e.target.reset();
        global.VVFeedback.clear("story-upload");
        document.getElementById("story-upload-modal")?.classList.add("hidden");
        global.VV.showToast("Історію додано на 24 години!", "success");
      } catch (err) {
        global.VVFeedback.notify({
          scope: "story-upload",
          type: "error",
          message: "Помилка: " + err.message
        });
      }
    });

    document.getElementById("close-story-upload-modal")?.addEventListener("click", () => {
      global.VVFeedback.clear("story-upload");
      document.getElementById("story-upload-modal")?.classList.add("hidden");
    });

    document.addEventListener("paste", (e) => {
      const modal = document.getElementById("story-upload-modal");
      const storyInput = document.getElementById("story-file-input");
      if (!modal || modal.classList.contains("hidden") || !storyInput) return;

      const clipboard = e.clipboardData;
      if (!clipboard) return;

      let imageFile = null;
      if (clipboard.items && clipboard.items.length) {
        for (const item of Array.from(clipboard.items)) {
          if (item.kind === "file" && item.type && item.type.startsWith("image/")) {
            imageFile = item.getAsFile();
            if (imageFile) break;
          }
        }
      }

      if (!imageFile && clipboard.files && clipboard.files.length) {
        imageFile =
          Array.from(clipboard.files).find((f) => f.type && f.type.startsWith("image/")) || null;
      }

      if (!imageFile) return;

      e.preventDefault();
      const mimeExt = (imageFile.type?.split("/")[1] || "png").replace(/[^a-z0-9]/gi, "") || "png";
      const fileName = `clipboard_${Date.now()}.${mimeExt}`;
      const normalizedFile =
        typeof File === "function"
          ? new File([imageFile], fileName, {
              type: imageFile.type || `image/${mimeExt}`,
              lastModified: Date.now()
            })
          : imageFile;

      if (typeof DataTransfer !== "undefined") {
        const dt = new DataTransfer();
        dt.items.add(normalizedFile);
        storyInput.files = dt.files;
        storyInput.dispatchEvent(new Event("input", { bubbles: true }));
        storyInput.dispatchEvent(new Event("change", { bubbles: true }));
        global.VVComponents?.syncFileInput?.(storyInput);
        const addedMsg = global.t?.("story-paste-added");
        global.VV.showToast(
          addedMsg && addedMsg !== "story-paste-added"
            ? addedMsg
            : "Зображення вставлено з буфера обміну",
          "success"
        );
      }
    });
  }

  global.VVViews = global.VVViews || {};
  global.VVViews.initUploadView = initUploadView;
})(window);
