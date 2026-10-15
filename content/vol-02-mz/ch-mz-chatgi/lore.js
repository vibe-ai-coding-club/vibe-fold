(() => {
  const ITEM_BLURBS = {
    shoe: '쿠션 있는 러닝화.',
    book: '표지가 있는 단행본.',
    malang: '말랑한 키링·피규어.',
    tumbler: '뚜껑 있는 개인 컵.',
    buds: '무선 이어폰 한 쌍.',
    cam: '렌즈가 달린 카메라.',
    soju: '녹색 유리병.',
    newspaper: '접힌 종이 신문.',
    tie: '매듭 있는 넥타이.'
  };

  const FACES = [
    {
      name: '러너 민지',
      line: '출근 전 러닝 한 km, 주말엔 크루 모임이 일정에 박혀 있다.',
      why: '러닝·크루가 요즘 MZ의 흔한 루틴이다.'
    },
    {
      name: '텍스트힙 수빈',
      line: '서점·독립출판·문장 스크린샷, 읽은 것도 취향이다.',
      why: '독서·에세이가 취향 콘텐츠가 된 세대다.'
    },
    {
      name: '말랑이 연',
      line: '가방·키링·책상 위 말랑이, 수집품이 기분을 대신 말해 준다.',
      why: '작은 수집품으로 기분을 드러내는 편이다.'
    },
    {
      name: '텀블러 준',
      line: '카페 가도 일회용컵은 안 쓰고, 색깔별 텀블러가 있다.',
      why: '개인 컵·카페 루틴이 기본처럼 통한다.'
    },
    {
      name: '플리 지우',
      line: '이어폰 끼고 걸으면 플레이리스트가 하루의 BGM이 된다.',
      why: '플리·팟캐스트가 하루의 배경음이다.'
    },
    {
      name: '릴스 하늘',
      line: '먹은 것·본 것·간 것, 짧은 영상으로 남기는 게 습관.',
      why: '짧은 영상으로 일상을 남기는 습관이다.'
    },
    {
      name: '직장인 서아',
      line: '슬랙 이모지·회고·워라밸, 일과 쉼 사이를 계산한다.',
      why: '출퇴근에도 편한 신발을 고르는 편이다.'
    },
    {
      name: '알뜰 현',
      line: '적금·포인트·멤버십, 작은 절약도 성취로 느낀다.',
      why: '자기계발·절약 콘텐츠도 책으로 본다.'
    },
    {
      name: '밈러 도윤',
      line: '밈·짤·신조어, 대화가 인터넷 속도로 돌아간다.',
      why: '밈·굿즈처럼 작은 장난감이 대화의 소재다.'
    },
    {
      name: '취향인 예린',
      line: '굿즈·팝업·한정판, 좋아하는 것에 돈과 시간을 쓴다.',
      why: '색깔·한정 디자인 텀블러를 모은다.'
    }
  ];

  const DEFAULT =
    '칸 위에 마우스를 올리면 소지품·MZ 아이콘과 한 줄 설명이 나옵니다.';

  function itemLine(itemId) {
    const label = window.MZItems.label(itemId);
    const blurb = ITEM_BLURBS[itemId] || '';
    return blurb ? `${label} — ${blurb}` : label;
  }

  function faceLine(faceIndex) {
    const f = FACES[faceIndex % FACES.length];
    return `${f.name} — ${f.line}`;
  }

  function mzLine(faceIndex) {
    const f = FACES[faceIndex % FACES.length];
    const itemId = window.MZItems.itemForFace(faceIndex);
    const itemLabel = window.MZItems.label(itemId);
    return `${f.name} — ${f.line}\n${itemLabel} — ${f.why}`;
  }

  function describeCell(cell) {
    if (cell.open) {
      if (cell.mine) return mzLine(cell.face);
      if (cell.wrong) return '표시 — 여기는 MZ가 아니었습니다.';
      if (cell.adj > 0) return `숫자 ${cell.adj} — 이 칸 주변에 MZ가 ${cell.adj}명 있습니다.`;
      return '빈 칸 — 주변에 MZ가 없습니다.';
    }
    if (cell.flag) return 'MZ 표시 — 이 칸에 MZ가 있다고 표시했습니다.';
    if (cell.drop) return itemLine(cell.drop.item);
    return '-';
  }

  /** @returns {{ kind: 'item', item: string } | { kind: 'face', face: number, item: string } | null} */
  function visualForCell(cell) {
    if (cell.open && cell.mine) {
      return { kind: 'face', face: cell.face, item: window.MZItems.itemForFace(cell.face) };
    }
    if (!cell.open && cell.drop) return { kind: 'item', item: cell.drop.item };
    return null;
  }

  window.MZLore = {
    DEFAULT,
    itemLine,
    faceLine,
    mzLine,
    describeCell,
    visualForCell
  };
})();
