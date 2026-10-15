# 소재 출처

| 소재 | 출처·조건 |
| --- | --- |
| 종이 인물·의자·테이블·문·시계·휴대폰·빛·섬유·잔상 | `motion-art.js`의 자체 Canvas 2D 벡터 드로잉. 한 모임방의 저녁에 맞는 작은 몸짓을 코드로 구성 |
| 산호색 종이·접힌 가장자리·걷는 움직임 | `experience.js`의 자체 Canvas 2D 드로잉과 GSAP 전환 |
| `thumb.svg` | 작품의 인물·산호색 종이를 재구성한 자체 벡터 썸네일 |
| 서사·평가·이유·마지막 문장 | 사용자 피드백을 바탕으로 Gemini와 구조를 논의한 뒤 `story.js`에 재작성. 지윤·서아·민호는 가상 인물 |
| assets/font.css | Noto Sans KR variable font. OFL 1.1, `assets/OFL-NotoSansKR.txt`. 한글·기본 라틴·문장부호 WOFF2를 data URI로 포함해 opaque-origin font 요청을 방지 |
| assets/gsap.min.js | 프로젝트 의존성 GSAP 3.15.0 배포 파일. 파일 상단의 저작권·라이선스 안내 유지. https://gsap.com/community/standard-license/ |
| 음악 `assets/audio/music-bed.mp3` | Higgsfield `sonilo_music`, 32초 생성. 따뜻한 펠트 피아노의 세 음 모티프·낮은 현·공기감, 약 68 BPM, 무타악기·무보컬·무효과음, 절제된 감정과 약한 중반 긴장, 반복 가능한 시작과 끝을 요청. 로컬 MP3로 변환, -25 LUFS 기준 정규화 |
| 한국어 대사 `assets/audio/*.mp3` | Higgsfield `inworld_text_to_speech`. 서아 `Yoona (ko)`, 지윤 `Minji (ko)`, 민호 `Seojun (ko)`. `story.js`에 보이는 따옴표 대사를 각각 한 파일로 생성했으며 파일명은 각 beat의 `voice` 또는 chapter의 `labelVoice`와 일치. 로컬 MP3로 변환, -19 LUFS 기준 정규화 |
| 실내 분위기·종이 소리 | Web Audio 노이즈·필터·엔벨로프로 합성. 외부 녹음 없음 |

폰트 원본: https://github.com/google/fonts/tree/main/ofl/notosanskr

음악·대사는 2026-10-14에 생성했다. 음악은 한 번 생성한 약 32초의 연주를 반복하고, 대사는 화면의 문장이 등장할 때 시작한다. 음성 합성은 내레이션 없이 등장인물의 말에만 사용한다. 완성본에는 생성 사진·영상이 없으며 실행 중 외부 서비스 요청이 없다. [Higgsfield 이용 약관](https://higgsfield.ai/terms-of-use-agreement)의 출력물 사용 조건을 확인했다.
