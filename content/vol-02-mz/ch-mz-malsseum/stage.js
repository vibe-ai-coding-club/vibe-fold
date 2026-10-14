/* 무대 — three.js 렌더러 하나를 세우고 그 위에서 두 번 그린다.
   뒤는 배경 셰이더(정사영), 앞은 카드(투시). 카드가 뒤집히며 앞으로 나와야 해서
   원근이 필요하고, 배경은 원근이 필요 없어서 따로 둔다.

   프레임 루프와 트윈도 여기서 돈다. requestAnimationFrame 을 여러 군데서
   돌리면 순서가 엉키므로 하나로 모았다. */
window.Stage = (function () {
  var RATIO = 1.5; /* 카드 비율. 타로가 대개 이쯤 된다 */
  var FOV = 40;
  var DIST = 11; /* 카메라가 물러서 있는 거리. 카드는 z=0 평면에 눕는다 */
  var CHROME = 74; /* 위에 떠 있는 사이트 내비게이션 높이 */
  var TITLE = 46; /* 제목이 차지하는 띠 */
  var FOOT = 96; /* 힌트와 진행 막대가 차지하는 띠 */

  var canvas = null;
  var renderer = null;
  var flat = null; /* 배경 장면 */
  var flatCam = null;
  var deep = null; /* 카드 장면 */
  var deepCam = null;

  var raf = 0;
  var last = 0;
  var calm = false;
  var anims = [];
  var frames = [];
  var resizers = [];
  var m = { pxW: 0, pxH: 0 };

  var EASE = {
    /* 끝에서 사뿐히 멎는다. 대부분 이걸 쓴다 */
    out: function (p) {
      return 1 - Math.pow(1 - p, 3);
    },
    soft: function (p) {
      return p * p * (3 - 2 * p);
    },
    /* 밀려난 것이 멎을 때 살짝 지나쳤다 돌아온다. 손으로 민 것처럼
	     보이려면 끝이 칼같이 서면 안 된다 */
    spring: function (p) {
      var a = 1.45;
      return 1 + (a + 1) * Math.pow(p - 1, 3) + a * Math.pow(p - 1, 2);
    },
    /* 뒤집히는 카드. 느리게 떠서 빠르게 돌고 다시 느리게 멎는다 */
    swing: function (p) {
      return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
    },
  };

  /* 이 화면에서 카드를 늘어놓을 수 있는 자리를 픽셀로 재고,
	   월드 좌표로 옮길 비율(k)을 같이 구한다. */
  function measure() {
    var pxW = Math.max(1, canvas.clientWidth);
    var pxH = Math.max(1, canvas.clientHeight);
    var worldH = 2 * Math.tan(((FOV / 2) * Math.PI) / 180) * DIST;
    var k = worldH / pxH;

    var top = CHROME + TITLE;
    var insetX = Math.min(52, Math.max(12, pxW * 0.035));
    var deckW = Math.max(120, pxW - insetX * 2);
    var deckH = Math.max(150, pxH - top - FOOT);

    m = {
      pxW: pxW,
      pxH: pxH,
      k: k,
      worldH: worldH,
      worldW: worldH * (pxW / pxH),
      deckW: deckW,
      deckH: deckH,
      /* 위아래 띠가 비대칭이라 카드판의 가운데는 화면 가운데보다 아래에 있다 */
      cy: (pxH / 2 - (top + deckH / 2)) * k,
      cols: deckW < 340 ? 3 : deckW < 560 ? 4 : deckW < 900 ? 5 : 6,
    };
  }

  function fit() {
    var w = Math.max(1, canvas.clientWidth);
    var h = Math.max(1, canvas.clientHeight);
    if (w === m.pxW && h === m.pxH) return false;
    measure();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    deepCam.aspect = w / h;
    deepCam.updateProjectionMatrix();
    return true;
  }

  function frame(now) {
    raf = requestAnimationFrame(frame);
    var dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
    last = now;

    if (fit()) {
      for (var r = 0; r < resizers.length; r++) resizers[r](m);
    }

    /* 뒤에서부터 지운다. 끝난 트윈이 빠져도 순서가 밀리지 않게 */
    for (var a = anims.length - 1; a >= 0; a--) {
      var t = anims[a];
      t.at += dt;
      /* at 이 음수면 아직 시작 전이다. deal() 이 차례로 날리는 데 쓴다 */
      var p = t.dur <= 0 ? 1 : Math.max(0, Math.min(1, t.at / t.dur));
      t.step(t.ease(p), p);
      if (p >= 1) {
        anims.splice(a, 1);
        if (t.done) t.done();
      }
    }

    for (var f = 0; f < frames.length; f++) frames[f](now / 1000, dt);

    renderer.clear();
    renderer.render(flat, flatCam);
    renderer.clearDepth();
    renderer.render(deep, deepCam);
  }

  return {
    RATIO: RATIO,
    DIST: DIST,
    EASE: EASE,

    /* WebGL 을 못 얻으면 false. 호출한 쪽이 글만 띄우는 쪽으로 물러선다 */
    start: function (el, reducedMotion) {
      canvas = el;
      calm = !!reducedMotion;
      if (!window.THREE) return false;

      try {
        renderer = new THREE.WebGLRenderer({
          canvas: canvas,
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
        });
      } catch (err) {
        renderer = null;
      }
      if (!renderer) return false;

      renderer.autoClear = false;
      renderer.setClearColor(0x080b14, 1);
      renderer.outputColorSpace = THREE.SRGBColorSpace;

      flat = new THREE.Scene();
      flatCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      deep = new THREE.Scene();
      deepCam = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
      deepCam.position.z = DIST;

      fit();
      raf = requestAnimationFrame(frame);
      return true;
    },

    calm: function () {
      return calm;
    },

    metrics: function () {
      return m;
    },

    addFlat: function (obj) {
      flat.add(obj);
    },

    addDeep: function (obj) {
      deep.add(obj);
    },

    onFrame: function (fn) {
      frames.push(fn);
    },

    onResize: function (fn) {
      resizers.push(fn);
    },

    /* 움직임을 줄여 달라고 한 사람에게는 즉시 끝난 상태만 보여준다 */
    tween: function (dur, ease, step, done) {
      var t = {
        dur: calm ? 0 : dur,
        at: 0,
        ease: ease || EASE.out,
        step: step,
        done: done,
      };
      anims.push(t);
      return t;
    },

    cut: function (t) {
      var i = anims.indexOf(t);
      if (i >= 0) anims.splice(i, 1);
    },

    /* 카드는 z=0 평면에 있으니 월드와 화면이 1차식으로 맞물린다.
		   투명 버튼을 카드 위에 겹칠 때 쓴다. */
    toScreen: function (x, y) {
      return { x: m.pxW / 2 + x / m.k, y: m.pxH / 2 - y / m.k };
    },

    stop: function () {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    },
  };
})();
