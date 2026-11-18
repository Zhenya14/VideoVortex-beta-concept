importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');

firebase.initializeApp({
  apiKey: "AIzaSyBkPYP3bnDy61NFjRSboRZrfTVNTdIMWbY",
  authDomain: "videovortex-235cd.firebaseapp.com",
  databaseURL: "https://videovortex-235cd-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "videovortex-235cd",
  storageBucket: "videovortex-235cd.appspot.com",
  messagingSenderId: "681594250269",
  appId: "1:681594250269:web:1176b21fcc8fe2a7d052f4"
});

const messaging = firebase.messaging();
const CACHE_NAME = "videovortex-cache-v15";
const IMAGE_CACHE_NAME = "videovortex-media-v1";

const ASSETS_TO_CACHE = [
  "./",
  "index.html",
  "manifest.json",
  "assets/images/default.jpg",
  "assets/images/logos/VideoVortex_logo_192x192.png",
  "assets/images/logos/VideoVortex_logo_512x512.png",
  "css/variables.css",
  "css/base.css",
  "css/components.css",
  "css/navbar.css",
  "css/stories.css",
  "css/feed.css",
  "css/video.css",
  "css/profile.css",
  "css/auth.css",
  "components/elements/navbar-shell.js",
  "components/elements/home-screen.js",
  "components/elements/library-screen.js",
  "components/elements/upload-screen.js",
  "components/elements/settings-screen.js",
  "components/elements/auth-screen.js",
  "components/elements/detail-screens.js",
  "components/elements/modals-layer.js",
  "components/elements/mount-shell.js",
  "js/core/firebase.js",
  "js/core/dom.js",
  "js/core/utils.js",
  "js/core/moderation.js",
  "js/core/feedback-manager.js",
  "js/components/ui-feedback.js",
  "js/components/dropdown.js",
  "js/components/file-picker.js",
  "js/components/video-card.js",
  "js/components/photo-card.js",
  "js/components/story-item.js",
  "js/components/comment-item.js",
  "js/components/archive-row.js",
  "js/components/notification-item.js",
  "js/router.js",
  "js/views/home-view.js",
  "js/views/photos-view.js",
  "js/views/stories-view.js",
  "js/views/video-view.js",
  "js/views/profile-view.js",
  "js/views/library-view.js",
  "js/views/upload-view.js",
  "js/views/settings-view.js",
  "js/views/auth-view.js",
  "js/i18n.js",
  "js/update.js",
  "js/app.js"
];

messaging.setBackgroundMessageHandler(function (payload) {
  const notificationOptions = {
    body: payload.notification?.body || "",
    icon: "assets/images/logos/VideoVortex_logo_192x192.png"
  };
  return self.registration.showNotification(
    payload.notification?.title || "VideoVortex",
    notificationOptions
  );
});

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== IMAGE_CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

function isCacheableImageRequest(request) {
  if (request.destination === "image") return true;
  return /\.(webp|jpe?g|png|gif|avif)(\?|$)/i.test(request.url);
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  if (event.request.destination === "video") return;

  if (isCacheableImageRequest(event.request)) {
    event.respondWith(
      caches.open(IMAGE_CACHE_NAME).then((cache) =>
        cache.match(event.request).then((cached) => {
          if (cached) return cached;
          return fetch(event.request).then((response) => {
            if (response && (response.status === 200 || response.type === "opaque")) {
              cache.put(event.request, response.clone()).catch(() => {});
            }
            return response;
          });
        })
      )
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200) {
          const resClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
