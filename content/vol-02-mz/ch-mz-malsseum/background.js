/* 배경 — 도메인 워핑한 fbm 노이즈를 천천히 흘려보낸다.
   먹이 물에 번지는 결을 노렸다. 말씀이 바뀌면 두 색이 서서히 갈아탄다.

   화면을 꽉 채운 평면 한 장에 셰이더 한 장. 원근이 필요 없어서
   Stage 의 정사영 장면에 얹는다. 카드보다 늘 뒤에 그려진다.

   바꿔 끼우려면 start / setTone / pulse / look 네 개만 같은 모양으로 맞추면 된다. */
window.Backdrop = (function () {
  var VERT = [
    "varying vec2 v_uv;",
    "void main(){ v_uv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }",
  ].join("\n");

  var FRAG = [
    "precision highp float;",
    "uniform float u_aspect;",
    "uniform float u_time;",
    "uniform vec3 u_c1;",
    "uniform vec3 u_c2;",
    "uniform float u_pulse;",
    "uniform vec2 u_ptr;",
    "varying vec2 v_uv;",

    "float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }",

    "float noise(vec2 p){",
    "  vec2 i = floor(p), f = fract(p);",
    "  vec2 u = f * f * (3.0 - 2.0 * f);",
    "  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),",
    "             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);",
    "}",

    "float fbm(vec2 p){",
    "  float v = 0.0, a = 0.5;",
    "  for (int i = 0; i < 5; i++){ v += a * noise(p); p *= 2.02; a *= 0.5; }",
    "  return v;",
    "}",

    "void main(){",
    /* 짧은 쪽을 1 로 삼는다. 세로 화면에서도 가장자리가 제대로 눌린다 */
    "  vec2 p = (v_uv - 0.5) * vec2(u_aspect, 1.0) / min(u_aspect, 1.0);",
    "  float t = u_time * 0.025;",
    /* 노이즈로 좌표를 두 번 접어 소용돌이를 만든다 */
    "  vec2 q = vec2(fbm(p * 1.5 + vec2(0.0, t)), fbm(p * 1.5 + vec2(5.2, -t)));",
    "  vec2 r = vec2(fbm(p * 2.0 + 2.0 * q + vec2(1.7, 9.2) + 0.15 * t),",
    "                fbm(p * 2.0 + 2.0 * q + vec2(8.3, 2.8) - 0.12 * t));",
    "  float f = fbm(p * 1.2 + 2.5 * r + u_ptr * 0.12);",

    "  vec3 col = mix(u_c1, u_c2, clamp(f * 1.35, 0.0, 1.0));",
    "  col += u_c2 * pow(clamp(f, 0.0, 1.0), 3.0) * (0.35 + u_pulse * 0.9);",

    /* 가장자리를 눌러 카드가 놓일 가운데를 비운다 */
    "  float d = length(p * vec2(1.0, 1.15));",
    "  col *= smoothstep(1.5, 0.2, d);",

    /* 종이 결 같은 미세한 노이즈. 밴딩도 같이 덮는다 */
    "  col += (hash(v_uv * 2048.0 + fract(u_time)) - 0.5) * 0.03;",

    "  gl_FragColor = vec4(col, 1.0);",
    "}",
  ].join("\n");

  var mat = null;
  var calm = false;
  var startedAt = 0;
  var pulse = 0;
  var ptr = [0, 0];
  var ptrTarget = [0, 0];
  var from = [0, 0, 0, 0, 0, 0];
  var to = [0, 0, 0, 0, 0, 0];
  var mix = 1;

  function hexToRgb(hex) {
    var n = parseInt(hex.slice(1), 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }

  function pair(tone) {
    return hexToRgb(tone[0]).concat(hexToRgb(tone[1]));
  }

  function tick(now) {
    if (!startedAt) startedAt = now;

    if (mix < 1) mix = Math.min(1, mix + 0.012);
    pulse *= 0.94;
    ptr[0] += (ptrTarget[0] - ptr[0]) * 0.04;
    ptr[1] += (ptrTarget[1] - ptr[1]) * 0.04;

    var e = mix * mix * (3 - 2 * mix);
    var u = mat.uniforms;
    u.u_c1.value.set(
      from[0] + (to[0] - from[0]) * e,
      from[1] + (to[1] - from[1]) * e,
      from[2] + (to[2] - from[2]) * e,
    );
    u.u_c2.value.set(
      from[3] + (to[3] - from[3]) * e,
      from[4] + (to[4] - from[4]) * e,
      from[5] + (to[5] - from[5]) * e,
    );
    u.u_time.value = calm ? 0 : now - startedAt;
    u.u_pulse.value = calm ? 0 : pulse;
    u.u_ptr.value.set(calm ? 0 : ptr[0], calm ? 0 : ptr[1]);
  }

  return {
    start: function (tone, reducedMotion) {
      calm = !!reducedMotion;
      var rgb = pair(tone);
      from = rgb.slice();
      to = rgb.slice();

      mat = new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        depthTest: false,
        depthWrite: false,
        uniforms: {
          u_aspect: { value: 1 },
          u_time: { value: 0 },
          u_pulse: { value: 0 },
          u_ptr: { value: new THREE.Vector2(0, 0) },
          u_c1: { value: new THREE.Vector3(rgb[0], rgb[1], rgb[2]) },
          u_c2: { value: new THREE.Vector3(rgb[3], rgb[4], rgb[5]) },
        },
      });

      Stage.addFlat(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));
      Stage.onFrame(tick);
      Stage.onResize(function (m) {
        mat.uniforms.u_aspect.value = m.pxW / m.pxH;
      });
      mat.uniforms.u_aspect.value = Stage.metrics().pxW / Stage.metrics().pxH;
    },

    setTone: function (tone) {
      if (!mat) return;
      var e = mix * mix * (3 - 2 * mix);
      for (var i = 0; i < 6; i++) from[i] = from[i] + (to[i] - from[i]) * e;
      to = pair(tone);
      mix = 0;
    },

    /* 한 줄 나타날 때 배경을 아주 살짝 밝힌다 */
    pulse: function (amount) {
      pulse = Math.min(1, pulse + (amount || 0.35));
    },

    look: function (x, y) {
      ptrTarget[0] = x;
      ptrTarget[1] = y;
    },
  };
})();
