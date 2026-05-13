/* ============================================================
   PIXPLAY — 2048 Game
   DOM-based 4×4 grid with smooth tile animations,
   swipe + keyboard controls, merge logic, win/lose detection
   ============================================================ */

(function () {
  'use strict';

  const SIZE = 4;
  const WIN_TILE = 2048;

  let api, container;
  let grid, score, bestInSession;
  let state; // 'ready' | 'playing' | 'won' | 'over'
  let boardEl, cellEls;
  let touchStartX, touchStartY;
  let wonShown = false;

  // Tile colors
  const TILE_COLORS = {
    2:    { bg: '#3b3b50', text: '#f1f5f9' },
    4:    { bg: '#45456a', text: '#f1f5f9' },
    8:    { bg: '#f97316', text: '#fff' },
    16:   { bg: '#ea580c', text: '#fff' },
    32:   { bg: '#ef4444', text: '#fff' },
    64:   { bg: '#dc2626', text: '#fff' },
    128:  { bg: '#f59e0b', text: '#fff' },
    256:  { bg: '#eab308', text: '#fff' },
    512:  { bg: '#facc15', text: '#1a1a2e' },
    1024: { bg: '#a855f7', text: '#fff' },
    2048: { bg: '#22c55e', text: '#fff' },
    4096: { bg: '#3b82f6', text: '#fff' },
    8192: { bg: '#ec4899', text: '#fff' },
  };

  function init(_container, _api) {
    api = _api;
    container = _container;
    bestInSession = 0;

    // Build DOM
    const wrapper = document.createElement('div');
    wrapper.className = 'game-2048';
    wrapper.innerHTML = `
      <div class="game-2048__board" id="board-2048">
        ${Array(SIZE * SIZE).fill('<div class="game-2048__cell"></div>').join('')}
      </div>
    `;
    container.appendChild(wrapper);

    boardEl = wrapper.querySelector('#board-2048');

    // Style injection (scoped to this game)
    if (!document.getElementById('style-2048')) {
      const style = document.createElement('style');
      style.id = 'style-2048';
      style.textContent = `
        .game-2048 {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          user-select: none;
          -webkit-user-select: none;
        }
        .game-2048__board {
          display: grid;
          grid-template-columns: repeat(${SIZE}, 1fr);
          gap: 8px;
          padding: 10px;
          background: #1a1a2e;
          border-radius: 14px;
          width: min(380px, 85vw);
          aspect-ratio: 1;
          position: relative;
          box-shadow: 0 0 50px rgba(0, 0, 0, 0.4), 0 0 100px rgba(0, 0, 0, 0.2);
        }
        .game-2048__cell {
          background: #25253d;
          border-radius: 10px;
          aspect-ratio: 1;
          position: relative;
          overflow: hidden;
        }
        .game-2048__tile {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          font-family: 'Outfit', sans-serif;
          font-weight: 800;
          transition: none;
          z-index: 2;
        }
        .game-2048__tile.pop {
          animation: tile2048Pop 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .game-2048__tile.merge {
          animation: tile2048Merge 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .game-2048__tile.new {
          animation: tile2048New 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes tile2048Pop {
          0% { transform: scale(0); }
          70% { transform: scale(1.15); }
          100% { transform: scale(1); }
        }
        @keyframes tile2048Merge {
          0% { transform: scale(1); }
          40% { transform: scale(1.25); }
          100% { transform: scale(1); }
        }
        @keyframes tile2048New {
          0% { transform: scale(0); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .game-2048__start-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          background: rgba(7, 7, 13, 0.85);
          border-radius: 14px;
          z-index: 10;
          cursor: pointer;
        }
        .game-2048__start-overlay .icon { font-size: 3rem; }
        .game-2048__start-overlay .title { font-family: 'Outfit', sans-serif; font-size: 1.5rem; font-weight: 700; color: #f1f5f9; }
        .game-2048__start-overlay .hint { font-size: 0.85rem; color: #94a3b8; }
      `;
      document.head.appendChild(style);
    }

    // Event listeners
    document.addEventListener('keydown', onKeyDown);
    boardEl.addEventListener('touchstart', onTouchStart, { passive: true });
    boardEl.addEventListener('touchend', onTouchEnd, { passive: false });

    reset();
    showStartScreen();
  }

  function reset() {
    grid = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
    score = 0;
    wonShown = false;
    state = 'ready';
  }

  function showStartScreen() {
    renderBoard();
    // Add start overlay
    const overlay = document.createElement('div');
    overlay.className = 'game-2048__start-overlay';
    overlay.innerHTML = `
      <div class="icon">🔢</div>
      <div class="title">2048</div>
      <div class="hint">Press any arrow key, swipe, or tap to start</div>
    `;
    overlay.addEventListener('click', () => beginGameplay());
    boardEl.appendChild(overlay);
  }

  function beginGameplay() {
    if (state === 'playing') return;
    reset();
    addRandomTile();
    addRandomTile();
    state = 'playing';
    renderBoard();
  }

  function start() {
    showStartScreen();
  }

  // --- Grid Logic ---
  function addRandomTile() {
    const empty = [];
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (grid[r][c] === 0) empty.push({ r, c });
      }
    }
    if (empty.length === 0) return false;
    const { r, c } = empty[Math.floor(Math.random() * empty.length)];
    grid[r][c] = Math.random() < 0.9 ? 2 : 4;
    return { r, c };
  }

  function slideRow(row) {
    // Remove zeros
    let tiles = row.filter(v => v !== 0);
    let merged = false;
    let scoreGain = 0;
    const mergedPositions = [];

    // Merge
    for (let i = 0; i < tiles.length - 1; i++) {
      if (tiles[i] === tiles[i + 1]) {
        tiles[i] *= 2;
        scoreGain += tiles[i];
        tiles[i + 1] = 0;
        mergedPositions.push(i);
        merged = true;
        i++; // skip next
      }
    }

    // Remove zeros again
    tiles = tiles.filter(v => v !== 0);

    // Pad
    while (tiles.length < SIZE) tiles.push(0);

    return { tiles, scoreGain, merged, mergedPositions };
  }

  function move(dir) {
    if (state !== 'playing') return;

    let moved = false;
    let totalScoreGain = 0;
    const mergedCells = new Set();

    const oldGrid = grid.map(r => [...r]);

    if (dir === 'left' || dir === 'right') {
      for (let r = 0; r < SIZE; r++) {
        let row = [...grid[r]];
        if (dir === 'right') row.reverse();
        const result = slideRow(row);
        if (dir === 'right') {
          result.tiles.reverse();
          result.mergedPositions.forEach(p => mergedCells.add(`${r},${SIZE - 1 - p}`));
        } else {
          result.mergedPositions.forEach(p => mergedCells.add(`${r},${p}`));
        }
        grid[r] = result.tiles;
        totalScoreGain += result.scoreGain;
      }
    } else {
      for (let c = 0; c < SIZE; c++) {
        let col = [];
        for (let r = 0; r < SIZE; r++) col.push(grid[r][c]);
        if (dir === 'down') col.reverse();
        const result = slideRow(col);
        if (dir === 'down') {
          result.tiles.reverse();
          result.mergedPositions.forEach(p => mergedCells.add(`${SIZE - 1 - p},${c}`));
        } else {
          result.mergedPositions.forEach(p => mergedCells.add(`${p},${c}`));
        }
        for (let r = 0; r < SIZE; r++) grid[r][c] = result.tiles[r];
        totalScoreGain += result.scoreGain;
      }
    }

    // Check if anything moved
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (grid[r][c] !== oldGrid[r][c]) { moved = true; break; }
      }
      if (moved) break;
    }

    if (!moved) return;

    // Update score
    if (totalScoreGain > 0) {
      score += totalScoreGain;
      api.updateScore(score);
      api.audio.playScore();
    } else {
      api.audio.playMove();
    }

    // Add new tile
    const newTile = addRandomTile();

    // Render with animations
    renderBoard(mergedCells, newTile);

    // Check win
    if (!wonShown) {
      for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
          if (grid[r][c] >= WIN_TILE) {
            wonShown = true;
            state = 'won';
            setTimeout(() => api.onWin(score), 500);
            return;
          }
        }
      }
    }

    // Check lose
    if (!canMove()) {
      state = 'over';
      setTimeout(() => api.onGameOver(score), 600);
    }
  }

  function canMove() {
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (grid[r][c] === 0) return true;
        if (c < SIZE - 1 && grid[r][c] === grid[r][c + 1]) return true;
        if (r < SIZE - 1 && grid[r][c] === grid[r + 1][c]) return true;
      }
    }
    return false;
  }

  // --- Rendering ---
  function renderBoard(mergedCells, newTile) {
    const cells = boardEl.querySelectorAll('.game-2048__cell');

    // Remove any start overlay
    const overlay = boardEl.querySelector('.game-2048__start-overlay');
    if (overlay) overlay.remove();

    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const idx = r * SIZE + c;
        const cell = cells[idx];
        const val = grid[r][c];

        // Clear
        cell.innerHTML = '';

        if (val === 0) continue;

        const tile = document.createElement('div');
        tile.className = 'game-2048__tile';

        // Color
        const colors = TILE_COLORS[val] || { bg: '#ec4899', text: '#fff' };
        tile.style.background = colors.bg;
        tile.style.color = colors.text;

        // Font size based on digit count
        const digits = String(val).length;
        const boardWidth = boardEl.offsetWidth || 380;
        const cellSize = (boardWidth - 20 - 8 * 3) / 4; // padding - gaps
        let fontSize;
        if (digits <= 2) fontSize = cellSize * 0.42;
        else if (digits === 3) fontSize = cellSize * 0.35;
        else fontSize = cellSize * 0.28;
        tile.style.fontSize = fontSize + 'px';

        // Glow for high tiles
        if (val >= 128) {
          tile.style.boxShadow = `0 0 20px ${colors.bg}50, 0 0 40px ${colors.bg}25`;
        }

        tile.textContent = val;

        // Animation classes
        const key = `${r},${c}`;
        if (mergedCells && mergedCells.has(key)) {
          tile.classList.add('merge');
        } else if (newTile && newTile.r === r && newTile.c === c) {
          tile.classList.add('new');
        }

        cell.appendChild(tile);
      }
    }
  }

  // --- Input ---
  function onKeyDown(e) {
    if (state === 'ready') {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        beginGameplay();
        return;
      }
    }

    if (state !== 'playing') return;

    switch (e.key) {
      case 'ArrowUp':    e.preventDefault(); move('up'); break;
      case 'ArrowDown':  e.preventDefault(); move('down'); break;
      case 'ArrowLeft':  e.preventDefault(); move('left'); break;
      case 'ArrowRight': e.preventDefault(); move('right'); break;
    }
  }

  function onTouchStart(e) {
    if (state === 'ready') { beginGameplay(); return; }
    const t = e.touches[0];
    touchStartX = t.clientX;
    touchStartY = t.clientY;
  }

  function onTouchEnd(e) {
    e.preventDefault();
    if (state !== 'playing' || touchStartX == null) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartX;
    const dy = t.clientY - touchStartY;
    const minSwipe = 30;

    if (Math.abs(dx) > Math.abs(dy)) {
      if (Math.abs(dx) < minSwipe) return;
      move(dx > 0 ? 'right' : 'left');
    } else {
      if (Math.abs(dy) < minSwipe) return;
      move(dy > 0 ? 'down' : 'up');
    }
  }

  // --- Lifecycle ---
  function pause() { /* 2048 is turn-based, no need to pause */ }
  function resume() { }
  function isPaused() { return false; }

  function restart() {
    beginGameplay();
  }

  function destroy() {
    document.removeEventListener('keydown', onKeyDown);
    if (boardEl) {
      boardEl.removeEventListener('touchstart', onTouchStart);
      boardEl.removeEventListener('touchend', onTouchEnd);
    }
    state = null;
  }

  // --- Register ---
  window.PixPlayGames = window.PixPlayGames || {};
  window.PixPlayGames['game-2048'] = {
    init, start, pause, resume, restart, destroy, isPaused
  };
})();
