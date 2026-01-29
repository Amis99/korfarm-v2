import { useEffect, useMemo, useRef, useState } from "react";
import EngineContext from "./EngineContext";
import TimeBar from "./TimeBar";
import ResultSummary from "./ResultSummary";
import { MODULES } from "../modules";
import "../../styles/learning-engine.css";

const getTimeLimit = (content) => content?.timeLimitSec ?? 180;

function EngineShell({ content, moduleKey, onExit }) {
  const timeLimit = getTimeLimit(content);
  const [status, setStatus] = useState("READY");
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [timePulse, setTimePulse] = useState(null);
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [seed, setSeed] = useState(content?.seedReward?.count ?? 3);
  const [startedAt, setStartedAt] = useState(null);
  const intervalRef = useRef(null);

  const Module = MODULES[moduleKey];

  const getLearningTypeLabel = (contentType) => {
    if (!contentType) return "학습";
    if (contentType.startsWith("VOCAB")) return "어휘 학습";
    if (contentType.startsWith("READING")) return "독해 연습";
    if (contentType.startsWith("CONTENT_PDF")) return "내용 숙지 학습";
    if (contentType.startsWith("GRAMMAR")) return "문법 연습";
    if (contentType.startsWith("BACKGROUND")) return "배경지식 퀴즈";
    if (contentType.startsWith("LANGUAGE_CONCEPT")) return "국어 개념 및 이론 퀴즈";
    if (contentType.startsWith("LOGIC")) return "논리사고력";
    if (contentType.startsWith("WRITING")) return "서술형 연습";
    if (contentType.startsWith("CHOICE")) return "선택지 판별 연습";
    return contentType;
  };

  const getLevelLabel = (level) => {
    const mapping = {
      SAUSSURE_1: "소쉬르1",
      SAUSSURE_2: "소쉬르2",
      SAUSSURE_3: "소쉬르3",
      SOUSSURE_1: "소쉬르1",
      SOUSSURE_2: "소쉬르2",
      SOUSSURE_3: "소쉬르3",
      FREGE_1: "프레게1",
      FREGE_2: "프레게2",
      FREGE_3: "프레게3",
      RUSSELL_1: "러셀1",
      RUSSELL_2: "러셀2",
      RUSSELL_3: "러셀3",
      WITTGENSTEIN_1: "비트겐슈타인1",
      WITTGENSTEIN_2: "비트겐슈타인2",
      WITTGENSTEIN_3: "비트겐슈타인3",
    };
    return mapping[level] || level || "미정";
  };

  const getAreaLabel = (area, subArea) => {
    if (subArea?.startsWith("NONFICTION_")) return "비문학";
    const mapping = {
      READING: "독해",
      VOCAB: "어휘",
      GRAMMAR: "문법",
      BACKGROUND: "기타",
      LOGIC: "기타",
      WRITING: "기타",
    };
    return mapping[area] || "기타";
  };

  const getSubAreaLabel = (subArea) => {
    const mapping = {
      NONFICTION_PHILOSOPHY: "인문",
      NONFICTION_SOCIAL: "사회",
      SCIENCE: "과학/기술",
      CHOICE_JUDGEMENT: "선택지 판별",
      CONCEPT: "국어 개념",
      DESCRIPTIVE: "서술형",
      DICTIONARY: "사전",
      BASIC: "기본",
      POS: "품사",
      WORD_FORMATION: "단어의 형성",
      SENTENCE_STRUCTURE: "문장의 짜임",
      PHONEME_CHANGE: "음운/음운 변동",
      REASONING: "논리사고력",
    };
    return mapping[subArea] || "세부 영역";
  };

  const getProgressTotal = () => {
    const payload = content?.payload || {};
    const guess = {
      worksheet_quiz: payload.questions?.length,
      reading_intensive: payload.timeline?.length,
      recall_cards: payload.cards?.length,
      confirm_click: payload.steps?.length,
      choice_judgement: payload.questions?.length,
      phoneme_change: payload.items?.length,
      word_formation: payload.items?.length,
      sentence_structure: payload.sentences?.length,
    };
    return guess[moduleKey] || 0;
  };

  const progressTotal = getProgressTotal();
  const progressCurrent = useMemo(() => {
    if (!records.length) return 0;
    const unique = new Set(records.map((entry) => entry.stepId || entry.id));
    return unique.size;
  }, [records]);

  const adjustTime = (delta) => {
    setTimeLeft((prev) => Math.max(0, Math.min(timeLimit, prev + delta)));
    if (delta !== 0) {
      setTimePulse(delta > 0 ? "gain" : "loss");
    }
  };

  const recordAnswer = (entry) => {
    setRecords((prev) => [
      ...prev,
      {
        ...entry,
        timeLeft,
        seed,
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  const start = () => {
    if (!startedAt) {
      setStartedAt(new Date().toISOString());
    }
    setStatus("RUNNING");
  };
  const pause = () => setStatus("PAUSED");
  const resume = () => setStatus("RUNNING");

  const finish = (success) => {
    setStatus("FINISHED");
    const correct = records.filter((item) => item.correct).length;
    const wrong = records.filter((item) => item.correct === false).length;
    const total = records.length;
    const timeSpent = Math.max(0, timeLimit - timeLeft);
    const baseReward = content?.seedReward?.count ?? 0;
    const multiplier = content?.seedReward?.multiplier ?? 1;
    const earnedSeed = success ? baseReward * multiplier : 0;
    const endedAt = new Date().toISOString();
    setSummary({
      success,
      correct,
      wrong,
      total,
      timeSpent,
      seed,
      earnedSeed,
    });
    const logEntry = {
      contentId: content?.contentId,
      contentType: content?.contentType,
      title: content?.title,
      moduleKey,
      startedAt,
      endedAt,
      records,
      summary: { success, correct, wrong, total, timeSpent, seed, earnedSeed },
    };
    try {
      const key = "korfarm_learning_logs";
      const existing = JSON.parse(localStorage.getItem(key) || "[]");
      localStorage.setItem(key, JSON.stringify([logEntry, ...existing]));
    } catch {
      // ignore storage errors
    }
  };

  useEffect(() => {
    if (status !== "RUNNING") {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      return;
    }
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [status]);

  useEffect(() => {
    if (!timePulse) return undefined;
    const timer = setTimeout(() => setTimePulse(null), 520);
    return () => clearTimeout(timer);
  }, [timePulse]);

  useEffect(() => {
    if (status !== "RUNNING") return;
    if (timeLeft > 0) return;
    setSeed((prev) => {
      const nextSeed = Math.max(0, prev - 1);
      if (nextSeed === 0) {
        finish(false);
        return 0;
      }
      setTimeLeft(timeLimit);
      return nextSeed;
    });
  }, [timeLeft, status, timeLimit]);

  const contextValue = useMemo(
    () => ({
      status,
      timeLeft,
      timeLimit,
      seed,
      setSeed,
      adjustTime,
      recordAnswer,
      start,
      pause,
      resume,
      finish,
    }),
    [status, timeLeft, timeLimit, seed]
  );

  if (!Module) {
    return (
      <div className="engine-shell">
        <div className="engine-error">
          학습 모듈을 찾을 수 없습니다. ({moduleKey})
        </div>
      </div>
    );
  }

  return (
    <EngineContext.Provider value={contextValue}>
      <div className="engine-shell">
        <div className="engine-viewport">
          <div className="engine-stage">
            <div className="engine-stage-inner">
            <header className="engine-header">
              <div className="engine-header-row">
                <div className="engine-header-item engine-title">
                  <strong>{content?.title || "학습"}</strong>
                </div>
                <div className="engine-header-divider" />
                <div className="engine-header-item">
                  <strong>
                    {getLearningTypeLabel(content?.contentType)} · {getLevelLabel(content?.targetLevel)}
                  </strong>
                </div>
                <div className="engine-header-divider" />
                <div className="engine-header-item">
                  <strong>
                    {getAreaLabel(content?.area, content?.subArea)} · {getSubAreaLabel(content?.subArea)}
                  </strong>
                </div>
              </div>
              <div className="engine-header-row secondary">
                <div className="engine-header-item">
                  <div className="seed-row" aria-label={`현재 씨앗 ${seed}개`}>
                    {Array.from({ length: seed }, (_, idx) => (
                      <span key={`seed-${idx}`} className="seed-icon" />
                    ))}
                  </div>
                </div>
                <div className="engine-header-divider" />
                <div className="engine-header-item engine-timebar">
                  <TimeBar timeLeft={timeLeft} timeLimit={timeLimit} className={timePulse} />
                </div>
              </div>
            </header>

              <main
                className="engine-body"
                style={{
                  "--sheet-bg": content?.assets?.sheetBackground
                    ? `url(${content.assets.sheetBackground})`
                    : "url(/learning-paper.jpg)",
                }}
              >
                <Module content={content} />
              </main>

              <footer className="engine-footer">
                <button type="button" className="engine-exit" onClick={onExit}>
                  학습 종료
                </button>
                <div className="engine-footer-item">
                  <span className="engine-footer-label">
                    진행 {progressCurrent} / {progressTotal || "-"}
                  </span>
                  <div className="engine-progress-track">
                    <div
                      className="engine-progress-fill"
                      style={{
                        width:
                          progressTotal > 0
                            ? `${Math.min(100, (progressCurrent / progressTotal) * 100)}%`
                            : "0%",
                      }}
                    />
                  </div>
                </div>
              </footer>
            </div>
          </div>
        </div>
      </div>

      {summary ? <ResultSummary summary={summary} onExit={onExit} /> : null}
    </EngineContext.Provider>
  );
}

export default EngineShell;
