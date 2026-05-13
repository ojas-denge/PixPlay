/* ============================================================
   PIXPLAY — Wordle Game
   5-letter word guessing game with 6 attempts,
   virtual keyboard, color feedback, animations
   ============================================================ */

(function () {
  'use strict';

  const WORD_LENGTH = 5;
  const MAX_GUESSES = 6;

  // Curated word list — common 5-letter English words
  const WORDS = [
    'about','above','abuse','actor','acute','admit','adopt','adult','after','again',
    'agent','agree','ahead','alarm','album','alert','alien','align','alive','alley',
    'allow','alone','along','alter','amino','angel','anger','angle','angry','anime',
    'ankle','apart','apple','apply','arena','argue','arise','armor','array','arrow',
    'aside','asset','atlas','avoid','awake','award','aware','badge','basic','basin',
    'basis','batch','beach','beast','began','begin','being','below','bench','berry',
    'birth','black','blade','blame','blank','blast','blaze','bleed','blend','bless',
    'blind','blink','bliss','block','blood','bloom','blown','board','bonus','boost',
    'booth','bound','brain','brand','brave','bread','break','breed','brick','bride',
    'brief','bring','broad','broke','brown','brush','buddy','build','bunch','burst',
    'buyer','cabin','cable','camel','candy','cargo','carry','catch','cause','cedar',
    'chain','chair','chalk','charm','chase','cheap','check','cheek','cheer','chess',
    'chest','chief','child','china','chunk','claim','class','clean','clear','clerk',
    'click','cliff','climb','cling','clock','clone','close','cloth','cloud','coach',
    'coast','color','comet','comic','coral','couch','could','count','court','cover',
    'crack','craft','crane','crash','crazy','cream','creed','creek','crime','crisp',
    'cross','crowd','crown','crude','crush','cubic','curve','cycle','daily','dance',
    'death','debut','delay','delta','demon','dense','depot','depth','derby','devil',
    'diary','dirty','doubt','dough','draft','drain','drake','drama','drank','drawn',
    'dream','dress','dried','drift','drill','drink','drive','drone','drops','drove',
    'drunk','dryer','dying','eager','eagle','early','earth','eight','elder','elect',
    'elite','email','empty','enemy','enjoy','enter','entry','equal','error','essay',
    'event','every','exact','exile','exist','extra','fable','faith','false','fancy',
    'fatal','fault','feast','fence','ferry','fever','fiber','field','fifth','fifty',
    'fight','final','flame','flash','fleet','flesh','float','flood','floor','flora',
    'flour','fluid','flush','flute','focal','focus','force','forge','forth','forum',
    'found','frame','frank','fraud','fresh','front','frost','froze','fruit','fully',
    'funny','ghost','giant','given','glass','globe','gloom','glory','gloss','glove',
    'grace','grade','grain','grand','grant','graph','grasp','grass','grave','great',
    'green','greet','grief','grill','grind','grip','gross','group','grove','grown',
    'guard','guess','guest','guide','guild','guilt','globe','habit','happy','harsh',
    'haven','heart','heavy','hedge','hello','hence','herbs','honey','honor','horse',
    'hotel','house','human','humor','hurry','ideal','image','imply','inbox','index',
    'indie','inner','input','inter','irony','ivory','jewel','joint','joker','judge',
    'juice','juicy','jumbo','knock','known','label','labor','large','laser','later',
    'laugh','layer','learn','lease','leave','legal','lemon','level','light','limit',
    'linen','liver','local','lodge','logic','login','loose','lover','lower','loyal',
    'lucky','lunch','lunar','lying','lyric','magic','major','maker','manor','maple',
    'march','match','mayor','medal','media','mercy','merge','metal','meter','might',
    'minor','minus','mixed','model','money','month','moral','motor','mount','mouse',
    'mouth','movie','music','naked','nasty','naval','nerve','never','newly','night',
    'noble','noise','north','noted','novel','nurse','nylon','ocean','offer','often',
    'olive','onset','opera','orbit','order','organ','other','outer','owner','oxide',
    'ozone','paint','panel','panic','paper','party','pasta','patch','pause','peace',
    'pearl','penny','phase','phone','photo','piano','piece','pilot','pitch','pixel',
    'pizza','place','plain','plane','plant','plate','plaza','plead','plots','plumb',
    'plume','plump','plunge','point','polar','polls','poppy','poser','pound','power',
    'press','price','pride','prime','prince','print','prior','prize','probe','prone',
    'proof','proud','prove','psalm','pulse','punch','pupil','purse','queen','query',
    'quest','queue','quick','quiet','quota','quote','radar','radio','rainy','raise',
    'rally','ranch','range','rapid','ratio','reach','ready','realm','rebel','refer',
    'reign','relax','relay','renal','renew','reply','rider','ridge','rifle','right',
    'rigid','risky','rival','river','robin','robot','rocky','rouge','rough','round',
    'route','royal','rugby','ruler','rural','sadly','saint','salad','salon','sandy',
    'sauce','scale','scare','scene','scent','scope','score','scout','screw','sedan',
    'sense','serve','seven','shade','shaft','shake','shall','shame','shape','share',
    'shark','sharp','shave','sheep','sheer','sheet','shelf','shell','shift','shine',
    'shirt','shock','shoot','shore','short','shout','sight','sigma','silly','since',
    'sixth','sixty','sized','skill','skull','slate','slave','sleep','slice','slide',
    'slope','smart','smell','smile','smoke','snake','solar','solid','solve','sorry',
    'sound','south','space','spare','spark','spawn','speak','speed','spend','spice',
    'spill','spine','split','spoke','spoon','sport','spray','squad','stack','staff',
    'stage','stain','stake','stale','stall','stamp','stand','stark','start','state',
    'stays','steal','steam','steel','steep','steer','stern','stick','stiff','still',
    'stock','stone','stood','store','storm','story','stout','stove','strap','straw',
    'strip','stuck','study','stuff','style','sugar','suite','sunny','super','surge',
    'swamp','swear','sweep','sweet','swift','swing','swipe','sword','swore','sworn',
    'syrup','table','taken','taste','teach','teeth','tempo','tense','terms','theft',
    'their','theme','thick','thief','thing','think','third','thorn','those','three',
    'threw','throw','thumb','tidal','tiger','tight','timer','tired','title','toast',
    'today','token','topic','total','touch','tough','towel','tower','toxic','trace',
    'track','trade','trail','train','trait','trash','treat','trend','trial','tribe',
    'trick','tried','troop','truly','trump','trunk','trust','truth','tumor','tuner',
    'twice','twist','tying','ultra','uncle','under','union','unite','unity','until',
    'upper','upset','urban','usage','usual','utter','valid','value','valve','vault',
    'venue','verse','video','vigor','vinyl','viral','virus','visit','vista','vital',
    'vivid','vocal','vodka','voice','voter','wages','waste','watch','water','waves',
    'weary','weave','wedge','weigh','weird','wheat','wheel','where','which','while',
    'white','whole','whose','width','witch','woman','women','world','worry','worse',
    'worst','worth','would','wound','wrath','write','wrong','wrote','yacht','young',
    'youth','zones'
  ];

  let api, boardEl, keyboardEl, wrapperEl;
  let targetWord, guesses, currentGuess, currentRow;
  let state; // 'ready' | 'playing' | 'won' | 'over'
  let letterStates; // track letter states for keyboard coloring

  function init(_container, _api) {
    api = _api;
    const container = _container;

    wrapperEl = document.createElement('div');
    wrapperEl.className = 'wordle-game';

    // Board
    let boardHTML = '<div class="wordle-board" id="wordle-board">';
    for (let r = 0; r < MAX_GUESSES; r++) {
      boardHTML += '<div class="wordle-row">';
      for (let c = 0; c < WORD_LENGTH; c++) {
        boardHTML += `<div class="wordle-cell" data-row="${r}" data-col="${c}"></div>`;
      }
      boardHTML += '</div>';
    }
    boardHTML += '</div>';

    // Keyboard
    const rows = [
      ['Q','W','E','R','T','Y','U','I','O','P'],
      ['A','S','D','F','G','H','J','K','L'],
      ['ENTER','Z','X','C','V','B','N','M','⌫']
    ];
    let kbHTML = '<div class="game-keyboard" id="wordle-keyboard">';
    for (const row of rows) {
      kbHTML += '<div class="game-keyboard__row">';
      for (const key of row) {
        const wide = (key === 'ENTER' || key === '⌫') ? ' game-key--wide' : '';
        kbHTML += `<button class="game-key${wide}" data-key="${key}">${key}</button>`;
      }
      kbHTML += '</div>';
    }
    kbHTML += '</div>';

    wrapperEl.innerHTML = boardHTML + kbHTML;
    container.appendChild(wrapperEl);

    boardEl = wrapperEl.querySelector('#wordle-board');
    keyboardEl = wrapperEl.querySelector('#wordle-keyboard');

    // Style injection
    if (!document.getElementById('style-wordle')) {
      const style = document.createElement('style');
      style.id = 'style-wordle';
      style.textContent = `
        .wordle-game {
          display: flex;
          flex-direction: row;
          align-items: flex-start;
          justify-content: center;
          gap: clamp(20px, 5vw, 60px);
          user-select: none;
          -webkit-user-select: none;
          width: 100%;
        }
        @media (max-width: 800px) {
          .wordle-game {
            flex-direction: column;
            align-items: center;
          }
        }
        .wordle-board {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .wordle-row {
          display: flex;
          gap: 6px;
        }
        .wordle-cell {
          width: clamp(48px, 12vw, 62px);
          height: clamp(48px, 12vw, 62px);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Outfit', sans-serif;
          font-size: clamp(1.4rem, 4vw, 1.9rem);
          font-weight: 800;
          text-transform: uppercase;
          border: 2px solid #25253d;
          border-radius: 8px;
          background: transparent;
          color: #f1f5f9;
          transition: border-color 0.15s, transform 0.1s;
        }
        .wordle-cell.active {
          border-color: #586577;
        }
        .wordle-cell.filled {
          border-color: #64748b;
          animation: wordlePop 0.1s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .wordle-cell.reveal {
          animation: wordleReveal 0.4s ease forwards;
        }
        .wordle-cell.correct {
          background: #22c55e;
          border-color: #22c55e;
          color: #fff;
        }
        .wordle-cell.present {
          background: #f59e0b;
          border-color: #f59e0b;
          color: #fff;
        }
        .wordle-cell.absent {
          background: #2a2a42;
          border-color: #2a2a42;
          color: #94a3b8;
        }
        .wordle-cell.shake {
          animation: wordleShake 0.4s ease;
        }
        .wordle-cell.bounce {
          animation: wordleBounce 0.5s ease;
        }
        @keyframes wordlePop {
          0% { transform: scale(0.85); }
          50% { transform: scale(1.08); }
          100% { transform: scale(1); }
        }
        @keyframes wordleReveal {
          0% { transform: rotateX(0); }
          50% { transform: rotateX(90deg); }
          100% { transform: rotateX(0); }
        }
        @keyframes wordleShake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-5px); }
          40% { transform: translateX(5px); }
          60% { transform: translateX(-3px); }
          80% { transform: translateX(3px); }
        }
        @keyframes wordleBounce {
          0%, 100% { transform: translateY(0); }
          40% { transform: translateY(-20px); }
        }
      `;
      document.head.appendChild(style);
    }

    // Events
    keyboardEl.addEventListener('click', onKeyboardClick);
    document.addEventListener('keydown', onPhysicalKey);

    reset();
  }

  function reset() {
    targetWord = WORDS[Math.floor(Math.random() * WORDS.length)].toUpperCase();
    guesses = [];
    currentGuess = '';
    currentRow = 0;
    state = 'playing';
    letterStates = {};

    // Clear board
    const cells = boardEl.querySelectorAll('.wordle-cell');
    cells.forEach(c => {
      c.textContent = '';
      c.className = 'wordle-cell';
    });

    // Clear keyboard colors
    keyboardEl.querySelectorAll('.game-key').forEach(k => {
      k.className = k.className.replace(/game-key--(correct|present|absent)/g, '').trim();
      if (k.dataset.key === 'ENTER' || k.dataset.key === '⌫') {
        k.className = 'game-key game-key--wide';
      } else {
        k.className = 'game-key';
      }
    });
  }

  function start() {
    // Wordle starts immediately, no start screen needed — the empty board IS the start screen
    state = 'playing';
  }

  // --- Input Handling ---
  function onKeyboardClick(e) {
    const btn = e.target.closest('.game-key');
    if (!btn) return;
    handleKey(btn.dataset.key);
  }

  function onPhysicalKey(e) {
    if (state !== 'playing') return;
    if (e.key === 'Enter') { handleKey('ENTER'); e.preventDefault(); }
    else if (e.key === 'Backspace') { handleKey('⌫'); e.preventDefault(); }
    else if (/^[a-zA-Z]$/.test(e.key)) { handleKey(e.key.toUpperCase()); }
  }

  function handleKey(key) {
    if (state !== 'playing') return;

    if (key === '⌫') {
      if (currentGuess.length > 0) {
        currentGuess = currentGuess.slice(0, -1);
        updateCurrentRow();
        api.audio.playClick();
      }
      return;
    }

    if (key === 'ENTER') {
      submitGuess();
      return;
    }

    // Letter
    if (currentGuess.length < WORD_LENGTH && /^[A-Z]$/.test(key)) {
      currentGuess += key;
      updateCurrentRow();
      api.audio.playKeyPress();
    }
  }

  function updateCurrentRow() {
    for (let c = 0; c < WORD_LENGTH; c++) {
      const cell = boardEl.querySelector(`[data-row="${currentRow}"][data-col="${c}"]`);
      const letter = currentGuess[c] || '';
      cell.textContent = letter;
      cell.classList.toggle('filled', letter !== '');
      cell.classList.toggle('active', c === currentGuess.length && currentGuess.length < WORD_LENGTH);
    }
    // Mark the next empty cell as active
    if (currentGuess.length < WORD_LENGTH) {
      const nextCell = boardEl.querySelector(`[data-row="${currentRow}"][data-col="${currentGuess.length}"]`);
      if (nextCell) nextCell.classList.add('active');
    }
  }

  function submitGuess() {
    if (currentGuess.length !== WORD_LENGTH) {
      shakeRow(currentRow);
      api.audio.playError();
      return;
    }

    const guess = currentGuess;
    const result = evaluateGuess(guess);

    // Animate reveal
    revealRow(currentRow, result, () => {
      // Update keyboard
      for (let i = 0; i < WORD_LENGTH; i++) {
        const letter = guess[i];
        const status = result[i];
        const prev = letterStates[letter];
        // Priority: correct > present > absent
        if (status === 'correct' || (status === 'present' && prev !== 'correct') || (!prev)) {
          letterStates[letter] = status;
        }
        const keyBtn = keyboardEl.querySelector(`[data-key="${letter}"]`);
        if (keyBtn) {
          keyBtn.classList.remove('game-key--correct', 'game-key--present', 'game-key--absent');
          keyBtn.classList.add(`game-key--${letterStates[letter]}`);
        }
      }

      // Check win
      if (guess === targetWord) {
        state = 'won';
        bounceRow(currentRow);
        api.audio.playWin();
        const score = (MAX_GUESSES - currentRow) * 100 + 100; // 700 for 1st, 200 for 6th
        api.updateScore(score);
        setTimeout(() => api.onWin(score), 800);
        return;
      }

      currentRow++;
      currentGuess = '';

      // Check lose
      if (currentRow >= MAX_GUESSES) {
        state = 'over';
        api.audio.playGameOver();
        
        let predictedScore = 0;
        for (const s of Object.values(letterStates)) {
          if (s === 'correct') predictedScore += 50;
          else if (s === 'present') predictedScore += 20;
        }
        
        if (predictedScore > 0) {
          api.updateScore(predictedScore);
        }
        
        setTimeout(() => api.onGameOver(predictedScore), 600);
        return;
      }
    });
  }

  function evaluateGuess(guess) {
    const result = Array(WORD_LENGTH).fill('absent');
    const targetArr = targetWord.split('');
    const guessArr = guess.split('');
    const used = Array(WORD_LENGTH).fill(false);

    // First pass: correct
    for (let i = 0; i < WORD_LENGTH; i++) {
      if (guessArr[i] === targetArr[i]) {
        result[i] = 'correct';
        used[i] = true;
        guessArr[i] = null;
      }
    }

    // Second pass: present
    for (let i = 0; i < WORD_LENGTH; i++) {
      if (guessArr[i] === null) continue;
      for (let j = 0; j < WORD_LENGTH; j++) {
        if (!used[j] && guessArr[i] === targetArr[j]) {
          result[i] = 'present';
          used[j] = true;
          break;
        }
      }
    }

    return result;
  }

  function revealRow(row, result, callback) {
    const cells = [];
    for (let c = 0; c < WORD_LENGTH; c++) {
      cells.push(boardEl.querySelector(`[data-row="${row}"][data-col="${c}"]`));
    }

    let revealed = 0;
    cells.forEach((cell, i) => {
      setTimeout(() => {
        cell.classList.add('reveal');
        setTimeout(() => {
          cell.classList.add(result[i]);
          cell.classList.remove('reveal', 'filled', 'active');
          if (result[i] === 'correct') api.audio.playCorrect();
          else if (result[i] === 'present') api.audio.playFlip();
          else api.audio.playMove();
          revealed++;
          if (revealed === WORD_LENGTH && callback) callback();
        }, 200);
      }, i * 250);
    });
  }

  function shakeRow(row) {
    for (let c = 0; c < WORD_LENGTH; c++) {
      const cell = boardEl.querySelector(`[data-row="${row}"][data-col="${c}"]`);
      cell.classList.add('shake');
      setTimeout(() => cell.classList.remove('shake'), 500);
    }
  }

  function bounceRow(row) {
    for (let c = 0; c < WORD_LENGTH; c++) {
      const cell = boardEl.querySelector(`[data-row="${row}"][data-col="${c}"]`);
      setTimeout(() => cell.classList.add('bounce'), c * 100);
    }
  }

  // --- Lifecycle ---
  function pause() {}
  function resume() {}
  function isPaused() { return false; }

  function restart() {
    reset();
    state = 'playing';
  }

  function destroy() {
    document.removeEventListener('keydown', onPhysicalKey);
    if (keyboardEl) keyboardEl.removeEventListener('click', onKeyboardClick);
    state = null;
  }

  // --- Register ---
  window.PixPlayGames = window.PixPlayGames || {};
  window.PixPlayGames['wordle'] = {
    init, start, pause, resume, restart, destroy, isPaused
  };
})();
