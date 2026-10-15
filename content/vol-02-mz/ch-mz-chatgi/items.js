/* Pixel MZ clutter — clues dropped on neighbor cells, not on the MZ tile itself. */
(() => {
  /** Bump when pixel art changes (cache-bust for data URLs + ?v= on script tag). */
  const SPRITE_REVISION = 7;
  const SIZE = 16;
  const O = '#2a1a12';

  // . empty · 1 outline · 2–7 fills
  const SHAPES = {
    shoe: {
      palette: { 2: '#ff6b9d', 3: '#ffffff', 4: '#d9d9d9', 5: '#ffffff' },
      rows: [
        '................',
        '................',
        '................',
        '................',
        '..1111..........',
        '..12221111......',
        '..122223331.....',
        '..1222223331....',
        '..12222222221...',
        '.12222555222221.',
        '.12222222222221.',
        '.13333333333331.',
        '.14444444444441.',
        '..111111111111..',
        '................',
        '................'
      ]
    },
    book: {
      palette: { 2: '#e63946', 3: '#ffffff', 5: '#9d0208', 6: '#fff3d6', 7: '#2a1a12' },
      rows: [
        '................',
        '................',
        '..111111111111..',
        '..152222222231..',
        '..152222222231..',
        '..152666666231..',
        '..152677776231..',
        '..152666666231..',
        '..152222222231..',
        '..152222222231..',
        '..152222222231..',
        '..152222222231..',
        '..153333333331..',
        '..111111111111..',
        '................',
        '................'
      ]
    },
    malang: {
      palette: { 2: '#ffc8dd', 3: '#ff8fab', 5: '#2a1a12' },
      rows: [
        '.......11.......',
        '......1..1......',
        '.......11.......',
        '.....111111.....',
        '...1122222211...',
        '..122222222221..',
        '.12222222222221.',
        '.12221222212221.',
        '.13322255222331.',
        '.12222222222221.',
        '..122222222221..',
        '...1122222211...',
        '.....111111.....',
        '................',
        '................',
        '................'
      ]
    },
    tumbler: {
      palette: { 2: '#74c69d', 3: '#d8f3dc', 4: '#adb5bd' },
      rows: [
        '.........1......',
        '.........1......',
        '....11111111....',
        '...1444444441...',
        '...1111111111...',
        '...122222222111.',
        '...1232222221.1.',
        '...1232222221.1.',
        '...1232222221.1.',
        '...1232222221.1.',
        '...123222222111.',
        '....12322221....',
        '....12222221....',
        '....11111111....',
        '................',
        '................'
      ]
    },
    buds: {
      palette: { 2: '#ffffff', 3: '#c0c0c0', 5: '#333333' },
      rows: [
        '................',
        '................',
        '................',
        '..1111....1111..',
        '.122221..122221.',
        '.125221..122521.',
        '.122221..122221.',
        '..11221..12211..',
        '...1221..1221...',
        '...1221..1221...',
        '...1221..1221...',
        '...1331..1331...',
        '....11....11....',
        '................',
        '................',
        '................'
      ]
    },
    cam: {
      palette: {
        2: '#7b2cbf',
        3: '#3a3a5a',
        4: '#111111',
        5: '#ff6b9d',
        6: '#ffffff',
        7: '#bde0fe'
      },
      rows: [
        '................',
        '................',
        '................',
        '.........1551...',
        '.11111111111111.',
        '.12222222222221.',
        '.16622111122721.',
        '.12221333312221.',
        '.12221364312221.',
        '.12221344312221.',
        '.12221333312221.',
        '.12222111122221.',
        '.12222222222221.',
        '.11111111111111.',
        '................',
        '................'
      ]
    },
    soju: {
      palette: { 2: '#2d9a4f', 3: '#8fe3a8', 4: '#ffffff', 5: '#1b7a3a', 7: '#cfd8dc' },
      rows: [
        '......1111......',
        '......1771......',
        '......1111......',
        '......1221......',
        '......1231......',
        '.....122321.....',
        '....12322221....',
        '....14444441....',
        '....14555541....',
        '....14444441....',
        '....12322221....',
        '....12322221....',
        '....12222221....',
        '....11111111....',
        '................',
        '................'
      ]
    },
    newspaper: {
      palette: { 3: '#f8f9fa', 4: '#868e96', 5: '#212529', 6: '#74c0fc' },
      rows: [
        '................',
        '................',
        '..111111111111..',
        '..133333333331..',
        '..135555555531..',
        '..133333333331..',
        '..136663444431..',
        '..136663333331..',
        '..136663444431..',
        '..133333333331..',
        '..134444444431..',
        '..133333333331..',
        '..134444443331..',
        '..111111111111..',
        '................',
        '................'
      ]
    },
    tie: {
      palette: { 2: '#1d3557', 3: '#e63946' },
      rows: [
        '................',
        '................',
        '......1111......',
        '.....122221.....',
        '......1221......',
        '......1231......',
        '.....123221.....',
        '.....122321.....',
        '....12232221....',
        '....12223221....',
        '....12222231....',
        '.....132221.....',
        '......1231......',
        '.......11.......',
        '................',
        '................'
      ]
    }
  };

  const LABELS = {
    shoe: '운동화',
    book: '책',
    malang: '말랑이',
    tumbler: '텀블러',
    buds: '이어폰',
    cam: '카메라',
    soju: '술',
    newspaper: '신문',
    tie: '넥타이'
  };

  /** Not dropped by MZ — decoys on random closed cells. */
  const DECOY_ITEMS = ['soju', 'newspaper', 'tie'];

  /** One item type per MZ face index (10 mines). */
  const ITEM_FOR_FACE = ['shoe', 'book', 'malang', 'tumbler', 'buds', 'cam', 'shoe', 'book', 'malang', 'tumbler'];

  function colorFor(ch, pal) {
    if (ch === '1') return O;
    return pal[ch] || null;
  }

  function drawItem(ctx, id, x, y, scale) {
    const def = SHAPES[id];
    if (!def) return;
    const { rows, palette } = def;
    for (let row = 0; row < SIZE; row++) {
      const line = rows[row];
      for (let col = 0; col < SIZE; col++) {
        const c = colorFor(line[col], palette);
        if (!c) continue;
        ctx.fillStyle = c;
        ctx.fillRect(x + col * scale, y + row * scale, scale, scale);
      }
    }
  }

  const cache = {};
  /** Rendered at an integer multiple of SIZE; CSS scales it with pixelated rendering. */
  function getItemUrl(id, displaySize = 24) {
    const key = `${SPRITE_REVISION}-${id}-${displaySize}`;
    if (cache[key]) return cache[key];
    const scale = Math.max(1, Math.round(displaySize / SIZE));
    const canvas = document.createElement('canvas');
    canvas.width = SIZE * scale;
    canvas.height = SIZE * scale;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    drawItem(ctx, id, 0, 0, scale);
    cache[key] = canvas.toDataURL('image/png');
    return cache[key];
  }

  function itemForFace(faceIndex) {
    return ITEM_FOR_FACE[faceIndex % ITEM_FOR_FACE.length];
  }

  function randomDecoyItem() {
    return DECOY_ITEMS[Math.floor(Math.random() * DECOY_ITEMS.length)];
  }

  function label(id) {
    return LABELS[id] || id;
  }

  window.MZItems = {
    ITEM_FOR_FACE,
    DECOY_ITEMS,
    getItemUrl,
    itemForFace,
    randomDecoyItem,
    label
  };
})();
