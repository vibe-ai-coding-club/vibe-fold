# VIBE FOLD 작품 제출 가이드

VIBE FOLD의 작품 하나는 폴더 하나입니다. 제작자는 완성된 작품 폴더 하나를 Pull Request(PR)로 제출하고, 편집부는 게재 여부와 작품 순서, 커버를 결정합니다.

작품 데이터의 상세한 의미는 [ARTWORK.md](./ARTWORK.md)를 참고하세요. 이 문서는 작품을 준비하고 제출하는 절차와 실행 규칙을 설명합니다.

> **통합 상태 확인:** 제출을 시작하기 전에 대상 `develop`에 `ARTWORK.md`와 새 메타데이터를 사용하는 템플릿·사이트 로더가 함께 반영되어 있어야 합니다. `ARTWORK.md`가 없거나 템플릿·로더가 아직 `author`, `summary`, `thumb`를 사용한다면 작품을 만들거나 제출하지 말고 편집부에 먼저 문의하세요.

## 1. 작품 폴더 만들기

제출할 호수를 확인한 뒤 최신 `develop`에서 작품 전용 브랜치를 만듭니다. 아래 예시는 운영자가 안내한 쓰기 가능한 원격 이름이 `origin`인 경우입니다.

```bash
git fetch origin develop
git switch develop
git pull --ff-only origin develop
git switch -c artwork/my-piece
```

`develop`이 없거나 push할 원격과 권한을 안내받지 못했다면 `main`에서 대신 작업하지 말고 운영자에게 문의하세요.

작품 브랜치에서 템플릿을 복사합니다. 아래 `vol-01-seolhwa`와 `my-piece`는 예시이므로 편집부가 안내한 기존 볼륨과 작품 slug로 바꾸세요. 대상 볼륨에는 `volume.yaml`이 이미 있어야 하며, 제작자가 새 볼륨을 만들지는 않습니다.

```bash
cp -R content/_templates/ch-untitled \
  content/vol-01-seolhwa/ch-my-piece
```

현재 저장소 구조와 새 작품이 들어갈 위치를 함께 보면 다음과 같습니다.

```text
content/
├── _templates/
│   └── ch-untitled/                  ← 복사할 작품 템플릿
├── vol-00-sokdam/
│   ├── volume.yaml
│   └── ch-gorae-ssaume-saeu/        ← 이미 있는 예시 작품
└── vol-01-seolhwa/
    ├── volume.yaml                   ← 편집부 관리
    └── ch-my-piece/                  ← 새 제출 시 추가
```

`vol-00-sokdam/ch-gorae-ssaume-saeu`는 위치를 설명하기 위한 기존 작품입니다. 이 폴더를 복사하거나 수정하지 말고 항상 `content/_templates/ch-untitled`를 복사하세요. `vol-01-seolhwa/ch-my-piece`는 현재 있는 작품이 아니라 새 제출 위치를 보여 주는 예시이므로, 실제 작업에서는 편집부가 안내한 볼륨과 slug로 바꿉니다.

작품 폴더는 `content/<기존-volume>/ch-<slug>/`에 둡니다. `slug` 앞에 `ch-`를 붙인 값이 작품 `id`이자 폴더명입니다.

| 규칙 | 내용 |
| --- | --- |
| `slug` 사용 가능 | 소문자 영문, 숫자, 하이픈 |
| 사용 불가 | 공백, 한글, 대문자, 밑줄, 마침표 |
| 일치 조건 | `slug: my-piece` → `id: ch-my-piece` → 폴더 `ch-my-piece` |
| 순번 | 붙이지 않음. `ch-03-my-piece`가 아니라 `ch-my-piece`로 작성 |

`id`와 `slug`는 위 규칙에 맞게 제작자가 입력합니다. `volume`, `order`, `isCover`는 `meta.yaml`에 입력하지 않습니다. 작품 순서와 커버는 편집부가 `volume.yaml`의 `chapters` 목록으로 정합니다.

## 2. 폴더와 필수 파일

작품 폴더 안의 구조는 자유지만 다음 파일은 폴더 루트에 있어야 합니다.

```text
ch-my-piece/
├── meta.yaml       작품 정보
├── index.html      작품 진입점
├── thumbnail.webp  대표 이미지 예시
└── assets/         이미지, 사운드, 폰트, 스크립트 등
```

| 파일 | 필수 | 설명 |
| --- | :---: | --- |
| `meta.yaml` | O | 제목, 제작자, 설명, 썸네일과 선택 링크 |
| `index.html` | O | iframe에서 불러오는 작품 진입점 |
| 썸네일 | O | `meta.yaml`의 `thumbnail`이 가리키는 파일 |

하위 폴더는 작품과 함께 복사됩니다. 번들러를 사용했다면 실행에 필요한 최종 산출물만 제출하고 `node_modules`와 빌드에 사용한 임시 파일은 제외하세요. 브라우저에서 직접 불러오는 JavaScript, CSS와 에셋은 제출물에 포함해야 합니다.

## 3. `meta.yaml` 작성하기

```yaml
id: ch-my-piece
slug: my-piece
title: 작품 제목
creator: your-name
thumbnail: thumbnail.webp
description: |
  작품의 핵심 경험이나 조작을 첫 문장에 적습니다.
  이어서 작품의 인상과 내용을 짧게 설명합니다.

# 선택 사항입니다. 링크가 없다면 links 블록 전체를 지웁니다.
links:
  github: https://github.com/your-name
  website: https://your-site.example
  instagram: https://instagram.com/your-name
```

- `id`: `ch-`와 `slug`를 합친 값이며 작품 폴더명과 정확히 같아야 합니다.
- `slug`: URL에 쓰는 이름입니다. 소문자 영문, 숫자, 하이픈만 사용합니다. 한글 제목은 로마자로 옮깁니다.
- `title`: 화면에 표시할 작품 제목입니다. 짧고 구별하기 쉽게 작성하세요.
- `creator`: `@`를 붙이지 않은 제작자 표시명입니다. 공동 제작은 `Yuja × Nova`처럼 한 문자열로 적습니다.
- `thumbnail`: 작품 폴더 루트를 기준으로 한 상대경로입니다. 가로나 정사각형 대신 세로 이미지를 사용하세요. 정확한 비율은 고정하지 않지만 3:4가 잘 맞습니다.
- `description`: 일반 텍스트 30~150자, 1~2문단을 권장합니다. 마크다운과 HTML은 렌더링되지 않습니다.
- `links`: 모두 선택 사항이며, 값은 `https://`로 시작하는 완전한 URL이어야 합니다.

`author`, `summary`, `thumb` 같은 이전 필드명과 `volume`, `order`, `isCover`는 사용하지 마세요. 썸네일은 실제 표시 폭인 약 152~223px에서도 작품의 인상과 주요 요소가 읽히는지 확인하세요. 편집부가 첫 작품으로 배치하면 이 썸네일이 볼륨 커버에도 사용됩니다.

## 4. 작품 실행 규칙

### 경로와 에셋

- 이미지, 사운드, 폰트, 스크립트와 데이터는 작품 폴더 안에 포함하세요.
- `assets/image.png` 또는 `./assets/image.png`처럼 상대경로를 사용하세요.
- `/assets/image.png`처럼 `/`로 시작하는 경로는 사이트 루트를 가리키므로 사용하지 마세요.
- CDN, 원격 폰트, 외부 API, `fetch`, WebSocket과 외부 로깅을 사용하지 마세요.
- 트래킹·분석 스크립트와 개인정보 입력·수집 기능을 넣지 마세요.

### iframe sandbox

작품은 `<iframe sandbox="allow-scripts">` 안에서 실행됩니다. 다음 기능에 의존하면 안 됩니다.

- `localStorage`, `sessionStorage`, 쿠키
- `window.parent` 또는 `window.top`을 통한 부모 페이지 접근
- `alert`, `confirm`, `prompt`
- `window.open`, 폼 전송, 전체화면, 포인터 락

상태는 메모리에 보관하세요. 새로고침하면 초기화되는 것이 정상입니다.

### 화면과 조작

- 작품은 뷰포트 전체를 사용하며 페이지 자체는 스크롤되지 않아야 합니다.
- 최소 `375 × 667` 모바일 화면과 데스크톱에서 확인하세요.
- 조작이 필요하다면 화면에서 무엇을 해야 하는지 알 수 있게 만드세요.
- 포인터뿐 아니라 가능한 경우 키보드와 터치 입력도 지원하세요.
- 사이트의 이전·로고·다음 내비게이션은 편집부가 관리하므로 작품에서 별도로 만들지 마세요.

## 5. 제출 전 확인하기

Node.js 22.12 이상을 준비한 뒤 잠금 파일에 맞춰 프로젝트 의존성을 설치하고 전체 빌드를 확인합니다.

```bash
npm ci
npm run build
```

빌드 성공만으로 작품의 모든 상호작용이 검증되지는 않습니다. 작품을 로컬 HTTP 서버에서 열어 다음을 직접 확인하세요.

- 첫 화면이 오류 없이 표시되는지
- 이미지, 폰트, 사운드와 스크립트가 모두 로드되는지
- 모바일과 데스크톱에서 화면이 잘리거나 스크롤되지 않는지
- 반복 조작, 빠른 연타, 창 크기 변경에도 깨지지 않는지
- 브라우저 개발자 도구의 Console과 Network에 예상하지 않은 오류나 외부 요청이 없는지

작품은 편집부가 `volume.yaml`에 등록하기 전에는 VIBE FOLD의 볼륨 페이지에 나타나지 않을 수 있습니다. 미등록 상태에서 사이트 목록에 보이지 않는 것은 제출 오류가 아닙니다.

## 6. PR 제출하기

작품 PR의 base는 항상 `develop`입니다. `main`은 편집부가 발행할 때만 사용하는 브랜치이므로 작품 브랜치를 push하거나 작품 PR의 base로 선택하지 마세요.

PR에는 다음 경로 아래의 자기 작품 폴더 하나만 포함하세요.

```text
content/<existing-volume>/ch-<slug>/
```

편집부와 따로 협의하지 않았다면 다음 파일은 수정하지 마세요.

- `volume.yaml`과 다른 작품 폴더
- `src/`, `public/`과 Astro 설정
- 공용 스타일, 헤더, 내비게이션
- `ARTWORK.md`, `CONTRIBUTING.md`와 제출 템플릿

직접 제출한다면 변경 범위가 자기 작품 폴더 하나뿐인지 확인한 뒤 해당 폴더만 commit하고 push합니다.

```bash
git status --short
git add content/vol-01-seolhwa/ch-my-piece
git diff --cached --name-only
git commit -m "Add My Piece by your-name."
git push -u origin artwork/my-piece
```

GitHub에서 PR을 만들 때 다음 값을 확인하세요.

- base: `develop`
- compare/head: `artwork/my-piece`
- 상태: Ready for review

리뷰 수정 커밋은 작품 브랜치에 추가해도 됩니다. 기존 커밋을 force push로 다시 쓰거나 직접 squash할 필요는 없습니다. 승인된 작품 PR은 편집부가 Squash and merge하여 `develop`에 작품당 커밋 하나로 정리합니다.

## 7. PR 본문

아래 양식을 복사해 작품 정보와 검사 결과를 채우세요.

```markdown
## 작품 정보

- ID (`id`):
- slug (`slug`):
- 제목 (`title`):
- 제작자 (`creator`):
- 작품 폴더:

### 작품 설명

`description`과 같거나 더 자세한 설명을 적어 주세요.

### 조작 방법

독자가 무엇을 하면 무엇이 일어나는지 적어 주세요.

### 대표 순간

홍보 영상으로 촬영할 장면을 적어 주세요. 무엇을 조작하면, 몇 초쯤 뒤에, 무엇이 나타나는지 설명해 주세요.

## 외부 링크

- GitHub:
- Website:
- Instagram:

## 에셋 출처

| 에셋 | 출처 | 라이선스 |
| --- | --- | --- |
| | | |

- AI 생성 에셋: 없음 / 있음 —

## 제출 검사

- [ ] `meta.yaml`과 `index.html`이 작품 폴더 루트에 있음
- [ ] `slug`, `id`, 폴더명이 `my-piece` → `ch-my-piece` 규칙으로 정확히 일치함
- [ ] 작품 폴더명에 순번을 붙이지 않음
- [ ] 썸네일 파일이 존재하고 약 152~223px 너비에서도 읽힘
- [ ] 모든 런타임 에셋이 작품 폴더 안에 있음
- [ ] 절대경로와 외부 네트워크 요청이 없음
- [ ] sandbox에서 차단되는 기능에 의존하지 않음
- [ ] `375 × 667`과 데스크톱에서 확인함
- [ ] `node_modules`와 불필요한 빌드 파일을 포함하지 않음
- [ ] 에셋의 웹 공개 재배포 권리를 확인함
- [ ] PR 변경 범위가 자기 작품 폴더 하나뿐임
- [ ] `npm run build`가 성공함
- [ ] PR base가 `develop`이고 `main`을 수정하지 않음
```

## 8. 검토와 발행

편집부는 다음을 확인합니다.

1. 제출 형식과 실행 규칙을 지켰는지
2. 작품이 습작이나 데모가 아닌 완성된 상태인지
3. 제출한 호수의 주제와 이어지는지
4. 조작과 반응이 독자에게 명확한지
5. 화면 크기 변경과 반복 조작에도 안정적인지

수정이 필요하면 PR 리뷰로 요청합니다. 작품이 승인되면 편집부가 작품 PR을 `develop`에 Squash and merge하고, 작품 순서와 커버를 정해 `volume.yaml`에 등록합니다. `develop`에서 `main`으로 발행하는 절차는 편집부가 별도로 진행하며 작품 제출자의 작업 범위가 아닙니다.

## 9. 권리와 출처

- 사용한 이미지, 사운드, 폰트와 코드의 웹 공개 재배포 권리를 확인하고 PR 본문에 출처와 라이선스를 적으세요.
- 생성형 AI로 만든 에셋은 사용 사실을 적으세요. 기록을 위한 항목이며 그 자체가 반려 사유는 아닙니다.
- 작품의 저작권은 제작자에게 있습니다.
- 제출은 VIBE FOLD가 작품을 게재·전시하고, 홍보를 위해 작품 화면을 촬영·편집·배포하며 `creator`와 `links`의 계정을 표기하는 것에 동의함을 의미합니다.
- 원하지 않는 홍보 방식이 있다면 PR 본문에 적으세요.
