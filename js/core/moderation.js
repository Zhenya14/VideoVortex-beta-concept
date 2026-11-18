(function (global) {
  'use strict';

  async function isUserBlockedByMe(myUid, targetUid) {
    if (!myUid || !targetUid || !global.db) return false;
    try {
      const snap = await global.db.ref(`users/${myUid}/blockedUsers/${targetUid}`).once("value");
      return snap.exists() && snap.val()?.blocked === true;
    } catch (e) {
      return false;
    }
  }

  async function didUserBlockMe(myUid, targetUid) {
    if (!myUid || !targetUid || !global.db) return false;
    try {
      const snap = await global.db.ref(`users/${targetUid}/blockedUsers/${myUid}`).once("value");
      return snap.exists() && snap.val()?.blocked === true;
    } catch (e) {
      return false;
    }
  }

  async function canInteractWithUser(myUid, targetUid) {
    if (!myUid || !targetUid) return true;
    const [blockedByMe, blockedMe] = await Promise.all([
      isUserBlockedByMe(myUid, targetUid),
      didUserBlockMe(myUid, targetUid)
    ]);
    return !blockedByMe && !blockedMe;
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
