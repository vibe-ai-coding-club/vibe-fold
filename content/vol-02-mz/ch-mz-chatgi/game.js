(() => {
  const ROWS = 12;
  const COLS = 18;
  const MZ_COUNT = 28;
  const LONG_PRESS_MS = 420;

  const boardEl = document.getElementById('board');
  const mineCountEl = document.getElementById('mine-count');
  const timerEl = document.getElementById('timer');
  const faceBtn = document.getElementById('face');
  const muteBtn = document.getElementById('mute');
  const detailTextEl = document.getElementById('detail-text');
  const detailPreviewEl = document.getElementById('detail-preview');
  const detailIconEl = document.getElementById('detail-icon');
  const detailIcon2El = document.getElementById('detail-icon-2');

  /** @type {{ mine: boolean, open: boolean, flag: boolean, adj: number, face: number, blown: boolean, wrong: boolean, drop: null | { item: string, ownerFace: number } }[]} */
  let cells = [];
  let started = false;
  let over = false;
  let won = false;
  let flags = 0;
  let seconds = 0;
  let timerId = null;
  let muted = false;
  let audioCtx = null;
  let pressing = false;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function idx(r, c) {
    return r * COLS + c;
  }

  function inBounds(r, c) {
    return r >= 0 && r < ROWS && c >= 0 && c < COLS;
  }

  function neighbors(r, c) {
    const out = [];
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr;
        const nc = c + dc;
        if (inBounds(nr, nc)) out.push([nr, nc]);
      }
    }
    return out;
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function ensureAudio() {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) audioCtx = new AC();
    }
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
    if (window.MZMusic && !over) window.MZMusic.start();
  }

  function beep(freq, dur, type = 'square', gain = 0.04) {
    if (muted || !audioCtx) return;
    const t0 = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(g);
    g.connect(audioCtx.destination);
    osc.start(t0);
    osc.stop(t0 + dur);
  }

  function sfx(kind) {
    ensureAudio();
    if (kind === 'open') beep(520, 0.04);
    else if (kind === 'flag') beep(340, 0.06, 'triangle', 0.05);
    else if (kind === 'boom') {
      beep(120, 0.18, 'sawtooth', 0.07);
      setTimeout(() => beep(80, 0.22, 'square', 0.05), 40);
    } else if (kind === 'win') {
      beep(523, 0.08);
      setTimeout(() => beep(659, 0.08), 90);
      setTimeout(() => beep(784, 0.12), 180);
    }
  }

  function pad3(n) {
    const v = Math.max(0, Math.min(999, n | 0));
    return String(v).padStart(3, '0');
  }

  function setFace(state) {
    faceBtn.dataset.face = state;
    faceBtn.setAttribute('aria-label', state === 'win' ? '클리어. 다시 시작' : state === 'dead' ? '실패. 다시 시작' : '다시 시작');
  }

  function updateHud() {
    mineCountEl.textContent = pad3(MZ_COUNT - flags);
    timerEl.textContent = pad3(seconds);
  }

  function stopTimer() {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
  }

  function startTimer() {
    if (timerId) return;
    timerId = setInterval(() => {
      if (seconds < 999) seconds += 1;
      updateHud();
    }, 1000);
  }

  function emptyCell() {
    return {
      mine: false,
      open: false,
      flag: false,
      adj: 0,
      face: 0,
      blown: false,
      wrong: false,
      drop: null
    };
  }

  function placeMines(safeR, safeC) {
    const forbidden = new Set();
    if (safeR != null && safeC != null) {
      forbidden.add(idx(safeR, safeC));
      neighbors(safeR, safeC).forEach(([r, c]) => forbidden.add(idx(r, c)));
    }

    cells.forEach((c) => {
      c.mine = false;
      c.adj = 0;
      c.drop = null;
    });

    const pool = [];
    for (let i = 0; i < ROWS * COLS; i++) {
      if (!forbidden.has(i)) pool.push(i);
    }
    shuffle(pool);
    for (let k = 0; k < MZ_COUNT && k < pool.length; k++) {
      const i = pool[k];
      cells[i].mine = true;
      cells[i].face = k;
    }

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const i = idx(r, c);
        if (cells[i].mine) continue;
        let n = 0;
        for (const [nr, nc] of neighbors(r, c)) {
          if (cells[idx(nr, nc)].mine) n += 1;
        }
        cells[i].adj = n;
      }
    }
  }

  function dropMzItems() {
    cells.forEach((c) => {
      c.drop = null;
    });

    const mines = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const i = idx(r, c);
        if (cells[i].mine) mines.push([r, c, i]);
      }
    }
    shuffle(mines);

    for (const [mr, mc, mi] of mines) {
      const face = cells[mi].face;
      const item = window.MZItems.itemForFace(face);
      const nbrs = shuffle(neighbors(mr, mc).slice());
      let placed = false;
      for (const [nr, nc] of nbrs) {
        const ni = idx(nr, nc);
        if (cells[ni].drop) continue;
        cells[ni].drop = { item, ownerFace: face };
        placed = true;
        break;
      }
      if (!placed && nbrs.length) {
        const [nr, nc] = nbrs[0];
        cells[idx(nr, nc)].drop = { item, ownerFace: face };
      }
    }
  }

  function placeDecoyItems() {
    const empty = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const i = idx(r, c);
        if (cells[i].mine || cells[i].drop) continue;
        empty.push(i);
      }
    }
    shuffle(empty);
    const count = 5 + Math.floor(Math.random() * 4);
    for (let n = 0; n < count && n < empty.length; n++) {
      const i = empty[n];
      cells[i].drop = { item: window.MZItems.randomDecoyItem(), decoy: true };
    }
  }

  function buildBoard(safeR, safeC) {
    placeMines(safeR, safeC);
    dropMzItems();
    placeDecoyItems();
  }

  function reset() {
    stopTimer();
    started = false;
    over = false;
    won = false;
    flags = 0;
    seconds = 0;
    pressing = false;
    cells = Array.from({ length: ROWS * COLS }, () => emptyCell());
    buildBoard(null, null);
    setFace('idle');
    updateHud();
    render();
    window.dispatchEvent(new Event('resize'));
    if (audioCtx && window.MZMusic) window.MZMusic.start();
  }

  function openFlood(r, c) {
    const stack = [[r, c]];
    while (stack.length) {
      const [cr, cc] = stack.pop();
      const i = idx(cr, cc);
      const cell = cells[i];
      if (cell.open || cell.flag || cell.mine) continue;
      cell.open = true;
      if (cell.adj === 0) {
        for (const [nr, nc] of neighbors(cr, cc)) {
          const ni = idx(nr, nc);
          if (!cells[ni].open && !cells[ni].flag) stack.push([nr, nc]);
        }
      }
    }
  }

  function revealAllMines(hitIndex) {
    cells.forEach((cell, i) => {
      if (cell.mine) {
        cell.open = true;
        if (i === hitIndex) cell.blown = true;
      } else if (cell.flag) {
        cell.wrong = true;
        cell.open = true;
      }
    });
  }

  function checkWin() {
    const safeClosed = cells.some((c) => !c.mine && !c.open);
    if (safeClosed) return;
    won = true;
    over = true;
    stopTimer();
    cells.forEach((c) => {
      if (c.mine && !c.flag) {
        c.flag = true;
        flags += 1;
      }
    });
    setFace('win');
    if (window.MZMusic) window.MZMusic.stop();
    sfx('win');
    updateHud();
    render();
  }

  function openCell(r, c) {
    if (over) return;
    let i = idx(r, c);
    let cell = cells[i];
    if (cell.open || cell.flag) return;

    ensureAudio();
    if (!started) {
      started = true;
      startTimer();
      if (cell.mine) {
        buildBoard(r, c);
        i = idx(r, c);
        cell = cells[i];
      }
    }

    if (cell.mine) {
      cell.open = true;
      cell.blown = true;
      over = true;
      stopTimer();
      revealAllMines(i);
      setFace('dead');
      if (window.MZMusic) window.MZMusic.stop();
      sfx('boom');
      render();
      return;
    }

    openFlood(r, c);
    sfx('open');
    render();
    checkWin();
  }

  function toggleFlag(r, c) {
    if (over) return;
    const cell = cells[idx(r, c)];
    if (cell.open) return;
    ensureAudio();
    cell.flag = !cell.flag;
    flags += cell.flag ? 1 : -1;
    sfx('flag');
    updateHud();
    render();
  }

  function setDetail(r, c) {
    if (!detailTextEl || !window.MZLore) return;
    const cell = cells[idx(r, c)];
    detailTextEl.textContent = window.MZLore.describeCell(cell);

    const visual = window.MZLore.visualForCell(cell);
    if (!detailPreviewEl || !detailIconEl) return;

    if (!visual) {
      detailPreviewEl.hidden = true;
      detailIconEl.removeAttribute('src');
      if (detailIcon2El) {
        detailIcon2El.hidden = true;
        detailIcon2El.removeAttribute('src');
      }
      return;
    }

    detailPreviewEl.hidden = false;
    if (visual.kind === 'item') {
      detailIconEl.src = window.MZItems.getItemUrl(visual.item, 32);
      detailIconEl.alt = window.MZItems.label(visual.item);
      if (detailIcon2El) {
        detailIcon2El.hidden = true;
        detailIcon2El.removeAttribute('src');
      }
    } else {
      detailIconEl.src = window.MZSprites.getFaceUrl(visual.face, 32);
      detailIconEl.alt = window.MZLore.faceLine(visual.face).split(' — ')[0];
      if (detailIcon2El && visual.item) {
        detailIcon2El.hidden = false;
        detailIcon2El.src = window.MZItems.getItemUrl(visual.item, 32);
        detailIcon2El.alt = window.MZItems.label(visual.item);
      }
    }
  }

  function clearDetail() {
    if (!detailTextEl || !window.MZLore) return;
    detailTextEl.textContent = window.MZLore.DEFAULT;
    if (detailPreviewEl) detailPreviewEl.hidden = true;
    if (detailIconEl) detailIconEl.removeAttribute('src');
    if (detailIcon2El) {
      detailIcon2El.hidden = true;
      detailIcon2El.removeAttribute('src');
    }
  }

  function appendDropIcon(btn, drop) {
    const img = document.createElement('img');
    img.src = window.MZItems.getItemUrl(drop.item, 24);
    img.alt = '';
    img.draggable = false;
    img.className = 'cell-drop';
    btn.appendChild(img);
  }

  function render() {
    boardEl.replaceChildren();
    boardEl.style.setProperty('--cols', String(COLS));
    boardEl.style.setProperty('--rows', String(ROWS));

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cell = cells[idx(r, c)];
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'cell';
        btn.dataset.r = String(r);
        btn.dataset.c = String(c);
        btn.setAttribute('aria-label', cellLabel(cell, r, c));

        if (cell.open) {
          btn.classList.add('open');
          if (cell.mine) {
            btn.classList.add('mine');
            if (cell.blown) btn.classList.add('blown');
            const img = document.createElement('img');
            img.src = window.MZSprites.getFaceUrl(cell.face, 32);
            img.alt = '';
            img.draggable = false;
            img.className = 'mz-face';
            btn.appendChild(img);
          } else if (cell.wrong) {
            btn.classList.add('wrong');
            btn.textContent = '×';
          } else if (cell.adj > 0) {
            btn.classList.add(`n${cell.adj}`);
            btn.textContent = String(cell.adj);
          }
        } else if (cell.flag) {
          btn.classList.add('flag');
          btn.textContent = '⚑';
        } else if (cell.drop) {
          btn.classList.add('has-drop');
          appendDropIcon(btn, cell.drop);
        }

        wireCell(btn, r, c);
        boardEl.appendChild(btn);
      }
    }
  }

  function cellLabel(cell, r, c) {
    const pos = `${r + 1}행 ${c + 1}열`;
    if (cell.open) {
      if (cell.mine) return `MZ, ${pos}`;
      if (cell.adj) return `주변 MZ ${cell.adj}, ${pos}`;
      return `빈칸, ${pos}`;
    }
    if (cell.flag) return `MZ 표시, ${pos}`;
    if (cell.drop) {
      const name = window.MZItems.label(cell.drop.item);
      return `${name} 소지품, 주인은 이웃 칸, ${pos}`;
    }
    return `닫힌 칸, ${pos}`;
  }

  function wireCell(btn, r, c) {
    let longTimer = null;
    let longFired = false;
    let touchId = null;

    const clearLong = () => {
      if (longTimer) {
        clearTimeout(longTimer);
        longTimer = null;
      }
    };

    btn.addEventListener('mouseenter', () => setDetail(r, c));
    btn.addEventListener('mouseleave', clearDetail);
    btn.addEventListener('focus', () => setDetail(r, c));
    btn.addEventListener('blur', clearDetail);

    btn.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      toggleFlag(r, c);
    });

    btn.addEventListener('mousedown', (e) => {
      if (e.button !== 0 || over) return;
      pressing = true;
      if (!reduceMotion) setFace('press');
    });

    btn.addEventListener('mouseup', (e) => {
      if (e.button !== 0) return;
      pressing = false;
      if (!over && !won) setFace('idle');
    });

    btn.addEventListener('mouseleave', () => {
      if (pressing && !over && !won) {
        pressing = false;
        setFace('idle');
      }
    });

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (longFired) {
        longFired = false;
        return;
      }
      openCell(r, c);
      if (!over && !won) setFace('idle');
    });

    btn.addEventListener(
      'touchstart',
      (e) => {
        if (over) return;
        const t = e.changedTouches[0];
        touchId = t.identifier;
        longFired = false;
        if (!reduceMotion) setFace('press');
        clearLong();
        setDetail(r, c);
        longTimer = setTimeout(() => {
          longFired = true;
          toggleFlag(r, c);
          if (!over && !won) setFace('idle');
        }, LONG_PRESS_MS);
      },
      { passive: true }
    );

    const endTouch = (e) => {
      const t = [...e.changedTouches].find((x) => x.identifier === touchId);
      if (!t) return;
      clearLong();
      touchId = null;
      if (!over && !won) setFace('idle');
    };

    btn.addEventListener('touchend', endTouch);
    btn.addEventListener('touchcancel', endTouch);
  }

  faceBtn.addEventListener('click', () => {
    ensureAudio();
    reset();
  });

  muteBtn.addEventListener('click', () => {
    muted = !muted;
    muteBtn.setAttribute('aria-pressed', muted ? 'true' : 'false');
    muteBtn.textContent = muted ? '소리 끔' : '소리';
    if (window.MZMusic) window.MZMusic.setMuted(muted);
    if (!muted) ensureAudio();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'r' || e.key === 'R') {
      if (e.target === document.body || e.target === faceBtn) reset();
    }
  });

  window.MZGame = { ROWS, COLS, MZ_COUNT, reset };

  reset();
})();
