import { useEffect, useState } from "react";
import { apiGet, apiPost, apiPut, apiDelete } from "../utils/adminApi";
import AdminDuelQuestionsPage from "./AdminDuelQuestionsPage";
import "../styles/admin-detail.css";
import "../styles/learning-db.css";

/**
 * 테마 대결 관리.
 *
 * 구조: 기관 dropdown(공유) + 두 sub-tab
 *  1) 서브 서버 관리 — 기관 안의 서브 서버(A1~A10) CRUD + 시한 + 마감
 *  2) 문제 풀 — 선택된 서브 서버의 문제 list/추가/수정 (AdminDuelQuestionsPage 재사용)
 *
 * HQ_ADMIN: 모든 제휴기관, ORG_ADMIN: 본인 관리 기관만
 */
function AdminThemeDuelPage() {
  const [orgs, setOrgs] = useState([]);
  const [orgId, setOrgId] = useState("");
  const [sub, setSub] = useState("servers"); // "servers" | "questions"

  useEffect(() => {
    apiGet("/v1/admin/duel/theme-orgs")
      .then((list) => {
        const arr = Array.isArray(list) ? list : [];
        setOrgs(arr);
        if (arr.length > 0 && !orgId) setOrgId(arr[0].orgId);
      })
      .catch(() => setOrgs([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const orgName = orgs.find(o => o.orgId === orgId)?.orgName || "-";

  return (
    <div>
      {/* 기관 선택 (공유) */}
      <div className="admin-detail-toolbar" style={{ alignItems: "center", gap: 12, marginBottom: 8 }}>
        <label style={{ fontSize: 13, fontWeight: 600 }}>기관</label>
        <select value={orgId} onChange={(e) => setOrgId(e.target.value)} style={{ padding: "6px 10px", fontSize: 13, minWidth: 240 }}>
          {orgs.length === 0 && <option value="">(관리 가능한 기관 없음)</option>}
          {orgs.map((o) => (
            <option key={o.orgId} value={o.orgId}>{o.orgName}</option>
          ))}
        </select>
        <span className="ldb-pill" style={{ marginLeft: "auto" }}>총 {orgs.length}개 기관</span>
      </div>

      {/* sub-tab */}
      <div className="admin-tabs" style={{ background: "#f5f5f5", padding: "4px 8px", marginBottom: 8 }}>
        <button type="button" className={`admin-tab ${sub === "servers" ? "active" : ""}`} onClick={() => setSub("servers")}>
          <span className="material-symbols-outlined" style={{ fontSize: 14, marginRight: 4 }}>dns</span>
          서브 서버 관리
        </button>
        <button type="button" className={`admin-tab ${sub === "questions" ? "active" : ""}`} onClick={() => setSub("questions")}>
          <span className="material-symbols-outlined" style={{ fontSize: 14, marginRight: 4 }}>quiz</span>
          문제 풀
        </button>
      </div>

      {!orgId && <p className="admin-detail-note">먼저 관리할 기관을 선택하세요.</p>}
      {orgId && sub === "servers" && <SubServerManager orgId={orgId} orgName={orgName} />}
      {orgId && sub === "questions" && <SubServerQuestionPool orgId={orgId} orgName={orgName} />}
    </div>
  );
}

// ───────────────────────── 서브 서버 관리 ─────────────────────────

function SubServerManager({ orgId, orgName }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const reload = () => {
    setLoading(true);
    apiGet(`/v1/admin/duel/theme-sub-servers?orgId=${encodeURIComponent(orgId)}`)
      .then((data) => setList(Array.isArray(data) ? data : []))
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  };
  useEffect(reload, [orgId]);

  const handleClose = async (id) => {
    if (!window.confirm("이 서브 서버를 마감(비활성) 할까요? 학생이 더 이상 입장할 수 없습니다 (통계는 보존).")) return;
    try {
      await apiDelete(`/v1/admin/duel/theme-sub-servers/${id}`);
      reload();
    } catch (e) {
      alert("마감 실패: " + e.message);
    }
  };

  const activeCount = list.filter(s => s.status === "active").length;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 12, gap: 8 }}>
        <h3 style={{ margin: 0 }}>{orgName} — 서브 서버 ({activeCount} / 10)</h3>
        <button type="button" className="admin-detail-btn" style={{ marginLeft: "auto" }}
          disabled={activeCount >= 10}
          onClick={() => { setEditing(null); setShowForm(true); }}>
          + 새 서브 서버
        </button>
      </div>

      {loading && <p className="admin-detail-note">불러오는 중…</p>}
      {!loading && list.length === 0 && (
        <div className="admin-detail-card" style={{ padding: 24, textAlign: "center", color: "#888" }}>
          <p>이 기관의 서브 서버가 없습니다.</p>
          <p style={{ fontSize: 12 }}>[+ 새 서브 서버] 로 첫 서버를 만들어 보세요.</p>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 12 }}>
        {list.map((s) => (
          <div key={s.id} className="admin-detail-card" style={{ padding: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <strong style={{ fontSize: 15 }}>{s.subName}</strong>
              <span className="status-pill" data-status={
                s.status === "active" ? "active" : s.status === "expired" ? "inactive" : "pending"
              }>
                {s.status === "active" ? "운영 중" : s.status === "expired" ? "기한 종료" : "마감됨"}
              </span>
            </div>
            <div style={{ fontSize: 11, color: "#888", marginBottom: 10 }}>
              {s.expireAt ? `기한: ${String(s.expireAt).substring(0, 16).replace("T", " ")}` : "기한 없음"}<br />
              <span style={{ fontFamily: "monospace", fontSize: 10 }}>{s.id}</span>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button type="button" className="admin-detail-btn sm"
                onClick={() => { setEditing(s); setShowForm(true); }}>수정</button>
              {s.status === "active" && (
                <button type="button" className="admin-detail-btn secondary sm"
                  onClick={() => handleClose(s.id)}>마감</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <SubServerForm
          orgId={orgId}
          editing={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onDone={() => { setShowForm(false); setEditing(null); reload(); }}
        />
      )}
    </div>
  );
}

function SubServerForm({ orgId, editing, onClose, onDone }) {
  const isEdit = !!editing;
  const [subName, setSubName] = useState(editing?.subName || "");
  const [expireAt, setExpireAt] = useState(
    editing?.expireAt ? String(editing.expireAt).substring(0, 16) : ""
  );
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  const submit = async () => {
    setErr("");
    if (!subName.trim()) { setErr("서브 서버 이름을 입력하세요"); return; }
    setSubmitting(true);
    try {
      if (isEdit) {
        await apiPut(`/v1/admin/duel/theme-sub-servers/${editing.id}`, {
          subName: subName.trim(),
          expireAt: expireAt || null,
          clearExpireAt: !expireAt,
        });
      } else {
        await apiPost("/v1/admin/duel/theme-sub-servers", {
          orgId,
          subName: subName.trim(),
          expireAt: expireAt || null,
        });
      }
      onDone();
    } catch (e) {
      setErr((isEdit ? "수정" : "생성") + " 실패: " + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <h2>{isEdit ? "서브 서버 수정" : "새 서브 서버"}</h2>
        {err && <p className="admin-detail-note error">{err}</p>}
        <div className="admin-modal-field">
          <label>서버 이름</label>
          <input value={subName} onChange={(e) => setSubName(e.target.value)} placeholder="예: A1 어휘 챌린지" />
        </div>
        <div className="admin-modal-field">
          <label>운영 시한 (비우면 무기한)</label>
          <input type="datetime-local" value={expireAt} onChange={(e) => setExpireAt(e.target.value)} />
          <p style={{ fontSize: 11, color: "#888", marginTop: 4 }}>
            시한이 지나면 학생이 더 이상 입장할 수 없습니다 (통계는 보존).
          </p>
        </div>
        <div className="admin-modal-actions">
          <button type="button" className="admin-detail-btn" disabled={submitting} onClick={submit}>
            {submitting ? "저장 중…" : (isEdit ? "수정" : "생성")}
          </button>
          <button type="button" className="admin-detail-btn secondary" onClick={onClose}>취소</button>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────── 서브 서버별 문제 풀 ─────────────────────────

function SubServerQuestionPool({ orgId, orgName }) {
  const [servers, setServers] = useState([]);
  const [serverId, setServerId] = useState("");

  useEffect(() => {
    apiGet(`/v1/admin/duel/theme-sub-servers?orgId=${encodeURIComponent(orgId)}`)
      .then((data) => {
        const arr = Array.isArray(data) ? data : [];
        setServers(arr);
        if (arr.length > 0) {
          const first = arr.find(s => s.status === "active") || arr[0];
          setServerId(first.id);
        } else {
          setServerId("");
        }
      })
      .catch(() => setServers([]));
  }, [orgId]);

  if (servers.length === 0) {
    return (
      <div className="admin-detail-card" style={{ padding: 24, textAlign: "center", color: "#888" }}>
        <p>{orgName} 기관에 등록된 서브 서버가 없습니다.</p>
        <p style={{ fontSize: 12 }}>[서브 서버 관리] 탭에서 먼저 서브 서버를 만들어 주세요.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="admin-detail-toolbar" style={{ alignItems: "center", gap: 12, marginBottom: 8 }}>
        <label style={{ fontSize: 13, fontWeight: 600 }}>서브 서버</label>
        <select value={serverId} onChange={(e) => setServerId(e.target.value)} style={{ padding: "6px 10px", fontSize: 13, minWidth: 240 }}>
          {servers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.subName} {s.status !== "active" ? `(${s.status === "expired" ? "기한 종료" : "마감"})` : ""}
            </option>
          ))}
        </select>
      </div>
      {serverId && <AdminDuelQuestionsPage wrap={false} themeOnly={true} fixedServerId={serverId} />}
    </div>
  );
}

export default AdminThemeDuelPage;
