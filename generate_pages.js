const fs = require('fs');
const path = require('path');

const appJsPath = path.join(__dirname, 'assets', 'js', 'app.js');
const swJsPath = path.join(__dirname, 'sw.js');
const gamesDir = path.join(__dirname, 'games');

// 1. Extract GAMES array from app.js
const appJsContent = fs.readFileSync(appJsPath, 'utf8');
const gamesMatch = appJsContent.match(/const GAMES = (\[[\s\S]*?\]);/);

if (!gamesMatch) {
  console.error('Could not find GAMES array in app.js');
  process.exit(1);
}

// We use a safe way to parse the array without eval if possible, 
// but since it's a JS file with potentially complex objects, 
// a simple regex for IDs might be enough for our purpose.
const gameIds = [];
const idRegex = /id:\s*['"]([^'"]+)['"]/g;
let match;
while ((match = idRegex.exec(gamesMatch[1])) !== null) {
  gameIds.push(match[1]);
}

console.log('Found games:', gameIds);

// 2. Generate HTML pages
const template = fs.readFileSync(path.join(gamesDir, 'snake.html'), 'utf8');

gameIds.forEach(id => {
  const gamePagePath = path.join(gamesDir, `${id}.html`);
  if (!fs.existsSync(gamePagePath)) {
    console.log(`Generating ${id}.html...`);
    // Simple template replacement
    const game = appJsContent.match(new RegExp(`id:\\s*['"]${id}['"][\\s\\S]*?description:\\s*['"]([^'"]+)['"]`));
    const description = game ? game[1] : 'Play PixPlay games!';
    const nameMatch = appJsContent.match(new RegExp(`id:\\s*['"]${id}['"][\\s\\S]*?name:\\s*['"]([^'"]+)['"]`));
    const name = nameMatch ? nameMatch[1] : id;

    let content = template
      .replace(/<title>.*?<\/title>/, `<title>Play ${name} — PixPlay</title>`)
      .replace(/<meta name="description" content=".*?">/, `<meta name="description" content="${description}">`)
      .replace(/<body data-game-id=".*?">/, `<body data-game-id="${id}">`)
      .replace(/<h1 id="game-title" class="game-overlay__title">.*?<\/h1>/, `<h1 id="game-title" class="game-overlay__title">${name}</h1>`);
    
    fs.writeFileSync(gamePagePath, content);
  }
});

// 3. Update sw.js
let swContent = fs.readFileSync(swJsPath, 'utf8');
const assetsStart = swContent.indexOf('const ASSETS = [');
const assetsEnd = swContent.indexOf('];', assetsStart) + 2;

const newAssets = [
  "'./'",
  "'./index.html'",
  "'./manifest.json'",
  "'./assets/icon.svg'",
  "'./assets/css/index.css'",
  "'./assets/css/portal.css'",
  "'./assets/css/game.css'",
  "'./assets/js/app.js'",
  "'./assets/js/audio.js'",
  "'./assets/js/storage.js'",
  ...gameIds.map(id => `'./games/${id}.html'`),
  ...gameIds.map(id => `'./assets/js/games/${id}.js'`)
];

const newAssetsBlock = `const ASSETS = [\n  ${newAssets.join(',\n  ')}\n];`;
swContent = swContent.substring(0, assetsStart) + newAssetsBlock + swContent.substring(assetsEnd);

fs.writeFileSync(swJsPath, swContent);
console.log('Updated sw.js');
