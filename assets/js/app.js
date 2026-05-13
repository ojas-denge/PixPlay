/* ============================================================
   PIXPLAY — Portal Application
   Game registry, card rendering, filtering, game loading
   ============================================================ */

// --- Game Registry ---
const GAMES = [
  {
    id: 'snake',
    name: 'Snake',
    icon: '🐍',
    category: 'arcade',
    difficulty: 2,
    color: '#22c55e',
    gradient: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
    glow: 'rgba(34, 197, 94, 0.2)',
    description: 'Guide the snake, eat food, grow longer. Don\'t hit the walls or yourself!',
    controls: 'Arrow Keys / WASD / Swipe',
    controlsHTML: '<kbd>↑</kbd><kbd>↓</kbd><kbd>←</kbd><kbd>→</kbd> or <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd>',
    scriptFile: 'assets/js/games/snake.js'
  },
  {
    id: 'flappy-bird',
    name: 'Flappy Bird',
    icon: '🐦',
    category: 'arcade',
    difficulty: 3,
    color: '#38bdf8',
    gradient: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
    glow: 'rgba(56, 189, 248, 0.2)',
    description: 'Tap to flap through the pipes. One touch, endless challenge!',
    controls: 'Space / Click / Tap',
    controlsHTML: '<kbd>Space</kbd> or Click / Tap',
    scriptFile: 'assets/js/games/flappy-bird.js'
  },
  {
    id: 'whack-a-mole',
    name: 'Whack-a-Mole',
    icon: '🔨',
    category: 'reflex',
    difficulty: 1,
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
    glow: 'rgba(245, 158, 11, 0.2)',
    description: 'Whack the moles as fast as you can! 30 seconds of pure reflex action.',
    controls: 'Click / Tap',
    controlsHTML: 'Click or Tap the moles!',
    scriptFile: 'assets/js/games/whack-a-mole.js'
  },
  {
    id: 'game-2048',
    name: '2048',
    icon: '🔢',
    category: 'puzzle',
    difficulty: 3,
    color: '#f97316',
    gradient: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
    glow: 'rgba(249, 115, 22, 0.2)',
    description: 'Slide tiles to merge them and reach 2048. Strategy meets satisfaction!',
    controls: 'Arrow Keys / Swipe',
    controlsHTML: '<kbd>↑</kbd><kbd>↓</kbd><kbd>←</kbd><kbd>→</kbd> or Swipe',
    scriptFile: 'assets/js/games/game-2048.js'
  },
  {
    id: 'wordle',
    name: 'Wordle',
    icon: '📝',
    category: 'word',
    difficulty: 3,
    color: '#10b981',
    gradient: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
    glow: 'rgba(16, 185, 129, 0.2)',
    description: 'Guess the 5-letter word in 6 tries. Green, yellow, gray — crack the code!',
    controls: 'Keyboard',
    controlsHTML: 'Type letters, <kbd>Enter</kbd> to submit, <kbd>⌫</kbd> to delete',
    scriptFile: 'assets/js/games/wordle.js'
  },
  {
    id: 'minesweeper',
    name: 'Minesweeper',
    icon: '💣',
    category: 'logic',
    difficulty: 4,
    color: '#ef4444',
    gradient: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
    glow: 'rgba(239, 68, 68, 0.2)',
    description: 'Uncover cells without detonating mines. A classic logic puzzle!',
    controls: 'Left Click / Right Click to Flag',
    controlsHTML: 'Left Click to reveal, Right Click to flag',
    scriptFile: 'assets/js/games/minesweeper.js'
  },
  {
    id: 'memory-match',
    name: 'Memory Match',
    icon: '🃏',
    category: 'memory',
    difficulty: 2,
    color: '#ec4899',
    gradient: 'linear-gradient(135deg, #db2777 0%, #be185d 100%)',
    glow: 'rgba(236, 72, 153, 0.2)',
    description: 'Flip cards and find matching pairs. Test your memory!',
    controls: 'Click / Tap',
    controlsHTML: 'Click or Tap cards to flip',
    scriptFile: 'assets/js/games/memory-match.js'
  },
  {
    id: 'tic-tac-toe',
    name: 'Tic-Tac-Toe',
    icon: '❌',
    category: 'strategy',
    difficulty: 1,
    color: '#6366f1',
    gradient: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
    glow: 'rgba(99, 102, 241, 0.2)',
    description: 'The classic X vs O battle. Play against a smart AI opponent!',
    controls: 'Click / Tap',
    controlsHTML: 'Click or Tap a cell to place your mark',
    scriptFile: 'assets/js/games/tic-tac-toe.js'
  },
  {
    id: 'breakout',
    name: 'Breakout',
    icon: '🧱',
    category: 'arcade',
    difficulty: 3,
    color: '#06b6d4',
    gradient: 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)',
    glow: 'rgba(6, 182, 212, 0.2)',
    description: 'Bounce the ball and smash all the bricks. Classic arcade action!',
    controls: 'Mouse / Touch to move paddle',
    controlsHTML: 'Move mouse or touch to control paddle',
    scriptFile: 'assets/js/games/breakout.js'
  },
  {
    id: 'typing-test',
    name: 'Typing Speed',
    icon: '⌨️',
    category: 'skill',
    difficulty: 2,
    color: '#8b5cf6',
    gradient: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
    glow: 'rgba(139, 92, 246, 0.2)',
    description: 'How fast can you type? Measure your WPM and accuracy!',
    controls: 'Keyboard',
    controlsHTML: 'Just start typing!',
    scriptFile: 'assets/js/games/typing-test.js'
  }
];

const CATEGORIES = [
  { id: 'all', label: 'All Games', icon: '🎮' },
  { id: 'arcade', label: 'Arcade', icon: '👾' },
  { id: 'puzzle', label: 'Puzzle', icon: '🧩' },
  { id: 'word', label: 'Word', icon: '📝' },
  { id: 'logic', label: 'Logic', icon: '🧠' },
  { id: 'memory', label: 'Memory', icon: '🃏' },
  { id: 'reflex', label: 'Reflex', icon: '⚡' },
  { id: 'strategy', label: 'Strategy', icon: '♟️' },
  { id: 'skill', label: 'Skill', icon: '🎯' }
];


// --- App State ---
const App = {
  currentFilter: 'all',
  searchQuery: '',
  currentGame: null,
  loadedScripts: new Set(),
  gameInstance: null,
};


// --- DOM References ---
function $(sel) { return document.querySelector(sel); }
function $$(sel) { return document.querySelectorAll(sel); }


// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  PixPlayAudio.init();

  if ('serviceWorker' in navigator) {
    const swPath = window.location.pathname.includes('/games/') ? '../sw.js' : './sw.js';
    navigator.serviceWorker.register(swPath).catch(err => console.log('SW registration failed:', err));
  }

  if ($('#category-filters')) {
    renderCategoryFilters();
    renderGameCards();
    updateTotalGamesPlayed();
  }

  bindEvents();

  if (document.body.dataset.gameId) {
    initDedicatedGame(document.body.dataset.gameId);
  }
});


// --- Render Category Filters ---
function renderCategoryFilters() {
  const container = $('#category-filters');
  container.innerHTML = CATEGORIES.map(cat => `
    <button class="category-pill${cat.id === 'all' ? ' active' : ''}"
            data-category="${cat.id}"
            aria-label="Filter by ${cat.label}">
      ${cat.icon} ${cat.label}
    </button>
  `).join('');
}


// --- Render Game Cards ---
function renderGameCards() {
  const grid = $('#game-grid');
  const scores = PixPlayStorage.getAllScores();
  const filteredGames = GAMES.filter(game => {
    const matchesCategory = App.currentFilter === 'all' || game.category === App.currentFilter;
    const matchesSearch = !App.searchQuery ||
      game.name.toLowerCase().includes(App.searchQuery) ||
      game.category.toLowerCase().includes(App.searchQuery) ||
      game.description.toLowerCase().includes(App.searchQuery);
    return matchesCategory && matchesSearch;
  });

  if (filteredGames.length === 0) {
    grid.innerHTML = `
      <div class="game-grid__empty" style="grid-column: 1/-1; text-align:center; padding: var(--space-3xl);">
        <div style="font-size:3rem; margin-bottom:var(--space-md);">🔍</div>
        <h3 style="margin-bottom:var(--space-xs);">No games found</h3>
        <p>Try a different search or category.</p>
      </div>`;
    return;
  }

  grid.innerHTML = filteredGames.map((game, i) => {
    const best = scores[game.id] || 0;
    const stars = '★'.repeat(game.difficulty) + '☆'.repeat(5 - game.difficulty);
    return `
      <article class="game-card stagger-${i + 1}"
               data-game="${game.id}"
               data-category="${game.category}"
               style="--card-gradient: ${game.gradient}; --card-glow: ${game.glow}; --card-accent: ${game.color};">
        <div class="game-card__visual">
          <span class="game-card__icon">${game.icon}</span>
        </div>
        <div class="game-card__content">
          <span class="game-card__category">${game.category}</span>
          <h3 class="game-card__title">${game.name}</h3>
          <p class="game-card__desc">${game.description}</p>
          <div class="game-card__meta">
            <span class="game-card__difficulty" title="Difficulty: ${game.difficulty}/5">
              <span style="color:var(--text-muted); margin-right:4px; letter-spacing:normal;">Difficulty:</span>
              <span style="color:#fbbf24;">${stars}</span>
            </span>
            <span class="game-card__best-score">${best > 0 ? 'Best: ' + best : '—'}</span>
          </div>
        </div>
        <div class="game-card__play-overlay">
          <button class="game-card__play-btn" aria-label="Play ${game.name}">▶ PLAY</button>
        </div>
      </article>`;
  }).join('');
}


// --- Event Binding ---
function bindEvents() {
  // Category filters
  const categoryFilters = $('#category-filters');
  if (categoryFilters) {
    categoryFilters.addEventListener('click', e => {
      const pill = e.target.closest('.category-pill');
      if (!pill) return;
      PixPlayAudio.playClick();
      App.currentFilter = pill.dataset.category;
      $$('.category-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      renderGameCards();
    });
  }

  // Game card clicks
  const gameGrid = $('#game-grid');
  if (gameGrid) {
    gameGrid.addEventListener('click', e => {
      const card = e.target.closest('.game-card');
      if (!card) return;
      PixPlayAudio.playClick();
      const gameId = card.dataset.game;
      window.location.href = 'games/' + gameId + '.html';
    });
  }

  // Search
  const searchInput = $('#search-input');
  if (searchInput) {
    let debounce;
    searchInput.addEventListener('input', e => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        App.searchQuery = e.target.value.trim().toLowerCase();
        renderGameCards();
      }, 200);
    });
  }

  // Game overlay controls
  const btnRestart = $('#game-restart-btn');
  const btnPause = $('#game-pause-btn');
  const btnSound = $('#game-sound-btn');

  if (btnRestart) btnRestart.addEventListener('click', () => { PixPlayAudio.playClick(); restartGame(); });
  if (btnPause) btnPause.addEventListener('click', () => { PixPlayAudio.playClick(); togglePause(); });
  if (btnSound) {
    btnSound.addEventListener('click', () => {
      const on = PixPlayAudio.toggle();
      btnSound.textContent = on ? '🔊 Sound' : '🔇 Muted';
    });
  }

  // Modal buttons
  const modalPlayAgain = $('#modal-play-again');
  if (modalPlayAgain) modalPlayAgain.addEventListener('click', () => { PixPlayAudio.playClick(); hideGameOverModal(); restartGame(); });



  // Sound toggle in navbar
  const navSoundBtn = $('#nav-sound-btn');
  if (navSoundBtn) {
    navSoundBtn.addEventListener('click', () => {
      const on = PixPlayAudio.toggle();
      navSoundBtn.textContent = on ? '🔊' : '🔇';
      const gameSoundBtn = $('#game-sound-btn');
      if (gameSoundBtn) gameSoundBtn.textContent = on ? '🔊 Sound' : '🔇 Muted';
    });
  }

  // Smooth scroll for hero CTA
  const heroCTA = $('#hero-cta');
  if (heroCTA) {
    heroCTA.addEventListener('click', e => {
      e.preventDefault();
      PixPlayAudio.playClick();
      document.getElementById('games-section').scrollIntoView({ behavior: 'smooth' });
    });
  }
}


// --- Game Loading & Management ---
async function loadGameScript(game) {
  if (App.loadedScripts.has(game.id)) return;
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    const isGamePage = window.location.pathname.includes('/games/');
    script.src = (isGamePage ? '../' : '') + game.scriptFile;
    script.onload = () => { App.loadedScripts.add(game.id); resolve(); };
    script.onerror = () => reject(new Error(`Failed to load ${game.scriptFile}`));
    document.head.appendChild(script);
  });
}

async function initDedicatedGame(gameId) {
  const game = GAMES.find(g => g.id === gameId);
  if (!game) return;

  App.currentGame = game;

  // Update headers
  const titleEl = $('#game-title');
  if (titleEl) titleEl.textContent = game.name;

  $('#game-best-value').textContent = PixPlayStorage.getHighScore(gameId);
  $('#game-controls-help').innerHTML = game.controlsHTML;

  try {
    await loadGameScript(game);
    const container = $('#game-container');
    container.innerHTML = '';

    // Globally lock touch scrolling within the game container to prevent pull-to-refresh
    container.addEventListener('touchmove', e => e.preventDefault(), { passive: false });

    if (window.PixPlayGames && window.PixPlayGames[gameId]) {
      App.gameInstance = window.PixPlayGames[gameId];
      App.gameInstance.init(container, {
        audio: PixPlayAudio,
        storage: PixPlayStorage,
        updateScore: (score) => {
          const el = $('#game-score-value');
          el.textContent = score;
          el.classList.remove('score-pop');
          void el.offsetWidth; // trigger reflow
          el.classList.add('score-pop');
        },
        updateBest: (best) => { $('#game-best-value').textContent = best; },
        onGameOver: (score) => handleGameOver(gameId, score),
        onWin: (score) => handleWin(gameId, score),
      });
      App.gameInstance.start();
      PixPlayStorage.incrementPlayCount(gameId);
    }
  } catch (err) {
    console.error('Failed to load game:', err);
    $('#game-container').innerHTML = `
      <div class="game-start-screen">
        <div class="game-start-screen__icon">⚠️</div>
        <div class="game-start-screen__title">Coming Soon</div>
        <div class="game-start-screen__hint">This game could not be loaded.</div>
      </div>`;
  }
}

function restartGame() {
  if (App.gameInstance && App.gameInstance.restart) {
    $('#game-score-value').textContent = '0';
    App.gameInstance.restart();
  }
}

function togglePause() {
  if (!App.gameInstance) return;
  const btn = $('#game-pause-btn');
  if (App.gameInstance.isPaused && App.gameInstance.isPaused()) {
    App.gameInstance.resume();
    btn.textContent = '⏸ Pause';
  } else if (App.gameInstance.pause) {
    App.gameInstance.pause();
    btn.textContent = '▶ Resume';
  }
}


// --- Game Over / Win Handling ---
function handleGameOver(gameId, score) {
  PixPlayAudio.playGameOver();
  PixPlayStorage.addToTotalScore(gameId, score);
  const isNew = PixPlayStorage.setHighScore(gameId, score);
  const best = PixPlayStorage.getHighScore(gameId);
  showGameOverModal('Game Over!', '😵', score, best, isNew);
  if (isNew) {
    setTimeout(() => PixPlayAudio.playNewHighScore(), 800);
    $('#game-best-value').textContent = best;
  }
}

function handleWin(gameId, score) {
  PixPlayAudio.playWin();
  PixPlayStorage.addToTotalScore(gameId, score);
  const isNew = PixPlayStorage.setHighScore(gameId, score);
  const best = PixPlayStorage.getHighScore(gameId);
  showGameOverModal('You Win!', '🏆', score, best, isNew);
  if (isNew) {
    setTimeout(() => PixPlayAudio.playNewHighScore(), 600);
    $('#game-best-value').textContent = best;
  }
}

function showGameOverModal(title, icon, score, best, isNewBest) {
  $('#modal-icon').textContent = icon;
  $('#modal-title').textContent = title;
  $('#modal-score').textContent = score;
  $('#modal-best').textContent = best;
  const newBestEl = $('#modal-new-best');
  if (isNewBest) {
    newBestEl.removeAttribute('hidden');
  } else {
    newBestEl.setAttribute('hidden', '');
  }
  const backdrop = $('#modal-backdrop');
  backdrop.classList.add('visible');
}

function hideGameOverModal() {
  $('#modal-backdrop').classList.remove('visible');
}

// --- Utility ---
function updateTotalGamesPlayed() {
  const el = $('#stat-games-played');
  if (el) el.textContent = PixPlayStorage.getTotalGamesPlayed();
}

// Global game registry
window.PixPlayGames = window.PixPlayGames || {};
