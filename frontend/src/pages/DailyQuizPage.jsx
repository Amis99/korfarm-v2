import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import EngineShell from "../engine/core/EngineShell";
import { apiPost, TOKEN_KEY } from "../utils/api";
const BASE = import.meta.env.BASE_URL || "/";

const LEVEL_FOLDER_MAP = {
  saussure1: "saussure1",
  saussure2: "saussure2",
  saussure3: "saussure3",
  frege1: "frege1",
  frege2: "frege2",
  frege3: "frege3",
  russell1: "russell1",
  russell2: "russell2",
  russell3: "russell3",
  wittgenstein1: "wittgenstein1",
  wittgenstein2: "wittgenstein2",
  wittgenstein3: "wittgenstein3",
};

const GRADE_TO_LEVEL = {
  "초1": "saussure1",
  "초2": "saussure2",
  "초3": "saussure3",
  "초4": "frege1",
  "초5": "frege2",
  "초6": "frege3",
  "중1": "russell1",
  "중2": "russell2",
  "중3": "russell3",
  "고1": "wittgenstein1",
  "고2": "wittgenstein2",
  "고3": "wittgenstein3",
  "1": "saussure1",
  "2": "saussure2",
  "3": "saussure3",
  "4": "frege1",
  "5": "frege2",
  "6": "frege3",
  "7": "russell1",
  "8": "russell2",
  "9": "russell3",
  "10": "wittgenstein1",
  "11": "wittgenstein2",
  "12": "wittgenstein3",
};

function getDayOfYear() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now - start;
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

function DailyQuizPage() {
  const navigate = useNavigate();
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [farmLogId, setFarmLogId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadQuiz() {
      try {
        const token = localStorage.getItem(TOKEN_KEY);
        if (!token) {
          navigate("/login");
          return;
        }

        const meRes = await fetch("/v1/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!meRes.ok) {
          navigate("/login");
          return;
        }
        const meData = await meRes.json();
        const profile = meData.data;

        let level = profile.level_id || profile.levelId;
        if (!level || !LEVEL_FOLDER_MAP[level]) {
          const gradeLabel = (profile.grade_label || profile.gradeLabel || "")?.trim();
          const gradeNum = gradeLabel?.replace(/[^0-9]/g, "");
          level = GRADE_TO_LEVEL[gradeLabel] || GRADE_TO_LEVEL[gradeNum] || "saussure1";
        }

        const folder = LEVEL_FOLDER_MAP[level] || "saussure1";
        const learningStartDate = profile.learning_start_date || profile.learningStartDate || null;
        let dayIndex;
        if (learningStartDate) {
          const start = new Date(learningStartDate);
          const now = new Date();
          start.setHours(0, 0, 0, 0);
          now.setHours(0, 0, 0, 0);
          const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24));
          dayIndex = (diff % 365) + 1;
        } else {
          dayIndex = ((getDayOfYear() - 1) % 365) + 1;
        }
        const dayStr = String(dayIndex).padStart(3, "0");

        const isJson = (res) =>
          res.ok && (res.headers.get("content-type") || "").includes("application/json");

        const quizRes = await fetch(`${BASE}daily-quiz/${folder}/${dayStr}.json`);
        let quizData = null;
        if (isJson(quizRes)) {
          quizData = await quizRes.json();
          if (!cancelled) setContent(quizData);
        } else {
          const fallbackRes = await fetch(`${BASE}daily-quiz/${folder}/001.json`);
          if (!isJson(fallbackRes)) throw new Error("퀴즈 데이터를 불러올 수 없습니다.");
          quizData = await fallbackRes.json();
          if (!cancelled) setContent(quizData);
        }
        if (quizData && !cancelled) {
          apiPost("/v1/learning/farm/start", {
            content_id: quizData.contentId || `daily-quiz-${folder}-${dayStr}`,
            content_type: "DAILY_QUIZ",
          }).then((res) => { if (!cancelled) setFarmLogId(res.log_id ?? res.logId); }).catch((e) => console.error(e));
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadQuiz();
    return () => { cancelled = true; };
  }, [navigate]);

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center", fontFamily: "var(--font-body)" }}>
        <p>일일 퀴즈를 불러오는 중...</p>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div style={{ padding: 40, textAlign: "center", fontFamily: "var(--font-body)" }}>
        <h2>퀴즈를 불러올 수 없습니다</h2>
        <p>{error || "데이터가 없습니다."}</p>
        <button type="button" onClick={() => navigate("/start")}>홈으로 돌아가기</button>
      </div>
    );
  }

  return (
    <EngineShell
      content={content}
      moduleKey="worksheet_quiz"
      onExit={() => navigate("/start")}
      farmLogId={farmLogId}
    />
  );
}

export default DailyQuizPage;
