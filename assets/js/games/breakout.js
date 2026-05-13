/* ============================================================
   PIXPLAY — Breakout Game
   Canvas-based brick breaker with paddle, ball physics,
   colored brick rows, lives, level progression
   ============================================================ */

(function () {
  'use strict';

  const WIDTH = 480;
  const HEIGHT = 600;
  const PADDLE_W = 80;
  const PADDLE_H = 14;
  const BALL_R = 7;
  const BRICK_ROWS = 6;
  const BRICK_COLS = 10;
  const BRICK_H = 20;
  const BRICK_GAP = 3;
  const BRICK_TOP = 60;
  const INITIAL_SPEED = 4.5;

  const ROW_COLORS = ['#ef4444','#f97316','#f59e0b','#22c55e','#3b82f6','#a855f7'];

  let canvas, ctx, api;
  let paddle, balls, bricks, score, lives, level, state;
  let animFrame, particles, powerups;
  let lastTime = 0, timePassed = 0;
  let pierceTimer = 0, slowTimer = 0;
  
  const POWERUP_TYPES = ['expand', 'life', 'slow', 'pierce', 'multiball'];

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

    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('click', onClick);
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    document.addEventListener('keydown', onKeyDown);

    reset();
    showStartScreen();
  }

  function reset() {
    level = 1;
    score = 0;
    lives = 3;
    particles = [];
    powerups = [];
    timePassed = 0;
    resetBall();
    createBricks();
    state = 'ready';
  }

  function resetBall() {
    paddle = { x: WIDTH / 2 - PADDLE_W / 2, y: HEIGHT - 40, w: PADDLE_W };
    pierceTimer = 0;
    slowTimer = 0;
    balls = [{
      x: WIDTH / 2,
      y: paddle.y - BALL_R - 2,
      vx: INITIAL_SPEED * (Math.random() > 0.5 ? 1 : -1) * 0.7,
      vy: -INITIAL_SPEED,
      stuck: true,
      piercing: false
    }];
  }

  function createBricks() {
    bricks = [];
    const brickW = (WIDTH - (BRICK_COLS + 1) * BRICK_GAP) / BRICK_COLS;
    for (let r = 0; r < BRICK_ROWS; r++) {
      for (let c = 0; c < BRICK_COLS; c++) {
        // 25% chance to skip a brick, creating random patterns (top row always solid)
        if (r > 0 && Math.random() < 0.25) continue;

        bricks.push({
          x: BRICK_GAP + c * (brickW + BRICK_GAP),
          y: BRICK_TOP + r * (BRICK_H + BRICK_GAP),
          w: brickW,
          h: BRICK_H,
          color: ROW_COLORS[Math.floor(Math.random() * ROW_COLORS.length)],
          alive: true,
          points: (BRICK_ROWS - r) * 10
        });
      }
    }
    
    // Fallback just in case
    if (bricks.length === 0) createBricks();
  }

  function showStartScreen() {
    render();
    ctx.fillStyle = 'rgba(7, 7, 13, 0.8)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '600 48px Outfit, sans-serif';
    ctx.fillStyle = '#f1f5f9';
    ctx.fillText('🧱', WIDTH / 2, HEIGHT / 2 - 55);
    ctx.font = '700 24px Outfit, sans-serif';
    ctx.fillText('Breakout', WIDTH / 2, HEIGHT / 2);
    ctx.font = '500 13px Inter, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Click or tap to launch the ball', WIDTH / 2, HEIGHT / 2 + 35);
    ctx.fillText('Move mouse/finger to control paddle', WIDTH / 2, HEIGHT / 2 + 55);
  }

  function start() {
    showStartScreen();
  }

  function beginGameplay() {
    if (state === 'playing') return;
    reset();
    state = 'playing';
    lastTime = Date.now();
    animLoop();
  }

  function launchBall() {
    if (!balls[0] || !balls[0].stuck) return;
    balls[0].stuck = false;
    balls[0].vx = INITIAL_SPEED * 0.7 * (Math.random() > 0.5 ? 1 : -1);
    balls[0].vy = -INITIAL_SPEED;
    api.audio.playClick();
  }

  // --- Game Loop ---
  function animLoop() {
    if (state !== 'playing') return;
    
    const now = Date.now();
    const dt = now - lastTime;
    timePassed += dt;
    lastTime = now;
    
    update(dt);
    render();
    animFrame = requestAnimationFrame(animLoop);
  }

  function update(dt) {
    if (pierceTimer > 0) {
      pierceTimer -= dt;
      if (pierceTimer <= 0) {
        for (let b of balls) b.piercing = false;
      }
    }
    if (slowTimer > 0) {
      slowTimer -= dt;
      if (slowTimer <= 0) {
        const speedMult = 1 + (level - 1) * 0.1;
        const targetSpeed = INITIAL_SPEED * speedMult;
        for (let b of balls) {
          const speed = Math.sqrt(b.vx**2 + b.vy**2);
          if (speed < targetSpeed * 0.9) {
            const ratio = targetSpeed / speed;
            b.vx *= ratio;
            b.vy *= ratio;
          }
        }
      }
    }

    // Balls update
    let activeBalls = [];
    for (let b of balls) {
      if (b.stuck) {
        b.x = paddle.x + paddle.w / 2;
        b.y = paddle.y - BALL_R - 2;
        activeBalls.push(b);
        continue;
      }

      b.x += b.vx;
      b.y += b.vy;

      // Wall collisions
      if (b.x - BALL_R <= 0 || b.x + BALL_R >= WIDTH) {
        b.vx = -b.vx;
        b.x = Math.max(BALL_R, Math.min(WIDTH - BALL_R, b.x));
        api.audio.playMove();
      }
      if (b.y - BALL_R <= 0) {
        b.vy = -b.vy;
        b.y = BALL_R;
        api.audio.playMove();
      }

      // Bottom — lose ball
      if (b.y + BALL_R >= HEIGHT) {
        continue;
      } else {
        activeBalls.push(b);
      }

      // Paddle collision
      if (b.vy > 0 &&
          b.y + BALL_R >= paddle.y &&
          b.y + BALL_R <= paddle.y + PADDLE_H + 5 &&
          b.x >= paddle.x &&
          b.x <= paddle.x + paddle.w) {
        const hitPos = (b.x - paddle.x) / paddle.w;
        const angle = (hitPos - 0.5) * Math.PI * 0.7;
        const speed = Math.sqrt(b.vx ** 2 + b.vy ** 2);
        b.vx = speed * Math.sin(angle);
        b.vy = -Math.abs(speed * Math.cos(angle));
        b.y = paddle.y - BALL_R - 1;
        api.audio.playClick();
      }

      // Brick collisions
      for (const brick of bricks) {
        if (!brick.alive) continue;
        if (b.x + BALL_R > brick.x &&
            b.x - BALL_R < brick.x + brick.w &&
            b.y + BALL_R > brick.y &&
            b.y - BALL_R < brick.y + brick.h) {
          brick.alive = false;
          score += brick.points;
          api.updateScore(score);
          api.audio.playScore();

          // Spawn particles
          for (let i = 0; i < 6; i++) {
            particles.push({
              x: brick.x + brick.w / 2,
              y: brick.y + brick.h / 2,
              vx: (Math.random() - 0.5) * 5,
              vy: (Math.random() - 0.5) * 5,
              life: 1,
              color: brick.color,
              size: 3 + Math.random() * 3
            });
          }
          
          // Power-up spawn (15% chance)
          if (Math.random() < 0.15) {
            powerups.push({
              x: brick.x + brick.w / 2 - 8,
              y: brick.y + brick.h / 2,
              vy: 2.5,
              type: POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)],
              w: 16,
              h: 16
            });
          }

          if (!b.piercing) {
            const fromLeft = b.x < brick.x;
            const fromRight = b.x > brick.x + brick.w;
            if (fromLeft || fromRight) b.vx = -b.vx;
            else b.vy = -b.vy;
          }
          break; // only one brick per frame per ball
        }
      }
    }

    balls = activeBalls;

    if (balls.length === 0) {
      lives--;
      if (lives <= 0) {
        state = 'over';
        cancelAnimationFrame(animFrame);
        api.onGameOver(score);
        return;
      }
      api.audio.playError();
      resetBall();
      return;
    }

    // Check level clear
    if (bricks.every(b => !b.alive)) {
      level++;
      createBricks();
      resetBall();
      // Increase speed slightly
      const speedMult = 1 + (level - 1) * 0.1;
      balls.forEach(b => b.vy = -INITIAL_SPEED * speedMult);
      api.audio.playLevelUp();
    }

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.12;
      p.life -= 0.03;
      if (p.life <= 0) particles.splice(i, 1);
    }
    
    // Update powerups
    for (let i = powerups.length - 1; i >= 0; i--) {
      const p = powerups[i];
      p.y += p.vy;
      // Paddle collision
      if (p.y + p.h >= paddle.y && p.y <= paddle.y + PADDLE_H && p.x + p.w >= paddle.x && p.x <= paddle.x + paddle.w) {
        if (p.type === 'expand') paddle.w = Math.min(WIDTH - 10, paddle.w + Math.max(5, Math.floor(1600 / paddle.w)));
        else if (p.type === 'life') lives++;
        else if (p.type === 'slow') {
           slowTimer = 5000;
           for (let b of balls) {
             const speed = Math.sqrt(b.vx**2 + b.vy**2);
             if (speed > INITIAL_SPEED * 0.8) {
               b.vx *= 0.8; b.vy *= 0.8;
             }
           }
        }
        else if (p.type === 'pierce') {
           pierceTimer = 10000;
           for (let b of balls) b.piercing = true;
        }
        else if (p.type === 'multiball') {
           let newBalls = [];
           for (let b of balls) {
             if (!b.stuck) {
               newBalls.push({ x: b.x, y: b.y, vx: b.vx * 0.8 - 1, vy: b.vy, stuck: false, piercing: b.piercing });
               newBalls.push({ x: b.x, y: b.y, vx: b.vx * 0.8 + 1, vy: b.vy, stuck: false, piercing: b.piercing });
             }
           }
           balls = balls.concat(newBalls);
        }
        api.audio.playLevelUp(); // reuse level up sound for powerup collection
        score += 50;
        api.updateScore(score);
        powerups.splice(i, 1);
      } else if (p.y > HEIGHT) {
        powerups.splice(i, 1);
      }
    }
  }

  // --- Rendering ---
  function render() {
    // Background
    ctx.fillStyle = '#0c0c1a';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Bricks
    for (const brick of bricks) {
      if (!brick.alive) continue;
      ctx.fillStyle = brick.color;
      ctx.shadowColor = brick.color;
      ctx.shadowBlur = 4;
      roundRect(ctx, brick.x, brick.y, brick.w, brick.h, 4);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Highlight
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(brick.x + 2, brick.y + 1, brick.w - 4, 3);
    }

    // Paddle
    const paddleGrad = ctx.createLinearGradient(paddle.x, 0, paddle.x + paddle.w, 0);
    paddleGrad.addColorStop(0, '#a855f7');
    paddleGrad.addColorStop(1, '#3b82f6');
    ctx.fillStyle = paddleGrad;
    ctx.shadowColor = '#a855f7';
    ctx.shadowBlur = 12;
    roundRect(ctx, paddle.x, paddle.y, paddle.w, PADDLE_H, 7);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Balls
    for (let b of balls) {
      ctx.beginPath();
      ctx.arc(b.x, b.y, BALL_R, 0, Math.PI * 2);
      ctx.fillStyle = b.piercing ? '#f97316' : '#f1f5f9';
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Ball trail
      ctx.beginPath();
      ctx.arc(b.x - b.vx * 0.5, b.y - b.vy * 0.5, BALL_R * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = b.piercing ? 'rgba(249,115,22,0.2)' : 'rgba(241,245,249,0.2)';
      ctx.fill();
    }

    // Particles
    for (const p of particles) {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    
    // Powerups
    for (const p of powerups) {
      ctx.fillStyle = p.type === 'expand' ? '#3b82f6' : (p.type === 'life' ? '#ef4444' : '#22c55e');
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 8;
      roundRect(ctx, p.x, p.y, p.w, p.h, 4);
      ctx.fill();
      
      // Initial
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#fff';
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      let icon = '';
      if (p.type === 'expand') icon = '↔';
      else if (p.type === 'life') icon = '♥';
      else if (p.type === 'slow') icon = '⏱';
      else if (p.type === 'pierce') icon = '🔥';
      else if (p.type === 'multiball') icon = '⚽';
      
      ctx.fillText(icon, p.x + p.w / 2, p.y + p.h / 2 + 1);
    }

    // Lives
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = '600 14px Inter, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('❤️'.repeat(lives), 10, 10);

    // Timer
    const secs = Math.floor(timePassed / 1000);
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    const timeStr = `${m}:${s < 10 ? '0'+s : s}`;
    ctx.textAlign = 'center';
    ctx.fillText(`⏱ ${timeStr}`, WIDTH / 2, 10);

    // Level
    ctx.textAlign = 'right';
    ctx.fillText(`Level ${level}`, WIDTH - 10, 10);
  }

  function roundRect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.lineTo(x + w - r, y);
    c.quadraticCurveTo(x + w, y, x + w, y + r);
    c.lineTo(x + w, y + h - r);
    c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    c.lineTo(x + r, y + h);
    c.quadraticCurveTo(x, y + h, x, y + h - r);
    c.lineTo(x, y + r);
    c.quadraticCurveTo(x, y, x + r, y);
    c.closePath();
  }

  // --- Input ---
  function onMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = WIDTH / rect.width;
    const mx = (e.clientX - rect.left) * scaleX;
    paddle.x = Math.max(0, Math.min(WIDTH - paddle.w, mx - paddle.w / 2));
  }

  function onTouchMove(e) {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const scaleX = WIDTH / rect.width;
    const tx = (e.touches[0].clientX - rect.left) * scaleX;
    paddle.x = Math.max(0, Math.min(WIDTH - paddle.w, tx - paddle.w / 2));
  }

  function onClick() {
    if (state === 'ready') { beginGameplay(); return; }
    if (state === 'over') { beginGameplay(); return; }
    if (balls[0] && balls[0].stuck) launchBall();
  }

  function onTouchStart(e) {
    e.preventDefault();
    onClick();
  }

  function onKeyDown(e) {
    if (e.key === ' ') {
      e.preventDefault();
      onClick();
    }
    if (state === 'playing') {
      if (e.key === 'ArrowLeft') paddle.x = Math.max(0, paddle.x - 30);
      if (e.key === 'ArrowRight') paddle.x = Math.min(WIDTH - paddle.w, paddle.x + 30);
    }
  }

  // Lifecycle
  function pause() {
    if (state === 'playing') { state = 'paused'; cancelAnimationFrame(animFrame); }
  }
  function resume() {
    if (state === 'paused') { 
      state = 'playing'; 
      lastTime = Date.now();
      animLoop(); 
    }
  }
  function isPaused() { return state === 'paused'; }

  function restart() {
    cancelAnimationFrame(animFrame);
    beginGameplay();
  }

  function destroy() {
    cancelAnimationFrame(animFrame);
    document.removeEventListener('keydown', onKeyDown);
    if (canvas) {
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('click', onClick);
      canvas.removeEventListener('touchstart', onTouchStart);
    }
    state = null;
  }

  window.PixPlayGames = window.PixPlayGames || {};
  window.PixPlayGames['breakout'] = {
    init, start, pause, resume, restart, destroy, isPaused
  };
})();
