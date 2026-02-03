import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { apiGet } from "../utils/api";
import { LEARNING_CATALOG } from "../data/learning/learningCatalog";

const catalogMap = Object.fromEntries(
  LEARNING_CATALOG.map((c) => [c.contentId, c])
);

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
  const { isLoggedIn } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }
    apiGet("/v1/learning/farm/history")
      .then((data) => setLogs(data.logs ?? []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [isLoggedIn]);

  if (!isLoggedIn) {
    return (
      <div style={{ maxWidth: 700, margin: "80px auto", padding: "0 20px", textAlign: "center" }}>
        <h1>학습 히스토리</h1>
        <p style={{ color: "#8a7468", marginTop: 12 }}>로그인 후 학습 기록을 확인할 수 있습니다.</p>
        <Link to="/login" style={{ display: "inline-block", marginTop: 24, color: "#ff8f2b", fontWeight: 700 }}>
          로그인하기
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ maxWidth: 700, margin: "80px auto", padding: "0 20px", textAlign: "center" }}>
        <h1>학습 히스토리</h1>
        <p style={{ color: "#8a7468", marginTop: 12 }}>불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: 700, margin: "80px auto", padding: "0 20px", textAlign: "center" }}>
        <h1>학습 히스토리</h1>
        <p style={{ color: "#c0392b", marginTop: 12 }}>오류가 발생했습니다: {error}</p>
        <Link to="/start" style={{ display: "inline-block", marginTop: 24, color: "#ff8f2b", fontWeight: 700 }}>
          홈으로 돌아가기
        </Link>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div style={{ maxWidth: 700, margin: "80px auto", padding: "0 20px", textAlign: "center" }}>
        <h1>학습 히스토리</h1>
        <p style={{ color: "#8a7468", marginTop: 12 }}>아직 학습 기록이 없습니다.</p>
        <Link to="/farm" style={{ display: "inline-block", marginTop: 24, color: "#ff8f2b", fontWeight: 700 }}>
          학습하러 가기
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: "60px auto", padding: "0 20px" }}>
      <h1 style={{ textAlign: "center", marginBottom: 24 }}>학습 히스토리</h1>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #d4c5b9", color: "#6b5b50" }}>
              <th style={thStyle}>날짜</th>
              <th style={thStyle}>학습명</th>
              <th style={thStyle}>레벨</th>
              <th style={thStyle}>영역</th>
              <th style={thStyle}>수행 시간</th>
              <th style={thStyle}>진행률</th>
              <th style={thStyle}>정답률</th>
              <th style={thStyle}>획득 씨앗</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => {
              const catalog = catalogMap[log.contentId];
              const date = log.startedAt ? new Date(log.startedAt).toLocaleDateString("ko-KR") : "-";
              const title = catalog?.title ?? log.contentType;
              const level = catalog?.targetLevel?.replace("_", " ") ?? "-";
              const area = catalog?.category ?? "-";
              const duration = formatDuration(log.startedAt, log.completedAt);
              const progress = log.status === "COMPLETED" ? "100%" : "진행중";
              const accuracy = log.accuracy != null ? `${log.accuracy}%` : "-";
              const seed = log.earnedSeed > 0 ? log.earnedSeed : "-";

              return (
                <tr key={log.logId} style={{ borderBottom: "1px solid #e8ddd4" }}>
                  <td style={tdStyle}>{date}</td>
                  <td style={{ ...tdStyle, textAlign: "left" }}>{title}</td>
                  <td style={tdStyle}>{level}</td>
                  <td style={tdStyle}>{area}</td>
                  <td style={tdStyle}>{duration}</td>
                  <td style={tdStyle}>
                    <span style={{ color: log.status === "COMPLETED" ? "#27ae60" : "#e67e22" }}>
                      {progress}
                    </span>
                  </td>
                  <td style={tdStyle}>{accuracy}</td>
                  <td style={tdStyle}>{seed}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{ textAlign: "center", marginTop: 24 }}>
        <Link to="/start" style={{ color: "#ff8f2b", fontWeight: 700 }}>
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}

const thStyle = { padding: "10px 8px", textAlign: "center", whiteSpace: "nowrap" };
const tdStyle = { padding: "10px 8px", textAlign: "center", whiteSpace: "nowrap" };

export default HarvestLedgerPage;
