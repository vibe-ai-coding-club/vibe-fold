> 보존한 이전 실사 시안입니다. 최종 완성본은 [모션그래픽 작품](../mz/watch.html)입니다. 아래 내용은 당시의 구현·검증 기록입니다. 방향 변경 전에 생성한 인사·거절의 추가 가로/세로 영상과 세로 이미지는 assets에 보존하며 이 체험에서는 사용하지 않습니다. 추가 조건은 assets/completion-generation.json에 기록합니다.

# 〈MZ 같지 않네요〉 첫 시안

실사 콜라주 위에 붙은 세대의 평가를 관객이 걷어내면 개인의 이유가 드러난다. 사용자 제공 계획의 따뜻한 자연광·산호색 종이·차분한 공감 방향을 구현했다.

- `index.html`: PC 1440×900, 모바일 390×844, 작은 모바일 375×667 검토 화면과 세 장면의 스토리보드.
- `experience.html`: 첫 장면 「배려」. HTML video + Canvas 2D + 로컬 GSAP 3.15.0.
- `assets/generation.json`, `assets/prompts.json`: 최종 생성 모델, 조건, 요청/실제 프롬프트, 참조, 생성 시각, 파일 해시.
- 나머지 두 장면은 스토리보드이며 아직 영상 체험이 아니다.

## 열기

Node 22.12 이상에서 `npm ci && npm run build` 후 `npm run preview -- --background --host 0.0.0.0 --port 4342`.

- PC: `http://localhost:4342/prototypes/mz-study/index.html?view=desktop`
- 모바일: `http://localhost:4342/prototypes/mz-study/index.html?view=mobile`
- 작은 모바일: `http://localhost:4342/prototypes/mz-study/index.html?view=mobile-small`

관리: `npx astro preview status`, `npx astro preview logs`, `npx astro preview stop`.

검토 화면은 실제 작품과 같은 `sandbox="allow-scripts" allow="autoplay"` iframe을 사용한다. `astro dev`는 `/chapters/` 이외 경로의 opaque-origin 요청을 제한하므로 이 독립 시안은 빌드 후 **preview**로 검토한다. 공용 Astro 설정과 볼륨 목차는 변경하지 않았다. 제작 완료 후 작품 폴더로 옮길 때는 이 폴더의 경험 파일과 assets를 함께 옮기면 된다.

## 체험

0–3초 관찰 → 3–4초 평가 부착 → 관객 대기 → 약 1.5초 걷기 → 약 7초 기억과 여운. 즉시 참여하면 약 13초이며, 기다리는 시간만큼 늘어난다. PC는 한 줄, 모바일은 두 줄로 종이의 말을 배치한다. 관객은 종이를 드래그·탭하거나 키보드 Tab으로 초점을 맞춘 뒤 Enter/Space를 누른다. 짧게 끌고 놓으면 원위치로 돌아간다.

첫 참여가 소리를 시작한다. 명시적으로 끈 소리는 다음 참여에서도 꺼진다. 소리는 Web Audio로 만든 작은 실내 분위기와 종이 마찰음이다. 무음에서도 모든 문장을 전달한다. 재생 실패는 가로/세로 기준 이미지로 대체한다. 탭을 숨기면 영상·소리·GSAP 전환을 멈추고 돌아오면 이어진다. 움직임 줄이기에서는 정지 이미지와 짧은 페이드를 사용하며 종이 회전·낙하·잔상을 생략한다.

## 제작 소재와 한계

Soul Cinematic 이미지 4장, Seedance 2.0 영상 2개(가로 1920×1080 / 세로 1080×1920, 각각 실제 길이 약 8.04초). 영상에는 소리가 없다. 첫 이미지의 동일 인물을 세로 이미지의 참조로 사용했다. 다만 Soul Cinematic 참조 모드가 실제 프롬프트를 빈 값으로 반환했으며, 이 결과와 요청을 따로 기록했다. 인사·거절은 참조 모드 결과가 행동을 제대로 담지 않아 텍스트 생성으로 교체했다. 따라서 스토리보드와 첫 장면 사이에는 얼굴·공간의 세부 차이가 있다.

평가·이유 문장은 전부 코드로 표시한다. 생성된 배려 영상 배경에는 의도하지 않은 벽의 간판이 남아 있다. 기존 Penpot 자료는 수정·삭제하지 않았다. 원본 검토 링크가 이번 입력과 저장소에 없어 새 검토 페이지에 연결하지 않았다.

## 검증

자기검사이며 독립 에이전트 검증은 수행하지 않았다. 자동 검사 원본과 캡처는 `/tmp/vibe-fold-mz-evidence/`에 있고, 재실행 가능한 검사는 `docs/mz-study/mz-photographic.check.mjs`, `docs/mz-study/mz-photographic-edge.check.mjs`에 있다. 설치된 Playwright를 사용한다(저장소 의존성을 추가하지 않음).

```sh
PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs \
MZ_CHROMIUM_PATH=/absolute/path/to/chromium \
node docs/mz-study/mz-photographic.check.mjs
```

같은 환경 변수로 `node docs/mz-study/mz-photographic-edge.check.mjs`를 실행한다. `MZ_PREVIEW_URL`로 기본 주소를 바꿀 수 있다. BrowserOS에서도 실제 sandbox 화면의 탭·Enter 조작을 확인했다. 실제 tab 숨김 대신 `document.hidden`을 바꾸는 fixture가 전환·영상 중단을 검사한다. 모바일 터치는 Chromium CDP 입력으로 검사하며 실제 iOS/Android 기기 검사는 수행하지 않았다.

| 조건·행동 | 구현 | 최종 확인 |
| --- | --- | --- |
| sandbox PC·두 모바일 크기, 화면 밖 잘림·문장·영상 | 완료 | 통과 |
| 마우스 드래그·CDP 터치 드래그·탭·Enter·재체험 | 완료 | 통과 |
| 영상 실패 → 이미지와 체험 유지 | 완료 | 통과 |
| 움직임 줄이기 → 정지 이미지와 페이드 | 완료 | 통과 |
| 숨김 fixture·짧은 드래그 취소·명시적 무음·연타·비율 변경 | 완료 | 통과 |
| 실제 영상 재생·외부 요청·콘솔 오류·전체 빌드 | 완료 | 통과 |
