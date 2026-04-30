import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import { apiPost } from "../utils/api";
import SyllableCardModal from "../components/student-study/SyllableCardModal";
import EssayBlankFillModal from "../components/student-study/EssayBlankFillModal";
import "../styles/student-study.css";

/**
 * 학생용 내용 숙지 학습 페이지 (V0076 이후 — 페이지 단위, 시험지 디자인).
 *
 * 흐름:
 *   1. POST /v1/learning/study/contents/{id}/full → 모든 페이지 + 문제 + 세션 시작
 *   2. 페이지 1 본문 시험지 디자인으로 렌더 → 문제 카드 클릭 → 모달 → 답안 제출
 *   3. 페이지 1 모든 문제 풀면 자동으로 페이지 2 본문, 반복
 *   4. 마지막 페이지까지 완료 → POST complete-session → 결과 화면
 */
export default function StudentStudyV2Page() {
  const { contentId } = useParams();
  const navigate = useNavigate();

  const [phase, setPhase] = useState("LOADING"); // LOADING | READING | DONE
  const [data, setData] = useState(null);        // StudyContentFullStudentDto
  const [pageIdx, setPageIdx] = useState(0);
  const [openQuestion, setOpenQuestion] = useState(null); // 풀이 중인 문제
  const [results, setResults] = useState({});    // questionId → { isCorrect, ... }
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [completion, setCompletion] = useState(null);

  // 진입 시 풀 콘텐츠 로드 + 세션 시작
  useEffect(() => {
    let mounted = true;
    setPhase("LOADING");
    apiPost(`/v1/learning/study/contents/${contentId}/full`, {})
      .then((d) => {
        if (!mounted) return;
        setData(d);
        setPhase("READING");
      })
      .catch((e) => {
        if (!mounted) return;
        setError(e.message || "콘텐츠를 불러올 수 없습니다");
        setPhase("READING");
      });
    return () => { mounted = false; };
  }, [contentId]);

  if (phase === "LOADING" && !data) {
    return (
      <div className="ss-shell">
        <div className="ss-loading">콘텐츠를 불러오는 중...</div>
      </div>
    );
  }
  if (error && !data) {
    return (
      <div className="ss-shell">
        <div className="ss-error">
          <p>{error}</p>
          <button className="ss-btn" onClick={() => navigate(-1)}>← 돌아가기</button>
        </div>
      </div>
    );
  }
  if (!data) return null;

  const pages = data.pages || [];
  const currentPage = pages[pageIdx] || null;
  const isLastPage = pageIdx >= pages.length - 1;

  // 현재 페이지의 모든 문제가 풀렸는지
  const pageQuestions = currentPage?.questions || [];
  const pageDone = pageQuestions.every((q) => results[q.id]);

  // 답안 제출 (선택지 ID 또는 userAnswer)
  const submitAnswer = async (q, { selectedChoiceId, userAnswer }) => {
    setSubmitting(true);
    try {
      const res = await apiPost(
        `/v1/learning/study/contents/${contentId}/submit-attempt`,
        {
          sessionId: data.sessionId,
          questionId: q.id,
          selectedChoiceId: selectedChoiceId || null,
          userAnswer: userAnswer || null,
        }
      );
      setResults({ ...results, [q.id]: res });
      setOpenQuestion(null);
    } catch (e) {
      alert("제출 실패: " + (e.message || ""));
    } finally {
      setSubmitting(false);
    }
  };

  // 다음 페이지
  const goNextPage = () => {
    if (!isLastPage) {
      setPageIdx(pageIdx + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      completeSession();
    }
  };

  const completeSession = async () => {
    setSubmitting(true);
    try {
      const res = await apiPost(
        `/v1/learning/study/contents/${contentId}/complete-session?logId=${data.logId}`,
        { sessionId: data.sessionId }
      );
      setCompletion(res);
      setPhase("DONE");
    } catch (e) {
      alert("완료 실패: " + (e.message || ""));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ss-shell">
      {/* 헤더 — 시험지 상단 */}
      <header className="ss-header">
        <button className="ss-back-btn" onClick={() => navigate(-1)}>← 나가기</button>
        <div className="ss-header-meta">
          <strong>{data.title}</strong>
          <span className="ss-header-sub">
            페이지 {pageIdx + 1} / {pages.length}
            {data.area && <span style={{ marginLeft: 10 }}>{data.area}{data.subArea ? ` · ${data.subArea}` : ""}</span>}
          </span>
        </div>
      </header>

      {phase === "DONE" && completion ? (
        <CompletionView completion={completion} onExit={() => navigate(-1)} />
      ) : (
        <main className="ss-paper">
          {!currentPage ? (
            <div className="ss-empty">페이지가 없습니다</div>
          ) : (
            <>
              {/* 본문 — 시험지 지문 박스 */}
              <section className="ss-passage">
                <header className="ss-passage-header">
                  <span className="ss-page-tag">P{currentPage.pageNo}</span>
                  {currentPage.title && <strong>{currentPage.title}</strong>}
                </header>
                <article className="ss-passage-body">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                    {currentPage.markdown}
                  </ReactMarkdown>
                </article>
              </section>

              {/* 문제 리스트 */}
              {pageQuestions.length > 0 && (
                <section className="ss-questions">
                  <h3>문제 ({pageQuestions.length})</h3>
                  <div className="ss-question-list">
                    {pageQuestions.map((q, i) => {
                      const r = results[q.id];
                      return (
                        <button
                          key={q.id}
                          className={`ss-question-row ${r ? (r.isCorrect ? "correct" : "wrong") : ""}`}
                          onClick={() => !r && setOpenQuestion(q)}
                          disabled={!!r}
                        >
                          <span className="ss-q-no">{q.questionNo || i + 1}</span>
                          <span className="ss-q-stem">{q.stem}</span>
                          <span className="ss-q-type">{typeLabel(q.questionType)}</span>
                          {r && (
                            <span className={`ss-q-mark ${r.isCorrect ? "correct" : "wrong"}`}>
                              {r.isCorrect ? "정답 ✓" : "오답 ✗"}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* 다음 / 완료 버튼 */}
              <div className="ss-page-actions">
                {!pageDone && pageQuestions.length > 0 ? (
                  <p style={{ color: "#5e7060", fontSize: 14 }}>
                    이 페이지의 모든 문제를 풀어주세요 ({Object.keys(results).filter(id => pageQuestions.some(q => q.id === id)).length}/{pageQuestions.length})
                  </p>
                ) : (
                  <button
                    className="ss-btn ss-btn-primary"
                    onClick={goNextPage}
                    disabled={submitting}
                  >
                    {isLastPage ? "🎯 학습 완료" : `다음 페이지 (P${pageIdx + 2}) →`}
                  </button>
                )}
              </div>
            </>
          )}
        </main>
      )}

      {/* 문제 풀이 모달 */}
      {openQuestion && (
        <QuestionSolverModal
          question={openQuestion}
          onClose={() => setOpenQuestion(null)}
          onSubmit={(payload) => submitAnswer(openQuestion, payload)}
          busy={submitting}
        />
      )}
    </div>
  );
}

function typeLabel(type) {
  return { MULTI_CHOICE: "객관식", OX: "OX", SHORT_ANSWER: "단답", ESSAY: "서술" }[type] || type;
}

/** 4유형 통합 풀이 모달 */
function QuestionSolverModal({ question, onClose, onSubmit, busy }) {
  const t = (question.questionType || "").toUpperCase();

  if (t === "MULTI_CHOICE" || t === "OX") {
    return (
      <ChoiceSolverModal
        question={question}
        onClose={onClose}
        onSubmit={(choiceId) => onSubmit({ selectedChoiceId: choiceId })}
        busy={busy}
        ox={t === "OX"}
      />
    );
  }
  if (t === "SHORT_ANSWER") {
    return (
      <SyllableCardModal
        question={question}
        onClose={onClose}
        onSubmit={(answer) => onSubmit({ userAnswer: answer })}
        busy={busy}
      />
    );
  }
  if (t === "ESSAY") {
    return (
      <EssayBlankFillModal
        question={question}
        onClose={onClose}
        onSubmit={(answer) => onSubmit({ userAnswer: answer })}
        busy={busy}
      />
    );
  }
  return null;
}

function ChoiceSolverModal({ question, onClose, onSubmit, busy, ox }) {
  const [picked, setPicked] = useState(null);
  const choices = question.choices || [];
  return (
    <div className="ssm-overlay" onClick={onClose}>
      <div className="ssm-modal" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ margin: 0, fontSize: 16, color: "#1f4a37" }}>
          {question.questionNo || "?"}번 {ox ? "OX" : "객관식"}
        </h3>
        <p style={{ margin: "8px 0 14px", fontSize: 14, color: "#1a2920", whiteSpace: "pre-wrap" }}>{question.stem}</p>

        {ox ? (
          <div className="ssm-ox-grid">
            {choices.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`ssm-ox-card ${picked === c.id ? "picked" : ""}`}
                onClick={() => setPicked(c.id)}
                disabled={busy}
              >
                {c.text}
              </button>
            ))}
          </div>
        ) : (
          <div className="ssm-choice-list">
            {choices.map((c, i) => (
              <button
                key={c.id}
                type="button"
                className={`ssm-choice ${picked === c.id ? "picked" : ""}`}
                onClick={() => setPicked(c.id)}
                disabled={busy}
              >
                <span className="ssm-choice-no">{i + 1}</span>
                <span className="ssm-choice-text">{c.text}</span>
              </button>
            ))}
          </div>
        )}

        <div className="ssm-actions">
          <button type="button" className="ssm-btn ssm-btn-ghost" onClick={onClose} disabled={busy}>닫기</button>
          <button
            type="button"
            className="ssm-btn ssm-btn-primary"
            onClick={() => onSubmit(picked)}
            disabled={!picked || busy}
          >
            {busy ? "채점 중..." : "제출"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CompletionView({ completion, onExit }) {
  return (
    <div className="ss-completion">
      <h2>🎉 학습 완료!</h2>
      <div className="ss-completion-stats">
        <div><span>정답</span><strong>{completion.totalCorrect} / {completion.totalAttempted}</strong></div>
        <div><span>정답률</span><strong>{Math.round((completion.accuracy || 0) * 100)}%</strong></div>
        <div><span>획득 씨앗</span><strong>{completion.earnedSeed || 0}</strong></div>
      </div>
      {completion.weaknessHint?.length > 0 && (
        <div className="ss-weak-hint">
          <strong>약점 영역</strong>
          <ul>{completion.weaknessHint.map((w, i) => <li key={i}>{w}</li>)}</ul>
        </div>
      )}
      <button className="ss-btn ss-btn-primary" onClick={onExit}>학습 목록으로</button>
    </div>
  );
}
