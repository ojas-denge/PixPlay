const CACHE_NAME = 'pixplay-cache-v1';

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './assets/icon.svg',
  './assets/css/index.css',
  './assets/css/portal.css',
  './assets/css/game.css',
  './assets/js/app.js',
  './assets/js/audio.js',
  './assets/js/storage.js',
  './games/snake.html',
  './games/flappy-bird.html',
  './games/whack-a-mole.html',
  './games/game-2048.html',
  './games/wordle.html',
  './games/minesweeper.html',
  './games/memory-match.html',
  './games/tic-tac-toe.html',
  './games/breakout.html',
  './games/typing-test.html',
  './assets/js/games/snake.js',
  './assets/js/games/flappy-bird.js',
  './assets/js/games/whack-a-mole.js',
  './assets/js/games/game-2048.js',
  './assets/js/games/wordle.js',
  './assets/js/games/minesweeper.js',
  './assets/js/games/memory-match.js',
  './assets/js/games/tic-tac-toe.js',
  './assets/js/games/breakout.js',
  './assets/js/games/typing-test.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) return response;
        return fetch(event.request);
      })
  );
});
