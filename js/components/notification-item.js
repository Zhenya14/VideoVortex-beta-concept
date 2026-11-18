(function (global) {
  'use strict';

  const { el, icon, formatDate } = global.VV;

  function createNotificationItem(notif, options = {}) {
    return el(
      "div",
      {
        className: `notification-item ${notif.read ? "" : "unread"}`,
        onClick: () => {
          if (typeof options.onOpen === "function") options.onOpen(notif);
        }
      },
      el(
        "div",
        null,
        el("div", { style: { fontWeight: "500" }, text: notif.message || "Нове сповіщення" }),
        el("div", {
          style: { fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" },
          text: formatDate(notif.createdAt)
        })
      ),
      el(
        "button",
        {
          type: "button",
          className: "btn btn-icon",
          style: { width: "26px", height: "26px" },
          onClick: (e) => {
            e.stopPropagation();
            if (typeof options.onDelete === "function") options.onDelete(notif.id);
          }
        },
        icon("close", 15)
      )
    );
  }

  global.VVComponents = global.VVComponents || {};
  global.VVComponents.createNotificationItem = createNotificationItem;
})(window);
