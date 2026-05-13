/* ============================================================
   PIXPLAY — Tic-Tac-Toe Game
   DOM-based 3×3 grid with minimax AI opponent,
   animated marks, win line, mode selector
   ============================================================ */

(function () {
  'use strict';

  let api, container, wrapperEl, boardEl, statusEl;
  let board, currentPlayer, state, vsAI, winner;
  let winLine;

  function init(_container, _api) {
    api = _api;
    container = _container;

    wrapperEl = document.createElement('div');
    wrapperEl.className = 'ttt-game';
    container.appendChild(wrapperEl);

    if (!document.getElementById('style-ttt')) {
      const style = document.createElement('style');
      style.id = 'style-ttt';
      style.textContent = `
        .ttt-game {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          user-select: none;
          -webkit-user-select: none;
        }
        .ttt-modes {
          display: flex;
          gap: 10px;
        }
        .ttt-mode-btn {
          padding: 8px 20px;
          font-family: 'Outfit', sans-serif;
          font-size: 0.85rem;
          font-weight: 600;
          color: #94a3b8;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 20px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .ttt-mode-btn:hover { color: #f1f5f9; background: rgba(255,255,255,0.08); }
        .ttt-mode-btn.active {
          color: #fff;
          background: linear-gradient(135deg, #a855f7, #3b82f6);
          border-color: transparent;
        }
        .ttt-status {
          font-family: 'Outfit', sans-serif;
          font-size: 1.1rem;
          font-weight: 600;
          color: #f1f5f9;
          min-height: 28px;
        }
        .ttt-board {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          position: relative;
        }
        .ttt-cell {
          width: clamp(80px, 22vw, 105px);
          height: clamp(80px, 22vw, 105px);
          display: flex;
          align-items: center;
          justify-content: center;
          background: #1e1e36;
          border-radius: 14px;
          cursor: pointer;
          transition: background 0.15s, transform 0.1s;
          border: 2px solid rgba(255,255,255,0.04);
          position: relative;
        }
        .ttt-cell:hover:not(.ttt-taken) {
          background: #26264a;
          transform: scale(1.04);
        }
        .ttt-cell:active:not(.ttt-taken) {
          transform: scale(0.95);
        }
        .ttt-taken { cursor: default; }
        .ttt-mark {
          font-size: clamp(2rem, 8vw, 3rem);
          font-weight: 800;
          animation: tttPop 0.3s cubic-bezier(0.34,1.56,0.64,1);
        }
        .ttt-mark-x { color: #3b82f6; text-shadow: 0 0 15px rgba(59,130,246,0.4); }
        .ttt-mark-o { color: #ef4444; text-shadow: 0 0 15px rgba(239,68,68,0.4); }
        @keyframes tttPop {
          0% { transform: scale(0) rotate(-15deg); }
          60% { transform: scale(1.2) rotate(5deg); }
          100% { transform: scale(1) rotate(0); }
        }
        .ttt-win-line {
          position: absolute;
          background: linear-gradient(90deg, #22c55e, #16a34a);
          border-radius: 4px;
          z-index: 5;
          box-shadow: 0 0 20px rgba(34,197,94,0.5);
          transition: width 0.4s cubic-bezier(0.16,1,0.3,1);
        }
        .ttt-cell.ttt-win-cell {
          background: rgba(34,197,94,0.1);
          border-color: rgba(34,197,94,0.3);
        }
      `;
      document.head.appendChild(style);
    }

    vsAI = true;
    buildUI();
    reset();
    renderBoard();
  }

  function buildUI() {
    wrapperEl.innerHTML = `
      <div class="ttt-modes">
        <button class="ttt-mode-btn active" data-mode="ai">vs AI 🤖</button>
        <button class="ttt-mode-btn" data-mode="human">vs Human 👥</button>
      </div>
      <div class="ttt-status" id="ttt-status">Your turn (X)</div>
      <div class="ttt-board" id="ttt-board"></div>
    `;

    boardEl = wrapperEl.querySelector('#ttt-board');
    statusEl = wrapperEl.querySelector('#ttt-status');

    // Mode selector
    wrapperEl.querySelector('.ttt-modes').addEventListener('click', e => {
      const btn = e.target.closest('.ttt-mode-btn');
      if (!btn) return;
      api.audio.playClick();
      vsAI = btn.dataset.mode === 'ai';
      wrapperEl.querySelectorAll('.ttt-mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      reset();
      renderBoard();
    });

    boardEl.addEventListener('click', onCellClick);
  }

  function reset() {
    board = Array(9).fill(null);
    currentPlayer = 'X';
    winner = null;
    winLine = null;
    state = 'playing';
    updateStatus();
  }

  function renderBoard() {
    boardEl.innerHTML = '';
    for (let i = 0; i < 9; i++) {
      const cell = document.createElement('div');
      cell.className = 'ttt-cell';
      cell.dataset.idx = i;

      if (board[i]) {
        cell.classList.add('ttt-taken');
        const mark = document.createElement('span');
        mark.className = `ttt-mark ttt-mark-${board[i].toLowerCase()}`;
        mark.textContent = board[i];
        cell.appendChild(mark);
      }

      boardEl.appendChild(cell);
    }

    // Draw win line if exists
    if (winLine) {
      requestAnimationFrame(() => drawWinLine(winLine));
    }
  }

  function updateStatus() {
    if (winner === 'draw') {
      statusEl.textContent = "It's a draw!";
    } else if (winner) {
      statusEl.textContent = `${winner} wins!`;
    } else if (vsAI && currentPlayer === 'O') {
      statusEl.textContent = 'AI thinking...';
    } else {
      statusEl.textContent = `${currentPlayer === 'X' ? 'Your' : "Player 2's"} turn (${currentPlayer})`;
    }
  }

  function onCellClick(e) {
    if (state !== 'playing') return;
    const cell = e.target.closest('.ttt-cell');
    if (!cell) return;
    const idx = parseInt(cell.dataset.idx);
    if (board[idx]) return;
    if (vsAI && currentPlayer === 'O') return;

    makeMove(idx);
  }

  function makeMove(idx) {
    board[idx] = currentPlayer;
    api.audio.playClick();
    renderBoard();

    const win = checkWin(board);
    if (win) {
      winner = currentPlayer;
      state = 'ended';
      winLine = win;
      updateStatus();
      renderBoard();
      highlightWin(win);
      
      if (vsAI && currentPlayer === 'O') {
        // AI won, player loses
        api.audio.playGameOver();
        setTimeout(() => api.onGameOver(0), 800);
      } else {
        // Player won
        api.audio.playWin();
        const score = currentPlayer === 'X' ? 100 : 50;
        setTimeout(() => api.onWin(score), 800);
      }
      return;
    }

    if (board.every(c => c !== null)) {
      winner = 'draw';
      state = 'ended';
      updateStatus();
      api.audio.playGameOver();
      setTimeout(() => api.onGameOver(25), 600);
      return;
    }

    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    updateStatus();

    if (vsAI && currentPlayer === 'O' && state === 'playing') {
      setTimeout(aiMove, 400);
    }
  }

  // --- AI (Minimax) ---
  function aiMove() {
    if (state !== 'playing') return;
    const idx = getBestMove(board, 'O');
    makeMove(idx);
  }

  function getBestMove(b, player) {
    let bestScore = -Infinity;
    let bestMove = -1;
    for (let i = 0; i < 9; i++) {
      if (b[i] !== null) continue;
      b[i] = player;
      const s = minimax(b, 0, false, player);
      b[i] = null;
      if (s > bestScore) { bestScore = s; bestMove = i; }
    }
    return bestMove;
  }

  function minimax(b, depth, isMaximizing, aiPlayer) {
    const humanPlayer = aiPlayer === 'O' ? 'X' : 'O';
    const win = checkWin(b);

    if (win) {
      const winPlayer = b[win[0]];
      return winPlayer === aiPlayer ? 10 - depth : depth - 10;
    }
    if (b.every(c => c !== null)) return 0;

    if (isMaximizing) {
      let best = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (b[i] !== null) continue;
        b[i] = aiPlayer;
        best = Math.max(best, minimax(b, depth + 1, false, aiPlayer));
        b[i] = null;
      }
      return best;
    } else {
      let best = Infinity;
      for (let i = 0; i < 9; i++) {
        if (b[i] !== null) continue;
        b[i] = humanPlayer;
        best = Math.min(best, minimax(b, depth + 1, true, aiPlayer));
        b[i] = null;
      }
      return best;
    }
  }

  function checkWin(b) {
    const lines = [
      [0,1,2],[3,4,5],[6,7,8],
      [0,3,6],[1,4,7],[2,5,8],
      [0,4,8],[2,4,6]
    ];
    for (const line of lines) {
      if (b[line[0]] && b[line[0]] === b[line[1]] && b[line[1]] === b[line[2]]) {
        return line;
      }
    }
    return null;
  }

  function highlightWin(line) {
    const cells = boardEl.querySelectorAll('.ttt-cell');
    line.forEach(i => cells[i].classList.add('ttt-win-cell'));
  }

  function drawWinLine(line) {
    const cells = boardEl.querySelectorAll('.ttt-cell');
    const start = cells[line[0]].getBoundingClientRect();
    const end = cells[line[2]].getBoundingClientRect();
    const boardRect = boardEl.getBoundingClientRect();

    const x1 = start.left + start.width / 2 - boardRect.left;
    const y1 = start.top + start.height / 2 - boardRect.top;
    const x2 = end.left + end.width / 2 - boardRect.left;
    const y2 = end.top + end.height / 2 - boardRect.top;

    const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;

    const lineEl = document.createElement('div');
    lineEl.className = 'ttt-win-line';
    lineEl.style.width = '0px';
    lineEl.style.height = '6px';
    lineEl.style.left = x1 + 'px';
    lineEl.style.top = (y1 - 3) + 'px';
    lineEl.style.transformOrigin = '0 50%';
    lineEl.style.transform = `rotate(${angle}deg)`;

    boardEl.appendChild(lineEl);
    
    // Force reflow
    lineEl.getBoundingClientRect();
    
    lineEl.style.width = length + 'px';
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
    if (boardEl) boardEl.removeEventListener('click', onCellClick);
    state = null;
  }

  window.PixPlayGames = window.PixPlayGames || {};
  window.PixPlayGames['tic-tac-toe'] = {
    init, start, pause, resume, restart, destroy, isPaused
  };
})();
