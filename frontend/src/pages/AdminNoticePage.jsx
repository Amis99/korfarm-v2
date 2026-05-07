import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { apiGet, apiPost, apiPatch, apiDelete } from "../utils/api";
import "../styles/admin-notice.css";

const CATEGORIES = [
  { id: "general", label: "일반" },
  { id: "event", label: "이벤트" },
  { id: "maintenance", label: "점검" },
  { id: "billing", label: "결제" },
];

function emptyDraft() {
  return {
    id: null,
    scope: "GLOBAL",
    orgId: "",
    title: "",
    body: "",
    category: "general",
    pinned: false,
    startsAt: "",
    endsAt: "",
  };
}

function fmtDate(s) {
  if (!s) return "—";
  try {
    const d = new Date(s);
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
  } catch {
    return s;
  }
}

function AdminNoticePage() {
  const { user } = useAuth();
  const isHq = user?.roles?.includes("HQ_ADMIN");
  const [notices, setNotices] = useState([]);
  const [scopeFilter, setScopeFilter] = useState("all");
  const [editing, setEditing] = useState(null);  // draft object or null
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiGet("/v1/admin/notices");
      const arr = Array.isArray(data) ? data : (data?.items || []);
      setNotices(arr);
    } catch (e) {
      console.error("notice load failed", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    if (isHq) {
      apiGet("/v1/admin/orgs")
        .then((d) => {
          const arr = Array.isArray(d) ? d : (d?.items || []);
          setOrgs(arr);
        })
        .catch(() => {});
    }
  }, [isHq]);

  const filtered = notices.filter((n) => {
    if (scopeFilter === "all") return true;
    return n.scope === scopeFilter;
  });

  function startNew() {
    const draft = emptyDraft();
    if (!isHq) draft.scope = "ORG";
    setEditing(draft);
  }

  function startEdit(n) {
    setEditing({
      id: n.id,
      scope: n.scope,
      orgId: n.orgId || n.org_id || "",
      title: n.title || "",
      body: n.body || "",
      category: n.category || "general",
      pinned: !!n.pinned,
      startsAt: n.startsAt || n.starts_at || "",
      endsAt: n.endsAt || n.ends_at || "",
    });
  }

  async function saveDraft() {
    if (!editing) return;
    if (!editing.title.trim() || !editing.body.trim()) {
      alert("제목과 내용을 입력해 주세요.");
      return;
    }
    const payload = {
      scope: editing.scope,
      orgId: editing.scope === "ORG" ? editing.orgId || null : null,
      title: editing.title.trim(),
      body: editing.body.trim(),
      category: editing.category,
      pinned: editing.pinned,
      startsAt: editing.startsAt || null,
      endsAt: editing.endsAt || null,
    };
    try {
      if (editing.id) {
        await apiPatch(`/v1/admin/notices/${editing.id}`, payload);
      } else {
        await apiPost("/v1/admin/notices", payload);
      }
      setEditing(null);
      load();
    } catch (e) {
      console.error("notice save failed", e);
      alert("저장 실패: " + (e.message || ""));
    }
  }

  async function removeNotice(id) {
    if (!window.confirm("이 공지를 삭제하시겠습니까?")) return;
    try {
      await apiDelete(`/v1/admin/notices/${id}`);
      load();
    } catch (e) {
      console.error("delete failed", e);
      alert("삭제 실패");
    }
  }

  return (
    <div className="admin-notice-page">
      <h1>📢 공지 관리</h1>
      <p className="sub">
        본사 관리자(HQ): 전체 회원 대상 공지 작성 가능. 기관 관리자(ORG): 본인 기관 학생 대상.
      </p>

      <div className="notice-toolbar">
        <button className="new-btn" onClick={startNew}>+ 새 공지 작성</button>
        <div className="scope-filter">
          {[
            { id: "all", label: "전체" },
            { id: "GLOBAL", label: "전체 공지" },
            { id: "ORG", label: "기관 공지" },
          ].map((f) => (
            <button
              key={f.id}
              className={scopeFilter === f.id ? "active" : ""}
              onClick={() => setScopeFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
        {loading && <span style={{ color: "#9A8F82", fontSize: 12 }}>불러오는 중…</span>}
      </div>

      <div className="notice-table">
        <div className="notice-row head">
          <div>범위</div>
          <div>제목</div>
          <div>카테고리</div>
          <div>기간</div>
          <div style={{ textAlign: "right" }}>작업</div>
        </div>
        {filtered.length === 0 ? (
          <div className="empty-state">
            아직 등록된 공지가 없어요.<br />
            "+ 새 공지 작성" 버튼으로 시작해 주세요.
          </div>
        ) : (
          filtered.map((n) => (
            <div key={n.id} className="notice-row">
              <div>
                <span className={`scope-badge ${n.scope === "GLOBAL" ? "global" : "org"}`}>
                  {n.scope === "GLOBAL" ? "전체" : "기관"}
                </span>
              </div>
              <div>
                {n.pinned && <span className="pin-tag">📌 고정</span>}
                <span className="title" onClick={() => startEdit(n)}>{n.title}</span>
              </div>
              <div>{CATEGORIES.find((c) => c.id === n.category)?.label || n.category}</div>
              <div style={{ fontSize: 11.5, color: "#6B6359" }}>
                {fmtDate(n.startsAt || n.starts_at)} ~ {fmtDate(n.endsAt || n.ends_at)}
              </div>
              <div className="actions">
                <button onClick={() => startEdit(n)}>수정</button>
                <button className="danger" onClick={() => removeNotice(n.id)}>삭제</button>
              </div>
            </div>
          ))
        )}
      </div>

      {editing && (
        <div className="notice-modal-overlay" onClick={() => setEditing(null)}>
          <div className="notice-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editing.id ? "공지 수정" : "새 공지 작성"}</h2>

            <div className="row">
              {isHq && (
                <div>
                  <label>범위</label>
                  <select
                    value={editing.scope}
                    onChange={(e) => setEditing({ ...editing, scope: e.target.value })}
                  >
                    <option value="GLOBAL">전체 회원 (GLOBAL)</option>
                    <option value="ORG">특정 기관 (ORG)</option>
                  </select>
                </div>
              )}
              {editing.scope === "ORG" && isHq && (
                <div>
                  <label>기관 선택</label>
                  <select
                    value={editing.orgId}
                    onChange={(e) => setEditing({ ...editing, orgId: e.target.value })}
                  >
                    <option value="">— 기관 선택 —</option>
                    {orgs.map((o) => (
                      <option key={o.id} value={o.id}>{o.name || o.id}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label>카테고리</label>
                <select
                  value={editing.category}
                  onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <label>제목</label>
            <input
              type="text"
              value={editing.title}
              onChange={(e) => setEditing({ ...editing, title: e.target.value })}
              placeholder="공지 제목 (최대 255자)"
              maxLength={255}
            />

            <label>내용</label>
            <textarea
              value={editing.body}
              onChange={(e) => setEditing({ ...editing, body: e.target.value })}
              placeholder="공지 내용을 입력해 주세요. 줄바꿈은 그대로 표시됩니다."
            />

            <div className="row">
              <div>
                <label>시작 시각 (선택)</label>
                <input
                  type="datetime-local"
                  value={editing.startsAt ? editing.startsAt.slice(0, 16) : ""}
                  onChange={(e) => setEditing({ ...editing, startsAt: e.target.value })}
                />
              </div>
              <div>
                <label>종료 시각 (선택)</label>
                <input
                  type="datetime-local"
                  value={editing.endsAt ? editing.endsAt.slice(0, 16) : ""}
                  onChange={(e) => setEditing({ ...editing, endsAt: e.target.value })}
                />
              </div>
            </div>

            <div className="checkbox-row">
              <input
                id="pinned"
                type="checkbox"
                checked={editing.pinned}
                onChange={(e) => setEditing({ ...editing, pinned: e.target.checked })}
              />
              <label htmlFor="pinned">상단에 고정</label>
            </div>

            <div className="actions">
              <button className="cancel-btn" onClick={() => setEditing(null)}>취소</button>
              <button className="save-btn" onClick={saveDraft}>{editing.id ? "수정 저장" : "작성"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminNoticePage;
