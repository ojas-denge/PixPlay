/* ============================================================
   PIXPLAY — Snake Game
   Canvas-based Snake with smooth rendering, gradient snake,
   glowing food, speed progression, and touch controls
   ============================================================ */

(function () {
  'use strict';

  const CELL = 20;        // px per cell
  const COLS = 20;
  const ROWS = 20;
  const WIDTH = COLS * CELL;
  const HEIGHT = ROWS * CELL;

  const INITIAL_SPEED = 140;  // ms per tick
  const SPEED_STEP = 5;       // ms faster every 5 food eaten
  const MIN_SPEED = 55;       // fastest possible

  // Direction vectors
  const DIR = {
    UP:    { x:  0, y: -1 },
    DOWN:  { x:  0, y:  1 },
    LEFT:  { x: -1, y:  0 },
    RIGHT: { x:  1, y:  0 },
  };

  let canvas, ctx, api;
  let snake, food, direction, nextDirection;
  let score, speed, tickTimer, animFrame;
  let state; // 'ready' | 'playing' | 'paused' | 'over'
  let foodPulse = 0;
  let touchStartX, touchStartY;
  let particles = [];

  // --- Initialization ---
  function init(container, _api) {
    api = _api;

    canvas = document.createElement('canvas');
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    canvas.style.maxWidth = '100%';
    canvas.style.maxHeight = 'calc(100vh - 180px)';
    canvas.style.aspectRatio = `${COLS} / ${ROWS}`;
    container.appendChild(canvas);
    ctx = canvas.getContext('2d');

    // Touch support
    canvas.addEventListener('touchstart', onTouchStart, { passive: true });
    canvas.addEventListener('touchend', onTouchEnd, { passive: false });
    canvas.addEventListener('click', onCanvasClick);
    document.addEventListener('keydown', onKeyDown);

    reset();
    showStartScreen();
  }

  function reset() {
    const mid = Math.floor(COLS / 2);
    const midY = Math.floor(ROWS / 2);
    snake = [
      { x: mid, y: midY },
      { x: mid - 1, y: midY },
      { x: mid - 2, y: midY },
    ];
    direction = DIR.RIGHT;
    nextDirection = DIR.RIGHT;
    score = 0;
    speed = INITIAL_SPEED;
    foodPulse = 0;
    particles = [];
    spawnFood();
  }

  function showStartScreen() {
    state = 'ready';
    render();
    // Draw start overlay
    ctx.fillStyle = 'rgba(7, 7, 13, 0.82)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.font = '600 42px Outfit, sans-serif';
    ctx.fillStyle = '#f1f5f9';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🐍', WIDTH / 2, HEIGHT / 2 - 45);

    ctx.font = '700 22px Outfit, sans-serif';
    ctx.fillText('Snake', WIDTH / 2, HEIGHT / 2 + 5);

    ctx.font = '500 13px Inter, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Press any key or tap to start', WIDTH / 2, HEIGHT / 2 + 40);
  }

  // --- Game Loop ---
  function start() {
    // Called by app.js when overlay opens — just show start screen
    // Actual gameplay begins on user input (key press or tap)
    if (state === 'playing') return;
    showStartScreen();
  }

  function beginGameplay() {
    if (state === 'playing') return;
    reset();
    state = 'playing';
    scheduleTick();
    animLoop();
  }

  function scheduleTick() {
    clearTimeout(tickTimer);
    tickTimer = setTimeout(tick, speed);
  }

  function tick() {
    if (state !== 'playing') return;

    direction = nextDirection;

    // Move head
    const head = { ...snake[0] };
    head.x += direction.x;
    head.y += direction.y;

    // Wall collision
    if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
      gameOver(); return;
    }

    // Self collision
    for (let i = 0; i < snake.length; i++) {
      if (snake[i].x === head.x && snake[i].y === head.y) {
        gameOver(); return;
      }
    }

    snake.unshift(head);

    // Eat food?
    if (head.x === food.x && head.y === food.y) {
      score += 10;
      api.updateScore(score);
      api.audio.playCollect();

      // Spawn particles at food position
      spawnParticles(food.x * CELL + CELL / 2, food.y * CELL + CELL / 2);

      // Speed up
      const eaten = score / 10;
      if (eaten % 5 === 0 && speed > MIN_SPEED) {
        speed = Math.max(MIN_SPEED, speed - SPEED_STEP);
      }

      spawnFood();
    } else {
      snake.pop();
    }

    scheduleTick();
  }

  function animLoop() {
    if (state !== 'playing' && state !== 'paused') return;
    foodPulse += 0.06;
    updateParticles();
    render();
    animFrame = requestAnimationFrame(animLoop);
  }

  // --- Rendering ---
  function render() {
    // Background
    ctx.fillStyle = '#0c0c16';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Playable Border
    ctx.strokeStyle = '#22c55e'; // snake green
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, WIDTH - 4, HEIGHT - 4);

    // Subtle grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= COLS; x++) {
      ctx.beginPath();
      ctx.moveTo(x * CELL, 0);
      ctx.lineTo(x * CELL, HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y <= ROWS; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * CELL);
      ctx.lineTo(WIDTH, y * CELL);
      ctx.stroke();
    }

    // Food glow
    const fx = food.x * CELL + CELL / 2;
    const fy = food.y * CELL + CELL / 2;
    const glowRadius = 30 + Math.sin(foodPulse) * 8;
    const glow = ctx.createRadialGradient(fx, fy, 2, fx, fy, glowRadius);
    glow.addColorStop(0, 'rgba(239, 68, 68, 0.25)');
    glow.addColorStop(1, 'rgba(239, 68, 68, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(fx - glowRadius, fy - glowRadius, glowRadius * 2, glowRadius * 2);

    // Food
    const foodSize = CELL * 0.65 + Math.sin(foodPulse) * 2;
    ctx.beginPath();
    ctx.arc(fx, fy, foodSize / 2, 0, Math.PI * 2);
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Snake
    for (let i = snake.length - 1; i >= 0; i--) {
      const seg = snake[i];
      const t = i / Math.max(snake.length - 1, 1);
      const pad = i === 0 ? 1 : 2;
      const x = seg.x * CELL + pad;
      const y = seg.y * CELL + pad;
      const size = CELL - pad * 2;
      const radius = i === 0 ? 5 : 3;

      // Color gradient from head to tail: bright green → teal
      const r = Math.round(34 + t * (6 - 34));
      const g = Math.round(197 + t * (182 - 197));
      const b = Math.round(94 + t * (212 - 94));

      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;

      if (i === 0) {
        // Head glow
        ctx.shadowColor = '#22c55e';
        ctx.shadowBlur = 10;
      }

      // Rounded rect
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + size - radius, y);
      ctx.quadraticCurveTo(x + size, y, x + size, y + radius);
      ctx.lineTo(x + size, y + size - radius);
      ctx.quadraticCurveTo(x + size, y + size, x + size - radius, y + size);
      ctx.lineTo(x + radius, y + size);
      ctx.quadraticCurveTo(x, y + size, x, y + size - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
      ctx.fill();

      ctx.shadowBlur = 0;

      // Eyes on head
      if (i === 0) {
        ctx.fillStyle = '#f1f5f9';
        const eyeSize = 3;
        let ex1, ey1, ex2, ey2;
        if (direction === DIR.RIGHT) {
          ex1 = x + size - 5; ey1 = y + 5;
          ex2 = x + size - 5; ey2 = y + size - 5;
        } else if (direction === DIR.LEFT) {
          ex1 = x + 5; ey1 = y + 5;
          ex2 = x + 5; ey2 = y + size - 5;
        } else if (direction === DIR.UP) {
          ex1 = x + 5; ey1 = y + 5;
          ex2 = x + size - 5; ey2 = y + 5;
        } else {
          ex1 = x + 5; ey1 = y + size - 5;
          ex2 = x + size - 5; ey2 = y + size - 5;
        }
        ctx.beginPath();
        ctx.arc(ex1, ey1, eyeSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(ex2, ey2, eyeSize, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Particles
    renderParticles();
  }

  // --- Particles ---
  function spawnParticles(x, y) {
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 / 8) * i + Math.random() * 0.5;
      const speed = 1.5 + Math.random() * 2.5;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        size: 2 + Math.random() * 3,
        color: Math.random() > 0.5 ? '#22c55e' : '#ef4444',
      });
    }
  }

  function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.035;
      p.vx *= 0.96;
      p.vy *= 0.96;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  function renderParticles() {
    for (const p of particles) {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // --- Food Spawning ---
  function spawnFood() {
    const occupied = new Set(snake.map(s => `${s.x},${s.y}`));
    let pos;
    do {
      pos = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
    } while (occupied.has(`${pos.x},${pos.y}`));
    food = pos;
  }

  // --- Input ---
  function onKeyDown(e) {
    if (state === 'ready' || state === 'over') {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', ' '].includes(e.key)) {
        e.preventDefault();
        beginGameplay();
        return;
      }
    }
    if (state !== 'playing') return;

    switch (e.key) {
      case 'ArrowUp': case 'w': case 'W':
        if (direction !== DIR.DOWN) { nextDirection = DIR.UP; e.preventDefault(); } break;
      case 'ArrowDown': case 's': case 'S':
        if (direction !== DIR.UP) { nextDirection = DIR.DOWN; e.preventDefault(); } break;
      case 'ArrowLeft': case 'a': case 'A':
        if (direction !== DIR.RIGHT) { nextDirection = DIR.LEFT; e.preventDefault(); } break;
      case 'ArrowRight': case 'd': case 'D':
        if (direction !== DIR.LEFT) { nextDirection = DIR.RIGHT; e.preventDefault(); } break;
    }
  }

  function onTouchStart(e) {
    if (state === 'ready' || state === 'over') { beginGameplay(); return; }
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
    const minSwipe = 20;

    if (Math.abs(dx) > Math.abs(dy)) {
      if (Math.abs(dx) < minSwipe) return;
      if (dx > 0 && direction !== DIR.LEFT) nextDirection = DIR.RIGHT;
      else if (dx < 0 && direction !== DIR.RIGHT) nextDirection = DIR.LEFT;
    } else {
      if (Math.abs(dy) < minSwipe) return;
      if (dy > 0 && direction !== DIR.UP) nextDirection = DIR.DOWN;
      else if (dy < 0 && direction !== DIR.DOWN) nextDirection = DIR.UP;
    }
  }

  // --- Game State ---
  function onCanvasClick() {
    if (state === 'ready' || state === 'over') {
      beginGameplay();
    }
  }

  function gameOver() {
    state = 'over';
    clearTimeout(tickTimer);
    cancelAnimationFrame(animFrame);

    // Flash red overlay
    ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    api.onGameOver(score);
  }

  function pause() {
    if (state !== 'playing') return;
    state = 'paused';
    clearTimeout(tickTimer);
  }

  function resume() {
    if (state !== 'paused') return;
    state = 'playing';
    scheduleTick();
    animLoop();
  }

  function restart() {
    clearTimeout(tickTimer);
    cancelAnimationFrame(animFrame);
    beginGameplay();
  }

  function destroy() {
    clearTimeout(tickTimer);
    cancelAnimationFrame(animFrame);
    document.removeEventListener('keydown', onKeyDown);
    if (canvas) {
      canvas.removeEventListener('click', onCanvasClick);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchend', onTouchEnd);
    }
    state = null;
  }

  // --- Register ---
  window.PixPlayGames = window.PixPlayGames || {};
  window.PixPlayGames['snake'] = {
    init,
    start,
    pause,
    resume,
    restart,
    destroy,
    isPaused: () => state === 'paused',
  };
})();
