import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { apiGet } from "../utils/api";
import { TYPE_LABEL } from "../constants/contentTypes";
import Pagination from "../components/Pagination";
import usePagination from "../hooks/usePagination";
import "../styles/start.css";

const MODULE_LABELS = {
  worksheet_quiz: "공통 퀴즈", reading_training: "독해 훈련",
  choice_judgement: "선택지 판별", phoneme_change: "음운 변동",
  word_formation: "단어의 형성", sentence_structure: "문장의 짜임",
  content_pdf: "내용 숙지", answer_key: "정답·해설",
  background_knowledge: "배경지식", logic_reasoning: "논리사고력",
  daily_quiz: "일일 퀴즈", morpheme_analysis: "형태소 분석",
  daily_reading: "일일 독해", DAILY_QUIZ: "일일 퀴즈", DAILY_READING: "일일 독해",
};

const SEED_TYPE_LABEL = {
  seed_wheat: "밀", seed_rice: "쌀", seed_corn: "옥수수",
  seed_grape: "포도", seed_apple: "사과",
};

function formatDuration(startedAt, completedAt) {
  if (!completedAt) return "-";
  const ms = new Date(completedAt) - new Date(startedAt);
  if (ms < 0) return "-";
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${String(sec).padStart(2, "0")}`;
}

function HarvestLedgerPage() {
  const { isLoggedIn, user } = useAuth();
  const [searchParams] = useSearchParams();
  const studentId = searchParams.get("studentId");
  const isParent = user?.roles?.includes("PARENT");
  const isViewingChild = isParent && studentId;

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [childName, setChildName] = useState("");

  const { page, setPage, totalPages, paged } = usePagination(logs, 20);

  useEffect(() => {
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    if (isViewingChild) {
      // 부모가 자녀 데이터 조회
      Promise.all([
        apiGet(`/v1/parents/children/${studentId}/farm/history`),
        apiGet(`/v1/parents/children/${studentId}/profile`),
      ])
        .then(([historyData, profile]) => {
          setLogs(historyData.logs ?? []);
          setChildName(profile?.name || "자녀");
        })
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    } else {
      // 자신의 데이터 조회
      apiGet("/v1/learning/farm/history")
        .then((data) => setLogs(data.logs ?? []))
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    }
  }, [isLoggedIn, isViewingChild, studentId]);

  if (!isLoggedIn) {
    return (
      <div className="page-center">
        <h1>학습 히스토리</h1>
        <p className="text-muted">로그인 후 학습 기록을 확인할 수 있습니다.</p>
        <Link to="/login" className="link-action">로그인하기</Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page-center">
        <h1>학습 히스토리</h1>
        <p className="text-muted">불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-center">
        <h1>학습 히스토리</h1>
        <p className="text-error">오류가 발생했습니다: {error}</p>
        <Link to="/start" className="link-action">홈으로 돌아가기</Link>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="page-center">
        <h1>학습 히스토리</h1>
        <p className="text-muted">아직 학습 기록이 없습니다.</p>
        <Link to="/farm" className="link-action">학습하러 가기</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: "60px auto", padding: "0 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0 }}>
            {isViewingChild ? `${childName}의 학습 히스토리` : "학습 히스토리"}
          </h1>
          {isViewingChild && (
            <p style={{ margin: "8px 0 0", color: "#666", fontSize: 14 }}>
              자녀의 학습 수행 기록입니다.
            </p>
          )}
        </div>
        <Link to="/start" className="link-action" style={{ marginTop: 0 }}>홈으로</Link>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table className="common-table">
          <thead>
            <tr>
              <th>날짜</th>
              <th>학습명</th>
              <th>레벨</th>
              <th>영역</th>
              <th>수행 시간</th>
              <th>진행률</th>
              <th>정답률</th>
              <th>획득 씨앗</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((log) => {
              const id = log.log_id ?? log.logId;
              const contentType = log.content_type ?? log.contentType;
              const contentTitle = log.content_title ?? log.contentTitle;
              const startedAt = log.started_at ?? log.startedAt;
              const completedAt = log.completed_at ?? log.completedAt;
              const earnedSeed = log.earned_seed ?? log.earnedSeed ?? 0;
              const earnedSeedType = log.earned_seed_type ?? log.earnedSeedType;
              const date = startedAt
                ? new Date(startedAt).toLocaleString("ko-KR", {
                    year: "numeric", month: "2-digit", day: "2-digit",
                    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
                  })
                : "-";
              const title = contentTitle || TYPE_LABEL[contentType] || MODULE_LABELS[contentType] || contentType;
              const level = "-";
              const area = "-";
              const duration = formatDuration(startedAt, completedAt);
              const progress = log.status === "COMPLETED" ? "100%" : "진행중";
              const accuracy = log.accuracy != null ? `${log.accuracy}%` : "-";
              const seedTypeLabel = SEED_TYPE_LABEL[earnedSeedType] || "";
              const seed = earnedSeed > 0 ? `${seedTypeLabel ? seedTypeLabel + " " : ""}${earnedSeed}개` : "-";

              return (
                <tr key={id}>
                  <td>{date}</td>
                  <td style={{ textAlign: "left" }}>{title}</td>
                  <td>{level}</td>
                  <td>{area}</td>
                  <td>{duration}</td>
                  <td>
                    <span style={{ color: log.status === "COMPLETED" ? "#27ae60" : "#e67e22" }}>
                      {progress}
                    </span>
                  </td>
                  <td>{accuracy}</td>
                  <td>{seed}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      <div style={{ textAlign: "center", marginTop: 24 }}>
        <Link to="/start" className="link-action">홈으로 돌아가기</Link>
      </div>
    </div>
  );
}

export default HarvestLedgerPage;
