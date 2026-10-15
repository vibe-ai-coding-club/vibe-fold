/* Original 16×16 pixel heads — form from ref 1, color from ref 2. No IP copies. */
(() => {
  const SIZE = 16;

  // Palette: outline, hair, skin, accent (cheeks / lips / accessory)
  const FACES = [
    { o: '#2a1a12', h: '#1a1a1a', s: '#ffb070', a: '#e85d4c' }, // black hair
    { o: '#2a1a12', h: '#c45c26', s: '#ffc89a', a: '#ff6b9d' }, // auburn
    { o: '#2a1a12', h: '#4a2c6a', s: '#f0c8a0', a: '#7ec8e3' }, // purple
    { o: '#2a1a12', h: '#2d6a4f', s: '#ffe0b0', a: '#95d5b2' }, // green
    { o: '#2a1a12', h: '#b5651d', s: '#ffd7a8', a: '#f4a261' }, // brown
    { o: '#2a1a12', h: '#e9c46a', s: '#ffcc99', a: '#e76f51' }, // blond
    { o: '#2a1a12', h: '#264653', s: '#f4a261', a: '#2a9d8f' }, // teal hair
    { o: '#2a1a12', h: '#9b2226', s: '#ffb4a2', a: '#e5989b' }, // red
    { o: '#2a1a12', h: '#3d348b', s: '#f7d6c5', a: '#7678ed' }, // indigo
    { o: '#2a1a12', h: '#fb8500', s: '#ffe5b4', a: '#ffb703' }  // orange
  ];

  // Hair silhouette variants (rows of 16 bits as strings of 0/1/2… keyed below)
  // 0 empty, 1 outline, 2 hair, 3 skin, 4 accent, 5 eye
  const SHAPES = [
    // short crop
    [
      '0001111111110000',
      '0012222222221000',
      '0122222222222100',
      '0122333333322100',
      '0123333333332100',
      '0133353335333100',
      '0133353335333100',
      '0133333333333100',
      '0133334443333100',
      '0133333333333100',
      '0013333333331000',
      '0001333333310000',
      '0000133333100000',
      '0000011111000000',
      '0000000000000000',
      '0000000000000000'
    ],
    // side part / bangs
    [
      '0000111111100000',
      '0001222222210000',
      '0012222222221000',
      '0122223333222100',
      '0122233333322100',
      '0123353335332100',
      '0133353335333100',
      '0133333333333100',
      '0133334443333100',
      '0133333333333100',
      '0013333333331000',
      '0001333333310000',
      '0000133333100000',
      '0000011111000000',
      '0000000000000000',
      '0000000000000000'
    ],
    // bun / high hair
    [
      '0000012210000000',
      '0000122221000000',
      '0001222222100000',
      '0012222222210000',
      '0122222222221000',
      '0122233333222100',
      '0123353335332100',
      '0133353335333100',
      '0133333333333100',
      '0133334443333100',
      '0133333333333100',
      '0013333333331000',
      '0001333333310000',
      '0000133333100000',
      '0000011111000000',
      '0000000000000000'
    ],
    // glasses
    [
      '0001111111110000',
      '0012222222221000',
      '0122222222222100',
      '0122333333322100',
      '0123333333332100',
      '0133115335113100',
      '0133153335313100',
      '0133111111113100',
      '0133334443333100',
      '0133333333333100',
      '0013333333331000',
      '0001333333310000',
      '0000133333100000',
      '0000011111000000',
      '0000000000000000',
      '0000000000000000'
    ],
    // spiky
    [
      '0010101010101000',
      '0121212121212100',
      '0122222222222100',
      '0122233333222100',
      '0122333333322100',
      '0133353335333100',
      '0133353335333100',
      '0133333333333100',
      '0133334443333100',
      '0133333333333100',
      '0013333333331000',
      '0001333333310000',
      '0000133333100000',
      '0000011111000000',
      '0000000000000000',
      '0000000000000000'
    ],
    // long sides
    [
      '0000111111100000',
      '0001222222210000',
      '0012222222221000',
      '0122233333222100',
      '1222333333322210',
      '1233353335333210',
      '1233353335333210',
      '1233333333333210',
      '1233334443333210',
      '1233333333333210',
      '0123333333332100',
      '0121333333312100',
      '0120133333102100',
      '0120011111002100',
      '0012000000021000',
      '0001100000110000'
    ]
  ];

  function colorFor(ch, pal) {
    switch (ch) {
      case '1': return pal.o;
      case '2': return pal.h;
      case '3': return pal.s;
      case '4': return pal.a;
      case '5': return '#1a1a1a';
      default: return null;
    }
  }

  function drawFace(ctx, shapeIndex, paletteIndex, x, y, scale) {
    const shape = SHAPES[shapeIndex % SHAPES.length];
    const pal = FACES[paletteIndex % FACES.length];
    for (let row = 0; row < SIZE; row++) {
      const line = shape[row];
      for (let col = 0; col < SIZE; col++) {
        const c = colorFor(line[col], pal);
        if (!c) continue;
        ctx.fillStyle = c;
        ctx.fillRect(x + col * scale, y + row * scale, scale, scale);
      }
    }
  }

  function faceToDataURL(shapeIndex, paletteIndex, displaySize) {
    const canvas = document.createElement('canvas');
    canvas.width = displaySize;
    canvas.height = displaySize;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    const scale = displaySize / SIZE;
    drawFace(ctx, shapeIndex, paletteIndex, 0, 0, scale);
    return canvas.toDataURL('image/png');
  }

  const cache = [];
  function getFaceUrl(index, displaySize = 32) {
    const key = `${index}-${displaySize}`;
    if (!cache[key]) {
      const shape = index % SHAPES.length;
      const pal = index % FACES.length;
      // Offset shape vs palette so pairs feel varied
      cache[key] = faceToDataURL((shape + Math.floor(index / 3)) % SHAPES.length, pal, displaySize);
    }
    return cache[key];
  }

  window.MZSprites = {
    SIZE,
    FACE_COUNT: FACES.length,
    SHAPE_COUNT: SHAPES.length,
    getFaceUrl,
    drawFace
  };
})();
