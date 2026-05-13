/* ============================================================
   PIXPLAY — Memory Match Game
   DOM-based card flip game with CSS 3D transforms,
   move counter, pair matching, win detection
   ============================================================ */

(function () {
  'use strict';

  const GRIDS = {
    '4x4': { pairs: 8, cols: 4, label: '4x4' },
    '4x5': { pairs: 10, cols: 5, label: '4x5' },
    '6x6': { pairs: 18, cols: 6, label: '6x6' }
  };
  
  const EMOJIS = ['🐶', '🐱', '🦊', '🐻', '🐼', '🐸', '🦁', '🐧',
                  '🦋', '🐢', '🦉', '🐝', '🐬', '🦄', '🐲', '🍀',
                  '🐳', '🐙', '🦖', '🦍'];

  let api, container, wrapperEl, boardEl;
  let cards, flipped, matched, moves, locked;
  let state, currentGrid;

  function init(_container, _api) {
    api = _api;
    container = _container;

    wrapperEl = document.createElement('div');
    wrapperEl.className = 'memory-game';
    container.appendChild(wrapperEl);

    if (!document.getElementById('style-memory')) {
      const style = document.createElement('style');
      style.id = 'style-memory';
      style.textContent = `
        .memory-game {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          user-select: none;
          -webkit-user-select: none;
        }
        .memory-toolbar {
          display: flex;
          gap: 8px;
        }
        .mem-diff-btn {
          padding: 6px 16px;
          font-family: 'Outfit', sans-serif;
          font-size: 0.8rem;
          font-weight: 600;
          color: #94a3b8;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 20px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .mem-diff-btn:hover { color: #f1f5f9; background: rgba(255,255,255,0.08); }
        .mem-diff-btn.active {
          color: #fff;
          background: linear-gradient(135deg, #a855f7, #3b82f6);
          border-color: transparent;
        }
        .memory-info {
          display: flex;
          gap: 24px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.9rem;
          color: #f1f5f9;
        }
        .memory-board {
          display: grid;
          gap: 10px;
          perspective: 800px;
        }
        .memory-card {
          width: clamp(40px, 12vw, 82px);
          height: clamp(40px, 12vw, 82px);
          cursor: pointer;
          position: relative;
          transform-style: preserve-3d;
          transition: transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .memory-card.flipped {
          transform: rotateY(180deg);
        }
        .memory-card.matched {
          transform: rotateY(180deg);
        }
        .memory-card.matched .memory-card__front {
          box-shadow: 0 0 20px rgba(34, 197, 94, 0.4);
          border-color: #22c55e;
        }
        .memory-card__back,
        .memory-card__front {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        .memory-card__back {
          background: linear-gradient(135deg, #a855f7, #3b82f6);
          border: 2px solid rgba(255,255,255,0.1);
          font-size: 1.5rem;
          color: rgba(255,255,255,0.3);
          box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        }
        .memory-card__back::after {
          content: '?';
          font-family: 'Outfit', sans-serif;
          font-weight: 800;
          font-size: 1.8rem;
        }
        .memory-card__front {
          background: #1e1e36;
          border: 2px solid rgba(255,255,255,0.08);
          transform: rotateY(180deg);
          font-size: clamp(1.6rem, 5vw, 2.2rem);
          box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        }
        .memory-card:hover:not(.flipped):not(.matched) {
          transform: scale(1.05);
        }
        .memory-card:active:not(.flipped):not(.matched) {
          transform: scale(0.95);
        }
        .memory-card.shake-card {
          animation: memShake 0.4s ease;
        }
        @keyframes memShake {
          0%, 100% { transform: rotateY(180deg) translateX(0); }
          25% { transform: rotateY(180deg) translateX(-4px); }
          75% { transform: rotateY(180deg) translateX(4px); }
        }
      `;
      document.head.appendChild(style);
    }

    currentGrid = '4x4';
    buildUI();
    reset();
    renderBoard();
  }

  function buildUI() {
    wrapperEl.innerHTML = `
      <div class="memory-toolbar">
        <button class="mem-diff-btn active" data-grid="4x4">4x4</button>
        <button class="mem-diff-btn" data-grid="4x5">4x5</button>
        <button class="mem-diff-btn" data-grid="6x6">6x6</button>
      </div>
      <div class="memory-info">
        <span>🔄 Moves: <span id="mem-moves">0</span></span>
        <span>🃏 Pairs: <span id="mem-pairs">0</span>/<span id="mem-total-pairs">${GRIDS[currentGrid].pairs}</span></span>
      </div>
      <div class="memory-board" id="memory-board"></div>
    `;
    boardEl = wrapperEl.querySelector('#memory-board');
    boardEl.addEventListener('click', onCardClick);
    
    wrapperEl.querySelector('.memory-toolbar').addEventListener('click', e => {
      const btn = e.target.closest('.mem-diff-btn');
      if (!btn) return;
      api.audio.playClick();
      currentGrid = btn.dataset.grid;
      wrapperEl.querySelectorAll('.mem-diff-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      wrapperEl.querySelector('#mem-total-pairs').textContent = GRIDS[currentGrid].pairs;
      reset();
      renderBoard();
    });
  }

  function reset() {
    const pairs = GRIDS[currentGrid].pairs;
    // Pick random emojis for pairs
    const shuffledEmojis = [...EMOJIS].sort(() => Math.random() - 0.5).slice(0, pairs);
    const deck = [...shuffledEmojis, ...shuffledEmojis];

    // Fisher-Yates shuffle
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    cards = deck.map((emoji, i) => ({ id: i, emoji, flipped: false, matched: false }));
    flipped = [];
    matched = 0;
    moves = 0;
    locked = false;
    state = 'playing';
  }

  function renderBoard() {
    boardEl.style.gridTemplateColumns = `repeat(${GRIDS[currentGrid].cols}, 1fr)`;
    boardEl.innerHTML = '';
    for (const card of cards) {
      const el = document.createElement('div');
      el.className = 'memory-card';
      if (card.flipped || card.matched) el.classList.add('flipped');
      if (card.matched) el.classList.add('matched');
      el.dataset.id = card.id;
      el.innerHTML = `
        <div class="memory-card__back"></div>
        <div class="memory-card__front">${card.emoji}</div>
      `;
      boardEl.appendChild(el);
    }
    updateInfo();
  }

  function updateInfo() {
    const movesEl = wrapperEl.querySelector('#mem-moves');
    const pairsEl = wrapperEl.querySelector('#mem-pairs');
    if (movesEl) movesEl.textContent = moves;
    if (pairsEl) pairsEl.textContent = matched;
  }

  function onCardClick(e) {
    if (state !== 'playing' || locked) return;
    const cardEl = e.target.closest('.memory-card');
    if (!cardEl) return;

    const id = parseInt(cardEl.dataset.id);
    const card = cards[id];

    if (card.flipped || card.matched) return;

    // Flip
    card.flipped = true;
    cardEl.classList.add('flipped');
    flipped.push(card);
    api.audio.playFlip();

    if (flipped.length === 2) {
      moves++;
      updateInfo();
      locked = true;

      const [a, b] = flipped;

      if (a.emoji === b.emoji) {
        // Match!
        setTimeout(() => {
          a.matched = true;
          b.matched = true;
          matched++;
          updateInfo();

          const elA = boardEl.querySelector(`[data-id="${a.id}"]`);
          const elB = boardEl.querySelector(`[data-id="${b.id}"]`);
          if (elA) elA.classList.add('matched');
          if (elB) elB.classList.add('matched');

          api.audio.playCorrect();
          api.updateScore(matched * 100);
          flipped = [];
          locked = false;

          // Win check
          if (matched === GRIDS[currentGrid].pairs) {
            state = 'won';
            const finalScore = Math.max(100, 1000 - moves * 20);
            api.audio.playWin();
            setTimeout(() => api.onWin(finalScore), 600);
          }
        }, 300);
      } else {
        // No match — shake then flip back
        setTimeout(() => {
          const elA = boardEl.querySelector(`[data-id="${a.id}"]`);
          const elB = boardEl.querySelector(`[data-id="${b.id}"]`);
          if (elA) elA.classList.add('shake-card');
          if (elB) elB.classList.add('shake-card');
          api.audio.playError();

          setTimeout(() => {
            a.flipped = false;
            b.flipped = false;
            if (elA) { elA.classList.remove('flipped', 'shake-card'); }
            if (elB) { elB.classList.remove('flipped', 'shake-card'); }
            flipped = [];
            locked = false;
          }, 500);
        }, 700);
      }
    }
  }

  // Lifecycle
  function start() { state = 'playing'; }
  function pause() {}
  function resume() {}
  function isPaused() { return false; }

  function restart() {
    reset();
    renderBoard();
  }

  function destroy() {
    if (boardEl) boardEl.removeEventListener('click', onCardClick);
    state = null;
  }

  window.PixPlayGames = window.PixPlayGames || {};
  window.PixPlayGames['memory-match'] = {
    init, start, pause, resume, restart, destroy, isPaused
  };
})();
