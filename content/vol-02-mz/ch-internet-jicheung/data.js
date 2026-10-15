// 인터넷 지층 — 작품에 나오는 글과 목록을 모두 여기서 고칩니다.
//
// JSON 파일이 아니라 JS인 이유: 작품은 sandbox iframe 안에서 돌아서
// fetch로 파일을 읽을 수 없습니다. <script src="data.js">로 불러오면
// 그런 제약 없이 이 객체를 그대로 쓸 수 있습니다.
//
// 바꾸는 법
// - 제목: title 한 줄. (사이트 카드에 뜨는 제목은 meta.yaml의 title이라 거기도 같이 바꿉니다)
// - 밈 추가: artifacts 배열에 한 줄을 더합니다. layer는 아래 layers의 id 중 하나.
// - 밈 빼기: 그 줄을 지웁니다. 층마다 개수가 달라도 됩니다.
// - 층 순서: layers 배열 순서가 곧 위에서 아래로 쌓인 순서입니다.

window.MZ_DATA = {
	title: '인터넷 지층',
	subtitle: '사라진 말들이 묻혀 있는 곳',
	intro: '깊이 팔수록 더 오래된 말이 나와요.',
	startLabel: '탭해서 발굴 시작',
	ending: '이 말들도 언젠가 누군가 파내겠죠.',
	// {year}는 올해 연도로 바뀝니다.
	endingSub: '{year}년의 말들이 새 지층이 되었어요.',
	tapHint: '탭해서 파기',
	// 흙더미를 빠르게 연달아 쳐서 깨면 뜨는 말
	comboText: '한 방에!',
	// 한 판에 한 번 나오는 금빛 흙더미 속 유물에 붙는 표시
	rareLabel: '희귀 유물',

	// 한 판의 규칙
	perLayer: 2, // 층마다 무작위로 뽑아 묻는 유물 수
	taps: 3, // 흙더미 하나를 깨는 데 드는 탭 수

	// 다 그린 그림의 이름을 적으면 그때부터 그 그림을 씁니다. 적지 않은 것은 임시 도형으로 그립니다.
	// 파일은 assets/<이름>.webp. 이름은 ASSETS.md의 목록을 따릅니다.
	// 예: sprites: ['frame-bubble', 'frame-crt', 'tool-pickaxe'],
	sprites: [
		'frame-bubble',
		'frame-smartphone',
		'frame-oldphone',
		'frame-pmp',
		'frame-crt',
		'tool-pickaxe',
		'junk-earbuds',
		'junk-tanghulu',
		'junk-spinner',
		'junk-selfiestick',
		'junk-earphones',
		'junk-battery',
		'junk-mp3',
		'junk-usb',
		'junk-cd',
		'junk-floppy',
	],

	// 유물 틀 그림마다 글자가 올라갈 화면 면의 자리. 그림 원본 픽셀 기준 [x, y, 너비, 높이].
	// 그림 크기는 제각각이어도 됩니다. 72×48 칸 안에 비율을 지켜 맞춰 넣습니다.
	frames: {
		bubble: { face: [7, 9, 68, 20] }, // 82×44
		smartphone: { face: [13, 7, 80, 31] }, // 106×45
		oldphone: { face: [13, 8, 70, 31] }, // 96×46
		pmp: { face: [17, 5, 58, 25] }, // 92×35
		crt: { face: [8, 10, 68, 41] }, // 84×72
	},

	// 위에서 아래로. name이 화면에 보이는 지층 이름입니다.
	// surface는 발굴하지 않고 엔딩에서 땅 위로 솟아올랐다가 흙에 덮이는 층입니다. (3개까지 보여요)
	// soil은 흙 색, frame은 그 층 유물을 담는 그릇 모양, junk는 그 층 굴 벽에 박혀 있는 잡동사니입니다.
	layers: [
		{ id: 'surface', name: '지금', soil: '#5fbf4a', frame: 'bubble', surface: true },
		{ id: '2020s', name: '2020년대 초', soil: '#e8b98a', frame: 'bubble', junk: ['earbuds', 'tanghulu'] },
		{ id: '2010s-late', name: '2010년대 후반', soil: '#c9925f', frame: 'smartphone', junk: ['spinner', 'selfiestick'] },
		{ id: '2010s-early', name: '2010년대 초', soil: '#a06a44', frame: 'oldphone', junk: ['earphones', 'battery'] },
		{ id: '2000s-late', name: '2000년대 후반', soil: '#74492f', frame: 'pmp', junk: ['mp3', 'usb'] },
		{ id: '2000s-early', name: '2000년대 초', soil: '#4a2e22', frame: 'crt', junk: ['cd', 'floppy'] },
	],

	// 유물 카드에 들어가는 말. year는 추정 연대로만 보여 줍니다.
	// frame을 적으면 그 유물만 층 기본 틀 대신 다른 틀을 씁니다.
	artifacts: [
		// 지금 — 엔딩에서 묻히는 말
		{ word: 'L을 가져가', layer: 'surface', year: 2026, meaning: '졌으면 변명 말고 인정하라는 말. L은 Lose.', example: '"아까 그건 렉 때문이고…" "L을 가져가"', extinction: '매장 진행 중' },
		{ word: '럭키비키', layer: 'surface', year: 2024, meaning: '안 좋은 일도 행운으로 뒤집어 보는 초긍정 사고.', example: '"비 와서 약속 취소됐네? 오히려 좋아, 완전 럭키비키잖아"', extinction: '매장 진행 중' },
		{ word: '너 T야?', layer: 'surface', year: 2023, meaning: '공감 대신 해결책부터 말하는 사람에게 던지는 말.', example: '"나 차 사고 났어" "보험 불렀어?" "너 T야?"', extinction: '매장 진행 중' },

		// 2020년대 초
		{ word: '어쩔티비', layer: '2020s', year: 2021, meaning: '"어쩌라고, 가서 TV나 봐"를 줄인 말. 상대 말을 받아치며 무시할 때.', example: '"숙제는 했어?" "어쩔티비~"', extinction: '저쩔냉장고, 안물티비까지 집안 가전을 다 써 버림' },
		{ word: '킹받네', layer: '2020s', year: 2020, meaning: '킹(king)과 열받네를 합친 말. 몹시 약 오른다.', example: '"답장이 \'ㅇ\' 한 글자네. 킹받네"', extinction: '모든 감정에 킹이 붙으면서 왕의 권위가 떨어짐' },
		{ word: '중꺾마', layer: '2020s', year: 2022, meaning: '"중요한 건 꺾이지 않는 마음"의 줄임말.', example: '"시험은 망했지만 중꺾마"', extinction: '광고 문구로 너무 많이 쓰여 결국 꺾임' },
		{ word: '머선129', layer: '2020s', year: 2020, meaning: '"무슨 일이고"를 사투리 발음과 숫자로 바꾼 말.', example: '"자고 일어났더니 단톡 300개, 머선129"', extinction: '129가 무슨 뜻인지 설명해야 하는 순간부터' },

		// 2010년대 후반
		{ word: '갑분싸', layer: '2010s-late', year: 2018, meaning: '"갑자기 분위기 싸해짐"의 줄임말.', example: '"회식에서 연봉 얘기 꺼내서 갑분싸"', extinction: '이 말을 꺼내는 순간 갑분싸' },
		{ word: '낄끼빠빠', layer: '2010s-late', year: 2016, meaning: '"낄 때 끼고 빠질 때 빠져라"의 줄임말.', example: '"둘이 얘기하는데 왜 와. 낄끼빠빠 몰라?"', extinction: '스스로 빠질 때를 알았음' },
		{ word: '존버', layer: '2010s-late', year: 2017, meaning: '끝까지 버틴다는 말. 비속어에서 나왔어요.', example: '"코인 -60%지만 존버"', extinction: '끝까지 버텼지만 결국 사라짐' },
		{ word: '댕댕이', layer: '2010s-late', year: 2017, meaning: '"멍멍이"를 글자 모양이 비슷한 "댕댕이"로 바꿔 쓴 야민정음.', example: '"우리 집 댕댕이 산책 가야 돼"', extinction: '멸종하지 않음. 일상어로 살아남은 희귀 생존종' },

		// 2010년대 초
		{ word: '핵노잼', layer: '2010s-early', year: 2013, meaning: '핵(核)처럼 강하게 재미없다는 말.', example: '"그 영화 어땠어?" "핵노잼"', extinction: '말 자체가 노잼이 됨' },
		{ word: '답정너', layer: '2010s-early', year: 2011, meaning: '"답은 정해져 있고 너는 대답만 해"의 줄임말.', example: '"나 살쪘지? 아니라고 해" 이런 게 답정너', extinction: '답이 정해져 있어서 더 할 말이 없었음' },
		{ word: '넘사벽', layer: '2010s-early', year: 2010, meaning: '"넘을 수 없는 사차원의 벽". 차이가 너무 커서 따라갈 수 없다.', example: '"걔 공부는 넘사벽이야"', extinction: '벽을 넘은 사람이 아무도 없어서 확인 불가' },
		{ word: '웃프다', layer: '2010s-early', year: 2012, meaning: '웃기면서 슬프다.', example: '"월급날인데 통장이 0원인 거 웃프다"', extinction: '너무 쓸모 있어서 일상어로 귀화' },

		// 2000년대 후반
		{ word: '지못미', layer: '2000s-late', year: 2007, meaning: '"지켜 주지 못해 미안해"의 줄임말.', example: '"그 사진 올린 거 지못미…"', extinction: '너무 많이 써서 닳음' },
		{ word: '엄친아', layer: '2000s-late', year: 2007, meaning: '"엄마 친구 아들". 뭐든 잘하는 비교 대상.', example: '"엄마 친구 아들은 이번에 1등 했대"', extinction: '엄마 친구 아들도 이제 취업 준비 중' },
		{ word: '뭥미', layer: '2000s-late', year: 2008, meaning: '"뭐임"을 자판 오타처럼 쓴 말. 황당할 때.', example: '"갑자기 휴강? 뭥미"', extinction: '자동 완성이 오타를 고쳐 버림' },
		{ word: '안습', layer: '2000s-late', year: 2006, meaning: '"안구에 습기 차다". 눈물 날 만큼 딱하다.', example: '"시험 전날 노트 잃어버림. 안습"', extinction: '인공눈물이 보급됨' },

		// 2000년대 초
		{ word: '아햏햏', layer: '2000s-early', year: 2001, meaning: '뜻을 정확히 설명할 수 없는 감탄사.', example: '"아햏햏…"', extinction: '아무도 정확한 뜻을 몰라서 전승 실패' },
		{ word: '즐', layer: '2000s-early', year: 2002, meaning: '"즐감", "즐겜"에서 나와 "꺼져"라는 뜻이 된 한 글자.', example: '"너랑 안 놀아. 즐~"', extinction: '한 글자라서 화석으로 남기도 어려웠음' },
		{ word: 'OTL', layer: '2000s-early', year: 2003, meaning: '무릎 꿇고 좌절한 사람 모양을 글자로 그린 것.', example: '"시험 끝… OTL"', extinction: '무릎 관절 보호를 위해 은퇴' },
		{ word: '퍼가요~♡', layer: '2000s-early', year: 2004, meaning: '미니홈피 사진이나 글을 가져갈 때 남기던 인사.', example: '"사진 너무 예뻐요 퍼가요~♡"', extinction: '미니홈피와 함께 매몰' },
	],

	// 유물 카드 아래 버튼. score로 내 지층을 계산합니다.
	answers: [
		{ id: 'used', label: '써 봤음', score: 2 },
		{ id: 'heard', label: '들어 봄', score: 1 },
		{ id: 'new', label: '처음 봄', score: 0 },
	],

	// 결과 카드. layer가 있는 유형은 그 층 점수가 가장 높을 때 나옵니다.
	// rule이 있는 유형은 층과 상관없이 먼저 판정합니다.
	results: [
		{ id: 'veteran', rule: 'all-high', name: '살아 있는 지층', line: '어느 지층에 묻혀도 이상하지 않은 사람' },
		{ id: 'newborn', rule: 'all-low', name: '아직 안 묻힌 사람', line: '다음 지층을 쌓을 사람' },
		{ id: 'fossil', layer: '2000s-early', name: '화석', line: '아햏햏을 실시간으로 본 사람' },
		{ id: 'old', layer: '2000s-late', name: '옛날 사람', line: '도토리로 BGM 사던 사람' },
		{ id: 'between', layer: '2010s-early', name: '애매한 사람', line: '요즘 사람이라기엔 애매하고, 옛날 사람이라기엔 억울한 사람' },
		{ id: 'still-now', layer: '2010s-late', name: '아직 요즘 사람', line: '요즘 말도 조금 지난 말도 다 아는 사람' },
		{ id: 'nowadays', layer: '2020s', name: '요즘 사람', line: '2000년대 유물은 전부 처음 보는 사람' },
	],
};
