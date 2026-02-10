import { useEffect, useMemo, useRef, useState } from "react";
import { useEngine } from "../core/EngineContext";
import PdfPageViewer from "./PdfPageViewer";
import SeedExhaustedModal from "./SeedExhaustedModal";
import QuestionModal from "../shared/QuestionModal";
import { apiPost } from "../../utils/api";
import "../../styles/content-pdf.css";

const getScoring = (question) => {
  const s = question?.scoring;
  if (!s) return { correctDeltaSec: 20, wrongDeltaSec: -20 };
  return {
    correctDeltaSec: s.correctDeltaSec ?? 20,
    wrongDeltaSec: s.wrongDeltaSec ?? -20,
  };
};

// 상태: LOADING_PDF → PDF_VIEW → QUIZ → PAGE_RESULT → ... → SESSION_COMPLETE
//                                 ↑         ↑
//                                 └── SEED_EXHAUSTED (재도전/다음 선택)

function ContentPdfModule({ content }) {
  const {
    status, start, pause, resume, adjustTime, recordAnswer, finish,
    seed, setSeed, seedExhausted, resetRound,
  } = useEngine();

  const payload = content?.payload || {};
  const pdfUrl = useMemo(() => {
    const url = payload.pdfUrl;
    if (!url) return "";
    if (/^(https?:|data:|blob:)/.test(url)) return url;
    const base = import.meta.env.BASE_URL || "/";
    const normalized = url.startsWith("/") ? url.slice(1) : url;
    return `${base}${normalized}`;
  }, [payload.pdfUrl]);
  const totalPages = payload.totalPages || payload.pages?.length || 0;
  const pagesData = payload.pages || [];

  const startPage = content?._startPage || 1;

  // 상태
  const [phase, setPhase] = useState("LOADING_PDF");
  const [currentPage, setCurrentPage] = useState(startPage);
  const [pdfNumPages, setPdfNumPages] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [pageCorrect, setPageCorrect] = useState(0);
  const [pageWrong, setPageWrong] = useState(0);
  const [pageResults, setPageResults] = useState([]);
  const [lastResult, setLastResult] = useState(null);
  const [isReread, setIsReread] = useState(false);
  const [savedQuestionIndex, setSavedQuestionIndex] = useState(0);
  // 빈칸 채우기 state
  const [blankIndex, setBlankIndex] = useState(0);
  const [blankAnswers, setBlankAnswers] = useState({});
  const feedbackTimer = useRef(null);
  const farmLogId = content?._farmLogId;

  const currentPageData = pagesData.find((p) => p.pageNo === currentPage) || pagesData[currentPage - 1];
  const questions = currentPageData?.questions || [];
  const currentQuestion = questions[questionIndex];
  const isLastPage = currentPage >= totalPages;

  // 빈칸 정규화
  const normalizedQuestion = useMemo(() => {
    if (!currentQuestion) return null;
    if (currentQuestion.type !== "FILL_BLANKS") return currentQuestion;
    return currentQuestion;
  }, [currentQuestion]);

  const isFillBlanks = normalizedQuestion?.type === "FILL_BLANKS";
  const blanks = normalizedQuestion?.blanks || [];

  // PDF 로드 완료
  const handlePdfReady = (numPages) => {
    setPdfNumPages(numPages);
    setPhase("PDF_VIEW");
  };

  // PDF 다 읽었습니다 버튼
  const handleDoneReading = () => {
    if (isReread) {
      // 재읽기에서 돌아옴 - 문제 진행 유지
      setIsReread(false);
      setQuestionIndex(savedQuestionIndex);
      setPhase("QUIZ");
      resume();
      return;
    }
    setQuestionIndex(0);
    setPageCorrect(0);
    setPageWrong(0);
    setBlankIndex(0);
    setBlankAnswers({});
    setPhase("QUIZ");
    start();
  };

  // 다시 읽기 버튼 (퀴즈 중)
  const handleReread = () => {
    if (seed <= 0) return;
    setSavedQuestionIndex(questionIndex);
    setSeed((prev) => prev - 1);
    pause();
    setIsReread(true);
    setPhase("PDF_VIEW");
  };

  // 퀴즈 선택지 핸들
  const handleChoice = (choiceId) => {
    if (!normalizedQuestion) return;
    const scoring = getScoring(normalizedQuestion);
    const isCorrect = choiceId === normalizedQuestion.answerId;
    adjustTime(isCorrect ? scoring.correctDeltaSec : scoring.wrongDeltaSec);
    recordAnswer({ id: normalizedQuestion.id, correct: isCorrect, pageNo: currentPage });

    if (isCorrect) {
      setPageCorrect((prev) => prev + 1);
    } else {
      setPageWrong((prev) => prev + 1);
    }

    setLastResult(isCorrect ? "correct" : "wrong");
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => {
      setLastResult(null);
      // 다음 문제 또는 페이지 결과
      if (questionIndex >= questions.length - 1) {
        handlePageComplete();
      } else {
        setQuestionIndex((prev) => prev + 1);
        setBlankIndex(0);
        setBlankAnswers({});
      }
    }, 450);
  };

  // 빈칸 채우기 핸들
  const handleBlankChoice = (choiceId) => {
    if (!normalizedQuestion) return;
    const blank = blanks[blankIndex];
    const scoring = getScoring(normalizedQuestion);
    const isCorrect = choiceId === blank.answerId;
    const correctChoice = blank.choices?.find((c) => c.id === blank.answerId);
    adjustTime(isCorrect ? scoring.correctDeltaSec : scoring.wrongDeltaSec);
    recordAnswer({ id: `${normalizedQuestion.id}-${blank.id}`, correct: isCorrect, pageNo: currentPage });

    if (isCorrect) {
      setPageCorrect((prev) => prev + 1);
    } else {
      setPageWrong((prev) => prev + 1);
    }

    setBlankAnswers((prev) => ({ ...prev, [blank.id]: correctChoice?.text || "" }));
    setLastResult(isCorrect ? "correct" : "wrong");

    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => {
      setLastResult(null);
      if (blankIndex >= blanks.length - 1) {
        // 이 문제 완료
        if (questionIndex >= questions.length - 1) {
          handlePageComplete();
        } else {
          setQuestionIndex((prev) => prev + 1);
          setBlankIndex(0);
          setBlankAnswers({});
        }
      } else {
        setBlankIndex((prev) => prev + 1);
      }
    }, 450);
  };

  // 페이지 완료 처리
  const handlePageComplete = () => {
    pause();
    const total = pageCorrect + pageWrong + 1; // +1 현재 문제 포함
    const correct = pageCorrect + (lastResult === "correct" ? 1 : 0);
    const totalQ = questions.length;
    // 빈칸 문제의 경우 blanks 개수만큼 기록이 나뉘므로 질문 수 기준으로 계산
    const accuracy = totalQ > 0 ? Math.round((correct / totalQ) * 100) : 0;
    const earnedSeed = accuracy >= 70 ? seed : 0;
    const seedType = content?.seedReward?.seedType?.toLowerCase();
    const seedTypeMapping = {
      wheat: "seed_wheat",
      rice: "seed_rice",
      corn: "seed_corn",
      grape: "seed_grape",
      apple: "seed_apple",
    };
    const normalizedSeedType = seedTypeMapping[seedType] || `seed_${seedType}` || "seed_rice";

    const result = {
      pageNo: currentPage,
      correct: pageCorrect,
      wrong: pageWrong,
      accuracy,
      earnedSeed,
    };
    setPageResults((prev) => [...prev, result]);

    // 서버에 페이지 완료 보고
    apiPost("/v1/learning/farm/page-complete", {
      logId: farmLogId || "",
      contentId: content?.contentId || "",
      pageNo: currentPage,
      score: accuracy,
      accuracy,
      earnedSeed,
      seedType: earnedSeed > 0 ? normalizedSeedType : null,
    }).catch(() => {});

    setPhase("PAGE_RESULT");
  };

  // 다음 페이지로
  const handleNextPage = () => {
    if (isLastPage) {
      handleSessionComplete();
      return;
    }
    setCurrentPage((prev) => prev + 1);
    resetRound();
    setQuestionIndex(0);
    setPageCorrect(0);
    setPageWrong(0);
    setBlankIndex(0);
    setBlankAnswers({});
    setIsReread(false);
    setPhase("PDF_VIEW");
  };

  // 세션 완료
  const handleSessionComplete = () => {
    setPhase("SESSION_COMPLETE");
    const totalEarned = pageResults.reduce((sum, r) => sum + r.earnedSeed, 0);
    finish(true, { seed: totalEarned });
  };

  // seedExhausted 감지
  useEffect(() => {
    if (seedExhausted && phase === "QUIZ") {
      setPhase("SEED_EXHAUSTED");
    }
  }, [seedExhausted, phase]);

  // 씨앗 소진 - 재도전
  const handleRetry = () => {
    resetRound();
    setQuestionIndex(0);
    setPageCorrect(0);
    setPageWrong(0);
    setBlankIndex(0);
    setBlankAnswers({});
    setPhase("QUIZ");
    start();
  };

  // 씨앗 소진 - 다음 페이지
  const handleExhaustedNext = () => {
    const result = {
      pageNo: currentPage,
      correct: pageCorrect,
      wrong: pageWrong,
      accuracy: 0,
      earnedSeed: 0,
    };
    setPageResults((prev) => [...prev, result]);
    if (isLastPage) {
      handleSessionComplete();
      return;
    }
    setCurrentPage((prev) => prev + 1);
    resetRound();
    setQuestionIndex(0);
    setPageCorrect(0);
    setPageWrong(0);
    setBlankIndex(0);
    setBlankAnswers({});
    setIsReread(false);
    setPhase("PDF_VIEW");
  };

  // 클린업
  useEffect(() => {
    return () => {
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    };
  }, []);

  // 렌더 빈칸 템플릿
  const renderFillTemplate = () => {
    if (!normalizedQuestion?.template) return null;
    const parts = normalizedQuestion.template.split("____");
    return (
      <div className="cpdf-fill-template">
        {parts.map((part, idx) => (
          <span key={`ft-${idx}`}>
            {part}
            {idx < blanks.length ? (
              <span className={`cpdf-fill-blank ${idx === blankIndex ? "active" : ""} ${blankAnswers[blanks[idx]?.id] ? "filled" : ""}`}>
                {blankAnswers[blanks[idx]?.id] || "____"}
              </span>
            ) : null}
          </span>
        ))}
      </div>
    );
  };

  // === 렌더링 ===

  if (phase === "LOADING_PDF") {
    return (
      <div className="cpdf-module">
        <PdfPageViewer pdfUrl={pdfUrl} pageNo={1} onReady={handlePdfReady} />
      </div>
    );
  }

  if (phase === "PDF_VIEW") {
    return (
      <div className="cpdf-module">
        <div className="cpdf-status-bar">
          <span className="cpdf-page-indicator">{currentPage} / {totalPages} 페이지</span>
          <span className="cpdf-phase-label">{isReread ? "다시 읽기" : "PDF 읽기"}</span>
        </div>
        <PdfPageViewer pdfUrl={pdfUrl} pageNo={currentPage} />
        <div className="cpdf-actions">
          <button type="button" className="cpdf-btn cpdf-btn-primary" onClick={handleDoneReading}>
            다 읽었습니다
          </button>
        </div>
      </div>
    );
  }

  if (phase === "QUIZ") {
    return (
      <div className="cpdf-module">
        <div className="cpdf-status-bar">
          <span className="cpdf-page-indicator">{currentPage} / {totalPages} 페이지</span>
          <span className="cpdf-phase-label">
            퀴즈 {questionIndex + 1} / {questions.length}
          </span>
        </div>
        <div className="cpdf-quiz-area">
          {normalizedQuestion && (
            <div className="cpdf-question-card">
              <div className="cpdf-question-stem">
                <span className="cpdf-question-number">{questionIndex + 1}.</span>
                {isFillBlanks ? renderFillTemplate() : (normalizedQuestion.stem || normalizedQuestion.prompt)}
              </div>
              {/* 4지선다는 QuestionModal로 처리 */}
            </div>
          )}
        </div>
        <div className="cpdf-actions">
          <button
            type="button"
            className="cpdf-btn cpdf-btn-reread"
            onClick={handleReread}
            disabled={seed <= 0}
          >
            다시 읽기 (씨앗 -1)
          </button>
        </div>

        {/* 4지선다 모달 */}
        {normalizedQuestion && normalizedQuestion.type === "MULTI_CHOICE" && (
          <QuestionModal
            title="문제"
            prompt={normalizedQuestion.stem || normalizedQuestion.prompt}
            choices={normalizedQuestion.choices || []}
            onSelect={handleChoice}
            mark={lastResult}
            shuffleKey={normalizedQuestion.id}
          />
        )}

        {/* 빈칸 채우기 모달 */}
        {isFillBlanks && blanks[blankIndex] && (
          <QuestionModal
            title="빈칸 채우기"
            prompt={`${blankIndex + 1}번째 빈칸을 선택하세요.`}
            choices={blanks[blankIndex]?.choices || []}
            onSelect={handleBlankChoice}
            mark={lastResult}
            shuffleKey={`${normalizedQuestion?.id}-${blankIndex}`}
          />
        )}
      </div>
    );
  }

  if (phase === "PAGE_RESULT") {
    const latestResult = pageResults[pageResults.length - 1];
    const accuracy = latestResult?.accuracy || 0;
    const earnedSeed = latestResult?.earnedSeed || 0;
    return (
      <div className="cpdf-module">
        <div className="cpdf-status-bar">
          <span className="cpdf-page-indicator">{currentPage} / {totalPages} 페이지</span>
          <span className="cpdf-phase-label">결과</span>
        </div>
        <div className="cpdf-page-result">
          <div className={`cpdf-result-accuracy ${accuracy < 70 ? "fail" : ""}`}>
            {accuracy}%
          </div>
          <div className="cpdf-result-detail">
            정답 {latestResult?.correct || 0}개 / 오답 {latestResult?.wrong || 0}개
          </div>
          {earnedSeed > 0 ? (
            <div className="cpdf-result-seed">
              씨앗 {earnedSeed}개 획득!
            </div>
          ) : (
            <div className="cpdf-result-detail" style={{ color: "#c00" }}>
              70% 이상 정답 시 씨앗을 획득합니다.
            </div>
          )}
          <div className="cpdf-actions">
            {isLastPage ? (
              <button type="button" className="cpdf-btn cpdf-btn-primary" onClick={handleSessionComplete}>
                학습 완료
              </button>
            ) : (
              <button type="button" className="cpdf-btn cpdf-btn-primary" onClick={handleNextPage}>
                다음 페이지
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (phase === "SEED_EXHAUSTED") {
    return (
      <div className="cpdf-module">
        <SeedExhaustedModal
          onRetry={handleRetry}
          onNextPage={handleExhaustedNext}
          isLastPage={isLastPage}
        />
      </div>
    );
  }

  if (phase === "SESSION_COMPLETE") {
    const totalEarned = pageResults.reduce((sum, r) => sum + r.earnedSeed, 0);
    return (
      <div className="cpdf-module">
        <div className="cpdf-session-complete">
          <h2 className="cpdf-session-title">학습 완료</h2>
          <div className="cpdf-session-stats">
            <div className="cpdf-stat-item">
              <span className="cpdf-stat-value">{pageResults.length}</span>
              <span className="cpdf-stat-label">완료 페이지</span>
            </div>
            <div className="cpdf-stat-item">
              <span className="cpdf-stat-value">{totalEarned}</span>
              <span className="cpdf-stat-label">총 획득 씨앗</span>
            </div>
          </div>
          <div className="cpdf-page-list">
            {pageResults.map((r) => (
              <div key={r.pageNo} className="cpdf-page-list-item">
                <span>{r.pageNo}페이지</span>
                <span>정확도 {r.accuracy}% · 씨앗 {r.earnedSeed}개</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default ContentPdfModule;
