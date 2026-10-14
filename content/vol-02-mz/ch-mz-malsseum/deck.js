/* 카드 — 말씀을 모두 흩뿌리고, 고른 장을 뒤집어 가운데로 끌어온다.

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
  var wornTex = null; /* 이미 읽은 편이 얹힌 장의 뒷면 */
  var faceTex = null;
  var glowTex = null;

  var layer = null; /* 투명 버튼들이 사는 판 */
  var picked = null; /* 고른 장을 알리는 콜백 */
  var pulled = null; /* 패에서 빼낸 장을 알리는 콜백 */
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
  /* 평면 가운데에서 카드가 실제로 차지하는 몫. 나머지는 그림자 자리.
	   캔버스가 512×768 이라 같은 여백이라도 가로와 세로의 몫이 다르다 —
	   하나로 뭉뚱그리면 겹쳐 둔 버튼이 카드보다 짧아진다. */
  var PLATE = 1 - (PAD * 2) / 512;
  var PLATE_H = 1 - (PAD * 2) / 768;
  /* 카드 모서리의 둥근 정도를 판 폭으로 나눈 몫 */
  var ROUND = 26 / (512 - PAD * 2);

  function plate(x, W, H, r) {
    rounded(x, PAD, PAD, W - PAD * 2, H - PAD * 2, r);
  }

  /* 카드 뒷면의 두 벌. 아직 읽지 않은 장은 밤빛이고, 이미 읽은 장은
	   색이 빠져 잿빛이다. 어둡게 해서 구분하면 그늘과 섞이므로, 밝기가
	   아니라 색을 빼서 구분한다. */
  var NIGHT = ["#222e57", "#0d1427", "#151d36"];
  var WORN = ["#55565a", "#1e1f22", "#303134"];

  function backCanvas(skin) {
    var W = 512;
    var H = 768;
    var r = 26;
    var c = sheet(W, H);
    var x = c.getContext("2d");

    var g = x.createLinearGradient(W * 0.1, 0, W * 0.9, H);
    g.addColorStop(0, skin[0]);
    g.addColorStop(0.55, skin[1]);
    g.addColorStop(1, skin[2]);

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

  /* 손이 닿았다는 테두리. 카드에 붙여 두면 자리도 기울기도 원근도
	   카드를 그대로 따라오므로, 화면 좌표를 다시 셀 일이 없다. */
  function glowCanvas() {
    var W = 512;
    var H = 768;
    var c = sheet(W, H);
    var x = c.getContext("2d");
    x.strokeStyle = "rgba(242, 236, 228, 0.9)";
    x.shadowColor = "rgba(242, 236, 228, 0.8)";
    x.lineWidth = 3;
    x.shadowBlur = 16;
    /* 같은 테두리를 몇 번 덧그려 번짐을 쌓는다 */
    for (var n = 0; n < 3; n++) {
      plate(x, W, H, 26);
      x.stroke();
    }
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

    /* 테두리는 뒷면 바로 앞에 겹쳐 둔다. 더해서 그리므로 카드를 가리지
	   않고 빛만 얹힌다. 카드가 뒤집히면 같이 돌아가 저절로 숨는다. */
    var glowMat = new THREE.MeshBasicMaterial({
      map: glowTex,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    var glow = new THREE.Mesh(geo, glowMat);
    glow.position.z = 0.006;

    group.add(back);
    group.add(face);
    group.add(glow);
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
      glow: glow,
      lit: null,
      lines: [],
      btn: btn,
      home: null,
      anim: null,
      hover: null,
      /* 지금 이 카드가 머무는 밝기. 손이 닿으면 여기서 더 밝아진다 */
      base: 1,
      /* 겹쳐 둔 버튼이 기울어 있는 각도 */
      spin: "",
      /* 집어 든 동안 버튼을 같이 키우는 몫 */
      pop: "",
      /* 패에 올라가 있는가. 올라간 장은 고르기가 아니라 빼내기를 받는다 */
      held: false,
      /* 방금 손짓이 치우기였는가. 뒤따라 오는 click 이 이걸 보고 접는다 */
      taken: false,
      /* 지금 머무는 자리의 이름. 창이 바뀌면 이걸 보고 다시 앉힌다 */
      spot: "home",
      slot: 0,
    };

    /* 한 손짓 안에 두 뜻이 들어 있다. 누르면 카드가 손에 들리고, 그대로
	   떼면 고르기, 끌면 치우기다. 움직인 거리로만 가른다 — 손이 흔들린
	   정도로 뜻이 바뀌면 안 되므로 문턱을 둔다.

	   호버에서는 카드를 움직이지 않는다. 겹쳐 깔린 판에서 카드가 들썩이면
	   어느 장을 짚고 있는지가 흐려진다. 테두리만 빛나게 두고(CSS),
	   들어올리는 일은 손이 실제로 누른 뒤에 한다. */
    btn.addEventListener("pointerdown", function (e) {
      if (e.button && e.button !== 0) return;
      if (layer.classList.contains("is-off")) return;
      /* 한 번에 한 장만. 두 손가락이 겹치면 먼저 든 장이 허공에 남는다 */
      if (hold) return;
      hold = { ox: e.clientX, oy: e.clientY, moved: false, id: e.pointerId };
      card.taken = false;
      card.grabX = card.home.x;
      card.grabY = card.home.y;
      if (card.anim) Stage.cut(card.anim);
      rise(card, HOLD);
      /* 아래에 깔린 장을 집었으면 위에 겹친 장들이 비켜선다 */
      if (!card.held) clear(card, 0);
      try {
        btn.setPointerCapture(e.pointerId);
      } catch (err) {
        /* 못 잡아도 버튼 위에서는 move 가 온다 */
      }
    });

    btn.addEventListener("pointermove", function (e) {
      if (!hold || e.pointerId !== hold.id) return;
      var dx = e.clientX - hold.ox;
      var dy = e.clientY - hold.oy;
      if (!hold.moved) {
        if (Math.abs(dx) + Math.abs(dy) < DRAG) return;
        hold.moved = true;
      }
      if (card.held) tug(card, dx * m.k, -dy * m.k);
      else place(card, dx * m.k, -dy * m.k);
    });

    btn.addEventListener("pointerup", function (e) {
      if (!hold || e.pointerId !== hold.id) return;
      var moved = hold.moved;
      var up = hold.oy - e.clientY;
      hold = null;
      card.taken = moved;
      if (card.held) {
        /* 위로 끌어 올리면 패에서 빠진다. 아니면 제자리로 돌아간다 */
        if (moved && up > PULL && pulled) pulled(i);
        else settle(card);
        return;
      }
      if (moved) anchor(card);
      rise(card, 0);
    });

    btn.addEventListener("pointercancel", function () {
      if (!hold) return;
      hold = null;
      if (card.held) settle(card);
      else {
        anchor(card);
        rise(card, 0);
      }
    });

    btn.addEventListener("pointerenter", function () {
      if (!layer.classList.contains("is-off")) shine(card, true);
    });
    btn.addEventListener("pointerleave", function () {
      if (!hold) shine(card, false);
    });
    btn.addEventListener("focus", function () {
      if (!layer.classList.contains("is-off")) shine(card, true);
    });
    btn.addEventListener("blur", function () {
      shine(card, false);
    });

    btn.addEventListener("click", function (e) {
      if (card.taken) {
        card.taken = false;
        return;
      }
      if (card.held) {
        /* 끌 수 없는 손(키보드)에서도 빼낼 수 있어야 한다 */
        if (e.detail === 0 && pulled) pulled(i);
        return;
      }
      if (picked) picked(i);
    });

    return card;
  }

  var HOLD = 0.95; /* 집어 든 카드가 앞으로 나오는 깊이 */
  var DRAG = 7; /* 이만큼(px) 끌리면 고르기가 아니라 치우기다 */
  var PULL = 42; /* 패에 둔 장을 이만큼 위로 끌면 빠진다 */
  var hold = null; /* 지금 손에 들린 장. 한 번에 한 장만 */
  var dull = []; /* 이미 읽은 편이 얹힌 자리 */

  /* 테두리를 켜고 끈다 */
  function shine(card, on) {
    if (card.lit) Stage.cut(card.lit);
    var o0 = card.glow.material.opacity;
    var o1 = on ? 1 : 0;
    card.lit = Stage.tween(0.22, Stage.EASE.out, function (e) {
      card.glow.material.opacity = o0 + (o1 - o0) * e;
    });
  }

  function rise(card, depth) {
    if (!card.home || layer.classList.contains("is-off")) return;
    if (card.hover) Stage.cut(card.hover);
    /* 카드가 앞으로 나오면 그만큼 커 보인다. 겹쳐 둔 버튼도 같이 키워야
		   포커스 테두리가 카드에서 어긋나지 않는다 */
    card.pop = depth
      ? " scale(" + (DIST / (DIST - depth)).toFixed(4) + ")"
      : "";
    card.btn.style.transform = card.spin + card.pop;
    var z0 = card.group.position.z;
    var z1 = spotOf(card).z + depth;
    var c0 = card.mats[0].color.r;
    var c1 = card.base + (depth ? 0.45 : 0);
    card.hover = Stage.tween(0.3, Stage.EASE.out, function (e) {
      card.group.position.z = z0 + (z1 - z0) * e;
      card.mats[0].color.setScalar(c0 + (c1 - c0) * e);
    });
  }

  /* 끌리는 동안 카드를 손끝에 붙여 둔다. 자리(home)를 그 자리에서 고치므로
	   손을 떼면 치운 데 그대로 머문다. 판 밖으로는 나가지 못하게 가둔다. */
  function place(card, dxw, dyw) {
    var lx = (m.deckW * m.k) / 2;
    var ly = (m.deckH * m.k) / 2;
    card.home.x = Math.max(-lx, Math.min(lx, card.grabX + dxw));
    card.home.y = Math.max(m.cy - ly, Math.min(m.cy + ly, card.grabY + dyw));
    var to = spotOf(card);
    set(card, {
      x: to.x,
      y: to.y,
      z: to.z + HOLD,
      ry: to.ry,
      rz: to.rz,
      s: to.s,
    });
    aimAt(card, to);
  }

  /* 치운 자리를 굳힌다. home 은 이미 고쳐졌으니 버튼만 맞춰 준다 */
  function anchor(card) {
    aimOne(card);
  }

  /* 패에 있는 장을 손끝에 매단다. 자리를 고치지 않으므로 손을 떼면 돌아간다 */
  function tug(card, dxw, dyw) {
    var base = spotOf(card);
    var to = {
      x: base.x + dxw,
      y: base.y + dyw,
      z: base.z + HOLD,
      ry: base.ry,
      rz: base.rz,
      s: base.s,
    };
    set(card, to);
    aimAt(card, to);
  }

  /* 제자리로 돌려 앉힌다 */
  function settle(card) {
    move(card, spotOf(card), 0.3, Stage.EASE.out, function () {
      aimOne(card);
    });
  }

  /* 옆으로 비켜 세운다. 자리 자체를 고치므로 비킨 채로 머문다.
	   밀린 쪽으로 조금 돌아간다 — 한 점을 밀면 물건은 돌면서 밀린다. */
  function shift(card, dxw, dur) {
    var lx = (m.deckW * m.k) / 2;
    card.home.x = Math.max(-lx, Math.min(lx, card.home.x + dxw));
    card.home.rz = Math.max(
      -0.42,
      Math.min(0.42, card.home.rz - (dxw / (size.cw * m.k)) * 0.12),
    );
    move(card, spotOf(card), dur, Stage.EASE.spring, function () {
      aimOne(card);
    });
    /* 버튼은 기다리지 않고 새 자리로. 손이 카드보다 늦으면 안 된다 */
    aimOne(card);
  }

  /* 집어 든 장 위에 겹쳐 있는 장들을 옆으로 밀어낸다. 아래에 깔린 장을
	   집으면 위의 장들이 스르륵 비켜서 길을 내준다. 겹친 만큼만 밀어
	   비키게 하므로, 판이 한꺼번에 흐트러지지는 않는다. */
  function clear(card, depth) {
    var w = size.cw * PLATE * m.k;
    var h = w * RATIO;
    for (var i = 0; i < cards.length; i++) {
      var other = cards[i];
      if (other === card || other.held || other.btn.disabled) continue;
      if (other.spot !== "home" || !other.home) continue;
      /* 아래에 깔린 장은 가만히 둔다. 비켜야 하는 건 위에 있는 쪽이다 */
      if (other.home.z <= card.home.z) continue;
      var overX = w * 0.9 - Math.abs(other.home.x - card.home.x);
      var overY = h * 0.9 - Math.abs(other.home.y - card.home.y);
      if (overX <= 0 || overY <= 0) continue;
      var dir = other.home.x >= card.home.x ? 1 : -1;
      shift(other, dir * (overX + w * 0.06), 0.55 + depth * 0.1);
      /* 비킨 장이 그 옆의 장을 다시 민다. 한 번 더까지만 —
			   끝까지 전하면 판 전체가 한꺼번에 흐트러진다 */
      if (depth < 1) clear(other, depth + 1);
    }
  }

  /* 읽어주기에 붙는 이름. 자리에 따라 할 수 있는 일이 달라진다 */
  function rename(card) {
    card.btn.setAttribute(
      "aria-label",
      card.i +
        1 +
        "번 카드" +
        (card.held
          ? " · 위로 끌어 빼내기"
          : dull.indexOf(card.i) >= 0
            ? " · 이미 읽은 말씀"
            : ""),
    );
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

  /* 깔린 장을 몇 줄로 어떻게 벌려 놓을지. 마지막 줄만 휑하지 않게
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

  /* 가운데로 몰아 주는 세기. 1 이면 고르게 퍼지고, 클수록 가운데가
     빽빽해진다. 몰린 자리에서는 카드가 서로 겹치고, 겹친 장은 끌어서
     치워야 아래가 드러난다 — 그 겹침이 이 판의 일이다. */
  var HUDDLE = 1.55;

  /* -1~1 을 부호는 지키면서 가운데로 끌어당긴다 */
  function huddle(u) {
    return (u < 0 ? -1 : 1) * Math.pow(Math.abs(u), HUDDLE);
  }

  /* 카드 크기를 재는 데 쓰는 칸의 수. 장수가 늘어도 카드가 쪼그라들지
     않게 여기서 멈춘다. 넘치는 장수는 크기가 아니라 겹침으로 받는다. */
  var SIZE_COLS = 5;
  var SIZE_ROWS = 4;

  /* 카드밭의 가로:세로 상한. 판이 아무리 넓어도 이 비를 넘기지 않는다 —
	   넘기면 양쪽 모서리까지 늘어져 네모난 틀이 드러난다. */
  var FIELD = 2.0;

  /* 가운데가 높고 양 끝이 내려앉은 활 모양. ARCH 는 가장자리에서 세로로
	   줄어드는 몫이고 SINK 는 아래로 내려앉는 몫이다. 네 모서리를 비우면
	   카드밭이 네모난 틀에서 풀려난다. */
  var ARCH = 0.52;
  var SINK = 0.26;

  function measure() {
    m = Stage.metrics();
    var per = spread(cards.length, m.cols);
    var wide = Math.max.apply(null, per);
    var fieldW = Math.min(m.deckW, m.deckH * FIELD);
    var cellW = fieldW / wide;
    var cellH = m.deckH / per.length;

    /* 자리는 판 전체에 퍼지지만 크기는 이 칸을 넘지 않는다 */
    var fitW = m.deckW / Math.min(wide, SIZE_COLS);
    var fitH = m.deckH / Math.min(per.length, SIZE_ROWS);

    /* size 는 평면 폭이고, 눈에 보이는 카드는 그 PLATE 만큼이다 */
    size.cw = Math.min(fitW * 0.84, (fitH * 0.82) / RATIO) / PLATE;
    size.rh = Math.min(m.deckH * 0.82, m.deckW * 0.92 * RATIO) / PLATE;
    size.rw = size.rh / RATIO;

    /* 카드가 칸보다 커지면 남는 틈이 없다. 흩뿌린 티는 칸에 비례해 준다 */
    var jx = cellW * 0.34;
    var jy = cellH * 0.34;
    var halfR = (per.length - 1) / 2;
    var reach = ((wide - 1) / 2) * cellW; /* 가장 넓은 줄의 반폭 */

    var i = 0;
    for (var r = 0; r < per.length; r++) {
      for (var k = 0; k < per[r]; k++, i++) {
        var armC = (per[r] - 1) / 2;
        var ux = armC > 0 ? (k - armC) / armC : 0;
        var uy = halfR > 0 ? (r - halfR) / halfR : 0;
        var px = huddle(ux) * armC * cellW;
        /* 활의 높이는 줄 안에서의 차례가 아니라 실제 가로 자리로 잰다.
				   줄마다 칸 수가 다르므로, 줄 안에서 재면 위 모서리가 들쭉날쭉해진다 */
        var edge = reach > 0 ? Math.min(1, Math.abs(px) / reach) : 0;
        edge = edge * edge; /* 가운데 0, 양 끝 1 */
        var py = -huddle(uy) * halfR * cellH;
        /* 양 끝으로 갈수록 세로로 오므리고 아래로 내려앉힌다 */
        py = py * (1 - ARCH * edge) - SINK * edge * halfR * cellH;
        px += seeds[i].x * jx;
        py -= seeds[i].y * jy * (1 - edge * 0.5);
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

  /* 카드가 그려지는 자리에 투명 버튼을 겹친다. 자리마다 카드 크기가
	   다르므로 버튼도 그 크기를 따라가야 손이 어긋나지 않는다. */
  function aimAt(card, to) {
    /* 앞으로 나와 있는 만큼 커 보이고, 그만큼 화면 가운데에서 바깥으로
		   밀려난 자리에 맺힌다. toScreen 은 z=0 평면만 재므로 둘 다 여기서
		   보정한다 — 크기만 보정하면 가운데에서는 맞고 멀어질수록 벌어진다. */
    var grow = DIST / (DIST - (to.z || 0));
    var p = Stage.toScreen(to.x * grow, to.y * grow);
    var span = to.s / m.k; /* 평면 한 변의 길이(px) */
    var w = span * PLATE * grow;
    var t = span * RATIO * PLATE_H * grow;
    var s = card.btn.style;
    s.width = w.toFixed(1) + "px";
    s.height = t.toFixed(1) + "px";
    s.borderRadius = (w * ROUND).toFixed(1) + "px";
    s.left = (p.x - w / 2).toFixed(1) + "px";
    s.top = (p.y - t / 2).toFixed(1) + "px";
    /* three.js 의 rotation.z 는 Y 가 위인 자리에서 반시계가 양수고,
		   CSS 의 rotate 는 Y 가 아래인 자리에서 시계가 양수다. 같은 값을
		   그대로 넘기면 테두리만 반대로 기운다. 부호를 뒤집는다. */
    card.spin = "rotate(" + ((-to.rz * 180) / Math.PI).toFixed(2) + "deg)";
    s.transform = card.spin + card.pop;
  }

  function aimOne(card) {
    aimAt(card, spotOf(card));
  }

  function aim() {
    for (var i = 0; i < cards.length; i++) aimOne(cards[i]);
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

  /* 아직 물러나는 중인 장을 즉시 치운다. 물러나는 자리(z 1.5)는 열리는
	   자리(z 0.9)보다 앞이라, 빨리 넘기면 지난 장의 글이 다음 장 위에
	   겹쳐 남는다. 다음 장이 열리기 전에 지난 장은 사라져 있어야 한다. */
  function purge() {
    for (var i = 0; i < cards.length; i++) {
      var card = cards[i];
      if (card.spot !== "shut") continue;
      if (card.anim) Stage.cut(card.anim);
      if (card.hover) Stage.cut(card.hover);
      for (var j = 0; j < card.mats.length; j++) card.mats[j].opacity = 0;
      clearLines(card);
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
      backTex = tex(backCanvas(NIGHT));
      wornTex = tex(backCanvas(WORN));
      faceTex = tex(faceCanvas());
      glowTex = tex(glowCanvas());
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

    /* 패에서 빼내 달라는 손짓을 알린다 */
    onPull: function (fn) {
      pulled = fn;
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
        if (!card.btn.disabled && !card.held) {
          card.btn.focus({ preventScroll: true });
          return;
        }
      }
    },

    /* 고른 장은 앞으로 떠올라 아래쪽 세 자리에 나란히 선다.
		   나머지는 한 단 어두워져서, 뽑힌 것과 남은 것이 한눈에 갈린다. */
    lift: function (i, slot) {
      var card = cards[i];
      /* 버튼을 끄지 않는다. 패에 올라간 장은 고르기 대신 빼내기를 받는다 */
      card.held = true;
      card.spot = "tray";
      card.slot = slot;
      if (card.hover) Stage.cut(card.hover);
      rename(card);
      move(card, spotOf(card), 0.8, Stage.EASE.out, function () {
        aimOne(card);
      });
    },

    /* 패에서 빠진 장은 흩뿌린 자리로 돌아간다 */
    drop: function (i) {
      var card = cards[i];
      card.held = false;
      card.spot = "home";
      card.slot = 0;
      card.pop = "";
      if (card.hover) Stage.cut(card.hover);
      rename(card);
      move(card, spotOf(card), 0.6, Stage.EASE.out, function () {
        aimOne(card);
      });
    },

    /* 한 장이 빠지면 패에 남은 장의 자리가 하나씩 당겨진다 */
    reslot: function (list) {
      for (var k = 0; k < list.length; k++) {
        var card = cards[list[k]];
        card.slot = k;
        move(
          card,
          spotOf(card),
          0.45,
          Stage.EASE.out,
          (function (c) {
            return function () {
              aimOne(c);
            };
          })(card),
        );
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
      purge();
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
      Stage.tween(0.52, Stage.EASE.out, function (e) {
        mesh.material.opacity = e;
        mesh.position.y = y0 + (y1 - y0) * e;
      });
      for (var j = 0; j < step; j++) {
        (function (past) {
          var o0 = past.material.opacity;
          Stage.tween(0.42, Stage.EASE.out, function (e) {
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

    /* 이미 읽은 편이 얹힌 장은 한 단 연하게 둔다. 못 고르게 하는 것은
	   아니다 — 다시 뽑을 때 아직 읽지 않은 편이 먼저 눈에 들어오게만 한다.
	   손이 닿으면 연한 장도 같이 밝아진다(raise 가 base 에서 올린다). */
    pale: function (list) {
      dull = list.slice();
      for (var i = 0; i < cards.length; i++) {
        var card = cards[i];
        var worn = dull.indexOf(i) >= 0;
        card.mats[0].map = worn ? wornTex : backTex;
        card.mats[0].needsUpdate = true;
        rename(card);
      }
    },

    reset: function () {
      for (var i = 0; i < cards.length; i++) {
        clearLines(cards[i]);
        cards[i].btn.disabled = false;
        cards[i].held = false;
        cards[i].taken = false;
        cards[i].pop = "";
        cards[i].spot = "home";
        if (cards[i].lit) Stage.cut(cards[i].lit);
        cards[i].glow.material.opacity = 0;
        cards[i].group.rotation.y = 0;
      }
      hold = null;
      this.deal();
    },
  };
})();
