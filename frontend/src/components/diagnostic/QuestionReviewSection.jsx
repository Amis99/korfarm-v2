import { useState } from "react";
import RichText from "../../utils/RichText";

function QuestionReviewSection({ reviews }) {
  const [openIdx, setOpenIdx] = useState(null);

  if (!reviews || reviews.length === 0) return null;

  const toggle = (idx) => setOpenIdx(openIdx === idx ? null : idx);

  return (
    <div className="diag-report-section">
      <h2>개별 문항 리뷰</h2>
      <div className="question-review-list">
        {reviews.map((r, i) => (
          <div key={r.questionId} className={`qr-item ${openIdx === i ? "open" : ""}`}>
            <div className="qr-header" onClick={() => toggle(i)}>
              <span className={`qr-badge ${r.isCorrect ? "correct" : "wrong"}`}>
                {r.isCorrect ? "O" : "X"}
              </span>
              <span className="qr-num">Q{i + 1}</span>
              <span className="qr-type">{r.questionType}</span>
              <span className="qr-stem-preview">
                {r.stem.length > 50 ? r.stem.substring(0, 50) + "…" : r.stem}
              </span>
              <span className="qr-arrow">{openIdx === i ? "▲ 접기" : "▼ 펼치기"}</span>
            </div>
            {openIdx === i && (
              <div className="qr-body">
                <div className="qr-stem-full"><RichText>{r.stem}</RichText></div>
                <div className="qr-choices">
                  {r.choices.map((c) => (
                    <div
                      key={c.choiceId}
                      className={`qr-choice ${c.isCorrect ? "correct" : ""} ${c.isSelected ? "selected" : ""} ${c.isSelected && !c.isCorrect ? "wrong" : ""}`}
                    >
                      <span className="qr-choice-id">{c.choiceId}</span>
                      <span className="qr-choice-text"><RichText>{c.text}</RichText></span>
                      {c.isCorrect && <span className="qr-tag correct-tag">정답</span>}
                      {c.isSelected && !c.isCorrect && <span className="qr-tag wrong-tag">내 선택</span>}
                      {c.isSelected && c.isCorrect && <span className="qr-tag correct-tag">내 선택 (정답)</span>}
                    </div>
                  ))}
                </div>
                <div className="qr-meta">
                  {r.affectedCompetencies.length > 0 && (
                    <div className="qr-competencies">
                      <span className="qr-meta-label">영향 역량:</span>
                      {r.affectedCompetencies.map((c) => (
                        <span key={c} className="qr-comp-tag">{c}</span>
                      ))}
                    </div>
                  )}
                  {r.errorPath && (
                    <div className="qr-error-path">
                      <span className="qr-meta-label">오류 경로:</span> {r.errorPath}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default QuestionReviewSection;
