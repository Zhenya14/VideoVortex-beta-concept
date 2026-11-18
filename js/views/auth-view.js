(function (global) {
  'use strict';

  function isMotionReduced() {
    return (
      document.body.classList.contains("reduced-motion") ||
      global.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    );
  }

  function extractAuthCode(err) {
    if (!err) return "";
    if (typeof err.code === "string" && err.code) {
      return err.code.toLowerCase();
    }
    const raw = String(err.message || "");
    try {
      const parsed = JSON.parse(raw);
      const nestedMsg = parsed?.error?.message || parsed?.message;
      if (nestedMsg) return String(nestedMsg).toLowerCase();
    } catch (_) {}
    return raw.toLowerCase();
  }

  function formatAuthError(err) {
    const code = extractAuthCode(err);
    const tr = (key, fallback) => (global.t ? global.t(key) : fallback);

    if (
      code.includes("invalid_login_credentials") ||
      code.includes("invalid-credential") ||
      code.includes("wrong-password") ||
      code.includes("invalid_password") ||
      code.includes("user-not-found") ||
      code.includes("email_not_found")
    ) {
      return tr("auth-err-invalid-credentials", "Невірна пошта або пароль");
    }
    if (code.includes("email-already-in-use") || code.includes("email_exists")) {
      return tr("auth-err-email-exists", "Ця електронна пошта вже використовується");
    }
    if (code.includes("invalid-email") || code.includes("invalid_email")) {
      return tr("auth-err-invalid-email", "Некоректна адреса електронної пошти");
    }
    if (code.includes("weak-password") || code.includes("weak_password")) {
      return tr("auth-err-weak-password", "Пароль занадто слабкий (мінімум 6 символів)");
    }
    if (code.includes("too-many-requests") || code.includes("too_many_attempts")) {
      return tr("auth-err-too-many", "Забагато спроб. Спробуйте пізніше");
    }
    if (code.includes("user-disabled") || code.includes("user_disabled")) {
      return tr("auth-err-disabled", "Цей обліковий запис вимкнено");
    }
    if (code.includes("network-request-failed") || code.includes("network")) {
      return tr("auth-err-network", "Помилка мережі. Перевірте інтернет-з'єднання");
    }

    const msg = String(err?.message || "").trim();
    if (!msg || msg.startsWith("{")) {
      return tr("auth-err-invalid-credentials", "Невірна пошта або пароль");
    }
    return msg;
  }

  function getAuthErrorFields(err, mode) {
    const code = extractAuthCode(err);
    if (mode === "reset") return ["#reset-email"];
    if (mode === "signup") {
      if (code.includes("weak-password") || code.includes("weak_password")) {
        return ["#signup-password"];
      }
      if (
        code.includes("email-already-in-use") ||
        code.includes("email_exists") ||
        code.includes("invalid-email") ||
        code.includes("invalid_email")
      ) {
        return ["#signup-email"];
      }
      return ["#signup-email", "#signup-password"];
    }
    if (code.includes("user-disabled") || code.includes("user_disabled")) {
      return ["#login-email"];
    }
    return ["#login-email", "#login-password"];
  }

  function setAuthEnteringState(mode, labelKey) {
    const card = document.getElementById("auth-card");
    const banner = document.getElementById("auth-entering-banner");
    const spinner = document.getElementById("auth-entering-spinner");
    const check = document.getElementById("auth-entering-check");
    const label = document.getElementById("auth-entering-label");
    if (!card || !banner || !label) return;

    card.classList.remove("is-entering", "is-success");

    if (mode === "entering") {
      card.classList.add("is-entering");
      banner.classList.remove("hidden");
      spinner?.classList.remove("hidden");
      check?.classList.add("hidden");
      label.textContent = global.t?.(labelKey || "auth-entering") || "Виконується вхід...";
    } else if (mode === "success") {
      card.classList.add("is-success");
      banner.classList.remove("hidden");
      spinner?.classList.add("hidden");
      check?.classList.remove("hidden");
      label.textContent = global.t?.(labelKey || "auth-welcome") || "Ласкаво просимо!";
    } else {
      banner.classList.add("hidden");
      spinner?.classList.remove("hidden");
      check?.classList.add("hidden");
    }
  }

  function waitTransition(ms) {
    if (isMotionReduced() || ms <= 0) return Promise.resolve();
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function completeAuthFlow(toastMsg, toastType) {
    setAuthEnteringState("success", "auth-welcome");
    await waitTransition(320);
    setAuthEnteringState("idle");
    if (toastMsg) global.VV.showToast(toastMsg, toastType || "success");
    global.VVRouter.navigate("home");
  }

  function resetPasswordFields() {
    document.querySelectorAll(".password-toggle-btn").forEach((btn) => {
      const targetId = btn.getAttribute("data-toggle-password");
      const input = targetId ? document.getElementById(targetId) : null;
      const iconEl = btn.querySelector(".material-symbols");
      if (input) input.type = "password";
      if (iconEl) iconEl.textContent = "visibility";
      btn.setAttribute("aria-pressed", "false");
      btn.setAttribute("aria-label", global.t?.("show-password") || "Показати пароль");
    });
  }

  function bindPasswordToggles() {
    document.querySelectorAll(".password-toggle-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const targetId = btn.getAttribute("data-toggle-password");
        const input = targetId ? document.getElementById(targetId) : null;
        if (!input) return;

        const nextShow = input.type === "password";
        input.type = nextShow ? "text" : "password";
        const iconEl = btn.querySelector(".material-symbols");
        if (iconEl) iconEl.textContent = nextShow ? "visibility_off" : "visibility";
        btn.setAttribute("aria-pressed", nextShow ? "true" : "false");
        btn.setAttribute(
          "aria-label",
          nextShow
            ? global.t?.("hide-password") || "Приховати пароль"
            : global.t?.("show-password") || "Показати пароль"
        );
        input.focus();
      });
    });
  }

  function switchAuthMode(mode) {
    setAuthEnteringState("idle");
    global.VVBus?.emit("feedback:clear", { scope: "auth" });
    const tabLogin = document.getElementById("tab-login-btn");
    const tabSignup = document.getElementById("tab-signup-btn");
    const loginForm = document.getElementById("login-form");
    const signupForm = document.getElementById("signup-form");
    const resetForm = document.getElementById("reset-password-form");

    tabLogin?.classList.toggle("btn-primary", mode === "login");
    tabSignup?.classList.toggle("btn-primary", mode === "signup");

    loginForm?.classList.toggle("hidden", mode !== "login");
    signupForm?.classList.toggle("hidden", mode !== "signup");
    resetForm?.classList.toggle("hidden", mode !== "reset");
  }

  function initAuthView() {
    bindPasswordToggles();

    document
      .getElementById("tab-login-btn")
      ?.addEventListener("click", () => switchAuthMode("login"));
    document
      .getElementById("tab-signup-btn")
      ?.addEventListener("click", () => switchAuthMode("signup"));
    document
      .getElementById("open-reset-form-btn")
      ?.addEventListener("click", () => switchAuthMode("reset"));
    document
      .getElementById("back-to-login-btn")
      ?.addEventListener("click", () => switchAuthMode("login"));

    document.getElementById("login-form")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("login-email")?.value.trim();
      const password = document.getElementById("login-password")?.value;
      if (!email || !password || !global.auth) return;

      global.VVBus?.emit("feedback:clear", { scope: "auth" });
      setAuthEnteringState("entering", "auth-entering");
      try {
        const cred = await global.auth.signInWithEmailAndPassword(email, password);
        const modSnap = await global.db
          .ref(`moderation/users/${cred.user.uid}/status`)
          .once("value")
          .catch(() => null);
        const status = modSnap?.val();
        if (status === "banned" || status === "disabled") {
          await global.auth.signOut();
          setAuthEnteringState("idle");
          global.VVFeedback.notify({
            scope: "auth",
            type: "error",
            message: "Ваш акаунт заблоковано адміністрацією",
            fields: ["#login-email"]
          });
          return;
        }
        e.target.reset();
        resetPasswordFields();
        await completeAuthFlow("Успішний вхід!", "success");
      } catch (err) {
        setAuthEnteringState("idle");
        global.VVFeedback.notify({
          scope: "auth",
          type: "error",
          message: formatAuthError(err),
          fields: getAuthErrorFields(err, "login")
        });
      }
    });

    document.getElementById("signup-form")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = document.getElementById("signup-name")?.value.trim();
      const supername = document.getElementById("signup-supername")?.value.trim();
      const email = document.getElementById("signup-email")?.value.trim();
      const birthdate = document.getElementById("signup-birthdate")?.value || "";
      const password = document.getElementById("signup-password")?.value;

      if (!name || !email || !password || !global.auth) {
        global.VVFeedback.notify({
          scope: "auth",
          type: "error",
          message: "Заповніть усі обов'язкові поля",
          fields: ["#signup-name", "#signup-email", "#signup-password"].filter(
            (sel) => !document.querySelector(sel)?.value.trim()
          )
        });
        return;
      }

      global.VVBus?.emit("feedback:clear", { scope: "auth" });
      setAuthEnteringState("entering", "auth-creating");
      try {
        const cred = await global.auth.createUserWithEmailAndPassword(email, password);
        const uid = cred.user.uid;
        const color = global.VV.pickSolidColor(name);

        const userProfile = {
          name,
          supername: supername || name.toLowerCase().replace(/\s+/g, "_"),
          email,
          birthdate,
          privateProfile: false,
          avatar: "",
          wallpaperId: global.VV.DEFAULT_THUMBNAIL,
          color,
          createdAt: new Date().toISOString()
        };

        await global.db.ref(`users/${uid}`).set(userProfile);
        await global.db.ref(`publicUsers/${uid}`).set({
          name: userProfile.name,
          supername: userProfile.supername,
          avatar: "",
          wallpaperId: global.VV.DEFAULT_THUMBNAIL,
          color,
          privateProfile: false
        });

        e.target.reset();
        resetPasswordFields();
        await completeAuthFlow("Акаунт створено!", "success");
      } catch (err) {
        setAuthEnteringState("idle");
        global.VVFeedback.notify({
          scope: "auth",
          type: "error",
          message: formatAuthError(err),
          fields: getAuthErrorFields(err, "signup")
        });
      }
    });

    document.getElementById("anonymous-login-btn")?.addEventListener("click", async () => {
      if (!global.auth) return;
      global.VVBus?.emit("feedback:clear", { scope: "auth" });
      setAuthEnteringState("entering", "auth-entering");
      try {
        const cred = await global.auth.signInAnonymously();
        const uid = cred.user.uid;
        await global.db.ref(`users/${uid}`).update({
          name: "Гість",
          anonymous: true,
          color: global.VV.pickSolidColor(uid),
          createdAt: new Date().toISOString()
        });
        await completeAuthFlow("Ви увійшли як гість", "info");
      } catch (err) {
        setAuthEnteringState("idle");
        global.VVFeedback.notify({
          scope: "auth",
          type: "error",
          message: formatAuthError(err)
        });
      }
    });

    document.getElementById("reset-password-form")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("reset-email")?.value.trim();
      if (!email || !global.auth) return;
      global.VVBus?.emit("feedback:clear", { scope: "auth" });
      setAuthEnteringState("entering", "auth-entering");
      try {
        await global.auth.sendPasswordResetEmail(email);
        e.target.reset();
        setAuthEnteringState("idle");
        switchAuthMode("login");
        global.VVFeedback.notify({
          scope: "auth",
          type: "success",
          message: "Лист для скидання пароля надіслано на пошту"
        });
      } catch (err) {
        setAuthEnteringState("idle");
        global.VVFeedback.notify({
          scope: "auth",
          type: "error",
          message: formatAuthError(err),
          fields: ["#reset-email"]
        });
      }
    });
  }

  global.VVViews = global.VVViews || {};
  global.VVViews.initAuthView = initAuthView;
  global.VVViews.switchAuthMode = switchAuthMode;
})(window);
