/* 읽어 주는 소리.
   줄 하나에 파일 하나다. 떠오르는 줄에 맞춰 그 줄을 읽는다.

   ── 왜 미리 받아 두지 않는가
   편은 서른 넷이고 줄은 일흔 여섯인데, 한 번 들어와서 듣는 것은 세 편
   일곱 줄뿐이다. 일흔 여섯을 전부 열어 두면 쓰지 않을 소리를 받느라
   첫 장이 늦게 뜬다. 그래서 카드가 뒤집히는 순간, 그 편의 줄만 부른다.

   ── 없어도 돈다
   파일이 아직 없거나 브라우저가 소리를 거절하면 조용히 실패하고 작품은
   그대로 돈다. 이 작품의 소리는 처음부터 코드로 만든 드론과 종이었고,
   읽어 주는 소리는 그 위에 얹히는 것이지 그것을 대신하지 않는다.
   말씀은 글로 다 읽히고, 소리는 거들기만 한다.

   ── 드론을 낮춘다
   드론은 끊기지 않고 계속 울린다. 열두 자짜리 한 줄은 그 아래 묻히므로,
   읽는 동안에는 드론을 눌러 두고 끝나면 되돌린다. 눌러 두는 일은
   Chime 이 하고, 언제 눌렀다 놓을지는 여기서 정한다. */
window.Voice = (function () {
  var DIR = "assets/voice/";
  /* AAC 다. mp3 가 아닌 이유는 ASSETS.md 에 적었다 — 만든 자리에 mp3
     인코더가 없었다. 브라우저 쪽은 셋 다 AAC 를 읽는다. */
  var EXT = ".m4a";

  /* 다 읽은 뒤 다음 줄까지의 숨. 말이 끝나자마자 다음 줄이 떠오르면
     두 줄이 한 문장으로 붙어 읽힌다. */
  var BREATH = 420;

  var clips = {}; /* "v01-2" → <audio> */
  var holder = null; /* 엘리먼트를 담아 두는 자리 */
  var playing = null; /* 지금 울리고 있는 것 */
  var muted = false;
  /* 한 번도 울려 본 적이 없으면 아직 아무것도 모른다. 파일이 없는 작품과
     소리가 거절된 작품을 구별하지 않는다 — 둘 다 조용히 글로만 돈다. */
  var heard = false;

  function stash() {
    if (!holder) {
      holder = document.createElement("div");
      holder.hidden = true;
      document.body.appendChild(holder);
    }
    return holder;
  }

  function key(voice, line) {
    return voice + "-" + (line + 1);
  }

  function clip(voice, line) {
    var id = key(voice, line);
    if (clips[id]) return clips[id];

    var el = document.createElement("audio");
    el.src = DIR + id + EXT;
    el.preload = "auto";
    /* 드론과 종 위에 얹히는 소리다. 1.0 으로 두면 말이 앞으로 튀어나와
       배경이 뒤로 물러나 버린다. */
    el.volume = 0.9;
    el.muted = muted;
    el.addEventListener("ended", function () {
      if (playing === el) release();
    });
    /* 파일이 없는 편. 그런 편이 있다는 사실만 알아 두고 넘어간다 */
    el.addEventListener("error", function () {
      if (playing === el) release();
    });
    stash().appendChild(el);
    clips[id] = el;
    return el;
  }

  /* 눌러 둔 드론을 놓는다 */
  function release() {
    playing = null;
    if (Chime && Chime.duck) Chime.duck(false);
  }

  return {
    /* 카드가 뒤집힐 때. 이 편의 줄만 받아 둔다 */
    warm: function (voice, count) {
      if (!voice) return;
      for (var i = 0; i < count; i++) clip(voice, i);
    },

    /* 한 줄을 읽는다 */
    say: function (voice, line) {
      this.hush();
      if (!voice || muted) return;

      var el = clip(voice, line);
      try {
        el.currentTime = 0;
      } catch (err) {
        /* 아직 받는 중이면 어차피 처음부터 돈다 */
      }

      var sung = el.play();
      playing = el;
      if (Chime && Chime.duck) Chime.duck(true);

      /* play() 는 약속을 돌려준다. 거절은 조용하다 — 받아서 치우지 않으면
         콘솔에 잡히지 않은 거절이 쌓인다. */
      if (sung && sung.then) {
        sung.then(
          function () {
            heard = true;
          },
          function () {
            if (playing === el) release();
          },
        );
      }
    },

    /* 읽던 것을 멈춘다. 사람이 먼저 넘기면 말도 거기서 끊는다 —
       읽는 속도는 읽는 사람 것이다. */
    hush: function () {
      if (!playing) return;
      var el = playing;
      release();
      try {
        el.pause();
        el.currentTime = 0;
      } catch (err) {
        /* 이미 멎었으면 그대로 둔다 */
      }
    },

    /* 탭을 떠나면 말도 멈춘다. 돌아왔을 때 중간부터 들리지 않게,
       멈추는 것이 아니라 거둔다. */
    away: function (gone) {
      if (gone) this.hush();
    },

    /* 아직 읽을 말이 얼마나 남았는지. 모르면 0 — 그때는 글만 보고
       넘기는 원래의 셈으로 돌아간다. */
    remaining: function () {
      if (!playing || muted) return 0;
      var span = playing.duration;
      if (!span || span !== span || span === Infinity) return 0;
      var left = (span - playing.currentTime) * 1000;
      return left > 0 ? left + BREATH : 0;
    },

    mute: function (on) {
      muted = !!on;
      for (var id in clips) {
        if (clips[id]) clips[id].muted = muted;
      }
      if (muted) this.hush();
      return muted;
    },

    /* 소리가 한 번이라도 울렸는지. 음소거 단추를 세울지 정하는 데 쓴다 */
    isHeard: function () {
      return heard;
    },
  };
})();
