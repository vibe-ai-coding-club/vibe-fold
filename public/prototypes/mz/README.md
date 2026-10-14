# 〈MZ 같지 않네요〉 — 한 저녁의 이야기

동네 모임이 시작될 때 처음 온 서아가 들어온다. 지윤은 빈 의자를 내어준다. 운영자 민호의 세대 칭찬은 다음 부탁을 낳고, 지윤이 막차 때문에 더는 도울 수 없다고 하자 평가로 바뀐다. 관객은 산호색 말을 세 번 걷으며 지윤의 지난 기억, 남은 시간, 거절의 이유를 본다. 마지막에는 서아와 민호가 남은 일을 나누고 지윤의 이름을 부른다. 장소와 시간은 한 모임방의 같은 저녁으로 이어진다.

대본은 `story.js`에 있다. 앞선 열거형 서사의 갈등·인과·결말을 다시 검토하면서 Gemini와 두 차례 극작 의견을 교환했다. 제안의 중심인 ‘칭찬 → 기대 → 낙인’은 채택했고, 회의실/회식장 전환과 설명적 독백은 버렸다. 등장인물과 대사는 이 작품에 맞게 다시 썼다.

## 관객 화면

`index.html`과 `watch.html`은 작품만 표시하는 전체 화면 sandbox iframe이다. 기존 `?view=desktop`, `?view=mobile`, `?view=mobile-small`도 기기 크기에 맞춰 같은 작품을 연다. 관객 화면에는 해설·스토리보드·검토 UI가 없다. 시작 버튼을 누르면 작은 피아노와 세 인물의 한국어 대사가 나온다. 종이를 걷는 구간에서는 음악이 낮아지고, 무음으로도 대사와 행동을 읽을 수 있다.

종이는 마우스·터치로 끌거나 탭, Enter/Space로 걷는다. 일정 거리 이상 움직이면 나머지가 떨어진다. 자동 진행 부분은 약 90초이며 각 종이 앞에서는 관객을 기다리므로 실제 체험 시간은 더 길 수 있다. ‘잠시 멈춤’과 ‘이어서’, ‘이 장면 다시’, ‘다시 보기’를 지원한다. 음소거는 음악·대사·효과음에 함께 적용된다. 탭이 숨겨지면 진행과 소리를 멈춘다. 움직임 줄이기에서는 큰 변형과 잔상을 없애고 짧은 페이드로 바꾼다.

## 구현과 실행

`motion-art.js`의 인물·의자·문·시계·휴대폰·빛은 Canvas 2D로 그린다. 종이는 `experience.js`의 Canvas 2D, 전환은 로컬 GSAP을 사용한다. 영상·외부 CDN 요청은 없다. Noto Sans KR, 음악과 음성 파일도 로컬이다. 생성 조건은 `ASSETS.md`에 기록했다. 이전 Higgsfield 실사 시안은 `../mz-study/`에 보존한다.

Node 22.12 이상에서 의존성을 설치한 뒤:

```sh
npm run build
npm run preview -- --background --host 0.0.0.0 --port 4342
```

작품 주소: `http://localhost:4342/prototypes/mz/index.html`. `astro dev`는 `/chapters/` 밖의 opaque-origin 요청을 제한하므로 이 작품은 빌드 후 preview로 확인한다.

## 검사

```sh
PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs \
MZ_CHROMIUM_PATH=/absolute/path/to/chromium \
node docs/mz-prototype.check.mjs
```

같은 환경 변수로 `docs/mz-prototype-edge.check.mjs`, `docs/mz-story-manual.check.mjs`를 실행한다. `MZ_PREVIEW_URL`, `MZ_EVIDENCE_DIR`로 검토 주소와 증거 경로를 바꿀 수 있다. 1440×900, 390×844, 375×667에서 전체 흐름과 종이 입력·문장 배치·종료/재시작을 확인한다. BrowserOS와 Playwright 검사는 자기검사이며 실제 관객의 해석이나 실제 iOS/Android 기기 사용성을 대신하지 않는다.

인계 브랜치는 `artwork/mz-media-art`이다. human 커밋 소유 정책에 따라 staging·commit 없이 유지한다.
