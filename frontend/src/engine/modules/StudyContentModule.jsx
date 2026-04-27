import { useEffect, useMemo, useRef, useState } from "react";
import PassageMarkdown from "../../utils/PassageMarkdown";
import RichText from "../../utils/RichText";
import { useEngine } from "../core/EngineContext";
import { apiPost } from "../../utils/api";
import { FEEDBACK } from "../shared/feedbackTimings";
import "../../styles/study-content-module.css";

// 정답 +20초, 오답 -40초
const SCORING = { correct: 20, wrong: -40 };

function shuffle(arr) {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function StudyContentModule({ content }) {
  const { status, start, adjustTime, recordAnswer, finish } = useEngine();
  const contentId = content?.contentId;
  const markdown = content?.payload?.markdown || "";

  const [phase, setPhase] = useState("READING"); // READING | LOADING | QUIZ | DONE
  const [sessionId, setSessionId] = useState(null);
  const [logId, setLogId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [history, setHistory] = useState([]); // [{ question, isCorrect, correctChoiceId, userChoiceId, userAnswer, correctAnswer }]
  const [answerLocked, setAnswerLocked] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [completing, setCompleting] = useState(false);
  const [sessionResult, setSessionResult] = useState(null);
  const completedOnceRef = useRef(false);

  // 현재 문제
  const currentQuestion = phase === "QUIZ" ? questions[currentIdx] : null;

  // 셔플된 선택지 (currentQuestion 변경 시 한 번만 셔플)
  const shuffledChoices = useMemo(() => {
    if (!currentQuestion?.choices) return [];
    return shuffle(currentQuestion.choices);
  }, [currentQuestion?.id]);

  // ESSAY 입력 상태
  const [essayInput, setEssayInput] = useState("");
  useEffect(() => { setEssayInput(""); }, [currentQuestion?.id]);

  // ── "다 읽었습니다" 클릭 ──
  const handleDoneReading = async () => {
    if (!contentId) {
      setErrorMsg("콘텐츠 ID가 없습니다");
      return;
    }
    setPhase("LOADING");
    setErrorMsg("");
    try {
      const res = await apiPost(`/v1/learning/study/contents/${contentId}/start-session`, {});
      setSessionId(res.sessionId);
      setLogId(res.logId);
      setQuestions(res.questions || []);
      setCurrentIdx(0);
      setHistory([]);
      setPhase("QUIZ");
      if (status === "READY") start();
    } catch (e) {
      setErrorMsg(e.message || "세션을 시작할 수 없습니다");
      setPhase("READING");
    }
  };

  // ── 답안 제출 ──
  const submitAnswer = async ({ selectedChoiceId, userAnswer }) => {
    if (answerLocked || !currentQuestion) return;
    setAnswerLocked(true);
    try {
      const res = await apiPost(
        `/v1/learning/study/contents/${contentId}/submit-attempt`,
        {
          sessionId,
          questionId: currentQuestion.id,
          selectedChoiceId: selectedChoiceId || null,
          userAnswer: userAnswer || null,
        }
      );
      const isCorrect = !!res.isCorrect;
      adjustTime(isCorrect ? SCORING.correct : SCORING.wrong);
      recordAnswer({ id: currentQuestion.id, correct: isCorrect });
      setHistory((prev) => [
        ...prev,
        {
          question: currentQuestion,
          isCorrect,
          correctChoiceId: res.correctChoiceId || null,
          correctAnswer: res.correctAnswer || null,
          userChoiceId: selectedChoiceId || null,
          userAnswer: userAnswer || null,
          shuffled: shuffledChoices,
        },
      ]);
      // A 패턴 통일: 정답 즉시 / 오답 3초 후 다음 문제
      const delay = isCorrect ? FEEDBACK.A_CORRECT_ADVANCE_MS : FEEDBACK.A_WRONG_ADVANCE_MS;
      setTimeout(() => {
        setAnswerLocked(false);
        if (currentIdx >= questions.length - 1) {
          completeSession();
        } else {
          setCurrentIdx((i) => i + 1);
        }
      }, delay);
    } catch (e) {
      setErrorMsg(e.message || "답안 제출 실패");
      setAnswerLocked(false);
    }
  };

  // ── 세션 종료 ──
  const completeSession = async () => {
    if (completedOnceRef.current) return;
    completedOnceRef.current = true;
    setCompleting(true);
    try {
      const res = await apiPost(
        `/v1/learning/study/contents/${contentId}/complete-session?logId=${encodeURIComponent(logId)}`,
        { sessionId }
      );
      setSessionResult(res);
      setPhase("DONE");
      // EngineShell finish() 호출 — accuracy 계산은 EngineShell이 records 기반으로 자동
      // 씨앗은 백엔드가 이미 지급. EngineShell의 finish는 farmLogId가 없어 farm/complete 호출 안 함.
      finish(true, { seed: res.earnedSeed > 0 ? res.earnedSeed : 0 });
    } catch (e) {
      setErrorMsg(e.message || "세션 종료 실패");
      setCompleting(false);
      // 실패해도 진행은 끝났으므로 finish 호출 (씨앗 0)
      finish(false, { seed: 0 });
    }
  };

  // ── 렌더 ──

  // 1) READING phase
  if (phase === "READING" || phase === "LOADING") {
    return (
      <div className="sc-module">
        <div className="sc-reading-paper">
          <div className="sc-reading-title">{content?.title || "학습 내용"}</div>
          <PassageMarkdown className="sc-markdown-body">{markdown}</PassageMarkdown>
          <div className="sc-reading-actions">
            {errorMsg && <div className="sc-error">{errorMsg}</div>}
            <button
              type="button"
              className="sc-btn sc-btn-primary"
              onClick={handleDoneReading}
              disabled={phase === "LOADING"}
            >
              {phase === "LOADING" ? "준비 중..." : "다 읽었습니다"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2) DONE phase (백엔드 응답 기반 결과)
  if (phase === "DONE") {
    return (
      <div className="sc-module">
        <div className="sc-result">
          <h2 className="sc-result-title">학습 완료</h2>
          {sessionResult && (
            <>
              <p className="sc-result-stat">
                정답 {sessionResult.totalCorrect} / {sessionResult.totalAttempted}
                {" · "}
                정확도 {Math.round((sessionResult.accuracy || 0) * 100)}%
              </p>
              {sessionResult.earnedSeed > 0 ? (
                <p className="sc-result-seed">씨앗 {sessionResult.earnedSeed}개 획득</p>
              ) : (
                <p className="sc-result-seed">정확도 70% 미만 — 씨앗 미지급</p>
              )}
              {sessionResult.weaknessHint?.length > 0 && (
                <div className="sc-result-weak">
                  <div className="sc-result-weak-title">앞으로 더 살펴볼 부분</div>
                  <ul>
                    {sessionResult.weaknessHint.map((t, i) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
          {errorMsg && <div className="sc-error">{errorMsg}</div>}
        </div>
      </div>
    );
  }

  // 3) QUIZ phase
  return (
    <div className="sc-module sc-quiz">
      <div className="sc-quiz-status">
        문제 {currentIdx + 1} / {questions.length}
      </div>

      {/* 누적 결과 영역 */}
      {history.length > 0 && (
        <div className="sc-history">
          {history.map((h, idx) => (
            <div
              key={`${h.question.id}-${idx}`}
              className={`sc-history-item ${h.isCorrect ? "correct" : "wrong"}`}
            >
              <div className="sc-history-mark" aria-hidden>
                {h.isCorrect ? "○" : "／"}
              </div>
              <div className="sc-history-body">
                <div className="sc-history-stem">
                  <span className="sc-history-num">Q{idx + 1}.</span> <RichText>{h.question.stem}</RichText>
                </div>
                {h.question.questionType !== "ESSAY" && (
                  <div className="sc-history-answers">
                    {h.userChoiceId && (() => {
                      const userChoice = (h.shuffled || []).find((c) => c.id === h.userChoiceId);
                      return userChoice ? (
                        <div className="sc-history-line">
                          <span className="sc-history-label">내 답</span>
                          <span><RichText>{userChoice.text}</RichText></span>
                        </div>
                      ) : null;
                    })()}
                    {h.correctChoiceId && (() => {
                      const correctChoice = (h.shuffled || []).find((c) => c.id === h.correctChoiceId);
                      return correctChoice ? (
                        <div className="sc-history-line correct-text">
                          <span className="sc-history-label">정답</span>
                          <span><RichText>{correctChoice.text}</RichText></span>
                        </div>
                      ) : null;
                    })()}
                  </div>
                )}
                {h.question.questionType === "ESSAY" && (
                  <div className="sc-history-answers">
                    {h.userAnswer && (
                      <div className="sc-history-line">
                        <span className="sc-history-label">내 답</span>
                        <span>{h.userAnswer}</span>
                      </div>
                    )}
                    {h.correctAnswer && (
                      <div className="sc-history-line correct-text">
                        <span className="sc-history-label">모범답안</span>
                        <span>{h.correctAnswer}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 현재 문제 */}
      {currentQuestion && !completing && (
        <div className="sc-current">
          <div className="sc-current-stem"><RichText>{currentQuestion.stem}</RichText></div>

          {currentQuestion.questionType === "MULTI_CHOICE" && (
            <ul className="sc-choices">
              {shuffledChoices.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    className="sc-choice-btn"
                    disabled={answerLocked}
                    onClick={() => submitAnswer({ selectedChoiceId: c.id })}
                  >
                    <RichText>{c.text}</RichText>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {currentQuestion.questionType === "OX" && (
            <div className="sc-ox">
              {shuffledChoices.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className="sc-ox-btn"
                  disabled={answerLocked}
                  onClick={() => submitAnswer({ selectedChoiceId: c.id })}
                >
                  <RichText>{c.text}</RichText>
                </button>
              ))}
            </div>
          )}

          {currentQuestion.questionType === "ESSAY" && (
            <div className="sc-essay">
              {currentQuestion.fillBlanks?.length > 0 && (
                <div className="sc-essay-hint">
                  핵심 문구를 모두 포함해서 답하세요:
                  <ul>
                    {currentQuestion.fillBlanks.map((b, i) => (
                      <li key={i}>____</li>
                    ))}
                  </ul>
                </div>
              )}
              <textarea
                className="sc-essay-input"
                rows={4}
                placeholder="여기에 답을 작성하세요"
                value={essayInput}
                onChange={(e) => setEssayInput(e.target.value)}
                disabled={answerLocked}
              />
              <button
                type="button"
                className="sc-btn sc-btn-primary"
                disabled={answerLocked || !essayInput.trim()}
                onClick={() => submitAnswer({ userAnswer: essayInput })}
              >
                제출
              </button>
            </div>
          )}
        </div>
      )}

      {completing && <div className="sc-completing">학습 결과를 정리하는 중...</div>}
      {errorMsg && <div className="sc-error">{errorMsg}</div>}
    </div>
  );
}

export default StudyContentModule;
