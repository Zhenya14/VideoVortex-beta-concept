(function (global) {
  'use strict';

  const FIREBASE_CONFIG = {
    apiKey: "AIzaSyBkPYP3bnDy61NFjRSboRZrfTVNTdIMWbY",
    authDomain: "videovortex-235cd.firebaseapp.com",
    databaseURL: "https://videovortex-235cd-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "videovortex-235cd",
    storageBucket: "videovortex-235cd.appspot.com",
    messagingSenderId: "681594250269",
    appId: "1:681594250269:web:1176b21fcc8fe2a7d052f4"
  };

  function initFirebase() {
    if (typeof firebase === "undefined") return null;
    if (!firebase.apps || !firebase.apps.length) {
      firebase.initializeApp(FIREBASE_CONFIG);
    }
    if (typeof firebase.auth === "function") {
      global.auth = firebase.auth();
    }
    if (typeof firebase.database === "function") {
      global.db = firebase.database();
    }
    if (typeof firebase.storage === "function") {
      global.storage = firebase.storage();
    }
    return {
      auth: global.auth,
      db: global.db,
      storage: global.storage
    };
  }

  global.VV = global.VV || {};
  global.VV.FIREBASE_CONFIG = FIREBASE_CONFIG;
  global.VV.initFirebase = initFirebase;
  initFirebase();
})(window);
