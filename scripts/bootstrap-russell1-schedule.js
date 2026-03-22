const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const DOCS_DIR = path.join(ROOT, "docs");
const DAILY_ROOT = path.join(ROOT, "frontend", "public", "daily-reading");

const CATEGORY_LABELS = {
  NONFICTION: "비문학",
  LITERATURE: "문학",
  SPEECH: "화법",
  WRITING: "작문",
  GRAMMAR: "문법",
};

const CYCLE = [
  "NONFICTION",
  "LITERATURE",
  "NONFICTION",
  "SPEECH",
  "WRITING",
  "NONFICTION",
  "GRAMMAR",
];

const RUSSELL_NONFICTION_DOMAINS = [
  "서양철학",
  "동양철학",
  "역사",
  "논리학",
  "법학",
  "경제학",
  "물리학",
  "화학",
  "생명과학",
  "지구과학",
  "기계공학",
  "전기공학",
  "의약학",
  "데이터알고리즘",
  "인공지능",
];

const RUSSELL_NONFICTION_FOCUSES = {
  russell1: [
    "핵심 개념",
    "일상 사례",
    "비교 읽기",
    "원인과 결과",
    "문제와 해결",
    "사례 분석",
    "자료 해석",
    "적용 판단",
    "쟁점 정리",
    "설명 방식",
    "종합 읽기",
  ],
  russell2: [
    "핵심 개념",
    "개념 비교",
    "적용 사례",
    "원리와 예외",
    "자료 분석",
    "조건 판단",
    "논증 구조",
    "반례 검토",
    "관점 비교",
    "쟁점 분석",
    "종합 판단",
  ],
  russell3: [
    "핵심 개념",
    "개념 구분",
    "적용 추론",
    "자료 해석",
    "논증 평가",
    "반론 검토",
    "관점 대조",
    "조건 분석",
    "쟁점 통합",
    "비판적 판단",
    "종합 추론",
  ],
};

const WITT_NONFICTION_DOMAINS = [
  "인문",
  "철학",
  "사회",
  "경제",
  "법",
  "과학",
  "기술",
  "예술",
  "언어",
  "심리",
  "환경",
];

const WITT_NONFICTION_FOCUSES = {
  wittgenstein1: [
    "핵심 논지",
    "개념 비교",
    "자료 해석",
    "원리 적용",
    "관점 차이",
    "보기 적용",
    "추론",
    "반론 검토",
    "구조 분석",
    "종합 판단",
    "수특 연계",
  ],
  wittgenstein2: [
    "핵심 논지",
    "개념 구분",
    "자료 분석",
    "원리 적용",
    "관점 비교",
    "보기 활용",
    "추론",
    "반박 검토",
    "구조 해석",
    "비판 판단",
    "수특 연계",
  ],
  wittgenstein3: [
    "핵심 논지",
    "개념 정교화",
    "자료 분석",
    "원리 적용",
    "관점 충돌",
    "보기 통합",
    "고난도 추론",
    "반박 평가",
    "구조 해석",
    "비판 판단",
    "수특 연계",
  ],
};

const RUSSELL_SPEECH_BASE = [
  "대화의 목적 파악",
  "대화의 맥락 추론",
  "공감하며 듣기",
  "질문과 답변의 의도",
  "발표의 핵심 내용",
  "발표의 도입과 마무리",
  "자료를 활용한 말하기",
  "청중을 고려한 표현",
  "토의 규칙과 역할",
  "협력적 의사소통",
  "인터뷰와 발표",
  "안내와 요청",
  "설득 전략",
];

const RUSSELL_WRITING_BASE = [
  "글의 목적 정하기",
  "중심 문장 세우기",
  "근거 배열하기",
  "문단 나누기",
  "개요 짜기",
  "설명문 조직",
  "주장문 조직",
  "서론·본론·결론",
  "자료 사용하기",
  "고쳐쓰기",
  "문장 덧붙이기",
  "제목 붙이기",
  "요약문 쓰기",
];

const RUSSELL_GRAMMAR_BASE = [
  "품사 구별",
  "체언과 수식언",
  "용언의 활용",
  "문장 성분",
  "주어와 서술어의 호응",
  "높임 표현",
  "시간 표현과 시제",
  "피동과 사동",
  "부정 표현",
  "직접 인용과 간접 인용",
  "문장 부호",
  "맞춤법과 표준어",
  "문장 호응",
];

const RUSSELL_SLOT_FOCUSES = {
  russell1: ["기초", "적용", "비교", "종합"],
  russell2: ["기본", "확장", "적용", "통합"],
  russell3: ["심화", "비교", "적용", "종합"],
};

const WITT_SPEECH_BASE = [
  "발표자의 의도 파악",
  "청자의 반응 추론",
  "질문의 기능 분석",
  "토의 규칙과 역할",
  "설득 전략 분석",
  "발표 자료 해석",
  "인터뷰의 핵심 정보",
  "건의와 협상의 전략",
  "토론 반박의 타당성",
  "공감적 듣기와 재구성",
  "발표 구성의 효과",
  "말하기 태도 판단",
  "상황 맥락 추론",
];

const WITT_WRITING_BASE = [
  "개요의 적절성",
  "자료 통합 구성",
  "주장과 근거 배열",
  "정보 통합 글쓰기",
  "고쳐쓰기 전략",
  "문단 재배열",
  "개념 정의 방식",
  "비교·대조 글쓰기",
  "반박문 쓰기",
  "보고서 구성",
  "논설문 전개",
  "소개문 조정",
  "제목 설계",
];

const WITT_GRAMMAR_BASE = [
  "음운 변동",
  "형태소와 품사",
  "문장 성분",
  "피동과 사동",
  "높임과 시간 표현",
  "중세국어",
  "훈민정음 원리",
  "표준 발음",
  "의미 관계",
  "담화와 지시 표현",
  "호응과 중의성",
  "어문 규범",
  "문법 개념 적용",
];

const WITT_SLOT_FOCUSES = {
  wittgenstein1: ["기초", "적용", "비교", "종합"],
  wittgenstein2: ["유형", "적용", "심화", "종합"],
  wittgenstein3: ["유형", "실전", "심화", "종합"],
};

const RUSSELL_1_LITERATURE_WORKS = [
  "소나기(1)",
  "소나기(2)",
  "동백꽃(1)",
  "동백꽃(2)",
  "봄봄(1)",
  "봄봄(2)",
  "자전거 도둑(1)",
  "자전거 도둑(2)",
  "멍키스패너(1)",
  "멍키스패너(2)",
  "복 타러 간 총각(1)",
  "복 타러 간 총각(2)",
  "홍길동전(1)",
  "홍길동전(2)",
  "허생전(1)",
  "허생전(2)",
  "양반전(1)",
  "양반전(2)",
  "흥부전(1)",
  "흥부전(2)",
  "심청전(1)",
  "심청전(2)",
  "춘향전(1)",
  "춘향전(2)",
  "토끼전(1)",
  "토끼전(2)",
  "박씨전(1)",
  "박씨전(2)",
  "장끼전(1)",
  "장끼전(2)",
  "간",
  "하단에서",
  "고향으로 간다",
  "초토의 시 1",
  "엄마 걱정",
  "서시",
  "진달래꽃",
  "산유화",
  "꽃",
  "청포도",
  "낙화",
  "향수",
  "풀",
  "별",
  "국화 옆에서",
  "자화상",
  "담쟁이",
  "봄은 고양이로다",
  "성에꽃",
  "개여울",
  "새로운 길",
  "해에게서 소년에게",
];

const RUSSELL_2_LITERATURE_WORKS = [
  "진달래꽃",
  "서시",
  "별 헤는 밤",
  "향수",
  "돌담에 속삭이는 햇발",
  "나그네",
  "광야",
  "님의 침묵",
  "풀",
  "해",
  "빼앗긴 들에도 봄은 오는가",
  "여우난골족",
  "국화 옆에서",
  "승무",
  "풀꽃",
  "꽃",
  "농무",
  "수선화에게",
  "흔들리며 피는 꽃",
  "연탄 한 장",
  "소나기(1)",
  "소나기(2)",
  "사랑손님과 어머니(1)",
  "사랑손님과 어머니(2)",
  "운수 좋은 날(1)",
  "운수 좋은 날(2)",
  "봄봄(1)",
  "봄봄(2)",
  "달밤(1)",
  "달밤(2)",
  "화수분(1)",
  "화수분(2)",
  "수난이대(1)",
  "수난이대(2)",
  "요람기(1)",
  "요람기(2)",
  "관촌수필(1)",
  "관촌수필(2)",
  "나무(1)",
  "나무(2)",
  "무소유(1)",
  "무소유(2)",
  "인연(1)",
  "인연(2)",
  "아이들에게(1)",
  "아이들에게(2)",
  "방망이 깎던 노인(1)",
  "방망이 깎던 노인(2)",
  "도산십이곡",
  "오우가",
  "관동별곡",
  "규원가",
];

const RUSSELL_3_LITERATURE_WORKS = [
  "사미인곡",
  "청산별곡",
  "정읍사",
  "제망매가",
  "가시리",
  "정과정",
  "고산구곡가",
  "어부사시사",
  "단심가",
  "하여가",
  "황진이 시조(1)",
  "황진이 시조(2)",
  "춘향전(1)",
  "춘향전(2)",
  "심청전(1)",
  "심청전(2)",
  "흥부전(1)",
  "흥부전(2)",
  "홍길동전(1)",
  "홍길동전(2)",
  "구운몽(1)",
  "구운몽(2)",
  "사씨남정기(1)",
  "사씨남정기(2)",
  "토끼전(1)",
  "토끼전(2)",
  "장끼전(1)",
  "장끼전(2)",
  "허생전(1)",
  "허생전(2)",
  "양반전(1)",
  "양반전(2)",
  "단군 신화",
  "주몽 신화",
  "바리데기(1)",
  "바리데기(2)",
  "견우직녀",
  "선녀와 나무꾼",
  "콩쥐팥쥐전(1)",
  "콩쥐팥쥐전(2)",
  "온달전(1)",
  "온달전(2)",
  "임경업전(1)",
  "임경업전(2)",
  "박씨전(1)",
  "박씨전(2)",
  "운영전(1)",
  "운영전(2)",
  "기황전설",
  "김원전",
  "김진옥전",
  "낙성비룡",
];

const WITT_LITERATURE_WORKS = [
  "기출 문학 - 213호 주택",
  "기출 문학 - 문",
  "기출 문학 - 간",
  "기출 문학 - 갈까 보다",
  "기출 문학 - 그리움",
  "기출 문학 - 기황전설",
  "기출 문학 - 길",
  "기출 문학 - 길을 찾아서 4 - 명암리 길",
  "기출 문학 - 김원전",
  "기출 문학 - 김진옥전",
  "기출 문학 - 꽃피는 시절",
  "기출 문학 - 나무처럼 젊은이들도",
  "기출 문학 - 낙성비룡",
  "기출 문학 - 낙엽송",
  "기출 문학 - 낙은별곡",
  "기출 문학 - 낙천동운",
  "기출 문학 - 낙타",
  "기출 문학 - 낙토의 아이들",
  "기출 문학 - 날개 또는 수갑(1)",
  "기출 문학 - 날개 또는 수갑(2)",
  "기출 문학 - 난쟁이가 쏘아 올린 작은 공",
  "기출 문학 - 남신의주 유동 박시봉방",
  "기출 문학 - 낯익은 세상",
  "기출 문학 - 너에게 묻는다",
  "기출 문학 - 논 이야기",
  "기출 문학 - 농무",
  "기출 문학 - 누항사",
  "기출 문학 - 눈",
  "기출 문학 - 눈길",
  "기출 문학 - 능소화",
  "기출 문학 - 님의 침묵",
  "기출 문학 - 독은 아름답다",
  "기출 문학 - 둑방길",
  "기출 문학 - 등신불",
  "기출 문학 - 메밀꽃 필 무렵",
  "기출 문학 - 미스터 방",
  "기출 문학 - 바람이 불어",
  "기출 문학 - 봄봄",
  "기출 문학 - 사미인곡",
  "기출 문학 - 성북동 비둘기",
  "기출 문학 - 소나기",
  "기출 문학 - 수난이대",
  "기출 문학 - 시집가는 날",
  "기출 문학 - 운수 좋은 날",
  "기출 문학 - 월선헌 십육경가",
  "기출 문학 - 유리창",
  "기출 문학 - 자전거 도둑",
  "기출 문학 - 적벽가",
  "기출 문학 - 절정",
  "기출 문학 - 정과정",
  "기출 문학 - 진달래꽃",
  "기출 문학 - 하단에서",
];

const LEVELS = [
  {
    key: "russell1",
    dir: "russell1",
    displayName: "러셀 1",
    targetLevel: "RUSSELL_1",
    contentPrefix: "dr-r1",
    gradeRange: { min: 7, max: 8 },
    timeLimitSec: 480,
    targetLength: "1100±50자",
    scheduleMd: "russell1_schedule_365.md",
    scheduleJson: "russell1_schedule_365.json",
    literatureWorks: RUSSELL_1_LITERATURE_WORKS,
    type: "russell",
    levelIndex: 1,
  },
  {
    key: "russell2",
    dir: "russell2",
    displayName: "러셀 2",
    targetLevel: "RUSSELL_2",
    contentPrefix: "dr-r2",
    gradeRange: { min: 8, max: 9 },
    timeLimitSec: 480,
    targetLength: "1200±50자",
    scheduleMd: "russell2_schedule_365.md",
    scheduleJson: "russell2_schedule_365.json",
    literatureWorks: RUSSELL_2_LITERATURE_WORKS,
    type: "russell",
    levelIndex: 2,
  },
  {
    key: "russell3",
    dir: "russell3",
    displayName: "러셀 3",
    targetLevel: "RUSSELL_3",
    contentPrefix: "dr-r3",
    gradeRange: { min: 9, max: 10 },
    timeLimitSec: 480,
    targetLength: "1300±50자",
    scheduleMd: "russell3_schedule_365.md",
    scheduleJson: "russell3_schedule_365.json",
    literatureWorks: RUSSELL_3_LITERATURE_WORKS,
    type: "russell",
    levelIndex: 3,
  },
  {
    key: "wittgenstein1",
    dir: "wittgenstein1",
    displayName: "비트겐슈타인 1",
    targetLevel: "WITTGENSTEIN_1",
    contentPrefix: "dr-w1",
    gradeRange: { min: 9, max: 10 },
    timeLimitSec: 480,
    targetLength: "1400±50자",
    scheduleMd: "wittgenstein1_schedule_365.md",
    scheduleJson: "wittgenstein1_schedule_365.json",
    literatureWorks: WITT_LITERATURE_WORKS,
    type: "witt",
    levelIndex: 1,
  },
  {
    key: "wittgenstein2",
    dir: "wittgenstein2",
    displayName: "비트겐슈타인 2",
    targetLevel: "WITTGENSTEIN_2",
    contentPrefix: "dr-w2",
    gradeRange: { min: 10, max: 11 },
    timeLimitSec: 480,
    targetLength: "1500±50자",
    scheduleMd: "wittgenstein2_schedule_365.md",
    scheduleJson: "wittgenstein2_schedule_365.json",
    literatureWorks: WITT_LITERATURE_WORKS,
    type: "witt",
    levelIndex: 2,
  },
  {
    key: "wittgenstein3",
    dir: "wittgenstein3",
    displayName: "비트겐슈타인 3",
    targetLevel: "WITTGENSTEIN_3",
    contentPrefix: "dr-w3",
    gradeRange: { min: 11, max: 12 },
    timeLimitSec: 480,
    targetLength: "1600±50자",
    scheduleMd: "wittgenstein3_schedule_365.md",
    scheduleJson: "wittgenstein3_schedule_365.json",
    literatureWorks: WITT_LITERATURE_WORKS,
    type: "witt",
    levelIndex: 3,
  },
];

function pad3(n) {
  return String(n).padStart(3, "0");
}

function getSubArea(day) {
  return CYCLE[(day - 1) % CYCLE.length];
}

function getFocus(list, slotIndex, period) {
  return list[Math.floor(slotIndex / period) % list.length];
}

function buildRussellTopic(level, subArea, slotIndex) {
  if (subArea === "LITERATURE") {
    return level.literatureWorks[slotIndex];
  }

  if (subArea === "NONFICTION") {
    const domain = RUSSELL_NONFICTION_DOMAINS[slotIndex % RUSSELL_NONFICTION_DOMAINS.length];
    const focus = getFocus(
      RUSSELL_NONFICTION_FOCUSES[level.key],
      slotIndex,
      RUSSELL_NONFICTION_DOMAINS.length
    );
    return `${domain} 개념 읽기 - ${focus}`;
  }

  const slotFocus = getFocus(RUSSELL_SLOT_FOCUSES[level.key], slotIndex, 13);
  if (subArea === "SPEECH") {
    const base = RUSSELL_SPEECH_BASE[slotIndex % RUSSELL_SPEECH_BASE.length];
    return `${base} (${slotFocus})`;
  }
  if (subArea === "WRITING") {
    const base = RUSSELL_WRITING_BASE[slotIndex % RUSSELL_WRITING_BASE.length];
    return `${base} (${slotFocus})`;
  }
  const base = RUSSELL_GRAMMAR_BASE[slotIndex % RUSSELL_GRAMMAR_BASE.length];
  return `${base} (${slotFocus})`;
}

function buildWittTopic(level, subArea, slotIndex) {
  if (subArea === "LITERATURE") {
    return level.literatureWorks[slotIndex];
  }

  if (subArea === "NONFICTION") {
    const domain = WITT_NONFICTION_DOMAINS[slotIndex % WITT_NONFICTION_DOMAINS.length];
    const focus = getFocus(
      WITT_NONFICTION_FOCUSES[level.key],
      slotIndex,
      WITT_NONFICTION_DOMAINS.length
    );
    return `기출 비문학 - ${domain} ${focus}`;
  }

  const slotFocus = getFocus(WITT_SLOT_FOCUSES[level.key], slotIndex, 13);
  if (subArea === "SPEECH") {
    const base = WITT_SPEECH_BASE[slotIndex % WITT_SPEECH_BASE.length];
    return `${base} (${slotFocus})`;
  }
  if (subArea === "WRITING") {
    const base = WITT_WRITING_BASE[slotIndex % WITT_WRITING_BASE.length];
    return `${base} (${slotFocus})`;
  }
  const base = WITT_GRAMMAR_BASE[slotIndex % WITT_GRAMMAR_BASE.length];
  return `${base} (${slotFocus})`;
}

function getSourceNote(level, subArea) {
  if (level.type === "russell") {
    if (subArea === "LITERATURE") {
      if (level.key === "russell1") {
        return "Google Drive 중등 폴더 원문 우선, 없으면 웹 검색";
      }
      return "Google Drive 문학 작품 워크북/교과서 작품 우선, 없으면 웹 검색";
    }
    if (subArea === "NONFICTION") {
      return `${level.displayName} 분야별 개념 읽기 수동 작성`;
    }
    if (subArea === "SPEECH") {
      return `${level.displayName} 화법 상황 지문 수동 작성`;
    }
    if (subArea === "WRITING") {
      return `${level.displayName} 작문 과정 지문 수동 작성`;
    }
    return `${level.displayName} 문법 설명 지문 수동 작성`;
  }

  if (subArea === "LITERATURE") {
    return "기출/수특 문학 지문과 작품 원문 대조 후 수동 작성";
  }
  if (subArea === "NONFICTION") {
    return "기출 비문학 지문/수특 연계 지문을 참고해 수동 작성";
  }
  if (subArea === "SPEECH") {
    return `${level.displayName} 화법 유형 지문 수동 작성`;
  }
  if (subArea === "WRITING") {
    return `${level.displayName} 작문 유형 지문 수동 작성`;
  }
  return `${level.displayName} 문법 유형 지문 수동 작성`;
}

function createEntry(level, day, slotCounters) {
  const subArea = getSubArea(day);
  const slotIndex = slotCounters[subArea]++;
  const plannedTopic =
    level.type === "russell"
      ? buildRussellTopic(level, subArea, slotIndex)
      : buildWittTopic(level, subArea, slotIndex);
  const categoryLabel = CATEGORY_LABELS[subArea];
  return {
    day,
    file: `${pad3(day)}.json`,
    subArea,
    categoryLabel,
    plannedTopic,
    title: `일일 독해(${level.displayName}) Day ${day} ${categoryLabel} - ${plannedTopic}`,
    source: getSourceNote(level, subArea),
  };
}

function createSkeleton(level, entry) {
  return {
    contentId: `${level.contentPrefix}-${pad3(entry.day)}`,
    contentType: "DAILY_READING",
    version: 1,
    status: "PUBLISHED",
    title: entry.title,
    description: "일일 독해 - 정독·복기·확인",
    targetLevel: level.targetLevel,
    schoolGradeRange: {
      min: level.gradeRange.min,
      max: level.gradeRange.max,
    },
    area: "READING",
    subArea: entry.subArea,
    competencies: ["READING"],
    tags: ["daily"],
    access: {
      mode: "FREE",
    },
    seedReward: {
      seedType: "WHEAT",
      count: 3,
      multiplier: 1,
    },
    timeLimitSec: level.timeLimitSec,
    assets: {},
    payload: {
      passage: {
        format: "TEXT",
        paragraphs: [],
      },
      intensive: {
        timeline: [],
      },
      recall: {
        cards: [],
        correctOrder: [],
        seedPenalty: 1,
      },
      confirm: {
        questions: [],
      },
    },
  };
}

function createSchedule(level) {
  if (level.literatureWorks.length !== 52) {
    throw new Error(`${level.key} literature slot count must be 52, got ${level.literatureWorks.length}`);
  }

  const slotCounters = {
    NONFICTION: 0,
    LITERATURE: 0,
    SPEECH: 0,
    WRITING: 0,
    GRAMMAR: 0,
  };

  const entries = [];
  for (let day = 1; day <= 365; day += 1) {
    entries.push(createEntry(level, day, slotCounters));
  }
  return entries;
}

function writeScheduleFiles(level, entries) {
  const mdPath = path.join(DOCS_DIR, level.scheduleMd);
  const jsonPath = path.join(DOCS_DIR, level.scheduleJson);
  const litSourceLine =
    level.type === "russell"
      ? "- 문학은 Google Drive 작품 원문 우선, 없으면 웹 검색으로 원문 확보"
      : "- 문학과 비문학은 기출/수특 지문을 포함해 수동 작성";
  const nonficSourceLine =
    level.type === "russell"
      ? "- 비문학은 분야별 개념 읽기 축, 화법·작문·문법은 레벨별 수동 구성"
      : "- 화법·작문·문법도 같은 7일 순환 안에서 고교형 유형 지문으로 수동 구성";

  const lines = [
    `# ${level.displayName} 365일 배치표`,
    "",
    "## 요약",
    "",
    "- 7일 순환: `비문학 → 문학 → 비문학 → 화법 → 작문 → 비문학 → 문법`",
    "- 총계: 비문학 157, 문학 52, 화법 52, 작문 52, 문법 52",
    `- 목표 길이: ${level.targetLength}`,
    litSourceLine,
    nonficSourceLine,
    "- 이 표는 구조 통일과 지문 수동 투입의 기준표로 사용",
    "",
    "## 일자별 상세표",
    "",
    "| Day | 분류 | 배치 제목 | 소스 메모 |",
    "|---:|---|---|---|",
  ];

  for (const entry of entries) {
    lines.push(`| ${entry.day} | ${entry.categoryLabel} | ${entry.plannedTopic} | ${entry.source} |`);
  }

  fs.writeFileSync(mdPath, `${lines.join("\n")}\n`, "utf8");
  fs.writeFileSync(jsonPath, JSON.stringify(entries, null, 2), "utf8");
}

function normalizeFiles(level, entries) {
  const dir = path.join(DAILY_ROOT, level.dir);
  let changedCount = 0;
  for (const entry of entries) {
    const filePath = path.join(dir, entry.file);
    fs.writeFileSync(`${filePath}`, `${JSON.stringify(createSkeleton(level, entry), null, 2)}\n`, "utf8");
    changedCount += 1;
  }
  return changedCount;
}

function main() {
  fs.mkdirSync(DOCS_DIR, { recursive: true });
  const summary = [];
  for (const level of LEVELS) {
    const entries = createSchedule(level);
    writeScheduleFiles(level, entries);
    const normalized = normalizeFiles(level, entries);
    summary.push({
      level: level.key,
      scheduleMd: level.scheduleMd,
      scheduleJson: level.scheduleJson,
      normalizedFiles: normalized,
    });
  }
  console.log(JSON.stringify(summary, null, 2));
}

main();
