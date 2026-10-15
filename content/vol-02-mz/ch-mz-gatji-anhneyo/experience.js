(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const script = window.MZStory;
  const scene = $('#scene'), artCanvas = $('#art'), paperCanvas = $('#paper');
  const ctx = paperCanvas.getContext('2d'), art = new window.MZArt(artCanvas);
  const label = $('#label'), narrative = $('#narrative'), speaker = $('#speaker');
  const copy = $('.story-copy'), kicker = $('.story-kicker'), progress = $('.beat-progress span');
  const replacementAnnouncement = $('#replacement-announcement');
  const replay = $('#replay'), repeat = $('#repeat'), pause = $('#pause'), sound = $('#sound');
  const instruction = $('#instruction'), intro = $('#intro'), ending = $('#ending'), veil = $('#veil');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const paper = {presence: 0, peel: 0, fall: 0, x: 0, y: 0};
  const timelines = new Set();
  let phase = 'intro', index = -1, sequence = null, beatIndex = -1, beatTimeline, sequenceEnd;
  let actionCooling = false, actionCooldown;
  let locked = false, paused = false, keyboard = false, gesture = null, width = 0, height = 0;
  let audio, bus, soundOn = false, soundChosen = false, activeVoice = null;
  const music = $('#music'), voiceBank = new Map();
  music.volume = 0;
  const REVEAL = .35, REPLACEMENT_WAIT = 1.55;
  const fade = regular => motion.matches ? .2 : regular;
  const voiceIds = [
    ...script.prologue, ...script.closing,
    ...script.chapters.flatMap(chapter => [...chapter.observation, ...chapter.memory, {voice: chapter.labelVoice}])
  ].map(entry => entry.voice).filter(Boolean);
  for (const id of new Set(voiceIds)) {
    const clip = document.createElement('audio');
    clip.src = `assets/audio/${id}.mp3`; clip.preload = 'auto'; clip.dataset.voice = id;
    clip.volume = .88; scene.appendChild(clip); voiceBank.set(id, clip);
  }

  function makeTimeline(onComplete) {
    const timeline = gsap.timeline({paused: true, onComplete: () => {
      timelines.delete(timeline); onComplete?.();
    }});
    timelines.add(timeline); return timeline;
  }
  function run(timeline) { if (!paused && !document.hidden) timeline.play(); }
  function kill(timeline) { timeline?.kill(); timelines.delete(timeline); }
  function setPhase(value) { phase = value; scene.dataset.phase = value; syncAudio(); }
  function focusReadingAction(target) {
    if (keyboard && ['begin', 'again', 'label', 'replay', 'repeat', ''].includes(document.activeElement.id)) {
      target.focus({preventScroll: true});
    }
  }
  function updatePause() {
    scene.dataset.paused = String(paused);
    pause.textContent = paused ? '이야기 재생 ▷' : '잠시 멈춤 Ⅱ';
    pause.setAttribute('aria-pressed', String(paused));
  }
  pause.addEventListener('click', () => {
    paused = !paused; updatePause();
    // Pausing during a caption's fade must leave readable text and an available next action.
    if (paused && sequence && locked && beatTimeline) {
      beatTimeline.time(fade(REVEAL), false);
    }
    timelines.forEach(timeline => paused || document.hidden ? timeline.pause() : timeline.resume());
    syncAudio();
  });

  function drawPaper() {
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    if (paper.presence < .001 || paper.fall >= 1) return;
    const pw = label.offsetWidth, ph = label.offsetHeight;
    const cy = parseFloat(getComputedStyle(label).top);
    const rotation = motion.matches ? 0 : -.052 + paper.peel * .2 + paper.fall * .34;
    const dx = motion.matches ? 0 : paper.x + paper.fall * width * .16;
    const dy = motion.matches ? 0 : paper.y + paper.fall * height * .6;
    ctx.save(); ctx.translate(width / 2 + dx, cy + dy); ctx.rotate(rotation);
    ctx.globalAlpha = paper.presence * (1 - paper.fall);
    ctx.shadowColor = '#55473033'; ctx.shadowBlur = 22; ctx.shadowOffsetY = 10;
    ctx.beginPath(); ctx.moveTo(-pw / 2, -ph / 2 + 3);
    for (let x = 0; x <= pw; x += 12) ctx.lineTo(-pw / 2 + x, -ph / 2 + Math.sin(x * .8) * 1.8);
    ctx.lineTo(pw / 2, ph / 2 - 3);
    for (let x = pw; x >= 0; x -= 12) ctx.lineTo(-pw / 2 + x, ph / 2 + Math.cos(x * .7) * 1.5);
    ctx.closePath(); ctx.fillStyle = '#ed9b85'; ctx.fill(); ctx.shadowColor = 'transparent';
    const fold = Math.min(pw * .75, paper.peel * pw * .72);
    if (fold > 0) {
      ctx.fillStyle = '#f5b6a1'; ctx.beginPath(); ctx.moveTo(pw / 2, -ph / 2);
      ctx.lineTo(pw / 2 - fold, -ph / 2); ctx.lineTo(pw / 2, ph / 2); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#a34c3c33'; ctx.stroke();
    }
    ctx.fillStyle = '#46231412';
    for (let i = 0; i < 180; i++) ctx.fillRect((i * 43 % pw) - pw / 2, (i * 29 % ph) - ph / 2, 1, 1);
    ctx.restore();
  }
  function resize() {
    width = scene.clientWidth; height = scene.clientHeight;
    const d = Math.min(devicePixelRatio || 1, 2);
    paperCanvas.width = width * d; paperCanvas.height = height * d;
    ctx?.setTransform(d, 0, 0, d, 0, 0); art.resize(width, height); drawPaper();
  }
  function resetPaper() {
    gesture = null; gsap.killTweensOf(paper);
    Object.assign(paper, {presence: 0, peel: 0, fall: 0, x: 0, y: 0});
    label.disabled = true; label.style.marginLeft = '0'; label.style.marginTop = '0';
    gsap.set([label, speaker], {autoAlpha: 0}); drawPaper();
  }

  function playSequence(kind, entries, onEnd) {
    kill(beatTimeline); sequence = entries; sequenceEnd = onEnd; beatIndex = -1;
    scene.dataset.sequence = kind; setPhase(kind); pause.hidden = false; pause.disabled = false;
    repeat.hidden = true; replay.hidden = false; replay.textContent = '이어서 →';
    instruction.textContent = ''; nextBeat();
  }
  function nextBeat(manual = false) {
    if (!sequence || (manual && locked)) return;
    // A reader moving faster than the animation still sees the replacement question.
    if (manual && sequence[beatIndex]?.mode === 'replacement' && getComputedStyle($('.new-question')).visibility === 'hidden') {
      beatTimeline.time(fade(REVEAL) + REPLACEMENT_WAIT + fade(.45), false);
      if (paused || document.hidden) beatTimeline.pause();
      return;
    }
    if (manual && beatIndex >= 0) { art.state.time = sequence[beatIndex].time; art.draw(); }
    kill(beatTimeline); stopVoice(); beatIndex++;
    if (beatIndex >= sequence.length) {
      const finish = sequenceEnd; sequence = null; finish(); return;
    }
    const entry = sequence[beatIndex]; locked = true; replay.disabled = true;
    scene.dataset.beat = String(beatIndex); narrative.dataset.mode = entry.mode || '';
    replacementAnnouncement.textContent = '';
    kicker.textContent = entry.kicker; copy.innerHTML = entry.html;
    // Update visible live text at the moment it enters the story, rather than preload hidden reasons.
    gsap.set(narrative, {autoAlpha: 1}); gsap.set(copy, {opacity: 0});
    gsap.set(progress, {width: '0%'});
    if (art.state.scene !== entry.visual) { art.state.scene = entry.visual; art.state.time = 0; }
    art.state.freedom = !motion.matches && phase === 'memory' ? 1 : 0;
    if (motion.matches) art.state.time = entry.time;
    art.draw();
    $('#art-description').textContent = entry.description || ({
      '-2': '금요일 저녁 모임방. 새로 온 서아가 문 앞에 선다.',
      '-1': '3주 전 지윤이 같은 문 앞에서 빈 의자를 바라본다.',
      '0': script.chapters[0].action,
      '1': script.chapters[1].action,
      '2': script.chapters[2].action,
      '3': '서아와 민호가 남은 의자를 정리하고 지윤에게 인사한다.'
    })[entry.visual];
    const reveal = fade(REVEAL), artOpacity = phase === 'closing' ? .15 : 1;
    gsap.set(artCanvas, {autoAlpha: artOpacity});
    beatTimeline = makeTimeline(() => nextBeat());
    beatTimeline.to(copy, {opacity: 1, duration: reveal}, 0);
    if (entry.voice && entry.mode !== 'replacement') beatTimeline.call(() => playVoice(entry.voice), null, fade(.12));
    beatTimeline.call(() => { locked = false; replay.disabled = actionCooling; focusReadingAction(replay); }, null, reveal);
    beatTimeline.to(progress, {width: '100%', duration: entry.hold, ease: 'none'}, reveal);
    if (!motion.matches) beatTimeline.to(art.state, {time: entry.time, duration: entry.hold, ease: 'none', onUpdate: () => art.draw()}, reveal);
    if (entry.mode === 'replacement') {
      beatTimeline.set('.old-judgment', {textDecoration: 'line-through', textDecorationThickness: '1px'}, reveal + REPLACEMENT_WAIT);
      beatTimeline.call(() => {
        $('.old-judgment').setAttribute('aria-hidden', 'true');
        $('.new-question').removeAttribute('aria-hidden');
        replacementAnnouncement.textContent = '민호: 조심히 가요, 지윤 씨.';
      }, null, reveal + REPLACEMENT_WAIT);
      beatTimeline.to('.new-question', {autoAlpha: 1, duration: fade(.45)}, reveal + REPLACEMENT_WAIT);
      beatTimeline.call(() => playVoice(entry.voice), null, reveal + REPLACEMENT_WAIT + fade(.1));
    }
    if (paused) {
      beatTimeline.time(entry.mode === 'replacement' ? reveal + REPLACEMENT_WAIT + fade(.45) : reveal, false);
      beatTimeline.pause();
    } else run(beatTimeline);
  }
  function mark(number, name) { $('#scene-number').textContent = number; $('#scene-name').textContent = name; }
  function startPrologue() {
    index = -1; art.state.time = 0; art.state.freedom = 0; scene.dataset.index = '-1'; mark('시작', '금요일 저녁');
    scene.setAttribute('aria-label', '금요일 저녁 모임방에 새로 온 서아가 들어온다.');
    resetPaper(); playSequence('prologue', script.prologue, () => transition(() => startChapter(0)));
  }
  function startChapter(nextIndex) {
    index = nextIndex; scene.dataset.index = String(index);
    const chapter = script.chapters[index];
    mark(`0${index + 1} / 03`, chapter.name); scene.setAttribute('aria-label', chapter.action);
    resetPaper(); speaker.textContent = chapter.speaker;
    label.querySelector('.judgment-copy').innerHTML = chapter.label;
    playSequence('observation', chapter.observation, attachJudgment);
  }
  function attachJudgment() {
    stopVoice(); setPhase('attachment'); replay.hidden = true; pause.disabled = true;
    const timeline = makeTimeline(() => {
      setPhase('waiting'); label.disabled = false;
      instruction.textContent = '붙은 말을 끌거나 탭해 주세요. Enter로도 걷어낼 수 있어요.';
      focusReadingAction(label);
    });
    timeline.to(narrative, {autoAlpha: 0, duration: fade(.25)}, 0);
    timeline.to(speaker, {autoAlpha: 1, duration: fade(.4)}, fade(.22));
    timeline.to(paper, {presence: 1, duration: fade(.65), onUpdate: drawPaper}, fade(.22));
    timeline.to(label, {autoAlpha: 1, duration: fade(.65)}, fade(.22));
    timeline.call(() => playVoice(script.chapters[index].labelVoice), null, fade(.48));
    if (paused) timeline.progress(1, false); else run(timeline);
  }
  function finishPeel() {
    if (phase !== 'waiting') return;
    setPhase('peeling'); gesture = null; label.disabled = true; instruction.textContent = '';
    gsap.killTweensOf(paper); rustle();
    const timeline = makeTimeline(() => {
      label.blur(); playSequence('memory', script.chapters[index].memory, completeChapter);
    });
    stopVoice();
    timeline.to([label, speaker], {autoAlpha: 0, duration: fade(.45)}, 0);
    timeline.to(paper, {peel: 1, fall: 1, duration: fade(.75), ease: 'power2.in', onUpdate: drawPaper}, 0);
    if (paused) timeline.progress(1, false); else run(timeline);
  }
  function completeChapter() {
    setPhase('complete'); pause.disabled = true; replay.disabled = actionCooling;
    replay.textContent = index === 2 ? '마지막 장면 →' : '다음 장면 →';
    repeat.hidden = false; instruction.textContent = ''; focusReadingAction(replay);
  }
  function transition(next) {
    setPhase('transition'); replay.hidden = true; repeat.hidden = true; pause.disabled = true; instruction.textContent = '';
    const timeline = makeTimeline();
    stopVoice();
    timeline.to(veil, {autoAlpha: 1, duration: fade(.35)});
    timeline.call(next);
    timeline.to(veil, {autoAlpha: 0, duration: fade(.35)});
    if (paused) timeline.progress(1, false); else run(timeline);
  }
  function startClosing() {
    index = 3; scene.dataset.index = '3'; mark('끝', '서로의 몫'); resetPaper();
    scene.setAttribute('aria-label', '모임방의 마지막 장면');
    playSequence('closing', script.closing, showEnding);
  }
  function showEnding() {
    stopVoice(); setPhase('ending'); ending.hidden = false; gsap.set(ending, {autoAlpha: 1});
    window.parent.postMessage({from: 'vibe-fold:chapter', chrome: 'show'}, '*');
    gsap.set(narrative, {autoAlpha: 0}); replay.hidden = true; pause.hidden = true;
    if (keyboard) $('#again').focus({preventScroll: true});
  }
  function begin() {
    if (phase !== 'intro' && phase !== 'ending') return;
    const opening = phase === 'intro' ? intro : ending;
    timelines.forEach(timeline => timeline.kill()); timelines.clear();
    stopVoice(); paused = false; updatePause(); participate(); setPhase('transition');
    window.parent.postMessage({from: 'vibe-fold:chapter', chrome: 'dim'}, '*');
    const timeline = makeTimeline(() => { opening.hidden = true; startPrologue(); });
    timeline.to(opening, {autoAlpha: 0, duration: fade(.5)}); run(timeline);
  }
  $('#begin').addEventListener('click', begin); $('#again').addEventListener('click', begin);
  replay.addEventListener('click', () => {
    if (actionCooling || locked) return;
    // A short input cooldown also works when the story clock is paused.
    actionCooling = true; clearTimeout(actionCooldown);
    if (sequence) nextBeat(true);
    else if (phase === 'complete') transition(() => index < 2 ? startChapter(index + 1) : startClosing());
    replay.disabled = true;
    actionCooldown = setTimeout(() => { actionCooling = false; if (!locked) replay.disabled = false; }, 180);
  });
  repeat.addEventListener('click', () => { if (phase === 'complete') transition(() => startChapter(index)); });

  label.addEventListener('pointerdown', event => {
    if (phase !== 'waiting' || (event.pointerType === 'mouse' && event.button !== 0)) return;
    participate(); gsap.killTweensOf(paper); label.setPointerCapture(event.pointerId);
    gesture = {id: event.pointerId, x: event.clientX, y: event.clientY, distance: 0};
  });
  label.addEventListener('pointermove', event => {
    if (!gesture || gesture.id !== event.pointerId || phase !== 'waiting') return;
    const dx = event.clientX - gesture.x, dy = event.clientY - gesture.y;
    gesture.distance = Math.hypot(dx, dy); paper.peel = Math.min(gesture.distance / 130, 1);
    paper.x = motion.matches ? 0 : dx * .45; paper.y = motion.matches ? 0 : dy * .45;
    label.style.marginLeft = `${paper.x}px`; label.style.marginTop = `${paper.y}px`;
    label.style.opacity = String(1 - paper.peel * .5); drawPaper();
    if (gesture.distance >= Math.min(110, width * .23)) finishPeel();
  });
  function release(event, cancelled = false) {
    if (!gesture || event.pointerId !== gesture.id) return;
    const distance = gesture.distance; gesture = null;
    if (!cancelled && distance < 8) finishPeel();
    else {
      label.style.marginLeft = '0'; label.style.marginTop = '0'; label.style.opacity = '1';
      const timeline = makeTimeline();
      timeline.to(paper, {x: 0, y: 0, peel: 0, duration: fade(.35), onUpdate: drawPaper});
      if (paused) timeline.progress(1); else run(timeline);
    }
  }
  label.addEventListener('pointerup', event => release(event));
  label.addEventListener('pointercancel', event => release(event, true));
  label.addEventListener('lostpointercapture', event => release(event, true));
  label.addEventListener('click', event => { if (event.detail === 0 && phase === 'waiting') { participate(); finishPeel(); } });
  document.addEventListener('keydown', () => { keyboard = true; });
  document.addEventListener('pointerdown', () => { keyboard = false; });

  function setupAudio() {
    if (audio) return;
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return;
    try {
      audio = new Audio(); bus = audio.createGain(); bus.gain.value = .16; bus.connect(audio.destination);
      const buffer = audio.createBuffer(1, audio.sampleRate * 4, audio.sampleRate), data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * .04;
      const ambience = audio.createBufferSource(), filter = audio.createBiquadFilter();
      ambience.buffer = buffer; ambience.loop = true; filter.type = 'lowpass'; filter.frequency.value = 400;
      ambience.connect(filter); filter.connect(bus); ambience.start();
    } catch { audio = null; }
  }
  function stopVoice() {
    if (!activeVoice) return;
    activeVoice.pause(); activeVoice.currentTime = 0; activeVoice = null;
  }
  function playVoice(id) {
    stopVoice();
    activeVoice = voiceBank.get(id) || null;
    if (!activeVoice) return;
    activeVoice.currentTime = 0;
    syncAudio();
  }
  function musicLevel() {
    if (phase === 'ending' || phase === 'intro') return 0;
    if (index === 2 && ['observation', 'attachment', 'waiting'].includes(phase)) return .09;
    if (phase === 'attachment' || phase === 'waiting') return .17;
    if (phase === 'peeling') return .08;
    if (phase === 'closing') return .33;
    return .24;
  }
  function syncAudio() {
    const playing = soundOn && !paused && !document.hidden && phase !== 'intro' && phase !== 'ending';
    gsap.to(music, {volume: musicLevel(), duration: fade(.4), overwrite: true});
    if (audio) (playing ? audio.resume() : audio.suspend()).catch(() => {});
    if (playing) {
      if (music.paused) music.play().catch(() => {});
      if (activeVoice && !activeVoice.ended && activeVoice.paused) activeVoice.play().catch(() => {});
    } else {
      music.pause();
      if (!soundOn) stopVoice(); else activeVoice?.pause();
    }
  }
  function updateSound() {
    sound.textContent = soundOn ? '소리 끄기 −' : '소리 켜기 ＋';
    sound.setAttribute('aria-pressed', String(soundOn)); sound.setAttribute('aria-label', soundOn ? '소리 끄기' : '소리 켜기');
  }
  function participate() { setupAudio(); if (!soundChosen) soundOn = true; updateSound(); syncAudio(); }
  function rustle() {
    if (!audio || !soundOn || audio.state !== 'running') return;
    const buffer = audio.createBuffer(1, audio.sampleRate * .7, audio.sampleRate), data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * .5 * Math.sin(Math.PI * i / data.length) ** 2;
    const source = audio.createBufferSource(), filter = audio.createBiquadFilter();
    filter.type = 'bandpass'; filter.frequency.value = 2400; filter.Q.value = .6;
    source.buffer = buffer; source.connect(filter); filter.connect(bus); source.start();
  }
  sound.addEventListener('click', () => { setupAudio(); soundChosen = true; soundOn = !soundOn; updateSound(); syncAudio(); });
  document.addEventListener('visibilitychange', () => {
    timelines.forEach(timeline => document.hidden || paused ? timeline.pause() : timeline.resume()); syncAudio();
  });
  motion.addEventListener('change', () => {
    if (motion.matches) {
      gsap.killTweensOf(art.state); art.state.time = sequence?.[beatIndex]?.time ?? 4;
      art.state.freedom = 0; art.draw();
    }
    drawPaper();
  });
  art.state.scene = -2; art.state.time = 3;
  new ResizeObserver(resize).observe(scene); resize(); updatePause();
})();
