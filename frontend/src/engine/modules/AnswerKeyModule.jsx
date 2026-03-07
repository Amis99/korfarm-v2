import { useEffect, useRef } from "react";
import { useEngine } from "../core/EngineContext";
import RichText from "../../utils/RichText";
import "../../styles/answer-key.css";

function AnswerKeyModule({ content }) {
  const { start, finish } = useEngine();
  const startedRef = useRef(false);

  useEffect(() => {
    if (!startedRef.current) {
      startedRef.current = true;
      start();
    }
  }, []);

  const payload = content?.payload || {};
  const sections = payload.sections || [];

  const handlePrint = () => {
    window.print();
  };

  const handleComplete = () => {
    finish(true);
  };

  return (
    <div className="ak-module">
      <div className="ak-header">
        <h2 className="ak-title">{content?.title || "모범답안"}</h2>
        <div className="ak-actions">
          <button className="ak-btn ak-btn-print" onClick={handlePrint}>
            <span className="material-symbols-outlined">print</span>
            인쇄
          </button>
          <button className="ak-btn ak-btn-complete" onClick={handleComplete}>
            <span className="material-symbols-outlined">check_circle</span>
            확인 완료
          </button>
        </div>
      </div>

      {sections.length === 0 && (
        <p className="ak-empty">모범답안 데이터가 없습니다.</p>
      )}

      {sections.map((section, si) => (
        <div key={si} className="ak-section">
          <h3 className="ak-section-title">
            <span className="ak-section-badge">{section.label || `섹션 ${si + 1}`}</span>
          </h3>
          <div className="ak-items">
            {(section.items || []).map((item, ii) => (
              <div key={ii} className="ak-item">
                <div className="ak-item-header">
                  <span className="ak-item-num">{item.number || ii + 1}</span>
                  <span className="ak-item-type">{item.type || "객관식"}</span>
                  {item.points && <span className="ak-item-pts">{item.points}점</span>}
                </div>

                {item.question && (
                  <div className="ak-item-question">
                    <span className="ak-label">문제</span>
                    <p><RichText>{item.question}</RichText></p>
                  </div>
                )}

                <div className="ak-item-answer">
                  <span className="ak-label">정답</span>
                  <p className="ak-answer-text"><RichText>{item.answer || "-"}</RichText></p>
                </div>

                {item.explanation && (
                  <div className="ak-item-explanation">
                    <span className="ak-label">해설</span>
                    <p><RichText>{item.explanation}</RichText></p>
                  </div>
                )}

                {item.modelAnswer && (
                  <div className="ak-item-model">
                    <span className="ak-label">모범답안</span>
                    <p><RichText>{item.modelAnswer}</RichText></p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default AnswerKeyModule;
