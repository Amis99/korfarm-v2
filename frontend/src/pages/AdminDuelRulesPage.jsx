import { useEffect, useState } from "react";
import { apiGet, apiPut } from "../utils/adminApi";
import AdminLayout from "../components/AdminLayout";
import JsonVisualEditor from "../components/learning-db/JsonVisualEditor";
import "../styles/admin-detail.css";
import "../styles/learning-db.css";

/**
 * 대결 — AI·룰 설정 페이지.
 * DB(duel_settings.id="default")에 저장되어 즉시 적용.
 * JsonVisualEditor 로 모든 키/값을 자유롭게 편집.
 */
function AdminDuelRulesPage({ wrap = true }) {
  const [data, setData] = useState(null);
  const [meta, setMeta] = useState({ savedAt: null, updatedBy: null });
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const reload = () => {
    setLoading(true);
    setError("");
    apiGet("/v1/admin/duel/rules")
      .then((res) => {
        if (!res || typeof res !== "object") {
          setError("응답 형식 오류");
          return;
        }
        // _savedAt / _updatedBy 분리
        const { _savedAt, _updatedBy, ...rest } = res;
        setData(rest);
        setMeta({ savedAt: _savedAt, updatedBy: _updatedBy });
        setDirty(false);
      })
      .catch((e) => setError("불러오기 실패: " + e.message))
      .finally(() => setLoading(false));
  };
  useEffect(reload, []);

  const handleChange = (next) => {
    setData(next);
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      await apiPut("/v1/admin/duel/rules", data);
      setToast("저장되었습니다.");
      setTimeout(() => setToast(""), 2000);
      reload();
    } catch (e) {
      setError("저장 실패: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefault = async () => {
    if (!window.confirm("기본값으로 되돌리시겠어요? (DB 저장 행은 그대로 두고 화면만 초기화 후, 저장하면 기본값으로 덮어씁니다)")) return;
    reload();
  };

  const content = (
    <>
      <div className="admin-detail-header">
        {wrap && <h1>AI·룰</h1>}
        <div className="admin-detail-actions" style={{ display: "flex", gap: 8 }}>
          {meta.savedAt ? (
            <span className="ldb-pill" title={"저장자: " + (meta.updatedBy || "-")}>
              마지막 저장 {String(meta.savedAt).substring(0, 19)}
            </span>
          ) : (
            <span className="ldb-pill" style={{ background: "#fff3cd", color: "#856404" }}>
              아직 저장된 적 없음 — 기본값 표시 중
            </span>
          )}
          {dirty && (
            <span className="ldb-pill" style={{ background: "#fff3cd", color: "#856404" }}>변경됨</span>
          )}
          <button
            type="button"
            className="admin-detail-btn"
            disabled={saving || !dirty}
            onClick={handleSave}
          >
            {saving ? "저장 중…" : "저장"}
          </button>
          <button
            type="button"
            className="admin-detail-btn secondary"
            onClick={handleResetDefault}
          >
            화면 초기화
          </button>
        </div>
      </div>

      {loading && <p className="admin-detail-note">불러오는 중…</p>}
      {error && <p className="admin-detail-note error">{error}</p>}
      {toast && (
        <p className="admin-detail-note" style={{ background: "#d4edda", color: "#155724", padding: 8, borderRadius: 4 }}>
          {toast}
        </p>
      )}

      {data && (
        <div className="admin-detail-card" style={{ padding: 16 }}>
          <p style={{ fontSize: 13, color: "#444", marginBottom: 12, lineHeight: 1.7 }}>
            대결 모드의 규칙·AI 플레이어·큐·보상 설정을 한 곳에서 편집하는 화면입니다.<br />
            네 가지 영역(<strong>매치 규칙 / AI 플레이어 / 큐 매칭 / 보상</strong>)으로 나뉘며,
            각 항목 옆 화살표를 눌러 펼치면 세부 값을 바꿀 수 있어요.<br />
            <span style={{ color: "#856404" }}>
              ※ 현재는 본 화면이 <strong>설정값 보관·기록용</strong> 입니다. 실제 매치 동작에 자동 반영되는
              연결은 단계적으로 추가될 예정이에요.
            </span>
          </p>
          <JsonVisualEditor
            data={data}
            onChange={handleChange}
            title=""
            actions={null}
          />
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

export default AdminDuelRulesPage;
