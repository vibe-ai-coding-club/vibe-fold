# 인터넷 지층 — 픽셀 아트 에셋 스펙

이미지 생성 도구로 픽셀 아트를 만들어 이 챕터에 넣기 위한 작업 문서. 무엇을 그리고, 어떤 규격으로 뽑고, 어떻게 다듬어 넣는지 정한다.

게임은 지금 **임시 도형으로 다 돌아간다.** 그림은 하나씩 완성되는 대로 끼워 넣으면 되고, 넣지 않은 것은 계속 임시 도형으로 그려진다.

---

## 그릴 것

| # | 파일 | 무엇 | 원본 크기 | |
|---|---|---|---|---|
| 1 | `assets/frame-crt.webp` | 유물 틀 · 2000년대 초 · CRT 모니터 | 제각각 | 필수 ✅ |
| 2 | `assets/frame-pmp.webp` | 유물 틀 · 2000년대 후반 · 휴대용 미디어 플레이어 | 제각각 | 필수 ✅ |
| 3 | `assets/frame-oldphone.webp` | 유물 틀 · 2010년대 초 · 초기 스마트폰 | 제각각 | 필수 ✅ |
| 4 | `assets/frame-smartphone.webp` | 유물 틀 · 2010년대 후반 · 얇은 스마트폰 | 제각각 | 필수 ✅ |
| 5 | `assets/frame-bubble.webp` | 유물 틀 · 2020년대 초와 지표 · 말풍선 화석 | 제각각 | 필수 ✅ |
| 6 | `thumb.webp` | 목록 카드 썸네일 | 1200 × 750 | 필수 ✅ |
| 7 | `assets/tool-pickaxe.webp` | 곡괭이 · 탭한 자리에서 휘두름 | 112px 안 | 선택 ✅ |
| 8 | `assets/junk-earbuds.webp` | 잡동사니 · 2020년대 초 · 무선 이어폰 | 112px 안 | 선택 ✅ |
| 9 | `assets/junk-tanghulu.webp` | 잡동사니 · 2020년대 초 · 탕후루 | 112px 안 | 선택 ✅ |
| 10 | `assets/junk-spinner.webp` | 잡동사니 · 2010년대 후반 · 피젯 스피너 | 112px 안 | 선택 ✅ |
| 11 | `assets/junk-selfiestick.webp` | 잡동사니 · 2010년대 후반 · 셀카봉 | 112px 안 | 선택 ✅ |
| 12 | `assets/junk-earphones.webp` | 잡동사니 · 2010년대 초 · 엉킨 유선 이어폰 | 112px 안 | 선택 ✅ |
| 13 | `assets/junk-battery.webp` | 잡동사니 · 2010년대 초 · 보조배터리 | 112px 안 | 선택 ✅ |
| 14 | `assets/junk-mp3.webp` | 잡동사니 · 2000년대 후반 · MP3 플레이어 | 112px 안 | 선택 ✅ |
| 15 | `assets/junk-usb.webp` | 잡동사니 · 2000년대 후반 · USB 메모리 | 112px 안 | 선택 ✅ |
| 16 | `assets/junk-cd.webp` | 잡동사니 · 2000년대 초 · CD | 112px 안 | 선택 ✅ |
| 17 | `assets/junk-floppy.webp` | 잡동사니 · 2000년대 초 · 플로피 디스크 | 112px 안 | 선택 ✅ |

**권장 순서**: 5번 말풍선 → 1~4번 틀 → 6번 썸네일 → 곡괭이 → 잡동사니. 말풍선은 첫 화면부터 보여서 효과가 가장 크다.

### 코드로 남기는 것 (그리지 않는다)

| 요소 | 왜 |
|---|---|
| 흙 무늬, 하늘, 풀, 구름, 암반, 가운데 굴 | 굴이 파 내려가는 길이가 매번 달라진다 |
| **흙더미** | 칠 때마다 금이 커지고, 희귀할 때는 금빛으로 반짝인다 |
| **유물 위의 글자** | 밈은 `data.js`에서 바꾼다. 생성 도구는 한글을 제대로 못 그린다 |
| 금 간 자국, 충격 효과, "한 방에!" 글자 | 칠 때마다 달라진다 |
| 유물 카드, 결과 카드 | 글이 대부분이다 |
| 흙 튀는 파티클, 출토 반짝임 | 움직임이 본체다 |

---

## 그린 것을 넣는 법

1. 아래 [다듬기](#다듬기) 순서대로 원본 크기에 맞춰 `.webp`로 저장한다.
2. 위 표의 경로에 넣는다.
3. `data.js`의 `sprites`에 파일 이름을 적는다. 확장자와 `assets/`는 빼고.

```js
sprites: ['frame-bubble', 'frame-crt', 'tool-pickaxe'],
```

적힌 것만 불러온다. 아직 없는 파일을 적으면 콘솔에 오류가 나니 다 만든 것만 적는다.

---

## 공통 규격

**팔레트** — 프롬프트에 이미 들어 있다. 이 밖의 색이 섞이면 흙과 따로 논다.

```
외곽선   #1b1420      돌·플라스틱 밝음 #cfc6b8   어두움 #8f8578
화면 면  #b8d8b0      금속 #9aa3ad       강조 #ffd34d
흙 2020년대 초   #e8b98a      2010년대 후반 #c9925f     2010년대 초 #a06a44
흙 2000년대 후반 #74492f     2000년대 초 #4a2e22     암반   #2a2230
```

**유물 틀의 화면 면** — 코드가 이 자리에 밈 글자를 쓴다. **다섯 틀 모두 정확히 같은 자리**여야 한다.

```
64 × 40 틀 안에서
  화면 면     x 6 ~ 57,  y 8 ~ 29   (52 × 22)   단색 #b8d8b0, 아무것도 그리지 않음
  화면 테두리 그 바깥 1px              #1b1420
```

```
0         6                                     58      64
┌──────────────────────────────────────────────────────┐ 0
│          ┌───────────────────────────────────┐        │ 7
│          │                                   │        │ 8
│          │        화면 면 52 × 22 (비움)        │        │
│          │                                   │        │
│          └───────────────────────────────────┘        │ 30
│                                                       │
└──────────────────────────────────────────────────────┘ 40
```

말풍선(5번)만 화면 면 색이 `#e9e2d4`(밝은 돌색)다.

**생성 크기** — 모든 프롬프트는 1024 × 1024 정사각으로 뽑는다(썸네일만 1536 × 1024). 생성 도구는 정확한 픽셀 수를 못 지키니 크게 뽑고 아래처럼 줄인다.

### 다듬기

생성 도구가 뽑는 "픽셀 아트"는 픽셀 크기가 들쭉날쭉하다. 그대로 쓰면 확대했을 때 뭉개진다.

1. 투명 여백을 잘라 낸다.
2. **최근접 이웃(nearest neighbor)** 방식으로 원본 크기까지 줄인다. 다른 방식으로 줄이면 색이 섞인다.
3. 팔레트 밖으로 나간 색을 가장 가까운 팔레트 색으로 맞춘다. (Aseprite, Piskel 등)
4. 원본 크기에서 깨진 픽셀을 손으로 고친다. 특히 **유물 틀의 화면 면은 위 좌표대로 한 색으로**.
5. WebP 무손실로 저장한다. PNG는 커밋하지 않는다.

ImageMagick과 cwebp가 있다면 1·2·5번은 이렇게 한다.

```bash
magick input.png -trim +repage -filter point -resize 64x40! frame-crt.png
```

```bash
cwebp -lossless frame-crt.png -o assets/frame-crt.webp
```

**용량 예산** — 페이지가 받는 에셋 합계 150KB 이하. 픽셀 아트는 작아서 넉넉하다.

---

## 1. `frame-crt.webp` — CRT 모니터 (2000년대 초)

```
True pixel art game sprite at 64x40 pixel resolution, upscaled so every pixel is a crisp square.
Subject: a bulky early-2000s CRT computer monitor seen from the front, beige plastic case,
thick bezel, a small round power light at the bottom right of the bezel.
It looks slightly worn, like an excavated artifact: a few chips and scratches on the case.

SCREEN
- A large flat rectangular screen in the middle, about 80% of the width and 55% of the height,
  slightly above center.
- Fill the screen with one flat color #b8d8b0. Completely empty: no text, no icons,
  no reflection, no scanlines.
- 1px dark border #1b1420 around the screen.

STYLE
- Every pixel the same size. No anti-aliasing, no gradients, no blur, no glossy highlights.
- 1px dark outline #1b1420 around the whole object.
- Palette only: #1b1420 #d9cdb0 #cfc6b8 #8f8578 #b8d8b0 #ffd34d.

OUTPUT
- Transparent background. No desk, no soil, no shadow, no glow.
- One object, centered, wide landscape shape, generous empty margin.
- No letters, numbers, logos or brand marks anywhere.
- Square canvas 1024x1024.
```

## 2. `frame-pmp.webp` — 휴대용 미디어 플레이어 (2000년대 후반)

```
True pixel art game sprite at 64x40 pixel resolution, upscaled so every pixel is a crisp square.
Subject: a late-2000s portable media player held horizontally, seen from the front,
rounded silver body, a tiny d-pad on the far left edge and two tiny round buttons on the far right edge.
It looks slightly worn, like an excavated artifact: a few scratches on the body.

SCREEN
- A large flat rectangular screen in the middle, about 80% of the width and 55% of the height.
- Fill the screen with one flat color #b8d8b0. Completely empty: no text, no icons, no reflection.
- 1px dark border #1b1420 around the screen.

STYLE
- Every pixel the same size. No anti-aliasing, no gradients, no blur, no glossy highlights.
- 1px dark outline #1b1420 around the whole object.
- Palette only: #1b1420 #9aa3ad #cfc6b8 #8f8578 #b8d8b0.

OUTPUT
- Transparent background. No soil, no shadow, no glow.
- One object, centered, wide landscape shape, generous empty margin.
- No letters, numbers, logos or brand marks anywhere.
- Square canvas 1024x1024.
```

## 3. `frame-oldphone.webp` — 초기 스마트폰 (2010년대 초)

```
True pixel art game sprite at 64x40 pixel resolution, upscaled so every pixel is a crisp square.
Subject: an early-2010s smartphone lying sideways (landscape), seen from the front,
thick black bezel, one small physical home button on the right side.
It looks slightly worn, like an excavated artifact: a few scuffs on the bezel.

SCREEN
- A large flat rectangular screen in the middle, about 80% of the width and 55% of the height.
- Fill the screen with one flat color #b8d8b0. Completely empty: no text, no icons, no reflection.
- 1px dark border #1b1420 around the screen.

STYLE
- Every pixel the same size. No anti-aliasing, no gradients, no blur, no glossy highlights.
- 1px dark outline #1b1420 around the whole object.
- Palette only: #1b1420 #2b2b33 #8f8578 #cfc6b8 #b8d8b0.

OUTPUT
- Transparent background. No soil, no shadow, no glow.
- One object, centered, wide landscape shape, generous empty margin.
- No letters, numbers, logos or brand marks anywhere.
- Square canvas 1024x1024.
```

## 4. `frame-smartphone.webp` — 얇은 스마트폰 (2010년대 후반)

```
True pixel art game sprite at 64x40 pixel resolution, upscaled so every pixel is a crisp square.
Subject: a late-2010s thin smartphone lying sideways (landscape), seen from the front,
very thin dark bezel, rounded corners, a small crack on the bottom right corner of the glass
(on the bezel only, not over the screen).

SCREEN
- A large flat rectangular screen in the middle, about 80% of the width and 55% of the height.
- Fill the screen with one flat color #b8d8b0. Completely empty: no text, no icons, no notch,
  no reflection.
- 1px dark border #1b1420 around the screen.

STYLE
- Every pixel the same size. No anti-aliasing, no gradients, no blur, no glossy highlights.
- 1px dark outline #1b1420 around the whole object.
- Palette only: #1b1420 #3a3f4a #9aa3ad #cfc6b8 #b8d8b0.

OUTPUT
- Transparent background. No soil, no shadow, no glow.
- One object, centered, wide landscape shape, generous empty margin.
- No letters, numbers, logos or brand marks anywhere.
- Square canvas 1024x1024.
```

## 5. `frame-bubble.webp` — 말풍선 화석 (2020년대 초, 지표)

```
True pixel art game sprite at 64x40 pixel resolution, upscaled so every pixel is a crisp square.
Subject: a chat message speech bubble that has turned into stone, like a fossil.
Wide rounded rectangle with a small pointed tail at the bottom left.
Stone texture and small chips only on the outer rim.

INNER PANEL
- A large flat rectangular panel inside the bubble, about 80% of the width and 55% of the height,
  slightly above center.
- Fill the panel with one flat color #e9e2d4. Completely empty: no text, no symbols, no dots.
- 1px dark border #1b1420 around the panel.

STYLE
- Every pixel the same size. No anti-aliasing, no gradients, no blur.
- 1px dark outline #1b1420 around the whole bubble and tail.
- Palette only: #1b1420 #cfc6b8 #8f8578 #e9e2d4.

OUTPUT
- Transparent background. No soil, no shadow, no glow.
- One object, centered, wide landscape shape, generous empty margin.
- No letters, numbers or symbols anywhere.
- Square canvas 1024x1024.
```

### 유물 틀 체크

- 64 × 40으로 줄였을 때 **무슨 물건인지** 읽히는가
- 화면 면이 `x 6~57, y 8~29`에 한 색으로 있는가 (안 맞으면 원본 크기에서 손으로 맞춘다)
- 다섯 개를 나란히 놓았을 때 화면 면의 자리가 똑같은가

---

## 6. `thumb.webp` — 목록 카드 썸네일 ✅

| 항목 | 값 |
|---|---|
| 비율 | **16 : 10** 가로 |
| 최종 | 1200 × 750, WebP 30KB |
| 생성 크기 | 1536 × 1024 → 위아래를 잘라 16 : 10 |
| 읽혀야 하는 폭 | **152px**. 목록 카드는 세로에 맞춰 키운 뒤 좌우를 자른다 |

**방향** — Vol.1 표지처럼 주인공 하나, 넓은 여백, 바탕색 하나에 포인트색 하나. 단면도에 유물을 여러 개 늘어놓은 1차안은 작게 줄이면 갈색 줄무늬만 남아서 버렸다.

```
Minimal pixel art poster, chunky low resolution (about 160x100 pixels), every pixel a crisp square.

Underground darkness. Almost the whole image is very dark purple-black soil #1b1420 and #2a2230,
with only a faint hint of horizontal soil layers.
At the very top, a small opening in the ground lets in a single narrow beam of warm light #ffd34d
that falls straight down.
At the bottom center, half buried in dirt, lies one bulky old beige CRT computer monitor.
Its blank screen glows softly pale green #b8d8b0. The light beam lands on it.
A few dust specks float in the beam.

Only one object. Lots of empty dark space. Quiet, nostalgic mood.

STYLE
- Every pixel the same size. No anti-aliasing, no smooth gradients (use 2–3 stepped tones for the light).
- Limited palette: dark purple-blacks, one warm yellow, one pale green, beige for the monitor.

OUTPUT
- Landscape 1536x1024. The monitor sits slightly below center; keep the center of the image clear of clutter.
- No text, no letters, no numbers, no logos, no UI.
```

---

## 7. `tool-pickaxe.webp` — 곡괭이 (선택)

흙더미를 칠 때 맞은 자리에서 한 번 휘두르는 그림. 없으면 충격 효과만 나온다. **곡괭이 날 끝이 왼쪽 위 모서리**에 오게 그린다. 코드는 그 모서리를 맞은 자리에 맞추고 돌린다.

```
True pixel art game icon at 24x24 pixel resolution, upscaled so every pixel is a crisp square.
Subject: a small pickaxe with a wooden handle and a dark metal head.
Placed diagonally: handle toward the bottom right, the pointed tip of the head touching the top left corner.

STYLE
- Every pixel the same size. No anti-aliasing, no gradients, no blur.
- 1px dark outline #1b1420.
- Palette only: #1b1420 #9aa3ad #cfc6b8 #c9925f #8f8578.

OUTPUT
- Transparent background. No shadow, no ground. One object.
- No letters or numbers. Square canvas 1024x1024.
```

---

## 8~17. 잡동사니 (선택)

유물이 아닌, 굴 양옆 벽에 박혀 있는 물건. 내려가면서 보이면 그 층의 시대감이 산다.

> **넣은 방식.** 생성된 그림이 16px보다 훨씬 정밀하게 나와서, 16px로 줄이면 뭉개졌다. 그래서 긴 변 112px로 줄여 저장하고(WebP), 화면에서는 24px 칸에 비율을 지켜 부드럽게 줄여 그린다. 곡괭이도 같은 방식이다.

## 8. `junk-earbuds.webp`

```
True pixel art game item at 16x16 pixel resolution, upscaled so every pixel is a crisp square.
Subject: a single white wireless earbud with a short stem, slightly dirty.
STYLE: every pixel the same size, no anti-aliasing, no gradients. 1px outline #1b1420. 3 to 5 colors.
OUTPUT: transparent background, one object centered, no shadow, no letters or logos. Square canvas 1024x1024.
```

## 9. `junk-tanghulu.webp`

```
True pixel art game item at 16x16 pixel resolution, upscaled so every pixel is a crisp square.
Subject: a candied fruit skewer with three glossy red strawberries on a wooden stick, lying diagonally.
STYLE: every pixel the same size, no anti-aliasing, no gradients. 1px outline #1b1420. 3 to 5 colors.
OUTPUT: transparent background, one object centered, no shadow, no letters or logos. Square canvas 1024x1024.
```

## 10. `junk-spinner.webp`

```
True pixel art game item at 16x16 pixel resolution, upscaled so every pixel is a crisp square.
Subject: a three-armed fidget spinner seen from above, with a round bearing in the center.
STYLE: every pixel the same size, no anti-aliasing, no gradients. 1px outline #1b1420. 3 to 5 colors.
OUTPUT: transparent background, one object centered, no shadow, no letters or logos. Square canvas 1024x1024.
```

## 11. `junk-selfiestick.webp`

```
True pixel art game item at 16x16 pixel resolution, upscaled so every pixel is a crisp square.
Subject: a folded selfie stick with a small phone clamp on top, lying diagonally.
STYLE: every pixel the same size, no anti-aliasing, no gradients. 1px outline #1b1420. 3 to 5 colors.
OUTPUT: transparent background, one object centered, no shadow, no letters or logos. Square canvas 1024x1024.
```

## 12. `junk-earphones.webp`

```
True pixel art game item at 16x16 pixel resolution, upscaled so every pixel is a crisp square.
Subject: a tangled pair of white wired earphones with two small earbuds and a knotted cable.
STYLE: every pixel the same size, no anti-aliasing, no gradients. 1px outline #1b1420. 3 to 5 colors.
OUTPUT: transparent background, one object centered, no shadow, no letters or logos. Square canvas 1024x1024.
```

## 13. `junk-battery.webp`

```
True pixel art game item at 16x16 pixel resolution, upscaled so every pixel is a crisp square.
Subject: a small rectangular portable power bank with a short cable plugged in, four tiny indicator dots.
STYLE: every pixel the same size, no anti-aliasing, no gradients. 1px outline #1b1420. 3 to 5 colors.
OUTPUT: transparent background, one object centered, no shadow, no letters or logos. Square canvas 1024x1024.
```

## 14. `junk-mp3.webp`

```
True pixel art game item at 16x16 pixel resolution, upscaled so every pixel is a crisp square.
Subject: a tiny stick-shaped MP3 player with a small screen and a lanyard loop, lying diagonally.
STYLE: every pixel the same size, no anti-aliasing, no gradients. 1px outline #1b1420. 3 to 5 colors.
OUTPUT: transparent background, one object centered, no shadow, no letters or logos. Square canvas 1024x1024.
```

## 15. `junk-usb.webp`

```
True pixel art game item at 16x16 pixel resolution, upscaled so every pixel is a crisp square.
Subject: a small USB flash drive with its cap off lying next to it, lying diagonally.
STYLE: every pixel the same size, no anti-aliasing, no gradients. 1px outline #1b1420. 3 to 5 colors.
OUTPUT: transparent background, one object centered, no shadow, no letters or logos. Square canvas 1024x1024.
```

## 16. `junk-cd.webp`

```
True pixel art game item at 16x16 pixel resolution, upscaled so every pixel is a crisp square.
Subject: a scratched compact disc seen from above, silver with a faint rainbow sheen made of flat pixel bands, hole in the center.
STYLE: every pixel the same size, no anti-aliasing, no smooth gradients. 1px outline #1b1420. 3 to 5 colors.
OUTPUT: transparent background, one object centered, no shadow, no letters or logos. Square canvas 1024x1024.
```

## 17. `junk-floppy.webp`

```
True pixel art game item at 16x16 pixel resolution, upscaled so every pixel is a crisp square.
Subject: a 3.5 inch floppy disk seen from the front, dark blue body, metal shutter at the top, blank label area.
STYLE: every pixel the same size, no anti-aliasing, no gradients. 1px outline #1b1420. 3 to 5 colors.
OUTPUT: transparent background, one object centered, no shadow, no letters or logos. Square canvas 1024x1024.
```

---

## 폰트 (넣어 둠)

| 항목 | 값 |
|---|---|
| 폰트 | **Galmuri11** 보통·굵게 (한글 픽셀 폰트, v2.40.4) |
| 라이선스 | SIL Open Font License 1.1 — `assets/OFL.txt` |
| 파일 | `assets/fonts.css` (폰트를 base64로 담은 CSS, 약 114KB) |
| 글자 범위 | 자주 쓰는 한글 2,350자(KS X 1001), 한글 자모, 영문·숫자, 작품에 쓰인 기호 |

- sandbox iframe에서는 폰트 파일을 따로 불러오면 CORS에 막혀서, Vol.1 도깨비처럼 CSS 안에 base64로 넣었다.
- 원본(505KB)에서 필요한 글자만 남겨 줄였다. 2,350자에 없는 드문 글자가 밈에 들어가면 그 글자만 기본 글꼴로 보인다.
- Galmuri11은 12px의 배수에서 또렷하다. 글자 크기는 12·18·24·36px만 쓴다.

---

## 폴더 구조 (다 넣었을 때)

```
ch-internet-jicheung/
  index.html   meta.yaml   data.js   thumb.webp   ASSETS.md
  assets/
    frame-crt  frame-pmp  frame-oldphone  frame-smartphone  frame-bubble  (.webp)
    tool-pickaxe.webp
    junk-*.webp
    fonts.css  OFL.txt
```

새 유물 틀을 추가하려면 `assets/frame-<이름>.webp`를 넣고, `data.js`의 `layers[].frame`이나 `artifacts[].frame`에 `<이름>`을 적는다.
