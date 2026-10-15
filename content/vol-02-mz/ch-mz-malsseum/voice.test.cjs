/* 읽어 주는 소리를 가짜 DOM 위에 올려 돌려 본다.
   소리가 좋은지는 귀로 들어야 한다. 여기서 세는 것은 그 앞의 것들이다 —
   어느 파일을 부르는지, 뽑지 않은 편까지 받아 오지는 않는지, 사람이 먼저
   넘겼을 때 말이 끊기는지, 음소거 한 번이 울고 있는 것과 앞으로 울 것
   모두에 닿는지, 그리고 파일이 없는 편에서 조용히 물러나는지.

   돌리는 법:  node --test voice.test.cjs */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

/* voice.js 는 window·document·Chime 을 보고 산다. 셋 다 여기서 세워 준다. */
function setup() {
  const made = []; /* 만들어진 <audio> 전부, 만든 순서대로 */
  const ducks = []; /* Chime.duck 에 들어온 값의 내력 */

  function audio() {
    const el = {
      src: '',
      preload: '',
      volume: 1,
      muted: false,
      duration: NaN, /* 아직 받는 중이면 길이를 모른다 */
      currentTime: 0,
      paused: true,
      addEventListener() {},
      play() {
        el.paused = false;
        return Promise.resolve();
      },
      pause() {
        el.paused = true;
      },
    };
    made.push(el);
    return el;
  }

  const context = {
    window: {},
    document: {
      body: { appendChild() {} },
      createElement: (tag) =>
        tag === 'audio' ? audio() : { hidden: false, appendChild() {} },
    },
    Chime: { duck: (on) => ducks.push(on) },
  };
  vm.runInNewContext(fs.readFileSync(__dirname + '/voice.js', 'utf8'), context);

  return { Voice: context.window.Voice, made, ducks };
}

test('뽑힌 편의 줄만, 이름 그대로 부른다', () => {
  const { Voice, made } = setup();
  Voice.warm('v07', 3);
  assert.deepEqual(
    made.map((el) => el.src),
    ['assets/voice/v07-1.m4a', 'assets/voice/v07-2.m4a', 'assets/voice/v07-3.m4a'],
  );
  /* 서른 넷을 다 열어 두면 쓰지 않을 소리를 받느라 첫 장이 늦게 뜬다 */
  assert.equal(made.length, 3);
});

test('이미 받아 둔 줄을 다시 만들지 않는다', () => {
  const { Voice, made } = setup();
  Voice.warm('v07', 2);
  Voice.say('v07', 1);
  assert.equal(made.length, 2);
  assert.equal(made[1].paused, false);
});

test('읽는 동안 드론을 눌렀다가 놓는다', () => {
  const { Voice, ducks } = setup();
  Voice.warm('v07', 1);
  Voice.say('v07', 0);
  assert.equal(ducks.at(-1), true);
  Voice.hush();
  assert.equal(ducks.at(-1), false);
});

test('남은 말을 기다리되, 길이를 모르면 원래 셈으로 돌아간다', () => {
  const { Voice, made } = setup();
  Voice.warm('v07', 1);
  Voice.say('v07', 0);
  /* 아직 길이를 모르는 동안은 0 — app.js 가 글만 보고 넘기는 셈을 쓴다 */
  assert.equal(Voice.remaining(), 0);
  made[0].duration = 2.5;
  made[0].currentTime = 0.5;
  /* 남은 2초에 숨 420ms */
  assert.equal(Voice.remaining(), 2420);
});

test('사람이 먼저 넘기면 말도 거기서 끊고 처음으로 되돌린다', () => {
  const { Voice, made } = setup();
  Voice.warm('v07', 1);
  Voice.say('v07', 0);
  made[0].currentTime = 1.2;
  Voice.hush();
  assert.equal(made[0].paused, true);
  assert.equal(made[0].currentTime, 0);
  assert.equal(Voice.remaining(), 0);
});

test('음소거 한 번이 울고 있는 것과 앞으로 울 것 모두에 닿는다', () => {
  const { Voice, made } = setup();
  Voice.warm('v07', 2);
  Voice.say('v07', 0);
  Voice.mute(true);
  assert.ok(made.every((el) => el.muted));
  assert.equal(made[0].paused, true);

  Voice.warm('v08', 1); /* 음소거 뒤에 받는 것도 */
  assert.equal(made.at(-1).muted, true);
  Voice.say('v08', 0);
  assert.equal(made.at(-1).paused, true);
  assert.equal(Voice.remaining(), 0);

  Voice.mute(false);
  assert.ok(made.every((el) => el.muted === false));
});

test('소리가 없는 편은 조용히 글로만 떠오른다', () => {
  const { Voice, made, ducks } = setup();
  Voice.warm(undefined, 2);
  Voice.say(undefined, 0);
  assert.equal(made.length, 0);
  assert.equal(ducks.length, 0);
});

test('탭을 떠나면 거둔다', () => {
  const { Voice, made, ducks } = setup();
  Voice.warm('v07', 1);
  Voice.say('v07', 0);
  Voice.away(true);
  assert.equal(made[0].paused, true);
  assert.equal(ducks.at(-1), false);
});
