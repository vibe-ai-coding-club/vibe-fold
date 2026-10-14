/* 카드 — 열네 장을 흩뿌리고, 고른 장을 뒤집어 가운데로 끌어온다.

   카드는 평면 두 장을 등 맞대어 세운 것이다. 뒷면은 그대로, 앞면은 Y 축으로
   반 바퀴 돌려 놓는다. 둘 다 앞면만 그리므로(FrontSide) 묶음을 반 바퀴 돌리면
   보이던 쪽이 숨고 숨었던 쪽이 나온다. 뒤집기는 그 한 번의 회전이다.

   그림과 글씨는 캔버스에 그려 텍스처로 올린다. 외부 이미지가 없어도
   테두리와 달과 명조 활자가 그대로 나온다. */
window.Deck = (function () {
  var RATIO = Stage.RATIO;
  var DIST = Stage.DIST;
  var INK = "#f2ece4";

  var cards = [];
  var seeds = [];
  var geo = null; /* 카드 한 장 (1 × 1.5) */
  var unit = null; /* 글 한 줄을 붙일 평면 (1 × 1) */
  var backTex = null;
  var faceTex = null;

  var layer = null; /* 투명 버튼들이 사는 판 */
  var picked = null; /* 고른 장을 알리는 콜백 */
  var size = { cw: 0, rw: 0, rh: 0 };
  var m = null;

  /* ── 캔버스로 그리는 카드 그림 ───────────────────────────── */

  function rounded(x, l, t, w, h, r) {
    x.beginPath();
    x.moveTo(l + r, t);
    x.arcTo(l + w, t, l + w, t + h, r);
    x.arcTo(l + w, t + h, l, t + h, r);
    x.arcTo(l, t + h, l, t, r);
    x.arcTo(l, t, l + w, t, r);
    x.closePath();
  }

  function tex(canvas) {
    var t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  function sheet(w, h) {
    var c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    return c;
  }

  /* 카드 그림은 캔버스보다 조금 작게 그린다. 남은 테두리에 그림자가 떨어져
	   카드가 배경에서 들려 보인다. 평면은 캔버스 전체를 덮는다. */
  var PAD = 34;
  /* 평면 가운데에서 카드가 실제로 차지하는 몫. 나머지는 그림자 자리 */
  var PLATE = 1 - (PAD * 2) / 512;

  function plate(x, W, H, r) {
    rounded(x, PAD, PAD, W - PAD * 2, H - PAD * 2, r);
  }

  function backCanvas() {
    var W = 512;
    var H = 768;
    var r = 26;
    var c = sheet(W, H);
    var x = c.getContext("2d");

    var g = x.createLinearGradient(W * 0.1, 0, W * 0.9, H);
    g.addColorStop(0, "#222e57");
    g.addColorStop(0.55, "#0d1427");
    g.addColorStop(1, "#151d36");

    x.save();
    x.shadowColor = "rgba(0, 0, 0, 0.62)";
    x.shadowBlur = 26;
    x.shadowOffsetY = 12;
    plate(x, W, H, r);
    x.fillStyle = g;
    x.fill();
    x.restore();

    x.save();
    plate(x, W, H, r);
    x.clip();

    var halo = x.createRadialGradient(
      W / 2,
      H * 0.36,
      0,
      W / 2,
      H * 0.36,
      W * 0.6,
    );
    halo.addColorStop(0, "rgba(242, 236, 228, 0.13)");
    halo.addColorStop(1, "rgba(242, 236, 228, 0)");
    x.fillStyle = halo;
    x.fillRect(0, 0, W, H);

    /* 사선 결. 가까이 가면 보이고 멀리서는 종이처럼 뭉친다 */
    x.strokeStyle = "rgba(242, 236, 228, 0.055)";
    x.lineWidth = 1;
    for (var d = -H; d < W + H; d += 14) {
      x.beginPath();
      x.moveTo(d, 0);
      x.lineTo(d + H, H);
      x.stroke();
    }
    x.restore();

    rounded(
      x,
      PAD + 14,
      PAD + 14,
      W - (PAD + 14) * 2,
      H - (PAD + 14) * 2,
      r * 0.6,
    );
    x.strokeStyle = "rgba(242, 236, 228, 0.16)";
    x.lineWidth = 2;
    x.stroke();

    /* 달 하나 */
    x.beginPath();
    x.arc(W / 2, H * 0.37, W * 0.13, 0, Math.PI * 2);
    x.strokeStyle = "rgba(242, 236, 228, 0.6)";
    x.lineWidth = 2.6;
    x.save();
    x.shadowColor = "rgba(242, 236, 228, 0.5)";
    x.shadowBlur = 26;
    x.stroke();
    x.restore();
    x.stroke();

    /* 달 아래 점 셋. 뽑을 장수다 */
    for (var i = 0; i < 3; i++) {
      x.beginPath();
      x.arc(W / 2 + (i - 1) * W * 0.078, H * 0.6, 4, 0, Math.PI * 2);
      x.fillStyle = "rgba(242, 236, 228, 0.5)";
      x.fill();
    }

    plate(x, W, H, r);
    x.strokeStyle = "rgba(242, 236, 228, 0.3)";
    x.lineWidth = 2;
    x.stroke();
    return c;
  }

  function faceCanvas() {
    var W = 512;
    var H = 768;
    var r = 26;
    var c = sheet(W, H);
    var x = c.getContext("2d");

    /* 반쯤 비치게 둔다. 뒤에서 흐르는 배경이 글 뒤로 지나가도록 */
    var g = x.createLinearGradient(0, 0, W * 0.4, H);
    g.addColorStop(0, "rgba(23, 29, 52, 0.86)");
    g.addColorStop(1, "rgba(8, 11, 20, 0.92)");

    x.save();
    x.shadowColor = "rgba(0, 0, 0, 0.7)";
    x.shadowBlur = 30;
    x.shadowOffsetY = 14;
    plate(x, W, H, r);
    x.fillStyle = g;
    x.fill();
    x.restore();

    x.save();
    plate(x, W, H, r);
    x.clip();
    var halo = x.createRadialGradient(
      W / 2,
      H * 0.44,
      0,
      W / 2,
      H * 0.44,
      W * 0.76,
    );
    halo.addColorStop(0, "rgba(242, 236, 228, 0.11)");
    halo.addColorStop(1, "rgba(242, 236, 228, 0)");
    x.fillStyle = halo;
    x.fillRect(0, 0, W, H);
    x.restore();

    /* 글이 놓일 자리를 위아래 가는 줄로 끊어 둔다 */
    x.strokeStyle = "rgba(242, 236, 228, 0.22)";
    x.lineWidth = 1.6;
    [0.17, 0.83].forEach(function (at) {
      x.beginPath();
      x.moveTo(W * 0.3, H * at);
      x.lineTo(W * 0.7, H * at);
      x.stroke();
    });

    plate(x, W, H, r);
    x.strokeStyle = "rgba(242, 236, 228, 0.34)";
    x.lineWidth = 2;
    x.stroke();
    return c;
  }

  /* ── 글씨 ───────────────────────────────────────────────── */

  function greedy(x, text, maxW) {
    var words = text.split(" ");
    var rows = [];
    var line = "";
    for (var i = 0; i < words.length; i++) {
      var join = line ? line + " " + words[i] : words[i];
      if (line && x.measureText(join).width > maxW) {
        rows.push(line);
        line = words[i];
      } else {
        line = join;
      }
    }
    if (line) rows.push(line);
    return rows;
  }

  /* 넘치는 줄을 그냥 끊으면 '안 / 됐다면' 처럼 어색하게 갈린다.
	   줄 수를 그대로 두는 가장 좁은 폭을 찾아, 두 토막을 고르게 맞춘다. */
  function wrap(x, text, maxW) {
    var rows = greedy(x, text, maxW);
    if (rows.length < 2) return rows;
    var lo = 0;
    var hi = maxW;
    for (var i = 0; i < 16; i++) {
      var mid = (lo + hi) / 2;
      if (greedy(x, text, mid).length <= rows.length) hi = mid;
      else lo = mid;
    }
    return greedy(x, text, hi);
  }

  /* 한 줄을 캔버스에 그려 텍스처로 돌려준다. 폭과 높이는 카드 폭에 대한
	   비율로 준다 — 카드가 커지면 글도 같이 커지도록. */
  function lineTexture(text, cardPx) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    var plate = cardPx * PLATE; /* 그림자 자리를 뺀 진짜 카드 폭 */
    var fontPx = plate * 0.082 * dpr;
    var maxW = plate * 0.82 * dpr;
    var font = "400 " + fontPx.toFixed(1) + 'px "Gowun Batang", serif';

    var c = sheet(8, 8);
    var x = c.getContext("2d");
    x.font = font;
    var rows = wrap(x, text, maxW);

    var lh = fontPx * 1.58;
    var pad = fontPx * 0.5; /* 그림자가 잘리지 않을 만큼 */
    c.width = Math.ceil(maxW + pad * 2);
    c.height = Math.ceil(rows.length * lh + pad * 2);

    x.font = font;
    x.textAlign = "center";
    x.textBaseline = "middle";
    x.fillStyle = INK;
    x.shadowColor = "rgba(0, 0, 0, 0.6)";
    x.shadowBlur = fontPx * 0.8;
    x.shadowOffsetY = fontPx * 0.08;
    for (var i = 0; i < rows.length; i++) {
      x.fillText(rows[i], c.width / 2, pad + lh * (i + 0.5));
    }

    return {
      tex: tex(c),
      w: c.width / dpr / cardPx,
      h: c.height / dpr / cardPx,
    };
  }

  /* ── 카드 한 장 ─────────────────────────────────────────── */

  function make(i) {
    var group = new THREE.Group();

    var backMat = new THREE.MeshBasicMaterial({
      map: backTex,
      transparent: true,
    });
    var back = new THREE.Mesh(geo, backMat);
    back.position.z = 0.004;

    var faceMat = new THREE.MeshBasicMaterial({
      map: faceTex,
      transparent: true,
    });
    var face = new THREE.Group();
    face.rotation.y = Math.PI;
    face.position.z = -0.004;
    face.add(new THREE.Mesh(geo, faceMat));

    group.add(back);
    group.add(face);
    Stage.addDeep(group);

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pick";
    btn.setAttribute("aria-label", i + 1 + "번 카드");
    layer.appendChild(btn);

    var card = {
      i: i,
      group: group,
      face: face,
      mats: [backMat, faceMat],
      lines: [],
      btn: btn,
      home: null,
      anim: null,
      hover: null,
      /* 지금 이 카드가 머무는 밝기. 손이 닿으면 여기서 더 밝아진다 */
      base: 1,
      /* 겹쳐 둔 버튼이 기울어 있는 각도 */
      spin: "",
      /* 지금 머무는 자리의 이름. 창이 바뀌면 이걸 보고 다시 앉힌다 */
      spot: "home",
      slot: 0,
    };

    btn.addEventListener("click", function () {
      if (picked) picked(i);
    });
    btn.addEventListener("pointerenter", function () {
      raise(card, true);
    });
    btn.addEventListener("pointerleave", function () {
      raise(card, false);
    });
    btn.addEventListener("focus", function () {
      raise(card, true);
    });
    btn.addEventListener("blur", function () {
      raise(card, false);
    });

    return card;
  }

  var LIFT = 0.5; /* 손이 닿은 카드가 앞으로 나오는 깊이 */

  function raise(card, on) {
    if (!card.home || layer.classList.contains("is-off")) return;
    if (card.hover) Stage.cut(card.hover);
    /* 카드가 앞으로 나오면 그만큼 커 보인다. 겹쳐 둔 버튼도 같이 키워야
		   포커스 테두리가 카드에서 어긋나지 않는다 */
    card.btn.style.transform =
      card.spin +
      (on ? " scale(" + (DIST / (DIST - LIFT)).toFixed(4) + ")" : "");
    var z0 = card.group.position.z;
    var z1 = on ? card.home.z + LIFT : card.home.z;
    var c0 = card.mats[0].color.r;
    var c1 = on ? card.base + 0.45 : card.base;
    card.hover = Stage.tween(0.3, Stage.EASE.out, function (e) {
      card.group.position.z = z0 + (z1 - z0) * e;
      card.mats[0].color.setScalar(c0 + (c1 - c0) * e);
    });
  }

  /* 밝기를 옮긴다. 한 장을 고르고 나면 나머지는 한 단 물러선다 */
  function shade(card, to) {
    card.base = to;
    if (card.hover) Stage.cut(card.hover);
    var c0 = card.mats[0].color.r;
    card.hover = Stage.tween(0.5, Stage.EASE.out, function (e) {
      card.mats[0].color.setScalar(c0 + (to - c0) * e);
    });
  }

  /* ── 자리 ───────────────────────────────────────────────── */

  function state(card) {
    return {
      x: card.group.position.x,
      y: card.group.position.y,
      z: card.group.position.z,
      ry: card.group.rotation.y,
      rz: card.group.rotation.z,
      s: card.group.scale.x,
      o: card.mats[0].opacity,
    };
  }

  function set(card, s) {
    card.group.position.set(s.x, s.y, s.z);
    card.group.rotation.y = s.ry;
    card.group.rotation.z = s.rz;
    card.group.scale.setScalar(s.s);
  }

  function move(card, to, dur, ease, done) {
    var from = state(card);
    if (card.anim) Stage.cut(card.anim);
    if (card.hover) Stage.cut(card.hover);
    card.anim = Stage.tween(
      dur,
      ease,
      function (e, p) {
        set(card, {
          x: from.x + (to.x - from.x) * e,
          y: from.y + (to.y - from.y) * e,
          /* 앞으로 한 번 솟았다가 제자리로. 뒤집히는 동안 가까워진다 */
          z:
            from.z +
            (to.z - from.z) * e +
            (to.arc || 0) * Math.sin(Math.PI * p),
          ry: from.ry + (to.ry - from.ry) * e,
          rz: from.rz + (to.rz - from.rz) * e,
          s: from.s + (to.s - from.s) * e,
        });
        /* 글줄은 저마다 따로 흐려지므로 여기서는 카드만 다룬다 */
        if (to.o != null) {
          var o = from.o + (to.o - from.o) * e;
          for (var i = 0; i < card.mats.length; i++) card.mats[i].opacity = o;
        }
      },
      done,
    );
    return card.anim;
  }

  /* 열네 장을 몇 줄로 어떻게 벌려 놓을지. 마지막 줄만 휑하지 않게
	   장수를 줄마다 고르게 나눈다 (여섯 칸이면 5·5·4). */
  function spread(n, cols) {
    var rows = Math.ceil(n / cols);
    var base = Math.floor(n / rows);
    var extra = n % rows;
    var per = [];
    for (var r = 0; r < rows; r++) per.push(base + (r < extra ? 1 : 0));
    return per;
  }

  var TRAY = 0.58; /* 뽑아 둔 카드가 작아지는 비율 */

  /* 카드가 머물 자리의 좌표. 창이 바뀌면 같은 이름으로 다시 센다 */
  function spotOf(card) {
    switch (card.spot) {
      case "tray":
        return {
          x: (card.slot - 1) * size.cw * PLATE * TRAY * 1.4 * m.k,
          y: m.cy - m.deckH * 0.4 * m.k,
          z: 1.2 + card.slot * 0.003,
          ry: 0,
          rz: (card.slot - 1) * 0.06,
          s: size.cw * m.k * TRAY,
          arc: 1.4,
        };
      case "stack":
        return {
          x: (card.slot - 1) * size.cw * PLATE * 0.08 * m.k,
          y: m.cy,
          z: -0.4 - card.slot * 0.012,
          ry: 0,
          rz: (card.slot - 1) * 0.03,
          s: size.cw * m.k * TRAY,
        };
      case "open":
        return {
          x: 0,
          y: m.cy,
          z: 0.9,
          ry: Math.PI,
          rz: 0,
          s: size.rw * m.k,
          arc: 1.9,
        };
      case "shut":
        return {
          x: 0,
          y: m.cy + size.rh * 0.1 * m.k,
          z: 1.5,
          ry: Math.PI,
          rz: -0.05,
          s: size.rw * m.k,
          o: 0,
        };
      case "gone":
        return {
          x: card.home.x * 1.1,
          y: card.home.y - m.worldH * 0.22,
          z: card.home.z - 0.6,
          ry: 0,
          rz: card.home.rz * 1.8,
          s: size.cw * m.k * 0.9,
          o: 0,
        };
      default:
        return card.home;
    }
  }

  /* 창이 바뀌면 흩뿌린 자리는 트윈이 알아서 따라가지만, 이름 붙은 자리에
	   가 있던 카드는 새 좌표로 바로 옮겨 앉힌다 */
  function resettle() {
    for (var i = 0; i < cards.length; i++) {
      var card = cards[i];
      if (!card.spot || card.spot === "home") continue;
      if (card.anim) Stage.cut(card.anim);
      var to = spotOf(card);
      set(card, to);
      if (to.o != null) {
        for (var j = 0; j < card.mats.length; j++) card.mats[j].opacity = to.o;
      }
    }
  }

  function measure() {
    m = Stage.metrics();
    var per = spread(cards.length, m.cols);
    var wide = Math.max.apply(null, per);
    var cellW = m.deckW / wide;
    var cellH = m.deckH / per.length;

    /* size 는 평면 폭이고, 눈에 보이는 카드는 그 PLATE 만큼이다 */
    size.cw = Math.min(cellW * 0.84, (cellH * 0.82) / RATIO) / PLATE;
    size.rh = Math.min(m.deckH * 0.82, m.deckW * 0.92 * RATIO) / PLATE;
    size.rw = size.rh / RATIO;

    var jx = Math.max(0, (cellW - size.cw * PLATE) / 2) * 0.9;
    var jy = Math.max(0, (cellH - size.cw * PLATE * RATIO) / 2) * 0.9;

    var i = 0;
    for (var r = 0; r < per.length; r++) {
      for (var k = 0; k < per[r]; k++, i++) {
        var px = (k - (per[r] - 1) / 2) * cellW + seeds[i].x * jx;
        var py = -(r - (per.length - 1) / 2) * cellH - seeds[i].y * jy;
        /* 날아가는 중에 창이 바뀔 수 있다. 객체를 갈아끼우지 않고
				   제자리에서 고쳐야 트윈이 새 자리를 따라간다 */
        var home = cards[i].home || (cards[i].home = {});
        home.x = px * m.k;
        home.y = m.cy + py * m.k;
        home.z = i * 0.0016;
        home.ry = 0;
        home.rz = seeds[i].r * 0.23;
        home.s = size.cw * m.k;
      }
    }
  }

  /* 카드가 그려지는 자리에 투명 버튼을 겹친다 */
  function aim() {
    for (var i = 0; i < cards.length; i++) {
      var h = cards[i].home;
      var p = Stage.toScreen(h.x, h.y);
      var w = size.cw * PLATE;
      var t = w * RATIO;
      var s = cards[i].btn.style;
      s.width = w.toFixed(1) + "px";
      s.height = t.toFixed(1) + "px";
      s.left = (p.x - w / 2).toFixed(1) + "px";
      s.top = (p.y - t / 2).toFixed(1) + "px";
      cards[i].spin = "rotate(" + ((h.rz * 180) / Math.PI).toFixed(2) + "deg)";
      s.transform = cards[i].spin;
    }
  }

  function shuffleSeeds() {
    seeds = [];
    for (var i = 0; i < cards.length; i++) {
      seeds.push({
        x: Math.random() * 2 - 1,
        y: Math.random() * 2 - 1,
        r: Math.random() * 2 - 1,
      });
    }
  }

  function clearLines(card) {
    for (var i = 0; i < card.lines.length; i++) {
      var mesh = card.lines[i];
      card.face.remove(mesh);
      mesh.material.map.dispose();
      mesh.material.dispose();
    }
    card.lines = [];
  }

  return {
    build: function (n, hitLayer) {
      layer = hitLayer;
      geo = new THREE.PlaneGeometry(1, RATIO);
      unit = new THREE.PlaneGeometry(1, 1);
      backTex = tex(backCanvas());
      faceTex = tex(faceCanvas());
      for (var i = 0; i < n; i++) cards.push(make(i));
      shuffleSeeds();
      measure();
      aim();
      Stage.onResize(function () {
        measure();
        aim();
        resettle();
      });
    },

    onPick: function (fn) {
      picked = fn;
    },

    /* 아래에서 한 장씩 날아와 자리를 잡는다 */
    deal: function () {
      shuffleSeeds();
      measure();
      aim();
      for (var i = 0; i < cards.length; i++) {
        var card = cards[i];
        card.spot = "home";
        for (var j = 0; j < card.mats.length; j++) card.mats[j].opacity = 1;
        card.mats[0].color.setScalar(1);
        card.base = 1;
        set(card, {
          x: 0,
          y: m.cy - m.worldH * 0.85,
          z: 1.6,
          ry: 0,
          rz: 0,
          s: size.cw * m.k,
        });
        move(card, card.home, 0.9, Stage.EASE.out);
        /* 차례로 날아오게 시작을 늦춘다 */
        cards[i].anim.at = -0.055 * i;
      }
    },

    arm: function (on) {
      layer.classList.toggle("is-off", !on);
    },

    label: function (i, text) {
      cards[i].btn.setAttribute("aria-label", text);
    },

    /* 한 장을 고른 뒤 바로 다음 장으로 초점을 옮긴다. 탭을 다시 짚지 않게 */
    focusNext: function (from) {
      for (var n = 1; n <= cards.length; n++) {
        var card = cards[(from + n) % cards.length];
        if (!card.btn.disabled) {
          card.btn.focus({ preventScroll: true });
          return;
        }
      }
    },

    /* 고른 장은 앞으로 떠올라 아래쪽 세 자리에 나란히 선다.
		   나머지는 한 단 어두워져서, 뽑힌 것과 남은 것이 한눈에 갈린다. */
    lift: function (i, slot) {
      var card = cards[i];
      card.btn.disabled = true;
      card.spot = "tray";
      card.slot = slot;
      card.base = 1;
      if (card.hover) Stage.cut(card.hover);
      card.mats[0].color.setScalar(1);
      move(card, spotOf(card), 0.8, Stage.EASE.out);
      for (var n = 0; n < cards.length; n++) {
        if (cards[n].btn.disabled) continue;
        if (cards[n].base !== 0.5) shade(cards[n], 0.5);
      }
    },

    /* 읽기 직전, 고른 세 장을 가운데로 포갠다. 열린 카드가 이 위를 덮고,
		   다 읽고 떠나면 그 아래에서 다음 장이 드러난다. */
    stack: function (list) {
      for (var k = 0; k < list.length; k++) {
        var card = cards[list[k]];
        card.spot = "stack";
        card.slot = k;
        move(card, spotOf(card), 0.7, Stage.EASE.soft);
      }
    },

    /* 고르지 않은 장은 아래로 가라앉는다 */
    sweep: function (keep) {
      for (var i = 0; i < cards.length; i++) {
        if (keep.indexOf(i) >= 0) continue;
        cards[i].btn.disabled = true;
        cards[i].spot = "gone";
        move(cards[i], spotOf(cards[i]), 0.85, Stage.EASE.soft);
      }
    },

    /* 뒤집어 가운데로 끌어온다. 이 작품의 가장 큰 동작 */
    open: function (i, lines, done) {
      var card = cards[i];
      clearLines(card);

      var made = [];
      var total = 0;
      var gap = 0.05;
      for (var n = 0; n < lines.length; n++) {
        var o = lineTexture(lines[n], size.rw);
        made.push(o);
        total += o.h + (n ? gap : 0);
      }

      var y = total / 2;
      for (var j = 0; j < made.length; j++) {
        if (j) y -= gap;
        var mat = new THREE.MeshBasicMaterial({
          map: made[j].tex,
          transparent: true,
          opacity: 0,
          depthWrite: false,
        });
        var mesh = new THREE.Mesh(unit, mat);
        mesh.scale.set(made[j].w, made[j].h, 1);
        mesh.position.set(0, y - made[j].h / 2, 0.014 + j * 0.001);
        y -= made[j].h;
        card.face.add(mesh);
        card.lines.push(mesh);
      }

      card.spot = "open";
      move(card, spotOf(card), 1.25, Stage.EASE.swing, done);
    },

    /* 한 줄이 떠오른다. 지난 줄은 물러선다 */
    reveal: function (i, step) {
      var card = cards[i];
      var mesh = card.lines[step];
      if (!mesh) return;
      var y1 = mesh.position.y;
      var y0 = y1 - 0.04;
      mesh.position.y = y0;
      Stage.tween(0.95, Stage.EASE.out, function (e) {
        mesh.material.opacity = e;
        mesh.position.y = y0 + (y1 - y0) * e;
      });
      for (var j = 0; j < step; j++) {
        (function (past) {
          var o0 = past.material.opacity;
          Stage.tween(0.6, Stage.EASE.out, function (e) {
            past.material.opacity = o0 + (0.46 - o0) * e;
          });
        })(card.lines[j]);
      }
    },

    /* 다 읽은 장은 떠서 사라진다 */
    shut: function (i) {
      var card = cards[i];
      card.spot = "shut";
      move(card, spotOf(card), 0.95, Stage.EASE.soft);
      for (var j = 0; j < card.lines.length; j++) {
        (function (mesh) {
          var o0 = mesh.material.opacity;
          Stage.tween(0.7, Stage.EASE.soft, function (e) {
            mesh.material.opacity = o0 * (1 - e);
          });
        })(card.lines[j]);
      }
    },

    reset: function () {
      for (var i = 0; i < cards.length; i++) {
        clearLines(cards[i]);
        cards[i].btn.disabled = false;
        cards[i].group.rotation.y = 0;
      }
      this.deal();
    },
  };
})();
