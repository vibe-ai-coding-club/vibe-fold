/* 소리 — 파일을 쓰지 않는다. 전부 Web Audio 로 그 자리에서 만든다.
   에셋이 없으니 받을 것도, 라이선스를 따질 것도 없다.

   낮게 깔리는 드론 한 겹과, 줄이 떠오를 때 울리는 종 하나.
   편이 바뀌면 드론의 음이 갈아탄다 — 배경색과 같은 흐름으로, 밤에서 새벽으로.

   브라우저는 사람이 화면을 한 번 건드리기 전에는 소리를 거부한다. 그래서
   start() 는 반드시 클릭·키 입력 안에서 불러야 한다. 거부당해도 조용히
   실패하고, 작품은 소리 없이 그대로 돈다. */
window.Chime = (function () {
  /* 편마다의 밑음. 밤(낮고 어둡게)에서 새벽(높고 따뜻하게)으로 간다.
     한 옥타브 위에 둔다 — 음과 음 사이의 걸음은 그대로이고 자리만 올라간다.
     아래 옥타브는 배음표의 0.5 가 맡으므로 무게는 잃지 않는다. */
  var ROOTS = [
    146.83, 130.81, 146.83, 174.61, 164.81, 146.83, 116.54, 130.81, 110.0,
    130.81, 146.83, 174.61, 196.0, 220.0,
  ];

  var ctx = null;
  var master = null;
  var wet = null;
  var drone = null; /* { oscs, gain, filter, root } */
  var muted = false;
  var alive = false;
  var voices = []; /* 지금 울리고 있는 종들 */
  var dozing = 0; /* 다 잦아들면 컨텍스트를 재우는 타이머 */

  /* 한꺼번에 겹칠 수 있는 종의 수. 빨리 넘기는 사람의 손을 막지는 않되,
	   종이 무더기로 쌓여 울음이 뭉개지지 않을 만큼만 남긴다. */
  var VOICES = 4;

  /* 드론이 다 차올랐을 때의 크기. 여러 곳에서 이 값으로 되돌아온다.
     종보다 또렷하게 아래에 깔려 있어야 한다 — 드론은 끊기지 않고 계속
     울리므로, 종과 같은 크기로 두면 드론이 먼저 들리고 종이 묻힌다. */
  var LEVEL = 0.22;

  function now() {
    return ctx.currentTime;
  }

  /* 울고 있는 종을 거둔다. 뚝 끊으면 딸깍 소리가 나므로 짧게 재워서 보낸다. */
  function hush(v, span) {
    var t = now();
    v.gain.gain.cancelScheduledValues(t);
    v.gain.gain.setValueAtTime(v.gain.gain.value, t);
    v.gain.gain.linearRampToValueAtTime(0.0001, t + span);
    try {
      v.osc.stop(t + span + 0.02);
    } catch (err) {
      /* 이미 멎은 종이면 그대로 둔다 */
    }
  }

  /* 다 울린 종을 목록에서 치운다 */
  function sweepVoices(t) {
    for (var i = voices.length - 1; i >= 0; i--) {
      if (voices[i].until <= t) voices.splice(i, 1);
    }
  }

  /* 잔향도 파일 없이 만든다. 잡음을 지수로 깎으면 방 하나가 생긴다.
	   다만 잡음을 날것으로 쓰면 쇳소리가 섞여 서늘해진다. 한 번 눌러
	   부드럽게 만들면 돌로 지은 큰 방의 울림에 가까워진다. */
  function impulse(seconds, decay) {
    var len = Math.max(1, Math.floor(ctx.sampleRate * seconds));
    var buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (var ch = 0; ch < 2; ch++) {
      var d = buf.getChannelData(ch);
      var soft = 0;
      for (var i = 0; i < len; i++) {
        /* 한 극 저역 통과. 잡음의 뾰족한 끝을 깎는다 */
        soft += (Math.random() * 2 - 1 - soft) * 0.22;
        d[i] = soft * Math.pow(1 - i / len, decay);
      }
    }
    return buf;
  }

  /* 밑음의 정수배. 1·2·3·4·5·8 은 밑음, 옥타브, 12도, 두 옥타브,
	   장3도, 세 옥타브다 — 파이프 오르간이 스톱을 겹쳐 쌓는 그 순서다.
	   디튠을 주지 않는다. 어긋난 음은 맥놀이를 만들고, 맥놀이는 소리를
	   흐리게 하면서 서늘하게 만든다. 정수배로만 쌓으면 배음이 모두 밑음
	   위에 포개져 한 음처럼 울린다. 5번째 배음이 장3도를 데려오므로
	   화음은 저절로 장조가 된다. */
  var PARTIALS = [
    [0.5, 0.14],
    [1, 0.3],
    [2, 0.22],
    [3, 0.17],
    [4, 0.13],
    [5, 0.1],
    [6, 0.08],
    [8, 0.06],
    [10, 0.04],
    [12, 0.03],
  ];

  /* 배음마다 서로 어긋난 아주 느린 숨. 음높이는 건드리지 않고 크기만
	   흔든다 — 소리는 살아 있고 음정은 끝까지 맑다. 하나의 필터를 함께
	   흔들면 모든 배음이 같이 숨을 쉬어 기척처럼 들리므로 따로 둔다. */
  var BREATHS = [
    0.023, 0.031, 0.043, 0.057, 0.071, 0.089, 0.107, 0.127, 0.149, 0.173,
  ];

  function buildDrone(root) {
    var filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 5200;
    filter.Q.value = 0.5;

    var gain = ctx.createGain();
    gain.gain.value = 0;

    var oscs = [];
    for (var i = 0; i < PARTIALS.length; i++) {
      var o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = root * PARTIALS[i][0];
      var g = ctx.createGain();
      g.gain.value = PARTIALS[i][1];
      o.connect(g);
      g.connect(filter);
      o.start();
      oscs.push(o);

      var lf = ctx.createOscillator();
      lf.frequency.value = BREATHS[i];
      var la = ctx.createGain();
      la.gain.value = PARTIALS[i][1] * 0.22;
      lf.connect(la);
      la.connect(g.gain);
      lf.start();
    }
    filter.connect(gain);
    gain.connect(master);
    gain.connect(wet);

    gain.gain.linearRampToValueAtTime(LEVEL, now() + 4);
    return { oscs: oscs, gain: gain, filter: filter, root: root };
  }

  return {
    /* 반드시 사용자 제스처 안에서. 실패하면 false 를 주고 조용히 물러난다. */
    start: function (moodIndex) {
      if (alive) return true;
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      try {
        ctx = new AC();
      } catch (err) {
        return false;
      }

      master = ctx.createGain();
      master.gain.value = 0.16;
      master.connect(ctx.destination);

      var verb = ctx.createConvolver();
      verb.buffer = impulse(5.2, 2.1);
      wet = ctx.createGain();
      wet.gain.value = 0.4;
      wet.connect(verb);
      verb.connect(master);

      drone = buildDrone(ROOTS[moodIndex] || ROOTS[0]);
      alive = true;

      /* 일부 브라우저는 만들어 두고도 멈춰 둔다. 제스처 안이니 깨워도 된다. */
      if (ctx.state === "suspended" && ctx.resume) ctx.resume();
      return true;
    },

    /* 편이 바뀌면 드론의 음이 건너간다. 미끄러뜨리지 않는다 — 미끄러지는
		   음은 성가가 아니라 사이렌이 된다. 숨을 한 번 죽이고, 소리가 잦아든
		   그 틈에 음을 갈아 끼우고, 다시 차오른다. 오르간 주자가 스톱을
		   바꾸는 방식이고, 귀에는 다음 화음이 들어오는 것으로 들린다. */
    setMood: function (moodIndex) {
      if (!alive || !drone) return;
      var root = ROOTS[moodIndex] || drone.root;
      var t = now();
      var dip = 0.55; /* 숨을 죽이는 데 걸리는 시간 */

      var g = drone.gain.gain;
      g.cancelScheduledValues(t);
      g.setValueAtTime(g.value, t);
      g.linearRampToValueAtTime(Math.max(0.0001, g.value * 0.3), t + dip);
      g.linearRampToValueAtTime(LEVEL, t + dip + 1.4);

      for (var i = 0; i < drone.oscs.length; i++) {
        var f = drone.oscs[i].frequency;
        f.cancelScheduledValues(t);
        f.setValueAtTime(f.value, t);
        f.setValueAtTime(Math.max(20, root * PARTIALS[i][0]), t + dip);
      }
      drone.root = root;
    },

    /* 줄이 떠오를 때 한 번. 밑음 위 높은 자리에서 맑게.
		   밑음·5도·옥타브·장10도·12도 — 단3도와 단7도를 들이지 않으므로
		   어느 자리에서 울려도 드론과 어긋나지 않는다. */
    ping: function (step) {
      if (!alive) return;
      var t = now();

      /* 읽는 사람이 빨리 넘기면 종이 겹겹이 쌓인다. 한 번 울린 종은
			   세 박 가까이 꼬리를 끌고 거기에 잔향까지 붙으므로, 그냥 두면
			   스무 개가 한꺼번에 울어 소리가 끊기지 않는다. 자리가 모자라면
			   가장 오래된 종부터 거둬 보낸다. */
      sweepVoices(t);
      while (voices.length >= VOICES) hush(voices.shift(), 0.18);

      var scale = [0, 7, 12, 16, 19];
      var semi = scale[(step || 0) % scale.length] + 12;
      var freq = drone.root * Math.pow(2, semi / 12);

      var o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = freq;

      var g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.5, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 2.8);

      o.connect(g);
      g.connect(master);
      g.connect(wet);
      o.start(t);
      o.stop(t + 3);
      voices.push({ osc: o, gain: g, until: t + 3 });
    },

    /* 마침 화면에서 천천히 잠긴다. 드론은 천천히, 울고 있는 종은 곧.
		   끝은 끝이어야 하므로, 꼬리가 다 잦아들면 컨텍스트까지 재운다. */
    close: function () {
      if (!alive || !drone) return;
      var t = now();
      while (voices.length) hush(voices.shift(), 0.5);
      drone.gain.gain.cancelScheduledValues(t);
      drone.gain.gain.setValueAtTime(drone.gain.gain.value, t);
      drone.gain.gain.linearRampToValueAtTime(0.0001, t + 3.5);
      if (dozing) window.clearTimeout(dozing);
      dozing = window.setTimeout(function () {
        dozing = 0;
        if (ctx.state === "running" && ctx.suspend) ctx.suspend();
      }, 7200);
    },

    /* 되감을 때 다시 차오른다 */
    reopen: function (moodIndex) {
      if (!alive || !drone) return;
      if (dozing) {
        window.clearTimeout(dozing);
        dozing = 0;
      }
      /* 재워 둔 뒤라면 먼저 깨운다. 자고 있는 동안은 시계가 멈춰 있어서
			   깨우기 전에 예약을 걸면 그 예약이 과거에 놓인다. */
      if (ctx.state === "suspended" && ctx.resume) ctx.resume();
      this.setMood(moodIndex);
      var t = now();
      drone.gain.gain.cancelScheduledValues(t);
      drone.gain.gain.setValueAtTime(drone.gain.gain.value, t);
      drone.gain.gain.linearRampToValueAtTime(LEVEL, t + 2);
    },

    mute: function (on) {
      muted = !!on;
      if (!alive) return muted;
      var t = now();
      master.gain.cancelScheduledValues(t);
      master.gain.setValueAtTime(master.gain.value, t);
      master.gain.linearRampToValueAtTime(muted ? 0.0001 : 0.16, t + 0.3);
      return muted;
    },

    isMuted: function () {
      return muted;
    },

    isAlive: function () {
      return alive;
    },
  };
})();
