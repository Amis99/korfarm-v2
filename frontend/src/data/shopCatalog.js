export const SHOP_CATEGORIES = [
  { id: "all", label: "전체" },
  { id: "textbook", label: "교재" },
  { id: "tool", label: "교구" },
];

export const SHOP_SECTIONS = [
  {
    id: "textbook",
    title: "교재",
    description:
      "레벨별 교재로 수업 흐름을 표준화합니다.",
    meta: "레벨 맞춤",
    anchor: "textbook",
  },
  {
    id: "tool",
    title: "교구",
    description:
      "수업 참여도를 높이는 실습 교구를 준비했습니다.",
    meta: "수업 모입",
    anchor: "tool",
  },
];

export const SHOP_PRODUCTS = [
  {
    id: "book_saussure_bundle",
    name: "소쉬르 어휘 훈련 교재 세트",
    category: "textbook",
    level: "초1~3",
    price: 29000,
    badge: "인기",
    summary:
      "기초 어휘·문장 감각을 만드는 입문 세트",
    image:
      "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1200&auto=format&fit=crop",
    tags: ["어휘", "기초", "세트"],
    details: [
      "워크북 3권 + 지도서 1권",
      "주간 진도표 포함",
      "학급 운영용 체크리스트 제공",
    ],
  },
  {
    id: "book_frege_grammar",
    name: "프레게 문법 집중 교재",
    category: "textbook",
    level: "촄4~6",
    price: 24000,
    badge: "신규",
    summary:
      "문법 개념과 적용 문제를 단계별로 학습",
    image:
      "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=1200&auto=format&fit=crop",
    tags: ["문법", "초등", "단계"],
    details: [
      "개념 요약 + 대표 유형 150문항",
      "수업용 PPT 템플릿 제공",
      "학습 체크 스티커 포함",
    ],
  },
  {
    id: "book_russell_reading",
    name: "러셀 독해 전략 워크북",
    category: "textbook",
    level: "중1~3",
    price: 27000,
    badge: "추천",
    summary:
      "지문 구조 분석과 추론 학습 강화",
    image:
      "https://images.unsplash.com/photo-1513258496099-48168024aec0?q=80&w=1200&auto=format&fit=crop",
    tags: ["독해", "추론", "중등"],
    details: [
      "전략 카드 12종 포함",
      "주간 테스트지 제공",
      "교사용 해설서 제공",
    ],
  },
  {
    id: "book_wittgenstein_mock",
    name: "비트겐슈타인 실전 모의고사",
    category: "textbook",
    level: "고1~3",
    price: 32000,
    badge: "실전",
    summary:
      "수능형 문항으로 실전 감각을 강화",
    image:
      "https://images.unsplash.com/photo-1501504905252-473c47e087f8?q=80&w=1200&auto=format&fit=crop",
    tags: ["모의고사", "수능", "고등"],
    details: [
      "모의고사 5회분",
      "OMR 샘플 포함",
      "오답 노트 템플릿 제공",
    ],
  },
  {
    id: "tool_reading_board",
    name: "독해 전략 보드 게임",
    category: "tool",
    level: "촃3~중1",
    price: 18000,
    badge: "교구",
    summary:
      "지문 분석을 놀이형 활동으로 확장",
    image:
      "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=1200&auto=format&fit=crop",
    tags: ["게임", "활동", "수업"],
    details: [
      "전략 카드 48장 구성",
      "소그룹 활동 가이드 포함",
      "교실 보관 박스 제공",
    ],
  },
  {
    id: "tool_omr_kit",
    name: "OMR 답안 입력 키트",
    category: "tool",
    level: "전 학년",
    price: 15000,
    badge: "필수",
    summary:
      "종이 시험 후 답안 입력을 간편하게",
    image:
      "https://images.unsplash.com/photo-1519452575417-564c1401ecc0?q=80&w=1200&auto=format&fit=crop",
    tags: ["OMR", "평가", "관리"],
    details: [
      "답안지 샘플 30매 포함",
      "학급별 관리 스티커",
      "채점용 체크 시트 제공",
    ],
  },
];
