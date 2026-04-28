import { useMemo } from "react";
import EngineContext from "../../../engine/core/EngineContext";
import DailyQuizModule from "../../../engine/modules/DailyQuizModule";

/**
 * 일일퀴즈 비주얼 에디터의 학생 화면 미리보기.
 * - 좌측 패널에 띄움. EngineContext 를 Mock 으로 주입해 finish/타이머 부작용 제거.
 * - activeIndex 가 가리키는 한 문제만 잘라 넘김 → 우측 폼에서 수정한 게 즉시 반영.
 */
export default function DailyQuizPreview({ content, meta, activeIndex = 0 }) {
  const questions = content?.questions || [];
  const single = questions[activeIndex];

  // 미리보기 content — 활성 문제 1개만 포함
  const previewContent = useMemo(() => {
    if (!single) return null;
    return {
      contentType: meta?.contentType || "DAILY_QUIZ",
      title: meta?.title || "",
      targetLevel: meta?.levelId || meta?.targetLevel || "",
      area: meta?.area || "",
      subArea: meta?.subArea || "",
      timeLimitSec: 99999,
      payload: { ...content, questions: [single] },
    };
  }, [single, content, meta]);

  // Mock EngineContext — 모든 콜백 noop, status 항상 RUNNING
  const ctx = useMemo(
    () => ({
      status: "RUNNING",
      timeLeft: 99999,
      timeLimit: 99999,
      seed: 0,
      seedExhausted: false,
      setSeed: () => {},
      adjustTime: () => {},
      recordAnswer: () => {},
      start: () => {},
      pause: () => {},
      resume: () => {},
      finish: () => {},
      resetRound: () => {},
      setPageProgress: () => {},
      setTimeSpeed: () => {},
    }),
    []
  );

  if (!single) {
    return (
      <div className="ce-preview-empty" style={{ padding: 24, color: "#888" }}>
        문제를 추가하면 미리보기가 여기에 표시됩니다.
      </div>
    );
  }

  return (
    <EngineContext.Provider value={ctx}>
      <div className="dq-preview-wrap" style={{ padding: 12 }}>
        <div
          className="dq-preview-banner"
          style={{
            fontSize: 12,
            color: "#5b4d2e",
            background: "rgba(255,243,210,0.6)",
            border: "1px dashed rgba(138,109,59,0.5)",
            padding: "6px 10px",
            borderRadius: 6,
            marginBottom: 10,
          }}
        >
          미리보기 — 우측 폼에서 수정 시 즉시 반영. 정답·오답 클릭은 학습 부작용 없음(타이머/저장 무시).
          <span style={{ float: "right", fontWeight: 700 }}>
            문제 {activeIndex + 1} / {questions.length}
          </span>
        </div>
        <div className="dq-preview-body">
          <DailyQuizModule content={previewContent} />
        </div>
      </div>
    </EngineContext.Provider>
  );
}
