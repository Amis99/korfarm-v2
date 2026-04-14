import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import EngineContext from "./EngineContext";
import TimeBar from "./TimeBar";
import ResultSummary from "./ResultSummary";
import PrintLayout from "./PrintLayout";
import { MODULES } from "../modules";
import { apiPost } from "../../utils/api";
import { useAuth } from "../../hooks/useAuth";
import "../../styles/learning-engine.css";

/** 인쇄/PDF 저장 시 파일명을 학생명_레벨명_학습명으로 설정.
 *  document.title이 PDF 파일명 default가 됨. 인쇄 끝나면 원래 title 복원. */
function printWithFilename(studentName, level, title) {
  const sanitize = (s) => (s || "").toString().replace(/[\\/:*?"<>|]/g, "").trim();
  const parts = [sanitize(studentName), sanitize(level), sanitize(title)].filter(Boolean);
  const newTitle = parts.length > 0 ? parts.join("_") : "국어농장_학습지";
  const original = document.title;
  document.title = newTitle;
  // 인쇄 다이얼로그 닫힌 후 원래 title 복원
  const restore = () => {
    document.title = original;
    window.removeEventListener("afterprint", restore);
  };
  window.addEventListener("afterprint", restore);
  // afterprint 이벤트 미지원 브라우저 fallback
  setTimeout(() => {
    if (document.title === newTitle) document.title = original;
  }, 5000);
  window.print();
}

const getTimeLimit = (content) => content?.timeLimitSec ?? 180;

const SEED_TYPES = [
  { type: "seed_wheat", name: "밀", weight: 70 },
  { type: "seed_rice",  name: "쌀", weight: 70 },
  { type: "seed_corn",  name: "옥수수", weight: 70 },
  { type: "seed_grape", name: "포도", weight: 30 },
  { type: "seed_apple", name: "사과", weight: 30 },
];

// 농장ID → 씨앗타입 매핑
const FARM_SEED_MAPPING = {
  vocab: "seed_wheat",      // 어휘 농장 → 밀
  grammar: "seed_wheat",    // 문법 농장 → 밀
  reading: "seed_rice",     // 독해 농장 → 쌀
  content: "seed_rice",     // 내용숙지 농장 → 쌀
  background: "seed_corn",  // 배경지식 농장 → 옥수수
  concept: "seed_corn",     // 국어개념 농장 → 옥수수
  logic: "seed_grape",      // 논리사고력 농장 → 포도
  choice: "seed_grape",     // 선택지판별 농장 → 포도
  writing: "seed_apple",    // 서술형 농장 → 사과
};

// contentType → farmId 매핑
const CONTENT_TYPE_FARM_MAPPING = {
  VOCAB_BASIC: "vocab",
  GRAMMAR_WORD_FORMATION: "grammar",
  GRAMMAR_SENTENCE_STRUCTURE: "grammar",
  GRAMMAR_PHONEME_CHANGE: "grammar",
  GRAMMAR_POS: "grammar",
  MORPHEME_ANALYSIS: "grammar",
  READING_NONFICTION: "reading",
  READING_LITERATURE: "reading",
  STUDY_CONTENT: "content",
  BACKGROUND_KNOWLEDGE: "background",
  BACKGROUND_KNOWLEDGE_QUIZ: "background",
  LANGUAGE_CONCEPT: "concept",
  LANGUAGE_CONCEPT_QUIZ: "concept",
  LOGIC_REASONING: "logic",
  LOGIC_REASONING_QUIZ: "logic",
  CHOICE_JUDGEMENT: "choice",
  CHOICE_ANALYSIS: "choice",
  WRITING_DESCRIPTIVE: "writing",
  PRO_READING: "reading",
  PRO_VOCAB: "vocab",
  PRO_BACKGROUND: "background",
  PRO_LOGIC: "logic",
  PRO_ANSWER: "reading",
  DAILY_QUIZ: "vocab",       // 일일퀴즈 → 밀 씨앗
  DAILY_READING: "reading",  // 일일독해 → 쌀 씨앗
};

// 씨앗 종류별 색상/그라디언트 (헤더 아이콘용)
const SEED_DISPLAY = {
  seed_wheat: { gradient: ["%23ffd27f", "%23e8a020"], stroke: "%23c48a18" },
  seed_rice:  { gradient: ["%23f0efe4", "%23c8c4a8"], stroke: "%23a8a488" },
  seed_corn:  { gradient: ["%23ffe066", "%23e8b020"], stroke: "%23c49518" },
  seed_grape: { gradient: ["%23d4b8e8", "%238a50a8"], stroke: "%236a3888" },
  seed_apple: { gradient: ["%23ff7070", "%23d03030"], stroke: "%23a82020" },
};

function seedSvgUrl(seedType) {
  const info = SEED_DISPLAY[seedType];
  if (!info) return null;
  return `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 28'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${info.gradient[0]}'/><stop offset='1' stop-color='${info.gradient[1]}'/></linearGradient></defs><ellipse cx='20' cy='14' rx='18' ry='10' fill='url(%23g)' stroke='${info.stroke}' stroke-width='2'/></svg>")`;
}

// contentType으로 농장ID 조회
function getFarmIdFromContentType(contentType) {
  if (!contentType) return null;
  return CONTENT_TYPE_FARM_MAPPING[contentType] || null;
}

// 농장 학습용: contentType 기반 씨앗 선택
function pickSeedForFarm(contentType) {
  const farmId = getFarmIdFromContentType(contentType);
  if (farmId && FARM_SEED_MAPPING[farmId]) {
    const seedType = FARM_SEED_MAPPING[farmId];
    const seedInfo = SEED_TYPES.find((s) => s.type === seedType);
    return seedInfo || SEED_TYPES[0];
  }
  return null; // 농장 매핑 없으면 null (랜덤 사용)
}

function pickRandomSeed() {
  const totalWeight = SEED_TYPES.reduce((s, e) => s + e.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const seed of SEED_TYPES) {
    roll -= seed.weight;
    if (roll <= 0) return seed;
  }
  return SEED_TYPES[0];
}

function EngineShell({ content, moduleKey, onExit, farmLogId, preventAutoFinish, startPage, onFinish }) {
  const { user } = useAuth();
  const studentName = user?.name || user?.login_id || "학생";
  const timeLimit = getTimeLimit(content);

  /** 인쇄 핸들러 — 파일명 학생명_레벨명_학습명 */
  const handlePrint = () => {
    printWithFilename(studentName, content?.targetLevel || "", content?.title || "");
  };
  const assetBase = import.meta.env.BASE_URL || "/";
  const resolveAssetUrl = (path) => {
    if (!path) return "";
    if (/^(https?:|data:|blob:)/.test(path)) return path;
    const normalized = path.startsWith("/") ? path.slice(1) : path;
    return encodeURI(`${assetBase}${normalized}`);
  };
  const farmLogIdRef = useRef(farmLogId);
  farmLogIdRef.current = farmLogId;
  const [status, setStatus] = useState("READY");
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [timePulse, setTimePulse] = useState(null);
  const [records, setRecords] = useState([]);
  const recordsRef = useRef(records);
  recordsRef.current = records;
  const [summary, setSummary] = useState(null);
  const [seed, setSeed] = useState(content?.seedReward?.count ?? 3);
  const [seedExhausted, setSeedExhausted] = useState(false);
  const [startedAt, setStartedAt] = useState(null);
  const [timeSpeed, setTimeSpeed] = useState(1);
  const intervalRef = useRef(null);
  const headerRef = useRef(null);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [pageProgress, setPageProgress] = useState(null);

  const Module = MODULES[moduleKey];

  // 현재 씨앗 종류 결정 (contentType 기반)
  const currentSeedType = useMemo(() => {
    const farmSeed = pickSeedForFarm(content?.contentType);
    return farmSeed?.type || "seed_wheat";
  }, [content?.contentType]);

  // 헤더 seed-row용 인라인 스타일
  const seedIconStyle = useMemo(() => {
    const bg = seedSvgUrl(currentSeedType);
    return bg ? { backgroundImage: bg } : {};
  }, [currentSeedType]);

  const getLearningTypeLabel = (contentType) => {
    if (!contentType) return "학습";
    if (contentType.startsWith("PRO_")) return "프로 모드";
    if (contentType.startsWith("VOCAB")) return "어휘 학습";
    if (contentType.startsWith("READING") || contentType.startsWith("DAILY_READING")) return "독해 연습";
    if (contentType === "STUDY_CONTENT") return "내용 숙지 학습";
    if (contentType === "MORPHEME_ANALYSIS" || contentType === "GRAMMAR_WORD_FORMATION") return "형태소와 단어의 형성";
    if (contentType.startsWith("GRAMMAR")) return "문법 연습";
    if (contentType.startsWith("BACKGROUND")) return "배경지식 퀴즈";
    if (contentType.startsWith("LANGUAGE_CONCEPT")) return "국어 개념 및 이론 퀴즈";
    if (contentType.startsWith("LOGIC")) return "논리사고력";
    if (contentType.startsWith("WRITING")) return "서술형 연습";
    if (contentType.startsWith("CHOICE")) return "선택지 판별 연습";
    if (contentType.startsWith("DAILY_QUIZ")) return "일일 퀴즈";
    return "학습";
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
      LITERATURE: "Literature",
      SCIENCE: "과학/기술",
      CHOICE_JUDGEMENT: "선택지 판별",
      CONCEPT: "국어 개념",
      DESCRIPTIVE: "서술형",
      DICTIONARY: "사전",
      BASIC: "기본",
      POS: "품사",
      WORD_FORMATION: "단어의 형성",
      MORPHEME: "형태소 분석",
      SENTENCE_STRUCTURE: "문장의 짜임",
      PHONEME_CHANGE: "음운/음운 변동",
      REASONING: "논리사고력",
    };
    return mapping[subArea] || "세부 영역";
  };

  // 인쇄 레벨 클래스 (글자 크기 조정)
  const printLevelClass = useMemo(() => {
    const level = content?.targetLevel || "";
    if (level.startsWith("SAUSSURE") || level.startsWith("SOUSSURE")) return "print-level-saussure";
    if (level.startsWith("FREGE")) return "print-level-frege";
    if (level.startsWith("WITTGENSTEIN")) return "print-level-wittgenstein";
    return "";
  }, [content]);

  // 화면용 레벨 클래스 (모바일 글자 크기 조정)
  // 4단계 모두 명시적 클래스 부여 — 통합 사이즈 규칙이 적용됨
  const screenLevelClass = useMemo(() => {
    const level = content?.targetLevel || "";
    if (level.startsWith("SAUSSURE") || level.startsWith("SOUSSURE")) return "screen-level-saussure";
    if (level.startsWith("FREGE")) return "screen-level-frege";
    if (level.startsWith("RUSSELL")) return "screen-level-russell";
    if (level.startsWith("WITTGENSTEIN")) return "screen-level-wittgenstein";
    // 레벨 정보가 없으면 러셀 기준
    return "screen-level-russell";
  }, [content]);

  // 인쇄 전용: 페이지 그룹별 문제 추출
  const printPageGroups = useMemo(() => {
    const payload = content?.payload;
    if (!payload) return [];
    // worksheet_quiz, choice_judgement 등
    if (payload.questions) {
      const qs = payload.questions.filter(Boolean);
      if (!qs.length) return [];
      return [{ label: "문제", questions: qs }];
    }
    // reading_training
    if (payload.intensive?.timeline) {
      const qs = payload.intensive.timeline.map((t) => t.question).filter(Boolean);
      if (!qs.length) return [];
      return [{ label: "문제", questions: qs }];
    }
    return [];
  }, [content]);

  const baseProgressTotal = useMemo(() => {
    const payload = content?.payload || {};
    const readingTrainingTotal =
      (payload.intensive?.timeline?.length ?? payload.timeline?.length ?? 0) +
      (payload.recall?.cards?.length ? 1 : 0) +
      (payload.confirm?.questions?.length ?? 0);
    const worksheetTotal = (payload.questions || []).reduce((sum, question) => {
      if (!question) return sum;
      if (question.type === "FILL_BLANKS") {
        return sum + (question.blanks?.length ?? 0);
      }
      if (question.type === "SENTENCE_BUILDING") {
        return sum + (question.sentenceParts?.length ?? 0);
      }
      return sum + 1;
    }, 0);
    const passagesTotal = (payload.passages || []).reduce(
      (sum, p) => sum + (p.questions?.length || 0), 0
    );
    const guess = {
      worksheet_quiz: worksheetTotal,
      reading_training: readingTrainingTotal,
      choice_judgement: payload.questions?.length,
      phoneme_change: (payload.words || []).reduce((sum, w) => sum + (w.steps?.length || 0), 0),
      word_formation: payload.items?.length,
      sentence_structure: payload.sentences?.length,
      study_content: 20,
      logic_reasoning: passagesTotal > 0 ? passagesTotal : worksheetTotal,
      background_knowledge: passagesTotal > 0 ? passagesTotal : worksheetTotal,
    };
    return guess[moduleKey] || 0;
  }, [content, moduleKey]);

  const progressTotal = useMemo(() => {
    if (moduleKey === "reading_training") {
      const extraWrong = records.filter(
        (entry) => entry.stage === "INTENSIVE" && entry.correct === false
      ).length;
      return baseProgressTotal + extraWrong;
    }
    return baseProgressTotal;
  }, [baseProgressTotal, moduleKey, records]);
  const progressCurrent = useMemo(() => {
    if (!records.length) return 0;
    const unique = new Set(records.map((entry) => entry.stepId || entry.id));
    if (moduleKey === "reading_training") {
      const extraWrong = records.filter(
        (entry) => entry.stage === "INTENSIVE" && entry.correct === false
      ).length;
      return unique.size + extraWrong;
    }
    return unique.size;
  }, [records, moduleKey]);

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

  const finish = (success, options = {}) => {
    setStatus("FINISHED");
    const latestRecords = recordsRef.current;
    const correct = latestRecords.filter((item) => item.correct).length;
    const wrong = latestRecords.filter((item) => item.correct === false).length;
    const total = latestRecords.length;
    const timeSpent = Math.max(0, timeLimit - timeLeft);
    const accuracy = total ? Math.round((correct / total) * 100) : 0;
    const finalSeed = typeof options.seed === "number" ? options.seed : seed;
    let normalizedSuccess = success;
    let earnedSeed = 0;
    if (success) {
      if (accuracy >= 70) {
        earnedSeed = finalSeed;
        if (accuracy === 100) {
          earnedSeed *= 2;
        }
        // 선택지 판별: 씨앗 무조건 기본의 3배 지급
        if (moduleKey === "choice_judgement") {
          earnedSeed *= 3;
        }
        normalizedSuccess = true;
      } else {
        normalizedSuccess = false;
      }
    } else {
      normalizedSuccess = false;
    }
    // 농장 학습이면 매핑된 씨앗, 아니면 랜덤
    const farmSeed = pickSeedForFarm(content?.contentType);
    const chosenSeed = earnedSeed > 0 ? (farmSeed || pickRandomSeed()) : null;
    const endedAt = new Date().toISOString();
    // 커스텀 완료 콜백 (진단/챕터 테스트 등 외부 제출용)
    if (onFinish) {
      onFinish({ records: latestRecords, correct, wrong, total, accuracy, timeSpent });
      return;
    }

    setSummary({
      success: normalizedSuccess,
      correct,
      wrong,
      total,
      timeSpent,
      seed: finalSeed,
      earnedSeed,
      seedType: chosenSeed?.type || null,
      progressSolved: total,
      progressTotal,
      timeLimit,
      accuracy,
    });
    const logEntry = {
      contentId: content?.contentId,
      contentType: content?.contentType,
      title: content?.title,
      moduleKey,
      startedAt,
      endedAt,
      records: latestRecords,
      summary: {
        success: normalizedSuccess,
        correct,
        wrong,
        total,
        timeSpent,
        seed: finalSeed,
        earnedSeed,
        progressSolved: total,
        progressTotal,
        timeLimit,
        accuracy,
      },
    };
    try {
      const key = "korfarm_learning_logs";
      const existing = JSON.parse(localStorage.getItem(key) || "[]");
      localStorage.setItem(key, JSON.stringify([logEntry, ...existing]));
    } catch {
      // ignore storage errors
    }
    if (farmLogIdRef.current) {
      const answers = latestRecords
        .filter(r => r.id && r.correct !== undefined)
        .map(r => ({ questionId: r.id, questionKind: r.questionKind || null, correct: !!r.correct }));

      apiPost("/v1/learning/farm/complete", {
        log_id: farmLogIdRef.current,
        score: accuracy,
        earned_seed: earnedSeed,
        seed_type: chosenSeed?.type || content?.seedReward?.seedType,
        accuracy,
        answers: answers.length > 0 ? answers : undefined,
      }).then((res) => {
        // 서버가 씨앗을 제한한 경우 실제 지급량으로 summary 갱신
        if (res && typeof res.earnedSeed === "number" && res.earnedSeed !== earnedSeed) {
          setSummary((prev) => prev ? { ...prev, earnedSeed: res.earnedSeed, dailySeedRemaining: res.dailySeedRemaining } : prev);
        } else if (res && res.dailySeedRemaining != null) {
          setSummary((prev) => prev ? { ...prev, dailySeedRemaining: res.dailySeedRemaining } : prev);
        }
      }).catch((e) => console.error(e));
    }
  };

  const resetRound = (newSeedCount) => {
    setSeed(newSeedCount ?? content?.seedReward?.count ?? 3);
    setTimeLeft(timeLimit);
    setRecords([]);
    setSeedExhausted(false);
    setSummary(null);
    setStatus("READY");
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
    }, 1000 / timeSpeed);
    return () => clearInterval(intervalRef.current);
  }, [status, timeSpeed]);

  useEffect(() => {
    if (!timePulse) return undefined;
    const timer = setTimeout(() => setTimePulse(null), 520);
    return () => clearTimeout(timer);
  }, [timePulse]);

  useLayoutEffect(() => {
    const measure = () => {
      if (!headerRef.current) return;
      const rect = headerRef.current.getBoundingClientRect();
      setHeaderHeight(rect.height);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [content?.title, content?.targetLevel, content?.subArea, seed]);

  useEffect(() => {
    if (status !== "RUNNING") return;
    if (timeLeft > 0) return;
    setSeed((prev) => {
      const nextSeed = Math.max(0, prev - 1);
      if (nextSeed === 0) {
        if (preventAutoFinish) {
          setSeedExhausted(true);
          setStatus("PAUSED");
          return 0;
        }
        finish(false, { seed: 0 });
        return 0;
      }
      setTimeLeft(timeLimit);
      return nextSeed;
    });
  }, [timeLeft, status, timeLimit, preventAutoFinish]);

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
      seedExhausted,
      resetRound,
      setPageProgress,
      setTimeSpeed,
    }),
    [status, timeLeft, timeLimit, seed, seedExhausted, timeSpeed]
  );

  if (!Module) {
    return (
      <div className="engine-shell">
        <div className="engine-error">
          학습 모듈을 찾을 수 없습니다.
        </div>
      </div>
    );
  }

  const sheetBackground = content?.assets?.sheetBackground || "learning-paper.jpg";
  const shellStyle = {
    "--sheet-bg": "url('" + resolveAssetUrl(sheetBackground) + "')",
    "--question-modal-bg": "url('" + resolveAssetUrl("질문 모달.png") + "')",
    "--mark-correct-bg": "url('" + resolveAssetUrl("정답 동그라미.png") + "')",
    "--mark-wrong-bg": "url('" + resolveAssetUrl("오답 꺾은선.png") + "')",
    "--result-pass-bg": "url('" + resolveAssetUrl("학습 통과 모달.png") + "')",
    "--result-perfect-bg": "url('" + resolveAssetUrl("학습 완료 성공 모달.png") + "')",
    "--result-fail-bg": "url('" + resolveAssetUrl("학습 종료 모달.png") + "')",
  };

  useEffect(() => {
    const root = document.documentElement;
    if (!root) return undefined;
    const entries = Object.entries(shellStyle);
    entries.forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
    return () => {
      entries.forEach(([key]) => {
        root.style.removeProperty(key);
      });
    };
  }, [shellStyle]);

  return (
    <EngineContext.Provider value={contextValue}>
      <div className="engine-shell" style={shellStyle}>
        <div className="engine-header-wrap">
          <header ref={headerRef} className="engine-header engine-scale">
            <div className="engine-header-row">
              <div className="engine-header-item engine-title">
                <strong>{content?.title || "학습"}</strong>
              </div>
              <div className="engine-header-divider" />
              <div className="engine-header-item">
                <strong>
                  {getLevelLabel(content?.targetLevel)}
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
                    <span key={`seed-${idx}`} className="seed-icon" style={seedIconStyle} />
                  ))}
                </div>
              </div>
              <div className="engine-header-divider" />
              <div className="engine-header-item engine-timebar">
                <TimeBar timeLeft={timeLeft} timeLimit={timeLimit} className={timePulse} />
              </div>
            </div>
          </header>
        </div>

        <div className="engine-viewport">
          <div className="engine-stage">
            <div className="engine-stage-inner engine-scale">
              <main
                className={`engine-body ${
                  (content?.payload?.pageStack && moduleKey === "worksheet_quiz") ||
                  moduleKey === "study_content" ||
                  moduleKey === "choice_judgement" ||
                  moduleKey === "sentence_structure" ||
                  moduleKey === "word_formation" ||
                  moduleKey === "phoneme_change" ||
                  moduleKey === "background_knowledge" ||
                  moduleKey === "logic_reasoning" ||
                  moduleKey === "exam"
                    ? "stack"
                    : ""
                } ${screenLevelClass}`}
              >
                <Module content={content} />
              </main>

              {/* 인쇄 전용 통합 레이아웃 — 모듈 type별 시험지 + 정답해설 */}
              <PrintLayout moduleKey={moduleKey} content={content} />

              <footer className="engine-footer">
                <button type="button" className="engine-exit" onClick={onExit}>
                  학습 종료
                </button>
                {moduleKey !== "study_content" && moduleKey !== "answer_key" && (
                  <button type="button" className="engine-print" onClick={handlePrint}>
                    인쇄
                  </button>
                )}
                <div className="engine-footer-item">
                  <span className="engine-footer-label">
                    {pageProgress
                      ? `페이지 ${pageProgress.current}/${pageProgress.total} · 문제 진행 ${progressCurrent}/${progressTotal || "-"}`
                      : `진행 ${progressCurrent} / ${progressTotal || "-"}`}
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
            {summary ? <ResultSummary summary={summary} onExit={onExit} moduleKey={moduleKey} onPrint={handlePrint} /> : null}
      </div>
    </EngineContext.Provider>
  );
}

export default EngineShell;
