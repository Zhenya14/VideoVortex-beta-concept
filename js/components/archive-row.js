(function (global) {
  'use strict';

  const { el, icon, formatDate } = global.VV;

  function createArchiveRow(arch, options = {}) {
    const downloadLink = el(
      "a",
      {
        href: arch.url || "#",
        target: "_blank",
        rel: "noopener",
        className: "btn",
        style: { padding: "6px 10px", fontSize: "12px" }
      },
      icon("download", 15),
      " Завантажити"
    );

    const deleteBtn = options.canDelete
      ? el(
          "button",
          {
            type: "button",
            className: "btn btn-danger",
            style: { padding: "6px 10px", fontSize: "12px" },
            onClick: () => {
              if (typeof options.onDelete === "function") options.onDelete(arch.id);
            }
          },
          icon("delete", 15)
        )
      : null;

    return el(
      "tr",
      null,
      el(
        "td",
        null,
        icon("folder_zip", 16),
        el("span", { style: { marginLeft: "6px" }, text: arch.name || "archive.zip" })
      ),
      el("td", { text: formatDate(arch.createdAt) }),
      el("td", { style: { display: "flex", gap: "8px" } }, downloadLink, deleteBtn)
    );
  }

  global.VVComponents = global.VVComponents || {};
  global.VVComponents.createArchiveRow = createArchiveRow;
})(window);
