(function (global) {
  'use strict';

  const { el, icon, applyAvatarElement } = global.VV;

  function createStoryAddItem(onClick) {
    return el(
      "div",
      { className: "story-item", onClick },
      el("div", { className: "story-add-btn" }, icon("add")),
      el("span", { className: "story-name", text: "Додати" })
    );
  }

  function createStoryItem(group, onClick) {
    const avatarEl = el("div", { className: "story-avatar" });
    applyAvatarElement(avatarEl, {
      avatarUrl: group.avatar,
      name: group.name,
      color: group.authorColor
    });

    const countBadge =
      group.items && group.items.length > 1
        ? el("span", { className: "story-count-badge", text: String(group.items.length) })
        : null;

    return el(
      "div",
      { className: "story-item", onClick },
      el("div", { className: "story-avatar-wrap" }, avatarEl, countBadge),
      el("span", { className: "story-name", text: group.name || "Історія" })
    );
  }

  global.VVComponents = global.VVComponents || {};
  Object.assign(global.VVComponents, {
    createStoryAddItem,
    createStoryItem
  });
})(window);
