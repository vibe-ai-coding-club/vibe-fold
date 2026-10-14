/* Local-only, classic scripts: opaque-origin sandbox has no module/CORS dependency. */
(() => {
  'use strict';
  const scene = document.querySelector('#scene');
  const video = document.querySelector('#film');
  const canvas = document.querySelector('#paper');
  const ctx = canvas.getContext('2d');
  const label = document.querySelector('#label');
  const memory = document.querySelector('#memory');
  const instruction = document.querySelector('#instruction');
  const replay = document.querySelector('#replay');
  const sound = document.querySelector('#sound');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const portrait = matchMedia('(max-aspect-ratio: 1/1)');
  const paper = {presence: 0, peel: 0, fall: 0, x: 0, y: 0};
  let phase = 'observation', timeline, revealTimeline, gesture = null;
  let audio, bus, ambience, soundOn = false, soundChosen = false, mediaFailed = false, playAttempt = 0;
  let width = 0, height = 0;

  function setPhase(next) { phase = next; scene.dataset.phase = next; }
  function drawPaper() {
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    if (paper.presence < .001 || paper.fall >= 1) return;
    const mobile = width < height;
    const pw = Math.min(540, width * .86), ph = mobile ? (height <= 700 ? 140 : 154) : 142;
    const cy = height * (mobile && height <= 700 ? .62 : mobile ? .65 : .64);
    const rotation = motion.matches ? 0 : -.052 + paper.peel * .2 + paper.fall * .34;
    const dx = motion.matches ? 0 : paper.x + paper.fall * width * .16;
    const dy = motion.matches ? 0 : paper.y + paper.fall * height * .62;
    ctx.save(); ctx.translate(width / 2 + dx, cy + dy); ctx.rotate(rotation);
    ctx.globalAlpha = paper.presence * (1 - paper.fall);
    if (!motion.matches) {
      ctx.fillStyle = '#f4c5ae'; ctx.globalAlpha *= .12 * paper.peel;
      ctx.fillRect(-pw / 2 - 12, -ph / 2 - 9, pw, ph);
      ctx.globalAlpha = paper.presence * (1 - paper.fall);
    }
    ctx.shadowColor = 'rgba(25,20,15,.24)'; ctx.shadowBlur = 22; ctx.shadowOffsetY = 10;
    ctx.beginPath();
    // Deterministic irregular edge, rather than a smooth UI rectangle.
    ctx.moveTo(-pw / 2, -ph / 2 + 3);
    for (let x = 0; x <= pw; x += 12) ctx.lineTo(-pw / 2 + x, -ph / 2 + Math.sin(x * .8) * 1.8);
    ctx.lineTo(pw / 2, ph / 2 - 3);
    for (let x = pw; x >= 0; x -= 12) ctx.lineTo(-pw / 2 + x, ph / 2 + Math.cos(x * .7) * 1.5);
    ctx.closePath(); ctx.fillStyle = '#ed9b85'; ctx.fill();
    ctx.shadowColor = 'transparent';
    const fold = Math.min(pw * .75, paper.peel * pw * .72);
    if (fold > 0) {
      ctx.fillStyle = '#f5b6a1'; ctx.beginPath(); ctx.moveTo(pw / 2, -ph / 2);
      ctx.lineTo(pw / 2 - fold, -ph / 2); ctx.lineTo(pw / 2, ph / 2);ctx.closePath();ctx.fill();
      ctx.strokeStyle = '#a34c3c33';ctx.stroke();
    }
    ctx.fillStyle = 'rgba(70,35,20,.06)';
    for (let i = 0; i < 180; i++) ctx.fillRect((i * 43 % pw) - pw / 2, (i * 29 % ph) - ph / 2, 1, 1);
    ctx.restore();
  }
  function resize() {
    width = scene.clientWidth; height = scene.clientHeight;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = width * dpr; canvas.height = height * dpr;
    ctx?.setTransform(dpr, 0, 0, dpr, 0, 0); drawPaper();
  }
  function shouldPlay() { return !document.hidden && !motion.matches && !mediaFailed && ['observation', 'attachment', 'peeling', 'memory'].includes(phase); }
  async function playFilm() {
    if (!shouldPlay()) return;
    const attempt = ++playAttempt;
    try {
      await video.play();
      if (attempt !== playAttempt || !shouldPlay()) video.pause();
      else video.style.opacity = '1';
    } catch (error) {
      if (attempt === playAttempt && error.name !== 'AbortError') { video.style.opacity = '0'; }
    }
  }
  function loadFilm() {
    ++playAttempt; video.pause(); mediaFailed = false; video.style.opacity = '0';
    video.src = `assets/care-${portrait.matches ? 'portrait' : 'landscape'}.mp4`;
    video.load();
  }
  video.addEventListener('canplay', playFilm);
  video.addEventListener('error', () => { mediaFailed = true; video.style.opacity = '0'; });
  // Hold the final frame; never loop an action backwards through the scene.
  video.addEventListener('ended', () => video.pause());

  function setupAudio() {
    if (audio) return;
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return;
    try {
      audio = new Audio(); bus = audio.createGain(); bus.gain.value = .16; bus.connect(audio.destination);
      const buffer = audio.createBuffer(1, audio.sampleRate * 4, audio.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * .04;
      ambience = audio.createBufferSource(); ambience.buffer = buffer; ambience.loop = true;
      const lowpass = audio.createBiquadFilter(); lowpass.type = 'lowpass'; lowpass.frequency.value = 400;
      ambience.connect(lowpass); lowpass.connect(bus); ambience.start();
    } catch { audio = null; }
  }
  function updateSound() {
    sound.textContent = soundOn ? '소리 끄기 −' : '소리 켜기 ＋';
    sound.setAttribute('aria-pressed', String(soundOn));
    sound.setAttribute('aria-label', soundOn ? '소리 끄기' : '소리 켜기');
  }
  function participate() {
    setupAudio();
    if (audio && !document.hidden) { if (!soundChosen) soundOn = true; if (soundOn) audio.resume().catch(() => {}); updateSound(); }
  }
  function rustle() {
    if (!audio || !soundOn || audio.state !== 'running') return;
    const buffer = audio.createBuffer(1, audio.sampleRate * .7, audio.sampleRate);
    const d = buffer.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * .5 * Math.sin(Math.PI * i / d.length) ** 2;
    const source = audio.createBufferSource(), filter = audio.createBiquadFilter();
    filter.type = 'bandpass'; filter.frequency.value = 2400; filter.Q.value = .6;
    source.buffer = buffer; source.connect(filter); filter.connect(bus); source.start();
  }
  sound.addEventListener('click', () => {
    setupAudio(); soundChosen = true; soundOn = !soundOn;
    if (audio) (soundOn && !document.hidden ? audio.resume() : audio.suspend()).catch(() => {});
    updateSound();
  });

  function finishPeel() {
    if (phase !== 'waiting') return;
    setPhase('peeling'); gesture = null; label.disabled = true; instruction.textContent = '붙은 말 너머에, 한 사람의 기억이 있습니다.';
    rustle(); playFilm(); gsap.killTweensOf(paper);
    revealTimeline = gsap.timeline();
    revealTimeline.to(label, {opacity: 0, duration: motion.matches ? .25 : .6}, 0);
    revealTimeline.to(paper, {peel: 1, fall: 1, duration: motion.matches ? .25 : 1.2, ease: 'power2.in', onUpdate: drawPaper}, 0);
    revealTimeline.set(label, {visibility: 'hidden'});
    revealTimeline.call(() => { setPhase('memory'); label.blur(); });
    revealTimeline.to(memory, {autoAlpha: 1, duration: motion.matches ? .3 : 1.3}, '+=.25');
    revealTimeline.call(() => { setPhase('complete'); video.pause(); instruction.textContent = '당신에게도, 당신만의 이유가 있으니까.'; replay.hidden = false; }, null, '+=6');
  }
  label.addEventListener('pointerdown', event => {
    if (phase !== 'waiting' || (event.pointerType === 'mouse' && event.button !== 0)) return;
    participate(); gsap.killTweensOf(paper);
    label.setPointerCapture(event.pointerId);
    gesture = {id: event.pointerId, x: event.clientX, y: event.clientY, distance: 0};
  });
  label.addEventListener('pointermove', event => {
    if (!gesture || event.pointerId !== gesture.id || phase !== 'waiting') return;
    const dx = event.clientX - gesture.x, dy = event.clientY - gesture.y;
    gesture.distance = Math.hypot(dx, dy);
    paper.peel = Math.min(gesture.distance / 130, 1); paper.x = dx * .45; paper.y = dy * .45;
    label.style.marginLeft = `${paper.x}px`; label.style.marginTop = `${paper.y}px`;
    label.style.opacity = String(1 - paper.peel * .5); drawPaper();
    if (gesture.distance >= Math.min(110, width * .23)) finishPeel();
  });
  function release(event, cancelled = false) {
    if (!gesture || gesture.id !== event.pointerId) return;
    const distance = gesture.distance; gesture = null;
    if (!cancelled && distance < 8) finishPeel();
    else {
      label.style.marginLeft = '0'; label.style.marginTop = '0'; label.style.opacity = '1';
      gsap.to(paper, {x: 0, y: 0, peel: 0, duration: motion.matches ? 0 : .35, onUpdate: drawPaper});
    }
  }
  label.addEventListener('pointerup', event => release(event));
  label.addEventListener('pointercancel', event => release(event, true));
  label.addEventListener('lostpointercapture', event => release(event, true));
  label.addEventListener('click', event => { if (event.detail === 0) {participate(); finishPeel();} });

  function restart() {
    timeline?.kill(); revealTimeline?.kill(); gsap.killTweensOf(paper); gesture = null;
    setPhase('observation'); replay.hidden = true; label.disabled = true;
    label.style.marginLeft = '0'; label.style.marginTop = '0';
    gsap.set(label, {autoAlpha: 0}); gsap.set(memory, {autoAlpha: 0});
    Object.assign(paper, {presence: 0, peel: 0, fall: 0, x: 0, y: 0}); drawPaper();
    instruction.textContent = '잠시, 이 사람을 바라봐 주세요.';
    video.currentTime = 0; playFilm();
    timeline = gsap.timeline({paused: document.hidden});
    timeline.call(() => setPhase('attachment'), null, 3);
    timeline.to(paper, {presence: 1, duration: motion.matches ? .25 : 1, onUpdate: drawPaper}, 3);
    timeline.to(label, {autoAlpha: 1, duration: motion.matches ? .25 : 1}, 3);
    timeline.call(() => { setPhase('waiting'); ++playAttempt; video.pause(); label.disabled = false; instruction.textContent = '붙은 말을 끌어 걷어내세요. 탭이나 Enter도 좋아요.'; }, null, 4);
  }
  replay.addEventListener('click', () => { restart(); label.focus({preventScroll: true}); });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      ++playAttempt; video.pause(); timeline?.pause(); revealTimeline?.pause();
      gsap.getTweensOf(paper).forEach(t => t.pause()); audio?.suspend().catch(() => {});
    } else {
      timeline?.resume(); revealTimeline?.resume(); gsap.getTweensOf(paper).forEach(t => t.resume());
      playFilm(); if (soundOn) audio?.resume().catch(() => {});
    }
  });
  portrait.addEventListener('change', () => { const time = video.currentTime; loadFilm(); video.currentTime = time; });
  motion.addEventListener('change', () => { drawPaper(); if (motion.matches) video.pause(); else playFilm(); });
  new ResizeObserver(resize).observe(scene); resize(); loadFilm(); restart();
})();
