
(function (global) {
  'use strict';

  async function isUserBlockedByMe(myUid, targetUid) {
    if (!myUid || !targetUid || !global.db) {
      throw new Error("Не вдалося перевірити блокування");
    }

    if (myUid === targetUid) return false;

    const snap = await global.db
      .ref(`users/${myUid}/blockedUsers/${targetUid}`)
      .once("value");

    return snap.exists() && snap.val()?.blocked === true;
  }

  async function didUserBlockMe(myUid, targetUid) {
    if (!myUid || !targetUid || !global.db) {
      throw new Error("Не вдалося перевірити блокування");
    }

    if (myUid === targetUid) return false;

    const snap = await global.db
      .ref(`users/${targetUid}/blockedUsers/${myUid}`)
      .once("value");

    return snap.exists() && snap.val()?.blocked === true;
  }

  async function canInteractWithUser(myUid, targetUid) {
    if (!myUid || !targetUid) return true;
    if (myUid === targetUid) return true;

    try {
      const [blockedByMe, blockedMe] = await Promise.all([
        isUserBlockedByMe(myUid, targetUid),
        didUserBlockMe(myUid, targetUid)
      ]);

      return !blockedByMe && !blockedMe;
    } catch (error) {
      console.error("Помилка перевірки блокування:", error);
      return false;
    }
  }

  global.VV = global.VV || {};

  Object.assign(global.VV, {
    isUserBlockedByMe,
    didUserBlockMe,
    canInteractWithUser
  });

  global.isUserBlockedByMe = isUserBlockedByMe;
  global.didUserBlockMe = didUserBlockMe;
  global.canInteractWithUser = canInteractWithUser;

})(window);
