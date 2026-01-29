import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/diagnostic.css";

const QUESTION_COUNT = 20;
const CHOICES = ["1", "2", "3", "4", "5"];
const CHOICE_LABELS = {
  "1": "①",
  "2": "②",
  "3": "③",
  "4": "④",
  "5": "⑤",
};

const blockEvent = (event) => {
  event.preventDefault();
  event.stopPropagation();
};

function OmrEntryPage() {
  const [answers, setAnswers] = useState(() => Array.from({ length: QUESTION_COUNT }, () => ""));
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isObscured, setIsObscured] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const keyEvents = ["keydown", "keypress", "keyup"];
    const blockEvents = [
      "contextmenu",
      "copy",
      "cut",
      "paste",
      "dragstart",
      "selectstart",
    ];
    keyEvents.forEach((eventName) => window.addEventListener(eventName, blockEvent, true));
    blockEvents.forEach((eventName) => window.addEventListener(eventName, blockEvent, true));

    return () => {
      keyEvents.forEach((eventName) => window.removeEventListener(eventName, blockEvent, true));
      blockEvents.forEach((eventName) => window.removeEventListener(eventName, blockEvent, true));
    };
  }, []);

  useEffect(() => {
    const updateVisibility = () => {
      const hidden = document.hidden || !document.hasFocus();
      setIsObscured(hidden);
    };
    updateVisibility();
    window.addEventListener("blur", updateVisibility);
    window.addEventListener("focus", updateVisibility);
    document.addEventListener("visibilitychange", updateVisibility);
    return () => {
      window.removeEventListener("blur", updateVisibility);
      window.removeEventListener("focus", updateVisibility);
      document.removeEventListener("visibilitychange", updateVisibility);
    };
  }, []);

  const requestFullscreen = async () => {
    const element = document.documentElement;
    if (!document.fullscreenElement && element?.requestFullscreen) {
      try {
        await element.requestFullscreen();
      } catch {
        // Ignore fullscreen request failures.
      }
    }
  };

  const filledCount = useMemo(
    () => answers.reduce((count, answer) => (answer ? count + 1 : count), 0),
    [answers]
  );

  const handleSelect = (index, choice) => {
    if (submitted) {
      return;
    }
    setAnswers((prev) => {
      const next = [...prev];
      next[index] = choice;
      return next;
    });
    setError("");
  };

  const handleSubmit = () => {
    if (submitted) {
      return;
    }
    if (filledCount < QUESTION_COUNT) {
      setError("모든 문항에 답을 선택해 주세요.");
      return;
    }
    setSubmitted(true);
    setError("");
  };

  return (
    <div
      className={`diagnostic-page omr-page minimal ${isObscured ? "obscured" : ""}`}
      onClick={requestFullscreen}
    >
      <div className="watermark" aria-hidden="true" />
      {isObscured ? <div className="screen-shield" aria-hidden="true" /> : null}
      <main className="diagnostic-panel">
        <section className="omr-sheet">
          <div className="omr-header">
            <h1 className="omr-title">OMR 답안 입력 (진단)</h1>
            <div className="omr-progress">
              <span>총 {QUESTION_COUNT}문항</span>
              <span>
                {filledCount}/{QUESTION_COUNT} 입력
              </span>
            </div>
          </div>
          {error ? <div className="omr-error">{error}</div> : null}
          {submitted ? <div className="omr-success">제출이 완료되었습니다.</div> : null}
          <div className="omr-grid">
            {answers.map((value, index) => (
              <div className="omr-row" key={`omr-${index + 1}`}>
                <span className="omr-number">{index + 1}</span>
                <div className="omr-choices">
                  {CHOICES.map((choice) => (
                    <label
                      key={`${index}-${choice}`}
                      className={`omr-choice ${value === choice ? "active" : ""}`}
                    >
                      <input
                        type="radio"
                        name={`q-${index + 1}`}
                        value={choice}
                        checked={value === choice}
                        onChange={() => handleSelect(index, choice)}
                      />
                      <span>{CHOICE_LABELS[choice] || choice}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="omr-actions">
            <button className="btn primary" type="button" onClick={handleSubmit}>
              제출하기
            </button>
            <button className="btn ghost" type="button" onClick={() => navigate("/start")}>
              나중에 하기
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default OmrEntryPage;
