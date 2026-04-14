/**
 * 진단 테스트 / 챕터 테스트 문제를 ExamModule 형식으로 변환하는 어댑터.
 */

/**
 * 진단 테스트 문제 → ExamModule 형식
 * 같은 passageId를 공유하는 연속 문제 그룹에서 첫 문제에만 지문 표시.
 */
export function adaptDiagnosticQuestions(questions) {
  let lastPassageId = null;
  return questions.map((q) => {
    const showPassage = q.passageId !== lastPassageId;
    lastPassageId = q.passageId;
    return {
      id: q.questionId,
      stem: q.stem || "",
      passage: showPassage ? (q.passageText || null) : null,
      boxContent: q.boxContent || null,
      choices: (q.choices || []).map((c) => ({ id: c.choiceId, text: c.text })),
      questionKind: q.questionType || "DIAGNOSTIC",
    };
  });
}

/**
 * 챕터 테스트(test_storage) 문제 → ExamModule 형식 (객관식만)
 */
export function adaptTestQuestions(questions) {
  return questions
    .filter((q) => q.type === "객관식")
    .map((q) => {
      // content가 없고 passage만 있으면 passage를 stem으로 사용 (기존 OnlineTestRenderer 로직)
      let stem = q.content || "";
      let passage = null;
      if (q.passage && q.content) {
        passage = q.passage;
      } else if (q.passage && !q.content) {
        // passage에서 <보기> 구분자 분리
        const marker = q.passage.indexOf("<보기>");
        if (marker > 0) {
          stem = q.passage.slice(0, marker).trim();
        } else {
          stem = q.passage;
        }
      }
      return {
        id: String(q.number),
        stem,
        passage,
        boxContent: null,
        choices: (q.choices || []).map((text, i) => ({
          id: String(i + 1),
          text,
        })),
        questionKind: q.domain || "CHAPTER_TEST",
      };
    });
}

/**
 * EngineShell에 전달할 content 래퍼 생성
 */
export function buildEngineContent({ title, questions, timeLimitSec, contentType, targetLevel }) {
  return {
    title,
    timeLimitSec,
    contentType,
    targetLevel: targetLevel || null,
    seedReward: { count: 1 },
    payload: { questions },
  };
}

/**
 * 진단 tier 문자열 → EngineShell targetLevel 변환
 */
export function tierToTargetLevel(tier) {
  const t = (tier || "").toLowerCase();
  if (t.includes("saussure") || t.includes("소쉬르")) return "SAUSSURE_1";
  if (t.includes("frege") || t.includes("프레게")) return "FREGE_1";
  if (t.includes("wittgenstein") || t.includes("비트겐슈타인")) return "WITTGENSTEIN_1";
  return "RUSSELL_1";
}
