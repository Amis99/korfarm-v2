import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { apiGet } from "../utils/api";
import "../styles/start.css";

const SEED_LABELS = {
  seed_wheat: "밀",
  seed_rice: "쌀",
  seed_corn: "옥수수",
  seed_grape: "포도",
  seed_apple: "사과",
};

const PER_PAGE = 20;

function SeedLedgerPage() {
  const { isLoggedIn } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!isLoggedIn) { setLoading(false); return; }
    apiGet("/v1/ledger")
      .then((data) => {
        const seeds = (data || []).filter((e) => e.currencyType === "seed");
        setEntries(seeds);
      })
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [isLoggedIn]);

  const fmtDate = (d) => {
    if (!d) return "";
    const dt = new Date(d);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")} ${String(dt.getHours()).padStart(2, "0")}:${String(dt.getMinutes()).padStart(2, "0")}`;
  };

  const totalPages = Math.max(1, Math.ceil(entries.length / PER_PAGE));
  const visible = entries.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  if (!isLoggedIn) {
    return (
      <div className="page-center">
        <h1>씨앗 원장</h1>
        <p className="text-muted">로그인 후 확인할 수 있습니다.</p>
        <Link to="/login" className="link-action">로그인하기</Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page-center">
        <h1>씨앗 원장</h1>
        <p className="text-muted">불러오는 중...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: "60px auto", padding: "0 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>씨앗 원장</h1>
        <Link to="/start" className="link-action" style={{ marginTop: 0 }}>홈으로</Link>
      </div>

      {entries.length === 0 ? (
        <p className="text-muted">아직 씨앗 획득 내역이 없습니다.</p>
      ) : (
        <>
          <div style={{ overflowX: "auto" }}>
            <table className="common-table">
              <thead>
                <tr>
                  <th>날짜</th>
                  <th>씨앗 종류</th>
                  <th>수량</th>
                  <th>사유</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((entry, i) => (
                  <tr key={entry.id || i}>
                    <td>{fmtDate(entry.createdAt)}</td>
                    <td>{SEED_LABELS[entry.itemType] || SEED_LABELS[entry.seedType] || entry.itemType || "씨앗"}</td>
                    <td style={{ color: entry.delta > 0 ? "#27ae60" : "#e74c3c", fontWeight: 600 }}>
                      {entry.delta > 0 ? `+${entry.delta}` : entry.delta}
                    </td>
                    <td>{entry.reason || ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: 4, marginTop: 16 }}>
              <button disabled={page <= 1} onClick={() => setPage(page - 1)}>이전</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button key={p} style={{ fontWeight: p === page ? 700 : 400 }} onClick={() => setPage(p)}>
                  {p}
                </button>
              ))}
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>다음</button>
            </div>
          )}
        </>
      )}

      <div style={{ textAlign: "center", marginTop: 24 }}>
        <Link to="/start" className="link-action">홈으로 돌아가기</Link>
      </div>
    </div>
  );
}

export default SeedLedgerPage;
