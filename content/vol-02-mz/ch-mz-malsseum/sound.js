/* 소리 — 파일을 쓰지 않는다. 전부 Web Audio 로 그 자리에서 만든다.
   에셋이 없으니 받을 것도, 라이선스를 따질 것도 없다.

   낮게 깔리는 드론 한 겹과, 줄이 떠오를 때 울리는 종 하나.
   편이 바뀌면 드론의 음이 갈아탄다 — 배경색과 같은 흐름으로, 밤에서 새벽으로.

   브라우저는 사람이 화면을 한 번 건드리기 전에는 소리를 거부한다. 그래서
   start() 는 반드시 클릭·키 입력 안에서 불러야 한다. 거부당해도 조용히
   실패하고, 작품은 소리 없이 그대로 돈다. */
window.Chime = (function () {
	/* 편마다의 밑음. 밤(낮고 어둡게)에서 새벽(높고 따뜻하게)으로 간다. */
	var ROOTS = [
		73.42, 65.41, 73.42, 87.31, 82.41, 73.42, 58.27, 65.41, 55.0, 65.41, 73.42, 87.31, 98.0, 110.0,
	];

	var ctx = null;
	var master = null;
	var wet = null;
	var drone = null; /* { oscillators, gain, filter } */
	var lfo = null;
	var muted = false;
	var alive = false;

	function now() {
		return ctx.currentTime;
	}

	/* 잔향도 파일 없이 만든다. 잡음을 지수로 깎으면 방 하나가 생긴다. */
	function impulse(seconds, decay) {
		var len = Math.max(1, Math.floor(ctx.sampleRate * seconds));
		var buf = ctx.createBuffer(2, len, ctx.sampleRate);
		for (var ch = 0; ch < 2; ch++) {
			var d = buf.getChannelData(ch);
			for (var i = 0; i < len; i++) {
				d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
			}
		}
		return buf;
	}

	function buildDrone(root) {
		var filter = ctx.createBiquadFilter();
		filter.type = 'lowpass';
		filter.frequency.value = 420;
		filter.Q.value = 0.7;

		var gain = ctx.createGain();
		gain.gain.value = 0;

		/* 밑음·5도·옥타브를 조금씩 어긋나게 겹친다. 어긋남이 결을 만든다. */
		var specs = [
			[1, 0, 0.5],
			[1, 7, 0.34],
			[1.5, -5, 0.26],
			[2, 4, 0.16],
		];
		var oscs = [];
		for (var i = 0; i < specs.length; i++) {
			var o = ctx.createOscillator();
			o.type = i === 3 ? 'triangle' : 'sine';
			o.frequency.value = root * specs[i][0];
			o.detune.value = specs[i][1];
			var g = ctx.createGain();
			g.gain.value = specs[i][2];
			o.connect(g);
			g.connect(filter);
			o.start();
			oscs.push(o);
		}
		filter.connect(gain);
		gain.connect(master);
		gain.connect(wet);

		/* 아주 느린 숨. 필터가 열렸다 닫히며 드론이 살아 있게 한다. */
		var lf = ctx.createOscillator();
		lf.frequency.value = 0.045;
		var la = ctx.createGain();
		la.gain.value = 160;
		lf.connect(la);
		la.connect(filter.frequency);
		lf.start();

		gain.gain.linearRampToValueAtTime(0.5, now() + 4);
		return { oscs: oscs, gain: gain, filter: filter, lfo: lf, root: root };
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
			verb.buffer = impulse(3.6, 2.6);
			wet = ctx.createGain();
			wet.gain.value = 0.5;
			wet.connect(verb);
			verb.connect(master);

			drone = buildDrone(ROOTS[moodIndex] || ROOTS[0]);
			alive = true;

			/* 일부 브라우저는 만들어 두고도 멈춰 둔다. 제스처 안이니 깨워도 된다. */
			if (ctx.state === 'suspended' && ctx.resume) ctx.resume();
			return true;
		},

		/* 편이 바뀌면 드론의 음이 건너간다. 끊지 않고 미끄러진다. */
		setMood: function (moodIndex) {
			if (!alive || !drone) return;
			var root = ROOTS[moodIndex] || drone.root;
			var mults = [1, 1, 1.5, 2];
			var t = now();
			for (var i = 0; i < drone.oscs.length; i++) {
				drone.oscs[i].frequency.cancelScheduledValues(t);
				drone.oscs[i].frequency.exponentialRampToValueAtTime(
					Math.max(20, root * mults[i]),
					t + 2.4,
				);
			}
			drone.root = root;
		},

		/* 줄이 떠오를 때 한 번. 밑음 위 높은 자리에서 맑게. */
		ping: function (step) {
			if (!alive) return;
			var t = now();
			var scale = [0, 3, 5, 7, 10];
			var semi = scale[(step || 0) % scale.length] + 24;
			var freq = drone.root * Math.pow(2, semi / 12);

			var o = ctx.createOscillator();
			o.type = 'sine';
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
		},

		/* 마침 화면에서 천천히 잠긴다 */
		close: function () {
			if (!alive || !drone) return;
			var t = now();
			drone.gain.gain.cancelScheduledValues(t);
			drone.gain.gain.setValueAtTime(drone.gain.gain.value, t);
			drone.gain.gain.linearRampToValueAtTime(0.0001, t + 3.5);
		},

		/* 되감을 때 다시 차오른다 */
		reopen: function (moodIndex) {
			if (!alive || !drone) return;
			this.setMood(moodIndex);
			var t = now();
			drone.gain.gain.cancelScheduledValues(t);
			drone.gain.gain.setValueAtTime(drone.gain.gain.value, t);
			drone.gain.gain.linearRampToValueAtTime(0.5, t + 2);
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
