import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet, apiPost, apiPatch, apiPostDownload } from "../utils/adminApi";
import { useAdminList } from "../hooks/useAdminList";
import { useAuth } from "../hooks/useAuth";
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
    } catch (e) { console.error(e); }
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
  const selectSt = { width: "100%", padding: "8px 10px", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 6, background: "var(--bg)", color: "var(--text)", fontSize: 14, boxSizing: "border-box" };
  const thTdSt = { textAlign: "left", padding: "6px 6px", borderBottom: "1px solid rgba(255,255,255,0.08)" };

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal admin-modal-xl" onClick={(e) => e.stopPropagation()}>
        <h2 style={{ marginBottom: 4 }}>인벤토리 관리</h2>
        <p style={{ margin: "0 0 16px", fontSize: 14, color: "var(--muted)" }}>{student.name} ({student.email || student.id})</p>
        {invLoading && <p className="admin-detail-note">불러오는 중...</p>}
        {invError && <p className="admin-detail-note error">{invError}</p>}
        {inventory && (
          <div style={sectionSt}>
            <h3 style={{ fontSize: 14, color: "#f06c24", margin: "0 0 10px" }}>보유 현황</h3>
            <p style={{ fontSize: 12, color: "var(--muted)", margin: "0 0 6px" }}>씨앗</p>
            <div style={gridSt}>
              {SEED_ITEMS.map((s) => (
                <div key={s.key} style={cellSt}>
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>{s.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text)" }}>{(inventory.seeds || {})[s.key] || 0}</div>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 12, color: "var(--muted)", margin: "12px 0 6px" }}>수확물</p>
            <div style={gridSt}>
              {CROP_ITEMS.map((c) => (
                <div key={c.key} style={cellSt}>
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>{c.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text)" }}>{(inventory.crops || {})[c.key] || 0}</div>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 12, color: "var(--muted)", margin: "12px 0 6px" }}>비료</p>
            <div style={{ ...gridSt, gridTemplateColumns: "100px" }}>
              <div style={cellSt}>
                <div style={{ fontSize: 11, color: "var(--muted)" }}>비료</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text)" }}>{inventory.fertilizer || 0}</div>
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
              <label style={{ display: "block", fontSize: 13, color: "var(--muted)", marginBottom: 4 }}>유형</label>
              <select style={selectSt} value={grantType} onChange={(e) => setGrantType(e.target.value)}>
                <option value="seed">씨앗</option>
                <option value="crop">수확물</option>
                <option value="fertilizer">비료</option>
              </select>
            </div>
            {grantType !== "fertilizer" && (
              <div style={{ flex: 1, minWidth: 100 }}>
                <label style={{ display: "block", fontSize: 13, color: "var(--muted)", marginBottom: 4 }}>아이템</label>
                <select style={selectSt} value={grantItemType} onChange={(e) => setGrantItemType(e.target.value)}>
                  {(grantType === "seed" ? SEED_ITEMS : CROP_ITEMS).map((it) => (
                    <option key={it.key} value={it.key}>{it.label}</option>
                  ))}
                </select>
              </div>
            )}
            <div style={{ flex: 1, minWidth: 80, maxWidth: 100 }}>
              <label style={{ display: "block", fontSize: 13, color: "var(--muted)", marginBottom: 4 }}>수량</label>
              <input type="number" min="1" style={selectSt} value={grantAmount} onChange={(e) => setGrantAmount(e.target.value)} placeholder="0" />
            </div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={{ display: "block", fontSize: 13, color: "var(--muted)", marginBottom: 4 }}>사유</label>
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
                        <td style={{ ...thTdSt, color: delta > 0 ? "#9dd6b0" : delta < 0 ? "#f0a59c" : "var(--muted)", fontWeight: 700 }}>{delta > 0 ? `+${delta}` : delta}</td>
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
  const { user } = useAuth();
  const isHqAdmin = (user?.roles || []).includes("HQ_ADMIN");
  const { data: students, loading, error } = useAdminList("/v1/admin/students", STUDENTS, mapStudents);
  const [rows, setRows] = useState(STUDENTS);
  const [search, setSearch] = useState("");
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
  // 우측 요약 그룹화
  const [summaryDim, setSummaryDim] = useState("org"); // org / class / level / subscription
  // 요약 항목 클릭으로 좌측 리스트 필터링 (null = 미적용)
  const [summaryFilterKey, setSummaryFilterKey] = useState(null);
  // 학생 삭제
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteForm, setDeleteForm] = useState({ nameConfirmation: "", reason: "", immediate: false });
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  // 휴지통
  const [showTrashModal, setShowTrashModal] = useState(false);
  const [trash, setTrash] = useState([]);
  const [trashLoading, setTrashLoading] = useState(false);

  useEffect(() => {
    setRows(students);
  }, [students]);

  useEffect(() => {
    apiGet("/v1/admin/orgs").then((data) => setOrgs(Array.isArray(data) ? data : [])).catch((e) => console.error(e));
    apiGet("/v1/admin/classes").then((data) => setClasses(Array.isArray(data) ? data : [])).catch((e) => console.error(e));
  }, []);

  const filteredClasses = useMemo(() => {
    if (!editFormData.orgId) return classes;
    return classes.filter((c) => (c.orgId || c.org_id) === editFormData.orgId);
  }, [classes, editFormData.orgId]);

  const PAGE_SIZE = 15;

  // 학생 1명이 특정 차원의 키와 매칭되는지 (수강반은 다중)
  const studentMatchesKey = (s, dim, key) => {
    if (dim === "org") return (s.org || "(미지정)") === key;
    if (dim === "class") {
      const names = s.classNames || [];
      if (names.length === 0) return key === "(미배정)";
      return names.includes(key);
    }
    if (dim === "level") return (s.level === "-" ? "(미설정)" : (s.level || "(미설정)")) === key;
    if (dim === "subscription") return (s.subscriptionStatus === "active" ? "유료" : "무료") === key;
    return false;
  };

  const filteredStudents = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((s) => {
      // 우측 요약 항목 필터
      if (summaryFilterKey && !studentMatchesKey(s, summaryDim, summaryFilterKey)) return false;
      if (!term) return true;
      return [s.name, s.email, s.level, s.org, s.school]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(term));
    });
  }, [rows, search, summaryDim, summaryFilterKey]);

  // 검색·필터 변경 시 1페이지로 리셋
  useEffect(() => {
    setCurrentPage(1);
  }, [search, summaryFilterKey]);

  // 차원 바뀌면 필터 해제
  useEffect(() => {
    setSummaryFilterKey(null);
  }, [summaryDim]);

  // 우측 요약 — 차원별 그룹화 카운트
  const summaryGroups = useMemo(() => {
    const counts = new Map();
    for (const s of rows) {
      let key;
      if (summaryDim === "org") key = s.org || "(미지정)";
      else if (summaryDim === "class") {
        const names = (s.classNames || []);
        if (names.length === 0) key = "(미배정)";
        else { for (const n of names) counts.set(n, (counts.get(n) || 0) + 1); continue; }
      }
      else if (summaryDim === "level") key = s.level === "-" ? "(미설정)" : (s.level || "(미설정)");
      else if (summaryDim === "subscription") key = s.subscriptionStatus === "active" ? "유료" : "무료";
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [rows, summaryDim]);

  // 휴지통 로드
  const loadTrash = useCallback(async () => {
    setTrashLoading(true);
    try {
      const data = await apiGet("/v1/admin/students/trash");
      setTrash(Array.isArray(data) ? data : []);
    } catch (err) {
      alert("휴지통 로드 실패: " + err.message);
    } finally {
      setTrashLoading(false);
    }
  }, []);

  const openDeleteModal = (student) => {
    setDeleteTarget(student);
    setDeleteForm({ nameConfirmation: "", reason: "", immediate: false });
  };

  const closeDeleteModal = () => {
    setDeleteTarget(null);
    setDeleteForm({ nameConfirmation: "", reason: "", immediate: false });
  };

  const submitDelete = async () => {
    if (!deleteTarget) return;
    setDeleteSubmitting(true);
    try {
      const result = await apiPostDownload(
        `/v1/admin/students/${deleteTarget.id}/delete`,
        {
          nameConfirmation: deleteForm.nameConfirmation,
          reason: deleteForm.reason,
          immediate: deleteForm.immediate,
        },
        `student_${deleteTarget.id}.zip`
      );
      // 백엔드 응답 OK → 목록에서 제거 (soft 든 hard 든 화면에서는 같음)
      setRows((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      const sizeKb = (result.sizeBytes / 1024).toFixed(1);
      const mode = deleteForm.immediate ? "즉시 영구 삭제" : "30일 유예 (soft delete)";
      alert(`학생 삭제 완료 — ${mode}\n백업 ZIP 다운로드 (${sizeKb} KB)`);
      closeDeleteModal();
    } catch (err) {
      alert("삭제 실패: " + err.message);
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const restoreStudent = async (userId) => {
    try {
      await apiPost(`/v1/admin/students/${userId}/restore`);
      setTrash((prev) => prev.filter((t) => t.userId !== userId));
      // 다시 활성 목록에 표시되도록 페이지 새로고침은 사용자 선택
      alert("복원 완료. 학생 목록을 다시 불러오려면 페이지를 새로고침하세요.");
    } catch (err) {
      alert("복원 실패: " + err.message);
    }
  };

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
          <div className="admin-detail-header-actions">
            {isHqAdmin && (
              <button
                className="admin-detail-btn secondary"
                type="button"
                onClick={() => { setShowTrashModal(true); loadTrash(); }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete_sweep</span>
                휴지통
              </button>
            )}
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
                  placeholder="학생 검색 (이름·기관·학교·레벨)"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              {summaryFilterKey && (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "5px 10px 5px 12px",
                    background: "var(--admin-accent-soft)",
                    border: "1px solid var(--admin-accent)",
                    borderRadius: 999,
                    color: "var(--admin-accent-strong)",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  <span>{summaryFilterKey} 학생만</span>
                  <button
                    type="button"
                    onClick={() => setSummaryFilterKey(null)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "var(--admin-accent-strong)",
                      cursor: "pointer",
                      fontSize: 16,
                      padding: 0,
                      lineHeight: 1,
                      display: "inline-flex",
                      alignItems: "center",
                    }}
                    aria-label="필터 해제"
                  >
                    ×
                  </button>
                </div>
              )}
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
                  <th>조치</th>
                </tr>
              </thead>
              <tbody>
                {pagedStudents.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <span
                        className="admin-content-title-link"
                        style={{ cursor: "pointer" }}
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
                    <td>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button
                          className="admin-detail-btn secondary xs"
                          type="button"
                          onClick={() => openEdit(s)}
                        >
                          수정
                        </button>
                        <button
                          className="admin-detail-btn secondary xs"
                          type="button"
                          onClick={() => openInventory(s)}
                        >
                          인벤토리
                        </button>
                        {isHqAdmin && (
                          <button
                            className="admin-detail-btn danger xs"
                            type="button"
                            onClick={() => openDeleteModal(s)}
                          >
                            삭제
                          </button>
                        )}
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
            <p style={{ margin: "0 0 12px", fontSize: 14, color: "var(--admin-ink)" }}>
              전체 <strong>{rows.length}</strong>명
            </p>
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 12, color: "var(--admin-muted)", display: "block", marginBottom: 4 }}>
                그룹화
              </label>
              <select
                value={summaryDim}
                onChange={(e) => setSummaryDim(e.target.value)}
                style={{
                  width: "100%",
                  padding: "7px 10px",
                  border: "1px solid var(--admin-stroke)",
                  borderRadius: 8,
                  background: "var(--admin-panel)",
                  color: "var(--admin-ink)",
                  fontSize: 13,
                  fontFamily: "inherit",
                }}
              >
                <option value="org">기관별</option>
                <option value="class">수강반별</option>
                <option value="level">레벨별</option>
                <option value="subscription">구독별</option>
              </select>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 480, overflowY: "auto" }}>
              {summaryGroups.length === 0 ? (
                <p style={{ color: "var(--admin-muted)", fontSize: 13 }}>학생 데이터가 없습니다.</p>
              ) : summaryGroups.map(([key, count]) => {
                const isActive = summaryFilterKey === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSummaryFilterKey(isActive ? null : key)}
                    title={isActive ? "필터 해제" : `${key} 학생만 보기`}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 12px",
                      background: isActive ? "var(--admin-accent)" : "var(--admin-panel-light, #f5f9f3)",
                      border: `1px solid ${isActive ? "var(--admin-accent-strong)" : "var(--admin-stroke)"}`,
                      borderRadius: 6,
                      fontSize: 13,
                      fontFamily: "inherit",
                      cursor: "pointer",
                      transition: "background 0.15s, border-color 0.15s",
                      textAlign: "left",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = "var(--admin-accent-soft)";
                        e.currentTarget.style.borderColor = "var(--admin-accent)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = "var(--admin-panel-light, #f5f9f3)";
                        e.currentTarget.style.borderColor = "var(--admin-stroke)";
                      }
                    }}
                  >
                    <span style={{ color: isActive ? "#ffffff" : "var(--admin-ink)" }}>{key}</span>
                    <strong style={{ color: isActive ? "#ffffff" : "var(--admin-accent-strong)" }}>{count}명</strong>
                  </button>
                );
              })}
            </div>
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

      {/* 학생 삭제 확인 모달 */}
      {deleteTarget ? (
        <div className="admin-modal-overlay" onClick={closeDeleteModal}>
          <div className="admin-modal admin-modal-wide" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ color: "#c0392b" }}>학생 삭제</h2>
            <p style={{ fontSize: 13, color: "var(--admin-muted)", margin: "0 0 14px" }}>
              <strong style={{ color: "var(--admin-ink)" }}>{deleteTarget.name}</strong> ({deleteTarget.email}) 학생을 삭제합니다.
              백업 ZIP 이 즉시 다운로드되며, 30일 후 영구 삭제됩니다.
              영구 삭제 전까지 휴지통에서 복원할 수 있습니다.
            </p>
            <div className="admin-modal-field">
              <label>학생 이름 입력 (실수 방지)</label>
              <input
                value={deleteForm.nameConfirmation}
                onChange={(e) => setDeleteForm((p) => ({ ...p, nameConfirmation: e.target.value }))}
                placeholder={deleteTarget.name}
              />
            </div>
            <div className="admin-modal-field">
              <label>삭제 사유 (4자 이상, 감사 로그에 박제)</label>
              <textarea
                value={deleteForm.reason}
                onChange={(e) => setDeleteForm((p) => ({ ...p, reason: e.target.value }))}
                placeholder="예: 테스트 계정 정리 / 본인 탈퇴 요청 / 약관 위반"
                rows={3}
              />
            </div>
            <div className="admin-modal-field">
              <label className="admin-checkbox-label" style={{ fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={deleteForm.immediate}
                  onChange={(e) => setDeleteForm((p) => ({ ...p, immediate: e.target.checked }))}
                />
                <span style={{ color: "#c0392b", fontWeight: 700 }}>
                  30일 유예 없이 즉시 영구 삭제 (개인정보 즉시 파기 요청 등)
                </span>
              </label>
            </div>
            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-detail-btn danger"
                onClick={submitDelete}
                disabled={deleteSubmitting}
              >
                {deleteSubmitting ? "처리 중..." : (deleteForm.immediate ? "즉시 영구 삭제 + 백업 다운" : "삭제 + 백업 다운")}
              </button>
              <button
                type="button"
                className="admin-detail-btn secondary"
                onClick={closeDeleteModal}
                disabled={deleteSubmitting}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* 휴지통 모달 */}
      {showTrashModal ? (
        <div className="admin-modal-overlay" onClick={() => setShowTrashModal(false)}>
          <div className="admin-modal admin-modal-xl" onClick={(e) => e.stopPropagation()}>
            <h2>휴지통 — soft deleted 학생</h2>
            <p style={{ fontSize: 13, color: "var(--admin-muted)", margin: "0 0 14px" }}>
              30일 후 자동으로 영구 삭제됩니다. 그 전에 복원하면 다시 활성 상태가 됩니다.
            </p>
            {trashLoading ? (
              <p>불러오는 중...</p>
            ) : trash.length === 0 ? (
              <p style={{ color: "var(--admin-muted)", padding: "20px 0" }}>휴지통이 비어 있습니다.</p>
            ) : (
              <table className="admin-detail-table" style={{ width: "100%" }}>
                <thead>
                  <tr>
                    <th>이메일</th>
                    <th>이름</th>
                    <th>삭제 사유</th>
                    <th>삭제일</th>
                    <th>잔여(일)</th>
                    <th>조치</th>
                  </tr>
                </thead>
                <tbody>
                  {trash.map((t) => (
                    <tr key={t.userId}>
                      <td style={{ fontSize: 12 }}>{t.email}</td>
                      <td>{t.name || "-"}</td>
                      <td style={{ fontSize: 12, color: "var(--admin-muted)" }}>{t.reason || "-"}</td>
                      <td style={{ fontSize: 12 }}>{t.deletedAt ? t.deletedAt.slice(0, 16).replace("T", " ") : "-"}</td>
                      <td style={{ textAlign: "center" }}>
                        <strong style={{ color: t.daysLeftUntilHardDelete <= 3 ? "#c0392b" : "var(--admin-accent-strong)" }}>
                          {t.daysLeftUntilHardDelete}일
                        </strong>
                      </td>
                      <td>
                        <button
                          className="admin-detail-btn secondary xs"
                          onClick={() => restoreStudent(t.userId)}
                        >
                          복원
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-detail-btn secondary"
                onClick={() => setShowTrashModal(false)}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminLayout>
  );
}

export default AdminStudentsPage;
