/* ── 랜딩/서브페이지 공유 데이터 ── */

export const COMPETENCIES = [
  { icon: "spellcheck", name: "어휘력", desc: "단어의 뜻과 쓰임을 정확히 이해하고 활용하는 능력" },
  { icon: "article", name: "문장 독해력", desc: "문장 단위의 의미를 정확히 파악하고 해석하는 능력" },
  { icon: "account_tree", name: "구조 독해력", desc: "글 전체의 구조와 논리적 흐름을 파악하는 능력" },
  { icon: "psychology", name: "논리 사고력", desc: "근거와 주장의 관계를 분석하고 추론하는 능력" },
  { icon: "edit_note", name: "어법·문법 능력", desc: "국어 어법과 문법 규칙을 이해하고 적용하는 능력" },
  { icon: "lightbulb", name: "국어 개념 적용 능력", desc: "학습한 국어 개념을 실제 문제에 적용하는 능력" },
  { icon: "history_edu", name: "국어 관련 배경지식", desc: "문학사, 국어학 등 국어 관련 배경지식 활용 능력" },
  { icon: "science", name: "비문학 배경지식", desc: "인문·사회·과학·기술·예술 등 다양한 분야의 지식 활용 능력" },
  { icon: "target", name: "문제 분석 및 전략 수립 능력", desc: "문제의 요구 사항을 정확히 파악하고 풀이 전략을 세우는 능력" },
  { icon: "fact_check", name: "선택지 분석 및 전략 수립 능력", desc: "선택지의 적절성을 판단하고 정답을 도출하는 능력" },
];

export const FAQ_ITEMS = [
  {
    q: "어떤 학년에 적합한가요?",
    a: "초등 1학년부터 고등 3학년까지 총 12레벨로 구성되어 있습니다. 진단 테스트를 통해 학년과 무관하게 실력에 맞는 레벨에 배정됩니다.",
  },
  {
    q: "12레벨은 어떻게 구성되나요?",
    a: "4개 서버(소쉬르·프레게·러셀·비트겐슈타인) × 3단계로 총 12레벨입니다. 소쉬르 1~3, 프레게 1~3, 러셀 1~3, 비트겐슈타인 1~3 순서로 난이도가 올라가며, 진단 테스트 결과에 따라 학년과 무관하게 적합한 레벨에 배정됩니다.",
  },
  {
    q: "무료로 어디까지 이용할 수 있나요?",
    a: "Basic 플랜에서는 매일 제공되는 '오늘의 퀴즈'와 '오늘의 독해', 기본 랭킹 참여, 커뮤니티 이용, 그리고 진단 테스트 1회를 무료로 이용할 수 있습니다.",
  },
  {
    q: "어떤 기능이 있나요?",
    a: "오늘의 퀴즈·독해, 프로 모드(180+ 챕터), 농장별 모드(9개 영역), AI 자동 채점, 통합 성적표, 씨앗 보상 시스템, 시즌 랭킹, 1:1 대결, 기관 관리 대시보드 등을 제공합니다.",
  },
  {
    q: "학원이나 학교에서 단체로 사용할 수 있나요?",
    a: "네, Academy 플랜은 기관 전용으로 설계되었습니다. 반 관리, 과제 일괄 배포, 학부모 리포트 연동 등 기관 운영에 최적화된 기능을 제공합니다. 별도 상담을 통해 맞춤 견적을 안내드립니다.",
  },
  {
    q: "결제와 환불은 어떻게 되나요?",
    a: "Pro 플랜은 월 단위 자동 결제이며, 3개월(10% 할인)과 12개월(30% 할인) 장기 결제도 가능합니다. 결제일로부터 7일 이내 환불이 가능하며, 이후에는 잔여 기간에 대한 부분 환불이 적용됩니다.",
  },
  {
    q: "씨앗과 수확물은 무엇인가요?",
    a: "씨앗은 학습 활동을 완료할 때마다 획득하는 보상 포인트입니다. 모은 씨앗으로 다양한 수확물(아이템)을 교환할 수 있고, 수확물 점수가 시즌 랭킹에 반영됩니다. 1:1 대결에서 씨앗을 걸고 승부할 수도 있습니다.",
  },
  {
    q: "학부모도 사용할 수 있나요?",
    a: "네, 학부모 계정을 통해 자녀의 학습 현황과 성적 리포트를 확인할 수 있습니다. 기관에서 제공하는 학부모 연동 기능을 통해 실시간으로 학습 진행 상황을 공유받을 수 있습니다.",
  },
];

export const PLANS = [
  {
    tag: "무료",
    title: "Basic",
    price: "0",
    subtitle: "월",
    perks: [
      "오늘의 퀴즈",
      "오늘의 독해",
      "대결 모드",
      "기본 랭킹 참여",
      "커뮤니티 이용",
      "진단 테스트 1회 (10대 역량 진단)",
    ],
    cta: "시작하기",
    linkTo: "/login",
  },
  {
    tag: "인기",
    title: "Pro",
    price: "65,000",
    subtitle: "월",
    perks: [
      "Basic 전체 포함",
      "프로 모드 전체",
      "농장 모드 전체",
      "AI 자동 채점",
      "과제 시스템",
      "테스트 창고",
      "통합 성적표",
      "수확물 보상 확대",
    ],
    cta: "구독하기",
    linkTo: "/subscription",
    featured: true,
    discount: "3개월 10% | 12개월 30% 할인",
  },
  {
    tag: "기관",
    title: "Academy",
    price: "별도 문의",
    subtitle: "",
    perks: [
      "Pro 전체 포함",
      "기관 관리 대시보드",
      "반 관리 시스템",
      "과제 일괄 배포",
      "학부모 연동 리포트",
    ],
    cta: "상담 문의",
    linkTo: "#contact",
    isAcademy: true,
  },
];

export const LEARNING_MODES = [
  { icon: "quiz", title: "일일 퀴즈", desc: "매일 새로운 퀴즈로 국어 감각을 유지합니다.", img: "card-daily-quiz.jpg" },
  { icon: "auto_stories", title: "일일 독해", desc: "매일 지문을 읽고 독해력을 강화합니다.", img: "card-daily-reading.jpg" },
  { icon: "swords", title: "대결 모드", desc: "씨앗을 걸고 1:1 실시간 퀴즈 대결에 도전합니다.", img: "card-duel.jpg" },
  { icon: "park", title: "농장별 모드", desc: "9개 영역 전문 농장에서 약점을 집중 보강합니다.", img: "card-farm-mode.jpg" },
  { icon: "edit_note", title: "지식과 지혜", desc: "글쓰기 게시판에서 표현력을 키웁니다.", img: "card-wisdom.jpg" },
  { icon: "menu_book", title: "프로 모드", desc: "180+ 챕터, 6단계 모듈로 체계적 학습을 진행합니다.", img: "card-pro-mode.jpg" },
];

export const TIER_INFO = [
  { name: "소쉬르", levels: "1~3", target: "초등 1~3학년", color: "#4caf50", icon: "eco", img: "card-tier-saussure.jpg" },
  { name: "프레게", levels: "1~3", target: "초등 4~6학년", color: "#2196f3", icon: "science", img: "card-tier-frege.jpg" },
  { name: "러셀", levels: "1~3", target: "중등 1~3학년", color: "#9c27b0", icon: "psychology", img: "card-tier-russell.jpg" },
  { name: "비트겐슈타인", levels: "1~3", target: "고등 1~3학년", color: "#f44336", icon: "school", img: "card-tier-wittgenstein.jpg" },
];
