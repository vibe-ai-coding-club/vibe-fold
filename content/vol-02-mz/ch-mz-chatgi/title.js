(() => {
  const TEXT = 'MZ 찾기';
  const FONT_PX = 13;
  const ALPHA_CUTOFF = 110;
  const PAD = 2;
  const OUTLINE = '#2a1a12';
  const SHADOW = '#1d3557';
  const GLYPH_COLORS = ['#ffcc33', '#ff6b9d', '#3ddbd9', '#ff9a3c'];

  const canvas = document.getElementById('pixel-title');
  if (!canvas) return;

  const src = document.createElement('canvas');
  const sctx = src.getContext('2d');
  const font = `bold ${FONT_PX}px "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", sans-serif`;
  sctx.font = font;

  const ranges = [];
  let x = 0;
  let colorIndex = 0;
  for (const ch of TEXT) {
    const w = sctx.measureText(ch).width;
    if (ch.trim()) {
      ranges.push({ from: Math.floor(x), to: Math.ceil(x + w), color: GLYPH_COLORS[colorIndex % GLYPH_COLORS.length] });
      colorIndex += 1;
    }
    x += w;
  }

  const w = Math.ceil(x) + 2;
  const h = FONT_PX + 4;
  src.width = w;
  src.height = h;
  sctx.font = font;
  sctx.textBaseline = 'middle';
  sctx.fillStyle = '#000';
  sctx.fillText(TEXT, 1, h / 2 + 1);

  const alpha = sctx.getImageData(0, 0, w, h).data;
  const on = (px, py) => px >= 0 && py >= 0 && px < w && py < h && alpha[(py * w + px) * 4 + 3] > ALPHA_CUTOFF;
  const colorAt = (px) => (ranges.find((r) => px >= r.from && px < r.to) || ranges[ranges.length - 1]).color;

  canvas.width = w + PAD * 2 + 1;
  canvas.height = h + PAD * 2 + 1;
  const ctx = canvas.getContext('2d');

  const dot = (px, py, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(px + PAD, py + PAD, 1, 1);
  };

  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      if (on(px, py)) dot(px + 2, py + 2, SHADOW);
    }
  }
  for (let py = -1; py <= h; py++) {
    for (let px = -1; px <= w; px++) {
      if (on(px, py)) continue;
      if (on(px - 1, py) || on(px + 1, py) || on(px, py - 1) || on(px, py + 1)) dot(px, py, OUTLINE);
    }
  }
  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      if (!on(px, py)) continue;
      const highlight = !on(px, py - 1);
      dot(px, py, highlight ? '#ffffff' : colorAt(px));
    }
  }

  /** Room for chapter chrome + body padding (see style.css). */
  const CHROME_TOP = 78;
  const PAD_BOTTOM = 16;

  const fit = () => {
    const stage = document.querySelector('.stage');
    const stageMax = Math.min(window.innerWidth - 24, 1080);
    const maxWidth = stageMax;
    const widthScale = Math.max(2, Math.min(4, Math.floor(maxWidth / canvas.width) || 2));

    const apply = (scale, cell) => {
      canvas.style.width = `${canvas.width * scale}px`;
      canvas.style.height = `${canvas.height * scale}px`;
      document.documentElement.style.setProperty('--cell', `${cell}px`);
    };

    let scale = widthScale;
    let cell = 28;
    apply(scale, cell);
    if (!stage) return;

    const safeTop = parseFloat(getComputedStyle(document.body).paddingTop) || CHROME_TOP;
    const safeBottom = parseFloat(getComputedStyle(document.body).paddingBottom) || PAD_BOTTOM;
    const maxHeight = window.innerHeight - safeTop - safeBottom - 8;

    let guard = 0;
    while (stage.getBoundingClientRect().height > maxHeight && guard < 32) {
      if (cell > 18) cell -= 1;
      else if (scale > 2) scale -= 1;
      else if (cell > 14) cell -= 1;
      else break;
      apply(scale, cell);
      guard += 1;
    }
  };

  fit();
  requestAnimationFrame(fit);
  window.addEventListener('resize', fit);
})();
