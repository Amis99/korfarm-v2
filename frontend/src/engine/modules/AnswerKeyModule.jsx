import { useEffect, useRef } from "react";
import { useEngine } from "../core/EngineContext";
import AnswerKeyView from "../../components/answer-key/AnswerKeyView";
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

  return (
    <div className="ak-module">
      <div className="ak-header">
        <h2 className="ak-title">{content?.title || "모범답안"}</h2>
        <div className="ak-actions">
          <button className="ak-btn ak-btn-print" onClick={() => window.print()}>
            <span className="material-symbols-outlined">print</span>
            인쇄
          </button>
          <button className="ak-btn ak-btn-complete" onClick={() => finish(true)}>
            <span className="material-symbols-outlined">check_circle</span>
            확인 완료
          </button>
        </div>
      </div>
      <AnswerKeyView sections={sections} />
    </div>
  );
}

export default AnswerKeyModule;
