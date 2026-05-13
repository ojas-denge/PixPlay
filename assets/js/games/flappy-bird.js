/* ============================================================
   PIXPLAY — Flappy Bird Game
   Canvas-based with gravity physics, pipe generation,
   parallax background, click/tap/space controls
   ============================================================ */

(function () {
  'use strict';

  const WIDTH = 400;
  const HEIGHT = 600;
  const GRAVITY = 0.45;
  const FLAP_FORCE = -7.5;
  const PIPE_WIDTH = 56;
  const PIPE_GAP = 155;
  const PIPE_SPEED = 2.5;
  const PIPE_INTERVAL = 1600; // ms between pipe spawns
  const BIRD_SIZE = 24;
  const BIRD_X = 80;

  let canvas, ctx, api;
  let bird, pipes, score, state;
  let lastPipeTime, animFrame, groundOffset;
  let particles = [];

  function init(container, _api) {
    api = _api;

    canvas = document.createElement('canvas');
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    canvas.style.maxWidth = '100%';
    canvas.style.maxHeight = 'calc(100vh - 180px)';
    canvas.style.borderRadius = '12px';
    container.appendChild(canvas);
    ctx = canvas.getContext('2d');

    canvas.addEventListener('click', onInput);
    canvas.addEventListener('touchstart', onTouchInput, { passive: false });
    document.addEventListener('keydown', onKeyDown);

    reset();
    showStartScreen();
  }

  function reset() {
    bird = { y: HEIGHT / 2 - 50, vy: 0, rotation: 0 };
    pipes = [];
    score = 0;
    lastPipeTime = 0;
    groundOffset = 0;
    particles = [];
    state = 'ready';
  }

  function showStartScreen() {
    state = 'ready';
    render();

    // Overlay
    ctx.fillStyle = 'rgba(7, 7, 13, 0.75)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.font = '600 48px Outfit, sans-serif';
    ctx.fillStyle = '#f1f5f9';
    ctx.fillText('🐦', WIDTH / 2, HEIGHT / 2 - 60);

    ctx.font = '700 26px Outfit, sans-serif';
    ctx.fillText('Flappy Bird', WIDTH / 2, HEIGHT / 2 - 5);

    ctx.font = '500 14px Inter, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Tap, Click, or press Space to flap', WIDTH / 2, HEIGHT / 2 + 35);
  }

  function start() {
    showStartScreen();
  }

  function beginGameplay() {
    if (state === 'playing') return;
    reset();
    state = 'playing';
    lastPipeTime = performance.now();
    flap();
    animLoop();
  }

  // --- Game Loop ---
  function animLoop() {
    if (state !== 'playing') return;
    update();
    render();
    animFrame = requestAnimationFrame(animLoop);
  }

  function update() {
    const now = performance.now();

    // Bird physics
    bird.vy += GRAVITY;
    bird.y += bird.vy;
    bird.rotation = Math.min(bird.vy * 3, 70);

    // Ground collision
    const groundY = HEIGHT - 60;
    if (bird.y + BIRD_SIZE >= groundY) {
      bird.y = groundY - BIRD_SIZE;
      gameOver();
      return;
    }

    // Ceiling
    if (bird.y < 0) {
      bird.y = 0;
      bird.vy = 0;
    }

    // Pipe spawning
    if (now - lastPipeTime > PIPE_INTERVAL) {
      const minTop = 80;
      const maxTop = HEIGHT - PIPE_GAP - 120;
      const topH = minTop + Math.random() * (maxTop - minTop);
      pipes.push({
        x: WIDTH,
        topH: topH,
        botY: topH + PIPE_GAP,
        scored: false
      });
      lastPipeTime = now;
    }

    // Move pipes
    for (let i = pipes.length - 1; i >= 0; i--) {
      const p = pipes[i];
      p.x -= PIPE_SPEED;

      // Score
      if (!p.scored && p.x + PIPE_WIDTH < BIRD_X) {
        p.scored = true;
        score++;
        api.updateScore(score);
        api.audio.playScore();
      }

      // Remove off-screen
      if (p.x + PIPE_WIDTH < -10) {
        pipes.splice(i, 1);
      }

      // Collision
      if (checkCollision(p)) {
        gameOver();
        return;
      }
    }

    // Ground scroll
    groundOffset = (groundOffset + PIPE_SPEED) % 40;

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const pt = particles[i];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.vy += 0.15;
      pt.life -= 0.03;
      if (pt.life <= 0) particles.splice(i, 1);
    }
  }

  function checkCollision(pipe) {
    const bx = BIRD_X;
    const by = bird.y;
    const bs = BIRD_SIZE;

    // Bird hitbox (slightly smaller for fairness)
    const pad = 3;
    const bLeft = bx + pad;
    const bRight = bx + bs - pad;
    const bTop = by + pad;
    const bBot = by + bs - pad;

    // Top pipe
    if (bRight > pipe.x && bLeft < pipe.x + PIPE_WIDTH) {
      if (bTop < pipe.topH || bBot > pipe.botY) {
        return true;
      }
    }
    return false;
  }

  function flap() {
    if (state !== 'playing') return;
    bird.vy = FLAP_FORCE;
    api.audio.playClick();

    // Wing particles
    for (let i = 0; i < 3; i++) {
      particles.push({
        x: BIRD_X + BIRD_SIZE / 2,
        y: bird.y + BIRD_SIZE,
        vx: -1 - Math.random() * 1.5,
        vy: 1 + Math.random() * 2,
        life: 1,
        size: 2 + Math.random() * 2,
      });
    }
  }

  // --- Rendering ---
  function render() {
    // Sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    skyGrad.addColorStop(0, '#0c0c24');
    skyGrad.addColorStop(0.6, '#141432');
    skyGrad.addColorStop(1, '#1a1a3e');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Stars
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    const starPositions = [
      [50, 40], [120, 80], [200, 30], [280, 90], [350, 50],
      [90, 150], [160, 120], [240, 160], [320, 130], [380, 100],
      [30, 200], [170, 220], [260, 200], [340, 240],
    ];
    for (const [sx, sy] of starPositions) {
      ctx.beginPath();
      ctx.arc(sx, sy, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Pipes
    for (const p of pipes) {
      drawPipe(p);
    }

    // Ground
    const groundY = HEIGHT - 60;
    ctx.fillStyle = '#16162e';
    ctx.fillRect(0, groundY, WIDTH, 60);

    // Ground pattern
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let gx = -groundOffset; gx < WIDTH; gx += 40) {
      ctx.beginPath();
      ctx.moveTo(gx, groundY);
      ctx.lineTo(gx + 20, groundY + 60);
      ctx.stroke();
    }
    ctx.fillStyle = '#22224a';
    ctx.fillRect(0, groundY, WIDTH, 3);

    // Bird
    drawBird();

    // Particles
    for (const pt of particles) {
      ctx.globalAlpha = pt.life * 0.6;
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size * pt.life, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Score (in-game)
    if (state === 'playing') {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.font = '800 48px Outfit, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.fillText(score, WIDTH / 2 + 2, 22);
      ctx.fillStyle = '#f1f5f9';
      ctx.fillText(score, WIDTH / 2, 20);
    }
  }

  function drawPipe(pipe) {
    const pipeGrad = ctx.createLinearGradient(pipe.x, 0, pipe.x + PIPE_WIDTH, 0);
    pipeGrad.addColorStop(0, '#1e6b3a');
    pipeGrad.addColorStop(0.3, '#22c55e');
    pipeGrad.addColorStop(0.7, '#22c55e');
    pipeGrad.addColorStop(1, '#16a34a');

    // Top pipe
    ctx.fillStyle = pipeGrad;
    ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topH);
    // Top pipe cap
    ctx.fillStyle = '#15803d';
    ctx.fillRect(pipe.x - 4, pipe.topH - 24, PIPE_WIDTH + 8, 24);
    // Cap highlight
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(pipe.x - 4, pipe.topH - 24, PIPE_WIDTH + 8, 3);

    // Bottom pipe
    ctx.fillStyle = pipeGrad;
    ctx.fillRect(pipe.x, pipe.botY, PIPE_WIDTH, HEIGHT - pipe.botY);
    // Bottom pipe cap
    ctx.fillStyle = '#15803d';
    ctx.fillRect(pipe.x - 4, pipe.botY, PIPE_WIDTH + 8, 24);
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(pipe.x - 4, pipe.botY, PIPE_WIDTH + 8, 3);
  }

  function drawBird() {
    ctx.save();
    ctx.translate(BIRD_X + BIRD_SIZE / 2, bird.y + BIRD_SIZE / 2);
    ctx.rotate((bird.rotation * Math.PI) / 180);

    // Body
    const bodyGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, BIRD_SIZE / 2);
    bodyGrad.addColorStop(0, '#fbbf24');
    bodyGrad.addColorStop(1, '#f59e0b');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, BIRD_SIZE / 2, BIRD_SIZE / 2.4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wing
    ctx.fillStyle = '#d97706';
    const wingY = Math.sin(performance.now() / 80) * 3;
    ctx.beginPath();
    ctx.ellipse(-3, wingY + 2, 8, 5, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // Eye
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(6, -4, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath();
    ctx.arc(7.5, -3.5, 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Beak
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(BIRD_SIZE / 2 - 2, -1);
    ctx.lineTo(BIRD_SIZE / 2 + 6, 2);
    ctx.lineTo(BIRD_SIZE / 2 - 2, 5);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  // --- Input ---
  function onInput(e) {
    e.preventDefault();
    if (state === 'ready' || state === 'over') { beginGameplay(); return; }
    flap();
  }

  function onTouchInput(e) {
    e.preventDefault();
    if (state === 'ready' || state === 'over') { beginGameplay(); return; }
    flap();
  }

  function onKeyDown(e) {
    if (e.key === ' ' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (state === 'ready' || state === 'over') { beginGameplay(); return; }
      flap();
    }
  }

  // --- Game State ---
  function gameOver() {
    state = 'over';
    cancelAnimationFrame(animFrame);

    // Death flash
    ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    api.onGameOver(score);
  }

  function pause() {
    if (state === 'playing') {
      state = 'paused';
      cancelAnimationFrame(animFrame);
    }
  }

  function resume() {
    if (state === 'paused') {
      state = 'playing';
      lastPipeTime = performance.now() - (PIPE_INTERVAL / 2);
      animLoop();
    }
  }

  function restart() {
    cancelAnimationFrame(animFrame);
    beginGameplay();
  }

  function destroy() {
    cancelAnimationFrame(animFrame);
    document.removeEventListener('keydown', onKeyDown);
    if (canvas) {
      canvas.removeEventListener('click', onInput);
      canvas.removeEventListener('touchstart', onTouchInput);
    }
    state = null;
  }

  window.PixPlayGames = window.PixPlayGames || {};
  window.PixPlayGames['flappy-bird'] = {
    init, start, pause, resume, restart, destroy,
    isPaused: () => state === 'paused',
  };
})();
