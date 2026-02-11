import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet, apiPost, apiPatch } from "../utils/adminApi";
import { useAdminList } from "../hooks/useAdminList";
import AdminLayout from "../components/AdminLayout";
import OrgSelect from "../components/OrgSelect";
import "../styles/admin-detail.css";

const STUDENTS = [
  { id: "s1", name: "김서연", email: "", level: "프레게1", org: "해든 국어학원", status: "active" },
];

/* 레벨 약칭 */
const LEVEL_SHORT = {
  saussure1: "S1", saussure2: "S2", saussure3: "S3",
  frege1: "F1", frege2: "F2", frege3: "F3",
  russell1: "R1", russell2: "R2", russell3: "R3",
  wittgenstein1: "W1", wittgenstein2: "W2", wittgenstein3: "W3",
};

/* 씨앗/작물 아이템 정의 */
const SEED_ITEMS = [
  { key: "seed_wheat", label: "밀" },
  { key: "seed_rice", label: "쌀" },
  { key: "seed_corn", label: "옥수수" },
  { key: "seed_grape", label: "포도" },
  { key: "seed_apple", label: "사과" },
];
const CROP_ITEMS = [
  { key: "crop_wheat", label: "밀" },
  { key: "crop_rice", label: "쌀" },
  { key: "crop_corn", label: "옥수수" },
  { key: "crop_grape", label: "포도" },
  { key: "crop_apple", label: "사과" },
];

/* 시즌 점수 계산 */
const calcSeasonScore = (inv) => {
  if (!inv) return 0;
  const crops = inv.crops || {};
  const seeds = inv.seeds || {};
  const cropProduct =
    (crops.crop_wheat || 0) * (crops.crop_rice || 0) * (crops.crop_corn || 0) *
    (crops.crop_grape || 0) * (crops.crop_apple || 0);
  const totalSeeds = Object.values(seeds).reduce((a, b) => a + b, 0);
  return cropProduct * 50 + totalSeeds;
};

/* 인벤토리 관리 모달 */
function InventoryModal({ student, onClose }) {
  const [inventory, setInventory] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [invLoading, setInvLoading] = useState(false);
  const [invError, setInvError] = useState("");
  const [grantType, setGrantType] = useState("seed");
  const [grantItemType, setGrantItemType] = useState("seed_wheat");
  const [grantAmount, setGrantAmount] = useState("");
  const [grantReason, setGrantReason] = useState("");
  const [grantMsg, setGrantMsg] = useState("");
  const [grantMsgIsError, setGrantMsgIsError] = useState(false);
  const [grantLoading, setGrantLoading] = useState(false);

  useEffect(() => {
    if (grantType === "seed") setGrantItemType("seed_wheat");
    else if (grantType === "crop") setGrantItemType("crop_wheat");
    else setGrantItemType("");
  }, [grantType]);

  const fetchInventory = useCallback(async () => {
    setInvLoading(true);
    setInvError("");
    try {
      const data = await apiGet(`/v1/admin/students/${student.id}/inventory`);
      setInventory(data);
    } catch (err) { setInvError(err.message); }
    finally { setInvLoading(false); }
  }, [student.id]);

  const fetchLedger = useCallback(async () => {
    try {
      const data = await apiGet(`/v1/admin/students/${student.id}/ledger`);
      setLedger(Array.isArray(data) ? data.slice(0, 20) : []);
    } catch (_) {}
  }, [student.id]);

  useEffect(() => { fetchInventory(); fetchLedger(); }, [fetchInventory, fetchLedger]);

  const doGrantOrDeduct = async (action) => {
    setGrantMsg("");
    const amt = parseInt(grantAmount, 10);
    if (!amt || amt <= 0) { setGrantMsg("수량을 1 이상 입력하세요."); setGrantMsgIsError(true); return; }
    if (!grantReason.trim()) { setGrantMsg("사유를 입력하세요."); setGrantMsgIsError(true); return; }
    setGrantLoading(true);
    try {
      const body = { type: grantType, itemType: grantType === "fertilizer" ? undefined : grantItemType, amount: amt, reason: grantReason.trim() };
      await apiPost(`/v1/admin/students/${student.id}/inventory/${action}`, body);
      setGrantMsg(action === "grant" ? "지급 완료!" : "차감 완료!");
      setGrantMsgIsError(false);
      setGrantAmount(""); setGrantReason("");
      fetchInventory(); fetchLedger();
    } catch (err) { setGrantMsg(err.message); setGrantMsgIsError(true); }
    finally { setGrantLoading(false); }
  };

  const sectionSt = { marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid rgba(255,255,255,0.08)" };
  const gridSt = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 8 };
  const cellSt = { background: "rgba(15,20,16,0.7)", borderRadius: 8, padding: "8px 10px", textAlign: "center", border: "1px solid rgba(240,108,36,0.15)" };
  const selectSt = { width: "100%", padding: "8px 10px", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 6, background: "#1e2620", color: "#f3f6f1", fontSize: 14, boxSizing: "border-box" };
  const thTdSt = { textAlign: "left", padding: "6px 6px", borderBottom: "1px solid rgba(255,255,255,0.08)" };

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" style={{ maxWidth: 720, maxHeight: "85vh" }} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ marginBottom: 4 }}>인벤토리 관리</h2>
        <p style={{ margin: "0 0 16px", fontSize: 14, color: "#a6b6a9" }}>{student.name} ({student.email || student.id})</p>
        {invLoading && <p className="admin-detail-note">불러오는 중...</p>}
        {invError && <p className="admin-detail-note error">{invError}</p>}
        {inventory && (
          <div style={sectionSt}>
            <h3 style={{ fontSize: 14, color: "#f06c24", margin: "0 0 10px" }}>보유 현황</h3>
            <p style={{ fontSize: 12, color: "#a6b6a9", margin: "0 0 6px" }}>씨앗</p>
            <div style={gridSt}>
              {SEED_ITEMS.map((s) => (
                <div key={s.key} style={cellSt}>
                  <div style={{ fontSize: 11, color: "#a6b6a9" }}>{s.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#f3f6f1" }}>{(inventory.seeds || {})[s.key] || 0}</div>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 12, color: "#a6b6a9", margin: "12px 0 6px" }}>수확물</p>
            <div style={gridSt}>
              {CROP_ITEMS.map((c) => (
                <div key={c.key} style={cellSt}>
                  <div style={{ fontSize: 11, color: "#a6b6a9" }}>{c.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#f3f6f1" }}>{(inventory.crops || {})[c.key] || 0}</div>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 12, color: "#a6b6a9", margin: "12px 0 6px" }}>비료</p>
            <div style={{ ...gridSt, gridTemplateColumns: "100px" }}>
              <div style={cellSt}>
                <div style={{ fontSize: 11, color: "#a6b6a9" }}>비료</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#f3f6f1" }}>{inventory.fertilizer || 0}</div>
              </div>
            </div>
            <div style={{ background: "rgba(240,108,36,0.12)", border: "1px solid rgba(240,108,36,0.3)", borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 700 }}>시즌 점수</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: "#f06c24" }}>{calcSeasonScore(inventory).toLocaleString()}</span>
            </div>
          </div>
        )}
        <div style={sectionSt}>
          <h3 style={{ fontSize: 14, color: "#f06c24", margin: "0 0 10px" }}>지급 / 차감</h3>
          <div style={{ display: "flex", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 100 }}>
              <label style={{ display: "block", fontSize: 13, color: "#a6b6a9", marginBottom: 4 }}>유형</label>
              <select style={selectSt} value={grantType} onChange={(e) => setGrantType(e.target.value)}>
                <option value="seed">씨앗</option>
                <option value="crop">수확물</option>
                <option value="fertilizer">비료</option>
              </select>
            </div>
            {grantType !== "fertilizer" && (
              <div style={{ flex: 1, minWidth: 100 }}>
                <label style={{ display: "block", fontSize: 13, color: "#a6b6a9", marginBottom: 4 }}>아이템</label>
                <select style={selectSt} value={grantItemType} onChange={(e) => setGrantItemType(e.target.value)}>
                  {(grantType === "seed" ? SEED_ITEMS : CROP_ITEMS).map((it) => (
                    <option key={it.key} value={it.key}>{it.label}</option>
                  ))}
                </select>
              </div>
            )}
            <div style={{ flex: 1, minWidth: 80, maxWidth: 100 }}>
              <label style={{ display: "block", fontSize: 13, color: "#a6b6a9", marginBottom: 4 }}>수량</label>
              <input type="number" min="1" style={selectSt} value={grantAmount} onChange={(e) => setGrantAmount(e.target.value)} placeholder="0" />
            </div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={{ display: "block", fontSize: 13, color: "#a6b6a9", marginBottom: 4 }}>사유</label>
            <input style={selectSt} value={grantReason} onChange={(e) => setGrantReason(e.target.value)} placeholder="지급/차감 사유 입력" />
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <button className="admin-detail-btn" style={{ fontSize: 13, padding: "8px 18px" }} onClick={() => doGrantOrDeduct("grant")} disabled={grantLoading}>지급</button>
            <button className="admin-detail-btn secondary" style={{ fontSize: 13, padding: "8px 18px" }} onClick={() => doGrantOrDeduct("deduct")} disabled={grantLoading}>차감</button>
            {grantMsg && <span style={{ fontSize: 13, fontWeight: 600, color: grantMsgIsError ? "#f0a59c" : "#9dd6b0" }}>{grantMsg}</span>}
          </div>
        </div>
        <div style={{ marginBottom: 10 }}>
          <h3 style={{ fontSize: 14, color: "#f06c24", margin: "0 0 8px" }}>경제 내역 (최근 20건)</h3>
          {ledger.length === 0 ? (
            <p className="admin-detail-note">내역이 없습니다.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, marginTop: 8 }}>
                <thead><tr><th style={thTdSt}>날짜</th><th style={thTdSt}>유형</th><th style={thTdSt}>아이템</th><th style={thTdSt}>변동량</th><th style={thTdSt}>사유</th></tr></thead>
                <tbody>
                  {ledger.map((entry, idx) => {
                    const dt = entry.createdAt || entry.created_at || "";
                    const delta = entry.amount || entry.delta || 0;
                    return (
                      <tr key={entry.id || idx}>
                        <td style={thTdSt}>{dt ? new Date(dt).toLocaleString("ko-KR") : "-"}</td>
                        <td style={thTdSt}>{entry.type || entry.currencyType || "-"}</td>
                        <td style={thTdSt}>{entry.itemType || entry.item_type || "-"}</td>
                        <td style={{ ...thTdSt, color: delta > 0 ? "#9dd6b0" : delta < 0 ? "#f0a59c" : "#a6b6a9", fontWeight: 700 }}>{delta > 0 ? `+${delta}` : delta}</td>
                        <td style={thTdSt}>{entry.reason || "-"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="admin-modal-actions">
          <button className="admin-detail-btn secondary" onClick={onClose}>닫기</button>
        </div>
      </div>
    </div>
  );
}

const mapStudents = (items) =>
  items.map((s) => ({
    id: s.userId || s.id || s.user_id,
    name: s.name,
    email: s.loginId || s.email || "",
    level: s.levelId || s.level_id || "-",
    school: s.school || "",
    gradeLabel: s.gradeLabel || s.grade_label || "",
    studentPhone: s.studentPhone || s.student_phone || "",
    parentPhone: s.parentPhone || s.parent_phone || "",
    region: s.region || "",
    orgId: s.orgId || s.org_id || "",
    org: s.orgName || s.org_name || "국어농장",
    classIds: s.classIds || s.class_ids || [],
    classNames: s.classNames || s.class_names || [],
    subscriptionStatus: s.subscriptionStatus || s.subscription_status || null,
    subscriptionEndAt: s.subscriptionEndAt || s.subscription_end_at || null,
    status: s.status || "active",
  }));

const subscriptionLabel = (status) => {
  if (!status || status === "expired") return "무료";
  if (status === "active") return "유료";
  if (status === "canceled") return "해지";
  return status;
};

function AdminStudentsPage() {
  const navigate = useNavigate();
  const { data: students, loading, error } = useAdminList("/v1/admin/students", STUDENTS, mapStudents);
  const [rows, setRows] = useState(STUDENTS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editStudent, setEditStudent] = useState(null);
  const [formData, setFormData] = useState({ email: "", name: "", orgId: "", password: "" });
  const [editFormData, setEditFormData] = useState({
    name: "", status: "", school: "", gradeLabel: "", levelId: "",
    studentPhone: "", parentPhone: "", region: "",
    orgId: "", classIds: [],
    subscriptionStatus: "free", subscriptionEndAt: "",
  });
  const [actionError, setActionError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [orgs, setOrgs] = useState([]);
  const [classes, setClasses] = useState([]);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [inventoryStudent, setInventoryStudent] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setRows(students);
  }, [students]);

  useEffect(() => {
    apiGet("/v1/admin/orgs").then((data) => setOrgs(Array.isArray(data) ? data : [])).catch(() => {});
    apiGet("/v1/admin/classes").then((data) => setClasses(Array.isArray(data) ? data : [])).catch(() => {});
  }, []);

  const filteredClasses = useMemo(() => {
    if (!editFormData.orgId) return classes;
    return classes.filter((c) => (c.orgId || c.org_id) === editFormData.orgId);
  }, [classes, editFormData.orgId]);

  const PAGE_SIZE = 15;

  const filteredStudents = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((s) => {
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      if (!term) return true;
      return [s.name, s.email, s.level, s.org, s.school, s.status]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(term));
    });
  }, [rows, search, statusFilter]);

  // 필터/검색 변경 시 1페이지로 리셋
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / PAGE_SIZE));
  const pagedStudents = filteredStudents.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleCreate = async () => {
    setActionError("");
    if (!formData.email.trim()) {
      setActionError("아이디를 입력해 주세요.");
      return;
    }
    if (!formData.orgId.trim()) {
      setActionError("기관 ID를 입력해 주세요.");
      return;
    }
    setActionLoading(true);
    try {
      const result = await apiPost("/v1/admin/students", {
        email: formData.email.trim(),
        name: formData.name.trim() || undefined,
        orgId: formData.orgId.trim(),
      });
      const mapped = mapStudents([result])[0];
      setRows((prev) => [mapped, ...prev]);
      setShowCreateModal(false);
      setFormData({ email: "", name: "", orgId: "", password: "" });
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!editStudent) return;
    setActionError("");
    setActionLoading(true);
    try {
      const result = await apiPatch(`/v1/admin/students/${editStudent.id}`, {
        name: editFormData.name.trim() || undefined,
        status: editFormData.status || undefined,
        school: editFormData.school.trim() || undefined,
        gradeLabel: editFormData.gradeLabel.trim() || undefined,
        levelId: editFormData.levelId.trim() || undefined,
        studentPhone: editFormData.studentPhone.trim() || undefined,
        parentPhone: editFormData.parentPhone.trim() || undefined,
        region: editFormData.region.trim() || undefined,
        orgId: editFormData.orgId || undefined,
        classIds: editFormData.classIds.length > 0 ? editFormData.classIds : undefined,
      });
      const mapped = mapStudents([result])[0];

      // Handle subscription change
      const currentSubStatus = editStudent.subscriptionStatus;
      const newSubStatus = editFormData.subscriptionStatus;
      const isCurrentlyPaid = currentSubStatus === "active";
      const wantsPaid = newSubStatus === "active";

      if (isCurrentlyPaid !== wantsPaid || (wantsPaid && editFormData.subscriptionEndAt !== (editStudent.subscriptionEndAt || "").slice(0, 10))) {
        const subResult = await apiPost(`/v1/admin/students/${editStudent.id}/subscription`, {
          status: wantsPaid ? "active" : "free",
          endAt: wantsPaid && editFormData.subscriptionEndAt ? editFormData.subscriptionEndAt : undefined,
        });
        const subMapped = mapStudents([subResult])[0];
        setRows((prev) => prev.map((r) => (r.id === editStudent.id ? { ...r, ...subMapped } : r)));
      } else {
        setRows((prev) => prev.map((r) => (r.id === editStudent.id ? { ...r, ...mapped } : r)));
      }

      setShowEditModal(false);
      setEditStudent(null);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisable = async (userId) => {
    setActionError("");
    setActionLoading(true);
    try {
      await apiPost(`/v1/admin/students/${userId}/disable`);
      setRows((prev) =>
        prev.map((r) => (r.id === userId ? { ...r, status: "inactive" } : r))
      );
      setShowEditModal(false);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const openEdit = (student) => {
    setEditStudent(student);
    setEditFormData({
      name: student.name || "",
      status: student.status || "active",
      school: student.school || "",
      gradeLabel: student.gradeLabel || "",
      levelId: student.level === "-" ? "" : student.level || "",
      studentPhone: student.studentPhone || "",
      parentPhone: student.parentPhone || "",
      region: student.region || "",
      orgId: student.orgId || "",
      classIds: student.classIds || [],
      subscriptionStatus: student.subscriptionStatus === "active" ? "active" : "free",
      subscriptionEndAt: student.subscriptionEndAt ? student.subscriptionEndAt.slice(0, 10) : "",
    });
    setActionError("");
    setShowEditModal(true);
  };

  const openInventory = (student) => {
    setInventoryStudent(student);
    setShowInventoryModal(true);
  };

  const toggleClassId = (classId) => {
    setEditFormData((prev) => {
      const ids = prev.classIds.includes(classId)
        ? prev.classIds.filter((id) => id !== classId)
        : [...prev.classIds, classId];
      return { ...prev, classIds: ids };
    });
  };

  return (
    <AdminLayout>
      <div className="admin-detail-wrap">
        <div className="admin-detail-header">
          <h1>학생 관리</h1>
          <div className="admin-detail-actions">
            <button
              className="admin-detail-btn"
              type="button"
              onClick={() => navigate("/signup")}
            >
              학생 등록
            </button>
          </div>
        </div>
        <div className="admin-detail-grid">
          <div className="admin-detail-card">
            <h2>학생 목록</h2>
            <div className="admin-detail-toolbar">
              <div className="admin-detail-search">
                <span className="material-symbols-outlined">search</span>
                <input
                  placeholder="학생 검색"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="admin-detail-filters">
                {["all", "active", "trial", "inactive"].map((f) => (
                  <button
                    key={f}
                    className={`admin-filter ${statusFilter === f ? "active" : ""}`}
                    type="button"
                    onClick={() => setStatusFilter(f)}
                  >
                    {f === "all" ? "전체" : f === "active" ? "활성" : f === "trial" ? "체험" : "비활성"}
                  </button>
                ))}
              </div>
            </div>
            {loading ? <p className="admin-detail-note">학생을 불러오는 중...</p> : null}
            {error ? <p className="admin-detail-note error">{error}</p> : null}
            <table className="admin-detail-table">
              <thead>
                <tr>
                  <th>학생</th>
                  <th style={{ width: 36 }}>레벨</th>
                  <th>기관</th>
                  <th>학교</th>
                  <th>구독</th>
                  <th style={{ width: 36, textAlign: "center" }}>상태</th>
                  <th>조치</th>
                </tr>
              </thead>
              <tbody>
                {pagedStudents.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <span
                        style={{ cursor: "pointer", color: "#f06c24", textDecoration: "underline" }}
                        onClick={() => navigate(`/admin/students/${s.id}`)}
                      >
                        {s.name}
                      </span>
                    </td>
                    <td style={{ whiteSpace: "nowrap" }} title={s.level}>{LEVEL_SHORT[s.level] || s.level}</td>
                    <td>{s.org}</td>
                    <td>{s.school || "-"}</td>
                    <td>
                      <span
                        className="status-pill"
                        data-status={s.subscriptionStatus === "active" ? "active" : "inactive"}
                      >
                        {subscriptionLabel(s.subscriptionStatus)}
                      </span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span
                        className="status-dot"
                        data-status={s.status}
                        title={s.status === "active" ? "활성" : s.status === "trial" ? "체험" : "비활성"}
                      />
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button
                          className="admin-detail-btn secondary"
                          type="button"
                          onClick={() => openEdit(s)}
                          style={{ fontSize: "12px", padding: "4px 8px" }}
                        >
                          수정
                        </button>
                        <button
                          className="admin-detail-btn secondary"
                          type="button"
                          onClick={() => openInventory(s)}
                          style={{ fontSize: "12px", padding: "4px 8px" }}
                        >
                          인벤토리
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {totalPages > 1 && (
              <div className="admin-pagination">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                >
                  이전
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    className={p === currentPage ? "active" : ""}
                    onClick={() => setCurrentPage(p)}
                  >
                    {p}
                  </button>
                ))}
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  다음
                </button>
              </div>
            )}
          </div>
          <div className="admin-detail-card">
            <h3>학생 요약</h3>
            <p>전체 {rows.length}명</p>
            <p>활성 {rows.filter((r) => r.status === "active").length}명</p>
          </div>
        </div>
      </div>

      {showCreateModal ? (
        <div className="admin-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h2>학생 등록</h2>
            {actionError ? <p className="admin-detail-note error">{actionError}</p> : null}
            <div className="admin-modal-field">
              <label>아이디</label>
              <input
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="아이디를 입력하세요"
              />
            </div>
            <div className="admin-modal-field">
              <label>이름</label>
              <input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="이름"
              />
            </div>
            <div className="admin-modal-field">
              <label>기관</label>
              <OrgSelect
                orgs={orgs.map((o) => ({ id: o.orgId || o.id, name: o.name }))}
                value={formData.orgId}
                onChange={(v) => setFormData({ ...formData, orgId: v })}
                placeholder="기관 선택"
              />
            </div>
            <div className="admin-modal-actions">
              <button className="admin-detail-btn" onClick={handleCreate} disabled={actionLoading}>
                등록
              </button>
              <button className="admin-detail-btn secondary" onClick={() => setShowCreateModal(false)}>
                취소
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showEditModal && editStudent ? (
        <div className="admin-modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="admin-modal admin-modal-wide" onClick={(e) => e.stopPropagation()}>
            <h2>학생 수정</h2>
            {actionError ? <p className="admin-detail-note error">{actionError}</p> : null}

            <div className="admin-modal-section">
              <h3>개인정보</h3>
              <div className="admin-modal-row">
                <div className="admin-modal-field">
                  <label>이름</label>
                  <input
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  />
                </div>
                <div className="admin-modal-field">
                  <label>학교</label>
                  <input
                    value={editFormData.school}
                    onChange={(e) => setEditFormData({ ...editFormData, school: e.target.value })}
                    placeholder="학교명"
                  />
                </div>
              </div>
              <div className="admin-modal-row">
                <div className="admin-modal-field">
                  <label>학년</label>
                  <input
                    value={editFormData.gradeLabel}
                    onChange={(e) => setEditFormData({ ...editFormData, gradeLabel: e.target.value })}
                    placeholder="예: 중1"
                  />
                </div>
                <div className="admin-modal-field">
                  <label>지역</label>
                  <input
                    value={editFormData.region}
                    onChange={(e) => setEditFormData({ ...editFormData, region: e.target.value })}
                    placeholder="지역"
                  />
                </div>
              </div>
              <div className="admin-modal-row">
                <div className="admin-modal-field">
                  <label>학생 연락처</label>
                  <input
                    value={editFormData.studentPhone}
                    onChange={(e) => setEditFormData({ ...editFormData, studentPhone: e.target.value })}
                    placeholder="010-0000-0000"
                  />
                </div>
                <div className="admin-modal-field">
                  <label>학부모 연락처</label>
                  <input
                    value={editFormData.parentPhone}
                    onChange={(e) => setEditFormData({ ...editFormData, parentPhone: e.target.value })}
                    placeholder="010-0000-0000"
                  />
                </div>
              </div>
            </div>

            <div className="admin-modal-section">
              <h3>소속 정보</h3>
              <div className="admin-modal-row">
                <div className="admin-modal-field">
                  <label>기관</label>
                  <OrgSelect
                    orgs={orgs.map((o) => ({ id: o.orgId || o.id, name: o.name }))}
                    value={editFormData.orgId}
                    onChange={(v) => setEditFormData({ ...editFormData, orgId: v, classIds: [] })}
                    placeholder="기관 없음"
                  />
                </div>
                <div className="admin-modal-field">
                  <label>레벨</label>
                  <input
                    value={editFormData.levelId}
                    onChange={(e) => setEditFormData({ ...editFormData, levelId: e.target.value })}
                    placeholder="레벨 ID"
                  />
                </div>
              </div>
              <div className="admin-modal-field">
                <label>수강반</label>
                {filteredClasses.length === 0 ? (
                  <p className="admin-detail-note">수강반이 없습니다.</p>
                ) : (
                  <div className="admin-checkbox-group">
                    {filteredClasses.map((c) => {
                      const cId = c.classId || c.id;
                      return (
                        <label key={cId} className="admin-checkbox-label">
                          <input
                            type="checkbox"
                            checked={editFormData.classIds.includes(cId)}
                            onChange={() => toggleClassId(cId)}
                          />
                          {c.name}
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="admin-modal-field">
                <label>상태</label>
                <select
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                >
                  <option value="active">활성</option>
                  <option value="trial">체험</option>
                  <option value="inactive">비활성</option>
                </select>
              </div>
            </div>

            <div className="admin-modal-section">
              <h3>구독 정보</h3>
              <div className="admin-modal-row">
                <div className="admin-modal-field">
                  <label>유형</label>
                  <select
                    value={editFormData.subscriptionStatus}
                    onChange={(e) => setEditFormData({ ...editFormData, subscriptionStatus: e.target.value })}
                  >
                    <option value="free">무료</option>
                    <option value="active">유료</option>
                  </select>
                </div>
                {editFormData.subscriptionStatus === "active" ? (
                  <div className="admin-modal-field">
                    <label>구독 종료일</label>
                    <input
                      type="date"
                      value={editFormData.subscriptionEndAt}
                      onChange={(e) => setEditFormData({ ...editFormData, subscriptionEndAt: e.target.value })}
                    />
                  </div>
                ) : null}
              </div>
            </div>

            <div className="admin-modal-actions">
              <button className="admin-detail-btn" onClick={handleEdit} disabled={actionLoading}>
                저장
              </button>
              <button
                className="admin-detail-btn secondary"
                onClick={() => handleDisable(editStudent.id)}
                disabled={actionLoading}
              >
                비활성화
              </button>
              <button className="admin-detail-btn secondary" onClick={() => setShowEditModal(false)}>
                취소
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showInventoryModal && inventoryStudent ? (
        <InventoryModal
          student={inventoryStudent}
          onClose={() => { setShowInventoryModal(false); setInventoryStudent(null); }}
        />
      ) : null}
    </AdminLayout>
  );
}

export default AdminStudentsPage;
