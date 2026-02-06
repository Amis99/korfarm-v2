import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { apiGet } from "../utils/api";

const SEED_TYPE_LABEL = {
  seed_wheat: "밀 씨앗",
  seed_rice: "쌀 씨앗",
  seed_corn: "옥수수 씨앗",
  seed_grape: "포도 씨앗",
  seed_apple: "사과 씨앗",
};

const CROP_TYPE_LABEL = {
  crop_wheat: "밀",
  crop_rice: "쌀",
  crop_corn: "옥수수",
  crop_grape: "포도",
  crop_apple: "사과",
};

function formatDate(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function SeedLogPage() {
  const { isLoggedIn, user } = useAuth();
  const [searchParams] = useSearchParams();
  const studentId = searchParams.get("studentId");
  const isParent = user?.roles?.includes("PARENT");
  const isViewingChild = isParent && studentId;

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [childName, setChildName] = useState("");

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
        apiGet(`/v1/parents/children/${studentId}/ledger`),
        apiGet(`/v1/parents/children/${studentId}/profile`),
      ])
        .then(([ledger, profile]) => {
          setEntries(ledger || []);
          setChildName(profile?.name || "자녀");
        })
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    } else {
      // 자신의 데이터 조회
      apiGet("/v1/ledger")
        .then(setEntries)
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    }
  }, [isLoggedIn, isViewingChild, studentId]);

  if (!isLoggedIn) {
    return (
      <div style={{ maxWidth: 700, margin: "80px auto", padding: "0 20px", textAlign: "center" }}>
        <h1>씨앗 내역</h1>
        <p style={{ color: "#8a7468", marginTop: 12 }}>로그인 후 확인할 수 있습니다.</p>
        <Link to="/login" style={{ display: "inline-block", marginTop: 24, color: "#ff8f2b", fontWeight: 700 }}>
          로그인하기
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ maxWidth: 700, margin: "80px auto", padding: "0 20px", textAlign: "center" }}>
        <h1>씨앗 내역</h1>
        <p style={{ color: "#8a7468", marginTop: 12 }}>불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: 700, margin: "80px auto", padding: "0 20px", textAlign: "center" }}>
        <h1>씨앗 내역</h1>
        <p style={{ color: "#c0392b", marginTop: 12 }}>오류: {error}</p>
        <Link to="/start" style={{ display: "inline-block", marginTop: 24, color: "#ff8f2b", fontWeight: 700 }}>
          홈으로
        </Link>
      </div>
    );
  }

  // 씨앗 관련 내역만 필터링
  const seedEntries = entries.filter((e) => e.currencyType === "seed");

  return (
    <div style={{ maxWidth: 900, margin: "60px auto", padding: "0 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0 }}>
            {isViewingChild ? `${childName}의 씨앗 내역` : "씨앗 내역"}
          </h1>
          {isViewingChild && (
            <p style={{ margin: "8px 0 0", color: "#666", fontSize: 14 }}>
              자녀의 씨앗 획득/사용 기록입니다.
            </p>
          )}
        </div>
        <Link to="/start" style={{ color: "#ff8f2b", fontWeight: 700 }}>
          홈으로
        </Link>
      </div>

      {seedEntries.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: "#8a7468" }}>
          <p>아직 씨앗 내역이 없습니다.</p>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #d4c5b9", color: "#6b5b50" }}>
                <th style={thStyle}>날짜</th>
                <th style={thStyle}>씨앗 종류</th>
                <th style={thStyle}>변동</th>
                <th style={thStyle}>사유</th>
              </tr>
            </thead>
            <tbody>
              {seedEntries.map((entry) => {
                const itemType = entry.itemType || entry.item_type || "";
                const label = SEED_TYPE_LABEL[itemType] || itemType;
                const delta = entry.delta || 0;
                const reason = entry.reason || "-";
                const createdAt = entry.createdAt || entry.created_at;

                return (
                  <tr key={entry.id} style={{ borderBottom: "1px solid #e8ddd4" }}>
                    <td style={tdStyle}>{formatDate(createdAt)}</td>
                    <td style={tdStyle}>{label}</td>
                    <td style={{ ...tdStyle, color: delta >= 0 ? "#27ae60" : "#c0392b", fontWeight: 600 }}>
                      {delta >= 0 ? `+${delta}` : delta}
                    </td>
                    <td style={{ ...tdStyle, textAlign: "left" }}>{reason}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const thStyle = { padding: "10px 8px", textAlign: "center", whiteSpace: "nowrap" };
const tdStyle = { padding: "10px 8px", textAlign: "center", whiteSpace: "nowrap" };

export default SeedLogPage;
