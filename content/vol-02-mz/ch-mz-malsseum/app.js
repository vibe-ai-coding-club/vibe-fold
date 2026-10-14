/* 한 번 누르면 한 줄. 격언을 다 읽으면 다음 격언.
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

	var reduced = !!(
		window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
	);

	var index = 0; /* 몇 번째 격언 */
	var shown = 0; /* 그 격언에서 몇 줄까지 나왔나 */
	var locked = false; /* 격언이 갈리는 동안 입력을 막는다 */
	var done = false;
	var touched = false;

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
		paintMeter();
	}

	function reveal() {
		var nodes = verse.children;
		nodes[shown].classList.add('is-in');
		for (var i = 0; i < shown; i++) nodes[i].classList.add('is-past');
		shown++;
		if (live) Backdrop.pulse(0.3);
		paintMeter();
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
		verse.classList.add('is-leaving');
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
		if (locked || done) return;
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

	again.addEventListener('click', function (e) {
		e.stopPropagation();
		restart();
	});

	build();
	reveal();
	chrome('dim');
	stage.focus({ preventScroll: true });
})();
