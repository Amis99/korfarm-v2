import { useEffect } from "react";
import { createPortal } from "react-dom";
import PassageMarkdown from "../../utils/PassageMarkdown";

/**
 * 본문/지문 다시 보기 모달 (배경지식·내용 숙지 등 누적 학습 모듈 공용).
 *
 * 정책:
 *  - 모달이 열려도 EngineShell 타이머는 계속 진행 (status 변경 X)
 *  - 모달 위 클릭은 차단 → 학생이 본문을 보면서 동시에 문제는 못 풀게 막음
 *  - 닫기 버튼 또는 바깥 클릭으로 닫기
 *
 * Props:
 *  - title: 모달 제목 (예: "본문 다시 보기")
 *  - passage: 마크다운 본문
 *  - onClose: 닫기 콜백
 */
export default function PassageReviewModal({ title = "본문 다시 보기", passage, onClose }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="passage-review-overlay" onClick={onClose}>
      <div className="passage-review-modal" onClick={(e) => e.stopPropagation()}>
        <div className="passage-review-header">
          <h3>{title}</h3>
          <button type="button" className="passage-review-close" onClick={onClose}>
            닫기
          </button>
        </div>
        <div className="passage-review-body">
          <PassageMarkdown>{passage || ""}</PassageMarkdown>
        </div>
      </div>
    </div>,
    document.body
  );
}
