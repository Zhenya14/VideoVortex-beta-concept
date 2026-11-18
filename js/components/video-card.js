(function (global) {
  'use strict';

  const { el, icon, applyAvatarElement, DEFAULT_THUMBNAIL } = global.VV;

  function createVerifiedBadge(badgeVal) {
    if (typeof badgeVal === "string" && (badgeVal.startsWith("http://") || badgeVal.startsWith("https://"))) {
      return el(
        "span",
        { className: "verified-badge verified-badge-img", style: { marginLeft: "4px" } },
        el("img", {
          src: badgeVal,
          alt: "Verified",
          style: { width: "14px", height: "14px", objectFit: "contain", display: "block" }
        })
      );
    }
    return el(
      "span",
      { className: "verified-badge", style: { marginLeft: "4px" } },
      icon("verified", 13)
    );
  }

  function createVideoBadgesRow(video) {
    const badges = [];
    if (video?.nsfw) {
      badges.push(el("span", { className: "badge nsfw" }, icon("explicit", 13), "18+"));
    }
    if (video?.private) {
      badges.push(el("span", { className: "badge private" }, icon("lock", 13), "Приватне"));
    }
    if (video?.domainRestrict) {
      badges.push(el("span", { className: "badge" }, icon("domain_verification", 13), "Домен"));
    }
    if (video?.autoDelete24h) {
      badges.push(el("span", { className: "badge temp" }, icon("schedule", 13), "24 год"));
    }
    if (video?.banduraExtra?.instrument || video?.banduraExtra?.tempo) {
      badges.push(el("span", { className: "badge" }, icon("music_note", 13), "Бандура"));
    }
    return el("div", { className: "badge-row" }, badges);
  }

  function createVideoCard(videoKey, video, handlers = {}) {
    const thumbUrl = video.thumbnail || DEFAULT_THUMBNAIL;
    const authorName = video.author || "Користувач";
    const views = Number(video.views || 0);
    const boosts = Number(video.boostCount || 0);

    const avatarEl = el("div", { className: "author-avatar" });
    applyAvatarElement(avatarEl, {
      avatarUrl: video.authorAvatar,
      name: authorName,
      color: video.authorColor
    });

    const authorP = el("p", { className: "video-author", text: authorName });

    if (video.authorUid && global.db) {
      global.db
        .ref(`publicUsers/${video.authorUid}/verifiedBadge`)
        .once("value")
        .then((snap) => {
          const val = snap?.val();
          if (val) {
            authorP.appendChild(createVerifiedBadge(val));
          }
        })
        .catch(() => null);
    }

    const authorInfo = el(
      "div",
      {
        className: "author-info",
        dataset: { uid: video.authorUid || "" },
        onClick: (e) => {
          if (video.authorUid && typeof handlers.onAuthorClick === "function") {
            e.stopPropagation();
            handlers.onAuthorClick(video.authorUid);
          }
        }
      },
      avatarEl,
      authorP
    );

    const statsEl = el(
      "div",
      { className: "video-stats" },
      el("span", null, icon("visibility", 15), ` ${views}`),
      boosts > 0 ? el("span", null, icon("bolt", 15), ` ${boosts}`) : null
    );

    const imgEl = el("img", {
      className: "video-thumbnail",
      src: thumbUrl,
      alt: video.title || "Відео",
      loading: "lazy",
      onError: () => {
        imgEl.src = DEFAULT_THUMBNAIL;
      }
    });

    return el(
      "article",
      {
        className: "video-item",
        dataset: { key: videoKey },
        onClick: () => {
          if (typeof handlers.onOpen === "function") {
            handlers.onOpen(videoKey, video);
          }
        }
      },
      el("div", { className: "video-thumb-wrap" }, imgEl),
      el(
        "div",
        { className: "video-card-body" },
        el("h3", { className: "video-title", text: video.title || "Без назви" }),
        createVideoBadgesRow(video),
        el("div", { className: "video-meta-row" }, authorInfo, statsEl)
      )
    );
  }

  function createMiniVideoCard(item, onClick) {
    const imgEl = el("img", {
      src: item.thumbnail || DEFAULT_THUMBNAIL,
      alt: item.title || "",
      onError: () => {
        imgEl.src = DEFAULT_THUMBNAIL;
      }
    });

    return el(
      "div",
      { className: "mini-video-card", onClick },
      imgEl,
      el(
        "div",
        { className: "mini-video-card-info" },
        el("div", { className: "mini-video-card-title", text: item.title || "Відео" }),
        el("div", { className: "mini-video-card-sub", text: item.author || "" })
      )
    );
  }

  function createSimilarVideoCard(videoKey, video, onClick) {
    const imgEl = el("img", {
      className: "similar-video-thumb",
      src: video.thumbnail || DEFAULT_THUMBNAIL,
      alt: video.title || "",
      onError: () => {
        imgEl.src = DEFAULT_THUMBNAIL;
      }
    });

    const viewCount = Number(video.views || 0);
    const viewsText =
      global.tPlural?.("views", viewCount, true) || `${viewCount} переглядів`;

    return el(
      "div",
      { className: "similar-video-card", onClick: () => onClick(videoKey, video) },
      imgEl,
      el(
        "div",
        { className: "similar-video-info" },
        el("div", { className: "similar-video-title", text: video.title || "Без назви" }),
        el("div", {
          className: "similar-video-meta",
          text: `${video.author || "Користувач"} • ${viewsText}`
        })
      )
    );
  }

  global.VVComponents = global.VVComponents || {};
  Object.assign(global.VVComponents, {
    createVerifiedBadge,
    createVideoBadgesRow,
    createVideoCard,
    createMiniVideoCard,
    createSimilarVideoCard
  });
})(window);
