(function (global) {
  'use strict';

  const {
    el,
    clear,
    icon,
    applyAvatarElement,
    formatDate,
    formatPlayerTime,
    safeEncodeBase64,
    safeDecodeBase64
  } = global.VV;

  let activeReactionsRef = null;
  let activeReactionsHandler = null;
  let activeCommentsRef = null;
  let activeCommentsHandler = null;
  let activeRenderToken = 0;
  let activeLoadCleanup = null;
  let activeVideoElement = null;

  function detachVideoListeners() {
    activeRenderToken += 1;

    if (activeLoadCleanup) {
      try {
        activeLoadCleanup();
      } catch (e) {}
      activeLoadCleanup = null;
    }

    if (activeVideoElement) {
      try {
        activeVideoElement.pause();
      } catch (e) {}
      activeVideoElement = null;
    }

    if (activeReactionsRef && activeReactionsHandler) {
      try {
        activeReactionsRef.off("value", activeReactionsHandler);
      } catch (e) {}
    }
    activeReactionsRef = null;
    activeReactionsHandler = null;

    if (activeCommentsRef && activeCommentsHandler) {
      try {
        activeCommentsRef.off("value", activeCommentsHandler);
      } catch (e) {}
    }
    activeCommentsRef = null;
    activeCommentsHandler = null;
  }

  global.VVBus?.on("router:change", (payload) => {
    if (payload?.view && payload.view !== "video") {
      detachVideoListeners();
    }
  });

  async function openVideo(videoKey, videoObj, pushState = true) {
    if (!videoKey || !global.db) return;

    let video = videoObj || global.VVState?.allVideosMap?.[videoKey];
    if (!video) {
      const snap = await global.db.ref(`videos/${videoKey}`).once("value").catch(() => null);
      if (!snap || !snap.exists()) {
        global.VV.showToast("Відео не знайдено або було видалено", "error");
        return;
      }
      video = snap.val();
    }

    const currentUser = global.VVState?.currentUser;

    if (video.authorUid && currentUser) {
      const allowed = await global.VV.canInteractWithUser(currentUser.uid, video.authorUid);
      if (!allowed) {
        global.VV.showToast("Доступ до цього відео обмежено через блокування", "error");
        return;
      }
    }

    if (video.nsfw && !global.VVState.isUserAdult()) {
      global.VV.showToast("Це відео доступне лише користувачам 18+", "error");
      return;
    }

    if (video.domainRestrict) {
      if (!currentUser || !currentUser.email || !video.email) {
        global.VV.showToast("Відео доступне лише для корпоративного домену автора", "error");
        return;
      }
      const authorDomain = video.email.split("@")[1];
      const viewerDomain = currentUser.email.split("@")[1];
      if (authorDomain !== viewerDomain && currentUser.uid !== video.authorUid) {
        global.VV.showToast(`Доступно лише для домену @${authorDomain}`, "error");
        return;
      }
    }

    if (currentUser) {
      global.db
        .ref(`users/${currentUser.uid}/history/${videoKey}`)
        .set({
          author: video.author || "",
          title: video.title || "",
          thumbnail: video.thumbnail || "",
          lastPlayed: new Date().toISOString()
        })
        .catch(() => {});
    }

    renderVideoView(videoKey, video);
    global.VVRouter.navigate("video", { videoKey }, pushState);
  }

  function renderVideoView(videoKey, video) {
    detachVideoListeners();
    const renderToken = activeRenderToken;

    const container = document.getElementById("spa-video-content");
    if (!container) return;
    clear(container);

    const currentUser = global.VVState?.currentUser;
    const currentUserData = global.VVState?.currentUserData;
    const isOwner =
      currentUser && (currentUser.uid === video.authorUid || currentUser.email === video.email);
    const views = Number(video.views || 0) + 1;
    global.db
      .ref(`videos/${videoKey}/views`)
      .transaction((v) => (Number(v) || 0) + 1)
      .catch(() => {});

    const videoEl = el("video", {
      id: "spa-video-element",
      playsinline: true,
      preload: "auto",
      poster: video.thumbnail || "",
      src: video.url || ""
    });
    activeVideoElement = videoEl;

    const progressInput = el("input", {
      type: "range",
      className: "player-progress-bar",
      min: "0",
      max: "100",
      value: "0"
    });

    const volumeInput = el("input", {
      type: "range",
      className: "player-volume-bar",
      min: "0",
      max: "1",
      step: "0.05",
      value: "1",
      ariaLabel: "Гучність"
    });

    const speedSteps = [0.5, 0.75, 1, 1.25, 1.5, 2];
    const speedBtn = el("button", {
      type: "button",
      className: "player-speed-btn",
      text: "1x",
      ariaLabel: "Швидкість відтворення",
      ariaExpanded: "false"
    });
    const speedMenu = el("div", { className: "player-speed-menu hidden" });
    const speedOptionBtns = speedSteps.map((rate) => {
      const opt = el("button", {
        type: "button",
        className: `player-speed-option${rate === 1 ? " active" : ""}`,
        text: `${rate}x`
      });
      opt.addEventListener("click", (ev) => {
        ev.stopPropagation();
        videoEl.playbackRate = rate;
        speedBtn.textContent = `${rate}x`;
        speedOptionBtns.forEach((b) => b.classList.toggle("active", b === opt));
        speedMenu.classList.add("hidden");
        speedBtn.classList.remove("active");
        speedBtn.setAttribute("aria-expanded", "false");
        showOsd("speed", `${rate}x`);
        scheduleControlsHide();
      });
      speedMenu.appendChild(opt);
      return opt;
    });
    const speedWrap = el("div", { className: "player-speed-wrap" }, speedBtn, speedMenu);

    const osdBadge = el("div", { className: "player-osd" });
    let osdTimer = null;
    let controlsTimer = null;

    const showOsd = (iconName, labelText) => {
      clear(osdBadge);
      osdBadge.appendChild(icon(iconName, 20));
      osdBadge.appendChild(el("span", { text: labelText }));
      osdBadge.classList.add("visible");
      if (osdTimer) clearTimeout(osdTimer);
      osdTimer = setTimeout(() => {
        osdBadge.classList.remove("visible");
        clear(osdBadge);
      }, 750);
    };

    const playBtn = el("button", { type: "button", className: "player-ctrl-btn" }, icon("play_arrow"));
    const muteBtn = el("button", { type: "button", className: "player-ctrl-btn" }, icon("volume_up"));
    const timeLabel = el("span", { className: "player-time", text: "0:00 / 0:00" });
    const pipBtn = el(
      "button",
      { type: "button", className: "player-ctrl-btn" },
      icon("picture_in_picture_alt")
    );
    const fullBtn = el("button", { type: "button", className: "player-ctrl-btn" }, icon("fullscreen"));

    const loadingOverlay = el(
      "div",
      { className: "player-loading-overlay", role: "status", "aria-live": "polite" },
      video.thumbnail
        ? el("img", {
            className: "player-loading-poster",
            src: video.thumbnail,
            alt: ""
          })
        : null,
      el(
        "div",
        { className: "player-loading-badge" },
        el(
          "div",
          { className: "player-loading-top" },
          el("span", { className: "player-loading-spinner", "aria-hidden": "true" }),
          el("span", {
            className: "player-loading-text",
            dataset: { i18n: "loading-video" },
            text: global.t?.("loading-video") || "Завантаження відео..."
          })
        ),
        el(
          "div",
          { className: "player-loading-track" },
          el("div", { className: "player-loading-fill" })
        )
      )
    );

    const playerStage = el(
      "div",
      { className: "player-wrapper is-loading", tabindex: "0" },
      videoEl,
      loadingOverlay,
      osdBadge,
      el(
        "div",
        { className: "player-controls" },
        el("div", { className: "player-progress-row" }, progressInput),
        el(
          "div",
          { className: "player-buttons-row" },
          el("div", { className: "player-buttons-left" }, playBtn, muteBtn, volumeInput, timeLabel),
          el("div", { className: "player-buttons-right" }, speedWrap, pipBtn, fullBtn)
        )
      )
    );

    const scheduleControlsHide = () => {
      if (controlsTimer) clearTimeout(controlsTimer);
      playerStage.classList.remove("controls-hidden");
      if (!videoEl.paused) {
        controlsTimer = setTimeout(() => {
          if (!videoEl.paused) {
            playerStage.classList.add("controls-hidden");
          }
        }, 2000);
      }
    };

    playerStage.addEventListener("mousemove", scheduleControlsHide);
    playerStage.addEventListener("touchstart", scheduleControlsHide, { passive: true });
    playerStage.addEventListener("mouseleave", () => {
      if (!videoEl.paused) {
        if (controlsTimer) clearTimeout(controlsTimer);
        controlsTimer = setTimeout(() => {
          if (!videoEl.paused) playerStage.classList.add("controls-hidden");
        }, 700);
      }
    });

    const syncPlayIcon = () => {
      clear(playBtn);
      playBtn.appendChild(icon(videoEl.paused ? "play_arrow" : "pause"));
    };

    const syncMuteUI = () => {
      clear(muteBtn);
      const isMutedOrZero = videoEl.muted || videoEl.volume === 0;
      muteBtn.appendChild(icon(isMutedOrZero ? "volume_off" : "volume_up"));
      volumeInput.value = videoEl.muted ? "0" : String(videoEl.volume);
    };

    const togglePlay = () => {
      if (videoEl.paused) {
        videoEl.play().catch(() => {});
        showOsd("play_arrow", "Відтворення");
      } else {
        videoEl.pause();
        showOsd("pause", "Пауза");
      }
    };

    const toggleMute = () => {
      videoEl.muted = !videoEl.muted;
      if (!videoEl.muted && videoEl.volume === 0) {
        videoEl.volume = 0.5;
      }
      syncMuteUI();
      showOsd(videoEl.muted ? "volume_off" : "volume_up", videoEl.muted ? "Без звуку" : "Звук");
    };

    const toggleFullscreen = () => {
      if (!document.fullscreenElement) {
        playerStage.requestFullscreen?.();
        showOsd("fullscreen", "На весь екран");
      } else {
        document.exitFullscreen?.();
        showOsd("fullscreen_exit", "Звичайний режим");
      }
    };

    const togglePip = async () => {
      try {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
          showOsd("picture_in_picture_alt", "Вимкнено PiP");
        } else if (videoEl.requestPictureInPicture) {
          await videoEl.requestPictureInPicture();
          showOsd("picture_in_picture_alt", "Режим PiP");
        }
      } catch (err) {
        global.VV.showToast("Picture-in-Picture не підтримується", "info");
      }
    };

    playBtn.addEventListener("click", () => {
      togglePlay();
      scheduleControlsHide();
    });
    videoEl.addEventListener("click", () => {
      togglePlay();
      scheduleControlsHide();
    });
    videoEl.addEventListener("play", () => {
      syncPlayIcon();
      scheduleControlsHide();
    });
    videoEl.addEventListener("pause", () => {
      syncPlayIcon();
      if (controlsTimer) clearTimeout(controlsTimer);
      playerStage.classList.remove("controls-hidden");
    });
    videoEl.addEventListener("timeupdate", () => {
      if (videoEl.duration) {
        progressInput.value = String((videoEl.currentTime / videoEl.duration) * 100);
      }
      timeLabel.textContent = `${formatPlayerTime(videoEl.currentTime)} / ${formatPlayerTime(videoEl.duration)}`;
    });
    progressInput.addEventListener("input", () => {
      if (videoEl.duration) {
        videoEl.currentTime = (Number(progressInput.value) / 100) * videoEl.duration;
      }
    });
    volumeInput.addEventListener("input", () => {
      const vol = Number(volumeInput.value);
      videoEl.volume = vol;
      videoEl.muted = vol === 0;
      syncMuteUI();
    });
    speedBtn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      const willOpen = speedMenu.classList.contains("hidden");
      speedMenu.classList.toggle("hidden", !willOpen);
      speedBtn.classList.toggle("active", willOpen);
      speedBtn.setAttribute("aria-expanded", willOpen ? "true" : "false");
      if (willOpen && controlsTimer) {
        clearTimeout(controlsTimer);
        playerStage.classList.remove("controls-hidden");
      }
    });

    playerStage.addEventListener("click", () => {
      if (!speedMenu.classList.contains("hidden")) {
        speedMenu.classList.add("hidden");
        speedBtn.classList.remove("active");
        speedBtn.setAttribute("aria-expanded", "false");
      }
    });
    muteBtn.addEventListener("click", toggleMute);
    pipBtn.addEventListener("click", togglePip);
    fullBtn.addEventListener("click", toggleFullscreen);

    const minDelayMs = document.body.classList.contains("reduced-motion") ? 220 : 540;
    let minDelayTimer = null;
    let maxWaitTimer = null;
    let fadeRemoveTimer = null;
    let delayDone = false;
    let mediaDone = videoEl.readyState >= 2;
    let loadCompleted = false;

    const cleanupPreload = () => {
      if (minDelayTimer) clearTimeout(minDelayTimer);
      if (maxWaitTimer) clearTimeout(maxWaitTimer);
      if (fadeRemoveTimer) clearTimeout(fadeRemoveTimer);
      videoEl.removeEventListener("loadeddata", markMediaReady);
      videoEl.removeEventListener("canplay", markMediaReady);
      videoEl.removeEventListener("error", markMediaReady);
    };

    const tryCompleteLoad = () => {
      if (loadCompleted || !delayDone || !mediaDone) return;
      loadCompleted = true;
      cleanupPreload();
      if (activeLoadCleanup === cleanupPreload) {
        activeLoadCleanup = null;
      }

      if (renderToken !== activeRenderToken || !videoEl.isConnected) return;

      playerStage.classList.remove("is-loading");
      loadingOverlay.classList.add("is-fading");
      fadeRemoveTimer = setTimeout(() => {
        loadingOverlay.remove();
      }, 240);

      videoEl.muted = false;
      const shouldAutoplay = localStorage.getItem("vv_autoplay") !== "false";
      if (shouldAutoplay) {
        const playAttempt = videoEl.play();
        if (playAttempt && typeof playAttempt.then === "function") {
          playAttempt
            .then(() => {
              if (renderToken !== activeRenderToken || !videoEl.isConnected) {
                videoEl.pause();
                return;
              }
              syncPlayIcon();
              syncMuteUI();
              scheduleControlsHide();
            })
            .catch(() => {
              videoEl.pause();
              videoEl.muted = false;
              syncPlayIcon();
              syncMuteUI();
              playerStage.classList.remove("controls-hidden");
            });
        }
      } else {
        syncPlayIcon();
        syncMuteUI();
      }
    };

    function markMediaReady() {
      if (mediaDone) return;
      mediaDone = true;
      tryCompleteLoad();
    }

    activeLoadCleanup = cleanupPreload;

    if (!mediaDone) {
      videoEl.addEventListener("loadeddata", markMediaReady);
      videoEl.addEventListener("canplay", markMediaReady);
      videoEl.addEventListener("error", markMediaReady);
      maxWaitTimer = setTimeout(markMediaReady, 1400);
    }

    minDelayTimer = setTimeout(() => {
      delayDone = true;
      tryCompleteLoad();
    }, minDelayMs);

    if (global.__vvVideoKeyHandler) {
      document.removeEventListener("keydown", global.__vvVideoKeyHandler);
    }

    global.__vvVideoKeyHandler = (e) => {
      if (global.VVRouter?.getCurrentView() !== "video") return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const active = document.activeElement;
      const tag = active ? active.tagName : "";
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        active?.isContentEditable
      ) {
        return;
      }

      const key = (e.key || "").toLowerCase();

      if (e.code === "Space" || key === "k") {
        e.preventDefault();
        togglePlay();
      } else if (e.key === "ArrowLeft" || key === "j") {
        e.preventDefault();
        const delta = key === "j" ? 10 : 5;
        videoEl.currentTime = Math.max(0, videoEl.currentTime - delta);
        showOsd(delta === 10 ? "replay_10" : "replay_5", `-${delta} с`);
      } else if (e.key === "ArrowRight" || key === "l") {
        e.preventDefault();
        const delta = key === "l" ? 10 : 5;
        const maxTime = videoEl.duration || videoEl.currentTime + delta;
        videoEl.currentTime = Math.min(maxTime, videoEl.currentTime + delta);
        showOsd(delta === 10 ? "forward_10" : "forward_5", `+${delta} с`);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        videoEl.muted = false;
        videoEl.volume = Math.min(1, Math.round((videoEl.volume + 0.1) * 100) / 100);
        syncMuteUI();
        showOsd("volume_up", `${Math.round(videoEl.volume * 100)}%`);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        videoEl.volume = Math.max(0, Math.round((videoEl.volume - 0.1) * 100) / 100);
        if (videoEl.volume === 0) videoEl.muted = true;
        syncMuteUI();
        showOsd(videoEl.volume === 0 ? "volume_off" : "volume_down", `${Math.round(videoEl.volume * 100)}%`);
      } else if (key === "m") {
        e.preventDefault();
        toggleMute();
      } else if (key === "f") {
        e.preventDefault();
        toggleFullscreen();
      } else if (key === "p") {
        e.preventDefault();
        togglePip();
      } else if (key >= "0" && key <= "9" && videoEl.duration) {
        e.preventDefault();
        const pct = Number(key) * 10;
        videoEl.currentTime = (pct / 100) * videoEl.duration;
        showOsd("fast_forward", `${pct}%`);
      }
    };

    document.addEventListener("keydown", global.__vvVideoKeyHandler);

    const authorAvatarEl = el("div", { className: "avatar-circle" });
    applyAvatarElement(authorAvatarEl, {
      avatarUrl: video.authorAvatar,
      name: video.author,
      color: video.authorColor
    });

    const titleHeading = el("h1", {
      className: "video-header-title",
      text: video.title || "Без назви"
    });

    const isAuthorized = Boolean(global.VVState?.isAuthorized?.());
    const likeCountEl = el("span", { text: "0" });
    const dislikeCountEl = el("span", { text: "0" });
    const boostCountEl = el("span", { text: String(Number(video.boostCount || 0)) });

    const likeBtn = el(
      "button",
      { type: "button", className: "reaction-pill-btn reaction-like-btn", "aria-label": "Подобається" },
      icon("thumb_up"),
      likeCountEl
    );
    const dislikeBtn = el(
      "button",
      { type: "button", className: "reaction-pill-btn reaction-dislike-btn", "aria-label": "Не подобається" },
      icon("thumb_down"),
      dislikeCountEl
    );
    const reactionGroup = el(
      "div",
      { className: "reaction-pill-group" },
      likeBtn,
      el("span", { className: "reaction-pill-divider", "aria-hidden": "true" }),
      dislikeBtn
    );
    const boostBtn = isAuthorized
      ? el("button", { type: "button", className: "action-chip" }, icon("bolt"), boostCountEl)
      : null;
    const saveBtn = isAuthorized
      ? el("button", { type: "button", className: "action-chip" }, icon("bookmark"), el("span", { dataset: { i18n: "saveBtn" }, text: global.t?.("saveBtn") || "Зберегти" }))
      : null;
    const repostBtn = isAuthorized
      ? el("button", { type: "button", className: "action-chip" }, icon("repeat"), el("span", { dataset: { i18n: "repostBtn" }, text: global.t?.("repostBtn") || "Репост" }))
      : null;
    const shareBtn = el("button", { type: "button", className: "action-chip" }, icon("share"), el("span", { dataset: { i18n: "shareBtn" }, text: global.t?.("shareBtn") || "Поділитися" }));
    const ttsBtn = el("button", { type: "button", className: "action-chip" }, icon("record_voice_over"), el("span", { dataset: { i18n: "ttsBtn" }, text: global.t?.("ttsBtn") || "Озвучити" }));

    const subLabel = el("span", {
      text: global.VVState?.subscribedUids?.has(video.authorUid)
        ? global.t?.("subscribed") || "Ви підписані"
        : global.t?.("subscribe") || "Підписатися"
    });
    const channelSubscribeBtn =
      isAuthorized && video.authorUid && currentUser && currentUser.uid !== video.authorUid
        ? el(
            "button",
            {
              type: "button",
              className: global.VVState?.subscribedUids?.has(video.authorUid) ? "btn" : "btn btn-primary",
              style: { padding: "6px 14px", fontSize: "13px" },
              onClick: async () => {
                await global.VVState.toggleSubscribe(video.authorUid, { name: video.author });
                const nowSub = global.VVState.subscribedUids.has(video.authorUid);
                channelSubscribeBtn.className = nowSub ? "btn" : "btn btn-primary";
                subLabel.textContent = nowSub
                  ? global.t?.("subscribed") || "Ви підписані"
                  : global.t?.("subscribe") || "Підписатися";
              }
            },
            subLabel
          )
        : null;

    const editBtn = isOwner
      ? el(
          "button",
          {
            type: "button",
            className: "action-chip",
            onClick: async () => {
              const newTitle = await global.VV.showPromptModal({
                title: "Редагувати назву відео",
                defaultValue: video.title || ""
              });
              if (newTitle && newTitle.trim()) {
                await global.db.ref(`videos/${videoKey}/title`).set(newTitle.trim());
                video.title = newTitle.trim();
                titleHeading.textContent = newTitle.trim();
                global.VV.showToast("Назву оновлено", "success");
              }
            }
          },
          icon("edit"),
          el("span", { text: "Редагувати" })
        )
      : null;

    const deleteBtn = isOwner
      ? el(
          "button",
          {
            type: "button",
            className: "action-chip btn-danger",
            onClick: async () => {
              const ok = await global.VV.showConfirmModal({
                title: "Видалення відео",
                message: "Ви дійсно хочете назавжди видалити це відео?",
                confirmText: "Видалити",
                danger: true
              });
              if (!ok) return;
              await global.db.ref(`videos/${videoKey}`).remove();
              global.VV.showToast("Відео видалено", "success");
              global.VVRouter.navigate("home");
            }
          },
          icon("delete"),
          el("span", { text: "Видалити" })
        )
      : null;

    const commentInput = el("textarea", {
      placeholder: "Напишіть коментар...",
      required: true
    });

    const privateCommentCheck = el("input", { type: "checkbox", className: "vv-checkbox-input" });
    const commentsList = el("div");
    const similarList = el("div", { className: "similar-videos-list" });

    const commentFeedbackSlot = global.VVFeedback?.createSlot("video-comments");

    const commentFormNode = isAuthorized
      ? el(
          "form",
          {
            className: "comment-form-row",
            style: { marginBottom: "14px" },
            onSubmit: async (e) => {
              e.preventDefault();
              if (!global.VVState.canUserPost()) return;
              const rawText = commentInput.value.trim();
              if (!rawText) {
                global.VVFeedback?.notify({
                  scope: "video-comments",
                  type: "error",
                  message: "Введіть текст коментаря",
                  fields: [commentInput]
                });
                return;
              }
              try {
                const isPrivate = Boolean(privateCommentCheck.checked);
                const storedComment = isPrivate ? safeEncodeBase64(rawText) : rawText;
                const authorName =
                  currentUserData?.name || currentUser.email?.split("@")[0] || "Користувач";

                await global.db.ref("comments").push({
                  videoKey,
                  comment: storedComment,
                  isPrivate,
                  videoOwner: video.email || "",
                  email: currentUser.email || "",
                  commentAuthor: authorName,
                  authorUid: currentUser.uid,
                  authorAvatar: global.VV.resolveAvatarUrl(
                    currentUserData?.avatarId || currentUserData?.avatar
                  ),
                  authorColor: global.VV.sanitizeSolidColor(currentUserData?.color, authorName),
                  publishDate: new Date().toISOString()
                });
                commentInput.value = "";
                privateCommentCheck.checked = false;
                global.VVFeedback?.clear("video-comments");
              } catch (err) {
                global.VVFeedback?.notify({
                  scope: "video-comments",
                  type: "error",
                  message: "Не вдалося надіслати коментар: " + err.message
                });
              }
            }
          },
          commentInput,
          el(
            "div",
            {
              style: {
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "10px"
              }
            },
            el(
              "label",
              { className: "vv-checkbox-label" },
              privateCommentCheck,
              el("span", { className: "vv-checkbox-box", "aria-hidden": "true" }, icon("check")),
              el("span", { text: "Приватний коментар (лише для автора відео)" })
            ),
            el(
              "button",
              { type: "submit", className: "btn btn-primary" },
              icon("send"),
              el("span", { text: "Надіслати" })
            )
          )
        )
      : el(
          "div",
          { style: { marginBottom: "14px" } },
          el(
            "button",
            {
              type: "button",
              className: "btn",
              onClick: () => global.VVRouter.navigate("auth")
            },
            icon("login"),
            el("span", {
              dataset: { i18n: "signin-to-comment" },
              text: global.t?.("signin-to-comment") || "Увійдіть, щоб залишити коментар"
            })
          )
        );

    const commentSectionBody = video.disabledComments
      ? global.VVComponents.createEmptyNotice("Коментарі вимкнено автором.")
      : el("div", null, commentFormNode, commentsList);

    const shell = el(
      "div",
      { className: "video-page-shell" },
      el(
        "div",
        { className: "video-main-col" },
        el(
          "div",
          { style: { display: "flex", alignItems: "center", justifyContent: "space-between" } },
          el(
            "button",
            {
              type: "button",
              className: "btn",
              onClick: () => global.VVRouter.navigate("home")
            },
            icon("arrow_back"),
            el("span", { dataset: { i18n: "back-to-feed" }, text: global.t?.("back-to-feed") || "Назад до стрічки" })
          )
        ),
        playerStage,
        el(
          "div",
          { className: "video-details-card" },
          titleHeading,
          global.VVComponents.createVideoBadgesRow(video),
          el(
            "div",
            { className: "video-channel-bar" },
            el(
              "div",
              { style: { display: "flex", alignItems: "center", flexWrap: "wrap", gap: "12px" } },
              el(
                "div",
                {
                  className: "channel-author-link",
                  onClick: () => {
                    if (video.authorUid) global.VVViews.openProfile(video.authorUid);
                  }
                },
                authorAvatarEl,
                el(
                  "div",
                  null,
                  el("div", {
                    style: { fontWeight: "600", fontSize: "14.5px" },
                    text: video.author || "Користувач"
                  }),
                  (() => {
                    const metaEl = el("div", {
                      style: { fontSize: "12px", color: "var(--text-secondary)" },
                      text: `${formatDate(video.publishDate)} • ${global.tPlural?.("views", views, true) || `${views} переглядів`}`
                    });
                    global.VVBus?.on("i18n:updated", () => {
                      if (metaEl.isConnected) {
                        metaEl.textContent = `${formatDate(video.publishDate)} • ${global.tPlural?.("views", views, true) || `${views} переглядів`}`;
                      }
                    });
                    return metaEl;
                  })()
                )
              ),
              channelSubscribeBtn
            ),
            el(
              "div",
              { className: "video-actions-bar" },
              reactionGroup,
              boostBtn,
              saveBtn,
              repostBtn,
              shareBtn,
              ttsBtn,
              editBtn,
              deleteBtn
            )
          ),
          video.description
            ? el("div", { className: "video-description-box", text: video.description })
            : null
        ),
        el(
          "div",
          { className: "comments-card" },
          el("h3", { className: "section-title" }, icon("forum"), el("span", { dataset: { i18n: "comments-title" }, text: global.t?.("comments-title") || "Коментарі" })),
          commentFeedbackSlot,
          commentSectionBody
        )
      ),
      el(
        "aside",
        { className: "video-side-col" },
        el(
          "h3",
          { className: "section-title" },
          icon("smart_display"),
          el("span", { dataset: { i18n: "similar-title" }, text: global.t?.("similar-title") || "Схожі відео" })
        ),
        similarList
      )
    );

    container.appendChild(shell);

    activeReactionsRef = global.db.ref(`reactions/${videoKey}`);
    activeReactionsHandler = (snap) => {
      let likes = 0;
      let dislikes = 0;
      let myReaction = null;
      snap.forEach((child) => {
        const val = child.val();
        if (val === "like") likes++;
        if (val === "dislike") dislikes++;
        if (currentUser && child.key === currentUser.uid) myReaction = val;
      });
      likeCountEl.textContent = String(likes);
      dislikeCountEl.textContent = String(dislikes);
      likeBtn.classList.toggle("active", myReaction === "like");
      dislikeBtn.classList.toggle("active", myReaction === "dislike");
    };
    activeReactionsRef.on("value", activeReactionsHandler, () => {});

    likeBtn.addEventListener("click", () => {
      if (!global.VVState.canUserPost()) return;
      const ref = global.db.ref(`reactions/${videoKey}/${currentUser.uid}`);
      ref
        .once("value")
        .then((snap) => ref.set(snap.val() === "like" ? null : "like"))
        .catch(() => {});
    });

    dislikeBtn.addEventListener("click", () => {
      if (!global.VVState.canUserPost()) return;
      const ref = global.db.ref(`reactions/${videoKey}/${currentUser.uid}`);
      ref
        .once("value")
        .then((snap) => ref.set(snap.val() === "dislike" ? null : "dislike"))
        .catch(() => {});
    });

    boostBtn?.addEventListener("click", async () => {
      if (!global.VVState.canUserPost()) return;
      try {
        const userBoostRef = global.db.ref(`boosts/${videoKey}/${currentUser.uid}`);
        const snap = await userBoostRef.once("value");
        const currentCount = snap.val()?.count || 0;
        if (currentCount >= 3) {
          global.VV.showToast("Максимум 3 бусти від одного користувача", "info");
          return;
        }
        await userBoostRef.set({ count: currentCount + 1, updatedAt: Date.now() });
        const totalBoosts = Number(video.boostCount || 0) + 1;
        await global.db.ref(`videos/${videoKey}/boostCount`).set(totalBoosts);
        video.boostCount = totalBoosts;
        boostCountEl.textContent = String(totalBoosts);
        global.VV.showToast("Відео піднято бустом!", "success");
      } catch (err) {
        global.VV.showToast("Не вдалося додати буст", "error");
      }
    });

    saveBtn?.addEventListener("click", async () => {
      if (!currentUser) return global.VV.showToast("Увійдіть в акаунт", "error");
      try {
        await global.db.ref(`saveVideos/${currentUser.uid}`).push({
          videoKey,
          title: video.title || "",
          author: video.author || "",
          thumbnail: video.thumbnail || "",
          createdAt: Date.now()
        });
        global.VV.showToast("Відео збережено у вашу бібліотеку", "success");
      } catch (err) {
        global.VV.showToast("Не вдалося зберегти відео", "error");
      }
    });

    repostBtn?.addEventListener("click", async () => {
      if (!global.VVState.canUserPost()) return;
      try {
        await global.db.ref(`reposts/${currentUser.uid}`).push({
          videoKey,
          title: video.title || "",
          thumbnail: video.thumbnail || "",
          createdAt: Date.now()
        });
        global.VV.showToast("Репост додано у ваш профіль", "success");
      } catch (err) {
        global.VV.showToast("Не вдалося додати репост", "error");
      }
    });

    shareBtn.addEventListener("click", () => {
      const url = new URL(global.location.href);
      url.search = `?video=${encodeURIComponent(videoKey)}`;
      if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        navigator.clipboard
          .writeText(url.toString())
          .then(() => {
            global.VV.showToast("Посилання скопійовано в буфер обміну", "success");
          })
          .catch(() => {
            global.VV.showToast("Не вдалося автоматично скопіювати посилання", "info");
          });
      } else {
        global.VV.showToast("Копіювання в буфер недоступне в цьому браузері", "info");
      }
    });

    ttsBtn.addEventListener("click", () => {
      if (!("speechSynthesis" in global)) {
        return global.VV.showToast("Озвучення не підтримується браузером", "error");
      }
      global.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(video.description || video.title || "");
      utter.lang = "uk-UA";
      global.speechSynthesis.speak(utter);
    });

    if (!video.disabledComments) {
      activeCommentsRef = global.db
        .ref("comments")
        .orderByChild("videoKey")
        .equalTo(videoKey);
      activeCommentsHandler = (snap) => {
        clear(commentsList);
        const items = [];
        snap.forEach((child) => items.push({ key: child.key, ...child.val() }));

        items.reverse().forEach((c) => {
          if (c.isPrivate) {
            const canSeePrivate =
              currentUser &&
              (currentUser.uid === c.authorUid ||
                currentUser.uid === video.authorUid ||
                currentUser.email === video.email);
            if (!canSeePrivate) return;
          }

          const displayText = c.isPrivate ? safeDecodeBase64(c.comment) : c.comment;
          const canDelete =
            currentUser &&
            (currentUser.uid === c.authorUid || currentUser.uid === video.authorUid);

          commentsList.appendChild(
            global.VVComponents.createCommentItem(c, {
              displayText,
              canDelete,
              onAuthorClick: (uid) => global.VVViews.openProfile(uid),
              onDelete: (key) => global.db.ref(`comments/${key}`).remove().catch(() => {})
            })
          );
        });
      };
      activeCommentsRef.on("value", activeCommentsHandler, () => {});
    }

   
const allVideosMap = global.VVState?.allVideosMap || {};


async function loadSimilarVideos() {
  const entries = Object.entries(
    global.VVState?.allVideosMap || {}
  ).filter(([key, video]) => {
    return key !== videoKey && !video.private;
  });

  const visibleVideos = [];

  for (const [key, video] of entries) {
    if (renderToken !== activeRenderToken) return;
    if (!similarList.isConnected) return;

    if (video.authorUid && currentUser) {
      let allowed = false;

      try {
        allowed = await global.VV.canInteractWithUser(
          currentUser.uid,
          video.authorUid
        );
      } catch (error) {
        console.error("Помилка перевірки автора:", error);
      }

      if (renderToken !== activeRenderToken) return;

      if (!allowed) continue;
    }

    visibleVideos.push([key, video]);

    if (visibleVideos.length >= 8) break;
  }

  if (renderToken !== activeRenderToken) return;
  if (!similarList.isConnected) return;

  visibleVideos.forEach(([key, video]) => {
    similarList.appendChild(
      global.VVComponents.createSimilarVideoCard(
        key,
        video,
        (targetKey, targetVideo) => {
          openVideo(targetKey, targetVideo);
        }
      )
    );
  });
}

loadSimilarVideos();
  }

  global.VVViews = global.VVViews || {};
  global.VVViews.openVideo = openVideo;
  global.openVideoItem = openVideo;
})(window);
