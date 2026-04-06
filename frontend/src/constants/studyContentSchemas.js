/**
 * 내용 숙지 학습 콘텐츠 관련 표준 스키마 + AI 시스템 프롬프트
 *
 * 워크플로우:
 *  1) 관리자가 마크다운 본문 업로드 → AI_CHECKLIST_PROMPT를 외부 ChatGPT/Claude에 사용
 *     → 결과 JSON({evalPoints, errorPatterns})을 비주얼 에디터에 붙여넣기
 *  2) 체크리스트 검토/수정
 *  3) AI_QUESTION_PROMPT를 외부 AI에 사용 → 결과 JSON({questions[]}) 업로드
 *  4) 문제 검토/수정 → 저장
 */

// ─────────────────────────────────────────────
// 스키마 (다운로드용 + 비주얼 에디터 초기값)
// ─────────────────────────────────────────────

export const STUDY_CONTENT_TEMPLATE = {
  title: "학습 콘텐츠 제목",
  description: "한 줄 설명",
  levelId: "RUSSELL_1",
  visibility: "PUBLIC", // PUBLIC | ORG (HQ_ADMIN만 PUBLIC, ORG_ADMIN은 ORG로 강제됨)
  markdown: "# 제목\n\n본문을 마크다운으로 작성합니다.",
  evalPoints: [
    "예: 당쟁의 정의",
    "예: 예송 논쟁의 원인",
    "예: 환국 정치의 특징",
  ],
  errorPatterns: [
    "예: 조선과 명·청 혼동",
    "예: 원인-결과 뒤집기",
    "예: 남인-서인 입장 혼동",
  ],
};

export const STUDY_QUESTIONS_TEMPLATE = {
  questions: [
    {
      questionNo: 1,
      questionType: "MULTI_CHOICE",
      stem: "다음 중 예송 논쟁의 직접적인 원인으로 가장 적절한 것은?",
      choices: [
        { id: "A", text: "왕실 상복 기간 결정", isCorrect: true },
        { id: "B", text: "토지 제도 개혁안", isCorrect: false, errorPatternIdx: 1 },
        { id: "C", text: "명나라와의 외교 단절", isCorrect: false, errorPatternIdx: 0 },
        { id: "D", text: "과거 시험 폐지", isCorrect: false },
        { id: "E", text: "신분제 개편", isCorrect: false },
      ],
      evalPointIdx: [1],
      difficulty: 3,
    },
    {
      questionNo: 2,
      questionType: "OX",
      stem: "환국 정치는 17세기 후반 숙종 시기에 두드러지게 나타났다.",
      choices: [
        { id: "O", text: "맞음", isCorrect: true },
        { id: "X", text: "틀림", isCorrect: false, errorPatternIdx: 0 },
      ],
      evalPointIdx: [2],
      difficulty: 2,
    },
    {
      questionNo: 3,
      questionType: "ESSAY",
      stem: "당쟁이 조선 사회에 미친 영향을 두 가지 이상 서술하시오.",
      modelAnswer: "당쟁은 정치적 분열을 심화시켰고, 사림들의 학문적 논쟁을 활발하게 만들었다.",
      fillBlanks: [
        { phrase: "정치적 분열", position: 1 },
        { phrase: "학문적 논쟁", position: 2 },
      ],
      evalPointIdx: [0, 2],
      difficulty: 4,
    },
  ],
};

// ─────────────────────────────────────────────
// AI 시스템 프롬프트 (관리자가 다운받아 외부 AI에 사용)
// ─────────────────────────────────────────────

export const AI_CHECKLIST_PROMPT = `당신은 한국어 학습 콘텐츠를 분석하는 AI입니다.
주어진 학습 본문을 읽고 다음 두 가지를 추출하세요:

1. evalPoints: 이 학습이 평가해야 할 핵심 평가 포인트(평가 항목)들의 짧은 한국어 라벨 배열.
   - 본문의 핵심 개념·사실·관계·논점 각각이 하나의 evalPoint가 됩니다.
   - 너무 추상적이지 않고 너무 잘게 나누지 않습니다 (보통 5~15개).
   - 예: ["당쟁의 정의", "예송 논쟁의 원인", "환국 정치의 특징"]

2. errorPatterns: 학생들이 이 본문에서 흔히 범할 만한 오인·혼동·논리 오류 유형들의 짧은 한국어 라벨 배열.
   - 학생이 '왜 틀리는지'를 설명하는 패턴이어야 합니다 (3~10개).
   - 예: ["조선/명청 혼동", "원인-결과 뒤집기", "남인-서인 입장 혼동"]

출력 형식 (반드시 JSON):
{
  "evalPoints": ["...", "..."],
  "errorPatterns": ["...", "..."]
}

다른 설명 없이 JSON만 출력하세요.

==== 학습 본문 ====
[여기에 마크다운 본문을 붙여넣으세요]
`;

export const AI_QUESTION_PROMPT = `당신은 한국어 학습 문제를 만드는 AI입니다.
주어진 학습 본문과 체크리스트(evalPoints, errorPatterns)를 바탕으로 N개의 문제를 생성하세요.

규칙:
- 각 문제는 본문의 내용에 기반해야 합니다 (본문 외 지식 금지).
- questionType은 MULTI_CHOICE, OX, ESSAY 중 하나입니다.
- MULTI_CHOICE: 5개 선택지(id A~E), 정답 1개. 각 오답은 errorPatterns 인덱스를 가질 수 있습니다.
- OX: 2개 선택지(id O/X). 정답 1개.
- ESSAY: 모범답안(modelAnswer)과 학생이 답안에 반드시 포함해야 할 핵심 문구들(fillBlanks)을 명시합니다.
- 모든 문제는 evalPointIdx에 평가하는 evalPoints의 인덱스 배열을 갖습니다 (제공된 체크리스트의 0부터 시작하는 인덱스).
- 정답 선택지가 다른 선택지보다 유독 길지 않도록 길이를 균등하게 맞추세요.
- 한 문제 안의 선택지 형식(단어/구/문장)은 동일해야 합니다.
- difficulty는 1~5 정수.

출력 형식 (반드시 JSON):
{
  "questions": [
    {
      "questionNo": 1,
      "questionType": "MULTI_CHOICE",
      "stem": "...",
      "choices": [
        { "id": "A", "text": "정답 텍스트", "isCorrect": true },
        { "id": "B", "text": "오답 텍스트", "isCorrect": false, "errorPatternIdx": 0 },
        { "id": "C", "text": "오답", "isCorrect": false, "errorPatternIdx": 1 },
        { "id": "D", "text": "오답", "isCorrect": false },
        { "id": "E", "text": "오답", "isCorrect": false }
      ],
      "evalPointIdx": [0, 2],
      "difficulty": 3
    }
  ]
}

다른 설명 없이 JSON만 출력하세요.

==== 학습 본문 ====
[여기에 마크다운 본문을 붙여넣으세요]

==== 체크리스트 ====
evalPoints: [...]
errorPatterns: [...]

==== 생성할 문제 수 ====
[여기에 숫자를 입력하세요. 권장: 20개 이상, 최대 2000]
`;

// ─────────────────────────────────────────────
// 다운로드 헬퍼
// ─────────────────────────────────────────────

export function downloadJsonFile(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadTextFile(text, filename) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
