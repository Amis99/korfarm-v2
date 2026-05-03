import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { apiGet } from "../utils/adminApi";
import AdminLayout from "../components/AdminLayout";
import "../styles/admin-detail.css";

const SERVERS = [
  { id: "all", label: "전체 서버" },
  { id: "saussure", label: "소쉬르" },
  { id: "frege", label: "프레게" },
  { id: "russell", label: "러셀" },
  { id: "wittgenstein", label: "비트겐슈타인" },
];
const STATUSES = [
  { id: "all", label: "전체 상태" },
  { id: "ONGOING", label: "진행 중" },
  { id: "FINISHED", label: "종료" },
  { id: "ABANDONED", label: "포기" },
];

function AdminDuelMatchesPage({ wrap = true }) {
  const [, setParams] = useSearchParams();
  const [serverFilter, setServerFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [size] = useState(20);
  const [data, setData] = useState({ items: [], totalElements: 0, totalPages: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (serverFilter !== "all") params.set("serverId", serverFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);
      params.set("page", String(page));
      params.set("size", String(size));
      const res = await apiGet(`/v1/admin/duel/matches?${params}`);
      setData(res || { items: [], totalElements: 0, totalPages: 0 });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [serverFilter, statusFilter, page, size]);

  useEffect(() => { load(); }, [load]);

  // 필터 변경 시 page 0
  useEffect(() => { setPage(0); }, [serverFilter, statusFilter]);

  const showDetail = async (matchId) => {
    setDetailLoading(true);
    try {
      const res = await apiGet(`/v1/admin/duel/matches/${matchId}`);
      setDetail(res);
    } catch (e) {
      alert("상세 로드 실패: " + e.message);
    } finally {
      setDetailLoading(false);
    }
  };

  const content = (
    <>
      <div className="admin-detail-header">
        {wrap && <h1>매치 기록</h1>}
      </div>
      <div className="admin-detail-card">
        <h2>매치 목록</h2>
        <div className="admin-detail-toolbar">
          <div className="admin-detail-filters">
            {SERVERS.map(s => (
              <button key={s.id} type="button"
                className={`admin-filter ${serverFilter === s.id ? "active" : ""}`}
                onClick={() => setServerFilter(s.id)}>{s.label}</button>
            ))}
          </div>
          <div className="admin-detail-filters" style={{ marginLeft: 12 }}>
            {STATUSES.map(s => (
              <button key={s.id} type="button"
                className={`admin-filter ${statusFilter === s.id ? "active" : ""}`}
                onClick={() => setStatusFilter(s.id)}>{s.label}</button>
            ))}
          </div>
        </div>
        {loading && <p className="admin-detail-note">불러오는 중...</p>}
        {error && <p className="admin-detail-note error">{error}</p>}
        <table className="admin-detail-table">
          <thead>
            <tr>
              <th>매치 ID</th>
              <th>서버</th>
              <th>상태</th>
              <th>참가자</th>
              <th>승자</th>
              <th>시작</th>
              <th>종료</th>
              <th>액션</th>
            </tr>
          </thead>
          <tbody>
            {data.items.length === 0 && !loading && (
              <tr><td colSpan={8} style={{ textAlign: "center", padding: 24, color: "#888" }}>매치 기록이 없습니다.</td></tr>
            )}
            {data.items.map(m => (
              <tr key={m.id}>
                <td><span className="ldb-pill" style={{ fontSize: 11 }}>{m.id.slice(0, 12)}…</span></td>
                <td>{m.serverId}</td>
                <td>
                  <span className="status-pill" data-status={
                    m.status === "FINISHED" ? "active" :
                    m.status === "ONGOING" ? "pending" : "inactive"
                  }>{m.status}</span>
                </td>
                <td>{m.playerCount}명</td>
                <td style={{ fontSize: 12 }}>{m.winnerDisplay || m.winnerUserId || "-"}</td>
                <td style={{ fontSize: 12 }}>{m.startedAt?.substring(0, 16) || "-"}</td>
                <td style={{ fontSize: 12 }}>{m.endedAt?.substring(0, 16) || "-"}</td>
                <td>
                  <button type="button" className="admin-detail-btn sm" onClick={() => showDetail(m.id)}>상세</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="admin-pagination" style={{ marginTop: 12 }}>
          <button type="button" disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))}>이전</button>
          <span>{page + 1} / {Math.max(data.totalPages, 1)} (총 {data.totalElements}건)</span>
          <button type="button" disabled={page + 1 >= data.totalPages} onClick={() => setPage(p => p + 1)}>다음</button>
        </div>
      </div>

      {detail && (
        <div className="admin-modal-overlay" onClick={() => setDetail(null)}>
          <div className="admin-modal" style={{ maxWidth: 800 }} onClick={(e) => e.stopPropagation()}>
            <h2>매치 상세 — {detail.match?.id?.slice(0, 16)}…</h2>
            {detailLoading && <p>불러오는 중...</p>}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 12 }}>
              <div>
                <strong>서버:</strong> {detail.match?.serverId}<br />
                <strong>상태:</strong> {detail.match?.status}<br />
                <strong>시즌:</strong> {detail.match?.seasonId}<br />
              </div>
              <div>
                <strong>시작:</strong> {detail.match?.startedAt?.substring(0, 19) || "-"}<br />
                <strong>종료:</strong> {detail.match?.endedAt?.substring(0, 19) || "-"}<br />
              </div>
            </div>

            <h3 style={{ marginTop: 12 }}>참가자 ({detail.players?.length})</h3>
            <table className="admin-detail-table" style={{ fontSize: 13 }}>
              <thead><tr><th>참가자</th><th>결과</th><th>순위</th><th>정답</th><th>총 시간(s)</th><th>걸음(씨앗)</th><th>보상</th></tr></thead>
              <tbody>
                {detail.players?.map((p, i) => (
                  <tr key={i}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{p.user?.displayName || p.userId}</div>
                      {!p.user?.isAi && p.user?.school && (
                        <div style={{ fontSize: 11, color: "#888" }}>{p.user.school} {p.user.grade || ""}</div>
                      )}
                    </td>
                    <td><span className="status-pill" data-status={p.result === "WIN" ? "active" : "inactive"}>{p.result}</span></td>
                    <td>{p.rankPosition || "-"}</td>
                    <td>{p.correctCount}</td>
                    <td>{(p.totalTimeMs / 1000).toFixed(1)}</td>
                    <td>{p.stakeAmount}</td>
                    <td>{p.rewardAmount}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h3 style={{ marginTop: 12 }}>풀린 문제 ({detail.questions?.length})</h3>
            {detail.questions?.length === 0 ? (
              <p style={{ fontSize: 12, color: "#888" }}>(이 매치에서 풀린 문제 없음)</p>
            ) : (
              <ol style={{ fontSize: 12, color: "#555", paddingLeft: 20 }}>
                {detail.questions?.map((q, i) => (
                  <li key={i} style={{ marginBottom: 4 }}>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setDetail(null);
                        setParams({ tab: "questions", editId: q.questionId });
                      }}
                      style={{ color: "#2d6a4f", textDecoration: "underline", cursor: "pointer" }}
                    >
                      {q.stem || q.questionId}
                    </a>
                  </li>
                ))}
              </ol>
            )}

            <h3 style={{ marginTop: 12 }}>답변 ({detail.answers?.length})</h3>
            <details>
              <summary style={{ cursor: "pointer", fontSize: 13 }}>모두 보기</summary>
              <table className="admin-detail-table" style={{ fontSize: 12 }}>
                <thead><tr><th>참가자</th><th>questionId</th><th>정답?</th><th>응답시간(ms)</th></tr></thead>
                <tbody>
                  {detail.answers?.map((a, i) => (
                    <tr key={i}>
                      <td>{a.user?.displayName || a.userId}</td>
                      <td>{a.questionId.slice(0, 12)}…</td>
                      <td>{a.isCorrect ? "✅" : "❌"}</td>
                      <td>{a.timeMs}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>

            <div className="admin-modal-actions" style={{ marginTop: 12 }}>
              <button type="button" className="admin-detail-btn secondary" onClick={() => setDetail(null)}>닫기</button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  if (wrap) {
    return (
      <AdminLayout>
        <div className="admin-detail-wrap">{content}</div>
      </AdminLayout>
    );
  }
  return content;
}

export default AdminDuelMatchesPage;
