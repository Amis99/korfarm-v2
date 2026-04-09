import { useLayoutEffect, useMemo, useRef, useState } from "react";
import RichText from "../../utils/RichText";
import PassageMarkdown from "../../utils/PassageMarkdown";
import QuestionModal from "./QuestionModal";
import { FEEDBACK } from "./feedbackTimings";

/**
 * 누적형(C형) 학습 모듈용 공통 문제 카드 — 시험지 컨셉.
 *
 * 동작:
 *   - 활성(isActive && !completion) → 시험지에 [번호+발문 → 지문 → 보기]만 노출,
 *     자동으로 QuestionModal을 띄워 거기서 선택지 풀이
 *   - 완료(completion 있음) → 시험지에 [선택지 + 빨간 첨삭 ○/✗ + 해설(Gaegu)]까지 누적
 *
 * Props:
 *   question: { id, stem|prompt, passage, choices: [{id, text}], answerId, explanation, 보기? examples? }
 *   idx: 0부터 시작하는 인덱스
 *   total: 전체 문제 수
 *   completion: { selectedId, isCorrect } | undefined — 푼 문제는 정답·해설 표시
 *   isActive: 현재 활성 문제이면 모달 자동 노출
 *   onSelect(choiceId): 선택지 클릭 콜백 (모달 또는 카드 내부)
 *   variant: "default" | "wide"
 *   modalTitle: 모달 제목 (기본 "문제")
 *   lastResult: "correct" | "wrong" | null — 모달 mark 표시
 *   feedbackDuration: 모달 피드백 지속 시간 (ms)
 *   anchorRect: 모달 위치 앵커 (옵션)
 *   showModal: 활성 시 모달 자동 노출 여부 (기본 true). false면 카드 안에 선택지 표시(레거시)
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
  // 카드의 .engine-body 내부 좌표 — 활성 시 한 번 측정해서 모달 첫 위치 anchor로 사용.
  // 사용자가 드래그하면 그 위치 유지. 카드가 스크롤되어도 모달은 그 자리.
  const [cardAnchorRect, setCardAnchorRect] = useState(null);

  useLayoutEffect(() => {
    if (!isActive || !cardRef.current) return;
    const card = cardRef.current;
    const engineBody = card.closest(".engine-body");
    if (!engineBody) return;
    const containerRect = engineBody.getBoundingClientRect();
    const scale = containerRect.width / engineBody.offsetWidth || 1;
    const cardRect = card.getBoundingClientRect();
    setCardAnchorRect({
      left: (cardRect.left - containerRect.left) / (scale || 1),
      right: (cardRect.right - containerRect.left) / (scale || 1),
      top: (cardRect.top - containerRect.top) / (scale || 1),
      height: cardRect.height / (scale || 1),
    });
    // 카드가 활성으로 바뀌는 시점에 한 번만 측정 (question.id 기준)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, question?.id]);

  if (!question) return null;
  const choices = question.choices || [];
  const answerId = question.answerId;
  const stem = question.stem || "";
  const passage = question.passage;
  const prompt = question.prompt;
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

  return (
    <div
      ref={cardRef}
      className={`cum-card ${variant === "wide" ? "cum-card-wide" : ""} ${
        completion ? "completed" : ""
      } ${isActive ? "active" : ""} ${
        completion?.isCorrect ? "correct" : completion ? "wrong" : ""
      }`}
    >
      <div className="cum-card-header">
        <span className="cum-card-num">
          문제 {idx + 1}
          {total ? ` / ${total}` : ""}
        </span>
        {completion && (
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
          <PassageMarkdown>{passage}</PassageMarkdown>
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

      {/* 풀이 후에만 시험지에 선택지 + 첨삭 + 해설 누적 */}
      {completion && (
        <div className="cum-card-choices">
          {choices.map((c, ci) => {
            const cid = c.id || c.choiceId;
            const isCorrectChoice = cid === answerId;
            const isPicked = completion?.selectedId === cid;
            const showAsCorrect = isCorrectChoice;
            const showAsWrong = isPicked && !isCorrectChoice;
            return (
              <div
                key={cid || ci}
                className={`cum-choice ${showAsCorrect ? "is-correct" : ""} ${
                  showAsWrong ? "is-wrong" : ""
                }`}
              >
                <span className="cum-choice-num">{ci + 1}</span>
                <span className="cum-choice-text">
                  <RichText>{c.text}</RichText>
                </span>
              </div>
            );
          })}
        </div>
      )}

      {completion && question.explanation && (
        <div className="cum-card-explanation">
          <RichText>{question.explanation}</RichText>
        </div>
      )}

      {/* 활성 시 떠있는 포스트잇 모달 — 첫 위치는 카드 옆/아래(50% 룰), 사용자 드래그 가능 */}
      {isActive && !completion && showModal && choices.length > 0 && (
        <QuestionModal
          title={modalTitle}
          prompt={stem}
          choices={choices.map((c) => ({ id: c.id || c.choiceId, text: c.text }))}
          onSelect={onSelect}
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
