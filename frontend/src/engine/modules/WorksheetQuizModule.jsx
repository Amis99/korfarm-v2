import { useEffect, useMemo, useState } from "react";
import { useEngine } from "../core/EngineContext";
import QuestionModal from "../shared/QuestionModal";

const getScoring = (question) => question.scoring || { correctDeltaSec: 0, wrongDeltaSec: 0 };

const applyTemplate = (template, filled) => {
  const parts = template.split("____");
  return parts.reduce((acc, part, idx) => {
    const fill = filled[idx] ?? "____";
    return `${acc}${part}${idx < parts.length - 1 ? fill : ""}`;
  }, "");
};

function WorksheetQuizModule({ content }) {
  const { status, start, adjustTime, recordAnswer, finish } = useEngine();
  const payload = content?.payload || {};
  const questions = payload.questions || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showPdf, setShowPdf] = useState(false);
  const [blankIndex, setBlankIndex] = useState(0);
  const [blankAnswers, setBlankAnswers] = useState({});
  const [lastResult, setLastResult] = useState(null);
  const [statusMap, setStatusMap] = useState({});

  const currentQuestion = questions[currentIndex];
  const isFillBlanks = currentQuestion?.type === "FILL_BLANKS";
  const blanks = currentQuestion?.blanks || [];
  const filled = blanks.map((blank) => blankAnswers[blank.id]);
  const isManuscript =
    currentQuestion?.render === "MANUSCRIPT" || content?.contentType === "WRITING_DESCRIPTIVE";
  const preparedTemplate = currentQuestion?.template
    ? applyTemplate(currentQuestion.template, filled)
    : "";

  const handleNext = () => {
    if (currentIndex >= questions.length - 1) {
      finish(true);
      return;
    }
    setCurrentIndex((prev) => prev + 1);
    setBlankIndex(0);
    setBlankAnswers({});
    setLastResult(null);
  };

  const handleChoice = (choiceId) => {
    if (!currentQuestion) return;
    const scoring = getScoring(currentQuestion);
    const isCorrect = choiceId === currentQuestion.answerId;
    adjustTime(isCorrect ? scoring.correctDeltaSec : scoring.wrongDeltaSec);
    recordAnswer({ id: currentQuestion.id, correct: isCorrect });
    setLastResult(isCorrect ? "correct" : "wrong");
    setStatusMap((prev) => ({
      ...prev,
      [currentQuestion.id]: isCorrect ? "correct" : "wrong",
    }));
    if (!isCorrect && currentQuestion.requireCorrect) {
      return;
    }
    handleNext();
  };

  const handleBlankChoice = (choiceId) => {
    if (!currentQuestion) return;
    const blank = blanks[blankIndex];
    const scoring = getScoring(currentQuestion);
    const isCorrect = choiceId === blank.answerId;
    adjustTime(isCorrect ? scoring.correctDeltaSec : scoring.wrongDeltaSec);
    recordAnswer({ id: `${currentQuestion.id}-${blank.id}`, correct: isCorrect });
    setBlankAnswers((prev) => ({ ...prev, [blank.id]: blank.choices.find((c) => c.id === choiceId)?.text || "" }));
    setLastResult(isCorrect ? "correct" : "wrong");
    if (!isCorrect && currentQuestion.requireCorrect) {
      return;
    }
    if (blankIndex >= blanks.length - 1) {
      setStatusMap((prev) => ({
        ...prev,
        [currentQuestion.id]: isCorrect ? "correct" : "wrong",
      }));
    }
    if (blankIndex >= blanks.length - 1) {
      handleNext();
    } else {
      setBlankIndex((prev) => prev + 1);
    }
  };

  const hasStartGate = payload.requireStart && status === "READY";

  useEffect(() => {
    if (!payload.requireStart && status === "READY") {
      start();
    }
  }, [payload.requireStart, status, start]);

  return (
    <div className="worksheet-module">
      {hasStartGate ? (
        <div className="worksheet-start">
          <div className="worksheet-preview">
            {payload.pdfUrl ? (
              <object className="pdf-viewer" data={payload.pdfUrl} type="application/pdf" />
            ) : (
              <div className="worksheet-empty">학습 자료 미리보기</div>
            )}
          </div>
          <button type="button" className="worksheet-start-btn" onClick={start}>
            학습 시작
          </button>
        </div>
      ) : (
        <>
          <div className="worksheet-sheet">
            <div className="worksheet-stem">
              <h3>{currentQuestion?.stem}</h3>
              {isFillBlanks ? <p className="worksheet-template">{preparedTemplate}</p> : null}
              {isManuscript ? (
                <div className="manuscript-grid">
                  {blanks.map((blank) => (
                    <span key={blank.id} className="manuscript-cell">
                      {blankAnswers[blank.id] ? "●" : ""}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="worksheet-controls">
              {payload.pdfUrl ? (
                <button
                  type="button"
                  className="worksheet-pdf-btn"
                  onClick={() => setShowPdf(true)}
                >
                  PDF 보기
                </button>
              ) : null}
              <span>{currentIndex + 1} / {questions.length}</span>
            </div>
          </div>
          <div className="worksheet-status">
            {questions.map((question) => (
              <span
                key={question.id}
                className={`status-dot ${statusMap[question.id] || ""}`}
              >
                {statusMap[question.id] === "correct"
                  ? "○"
                  : statusMap[question.id] === "wrong"
                    ? "／"
                    : "·"}
              </span>
            ))}
          </div>
          {lastResult ? (
            <div className={`worksheet-feedback ${lastResult}`}>
              {lastResult === "correct" ? "정답입니다!" : "오답입니다."}
            </div>
          ) : null}

          {currentQuestion && currentQuestion.type !== "FILL_BLANKS" ? (
            <QuestionModal
              title="문제"
              prompt={currentQuestion.prompt || currentQuestion.stem}
              choices={currentQuestion.choices || []}
              onSelect={handleChoice}
            />
          ) : null}

          {isFillBlanks ? (
            <QuestionModal
              title="빈칸 채우기"
              prompt={`${blankIndex + 1}번째 빈칸을 선택하세요.`}
              choices={blanks[blankIndex]?.choices || []}
              onSelect={handleBlankChoice}
            />
          ) : null}
        </>
      )}

      {showPdf ? (
        <div className="worksheet-pdf-overlay">
          <div className="worksheet-pdf-card">
            <object className="pdf-viewer" data={payload.pdfUrl} type="application/pdf" />
            <button type="button" onClick={() => setShowPdf(false)}>
              보기 종료
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default WorksheetQuizModule;
