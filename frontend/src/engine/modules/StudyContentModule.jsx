import { useEffect, useMemo, useRef, useState } from "react";
import { useEngine } from "../core/EngineContext";
import { apiPost } from "../../utils/api";
import { FEEDBACK } from "../shared/feedbackTimings";
import CumulativeQuestionCard from "../shared/CumulativeQuestionCard";
import QuestionModal from "../shared/QuestionModal";
import PassageReviewModal from "../shared/PassageReviewModal";
import PassageMarkdown from "../../utils/PassageMarkdown";
import RichText from "../../utils/RichText";
import "../../styles/background-module.css";
import "../../styles/student-study.css";

/**
 * 내용 숙지 학습 모듈 (V0076 페이지 단위)
 *
 * payload: { sessionId, logId, pages: [{ id, pageNo, title, markdown, questions: [...] }] }
 *
 * 흐름 (배경지식 모듈과 동일 패턴):
 *  1. 1페이지 본문 → "다 읽었습니다"
 *  2. 1페이지 문제 1번 (모달) → 정답 입력 → 자동 다음
 *  3. 1페이지 모든 문제 끝 → 2페이지 본문
 *  4. 반복 → 마지막 페이지 끝나면 complete-session 호출
 *
 * 문제 종류:
 *  - MULTI_CHOICE/OX: 공통 QuestionModal (포스트잇 + 드래그)
 *  - SHORT_ANSWER: 음절 카드 모달 (인라인)
 *  - ESSAY: 빈칸 채우기 모달 (인라인)
 */
const SCORING = { correct: 20, wrong: -40 };

function StudyContentModule({ content }) {
  const { status, start, adjustTime, recordAnswer, finish, setPageProgress } = useEngine();
  const contentId = content?.contentId;
  const payload = content?.payload || {};
  const sessionId = payload.sessionId;
  const logId = payload.logId;
  const pages = payload.pages || [];

  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [showingPassage, setShowingPassage] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [completedMap, setCompletedMap] = useState({});
  const [lastResult, setLastResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [completing, setCompleting] = useState(false);
  const [showPassageReview, setShowPassageReview] = useState(false);
  const advanceTimerRef = useRef(null);
  const scrollRef = useRef(null);
  const lockRef = useRef(false);
  const completedOnceRef = useRef(false);

  const currentPage = pages[currentPageIndex] || null;
  const pageQuestions = currentPage?.questions || [];
  const currentQuestion = pageQuestions[currentQuestionIndex] || null;
  const totalQuestions = useMemo(
    () => pages.reduce((sum, p) => sum + (p.questions?.length || 0), 0),
    [pages]
  );

  // 페이지 진행률 (헤더 표시)
  useEffect(() => {
    if (pages.length > 0 && setPageProgress) {
      setPageProgress({ current: currentPageIndex + 1, total: pages.length });
    }
  }, [currentPageIndex, pages.length, setPageProgress]);

  // 클린업
  useEffect(
    () => () => {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    },
    []
  );

  // 누적 카드 자동 스크롤
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentQuestionIndex, currentPageIndex]);

  // ── "다 읽었습니다" 클릭: 본문 → 문제 ──
  const handleDoneReading = () => {
    setShowingPassage(false);
    setCurrentQuestionIndex(0);
    if (status === "READY") start();
  };

  // ── 답안 제출 (서버 채점) ──
  const submitAnswer = async ({ selectedChoiceId, userAnswer, blankPicks }) => {
    if (lockRef.current || !currentQuestion) return;
    lockRef.current = true;

    try {
      const res = await apiPost(
        `/v1/learning/study/contents/${contentId}/submit-attempt`,
        {
          sessionId,
          questionId: currentQuestion.id,
          selectedChoiceId: selectedChoiceId || null,
          userAnswer: userAnswer || null,
          blankPicks: blankPicks || null,
        }
      );
      const isCorrect = !!res.isCorrect;
      adjustTime(isCorrect ? SCORING.correct : SCORING.wrong);
      recordAnswer({
        id: currentQuestion.id,
        correct: isCorrect,
        chosenChoiceId: selectedChoiceId || null,
      });

      setCompletedMap((prev) => ({
        ...prev,
        [currentQuestion.id]: {
          selectedId: selectedChoiceId || null,
          userAnswer: userAnswer || null,
          isCorrect,
          correctChoiceId: res.correctChoiceId || null,
          correctAnswer: res.correctAnswer || null,
        },
      }));
      setLastResult(isCorrect ? "correct" : "wrong");

      const delay = isCorrect ? FEEDBACK.A_CORRECT_ADVANCE_MS : FEEDBACK.A_WRONG_ADVANCE_MS;
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = setTimeout(() => {
        setLastResult(null);
        lockRef.current = false;
        if (currentQuestionIndex < pageQuestions.length - 1) {
          setCurrentQuestionIndex((i) => i + 1);
        } else if (currentPageIndex < pages.length - 1) {
          setCurrentPageIndex((i) => i + 1);
          setShowingPassage(true);
          setCurrentQuestionIndex(0);
          setCompletedMap({});
        } else {
          completeSession();
        }
      }, delay);
    } catch (e) {
      setErrorMsg(e.message || "답안 제출 실패");
      lockRef.current = false;
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
      finish(true, { seed: res.earnedSeed > 0 ? res.earnedSeed : 0 });
    } catch (e) {
      setErrorMsg(e.message || "세션 종료 실패");
      finish(false, { seed: 0 });
    } finally {
      setCompleting(false);
    }
  };

  // ── 데이터 없음 ──
  if (!contentId || pages.length === 0) {
    return (
      <div className="bg-module">
        <p>학습 콘텐츠를 불러올 수 없습니다.</p>
      </div>
    );
  }

  // ── 본문 읽기 화면 ──
  if (showingPassage && currentPage) {
    return (
      <div className="bg-module">
        <div className="bg-status-bar">
          <span className="bg-progress">
            페이지 {currentPageIndex + 1} / {pages.length}
          </span>
          <span className="bg-phase-label">본문 읽기</span>
        </div>
        <div className="bg-passage-area">
          <div className="bg-passage-title">
            {currentPage.title || `${currentPageIndex + 1}페이지`}
          </div>
          <PassageMarkdown className="bg-passage-text">{currentPage.markdown || ""}</PassageMarkdown>
        </div>
        <div className="bg-actions">
          <button type="button" className="bg-btn bg-btn-primary" onClick={handleDoneReading}>
            다 읽었습니다
          </button>
        </div>
        {errorMsg && <p style={{ color: "#c0392b", textAlign: "center" }}>{errorMsg}</p>}
      </div>
    );
  }

  // ── 문제 풀기 화면 ──
  if (pageQuestions.length === 0) {
    // 이 페이지에 문제가 없으면 곧장 다음 페이지 또는 종료
    if (currentPageIndex < pages.length - 1) {
      // 다음 페이지로 즉시 이동
      setTimeout(() => {
        setCurrentPageIndex((i) => i + 1);
        setShowingPassage(true);
        setCompletedMap({});
      }, 0);
    } else if (!completedOnceRef.current) {
      setTimeout(() => completeSession(), 0);
    }
    return (
      <div className="bg-module">
        <p style={{ textAlign: "center", padding: "20px" }}>다음 페이지로 이동합니다...</p>
      </div>
    );
  }

  const visibleQuestions = pageQuestions.slice(0, currentQuestionIndex + 1);

  return (
    <div className="bg-module">
      <div className="bg-status-bar">
        <span className="bg-progress">
          페이지 {currentPageIndex + 1} / {pages.length} · 문제 {currentQuestionIndex + 1} / {pageQuestions.length}
        </span>
        <span className="bg-phase-label">문제 풀기</span>
      </div>
      <div className="learning-modal-instruction">
        문제를 읽고 클릭하면 답안을 입력할 수 있습니다.
      </div>
      <div style={{ textAlign: "right", marginBottom: 8 }}>
        <button
          type="button"
          className="bg-btn"
          style={{
            background: "rgba(255, 252, 246, 0.95)",
            border: "1px solid rgba(75, 61, 54, 0.3)",
            color: "#4b3d36",
            fontSize: 13,
            padding: "6px 14px",
          }}
          onClick={() => setShowPassageReview(true)}
        >
          본문 다시 보기
        </button>
      </div>
      <div className="cum-stack" ref={scrollRef}>
        {visibleQuestions.map((q, idx) => {
          const completion = completedMap[q.id];
          const isActive = idx === currentQuestionIndex;
          const cardQuestion = toCardQuestion(q, completion);
          return (
            <StudyQuestionItem
              key={q.id}
              question={q}
              cardQuestion={cardQuestion}
              idx={idx}
              total={pageQuestions.length}
              completion={completion}
              isActive={isActive && !completion && !completing}
              lastResult={isActive ? lastResult : null}
              onSubmit={submitAnswer}
            />
          );
        })}
      </div>
      {completing && (
        <p style={{ textAlign: "center", padding: "12px", color: "#1f4a37", fontWeight: 700 }}>
          학습 결과를 정리하는 중...
        </p>
      )}
      {errorMsg && <p style={{ color: "#c0392b", textAlign: "center" }}>{errorMsg}</p>}
      {showPassageReview && (
        <PassageReviewModal
          title="본문 다시 보기"
          passage={currentPage.markdown || ""}
          onClose={() => setShowPassageReview(false)}
        />
      )}
    </div>
  );
}

/** 서버 응답 question을 CumulativeQuestionCard 형식으로 변환 */
function toCardQuestion(q, completion) {
  const stem = q.stem || "";
  const choices = (q.choices || []).map((c) => ({ id: c.id, text: c.text }));
  // MULTI_CHOICE/OX는 정답 ID를 채점 응답으로부터 받음 (완료 시 표시용)
  const answerId = completion?.correctChoiceId || null;
  return {
    id: q.id,
    stem,
    choices,
    answerId,
    boxContent: q.boxContent,
    conditionContent: q.conditionContent,
  };
}

/**
 * 단일 문제 카드 — 종류에 따라 다른 입력 UI:
 *  - MULTI_CHOICE/OX: CumulativeQuestionCard (공통 QuestionModal 포스트잇)
 *  - SHORT_ANSWER: 음절 카드 인라인 모달
 *  - ESSAY: 빈칸 채우기 인라인 모달
 */
function StudyQuestionItem({ question, cardQuestion, idx, total, completion, isActive, lastResult, onSubmit }) {
  const type = (question.questionType || "").toUpperCase();

  // MULTI_CHOICE / OX → 공통 QuestionModal
  if (type === "MULTI_CHOICE" || type === "OX") {
    return (
      <CumulativeQuestionCard
        question={cardQuestion}
        idx={idx}
        total={total}
        completion={completion}
        isActive={isActive}
        onSelect={(choiceId) => onSubmit({ selectedChoiceId: choiceId })}
        modalTitle={type === "OX" ? "O / X" : "문제"}
        lastResult={lastResult}
      />
    );
  }

  // SHORT_ANSWER → 음절 카드
  if (type === "SHORT_ANSWER") {
    return (
      <ShortAnswerCard
        question={question}
        idx={idx}
        total={total}
        completion={completion}
        isActive={isActive}
        onSubmit={(userAnswer) => onSubmit({ userAnswer })}
      />
    );
  }

  // ESSAY → 빈칸 채우기 (EssayCard 가 { userAnswer, blankPicks } 형태로 호출)
  if (type === "ESSAY") {
    return (
      <EssayCard
        question={question}
        idx={idx}
        total={total}
        completion={completion}
        isActive={isActive}
        onSubmit={(payload) => onSubmit(payload)}
      />
    );
  }

  return null;
}

/** 단답형 — 음절 카드 클릭 */
function ShortAnswerCard({ question, idx, total, completion, isActive, onSubmit }) {
  const [picked, setPicked] = useState([]); // [{ char, srcIdx }]
  const cards = question.syllableCards || [];
  const targetLen = question.answerLength || 0;
  const usedSrc = useMemo(() => new Set(picked.map((p) => p.srcIdx)), [picked]);

  const pick = (char, srcIdx) => {
    if (!isActive) return;
    if (picked.length >= targetLen) return;
    if (usedSrc.has(srcIdx)) return;
    setPicked([...picked, { char, srcIdx }]);
  };
  const undo = () => {
    if (!isActive) return;
    setPicked(picked.slice(0, -1));
  };
  const submit = () => {
    if (picked.length !== targetLen) return;
    const answer = picked.map((p) => p.char).join("");
    onSubmit(answer);
  };

  return (
    <div className={`cum-card ${completion ? "completed" : ""} ${isActive ? "active" : ""} ${
      completion?.isCorrect === true ? "correct" : completion?.isCorrect === false ? "wrong" : ""
    }`}>
      <div className="cum-card-header">
        <span className="cum-card-num">문제 {idx + 1} / {total}</span>
        {completion && (
          <span className={`cum-card-mark ${completion.isCorrect ? "correct" : "wrong"}`}>
            {completion.isCorrect ? "정답" : "오답"}
          </span>
        )}
      </div>
      <div className="cum-card-stem"><RichText>{question.stem}</RichText></div>
      {question.boxContent && (
        <div className="cum-card-boki"><PassageMarkdown>{question.boxContent}</PassageMarkdown></div>
      )}

      {/* 답안 슬롯 */}
      <div className="ssm-slots" style={{ marginTop: 12 }}>
        {Array.from({ length: targetLen }).map((_, i) => (
          <div key={i} className="ssm-slot">
            {completion ? (completion.userAnswer?.[i] || "") : (picked[i]?.char || "")}
          </div>
        ))}
      </div>

      {/* 풀이 중: 음절 카드 풀 */}
      {!completion && isActive && (
        <>
          <p style={{ fontSize: 12, color: "#3a4a3e", textAlign: "center", margin: "6px 0 14px" }}>
            정답 글자를 순서대로 클릭하세요 ({picked.length}/{targetLen})
          </p>
          <div className="ssm-pool">
            {cards.map((c, i) => (
              <button
                key={i}
                type="button"
                className={`ssm-card ${usedSrc.has(i) ? "used" : ""}`}
                onClick={() => pick(c, i)}
                disabled={usedSrc.has(i)}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="ssm-actions">
            <button
              type="button"
              className="ssm-btn ssm-btn-ghost"
              onClick={undo}
              disabled={picked.length === 0}
            >
              ⌫ 한 글자 지우기
            </button>
            <button
              type="button"
              className="ssm-btn ssm-btn-primary"
              onClick={submit}
              disabled={picked.length !== targetLen}
            >
              제출
            </button>
          </div>
        </>
      )}

      {/* 완료: 정답 표시 */}
      {completion && completion.correctAnswer && !completion.isCorrect && (
        <p style={{ marginTop: 8, fontSize: 13, color: "#2d6a4f" }}>
          <strong>정답:</strong> {completion.correctAnswer}
        </p>
      )}
    </div>
  );
}

/** 서술형 — 표준 포스트잇 QuestionModal로 빈칸별 선택지 (WorksheetQuizModule FILL_BLANKS 패턴) */
function EssayCard({ question, idx, total, completion, isActive, onSubmit }) {
  const blanks = useMemo(
    () => parseBlanks(question.modelAnswerMasked || ""),
    [question.modelAnswerMasked]
  );
  const [values, setValues] = useState(() => Array(blanks.length).fill(null));
  const [activeBlankIdx, setActiveBlankIdx] = useState(0);
  const cardRef = useRef(null);
  const [anchorRect, setAnchorRect] = useState(null);
  const choicesByIdx = question.fillBlanksChoices || [];
  const totalBlanks = blanks.length;

  // 활성화되면 카드 위치 측정 → 모달 anchor
  useEffect(() => {
    if (!isActive || !cardRef.current) return;
    const card = cardRef.current;
    try {
      card.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch {
      card.scrollIntoView();
    }
    const measure = () => {
      if (!cardRef.current) return;
      const r = cardRef.current.getBoundingClientRect();
      setAnchorRect({ left: r.left, right: r.right, top: r.top, height: r.height });
    };
    measure();
    const t = setTimeout(measure, 350);
    return () => clearTimeout(t);
  }, [isActive, question.id]);

  // 활성화 시 첫 빈칸부터 시작
  useEffect(() => {
    if (isActive && !completion) setActiveBlankIdx(0);
  }, [isActive, completion, question.id]);

  const handlePick = (choiceId) => {
    // choiceId 형식: "blankN-optM"
    const m = choiceId.match(/^blank(\d+)-opt(\d+)$/);
    if (!m) return;
    const bIdx = Number(m[1]);
    const oIdx = Number(m[2]);
    const text = (choicesByIdx[bIdx] || [])[oIdx];
    if (text == null) return;
    const next = [...values];
    next[bIdx] = text;
    setValues(next);

    // 다음 빈칸 또는 제출
    if (bIdx >= totalBlanks - 1) {
      // 마지막 빈칸 — 빈칸별 텍스트(blankPicks) 와 조립 텍스트 둘 다 보냄.
      // 백엔드는 blankPicks 가 있으면 위치별 비교, 없으면 폴백.
      let result = "";
      let blankIdx = 0;
      for (const seg of blanks.segments) {
        if (seg.type === "text") result += seg.text;
        else {
          result += next[blankIdx] || "";
          blankIdx += 1;
        }
      }
      setTimeout(
        () => onSubmit({ userAnswer: result, blankPicks: next }),
        FEEDBACK.A_CORRECT_ADVANCE_MS
      );
    } else {
      setTimeout(() => setActiveBlankIdx(bIdx + 1), FEEDBACK.A_CORRECT_ADVANCE_MS);
    }
  };

  // 현재 빈칸의 선택지 → QuestionModal choices 형식
  const currentChoices = useMemo(() => {
    const opts = choicesByIdx[activeBlankIdx] || [];
    return opts.map((text, i) => ({ id: `blank${activeBlankIdx}-opt${i}`, text }));
  }, [activeBlankIdx, choicesByIdx]);

  return (
    <div
      ref={cardRef}
      className={`cum-card ${completion ? "completed" : ""} ${isActive ? "active" : ""} ${
        completion?.isCorrect === true ? "correct" : completion?.isCorrect === false ? "wrong" : ""
      }`}
    >
      <div className="cum-card-header">
        <span className="cum-card-num">문제 {idx + 1} / {total}</span>
        {completion && (
          <span className={`cum-card-mark ${completion.isCorrect ? "correct" : "wrong"}`}>
            {completion.isCorrect ? "정답" : "오답"}
          </span>
        )}
      </div>
      <div className="cum-card-stem"><RichText>{question.stem}</RichText></div>
      {question.boxContent && (
        <div className="cum-card-boki"><PassageMarkdown>{question.boxContent}</PassageMarkdown></div>
      )}
      {question.conditionContent && (
        <div style={{
          background: "rgba(212, 160, 76, 0.10)",
          border: "1px solid rgba(212, 160, 76, 0.4)",
          padding: "8px 12px", borderRadius: 6, margin: "8px 0", fontSize: 13,
        }}>
          <strong>&lt;조건&gt;</strong> {question.conditionContent}
        </div>
      )}

      <div className="essay-passage" style={{ marginTop: 12 }}>
        {blanks.segments.map((seg, i) => {
          if (seg.type === "text") return <span key={i}>{seg.text}</span>;
          const blankIdx = blanks.indexByPos[i];
          const value = values[blankIdx];
          return (
            <span
              key={i}
              className={`essay-blank ${value ? "filled" : ""} ${
                isActive && activeBlankIdx === blankIdx ? "active" : ""
              }`}
            >
              {value || `빈칸${blankIdx + 1}`}
            </span>
          );
        })}
      </div>

      {/* 완료: 모범답안 표시 */}
      {completion && completion.correctAnswer && !completion.isCorrect && (
        <p style={{ marginTop: 8, fontSize: 13, color: "#2d6a4f" }}>
          <strong>모범답안:</strong> {completion.correctAnswer}
        </p>
      )}

      {/* 활성화 + 미완료 → 표준 포스트잇 모달 (드래그 가능) */}
      {isActive && !completion && currentChoices.length > 0 && (
        <QuestionModal
          title="빈칸 채우기"
          prompt={`${activeBlankIdx + 1}번째 빈칸에 들어갈 말을 고르세요 (${activeBlankIdx + 1}/${totalBlanks})`}
          choices={currentChoices}
          onSelect={handlePick}
          shuffleKey={`${question.id}-blank-${activeBlankIdx}`}
          anchorRect={anchorRect}
          feedbackDuration={FEEDBACK.A_CORRECT_ADVANCE_MS}
        />
      )}
    </div>
  );
}

/** masked 문자열 → 텍스트/빈칸 세그먼트로 분해 */
function parseBlanks(masked) {
  const segments = [];
  const indexByPos = {};
  let blankCount = 0;
  let buf = "";
  let i = 0;
  while (i < masked.length) {
    if (masked[i] === "_") {
      let j = i;
      while (j < masked.length && masked[j] === "_") j += 1;
      if (j - i >= 2) {
        if (buf) {
          segments.push({ type: "text", text: buf });
          buf = "";
        }
        const segIdx = segments.length;
        indexByPos[segIdx] = blankCount;
        segments.push({ type: "blank" });
        blankCount += 1;
        i = j;
        continue;
      }
    }
    buf += masked[i];
    i += 1;
  }
  if (buf) segments.push({ type: "text", text: buf });
  return { segments, indexByPos, length: blankCount };
}

export default StudyContentModule;
