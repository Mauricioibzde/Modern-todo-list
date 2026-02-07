const CACHE_NAME = 'todo-list-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/src/styles/index.css',
  '/src/styles/global.css',
  '/src/styles/var.css',
  '/src/styles/sideBar.css',
  '/src/styles/dashboard.css',
  '/src/styles/list-tasks.css',
  '/src/styles/add-task-form.css',
  '/src/styles/add-schedule-form.css',
  '/src/styles/search.css',
  '/src/styles/mobile.css',
  '/src/styles/calendar.css',
  '/src/styles/notifications.css',
  '/src/styles/custom-category-button.css',
  '/src/styles/custom-category.css',
  '/src/styles/checkbox.css',
  '/src/styles/notebook-bg.css',
  '/src/styles/time-input.css',
  '/src/styles/modal-priority.css',
  '/src/scripts/main.js',
  '/src/scripts/firebase-config.js',
  '/src/scripts/store.js',
  '/src/scripts/utils/icons.js',
  '/src/scripts/utils/validators.js',
  '/src/imgs/img.png'
];

// Install Event - Cache Assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(ASSETS_TO_CACHE);
      })
  );
});

// Activate Event - Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          return caches.delete(key);
        }
      }));
    })
  );
});

// Fetch Event - Network first, then Cache (for fresh data) 
// OR Stale-while-revalidate. 
// Since we use Firebase for data (which has its own offline mode), 
// we mainly want the App Shell to load fast.
self.addEventListener('fetch', (event) => {
    // Skip cross-origin requests (like Firebase JS SDKs, Google Fonts)
    // or let browser handle them with HTTP cache.
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            const networkFetch = fetch(event.request).then((response) => {
                // Update cache with new response
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, response.clone());
                });
                return response;
            });

            // Return cached response immediately if available, otherwise wait for network
            return cachedResponse || networkFetch;
        })
    );
});
