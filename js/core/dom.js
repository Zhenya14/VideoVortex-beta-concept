(function (global) {
  'use strict';

  function clear(node) {
    if (!node) return;
    while (node.firstChild) {
      node.removeChild(node.firstChild);
    }
  }

  function el(tag, props, ...children) {
    const element = document.createElement(tag);
    if (props && typeof props === "object") {
      Object.entries(props).forEach(([key, value]) => {
        if (value === undefined || value === null || value === false) return;
        if (key === "className" || key === "class") {
          element.className = String(value);
        } else if (key === "text") {
          element.textContent = String(value);
        } else if (key === "style" && typeof value === "object") {
          Object.assign(element.style, value);
        } else if (key === "dataset" && typeof value === "object") {
          Object.entries(value).forEach(([dk, dv]) => {
            if (dv !== undefined && dv !== null) {
              element.dataset[dk] = String(dv);
            }
          });
        } else if (key.startsWith("on") && typeof value === "function") {
          const eventName = key.slice(2).toLowerCase();
          element.addEventListener(eventName, value);
        } else if (key in element && typeof value === "boolean") {
          element[key] = value;
        } else {
          element.setAttribute(key, String(value));
        }
      });
    }

    const appendChildItem = (child) => {
      if (child === null || child === undefined || child === false) return;
      if (Array.isArray(child)) {
        child.forEach(appendChildItem);
      } else if (child instanceof Node) {
        element.appendChild(child);
      } else {
        element.appendChild(document.createTextNode(String(child)));
      }
    };

    children.forEach(appendChildItem);
    return element;
  }

  function icon(name, sizePx) {
    const props = { className: "material-symbols", text: name };
    if (sizePx) {
      props.style = { fontSize: typeof sizePx === "number" ? `${sizePx}px` : sizePx };
    }
    return el("i", props);
  }

  global.VV = global.VV || {};
  global.VV.el = el;
  global.VV.clear = clear;
  global.VV.icon = icon;
})(window);
