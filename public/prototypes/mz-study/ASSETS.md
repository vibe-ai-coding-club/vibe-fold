# 소재 출처

| 파일 | 출처·조건 |
| --- | --- |
| care-landscape.jpg, care-portrait.jpg, greeting.jpg, boundary.jpg | Higgsfield Soul Cinematic, 2k 요청. 실제 출력 크기는 generation.json. 생성 PNG를 JPEG q=2로 저장 |
| care-landscape.mp4, care-portrait.mp4 | Higgsfield Seedance 2.0, 기준 이미지 참조, 8초, 1080p, std, 오디오 생성 없음 |
| font.css | Google Fonts Noto Sans KR variable font. OFL 1.1, 라이선스 assets/OFL-NotoSansKR.txt. 한글·기본 라틴·문장부호를 WOFF2로 변환하고 data URI로 포함하여 opaque-origin font 요청을 방지 |
| gsap.min.js | 기존 프로젝트 의존성 GSAP 3.15.0의 배포 파일. 파일 상단의 저작권·라이선스 안내 유지. https://gsap.com/standard-license/ |
| 실내 분위기·종이 소리 | experience.js에서 Web Audio 노이즈·필터·엔벨로프로 실시간 합성. 외부 녹음 없음 |

폰트 원본: https://github.com/google/fonts/tree/main/ofl/notosanskr

요청 프롬프트와 실제 생성 조건은 assets/prompts.json, assets/generation.json에 보관한다. 브라우저 실행 중 Higgsfield·폰트 CDN·외부 서비스 요청은 없다.
