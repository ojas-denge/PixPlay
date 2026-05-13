# PixPlay Game Integration Guide

Adding a new game to the PixPlay portal is incredibly straightforward thanks to the modular architecture. Follow these instructions to seamlessly integrate a new game.

## 1. Create the Game Engine File

Create a new file in the `js/games/` directory (e.g., `my-new-game.js`).
Your game must be encapsulated within an IIFE (Immediately Invoked Function Expression) to prevent polluting the global scope, and it MUST register itself to the global `window.PixPlayGames` registry.

### Required API Contract

Your game must implement and expose the following lifecycle functions:

- `init(container, api)`: Called once when the game page loads.
  - `container`: The DOM element (`<div id="game-container">`) where your game should render (e.g., appending a `<canvas>` or `<div>` elements).
  - `api`: An object providing portal utilities:
    - `api.audio`: Sound engine (e.g., `api.audio.playClick()`, `api.audio.playWin()`).
    - `api.storage`: Storage engine for saving preferences if needed.
    - `api.updateScore(score)`: Call this to update the live score UI.
    - `api.updateBest(best)`: Call this to update the best score UI.
    - `api.onGameOver(finalScore)`: Call this when the player loses. It triggers the portal's Game Over modal and handles high score saving.
    - `api.onWin(finalScore)`: Call this when the player wins. Triggers the victory modal.
- `start()`: Called immediately after `init()`. Begin your game loop or logic here.
- `pause()`: Called when the user clicks the pause button. Pause your game loop.
- `resume()`: Called when the user unpauses. Resume your game loop.
- `isPaused()`: Must return a boolean indicating if the game is currently paused.
- `restart()`: Called when the user clicks "Restart" or "Play Again". Reset all internal states to zero and begin again.
- `destroy()`: (Optional but recommended) Clean up any global event listeners (like `keydown`) when the game is being torn down.

### Mobile Interactions & Scroll Locking

The PixPlay portal wrapper automatically attaches a global `touchmove` scroll lock (`e.preventDefault()`) to the main `#game-container`. This permanently disables mobile pull-to-refresh and native page bouncing while a user is actively playing *any* game. 

### Template Example
```javascript
(function () {
  'use strict';

  let container, api;
  let state = 'stopped';
  let score = 0;

  function init(_container, _api) {
    container = _container;
    api = _api;
    // 1. Setup Canvas or DOM elements inside container
    // 2. Add Event Listeners
  }

  function start() {
    state = 'playing';
    score = 0;
    // Begin game loop
  }

  function pause() {
    state = 'paused';
    // Halt animations/timers
  }

  function resume() {
    state = 'playing';
    // Resume animations/timers
  }

  function isPaused() {
    return state === 'paused';
  }

  function restart() {
    // Reset variables and start again
    start();
  }

  function destroy() {
    // Remove global event listeners
  }

  // Register the module
  window.PixPlayGames = window.PixPlayGames || {};
  window.PixPlayGames['my-new-game'] = {
    init, start, pause, resume, restart, destroy, isPaused
  };
})();
```

## 2. Register the Game in `js/app.js`

Open `js/app.js` and locate the `GAMES` array at the top of the file. Add a new object for your game:

```javascript
{
  id: 'my-new-game',           // MUST match the key used in window.PixPlayGames
  name: 'My New Game',         // Display name
  icon: '🚀',                  // Emoji icon
  category: 'arcade',          // Must match one of the categories in CATEGORIES array
  difficulty: 3,               // 1 to 5 stars
  color: '#eab308',            // Primary accent color
  gradient: 'linear-gradient(135deg, #ca8a04 0%, #a16207 100%)', // Card gradient
  glow: 'rgba(234, 179, 8, 0.2)', // Hover glow effect
  description: 'An exciting new adventure in space!',
  controls: 'Arrow Keys / Space', // Tooltip text
  controlsHTML: '<kbd>↑</kbd><kbd>↓</kbd> or <kbd>Space</kbd>', // Footer help UI
  scriptFile: 'js/games/my-new-game.js' // Path to your engine file
}
```

## 3. Re-generate the HTML Page

Once the game is registered in `js/app.js`, you simply need to run the generation script to create the dedicated page for it.

Open your terminal in the root directory and run:

```bash
node generate_pages.js
```

This will parse the updated `GAMES` list and automatically generate `games/my-new-game.html`.

## 4. Test It!

1. Open `index.html` in your browser.
2. You will see your new game card dynamically rendered.
3. Click it! The portal will load your HTML page, dynamically inject your script (`js/games/my-new-game.js`), call `init()`, and wire up the Score UI, Restart button, Pause button, and Audio systems automatically!
