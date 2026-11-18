(function (global) {
  'use strict';

  const { el, icon, applyAvatarElement, formatDate } = global.VV;

  function createCommentItem(commentData, options = {}) {
    const avatarEl = el("div", { className: "author-avatar" });
    applyAvatarElement(avatarEl, {
      avatarUrl: commentData.authorAvatar,
      name: commentData.commentAuthor,
      color: commentData.authorColor
    });

    const authorWrap = el(
      "div",
      {
        className: "comment-author-wrap",
        dataset: { uid: commentData.authorUid || "" },
        onClick: () => {
          if (commentData.authorUid && typeof options.onAuthorClick === "function") {
            options.onAuthorClick(commentData.authorUid);
          }
        }
      },
      avatarEl,
      el("span", { text: commentData.commentAuthor || "Користувач" }),
      commentData.isPrivate
        ? el("span", { className: "badge private" }, icon("lock", 12), "Приватний")
        : null,
      el("span", {
        style: { fontSize: "11px", color: "var(--text-muted)", fontWeight: "400" },
        text: formatDate(commentData.publishDate)
      })
    );

    const deleteBtn = options.canDelete
      ? el(
          "button",
          {
            type: "button",
            className: "btn btn-icon btn-danger",
            style: { width: "28px", height: "28px" },
            onClick: () => {
              if (typeof options.onDelete === "function") options.onDelete(commentData.key);
            }
          },
          icon("delete", 16)
        )
      : null;

    return el(
      "div",
      { className: "comment-item" },
      el("div", { className: "comment-header" }, authorWrap, deleteBtn),
      el("div", {
        className: "comment-body",
        text: options.displayText !== undefined ? options.displayText : commentData.comment
      })
    );
  }

  global.VVComponents = global.VVComponents || {};
  global.VVComponents.createCommentItem = createCommentItem;
})(window);
