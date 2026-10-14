/* 열네 장을 흩뿌리고 세 장을 받는다. 고른 장은 뒤집혀 가운데로 나오고,
   그 안에서 한 줄씩 저절로 떠오른다. 누르면 기다리지 않고 먼저 넘어간다 —
   읽는 속도는 읽는 사람 것이다.

   어느 카드에 어느 말씀이 들어 있는지는 들어올 때마다 다시 섞는다.
   같은 세 장이 두 번 나오기는 어렵다.

   상태는 전부 메모리에 둔다 — sandbox 안이라 localStorage 가 막혀 있고,
   새로고침하면 처음으로 돌아가는 것이 맞다. */
(function () {
	var data = window.APHORISMS || [];
	var COVER = window.COVER_TONE || ['#080b14', '#2a3560'];
	var PICKS = 3;
	var HINTS = ['세 장을 고르세요', '두 장 더', '한 장 더', ''];

	var body = document.body;
	var stage = document.getElementById('stage');
	var hint = document.getElementById('hint');
	var page = document.getElementById('page');
	var bar = document.getElementById('bar');
	var verse = document.getElementById('verse');
	var outro = document.getElementById('outro');
	var again = document.getElementById('again');
	var muteBtn = document.getElementById('mute');

	var reduced = !!(
		window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
	);

	var order = []; /* 카드 → 말씀 번호 */
	var chosen = []; /* 고른 카드, 고른 순서대로 */
	var phase = 'pick'; /* pick · turn · read · done */
	var cur = -1; /* 지금 읽는 카드가 chosen 의 몇 번째인지 */
	var shown = 0; /* 그 말씀에서 몇 줄까지 나왔나 */
	var locked = false;
	var touched = false;
	var away = false; /* 탭이 뒤로 가면 멈춘다 */
	var timer = null;

	var live = Stage.start(document.getElementById('bg'), reduced);

	/* 부모 사이트에 내비게이션을 내려 달라고 부탁한다. 읽는 걸 방해하지 않게.
	   독자가 화면 위쪽으로 가면 알아서 다시 나타난다. */
	function chrome(mode) {
		try {
			window.parent.postMessage({ from: 'vibe-fold:chapter', chrome: mode }, '*');
		} catch (err) {
			/* 부모가 없어도(단독으로 열어도) 작품은 그대로 돈다 */
		}
	}

	function shuffle() {
		order = [];
		for (var i = 0; i < data.length; i++) order.push(i);
		for (var j = order.length - 1; j > 0; j--) {
			var k = Math.floor(Math.random() * (j + 1));
			var t = order[j];
			order[j] = order[k];
			order[k] = t;
		}
	}

	function aphorism() {
		return data[order[chosen[cur]]];
	}

	function paintTone(tone) {
		if (live) {
			Backdrop.setTone(tone);
		} else {
			body.style.setProperty('--flat-1', tone[0]);
			body.style.setProperty('--flat-2', tone[1]);
		}
	}

	function meter() {
		var lines = aphorism().lines;
		page.textContent = '0' + (cur + 1) + ' / 0' + PICKS;
		bar.style.width = (((cur + shown / lines.length) / PICKS) * 100).toFixed(2) + '%';
	}

	/* ── 카드를 펼치고 접는 두 길. WebGL 이 없으면 글만 띄운다 ── */

	function openCard(card, lines, done) {
		if (live) {
			Deck.open(card, lines, done);
			return;
		}
		verse.classList.add('is-leaving');
		window.setTimeout(
			function () {
				verse.innerHTML = '';
				for (var i = 0; i < lines.length; i++) {
					var p = document.createElement('p');
					p.className = 'line';
					p.textContent = lines[i];
					verse.appendChild(p);
				}
				verse.classList.remove('is-leaving');
				window.setTimeout(done, reduced ? 10 : 300);
			},
			reduced ? 10 : 420,
		);
	}

	function revealLine(card, step) {
		if (live) {
			Deck.reveal(card, step);
			return;
		}
		var nodes = verse.children;
		if (!nodes[step]) return;
		nodes[step].classList.add('is-in');
		for (var i = 0; i < step; i++) nodes[i].classList.add('is-past');
	}

	function shutCard(card) {
		if (live) Deck.shut(card);
		else verse.classList.add('is-leaving');
	}

	/* ── 고르기 ─────────────────────────────────────────────── */

	function pick(i) {
		if (phase !== 'pick') return;
		if (chosen.indexOf(i) >= 0) return;

		/* 사람이 처음 건드리는 이 한 번 안에서 소리를 청한다.
		   거부당해도 조용히 넘어가고, 작품은 소리 없이 그대로 돈다. */
		if (!chosen.length && Chime.start(order[i])) muteBtn.classList.add('is-ready');

		Deck.lift(i, chosen.length);
		chosen.push(i);
		Chime.ping(chosen.length * 2 - 2);
		Backdrop.pulse(0.22);
		hint.textContent = HINTS[chosen.length];

		if (chosen.length < PICKS) {
			Deck.focusNext(i);
			return;
		}

		phase = 'turn';
		Deck.arm(false);
		Deck.sweep(chosen);
		window.setTimeout(read, reduced ? 20 : 1000);
	}

	/* ── 읽기 ───────────────────────────────────────────────── */

	function read() {
		phase = 'read';
		body.classList.remove('is-picking');
		body.classList.add('is-reading');
		chrome('dim');
		hint.textContent = '눌러서 한 줄씩';
		hint.classList.remove('is-gone');
		Deck.stack(chosen);
		cur = -1;
		turn();
	}

	function turn() {
		locked = true;
		if (cur >= 0) shutCard(chosen[cur]);
		cur++;
		shown = 0;
		var aph = aphorism();
		paintTone(aph.tone);
		Chime.setMood(order[chosen[cur]]);
		meter();
		openCard(chosen[cur], aph.lines, function () {
			locked = false;
			step();
		});
	}

	function step() {
		revealLine(chosen[cur], shown);
		shown++;
		if (live) Backdrop.pulse(0.28);
		Chime.ping(shown - 1);
		meter();
		plan();
	}

	function stopTimer() {
		if (timer) {
			window.clearTimeout(timer);
			timer = null;
		}
	}

	/* 줄이 길수록 오래 머문다. 읽을 틈을 주되 지루해지기 전에 넘긴다. */
	function dwell(text, extra) {
		return Math.min(6500, 2300 + text.length * 115) + extra;
	}

	function plan() {
		stopTimer();
		if (phase !== 'read' || away) return;
		var lines = aphorism().lines;
		/* 한 편의 마지막 줄에서는 조금 더 머물렀다가 다음 장으로 건너간다 */
		var closing = shown >= lines.length;
		timer = window.setTimeout(
			function () {
				timer = null;
				advance();
			},
			dwell(lines[shown - 1] || '', closing ? 1400 : 0),
		);
	}

	function advance() {
		if (phase !== 'read' || locked) return;
		stopTimer();

		if (!live && !Chime.isAlive() && Chime.start(order[chosen[0]])) {
			muteBtn.classList.add('is-ready');
		}
		if (!touched) {
			touched = true;
			hint.classList.add('is-gone');
		}

		var lines = aphorism().lines;
		if (shown < lines.length) {
			step();
			return;
		}
		if (cur + 1 < chosen.length) turn();
		else finish();
	}

	function finish() {
		phase = 'done';
		locked = true;
		stopTimer();
		shutCard(chosen[cur]);
		Chime.close();
		chrome('show');
		window.setTimeout(
			function () {
				outro.classList.add('is-in');
				again.focus({ preventScroll: true });
			},
			reduced ? 20 : 900,
		);
	}

	function restart() {
		outro.classList.remove('is-in');
		stopTimer();
		phase = live ? 'pick' : 'read';
		chosen = live ? [] : [0, 1, 2];
		cur = -1;
		shown = 0;
		touched = false;
		locked = false;
		shuffle();
		Chime.reopen(0);
		hint.classList.remove('is-gone');
		page.textContent = '01 / 0' + PICKS;
		bar.style.width = '0%';

		if (!live) {
			turn();
			return;
		}

		body.classList.remove('is-reading');
		body.classList.add('is-picking');
		chrome('show');
		paintTone(COVER);
		hint.textContent = HINTS[0];
		Deck.reset();
		window.setTimeout(
			function () {
				Deck.arm(true);
			},
			reduced ? 20 : 420,
		);
	}

	/* ── 손과 눈 ────────────────────────────────────────────── */

	/* pointerup 하나로 마우스·터치·펜을 다 받는다. click 과 겹쳐 두 번 넘어가지 않게 */
	stage.addEventListener('pointerup', function (e) {
		if (e.button && e.button !== 0) return;
		advance();
	});

	document.addEventListener('keydown', function (e) {
		if (phase !== 'read') return;
		if (e.target === muteBtn || e.target === again) return;
		if (
			e.key === ' ' ||
			e.key === 'Enter' ||
			e.key === 'ArrowRight' ||
			e.key === 'ArrowDown' ||
			e.key === 'PageDown'
		) {
			e.preventDefault();
			advance();
		}
	});

	/* 포인터가 가는 쪽으로 배경이 아주 조금 쏠린다 */
	if (live && !reduced) {
		window.addEventListener('pointermove', function (e) {
			Backdrop.look(
				(e.clientX / window.innerWidth - 0.5) * 2,
				(e.clientY / window.innerHeight - 0.5) * 2,
			);
		});
	}

	/* 탭을 떠나 있는 동안은 멈춘다. 돌아왔을 때 몇 장이 지나가 있으면 안 된다. */
	document.addEventListener('visibilitychange', function () {
		away = document.hidden;
		if (away) stopTimer();
		else if (phase === 'read' && !locked) plan();
	});

	again.addEventListener('click', function (e) {
		e.stopPropagation();
		restart();
	});

	muteBtn.addEventListener('click', function (e) {
		e.stopPropagation();
		var off = Chime.mute(!Chime.isMuted());
		muteBtn.setAttribute('aria-pressed', off ? 'true' : 'false');
		muteBtn.setAttribute('aria-label', off ? '소리 켜기' : '소리 끄기');
	});

	/* ── 세우기 ─────────────────────────────────────────────── */

	shuffle();

	if (live) {
		Backdrop.start(COVER, reduced);
		Deck.build(data.length, document.getElementById('picks'));
		Deck.onPick(pick);
		Deck.arm(false);
		Deck.deal();
		/* 다 날아와 앉기 전에는 짚히지 않게 둔다 */
		window.setTimeout(
			function () {
				Deck.arm(true);
			},
			reduced ? 20 : 520,
		);
	} else {
		/* WebGL 이 없다. 카드 없이 세 편을 글로만 읽는다 */
		body.classList.add('is-flat');
		body.classList.remove('is-picking');
		body.classList.add('is-reading');
		phase = 'read';
		chosen = [0, 1, 2];
		paintTone(COVER);
		hint.textContent = '눌러서 한 줄씩';
		turn();
	}
})();
