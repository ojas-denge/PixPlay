/* ============================================================
   PIXPLAY — Typing Speed Test
   DOM-based typing test with real-time WPM, accuracy,
   character-by-character feedback, timed modes
   ============================================================ */

(function () {
  'use strict';

  const SENTENCES = [
    "The quick brown fox jumps over the lazy dog near the riverbank.",
    "A journey of a thousand miles begins with a single step forward.",
    "She sells seashells by the seashore every morning before sunrise.",
    "Every great achievement was once considered impossible by everyone.",
    "The best way to predict the future is to create it yourself today.",
    "Success is not final and failure is not fatal keep going forward.",
    "In the middle of every difficulty lies a hidden opportunity ahead.",
    "Practice makes perfect but nobody starts out being truly perfect.",
    "The only way to do great work is to love what you do every day.",
    "Life is what happens when you are busy making other plans daily.",
    "Knowledge speaks but wisdom listens carefully to understand truth.",
    "Stars cannot shine without darkness surrounding them in the sky.",
    "The greatest glory in living lies not in never falling but rising.",
    "It does not matter how slowly you go as long as you do not stop.",
    "Creativity is intelligence having fun with ideas and experiments.",
    "Be yourself because everyone else in this world is already taken.",
    "The future belongs to those who believe in the beauty of dreams.",
    "Do what you can with what you have wherever you are right now.",
    "Imagination is more important than knowledge in every endeavor.",
    "Happiness is not something readymade it comes from your actions.",
    "The only impossible journey is the one you never begin to take.",
    "You miss every shot you do not take so keep shooting for goals.",
    "Well done is better than well said in every aspect of your life.",
    "An investment in knowledge pays the best interest over the years.",
    "Innovation distinguishes between a leader and a follower always.",
  ];

  const TIME_OPTIONS = [15, 30, 60];

  let api, container, wrapperEl;
  let state, text, typed, startTime, timeLimit, timer, timerInterval;
  let correctChars, totalChars, currentIdx;
  let textEl, inputEl, wpmEl, accEl, timerDisplayEl;

  function init(_container, _api) {
    api = _api;
    container = _container;

    wrapperEl = document.createElement('div');
    wrapperEl.className = 'typing-game';
    container.appendChild(wrapperEl);

    if (!document.getElementById('style-typing')) {
      const style = document.createElement('style');
      style.id = 'style-typing';
      style.textContent = `
        .typing-game {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 18px;
          max-width: 680px;
          width: 100%;
          user-select: none;
        }
        .typing-modes {
          display: flex;
          gap: 8px;
        }
        .typing-mode-btn {
          padding: 6px 18px;
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
        .typing-mode-btn:hover { color: #f1f5f9; background: rgba(255,255,255,0.08); }
        .typing-mode-btn.active {
          color: #fff;
          background: linear-gradient(135deg, #a855f7, #3b82f6);
          border-color: transparent;
        }
        .typing-stats {
          display: flex;
          gap: 32px;
          font-family: 'JetBrains Mono', monospace;
        }
        .typing-stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
        }
        .typing-stat__value {
          font-size: 1.8rem;
          font-weight: 800;
          color: #f1f5f9;
        }
        .typing-stat__value.wpm { color: #a855f7; }
        .typing-stat__value.acc { color: #22c55e; }
        .typing-stat__value.time { color: #f59e0b; }
        .typing-stat__label {
          font-size: 0.7rem;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .typing-text-box {
          width: 100%;
          padding: 20px 24px;
          background: #1a1a2e;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.05);
          font-family: 'JetBrains Mono', monospace;
          font-size: clamp(0.95rem, 2.5vw, 1.15rem);
          line-height: 2;
          color: #3a3a5c;
          min-height: 120px;
          word-wrap: break-word;
          position: relative;
          box-shadow: 0 0 40px rgba(0,0,0,0.3);
        }
        .typing-char { transition: color 0.05s; }
        .typing-char.correct { color: #f1f5f9; }
        .typing-char.incorrect { color: #ef4444; background: rgba(239,68,68,0.15); border-radius: 2px; }
        .typing-char.current {
          border-left: 2px solid #a855f7;
          animation: typingCursor 0.8s step-end infinite;
          margin-left: -1px;
          padding-left: 1px;
        }
        @keyframes typingCursor {
          0%, 100% { border-color: #a855f7; }
          50% { border-color: transparent; }
        }
        .typing-hidden-input {
          position: absolute;
          opacity: 0;
          width: 0;
          height: 0;
        }
        .typing-hint {
          font-size: 0.85rem;
          color: #586577;
        }
        .typing-text-box.focused {
          border-color: rgba(168,85,247,0.3);
          box-shadow: 0 0 40px rgba(0,0,0,0.3), 0 0 0 3px rgba(168,85,247,0.08);
        }
        @media (max-width: 480px) {
          .typing-game {
            padding-bottom: 300px; /* Space for mobile keyboard */
            justify-content: flex-start;
          }
          .typing-text-box {
            font-size: 1rem;
            line-height: 1.6;
            min-height: 100px;
          }
          .typing-stats {
            gap: 16px;
          }
          .typing-stat__value {
            font-size: 1.4rem;
          }
        }
      `;
      document.head.appendChild(style);
    }

    timeLimit = 30;
    buildUI();
    reset();
  }

  function buildUI() {
    wrapperEl.innerHTML = `
      <div class="typing-modes" id="typing-modes">
        ${TIME_OPTIONS.map(t => `
          <button class="typing-mode-btn${t === timeLimit ? ' active' : ''}" data-time="${t}">${t}s</button>
        `).join('')}
      </div>
      <div class="typing-stats">
        <div class="typing-stat">
          <span class="typing-stat__value wpm" id="typing-wpm">0</span>
          <span class="typing-stat__label">WPM</span>
        </div>
        <div class="typing-stat">
          <span class="typing-stat__value acc" id="typing-acc">100</span>
          <span class="typing-stat__label">Accuracy %</span>
        </div>
        <div class="typing-stat">
          <span class="typing-stat__value time" id="typing-timer">${timeLimit}</span>
          <span class="typing-stat__label">Seconds</span>
        </div>
      </div>
      <div class="typing-text-box" id="typing-text-box"></div>
      <input type="text" class="typing-hidden-input" id="typing-input" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
      <div class="typing-hint" id="typing-hint">Click the text box and start typing!</div>
    `;

    textEl = wrapperEl.querySelector('#typing-text-box');
    inputEl = wrapperEl.querySelector('#typing-input');
    wpmEl = wrapperEl.querySelector('#typing-wpm');
    accEl = wrapperEl.querySelector('#typing-acc');
    timerDisplayEl = wrapperEl.querySelector('#typing-timer');

    // Focus management
    textEl.addEventListener('click', () => {
      inputEl.focus();
      textEl.classList.add('focused');
    });
    inputEl.addEventListener('blur', () => textEl.classList.remove('focused'));
    inputEl.addEventListener('focus', () => textEl.classList.add('focused'));

    // Allow scrolling within the typing game even if global scroll lock is active
    wrapperEl.addEventListener('touchmove', e => e.stopPropagation(), { passive: true });

    // Typing input
    inputEl.addEventListener('input', onInput);
    inputEl.addEventListener('keydown', e => {
      if (e.key === 'Backspace') {
        e.preventDefault(); // Prevent default, handle manually
        if (currentIdx > 0 && state === 'playing') {
          currentIdx--;
          typed = typed.slice(0, -1);
          renderText();
        }
      }
    });

    // Mode buttons
    wrapperEl.querySelector('#typing-modes').addEventListener('click', e => {
      const btn = e.target.closest('.typing-mode-btn');
      if (!btn) return;
      api.audio.playClick();
      timeLimit = parseInt(btn.dataset.time);
      wrapperEl.querySelectorAll('.typing-mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      reset();
    });
  }

  function reset() {
    // Generate text by combining random sentences
    const shuffled = [...SENTENCES].sort(() => Math.random() - 0.5);
    text = shuffled.slice(0, 4).join(' ');
    typed = '';
    currentIdx = 0;
    correctChars = 0;
    totalChars = 0;
    startTime = null;
    timer = timeLimit;
    state = 'waiting'; // waiting for first keypress
    clearInterval(timerInterval);

    if (inputEl) inputEl.value = '';
    if (timerDisplayEl) timerDisplayEl.textContent = timeLimit;
    if (wpmEl) wpmEl.textContent = '0';
    if (accEl) accEl.textContent = '100';
    if (wrapperEl.querySelector('#typing-hint')) {
      wrapperEl.querySelector('#typing-hint').textContent = 'Click the text box and start typing!';
    }

    renderText();
  }

  function renderText() {
    let html = '';
    for (let i = 0; i < text.length; i++) {
      let cls = 'typing-char';
      if (i < currentIdx) {
        cls += typed[i] === text[i] ? ' correct' : ' incorrect';
      } else if (i === currentIdx) {
        cls += ' current';
      }
      // Escape HTML
      let char = text[i];
      if (char === '<') char = '&lt;';
      else if (char === '>') char = '&gt;';
      else if (char === '&') char = '&amp;';
      html += `<span class="${cls}">${char}</span>`;
    }
    textEl.innerHTML = html;

    // Auto-scroll to keep current char visible
    const currentEl = textEl.querySelector('.current');
    if (currentEl) {
      const boxRect = textEl.getBoundingClientRect();
      const charRect = currentEl.getBoundingClientRect();
      if (charRect.bottom > boxRect.bottom - 10) {
        textEl.scrollTop += charRect.bottom - boxRect.bottom + 30;
      }
    }
  }

  function onInput(e) {
    if (state === 'over' || state === 'won') return;

    const val = e.data;
    if (!val) return;

    // Start timer on first input
    if (state === 'waiting') {
      state = 'playing';
      startTime = Date.now();
      timerInterval = setInterval(tickTimer, 1000);
      wrapperEl.querySelector('#typing-hint').textContent = 'Keep going!';
    }

    if (state !== 'playing') return;

    // Process each character
    for (const char of val) {
      if (currentIdx >= text.length) break;

      typed += char;
      totalChars++;
      if (char === text[currentIdx]) {
        correctChars++;
        api.audio.playKeyPress();
      } else {
        api.audio.playError();
      }
      currentIdx++;
    }

    inputEl.value = '';
    renderText();
    updateStats();

    // Check if text completed
    if (currentIdx >= text.length) {
      endGame(true);
    }
  }

  function tickTimer() {
    timer--;
    timerDisplayEl.textContent = timer;
    if (timer <= 5) api.audio.playTick();
    if (timer <= 0) {
      endGame(false);
    }
  }

  function updateStats() {
    const elapsed = (Date.now() - startTime) / 1000 / 60; // minutes
    const words = correctChars / 5;
    const wpm = elapsed > 0 ? Math.round(words / elapsed) : 0;
    const accuracy = totalChars > 0 ? Math.round((correctChars / totalChars) * 100) : 100;

    wpmEl.textContent = wpm;
    accEl.textContent = accuracy;
    
    // Score depends on accuracy as well as typing speed
    const score = Math.round(wpm * (accuracy / 100));
    api.updateScore(score);
  }

  function endGame(completed) {
    state = 'over';
    clearInterval(timerInterval);

    updateStats();
    const wpm = parseInt(wpmEl.textContent);
    const accuracy = parseInt(accEl.textContent);
    const score = Math.round(wpm * (accuracy / 100));

    wrapperEl.querySelector('#typing-hint').textContent =
      completed ? '✨ Text completed!' : '⏰ Time\'s up!';

    if (score > 0) {
      setTimeout(() => api.onGameOver(score), 500);
    }
  }

  function start() {
    inputEl.focus();
    state = 'waiting';
  }

  function pause() {}
  function resume() {}
  function isPaused() { return false; }

  function restart() {
    reset();
    inputEl.focus();
    state = 'waiting';
  }

  function destroy() {
    clearInterval(timerInterval);
    state = null;
  }

  window.PixPlayGames = window.PixPlayGames || {};
  window.PixPlayGames['typing-test'] = {
    init, start, pause, resume, restart, destroy, isPaused
  };
})();
