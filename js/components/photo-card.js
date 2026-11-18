(function (global) {
  'use strict';

  const { el, icon, applyAvatarElement, formatDate, DEFAULT_THUMBNAIL } = global.VV;

  function createPhotoCard(photoKey, post, options = {}) {
    const images =
      Array.isArray(post.images) && post.images.length
        ? post.images
        : post.url
        ? [post.url]
        : [DEFAULT_THUMBNAIL];

    let idx = 0;
    const imgEl = el("img", {
      src: images[0],
      alt: post.title || "Фото",
      loading: "lazy",
      onError: () => {
        imgEl.src = DEFAULT_THUMBNAIL;
      }
    });

    const prevBtn =
      images.length > 1
        ? el(
            "button",
            {
              type: "button",
              className: "carousel-btn prev",
              onClick: (e) => {
                e.stopPropagation();
                idx = (idx - 1 + images.length) % images.length;
                imgEl.src = images[idx];
              }
            },
            icon("chevron_left")
          )
        : null;

    const nextBtn =
      images.length > 1
        ? el(
            "button",
            {
              type: "button",
              className: "carousel-btn next",
              onClick: (e) => {
                e.stopPropagation();
                idx = (idx + 1) % images.length;
                imgEl.src = images[idx];
              }
            },
            icon("chevron_right")
          )
        : null;

    const avatarEl = el("div", { className: "author-avatar" });
    applyAvatarElement(avatarEl, {
      avatarUrl: post.authorAvatar,
      name: post.author,
      color: post.authorColor
    });

    const authorWrap = el(
      "div",
      {
        className: "author-info",
        style: { cursor: post.authorUid ? "pointer" : "default" },
        onClick: () => {
          if (post.authorUid && typeof options.onAuthorClick === "function") {
            options.onAuthorClick(post.authorUid);
          }
        }
      },
      avatarEl,
      el("span", {
        style: { fontSize: "13.5px", fontWeight: "600" },
        text: post.author || "Користувач"
      })
    );

    const deleteBtn = options.isOwner
      ? el(
          "button",
          {
            type: "button",
            className: "btn btn-icon btn-danger",
            style: { width: "30px", height: "30px" },
            onClick: () => {
              if (typeof options.onDelete === "function") options.onDelete(photoKey);
            }
          },
          icon("delete", 16)
        )
      : null;

    return el(
      "article",
      { className: "photo-card" },
      el("div", { className: "photo-carousel" }, imgEl, prevBtn, nextBtn),
      el(
        "div",
        { className: "photo-card-body" },
        el(
          "div",
          {
            style: {
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "8px"
            }
          },
          authorWrap,
          deleteBtn
        ),
        el("h4", { style: { margin: "4px 0 0", fontSize: "15px" }, text: post.title || "" }),
        post.description
          ? el("p", {
              style: { margin: "0", fontSize: "13.5px", color: "var(--text-secondary)" },
              text: post.description
            })
          : null,
        el("div", {
          style: { fontSize: "11.5px", color: "var(--text-muted)" },
          text: formatDate(post.publishDate)
        })
      )
    );
  }

  global.VVComponents = global.VVComponents || {};
  global.VVComponents.createPhotoCard = createPhotoCard;
})(window);
