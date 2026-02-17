import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useEngine } from "../core/EngineContext";
import PdfPageViewer from "./PdfPageViewer";
import QuestionModal from "../shared/QuestionModal";
import { apiPost } from "../../utils/api";
import "../../styles/content-pdf.css";

const getScoring = (question) => {
  const s = question?.scoring;
  if (!s) return { correctDeltaSec: 0, wrongDeltaSec: 0 };
  return {
    correctDeltaSec: s.correctDeltaSec ?? s.correct ?? 0,
    wrongDeltaSec: s.wrongDeltaSec ?? s.wrong ?? 0,
  };
};

const renderTemplate = (template, blanks, filled, activeIndex) => {
  const parts = template.split("____");
  return parts.map((part, idx) => (
    <span key={`part-${idx}`}>
      {part}
      {idx < blanks.length ? (
        <span
          className={`worksheet-blank ${idx === activeIndex ? "active" : ""}`}
        >
          {filled[idx] || "____"}
        </span>
      ) : null}
    </span>
  ));
};

const renderTemplatePlain = (template, blanks) => {
  const parts = template.split("____");
  return parts.map((part, idx) => (
    <span key={`plain-${idx}`}>
      {part}
      {idx < blanks.length ? <span className="worksheet-blank">____</span> : null}
    </span>
  ));
};

const renderHighlightedText = (text, highlight) => {
  if (!highlight) return text;
  if (highlight.range) {
    const before = text.slice(0, highlight.range.start);
    const target = text.slice(highlight.range.start, highlight.range.end);
    const after = text.slice(highlight.range.end);
    return (
      <>
        {before}
        <span className="worksheet-highlight">{target}</span>
        {after}
      </>
    );
  }
  if (highlight.text) {
    const parts = text.split(highlight.text);
    if (parts.length === 1) return text;
    return parts.reduce((acc, part, idx) => {
      acc.push(part);
      if (idx < parts.length - 1) {
        acc.push(
          <span key={`hl-${idx}`} className="worksheet-highlight">
            {highlight.text}
          </span>
        );
      }
      return acc;
    }, []);
  }
  return text;
};

const renderPassageBox = (passage) => {
  if (!passage) return null;
  return <span className="worksheet-passage-box">{passage}</span>;
};

function ContentPdfModule({ content }) {
  const { status, start, adjustTime, recordAnswer, finish, setPageProgress } = useEngine();
  const payload = content?.payload || {};
  const pdfUrl = useMemo(() => {
    const url = payload.pdfUrl;
    if (!url) return "";
    if (/^(https?:|data:|blob:)/.test(url)) return url;
    const base = import.meta.env.BASE_URL || "/";
    const normalized = url.startsWith("/") ? url.slice(1) : url;
    return `${base}${normalized}`;
  }, [payload.pdfUrl]);
  const pagesData = payload.pages || [];
  const totalContentPages = payload.totalPages || pagesData.length || 0;
  const startPage = content?._startPage || 1;
  const farmLogId = content?._farmLogId;

  const [showingPdf, setShowingPdf] = useState(!!pdfUrl);
  const [showPdfPopup, setShowPdfPopup] = useState(false);
  const [currentContentPage, setCurrentContentPage] = useState(startPage);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [blankIndex, setBlankIndex] = useState(0);
  const [blankAnswers, setBlankAnswers] = useState({});
  const [blankResultMap, setBlankResultMap] = useState({});
  const [lastResult, setLastResult] = useState(null);
  const [statusMap, setStatusMap] = useState({});
  const [itemHeights, setItemHeights] = useState([]);
  const [anchorRect, setAnchorRect] = useState(null);
  const measureRef = useRef(null);
  const itemRefs = useRef({});
  const advanceTimerRef = useRef(null);
  const resultTimerRef = useRef(null);
  const feedbackDelay = 420;

  const columnHeight = 1123 - 48;
  const itemGap = 14;

  // 현재 콘텐츠 페이지의 questions 추출
  const currentPageData =
    pagesData.find((p) => p.pageNo === currentContentPage) ||
    pagesData[currentContentPage - 1];
  const questions = currentPageData?.questions || [];
  const currentQuestion = questions[currentIndex];

  const normalizedQuestion = useMemo(() => {
    if (!currentQuestion) return null;
    if (currentQuestion.type !== "SENTENCE_BUILDING") return currentQuestion;
    const parts = currentQuestion.sentenceParts || [];
    const template = parts.map(() => "____").join(" ");
    const blanks = parts.map((part, idx) => ({
      id: `sb-${currentQuestion.id}-${idx}`,
      answerId: `answer-${idx}`,
      choices: [
        { id: `answer-${idx}`, text: part.answer },
        ...part.distractors.map((text, dIdx) => ({
          id: `distractor-${idx}-${dIdx}`,
          text,
        })),
      ],
    }));
    return { ...currentQuestion, type: "FILL_BLANKS", template, blanks };
  }, [currentQuestion]);

  const isFillBlanks = normalizedQuestion?.type === "FILL_BLANKS";
  const blanks = normalizedQuestion?.blanks || [];
  const filled = blanks.map((blank) => blankAnswers[blank.id]);

  // 높이 측정용 아이템
  const measureItems = useMemo(
    () =>
      questions.map((question, idx) => {
        const isBlank =
          question.type === "FILL_BLANKS" ||
          question.type === "SENTENCE_BUILDING";
        const blankList =
          question.type === "SENTENCE_BUILDING"
            ? (question.sentenceParts || []).map((_, i) => ({
                id: `sb-measure-${i}`,
              }))
            : question.blanks || [];
        const template =
          question.type === "SENTENCE_BUILDING"
            ? (question.sentenceParts || []).map(() => "____").join(" ")
            : question.template || "";
        let contentText = question.stem || question.prompt || "";
        const passageNode = renderPassageBox(question.passage);
        if (isBlank) {
          contentText = renderTemplatePlain(template, blankList);
        }
        return (
          <li key={`measure-${question.id}`} className="worksheet-item">
            <span className="worksheet-item-number">{idx + 1}.</span>
            <span className="worksheet-item-text">
              {passageNode}
              {contentText}
            </span>
          </li>
        );
      }),
    [questions]
  );

  useLayoutEffect(() => {
    if (!measureRef.current) return;
    const nodes = Array.from(
      measureRef.current.querySelectorAll(".worksheet-item")
    );
    if (!nodes.length) return;
    setItemHeights(nodes.map((node) => node.getBoundingClientRect().height));
  }, [measureItems]);

  // 2단 레이아웃 페이지 분할
  const pages = useMemo(() => {
    if (!questions.length) return [];
    if (itemHeights.length !== questions.length) {
      return [{ left: questions.map((_, idx) => idx), right: [] }];
    }
    const result = [];
    let left = [];
    let right = [];
    let leftHeight = 0;
    let rightHeight = 0;
    itemHeights.forEach((height, idx) => {
      const leftExtra = left.length > 0 ? itemGap : 0;
      if (leftHeight + height + leftExtra <= columnHeight || left.length === 0) {
        left.push(idx);
        leftHeight += height + leftExtra;
        return;
      }
      const rightExtra = right.length > 0 ? itemGap : 0;
      if (
        rightHeight + height + rightExtra <= columnHeight ||
        right.length === 0
      ) {
        right.push(idx);
        rightHeight += height + rightExtra;
        return;
      }
      result.push({ left, right });
      left = [idx];
      right = [];
      leftHeight = height;
      rightHeight = 0;
    });
    if (left.length || right.length) {
      result.push({ left, right });
    }
    return result;
  }, [itemHeights, questions.length, columnHeight, itemGap]);

  // 페이지 완료 API 호출
  const reportPageComplete = () => {
    apiPost("/v1/learning/farm/page-complete", {
      logId: farmLogId || "",
      contentId: content?.contentId || "",
      pageNo: currentContentPage,
    }).catch((e) => console.error(e));
  };

  const handleNext = () => {
    if (currentIndex >= questions.length - 1) {
      // 현재 콘텐츠 페이지 완료
      reportPageComplete();

      if (currentContentPage >= totalContentPages) {
        finish(true);
      } else {
        // 다음 페이지로 전환 (상태 리셋)
        setCurrentContentPage((prev) => prev + 1);
        setCurrentIndex(0);
        setStatusMap({});
        setBlankIndex(0);
        setBlankAnswers({});
        setBlankResultMap({});
        setLastResult(null);
        setItemHeights([]);
        if (pdfUrl) setShowingPdf(true);
      }
      return;
    }
    setCurrentIndex((prev) => prev + 1);
    setBlankIndex(0);
    setBlankAnswers({});
    setBlankResultMap({});
    setLastResult(null);
  };

  const queueResultReset = () => {
    if (resultTimerRef.current) clearTimeout(resultTimerRef.current);
    resultTimerRef.current = setTimeout(() => {
      setLastResult(null);
    }, feedbackDelay);
  };

  const queueNext = (nextAction) => {
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    advanceTimerRef.current = setTimeout(() => {
      nextAction();
    }, feedbackDelay);
  };

  const handleChoice = (choiceId) => {
    if (!normalizedQuestion) return;
    const scoring = getScoring(normalizedQuestion);
    const isCorrect = choiceId === normalizedQuestion.answerId;
    adjustTime(isCorrect ? scoring.correctDeltaSec : scoring.wrongDeltaSec);
    recordAnswer({
      id: normalizedQuestion.id,
      correct: isCorrect,
      pageNo: currentContentPage,
    });
    setLastResult(isCorrect ? "correct" : "wrong");
    queueResultReset();
    setStatusMap((prev) => ({
      ...prev,
      [normalizedQuestion.id]: isCorrect ? "correct" : "wrong",
    }));
    if (!isCorrect && normalizedQuestion.requireCorrect) {
      return;
    }
    queueNext(handleNext);
  };

  const handleBlankChoice = (choiceId) => {
    if (!normalizedQuestion) return;
    const blank = blanks[blankIndex];
    const scoring = getScoring(normalizedQuestion);
    const isCorrect = choiceId === blank.answerId;
    const correctChoice = blank.choices?.find(
      (choice) => choice.id === blank.answerId
    );
    const correctText = correctChoice?.text || "";
    adjustTime(isCorrect ? scoring.correctDeltaSec : scoring.wrongDeltaSec);
    recordAnswer({
      id: `${normalizedQuestion.id}-${blank.id}`,
      correct: isCorrect,
      pageNo: currentContentPage,
    });
    setBlankAnswers((prev) => ({ ...prev, [blank.id]: correctText }));
    setBlankResultMap((prev) => ({
      ...prev,
      [blank.id]: isCorrect,
    }));
    setLastResult(isCorrect ? "correct" : "wrong");
    queueResultReset();
    if (blankIndex >= blanks.length - 1) {
      const resultMap = {
        ...blankResultMap,
        [blank.id]: isCorrect,
      };
      const allCorrect = blanks.every((item) => resultMap[item.id]);
      setStatusMap((prev) => ({
        ...prev,
        [normalizedQuestion.id]: allCorrect ? "correct" : "wrong",
      }));
      queueNext(handleNext);
    } else {
      queueNext(() => setBlankIndex((prev) => prev + 1));
    }
  };

  // PDF 다 읽었습니다
  const handleDoneReading = () => {
    setShowingPdf(false);
    if (status === "READY") start();
  };

  // 자동 시작 (PDF 없는 경우)
  useEffect(() => {
    if (!showingPdf && status === "READY") {
      start();
    }
  }, [showingPdf, status, start]);

  // 모달 위치 계산
  useLayoutEffect(() => {
    const node = itemRefs.current[currentIndex];
    if (!node) return;
    const container = node.closest(".engine-body");
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    const scale = containerRect.width / container.offsetWidth || 1;
    const highlightNode =
      node.querySelector(".worksheet-highlight") ||
      node.querySelector(".worksheet-blank.active");
    const rect = (highlightNode || node).getBoundingClientRect();
    setAnchorRect({
      left: (rect.left - containerRect.left) / scale,
      right: (rect.right - containerRect.left) / scale,
      top: (rect.top - containerRect.top) / scale,
      height: rect.height / scale,
    });
  }, [currentIndex, pages.length]);

  // 페이지 진행도를 EngineShell footer에 전달
  useEffect(() => {
    if (totalContentPages > 1 && setPageProgress) {
      setPageProgress({ current: currentContentPage, total: totalContentPages });
    }
    return () => {
      if (setPageProgress) setPageProgress(null);
    };
  }, [currentContentPage, totalContentPages, setPageProgress]);

  // 클린업
  useEffect(
    () => () => {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
      if (resultTimerRef.current) clearTimeout(resultTimerRef.current);
    },
    []
  );

  // 아이템 렌더 헬퍼
  const renderItem = (idx) => {
    const question = questions[idx];
    const isActive = idx === currentIndex;
    const qStatus = statusMap[question.id];
    const isBlank =
      question.type === "FILL_BLANKS" ||
      question.type === "SENTENCE_BUILDING";
    const blankList =
      isActive && isBlank
        ? blanks
        : question.type === "SENTENCE_BUILDING"
          ? (question.sentenceParts || []).map((_, i) => ({
              id: `sb-${question.id}-${i}`,
            }))
          : question.blanks || [];
    const template =
      question.type === "SENTENCE_BUILDING"
        ? (question.sentenceParts || []).map(() => "____").join(" ")
        : question.template || "";
    const filledValues = isActive
      ? blankList.map((blank) => blankAnswers[blank.id])
      : [];
    const activeBlankIndex = isActive ? blankIndex : -1;
    const passageNode = renderPassageBox(question.passage);
    let itemContent = null;
    if (isBlank) {
      itemContent = isActive
        ? renderTemplate(template, blankList, filledValues, activeBlankIndex)
        : renderTemplatePlain(template, blankList);
    } else {
      itemContent = isActive
        ? renderHighlightedText(
            question.stem || question.prompt || "",
            question.highlight
          )
        : question.stem || question.prompt || "";
    }

    return (
      <li
        key={question.id}
        ref={(el) => {
          if (el) itemRefs.current[idx] = el;
        }}
        className={`worksheet-item ${isActive ? "active" : ""} ${
          qStatus ? `done ${qStatus}` : ""
        }`}
      >
        <span className="worksheet-item-number">
          {idx + 1}.
          {qStatus ? (
            <span className={`worksheet-number-mark ${qStatus}`}>
              {qStatus === "correct" ? "\u25CB" : "\uFF0F"}
            </span>
          ) : null}
        </span>
        <span className="worksheet-item-text">
          {passageNode}
          {itemContent}
        </span>
      </li>
    );
  };

  if (showingPdf) {
    return (
      <div className="cpdf-module">
        <div className="cpdf-status-bar">
          <span className="cpdf-page-indicator">
            {currentContentPage} / {totalContentPages} 페이지
          </span>
          <span className="cpdf-phase-label">PDF 읽기</span>
        </div>
        <PdfPageViewer pdfUrl={pdfUrl} pageNo={currentContentPage} />
        <div className="cpdf-actions">
          <button type="button" className="cpdf-btn cpdf-btn-primary" onClick={handleDoneReading}>
            다 읽었습니다
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="worksheet-module">
      <div className="worksheet-sheet">
        <div className="worksheet-stem">
          <div className="worksheet-pages">
            {pages.map((page, pageIndex) => (
              <div
                className={
                  pages.length > 1
                    ? "worksheet-page"
                    : "worksheet-page single"
                }
                key={`page-${pageIndex}`}
              >
                <div className="worksheet-page-inner">
                  <div className="worksheet-page-number">
                    {pageIndex + 1} / {pages.length}
                  </div>
                  <div className="worksheet-columns">
                    <ol className="worksheet-list">
                      {page.left.map((idx) => renderItem(idx))}
                    </ol>
                    <ol className="worksheet-list">
                      {page.right.map((idx) => renderItem(idx))}
                    </ol>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="worksheet-controls">
          {pdfUrl ? (
            <button
              type="button"
              className="worksheet-pdf-btn"
              onClick={() => setShowPdfPopup(true)}
            >
              PDF 보기
            </button>
          ) : null}
          {totalContentPages > 1 ? (
            <span className="cpdf-page-badge">
              {currentContentPage} / {totalContentPages} 페이지
            </span>
          ) : null}
          <span>
            {currentIndex + 1} / {questions.length}
          </span>
        </div>
      </div>

      {normalizedQuestion && normalizedQuestion.type !== "FILL_BLANKS" ? (
        <QuestionModal
          title="문제"
          prompt={normalizedQuestion.prompt || normalizedQuestion.stem}
          choices={normalizedQuestion.choices || []}
          onSelect={handleChoice}
          anchorRect={anchorRect}
          mark={lastResult}
          shuffleKey={normalizedQuestion.id}
        />
      ) : null}

      {isFillBlanks ? (
        <QuestionModal
          title="빈칸 채우기"
          prompt={`${blankIndex + 1}번째 빈칸을 선택하세요.`}
          choices={blanks[blankIndex]?.choices || []}
          onSelect={handleBlankChoice}
          anchorRect={anchorRect}
          mark={lastResult}
          shuffleKey={`${normalizedQuestion?.id || "blank"}-${blankIndex}`}
        />
      ) : null}

      {showPdfPopup ? (
        <div className="worksheet-pdf-overlay">
          <div className="worksheet-pdf-card">
            <PdfPageViewer pdfUrl={pdfUrl} pageNo={currentContentPage} />
            <button type="button" onClick={() => setShowPdfPopup(false)}>
              보기 종료
            </button>
          </div>
        </div>
      ) : null}

      <div className="worksheet-measure" ref={measureRef} aria-hidden="true">
        <ol className="worksheet-list">{measureItems}</ol>
      </div>
    </div>
  );
}

export default ContentPdfModule;
