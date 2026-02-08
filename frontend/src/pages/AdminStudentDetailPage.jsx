import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiGet, apiPost } from "../utils/adminApi";
import AdminLayout from "../components/AdminLayout";
import "../styles/admin-detail.css";

const SEED_LABELS = { seed_wheat: "밀", seed_rice: "쌀", seed_corn: "옥수수", seed_grape: "포도", seed_apple: "사과" };
const CROP_LABELS = { crop_wheat: "밀", crop_rice: "쌀", crop_corn: "옥수수", crop_grape: "포도", crop_apple: "사과" };

const LEVEL_LABEL_MAP = {
  saussure1: "소쉬르 1", saussure2: "소쉬르 2", saussure3: "소쉬르 3",
  frege1: "프레게 1", frege2: "프레게 2", frege3: "프레게 3",
  russell1: "러셀 1", russell2: "러셀 2", russell3: "러셀 3",
  wittgenstein1: "비트겐슈타인 1", wittgenstein2: "비트겐슈타인 2", wittgenstein3: "비트겐슈타인 3",
};

const TABS = [
  { key: "info", label: "기본 정보" },
  { key: "learning", label: "학습 현황" },
  { key: "tests", label: "테스트 성적" },
  { key: "inventory", label: "인벤토리" },
  { key: "duel", label: "대결 전적" },
];

const contentTypeLabel = (t) => {
  if (!t) return "-";
  if (t === "daily_quiz") return "일일 퀴즈";
  if (t === "daily_reading") return "일일 독해";
  if (t === "pro_mode") return "프로 모드";
  if (t === "farm_mode") return "농장별 모드";
  return t;
};

function AdminStudentDetailPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState("info");
  const [student, setStudent] = useState(null);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [learningLogs, setLearningLogs] = useState([]);
  const [loadingLearning, setLoadingLearning] = useState(false);
  const [learningLoaded, setLearningLoaded] = useState(false);
  const [testHistory, setTestHistory] = useState([]);
  const [loadingTests, setLoadingTests] = useState(false);
  const [testsLoaded, setTestsLoaded] = useState(false);
  const [inventory, setInventory] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [inventoryLoaded, setInventoryLoaded] = useState(false);
  const [duelStats, setDuelStats] = useState(null);
  const [loadingDuel, setLoadingDuel] = useState(false);
  const [duelLoaded, setDuelLoaded] = useState(false);
  const [grantForm, setGrantForm] = useState({ type: "seed", itemType: "seed_wheat", amount: 1, reason: "" });
  const [grantLoading, setGrantLoading] = useState(false);
  const [grantError, setGrantError] = useState("");
  const [grantSuccess, setGrantSuccess] = useState("");

  useEffect(() => {
    setLoadingInfo(true);
    apiGet("/v1/admin/students")
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        const found = list.find((s) => (s.userId || s.id || s.user_id) === userId);
        setStudent(found || null);
      })
      .catch(() => {})
      .finally(() => setLoadingInfo(false));
  }, [userId]);

  useEffect(() => {
    if (tab === "learning" && !learningLoaded) {
      setLoadingLearning(true);
      apiGet(`/v1/admin/students/${userId}/learning-logs`)
        .then((data) => { const logs = data?.logs || data || []; setLearningLogs(Array.isArray(logs) ? logs : []); })
        .catch(() => {})
        .finally(() => { setLoadingLearning(false); setLearningLoaded(true); });
    }
    if (tab === "tests" && !testsLoaded) {
      setLoadingTests(true);
      apiGet(`/v1/admin/students/${userId}/test-history`)
        .then((data) => { setTestHistory(Array.isArray(data) ? data : []); })
        .catch(() => {})
        .finally(() => { setLoadingTests(false); setTestsLoaded(true); });
    }
    if (tab === "inventory" && !inventoryLoaded) {
      setLoadingInventory(true);
      Promise.all([
        apiGet(`/v1/admin/students/${userId}/inventory`).catch(() => null),
        apiGet(`/v1/admin/students/${userId}/ledger`).catch(() => []),
      ]).then(([inv, ldg]) => { setInventory(inv); setLedger(Array.isArray(ldg) ? ldg : []); })
        .finally(() => { setLoadingInventory(false); setInventoryLoaded(true); });
    }
    if (tab === "duel" && !duelLoaded) {
      setLoadingDuel(true);
      apiGet(`/v1/admin/students/${userId}/duel-stats`)
        .then(setDuelStats)
        .catch(() => setDuelStats({ wins: 0, losses: 0, winRate: 0, currentStreak: 0, bestStreak: 0, forfeitLosses: 0 }))
        .finally(() => { setLoadingDuel(false); setDuelLoaded(true); });
    }
  }, [tab, userId]);

  const seasonScore = useMemo(() => {
    if (!inventory) return 0;
    const seeds = inventory.seeds || {};
    const crops = inventory.crops || {};
    const totalSeeds = Object.values(seeds).reduce((a, b) => a + (typeof b === "number" ? b : 0), 0);
    const cw = crops.crop_wheat ?? 0;
    const cr = crops.crop_rice ?? 0;
    const cc = crops.crop_corn ?? 0;
    const cg = crops.crop_grape ?? 0;
    const ca = crops.crop_apple ?? 0;
    return (cw * cr * cc * cg * ca) * 50 + totalSeeds;
  }, [inventory]);

  const handleGrant = async (mode) => {
    setGrantError(""); setGrantSuccess("");
    if (grantForm.amount < 1) { setGrantError("수량은 1 이상이어야 합니다."); return; }
    if (!grantForm.reason.trim()) { setGrantError("사유를 입력해 주세요."); return; }
    setGrantLoading(true);
    try {
      const endpoint = mode === "grant" ? `/v1/admin/students/${userId}/inventory/grant` : `/v1/admin/students/${userId}/inventory/deduct`;
      const result = await apiPost(endpoint, { type: grantForm.type, itemType: grantForm.type !== "fertilizer" ? grantForm.itemType : undefined, amount: grantForm.amount, reason: grantForm.reason.trim() });
      if (result?.inventory) setInventory(result.inventory);
      setGrantSuccess(mode === "grant" ? "지급 완료!" : "차감 완료!");
      setGrantForm({ ...grantForm, amount: 1, reason: "" });
      apiGet(`/v1/admin/students/${userId}/ledger`).then((ldg) => setLedger(Array.isArray(ldg) ? ldg : [])).catch(() => {});
    } catch (err) { setGrantError(err.message); } finally { setGrantLoading(false); }
  };

  const sName = student?.name || "-";
  const sEmail = student?.loginId || student?.email || "-";
  const sLevel = student?.levelId || student?.level_id || "-";
  const sLevelLabel = LEVEL_LABEL_MAP[sLevel] || sLevel;
  const sSchool = student?.school || "-";
  const sOrg = student?.orgName || student?.org_name || "-";
  const sStatus = student?.status || "-";
  const sSubStatus = student?.subscriptionStatus || student?.subscription_status || null;
  const sSubEnd = student?.subscriptionEndAt || student?.subscription_end_at || null;
  const sGrade = student?.gradeLabel || student?.grade_label || "-";
  const sStudentPhone = student?.studentPhone || student?.student_phone || "-";
  const sParentPhone = student?.parentPhone || student?.parent_phone || "-";
  const sRegion = student?.region || "-";

  const tabStyle = (key) => ({ padding: "8px 16px", borderRadius: "999px", border: tab === key ? "1px solid rgba(240,108,36,0.6)" : "1px solid rgba(240,108,36,0.2)", background: tab === key ? "rgba(240,108,36,0.24)" : "rgba(240,108,36,0.08)", color: "#f3f6f1", fontWeight: 700, fontSize: 13, cursor: "pointer" });

  return (
    <AdminLayout>
      <div className="admin-detail-wrap">
        <div className="admin-detail-header">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button className="admin-detail-btn secondary" onClick={() => navigate("/admin/students")} style={{ fontSize: 13, padding: "6px 12px" }}>&larr; 목록</button>
            <h1>{loadingInfo ? "로딩 중..." : `${sName} 학생 상세`}</h1>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "20px 0 16px" }}>
          {TABS.map((t) => (<button key={t.key} style={tabStyle(t.key)} onClick={() => setTab(t.key)}>{t.label}</button>))}
        </div>

        {tab === "info" && (
          <div className="admin-detail-card">
            <h2>기본 정보</h2>
            {loadingInfo ? (<p className="admin-detail-note">로딩 중...</p>) : !student ? (<p className="admin-detail-note error">학생 정보를 찾을 수 없습니다.</p>) : (
              <table className="admin-detail-table" style={{ maxWidth: 600 }}><tbody>
                <tr><td style={{ fontWeight: 700, width: 120 }}>이름</td><td>{sName}</td></tr>
                <tr><td style={{ fontWeight: 700 }}>아이디</td><td>{sEmail}</td></tr>
                <tr><td style={{ fontWeight: 700 }}>레벨</td><td>{sLevelLabel}</td></tr>
                <tr><td style={{ fontWeight: 700 }}>학교</td><td>{sSchool}</td></tr>
                <tr><td style={{ fontWeight: 700 }}>학년</td><td>{sGrade}</td></tr>
                <tr><td style={{ fontWeight: 700 }}>기관</td><td>{sOrg}</td></tr>
                <tr><td style={{ fontWeight: 700 }}>지역</td><td>{sRegion}</td></tr>
                <tr><td style={{ fontWeight: 700 }}>학생 연락처</td><td>{sStudentPhone}</td></tr>
                <tr><td style={{ fontWeight: 700 }}>학부모 연락처</td><td>{sParentPhone}</td></tr>
                <tr><td style={{ fontWeight: 700 }}>상태</td><td><span className="status-pill" data-status={sStatus}>{sStatus}</span></td></tr>
                <tr><td style={{ fontWeight: 700 }}>구독</td><td><span className="status-pill" data-status={sSubStatus === "active" ? "active" : "inactive"}>{sSubStatus === "active" ? "유료" : "무료"}</span>{sSubEnd && <span style={{ marginLeft: 8, fontSize: 12, color: "#a6b6a9" }}>~{sSubEnd.slice(0, 10)}</span>}</td></tr>
              </tbody></table>
            )}
          </div>
        )}

        {tab === "learning" && (
          <div className="admin-detail-card">
            <h2>학습 현황</h2>
            {loadingLearning ? (<p className="admin-detail-note">로딩 중...</p>) : learningLogs.length === 0 ? (<p className="admin-detail-note">학습 기록이 없습니다.</p>) : (
              <>
                <p className="admin-detail-note" style={{ marginBottom: 12 }}>최근 {learningLogs.length}건 (완료: {learningLogs.filter((l) => l.status === "COMPLETED").length}건)</p>
                <div style={{ overflowX: "auto" }}>
                  <table className="admin-detail-table"><thead><tr><th>유형</th><th>콘텐츠 ID</th><th>상태</th><th>점수</th><th>정답률</th><th>획득 씨앗</th><th>시작일</th><th>완료일</th></tr></thead>
                    <tbody>{learningLogs.map((log, i) => (
                      <tr key={log.logId || i}>
                        <td>{contentTypeLabel(log.contentType)}</td>
                        <td style={{ fontSize: 12, maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis" }}>{log.contentId}</td>
                        <td><span className="status-pill" data-status={log.status === "COMPLETED" ? "active" : "pending"}>{log.status === "COMPLETED" ? "완료" : "진행중"}</span></td>
                        <td>{log.score ?? "-"}</td>
                        <td>{log.accuracy != null ? `${log.accuracy}%` : "-"}</td>
                        <td>{log.earnedSeed > 0 ? `+${log.earnedSeed}` : "-"}</td>
                        <td style={{ fontSize: 12 }}>{log.startedAt ? log.startedAt.replace("T", " ").slice(0, 16) : "-"}</td>
                        <td style={{ fontSize: 12 }}>{log.completedAt ? log.completedAt.replace("T", " ").slice(0, 16) : "-"}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {tab === "tests" && (
          <div className="admin-detail-card">
            <h2>테스트 응시 이력</h2>
            {loadingTests ? (<p className="admin-detail-note">로딩 중...</p>) : testHistory.length === 0 ? (<p className="admin-detail-note">테스트 응시 기록이 없습니다.</p>) : (
              <div style={{ overflowX: "auto" }}>
                <table className="admin-detail-table"><thead><tr><th>시험명</th><th>시험일</th><th>점수</th><th>만점</th><th>정답</th><th>총문항</th><th>정답률</th><th>제출일</th><th>성적표</th></tr></thead>
                  <tbody>{testHistory.map((t, i) => (
                    <tr key={t.testId || i}>
                      <td>{t.testTitle || "-"}</td>
                      <td style={{ fontSize: 12 }}>{t.examDate || "-"}</td>
                      <td style={{ fontWeight: 700 }}>{t.score}</td>
                      <td>{t.totalPoints}</td>
                      <td>{t.correctCount}</td>
                      <td>{t.totalQuestions}</td>
                      <td>{t.accuracy != null ? `${t.accuracy}%` : "-"}</td>
                      <td style={{ fontSize: 12 }}>{t.submittedAt ? String(t.submittedAt).replace("T", " ").slice(0, 16) : "-"}</td>
                      <td><button className="admin-detail-btn secondary" style={{ fontSize: 11, padding: "3px 8px" }} onClick={() => navigate(`/admin/tests/${t.testId}`)}>상세</button></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === "inventory" && (
          <div style={{ display: "grid", gap: 20 }}>
            <div className="admin-detail-card">
              <h2>보유 현황</h2>
              {loadingInventory ? (<p className="admin-detail-note">로딩 중...</p>) : !inventory ? (<p className="admin-detail-note">인벤토리 정보를 불러올 수 없습니다.</p>) : (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                    <div>
                      <h3 style={{ fontSize: 14, color: "#f06c24", margin: "0 0 8px" }}>씨앗</h3>
                      {Object.entries(SEED_LABELS).map(([key, label]) => (<div key={key} style={{ fontSize: 13, marginBottom: 4 }}>{label}: <strong>{(inventory.seeds || {})[key] ?? 0}</strong></div>))}
                    </div>
                    <div>
                      <h3 style={{ fontSize: 14, color: "#f06c24", margin: "0 0 8px" }}>수확물</h3>
                      {Object.entries(CROP_LABELS).map(([key, label]) => (<div key={key} style={{ fontSize: 13, marginBottom: 4 }}>{label}: <strong>{(inventory.crops || {})[key] ?? 0}</strong></div>))}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 24, fontSize: 14, marginBottom: 8 }}>
                    <span>비료: <strong>{inventory.fertilizer ?? 0}</strong></span>
                    <span style={{ color: "#f06c24", fontWeight: 700 }}>시즌 점수: {seasonScore.toLocaleString()}</span>
                  </div>
                  <div style={{ padding: "8px 12px", background: "rgba(240,108,36,0.08)", borderRadius: 10, fontSize: 11, color: "#a6b6a9" }}>시즌 점수 = (밀 x 쌀 x 옥수수 x 포도 x 사과) x 50 + 총씨앗</div>
                </>
              )}
            </div>
            <div className="admin-detail-card">
              <h2>씨앗/수확물/비료 지급/차감</h2>
              {grantError && <p className="admin-detail-note error">{grantError}</p>}
              {grantSuccess && <p className="admin-detail-note" style={{ color: "#9dd6b0" }}>{grantSuccess}</p>}
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end", marginTop: 8 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, color: "#a6b6a9", marginBottom: 4 }}>종류</label>
                  <select value={grantForm.type} onChange={(e) => setGrantForm({ ...grantForm, type: e.target.value })} style={{ background: "#1a2118", border: "1px solid rgba(240,108,36,0.28)", color: "#f3f6f1", borderRadius: 8, padding: "6px 10px", fontSize: 13 }}>
                    <option value="seed">씨앗</option><option value="crop">수확물</option><option value="fertilizer">비료</option>
                  </select>
                </div>
                {grantForm.type !== "fertilizer" && (
                  <div>
                    <label style={{ display: "block", fontSize: 12, color: "#a6b6a9", marginBottom: 4 }}>항목</label>
                    <select value={grantForm.itemType} onChange={(e) => setGrantForm({ ...grantForm, itemType: e.target.value })} style={{ background: "#1a2118", border: "1px solid rgba(240,108,36,0.28)", color: "#f3f6f1", borderRadius: 8, padding: "6px 10px", fontSize: 13 }}>
                      {grantForm.type === "seed" ? Object.entries(SEED_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>) : Object.entries(CROP_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                )}
                <div>
                  <label style={{ display: "block", fontSize: 12, color: "#a6b6a9", marginBottom: 4 }}>수량</label>
                  <input type="number" min="1" value={grantForm.amount} onChange={(e) => setGrantForm({ ...grantForm, amount: parseInt(e.target.value) || 1 })} style={{ width: 60, background: "#1a2118", border: "1px solid rgba(240,108,36,0.28)", color: "#f3f6f1", borderRadius: 8, padding: "6px 10px", fontSize: 13 }} />
                </div>
                <div style={{ flex: 1, minWidth: 120 }}>
                  <label style={{ display: "block", fontSize: 12, color: "#a6b6a9", marginBottom: 4 }}>사유</label>
                  <input value={grantForm.reason} onChange={(e) => setGrantForm({ ...grantForm, reason: e.target.value })} placeholder="지급/차감 사유" style={{ width: "100%", background: "#1a2118", border: "1px solid rgba(240,108,36,0.28)", color: "#f3f6f1", borderRadius: 8, padding: "6px 10px", fontSize: 13, boxSizing: "border-box" }} />
                </div>
                <button className="admin-detail-btn" style={{ fontSize: 13 }} onClick={() => handleGrant("grant")} disabled={grantLoading}>지급</button>
                <button className="admin-detail-btn secondary" style={{ fontSize: 13 }} onClick={() => handleGrant("deduct")} disabled={grantLoading}>차감</button>
              </div>
            </div>
            <div className="admin-detail-card">
              <h2>최근 경제 내역</h2>
              {ledger.length === 0 ? (<p className="admin-detail-note">경제 내역이 없습니다.</p>) : (
                <div style={{ overflowX: "auto" }}>
                  <table className="admin-detail-table"><thead><tr><th>종류</th><th>항목</th><th>변동</th><th>사유</th><th>일시</th></tr></thead>
                    <tbody>{ledger.slice(0, 50).map((e, i) => (
                      <tr key={e.id || i}>
                        <td>{e.currencyType || e.currency_type || "-"}</td>
                        <td>{e.itemType || e.item_type || "-"}</td>
                        <td style={{ color: (e.delta || 0) > 0 ? "#9dd6b0" : "#f0a59c", fontWeight: 700 }}>{(e.delta || 0) > 0 ? "+" : ""}{e.delta || 0}</td>
                        <td style={{ fontSize: 12, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>{e.reason || "-"}</td>
                        <td style={{ fontSize: 12 }}>{e.createdAt ? String(e.createdAt).replace("T", " ").slice(0, 16) : "-"}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "duel" && (
          <div className="admin-detail-card">
            <h2>대결 전적</h2>
            {loadingDuel ? (<p className="admin-detail-note">로딩 중...</p>) : !duelStats ? (<p className="admin-detail-note">대결 전적을 불러올 수 없습니다.</p>) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 16, marginTop: 12 }}>
                <div style={{ background: "rgba(240,108,36,0.08)", borderRadius: 14, padding: 16, textAlign: "center" }}>
                  <div style={{ fontSize: 12, color: "#a6b6a9", marginBottom: 4 }}>승리</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: "#9dd6b0" }}>{duelStats.wins}</div>
                </div>
                <div style={{ background: "rgba(240,108,36,0.08)", borderRadius: 14, padding: 16, textAlign: "center" }}>
                  <div style={{ fontSize: 12, color: "#a6b6a9", marginBottom: 4 }}>패배</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: "#f0a59c" }}>{duelStats.losses}</div>
                </div>
                <div style={{ background: "rgba(240,108,36,0.08)", borderRadius: 14, padding: 16, textAlign: "center" }}>
                  <div style={{ fontSize: 12, color: "#a6b6a9", marginBottom: 4 }}>승률</div>
                  <div style={{ fontSize: 28, fontWeight: 700 }}>{typeof duelStats.winRate === "number" ? `${(duelStats.winRate * 100).toFixed(1)}%` : "0%"}</div>
                </div>
                <div style={{ background: "rgba(240,108,36,0.08)", borderRadius: 14, padding: 16, textAlign: "center" }}>
                  <div style={{ fontSize: 12, color: "#a6b6a9", marginBottom: 4 }}>현재 연승</div>
                  <div style={{ fontSize: 28, fontWeight: 700 }}>{duelStats.currentStreak}</div>
                </div>
                <div style={{ background: "rgba(240,108,36,0.08)", borderRadius: 14, padding: 16, textAlign: "center" }}>
                  <div style={{ fontSize: 12, color: "#a6b6a9", marginBottom: 4 }}>최고 연승</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: "#f6d18d" }}>{duelStats.bestStreak}</div>
                </div>
                <div style={{ background: "rgba(240,108,36,0.08)", borderRadius: 14, padding: 16, textAlign: "center" }}>
                  <div style={{ fontSize: 12, color: "#a6b6a9", marginBottom: 4 }}>기권 패배</div>
                  <div style={{ fontSize: 28, fontWeight: 700 }}>{duelStats.forfeitLosses}</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminStudentDetailPage;
