/* 한 줄씩 저절로 떠오른다. 격언을 다 읽으면 다음 격언.
   누르면 기다리지 않고 먼저 넘어간다 — 읽는 속도는 읽는 사람 것이다.
   상태는 전부 메모리에 둔다 — sandbox 안이라 localStorage 가 막혀 있고,
   새로고침하면 처음으로 돌아가는 것이 맞다. */
(function () {
	var data = window.APHORISMS || [];
	var total = data.length;

	var body = document.body;
	var stage = document.getElementById('stage');
	var verse = document.getElementById('verse');
	var hint = document.getElementById('hint');
	var page = document.getElementById('page');
	var bar = document.getElementById('bar');
	var outro = document.getElementById('outro');
	var again = document.getElementById('again');
	var cover = document.getElementById('cover');
	var muteBtn = document.getElementById('mute');

	var reduced = !!(
		window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
	);

	var index = 0; /* 몇 번째 격언 */
	var shown = 0; /* 그 격언에서 몇 줄까지 나왔나 */
	var locked = false; /* 격언이 갈리는 동안 입력을 막는다 */
	var done = false;
	var touched = false;
	var timer = null;
	var away = false; /* 탭이 뒤로 가면 멈춘다 */
	var started = false; /* 표지를 걷기 전에는 아무것도 움직이지 않는다 */

	var live = Backdrop.start(document.getElementById('bg'), data[0].tone, reduced);
	if (!live) body.classList.add('is-flat');

	/* 부모 사이트에 내비게이션을 내려 달라고 부탁한다. 읽는 걸 방해하지 않게.
	   독자가 화면 위쪽으로 가면 알아서 다시 나타난다. */
	function chrome(mode) {
		try {
			window.parent.postMessage({ from: 'vibe-fold:chapter', chrome: mode }, '*');
		} catch (err) {
			/* 부모가 없어도(단독으로 열어도) 작품은 그대로 돈다 */
		}
	}

	function paintTone(tone) {
		if (live) {
			Backdrop.setTone(tone);
		} else {
			body.style.setProperty('--flat-1', tone[0]);
			body.style.setProperty('--flat-2', tone[1]);
		}
	}

	function paintMeter() {
		var n = index + 1;
		page.textContent = (n < 10 ? '0' + n : n) + ' / ' + total;
		bar.style.width = ((index + shown / data[index].lines.length) / total) * 100 + '%';
	}

	function build() {
		verse.innerHTML = '';
		var lines = data[index].lines;
		for (var i = 0; i < lines.length; i++) {
			var p = document.createElement('p');
			p.className = 'line';
			p.textContent = lines[i];
			verse.appendChild(p);
		}
		verse.classList.remove('is-leaving');
		shown = 0;
		paintTone(data[index].tone);
		Chime.setMood(index);
		paintMeter();
	}

	function reveal() {
		var nodes = verse.children;
		nodes[shown].classList.add('is-in');
		for (var i = 0; i < shown; i++) nodes[i].classList.add('is-past');
		shown++;
		if (live) Backdrop.pulse(0.3);
		Chime.ping(shown - 1);
		paintMeter();
		planNext();
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

	function planNext() {
		stopTimer();
		if (done || away) return;
		var lines = data[index].lines;
		/* 한 편의 마지막 줄에서는 조금 더 머물렀다가 다음 편으로 건너간다 */
		var closing = shown >= lines.length;
		timer = window.setTimeout(
			function () {
				timer = null;
				advance();
			},
			dwell(lines[shown - 1] || '', closing ? 1100 : 0),
		);
	}

	function nextAphorism() {
		locked = true;
		verse.classList.add('is-leaving');
		window.setTimeout(
			function () {
				index++;
				build();
				reveal();
				locked = false;
			},
			reduced ? 10 : 460,
		);
	}

	function finish() {
		done = true;
		locked = true;
		stopTimer();
		verse.classList.add('is-leaving');
		Chime.close();
		chrome('show');
		window.setTimeout(
			function () {
				outro.classList.add('is-in');
				again.focus();
			},
			reduced ? 10 : 460,
		);
	}

	function advance() {
		if (!started || locked || done) return;
		stopTimer();
		if (!touched) {
			touched = true;
			hint.classList.add('is-gone');
		}
		if (shown < data[index].lines.length) {
			reveal();
			return;
		}
		if (index + 1 < total) {
			nextAphorism();
		} else {
			finish();
		}
	}

	function restart() {
		outro.classList.remove('is-in');
		done = false;
		locked = false;
		index = 0;
		build();
		reveal();
		Chime.reopen(0);
		chrome('dim');
		stage.focus();
	}

	/* pointerup 하나로 마우스·터치·펜을 다 받는다. click 과 겹쳐 두 번 넘어가지 않게 */
	stage.addEventListener('pointerup', function (e) {
		if (e.button && e.button !== 0) return;
		advance();
	});

	stage.addEventListener('keydown', function (e) {
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

	/* 탭을 떠나 있는 동안은 멈춘다. 돌아왔을 때 몇 편이 지나가 있으면 안 된다. */
	document.addEventListener('visibilitychange', function () {
		away = document.hidden;
		if (away) {
			stopTimer();
		} else if (!done && !locked) {
			planNext();
		}
	});

	again.addEventListener('click', function (e) {
		e.stopPropagation();
		restart();
	});

	/* 표지를 걷는 그 한 번의 제스처 안에서 소리를 청한다. 거부당해도 조용히
	   넘어가고, 작품은 소리 없이 그대로 돈다. */
	function begin() {
		if (started) return;
		started = true;
		if (Chime.start(0)) muteBtn.classList.add('is-ready');
		cover.classList.add('is-gone');
		body.classList.remove('is-cover');
		build();
		reveal();
		chrome('dim');
		stage.focus({ preventScroll: true });
	}

	cover.addEventListener('pointerup', function (e) {
		if (e.button && e.button !== 0) return;
		begin();
	});

	document.addEventListener('keydown', function (e) {
		if (started) return;
		if (e.key === ' ' || e.key === 'Enter') {
			e.preventDefault();
			begin();
		}
	});

	muteBtn.addEventListener('click', function (e) {
		e.stopPropagation();
		var off = Chime.mute(!Chime.isMuted());
		muteBtn.setAttribute('aria-pressed', off ? 'true' : 'false');
		muteBtn.setAttribute('aria-label', off ? '소리 켜기' : '소리 끄기');
	});
})();
