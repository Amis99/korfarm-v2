/**
 * 진단 테스트 / 챕터 테스트 문제를 DailyQuiz 엔진 형식으로 변환하는 어댑터.
 * ExamModule과 함께 사용.
 */

/**
 * 진단 테스트 문제 → 엔진 형식
 * 같은 passageId를 공유하는 연속 문제 그룹에서 첫 문제에만 지문 표시.
 */
export function adaptDiagnosticQuestions(questions) {
  let lastPassageId = null;
  return questions.map((q) => {
    const showPassage = q.passageId !== lastPassageId;
    lastPassageId = q.passageId;
    return {
      id: q.questionId,
      type: "MULTI_CHOICE",
      stem: q.stem,
      passage: showPassage ? (q.passageText || null) : null,
      choices: (q.choices || []).map((c) => ({ id: c.choiceId, text: c.text })),
      answerId: null,
      explanation: null,
      questionKind: "DIAGNOSTIC",
      boxContent: q.boxContent || null,
    };
  });
}

/**
 * 챕터 테스트(test_storage) 문제 → 엔진 형식 (객관식만)
 */
export function adaptTestQuestions(questions) {
  return questions
    .filter((q) => q.type === "객관식")
    .map((q) => ({
      id: String(q.number),
      type: "MULTI_CHOICE",
      stem: q.content || "",
      passage: q.passage && q.content ? q.passage : null,
      choices: (q.choices || []).map((text, i) => ({
        id: String(i + 1),
        text,
      })),
      answerId: null,
      explanation: null,
      questionKind: q.domain || "CHAPTER_TEST",
    }));
}

/**
 * EngineShell에 전달할 content 래퍼 생성
 */
export function buildEngineContent({ title, questions, timeLimitSec, contentType }) {
  return {
    title,
    timeLimitSec,
    contentType,
    seedReward: { count: 1 },
    payload: { questions },
  };
}
