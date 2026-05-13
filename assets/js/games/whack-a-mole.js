/* ============================================================
   PIXPLAY — Whack-a-Mole Game
   DOM-based grid, timed rounds, random mole pop-ups,
   combo system, animated whacks
   ============================================================ */

(function () {
  'use strict';

  const GRID_ROWS = 3;
  const GRID_COLS = 3;
  const ROUND_TIME = 30; // seconds
  const MIN_MOLE_TIME = 500;
  const MAX_MOLE_TIME = 1200;

  let api, container, wrapperEl, boardEl, timerEl, comboEl;
  let state, score, timeLeft, combo, maxCombo;
  let moleTimers, activeHoles, gameTimer;

  function init(_container, _api) {
    api = _api;
    container = _container;

    wrapperEl = document.createElement('div');
    wrapperEl.className = 'wam-game';
    container.appendChild(wrapperEl);

    if (!document.getElementById('style-wam')) {
      const style = document.createElement('style');
      style.id = 'style-wam';
      style.textContent = `
        .wam-game {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          user-select: none;
          -webkit-user-select: none;
        }
        .wam-hud {
          display: flex;
          gap: 24px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.95rem;
          color: #f1f5f9;
          align-items: center;
        }
        .wam-combo {
          font-family: 'Outfit', sans-serif;
          font-weight: 700;
          color: #f59e0b;
          font-size: 1rem;
          min-width: 80px;
          text-align: center;
          transition: transform 0.15s cubic-bezier(0.34,1.56,0.64,1);
        }
        .wam-combo.pop { transform: scale(1.3); }
        .wam-timer-bar {
          width: min(360px, 85vw);
          height: 8px;
          background: #1a1a2e;
          border-radius: 4px;
          overflow: hidden;
        }
        .wam-timer-fill {
          height: 100%;
          background: linear-gradient(90deg, #ef4444, #f59e0b, #22c55e);
          border-radius: 4px;
          transition: width 0.3s linear;
        }
        .wam-board {
          display: grid;
          grid-template-columns: repeat(${GRID_COLS}, 1fr);
          gap: 12px;
        }
        .wam-hole {
          width: clamp(80px, 22vw, 105px);
          height: clamp(80px, 22vw, 105px);
          position: relative;
          cursor: pointer;
          border-radius: 50%;
          background: radial-gradient(circle, #1a1a2e 60%, #12121f 100%);
          border: 3px solid #25253d;
          overflow: hidden;
          transition: transform 0.1s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .wam-hole:active { transform: scale(0.93); }
        .wam-mole {
          position: absolute;
          bottom: -100%;
          font-size: clamp(2rem, 7vw, 2.8rem);
          transition: bottom 0.15s cubic-bezier(0.34, 1.56, 0.64, 1);
          pointer-events: none;
          filter: drop-shadow(0 4px 8px rgba(0,0,0,0.4));
        }
        .wam-hole.active .wam-mole {
          bottom: 10%;
        }
        .wam-hole.whacked .wam-mole {
          bottom: -100%;
          transition: bottom 0.1s ease-in;
        }
        .wam-hole.whacked::after {
          content: '💥';
          position: absolute;
          font-size: 2rem;
          animation: wamBurst 0.3s ease-out forwards;
        }
        .wam-score-fly {
          position: absolute;
          font-family: 'Outfit', sans-serif;
          font-weight: 800;
          font-size: 1.1rem;
          color: #22c55e;
          pointer-events: none;
          animation: wamScoreFly 0.6s ease-out forwards;
        }
        @keyframes wamBurst {
          0% { transform: scale(0.5); opacity: 1; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        @keyframes wamScoreFly {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-40px) scale(1.3); }
        }
        .wam-start-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          cursor: pointer;
          z-index: 5;
        }
        .wam-start-overlay .icon { font-size: 3rem; }
        .wam-start-overlay .title { font-family: 'Outfit', sans-serif; font-size: 1.5rem; font-weight: 700; color: #f1f5f9; }
        .wam-start-overlay .hint { font-size: 0.85rem; color: #94a3b8; }
      `;
      document.head.appendChild(style);
    }

    buildUI();
  }

  function buildUI() {
    wrapperEl.innerHTML = `
      <div class="wam-hud">
        <span>⏱ <span id="wam-time">${ROUND_TIME}</span>s</span>
        <span class="wam-combo" id="wam-combo"></span>
      </div>
      <div class="wam-timer-bar">
        <div class="wam-timer-fill" id="wam-timer-fill" style="width: 100%"></div>
      </div>
      <div class="wam-board" id="wam-board" style="position:relative;"></div>
    `;

    boardEl = wrapperEl.querySelector('#wam-board');
    timerEl = wrapperEl.querySelector('#wam-time');
    comboEl = wrapperEl.querySelector('#wam-combo');

    // Create holes
    for (let i = 0; i < GRID_ROWS * GRID_COLS; i++) {
      const hole = document.createElement('div');
      hole.className = 'wam-hole';
      hole.dataset.idx = i;
      hole.innerHTML = '<div class="wam-mole">🐹</div>';
      boardEl.appendChild(hole);
    }

    boardEl.addEventListener('click', onWhack);
  }

  function reset() {
    score = 0;
    timeLeft = ROUND_TIME;
    combo = 0;
    maxCombo = 0;
    activeHoles = new Set();
    moleTimers = [];
    clearInterval(gameTimer);

    // Reset all holes
    boardEl.querySelectorAll('.wam-hole').forEach(h => {
      h.classList.remove('active', 'whacked');
    });

    timerEl.textContent = ROUND_TIME;
    wrapperEl.querySelector('#wam-timer-fill').style.width = '100%';
    comboEl.textContent = '';
    state = 'ready';
  }

  function showStartScreen() {
    reset();
    const overlay = document.createElement('div');
    overlay.className = 'wam-start-overlay';
    overlay.innerHTML = `
      <div class="icon">🔨</div>
      <div class="title">Whack-a-Mole</div>
      <div class="hint">Tap or click to start — 30 seconds!</div>
    `;
    overlay.addEventListener('click', (e) => {
      e.stopPropagation();
      overlay.remove();
      beginGameplay();
    });
    boardEl.appendChild(overlay);
  }

  function start() {
    showStartScreen();
  }

  function beginGameplay() {
    reset();
    state = 'playing';
    spawnMole();
    gameTimer = setInterval(timerTick, 1000);
  }

  function timerTick() {
    timeLeft--;
    timerEl.textContent = timeLeft;
    wrapperEl.querySelector('#wam-timer-fill').style.width = `${(timeLeft / ROUND_TIME) * 100}%`;
    api.audio.playTick();

    if (timeLeft <= 0) {
      endGame();
    }
  }

  function spawnMole() {
    if (state !== 'playing') return;

    // Pick random empty hole
    const allHoles = Array.from(boardEl.querySelectorAll('.wam-hole'));
    const available = allHoles.filter((_, i) => !activeHoles.has(i));
    if (available.length === 0) return;

    const hole = available[Math.floor(Math.random() * available.length)];
    const idx = parseInt(hole.dataset.idx);

    activeHoles.add(idx);
    hole.classList.remove('whacked');
    hole.classList.add('active');

    // Auto-hide after random time
    const hideTime = MIN_MOLE_TIME + Math.random() * (MAX_MOLE_TIME - MIN_MOLE_TIME);
    const timer = setTimeout(() => {
      if (activeHoles.has(idx)) {
        hole.classList.remove('active');
        activeHoles.delete(idx);
        combo = 0;
        updateCombo();
      }
    }, hideTime);
    moleTimers.push(timer);

    // Schedule next mole
    const nextSpawn = 400 + Math.random() * 800;
    const spawnTimer = setTimeout(() => spawnMole(), nextSpawn);
    moleTimers.push(spawnTimer);
  }

  function onWhack(e) {
    if (state !== 'playing') return;
    const hole = e.target.closest('.wam-hole');
    if (!hole) return;

    const idx = parseInt(hole.dataset.idx);

    if (activeHoles.has(idx)) {
      // Hit!
      activeHoles.delete(idx);
      hole.classList.remove('active');
      hole.classList.add('whacked');
      setTimeout(() => hole.classList.remove('whacked'), 300);

      combo++;
      if (combo > maxCombo) maxCombo = combo;
      const points = 10 * Math.min(combo, 5); // max 5x multiplier
      score += points;

      api.updateScore(score);
      api.audio.playHit();
      updateCombo();

      // Flying score
      const fly = document.createElement('div');
      fly.className = 'wam-score-fly';
      fly.textContent = `+${points}`;
      if (combo > 1) fly.style.color = '#f59e0b';
      const rect = hole.getBoundingClientRect();
      const boardRect = boardEl.getBoundingClientRect();
      fly.style.left = (rect.left - boardRect.left + rect.width / 2 - 15) + 'px';
      fly.style.top = (rect.top - boardRect.top) + 'px';
      boardEl.appendChild(fly);
      setTimeout(() => fly.remove(), 600);
    } else {
      // Miss
      combo = 0;
      updateCombo();
    }
  }

  function updateCombo() {
    if (combo > 1) {
      comboEl.textContent = `🔥 ${combo}x Combo!`;
      comboEl.classList.remove('pop');
      void comboEl.offsetWidth;
      comboEl.classList.add('pop');
      setTimeout(() => comboEl.classList.remove('pop'), 200);
    } else {
      comboEl.textContent = '';
    }
  }

  function endGame() {
    state = 'over';
    clearInterval(gameTimer);
    moleTimers.forEach(t => clearTimeout(t));
    moleTimers = [];

    boardEl.querySelectorAll('.wam-hole').forEach(h => h.classList.remove('active'));
    activeHoles.clear();

    api.onGameOver(score);
  }

  // Lifecycle
  function pause() {
    if (state === 'playing') {
      state = 'paused';
      clearInterval(gameTimer);
      moleTimers.forEach(t => clearTimeout(t));
    }
  }
  function resume() {
    if (state === 'paused') {
      state = 'playing';
      gameTimer = setInterval(timerTick, 1000);
      spawnMole();
    }
  }
  function isPaused() { return state === 'paused'; }

  function restart() {
    clearInterval(gameTimer);
    moleTimers.forEach(t => clearTimeout(t));
    beginGameplay();
  }

  function destroy() {
    clearInterval(gameTimer);
    moleTimers.forEach(t => clearTimeout(t));
    if (boardEl) boardEl.removeEventListener('click', onWhack);
    state = null;
  }

  window.PixPlayGames = window.PixPlayGames || {};
  window.PixPlayGames['whack-a-mole'] = {
    init, start, pause, resume, restart, destroy, isPaused
  };
})();
