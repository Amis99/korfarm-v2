import { useLayoutEffect, useMemo, useRef, useState } from "react";
import RichText from "../../utils/RichText";
import PassageMarkdown from "../../utils/PassageMarkdown";
import QuestionModal from "./QuestionModal";
import { FEEDBACK } from "./feedbackTimings";
import { replaceChoiceLetters } from "../../utils/explanationLetters";

// 선택지 원문자 — 종이 시험지 컨셉
const CIRCLED_NUMS = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩"];
const choiceLabel = (i) => CIRCLED_NUMS[i] ?? `${i + 1}`;

/**
 * 누적형(C형) 학습 모듈용 공통 문제 카드 — 시험지 컨셉.
 *
 * 동작:
 *   - 활성(isActive && !completion) → 시험지에 [번호+발문 → 지문 → 보기]만 노출,
 *     하이라이트/문제 영역 클릭 시 QuestionModal에서 선택지 풀이
 *   - 완료(completion 있음) → 시험지에 [선택지 + 빨간 첨삭 ○/✗ + 해설(Gaegu)]까지 누적
 *
 * Props:
 *   question: { id, stem|prompt, passage, choices: [{id, text}], answerId, explanation, 보기? examples? }
 *   idx: 0부터 시작하는 인덱스
 *   total: 전체 문제 수
 *   completion: { selectedId, isCorrect } | undefined — 푼 문제는 정답·해설 표시
 *   isActive: 현재 활성 문제이면 클릭 가능한 문제로 표시
 *   onSelect(choiceId): 선택지 클릭 콜백 (모달 또는 카드 내부)
 *   variant: "default" | "wide"
 *   modalTitle: 모달 제목 (기본 "문제")
 *   lastResult: "correct" | "wrong" | null — 모달 mark 표시
 *   feedbackDuration: 모달 피드백 지속 시간 (ms)
 *   anchorRect: 모달 위치 앵커 (옵션)
 *   showModal: 클릭 시 모달 노출 여부 (기본 true). false면 카드 안에 선택지 표시(레거시)
 */
export default function CumulativeQuestionCard({
  question,
  idx,
  total,
  completion,
  isActive,
  onSelect,
  variant = "default",
  modalTitle = "문제",
  lastResult = null,
  feedbackDuration,
  showModal = true,
}) {
  const cardRef = useRef(null);
  const [modalKey, setModalKey] = useState(null);
  // 카드의 .engine-body 내부 좌표 — 활성 시 한 번 측정해서 모달 첫 위치 anchor로 사용.
  // 사용자가 드래그하면 그 위치 유지. 카드가 스크롤되어도 모달은 그 자리.
  const [cardAnchorRect, setCardAnchorRect] = useState(null);

  useLayoutEffect(() => {
    if (!isActive || !cardRef.current) return;
    const card = cardRef.current;
    // 활성 카드 상단을 화면 상단으로 자동 스크롤 (이후 수동 스크롤 가능)
    try {
      card.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch {
      // 일부 구형 브라우저 fallback
      card.scrollIntoView();
    }
    // viewport 기준 좌표 — 모달이 document.body에 fixed로 떠 있으므로 동일 좌표계
    // 스크롤 직후 측정해야 정확하므로 약간의 지연 후 측정
    const measure = () => {
      if (!cardRef.current) return;
      const cardRect = cardRef.current.getBoundingClientRect();
      setCardAnchorRect({
        left: cardRect.left,
        right: cardRect.right,
        top: cardRect.top,
        height: cardRect.height,
      });
    };
    measure();
    const t = setTimeout(measure, 350);  // smooth scroll 완료 후 재측정
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, question?.id]);

  const choices = question?.choices || [];
  const answerId = question?.answerId;
  const stem = question?.stem || "";
  const passage = question?.passage;
  const prompt = question?.prompt;

  // 셔플된 선택지 — question.id 기준 useMemo로 한 번만 셔플하여 모달과 카드 인쇄 영역에 동일 순서 공유
  const shuffledChoices = useMemo(() => {
    const arr = [...choices];
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.map((c) => ({ id: c.id || c.choiceId, text: c.text }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question?.id]);
  // "보기" 류 키 자동 감지 (한국어 키, examples, example, additionalInfo)
  const bokiContent = useMemo(() => {
    if (!question) return null;
    return (
      question["보기"] ||
      question.examples ||
      question.example ||
      question.additionalInfo ||
      null
    );
  }, [question]);

  // question.highlight.text 가 있으면 passage 안의 그 텍스트를 형광펜 처리.
  // passage 가 string 일 때만 적용 (CHOICE_OX 같은 객체형 passage 는 ChoiceAnalysisCore 가 처리).
  const highlightText = question?.highlight?.text;
  const renderedPassage = useMemo(() => {
    if (typeof passage !== "string" || !passage) return passage;
    if (!highlightText || typeof highlightText !== "string") return passage;
    // 정규식 escape
    const esc = highlightText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // markdown 렌더 후에도 살아남도록 <mark> 태그로 치환 (PassageMarkdown 은 rehype-raw 로 HTML 허용)
    return passage.replace(new RegExp(esc, "g"), `<mark class="dq-highlight">${highlightText}</mark>`);
  }, [passage, highlightText]);
  // passage가 string이고 비어있지 않을 때만 렌더
  const hasPassage = typeof passage === "string" && passage.trim().length > 0;
  // prompt가 stem과 다르고 비어있지 않으면 별도 박스로 (현재 데이터에선 prompt가 진짜 본문인 경우 있음)
  const hasPrompt = typeof prompt === "string" && prompt.trim().length > 0 && prompt !== stem;
  const hasBoki = bokiContent && (typeof bokiContent === "string" ? bokiContent.trim().length > 0 : true);

  // 모달 피드백 시간 결정
  const resolvedFeedbackDuration = useMemo(() => {
    if (feedbackDuration != null) return feedbackDuration;
    if (lastResult === "correct") return FEEDBACK.A_CORRECT_ADVANCE_MS;
    if (lastResult === "wrong") return FEEDBACK.A_WRONG_ADVANCE_MS;
    return FEEDBACK.A_CORRECT_ADVANCE_MS;
  }, [feedbackDuration, lastResult]);
  const currentModalKey = question?.id ?? `question-${idx}`;
  const modalOpen = modalKey === currentModalKey;
  const canOpenModal = showModal && isActive && !completion && choices.length > 0;

  const openModal = () => {
    if (!canOpenModal) return;
    setModalKey(currentModalKey);
  };

  const handleCardClick = (event) => {
    if (!canOpenModal) return;
    const target = event.target;
    const highlightSelector = ".worksheet-highlight, .morpheme-chip.active, .morpheme-sentence-highlight";
    const hasHighlight = Boolean(cardRef.current?.querySelector(highlightSelector));
    if (hasHighlight) {
      if (target.closest?.(highlightSelector)) openModal();
      return;
    }
    if (
      target.closest?.(
        ".cum-card-stem, .cum-card-passage, .cum-card-prompt, .cum-card-boki, .cum-card-choices, .cum-choice"
      )
    ) {
      openModal();
    }
  };

  const handleCardKeyDown = (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    if (!canOpenModal) return;
    event.preventDefault();
    openModal();
  };

  if (!question) return null;

  return (
    <div
      ref={cardRef}
      className={`cum-card ${variant === "wide" ? "cum-card-wide" : ""} ${
        completion ? "completed" : ""
      } ${isActive ? "active" : ""} ${
        completion?.isCorrect === true ? "correct" : completion?.isCorrect === false ? "wrong" : ""
      } ${canOpenModal ? "modal-trigger-ready" : ""}`}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      tabIndex={canOpenModal ? 0 : undefined}
    >
      <div className="cum-card-header">
        <span className="cum-card-num">
          문제 {idx + 1}
          {total ? ` / ${total}` : ""}
        </span>
        {completion && typeof completion.isCorrect === "boolean" && (
          <span
            className={`cum-card-mark ${completion.isCorrect ? "correct" : "wrong"}`}
            aria-label={completion.isCorrect ? "정답" : "오답"}
          >
            {completion.isCorrect ? "정답" : "오답"}
          </span>
        )}
      </div>

      <div className="cum-card-stem">
        <RichText>{stem}</RichText>
      </div>

      {hasPassage && (
        <div className="cum-card-passage">
          <PassageMarkdown>{renderedPassage}</PassageMarkdown>
        </div>
      )}

      {hasPrompt && (
        <div className="cum-card-prompt">
          <PassageMarkdown>{prompt}</PassageMarkdown>
        </div>
      )}

      {hasBoki && (
        <div className="cum-card-boki">
          {typeof bokiContent === "string" ? (
            <PassageMarkdown>{bokiContent}</PassageMarkdown>
          ) : (
            <RichText>{String(bokiContent)}</RichText>
          )}
        </div>
      )}

      {/* 풀이 후 시험지에 선택지 + 첨삭 + 해설 누적 (셔플 순서 = 모달과 동일) */}
      {completion && (
        <div className="cum-card-choices">
          {shuffledChoices.map((c, ci) => {
            const cid = c.id;
            const isCorrectChoice = cid === answerId;
            const isPicked = completion?.selectedId === cid;
            const showAsCorrect = isCorrectChoice;
            const showAsWrong = isPicked && !isCorrectChoice && answerId != null;
            return (
              <div
                key={cid || ci}
                className={`cum-choice ${showAsCorrect ? "is-correct" : ""} ${
                  showAsWrong ? "is-wrong" : ""
                }`}
              >
                <span className="cum-choice-num">{choiceLabel(ci)}</span>
                <span className="cum-choice-text">
                  <RichText>{c.text}</RichText>
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* 활성(미풀이) 카드의 인쇄 전용 선택지 영역 — 화면엔 안 보이고 인쇄 시에만.
          모달과 동일한 셔플 순서. 학생이 종이로 풀 수 있도록 정답 강조 없음. */}
      {!completion && shuffledChoices.length > 0 && (
        <div className="cum-card-choices print-only-choices">
          {shuffledChoices.map((c, ci) => (
            <div key={c.id || ci} className="cum-choice">
              <span className="cum-choice-num">{ci + 1}</span>
              <span className="cum-choice-text">
                <RichText>{c.text}</RichText>
              </span>
            </div>
          ))}
        </div>
      )}

      {completion && question.explanation && (
        <div className="cum-card-explanation">
          <RichText>{replaceChoiceLetters(question.explanation, shuffledChoices)}</RichText>
        </div>
      )}

      {/* 활성 시 떠있는 포스트잇 모달 — 셔플은 카드와 동일 (preShuffled), 첫 위치 카드 옆/아래 */}
      {isActive && !completion && showModal && modalOpen && choices.length > 0 && (
        <QuestionModal
          title={modalTitle}
          prompt={stem}
          choices={shuffledChoices}
          preShuffled
          onSelect={onSelect}
          onClose={() => setModalKey(null)}
          mark={lastResult}
          shuffleKey={question.id}
          correctChoiceId={answerId}
          feedbackDuration={resolvedFeedbackDuration}
          anchorRect={cardAnchorRect}
        />
      )}
    </div>
  );
}
