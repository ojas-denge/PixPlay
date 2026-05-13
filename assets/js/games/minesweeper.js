/* ============================================================
   PIXPLAY — Minesweeper Game
   DOM-based grid with flood-fill reveal, flagging,
   difficulty selector, timer, mine counter
   ============================================================ */

(function () {
  'use strict';

  const DIFFICULTIES = {
    easy:   { rows: 9,  cols: 9,  mines: 10 },
    medium: { rows: 16, cols: 16, mines: 40 },
    hard:   { rows: 16, cols: 30, mines: 99 },
  };

  const NUMBER_COLORS = [
    '', '#3b82f6', '#22c55e', '#ef4444', '#7c3aed',
    '#f59e0b', '#06b6d4', '#1a1a2e', '#94a3b8'
  ];

  let api, container, wrapperEl;
  let grid, revealed, flagged, minePositions;
  let rows, cols, totalMines, flagCount;
  let state, difficulty, timer, timerInterval, firstClick;
  let mode = 'dig';
  let boardEl, mineCountEl, timerEl, modeBtn;

  function init(_container, _api) {
    api = _api;
    container = _container;

    wrapperEl = document.createElement('div');
    wrapperEl.className = 'minesweeper-game';
    container.appendChild(wrapperEl);

    // Inject styles
    if (!document.getElementById('style-minesweeper')) {
      const style = document.createElement('style');
      style.id = 'style-minesweeper';
      style.textContent = `
        .minesweeper-game {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
          user-select: none;
          -webkit-user-select: none;
        }
        .ms-toolbar {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
          justify-content: center;
        }
        .ms-difficulty-btn {
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
        .ms-difficulty-btn:hover { color: #f1f5f9; background: rgba(255,255,255,0.08); }
        .ms-difficulty-btn.active {
          color: #fff;
          background: linear-gradient(135deg, #a855f7, #3b82f6);
          border-color: transparent;
        }
        .ms-info {
          display: flex;
          gap: 20px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.9rem;
          color: #f1f5f9;
        }
        .ms-info span { display: flex; align-items: center; gap: 5px; }
        .ms-board-wrap {
          overflow-x: auto;
          max-width: 90vw;
          border-radius: 10px;
        }
        .ms-board {
          display: grid;
          gap: 2px;
          padding: 6px;
          background: #1a1a2e;
          border-radius: 10px;
          box-shadow: 0 0 40px rgba(0,0,0,0.4);
        }
        .ms-cell {
          width: clamp(28px, 5vw, 34px);
          height: clamp(28px, 5vw, 34px);
          display: flex;
          align-items: center;
          justify-content: center;
          background: #2a2a44;
          border-radius: 4px;
          font-family: 'Outfit', sans-serif;
          font-size: clamp(0.7rem, 2vw, 0.85rem);
          font-weight: 700;
          cursor: pointer;
          transition: background 0.1s, transform 0.1s;
          border: 1px solid rgba(255,255,255,0.03);
        }
        .ms-cell:hover:not(.ms-revealed):not(.ms-exploded) {
          background: #33335a;
          transform: scale(1.05);
        }
        .ms-cell:active:not(.ms-revealed) { transform: scale(0.95); }
        .ms-revealed {
          background: #1e1e36;
          cursor: default;
          border-color: transparent;
        }
        .ms-flagged {
          background: #2a2a44;
        }
        .ms-mine { color: #ef4444; font-size: 1rem; }
        .ms-exploded { background: rgba(239, 68, 68, 0.25) !important; }
        .ms-cell.ms-pop {
          animation: msCellPop 0.2s cubic-bezier(0.34,1.56,0.64,1);
        }
        @keyframes msCellPop {
          0% { transform: scale(0.7); opacity: 0.5; }
          100% { transform: scale(1); opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }

    difficulty = 'easy';
    buildUI();
    reset();
    renderBoard();
  }

  function buildUI() {
    wrapperEl.innerHTML = `
      <div class="ms-toolbar">
        <button class="ms-difficulty-btn active" data-diff="easy">Easy</button>
        <button class="ms-difficulty-btn" data-diff="medium">Medium</button>
        <button class="ms-difficulty-btn" data-diff="hard">Hard</button>
      </div>
      <div class="ms-info">
        <span>💣 <span id="ms-mine-count">0</span></span>
        <span>⏱ <span id="ms-timer">0</span></span>
      </div>
      <div class="ms-board-wrap">
        <div class="ms-board" id="ms-board"></div>
      </div>
      <div class="ms-controls" style="margin-top: 16px;">
        <button class="ms-difficulty-btn" id="ms-mode-btn" style="padding: 10px 32px; font-size: 1.1rem; border-color: rgba(255,255,255,0.2);">⛏️ Dig Mode</button>
      </div>
    `;

    boardEl = wrapperEl.querySelector('#ms-board');
    mineCountEl = wrapperEl.querySelector('#ms-mine-count');
    timerEl = wrapperEl.querySelector('#ms-timer');
    modeBtn = wrapperEl.querySelector('#ms-mode-btn');

    if (modeBtn) {
      modeBtn.addEventListener('click', () => {
        api.audio.playClick();
        if (mode === 'dig') {
          mode = 'flag';
          modeBtn.innerHTML = '🚩 Flag Mode';
          modeBtn.style.background = 'rgba(239, 68, 68, 0.15)';
        } else {
          mode = 'dig';
          modeBtn.innerHTML = '⛏️ Dig Mode';
          modeBtn.style.background = 'rgba(255,255,255,0.04)';
        }
      });
    }

    // Difficulty buttons
    wrapperEl.querySelector('.ms-toolbar').addEventListener('click', e => {
      const btn = e.target.closest('.ms-difficulty-btn');
      if (!btn) return;
      api.audio.playClick();
      difficulty = btn.dataset.diff;
      wrapperEl.querySelectorAll('.ms-difficulty-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      reset();
      renderBoard();
    });

    // Board click
    boardEl.addEventListener('click', e => {
      const cell = e.target.closest('.ms-cell');
      if (!cell) return;
      const r = parseInt(cell.dataset.r);
      const c = parseInt(cell.dataset.c);
      if (mode === 'flag') {
        handleFlag(r, c);
      } else {
        handleClick(r, c);
      }
    });

    // Right click (flag)
    boardEl.addEventListener('contextmenu', e => {
      e.preventDefault();
      const cell = e.target.closest('.ms-cell');
      if (!cell) return;
      const r = parseInt(cell.dataset.r);
      const c = parseInt(cell.dataset.c);
      handleFlag(r, c);
    });

    // Long press for mobile flagging
    let longPressTimer;
    boardEl.addEventListener('touchstart', e => {
      const cell = e.target.closest('.ms-cell');
      if (!cell) return;
      longPressTimer = setTimeout(() => {
        e.preventDefault();
        const r = parseInt(cell.dataset.r);
        const c = parseInt(cell.dataset.c);
        handleFlag(r, c);
      }, 500);
    }, { passive: false });
    boardEl.addEventListener('touchend', () => clearTimeout(longPressTimer));
    boardEl.addEventListener('touchmove', () => clearTimeout(longPressTimer));
  }

  function reset() {
    const d = DIFFICULTIES[difficulty];
    rows = d.rows;
    cols = d.cols;
    totalMines = d.mines;
    flagCount = 0;

    grid = Array.from({ length: rows }, () => Array(cols).fill(0));
    revealed = Array.from({ length: rows }, () => Array(cols).fill(false));
    flagged = Array.from({ length: rows }, () => Array(cols).fill(false));
    minePositions = new Set();

    state = 'playing';
    firstClick = true;
    timer = 0;
    clearInterval(timerInterval);

    if (mineCountEl) mineCountEl.textContent = totalMines;
    if (timerEl) timerEl.textContent = '0';
  }

  function placeMines(safeR, safeC) {
    const safeZone = new Set();
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        safeZone.add(`${safeR + dr},${safeC + dc}`);
      }
    }

    let placed = 0;
    while (placed < totalMines) {
      const r = Math.floor(Math.random() * rows);
      const c = Math.floor(Math.random() * cols);
      const key = `${r},${c}`;
      if (minePositions.has(key) || safeZone.has(key)) continue;
      minePositions.add(key);
      grid[r][c] = -1; // mine
      placed++;
    }

    // Calculate numbers
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r][c] === -1) continue;
        let count = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] === -1) {
              count++;
            }
          }
        }
        grid[r][c] = count;
      }
    }
  }

  function handleClick(r, c) {
    if (state !== 'playing') return;
    if (revealed[r][c] || flagged[r][c]) return;

    if (firstClick) {
      firstClick = false;
      placeMines(r, c);
      timerInterval = setInterval(() => {
        timer++;
        timerEl.textContent = timer;
      }, 1000);
    }

    if (grid[r][c] === -1) {
      // Hit mine
      revealAll();
      state = 'over';
      clearInterval(timerInterval);
      api.audio.playGameOver();

      // Mark exploded
      const cell = boardEl.querySelector(`[data-r="${r}"][data-c="${c}"]`);
      if (cell) cell.classList.add('ms-exploded');

      setTimeout(() => api.onGameOver(0), 600);
      return;
    }

    // Reveal with flood fill
    floodReveal(r, c);
    api.audio.playClick();
    renderBoard();

    // Check win
    checkWin();
  }

  function handleFlag(r, c) {
    if (state !== 'playing') return;
    if (revealed[r][c]) return;

    flagged[r][c] = !flagged[r][c];
    flagCount += flagged[r][c] ? 1 : -1;
    mineCountEl.textContent = totalMines - flagCount;
    api.audio.playFlip();
    renderBoard();
  }

  function floodReveal(r, c) {
    if (r < 0 || r >= rows || c < 0 || c >= cols) return;
    if (revealed[r][c] || flagged[r][c]) return;
    if (grid[r][c] === -1) return;

    revealed[r][c] = true;

    if (grid[r][c] === 0) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          floodReveal(r + dr, c + dc);
        }
      }
    }
  }

  function revealAll() {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        revealed[r][c] = true;
      }
    }
    renderBoard();
  }

  function checkWin() {
    let unrevealedSafe = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!revealed[r][c] && grid[r][c] !== -1) unrevealedSafe++;
      }
    }
    if (unrevealedSafe === 0) {
      state = 'won';
      clearInterval(timerInterval);
      const diffMult = difficulty === 'hard' ? 5 : (difficulty === 'medium' ? 2 : 1);
      const safeTime = Math.max(1, timer);
      const winScore = Math.max(10, Math.floor((10000 * diffMult) / safeTime));
      api.updateScore(winScore);
      api.audio.playWin();
      setTimeout(() => api.onWin(winScore), 500);
    }
  }

  function renderBoard() {
    boardEl.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    boardEl.innerHTML = '';

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = document.createElement('div');
        cell.className = 'ms-cell';
        cell.dataset.r = r;
        cell.dataset.c = c;

        if (revealed[r][c]) {
          cell.classList.add('ms-revealed', 'ms-pop');
          if (grid[r][c] === -1) {
            cell.innerHTML = '💣';
            cell.classList.add('ms-mine');
          } else if (grid[r][c] > 0) {
            cell.textContent = grid[r][c];
            cell.style.color = NUMBER_COLORS[grid[r][c]];
          }
        } else if (flagged[r][c]) {
          cell.classList.add('ms-flagged');
          cell.innerHTML = '🚩';
        }

        boardEl.appendChild(cell);
      }
    }
  }

  // --- Lifecycle ---
  function start() { state = 'playing'; }
  function pause() {}
  function resume() {}
  function isPaused() { return false; }

  function restart() {
    reset();
    renderBoard();
  }

  function destroy() {
    clearInterval(timerInterval);
    state = null;
  }

  window.PixPlayGames = window.PixPlayGames || {};
  window.PixPlayGames['minesweeper'] = {
    init, start, pause, resume, restart, destroy, isPaused
  };
})();
